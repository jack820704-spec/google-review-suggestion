import { createServiceClient } from "@/lib/supabase-server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateReplies(review, profile) {
  const ctx = `${profile.restaurant_name}, a ${profile.restaurant_type} in ${profile.city}, ${profile.country}`;
  const system = `You are the owner of ${ctx}. Write a reply as if you personally read this review tonight after closing. Sound genuine, specific, 60-100 words.`;
  const styles = {
    warm: "Warm & Personal style — casual, genuine, like the owner speaking directly.",
    professional: "Professional & Gracious style — polished, elegant, refined.",
    brief: "Brief & Direct style — 2-3 sentences only.",
  };
  const entries = await Promise.all(
    Object.entries(styles).map(async ([key, styleNote]) => {
      const r = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Review: "${review.content}"\n\n${styleNote}` },
        ],
      });
      return [key, r.choices[0].message.content.trim()];
    })
  );
  return Object.fromEntries(entries);
}

async function fetchGoogleReviews(accessToken, locationId) {
  if (!locationId) return [];
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationId}/reviews?pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.reviews || [];
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  // Get all Growth/Pro users with Google connections
  const { data: connections } = await db
    .from("google_connections")
    .select("*, profiles(*)")
    .in("profiles.plan", ["growth", "pro"]);

  if (!connections?.length) return Response.json({ synced: 0 });

  let totalSynced = 0;

  for (const conn of connections) {
    const profile = conn.profiles;
    if (!profile) continue;

    try {
      const googleReviews = await fetchGoogleReviews(conn.access_token, conn.location_id);

      for (const gr of googleReviews) {
        const googleId = gr.reviewId;
        // Check if already synced
        const { data: existing } = await db.from("reviews").select("id").eq("google_review_id", googleId).single();
        if (existing) continue;

        const rating = gr.starRating === "FIVE" ? 5 : gr.starRating === "FOUR" ? 4 : gr.starRating === "THREE" ? 3 : gr.starRating === "TWO" ? 2 : 1;
        const content = gr.comment || "";
        const sentiment = rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral";

        const { data: newReview } = await db.from("reviews").insert({
          user_id: profile.id,
          reviewer_name: gr.reviewer?.displayName || "Anonymous",
          stars: rating,
          content,
          sentiment,
          is_crisis: false,
          replied: !!gr.reviewReply,
          source: "google",
          google_review_id: googleId,
          review_date: gr.createTime || new Date().toISOString(),
        }).select().single();

        if (newReview) {
          // Generate replies
          const replies = await generateReplies(newReview, profile);
          await db.from("reply_suggestions").insert({ review_id: newReview.id, user_id: profile.id, replies });

          // Check for crisis (3+ negative in 24h)
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count } = await db.from("reviews").select("id", { count: "exact" }).eq("user_id", profile.id).lte("stars", 2).gte("review_date", since);
          const isCrisis = count >= 3;
          if (isCrisis) await db.from("reviews").update({ is_crisis: true }).eq("user_id", profile.id).lte("stars", 2).gte("review_date", since);

          // Notify if notifications enabled
          if (profile.email_notifications !== false) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/notify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: profile.email, restaurantName: profile.restaurant_name, review: newReview, replies, isCrisis }),
            });
          }
          totalSynced++;
        }
      }
    } catch (err) {
      console.error(`Sync error for user ${profile.id}:`, err.message);
    }
  }

  return Response.json({ synced: totalSynced });
}
