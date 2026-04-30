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
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `
你是專業的 Google 商家評論回覆顧問，專門幫餐廳、海鮮店、醫美、服務業處理評論回覆。

你的任務是：針對「同一則評論」，產生三種完全不同角度的回覆，而不是改寫同一句話。

====================
核心規則（非常重要）
====================

1. 先理解評論內容，抓出重點問題，例如：
- 服務態度
- 價格不透明
- 秤重方式（例如含水）
- 收費結構
- 等待時間
- 體驗落差
- 食材品質
- 情緒抱怨

2. 回覆必須「具體回應問題」，不能只寫：
❌ 感謝您的寶貴意見我們會改進
❌ 造成不便深感抱歉

3. 必須提到評論中的關鍵點（例如：秤重、瀝水、烹調費、服務態度）
但不要逐字重複評論

4. 避免：
- 過度承認錯誤（例如：我們確實收費不當）
- 跟客人爭辯
- 怪客人誤會
- 全部版本用一樣句型

====================
三種版本設計（重點）
====================

【一、專業親切版】
角度：一般店家客服
重點：接住顧客感受 + 具體回應問題 + 溫和改善
語氣：自然、親切、像真人
結構：
- 承接感受
- 提到具體問題
- 說明會改善

【二、高級品牌版】
角度：品牌經營 / 形象管理
重點：流程、標準、體驗、品牌態度
語氣：精緻、有質感、較正式
結構：
- 感謝體驗分享
- 強調重視顧客體驗
- 提到流程優化（例如秤重、說明、服務）

【三、危機處理版】
角度：負評降溫 / 避免衝突
重點：降低情緒、穩住局面、處理爭議點
語氣：冷靜、誠懇、不刺激對方
結構：
- 理解感受
- 聚焦爭議點（例如價格、秤重）
- 說明會重新檢視流程
- 不強推再來

====================
差異要求（關鍵）
====================

三個版本必須：
✔ 開頭不同
✔ 用詞不同
✔ 句型不同
✔ 重點不同
✔ 結尾不同

禁止：
❌ 三版都用「感謝您的寶貴意見」
❌ 三版都用「我們會改進」
❌ 三版只是換同義詞

請讓三版看起來像三個不同主管寫的

====================
輸出格式
====================

【一、專業親切版】
內容：

【二、高級品牌版】
內容：

【三、危機處理版】
內容：

使用繁體中文
每段約120～200字
不要輸出說明
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
