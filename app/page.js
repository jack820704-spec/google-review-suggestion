"use client";

import { useState } from "react";

export default function Home() {
  const [review, setReview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeReview() {
    setLoading(true);
    setResult("");

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review }),
    });

    const data = await res.json();
    setResult(data.result || data.error || "發生錯誤");
    setLoading(false);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
      padding: 24,
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: 760,
        margin: "0 auto",
        background: "white",
        borderRadius: 24,
        padding: 28,
        boxShadow: "0 20px 50px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          display: "inline-block",
          background: "#eef2ff",
          color: "#4338ca",
          padding: "8px 14px",
          borderRadius: 999,
          fontWeight: 700,
          marginBottom: 16
        }}>
          Google 評論回覆建議
        </div>

        <h1 style={{ fontSize: 36, margin: "8px 0" }}>
          Google 評論建議系統
        </h1>

        <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7 }}>
          貼上客人的 Google 評論，系統會幫你產生專業、自然、適合公開回覆的建議文字。
        </p>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="例如：服務不錯，但等了很久，希望下次可以改善。"
          style={{
            width: "100%",
            height: 170,
            marginTop: 24,
            padding: 16,
            fontSize: 16,
            borderRadius: 16,
            border: "1px solid #cbd5e1",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box"
          }}
        />

        <button
          onClick={analyzeReview}
          disabled={!review || loading}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "15px 20px",
            fontSize: 17,
            fontWeight: 700,
            borderRadius: 16,
            border: "none",
            background: loading || !review ? "#94a3b8" : "#4f46e5",
            color: "white",
            cursor: loading || !review ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "產生中..." : "產生回覆建議"}
        </button>

        {result && (
          <div style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 18,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            whiteSpace: "pre-wrap",
            lineHeight: 1.8,
            fontSize: 16
          }}>
            <strong>建議結果：</strong>
            <br /><br />
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
