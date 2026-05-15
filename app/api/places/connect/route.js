// POST /api/places/connect
// Called from Settings page when a user selects a Google business from search results.
//   1. Authenticate the user via Supabase session cookies.
//   2. Persist the selected place_id (+ cached name/address/rating) to profiles.
//   3. Pull up to 5 most recent reviews from Google Places (New) API.
//   4. Generate 3 AI reply styles for each new review and insert into reviews + reply_suggestions.
//   5. Send ONE digest email containing all of them (skipped if user has email_notifications=false).
//   6. Mark profiles.place_first_sync_done = true so the daily cron knows the initial sync ran.
//
// This runs for ALL plans (including Free Trial) — initial 5-review digest is the universal welcome.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";
import { fetchPlaceDetails, getOpenAI, ingestReview } from "@/lib/places-sync";
import { sendDigestEmail } from "@/app/api/email/digest/route";

export async function POST(req) {
  try {
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!placesKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

    const body = await req.json();
    const { place_id, place_name, place_address, place_rating, place_user_rating_count } = body || {};
    if (!place_id) return Response.json({ error: "place_id is required" }, { status: 400 });

    // ── Authenticate the current user ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();

    // ── Save the place selection ──
    const { data: profile, error: updateErr } = await supa
      .from("profiles")
      .update({
        place_id,
        place_name: place_name || null,
        place_address: place_address || null,
        place_rating: typeof place_rating === "number" ? place_rating : null,
        place_user_rating_count: typeof place_user_rating_count === "number" ? place_user_rating_count : null,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    // ── If already synced once, just confirm — don't re-send a digest ──
    if (profile.place_first_sync_done) {
      return Response.json({ ok: true, alreadySynced: true, new_reviews: 0 });
    }

    // ── Pull up to 5 reviews ──
    const details = await fetchPlaceDetails(place_id, placesKey);
    const reviews = (details.reviews || []).slice(0, 5);

    // Refresh cached rating
    if (typeof details.rating === "number" || typeof details.userRatingCount === "number") {
      await supa
        .from("profiles")
        .update({
          place_rating: typeof details.rating === "number" ? details.rating : null,
          place_user_rating_count: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
        })
        .eq("id", user.id);
    }

    const openai = getOpenAI();
    const digestItems = [];

    for (const gr of reviews) {
      try {
        const result = await ingestReview({ supa, openai, profile, googleReview: gr });
        if (result) {
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
        console.error("[places/connect] ingestReview failed:", err.message);
      }
    }

    // ── Send the digest email (one email, all reviews) ──
    let emailSent = false;
    if (digestItems.length > 0 && profile.email && profile.email_notifications !== false) {
      try {
        const { error: mailErr } = await sendDigestEmail({
          to: profile.email,
          restaurantName: profile.restaurant_name || profile.place_name || "your restaurant",
          items: digestItems,
          isInitialSync: true,
        });
        if (mailErr) console.error("[places/connect] digest email error:", mailErr);
        else emailSent = true;
      } catch (mailErr) {
        console.error("[places/connect] digest email threw:", mailErr.message);
      }
    }

    // ── Mark first sync complete ──
    await supa.from("profiles").update({ place_first_sync_done: true }).eq("id", user.id);

    return Response.json({
      ok: true,
      new_reviews: digestItems.length,
      email_sent: emailSent,
      first_sync_done: true,
    });
  } catch (err) {
    console.error("[places/connect] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
