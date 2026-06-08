"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

// ─────── Copy table (EN + zh) ───────
// Per-step strings live here so the language toggle stays consistent
// with the dashboard / landing pages.
const T = {
  en: {
    nav_back: "← Back to home",
    nav_pricing: "Pricing",
    nav_login: "Login",
    nav_dashboard: "Dashboard",
    nav_signout: "Sign Out",
    nav_get_started: "Start Free Trial",
    hero_eyebrow: "Product Tour",
    hero_title_a: "See Revuly",
    hero_title_b: "in Action",
    hero_sub: "A 2-minute tour of how Revuly helps restaurants manage their reputation effortlessly — from connecting Google Business to smart reply suggestions and competitor benchmarking.",
    hero_cta_primary: "Start Free Trial — No Card Required",
    hero_cta_secondary: "Skip to Pricing →",
    step_label: (n) => `Step ${n}`,
    s1_title: "Connect Your Google Business",
    s1_body: "Connect your Google Business Profile in seconds. Revuly instantly pulls your latest reviews, recent ratings, and the address details we need to keep them flowing in every day.",
    s1_bullets: ["One-click search by name + city", "Auto-syncs every 24 hours", "No code, no API keys"],
    s2_title: "Reviews Sync Automatically",
    s2_body: "New reviews are detected automatically. Every review is analysed for sentiment and keywords the moment it arrives — no copy-paste, no manual import.",
    s2_bullets: ["Daily Google Places sync", "Sentiment auto-tagged", "Crisis alerts for 1–2★ spikes"],
    s3_title: "Get Three Reply Styles Instantly",
    s3_body: "Get three reply options instantly — Warm & Personal, Professional & Gracious, or Brief & Direct. All crafted to sound like a real owner, not a PR team.",
    s3_bullets: ["Owner-voice prompt, never corporate", "Reply in 7 languages", "Pro: 4th tab learns your personal voice"],
    s4_title: "Email Notifications With Reply Suggestions Inside",
    s4_body: "The moment a new review lands, you get an email with the full review and three ready-to-use reply suggestions. Just copy the one you like best.",
    s4_bullets: ["Immediate / daily / weekly cadence", "Crisis emails fire regardless", "Reply suggestions inside the email"],
    s5_title: "Analytics That Show What Guests Love",
    s5_body: "Track what guests love and what needs improvement. Keyword trends, sentiment over time, rating distribution, and competitor comparison — all in one place.",
    s5_bullets: ["Star distribution + MoM trend", "Pie + word cloud + Top 10 ranks", "Pro: side-by-side vs competitors"],
    s6_title: "Keyword Intelligence",
    s6_body: "Know exactly what guests talk about — freshness, service, value, ambiance. Spot patterns before they become problems and double down on what's working.",
    s6_bullets: ["8 built-in categories", "Add your own custom keywords", "Click any category → filtered reviews"],
    cta_title: "Ready to take control of your reputation?",
    cta_sub: "Set up takes about 3 minutes. Free trial, no card required.",
    cta_btn_primary: "Start Free Trial",
    cta_btn_secondary: "View Pricing",
    // Mockup labels (small ones inside the fake screenshots)
    mock_search_ph: "Search e.g. Maison Renaud, Paris",
    mock_search_btn: "Search Google",
    mock_search_result_addr: "12 rue de Sèvres, Paris, France",
    mock_search_track: "Connect",
    mock_review_today: "Today",
    mock_review_yesterday: "Yesterday",
    mock_style_warm: "Warm & Personal",
    mock_style_pro: "Professional & Gracious",
    mock_style_brief: "Brief & Direct",
    mock_copy: "Copy",
    mock_email_subject: "New 5★ review for your restaurant",
    mock_email_preview: "Sarah just left a glowing review — three smart replies ready to send.",
    mock_email_btn: "View in Dashboard",
    mock_pie_title: "Keyword Categories",
    mock_kw_food: "Food",
    mock_kw_service: "Service",
    mock_kw_value: "Value",
    mock_kw_ambiance: "Ambiance",
    mock_kw_speed: "Speed",
    mock_word_cloud_help: "Click any word to filter reviews",
  },
  zh: {
    nav_back: "← 回首頁",
    nav_pricing: "定價",
    nav_login: "登入",
    nav_dashboard: "Dashboard",
    nav_signout: "登出",
    nav_get_started: "免費試用",
    hero_eyebrow: "產品導覽",
    hero_title_a: "看看 Revuly",
    hero_title_b: "怎麼運作",
    hero_sub: "兩分鐘帶你看 Revuly 如何幫餐廳輕鬆管理品牌聲譽——從連接 Google 商家、AI 撰寫回覆，到競爭對手評分比較,一站搞定。",
    hero_cta_primary: "免費試用——無需信用卡",
    hero_cta_secondary: "直接看定價 →",
    step_label: (n) => `步驟 ${n}`,
    s1_title: "連接 Google 商家",
    s1_body: "幾秒鐘完成連接 Google 商家檔案。Revuly 立刻拉取你最新的評論、評分,以及維持每日同步所需的地址資料。",
    s1_bullets: ["以店名 + 城市一鍵搜尋", "每 24 小時自動同步", "免寫程式,不需 API 金鑰"],
    s2_title: "評論自動同步",
    s2_body: "新評論一進來就被偵測到。每一則評論都會立刻分析情緒與關鍵字——免複製貼上、免手動匯入。",
    s2_bullets: ["每日 Google Places 同步", "情緒自動標記", "1–2★ 暴增時觸發危機提醒"],
    s3_title: "AI 生成三種回覆風格",
    s3_body: "立即取得三種回覆選項——Warm & Personal(溫暖個人)、Professional & Gracious(專業典雅)、Brief & Direct(簡短直接)。每一句都像真正的老闆寫的,不是公關範本。",
    s3_bullets: ["老闆口吻、絕不公關腔", "支援 7 種語言回覆", "Pro:第 4 個分頁學會你的個人語氣"],
    s4_title: "Email 通知附 AI 回覆建議",
    s4_body: "新評論一落地,你就會收到 Email,內含完整評論與三個現成的回覆建議。喜歡哪個就複製哪個。",
    s4_bullets: ["即時 / 每日 / 每週節奏可選", "危機 Email 不受節奏限制", "Email 內嵌回覆建議"],
    s5_title: "分析儀表板告訴你顧客愛什麼",
    s5_body: "掌握顧客喜歡什麼、哪裡還能改進。關鍵字趨勢、情緒時間軸、星等分佈、競爭對手比較——全部在一個頁面。",
    s5_bullets: ["星等分佈 + 月對月趨勢", "圓餅 + 字雲 + Top 10 排行", "Pro:與競爭對手並排比較"],
    s6_title: "關鍵字情報",
    s6_body: "精準掌握顧客在談什麼——新鮮度、服務、價格、氣氛。在問題擴大前就看見規律,並把做得好的部分放大。",
    s6_bullets: ["內建 8 大類別", "可加入你自己的自訂關鍵字", "點任何類別 → 篩選相關評論"],
    cta_title: "準備好掌控自己的品牌聲譽了嗎?",
    cta_sub: "設定大約 3 分鐘即可完成。免費試用,無需信用卡。",
    cta_btn_primary: "免費試用",
    cta_btn_secondary: "查看定價",
    mock_search_ph: "輸入餐廳名稱,例如:船饗大漁,台北",
    mock_search_btn: "搜尋 Google",
    mock_search_result_addr: "台北市中山區南京東路一段 25 號",
    mock_search_track: "連接",
    mock_review_today: "今天",
    mock_review_yesterday: "昨天",
    mock_style_warm: "Warm & Personal",
    mock_style_pro: "Professional & Gracious",
    mock_style_brief: "Brief & Direct",
    mock_copy: "複製",
    mock_email_subject: "你的餐廳收到 5★ 新評論",
    mock_email_preview: "Sarah 剛留下一則好評——三個 AI 回覆已準備好。",
    mock_email_btn: "查看 Dashboard",
    mock_pie_title: "關鍵字分類",
    mock_kw_food: "食物",
    mock_kw_service: "服務",
    mock_kw_value: "價格",
    mock_kw_ambiance: "氣氛",
    mock_kw_speed: "速度",
    mock_word_cloud_help: "點任何字詞即可篩選評論",
  },
};

