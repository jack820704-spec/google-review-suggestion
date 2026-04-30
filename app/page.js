"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setResult(data.result);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Google 評論回覆系統</h1>

      <textarea
        placeholder="輸入評論..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: 120 }}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        產生回覆
      </button>

      <p style={{ marginTop: 20 }}>{result}</p>
    </div>
  );
}
