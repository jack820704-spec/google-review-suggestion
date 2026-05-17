import { createServiceClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import crypto from "crypto";
import { buildSystemPrompt, buildUserPrompt, STYLES, STYLE_NOTES } from "@/lib/reply-prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INBOUND_DOMAIN = process.env.NEXT_PUBLIC_INBOUND_EMAIL_DOMAIN || "revuly.dev";

// Tag every log line so it's easy to grep in Vercel / local logs
const log = (...args) => console.log("[inbound]", ...args);
const warn = (...args) => console.warn("[inbound]", ...args);
const err = (...args) => console.error("[inbound]", ...args);

function extractUserId(toAddresses) {
  const domainEscaped = INBOUND_DOMAIN.replace(/\./g, "\\.");
  const re = new RegExp(`user-([0-9a-f-]{36})@${domainEscaped}`, "i");
  for (const addr of toAddresses) {
    const match = String(addr).match(re);
    if (match) return match[1];
  }
  return null;
}

// Verify Resend (Svix-format) webhook signature.
// Spec: https://docs.svix.com/receiving/verifying-payloads/how-manual
//   signed_payload = `${svix-id}.${svix-timestamp}.${rawBody}`
//   expected_sig   = base64( HMAC_SHA256(base64Decode(secret_without_prefix), signed_payload) )
//   svix-signature header is space-separated "v1,<sig>" pairs; match any one.
function verifySignature(req, rawBody) {
  // DEV-only bypass — flip INBOUND_SKIP_SIGNATURE=1 in .env.local to disable verification
  if (process.env.INBOUND_SKIP_SIGNATURE === "1") {
    warn("INBOUND_SKIP_SIGNATURE=1 — skipping signature verification (DEV ONLY, DO NOT USE IN PROD)");
    return true;
  }
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    warn("RESEND_WEBHOOK_SECRET not set — skipping signature verification (DEV ONLY)");
    return true;
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  log("svix headers:", { svixId, svixTimestamp, hasSignature: !!svixSignature });
  if (!svixId || !svixTimestamp || !svixSignature) {
    warn("missing svix headers — rejecting");
    return false;
  }

  // Replay protection: reject timestamps older than 5 minutes (Svix recommendation)
  const ts = parseInt(svixTimestamp, 10);
  const skewSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (!Number.isFinite(ts) || skewSec > 5 * 60) {
    warn("timestamp out of tolerance:", { svixTimestamp, skewSec });
    return false;
  }

  let secretBytes;
  try {
    secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  } catch (e) {
    err("RESEND_WEBHOOK_SECRET is not valid base64:", e.message);
    return false;
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedPayload).digest("base64");
  const expectedBuf = Buffer.from(expected, "utf8");

  const parts = svixSignature.split(" ");
  const versions = parts.map((p) => p.split(",")[0]);
  log("svix-signature parts:", parts.length, "versions:", versions);

  const ok = parts.some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const sigBuf = Buffer.from(sig, "utf8");
    if (sigBuf.length !== expectedBuf.length) return false;
    try {
      return crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
  log("signature verification:", ok ? "OK" : "FAILED", "expected:", expected.slice(0, 12) + "...");
  return ok;
}

async function fetchFullEmail(emailId) {
  const url = `https://api.resend.com/emails/receiving/${emailId}`;
  log("fetching full email from Resend:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  log("Resend API status:", res.status);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    warn("fetchFullEmail failed body:", errText.slice(0, 500));
    return null;
  }
  const json = await res.json();
  log("fetched email keys:", Object.keys(json), "subject:", json.subject, "text len:", (json.text || "").length, "html len:", (json.html || "").length);
  return json;
}

async function parseReviewFromEmail(subject, text, html) {
  const body = text || (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  log("parsing email — subject:", subject, "body len:", body.length, "body preview:", body.slice(0, 200));
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
  const raw = r.choices[0].message.content;
  log("OpenAI parse raw:", raw);
  try {
    return JSON.parse(raw);
  } catch (e) {
    err("failed to parse OpenAI JSON:", e.message);
    return { reviewer_name: "Anonymous", stars: 3, content: "", is_review_email: false };
  }
}

async function generateReplies(review, profile) {
  const system = buildSystemPrompt(profile, "en");
  log("generating replies for review len:", (review?.content || "").length);
  const entries = await Promise.all(
    STYLES.map(async (styleKey) => {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: system },
          { role: "user", content: buildUserPrompt(review, STYLE_NOTES[styleKey]) },
        ],
      });
      return [styleKey, r.choices[0].message.content.trim()];
    })
  );
  log("generated replies:", entries.map(([k, v]) => `${k} (${v.length} chars)`));
  return Object.fromEntries(entries);
}

export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "/api/email/inbound",
    method: "POST only — Resend webhooks",
    inboundDomain: INBOUND_DOMAIN,
    hasWebhookSecret: !!process.env.RESEND_WEBHOOK_SECRET,
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    now: new Date().toISOString(),
  });
}

