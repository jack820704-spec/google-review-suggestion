'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) return alert(error.message)
    alert('註冊成功，請登入')
  }

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return alert(error.message)
    setUser(data.user)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const generate = async () => {
    if (!input) return alert('請輸入評論')

    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert('請先登入')
      setLoading(false)
      return
    }

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text: input }),
    })

    const data = await res.json()

    if (data.error) {
      alert(data.error)
    } else {
      setResult(data.result)
    }

    setLoading(false)
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>會員登入 / 註冊</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="密碼"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button onClick={signIn}>登入</button>
        <button onClick={signUp}>註冊</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Google 評論建議系統</h2>

      <button onClick={logout}>登出</button>

      <br /><br />

      <textarea
        placeholder="貼上評論"
        rows={5}
        style={{ width: '100%' }}
        onChange={(e) => setInput(e.target.value)}
      />

      <br /><br />

      <button onClick={generate}>
        {loading ? '生成中...' : '產生回覆'}
      </button>

      <br /><br />

      <div>{result}</div>
    </div>
  )
}
