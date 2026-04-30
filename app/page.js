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
        <section style={hero}>
          <h1 style={title}>
            讓每一則評論回覆，都提升顧客對你的好感與信任
          </h1>

          <p style={subtitle}>
            貼上顧客評論，立即產生自然、專業、可公開使用的回覆建議，
            幫助商家提升品牌形象與回訪率。
          </p>

          <div style={featureBox}>
            <p>✓ 用專業回覆，提高顧客再次上門的意願</p>
            <p>✓ 讓負面評論也能變成加分的用心回應</p>
            <p>✓ 快速產生回覆建議，節省客服時間</p>
            <p>✓ 適用餐廳、美容、醫美與各類服務業</p>
          </div>
        </section>

        {!user ? (
          <section style={authCard}>
            <h2>開始免費試用</h2>
            <p>註冊後即可使用 3 次評論回覆建議</p>

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

            <button style={btnPrimary} onClick={signIn}>
              登入
            </button>

            <button style={btnSecondary} onClick={signUp}>
              免費註冊
            </button>
          </section>
        ) : (
          <section style={appCard}>
            <p style={{ color: "#d4af37" }}>
              剩餘試用：{Math.max(limit - used, 0)} 次
            </p>

            <button style={logoutBtn} onClick={logout}>
              登出
            </button>

            <textarea
              style={textarea}
              rows={6}
              placeholder="貼上顧客評論..."
              onChange={(e) => setReview(e.target.value)}
            />

            <button style={btnPrimary} onClick={generate}>
              {loading ? "生成中..." : "產生回覆建議"}
            </button>

            {result && <div style={resultBox}>{result}</div>}
          </section>
        )}
      </div>
    </main>
  );
}

const bg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, #111 0%, #000 60%, #000 100%)",
  color: "white",
  padding: 24,
  fontFamily: "Arial",
};

const container = {
  maxWidth: 900,
  margin: "0 auto",
};

const hero = {
  marginBottom: 30,
};

const title = {
  fontSize: 42,
  fontWeight: "bold",
  color: "#d4af37",
};

const subtitle = {
  marginTop: 10,
  color: "#ccc",
};

const featureBox = {
  marginTop: 20,
  lineHeight: 1.8,
  color: "#aaa",
};

const authCard = {
  background: "#111",
  padding: 24,
  borderRadius: 20,
};

const appCard = {
  background: "#111",
  padding: 24,
  borderRadius: 20,
};

const input = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  borderRadius: 10,
};

const textarea = {
  width: "100%",
  marginTop: 20,
  padding: 12,
  borderRadius: 10,
};

const btnPrimary = {
  width: "100%",
  marginTop: 15,
  padding: 14,
  background: "#d4af37",
  color: "#000",
  fontWeight: "bold",
  borderRadius: 10,
};

const btnSecondary = {
  width: "100%",
  marginTop: 10,
  padding: 12,
  background: "transparent",
  border: "1px solid #d4af37",
  color: "#d4af37",
  borderRadius: 10,
};

const logoutBtn = {
  marginTop: 10,
  marginBottom: 10,
  background: "#333",
  color: "#fff",
  padding: 10,
  borderRadius: 8,
};

const resultBox = {
  marginTop: 20,
  padding: 15,
  background: "#000",
  borderRadius: 10,
};
