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
  const [copied, setCopied] = useState(false);

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
    if (!email || !password) return alert("請輸入 Email 和密碼");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    alert("註冊成功，請登入");
  }

  async function signIn() {
    if (!email || !password) return alert("請輸入 Email 和密碼");

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
    setReview("");
    setResult("");
  }

  async function generate() {
    if (!review.trim()) return alert("請輸入評論");

    setLoading(true);
    setCopied(false);

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
      setUsed(data.used || used);
      setLimit(data.limit || limit);
    }

    setLoading(false);
  }

  async function copyText() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
  }

  const remaining = Math.max(limit - used, 0);

  if (!user) {
    return (
      <main style={bg}>
        <div style={header}>
          <div style={brand}>ReviewReply Pro</div>
          <div style={tag}>Google 評論回覆建議系統</div>
        </div>

        <div style={split}>
          <section style={left}>
            <div style={pill}>免費試用 3 次｜適合店家立即測試</div>

            <h1 style={title}>
              讓每一則評論回覆，
              <br />
              都提升顧客對你的好感與信任
            </h1>

            <p style={subtitle}>
              貼上顧客評論，系統會直接提供三種不同回應方式：
              專業親切、高級品牌、危機處理。
              幫助商家快速處理好評、普通評論與負面評論。
            </p>

            <div style={featureGrid}>
              <div style={featureCard}>
                <b>專業親切</b>
                <p>適合大多數日常評論，回覆自然、有禮貌。</p>
              </div>

              <div style={featureCard}>
                <b>高級品牌</b>
                <p>適合醫美、精品、餐飲品牌，提升質感形象。</p>
              </div>

              <div style={featureCard}>
                <b>危機處理</b>
                <p>面對負評也能得體回應，降低評論傷害。</p>
              </div>

              <div style={featureCard}>
                <b>提升效率</b>
                <p>不用反覆想文案，貼上評論即可產生三種版本。</p>
              </div>
            </div>

            <p style={goldText}>現在開始免費試用，立即體驗差別。</p>
          </section>

          <section style={authCard}>
            <h2 style={authTitle}>開始免費試用</h2>
            <p style={authDesc}>建立帳號後即可獲得 3 次免費回覆建議。</p>

            <input
              style={input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={input}
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={btnGold} onClick={signIn}>
              登入
            </button>

            <button style={btnOutline} onClick={signUp}>
              免費註冊
            </button>

            <div style={authNote}>
              不用信用卡，註冊即可試用。
              <br />
              每次產生會一次給你三種不同回應方式。
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={bg}>
      <div style={appShell}>
        <div style={topBar}>
          <div>
            <div style={brand}>ReviewReply Pro</div>
            <h1 style={appTitle}>評論回覆建議系統</h1>
            <p style={userText}>登入帳號：{user.email}</p>
          </div>

          <button style={logoutBtn} onClick={logout}>
            登出
          </button>
        </div>

        <div style={usageBox}>
          <div style={miniBox}>
            <b>免費試用剩餘</b>
            <p>{remaining} 次</p>
          </div>

          <div style={miniBox}>
            <b>本次輸出</b>
            <p>三種回應方式</p>
          </div>

          <div style={miniBox}>
            <b>目前方案</b>
            <p>Free Trial</p>
          </div>
        </div>

        <label style={label}>貼上顧客評論</label>
        <textarea
          style={textarea}
          rows={7}
          value={review}
          placeholder="例如：服務不錯，但等太久，希望下次能改善。"
          onChange={(e) => setReview(e.target.value)}
        />

        <button style={btnGold} onClick={generate}>
          {loading ? "生成中..." : "產生三種回覆建議"}
        </button>

        {result && (
          <div style={resultBox}>
            <div style={resultHead}>
              <b>三種不同回應方式</b>
              <button style={copyBtn} onClick={copyText}>
                {copied ? "已複製" : "一鍵複製"}
              </button>
            </div>

            <div style={resultText}>{result}</div>
          </div>
        )}

        <div style={plans}>
          <div style={plan}>
            <h3>基本方案</h3>
            <b>NT$499/月</b>
            <p>每月 100 則評論建議，適合小型店家。</p>
          </div>

          <div style={planHot}>
            <h3>專業方案</h3>
            <b>NT$999/月</b>
            <p>每月 500 則評論建議，適合餐廳、美容、醫美。</p>
          </div>

          <div style={plan}>
            <h3>企業方案</h3>
            <b>客製報價</b>
            <p>多分店、週報、負評提醒與自動化串接。</p>
          </div>
        </div>
      </div>
    </main>
  );
}

const bg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 20%, rgba(212,175,55,0.18), transparent 28%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06), transparent 25%), linear-gradient(135deg,#030303 0%,#0b0b0b 45%,#000 100%)",
  color: "#fff",
  padding: "50px 90px",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const header = {
  maxWidth: 1280,
  margin: "0 auto 50px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brand = {
  display: "inline-block",
  color: "#000",
  background: "linear-gradient(135deg,#f7d774,#d4af37)",
  padding: "10px 18px",
  borderRadius: 999,
  fontWeight: 900,
};

const tag = {
  color: "#aaa",
  fontWeight: 700,
};

const split = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.15fr 430px",
  gap: 80,
  alignItems: "center",
};

