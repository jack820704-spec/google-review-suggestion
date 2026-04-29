import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { review } = await req.json();

    if (!review) {
      return Response.json({ error: "請輸入評論內容" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `你是商家Google評論回覆助理。
請用繁體中文分析以下評論，輸出：
1. 情緒：好評/中立/負評
2. 風險等級：低/中/高
3. 建議公開回覆
4. 店家改善建議

評論：
${review}`,
    });

    return Response.json({ result: response.output_text });
  } catch (error) {
    return Response.json({ error: "AI分析失敗，請確認 API Key 或額度" }, { status: 500 });
  }
}
