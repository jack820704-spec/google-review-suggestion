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
    setResult("");
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

  const remaining = Math.max(limit - used, 0);

  if (!user) {
    return (
      <main style={bg}>
        <div style={split}>
          <div>
            <h1 style={title}>
              讓每一則評論回覆，
              <br />
              都提升顧客對你的好感與信任
            </h1>

            <p style={desc}>
              一鍵產生三種不同回覆方式：專業親切、高級品牌、危機處理，
              幫助商家快速回覆評論、提升形象與回訪率。
            </p>
          </div>

          <div style={card}>
            <h2>開始免費試用</h2>

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

            <button style={btn} onClick={signIn}>
              登入
            </button>

            <button style={btnOutline} onClick={signUp}>
              免費註冊
            </button>

            <p style={{ color: "#aaa", marginTop: 10 }}>
              免費試用 3 次
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={bg}>
      <div style={container}>
        <h1 style={{ color: "#d4af37" }}>評論回覆系統</h1>

        <p style={{ color: "#aaa" }}>
          剩餘 {remaining} 次 / 共 {limit} 次
        </p>

        <textarea
          style={textarea}
          rows={6}
          placeholder="貼上顧客評論..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <button style={btn} onClick={generate}>
          {loading ? "生成中..." : "產生三種回覆"}
        </button>

        {/* 🔥 三種回覆分開 */}
        {result && (
          <div style={resultBox}>
            <h3 style={{ marginBottom: 20 }}>三種回覆方式</h3>

            {(() => {
              const parts = result
                .split(/【一、|【二、|【三、/)
                .filter(Boolean);

              const titles = [
                "專業親切版",
                "高級品牌版",
                "危機處理版",
              ];

              return parts.map((text, i) => {
                const clean = text.replace(/】內容：/, "").trim();

                return (
                  <div key={i} style={singleBox}>
                    <div style={singleHead}>
                      <span style={tag}>{titles[i]}</span>

                      <button
                        style={copyBtn}
                        onClick={() =>
                          navigator.clipboard.writeText(clean)
                        }
                      >
                        複製
                      </button>
                    </div>

                    <div style={singleText}>{clean}</div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        <button style={logoutBtn} onClick={logout}>
          登出
        </button>
      </div>
    </main>
  );
}

/* ---------- style ---------- */

const bg = {
  minHeight: "100vh",
  background: "#000",
  color: "#fff",
  padding: "60px",
};

const split = {
  display: "flex",
  justifyContent: "space-between",
  maxWidth: 1200,
  margin: "0 auto",
};

const title = {
  color: "#d4af37",
  fontSize: 42,
};

const desc = {
  marginTop: 20,
  color: "#ccc",
  maxWidth: 500,
};

const card = {
  width: 320,
  background: "#111",
  padding: 20,
  borderRadius: 12,
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "none",
};

const btn = {
  width: "100%",
  marginTop: 12,
  padding: 12,
  background: "#d4af37",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const btnOutline = {
  ...btn,
  background: "transparent",
  color: "#d4af37",
  border: "1px solid #d4af37",
};

const container = {
  maxWidth: 800,
  margin: "0 auto",
};

const textarea = {
  width: "100%",
  padding: 12,
  marginTop: 20,
  borderRadius: 8,
};

const resultBox = {
  marginTop: 30,
};

const singleBox = {
  marginBottom: 20,
  padding: 15,
  border: "1px solid #333",
  borderRadius: 10,
};

const singleHead = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const tag = {
  color: "#d4af37",
  fontWeight: "bold",
};

const copyBtn = {
  background: "#d4af37",
  border: "none",
  padding: "5px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const singleText = {
  whiteSpace: "pre-wrap",
  color: "#ddd",
};

const logoutBtn = {
  marginTop: 20,
  padding: 10,
  background: "#333",
  border: "none",
  color: "#fff",
};
