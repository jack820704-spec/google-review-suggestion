// Shared helpers for the Google Places auto-sync pipeline.
// Used by /api/places/connect (first-time digest) and /api/places/sync (cron tiered logic).

import OpenAI from "openai";
import { Resend } from "resend";

const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

export function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function ratingToStars(g) {
  if (typeof g === "number") return Math.max(1, Math.min(5, Math.round(g)));
  if (typeof g === "string") {
    const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    if (map[g]) return map[g];
    const n = parseInt(g, 10);
    if (!isNaN(n)) return Math.max(1, Math.min(5, n));
  }
  return 3;
}

export function sentimentFromStars(stars) {
  if (stars >= 4) return "positive";
  if (stars <= 2) return "negative";
  return "neutral";
}

export async function fetchPlaceDetails(placeId, apiKey) {
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

export function restaurantContext(profile) {
  return `${profile.restaurant_name || "our restaurant"}, a ${profile.restaurant_type || "restaurant"} in ${profile.city || "our city"}, ${profile.country || ""}`;
}

export async function generateReplies({ openai, restaurantCtx, content }) {
  const systemPrompt = `You are the owner of ${restaurantCtx}.
Write a reply as if you personally read this review tonight after closing.
Sound genuine, warm, and specific to what the reviewer mentioned.
Never use corporate PR language. Use first person naturally.
For positive reviews: thank them genuinely and reference a specific detail they mentioned.
For negative reviews: apologize sincerely without excuses, acknowledge the specific issue, promise improvement, invite direct contact.
Keep each reply to 60-100 words.
Write in English.`;

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

// Insert one review + reply_suggestions atomically (best-effort).
// Returns { inserted: review row, replies } or null when skipped (duplicate or empty).
//
// Dedup is layered:
//   1. SELECT first → early-exit when the row already exists, so we never
//      pay for OpenAI generation on a duplicate. This is the common case.
//   2. Postgres unique partial index on google_review_id (uniq_reviews_google_review_id)
//      → if a parallel run (concurrent cron + manual /connect, etc.) inserts
//      between our SELECT and INSERT, Postgres returns 23505 and we treat
//      it as "already ingested, skip". This makes the dedup race-safe.
export async function ingestReview({ supa, openai, profile, googleReview }) {
  const googleReviewId = googleReview.name;
  if (!googleReviewId) return null;

  const { data: existing } = await supa
    .from("reviews")
    .select("id")
    .eq("google_review_id", googleReviewId)
    .maybeSingle();
  if (existing) return null;

  const stars = ratingToStars(googleReview.rating);
  const content = googleReview.text?.text || googleReview.originalText?.text || "";
  if (!content.trim()) return null;

  const reviewerName = googleReview.authorAttribution?.displayName || "Anonymous";
  const reviewDate = googleReview.publishTime || new Date().toISOString();
  const sentiment = sentimentFromStars(stars);
  const isCrisis = stars <= 2;

  let replies = null;
  try {
    replies = await generateReplies({
      openai,
      restaurantCtx: restaurantContext(profile),
      content,
    });
  } catch (genErr) {
    console.error("[places-sync] generateReplies failed:", genErr.message);
  }

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
    if (insertErr.code === "23505") return null; // unique violation race
    throw insertErr;
  }

  if (replies) {
    await supa.from("reply_suggestions").insert({
      review_id: insertedReview.id,
      user_id: profile.id,
      replies,
      lang: "en",
    });
  }

  return { review: insertedReview, replies, isCrisis };
}
