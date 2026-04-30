"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [review, setReview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(3);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user || null);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return alert(error.message);
    alert("註冊成功");
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return alert(error.message);
    setUser(data.user);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function generate() {
    if (!review) return alert("請輸入評論");

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text: review }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      setResult(data.result);
      setUsed(data.used);
      setLimit(data.limit);
    }

    setLoading(false);
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>會員登入 / 註冊</h2>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <br /><br />
        <input type="password" placeholder="密碼" onChange={(e) => setPassword(e.target.value)} />
        <br /><br />
        <button onClick={signIn}>登入</button>
        <button onClick={signUp}>註冊</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Google 評論建議系統</h2>

      <p>剩餘試用：{limit - used} 次</p>

      <button onClick={logout}>登出</button>

      <br /><br />

      <textarea
        rows={5}
        style={{ width: "100%" }}
        placeholder="貼上評論"
        onChange={(e) => setReview(e.target.value)}
      />

      <br /><br />

      <button onClick={generate}>
        {loading ? "生成中..." : "產生回覆"}
      </button>

      <br /><br />

      <div>{result}</div>
    </div>
  );
}
