"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold:        #C9A84C;
  --gold-lt:     #E8C96B;
  --gold-dk:     #8B6914;
  --gold-dim:    rgba(201,168,76,0.10);
  --gold-dim2:   rgba(201,168,76,0.18);
  --gold-border: rgba(201,168,76,0.22);
  --bg:          #07060A;
  --bg2:         #0D0C10;
  --bg3:         #121118;
  --surface:     rgba(255,255,255,0.038);
  --surface2:    rgba(255,255,255,0.064);
  --border:      rgba(255,255,255,0.075);
  --text:        #EDE6D8;
  --text2:       #A89878;
  --muted:       #5E5648;
  --pos-bg:      rgba(60,140,80,0.14);
  --pos-fg:      #5CBF76;
  --pos-border:  rgba(60,140,80,0.28);
  --neu-bg:      rgba(200,140,40,0.14);
  --neu-fg:      #D4A040;
  --neu-border:  rgba(200,140,40,0.28);
  --neg-bg:      rgba(190,60,60,0.14);
  --neg-fg:      #D85858;
  --neg-border:  rgba(190,60,60,0.28);
  --nav-h:       58px;
}

html, body { font-size: 14px; height: 100%; overflow: hidden; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--gold); }

/* ── TOP NAV ── */
.topnav {
  height: var(--nav-h); min-height: var(--nav-h);
  display: flex; align-items: center;
  padding: 0 20px; gap: 16px;
  border-bottom: 1px solid var(--gold-border);
  background: rgba(7,6,10,0.9);
  backdrop-filter: blur(12px);
  z-index: 50; flex-shrink: 0;
}
.nav-brand {
  font-family: 'Playfair Display', serif;
  font-size: 15px; font-weight: 700;
  letter-spacing: 2.5px; text-transform: uppercase;
  color: var(--gold); white-space: nowrap; flex-shrink: 0;
}
.nav-brand span { color: var(--text2); font-weight: 400; }
.nav-divider { width: 1px; height: 22px; background: var(--border); flex-shrink: 0; }
.nav-spacer { flex: 1; }
.nav-location { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text2); flex-shrink: 0; }
.nav-location select {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 8px; padding: 5px 10px;
  font-size: 13px; cursor: pointer; outline: none; font-family: inherit;
}
.nav-location select:focus { border-color: var(--gold-border); }
.nav-badge { font-size: 11px; padding: 3px 9px; border-radius: 999px; font-weight: 600; letter-spacing: 0.5px; }
.nav-badge.live {
  background: rgba(60,140,80,0.2); color: var(--pos-fg);
  border: 1px solid rgba(60,140,80,0.3);
  display: flex; align-items: center; gap: 5px;
}
.nav-badge.live::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--pos-fg); animation: pulse 1.8s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

/* Language toggle pill */
.lang-toggle {
  display: flex; align-items: center;
  background: var(--surface); border: 1px solid var(--gold-border);
  border-radius: 999px; overflow: hidden; flex-shrink: 0;
}
.lang-opt {
  padding: 4px 11px; font-size: 11px; font-weight: 700;
  cursor: pointer; border: none; background: transparent;
  color: var(--text2); font-family: inherit;
  transition: all .18s; letter-spacing: 0.5px;
}
.lang-opt.active {
  background: linear-gradient(135deg, var(--gold-lt), var(--gold));
  color: #000;
}
.lang-opt:not(.active):hover { color: var(--gold); }

.nav-apikey { display: flex; align-items: center; gap: 6px; }
.nav-apikey input {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 8px; padding: 5px 10px; width: 210px;
  font-size: 12px; outline: none; font-family: inherit; transition: border-color .2s;
}
.nav-apikey input::placeholder { color: var(--muted); }
.nav-apikey input:focus { border-color: var(--gold-border); }
.nav-apikey input.saved { border-color: rgba(60,140,80,0.55); }
.btn-icon {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text2); border-radius: 8px; padding: 5px 9px;
  cursor: pointer; font-size: 13px; transition: all .2s;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.btn-icon:hover { border-color: var(--gold-border); color: var(--gold); }
.nav-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--gold-dim2); border: 1px solid var(--gold-border);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 13px;
  color: var(--gold); font-weight: 700; cursor: pointer; flex-shrink: 0;
}

/* ── DASHBOARD LAYOUT ── */
.dashboard {
  display: grid;
  grid-template-columns: 252px 1fr 400px;
  height: calc(100vh - var(--nav-h));
  overflow: hidden;
}

