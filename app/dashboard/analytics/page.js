"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";

// Re-defined here so the Analytics page stays self-contained and matches
// the same buckets the dashboard's left rail / Keyword Intelligence uses.
const KEYWORD_CATS = [
  { name: "Food Quality", pos: ["delicious","amazing","fresh","tasty","flavourful","outstanding"], neg: ["bland","overcooked","disappointing","tasteless"] },
  { name: "Seafood",      pos: ["seafood","oyster","lobster","shrimp","crab","salmon","fresh fish"], neg: [] },
  { name: "Meat",         pos: ["steak","beef","lamb","tender","juicy"], neg: ["overcooked","tough","dry"] },
  { name: "Service",      pos: ["friendly","attentive","professional","helpful","warm"], neg: ["rude","slow","unhelpful","ignored"] },
  { name: "Ambiance",     pos: ["cozy","romantic","elegant","beautiful","atmosphere","clean"], neg: ["noisy","crowded","dirty"] },
  { name: "Value",        pos: ["worth it","affordable","value for money","reasonable"], neg: ["expensive","overpriced","pricey"] },
  { name: "Speed",        pos: ["fast","quick","prompt","efficient"], neg: ["wait","slow","long wait","delayed"] },
  { name: "Crisis",       pos: [], neg: ["terrible","disgusting","never coming back","food poisoning","awful","worst","appalling"] },
];

// English stopwords for the word cloud — we strip these so the cloud
// surfaces actually-meaningful words, not "the / and / was".
const STOPWORDS = new Set("a an the and or but for of in on at to from by with as is was were are be been being have has had do does did this that these those it its they them their there here we us our you your he she his her him i my me on off so very just not no yes if then than too also can will would could should may might must one two three four five six seven eight nine ten oh ah hey".split(" "));

