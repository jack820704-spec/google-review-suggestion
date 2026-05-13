import { createServiceClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import crypto from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INBOUND_DOMAIN = process.env.NEXT_PUBLIC_INBOUND_EMAIL_DOMAIN || "reviews.revuly.dev";

function extractUserId(toAddresses) {
  const domainEscaped = INBOUND_DOMAIN.replace(/\./g, "\\.");
  const re = new RegExp(`user-([0-9a-f-]{36})@${domainEscaped}`, "i");
  for (const addr of toAddresses) {
    const match = String(addr).match(re);
    if (match) return match[1];
  }
  return null;
}

// Verify Resend (Svix-format) webhook signature
function verifySignature(req, rawBody) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if not configured

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedPayload).digest("base64");

  return svixSignature.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

async function fetchFullEmail(emailId) {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function parseReviewFromEmail(subject, text, html) {
  const body = text || (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Extract Google Business review data from this forwarded email. Return JSON ONLY:
{
  "reviewer_name": string (name of reviewer, "Anonymous" if unknown),
  "stars": integer 1-5 (star rating; 3 if unclear),
  "content": string (the actual review text, "" if none),
  "is_review_email": boolean (true ONLY if this is a Google Business review notification with a star rating)
}
Look for cues such as "New review", "left a review", a star rating, or sender noreply@google.com / business notifications.`,
      },
      { role: "user", content: `Subject: ${subject}\n\n${body.slice(0, 3000)}` },
    ],
  });
  try {
    return JSON.parse(r.choices[0].message.content);
  } catch {
    return { reviewer_name: "Anonymous", stars: 3, content: "", is_review_email: false };
  }
}

async function generateReplies(reviewContent, profile) {
  const ctx = `${profile.restaurant_name || "our restaurant"}, a ${profile.restaurant_type || "restaurant"} in ${profile.city || ""}${profile.country ? ", " + profile.country : ""}`;
  const system = `You are the owner of ${ctx}. Write a reply as if you personally read this review tonight after closing. Sound genuine and specific. 60-100 words.`;
  const styles = {
    warm: "Warm & Personal style — casual, genuine, like the owner speaking directly to the guest.",
    professional: "Professional & Gracious style — polished, elegant, refined.",
    brief: "Brief & Direct style — only 2-3 sentences.",
  };
  const entries = await Promise.all(
    Object.entries(styles).map(async ([key, styleNote]) => {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Review: "${reviewContent}"\n\n${styleNote}` },
        ],
      });
      return [key, r.choices[0].message.content.trim()];
    })
  );
  return Object.fromEntries(entries);
}

export async function POST(req) {
  try {
    const rawBody = await req.text();

    if (!verifySignature(req, rawBody)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Resend email.received webhook payload
    const meta = payload.data || payload;
    const toRaw = meta.to || [];
    const toArray = Array.isArray(toRaw) ? toRaw : [toRaw];

    const userId = extractUserId(toArray);
    if (!userId) return Response.json({ skipped: true, reason: "No user-id in recipient" });

    const db = createServiceClient();

    const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
    if (!profile) return Response.json({ error: "User not found" }, { status: 404 });

    // Resend's webhook only contains metadata, fetch the full email body
    const emailId = meta.email_id || meta.id;
    const full = emailId ? await fetchFullEmail(emailId) : null;

    const subject = full?.subject || meta.subject || "";
    const text = full?.text || meta.text || "";
    const html = full?.html || meta.html || "";

    const parsed = await parseReviewFromEmail(subject, text, html);

    if (!parsed.is_review_email) {
      return Response.json({ skipped: true, reason: "Not a review notification email" });
    }

    const stars = Math.min(5, Math.max(1, parseInt(parsed.stars) || 3));
    const sentiment = stars >= 4 ? "positive" : stars <= 2 ? "negative" : "neutral";

    const { data: review, error: reviewErr } = await db
      .from("reviews")
      .insert({
        user_id: userId,
        reviewer_name: parsed.reviewer_name || "Anonymous",
        stars,
        content: parsed.content || "",
        source: "google",
        sentiment,
        is_crisis: false,
        replied: false,
        review_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (reviewErr) return Response.json({ error: reviewErr.message }, { status: 500 });

    const replies = await generateReplies(review.content, profile);

    await db.from("reply_suggestions").insert({
      review_id: review.id,
      user_id: userId,
      replies,
    });

    // Crisis check: 3+ low-rating reviews in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("reviews")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .lte("stars", 2)
      .gte("review_date", since);
    const isCrisis = count >= 3;
    if (isCrisis) {
      await db.from("reviews").update({ is_crisis: true })
        .eq("user_id", userId).lte("stars", 2).gte("review_date", since);
    }

    // Notify the user
    if (profile.email_notifications !== false) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          restaurantName: profile.restaurant_name,
          review,
          replies,
          isCrisis,
        }),
      });
    }

    return Response.json({ success: true, reviewId: review.id });
  } catch (err) {
    console.error("Inbound email error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
