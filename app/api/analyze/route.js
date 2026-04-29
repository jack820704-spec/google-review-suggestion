import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { review, tone } = await req.json();

    if (!review) {
      return Response.json({ error: "請輸入評論內容" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `你是專業的 Google 商家評論回覆顧問。

請用繁體中文分析以下評論，並依照「${tone || "專業親切"}」語氣產生內容。

請輸出：
1. 評論情緒：好評 / 中立 / 負評
2. 風險等級：低 / 中 / 高
3. 建議公開回覆：
4. 店家改善建議：

要求：
- 回覆要自然，不要像機器人
- 不要過度承認法律責任
- 適合直接貼到 Google 評論回覆
- 負評要有安撫、道歉、改善承諾
- 好評要感謝並邀請下次再來

評論：
${review}`,
    });

    return Response.json({ result: response.output_text });
  } catch (error) {
    return Response.json(
      { error: "AI分析失敗，請確認 API Key 或額度" },
      { status: 500 }
    );
  }
}
