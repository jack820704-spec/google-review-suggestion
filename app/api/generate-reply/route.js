import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase-server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_MAP = { en: "English", zh: "Traditional Chinese", vi: "Vietnamese", fr: "French", es: "Spanish", ja: "Japanese" };

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

    return Response.json({ replies: { warm: warmReply, professional: professionalReply, brief: briefReply } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
