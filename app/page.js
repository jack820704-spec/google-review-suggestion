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
    setResult(data.result || data.error || "Error occurred");
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
        {/* 標籤 */}
        <div style={{
          display: "inline-block",
          background: "#eef2ff",
          color: "#4338ca",
          padding: "8px 14px",
          borderRadius: 999,
          fontWeight: 700,
          marginBottom: 16
        }}>
          ReviewReply AI
        </div>

        {/* 標題 */}
        <h1 style={{ fontSize: 36, margin: "8px 0" }}>
          Google Review Suggestions
        </h1>

        {/* 說明 */}
        <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7 }}>
          Paste a customer’s Google review and AI will generate a professional reply suggestion for you.
        </p>

        {/* 輸入框 */}
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Example: The service was good but I had to wait too long."
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

        {/* 按鈕 */}
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
          {loading ? "Analyzing..." : "Generate AI Reply"}
        </button>

        {/* 結果 */}
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
            <strong>AI Result:</strong>
            <br /><br />
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
