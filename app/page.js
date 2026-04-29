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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ review }),
    });

    const data = await res.json();
    setResult(data.result || data.error || "發生錯誤");
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Google評論AI系統</h1>
      <p>輸入客人的 Google 評論，AI 會自動產生分析與回覆建議。</p>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="請貼上客人的評論，例如：服務很好但等很久"
        style={{
          width: "100%",
          height: 160,
          padding: 12,
          fontSize: 16,
          marginTop: 20,
        }}
      />

      <button
        onClick={analyzeReview}
        disabled={loading || !review}
        style={{
          marginTop: 16,
          padding: "12px 20px",
          fontSize: 16,
        }}
      >
        {loading ? "AI分析中..." : "產生AI回覆"}
      </button>

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {result}
        </div>
      )}
    </main>
  );
}
