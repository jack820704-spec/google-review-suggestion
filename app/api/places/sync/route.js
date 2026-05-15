// /api/places/sync — cron-triggered Google Places auto sync
// Schedule: every 6 hours (see vercel.json crons)
// Auth: Authorization: Bearer ${CRON_SECRET}
// Flow per Growth/Pro user with a place_id:
//   1. GET place details (incl. up to 5 reviews) via Places API New
//   2. For each review: skip if google_review_id already exists
//   3. New review → generate 3 AI reply suggestions via OpenAI
//   4. Insert review row + reply_suggestions row
//   5. Send notify email via Resend (respects email_notifications + frequency)

import OpenAI from "openai";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase-server";

const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";
const LANG_MAP = { en: "English", zh: "Traditional Chinese", vi: "Vietnamese", fr: "French", es: "Spanish", ja: "Japanese" };

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function log(...args) {
  console.log("[places/sync]", ...args);
}

function googleRatingToStars(g) {
  // Places API v1 returns rating as a number 1–5 OR a string enum like "FIVE", "FOUR" depending on field.
  // The review-level rating is numeric 1-5 — but defensive parse anyway.
  if (typeof g === "number") return Math.max(1, Math.min(5, Math.round(g)));
  if (typeof g === "string") {
    const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    if (map[g]) return map[g];
    const n = parseInt(g, 10);
    if (!isNaN(n)) return Math.max(1, Math.min(5, n));
  }
  return 3;
}

function sentimentFromStars(stars) {
  if (stars >= 4) return "positive";
  if (stars <= 2) return "negative";
  return "neutral";
}

async function fetchPlaceDetails(placeId, apiKey) {
  const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Places details ${res.status}`);
  }
  return data;
}

async function generateReplies({ openai, restaurantCtx, content }) {
  const systemPrompt = `You are the owner of ${restaurantCtx}.
Write a reply as if you personally read this review tonight after closing.
Sound genuine, warm, and specific to what the reviewer mentioned.
Never use corporate PR language. Use first person naturally.
For positive reviews: thank them genuinely and reference a specific detail they mentioned.
For negative reviews: apologize sincerely without excuses, acknowledge the specific issue, promise improvement, invite direct contact.
Keep each reply to 60-100 words.
Write in ${LANG_MAP.en}.`;

  const STYLES = {
    warm: "Write in a Warm & Personal style — like the owner personally read this tonight. Casual, genuine, specific to their experience.",
    professional: "Write in a Professional & Gracious style — polished, elegant, refined brand voice.",
    brief: "Write in a Brief & Direct style — 2-3 short sentences only. Punchy and impactful.",
  };

  const [warm, professional, brief] = await Promise.all(
    Object.values(STYLES).map((styleInstruction) =>
      openai.chat.completions
        .create({
          model: "gpt-4o-mini",
          max_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Review: "${content}"\n\n${styleInstruction}` },
          ],
        })
        .then((r) => r.choices[0].message.content.trim())
    )
  );

  return { warm, professional, brief };
}

export async function POST(req) {
  return runSync(req);
}

// Allow GET as well so Vercel Cron (which uses GET) can trigger it.
export async function GET(req) {
  return runSync(req);
}

