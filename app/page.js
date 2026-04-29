"use client";

import { useState } from "react";

export default function Home() {
  const [review, setReview] = useState("");
  const [tone, setTone] = useState("專業親切");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function analyzeReview() {
    setLoading(true);
    setResult("");
    setCopied(false);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ review, tone })
    });

    const data = await res.json();
    setResult(data.result || data.error || "發生錯誤");
    setLoading(false);
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #38bdf8 0%, #1e3a8a 32%, #020617 78%)",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#0f172a"
      }}
    >
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <section
          style={{
            background: "rgba(255,255,255,0.96)",
            borderRadius: 32,
            padding: 34,
            boxShadow: "0 35px 90px rgba(2,6,23,0.35)",
            border: "1px solid rgba(255,255,255,0.45)"
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#0284c7,#2563eb)",
              color: "white",
              padding: "9px 16px",
              borderRadius: 999,
              fontWeight: 900,
              marginBottom: 18,
              letterSpacing: "0.3px"
            }}
          >
            ReviewReply Pro
          </div>

          <h1
            style={{
              fontSize: 44,
              margin: "8px 0",
              fontWeight: 900,
              letterSpacing: "-1.2px",
              color: "#0f172a"
            }}
          >
            Google 評論建議系統
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#475569",
              lineHeight: 1.8
            }}
          >
            貼上客人的 Google 評論，系統會依照店家語氣，產生專業、自然、可直接公開回覆的建議文字。
          </p>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="例如：東西不錯，但等太久，服務人員也沒有主動說明。"
            style={{
              width: "100%",
              height: 175,
              marginTop: 26,
              padding: 18,
              fontSize: 16,
              borderRadius: 22,
              border: "1px solid #cbd5e1",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              background: "#f8fafc",
              boxShadow: "inset 0 2px 8px rgba(15,23,42,0.04)"
            }}
          />

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{
              width: "100%",
              marginTop: 14,
              padding: 15,
              fontSize: 16,
              borderRadius: 16,
              border: "1px solid #cbd5e1",
              background: "white"
            }}
          >
            <option>專業親切</option>
            <option>溫柔誠懇</option>
            <option>高級品牌感</option>
            <option>簡短有禮</option>
            <option>危機處理</option>
          </select>

          <button
            onClick={analyzeReview}
            disabled={!review || loading}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "17px",
              fontSize: 18,
              fontWeight: 900,
              borderRadius: 18,
              border: "none",
              background:
                loading || !review
                  ? "#94a3b8"
                  : "linear-gradient(135deg,#0284c7,#2563eb)",
              color: "white",
              cursor: loading || !review ? "not-allowed" : "pointer",
              boxShadow:
                loading || !review
                  ? "none"
                  : "0 16px 36px rgba(37,99,235,0.38)"
            }}
          >
            {loading ? "產生中..." : "產生回覆建議"}
          </button>

          {result && (
            <div
              style={{
                marginTop: 28,
                padding: 24,
                borderRadius: 22,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                whiteSpace: "pre-wrap",
                lineHeight: 1.9,
                fontSize: 16
              }}
            >
              <strong style={{ fontSize: 19 }}>建議結果：</strong>
              <br />
              <br />
              {result}

              <button
                onClick={copyResult}
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  border: "none",
                  background: copied ? "#16a34a" : "#020617",
                  color: "white",
                  fontWeight: 900,
                  fontSize: 16
                }}
              >
                {copied ? "已複製" : "一鍵複製回覆"}
              </button>
            </div>
          )}
        </section>

        <section
          style={{
            marginTop: 22,
            display: "grid",
            gap: 16
          }}
        >
          {[
            ["基本方案", "NT$499/月", "每月 100 則評論建議，適合小店家。"],
            ["專業方案", "NT$999/月", "每月 500 則評論建議，適合餐廳、美容、醫美。"],
            ["企業方案", "客製報價", "多分店、週報、負評提醒、自動化串接。"]
          ].map((plan) => (
            <div
              key={plan[0]}
              style={{
                background: "rgba(255,255,255,0.96)",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
                border: "1px solid rgba(255,255,255,0.5)"
              }}
            >
              <h3 style={{ margin: 0, fontSize: 22 }}>{plan[0]}</h3>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  margin: "10px 0",
                  color: "#1d4ed8"
                }}
              >
                {plan[1]}
              </p>
              <p style={{ color: "#475569", lineHeight: 1.7 }}>
                {plan[2]}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
