// POST /api/ai/learn-style
// Train the Pro plan's "Your Style" model on the user's actual posted replies.
//
//   1. Auth via Supabase session cookies.
//   2. Plan gate — Pro only.
//   3. Pull the user's most recent reviews where actual_reply_text is set
//      (up to 20). Need at least 5 to produce a useful style profile.
//   4. Ask OpenAI to extract structured style features as JSON
//      (tone, opener, closer, avg length, name usage, signature phrases,
//      summary, language).
//   5. Persist to profiles.ai_style_data + flip ai_style_learned = true.
//
// The Mark Replied modal in the dashboard calls this automatically once
// the user has 5+ saved actual replies. Settings exposes a "Reset Style"
// action that clears the cached analysis so the next save retrains.

import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

const MIN_SAMPLES = 5;
const MAX_SAMPLES = 20;

export async function POST(req) {
  try {
    // ── Auth ──────────────────────────────────────────────
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();

    // ── Plan gate ─────────────────────────────────────────
    const { data: profile } = await supa
      .from("profiles")
      .select("plan, restaurant_name, restaurant_type, city, country, ai_style_learned")
      .eq("id", user.id)
      .single();

    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
    if (profile.plan !== "pro") {
      return Response.json({ error: "AI Style Learning is a Pro plan feature" }, { status: 403 });
    }

    // ── Pull the corpus ───────────────────────────────────
    const { data: samples } = await supa
      .from("reviews")
      .select("reviewer_name, stars, content, actual_reply_text, review_date")
      .eq("user_id", user.id)
      .not("actual_reply_text", "is", null)
      .order("review_date", { ascending: false })
      .limit(MAX_SAMPLES);

    const valid = (samples || []).filter(
      (s) => s.actual_reply_text && s.actual_reply_text.trim().length > 10
    );

    if (valid.length < MIN_SAMPLES) {
      return Response.json({
        ok: true,
        ready: false,
        samples_have: valid.length,
        needs: MIN_SAMPLES,
        message: `Need at least ${MIN_SAMPLES} replies to learn your style. You have ${valid.length}.`,
      });
    }

    // ── Build the prompt ──────────────────────────────────
    const restaurantCtx = `${profile.restaurant_name || "a restaurant"}${profile.restaurant_type ? `, a ${profile.restaurant_type}` : ""}${profile.city ? ` in ${profile.city}` : ""}${profile.country ? `, ${profile.country}` : ""}`;

    const examples = valid
      .map(
        (s, i) =>
          `Example ${i + 1}:\nReview (${s.stars}★) from ${s.reviewer_name || "Anonymous"}: "${s.content || ""}"\nOwner's reply: "${s.actual_reply_text}"`
      )
      .join("\n\n");

    const systemPrompt =
      "You analyse how a specific restaurant owner replies to Google reviews. Extract their personal style as structured JSON. Be precise — your output drives a downstream generator that mirrors this exact voice.";

    const userPrompt = `Below are ${valid.length} real reply examples from the owner of ${restaurantCtx}.

${examples}

Extract their reply style as a single JSON object with these keys:
  - tone: short label (e.g. "warm", "formal", "humorous", "friendly-casual", "professional-warm")
  - common_opener: typical opening line they use to greet the reviewer (e.g. "Dear [name],"). Use [name] as a placeholder for the reviewer's first name.
  - common_closer: typical closing / sign-off line.
  - avg_length_words: integer — average word count per reply.
  - addresses_by_name: boolean — do they typically address the reviewer by first name?
  - signature_phrases: array of 3 to 8 distinctive words / phrases / sentence structures they reuse. Keep them in the original language.
  - summary: one English sentence summarising their voice and what makes it distinctive.
  - language: primary language of replies (ISO code: "en", "zh", "es", "vi", "fr", "ja", etc.).

Return ONLY a valid JSON object. No markdown, no commentary.`;

    // ── Call OpenAI ───────────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("[ai/learn-style] failed to parse OpenAI JSON:", e.message);
      return Response.json({ error: "Could not parse style analysis" }, { status: 500 });
    }

    // Light validation / shape normalisation
    if (typeof analysis !== "object" || analysis === null) {
      return Response.json({ error: "Bad analysis shape" }, { status: 500 });
    }
    analysis._samples = valid.length;
    analysis._learned_at = new Date().toISOString();

    // ── Persist ───────────────────────────────────────────
    const { error: updateErr } = await supa
      .from("profiles")
      .update({ ai_style_data: analysis, ai_style_learned: true })
      .eq("id", user.id);

    if (updateErr) {
      console.error("[ai/learn-style] profiles update failed:", updateErr.message);
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    console.log(
      `[ai/learn-style] user=${user.id} samples=${valid.length} tone=${analysis.tone} lang=${analysis.language}`
    );

    return Response.json({
      ok: true,
      ready: true,
      samples_have: valid.length,
      analysis,
    });
  } catch (err) {
    console.error("[ai/learn-style] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Convenience GET — returns current status without retraining.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();
    const [{ data: profile }, { count }] = await Promise.all([
      supa.from("profiles").select("plan, ai_style_learned, ai_style_data").eq("id", user.id).single(),
      supa.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("actual_reply_text", "is", null),
    ]);

    return Response.json({
      ok: true,
      plan: profile?.plan,
      samples_have: count || 0,
      needs: MIN_SAMPLES,
      ai_style_learned: !!profile?.ai_style_learned,
      analysis: profile?.ai_style_data || null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