async function runSync(req) {
  // ── Auth ────────────────────────────────────────────────
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (token !== cronSecret) return unauthorized();

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placesKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

  const supa = createServiceClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Fetch eligible users ────────────────────────────────
  const { data: profiles, error: profilesErr } = await supa
    .from("profiles")
    .select("id, email, plan, restaurant_name, restaurant_type, city, country, place_id, email_notifications, notification_frequency, crisis_alerts")
    .in("plan", ["growth", "pro"])
    .not("place_id", "is", null);

  if (profilesErr) {
    log("profiles fetch failed:", profilesErr);
    return Response.json({ error: profilesErr.message }, { status: 500 });
  }

  log(`processing ${profiles?.length || 0} users`);

  const summary = { users: profiles?.length || 0, new_reviews: 0, emails_sent: 0, errors: [] };

  for (const profile of profiles || []) {
    try {
      const details = await fetchPlaceDetails(profile.place_id, placesKey);
      const reviews = details.reviews || [];
      log(`user ${profile.id} (${profile.place_id}): ${reviews.length} reviews fetched`);

      // Refresh cached rating/count
      if (typeof details.rating === "number" || typeof details.userRatingCount === "number") {
        await supa
          .from("profiles")
          .update({
            place_rating: typeof details.rating === "number" ? details.rating : null,
            place_user_rating_count: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
          })
          .eq("id", profile.id);
      }

      const restaurantCtx = `${profile.restaurant_name || "our restaurant"}, a ${profile.restaurant_type || "restaurant"} in ${profile.city || "our city"}, ${profile.country || ""}`;

      for (const review of reviews) {
        const googleReviewId = review.name; // e.g. "places/<placeId>/reviews/<reviewId>" — globally unique
        if (!googleReviewId) continue;

        // Dedup
        const { data: existing } = await supa
          .from("reviews")
          .select("id")
          .eq("google_review_id", googleReviewId)
          .maybeSingle();

        if (existing) continue;

        const stars = googleRatingToStars(review.rating);
        const content =
          review.text?.text ||
          review.originalText?.text ||
          "";
        if (!content.trim()) continue;

        const reviewerName = review.authorAttribution?.displayName || "Anonymous";
        const reviewDate = review.publishTime || new Date().toISOString();

        // Generate AI replies
        let replies = null;
        try {
          replies = await generateReplies({ openai, restaurantCtx, content });
        } catch (genErr) {
          log("generateReplies failed:", genErr.message);
        }

        const sentiment = sentimentFromStars(stars);
        const isCrisis = stars <= 2;

        // Insert review
        const { data: insertedReview, error: insertErr } = await supa
          .from("reviews")
          .insert({
            user_id: profile.id,
            reviewer_name: reviewerName,
            stars,
            content,
            source: "google",
            sentiment,
            is_crisis: isCrisis,
            replied: false,
            google_review_id: googleReviewId,
            review_date: reviewDate,
          })
          .select()
          .single();

        if (insertErr) {
          // Race condition or unique violation — skip silently
          if (insertErr.code === "23505") continue;
          log("insert review failed:", insertErr.message);
          summary.errors.push({ user: profile.id, error: insertErr.message });
          continue;
        }

        summary.new_reviews++;

        // Store reply suggestions
        if (replies) {
          await supa.from("reply_suggestions").insert({
            review_id: insertedReview.id,
            user_id: profile.id,
            replies,
            lang: "en",
          });
        }

        // Notify email — skip if user opted out, or non-immediate frequency, or no email
        const wantsImmediate = profile.email_notifications && profile.notification_frequency === "immediately";
        const crisisOverride = isCrisis && profile.crisis_alerts;
        if (profile.email && (wantsImmediate || crisisOverride) && replies) {
          try {
            const { error: emailErr } = await resend.emails.send({
              from: "Revuly <notifications@revuly.dev>",
              to: profile.email,
              subject: isCrisis
                ? `🚨 Crisis Alert — New ${stars}★ review at ${profile.restaurant_name || "your restaurant"}`
                : `⭐ New ${stars}★ review at ${profile.restaurant_name || "your restaurant"}`,
              html: buildEmailHtml({
                restaurantName: profile.restaurant_name || "your restaurant",
                review: { reviewer_name: reviewerName, stars, content, review_date: reviewDate },
                replies,
                isCrisis,
              }),
            });
            if (emailErr) {
              log("resend error:", emailErr);
            } else {
              summary.emails_sent++;
            }
          } catch (mailErr) {
            log("email send threw:", mailErr.message);
          }
        }
      }
    } catch (userErr) {
      log("user processing failed:", profile.id, userErr.message);
      summary.errors.push({ user: profile.id, error: userErr.message });
    }
  }

  log("done:", summary);
  return Response.json({ ok: true, ...summary });
}

function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function buildEmailHtml({ restaurantName, review, replies, isCrisis }) {
  const styleNames = { warm: "Warm & Personal", professional: "Professional & Gracious", brief: "Brief & Direct" };
  const repliesHtml = Object.entries(replies || {})
    .map(
      ([style, text]) => `
      <div style="margin-bottom:20px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;margin-bottom:10px">${styleNames[style] || style}</div>
        <div style="font-size:14px;line-height:1.7;color:#a09888">${text}</div>
      </div>`
    )
    .join("");

  const crisisBanner = isCrisis
    ? `<div style="background:#7f1d1d;border-radius:8px;padding:14px 20px;margin-bottom:24px"><div style="font-weight:700;font-size:15px;color:#fca5a5">🚨 Crisis Alert</div><div style="font-size:13px;color:#fca5a5;opacity:.8;margin-top:4px">A low-rating review just landed. Immediate attention recommended.</div></div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8a6e2f,#c9a84c);border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
      <span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">Revuly</span>
    </div>
    ${crisisBanner}
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#f0ede6;margin:0 0 6px">${isCrisis ? "🚨" : "⭐"} New Google Review — ${restaurantName}</h1>
    <p style="font-size:13px;color:#5a5550;margin:0 0 28px">Synced automatically from Google Places · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
    <div style="background:#1c1c22;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:28px">
      <div style="font-size:14px;font-weight:700;color:#f0ede6;margin-bottom:4px">${review.reviewer_name}</div>
      <div style="font-size:13px;color:#c9a84c;margin-bottom:12px">${starsHtml(review.stars)}</div>
      <div style="padding:14px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(201,168,76,0.4);border-radius:0 6px 6px 0">
        <p style="font-size:14px;line-height:1.75;color:#a09888;margin:0;font-style:italic">"${review.content}"</p>
      </div>
    </div>
    <div style="margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a5550;margin-bottom:16px">💬 AI Suggested Replies</div>
      ${repliesHtml}
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">View in Dashboard →</a>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center">
      <p style="font-size:12px;color:#5a5550;margin:0">Revuly · AI-Powered Reputation Management · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#5a5550;text-decoration:none">Manage notifications</a></p>
    </div>
  </div>
</body></html>`;
}
