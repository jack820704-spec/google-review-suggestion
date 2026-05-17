// /api/places/sync — daily cron entrypoint with tiered logic per plan.
//
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Per-plan behavior:
//   Free Trial   — Skip entirely once place_first_sync_done = true.
//                  (Initial 5-review digest happens at /api/places/connect time.)
//   Starter      — If not first-synced yet, do the 5-review digest.
//                  Otherwise, process at most ONE new review per day (the most recent unseen).
//                  Single notify email per review.
//   Growth       — If not first-synced yet, do the 5-review digest.
//                  Otherwise, process ALL new reviews. Single notify email per review.
//                  Crisis alerts when stars <= 2.
//   Pro          — Everything Growth does, plus:
//                    * Scan for unanswered reviews older than 24h.
//                    * Send a reminder email (max once every 7 days per review).

import { createServiceClient } from "@/lib/supabase-server";
import {
  fetchPlaceDetails,
  fetchPlaceReviewsMultiSort,
  getOpenAI,
  getResend,
  ingestReview,
} from "@/lib/places-sync";
import { sendDigestEmail } from "@/app/api/email/digest/route";

const REMINDER_COOLDOWN_DAYS = 7;
const UNREPLIED_AGE_HOURS = 24;

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function log(...args) {
  console.log("[places/sync]", ...args);
}

export async function POST(req) { return runSync(req); }
export async function GET(req) { return runSync(req); }