// Sample reviews used in mockups — chosen to feel like a real
// neighbourhood izakaya so the screenshots look lived-in. The user
// asked specifically for 船饗大漁-style content as the example.
const SAMPLE_REVIEWS = {
  en: [
    { name: "Sarah Chen",  stars: 5, days: 0, text: "Hands down the freshest seafood I've had in Paris. The salmon sashimi melts. Owner came over to greet us — felt like family." },
    { name: "Marcus T.",   stars: 4, days: 1, text: "Great vibe, generous portions. Service was a tiny bit slow at peak hours but the food more than made up for it." },
    { name: "Jenny W.",    stars: 5, days: 2, text: "Best izakaya in the area. The grilled mackerel and sake pairing — chef's kiss. Coming back next week." },
  ],
  zh: [
    { name: "陳小姐", stars: 5, days: 0, text: "巴黎最新鮮的海鮮!鮭魚生魚片入口即化,老闆親自過來打招呼,有家的感覺。" },
    { name: "Marcus", stars: 4, days: 1, text: "氣氛超好、份量大方。尖峰時段上菜稍慢,但食物完全值得。" },
    { name: "Jenny",  stars: 5, days: 2, text: "這區最好的居酒屋!烤鯖魚配清酒——主廚必殺技。下週還要再來。" },
  ],
};

