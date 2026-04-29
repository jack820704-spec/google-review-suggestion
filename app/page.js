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
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left,#c7d2fe,#eef2ff 35%,#f8fafc 75%)",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 30,
            padding: 30,
            boxShadow: "0 25px 60px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: "white",
              padding: "8px 16px",
              borderRadius: 999,
              display: "inline-block",
              fontWeight: 700,
            }}
          >
            Google 評論回覆建議
          </div>

          <h1 style={{ fontSize: 36, marginTop: 15 }}>
            Google 評論建議系統
          </h1>

          <p style={{ color: "#64748b", lineHeight: 1.8 }}>
            貼上客人的 Google 評論，系統會幫你產生自然、專業的回覆建議。
          </p>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="例如：服務很好但等很久"
            style={{
              width: "100%",
              height: 160,
              marginTop: 20,
              padding: 16,
              borderRadius: 16,
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            onClick={analyzeReview}
            disabled={!review || loading}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 16,
              borderRadius: 16,
              border: "none",
              background: "#4f46e5",
              color: "white",
              fontWeight: 700,
            }}
          >
            {loading ? "產生中..." : "產生回覆"}
          </button>

          {result && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "#f1f5f9",
                borderRadius: 16,
              }}
            >
              <b>結果：</b>
              <br />
              {result}
            </div>
          )}
        </div>
      </div>
</main>
  );
}