const T = {
  en: {
    page_title: "Analytics",
    page_sub: "Deep-dive into your reviews — ratings, keywords, sentiment trends, and competitor benchmarking.",
    nav_back: "← Dashboard",
    nav_signout: "Sign Out",
    loading: "Loading analytics…",
    empty_state: "Add a few reviews to unlock analytics.",
    sec_overview: "Rating Overview",
    sec_distribution: "Star Distribution",
    sec_mom: "Month-over-Month",
    sec_pie: "Keyword Categories",
    sec_pie_help: "Click a slice to filter the review list below.",
    sec_cloud: "Word Cloud",
    sec_cloud_help: "Gold = positive context, red = negative context, grey = neutral.",
    sec_trend: "Sentiment Trend — Last 6 Months",
    sec_top: "Top Keywords",
    sec_top_pos: "Top Positive Mentions",
    sec_top_neg: "Top Negative Mentions",
    sec_compare: "Competitor Comparison",
    sec_compare_locked: "Competitor comparison is a Pro plan feature.",
    avg_rating: "Average Rating",
    total_reviews: "Total Reviews",
    reply_rate: "Reply Rate",
    this_month_count: "This Month",
    last_month_count: "Last Month",
    delta_up: (n) => `▲ +${n}`,
    delta_down: (n) => `▼ ${n}`,
    delta_flat: "—",
    rating_stars: (n) => `${n} ★`,
    bar_count: "Reviews",
    pos_legend: "Positive",
    neg_legend: "Negative",
    filtered_by: (name) => `Showing reviews containing keywords from "${name}"`,
    filter_clear: "Clear filter",
    no_filtered: "No reviews match this category.",
    no_keywords: "Not enough reviews to extract keywords yet.",
    you_label: "You",
    rating_compare_title: "Rating vs Competitors",
    keyword_compare_title: "Keyword Mentions vs Competitors",
    upgrade_link: "Upgrade to Pro →",
    rank_count: (n) => `${n} mentions`,
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    review_card_date: (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  },
  zh: {
    page_title: "分析",
    page_sub: "深入了解你的評論——評分、關鍵字、情緒趨勢與競爭對手比較。",
    nav_back: "← Dashboard",
    nav_signout: "登出",
    loading: "載入分析中…",
    empty_state: "新增幾則評論後即可解鎖分析功能。",
    sec_overview: "評分總覽",
    sec_distribution: "星等分佈",
    sec_mom: "本月 vs 上月",
    sec_pie: "關鍵字分類圓餅圖",
    sec_pie_help: "點擊區塊可以篩選下方的評論列表。",
    sec_cloud: "關鍵字雲",
    sec_cloud_help: "金色 = 正面語境、紅色 = 負面語境、灰色 = 中性。",
    sec_trend: "情緒趨勢——最近 6 個月",
    sec_top: "熱門關鍵字排行榜",
    sec_top_pos: "Top 正面關鍵字",
    sec_top_neg: "Top 負面關鍵字",
    sec_compare: "競爭對手比較",
    sec_compare_locked: "競爭對手比較是 Pro 方案功能。",
    avg_rating: "平均評分",
    total_reviews: "評論總數",
    reply_rate: "回覆率",
    this_month_count: "本月",
    last_month_count: "上月",
    delta_up: (n) => `▲ +${n}`,
    delta_down: (n) => `▼ ${n}`,
    delta_flat: "—",
    rating_stars: (n) => `${n} ★`,
    bar_count: "評論數",
    pos_legend: "正面",
    neg_legend: "負面",
    filtered_by: (name) => `顯示包含「${name}」類別關鍵字的評論`,
    filter_clear: "清除篩選",
    no_filtered: "沒有評論符合此類別。",
    no_keywords: "評論還不夠多，無法擷取關鍵字。",
    you_label: "你的店",
    rating_compare_title: "評分 vs 競爭對手",
    keyword_compare_title: "關鍵字提及次數 vs 競爭對手",
    upgrade_link: "升級至 Pro →",
    rank_count: (n) => `${n} 次提及`,
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    review_card_date: (d) => new Date(d).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" }),
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;
    --gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);
    --text1:#f0ede6;--text2:#a09888;--text3:#5a5550;
    --r:10px;--neg:#e06060;--pos:#5dba7a;--neu:#a0a09a;
  }
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:sticky;top:0;z-index:10}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .topbar-right{display:flex;align-items:center;gap:8px}
  .icon-btn{height:34px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-family:inherit;transition:all .2s;text-decoration:none;font-weight:600}
  .icon-btn:hover{border-color:var(--gold-border);color:var(--gold-lt)}
  .lang-toggle{height:34px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text2);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer}
  .lang-toggle:hover{border-color:var(--gold-border);color:var(--gold-lt)}

  .wrap{max-width:1180px;margin:0 auto;padding:40px 6vw 80px}
  .page-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;margin-bottom:6px}
  .page-sub{font-size:14px;color:var(--text2);margin-bottom:36px;line-height:1.6}

  .grid{display:grid;gap:20px}
  .grid-2{grid-template-columns:1fr 1fr}
  .grid-4{grid-template-columns:repeat(4,1fr)}
  @media(max-width:900px){.grid-2{grid-template-columns:1fr}.grid-4{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:500px){.grid-4{grid-template-columns:1fr 1fr}}

  .card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:22px}
  .card-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
  .card-help{font-size:12px;color:var(--text3);margin-top:-6px;margin-bottom:14px;line-height:1.5}

  .big-rating{font-family:'Playfair Display',serif;font-size:64px;font-weight:700;color:var(--gold-lt);line-height:1}
  .big-rating-sub{font-size:13px;color:var(--text2);margin-top:6px;font-weight:600}
  .stat-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:18px}
  .stat-n{font-size:28px;font-weight:700;color:var(--text1);font-family:'Playfair Display',serif;line-height:1}
  .stat-l{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-top:6px}
  .stat-delta{font-size:12px;font-weight:700;margin-top:4px}
  .stat-delta.up{color:var(--pos)}
  .stat-delta.down{color:var(--neg)}
  .stat-delta.flat{color:var(--text3)}

  .star-rows{display:flex;flex-direction:column;gap:8px}
  .star-row{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:10px;font-size:12.5px}
  .star-row-label{color:var(--gold);font-weight:700}
  .star-row-track{height:10px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden}
  .star-row-fill{height:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold-lt));border-radius:999px;transition:width .4s}
  .star-row-count{color:var(--text2);text-align:right;font-weight:600}

  .pie-wrap{height:280px;width:100%}
  @media(max-width:600px){.pie-wrap{height:240px}}
  .line-wrap{height:280px;width:100%}
  .bar-wrap{height:260px;width:100%}

  .cloud{display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:center;padding:10px 4px;min-height:140px;align-items:center}
  .cloud-word{cursor:default;line-height:1;transition:transform .15s}
  .cloud-word:hover{transform:scale(1.08)}

  .rank-list{display:flex;flex-direction:column;gap:8px}
  .rank-row{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border:1px solid rgba(255,255,255,.04);border-radius:8px;cursor:pointer;transition:all .15s}
  .rank-row:hover{border-color:var(--gold-border)}
  .rank-row.active{background:rgba(201,168,76,.08);border-color:var(--gold-border)}
  .rank-n{font-size:13px;font-weight:700;color:var(--text3);text-align:center}
  .rank-word{font-size:13.5px;color:var(--text1);font-weight:600}
  .rank-count{font-size:11.5px;color:var(--text2);font-weight:600}
  .rank-row.neg .rank-word{color:#f08080}

  .filter-banner{padding:10px 14px;background:rgba(201,168,76,.08);border:1px solid var(--gold-border);border-radius:8px;font-size:13px;color:var(--gold-lt);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .filter-banner button{padding:5px 12px;border-radius:6px;background:transparent;border:1px solid var(--gold-border);color:var(--gold-lt);font-size:12px;font-weight:600;font-family:inherit;cursor:pointer}
  .filter-banner button:hover{background:rgba(201,168,76,.08)}

  .review-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:380px;overflow-y:auto;padding-right:6px}
  .review-list::-webkit-scrollbar{width:6px}
  .review-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
  .review-item{padding:10px 12px;background:var(--bg2);border:1px solid rgba(255,255,255,.05);border-radius:8px;font-size:12.5px}
  .review-item-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap}
  .review-item-name{font-weight:700;color:var(--text1)}
  .review-item-stars{color:var(--gold);letter-spacing:1px}
  .review-item-date{font-size:11px;color:var(--text3)}
  .review-item-text{color:var(--text2);line-height:1.55;font-size:12.5px}

  .compare-row{display:grid;gap:10px}
  .compare-card{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  .compare-card.you{border-color:var(--gold-border);background:rgba(201,168,76,.05)}
  .compare-name{font-size:13.5px;font-weight:700;color:var(--text1)}
  .compare-rating{font-size:18px;font-weight:700;color:var(--gold-lt);font-family:'Playfair Display',serif}
  .compare-count{font-size:11px;color:var(--text2);font-weight:600;margin-top:2px}

  .locked-note{padding:14px;background:rgba(201,168,76,.05);border:1px dashed var(--gold-border);border-radius:var(--r);font-size:13px;color:var(--text2);text-align:center;line-height:1.6}
  .locked-note a{color:var(--gold);text-decoration:none;font-weight:600}
  .locked-note a:hover{text-decoration:underline}

  .recharts-default-tooltip{background:var(--bg2) !important;border:1px solid var(--gold-border) !important;border-radius:8px !important;font-family:'Inter',sans-serif !important}
  .recharts-tooltip-label{color:var(--text1) !important;font-weight:700 !important}
  .recharts-tooltip-item{color:var(--text2) !important}

  .empty-block{padding:48px 20px;text-align:center;color:var(--text3);font-size:14px;font-style:italic}

  /* Phone-only tightening — keep cards & charts inside the viewport
     on iPhone SE-class widths and stop legends overflowing. */
  @media (max-width: 600px) {
    .wrap{padding:28px 4vw 60px}
    .page-title{font-size:26px}
    .page-sub{font-size:13px;margin-bottom:22px}
    .card{padding:16px}
    .big-rating{font-size:48px}
    .stat-card{padding:14px}
    .stat-n{font-size:22px}
    .star-row{grid-template-columns:36px 1fr 32px;gap:8px;font-size:12px}
    .rank-row{grid-template-columns:22px 1fr auto;padding:7px 10px}
    .rank-word{font-size:13px}
    .compare-row{grid-template-columns:1fr !important}
    .pie-wrap{height:220px}
    .line-wrap{height:240px}
    .bar-wrap{height:240px}
    .recharts-default-tooltip{font-size:11px !important;padding:6px 10px !important}
    .cloud{gap:6px 10px;padding:6px 2px}
  }
  @media (max-width: 380px) {
    .topbar{padding:0 12px}
    .icon-btn,.lang-toggle{padding:0 10px;font-size:11.5px}
    .big-rating{font-size:42px}
    .stat-n{font-size:20px}
  }
`;

// ───────── Data helpers ─────────

function analyseKeywords(reviews, customKeywords = []) {
  const baseResults = KEYWORD_CATS.map((cat) => {
    let posCount = 0, negCount = 0;
    reviews.forEach((r) => {
      const text = (r.content || "").toLowerCase();
      cat.pos.forEach((kw) => { if (text.includes(kw)) posCount++; });
      cat.neg.forEach((kw) => { if (text.includes(kw)) negCount++; });
    });
    return { ...cat, posCount, negCount, total: posCount + negCount, isCustom: false };
  });
  const customResults = (customKeywords || []).map((kw) => {
    const lower = String(kw || "").trim().toLowerCase();
    if (!lower) return null;
    let posCount = 0, negCount = 0;
    reviews.forEach((r) => {
      const text = (r.content || "").toLowerCase();
      if (text.includes(lower)) {
        if (r.stars >= 4) posCount++;
        else if (r.stars <= 2) negCount++;
        else posCount++;
      }
    });
    return { name: kw, pos: [lower], neg: [], posCount, negCount, total: posCount + negCount, isCustom: true };
  }).filter(Boolean);
  return [...customResults, ...baseResults].filter((c) => c.total > 0);
}

// Build a frequency map for the word cloud. Stars determine the polarity
// of each occurrence so the same word can lean positive in one review and
// negative in another.
function buildWordCloud(reviews) {
  const freq = new Map(); // word → { pos, neg, neu }
  reviews.forEach((r) => {
    const text = String(r.content || "").toLowerCase().replace(/[^a-z一-鿿\s]/g, " ");
    const words = text.split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    const polarity = r.stars >= 4 ? "pos" : r.stars <= 2 ? "neg" : "neu";
    const seen = new Set();
    for (const w of words) {
      if (seen.has(w)) continue;
      seen.add(w);
      const cur = freq.get(w) || { pos: 0, neg: 0, neu: 0 };
      cur[polarity]++;
      freq.set(w, cur);
    }
  });
  return Array.from(freq.entries())
    .map(([word, counts]) => {
      const total = counts.pos + counts.neg + counts.neu;
      const polarity = counts.pos > counts.neg ? "pos" : counts.neg > counts.pos ? "neg" : "neu";
      return { word, total, polarity, counts };
    })
    .filter((w) => w.total >= 2) // need at least 2 mentions for the cloud
    .sort((a, b) => b.total - a.total)
    .slice(0, 60); // cap so the cloud stays readable
}

function buildSentimentTrend(reviews, months, monthLabels) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: monthLabels[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      pos: 0,
      neg: 0,
    });
  }
  reviews.forEach((r) => {
    const d = new Date(r.review_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) return;
    if (r.stars >= 4) bucket.pos++;
    else if (r.stars <= 2) bucket.neg++;
  });
  return buckets;
}

function detectLang() {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem("revuly-lang") === "zh" ? "zh" : "en";
  } catch { return "en"; }
}

// ───────── Page ─────────

const POS_COLORS = ["#c9a84c","#e8c96a","#b8923a","#a37e2a","#cfb35b","#d8c277","#9c7521","#e2cf85","#8a6e2f","#f0db97"];
const SENTIMENT_POS_COLOR = "#5dba7a";
const SENTIMENT_NEG_COLOR = "#e06060";

export default function AnalyticsPage() {
  const [lang, setLang] = useState("en");
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [competitorReviews, setCompetitorReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kwFilter, setKwFilter] = useState(null);
  const supabase = createClient();
  const t = T[lang];

  useEffect(() => { setLang(detectLang()); }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      let q = supabase.from("reviews").select("*").eq("user_id", user.id);
      if (prof?.place_id) q = q.or(`place_id.eq.${prof.place_id},place_id.is.null`);
      const { data: revs } = await q.order("review_date", { ascending: false });
      setProfile(prof);
      setReviews(revs || []);
      if (prof?.plan === "pro") {
        const [{ data: comps }, { data: compRevs }] = await Promise.all([
          supabase.from("competitors").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("competitor_reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
        ]);
        setCompetitors(comps || []);
        setCompetitorReviews(compRevs || []);
      }
      setLoading(false);
    })();
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    try { window.localStorage.setItem("revuly-lang", next); } catch {}
  };

  const customKeywords = Array.isArray(profile?.custom_keywords) ? profile.custom_keywords : [];

  // ───── Derived analytics ─────
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: "—", total: 0, replyRate: 0, thisMonth: 0, lastMonth: 0, delta: 0 };
    }
    const total = reviews.length;
    const avg = (reviews.reduce((s, r) => s + (r.stars || 0), 0) / total).toFixed(1);
    const replyRate = Math.round((reviews.filter((r) => r.replied).length / total) * 100);
    const now = new Date();
    const thisMonth = reviews.filter((r) => {
      const d = new Date(r.review_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = reviews.filter((r) => {
      const d = new Date(r.review_date);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    }).length;
    return { avg, total, replyRate, thisMonth, lastMonth, delta: thisMonth - lastMonth };
  }, [reviews]);

  const distribution = useMemo(() => {
    const dist = [5,4,3,2,1].map((star) => ({
      star,
      count: reviews.filter((r) => r.stars === star).length,
    }));
    const max = Math.max(1, ...dist.map((d) => d.count));
    return dist.map((d) => ({ ...d, pct: Math.round((d.count / max) * 100) }));
  }, [reviews]);

  const keywords = useMemo(() => analyseKeywords(reviews, customKeywords), [reviews, customKeywords]);
  const pieData = useMemo(
    () => keywords.map((k) => ({ name: k.name, value: k.total, posCount: k.posCount, negCount: k.negCount })),
    [keywords]
  );

  const cloud = useMemo(() => buildWordCloud(reviews), [reviews]);

  const trend = useMemo(() => buildSentimentTrend(reviews, 6, t.months), [reviews, t.months]);

  // Top 10 positive / negative individual keywords from the category table.
  const topPositive = useMemo(() => {
    const acc = new Map();
    KEYWORD_CATS.forEach((cat) => {
      cat.pos.forEach((kw) => {
        let n = 0;
        reviews.forEach((r) => { if ((r.content || "").toLowerCase().includes(kw)) n++; });
        if (n > 0) acc.set(kw, (acc.get(kw) || 0) + n);
      });
    });
    return Array.from(acc.entries())
      .map(([kw, n]) => ({ keyword: kw, count: n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reviews]);

  const topNegative = useMemo(() => {
    const acc = new Map();
    KEYWORD_CATS.forEach((cat) => {
      cat.neg.forEach((kw) => {
        let n = 0;
        reviews.forEach((r) => { if ((r.content || "").toLowerCase().includes(kw)) n++; });
        if (n > 0) acc.set(kw, (acc.get(kw) || 0) + n);
      });
    });
    return Array.from(acc.entries())
      .map(([kw, n]) => ({ keyword: kw, count: n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reviews]);

  // Filtered reviews (when a pie slice or rank-row is clicked).
  const filteredReviews = useMemo(() => {
    if (!kwFilter) return [];
    const cat = KEYWORD_CATS.find((c) => c.name === kwFilter);
    if (cat) {
      const all = [...cat.pos, ...cat.neg].map((k) => k.toLowerCase());
      return reviews.filter((r) => {
        const txt = (r.content || "").toLowerCase();
        return all.some((kw) => txt.includes(kw));
      });
    }
    // Custom keyword / individual word
    const needle = String(kwFilter).toLowerCase();
    return reviews.filter((r) => (r.content || "").toLowerCase().includes(needle));
  }, [kwFilter, reviews]);

  // Competitor keyword comparison data
  const compKeywordCompare = useMemo(() => {
    if (competitors.length === 0) return null;
    const yourTop = analyseKeywords(reviews, customKeywords).slice(0, 6);
    const rows = yourTop.map((kw) => {
      const yourCount = kw.total;
      const compCounts = competitors.map((c) => {
        const compReviews = competitorReviews
          .filter((cr) => cr.competitor_place_id === c.place_id)
          .map((cr) => ({ content: cr.review_content, stars: cr.stars }));
        const analysed = analyseKeywords(compReviews, customKeywords).find((k) => k.name === kw.name);
        return { name: c.name || "Competitor", count: analysed?.total || 0 };
      });
      return { keyword: kw.name, you: yourCount, competitors: compCounts };
    });
    return rows;
  }, [competitors, competitorReviews, reviews, customKeywords]);

  // ───── Render ─────

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="analytics" />
        <div className="topbar">
          <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly</a>
        </div>
        <div className="wrap"><div className="empty-block">{t.loading}</div></div>
      </>
    );
  }

  const hasReviews = reviews.length > 0;
  const isPro = profile?.plan === "pro";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="analytics" />
      <div className="topbar">
        <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly</a>
        <div className="topbar-right">
          <button className="lang-toggle" onClick={toggleLang}>{lang === "en" ? "中文" : "EN"}</button>
          <a className="icon-btn" href="/dashboard">{t.nav_back}</a>
        </div>
      </div>

      <div className="wrap">
        <h1 className="page-title">{t.page_title}</h1>
        <p className="page-sub">{t.page_sub}</p>

        {!hasReviews ? (
          <div className="card"><div className="empty-block">{t.empty_state}</div></div>
        ) : (
          <>
            {/* ─── RATING OVERVIEW ─── */}
            <div className="grid grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div className="card-title">{t.sec_overview}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:18}}>
                  <div className="big-rating">{stats.avg}★</div>
                  <div className="big-rating-sub">{t.avg_rating}</div>
                </div>
                <div className="star-rows">
                  {distribution.map((d) => (
                    <div key={d.star} className="star-row">
                      <span className="star-row-label">{t.rating_stars(d.star)}</span>
                      <div className="star-row-track"><div className="star-row-fill" style={{width:`${d.pct}%`}} /></div>
                      <span className="star-row-count">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="grid grid-2" style={{gap:14,marginBottom:14}}>
                  <div className="stat-card">
                    <div className="stat-n">{stats.total}</div>
                    <div className="stat-l">{t.total_reviews}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-n">{stats.replyRate}%</div>
                    <div className="stat-l">{t.reply_rate}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-n">{stats.thisMonth}</div>
                    <div className="stat-l">{t.this_month_count}</div>
                    {(() => {
                      if (stats.delta === 0) return <div className="stat-delta flat">{t.delta_flat}</div>;
                      return stats.delta > 0
                        ? <div className="stat-delta up">{t.delta_up(stats.delta)}</div>
                        : <div className="stat-delta down">{t.delta_down(stats.delta)}</div>;
                    })()}
                  </div>
                  <div className="stat-card">
                    <div className="stat-n">{stats.lastMonth}</div>
                    <div className="stat-l">{t.last_month_count}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── KEYWORD PIE + WORD CLOUD ─── */}
            <div className="grid grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div className="card-title">{t.sec_pie}</div>
                <div className="card-help">{t.sec_pie_help}</div>
                {pieData.length === 0 ? (
                  <div className="empty-block" style={{padding:"40px 12px"}}>{t.no_keywords}</div>
                ) : (
                  <div className="pie-wrap">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={95}
                          paddingAngle={2}
                          onClick={(slice) => setKwFilter(kwFilter === slice.name ? null : slice.name)}
                        >
                          {pieData.map((_, i) => <Cell key={i} fill={POS_COLORS[i % POS_COLORS.length]} cursor="pointer" />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{background:"#1c1c22",border:"1px solid rgba(201,168,76,.3)",borderRadius:8}}
                          itemStyle={{color:"#f0ede6"}}
                          formatter={(value, name, props) => {
                            const p = props.payload;
                            return [`${value} (+${p.posCount} / −${p.negCount})`, name];
                          }}
                        />
                        <Legend
                          wrapperStyle={{fontSize:11,color:"#a09888"}}
                          iconType="circle"
                          formatter={(v) => <span style={{color:"#a09888"}}>{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-title">{t.sec_cloud}</div>
                <div className="card-help">{t.sec_cloud_help}</div>
                {cloud.length === 0 ? (
                  <div className="empty-block" style={{padding:"40px 12px"}}>{t.no_keywords}</div>
                ) : (
                  <div className="cloud">
                    {cloud.map((w) => {
                      const size = 12 + Math.min(28, w.total * 2);
                      const color = w.polarity === "pos" ? "var(--gold-lt)" : w.polarity === "neg" ? "#f08080" : "var(--text2)";
                      return (
                        <span
                          key={w.word}
                          className="cloud-word"
                          style={{fontSize:size,color,fontWeight:600 + Math.min(200, w.total * 30),opacity:.6 + Math.min(.4, w.total * 0.06)}}
                          title={`${w.word} — +${w.counts.pos} / ~${w.counts.neu} / −${w.counts.neg}`}
                          onClick={() => setKwFilter(kwFilter === w.word ? null : w.word)}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ─── SENTIMENT TREND ─── */}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-title">{t.sec_trend}</div>
              <div className="line-wrap">
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{top:8,right:14,left:-12,bottom:0}}>
                    <CartesianGrid stroke="rgba(255,255,255,.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#5a5550" style={{fontSize:11}} />
                    <YAxis stroke="#5a5550" style={{fontSize:11}} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{background:"#1c1c22",border:"1px solid rgba(201,168,76,.3)",borderRadius:8}}
                      itemStyle={{color:"#f0ede6"}}
                    />
                    <Legend
                      wrapperStyle={{fontSize:11,color:"#a09888"}}
                      formatter={(v) => <span style={{color:"#a09888"}}>{v === "pos" ? t.pos_legend : v === "neg" ? t.neg_legend : v}</span>}
                    />
                    <Line type="monotone" dataKey="pos" stroke={SENTIMENT_POS_COLOR} strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}} name={t.pos_legend} />
                    <Line type="monotone" dataKey="neg" stroke={SENTIMENT_NEG_COLOR} strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}} name={t.neg_legend} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── TOP KEYWORDS RANK ─── */}
            <div className="grid grid-2" style={{marginBottom:20}}>
              <div className="card">
                <div className="card-title">{t.sec_top_pos}</div>
                {topPositive.length === 0 ? (
                  <div className="empty-block" style={{padding:"24px 12px"}}>{t.no_keywords}</div>
                ) : (
                  <div className="rank-list">
                    {topPositive.map((row, i) => (
                      <div
                        key={row.keyword}
                        className={`rank-row${kwFilter === row.keyword ? " active" : ""}`}
                        onClick={() => setKwFilter(kwFilter === row.keyword ? null : row.keyword)}
                      >
                        <span className="rank-n">{i + 1}</span>
                        <span className="rank-word">{row.keyword}</span>
                        <span className="rank-count">{t.rank_count(row.count)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card-title">{t.sec_top_neg}</div>
                {topNegative.length === 0 ? (
                  <div className="empty-block" style={{padding:"24px 12px"}}>{t.no_keywords}</div>
                ) : (
                  <div className="rank-list">
                    {topNegative.map((row, i) => (
                      <div
                        key={row.keyword}
                        className={`rank-row neg${kwFilter === row.keyword ? " active" : ""}`}
                        onClick={() => setKwFilter(kwFilter === row.keyword ? null : row.keyword)}
                      >
                        <span className="rank-n">{i + 1}</span>
                        <span className="rank-word">{row.keyword}</span>
                        <span className="rank-count">{t.rank_count(row.count)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── FILTERED REVIEW LIST (when a slice / row is clicked) ─── */}
            {kwFilter && (
              <div className="card" style={{marginBottom:20}}>
                <div className="filter-banner">
                  <span>{t.filtered_by(kwFilter)}</span>
                  <button onClick={() => setKwFilter(null)}>{t.filter_clear}</button>
                </div>
                {filteredReviews.length === 0 ? (
                  <div className="empty-block" style={{padding:"20px 12px"}}>{t.no_filtered}</div>
                ) : (
                  <div className="review-list">
                    {filteredReviews.map((r) => (
                      <div key={r.id} className="review-item">
                        <div className="review-item-head">
                          <span className="review-item-name">{r.reviewer_name || "Anonymous"}</span>
                          <span className="review-item-stars">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                          <span className="review-item-date">{t.review_card_date(r.review_date)}</span>
                        </div>
                        <div className="review-item-text">{r.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── COMPETITOR COMPARISON (Pro only) ─── */}
            <div className="card">
              <div className="card-title">{t.sec_compare}</div>
              {!isPro ? (
                <div className="locked-note">
                  {t.sec_compare_locked}{" "}
                  <a href="/dashboard/settings#plan-section">{t.upgrade_link}</a>
                </div>
              ) : competitors.length === 0 ? (
                <div className="locked-note">
                  <a href="/dashboard/settings#comp-section">{lang === "zh" ? "前往「設定」新增競爭對手 →" : "Go to Settings to add competitors →"}</a>
                </div>
              ) : (
                <>
                  {/* Rating compare */}
                  <div style={{marginBottom:18}}>
                    <div className="card-title" style={{margin:"0 0 10px",padding:0,border:"none"}}>{t.rating_compare_title}</div>
                    <div className="compare-row" style={{gridTemplateColumns:`repeat(${1 + competitors.length}, 1fr)`}}>
                      <div className="compare-card you">
                        <div>
                          <div className="compare-name">{t.you_label}</div>
                          <div className="compare-count">{stats.total} reviews</div>
                        </div>
                        <div className="compare-rating">{stats.avg}★</div>
                      </div>
                      {competitors.map((c) => (
                        <div key={c.id} className="compare-card">
                          <div>
                            <div className="compare-name">{c.name || "Competitor"}</div>
                            <div className="compare-count">{c.user_rating_count?.toLocaleString() || 0} reviews</div>
                          </div>
                          <div className="compare-rating">{typeof c.rating === "number" ? `${c.rating.toFixed(1)}★` : "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keyword compare bar chart */}
                  <div>
                    <div className="card-title" style={{margin:"0 0 10px",padding:0,border:"none"}}>{t.keyword_compare_title}</div>
                    {!compKeywordCompare || compKeywordCompare.length === 0 ? (
                      <div className="empty-block">{t.no_keywords}</div>
                    ) : (
                      <div className="bar-wrap">
                        <ResponsiveContainer>
                          <BarChart
                            data={compKeywordCompare.map((row) => {
                              const entry = { keyword: row.keyword, you: row.you };
                              row.competitors.forEach((c, i) => { entry[`comp${i}`] = c.count; });
                              return entry;
                            })}
                            margin={{top:8,right:14,left:-10,bottom:0}}
                          >
                            <CartesianGrid stroke="rgba(255,255,255,.05)" strokeDasharray="3 3" />
                            <XAxis dataKey="keyword" stroke="#5a5550" style={{fontSize:11}} />
                            <YAxis stroke="#5a5550" style={{fontSize:11}} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{background:"#1c1c22",border:"1px solid rgba(201,168,76,.3)",borderRadius:8}}
                              itemStyle={{color:"#f0ede6"}}
                              formatter={(value, name) => {
                                if (name === "you") return [value, t.you_label];
                                const idx = parseInt(String(name).replace("comp", ""), 10);
                                return [value, competitors[idx]?.name || "Competitor"];
                              }}
                            />
                            <Legend
                              wrapperStyle={{fontSize:11,color:"#a09888"}}
                              formatter={(v) => {
                                if (v === "you") return <span style={{color:"#e8c96a"}}>{t.you_label}</span>;
                                const idx = parseInt(String(v).replace("comp", ""), 10);
                                return <span style={{color:"#a09888"}}>{competitors[idx]?.name || "Competitor"}</span>;
                              }}
                            />
                            <Bar dataKey="you" fill="#c9a84c" />
                            {competitors.map((_, i) => (
                              <Bar key={i} dataKey={`comp${i}`} fill={POS_COLORS[(i + 3) % POS_COLORS.length]} opacity={0.55} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
