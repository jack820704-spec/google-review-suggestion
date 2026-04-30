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
            <div style={left}>
              <h1 style={title}>
                讓每一則評論回覆，
                <br />
                都提升顧客對你的好感與信任
              </h1>

              <p style={subtitle}>
                貼上顧客評論，立即產生自然、專業、可公開使用的回覆建議，
                幫助商家提升品牌形象與回訪率。
              </p>

              <div style={features}>
                <p>✓ 用專業回覆，提高顧客再次上門意願</p>
                <p>✓ 讓負面評論也能變成加分的回應</p>
                <p>✓ 節省客服時間，提高營運效率</p>
                <p>✓ 適用餐廳、美容、醫美與服務業</p>
              </div>

              <p style={cta}>現在開始免費試用，體驗差別</p>
            </div>

            <div style={right}>
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
          <div style={appCard}>
            <p style={remain}>剩餘試用：{Math.max(limit - used, 0)} 次</p>

            <button onClick={logout} style={logoutBtn}>登出</button>

            <textarea
              style={textarea}
              rows={6}
              placeholder="貼上顧客評論..."
              onChange={(e) => setReview(e.target.value)}
            />

            <button style={btnGold} onClick={generate}>
              {loading ? "生成中..." : "產生回覆建議"}
            </button>

            {result && <div style={result}>{result}</div>}
          </div>
        )}
      </div>
    </main>
  );
}

const bg = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #000 0%, #0a0a0a 50%, #000 100%)",
  color: "#fff",
  padding: 40,
  fontFamily: "Arial",
};

const container = {
  maxWidth: 1100,
  margin: "0 auto",
};

const split = {
  display: "grid",
  gridTemplateColumns: "1fr 400px",
  gap: 40,
  alignItems: "center",
};

const left = {};

const title = {
  fontSize: 40,
  fontWeight: "bold",
  color: "#d4af37",
  lineHeight: 1.3,
};

const subtitle = {
  marginTop: 15,
  color: "#ccc",
  lineHeight: 1.6,
};

const features = {
  marginTop: 25,
  color: "#aaa",
  lineHeight: 2,
};

const cta = {
  marginTop: 20,
  color: "#d4af37",
  fontWeight: "bold",
};

const right = {
  background: "#111",
  padding: 30,
  borderRadius: 20,
};

const authTitle = {
  marginBottom: 20,
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 8,
};

const btnGold = {
  width: "100%",
  padding: 14,
  background: "#d4af37",
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

const appCard = {
  background: "#111",
  padding: 30,
  borderRadius: 20,
};

const textarea = {
  width: "100%",
  marginTop: 20,
  padding: 12,
  borderRadius: 10,
};

const result = {
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
