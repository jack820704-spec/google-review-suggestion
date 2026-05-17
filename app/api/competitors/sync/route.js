// /api/competitors/sync — daily cron.
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Iterates every competitor row; pulls latest reviews from Google Places;
// dedups by google_review_id (race-safe via unique partial index); inserts
// new ones into competitor_reviews; refreshes rating snapshot.

import { createServiceClient } from "@/lib/supabase-server";
import {
  fetchPlaceDetails,
  ratingToStars,
  sentimentFromStars,
} from "@/lib/places-sync";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function log(...args) {
  console.log("[competitors/sync]", ...args);
}

export async function POST(req) { return runSync(req); }
export async function GET(req) { return runSync(req); }

async function runSync(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (token !== cronSecret) return unauthorized();

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placesKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

  const supa = createServiceClient();

  const { data: competitors, error: listErr } = await supa
    .from("competitors")
    .select("id, user_id, place_id, name");
  if (listErr) return Response.json({ error: listErr.message }, { status: 500 });

  const summary = {
    competitors_seen: competitors?.length || 0,
    new_reviews: 0,
    errors: [],
  };

  for (const comp of competitors || []) {
    try {
      log(`competitor=${comp.id} user=${comp.user_id} place_id=${comp.place_id} (${comp.name || "?"})`);
      const details = await fetchPlaceDetails(comp.place_id, placesKey);
      const reviews = details.reviews || [];
      const competitorUrl =
        details.googleMapsUri ||
        `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(comp.place_id)}`;

      // Refresh rating snapshot + name
      await supa.from("competitors").update({
        rating: typeof details.rating === "number" ? details.rating : null,
        user_rating_count: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
        name: details.displayName?.text || comp.name,
        last_synced_at: new Date().toISOString(),
      }).eq("id", comp.id);

      for (const gr of reviews) {
        if (!gr.name) continue;

        // Defensive path check — same as ingestReview in places-sync.
        const m = /^places\/([^/]+)\//.exec(gr.name);
        if (m && m[1] !== comp.place_id) {
          log(`  ⚠ skipping mismatched review ${gr.name} (expected place ${comp.place_id})`);
          continue;
        }

        const content = gr.text?.text || gr.originalText?.text || "";
        if (!content.trim()) continue;
        const stars = ratingToStars(gr.rating);
        const reviewer = gr.authorAttribution?.displayName || "Anonymous";
        const reviewDate = gr.publishTime || new Date().toISOString();

        const { error: insErr } = await supa.from("competitor_reviews").insert({
          user_id: comp.user_id,
          competitor_url: competitorUrl,
          competitor_name: details.displayName?.text || comp.name || null,
          competitor_place_id: comp.place_id,
          google_review_id: gr.name,
          reviewer_name: reviewer,
          review_content: content,
          stars,
          sentiment: sentimentFromStars(stars),
          review_date: reviewDate,
        });

        if (insErr) {
          if (insErr.code === "23505") continue; // race-safe dup catch
          log("  insert failed:", insErr.message);
          summary.errors.push({ competitor: comp.id, error: insErr.message });
          continue;
        }
        summary.new_reviews++;
      }
    } catch (e) {
      log("competitor processing failed:", comp.id, e.message);
      summary.errors.push({ competitor: comp.id, error: e.message });
    }
  }

  log("done:", summary);
  return Response.json({ ok: true, ...summary });
}
