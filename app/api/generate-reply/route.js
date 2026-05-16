import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase-server";
import { buildSystemPrompt, buildUserPrompt, STYLES, STYLE_NOTES } from "@/lib/reply-prompts";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MIN_STYLE_SAMPLES = 3;
const MAX_STYLE_SAMPLES = 10;

export async function POST(req) {
  try {
    const { review, profile, lang } = await req.json();
    if (!review || !profile) return Response.json({ error: "Missing data" }, { status: 400 });

    const systemPrompt = buildSystemPrompt(profile, lang);

    const [warmReply, professionalReply, briefReply] = await Promise.all(
      STYLES.map((styleKey) =>
        client.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: buildUserPrompt(review, STYLE_NOTES[styleKey]) },
          ],
        }).then((r) => r.choices[0].message.content.trim())
      )
    );

    const replies = { warm: warmReply, professional: professionalReply, brief: briefReply };
    let yourStyleStatus = null;

    // Pro plan only: generate a 4th "Your Style" reply mirroring the owner's voice.
    //
    // Two paths:
    //   1. Preferred — profile.ai_style_data is populated (the structured analysis
    //      from /api/ai/learn-style). We build a tight directive prompt using the
    //      learned tone / opener / closer / length / phrases.
    //   2. Fallback — no analysis cached yet, but we have actual_reply_text samples
    //      on file. We pass them as few-shot examples directly.
    //
    // If neither is available, we surface your_style_status = "learning" so the
    // dashboard can show the "reply to a few more reviews" placeholder.
    if (profile.plan === "pro" && profile.id) {
      const supa = createServiceClient();

      // Count actual replies on file — this is the corpus that drives learning.
      const { data: samples } = await supa
        .from("reviews")
        .select("content, stars, actual_reply_text, reviewer_name")
        .eq("user_id", profile.id)
        .not("actual_reply_text", "is", null)
        .order("review_date", { ascending: false })
        .limit(MAX_STYLE_SAMPLES);

      const valid = (samples || []).filter(
        (s) => s.actual_reply_text && s.actual_reply_text.trim().length > 10
      );

      const style = profile.ai_style_data;
      const haveStructuredStyle = style && typeof style === "object" && style.tone;

      if (haveStructuredStyle) {
        // Path 1 — cached structured style analysis
        const phrasesLine = Array.isArray(style.signature_phrases) && style.signature_phrases.length > 0
          ? `- Unique phrases / sentence structures they reuse: ${style.signature_phrases.join(", ")}`
          : "";
        const langLine = style.language
          ? `- Reply language: ${style.language === "zh" ? "Traditional Chinese" : style.language === "en" ? "English" : style.language}`
          : "";
        const nameLine = style.addresses_by_name
          ? "- They address the reviewer by their first name (use [name] from the review's author field)."
          : "- They do NOT typically address the reviewer by name.";

        const styleSystem = `${systemPrompt}

IMPORTANT: This owner has a specific reply style learned from ${style._samples || valid.length} past real replies. Mirror it exactly:
- Tone: ${style.tone}
- Always starts with something like: ${style.common_opener || "(varies)"}
- Usually ends with something like: ${style.common_closer || "(varies)"}
- Average length: ${style.avg_length_words || 80} words
${nameLine}
${phrasesLine}
${langLine}
${style.summary ? `- Voice summary: ${style.summary}` : ""}

Write the reply in EXACTLY this voice. Do not invent a tone that doesn't match. Length should be close to the learned average.`;

        try {
          const yourStyle = await client.chat.completions
            .create({
              model: "gpt-4o-mini",
              max_tokens: 380,
              messages: [
                { role: "system", content: styleSystem },
                { role: "user", content: `New review to reply to:\n\nReviewer: ${review.reviewer_name || "Anonymous"}\nStars: ${review.stars}\nReview: "${review.content}"` },
              ],
            })
            .then((r) => r.choices[0].message.content.trim());
          replies.your_style = yourStyle;
          yourStyleStatus = "ready";
        } catch (e) {
          console.error("[generate-reply] your_style (structured) failed:", e.message);
          yourStyleStatus = "error";
        }
      } else if (valid.length >= MIN_STYLE_SAMPLES) {
        // Path 2 — few-shot fallback while ai_style_data is still being trained
        const examples = valid.slice(0, MAX_STYLE_SAMPLES).map((s, i) =>
          `Example ${i + 1}:\nReview (${s.stars}★): "${s.content}"\nOwner reply: "${s.actual_reply_text}"`
        ).join("\n\n");

        const styleSystem = `${systemPrompt}\n\nBelow are real examples of how you have personally replied to past reviews. Study the vocabulary, sentence rhythm, length, and tone, then write the new reply in the SAME voice — not a generic template.\n\n${examples}`;

        try {
          const yourStyle = await client.chat.completions
            .create({
              model: "gpt-4o-mini",
              max_tokens: 380,
              messages: [
                { role: "system", content: styleSystem },
                { role: "user", content: `Now reply to this new review in your own learned voice (matching the examples above):\n\nReview: "${review.content}"` },
              ],
            })
            .then((r) => r.choices[0].message.content.trim());
          replies.your_style = yourStyle;
          yourStyleStatus = "ready";
        } catch (e) {
          console.error("[generate-reply] your_style (few-shot) failed:", e.message);
          yourStyleStatus = "error";
        }

        // Flip the learned flag so the UI shows progress.
        if (!profile.ai_style_learned) {
          await supa.from("profiles").update({ ai_style_learned: true }).eq("id", profile.id);
        }
      } else {
        yourStyleStatus = "learning";
      }
    }

    return Response.json({ replies, your_style_status: yourStyleStatus });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
