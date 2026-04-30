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
    alert("註冊成功，請登入");
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

    if (!session) {
      alert("請先登入");
      setLoading(false);
      return;
    }

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
      <main style={bg}>
        <div style={split}>
          <section style={left}>
            <h1 style={title}>
              讓每一則評論回覆，
              <br />
              都提升顧客對你的好感與信任
            </h1>

            <p style={subtitle}>
              貼上顧客評論，立即產生自然、專業、可公開使用的回覆建議，
              <br />
              幫助商家提升品牌形象與回訪率。
            </p>

            <div style={features}>
              <p>✓ 用專業回覆，提高顧客再次上門意願</p>
              <p>✓ 讓負面評論也能變成加分的回應</p>
              <p>✓ 節省客服時間，提高營運效率</p>
              <p>✓ 適用餐廳、美容、醫美與服務業</p>
            </div>

            <p style={cta}>現在開始免費試用，體驗差別</p>
          </section>

          <section style={card}>
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

            <button style={btnGold} onClick={signIn}>
              登入
            </button>

            <button style={btnOutline} onClick={signUp}>
              免費註冊
            </button>

            <p style={note}>免費試用 3 次</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={bg}>
      <section style={appCard}>
        <div style={topBar}>
          <div>
            <h1 style={appTitle}>評論回覆建議系統</h1>
            <p style={userText}>登入帳號：{user.email}</p>
            <p style={remain}>剩餘試用：{Math.max(limit - used, 0)} 次</p>
          </div>

          <button onClick={logout} style={logoutBtn}>
            登出
          </button>
        </div>

        <textarea
          style={textarea}
          rows={6}
          placeholder="貼上顧客評論..."
          onChange={(e) => setReview(e.target.value)}
        />

        <button style={btnGold} onClick={generate}>
          {loading ? "生成中..." : "產生回覆建議"}
        </button>

        {result && <div style={resultBox}>{result}</div>}
      </section>
    </main>
  );
}

const bg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 50% 20%, rgba(212,175,55,0.08), transparent 30%), linear-gradient(135deg, #050505 0%, #0b0b0b 45%, #000 100%)",
  color: "#fff",
  padding: "72px 120px",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const split = {
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.1fr 430px",
  gap: 90,
  alignItems: "center",
};

const left = {
  paddingTop: 10,
};

const title = {
  fontSize: 42,
  fontWeight: 900,
  color: "#d4af37",
  lineHeight: 1.35,
  margin: 0,
};

const subtitle = {
  marginTop: 30,
  color: "#d7d7d7",
  fontSize: 17,
  lineHeight: 1.9,
  fontWeight: 600,
};

const features = {
  marginTop: 38,
  color: "#d0d0d0",
  fontSize: 16,
  lineHeight: 2.45,
  fontWeight: 600,
};

const cta = {
  marginTop: 30,
  color: "#d4af37",
  fontSize: 17,
  fontWeight: 900,
};

const card = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  padding: 42,
  borderRadius: 22,
  boxShadow: "0 0 70px rgba(255,255,255,0.08)",
  border: "1px solid rgba(212,175,55,0.08)",
};

const authTitle = {
  fontSize: 26,
  margin: "0 0 26px",
  fontWeight: 900,
};

const input = {
  width: "100%",
  padding: "16px 18px",
  marginBottom: 16,
  borderRadius: 10,
  border: "none",
  fontSize: 16,
  boxSizing: "border-box",
  background: "#f7f7f7",
};

const btnGold = {
  width: "100%",
  padding: 17,
  background: "linear-gradient(135deg, #f6d365 0%, #d4af37 100%)",
  color: "#000",
  fontWeight: 900,
  borderRadius: 10,
  border: "none",
  marginTop: 10,
  fontSize: 16,
  cursor: "pointer",
};

const btnOutline = {
  width: "100%",
  padding: 15,
  border: "1px solid #d4af37",
  background: "transparent",
  color: "#d4af37",
  fontWeight: 900,
  borderRadius: 10,
  marginTop: 14,
  fontSize: 16,
  cursor: "pointer",
};

const note = {
  marginTop: 18,
  fontSize: 14,
  color: "#a7a7a7",
};

const appCard = {
  maxWidth: 900,
  margin: "0 auto",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  padding: 42,
  borderRadius: 22,
  border: "1px solid rgba(212,175,55,0.08)",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const appTitle = {
  color: "#d4af37",
  margin: 0,
  fontSize: 34,
};

const userText = {
  color: "#ccc",
};

const remain = {
  color: "#d4af37",
  fontWeight: 900,
};

const logoutBtn = {
  padding: "12px 18px",
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 10,
  cursor: "pointer",
};

const textarea = {
  width: "100%",
  marginTop: 24,
  padding: 16,
  borderRadius: 12,
  border: "none",
  fontSize: 16,
  boxSizing: "border-box",
};

const resultBox = {
  marginTop: 24,
  padding: 20,
  background: "#000",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.18)",
  whiteSpace: "pre-wrap",
  lineHeight: 1.8,
};
