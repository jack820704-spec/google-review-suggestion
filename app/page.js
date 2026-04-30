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

  return (
    <main style={pageBg}>
      <div style={container}>
        <section style={hero}>
          <div style={badge}>ReviewReply Pro</div>

          <h1 style={heroTitle}>
            用 AI 幫商家快速產生 Google 評論回覆
          </h1>

          <p style={heroText}>
            貼上顧客評論，系統會立即產生自然、專業、適合公開回覆的建議文字。
            適合餐廳、美容、醫美、服務業與重視 Google 評價的商家。
          </p>

          <div style={heroStats}>
            <div style={statBox}>
              <b>3 次</b>
              <span>免費試用</span>
            </div>
            <div style={statBox}>
              <b>AI</b>
              <span>自動建議回覆</span>
            </div>
            <div style={statBox}>
              <b>24H</b>
              <span>快速處理負評</span>
            </div>
          </div>
        </section>

        {!user ? (
          <section style={splitSection}>
            <div style={leftCard}>
              <h2 style={sectionTitle}>為什麼商家需要這套系統？</h2>

              <div style={featureItem}>
                <span>01</span>
                <div>
                  <b>節省回覆時間</b>
                  <p>不用再想半天怎麼回評論，貼上內容就能產生建議。</p>
                </div>
              </div>

              <div style={featureItem}>
                <span>02</span>
                <div>
                  <b>降低負評傷害</b>
                  <p>針對負評產生有禮貌、能安撫顧客的公開回覆。</p>
                </div>
              </div>

              <div style={featureItem}>
                <span>03</span>
                <div>
                  <b>提升品牌形象</b>
                  <p>讓每一則 Google 評論都被專業處理。</p>
                </div>
              </div>
            </div>

            <div style={authCard}>
              <h2 style={authTitle}>開始免費試用</h2>
              <p style={authDesc}>註冊後即可免費使用 3 次。</p>

              <input
                style={inputStyle}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                style={inputStyle}
                type="password"
                placeholder="密碼"
                onChange={(e) => setPassword(e.target.value)}
              />

              <button style={primaryButton} onClick={signIn}>
                登入
              </button>

              <button style={secondaryButton} onClick={signUp}>
                免費註冊
              </button>

              <p style={noteText}>
                適合先測試商家回覆流程，之後可升級成自動抓評論版本。
              </p>
            </div>
          </section>
        ) : (
          <section style={appCard}>
            <div style={topBar}>
              <div>
                <div style={badge}>ReviewReply Pro</div>
                <h2 style={appTitle}>Google 評論建議系統</h2>
                <p style={loginInfo}>登入帳號：{user.email}</p>
                <p style={remainText}>
                  剩餘試用：{Math.max(limit - used, 0)} 次
                </p>
              </div>

              <button style={logoutButton} onClick={logout}>
                登出
              </button>
            </div>

            <textarea
              style={textareaStyle}
              rows={6}
              placeholder="貼上顧客評論，例如：服務很好，但是等候時間有點久。"
              onChange={(e) => setReview(e.target.value)}
            />

            <button style={primaryButton} onClick={generate}>
              {loading ? "生成中..." : "產生回覆建議"}
            </button>

            {result && (
              <div style={resultBox}>
                <strong>建議結果：</strong>
                <br />
                <br />
                {result}
              </div>
            )}
          </section>
        )}

        <section style={pricingBox}>
          <div style={planCard}>
            <h3>基本方案</h3>
            <p style={price}>NT$499/月</p>
            <p>每月 100 則評論建議，適合小店家。</p>
          </div>

          <div style={planCard}>
            <h3>專業方案</h3>
            <p style={price}>NT$999/月</p>
            <p>每月 500 則評論建議，適合餐廳、美容、醫美。</p>
          </div>

          <div style={planCard}>
            <h3>企業方案</h3>
            <p style={price}>客製報價</p>
            <p>多分店、週報、負評提醒、自動化串接。</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageBg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #38bdf8 0%, #1e3a8a 35%, #020617 85%)",
  padding: 24,
  fontFamily: "Arial, sans-serif",
};