const left = {};

const pill = {
  display: "inline-block",
  border: "1px solid rgba(212,175,55,0.4)",
  color: "#d4af37",
  padding: "9px 14px",
  borderRadius: 999,
  marginBottom: 22,
  fontWeight: 800,
};

const title = {
  fontSize: 48,
  lineHeight: 1.25,
  color: "#d4af37",
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-1px",
};

const subtitle = {
  marginTop: 28,
  maxWidth: 760,
  color: "#ddd",
  fontSize: 18,
  lineHeight: 1.9,
  fontWeight: 600,
};

const featureGrid = {
  marginTop: 34,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: 16,
};

const featureCard = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 18,
  color: "#ccc",
};

const goldText = {
  marginTop: 28,
  color: "#d4af37",
  fontSize: 18,
  fontWeight: 900,
};

const authCard = {
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 26,
  padding: 42,
  boxShadow: "0 0 80px rgba(0,0,0,0.7)",
};

const authTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
};

const authDesc = {
  color: "#aaa",
  marginBottom: 24,
};

const input = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 12,
  border: "none",
  marginBottom: 14,
  fontSize: 16,
  boxSizing: "border-box",
};

const btnGold = {
  width: "100%",
  padding: 17,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#f8dc75,#d4af37)",
  color: "#000",
  fontSize: 16,
  fontWeight: 900,
  marginTop: 10,
  cursor: "pointer",
};

const btnOutline = {
  width: "100%",
  padding: 15,
  borderRadius: 12,
  border: "1px solid #d4af37",
  background: "transparent",
  color: "#d4af37",
  fontSize: 16,
  fontWeight: 900,
  marginTop: 14,
  cursor: "pointer",
};

const authNote = {
  marginTop: 20,
  color: "#999",
  lineHeight: 1.7,
  fontSize: 14,
};

const appShell = {
  maxWidth: 980,
  margin: "0 auto",
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 28,
  padding: 42,
  boxShadow: "0 0 80px rgba(0,0,0,0.7)",
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
  fontSize: 36,
};

const userText = {
  color: "#bbb",
};

const logoutBtn = {
  background: "#171717",
  color: "#fff",
  border: "1px solid #333",
  padding: "12px 18px",
  borderRadius: 12,
  cursor: "pointer",
};

const usageBox = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 14,
};

const miniBox = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 16,
};

const label = {
  display: "block",
  marginTop: 24,
  marginBottom: 8,
  color: "#d4af37",
  fontWeight: 900,
};

const textarea = {
  width: "100%",
  padding: 18,
  borderRadius: 14,
  border: "none",
  fontSize: 16,
  boxSizing: "border-box",
};

const resultBox = {
  marginTop: 28,
  background: "#050505",
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 18,
  padding: 22,
};

const resultHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const copyBtn = {
  background: "#d4af37",
  color: "#000",
  border: "none",
  padding: "9px 14px",
  borderRadius: 10,
  fontWeight: 900,
};

const resultText = {
  marginTop: 18,
  whiteSpace: "pre-wrap",
  lineHeight: 1.9,
  color: "#ddd",
};

const plans = {
  marginTop: 32,
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 16,
};

const plan = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 20,
};

const planHot = {
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.38)",
  borderRadius: 18,
  padding: 20,
};
