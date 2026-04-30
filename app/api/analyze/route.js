import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {
  try {
    const { text } = await req.json()

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return Response.json({ error: '未登入' })

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) return Response.json({ error: '無效使用者' })

    // 取得 profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 沒有就建立
    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
        })
        .select()
        .single()

      profile = data
    }

    const used = profile.used_count || 0
    const limit = profile.trial_limit || 3

    if (used >= limit) {
      return Response.json({ error: '已達免費次數上限，請升級方案' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是專業客服，幫店家回覆Google評論',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    })

    const result = completion.choices[0].message.content

    await supabase
      .from('profiles')
      .update({ used_count: used + 1 })
      .eq('id', user.id)

    return Response.json({ result })
  } catch (err) {
    return Response.json({ error: err.message })
  }
}