const container = {
  maxWidth: 1120,
  margin: "0 auto",
};

const hero = {
  background: "rgba(255,255,255,0.96)",
  borderRadius: 34,
  padding: 36,
  boxShadow: "0 35px 90px rgba(2,6,23,0.35)",
  marginBottom: 22,
};

const badge = {
  display: "inline-block",
  background: "linear-gradient(135deg,#0284c7,#2563eb)",
  color: "white",
  padding: "9px 16px",
  borderRadius: 999,
  fontWeight: 900,
  marginBottom: 16,
};

const heroTitle = {
  fontSize: 46,
  fontWeight: 900,
  margin: "8px 0",
  color: "#0f172a",
  letterSpacing: "-1px",
};

const heroText = {
  fontSize: 18,
  color: "#475569",
  lineHeight: 1.8,
  maxWidth: 760,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 24,
};

const statBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const splitSection = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 22,
  marginBottom: 22,
};

const leftCard = {
  background: "rgba(255,255,255,0.96)",
  borderRadius: 30,
  padding: 30,
  boxShadow: "0 25px 70px rgba(2,6,23,0.3)",
};

const authCard = {
  background: "rgba(255,255,255,0.98)",
  borderRadius: 30,
  padding: 30,
  boxShadow: "0 25px 70px rgba(2,6,23,0.3)",
};

const sectionTitle = {
  fontSize: 30,
  margin: "0 0 20px",
  color: "#0f172a",
};

const featureItem = {
  display: "flex",
  gap: 16,
  padding: "16px 0",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
};

const authTitle = {
  fontSize: 28,
  margin: "0 0 8px",
};

const authDesc = {
  color: "#64748b",
};

const inputStyle = {
  width: "100%",
  padding: 15,
  marginTop: 12,
  fontSize: 16,
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
};

const primaryButton = {
  width: "100%",
  marginTop: 16,
  padding: 16,
  fontSize: 17,
  fontWeight: 900,
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg,#0284c7,#2563eb)",
  color: "white",
  cursor: "pointer",
};

const secondaryButton = {
  width: "100%",
  marginTop: 12,
  padding: 15,
  fontSize: 16,
  fontWeight: 900,
  borderRadius: 16,
  border: "1px solid #2563eb",
  background: "white",
  color: "#2563eb",
  cursor: "pointer",
};

const noteText = {
  marginTop: 14,
  color: "#64748b",
  fontSize: 14,
};

const appCard = {
  background: "rgba(255,255,255,0.97)",
  borderRadius: 32,
  padding: 32,
  boxShadow: "0 35px 90px rgba(2,6,23,0.35)",
  marginBottom: 22,
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const appTitle = {
  fontSize: 36,
  margin: "8px 0",
  fontWeight: 900,
};

const loginInfo = {
  color: "#475569",
};

const remainText = {
  color: "#2563eb",
  fontWeight: 900,
};

const logoutButton = {
  padding: "12px 18px",
  borderRadius: 14,
  border: "none",
  background: "#020617",
  color: "white",
  fontWeight: 900,
  height: 45,
};

const textareaStyle = {
  width: "100%",
  marginTop: 24,
  padding: 18,
  fontSize: 16,
  borderRadius: 20,
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  resize: "vertical",
};

const resultBox = {
  marginTop: 24,
  padding: 22,
  background: "#f8fafc",
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  whiteSpace: "pre-wrap",
  lineHeight: 1.8,
};

const pricingBox = {
  marginTop: 24,
  display: "grid",
  gap: 16,
};

const planCard = {
  background: "rgba(255,255,255,0.96)",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
};

const price = {
  fontSize: 24,
  fontWeight: 900,
  color: "#1d4ed8",
};
