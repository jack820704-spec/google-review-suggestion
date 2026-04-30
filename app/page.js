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
    <main style={bg}>
      <div style={container}>
        {!user ? (
          <div style={split}>
            {/* 左側文宣 */}
            <div>
              <h1 style={title}>
                讓每一則評論回覆，
                <br />
                都提升顧客對你的好感與信任
              </h1>

              <p style={subtitle}>
                貼上顧客評論，立即產生自然、專業、可公開使用的回覆建議，
                幫助提升品牌形象與顧客回訪率。
              </p>

              <div style={features}>
                <p>✓ 提高顧客再次上門意願</p>
                <p>✓ 負評轉為加分回應</p>
                <p>✓ 節省客服時間</p>
                <p>✓ 適用餐廳、美容、醫美等服務業</p>
              </div>

              <p style={cta}>立即開始免費試用</p>
            </div>

            {/* 右側登入卡片 */}
            <div style={card}>
              <h2 style={{ marginBottom: 20 }}>開始免費試用</h2>

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
            </div>
          </div>
        ) : (
          <div style={card}>
            <p style={remain}>
              剩餘試用：{Math.max(limit - used, 0)} 次
            </p>

            <button onClick={logout} style={logoutBtn}>
              登出
            </button>

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
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== 樣式 ===== */

const bg = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #0a0a0a, #000)",
  padding: 40,
  fontFamily: "Arial",
  color: "#fff",
};

const container = {
  maxWidth: 1100,
  margin: "0 auto",
};

const split = {
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: 50,
  alignItems: "center",
};

const title = {
  fontSize: 42,
  fontWeight: "bold",
  color: "#d4af37",
  lineHeight: 1.3,
};

const subtitle = {
  marginTop: 15,
  color: "#bbb",
};

const features = {
  marginTop: 25,
  lineHeight: 2,
  color: "#aaa",
};

const cta = {
  marginTop: 20,
  color: "#d4af37",
  fontWeight: "bold",
};

const card = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: 30,
  borderRadius: 20,
  boxShadow: "0 0 40px rgba(0,0,0,0.6)",
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: "none",
};

const btnGold = {
  width: "100%",
  padding: 14,
  background: "linear-gradient(135deg,#d4af37,#f5d76e)",
  color: "#000",
  fontWeight: "bold",
  borderRadius: 10,
  marginTop: 10,
};

const btnOutline = {
  width: "100%",
  padding: 12,
  border: "1px solid #d4af37",
  background: "transparent",
  color: "#d4af37",
  borderRadius: 10,
  marginTop: 10,
};

const note = {
  marginTop: 10,
  fontSize: 13,
  color: "#777",
};

const textarea = {
  width: "100%",
  marginTop: 20,
  padding: 12,
  borderRadius: 10,
};

const resultBox = {
  marginTop: 20,
  padding: 15,
  background: "#000",
  borderRadius: 10,
};

const logoutBtn = {
  marginBottom: 10,
};

const remain = {
  color: "#d4af37",
};
