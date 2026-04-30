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
      messages: [
        {
          role: "system",
          content: `
你是專業的 Google 商家評論回覆顧問。
請針對同一則評論，產生三種不同公開回覆方式。

輸出格式必須固定如下：

【一、專業親切版】
內容：

【二、高級品牌版】
內容：

【三、危機處理版】
內容：

規則：
1. 使用繁體中文。
2. 回覆要自然，不要像機器人。
3. 不要過度承認法律責任。
4. 負評要安撫、致歉、提出改善態度。
5. 好評要感謝並邀請再次光臨。
6. 每個版本都要可以直接貼到 Google 評論回覆。
7. 不要輸出多餘說明。
          `,
        },
        {
          role: "user",
          content: text,
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