/* ── LEFT PANEL ── */
.left-panel {
  height: 100%; overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--bg2);
  display: flex; flex-direction: column;
}
.lp-section { padding: 18px 16px; border-bottom: 1px solid var(--border); }
.lp-section:last-child { border-bottom: none; }
.lp-label {
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  color: var(--gold); font-weight: 600; margin-bottom: 14px;
}
.rating-hero { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
.rating-big {
  font-family: 'Playfair Display', serif;
  font-size: 46px; font-weight: 700; color: var(--gold); line-height: 1;
}
.rating-side { display: flex; flex-direction: column; gap: 3px; }
.rating-stars-row { color: var(--gold); font-size: 13px; letter-spacing: 1px; }
.rating-count { font-size: 11px; color: var(--text2); }
.bar-row { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; font-size: 12px; }
.bar-star { color: var(--gold); width: 8px; text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--gold-dk), var(--gold)); transition: width 1.1s cubic-bezier(.4,0,.2,1); }
.bar-n { color: var(--text2); width: 28px; text-align: right; flex-shrink: 0; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stat-box { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.stat-box-val { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--gold); }
.stat-box-lbl { font-size: 10px; color: var(--text2); margin-top: 1px; }
.stat-box-trend { font-size: 10px; color: var(--pos-fg); margin-top: 2px; }
.filter-list { display: flex; flex-direction: column; gap: 5px; }
.filter-btn {
  display: flex; align-items: center; justify-content: space-between;
  background: transparent; border: 1px solid transparent;
  color: var(--text2); border-radius: 9px; padding: 8px 10px;
  cursor: pointer; font-size: 13px; font-family: inherit;
  transition: all .18s; text-align: left; width: 100%;
}
.filter-btn:hover { background: var(--surface); color: var(--text); }
.filter-btn.active { background: var(--gold-dim2); border-color: var(--gold-border); color: var(--gold); }
.filter-btn .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.filter-btn .cnt { font-size: 11px; background: var(--surface2); padding: 1px 6px; border-radius: 999px; }
.filter-btn.active .cnt { background: var(--gold-dim2); color: var(--gold); }
.filter-row { display: flex; align-items: center; gap: 8px; }
.sort-select {
  width: 100%; background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 9px; padding: 8px 10px;
  font-size: 13px; cursor: pointer; outline: none; font-family: inherit;
}
.sort-select:focus { border-color: var(--gold-border); }

/* ── CENTER PANEL ── */
.center-panel { height: 100%; overflow-y: auto; display: flex; flex-direction: column; }
.cp-toolbar {
  position: sticky; top: 0; z-index: 10;
  background: rgba(7,6,10,0.92); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border); padding: 10px 16px;
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.search-wrap { flex: 1; position: relative; }
.search-icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--muted); font-size: 13px; pointer-events: none;
}
.search-input {
  width: 100%; background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 9px; padding: 7px 10px 7px 30px;
  font-size: 13px; outline: none; font-family: inherit; transition: border-color .2s;
}
.search-input:focus { border-color: var(--gold-border); }
.search-input::placeholder { color: var(--muted); }
.cp-count { font-size: 12px; color: var(--text2); white-space: nowrap; flex-shrink: 0; }
.review-list { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }

/* Review Card */
.review-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px; cursor: pointer;
  transition: border-color .2s, background .2s, box-shadow .2s;
  position: relative;
}
.review-card:hover { border-color: var(--gold-border); background: var(--surface2); }
.review-card.selected {
  border-color: var(--gold); background: var(--gold-dim);
  box-shadow: 0 0 0 1px var(--gold-dim2);
}
.review-card.selected::before {
  content: ''; position: absolute; left: 0; top: 12px; bottom: 12px;
  width: 3px; background: var(--gold); border-radius: 0 3px 3px 0;
}
.rc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.rc-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  font-family: 'Playfair Display', serif;
}
.rc-info { flex: 1; min-width: 0; }
.rc-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rc-date { font-size: 11px; color: var(--text2); margin-top: 1px; }
.rc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
.stars-row { display: flex; gap: 2px; }
.star { font-size: 12px; color: var(--muted); }
.star.filled { color: var(--gold); }
.sentiment-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 999px; }
.sentiment-badge.positive { background: var(--pos-bg); color: var(--pos-fg); border: 1px solid var(--pos-border); }
.sentiment-badge.neutral  { background: var(--neu-bg); color: var(--neu-fg); border: 1px solid var(--neu-border); }
.sentiment-badge.negative { background: var(--neg-bg); color: var(--neg-fg); border: 1px solid var(--neg-border); }
.rc-text {
  font-size: 13px; color: var(--text2); line-height: 1.65;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.review-card.selected .rc-text { -webkit-line-clamp: 5; }
.rc-footer { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.rc-tag { font-size: 10px; padding: 2px 8px; border-radius: 999px; background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }
.rc-replied { font-size: 10px; color: var(--pos-fg); margin-left: auto; }
.empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--muted); padding:40px; text-align:center; gap:10px; }
.empty-state .icon { font-size: 32px; opacity: .5; }
.empty-state p { font-size: 13px; }

