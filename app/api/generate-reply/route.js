import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase-server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_MAP = { en: "English", zh: "Traditional Chinese", vi: "Vietnamese", fr: "French", es: "Spanish", ja: "Japanese" };

const MIN_STYLE_SAMPLES = 3;
const MAX_STYLE_SAMPLES = 10;

export async function POST(req) {
  try {
    const { review, profile, lang } = await req.json();
    if (!review || !profile) return Response.json({ error: "Missing data" }, { status: 400 });

    const outputLang = LANG_MAP[lang] || "English";
    const restaurantCtx = `${profile.restaurant_name || "our restaurant"}, a ${profile.restaurant_type || "restaurant"} in ${profile.city || "our city"}, ${profile.country || ""}`;

    const systemPrompt = `You are the owner of ${restaurantCtx}.
Write a reply as if you personally read this review tonight after closing.
Sound genuine, warm, and specific to what the reviewer mentioned.
Never use corporate PR language. Use first person naturally.
For positive reviews: thank them genuinely and reference a specific detail they mentioned.
For negative reviews: apologize sincerely without excuses, acknowledge the specific issue, promise improvement, invite direct contact.
Keep each reply to 60-100 words.
Write in ${outputLang}.`;

    const STYLES = {
      warm: "Write in a Warm & Personal style — like the owner personally read this tonight. Casual, genuine, specific to their experience.",
      professional: "Write in a Professional & Gracious style — polished, elegant, refined brand voice.",
      brief: "Write in a Brief & Direct style — 2-3 short sentences only. Punchy and impactful.",
    };

    const [warmReply, professionalReply, briefReply] = await Promise.all(
      Object.entries(STYLES).map(([, styleInstruction]) =>
        client.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Review: "${review.content}"\n\n${styleInstruction}` },
          ],
        }).then((r) => r.choices[0].message.content.trim())
      )
    );

    const replies = { warm: warmReply, professional: professionalReply, brief: briefReply };
    let yourStyleStatus = null;

    // Pro plan only: generate a 4th "Your Style" reply learned from past replies.
    if (profile.plan === "pro" && profile.id) {
      const supa = createServiceClient();
      const { data: samples } = await supa
        .from("reviews")
        .select("content, stars, reply_text")
        .eq("user_id", profile.id)
        .eq("replied", true)
        .not("reply_text", "is", null)
        .order("review_date", { ascending: false })
        .limit(MAX_STYLE_SAMPLES);

      const valid = (samples || []).filter((s) => s.reply_text && s.reply_text.trim().length > 20);

      if (valid.length >= MIN_STYLE_SAMPLES) {
        const examples = valid.slice(0, MAX_STYLE_SAMPLES).map((s, i) =>
          `Example ${i + 1}:\nReview (${s.stars}★): "${s.content}"\nYour reply: "${s.reply_text}"`
        ).join("\n\n");

        const styleSystem = `${systemPrompt}\n\nBelow are real examples of how you have personally replied to past reviews. Study the vocabulary, sentence rhythm, length, and tone, and write the new reply in the SAME voice — not a generic template.\n\n${examples}`;

        const yourStyle = await client.chat.completions
          .create({
            model: "gpt-4o-mini",
            max_tokens: 320,
            messages: [
              { role: "system", content: styleSystem },
              { role: "user", content: `Now reply to this new review in your own learned voice (matching the examples above):\n\nReview: "${review.content}"` },
            ],
          })
          .then((r) => r.choices[0].message.content.trim());

        replies.your_style = yourStyle;
        yourStyleStatus = "ready";

        // Flip the learned flag once we have enough samples.
        if (!profile.ai_style_learned) {
          await supa.from("profiles").update({ ai_style_learned: true }).eq("id", profile.id);
        }
      } else {
        yourStyleStatus = "learning";
      }
    }

    return Response.json({ replies, your_style_status: yourStyleStatus, samples_have: undefined });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