// Sample AI replies for step 3 (matched to Sarah Chen's 5★ review above)
const SAMPLE_REPLIES = {
  en: {
    warm:
      "Sarah! You just made our night. We're so glad the salmon hit the spot — the boss came over because that's how it should be. Save us a seat next time, we want to send out something special for you. — James, Owner",
    professional:
      "Dear Sarah, thank you for such a generous note. It means a great deal to know the sashimi and the warmth of our team came through. We very much look forward to welcoming you back. — James, Owner",
    brief:
      "Thanks Sarah! So happy the salmon and the welcome landed. See you very soon.",
  },
  zh: {
    warm:
      "陳小姐!這則留言真的讓我們整個團隊心情大好。鮭魚能入口即化是廚房最重視的事,老闆過來打招呼也是因為我們覺得就該這樣。下次來請告訴我們,我們想為你準備一點特別的。— 老闆",
    professional:
      "陳小姐您好,感謝您如此溫暖的留言。能讓您感受到生魚片的鮮度與我們團隊的用心,是對我們最大的肯定。期待再次為您服務。— 老闆",
    brief:
      "陳小姐,謝謝!很開心鮭魚與這份心意都有傳到。下次見!",
  },
};

// Word cloud sample data (word, polarity, size weight)
const SAMPLE_CLOUD = [
  { w: "fresh",     pol: "pos", size: 38 },
  { w: "delicious", pol: "pos", size: 34 },
  { w: "friendly",  pol: "pos", size: 30 },
  { w: "owner",     pol: "pos", size: 28 },
  { w: "salmon",    pol: "pos", size: 26 },
  { w: "atmosphere",pol: "pos", size: 24 },
  { w: "sake",      pol: "pos", size: 22 },
  { w: "warm",      pol: "pos", size: 22 },
  { w: "wait",      pol: "neg", size: 20 },
  { w: "service",   pol: "pos", size: 26 },
  { w: "menu",      pol: "neu", size: 18 },
  { w: "izakaya",   pol: "pos", size: 24 },
  { w: "value",     pol: "pos", size: 20 },
  { w: "slow",      pol: "neg", size: 18 },
  { w: "best",      pol: "pos", size: 28 },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0b;--bg2:#111114;--bg3:#17171c;--surface:#1c1c22;--surface2:#222229;
    --gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);
    --gold-glow:rgba(201,168,76,0.18);
    --text1:#f0ede6;--text2:#a09888;--text3:#5a5550;
    --pos:#5dba7a;--neg:#e06060;--r:14px;
  }
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;z-index:0;opacity:.025;pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px}

  /* NAV */
  .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 6vw;height:64px;background:rgba(10,10,11,.92);backdrop-filter:blur(18px);border-bottom:1px solid rgba(201,168,76,.1)}
  .logo{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:var(--gold-lt);text-decoration:none;display:flex;align-items:center;gap:9px}
  .logo-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}
  .nav-right{display:flex;align-items:center;gap:10px}
  .btn-ghost{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid var(--gold-border);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:all .2s}
  .btn-ghost:hover{color:var(--gold-lt);border-color:var(--gold)}
  .btn-gold{padding:7px 18px;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:all .2s;box-shadow:0 2px 12px rgba(201,168,76,.3)}
  .btn-gold:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(201,168,76,.45)}
  .lang-toggle{height:32px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text2);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer}
  .lang-toggle:hover{border-color:var(--gold-border);color:var(--gold-lt)}

  /* HERO */
  .hero{position:relative;padding:140px 6vw 60px;text-align:center;overflow:hidden;z-index:1}
  .hero-bg{position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(201,168,76,.12),transparent 65%),radial-gradient(ellipse 50% 50% at 80% 80%,rgba(201,168,76,.04),transparent 60%)}
  .hero-inner{max-width:780px;margin:0 auto}
  .hero-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:999px;border:1px solid var(--gold-border);background:rgba(201,168,76,.07);font-size:12px;font-weight:700;color:var(--gold);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:22px}
  .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold)}
  .hero h1{font-family:'Playfair Display',serif;font-size:clamp(36px,6vw,68px);font-weight:900;line-height:1.1;letter-spacing:-.5px;margin-bottom:22px}
  .accent{background:linear-gradient(135deg,var(--gold-lt),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .hero-sub{font-size:clamp(15px,1.7vw,18px);color:var(--text2);line-height:1.65;max-width:620px;margin:0 auto 32px}
  .hero-ctas{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
  .btn-primary{padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px rgba(201,168,76,.38)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(201,168,76,.5)}
  .btn-secondary{padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;font-family:inherit;color:var(--text1);background:transparent;border:1px solid rgba(240,237,230,.15);cursor:pointer;transition:all .25s}
  .btn-secondary:hover{border-color:var(--gold-border);color:var(--gold-lt);background:var(--gold-glow)}

  /* STEPS */
  .steps{padding:80px 6vw}
  .step{max-width:1120px;margin:0 auto 120px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
  .step:nth-child(even){grid-template-columns:1fr 1fr}
  .step:nth-child(even) .step-body{order:2}
  .step:nth-child(even) .step-mock{order:1}
  .step-label{display:inline-block;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);padding:5px 14px;border:1px solid var(--gold-border);border-radius:999px;background:rgba(201,168,76,.05);margin-bottom:18px}
  .step-title{font-family:'Playfair Display',serif;font-size:clamp(26px,3.4vw,38px);font-weight:700;line-height:1.2;margin-bottom:14px}
  .step-body p{font-size:15px;color:var(--text2);line-height:1.75;margin-bottom:20px}
  .step-bullets{list-style:none;display:flex;flex-direction:column;gap:10px}
  .step-bullets li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--text2);line-height:1.55}
  .chk{width:18px;height:18px;border-radius:50%;flex-shrink:0;margin-top:2px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.35);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gold);font-weight:700}

  /* MOCKUP FRAMES */
  .mock-frame{background:linear-gradient(180deg,#17171c,#111114);border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.55),0 0 0 1px rgba(201,168,76,.04);padding:14px;position:relative;overflow:hidden}
  .mock-frame::before{content:'';position:absolute;top:0;left:0;right:0;height:30px;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent);pointer-events:none}
  .mock-chrome{display:flex;align-items:center;gap:6px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05)}
  .mock-dot{width:9px;height:9px;border-radius:50%}
  .mock-dot.r{background:#e06060}.mock-dot.y{background:#e8b84b}.mock-dot.g{background:#5dba7a}
  .mock-url{flex:1;margin-left:8px;padding:4px 10px;background:rgba(255,255,255,.05);border-radius:6px;font-size:10.5px;color:var(--text3);font-family:monospace}

  /* Step 1 search */
  .m1-search-row{display:flex;gap:8px;margin-bottom:12px}
  .m1-input{flex:1;padding:9px 12px;background:#0a0a0b;border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:12.5px;color:var(--text2);font-family:inherit}
  .m1-btn{padding:9px 14px;border-radius:8px;background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000;border:none;font-size:12px;font-weight:700;font-family:inherit;white-space:nowrap}
  .m1-result{background:#0a0a0b;border:1px solid var(--gold-border);border-radius:10px;padding:12px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .m1-r-body{min-width:0;flex:1}
  .m1-r-name{font-size:13px;font-weight:700;color:var(--text1);margin-bottom:3px}
  .m1-r-meta{font-size:11.5px;color:var(--gold);margin-bottom:4px}
  .m1-r-addr{font-size:11.5px;color:var(--text2);line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .m1-r-btn{padding:6px 12px;border-radius:6px;background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000;border:none;font-size:11px;font-weight:700;font-family:inherit;flex-shrink:0}

  /* Step 2 review list */
  .m2-rev{padding:10px 12px;background:#0a0a0b;border:1px solid rgba(255,255,255,.06);border-radius:9px;margin-bottom:8px}
  .m2-rev:last-child{margin-bottom:0}
  .m2-rev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;gap:8px}
  .m2-rev-name{font-size:12px;font-weight:700;color:var(--text1)}
  .m2-rev-stars{color:var(--gold);letter-spacing:1.5px;font-size:11px}
  .m2-rev-date{font-size:10.5px;color:var(--text3)}
  .m2-rev-text{font-size:11.5px;color:var(--text2);line-height:1.55}
  .m2-tag{display:inline-block;padding:1px 7px;border-radius:6px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:5px}
  .m2-tag.pos{background:rgba(93,186,122,.12);color:var(--pos);border:1px solid rgba(93,186,122,.3)}
  .m2-tag.neg{background:rgba(224,96,96,.12);color:var(--neg);border:1px solid rgba(224,96,96,.3)}
  .m2-tag.neu{background:rgba(160,160,154,.12);color:var(--text2);border:1px solid rgba(160,160,154,.3)}

  /* Step 3 reply styles */
  .m3-tabs{display:flex;gap:5px;margin-bottom:10px}
  .m3-tab{flex:1;padding:6px 4px;border-radius:7px;font-size:10.5px;font-weight:600;font-family:inherit;text-align:center;background:transparent;border:1px solid rgba(255,255,255,.08);color:var(--text2)}
  .m3-tab.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .m3-reply{padding:12px 14px;background:#0a0a0b;border:1px solid rgba(201,168,76,.18);border-radius:9px;font-size:12px;color:var(--text1);line-height:1.65;margin-bottom:10px}
  .m3-actions{display:flex;justify-content:flex-end;gap:8px}
  .m3-copy{padding:5px 12px;border-radius:6px;background:transparent;border:1px solid var(--gold-border);color:var(--gold-lt);font-size:11px;font-weight:700;font-family:inherit}

  /* Step 4 email */
  .m4-mail{background:#fff;border-radius:9px;overflow:hidden;color:#111}
  .m4-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f6f1e3;border-bottom:1px solid #ebe2c8}
  .m4-bar-logo{width:24px;height:24px;border-radius:5px;background:linear-gradient(135deg,#c9a84c,#8a6e2f);display:flex;align-items:center;justify-content:center;color:#000;font-size:11px;font-weight:700}
  .m4-bar-from{font-size:11px;color:#666;font-weight:600}
  .m4-body-pad{padding:14px}
  .m4-subj{font-size:13.5px;font-weight:700;color:#111;margin-bottom:4px;line-height:1.4}
  .m4-prev{font-size:11.5px;color:#666;line-height:1.5;margin-bottom:10px}
  .m4-quote{padding:10px 12px;background:#f7f4ec;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;font-size:11.5px;color:#333;line-height:1.6;font-style:italic;margin-bottom:10px}
  .m4-reply-card{padding:8px 10px;background:#fbf8f0;border:1px solid #ebe2c8;border-radius:7px;margin-bottom:6px}
  .m4-reply-label{font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#8a6e2f;margin-bottom:3px}
  .m4-reply-text{font-size:11px;color:#333;line-height:1.55}
  .m4-cta{display:inline-block;margin-top:10px;padding:7px 14px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;border-radius:7px;font-size:11px;font-weight:700;text-decoration:none}

  /* Step 5 pie + bars */
  .m5-row{display:grid;grid-template-columns:140px 1fr;gap:14px;align-items:center}
  .m5-pie{position:relative;width:140px;height:140px}
  .m5-pie svg{transform:rotate(-90deg)}
  .m5-pie-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt)}
  .m5-legend{display:flex;flex-direction:column;gap:8px}
  .m5-leg{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text2)}
  .m5-leg-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0}
  .m5-leg-count{margin-left:auto;color:var(--text1);font-weight:700;font-size:11px}

  /* Step 6 word cloud */
  .m6-cloud{display:flex;flex-wrap:wrap;gap:8px 14px;justify-content:center;padding:14px 8px;align-items:center;min-height:160px}
  .m6-word{font-weight:700;line-height:1;letter-spacing:-.3px}
  .m6-cloud-help{font-size:11px;color:var(--text3);text-align:center;margin-top:6px;font-style:italic}

  /* CTA SECTION */
  .cta-section{margin:0 6vw 100px;background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04));border:1px solid var(--gold-border);border-radius:20px;padding:60px 6vw;text-align:center;position:relative;overflow:hidden}
  .cta-section::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.15),transparent 70%);pointer-events:none}
  .cta-section h2{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,40px);font-weight:700;margin-bottom:14px;position:relative}
  .cta-section p{font-size:15.5px;color:var(--text2);margin-bottom:30px;position:relative}
  .cta-btns{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;position:relative}

  /* FOOTER */
  .foot{border-top:1px solid rgba(255,255,255,.06);padding:44px 6vw 32px}
  .foot-inner{max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
  .foot-tagline{font-size:13px;color:var(--text2);line-height:1.65;max-width:380px;margin-top:12px}
  .foot-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--text3)}
  .foot-links{display:flex;gap:18px;flex-wrap:wrap}
  .foot-bottom a{color:var(--text3);text-decoration:none;transition:color .2s}
  .foot-bottom a:hover{color:var(--gold)}
  @media(max-width:640px){.foot-bottom{flex-direction:column;align-items:flex-start;gap:10px}}

  /* MOBILE */
  @media (max-width: 860px) {
    .step{grid-template-columns:1fr;gap:30px;margin-bottom:80px}
    .step:nth-child(even) .step-body{order:1}
    .step:nth-child(even) .step-mock{order:2}
    .nav{padding:0 4vw;height:56px}
    .btn-ghost,.btn-gold{padding:6px 12px;font-size:12px}
    .lang-toggle{height:30px;padding:0 10px;font-size:11px}
    .hero{padding:110px 5vw 50px}
    .hero h1{font-size:34px}
    .hero-sub{font-size:14.5px;margin-bottom:24px}
    .btn-primary,.btn-secondary{padding:12px 22px;font-size:14px;width:100%}
    .steps{padding:50px 5vw}
    .cta-section{padding:48px 6vw;margin:0 5vw 60px}
    .m5-row{grid-template-columns:1fr;gap:18px;justify-items:center}
    .m4-body-pad{padding:12px}
  }

  /* Extra-small phones — tighten mockup chrome so the URL bar doesn't
     overflow at 320px, and scale down the word-cloud sample sizes. */
  @media (max-width: 480px) {
    .nav-right{gap:6px}
    .nav-right .btn-ghost{padding:5px 10px;font-size:11.5px}
    .nav-right .btn-gold{padding:5px 12px;font-size:11.5px}
    .hero h1{font-size:30px;line-height:1.15}
    .step-title{font-size:24px;line-height:1.22}
    .mock-frame{padding:12px}
    .mock-url{font-size:9.5px;padding:3px 8px}
    .m1-search-row{flex-direction:column}
    .m1-btn{width:100%}
    .m3-tab{font-size:10px;padding:6px 2px}
    .m6-cloud{gap:6px 10px;padding:10px 4px;min-height:140px}
    .m6-word{font-size:90% !important}
    .cta-section{padding:36px 5vw}
  }
`;

export default function TourPage() {
  const [lang, setLang] = useState("en");
  const [activeStyle, setActiveStyle] = useState("warm");
  const [isAuthed, setIsAuthed] = useState(null);
  const supa = useRef(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("revuly-lang");
      if (saved === "zh" || saved === "en") setLang(saved);
    } catch {}
  }, []);

  // Resolve auth state so the nav buttons match the rest of the app.
  useEffect(() => {
    supa.current = createClient();
    let mounted = true;
    supa.current.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsAuthed(!!session?.user);
    });
    const { data: { subscription } } = supa.current.auth.onAuthStateChange(
      (_e, s) => { if (mounted) setIsAuthed(!!s?.user); }
    );
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    try { window.localStorage.setItem("revuly-lang", next); } catch {}
  };

  const t = T[lang];
  const reviews = SAMPLE_REVIEWS[lang];
  const replies = SAMPLE_REPLIES[lang];

  const handleSignOut = async () => {
    if (!supa.current) return;
    await supa.current.auth.signOut();
    setIsAuthed(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="tour" />

      {/* NAV */}
      <nav className="nav">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
        <div className="nav-right">
          <button className="lang-toggle" onClick={toggleLang}>{lang === "en" ? "中文" : "EN"}</button>
          <a className="btn-ghost" href="/#pricing">{t.nav_pricing}</a>
          {isAuthed ? (
            <>
              <button className="btn-ghost" onClick={handleSignOut}>{t.nav_signout}</button>
              <a className="btn-gold" href="/dashboard">{t.nav_dashboard}</a>
            </>
          ) : (
            <>
              <a className="btn-ghost" href="/login">{t.nav_login}</a>
              <a className="btn-gold" href="/login">{t.nav_get_started}</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-eyebrow"><span className="eyebrow-dot" />{t.hero_eyebrow}</div>
          <h1>{t.hero_title_a}<br /><span className="accent">{t.hero_title_b}</span></h1>
          <p className="hero-sub">{t.hero_sub}</p>
          <div className="hero-ctas">
            <a className="btn-primary" href="/login">{t.hero_cta_primary}</a>
            <a className="btn-secondary" href="/#pricing">{t.hero_cta_secondary}</a>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="steps">
        {/* ───── STEP 1: Connect ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(1)}</span>
            <h2 className="step-title">{t.s1_title}</h2>
            <p>{t.s1_body}</p>
            <ul className="step-bullets">
              {t.s1_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="mock-chrome">
                <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
                <span className="mock-url">revuly.dev/dashboard/settings</span>
              </div>
              <div className="m1-search-row">
                <input className="m1-input" placeholder={t.mock_search_ph} readOnly />
                <button className="m1-btn">{t.mock_search_btn}</button>
              </div>
              <div className="m1-result">
                <div className="m1-r-body">
                  <div className="m1-r-name">{lang === "zh" ? "船饗大漁 居酒屋" : "Maison Renaud"}</div>
                  <div className="m1-r-meta">4.6 ★ · 248 reviews · Restaurant</div>
                  <div className="m1-r-addr">{t.mock_search_result_addr}</div>
                </div>
                <button className="m1-r-btn">{t.mock_search_track}</button>
              </div>
            </div>
          </div>
        </div>

        {/* ───── STEP 2: Auto-sync reviews ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(2)}</span>
            <h2 className="step-title">{t.s2_title}</h2>
            <p>{t.s2_body}</p>
            <ul className="step-bullets">
              {t.s2_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="mock-chrome">
                <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
                <span className="mock-url">revuly.dev/dashboard</span>
              </div>
              {reviews.map((rev, i) => (
                <div key={i} className="m2-rev">
                  <div className="m2-rev-head">
                    <span className="m2-rev-name">{rev.name}</span>
                    <span className="m2-rev-stars">{"★".repeat(rev.stars)}{"☆".repeat(5 - rev.stars)}</span>
                    <span className="m2-rev-date">{i === 0 ? t.mock_review_today : i === 1 ? t.mock_review_yesterday : `${rev.days}d`}</span>
                  </div>
                  <div className="m2-rev-text">{rev.text}</div>
                  <span className={`m2-tag ${rev.stars >= 4 ? "pos" : rev.stars <= 2 ? "neg" : "neu"}`}>
                    {rev.stars >= 4 ? "Positive" : rev.stars <= 2 ? "Negative" : "Neutral"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───── STEP 3: AI Replies (3 styles) ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(3)}</span>
            <h2 className="step-title">{t.s3_title}</h2>
            <p>{t.s3_body}</p>
            <ul className="step-bullets">
              {t.s3_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="mock-chrome">
                <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
                <span className="mock-url">revuly.dev/dashboard — reply editor</span>
              </div>
              <div className="m3-tabs">
                {[
                  { key: "warm",         label: t.mock_style_warm },
                  { key: "professional", label: t.mock_style_pro },
                  { key: "brief",        label: t.mock_style_brief },
                ].map((s) => (
                  <button
                    key={s.key}
                    className={`m3-tab${activeStyle === s.key ? " active" : ""}`}
                    onClick={() => setActiveStyle(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="m3-reply">{replies[activeStyle]}</div>
              <div className="m3-actions"><button className="m3-copy">📋 {t.mock_copy}</button></div>
            </div>
          </div>
        </div>

        {/* ───── STEP 4: Email notification ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(4)}</span>
            <h2 className="step-title">{t.s4_title}</h2>
            <p>{t.s4_body}</p>
            <ul className="step-bullets">
              {t.s4_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="m4-mail">
                <div className="m4-bar">
                  <div className="m4-bar-logo">✦</div>
                  <div>
                    <div style={{fontSize:11.5,fontWeight:700,color:"#111"}}>Revuly</div>
                    <div className="m4-bar-from">notifications@revuly.dev</div>
                  </div>
                </div>
                <div className="m4-body-pad">
                  <div className="m4-subj">{t.mock_email_subject}</div>
                  <div className="m4-prev">{t.mock_email_preview}</div>
                  <div className="m4-quote">"{reviews[0].text}"<br /><span style={{fontStyle:"normal",color:"#888",fontSize:10.5}}>— {reviews[0].name} · ★★★★★</span></div>
                  <div className="m4-reply-card">
                    <div className="m4-reply-label">{t.mock_style_warm}</div>
                    <div className="m4-reply-text">{replies.warm.slice(0, 110)}…</div>
                  </div>
                  <div className="m4-reply-card">
                    <div className="m4-reply-label">{t.mock_style_pro}</div>
                    <div className="m4-reply-text">{replies.professional.slice(0, 110)}…</div>
                  </div>
                  <a className="m4-cta" href="#" onClick={(e) => e.preventDefault()}>{t.mock_email_btn} →</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── STEP 5: Analytics (pie + legend) ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(5)}</span>
            <h2 className="step-title">{t.s5_title}</h2>
            <p>{t.s5_body}</p>
            <ul className="step-bullets">
              {t.s5_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="mock-chrome">
                <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
                <span className="mock-url">revuly.dev/dashboard/analytics</span>
              </div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:"var(--text3)",marginBottom:10}}>{t.mock_pie_title}</div>
              <div className="m5-row">
                {/* Pie via SVG */}
                <div className="m5-pie">
                  {(() => {
                    const slices = [
                      { color: "#c9a84c", pct: 0.32, label: t.mock_kw_food,     count: 56 },
                      { color: "#e8c96a", pct: 0.24, label: t.mock_kw_service,  count: 42 },
                      { color: "#b8923a", pct: 0.18, label: t.mock_kw_value,    count: 31 },
                      { color: "#a37e2a", pct: 0.14, label: t.mock_kw_ambiance, count: 24 },
                      { color: "#8a6e2f", pct: 0.12, label: t.mock_kw_speed,    count: 21 },
                    ];
                    let acc = 0;
                    const radius = 56;
                    const cx = 70, cy = 70;
                    return (
                      <>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="22" />
                          {slices.map((s, i) => {
                            const len = s.pct * 2 * Math.PI * radius;
                            const gap = 2 * Math.PI * radius - len;
                            const dash = `${len} ${gap}`;
                            const offset = -acc;
                            acc += len;
                            return (
                              <circle
                                key={i}
                                cx={cx} cy={cy} r={radius}
                                fill="none"
                                stroke={s.color}
                                strokeWidth="22"
                                strokeDasharray={dash}
                                strokeDashoffset={offset}
                              />
                            );
                          })}
                        </svg>
                        <div className="m5-pie-center">174</div>
                      </>
                    );
                  })()}
                </div>
                <div className="m5-legend">
                  {[
                    { color: "#c9a84c", label: t.mock_kw_food,     count: 56 },
                    { color: "#e8c96a", label: t.mock_kw_service,  count: 42 },
                    { color: "#b8923a", label: t.mock_kw_value,    count: 31 },
                    { color: "#a37e2a", label: t.mock_kw_ambiance, count: 24 },
                    { color: "#8a6e2f", label: t.mock_kw_speed,    count: 21 },
                  ].map((s) => (
                    <div key={s.label} className="m5-leg">
                      <span className="m5-leg-dot" style={{background:s.color}} />
                      <span>{s.label}</span>
                      <span className="m5-leg-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── STEP 6: Word cloud ───── */}
        <div className="step">
          <div className="step-body">
            <span className="step-label">{t.step_label(6)}</span>
            <h2 className="step-title">{t.s6_title}</h2>
            <p>{t.s6_body}</p>
            <ul className="step-bullets">
              {t.s6_bullets.map((b, i) => <li key={i}><span className="chk">✓</span>{b}</li>)}
            </ul>
          </div>
          <div className="step-mock">
            <div className="mock-frame">
              <div className="mock-chrome">
                <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
                <span className="mock-url">revuly.dev/dashboard/analytics — keywords</span>
              </div>
              <div className="m6-cloud">
                {SAMPLE_CLOUD.map((w) => (
                  <span
                    key={w.w}
                    className="m6-word"
                    style={{
                      fontSize: w.size,
                      color: w.pol === "pos" ? "var(--gold-lt)" : w.pol === "neg" ? "#f08080" : "var(--text2)",
                      opacity: w.pol === "neu" ? 0.7 : 0.95,
                    }}
                  >
                    {w.w}
                  </span>
                ))}
              </div>
              <div className="m6-cloud-help">{t.mock_word_cloud_help}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>{t.cta_title}</h2>
        <p>{t.cta_sub}</p>
        <div className="cta-btns">
          <a className="btn-primary" href="/login">{t.cta_btn_primary}</a>
          <a className="btn-secondary" href="/#pricing">{t.cta_btn_secondary}</a>
        </div>
      </section>

      {/* FOOTER — consistent with the landing page */}
      <footer className="foot">
        <div className="foot-inner">
          <div>
            <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
            <p className="foot-tagline">{lang === "zh" ? "專為頂級餐飲品牌打造的智慧品牌聲譽管理平台。每一則評論，都精準處理。" : "The intelligent reputation management platform for elite hospitality brands. Every review, handled with precision."}</p>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Revuly Inc. {lang === "zh" ? "版權所有。" : "All rights reserved."}</span>
            <div className="foot-links">
              <a href="/#pricing">{lang === "zh" ? "方案" : "Pricing"}</a>
              <a href="/privacy">{lang === "zh" ? "隱私" : "Privacy"}</a>
              <a href="/terms">{lang === "zh" ? "條款" : "Terms"}</a>
              <a href="/refund">{lang === "zh" ? "退款" : "Refund"}</a>
              <a href="/help">{lang === "zh" ? "幫助" : "Help"}</a>
              <a href="/">{t.nav_back}</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
