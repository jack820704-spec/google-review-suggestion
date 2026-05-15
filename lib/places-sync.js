// Shared helpers for the Google Places auto-sync pipeline.
// Used by /api/places/connect (first-time digest) and /api/places/sync (cron tiered logic).

import OpenAI from "openai";
import { Resend } from "resend";
import crypto from "crypto";

const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";
const PLACES_LEGACY_URL = "https://maps.googleapis.com/maps/api/place/details/json";

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

export async function fetchPlaceDetails(placeId, apiKey, opts = {}) {
  const params = new URLSearchParams();
  if (opts.rankPreference) params.set("reviewsRankPreference", opts.rankPreference);
  const qs = params.toString();
  const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}${qs ? `?${qs}` : ""}`;
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

// Legacy Place Details API — used for the "newest" sort that the New API doesn't
// always honor. Returns review shapes with different field names (text, time, author_name).
export async function fetchPlaceDetailsLegacy(placeId, apiKey, reviewsSort = "newest") {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "reviews,rating,user_ratings_total,name",
    reviews_sort: reviewsSort,
    reviews_no_translations: "true",
    key: apiKey,
  });
  const res = await fetch(`${PLACES_LEGACY_URL}?${params}`);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Legacy Place Details ${data.status}: ${data.error_message || ""}`);
  }
  return data.result || {};
}

// Normalize a Legacy API review object to the New API review shape used by ingestReview.
function legacyToNewReview(placeId, lr) {
  const author = lr.author_name || "Anonymous";
  const text = lr.text || "";
  const time = typeof lr.time === "number" ? new Date(lr.time * 1000).toISOString() : new Date().toISOString();
  // Synthetic stable id — same author + content hashes to the same id no matter which path fetched it.
  const fingerprint = crypto
    .createHash("md5")
    .update(`${author.toLowerCase()}:${text.slice(0, 200).toLowerCase()}`)
    .digest("hex");
  return {
    name: `places/${placeId}/reviews/legacy:${fingerprint}`,
    rating: lr.rating,
    text: { text },
    originalText: { text },
    publishTime: time,
    authorAttribution: { displayName: author },
  };
}

// Fetch reviews from multiple sort orders, merge + dedup by (reviewer + content prefix).
// Used by the first-time sync to surface more historical reviews than a single call would.
export async function fetchPlaceReviewsMultiSort(placeId, apiKey) {
  const dedup = new Map(); // fingerprint -> review

  function addReview(r) {
    const author = r.authorAttribution?.displayName || "";
    const content = r.text?.text || r.originalText?.text || "";
    if (!content.trim()) return;
    const key = `${author.toLowerCase()}:${content.slice(0, 200).toLowerCase()}`;
    if (dedup.has(key)) return;
    dedup.set(key, r);
  }

  // 1. New API — default sort (MOST_RELEVANT)
  let baseDetails = null;
  try {
    baseDetails = await fetchPlaceDetails(placeId, apiKey);
    (baseDetails.reviews || []).forEach(addReview);
  } catch (e) {
    console.warn("[places-sync] New API default failed:", e.message);
  }

  // 2. New API — NEWEST rankPreference (newer endpoint param; ignored if unsupported)
  try {
    const newest = await fetchPlaceDetails(placeId, apiKey, { rankPreference: "NEWEST" });
    (newest.reviews || []).forEach(addReview);
  } catch (e) {
    console.warn("[places-sync] New API NEWEST failed:", e.message);
  }

  // 3. Legacy API — explicit newest sort
  try {
    const legacy = await fetchPlaceDetailsLegacy(placeId, apiKey, "newest");
    (legacy.reviews || []).forEach((lr) => addReview(legacyToNewReview(placeId, lr)));
  } catch (e) {
    console.warn("[places-sync] Legacy newest failed:", e.message);
  }

  // Sort merged set by publishTime DESC, take top ~15.
  const merged = Array.from(dedup.values())
    .sort((a, b) => new Date(b.publishTime || 0) - new Date(a.publishTime || 0))
    .slice(0, 15);

  return {
    rating: baseDetails?.rating ?? null,
    userRatingCount: baseDetails?.userRatingCount ?? null,
    displayName: baseDetails?.displayName ?? null,
    reviews: merged,
  };
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

  const stars = ratingToStars(googleReview.rating);
  const content = googleReview.text?.text || googleReview.originalText?.text || "";
  if (!content.trim()) return null;

  const reviewerName = googleReview.authorAttribution?.displayName || "Anonymous";

  // ── Dedup pass 1: google_review_id (catches same source re-fetched) ──
  const { data: existingById } = await supa
    .from("reviews")
    .select("id")
    .eq("google_review_id", googleReviewId)
    .maybeSingle();
  if (existingById) return null;

  // ── Dedup pass 2: cross-source fingerprint (reviewer + content prefix) ──
  // Catches the same actual Google review coming through different paths
  // (New API + Legacy API + inbound email + CSV upload all carry different IDs).
  const contentPrefix = content.slice(0, 200);
  const { data: existingByFp } = await supa
    .from("reviews")
    .select("id")
    .eq("user_id", profile.id)
    .ilike("reviewer_name", reviewerName)
    .ilike("content", `${contentPrefix.replace(/[%_]/g, "\\$&")}%`)
    .limit(1)
    .maybeSingle();
  if (existingByFp) return null;

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
