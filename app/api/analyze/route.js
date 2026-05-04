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
    const { text, lang } = await req.json();

    /* ===== 驗證登入 ===== */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "未登入" });

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) return Response.json({ error: "無效使用者" });

    /* ===== 讀取 / 建立 profile ===== */
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
      return Response.json({
        error: "免費次數已用完，請升級方案。",
      });
    }

    /* ===== 語言設定 ===== */
    const langMap = {
      zh: "繁體中文",
      en: "English",
      vi: "Vietnamese",
    };

    const outputLang = langMap[lang] || "繁體中文";

    /* ===== AI 回覆 ===== */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `
你是專業的 Google 商家評論回覆顧問。

請使用 ${outputLang} 回覆。

你的任務是：
針對顧客評論，產生三種「完全不同角度」的回覆。

===== 規則 =====

1. 一定要針對評論內容回覆，不可罐頭
2. 要抓出顧客不滿點（服務、價格、態度、等待、品質）
3. 回覆要自然像真人，不要像機器
4. 不要過度承認錯誤（避免法律風險）
5. 不要跟客人爭辯
6. 不要三段寫一樣內容
7. 每一段用詞、開頭、結尾都要不同

===== 三種回覆 =====

【一、專業親切版】
- 一般客服角度
- 親切自然
- 接住情緒 + 說明改善

【二、高級品牌版】
- 品牌形象角度
- 用詞較精緻
- 強調流程與品質

【三、危機處理版】
- 降低衝突
- 穩住負評
- 語氣冷靜誠懇

===== 輸出格式 =====

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
          content: text,
        },
      ],
    });

    const result = completion.choices[0].message.content;

    /* ===== 更新使用次數 ===== */
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
