// POST /api/competitors/add
// Add a Google business to the user's competitor watchlist.
//   1. Auth via Supabase session cookies.
//   2. Pro plan + 3-competitor cap enforced.
//   3. Insert into competitors table (UNIQUE on user_id+place_id catches dupes).
//   4. Immediately pull up to ~10 latest reviews from Google Places (New +
//      Legacy newest sort), dedup by google_review_id, store in
//      competitor_reviews so the dashboard has content right away.
//
// Body: { place_id, name, address, rating, user_rating_count, maps_uri }

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";
import {
  fetchPlaceReviewsMultiSort,
  ratingToStars,
  sentimentFromStars,
} from "@/lib/places-sync";

const MAX_COMPETITORS = 3;

export async function POST(req) {
  try {
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!placesKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

    const body = await req.json();
    const { place_id, name, address, rating, user_rating_count, maps_uri } = body || {};
    if (!place_id) return Response.json({ error: "place_id is required" }, { status: 400 });

    // ── Auth ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();

    // ── Pro gate ──
    const { data: profile } = await supa.from("profiles").select("plan, place_id").eq("id", user.id).single();
    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
    if (profile.plan !== "pro") {
      return Response.json({ error: "Competitor tracking is a Pro plan feature" }, { status: 403 });
    }
    if (profile.place_id && place_id === profile.place_id) {
      return Response.json({ error: "That's your own business — pick a different one" }, { status: 400 });
    }

    // ── Cap at MAX_COMPETITORS ──
    const { count: existingCount } = await supa
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((existingCount || 0) >= MAX_COMPETITORS) {
      return Response.json({ error: `Maximum ${MAX_COMPETITORS} competitors. Remove one first.` }, { status: 400 });
    }

    // Build a stable Maps URL we can also persist into competitor_reviews
    // (that column is NOT NULL — Google sometimes omits googleMapsUri so we
    // synthesize a deep-link fallback from the place_id).
    const fallbackMapsUri = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(place_id)}`;
    const competitorUrl = maps_uri || fallbackMapsUri;

    console.log("[competitors/add] inserting competitor", {
      user_id: user.id,
      place_id,
      name: name || null,
      competitorUrl,
    });

    // ── Insert competitor row ──
    const { data: inserted, error: insertErr } = await supa
      .from("competitors")
      .insert({
        user_id: user.id,
        place_id,
        name: name || null,
        address: address || null,
        rating: typeof rating === "number" ? rating : null,
        user_rating_count: typeof user_rating_count === "number" ? user_rating_count : null,
        maps_uri: competitorUrl,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[competitors/add] competitors insert error:", insertErr);
      if (insertErr.code === "23505") {
        return Response.json({ error: "You're already tracking this business" }, { status: 400 });
      }
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    // ── Pull initial reviews ──
    let reviewsInserted = 0;
    try {
      const details = await fetchPlaceReviewsMultiSort(place_id, placesKey);
      const reviews = details.reviews || [];

      // Update cached rating/count from authoritative Place Details
      if (typeof details.rating === "number" || typeof details.userRatingCount === "number") {
        await supa.from("competitors").update({
          rating: typeof details.rating === "number" ? details.rating : null,
          user_rating_count: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
          name: details.displayName?.text || inserted.name,
        }).eq("id", inserted.id);
      }

      for (const gr of reviews) {
        if (!gr.name) continue;
        const stars = ratingToStars(gr.rating);
        const content = gr.text?.text || gr.originalText?.text || "";
        if (!content.trim()) continue;
        const reviewer = gr.authorAttribution?.displayName || "Anonymous";
        const reviewDate = gr.publishTime || new Date().toISOString();

        const { error: revErr } = await supa.from("competitor_reviews").insert({
          user_id: user.id,
          competitor_url: competitorUrl,
          competitor_name: details.displayName?.text || inserted.name || null,
          competitor_place_id: place_id,
          google_review_id: gr.name,
          reviewer_name: reviewer,
          review_content: content,
          stars,
          sentiment: sentimentFromStars(stars),
          review_date: reviewDate,
        });
        if (!revErr) reviewsInserted++;
        else if (revErr.code !== "23505") {
          console.warn("[competitors/add] review insert failed:", revErr.message, "code=", revErr.code);
        }
      }
    } catch (e) {
      console.warn("[competitors/add] initial review pull failed:", e.message);
    }

    return Response.json({
      ok: true,
      competitor: inserted,
      reviews_inserted: reviewsInserted,
    });
  } catch (err) {
    console.error("[competitors/add] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