async function runSync(req) {
  // ── Auth ──────────────────────────────────────────────
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (token !== cronSecret) return unauthorized();

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placesKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

  const supa = createServiceClient();
  const openai = getOpenAI();
  const resend = getResend();

  // ── Eligible users (any plan, has place_id) ──────────
  const { data: profiles, error: profilesErr } = await supa
    .from("profiles")
    .select(
      "id, email, plan, restaurant_name, restaurant_type, city, country, place_id, place_name, email_notifications, notification_frequency, crisis_alerts, place_first_sync_done"
    )
    .not("place_id", "is", null);

  if (profilesErr) {
    log("profiles fetch failed:", profilesErr);
    return Response.json({ error: profilesErr.message }, { status: 500 });
  }

  const summary = {
    users_seen: profiles?.length || 0,
    initial_digests: 0,
    new_reviews: 0,
    notify_emails: 0,
    reminder_emails: 0,
    skipped_free_trial: 0,
    errors: [],
  };

  for (const profile of profiles || []) {
    const plan = profile.plan || "free_trial";

    // ── Free Trial: only run if first sync hasn't happened yet ──
    if (plan === "free_trial" && profile.place_first_sync_done) {
      summary.skipped_free_trial++;
      continue;
    }

    try {
      // First sync pulls multi-sort (~15 reviews); ongoing cron uses the cheaper default fetch.
      log(`user=${profile.id} email=${profile.email} plan=${plan} → fetching place_id=${profile.place_id} (cached name: "${profile.place_name || "?"}")`);

      const details = profile.place_first_sync_done
        ? await fetchPlaceDetails(profile.place_id, placesKey)
        : await fetchPlaceReviewsMultiSort(profile.place_id, placesKey);
      const reviewsFromGoogle = details.reviews || [];

      const fetchedName = details.displayName?.text || details.displayName || null;
      log(
        `  Places returned displayName="${fetchedName || "?"}" reviews=${reviewsFromGoogle.length} ` +
        `rating=${details.rating ?? "?"} count=${details.userRatingCount ?? "?"}`
      );
      if (profile.place_name && fetchedName && profile.place_name !== fetchedName) {
        log(
          `  ⚠ name drift: cached "${profile.place_name}" vs current "${fetchedName}". ` +
          `Will continue using place_id=${profile.place_id} (the source of truth).`
        );
      }

      // Refresh cached rating snapshot
      if (typeof details.rating === "number" || typeof details.userRatingCount === "number") {
        await supa
          .from("profiles")
          .update({
            place_rating: typeof details.rating === "number" ? details.rating : null,
            place_user_rating_count: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
          })
          .eq("id", profile.id);
      }

      // ──────────────────────────────────────────────────────
      // BRANCH A — Initial sync (any plan, first time)
      // Process up to 5 reviews and send ONE digest email.
      // ──────────────────────────────────────────────────────
      if (!profile.place_first_sync_done) {
        const digestItems = [];
        const insertedIds = [];
        for (const gr of reviewsFromGoogle) {
          try {
            const result = await ingestReview({ supa, openai, profile, googleReview: gr });
            if (result) {
              insertedIds.push(result.review.id);
              digestItems.push({
                review: {
                  reviewer_name: result.review.reviewer_name,
                  stars: result.review.stars,
                  content: result.review.content,
                },
                replies: result.replies,
              });
            }
          } catch (err) {
            log("initial ingest failed:", err.message);
            summary.errors.push({ user: profile.id, error: err.message });
          }
        }

        summary.new_reviews += digestItems.length;

        let digestSent = false;
        if (digestItems.length > 0 && profile.email && profile.email_notifications !== false) {
          try {
            await sendDigestEmail({
              to: profile.email,
              restaurantName: profile.restaurant_name || profile.place_name || "your restaurant",
              items: digestItems,
              isInitialSync: true,
            });
            summary.initial_digests++;
            digestSent = true;
          } catch (mailErr) {
            log("initial digest email failed:", mailErr.message);
            summary.errors.push({ user: profile.id, error: mailErr.message });
          }
        }

        // Stamp notified_at on every review we ingested in this initial pass —
        // either the digest succeeded (real notification), or the user has
        // email_notifications=false (they're aware these exist), or there was
        // nothing to email. In all cases, future cron runs must not re-notify.
        if (insertedIds.length > 0) {
          await supa
            .from("reviews")
            .update({ notified_at: new Date().toISOString() })
            .in("id", insertedIds);
        }

        await supa.from("profiles").update({ place_first_sync_done: true }).eq("id", profile.id);
        log(`user ${profile.id}: initial digest sent=${digestSent} (${digestItems.length} reviews, marked notified)`);
        continue;
      }

      // Free Trial reaches here only if first sync was already done — handled above.
      // For Starter/Growth/Pro past initial:

      // Pre-filter to new reviews and sort by publishTime DESC
      const candidates = [];
      for (const gr of reviewsFromGoogle) {
        if (!gr.name) continue;
        const { data: existing } = await supa
          .from("reviews")
          .select("id")
          .eq("google_review_id", gr.name)
          .maybeSingle();
        if (!existing) candidates.push(gr);
      }
      candidates.sort((a, b) => new Date(b.publishTime || 0) - new Date(a.publishTime || 0));

      // ──────────────────────────────────────────────────────
      // BRANCH B — Starter: at most 1 new review per cron run
      // ──────────────────────────────────────────────────────
      let toProcess = candidates;
      if (plan === "starter") {
        toProcess = candidates.slice(0, 1);
      }

      // ──────────────────────────────────────────────────────
      // BRANCH C — Growth & Pro: process all new reviews
      // ──────────────────────────────────────────────────────
      for (const gr of toProcess) {
        try {
          const result = await ingestReview({ supa, openai, profile, googleReview: gr });
          if (!result) continue;
          summary.new_reviews++;

          // notified_at is NULL after fresh insert. Per-review notify email,
          // stamped exactly once after the email succeeds (or after we decide
          // not to email this row — see below) so a future re-run can never
          // double-notify the same review.
          const isCrisis = result.isCrisis;
          const wantsImmediate = profile.email_notifications && profile.notification_frequency === "immediately";
          const crisisOverride = isCrisis && profile.crisis_alerts;
          let didSend = false;
          if (profile.email && result.replies && (wantsImmediate || crisisOverride)) {
            try {
              await resend.emails.send({
                from: "Revuly <notifications@revuly.dev>",
                to: profile.email,
                subject: isCrisis
                  ? `🚨 Crisis Alert — New ${result.review.stars}★ review at ${profile.restaurant_name || "your restaurant"}`
                  : `⭐ New ${result.review.stars}★ review at ${profile.restaurant_name || "your restaurant"}`,
                html: buildNotifyHtml({
                  restaurantName: profile.restaurant_name || profile.place_name || "your restaurant",
                  review: result.review,
                  replies: result.replies,
                  isCrisis,
                }),
              });
              summary.notify_emails++;
              didSend = true;
            } catch (mailErr) {
              log("notify email failed:", mailErr.message);
            }
          }

          // Always stamp notified_at — either email went out, or user opted
          // out / non-immediate digest schedule. Either way, this review is
          // accounted for and must never be re-notified.
          await supa
            .from("reviews")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", result.review.id);
          if (!didSend) log(`  ${result.review.id} ingested, marked notified (no email sent)`);
        } catch (err) {
          log("ingest failed:", err.message);
          summary.errors.push({ user: profile.id, error: err.message });
        }
      }

      // ──────────────────────────────────────────────────────
      // BRANCH D — Pro extra: unanswered-review reminders
      // ──────────────────────────────────────────────────────
      if (plan === "pro") {
        const cutoff = new Date(Date.now() - UNREPLIED_AGE_HOURS * 3600 * 1000).toISOString();
        const cooldownAgo = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 86400 * 1000).toISOString();

        const { data: stale } = await supa
          .from("reviews")
          .select("id, reviewer_name, stars, content, review_date, reminder_sent_at")
          .eq("user_id", profile.id)
          .eq("replied", false)
          .lte("review_date", cutoff)
          .order("review_date", { ascending: true })
          .limit(10);

        const dueReminders = (stale || []).filter(
          (r) => !r.reminder_sent_at || r.reminder_sent_at < cooldownAgo
        );

        if (dueReminders.length > 0 && profile.email) {
          // Hydrate replies if we have them on file
          const reviewIds = dueReminders.map((r) => r.id);
          const { data: suggestions } = await supa
            .from("reply_suggestions")
            .select("review_id, replies")
            .in("review_id", reviewIds);
          const repliesByReview = {};
          (suggestions || []).forEach((s) => { repliesByReview[s.review_id] = s.replies; });

          const items = dueReminders.map((r) => ({
            review: { reviewer_name: r.reviewer_name, stars: r.stars, content: r.content },
            replies: repliesByReview[r.id] || {},
          }));

          try {
            await resend.emails.send({
              from: "Revuly <notifications@revuly.dev>",
              to: profile.email,
              subject: `⏰ ${dueReminders.length} unanswered review${dueReminders.length === 1 ? "" : "s"} — ${profile.restaurant_name || "your restaurant"}`,
              html: buildReminderHtml({
                restaurantName: profile.restaurant_name || profile.place_name || "your restaurant",
                items,
              }),
            });
            summary.reminder_emails++;
            await supa
              .from("reviews")
              .update({ reminder_sent_at: new Date().toISOString() })
              .in("id", reviewIds);
          } catch (mailErr) {
            log("reminder email failed:", mailErr.message);
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

// ──────────────────────────────────────────────────────────
// Email templates — kept local so this route is self-contained
// for the per-review notify and Pro reminder cases.
// (Multi-review digest reuses /api/email/digest's sendDigestEmail.)
// ──────────────────────────────────────────────────────────

function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function buildNotifyHtml({ restaurantName, review, replies, isCrisis }) {
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
    <p style="font-size:13px;color:#5a5550;margin:0 0 28px">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
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

function buildReminderHtml({ restaurantName, items }) {
  const styleNames = { warm: "Warm & Personal", professional: "Professional & Gracious", brief: "Brief & Direct" };

  const blocks = items.map(({ review, replies }, idx) => {
    const repliesHtml = Object.entries(replies || {})
      .map(
        ([style, text]) => `
          <div style="margin-bottom:12px;padding:12px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px">
            <div style="font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;margin-bottom:6px">${styleNames[style] || style}</div>
            <div style="font-size:13px;line-height:1.65;color:#a09888">${text}</div>
          </div>`
      )
      .join("");

    return `
      <div style="margin-bottom:24px;padding:20px;background:#1c1c22;border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:22px;height:22px;border-radius:50%;background:rgba(224,96,96,.18);text-align:center;line-height:22px;color:#fca5a5;font-weight:700;font-size:12px">${idx + 1}</div>
          <div style="font-size:13.5px;font-weight:700;color:#f0ede6">${review.reviewer_name || "Anonymous"}</div>
          <div style="font-size:12.5px;color:#c9a84c;margin-left:auto">${starsHtml(review.stars)}</div>
        </div>
        <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(224,96,96,0.4);border-radius:0 6px 6px 0;margin-bottom:14px">
          <p style="font-size:13.5px;line-height:1.7;color:#a09888;margin:0;font-style:italic">"${review.content}"</p>
        </div>
        ${Object.keys(replies || {}).length > 0 ? `<div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#5a5550;margin-bottom:8px">💬 AI Suggested Replies (Ready)</div>${repliesHtml}` : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8a6e2f,#c9a84c);border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
      <span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">Revuly</span>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#f0ede6;margin:0 0 6px">⏰ ${items.length} review${items.length === 1 ? "" : "s"} still waiting for a reply</h1>
    <p style="font-size:13.5px;color:#a09888;margin:0 0 24px;line-height:1.65">These reviews at <strong style="color:#e8c96a">${restaurantName}</strong> are 24+ hours old and haven't been replied to yet. AI replies are already drafted — just pick one and post it on Google.</p>
    ${blocks}
    <div style="text-align:center;margin:28px 0">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">Open Dashboard →</a>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center">
      <p style="font-size:12px;color:#5a5550;margin:0">Pro plan reminder · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#5a5550;text-decoration:none">Manage notifications</a></p>
    </div>
  </div>
</body></html>`;
}
