"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getPlan, usagePercent, isOverLimit, canUseFeature } from "@/lib/plans";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--surface2:#222229;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--gold-glow:rgba(201,168,76,0.1);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--pos-fg:#5dba7a;--neg-fg:#e06060;--neu-fg:#e8b84b}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;overflow:hidden;height:100vh}

  /* TOPBAR */
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:relative;z-index:10;flex-shrink:0}
  .topbar-left{display:flex;align-items:center;gap:16px}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .live-badge{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.25);font-size:11px;font-weight:700;color:var(--pos-fg);letter-spacing:.8px;text-transform:uppercase}
  .live-dot{width:5px;height:5px;border-radius:50%;background:var(--pos-fg);animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .topbar-right{display:flex;align-items:center;gap:12px}
  .plan-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;background:rgba(201,168,76,.12);border:1px solid var(--gold-border);color:var(--gold)}
  .restaurant-name{font-size:13.5px;font-weight:600;color:var(--text1)}
  .icon-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .2s}
  .icon-btn:hover{border-color:var(--gold-border);color:var(--gold-lt)}

  /* LAYOUT */
  .body{display:grid;grid-template-columns:252px 1fr 400px;height:calc(100vh - 58px)}
  .col{height:100%;overflow-y:auto;overflow-x:hidden}
  .col::-webkit-scrollbar{width:4px}
  .col::-webkit-scrollbar-track{background:transparent}
  .col::-webkit-scrollbar-thumb{background:rgba(201,168,76,.2);border-radius:999px}

  /* LEFT COL */
  .left-col{background:var(--bg2);border-right:1px solid rgba(255,255,255,.06);padding:16px}
  .usage-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:14px;margin-bottom:12px}
  .usage-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .usage-label{font-size:11.5px;color:var(--text2)}
  .usage-val{font-size:12px;font-weight:700;color:var(--gold)}
  .usage-bar{height:5px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
  .usage-fill{height:100%;border-radius:999px;transition:width .4s}
  .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
  .stat-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:12px}
  .stat-n{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text1)}
  .stat-l{font-size:11px;color:var(--text2);margin-top:2px}
  .section-label{font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin:16px 0 8px;padding-left:4px}
  .filter-btn{width:100%;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;border:none;background:transparent;color:var(--text2);cursor:pointer;font-size:13.5px;font-family:inherit;font-weight:500;transition:all .18s;text-align:left}
  .filter-btn:hover{background:var(--surface);color:var(--text1)}
  .filter-btn.active{background:var(--surface);color:var(--text1);font-weight:600}
  .filter-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .filter-count{margin-left:auto;font-size:11.5px;color:var(--text3);background:rgba(255,255,255,.06);padding:2px 7px;border-radius:999px}

  /* KEYWORD INTELLIGENCE */
  .keyword-section{margin-top:12px}
  .kw-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .2s}
  .kw-card:hover{border-color:var(--gold-border)}
  .kw-card.active{border-color:var(--gold)}
  .kw-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .kw-name{font-size:12px;font-weight:700;color:var(--text1)}
  .kw-count{font-size:11px;color:var(--text3)}
  .kw-bar-wrap{height:4px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden}
  .kw-bar-pos{height:100%;border-radius:999px;float:left;transition:width .4s}
  .kw-bar-neg{height:100%;border-radius:999px;float:left;transition:width .4s}
  .kw-labels{display:flex;justify-content:space-between;margin-top:5px}
  .kw-label{font-size:10px;color:var(--text3)}
  .kw-label.pos{color:var(--pos-fg)}
  .kw-label.neg{color:var(--neg-fg)}

  /* MIDDLE COL */
  .mid-col{background:var(--bg);border-right:1px solid rgba(255,255,255,.06)}
  .mid-header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg);z-index:5}
  .mid-title{font-size:14px;font-weight:700}
  .mid-count{font-size:12px;color:var(--text3)}
  .btn-add{padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .2s}
  .btn-add:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(201,168,76,.35)}
  .review-card{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background .18s;position:relative}
  .review-card:hover{background:rgba(255,255,255,.02)}
  .review-card.selected{background:rgba(201,168,76,.05);border-right:2px solid var(--gold)}
  .review-card.crisis{border-left:3px solid var(--neg-fg)}
  .review-meta{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
  .review-name{font-size:13.5px;font-weight:700}
  .stars{color:var(--gold);font-size:12px;letter-spacing:1px}
  .review-date{font-size:11.5px;color:var(--text3)}
  .sentiment-tag{padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.4px}
  .sent-positive{background:rgba(93,186,122,.12);color:var(--pos-fg);border:1px solid rgba(93,186,122,.25)}
  .sent-negative{background:rgba(224,96,96,.12);color:var(--neg-fg);border:1px solid rgba(224,96,96,.25)}
  .sent-neutral{background:rgba(232,184,75,.12);color:var(--neu-fg);border:1px solid rgba(232,184,75,.25)}
  .crisis-tag{padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;background:rgba(224,96,96,.2);color:var(--neg-fg);border:1px solid rgba(224,96,96,.4)}
  .review-text{font-size:13.5px;color:var(--text2);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .review-actions{display:flex;align-items:center;gap:8px;margin-top:8px}
  .replied-tag{font-size:11px;font-weight:600;color:var(--pos-fg);display:flex;align-items:center;gap:4px}
  .btn-del{padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:600;font-family:inherit;border:1px solid rgba(224,96,96,.25);background:transparent;color:var(--neg-fg);cursor:pointer;margin-left:auto;transition:all .2s}
  .btn-del:hover{background:rgba(224,96,96,.1)}

  /* ADD REVIEW MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
  .modal{background:var(--surface);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:28px;width:100%;max-width:480px}
  .modal h3{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:6px}
  .modal-sub{font-size:13.5px;color:var(--text2);margin-bottom:24px}
  .modal-group{margin-bottom:14px}
  .modal-label{display:block;font-size:11.5px;font-weight:600;color:var(--text2);letter-spacing:.3px;text-transform:uppercase;margin-bottom:6px}
  .modal-input{width:100%;padding:10px 12px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:14px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .modal-input:focus{border-color:var(--gold-border)}
  .modal-input::placeholder{color:var(--text3)}
  .modal-textarea{resize:vertical;min-height:90px}
  .star-select{display:flex;gap:6px}
  .star-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:transparent;font-size:16px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
  .star-btn.active{background:rgba(201,168,76,.15);border-color:var(--gold-border)}
  .modal-actions{display:flex;gap:10px;margin-top:20px}
  .modal-cancel{flex:1;padding:11px;border-radius:var(--r);font-size:14px;font-weight:600;font-family:inherit;background:transparent;color:var(--text2);border:1px solid rgba(255,255,255,.12);cursor:pointer;transition:all .2s}
  .modal-cancel:hover{border-color:var(--gold-border);color:var(--text1)}
  .modal-save{flex:1;padding:11px;border-radius:var(--r);font-size:14px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s}
  .modal-save:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(201,168,76,.35)}
  .modal-save:disabled{opacity:.6;cursor:not-allowed;transform:none}

  /* RIGHT COL — AI EDITOR */
  .right-col{background:var(--bg2)}
  .editor-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text3);text-align:center;padding:40px}
  .editor-empty-icon{font-size:40px;margin-bottom:14px;opacity:.5}
  .editor-empty h4{font-size:15px;font-weight:600;margin-bottom:6px;color:var(--text2)}
  .editor-empty p{font-size:13px;line-height:1.6}
  .editor-header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;background:var(--bg2);z-index:5}
  .editor-review-name{font-size:13px;font-weight:700;margin-bottom:2px}
  .editor-review-meta{display:flex;align-items:center;gap:8px}
  .editor-review-text{padding:14px 16px;font-size:13.5px;color:var(--text2);line-height:1.7;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
  .style-tabs{display:flex;padding:12px 16px;gap:8px;border-bottom:1px solid rgba(255,255,255,.06)}
  .style-tab{flex:1;padding:7px 4px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;font-size:11.5px;font-weight:600;font-family:inherit;color:var(--text2);cursor:pointer;transition:all .2s;text-align:center}
  .style-tab.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .lang-row{padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .lang-label{font-size:11.5px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .lang-btn{padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:600;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--text2);transition:all .2s}
  .lang-btn.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .generate-area{padding:14px 16px}
  .btn-generate{width:100%;padding:12px;border-radius:var(--r);font-size:14px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 3px 12px rgba(201,168,76,.28)}
  .btn-generate:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,.4)}
  .btn-generate:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .reply-cards{display:flex;flex-direction:column;gap:12px;padding:12px 16px;animation:fadeIn .4s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .reply-card{background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);padding:14px;transition:border-color .2s}
  .reply-card:hover{border-color:var(--gold-border)}
  .reply-style{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .reply-text{font-size:13.5px;color:var(--text2);line-height:1.7;margin-bottom:12px}
  .reply-actions{display:flex;gap:8px;align-items:center}
  .btn-copy{padding:5px 14px;border-radius:7px;font-size:12px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .18s}
  .btn-copy:hover{box-shadow:0 2px 8px rgba(201,168,76,.35)}
  .btn-regen{padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .18s}
  .btn-regen:hover{border-color:var(--gold-border);color:var(--text1)}
  .copied-hint{font-size:11px;color:var(--pos-fg);font-weight:600}
  .upgrade-banner{margin:14px 16px;padding:14px;background:rgba(201,168,76,.06);border:1px solid var(--gold-border);border-radius:var(--r);text-align:center}
  .upgrade-banner p{font-size:13px;color:var(--text2);margin-bottom:10px}
  .btn-upgrade{padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer}
  .shimmer{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .empty-reviews{padding:60px 20px;text-align:center;color:var(--text3)}
  .empty-reviews h4{font-size:15px;color:var(--text2);margin-bottom:8px}
  .empty-reviews p{font-size:13px;line-height:1.6}
`;

const KEYWORD_CATS = [
  { name: "Food Quality", pos: ["delicious","amazing","fresh","tasty","flavourful","outstanding"], neg: ["bland","overcooked","disappointing","tasteless"] },
  { name: "Seafood", pos: ["seafood","oyster","lobster","shrimp","crab","salmon","fresh fish"], neg: [] },
  { name: "Meat", pos: ["steak","beef","lamb","tender","juicy"], neg: ["overcooked","tough","dry"] },
  { name: "Service", pos: ["friendly","attentive","professional","helpful","warm"], neg: ["rude","slow","unhelpful","ignored"] },
  { name: "Ambiance", pos: ["cozy","romantic","elegant","beautiful","atmosphere","clean"], neg: ["noisy","crowded","dirty"] },
  { name: "Value", pos: ["worth it","affordable","value for money","reasonable"], neg: ["expensive","overpriced","pricey"] },
  { name: "Speed", pos: ["fast","quick","prompt","efficient"], neg: ["wait","slow","long wait","delayed"] },
  { name: "Crisis", pos: [], neg: ["terrible","disgusting","never coming back","food poisoning","awful","worst","appalling"] },
];

const LANGS = [
  { key: "en", label: "English" },
  { key: "zh", label: "繁中" },
  { key: "vi", label: "Tiếng Việt" },
  { key: "fr", label: "Français" },
  { key: "es", label: "Español" },
];

const STYLES = [
  { key: "warm", label: "Warm & Personal", desc: "Like the owner personally read this tonight" },
  { key: "professional", label: "Professional & Gracious", desc: "Elegant, refined brand voice" },
  { key: "brief", label: "Brief & Direct", desc: "Short and impactful" },
];

function analyseKeywords(reviews) {
  return KEYWORD_CATS.map((cat) => {
    let posCount = 0, negCount = 0;
    reviews.forEach((r) => {
      const text = (r.content || "").toLowerCase();
      cat.pos.forEach((kw) => { if (text.includes(kw)) posCount++; });
      cat.neg.forEach((kw) => { if (text.includes(kw)) negCount++; });
    });
    return { ...cat, posCount, negCount, total: posCount + negCount };
  }).filter((c) => c.total > 0);
}

function starsDisplay(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function detectSentiment(rating) {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replies, setReplies] = useState({});
  const [generating, setGenerating] = useState(false);
  const [activeStyle, setActiveStyle] = useState("warm");
  const [activeLang, setActiveLang] = useState("en");
  const [filter, setFilter] = useState("all");
  const [kwFilter, setKwFilter] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [newReview, setNewReview] = useState({ reviewer_name: "", stars: 5, content: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [modalError, setModalError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const [{ data: prof }, { data: revs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
    ]);

    setProfile(prof);
    setReviews(revs || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const plan = getPlan(profile?.plan || "free_trial");
  const planKey = profile?.plan || "free_trial";
  const usedCount = profile?.used_count || 0;
  const pct = usagePercent(planKey, usedCount);
  const overLimit = isOverLimit(planKey, usedCount);

  const keywords = analyseKeywords(reviews);

  const filteredReviews = reviews.filter((r) => {
    if (kwFilter) {
      const cat = KEYWORD_CATS.find((c) => c.name === kwFilter);
      if (cat) {
        const text = (r.content || "").toLowerCase();
        const allKw = [...cat.pos, ...cat.neg];
        if (!allKw.some((kw) => text.includes(kw))) return false;
      }
    }
    if (filter === "positive") return r.stars >= 4;
    if (filter === "negative") return r.stars <= 2;
    if (filter === "unanswered") return !r.replied;
    if (filter === "crisis") return r.is_crisis;
    return true;
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length).toFixed(1) : "—";
  const replyRate = reviews.length > 0 ? Math.round((reviews.filter((r) => r.replied).length / reviews.length) * 100) : 0;

  const handleGenerate = async () => {
    if (!selectedReview || overLimit) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: selectedReview, profile, lang: activeLang }),
      });
      const data = await res.json();
      if (data.error) { setGenerateError(data.error); return; }
      if (data.replies) {
        setReplies((prev) => ({ ...prev, [selectedReview.id]: data.replies }));
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("profiles").update({ used_count: usedCount + 1 }).eq("id", user.id);
        setProfile((p) => ({ ...p, used_count: usedCount + 1 }));
      }
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleMarkReplied = async (reviewId) => {
    await supabase.from("reviews").update({ replied: true }).eq("id", reviewId);
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, replied: true } : r));
  };

  const handleDelete = async (reviewId) => {
    await supabase.from("reviews").delete().eq("id", reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (selectedReview?.id === reviewId) setSelectedReview(null);
  };

  const handleAddReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingReview(true);
    setModalError("");
    const sentiment = detectSentiment(newReview.stars);
    const isCrisis = newReview.stars <= 2;
    const { data, error } = await supabase.from("reviews").insert({
      user_id: user.id,
      reviewer_name: newReview.reviewer_name || "Anonymous",
      stars: newReview.stars,
      content: newReview.content,
      sentiment,
      is_crisis: isCrisis,
      replied: false,
      source: "manual",
      review_date: new Date().toISOString(),
    }).select().single();
    setSavingReview(false);
    if (error) {
      setModalError(error.message);
      return;
    }
    if (data) setReviews((prev) => [data, ...prev]);
    setShowAddModal(false);
    setNewReview({ reviewer_name: "", stars: 5, content: "" });
    setModalError("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const currentReplies = selectedReview ? replies[selectedReview.id] : null;
  const currentReply = currentReplies?.[activeStyle];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="dashboard" />

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
          <div className="live-badge"><span className="live-dot" />Live</div>
        </div>
        <div className="topbar-right">
          {profile?.restaurant_name && <span className="restaurant-name">{profile.restaurant_name}</span>}
          <span className="plan-badge">{plan.name}</span>
          <button className="icon-btn" onClick={() => window.location.href = "/dashboard/settings"} title="Settings">⚙</button>
          <button className="icon-btn" onClick={() => window.location.href = "/help"} title="Help">?</button>
          <button className="icon-btn" onClick={handleLogout} title="Logout">↩</button>
        </div>
      </div>

      <div className="body">
        {/* LEFT COL */}
        <div className="col left-col">
          {/* USAGE */}
          <div className="usage-card">
            <div className="usage-row">
              <span className="usage-label">AI Replies Used</span>
              <span className="usage-val">{usedCount} / {plan.reply_limit === Infinity ? "∞" : plan.reply_limit}</span>
            </div>
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: `${pct}%`, background: pct >= 80 ? (pct >= 100 ? "var(--neg-fg)" : "var(--neu-fg)") : "linear-gradient(90deg,var(--gold-dim),var(--gold-lt))" }} />
            </div>
          </div>

          {/* STATS */}
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-n">{avgRating}★</div><div className="stat-l">Avg Rating</div></div>
            <div className="stat-card"><div className="stat-n">{reviews.length}</div><div className="stat-l">Total Reviews</div></div>
            <div className="stat-card"><div className="stat-n">{replyRate}%</div><div className="stat-l">Reply Rate</div></div>
            <div className="stat-card"><div className="stat-n">{reviews.filter((r) => { const d = new Date(r.review_date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}</div><div className="stat-l">This Month</div></div>
          </div>

          {/* FILTERS */}
          <div className="section-label">Filters</div>
          {[
            { key: "all", label: "All Reviews", dot: "#555", count: reviews.length },
            { key: "positive", label: "Positive", dot: "var(--pos-fg)", count: reviews.filter((r) => r.stars >= 4).length },
            { key: "neutral", label: "Neutral", dot: "var(--neu-fg)", count: reviews.filter((r) => r.stars === 3).length },
            { key: "negative", label: "Negative", dot: "var(--neg-fg)", count: reviews.filter((r) => r.stars <= 2).length },
            { key: "unanswered", label: "Unanswered", dot: "var(--gold)", count: reviews.filter((r) => !r.replied).length },
            { key: "crisis", label: "🚨 Crisis", dot: "var(--neg-fg)", count: reviews.filter((r) => r.is_crisis).length },
          ].map((f) => (
            <button key={f.key} className={`filter-btn${filter === f.key ? " active" : ""}`} onClick={() => { setFilter(f.key); setKwFilter(null); }}>
              <span className="filter-dot" style={{ background: f.dot }} />
              {f.label}
              <span className="filter-count">{f.count}</span>
            </button>
          ))}

          {/* KEYWORD INTELLIGENCE */}
          <div className="section-label">Keyword Intelligence</div>
          <div className="keyword-section">
            {keywords.length === 0 && <p style={{fontSize:12,color:"var(--text3)",padding:"8px 4px"}}>Add reviews to see keyword analysis</p>}
            {keywords.map((kw) => {
              const total = kw.posCount + kw.negCount || 1;
              const posPct = Math.round((kw.posCount / total) * 100);
              const negPct = 100 - posPct;
              return (
                <div key={kw.name} className={`kw-card${kwFilter === kw.name ? " active" : ""}`} onClick={() => setKwFilter(kwFilter === kw.name ? null : kw.name)}>
                  <div className="kw-header"><span className="kw-name">{kw.name}</span><span className="kw-count">{kw.total} mentions</span></div>
                  <div className="kw-bar-wrap">
                    <div className="kw-bar-pos" style={{ width: `${posPct}%`, background: "var(--pos-fg)" }} />
                    <div className="kw-bar-neg" style={{ width: `${negPct}%`, background: "var(--neg-fg)" }} />
                  </div>
                  <div className="kw-labels">
                    <span className="kw-label pos">+{kw.posCount}</span>
                    <span className="kw-label neg">−{kw.negCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COL */}
        <div className="col mid-col">
          <div className="mid-header">
            <div><div className="mid-title">Reviews</div><div className="mid-count">{filteredReviews.length} showing</div></div>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>+ Add Review</button>
          </div>

          {loading && [1,2,3].map((i) => (
            <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
              <div className="shimmer" style={{height:14,width:"60%",marginBottom:8}} />
              <div className="shimmer" style={{height:12,width:"40%",marginBottom:10}} />
              <div className="shimmer" style={{height:12,width:"90%"}} />
            </div>
          ))}

          {!loading && filteredReviews.length === 0 && (
            <div className="empty-reviews">
              <h4>No reviews yet</h4>
              <p>Click "Add Review" to manually add a customer review and generate AI reply suggestions.</p>
            </div>
          )}

          {filteredReviews.map((review) => (
            <div key={review.id} className={`review-card${selectedReview?.id === review.id ? " selected" : ""}${review.is_crisis ? " crisis" : ""}`} onClick={() => setSelectedReview(review)}>
              <div className="review-meta">
                <span className="review-name">{review.reviewer_name}</span>
                <span className="stars">{starsDisplay(review.stars)}</span>
                <span className="review-date">{new Date(review.review_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className={`sentiment-tag sent-${review.sentiment}`}>{review.sentiment}</span>
                {review.is_crisis && <span className="crisis-tag">🚨 Crisis</span>}
              </div>
              <div className="review-text">{review.content}</div>
              <div className="review-actions">
                {review.replied && <span className="replied-tag">✓ Replied</span>}
                <button className="btn-del" onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COL */}
        <div className="col right-col">
          {!selectedReview ? (
            <div className="editor-empty">
              <div className="editor-empty-icon">✦</div>
              <h4>Select a review to generate AI replies</h4>
              <p>Click any review on the left to open the AI reply editor. Three different reply styles will be generated for you.</p>
            </div>
          ) : (
            <>
              <div className="editor-header">
                <div className="editor-review-name">{selectedReview.reviewer_name}</div>
                <div className="editor-review-meta">
                  <span className="stars" style={{fontSize:13}}>{starsDisplay(selectedReview.stars)}</span>
                  <span className={`sentiment-tag sent-${selectedReview.sentiment}`}>{selectedReview.sentiment}</span>
                </div>
              </div>
              <div className="editor-review-text">"{selectedReview.content}"</div>

              <div className="style-tabs">
                {STYLES.map((s) => (
                  <button key={s.key} className={`style-tab${activeStyle === s.key ? " active" : ""}`} onClick={() => setActiveStyle(s.key)} title={s.desc}>{s.label}</button>
                ))}
              </div>

              <div className="lang-row">
                <span className="lang-label">Lang:</span>
                {LANGS.map((l) => (
                  <button key={l.key} className={`lang-btn${activeLang === l.key ? " active" : ""}`} onClick={() => setActiveLang(l.key)}>{l.label}</button>
                ))}
              </div>

              {overLimit && (
                <div className="upgrade-banner">
                  <p>You've used all {plan.reply_limit} AI replies this month.</p>
                  <button className="btn-upgrade" onClick={() => window.location.href = "/dashboard/settings"}>Upgrade Plan →</button>
                </div>
              )}

              <div className="generate-area">
                <button className="btn-generate" onClick={handleGenerate} disabled={generating || overLimit}>
                  {generating ? "Generating…" : currentReplies ? "Regenerate All Replies" : "✦ Generate AI Replies"}
                </button>
                {generateError && <div style={{marginTop:10,padding:"8px 12px",background:"rgba(224,96,96,.12)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:12.5,color:"var(--neg-fg)"}}>{generateError}</div>}
              </div>

              {currentReplies && (
                <div className="reply-cards">
                  {STYLES.map((s, idx) => (
                    currentReplies[s.key] && (
                      <div key={s.key} className="reply-card">
                        <div className="reply-style">{s.label}</div>
                        <div className="reply-text">{currentReplies[s.key]}</div>
                        <div className="reply-actions">
                          <button className="btn-copy" onClick={() => handleCopy(currentReplies[s.key], idx)}>
                            {copiedIdx === idx ? "Copied!" : "Copy"}
                          </button>
                          <button className="btn-regen" onClick={() => handleGenerate()}>Regen</button>
                          {copiedIdx === idx && <span className="copied-hint">✓ Ready to paste into Google</span>}
                          {!selectedReview.replied && (
                            <button className="btn-regen" style={{marginLeft:"auto"}} onClick={() => handleMarkReplied(selectedReview.id)}>Mark Replied</button>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADD REVIEW MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Review</h3>
            <p className="modal-sub">Manually add a customer review to generate AI reply suggestions.</p>
            {modalError && <div style={{padding:"8px 12px",background:"rgba(224,96,96,.12)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:13,color:"var(--neg-fg)",marginBottom:14}}>{modalError}</div>}
            <div className="modal-group">
              <label className="modal-label">Reviewer Name</label>
              <input className="modal-input" placeholder="e.g. James T." value={newReview.reviewer_name} onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })} />
            </div>
            <div className="modal-group">
              <label className="modal-label">Star Rating</label>
              <div className="star-select">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} className={`star-btn${newReview.stars >= n ? " active" : ""}`} onClick={() => setNewReview({ ...newReview, stars: n })}>★</button>
                ))}
              </div>
            </div>
            <div className="modal-group">
              <label className="modal-label">Review Content</label>
              <textarea className="modal-input modal-textarea" placeholder="Paste the review text here…" value={newReview.content} onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="modal-save" onClick={handleAddReview} disabled={savingReview || !newReview.content}>{savingReview ? "Saving…" : "Add Review"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
