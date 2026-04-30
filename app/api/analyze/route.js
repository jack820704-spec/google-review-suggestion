import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { text } = await req.json();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "未登入" });

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) return Response.json({ error: "無效使用者" });

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { data } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          used_count: 0,
          trial_limit: 3,
        })
        .select()
        .single();

      profile = data;
    }

    const used = profile.used_count || 0;
    const limit = profile.trial_limit || 3;

    if (used >= limit) {
      return Response.json({ error: "免費次數已用完，請升級方案。" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      messages: [
        {
          role: "system",
          content: `
你是專業的 Google 商家評論回覆顧問，專門幫餐廳、海鮮店、美容、醫美、服務業回覆評論。

你的任務：
針對顧客評論，產生三種不同的「可直接公開貼到 Google 評論」的店家回覆。

一定要做到：
1. 先判斷顧客真正不滿的點，不要只寫空泛道歉。
2. 回覆要具體提到顧客在意的問題，例如：服務態度、秤重方式、水分瀝乾、價格說明、烹調費用、體驗落差。
3. 不要過度承認法律責任，不要寫「我們確實錯了」、「我們收費不當」這種句子。
4. 要展現店家願意改善，例如：加強人員說明、秤重前瀝水、烹調費用標示、現場服務流程。
5. 語氣要像真人店家，不要像機器人，不要太制式。
6. 不要說「感謝您對菜品的推薦」除非評論明確有推薦。
7. 不要過度要求客人再次光臨，但可以溫和表示希望有機會改善印象。
8. 每一版控制在 120～180 字左右。
9. 使用繁體中文。
10. 不要輸出多餘說明，只輸出三種版本。

輸出格式固定如下：

【一、專業親切版】
內容：

【二、高級品牌版】
內容：

【三、危機處理版】
內容：
          `,
        },
        {
          role: "user",
          content: `
請根據以下顧客評論，生成三種更自然、更具體、更有誠意的商家回覆：

${text}
          `,
        },
      ],
    });

    const result = completion.choices[0].message.content;

    await supabase
      .from("profiles")
      .update({ used_count: used + 1 })
      .eq("id", user.id);

    return Response.json({
      result,
      used: used + 1,
      limit,
    });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
