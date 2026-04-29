export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Google評論AI系統</h1>
      <p>你的系統已經成功上線 🚀</p>

      <div style={{ marginTop: 20 }}>
        <h3>測試評論：</h3>
        <p>「服務很好但等很久」</p>

        <h3>AI分析：</h3>
        <p>情緒：中立偏負</p>
        <p>建議回覆：感謝您的回饋，我們會改善等待時間問題。</p>
      </div>
    </div>
  );
}