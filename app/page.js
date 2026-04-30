"use client";

import { useEffect, useState } from "react";
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
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("註冊成功");
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

    const { data: { session } } = await supabase.auth.getSession();

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

  return (
    <main style={bg}>
      <div style={container}>
        {!user ? (
          <div style={split}>
            {/* 左 */}
            <div>
              <h1 style={title}>
                讓每一則評論回覆，
                <br />
                都提升顧客對你的好感與信任
              </h1>

              <p style={subtitle}>
                貼上顧客評論，立即產生專業回覆建議，
                幫助提升品牌形象與顧客回訪率。
              </p>

              <div style={features}>
                <p>✓ 提高顧客再次上門意願</p>
                <p>✓ 負評轉為加分回應</p>
                <p>✓ 節省客服時間</p>
                <p>✓ 適用餐廳、美容、醫美</p>
              </div>

              <p style={cta}>立即免費試用</p>
            </div>

            {/* 右 */}
            <div style={card}>
              <h2 style={authTitle}>開始免費試用</h2>

              <input
                style={input}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                style={input}
                type="password"
                placeholder="密碼"
                onChange={(e) => setPassword(e.target.value)}
              />

              <button style={btnGold} onClick={signIn}>登入</button>
              <button style={btnOutline} onClick={signUp}>免費註冊</button>

              <p style={note}>免費試用 3 次</p>
            </div>
          </div>
        ) : (
          <div style={card}>
            <p style={remain}>剩餘試用：{Math.max(limit - used, 0)} 次</p>

            <button onClick={logout}>登出</button>

            <textarea
              style={textarea}
              rows={6}
              placeholder="貼上評論..."
              onChange={(e) => setReview(e.target.value)}
            />

            <button style={btnGold} onClick={generate}>
              {loading ? "生成中..." : "產生回覆"}
            </button>

            {result && <div style={result}>{result}</div>}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== 放大關鍵 ===== */

const bg = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #0a0a0a, #000)",
  padding: "60px 80px",
  color: "#fff",
};

const container = {
  width: "100%",
};

const split = {
  display: "grid",
  gridTemplateColumns: "1.4fr 520px", // 🔥 放大關鍵
  gap: 80,
  alignItems: "center",
};

const title = {
  fontSize: 60, // 🔥 大標升級
  fontWeight: "bold",
  color: "#d4af37",
  lineHeight: 1.2,
};

const subtitle = {
  marginTop: 20,
  fontSize: 20,
  color: "#bbb",
};

const features = {
  marginTop: 30,
  fontSize: 18,
  lineHeight: 2.2,
  color: "#aaa",
};

const cta = {
  marginTop: 30,
  fontSize: 20,
  color: "#d4af37",
  fontWeight: "bold",
};

const card = {
  background: "#111",
  padding: 40,
  borderRadius: 20,
  boxShadow: "0 0 40px rgba(0,0,0,0.6)",
};

const authTitle = {
  fontSize: 24,
  marginBottom: 20,
};

const input = {
  width: "100%",
  padding: 16,
  fontSize: 16,
  marginBottom: 15,
  borderRadius: 10,
};

const btnGold = {
  width: "100%",
  padding: 18,
  fontSize: 16,
  background: "#d4af37",
  color: "#000",
  fontWeight: "bold",
  borderRadius: 10,
  marginTop: 10,
};

const btnOutline = {
  width: "100%",
  padding: 16,
  border: "1px solid #d4af37",
  color: "#d4af37",
  background: "transparent",
  borderRadius: 10,
  marginTop: 10,
};

const note = {
  marginTop: 10,
  fontSize: 14,
  color: "#777",
};

const textarea = {
  width: "100%",
  marginTop: 20,
  padding: 16,
  borderRadius: 10,
};

const result = {
  marginTop: 20,
  padding: 15,
  background: "#000",
  borderRadius: 10,
};

const remain = {
  color: "#d4af37",
};