/* ── RIGHT PANEL ── */
.right-panel {
  height: 100%; overflow-y: auto;
  border-left: 1px solid var(--border);
  background: var(--bg2);
  display: flex; flex-direction: column;
}
.rp-header { padding: 18px 18px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.rp-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px; font-weight: 700;
  color: var(--gold); letter-spacing: 0.5px; margin-bottom: 4px;
}
.rp-subtitle { font-size: 12px; color: var(--text2); }
.rp-review-preview {
  margin: 14px 18px 0;
  background: var(--surface); border: 1px solid var(--gold-border);
  border-radius: 12px; padding: 13px; flex-shrink: 0;
}
.rp-preview-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.rp-preview-name { font-size: 13px; font-weight: 600; }
.rp-preview-text {
  font-size: 12px; color: var(--text2); line-height: 1.65;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.rp-controls {
  padding: 14px 18px; border-bottom: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
}
.ctrl-row { display: flex; align-items: center; gap: 8px; }
.ctrl-label { font-size: 11px; color: var(--text2); flex-shrink: 0; width: 60px; }
.ctrl-select {
  flex: 1; background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 8px; padding: 6px 9px;
  font-size: 12px; cursor: pointer; outline: none; font-family: inherit;
}
.ctrl-select:focus { border-color: var(--gold-border); }
.gen-btn {
  width: 100%; padding: 13px 16px; border-radius: 11px;
  background: linear-gradient(135deg, #D4A83A, #A07820);
  border: none; color: #000; font-size: 14px; font-weight: 700;
  font-family: 'Playfair Display', serif; letter-spacing: 0.5px;
  cursor: pointer; transition: opacity .2s, transform .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.gen-btn:hover { opacity: .88; transform: translateY(-1px); }
.gen-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
.gen-btn .spinner {
  width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.3);
  border-top-color: #000; border-radius: 50%;
  animation: spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.rp-replies { flex: 1; padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.reply-placeholder { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; text-align:center; gap:10px; }
.reply-placeholder .icon { font-size: 36px; opacity: .35; }
.reply-placeholder p { font-size: 13px; color: var(--muted); line-height: 1.8; }
.reply-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 13px; overflow: hidden;
  opacity: 0; transform: translateY(10px);
  transition: opacity .4s ease, transform .4s ease;
}
.reply-card.visible { opacity: 1; transform: translateY(0); }
.reply-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 13px; border-bottom: 1px solid var(--border); background: var(--bg3);
}
.reply-style-name {
  font-family: 'Playfair Display', serif;
  font-size: 12px; font-weight: 700;
  color: var(--gold); letter-spacing: 1px; text-transform: uppercase;
}
.reply-style-desc { font-size: 10px; color: var(--text2); margin-top: 1px; }
.reply-head-actions { display: flex; gap: 5px; }
.btn-sm {
  padding: 4px 9px; border-radius: 7px; font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .18s;
  border: 1px solid var(--border); background: transparent; color: var(--text2);
}
.btn-sm:hover { border-color: var(--gold-border); color: var(--gold); }
.btn-sm.gold { background: var(--gold); color: #000; border-color: transparent; }
.btn-sm.gold:hover { opacity: .82; }
.btn-sm.copied { background: rgba(60,140,80,0.2); color: var(--pos-fg); border-color: rgba(60,140,80,0.3); }
.btn-sm:disabled { opacity: .4; cursor: not-allowed; }
.reply-textarea {
  width: 100%; background: transparent; border: none;
  color: var(--text); font-size: 13px; line-height: 1.75;
  padding: 13px; resize: none; outline: none;
  font-family: 'Inter', sans-serif; min-height: 100px;
}
.reply-textarea:disabled { opacity: .5; }
.reply-card-foot {
  padding: 8px 13px; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg3);
}
.char-count { font-size: 10px; color: var(--muted); }

/* Skeleton */
.skeleton-card { background: var(--surface); border: 1px solid var(--border); border-radius: 13px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.skel { background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%); background-size: 200% 100%; border-radius: 5px; animation: shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Error */
.error-banner { background: rgba(190,60,60,0.12); border: 1px solid var(--neg-border); border-radius: 10px; padding: 12px 14px; font-size: 12px; color: var(--neg-fg); line-height: 1.6; }
.error-banner strong { display: block; margin-bottom: 4px; }

/* Toast */
.toast-box {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: rgba(13,12,16,0.97); border: 1px solid var(--gold-border);
  border-radius: 10px; padding: 10px 18px;
  font-size: 13px; color: var(--gold); z-index: 999;
  white-space: nowrap; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  animation: toastIn .25s ease;
}
@keyframes toastIn {
  from { opacity:0; transform:translateX(-50%) translateY(8px); }
  to   { opacity:1; transform:translateX(-50%) translateY(0); }
}
`;

/* ═══════════════════════════════════════════════════════
   I18N
═══════════════════════════════════════════════════════ */
const I18N = {
  en: {
    liveBadge:       "Live Monitoring",
    apiPlaceholder:  "sk-ant-api03-… (Anthropic API Key)",
    overallRating:   "Overall Rating",
    reviewsUnit:     (n) => `${n.toLocaleString()} reviews`,
    thisMonth:       "This Month",
    newReviews:      "New Reviews",
    vsLastMonth:     "▲ vs last month",
    responseRate:    "Response Rate",
    industryAvg:     "Industry: 68%",
    positiveRate:    "Positive",
    unanswered:      "Unanswered",
    filterReviews:   "Filter Reviews",
    sortBy:          "Sort By",
    fAll:            "All Reviews",
    fPositive:       "Positive (4–5★)",
    fNeutral:        "Neutral (3★)",
    fNegative:       "Negative (1–2★)",
    fUnanswered:     "Unanswered",
    sLatest:         "Most Recent",
    sLowest:         "Lowest Rating First",
    sHighest:        "Highest Rating First",
    sUnanswered:     "Unanswered First",
    searchPlaceholder: "Search reviews by name or keyword…",
    reviewCount:     (n) => `${n} review${n !== 1 ? "s" : ""}`,
    noReviews:       "No reviews match your filters.",
    sentPositive:    "Positive",
    sentNeutral:     "Neutral",
    sentNegative:    "Negative",
    replied:         "✓ Replied",
    rpTitle:         "✦ AI Reply Studio",
    rpSubtitle:      "Select a review to generate three tailored responses",
    toneLabel:       "Tone",
    langLabel:       "Language",
    lengthLabel:     "Length",
    toneAll:         "All Three Styles",
    toneSoph:        "Sophisticated Only",
    tonePro:         "Professional Only",
    toneDiplo:       "Diplomatic Only",
    langAuto:        "Auto-detect",
    langEn:          "English",
    langFr:          "French",
    langDe:          "German",
    langIt:          "Italian",
    langEs:          "Spanish",
    langZh:          "中文（繁體）",
    lenMedium:       "Medium (80–120 words)",
    lenShort:        "Short (40–60 words)",
    lenLong:         "Long (150–200 words)",
    generateBtn:     "✦ Generate AI Replies",
    generatingBtn:   "Generating…",
    phNoReview:      "Select any review from the list to generate AI-crafted replies in three distinct styles.",
    phHasReview:     "Configure the options above and click Generate.",
    errorTitle:      "⚠ Generation failed",
    errorHint:       "Check your API key and ensure it has access to claude-haiku-4-5-20251001.",
    copy:            "Copy",
    copied:          "Copied!",
    publish:         "Publish",
    wordCount:       (n) => `${n} words`,
    regen:           "↻ Regenerate",
    styleSoph:       "Sophisticated",
    styleDescSoph:   "Luxury brand voice · Poetic & refined",
    stylePro:        "Professional",
    styleDescPro:    "Warm & genuine · Suitable for most reviews",
    styleDiplo:      "Diplomatic",
    styleDescDiplo:  "Crisis handling · Calm & solution-oriented",
    toastEnterKey:   "Please enter an API key.",
    toastKeySaved:   "API key saved.",
    toastSelectReview: "Please select a review first.",
    toastEnterKey2:  "Please enter your Anthropic API key in the top bar.",
    toastGenerated:  "Replies generated. ✓",
    toastPublished:  "✓ Reply marked as published.",
    toastCopied:     "Copied to clipboard.",
    toastRegen:      "↻ Regenerated.",
    toastRegenFail:  "Regeneration failed: ",
    tsMin:           (n) => `${n}m ago`,
    tsHour:          (n) => `${n}h ago`,
    tsDay:           (n) => `${n}d ago`,
  },
  zh: {
    liveBadge:       "即時監控",
    apiPlaceholder:  "sk-ant-api03-… (Anthropic API Key)",
    overallRating:   "整體評分",
    reviewsUnit:     (n) => `${n.toLocaleString()} 則評論`,
    thisMonth:       "本月統計",
    newReviews:      "新增評論",
    vsLastMonth:     "▲ 較上月增加",
    responseRate:    "回覆率",
    industryAvg:     "業界平均：68%",
    positiveRate:    "好評率",
    unanswered:      "待回覆",
    filterReviews:   "篩選評論",
    sortBy:          "排序方式",
    fAll:            "全部評論",
    fPositive:       "好評 (4–5★)",
    fNeutral:        "普通 (3★)",
    fNegative:       "負評 (1–2★)",
    fUnanswered:     "未回覆",
    sLatest:         "最新優先",
    sLowest:         "最低評分優先",
    sHighest:        "最高評分優先",
    sUnanswered:     "未回覆優先",
    searchPlaceholder: "搜尋評論、姓名或關鍵字…",
    reviewCount:     (n) => `${n} 則評論`,
    noReviews:       "沒有符合條件的評論",
    sentPositive:    "好評",
    sentNeutral:     "普通",
    sentNegative:    "負評",
    replied:         "✓ 已回覆",
    rpTitle:         "✦ AI 回覆工作室",
    rpSubtitle:      "選擇評論，一鍵生成三種客製化回覆",
    toneLabel:       "語氣",
    langLabel:       "語言",
    lengthLabel:     "長度",
    toneAll:         "三種語氣全部",
    toneSoph:        "僅精緻奢華",
    tonePro:         "僅專業親切",
    toneDiplo:       "僅外交圓融",
    langAuto:        "自動偵測",
    langEn:          "英文",
    langFr:          "法文",
    langDe:          "德文",
    langIt:          "義大利文",
    langEs:          "西班牙文",
    langZh:          "中文（繁體）",
    lenMedium:       "中等（80–120 字）",
    lenShort:        "簡短（40–60 字）",
    lenLong:         "詳細（150–200 字）",
    generateBtn:     "✦ 生成 AI 回覆",
    generatingBtn:   "生成中…",
    phNoReview:      "從左側列表選擇一則評論，即可生成三種 AI 客製化回覆。",
    phHasReview:     "設定上方選項後，點擊生成按鈕。",
    errorTitle:      "⚠ 生成失敗",
    errorHint:       "請確認 API 金鑰是否正確，並確保可存取 claude-haiku-4-5-20251001。",
    copy:            "複製",
    copied:          "已複製！",
    publish:         "發布",
    wordCount:       (n) => `${n} 字`,
    regen:           "↻ 重新生成",
    styleSoph:       "精緻奢華",
    styleDescSoph:   "高端品牌語氣・詩意精煉",
    stylePro:        "專業親切",
    styleDescPro:    "溫暖真誠・適合大多數評論",
    styleDiplo:      "外交圓融",
    styleDescDiplo:  "危機處理・冷靜解決導向",
    toastEnterKey:   "請輸入 API 金鑰",
    toastKeySaved:   "API 金鑰已儲存",
    toastSelectReview: "請先選擇一則評論",
    toastEnterKey2:  "請在上方輸入 Anthropic API 金鑰",
    toastGenerated:  "回覆已生成 ✓",
    toastPublished:  "✓ 已標記為發布",
    toastCopied:     "已複製到剪貼簿",
    toastRegen:      "↻ 已重新生成",
    toastRegenFail:  "重新生成失敗：",
    tsMin:           (n) => `${n} 分鐘前`,
    tsHour:          (n) => `${n} 小時前`,
    tsDay:           (n) => `${n} 天前`,
  },
};

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const LOCATIONS = {
  london:    { name: "Maison Laurent",  city: "London",    avg: 4.7, total: 1284, dist: [751, 312, 187, 25, 9]    },
  ny:        { name: "The Terrace",     city: "New York",  avg: 4.5, total: 987,  dist: [610, 220, 120, 25, 12]   },
  paris:     { name: "Villa Rosso",     city: "Paris",     avg: 4.8, total: 2103, dist: [1410, 480, 160, 30, 23]  },
  amsterdam: { name: "Atelier Blanc",   city: "Amsterdam", avg: 4.6, total: 634,  dist: [380, 148, 80, 18, 8]     },
};

const BASE_REVIEWS = [
  {
    id: 1, name: "William Harrison", initials: "WH", color: "#7A5C1A",
    stars: 5, sentiment: "positive", ts: Date.now() - 3 * 3600 * 1000,
    replied: false, lang: "en", tags: ["Tasting Menu", "Sommelier"],
    text: "An extraordinary dining experience from start to finish. The tasting menu was a masterclass in modern European cuisine — each course told a coherent, beautiful story. The sommelier's pairing choices were inspired; the 2018 Burgundy he selected for the venison was transcendent. Service was impeccably attentive without ever feeling intrusive. Already planning our next visit.",
  },
  {
    id: 2, name: "Isabelle Fontaine", initials: "IF", color: "#2E6B4F",
    stars: 4, sentiment: "positive", ts: Date.now() - 1.2 * 86400 * 1000,
    replied: false, lang: "fr", tags: ["Service", "Sea Bass"],
    text: "Le bar de ligne était divin — cuit avec une précision remarquable. L'ambiance du restaurant est authentiquement élégante. Cependant, le service nous a semblé légèrement pressé pendant la mise en bouche. Pour le niveau de prix pratiqué, chaque moment devrait sembler sans hâte. Nous reviendrons certainement, mais avec ces réserves.",
  },
  {
    id: 3, name: "Marcus Rothwell", initials: "MR", color: "#3B5998",
    stars: 5, sentiment: "positive", ts: Date.now() - 2 * 86400 * 1000,
    replied: true, lang: "en", tags: ["Anniversary", "Private Dining"],
    text: "We celebrated our 25th anniversary here and it surpassed every expectation. The personalised menu card with our names was a breathtaking touch. The chef came to our table personally to share the inspiration behind each dish. The whole evening felt curated just for us — that level of thoughtfulness is increasingly rare.",
  },
  {
    id: 4, name: "Elena Vasquez", initials: "EV", color: "#6B3B6B",
    stars: 3, sentiment: "neutral", ts: Date.now() - 3 * 86400 * 1000,
    replied: false, lang: "en", tags: ["Portion Size", "Price"],
    text: "Beautiful interior and the foie gras starter was genuinely exceptional. However, the main course portion seemed unusually modest for the price point — I left feeling somewhat unsatisfied despite the quality. The dessert redeemed the evening. Mixed feelings overall; the highs are very high but the inconsistency makes it hard to fully recommend.",
  },
  {
    id: 5, name: "James Whitfield", initials: "JW", color: "#8B2020",
    stars: 1, sentiment: "negative", ts: Date.now() - 4 * 86400 * 1000,
    replied: false, lang: "en", tags: ["Wait Time", "Service"],
    text: "Waited 50 minutes past our reservation time with zero communication. When we finally sat down, our waiter seemed irritated by our questions about the menu. The food itself was perfectly good, but the evening was fundamentally ruined by the front-of-house failures. For these prices, the hospitality must match the cuisine. It did not.",
  },
  {
    id: 6, name: "Amélie Dubois", initials: "AD", color: "#4A6B2E",
    stars: 5, sentiment: "positive", ts: Date.now() - 5 * 86400 * 1000,
    replied: true, lang: "fr", tags: ["Ambiance", "Wine"],
    text: "Mon mari et moi avons célébré notre anniversaire dans cet établissement exceptionnel. Chaque détail reflétait un savoir-faire authentique — de la sélection des vins à la présentation des assiettes. Le chef pâtissier mérite une mention spéciale pour un dessert au chocolat que je n'oublierai pas. Une adresse que nous recommandons sans réserve.",
  },
  {
    id: 7, name: "Robert Chen", initials: "RC", color: "#1A5C7A",
    stars: 4, sentiment: "positive", ts: Date.now() - 6 * 86400 * 1000,
    replied: true, lang: "en", tags: ["Business Dinner", "Private Room"],
    text: "Hosted a business dinner for eight in the private dining room — an elegant and professional setting. The wine list is exceptional and our sommelier was knowledgeable and discreet. Only feedback: noise from the adjacent main dining room was occasionally noticeable, which mattered given the confidential nature of our conversations. Food and service were outstanding throughout.",
  },
  {
    id: 8, name: "Victoria Ashworth", initials: "VA", color: "#7A3B1A",
    stars: 2, sentiment: "negative", ts: Date.now() - 7 * 86400 * 1000,
    replied: false, lang: "en", tags: ["Expectations", "Consistency"],
    text: "Expected so much more given this restaurant's considerable reputation. The truffle risotto was bland — a cardinal sin for a dish of this price and prestige. Service was inconsistent; our starter arrived before the bread, and one guest's main was inexplicably delayed by 15 minutes. Given the Michelin star history, this was a profound disappointment.",
  },
];

/* Reply style keys (labels come from i18n) */
const REPLY_STYLE_KEYS = ["sophisticated", "professional", "diplomatic"];

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function StarsRow({ n }) {
  return (
    <div className="stars-row">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star${i < n ? " filled" : ""}`}>
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function formatTs(ts, t) {
  const d = (Date.now() - ts) / 1000;
  if (d < 3600)  return t.tsMin(Math.floor(d / 60));
  if (d < 86400) return t.tsHour(Math.floor(d / 3600));
  return t.tsDay(Math.floor(d / 86400));
}

function parseReplies(raw) {
  const extract = (key) => {
    const re = new RegExp(`===${key}===\\s*([\\s\\S]*?)(?:===|$)`, "i");
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    sophisticated: extract("SOPHISTICATED"),
    professional:  extract("PROFESSIONAL"),
    diplomatic:    extract("DIPLOMATIC"),
  };
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════ */
export default function Home() {
  const [uiLang,       setUiLang]       = useState("en");
  const [loc,          setLoc]          = useState("london");
  const [filter,       setFilter]       = useState("all");
  const [selectedId,   setSelectedId]   = useState(null);
  const [apiKey,       setApiKey]       = useState("");
  const [apiKeySaved,  setApiKeySaved]  = useState(false);
  const [apiVis,       setApiVis]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [sortOrder,    setSortOrder]    = useState("latest");
  const [tone,         setTone]         = useState("all");
  const [lang,         setLang]         = useState("auto");
  const [length,       setLength]       = useState("medium");
  const [genState,     setGenState]     = useState("idle");
  const [genError,     setGenError]     = useState("");
  const [genReplies,   setGenReplies]   = useState({});
  const [editReplies,  setEditReplies]  = useState({});
  const [repliedSet,   setRepliedSet]   = useState(
    () => new Set(BASE_REVIEWS.filter(r => r.replied).map(r => r.id))
  );
  const [copiedKey,    setCopiedKey]    = useState(null);
  const [regenKey,     setRegenKey]     = useState(null);
  const [toast,        setToast]        = useState("");
  const [barsAnim,     setBarsAnim]     = useState(false);
  const [visibleCards, setVisibleCards] = useState([]);

  const toastTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("rrp_apikey") || "";
    if (saved) { setApiKey(saved); setApiKeySaved(true); }
  }, []);

  useEffect(() => {
    setBarsAnim(false);
    const t = setTimeout(() => setBarsAnim(true), 150);
    return () => clearTimeout(t);
  }, [loc]);

  /* Active i18n strings */
  const t = I18N[uiLang];

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  /* ── Derived state ── */
  const location = LOCATIONS[loc];

  const replyStyles = [
    { key: "sophisticated", label: t.styleSoph,  desc: t.styleDescSoph  },
    { key: "professional",  label: t.stylePro,   desc: t.styleDescPro   },
    { key: "diplomatic",    label: t.styleDiplo, desc: t.styleDescDiplo },
  ];

  const filters = [
    { key: "all",        label: t.fAll,        dot: "#888"           },
    { key: "positive",   label: t.fPositive,   dot: "var(--pos-fg)" },
    { key: "neutral",    label: t.fNeutral,    dot: "var(--neu-fg)" },
    { key: "negative",   label: t.fNegative,   dot: "var(--neg-fg)" },
    { key: "unanswered", label: t.fUnanswered, dot: "var(--gold)"   },
  ];

  const sentimentLabel = {
    positive: t.sentPositive,
    neutral:  t.sentNeutral,
    negative: t.sentNegative,
  };

  const filtered = (() => {
    let list = BASE_REVIEWS.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.text.toLowerCase().includes(q)) return false;
      }
      switch (filter) {
        case "positive":   return r.stars >= 4;
        case "neutral":    return r.stars === 3;
        case "negative":   return r.stars <= 2;
        case "unanswered": return !repliedSet.has(r.id);
        default:           return true;
      }
    });
    switch (sortOrder) {
      case "lowest":     list.sort((a, b) => a.stars - b.stars); break;
      case "highest":    list.sort((a, b) => b.stars - a.stars); break;
      case "unanswered": list.sort((a, b) => (repliedSet.has(a.id) ? 1 : 0) - (repliedSet.has(b.id) ? 1 : 0)); break;
      default:           list.sort((a, b) => b.ts - a.ts);
    }
    return list;
  })();

  const counts = {
    all:        BASE_REVIEWS.length,
    positive:   BASE_REVIEWS.filter(r => r.stars >= 4).length,
    neutral:    BASE_REVIEWS.filter(r => r.stars === 3).length,
    negative:   BASE_REVIEWS.filter(r => r.stars <= 2).length,
    unanswered: BASE_REVIEWS.filter(r => !repliedSet.has(r.id)).length,
  };

  const selectedReview = selectedId ? BASE_REVIEWS.find(r => r.id === selectedId) : null;
  const activeStyles   = tone === "all" ? replyStyles : replyStyles.filter(s => s.key === tone);

  /* ── Handlers ── */
  function handleLocChange(newLoc) {
    setLoc(newLoc);
    setSelectedId(null);
    setGenState("idle");
    setGenReplies({});
    setEditReplies({});
    setFilter("all");
  }

  function handleSelectReview(r) {
    setSelectedId(r.id);
    setGenState("idle");
    setGenReplies({});
    setEditReplies({});
    setVisibleCards([]);
    setLang(r.lang === "fr" ? "fr" : "auto");
  }

  function handleSaveApiKey() {
    if (!apiKey.trim()) return showToast(t.toastEnterKey);
    localStorage.setItem("rrp_apikey", apiKey.trim());
    setApiKeySaved(true);
    showToast(t.toastKeySaved);
  }

  function handlePublish(reviewId) {
    setRepliedSet(prev => new Set([...prev, reviewId]));
    showToast(t.toastPublished);
  }

  async function handleGenerate() {
    if (!selectedReview) return showToast(t.toastSelectReview);
    const key = apiKey.trim();
    if (!key) return showToast(t.toastEnterKey2);

    const wordRange = { short: "40–60", medium: "80–120", long: "150–200" }[length];
    const toneReq   = tone === "all"
      ? "three distinct styles: SOPHISTICATED, PROFESSIONAL, DIPLOMATIC"
      : `only the ${tone.toUpperCase()} style`;
    const langNames = { fr: "French", de: "German", it: "Italian", es: "Spanish", en: "English", zh: "Traditional Chinese (繁體中文)" };
    const langInstr = lang === "auto"
      ? "Respond in the same language as the review."
      : `Respond in ${langNames[lang]}.`;

    const systemPrompt = `You are the Guest Relations Director for ${location.name}, a Michelin-starred fine dining restaurant in ${location.city}. Generate ${toneReq} for the following Google review.

${langInstr}

Format your response EXACTLY as shown (use these exact delimiters):
===SOPHISTICATED===
[reply here]
===PROFESSIONAL===
[reply here]
===DIPLOMATIC===
[reply here]

If generating only one style, still include all three delimiters but leave the unused two empty.

Style guidelines:
- SOPHISTICATED: Poetic, refined luxury voice. Evocative language. Reflects Michelin-star prestige. Sign off elegantly.
- PROFESSIONAL: Warm, clear, genuine. Balances empathy with efficiency. Suitable for most reviews.
- DIPLOMATIC: De-escalation focus. Calm, sincere, solution-oriented. For critical or sensitive feedback.

Rules for every reply:
- Approximately ${wordRange} words
- Address specific details mentioned in the review (dishes, occasions, staff moments)
- Never admit legal liability or make specific promises
- Always invite the guest to return or reach out directly`;

    setGenState("loading");
    setGenReplies({});
    setEditReplies({});
    setVisibleCards([]);

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          system: systemPrompt,
          messages: [{ role: "user", content: selectedReview.text }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${resp.status}`);
      }

      const data   = await resp.json();
      const raw    = data.content?.[0]?.text || "";
      const parsed = parseReplies(raw);
      setGenReplies(parsed);
      setEditReplies({ ...parsed });
      setGenState("done");

      const keys = tone === "all" ? REPLY_STYLE_KEYS : [tone];
      keys.forEach((k, i) => setTimeout(() => setVisibleCards(p => [...p, k]), i * 130));
      showToast(t.toastGenerated);
    } catch (err) {
      setGenError(err.message);
      setGenState("error");
    }
  }

  async function handleRegenSingle(styleKey) {
    const key = apiKey.trim();
    if (!key || !selectedReview) return;
    const wordRange  = { short: "40–60", medium: "80–120", long: "150–200" }[length];
    const styleNames = { sophisticated: "Sophisticated", professional: "Professional", diplomatic: "Diplomatic" };
    const styleName  = styleNames[styleKey] || styleKey;
    const prev       = editReplies[styleKey] || genReplies[styleKey] || "";
    setRegenKey(styleKey);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: `You are the Guest Relations Director for ${location.name} in ${location.city}. Write one ${styleName} reply (${wordRange} words) for this Google review. Previous reply: """${prev}""". Write something meaningfully different. Return only the reply text, no preamble.`,
          messages: [{ role: "user", content: selectedReview.text }],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const txt  = data.content?.[0]?.text?.trim() || prev;
      setEditReplies(old => ({ ...old, [styleKey]: txt }));
      showToast(t.toastRegen);
    } catch (err) {
      showToast(t.toastRegenFail + err.message);
    } finally {
      setRegenKey(null);
    }
  }

  function handleCopy(styleKey) {
    const text = editReplies[styleKey] || genReplies[styleKey] || "";
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(styleKey);
      setTimeout(() => setCopiedKey(null), 2200);
      showToast(t.toastCopied);
    });
  }

  /* ── Render ── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ═══ TOP NAV ═══ */}
      <nav className="topnav">
        <div className="nav-brand">ReviewReply <span>PRO</span></div>
        <div className="nav-divider" />

        <div className="nav-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <select value={loc} onChange={e => handleLocChange(e.target.value)}>
            <option value="london">Maison Laurent — London</option>
            <option value="ny">The Terrace — New York</option>
            <option value="paris">Villa Rosso — Paris</option>
            <option value="amsterdam">Atelier Blanc — Amsterdam</option>
          </select>
        </div>

        <div className="nav-spacer" />

        <div className="nav-badge live">{t.liveBadge}</div>

        {/* ── Language toggle ── */}
        <div className="lang-toggle">
          <button
            className={`lang-opt${uiLang === "en" ? " active" : ""}`}
            onClick={() => setUiLang("en")}
          >
            EN
          </button>
          <button
            className={`lang-opt${uiLang === "zh" ? " active" : ""}`}
            onClick={() => setUiLang("zh")}
          >
            繁中
          </button>
        </div>

        <div className="nav-apikey">
          <input
            type={apiVis ? "text" : "password"}
            value={apiKey}
            placeholder={t.apiPlaceholder}
            className={apiKeySaved ? "saved" : ""}
            onChange={e => { setApiKey(e.target.value); setApiKeySaved(false); }}
          />
          <button className="btn-icon" onClick={() => setApiVis(v => !v)}>👁</button>
          <button className="btn-icon" onClick={handleSaveApiKey}>💾</button>
        </div>

        <div className="nav-divider" />
        <div className="nav-avatar">M</div>
      </nav>

      {/* ═══ DASHBOARD ═══ */}
      <div className="dashboard">

        {/* ── LEFT PANEL ── */}
        <aside className="left-panel">

          <div className="lp-section">
            <div className="lp-label">{t.overallRating}</div>
            <div className="rating-hero">
              <div className="rating-big">{location.avg.toFixed(1)}</div>
              <div className="rating-side">
                <div className="rating-stars-row">{"★".repeat(Math.round(location.avg))}</div>
                <div className="rating-count">{t.reviewsUnit(location.total)}</div>
              </div>
            </div>
            {[5, 4, 3, 2, 1].map((s, i) => {
              const pct = Math.round((location.dist[i] / Math.max(...location.dist)) * 100);
              return (
                <div key={s} className="bar-row">
                  <span className="bar-star">{s}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: barsAnim ? pct + "%" : "0%" }} />
                  </div>
                  <span className="bar-n">
                    {location.dist[i] > 999
                      ? (location.dist[i] / 1000).toFixed(1) + "k"
                      : location.dist[i]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="lp-section">
            <div className="lp-label">{t.thisMonth}</div>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-box-val">+47</div>
                <div className="stat-box-lbl">{t.newReviews}</div>
                <div className="stat-box-trend">{t.vsLastMonth}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">
                  {Math.round((1 - counts.unanswered / counts.all) * 100)}%
                </div>
                <div className="stat-box-lbl">{t.responseRate}</div>
                <div className="stat-box-trend">{t.industryAvg}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">
                  {Math.round((counts.positive / counts.all) * 100)}%
                </div>
                <div className="stat-box-lbl">{t.positiveRate}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{counts.unanswered}</div>
                <div className="stat-box-lbl">{t.unanswered}</div>
              </div>
            </div>
          </div>

          <div className="lp-section">
            <div className="lp-label">{t.filterReviews}</div>
            <div className="filter-list">
              {filters.map(f => (
                <button
                  key={f.key}
                  className={`filter-btn${filter === f.key ? " active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  <div className="filter-row">
                    <div className="dot" style={{ background: f.dot }} />
                    {f.label}
                  </div>
                  <span className="cnt">{counts[f.key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lp-section">
            <div className="lp-label">{t.sortBy}</div>
            <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="latest">{t.sLatest}</option>
              <option value="lowest">{t.sLowest}</option>
              <option value="highest">{t.sHighest}</option>
              <option value="unanswered">{t.sUnanswered}</option>
            </select>
          </div>

        </aside>

        {/* ── CENTER PANEL ── */}
        <main className="center-panel">
          <div className="cp-toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="cp-count">{t.reviewCount(filtered.length)}</span>
          </div>

          <div className="review-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <p>{t.noReviews}</p>
              </div>
            ) : (
              filtered.map(r => {
                const isReplied = repliedSet.has(r.id);
                return (
                  <div
                    key={r.id}
                    className={`review-card${r.id === selectedId ? " selected" : ""}`}
                    onClick={() => handleSelectReview(r)}
                  >
                    <div className="rc-header">
                      <div
                        className="rc-avatar"
                        style={{
                          background: `${r.color}22`,
                          border: `1px solid ${r.color}44`,
                          color: r.color,
                        }}
                      >
                        {r.initials}
                      </div>
                      <div className="rc-info">
                        <div className="rc-name">
                          {r.lang === "fr" ? "🇫🇷 " : ""}{r.name}
                        </div>
                        <div className="rc-date">
                          {formatTs(r.ts, t)} · Google Maps
                        </div>
                      </div>
                      <div className="rc-right">
                        <StarsRow n={r.stars} />
                        <span className={`sentiment-badge ${r.sentiment}`}>
                          {sentimentLabel[r.sentiment]}
                        </span>
                      </div>
                    </div>
                    <div className="rc-text">{r.text}</div>
                    <div className="rc-footer">
                      {r.tags.map(tag => (
                        <span key={tag} className="rc-tag">{tag}</span>
                      ))}
                      {isReplied && <span className="rc-replied">{t.replied}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="right-panel">

          <div className="rp-header">
            <div className="rp-title">{t.rpTitle}</div>
            <div className="rp-subtitle">{t.rpSubtitle}</div>
          </div>

          {selectedReview && (
            <div className="rp-review-preview">
              <div className="rp-preview-top">
                <div
                  className="rc-avatar"
                  style={{
                    width: "32px", height: "32px", fontSize: "12px",
                    background: `${selectedReview.color}22`,
                    border: `1px solid ${selectedReview.color}44`,
                    color: selectedReview.color,
                  }}
                >
                  {selectedReview.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="rp-preview-name">{selectedReview.name}</div>
                  <div className="rc-date">
                    {formatTs(selectedReview.ts, t)} · {location.name}, {location.city}
                  </div>
                </div>
                <StarsRow n={selectedReview.stars} />
              </div>
              <div className="rp-preview-text">{selectedReview.text}</div>
            </div>
          )}

          {selectedReview && (
            <div className="rp-controls">
              <div className="ctrl-row">
                <span className="ctrl-label">{t.toneLabel}</span>
                <select className="ctrl-select" value={tone} onChange={e => setTone(e.target.value)}>
                  <option value="all">{t.toneAll}</option>
                  <option value="sophisticated">{t.toneSoph}</option>
                  <option value="professional">{t.tonePro}</option>
                  <option value="diplomatic">{t.toneDiplo}</option>
                </select>
              </div>
              <div className="ctrl-row">
                <span className="ctrl-label">{t.langLabel}</span>
                <select className="ctrl-select" value={lang} onChange={e => setLang(e.target.value)}>
                  <option value="auto">{t.langAuto}</option>
                  <option value="en">{t.langEn}</option>
                  <option value="fr">{t.langFr}</option>
                  <option value="de">{t.langDe}</option>
                  <option value="it">{t.langIt}</option>
                  <option value="es">{t.langEs}</option>
                  <option value="zh">{t.langZh}</option>
                </select>
              </div>
              <div className="ctrl-row">
                <span className="ctrl-label">{t.lengthLabel}</span>
                <select className="ctrl-select" value={length} onChange={e => setLength(e.target.value)}>
                  <option value="medium">{t.lenMedium}</option>
                  <option value="short">{t.lenShort}</option>
                  <option value="long">{t.lenLong}</option>
                </select>
              </div>
              <button className="gen-btn" onClick={handleGenerate} disabled={genState === "loading"}>
                {genState === "loading" ? (
                  <><span>{t.generatingBtn}</span><div className="spinner" /></>
                ) : (
                  <span>{t.generateBtn}</span>
                )}
              </button>
            </div>
          )}

          <div className="rp-replies">

            {genState === "idle" && (
              <div className="reply-placeholder">
                <div className="icon">✦</div>
                <p>{selectedReview ? t.phHasReview : t.phNoReview}</p>
              </div>
            )}

            {genState === "loading" && [0, 1, 2].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skel" style={{ height: "14px", width: "40%", marginBottom: "4px" }} />
                <div className="skel" style={{ height: "10px", width: "60%", marginBottom: "12px" }} />
                <div className="skel" style={{ height: "12px", width: "100%", marginBottom: "6px" }} />
                <div className="skel" style={{ height: "12px", width: "92%", marginBottom: "6px" }} />
                <div className="skel" style={{ height: "12px", width: "80%" }} />
              </div>
            ))}

            {genState === "error" && (
              <div className="error-banner">
                <strong>{t.errorTitle}</strong>
                {genError}<br /><br />{t.errorHint}
              </div>
            )}

            {genState === "done" && activeStyles.map(s => {
              const text  = editReplies[s.key] || genReplies[s.key] || "";
              const wc    = text.trim().split(/\s+/).filter(Boolean).length;
              const isReg = regenKey === s.key;
              return (
                <div
                  key={s.key}
                  className={`reply-card${visibleCards.includes(s.key) ? " visible" : ""}`}
                >
                  <div className="reply-card-head">
                    <div>
                      <div className="reply-style-name">{s.label}</div>
                      <div className="reply-style-desc">{s.desc}</div>
                    </div>
                    <div className="reply-head-actions">
                      <button
                        className={`btn-sm${copiedKey === s.key ? " copied" : ""}`}
                        onClick={() => handleCopy(s.key)}
                      >
                        {copiedKey === s.key ? t.copied : t.copy}
                      </button>
                      <button
                        className="btn-sm gold"
                        onClick={() => handlePublish(selectedId)}
                      >
                        {t.publish}
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="reply-textarea"
                    value={isReg ? t.generatingBtn : text}
                    disabled={isReg}
                    rows={6}
                    onChange={e => setEditReplies(old => ({ ...old, [s.key]: e.target.value }))}
                  />

                  <div className="reply-card-foot">
                    <span className="char-count">{t.wordCount(wc)}</span>
                    <button
                      className="btn-sm"
                      onClick={() => handleRegenSingle(s.key)}
                      disabled={!!regenKey}
                    >
                      {isReg ? "…" : t.regen}
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </aside>
      </div>

      {toast && <div className="toast-box">{toast}</div>}
    </>
  );
}