export async function POST(req) {
  const t0 = Date.now();
  log("==== POST /api/email/inbound ====", new Date().toISOString());
  try {
    const rawBody = await req.text();
    log("raw body length:", rawBody.length, "headers:", {
      contentType: req.headers.get("content-type"),
      userAgent: req.headers.get("user-agent"),
    });

    if (!verifySignature(req, rawBody)) {
      err("rejected — invalid or missing signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      err("invalid JSON body:", e.message, "first 300 chars:", rawBody.slice(0, 300));
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    log("payload type:", payload.type, "top-level keys:", Object.keys(payload));

    const meta = payload.data || payload;
    log("meta keys:", Object.keys(meta), "to:", meta.to, "from:", meta.from, "subject:", meta.subject, "email_id:", meta.email_id || meta.id);

    const toRaw = meta.to || [];
    const toArray = Array.isArray(toRaw) ? toRaw : [toRaw];

    const userId = extractUserId(toArray);
    log("extracted userId:", userId, "(domain:", INBOUND_DOMAIN, ")");
    if (!userId) {
      warn("no matching user-id in recipients:", toArray);
      return Response.json({ skipped: true, reason: "No user-id in recipient", to: toArray });
    }

    const db = createServiceClient();

    const { data: profile, error: profileErr } = await db.from("profiles").select("*").eq("id", userId).single();
    if (profileErr) err("profile lookup error:", profileErr.message);
    if (!profile) {
      warn("profile not found for userId:", userId);
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    log("matched profile:", profile.email, "restaurant:", profile.restaurant_name);

    const emailId = meta.email_id || meta.id;
    const full = emailId ? await fetchFullEmail(emailId) : null;
    if (emailId && !full) warn("Resend full-email fetch returned null for id:", emailId);

    const subject = full?.subject || meta.subject || "";
    const text = full?.text || meta.text || "";
    const html = full?.html || meta.html || "";
    log("content sources — full?", !!full, "subject:", subject, "text len:", text.length, "html len:", html.length);

    const parsed = await parseReviewFromEmail(subject, text, html);
    log("parsed result:", parsed);

    if (!parsed.is_review_email) {
      log("skipping — not classified as review email");
      return Response.json({ skipped: true, reason: "Not a review notification email", parsed });
    }

    const stars = Math.min(5, Math.max(1, parseInt(parsed.stars) || 3));
    const sentiment = stars >= 4 ? "positive" : stars <= 2 ? "negative" : "neutral";
    const reviewerName = parsed.reviewer_name || "Anonymous";
    const content = parsed.content || "";

    // Dedup key — same review forwarded twice (or Resend webhook retry) hashes
    // to the same value, and the unique partial index on google_review_id
    // catches it at the DB level (Postgres error 23505).
    const dedupHash = crypto
      .createHash("md5")
      .update(`${userId}:${reviewerName}:${stars}:${content.slice(0, 200)}`)
      .digest("hex");
    const dedupKey = `inbound:${dedupHash}`;

    // Early-exit if we've already ingested this review — avoids wasted OpenAI calls.
    const { data: existing } = await db
      .from("reviews")
      .select("id")
      .eq("google_review_id", dedupKey)
      .maybeSingle();
    if (existing) {
      log("duplicate inbound — already ingested:", existing.id);
      return Response.json({ skipped: true, reason: "Duplicate review (dedup)", reviewId: existing.id });
    }

    log("inserting review — stars:", stars, "sentiment:", sentiment, "dedupKey:", dedupKey);

    const { data: review, error: reviewErr } = await db
      .from("reviews")
      .insert({
        user_id: userId,
        reviewer_name: reviewerName,
        stars,
        content,
        source: "google",
        sentiment,
        is_crisis: false,
        replied: false,
        review_date: new Date().toISOString(),
        google_review_id: dedupKey,
      })
      .select()
      .single();

    if (reviewErr) {
      // 23505 = unique_violation — a concurrent run inserted between our SELECT and INSERT.
      if (reviewErr.code === "23505") {
        log("race-caught duplicate (23505), skipping");
        return Response.json({ skipped: true, reason: "Duplicate review (unique constraint)" });
      }
      err("review insert failed:", reviewErr.message);
      return Response.json({ error: reviewErr.message }, { status: 500 });
    }
    log("review inserted:", review.id);

    const replies = await generateReplies(review, profile);

    const { error: suggErr } = await db.from("reply_suggestions").insert({
      review_id: review.id,
      user_id: userId,
      replies,
    });
    if (suggErr) err("reply_suggestions insert failed:", suggErr.message);

    // Crisis check: 3+ low-rating reviews in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("reviews")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .lte("stars", 2)
      .gte("review_date", since);
    const isCrisis = count >= 3;
    log("crisis check — low-rating in 24h:", count, "isCrisis:", isCrisis);
    if (isCrisis) {
      await db.from("reviews").update({ is_crisis: true })
        .eq("user_id", userId).lte("stars", 2).gte("review_date", since);
    }

    if (profile.email_notifications !== false) {
      log("sending notification email to:", profile.email);
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/notify`, {
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
      log("notify response status:", notifyRes.status);
      if (!notifyRes.ok) {
        const t = await notifyRes.text().catch(() => "");
        warn("notify failed body:", t.slice(0, 500));
      }
    } else {
      log("user has email_notifications disabled, skipping notify");
    }

    // Stamp notified_at so cron never re-fires for this review.
    await db.from("reviews").update({ notified_at: new Date().toISOString() }).eq("id", review.id);

    log("==== DONE in", Date.now() - t0, "ms ====");
    return Response.json({ success: true, reviewId: review.id });
  } catch (e) {
    err("unhandled error:", e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
