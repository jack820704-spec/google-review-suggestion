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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review, tone }),
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
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left,#c7d2fe,#eef2ff 35%,#f8fafc 75%)",
      padding: 24,
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <section style={{
          background: "rgba(255,255,255,0.92)",
          borderRadius: 32,
          padding: 34,
          boxShadow: "0 30px 80px rgba(30,41,59,0.14)"
        }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "white",
            padding: "9px 16px",
            borderRadius: 999,
            fontWeight: 800,
            marginBottom: 18
          }}>
            商家評論回覆建議系統
          </div>

          <h1 style={{
            fontSize: 42,
            margin: "8px 0",
            fontWeight: 900,
            letterSpacing: "-1px"
          }}>
            Google 評論建議系統
          </h1>

          <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.8 }}>
            貼上客人的 Google 評論，系統會依照店家語氣產生專業、自然、可直接公開回覆的建議文字。
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            marginTop: 26
          }}>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="例如：東西不錯，但等太久，服務人員也沒有主動說明。"
              style={{
                width: "100%",
                height: 170,
                padding: 18,
                fontSize: 16,
                borderRadius: 20,
                border: "1px solid #cbd5e1",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                background: "#f8fafc"
              }}
            />

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: "100%",
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
                width: "100%",
                padding: "17px",
                fontSize: 18,
                fontWeight: 800,
                borderRadius: 18,
                border: "none",
                background: loading || !review ? "#94a3b8" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "white",
                cursor: loading || !review ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 14px 30px rgba(79,70,229,0.32)"
              }}
            >
              {loading ? "產生中..." : "產生回覆建議"}
            </button>
          </div>

          {result && (
            <div style={{
              marginTop: 28,
              padding: 24,
              borderRadius: 22,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              whiteSpace: "pre-wrap",
              lineHeight: 1.9,
              fontSize: 16
            }}>
              <strong style={{ fontSize: 19 }}>建議結果：</strong>
              <br /><br />
              {result}

              <button
                onClick={copyResult}
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  border:
