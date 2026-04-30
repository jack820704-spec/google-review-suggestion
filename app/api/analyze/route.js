import OpenAI from "openai";

export async function POST(req) {
  try {
    const { text } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你是專業的Google評論回覆助手",
        },
        {
          role: "user",
          content: `幫我回覆這則評論：${text}`,
        },
      ],
    });

    return Response.json({
      result: response.choices[0].message.content,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
