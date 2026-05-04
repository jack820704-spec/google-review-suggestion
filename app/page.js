"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* 🌍 多語系 */
const LANG = {
  zh: {
    title: "讓每一則評論回覆，都提升顧客對你的好感與信任",
    input: "貼上顧客評論...",
    btn: "產生三種回覆",
    remain: "剩餘",
    login: "登入",
    register: "免費註冊",
    logout: "登出",
  },
  en: {
    title: "Turn every reply into customer trust",
    input: "Paste customer review...",
    btn: "Generate Replies",
    remain: "Remaining",
    login: "Login",
    register: "Register",
    logout: "Logout",
  },
  vi: {
    title: "Biến mọi phản hồi thành sự tin tưởng",
    input: "Dán đánh giá khách hàng...",
    btn: "Tạo phản hồi",
    remain: "Còn lại",
    login: "Đăng nhập",
    register: "Đăng ký",
    logout: "Đăng xuất",
  },
};

/* 🌍 自動判斷語言 */
function detectLang(text) {
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[a-zA-Z]/.test(text)) return "en";
  if (/[ăâđêôơư]/i.test(text)) return "vi";
  return "zh";
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [review, setReview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(3);

  const [lang, setLang] = useState("zh");

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

    const autoLang = detectLang(review);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        text: review,
        lang: autoLang,
      }),
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

  const t = LANG[lang];
  const remaining = Math.max(limit - used, 0);

  return (
    <main style={bg}>
      {/* Header */}
      <div style={header}>
        <div style={brand}>ReviewReply Pro</div>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={langSelect}
          >
            <option value="zh">繁中</option>
            <option value="en">EN</option>
            <option value="vi">VI</option>
          </select>

          {user && (
            <button style={logoutBtn} onClick={logout}>
              {t.logout}
            </button>
          )}
        </div>
      </div>

      {/* 未登入 */}
      {!user && (
        <div style={split}>
          <div>
            <h1 style={title}>{t.title}</h1>
          </div>

          <div style={card}>
            <input
              style={input}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={input}
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={btn} onClick={signIn}>
              {t.login}
            </button>

            <button style={btnOutline} onClick={signUp}>
              {t.register}
            </button>
          </div>
        </div>
      )}

      {/* 已登入 */}
      {user && (
        <div style={container}>
          <h1 style={{ color: "#d4af37" }}>{t.title}</h1>

          <p style={{ color: "#aaa" }}>
            {t.remain} {remaining}/{limit}
          </p>

          <textarea
            style={textarea}
            placeholder={t.input}
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <button style={btn} onClick={generate}>
            {loading ? "..." : t.btn}
          </button>

          {/* 三種回覆 */}
          {result && (
            <div style={resultBox}>
              {result.split(/【一、|【二、|【三、/).filter(Boolean).map((text, i) => {
                const clean = text.replace(/】內容：/, "").trim();
                const titles = ["專業親切", "高級品牌", "危機處理"];

                return (
                  <div key={i} style={singleBox}>
                    <div style={singleHead}>
                      <span style={tag}>{titles[i]}</span>

                      <button
                        style={copyBtn}
                        onClick={() => navigator.clipboard.writeText(clean)}
                      >
                        Copy
                      </button>
                    </div>

                    <div style={singleText}>{clean}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* ===== style ===== */

const bg = { minHeight: "100vh", background: "#000", color: "#fff", padding: 40 };

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 40,
};

const brand = {
  background: "#d4af37",
  color: "#000",
  padding: "8px 16px",
  borderRadius: 999,
};

const langSelect = {
  padding: 8,
  borderRadius: 8,
};

const split = {
  display: "flex",
  justifyContent: "space-between",
};

const title = { color: "#d4af37", fontSize: 36 };

const card = { width: 300 };

const input = { width: "100%", marginTop: 10, padding: 10 };

const btn = {
  marginTop: 10,
  width: "100%",
  padding: 12,
  background: "#d4af37",
};

const btnOutline = {
  ...btn,
  background: "transparent",
  border: "1px solid #d4af37",
  color: "#d4af37",
};

const logoutBtn = { padding: 10 };

const container = { maxWidth: 800, margin: "0 auto" };

const textarea = { width: "100%", marginTop: 20, padding: 10 };

const resultBox = { marginTop: 20 };

const singleBox = {
  border: "1px solid #333",
  padding: 10,
  marginTop: 10,
};

const singleHead = {
  display: "flex",
  justifyContent: "space-between",
};

const tag = { color: "#d4af37" };

const copyBtn = {
  background: "#d4af37",
  padding: "5px 10px",
};

const singleText = { marginTop: 10, color: "#ddd" };
