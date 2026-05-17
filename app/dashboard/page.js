"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { getPlan, usagePercent, isOverLimit, canUseFeature, trialDaysLeft, isTrialExpired } from "@/lib/plans";

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

  /* TRIAL BANNER */
  .trial-banner{background:linear-gradient(135deg,rgba(201,168,76,.14),rgba(201,168,76,.04));border:1px solid var(--gold-border);border-radius:var(--r);padding:12px 14px;margin-bottom:12px}
  .trial-banner.expired{background:rgba(224,96,96,.08);border-color:rgba(224,96,96,.35)}
  .trial-banner-title{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
  .trial-banner.expired .trial-banner-title{color:var(--neg-fg)}
  .trial-banner-days{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text1);line-height:1.1}
  .trial-banner-sub{font-size:11.5px;color:var(--text2);margin-top:4px;line-height:1.4}
  .trial-banner-btn{margin-top:10px;width:100%;padding:7px;border-radius:8px;font-size:12px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer}

  /* COMPETITOR TRACKING */
  .comp-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .comp-info{flex:1;min-width:0}
  .comp-name{font-size:12px;font-weight:700;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .comp-url{font-size:10.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .comp-del{background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:6px;transition:all .2s}
  .comp-del:hover{color:var(--neg-fg);background:rgba(224,96,96,.08)}
  .comp-add-row{display:flex;gap:6px;margin-top:6px}
  .comp-add-input{flex:1;padding:7px 9px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:11.5px;font-family:inherit;color:var(--text1);outline:none}
  .comp-add-input:focus{border-color:var(--gold-border)}
  .comp-add-input::placeholder{color:var(--text3)}
  .comp-add-btn{padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer}
  .comp-add-btn:disabled{opacity:.5;cursor:not-allowed}
  .comp-limit{font-size:10.5px;color:var(--text3);text-align:right;margin-top:4px}

  /* YOUR STYLE LEARNING HINT */
  .style-learning{background:rgba(201,168,76,.06);border:1px dashed var(--gold-border);border-radius:var(--r);padding:14px;margin:12px 16px;text-align:center}
  .style-learning-title{font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
  .style-learning p{font-size:12.5px;color:var(--text2);line-height:1.55}

  /* TABS — All Reviews / Needs Reply */
  .tabs{display:flex;gap:0;align-items:flex-end;height:34px}
  .tab{padding:8px 4px;margin-right:18px;background:transparent;border:none;border-bottom:2px solid transparent;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;font-family:inherit;letter-spacing:.2px;transition:color .18s,border-color .18s;display:flex;align-items:center;gap:7px}
  .tab:hover{color:var(--text1)}
  .tab.active{color:var(--gold-lt);border-bottom-color:var(--gold)}
  .tab-count{display:inline-block;padding:1px 8px;border-radius:999px;background:rgba(201,168,76,.14);font-size:10.5px;color:var(--gold);font-weight:700;letter-spacing:.3px}
  .tab.active .tab-count{background:rgba(201,168,76,.22)}
  .mid-actions{display:flex;align-items:center;gap:8px}
  .btn-csv{padding:6px 12px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:inherit;color:var(--gold);background:transparent;border:1px solid var(--gold-border);cursor:pointer;transition:all .2s}
  .btn-csv:hover{background:rgba(201,168,76,.08);color:var(--gold-lt)}

  /* DAYS UNANSWERED BADGE */
  .days-unanswered{padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.3px;background:rgba(232,184,75,.12);color:var(--neu-fg);border:1px solid rgba(232,184,75,.25);margin-left:auto}
  .days-unanswered.urgent{background:rgba(224,96,96,.12);color:var(--neg-fg);border-color:rgba(224,96,96,.25)}

  /* LANGUAGE TOGGLE in topbar — bright, always-visible chip */
  .lang-toggle{padding:5px 12px;border-radius:8px;border:1px solid var(--gold-border);background:rgba(201,168,76,.1);color:var(--gold-lt);cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;letter-spacing:.5px;transition:all .18s;display:inline-flex;align-items:center;gap:5px;min-height:28px}
  .lang-toggle::before{content:"🌐";font-size:11px}
  .lang-toggle:hover{background:rgba(201,168,76,.22);color:var(--gold-lt);border-color:var(--gold)}

  /* CSV MODAL */
  .csv-drop{padding:24px;border:1.5px dashed rgba(201,168,76,.3);border-radius:var(--r);background:rgba(201,168,76,.03);text-align:center;cursor:pointer;transition:all .2s}
  .csv-drop:hover{border-color:var(--gold);background:rgba(201,168,76,.06)}
  .csv-drop input{display:none}
  .csv-drop-icon{font-size:28px;color:var(--gold);margin-bottom:10px}
  .csv-drop-text{font-size:13.5px;color:var(--text2);margin-bottom:6px}
  .csv-drop-filename{font-size:13px;color:var(--gold-lt);font-weight:600;margin-top:8px;word-break:break-all}
  .csv-format-hint{font-size:11.5px;color:var(--text3);text-align:center;margin-top:10px;font-family:monospace}
  .csv-help-link{display:block;font-size:12px;color:var(--gold);text-decoration:none;text-align:center;margin-top:6px}
  .csv-help-link:hover{text-decoration:underline}
  .csv-success{padding:10px 14px;background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.3);border-radius:8px;font-size:13px;color:var(--pos-fg);margin-top:12px}

  /* ════════════ Competitors tab ════════════ */
  .competitors-pane{padding:18px 16px;display:flex;flex-direction:column;gap:22px}
  .comp-upgrade{padding:30px 24px;background:linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.03));border:1px solid var(--gold-border);border-radius:14px;text-align:center}
  .comp-upgrade-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--gold-lt);margin-bottom:8px}
  .comp-upgrade-sub{font-size:13.5px;color:var(--text2);line-height:1.6;max-width:480px;margin:0 auto 18px}
  .comp-upgrade-btn{padding:11px 26px;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;box-shadow:0 3px 14px rgba(201,168,76,.32)}
  .comp-upgrade-btn:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.45)}

  .comp-section{display:flex;flex-direction:column;gap:10px}
  .comp-section-title{font-size:11.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);padding-left:2px}

  /* Search */
  .comp-search-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:14px}
  .comp-search-row{display:flex;gap:8px}
  .comp-search-input{flex:1;padding:10px 12px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:13.5px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .comp-search-input:focus{border-color:var(--gold-border)}
  .comp-search-btn{padding:10px 16px;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;white-space:nowrap}
  .comp-search-btn:disabled{opacity:.6;cursor:not-allowed}
  .comp-search-results{display:flex;flex-direction:column;gap:8px;margin-top:12px}
  .comp-result{background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:11px 13px;display:flex;align-items:flex-start;gap:10px;transition:all .18s}
  .comp-result:hover{border-color:var(--gold-border);background:rgba(201,168,76,.04)}
  .comp-result-info{flex:1;min-width:0}
  .comp-result-name{font-size:13.5px;font-weight:700;color:var(--text1);margin-bottom:3px}
  .comp-result-meta{font-size:12px;color:var(--gold);margin-bottom:3px}
  .comp-result-addr{font-size:11.5px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .comp-track-btn{padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;flex-shrink:0;white-space:nowrap}
  .comp-track-btn:disabled{opacity:.6;cursor:not-allowed}
  .comp-err{padding:8px 12px;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.25);border-radius:8px;font-size:12.5px;color:var(--neg-fg);margin-top:10px}

  /* Rating comparison strip */
  .rating-compare{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .rating-compare::-webkit-scrollbar{display:none}
  .rating-card{flex:1 0 160px;min-width:160px;background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);padding:13px;display:flex;flex-direction:column;gap:4px;position:relative}
  .rating-card.you{border-color:var(--gold-border);background:linear-gradient(135deg,rgba(201,168,76,.08),var(--surface))}
  .rating-card.leader::after{content:"🏆";position:absolute;top:8px;right:10px;font-size:14px}
  .rating-card-label{font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3)}
  .rating-card-name{font-size:13.5px;font-weight:700;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rating-card-stars{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--gold)}
  .rating-card-count{font-size:11.5px;color:var(--text2)}

  /* Per-competitor block */
  .comp-block{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:14px;display:flex;flex-direction:column;gap:14px}
  .comp-block-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .comp-block-info{flex:1;min-width:0}
  .comp-block-name{font-size:15px;font-weight:700;color:var(--text1);margin-bottom:4px}
  .comp-block-meta{font-size:12.5px;color:var(--gold);margin-bottom:4px}
  .comp-block-addr{font-size:11.5px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px}
  .comp-block-maps{display:inline-block;margin-top:6px;font-size:11.5px;color:var(--gold);text-decoration:none}
  .comp-block-maps:hover{text-decoration:underline}
  .comp-block-actions{display:flex;gap:6px}
  .btn-comp-remove{padding:5px 11px;border-radius:7px;font-size:11.5px;font-weight:600;font-family:inherit;background:transparent;border:1px solid rgba(224,96,96,.25);color:var(--neg-fg);cursor:pointer;transition:all .18s}
  .btn-comp-remove:hover{background:rgba(224,96,96,.08)}

  /* Keyword comparison block — 2 columns side by side */
  .kw-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media (max-width:768px){.kw-compare{grid-template-columns:1fr}}
  .kw-side{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px}
  .kw-side-label{font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
  .kw-side-label.you{color:var(--gold)}
  .kw-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12px}
  .kw-row-name{color:var(--text2);font-weight:500}
  .kw-row-stats{font-size:11px;display:flex;gap:6px}
  .kw-row-pos{color:var(--pos-fg);font-weight:700}
  .kw-row-neg{color:var(--neg-fg);font-weight:700}
  .kw-empty-side{font-size:11.5px;color:var(--text3);font-style:italic;padding:6px 0}

  /* Latest competitor reviews */
  .comp-reviews-list{display:flex;flex-direction:column;gap:8px}
  .comp-review-item{background:var(--bg2);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:10px 12px}
  .comp-review-head{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .comp-review-name{font-size:12.5px;font-weight:700;color:var(--text1)}
  .comp-review-stars{font-size:11px;color:var(--gold);letter-spacing:1px}
  .comp-review-date{font-size:11px;color:var(--text3)}
  .comp-review-text{font-size:12.5px;color:var(--text2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

  .comp-empty{padding:36px 20px;text-align:center;background:var(--surface);border:1px dashed rgba(255,255,255,.1);border-radius:var(--r)}
  .comp-empty h4{font-size:14.5px;color:var(--text1);font-weight:700;margin-bottom:6px}
  .comp-empty p{font-size:12.5px;color:var(--text2);line-height:1.55;max-width:340px;margin:0 auto}

  /* Mobile-only widgets are hidden on desktop */
  .mobile-only{display:none}
  .filter-row{display:contents}
  .mobile-drawer-handle{display:none}
  .mobile-drawer-close{display:none}
  .mobile-drawer-backdrop{display:none}
  .mobile-kw-toggle{display:none}

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

  /* ════════════ MOBILE (≤ 768px) ════════════ */
  @media (max-width: 768px) {
    body{overflow:auto;height:auto;min-height:100vh}

    /* Topbar — compact, hide non-essential elements */
    .topbar{padding:0 12px;gap:6px;height:54px;flex-wrap:nowrap}
    .topbar-left{gap:8px;min-width:0;flex-shrink:1}
    .live-badge{display:none}
    .restaurant-name{display:none}
    .plan-badge{font-size:10px;padding:2px 7px}
    .lang-toggle{padding:3px 8px;font-size:11px}
    .topbar-right{gap:6px}
    .icon-btn{width:30px;height:30px;font-size:14px}
    .logo{font-size:15px}
    .logo-icon{width:22px;height:22px;font-size:11px}

    /* Body: stack everything */
    .body{display:flex;flex-direction:column;height:auto;min-height:calc(100vh - 54px)}
    .col{height:auto;overflow:visible;width:100%}

    /* Left col: now a horizontal-friendly summary above the review list */
    .left-col{border-right:none;border-bottom:1px solid rgba(255,255,255,.06);padding:12px}
    .usage-card{padding:11px 12px;margin-bottom:10px}

    /* Stats: keep 2×2 grid (compact on mobile) */
    .stat-grid{gap:8px;margin-bottom:10px}
    .stat-card{padding:10px}
    .stat-n{font-size:18px}
    .stat-l{font-size:10.5px}

    /* Filters: horizontal scroll row */
    .section-label{margin:10px 0 6px}
    .filter-row{display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding-bottom:6px;margin-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .filter-row::-webkit-scrollbar{display:none}
    .filter-row .filter-btn{flex-shrink:0;width:auto;padding:6px 12px;font-size:12.5px;background:var(--surface);border:1px solid rgba(255,255,255,.08)}
    .filter-row .filter-btn.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
    .filter-row .filter-count{margin-left:5px}

    /* Trial banner more compact */
    .trial-banner{padding:10px 12px;margin-bottom:10px}
    .trial-banner-days{font-size:18px}
    .trial-banner-sub{font-size:11px}

    /* Competitor section: collapse to keep above-the-fold short */
    .comp-card{padding:8px 10px}
    .comp-name{font-size:11.5px}
    .comp-url{font-size:10px}

    /* Keyword Intelligence: collapsible */
    .mobile-kw-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;padding:8px 10px;background:transparent;border:1px solid rgba(255,255,255,.06);border-radius:8px;color:var(--text2);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;margin-top:4px}
    .mobile-kw-toggle:hover{border-color:var(--gold-border)}
    .mobile-kw-toggle .chev{transition:transform .25s;color:var(--gold)}
    .mobile-kw-toggle.open .chev{transform:rotate(180deg)}
    .keyword-section.collapsed{display:none}

    /* Middle col */
    .mid-col{border-right:none}
    .mid-header{padding:10px 12px}
    .tabs{height:auto}
    .tab{padding:6px 4px;margin-right:14px;font-size:12.5px}
    .btn-csv{padding:5px 10px;font-size:11.5px}
    .btn-add{padding:5px 11px;font-size:12px}
    .review-card{padding:12px}
    .review-meta{gap:6px}
    .review-name{font-size:13px}
    .review-text{font-size:13px;-webkit-line-clamp:3}
    .review-date{font-size:11px}

    /* Right col → fixed bottom drawer */
    .right-col{
      position:fixed;
      left:0;right:0;bottom:0;top:auto;
      width:100%;
      max-height:90vh;height:90vh;
      transform:translateY(100%);
      transition:transform .32s cubic-bezier(.4,0,.2,1);
      z-index:101;
      border-radius:18px 18px 0 0;
      box-shadow:0 -10px 40px rgba(0,0,0,.55);
      border-top:1px solid rgba(201,168,76,.15);
      overflow-y:auto;
      -webkit-overflow-scrolling:touch;
    }
    .right-col.mobile-open{transform:translateY(0)}

    .mobile-drawer-handle{display:flex;justify-content:center;align-items:center;padding:10px 0 6px;position:sticky;top:0;background:var(--bg2);z-index:5;cursor:grab;touch-action:none}
    .mobile-drawer-handle::after{content:'';width:44px;height:4px;border-radius:2px;background:rgba(255,255,255,.22)}

    .mobile-drawer-close{display:flex;position:absolute;top:8px;right:10px;width:32px;height:32px;border:none;background:rgba(255,255,255,.06);color:var(--text2);border-radius:50%;align-items:center;justify-content:center;font-size:16px;cursor:pointer;z-index:6}
    .mobile-drawer-close:hover{background:rgba(255,255,255,.1);color:var(--text1)}

    .mobile-drawer-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100}
    .mobile-drawer-backdrop.open{display:block;animation:fadeIn .2s ease}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    .editor-header{padding-top:10px}
    .style-tabs{padding:10px 12px;flex-wrap:wrap;gap:6px}
    .style-tab{flex:1 1 auto;min-width:0;padding:8px 6px;font-size:11.5px}
    .lang-row{padding:10px 12px;gap:8px}
    .generate-area{padding:14px 12px}
    .reply-cards{padding:10px 12px}
    .reply-card{padding:12px}
    .reply-text{font-size:13px}

    /* Modal stays usable on small screens */
    .modal{padding:22px 18px;max-height:90vh;overflow-y:auto}
    .modal h3{font-size:18px}
    .modal-actions{position:sticky;bottom:0;background:var(--surface);padding-top:8px}
  }
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

const STYLES_EN = [
  { key: "warm", label: "Warm & Personal", desc: "Like the owner personally read this tonight" },
  { key: "professional", label: "Professional & Gracious", desc: "Elegant, refined brand voice" },
  { key: "brief", label: "Brief & Direct", desc: "Short and impactful" },
];
const STYLES_ZH = [
  { key: "warm", label: "溫暖個人", desc: "彷彿老闆親自讀過這則評論" },
  { key: "professional", label: "專業優雅", desc: "精緻、優雅的品牌語氣" },
  { key: "brief", label: "簡短直接", desc: "簡短有力" },
];
const STYLE_YOUR_STYLE_EN = { key: "your_style", label: "Your Style", desc: "Learned from your past replies (Pro)" };
const STYLE_YOUR_STYLE_ZH = { key: "your_style", label: "你的風格", desc: "從你過去的回覆學習而來（Pro）" };

// Backwards-compat alias for any remaining English references (e.g. server payload keys).
const STYLES = STYLES_EN;

// ─── Translations dictionary ────────────────────────────────────────────────
const T = {
  en: {
    live: "Live",
    ai_replies_used: "AI Replies Used",
    avg_rating: "Avg Rating",
    total_reviews: "Total Reviews",
    reply_rate: "Reply Rate",
    this_month: "This Month",
    filters: "Filters",
    f_all: "All Reviews",
    f_positive: "Positive",
    f_neutral: "Neutral",
    f_negative: "Negative",
    f_unanswered: "Unanswered",
    f_crisis: "🚨 Crisis",
    trial_free: "Free Trial",
    trial_expired: "Trial Expired",
    days_left: (n) => (n === 1 ? "1 day left" : `${n} days left`),
    zero_days: "0 days",
    trial_sub: (d) => `Your 14-day trial ends ${d}.`,
    trial_expired_sub: "Upgrade to continue using AI replies.",
    view_plans: "View Plans →",
    upgrade_now: "Upgrade Now →",
    competitor_tracking: "Competitor Tracking",
    competitor_empty: (n) => `Track up to ${n} competitor Google Business profiles to monitor their review trends.`,
    competitor_url_placeholder: "Google Business URL",
    add_competitor: "+ Add",
    tracked: (a, b) => `${a} / ${b} tracked`,
    keyword_intel: "Keyword Intelligence",
    kw_empty: "Add reviews to see keyword analysis",
    mentions: (n) => `${n} mentions`,
    tab_all: "All Reviews",
    tab_needs_reply: "Needs Reply",
    showing: (x, y) => `Showing ${x} of ${y} reviews`,
    showing_filtered: (x, y) => `Showing ${x} of ${y}`,
    add_review: "+ Add Review",
    upload_csv: "Upload CSV",
    no_reviews_title: "No reviews yet",
    no_reviews_sub: 'Click "Add Review" to manually add a customer review and generate AI reply suggestions.',
    no_unanswered_title: "All caught up",
    no_unanswered_sub: "You've replied to every review. 🎉",
    days_unanswered: (n) => (n === 0 ? "today" : n === 1 ? "1 day unanswered" : `${n} days unanswered`),
    replied: "✓ Replied",
    delete_btn: "Delete",
    editor_empty_title: "Select a review to generate AI replies",
    editor_empty_sub: "Click any review on the left to open the AI reply editor. Three different reply styles will be generated for you.",
    lang_label: "Reply in:",
    over_limit: (n) => `You've used all ${n} AI replies this month.`,
    upgrade_plan: "Upgrade Plan →",
    btn_generate: "✦ Generate AI Replies",
    btn_regenerate: "Regenerate All Replies",
    btn_generating: "Generating…",
    btn_copy: "Copy",
    btn_copied: "Copied!",
    btn_regen: "Regenerate",
    ready_paste: "✓ Ready to paste into Google",
    mark_replied: "Mark Replied",
    ys_learning_title: "Your Style — Learning",
    ys_learning_p: "Reply to a few more reviews using Copy. Once you have 3+ saved replies, the AI will start generating in your personal voice.",
    modal_add_title: "Add Review",
    modal_add_sub: "Manually add a customer review to generate AI reply suggestions.",
    label_reviewer: "Reviewer Name",
    label_stars: "Star Rating",
    label_content: "Review Content",
    cancel: "Cancel",
    saving: "Saving…",
    placeholder_name: "e.g. James T.",
    placeholder_content: "Paste the review text here…",
    csv_title: "Upload Review CSV",
    csv_sub: "Bulk-import your past Google reviews. We'll deduplicate them against existing reviews.",
    csv_select: "Choose CSV file",
    csv_uploading: "Uploading…",
    csv_upload: "Upload",
    csv_format: "Expected columns: reviewer_name, stars, content, review_date",
    csv_help: "How to export from Google Maps →",
    csv_result: (i, d, t) => `Imported ${i} new · skipped ${d} duplicate${d === 1 ? "" : "s"} · ${t} rows total`,
    mr_title: "Mark as Replied",
    mr_sub: "Paste the exact reply you posted on Google. We use this to learn your personal voice and improve future AI suggestions (Pro plan).",
    mr_placeholder: "The exact text you posted on Google…",
    mr_save: "Save Reply",
    mr_skip: "Skip — just mark replied",
    mr_learned_just_now: "✓ Your style has been learned",
    mr_progress: (have, need) => `Pro style learning: ${have} / ${need} replies analyzed`,
    // Plan badge / topbar tooltips
    plan_free_trial: "Free Trial",
    plan_starter: "Starter",
    plan_growth: "Growth",
    plan_pro: "Pro",
    tt_settings: "Settings",
    tt_help: "Help",
    tt_signout: "Sign Out",
    // Sentiment + crisis labels rendered inside review cards
    sent_positive: "positive",
    sent_neutral: "neutral",
    sent_negative: "negative",
    crisis_label: "🚨 Crisis",
    days_ago: (n) => (n === 0 ? "today" : n === 1 ? "1 day ago" : `${n} days ago`),
    // Competitors tab
    tab_competitors: "Competitors",
    comp_upgrade_title: "Competitor tracking is a Pro feature",
    comp_upgrade_sub: "Track up to 3 rival restaurants. Compare ratings, reviews, and the keywords guests mention about you vs them.",
    comp_upgrade_btn: "Upgrade to Pro →",
    comp_add_section: "Add a competitor",
    comp_search_placeholder: "Restaurant name or business",
    comp_search_btn: "Search Google",
    comp_searching: "Searching…",
    comp_no_results: "No matches found. Try a different name.",
    comp_max_reached: (n) => `Max ${n} competitors reached. Remove one to add another.`,
    comp_added: "Tracking",
    comp_track_btn: "Track →",
    comp_tracking: "Tracking…",
    comp_remove: "Remove",
    comp_rating_compare_title: "Rating Comparison",
    comp_keyword_compare_title: "Keyword Comparison",
    comp_latest_reviews_title: "Latest reviews",
    comp_no_reviews: "No reviews synced yet — daily cron is on it.",
    comp_your_store: "Your store",
    comp_loading: "Loading competitors…",
    comp_review_count_short: (n) => `${n} ${n === 1 ? "review" : "reviews"}`,
    comp_view_maps: "View on Google Maps →",
    comp_synced_at: (date) => `Last synced ${date}`,
    comp_empty_title: "No competitors yet",
    comp_empty_sub: "Paste a Google Maps link for up to 3 competitor businesses to start tracking their reviews and keyword trends.",
    kw_pos: "positive mentions",
    kw_neg: "negative mentions",
    // Paste-link flow
    comp_paste_section: "Add a competitor",
    comp_paste_placeholder: "Paste a Google Maps link (maps.app.goo.gl/… or google.com/maps/place/…)",
    comp_paste_help: "Open the competitor's Google Maps listing → tap Share → copy the link → paste it here.",
    comp_preview_btn: "Preview",
    comp_resolving: "Resolving link…",
    comp_preview_title: "Is this the right business?",
    comp_confirm_track: "Confirm & Track",
    comp_cancel: "Cancel",
    comp_invalid_link: "Not a valid Google Maps link",
    comp_resolve_failed: "Couldn't resolve that link",
    comp_how_to_get_link: "How to get the link",
    comp_link_steps: [
      "Open Google Maps",
      "Find the restaurant you want to track",
      "Click Share",
      "Copy link → paste it above",
    ],
    comp_supported_examples: "Supported link formats:",
    comp_pick_correct: "Pick the correct business:",
    comp_or_search: "Or search by name",
    comp_search_name_placeholder: "Restaurant name",
    comp_search_name_btn: "Search",
  },
  zh: {
    live: "即時",
    ai_replies_used: "已用 AI 回覆",
    avg_rating: "平均評分",
    total_reviews: "評論總數",
    reply_rate: "回覆率",
    this_month: "本月",
    filters: "篩選",
    f_all: "全部評論",
    f_positive: "正向",
    f_neutral: "中性",
    f_negative: "負向",
    f_unanswered: "未回覆",
    f_crisis: "🚨 危機",
    trial_free: "免費試用",
    trial_expired: "試用已過期",
    days_left: (n) => (n === 1 ? "剩 1 天" : `剩 ${n} 天`),
    zero_days: "0 天",
    trial_sub: (d) => `14 天試用將於 ${d} 結束。`,
    trial_expired_sub: "升級方案以繼續使用 AI 回覆。",
    view_plans: "查看方案 →",
    upgrade_now: "立即升級 →",
    competitor_tracking: "競爭對手追蹤",
    competitor_empty: (n) => `最多可追蹤 ${n} 個競爭對手 Google 商家，掌握評論趨勢。`,
    competitor_url_placeholder: "Google 商家網址",
    add_competitor: "+ 新增",
    tracked: (a, b) => `${a} / ${b} 已追蹤`,
    keyword_intel: "關鍵字情報",
    kw_empty: "新增評論後會出現關鍵字分析",
    mentions: (n) => `${n} 次提及`,
    tab_all: "全部評論",
    tab_needs_reply: "待回覆",
    showing: (x, y) => `顯示 ${x} / 共 ${y} 則`,
    showing_filtered: (x, y) => `顯示 ${x} / ${y}`,
    add_review: "+ 新增評論",
    upload_csv: "上傳 CSV",
    no_reviews_title: "尚無評論",
    no_reviews_sub: '點擊「新增評論」手動加入一則顧客評論，AI 會立刻產生回覆建議。',
    no_unanswered_title: "全部回完了",
    no_unanswered_sub: "你已回覆所有評論 🎉",
    days_unanswered: (n) => (n === 0 ? "今天" : `${n} 天未回覆`),
    replied: "✓ 已回覆",
    delete_btn: "刪除",
    editor_empty_title: "選擇一則評論以產生 AI 回覆",
    editor_empty_sub: "在左側點擊任一評論開啟 AI 回覆編輯器，會自動產生三種不同風格的回覆。",
    lang_label: "回覆語言：",
    over_limit: (n) => `本月 ${n} 則 AI 回覆已用完。`,
    upgrade_plan: "升級方案 →",
    btn_generate: "✦ 產生 AI 回覆",
    btn_regenerate: "重新產生全部回覆",
    btn_generating: "產生中…",
    btn_copy: "複製",
    btn_copied: "已複製！",
    btn_regen: "重新生成",
    ready_paste: "✓ 已複製，可直接貼到 Google",
    mark_replied: "標記已回覆",
    ys_learning_title: "你的風格 — 學習中",
    ys_learning_p: "再多複製幾則回覆，累積 3 則以上後，AI 就能用你的個人語氣產出回覆。",
    modal_add_title: "新增評論",
    modal_add_sub: "手動加入一則顧客評論，AI 會產生回覆建議。",
    label_reviewer: "評論者姓名",
    label_stars: "星等",
    label_content: "評論內容",
    cancel: "取消",
    saving: "儲存中…",
    placeholder_name: "例如：James T.",
    placeholder_content: "在此貼上評論文字…",
    csv_title: "上傳評論 CSV",
    csv_sub: "批次匯入過去的 Google 評論，系統會自動去重。",
    csv_select: "選擇 CSV 檔",
    csv_uploading: "上傳中…",
    csv_upload: "上傳",
    csv_format: "欄位：reviewer_name, stars, content, review_date",
    csv_help: "如何從 Google Maps 匯出？→",
    csv_result: (i, d, t) => `匯入 ${i} 則 · 跳過 ${d} 則重複 · 共 ${t} 列`,
    mr_title: "標記為已回覆",
    mr_sub: "貼上你在 Google 實際發出的回覆內容。系統會用這些資料學習你的個人語氣，提升「你的風格」的 AI 建議準確度（Pro 方案）。",
    mr_placeholder: "你在 Google 發出的實際文字…",
    mr_save: "儲存回覆",
    mr_skip: "略過，只標已回覆",
    mr_learned_just_now: "✓ 風格學習完成",
    mr_progress: (have, need) => `Pro 風格學習：${have} / ${need} 則回覆已分析`,
    // Plan badge / topbar tooltips
    plan_free_trial: "免費試用",
    plan_starter: "入門版",
    plan_growth: "成長版",
    plan_pro: "專業版",
    tt_settings: "設定",
    tt_help: "說明",
    tt_signout: "登出",
    // Sentiment + crisis labels rendered inside review cards
    sent_positive: "好評",
    sent_neutral: "普通",
    sent_negative: "差評",
    crisis_label: "🚨 危機",
    days_ago: (n) => (n === 0 ? "今天" : `${n} 天前`),
    // Competitors tab
    tab_competitors: "競爭對手",
    comp_upgrade_title: "競爭對手追蹤為 Pro 方案功能",
    comp_upgrade_sub: "最多追蹤 3 家對手餐廳，比較評分、評論內容，以及顧客提到你與對手時最常用的關鍵字。",
    comp_upgrade_btn: "升級至 Pro →",
    comp_add_section: "新增競爭對手",
    comp_search_placeholder: "餐廳名稱或商家",
    comp_search_btn: "搜尋 Google",
    comp_searching: "搜尋中…",
    comp_no_results: "找不到符合的商家，請換個名稱試試。",
    comp_max_reached: (n) => `已達 ${n} 家上限，請先移除其中一家再新增。`,
    comp_added: "已追蹤",
    comp_track_btn: "追蹤 →",
    comp_tracking: "新增中…",
    comp_remove: "移除",
    comp_rating_compare_title: "評分比較",
    comp_keyword_compare_title: "關鍵字比較",
    comp_latest_reviews_title: "最新評論",
    comp_no_reviews: "尚未同步到評論——每日 cron 會自動補上。",
    comp_your_store: "你的店",
    comp_loading: "競爭對手載入中…",
    comp_review_count_short: (n) => `${n} 則評論`,
    comp_view_maps: "在 Google Maps 查看 →",
    comp_synced_at: (date) => `最後同步：${date}`,
    comp_empty_title: "尚未新增競爭對手",
    comp_empty_sub: "貼上競爭對手的 Google Maps 連結（最多 3 家）即可開始追蹤評論與關鍵字趨勢。",
    kw_pos: "次正向提及",
    kw_neg: "次負向提及",
    // Paste-link flow
    comp_paste_section: "新增競爭對手",
    comp_paste_placeholder: "貼上 Google Maps 連結（maps.app.goo.gl/… 或 google.com/maps/place/…）",
    comp_paste_help: "在 Google Maps 上開啟競爭對手店家 → 點選「分享」→ 複製連結 → 貼到這裡。",
    comp_preview_btn: "預覽",
    comp_resolving: "解析連結中…",
    comp_preview_title: "確認是這家商家嗎？",
    comp_confirm_track: "確認並追蹤",
    comp_cancel: "取消",
    comp_invalid_link: "不是有效的 Google Maps 連結",
    comp_resolve_failed: "無法解析此連結",
    comp_how_to_get_link: "如何取得連結",
    comp_link_steps: [
      "開啟 Google Maps",
      "找到你要追蹤的餐廳",
      "點選「分享」",
      "複製連結 → 貼到上方",
    ],
    comp_supported_examples: "支援的連結格式：",
    comp_pick_correct: "請選擇正確的商家：",
    comp_or_search: "或用店名搜尋",
    comp_search_name_placeholder: "餐廳名稱",
    comp_search_name_btn: "搜尋",
  },
};

// Resolve a plan's badge label by plan key, in the current language.
const PLAN_LABEL_KEY = { free_trial: "plan_free_trial", starter: "plan_starter", growth: "plan_growth", pro: "plan_pro" };

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
  const [yourStyleStatus, setYourStyleStatus] = useState({});
  const [competitorInput, setCompetitorInput] = useState({ url: "", name: "" });
  const [savingCompetitor, setSavingCompetitor] = useState(false);
  const [competitorError, setCompetitorError] = useState("");
  const [lang, setLang] = useState("en");
  const [reviewTab, setReviewTab] = useState("all"); // "all" | "needs_reply"
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [keywordExpanded, setKeywordExpanded] = useState(false);
  const [showMarkRepliedModal, setShowMarkRepliedModal] = useState(false);
  const [markRepliedText, setMarkRepliedText] = useState("");
  const [markRepliedSaving, setMarkRepliedSaving] = useState(false);
  const [styleLearnedToast, setStyleLearnedToast] = useState(false);
  // Competitors tab state
  const [competitors, setCompetitors] = useState([]);
  const [competitorReviews, setCompetitorReviews] = useState([]);
  const [compLinkInput, setCompLinkInput] = useState("");
  const [compCandidates, setCompCandidates] = useState(null); // array of resolved candidates
  const [compResolving, setCompResolving] = useState(false);  // POST /resolve in flight
  const [compAdding, setCompAdding] = useState("");           // place_id currently being added (or "")
  const [compError, setCompError] = useState("");
  // Name-search fallback
  const [compNameQuery, setCompNameQuery] = useState("");
  const [compNameResults, setCompNameResults] = useState(null);
  const [compNameSearching, setCompNameSearching] = useState(false);
  const drawerTouchStartY = useRef(null);
  const drawerTouchDelta = useRef(0);
  const drawerRef = useRef(null);
  const t = T[lang];
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Filter reviews so reconnecting a different Google business never mixes data.
    // Match either the current place_id, or NULL (manual / CSV / inbound entries with no
    // clear place provenance — those stay visible across business changes).
    let reviewsQuery = supabase.from("reviews").select("*").eq("user_id", user.id);
    if (prof?.place_id) {
      reviewsQuery = reviewsQuery.or(`place_id.eq.${prof.place_id},place_id.is.null`);
    }
    const { data: revs } = await reviewsQuery.order("review_date", { ascending: false });

    setProfile(prof);
    setReviews(revs || []);

    // Pro plan: load competitors + their reviews in parallel
    if (prof?.plan === "pro") {
      const [{ data: comps }, { data: compRevs }] = await Promise.all([
        supabase.from("competitors").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("competitor_reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
      ]);
      setCompetitors(comps || []);
      setCompetitorReviews(compRevs || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-open the bottom drawer on mobile when a review is selected;
  // desktop just shows the editor in the right column as usual.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedReview && window.innerWidth <= 768) setMobileEditorOpen(true);
  }, [selectedReview]);

  const closeMobileDrawer = () => {
    setMobileEditorOpen(false);
    // Reset translate on the drawer node so the next open isn't dragged-down.
    if (drawerRef.current) drawerRef.current.style.transform = "";
  };

  const onDrawerTouchStart = (e) => {
    drawerTouchStartY.current = e.touches[0].clientY;
    drawerTouchDelta.current = 0;
  };
  const onDrawerTouchMove = (e) => {
    if (drawerTouchStartY.current == null) return;
    const delta = e.touches[0].clientY - drawerTouchStartY.current;
    if (delta < 0) return; // only react to downward drags
    drawerTouchDelta.current = delta;
    if (drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${delta}px)`;
      drawerRef.current.style.transition = "none";
    }
  };
  const onDrawerTouchEnd = () => {
    if (drawerRef.current) {
      drawerRef.current.style.transition = "";
      drawerRef.current.style.transform = "";
    }
    if (drawerTouchDelta.current > 80) closeMobileDrawer();
    drawerTouchStartY.current = null;
    drawerTouchDelta.current = 0;
  };

  const plan = getPlan(profile?.plan || "free_trial");
  const planKey = profile?.plan || "free_trial";
  const usedCount = profile?.used_count || 0;
  const pct = usagePercent(planKey, usedCount);
  const overLimit = isOverLimit(planKey, usedCount);
  const daysLeft = trialDaysLeft(planKey, profile?.trial_ends_at);
  const trialExpired = isTrialExpired(planKey, profile?.trial_ends_at);
  const competitorUrls = profile?.competitor_urls || [];
  const competitorLimit = plan.competitor_limit || 0;
  const isPro = canUseFeature(planKey, "ai_style_learning");
  const stylesLocalized = lang === "zh" ? STYLES_ZH : STYLES_EN;
  const yourStyleLocalized = lang === "zh" ? STYLE_YOUR_STYLE_ZH : STYLE_YOUR_STYLE_EN;
  const styleTabs = isPro ? [...stylesLocalized, yourStyleLocalized] : stylesLocalized;
  const unansweredCount = reviews.filter((r) => !r.replied).length;
  const daysSince = (date) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));

  const keywords = analyseKeywords(reviews);

  const filteredReviews = reviews.filter((r) => {
    if (reviewTab === "needs_reply" && r.replied) return false;
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
        setYourStyleStatus((prev) => ({ ...prev, [selectedReview.id]: data.your_style_status || null }));
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

  const handleCopy = async (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    // Persist the copied reply so Pro Your Style can learn from it on future generations.
    if (selectedReview && text) {
      await supabase.from("reviews").update({ replied: true, reply_text: text }).eq("id", selectedReview.id);
      setReviews((prev) => prev.map((r) => r.id === selectedReview.id ? { ...r, replied: true, reply_text: text } : r));
    }
  };

  const handleAddCompetitor = async () => {
    setCompetitorError("");
    const url = competitorInput.url.trim();
    if (!url) { setCompetitorError("Enter a Google Business URL"); return; }
    if (competitorUrls.length >= competitorLimit) { setCompetitorError(`Max ${competitorLimit} competitors`); return; }
    if (competitorUrls.includes(url)) { setCompetitorError("Already tracking this URL"); return; }
    setSavingCompetitor(true);
    const next = [...competitorUrls, url];
    const { error } = await supabase.from("profiles").update({ competitor_urls: next }).eq("id", profile.id);
    setSavingCompetitor(false);
    if (error) { setCompetitorError(error.message); return; }
    setProfile((p) => ({ ...p, competitor_urls: next }));
    setCompetitorInput({ url: "", name: "" });
  };

  const handleRemoveCompetitor = async (urlToRemove) => {
    const next = competitorUrls.filter((u) => u !== urlToRemove);
    const { error } = await supabase.from("profiles").update({ competitor_urls: next }).eq("id", profile.id);
    if (error) { setCompetitorError(error.message); return; }
    setProfile((p) => ({ ...p, competitor_urls: next }));
  };

  // ────────── Competitors tab handlers (paste-link + name-search flows) ──────────
  const handleCompResolve = async () => {
    setCompError("");
    setCompCandidates(null);
    const url = compLinkInput.trim();
    if (!url) { setCompError(t.comp_invalid_link); return; }
    setCompResolving(true);
    try {
      const res = await fetch("/api/competitors/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCompError(data.error || t.comp_resolve_failed);
        // If the server already pulled out a probable name, seed the
        // name-search fallback so the user can try with one click.
        if (data?.parsed_name) setCompNameQuery(data.parsed_name);
        return;
      }
      setCompCandidates(data.candidates || []);
    } catch (e) {
      setCompError(e.message);
    } finally {
      setCompResolving(false);
    }
  };

  // Pick one of the resolved candidates (or a name-search result) and add it.
  const handleCompPick = async (pickedPlace) => {
    if (!pickedPlace?.place_id) return;
    setCompAdding(pickedPlace.place_id);
    setCompError("");
    try {
      const res = await fetch("/api/competitors/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickedPlace),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setCompError(data.error || "Failed to add"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: comps }, { data: compRevs }] = await Promise.all([
        supabase.from("competitors").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("competitor_reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
      ]);
      setCompetitors(comps || []);
      setCompetitorReviews(compRevs || []);
      setCompCandidates(null);
      setCompLinkInput("");
      setCompNameResults(null);
      setCompNameQuery("");
    } catch (e) {
      setCompError(e.message);
    } finally {
      setCompAdding("");
    }
  };

  const handleCompCancelPreview = () => {
    setCompCandidates(null);
    setCompError("");
  };

  // Name-search fallback (uses the existing /api/places/search)
  const handleCompNameSearch = async () => {
    const q = compNameQuery.trim();
    if (!q) return;
    setCompError("");
    setCompNameResults(null);
    setCompNameSearching(true);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: q, city: profile?.city, country: profile?.country }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setCompError(data.error || "Search failed"); setCompNameResults([]); return; }
      setCompNameResults(data.results || []);
    } catch (e) {
      setCompError(e.message);
      setCompNameResults([]);
    } finally {
      setCompNameSearching(false);
    }
  };

  const handleCompRemove = async (compId) => {
    if (!confirm("Remove this competitor and its cached reviews?")) return;
    setCompError("");
    try {
      await fetch("/api/competitors/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: compId }),
      });
      const removed = competitors.find((c) => c.id === compId);
      setCompetitors((prev) => prev.filter((c) => c.id !== compId));
      if (removed) {
        setCompetitorReviews((prev) => prev.filter((r) => r.competitor_place_id !== removed.place_id));
      }
    } catch (e) {
      setCompError(e.message);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvError("");
    setCsvResult(null);
    try {
      const text = await csvFile.text();
      const res = await fetch("/api/reviews/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCsvError(data.error || "Upload failed");
        return;
      }
      setCsvResult(data);
      // Reload reviews so the new ones appear immediately
      loadData();
    } catch (err) {
      setCsvError(err.message);
    } finally {
      setCsvUploading(false);
    }
  };

  // Opens the Mark Replied modal preloaded with the currently focused AI suggestion
  // as a starting point (the user can paste their actual edited reply over it).
  const openMarkRepliedModal = () => {
    const current = selectedReview ? replies[selectedReview.id]?.[activeStyle] : "";
    setMarkRepliedText(current || "");
    setShowMarkRepliedModal(true);
  };

  // Save the actual reply text + mark replied. Auto-fires AI style training
  // once the user has accumulated 5+ actual replies and isn't yet learned.
  const saveActualReply = async (skipText = false) => {
    if (!selectedReview) return;
    setMarkRepliedSaving(true);
    const payload = { replied: true };
    if (!skipText && markRepliedText.trim()) {
      payload.actual_reply_text = markRepliedText.trim();
    }
    const { error } = await supabase.from("reviews").update(payload).eq("id", selectedReview.id);
    if (!error) {
      setReviews((prev) => prev.map((r) => r.id === selectedReview.id ? { ...r, ...payload } : r));
    }
    setShowMarkRepliedModal(false);
    setMarkRepliedSaving(false);
    setMarkRepliedText("");

    // Trigger style learning if Pro + we just saved an actual reply text
    if (!skipText && payload.actual_reply_text && profile?.plan === "pro") {
      try {
        const res = await fetch("/api/ai/learn-style", { method: "POST" });
        const data = await res.json();
        if (data.ok && data.ready) {
          // Refresh profile so Settings + dashboard reflect the new learned state.
          const { data: { user } } = await supabase.auth.getUser();
          const { data: fresh } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (fresh) setProfile(fresh);
          if (!profile?.ai_style_learned) {
            setStyleLearnedToast(true);
            setTimeout(() => setStyleLearnedToast(false), 5000);
          }
        }
      } catch (e) {
        console.warn("[dashboard] learn-style call failed:", e.message);
      }
    }
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
      // Manually-added reviews are user-aware — mark as already notified so
      // cron / any downstream notify path never re-fires email for them.
      notified_at: new Date().toISOString(),
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
          <div className="live-badge"><span className="live-dot" />{t.live}</div>
        </div>
        <div className="topbar-right">
          {profile?.restaurant_name && <span className="restaurant-name">{profile.restaurant_name}</span>}
          <span className="plan-badge">{t[PLAN_LABEL_KEY[planKey]] || plan.name}</span>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            title={lang === "en" ? "切換成中文" : "Switch to English"}
            aria-label={lang === "en" ? "Switch to Chinese" : "Switch to English"}
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
          <button className="icon-btn" onClick={() => window.location.href = "/dashboard/settings"} title={t.tt_settings}>⚙</button>
          <button className="icon-btn" onClick={() => window.location.href = "/help"} title={t.tt_help}>?</button>
          <button className="icon-btn" onClick={handleLogout} title={t.tt_signout}>↩</button>
        </div>
      </div>

      {/* Backdrop behind the mobile drawer */}
      <div
        className={`mobile-drawer-backdrop${mobileEditorOpen ? " open" : ""}`}
        onClick={closeMobileDrawer}
      />

      <div className="body">
        {/* LEFT COL */}
        <div className="col left-col">
          {/* TRIAL COUNTDOWN — free_trial plan only */}
          {planKey === "free_trial" && daysLeft !== null && (
            <div className={`trial-banner${trialExpired ? " expired" : ""}`}>
              <div className="trial-banner-title">{trialExpired ? t.trial_expired : t.trial_free}</div>
              <div className="trial-banner-days">
                {trialExpired ? t.zero_days : t.days_left(daysLeft)}
              </div>
              <div className="trial-banner-sub">
                {trialExpired
                  ? t.trial_expired_sub
                  : t.trial_sub(new Date(profile.trial_ends_at).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { month: "short", day: "numeric" }))}
              </div>
              <button className="trial-banner-btn" onClick={() => window.location.href = "/dashboard/settings"}>
                {trialExpired ? t.upgrade_now : t.view_plans}
              </button>
            </div>
          )}

          {/* USAGE */}
          <div className="usage-card">
            <div className="usage-row">
              <span className="usage-label">{t.ai_replies_used}</span>
              <span className="usage-val">{usedCount} / {plan.reply_limit === Infinity ? "∞" : plan.reply_limit}</span>
            </div>
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: `${pct}%`, background: pct >= 80 ? (pct >= 100 ? "var(--neg-fg)" : "var(--neu-fg)") : "linear-gradient(90deg,var(--gold-dim),var(--gold-lt))" }} />
            </div>
          </div>

          {/* STATS */}
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-n">{avgRating}★</div><div className="stat-l">{t.avg_rating}</div></div>
            <div className="stat-card"><div className="stat-n">{reviews.length}</div><div className="stat-l">{t.total_reviews}</div></div>
            <div className="stat-card"><div className="stat-n">{replyRate}%</div><div className="stat-l">{t.reply_rate}</div></div>
            <div className="stat-card"><div className="stat-n">{reviews.filter((r) => { const d = new Date(r.review_date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}</div><div className="stat-l">{t.this_month}</div></div>
          </div>

          {/* FILTERS */}
          <div className="section-label">{t.filters}</div>
          <div className="filter-row">
            {[
              { key: "all", label: t.f_all, dot: "#555", count: reviews.length },
              { key: "positive", label: t.f_positive, dot: "var(--pos-fg)", count: reviews.filter((r) => r.stars >= 4).length },
              { key: "neutral", label: t.f_neutral, dot: "var(--neu-fg)", count: reviews.filter((r) => r.stars === 3).length },
              { key: "negative", label: t.f_negative, dot: "var(--neg-fg)", count: reviews.filter((r) => r.stars <= 2).length },
              { key: "unanswered", label: t.f_unanswered, dot: "var(--gold)", count: reviews.filter((r) => !r.replied).length },
              { key: "crisis", label: t.f_crisis, dot: "var(--neg-fg)", count: reviews.filter((r) => r.is_crisis).length },
            ].map((f) => (
              <button key={f.key} className={`filter-btn${filter === f.key ? " active" : ""}`} onClick={() => { setFilter(f.key); setKwFilter(null); }}>
                <span className="filter-dot" style={{ background: f.dot }} />
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* COMPETITOR TRACKING moved into its own mid-col tab (Pro) — left col
              now just shows a small shortcut for Pro users with competitors */}
          {isPro && competitors.length > 0 && (
            <>
              <div className="section-label">{t.competitor_tracking}</div>
              <button
                className="filter-btn"
                style={{background:"rgba(201,168,76,.08)",border:"1px solid var(--gold-border)",color:"var(--gold-lt)",marginBottom:6}}
                onClick={() => setReviewTab("competitors")}
              >
                <span className="filter-dot" style={{background:"var(--gold)"}} />
                {t.tab_competitors}
                <span className="filter-count">{competitors.length}</span>
              </button>
            </>
          )}

          {/* KEYWORD INTELLIGENCE */}
          <div className="section-label">{t.keyword_intel}</div>
          {/* Mobile: collapsible toggle (desktop hides via CSS) */}
          <button
            className={`mobile-kw-toggle${keywordExpanded ? " open" : ""}`}
            onClick={() => setKeywordExpanded((v) => !v)}
            aria-expanded={keywordExpanded}
          >
            <span>{keywords.length} {lang === "zh" ? "個關鍵字類別" : "categories"}</span>
            <span className="chev">▼</span>
          </button>
          <div className={`keyword-section${keywordExpanded ? "" : " collapsed"}`}>
            {keywords.length === 0 && <p style={{fontSize:12,color:"var(--text3)",padding:"8px 4px"}}>{t.kw_empty}</p>}
            {keywords.map((kw) => {
              const total = kw.posCount + kw.negCount || 1;
              const posPct = Math.round((kw.posCount / total) * 100);
              const negPct = 100 - posPct;
              return (
                <div key={kw.name} className={`kw-card${kwFilter === kw.name ? " active" : ""}`} onClick={() => setKwFilter(kwFilter === kw.name ? null : kw.name)}>
                  <div className="kw-header"><span className="kw-name">{kw.name}</span><span className="kw-count">{t.mentions(kw.total)}</span></div>
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
          <div className="mid-header" style={{flexDirection:"column",alignItems:"stretch",gap:8,paddingTop:10,paddingBottom:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
              <div className="tabs">
                <button className={`tab${reviewTab === "all" ? " active" : ""}`} onClick={() => setReviewTab("all")}>
                  {t.tab_all}<span className="tab-count">{reviews.length}</span>
                </button>
                <button className={`tab${reviewTab === "needs_reply" ? " active" : ""}`} onClick={() => setReviewTab("needs_reply")}>
                  {t.tab_needs_reply}<span className="tab-count">{unansweredCount}</span>
                </button>
                <button className={`tab${reviewTab === "competitors" ? " active" : ""}`} onClick={() => setReviewTab("competitors")}>
                  {t.tab_competitors}{isPro && <span className="tab-count">{competitors.length}</span>}
                </button>
              </div>
              {reviewTab !== "competitors" && (
                <div className="mid-actions">
                  <button className="btn-csv" onClick={() => { setShowCsvModal(true); setCsvResult(null); setCsvError(""); setCsvFile(null); }}>📄 {t.upload_csv}</button>
                  <button className="btn-add" onClick={() => setShowAddModal(true)}>{t.add_review}</button>
                </div>
              )}
            </div>
            {reviewTab !== "competitors" && (
              <div className="mid-count" style={{paddingBottom:8}}>
                {reviewTab === "all"
                  ? t.showing(filteredReviews.length, reviews.length)
                  : t.showing_filtered(filteredReviews.length, unansweredCount)}
              </div>
            )}
          </div>

          {reviewTab !== "competitors" && loading && [1,2,3].map((i) => (
            <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
              <div className="shimmer" style={{height:14,width:"60%",marginBottom:8}} />
              <div className="shimmer" style={{height:12,width:"40%",marginBottom:10}} />
              <div className="shimmer" style={{height:12,width:"90%"}} />
            </div>
          ))}

          {reviewTab !== "competitors" && !loading && filteredReviews.length === 0 && (
            <div className="empty-reviews">
              <h4>{reviewTab === "needs_reply" ? t.no_unanswered_title : t.no_reviews_title}</h4>
              <p>{reviewTab === "needs_reply" ? t.no_unanswered_sub : t.no_reviews_sub}</p>
            </div>
          )}

          {reviewTab !== "competitors" && filteredReviews.map((review) => {
            const days = daysSince(review.review_date);
            return (
              <div key={review.id} className={`review-card${selectedReview?.id === review.id ? " selected" : ""}${review.is_crisis ? " crisis" : ""}`} onClick={() => setSelectedReview(review)}>
                <div className="review-meta">
                  <span className="review-name">{review.reviewer_name}</span>
                  <span className="stars">{starsDisplay(review.stars)}</span>
                  <span className="review-date">{new Date(review.review_date).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className={`sentiment-tag sent-${review.sentiment}`}>{t[`sent_${review.sentiment}`] || review.sentiment}</span>
                  {review.is_crisis && <span className="crisis-tag">{t.crisis_label}</span>}
                  {reviewTab === "needs_reply" && (
                    <span className={`days-unanswered${days >= 3 ? " urgent" : ""}`}>{t.days_unanswered(days)}</span>
                  )}
                </div>
                <div className="review-text">{review.content}</div>
                <div className="review-actions">
                  {review.replied && <span className="replied-tag">{t.replied}</span>}
                  <button className="btn-del" onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}>{t.delete_btn}</button>
                </div>
              </div>
            );
          })}

          {/* ════════════ Competitors tab content ════════════ */}
          {reviewTab === "competitors" && (
            <div className="competitors-pane">
              {!isPro ? (
                <div className="comp-upgrade">
                  <div style={{fontSize:36,marginBottom:8}}>🏆</div>
                  <div className="comp-upgrade-title">{t.comp_upgrade_title}</div>
                  <div className="comp-upgrade-sub">{t.comp_upgrade_sub}</div>
                  <button className="comp-upgrade-btn" onClick={() => window.location.href = "/dashboard/settings#plan-section"}>
                    {t.comp_upgrade_btn}
                  </button>
                </div>
              ) : (
                <>
                  {/* Rating comparison strip */}
                  {(competitors.length > 0 || reviews.length > 0) && (
                    <div className="comp-section">
                      <div className="comp-section-title">{t.comp_rating_compare_title}</div>
                      {(() => {
                        const youRating = avgRating === "—" ? 0 : Number(avgRating);
                        const youCount = reviews.length;
                        const entries = [
                          { id: "you", name: t.comp_your_store, rating: youRating, count: youCount, isYou: true },
                          ...competitors.map((c) => ({
                            id: c.id,
                            name: c.name || "Competitor",
                            rating: typeof c.rating === "number" ? c.rating : 0,
                            count: c.user_rating_count || 0,
                            isYou: false,
                          })),
                        ];
                        const leaderRating = Math.max(...entries.map((e) => e.rating));
                        return (
                          <div className="rating-compare">
                            {entries.map((e) => (
                              <div
                                key={e.id}
                                className={`rating-card${e.isYou ? " you" : ""}${e.rating === leaderRating && leaderRating > 0 ? " leader" : ""}`}
                              >
                                <div className="rating-card-label">{e.isYou ? t.comp_your_store : "Competitor"}</div>
                                <div className="rating-card-name" title={e.name}>{e.name}</div>
                                <div className="rating-card-stars">{e.rating > 0 ? `${e.rating.toFixed(1)} ★` : "—"}</div>
                                <div className="rating-card-count">{t.comp_review_count_short(e.count)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Add competitor — paste a Google Maps link OR search by name */}
                  {competitors.length < 3 && (
                    <div className="comp-section">
                      <div className="comp-section-title">{t.comp_paste_section}</div>
                      <div className="comp-search-card">
                        {/* Link input + Preview action */}
                        <div className="comp-search-row">
                          <input
                            className="comp-search-input"
                            placeholder={t.comp_paste_placeholder}
                            value={compLinkInput}
                            onChange={(e) => setCompLinkInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCompResolve(); }}
                          />
                          <button className="comp-search-btn" onClick={handleCompResolve} disabled={compResolving || !compLinkInput.trim()}>
                            {compResolving ? t.comp_resolving : t.comp_preview_btn}
                          </button>
                        </div>

                        {/* "How to get the link" steps + format examples */}
                        <details style={{marginTop:10}}>
                          <summary style={{fontSize:12,color:"var(--gold)",cursor:"pointer",fontWeight:600,padding:"4px 0"}}>
                            {t.comp_how_to_get_link}
                          </summary>
                          <ol style={{margin:"8px 0 6px 18px",padding:0,color:"var(--text2)",fontSize:12,lineHeight:1.7}}>
                            {t.comp_link_steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                          <div style={{fontSize:11,color:"var(--text3)",marginTop:8}}>
                            <div style={{fontWeight:700,marginBottom:4}}>{t.comp_supported_examples}</div>
                            <ul style={{margin:0,padding:"0 0 0 18px",fontFamily:"monospace"}}>
                              <li>https://maps.app.goo.gl/xxx</li>
                              <li>https://goo.gl/maps/xxx</li>
                              <li>https://www.google.com/maps/place/...</li>
                              <li>https://www.google.com/maps?cid=...</li>
                            </ul>
                          </div>
                        </details>

                        {/* Resolved candidate(s) → pick one */}
                        {compCandidates && compCandidates.length > 0 && (
                          <>
                            <div style={{fontSize:12.5,fontWeight:700,color:"var(--gold-lt)",letterSpacing:".3px",marginTop:14,marginBottom:8}}>
                              {compCandidates.length === 1 ? t.comp_preview_title : t.comp_pick_correct}
                            </div>
                            <div className="comp-search-results">
                              {compCandidates.map((r) => {
                                const alreadyTracked = competitors.some((c) => c.place_id === r.place_id);
                                const isOwn = profile?.place_id === r.place_id;
                                const isAdding = compAdding === r.place_id;
                                return (
                                  <div key={r.place_id} className="comp-result" style={{cursor:"default"}}>
                                    <div className="comp-result-info">
                                      <div className="comp-result-name">{r.name}</div>
                                      <div className="comp-result-meta">
                                        {r.rating != null ? `${r.rating.toFixed(1)} ★` : "—"}
                                        {r.user_rating_count != null && (
                                          <span style={{color:"var(--text2)"}}> · {r.user_rating_count.toLocaleString()} reviews</span>
                                        )}
                                        {r.type && <span style={{color:"var(--text2)"}}> · {r.type}</span>}
                                      </div>
                                      {r.address && <div className="comp-result-addr">{r.address}</div>}
                                      <a
                                        href={r.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{display:"inline-block",marginTop:6,fontSize:11.5,color:"var(--gold)",textDecoration:"none",fontWeight:600}}
                                      >🗺 {t.comp_view_maps}</a>
                                    </div>
                                    <button
                                      className="comp-track-btn"
                                      onClick={() => handleCompPick(r)}
                                      disabled={!!compAdding || alreadyTracked || isOwn}
                                      title={isOwn ? "That's your business" : alreadyTracked ? "Already tracking" : ""}
                                    >
                                      {isAdding ? t.comp_tracking : alreadyTracked ? t.comp_added : isOwn ? "—" : t.comp_confirm_track}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              className="btn-comp-remove"
                              style={{marginTop:10,border:"1px solid rgba(255,255,255,.12)",color:"var(--text2)",background:"transparent"}}
                              onClick={handleCompCancelPreview}
                              disabled={!!compAdding}
                            >{t.comp_cancel}</button>
                          </>
                        )}

                        {compError && <div className="comp-err">{compError}</div>}

                        {/* Always-available "Or search by name" fallback */}
                        <div style={{marginTop:18,paddingTop:14,borderTop:"1px dashed rgba(255,255,255,.08)"}}>
                          <div style={{fontSize:11.5,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",color:"var(--text3)",marginBottom:8}}>
                            {t.comp_or_search}
                          </div>
                          <div className="comp-search-row">
                            <input
                              className="comp-search-input"
                              placeholder={t.comp_search_name_placeholder}
                              value={compNameQuery}
                              onChange={(e) => setCompNameQuery(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleCompNameSearch(); }}
                            />
                            <button
                              className="comp-search-btn"
                              onClick={handleCompNameSearch}
                              disabled={compNameSearching || !compNameQuery.trim()}
                              style={{background:"transparent",border:"1px solid var(--gold-border)",color:"var(--gold-lt)"}}
                            >
                              {compNameSearching ? t.comp_searching : t.comp_search_name_btn}
                            </button>
                          </div>
                          {compNameResults && compNameResults.length > 0 && (
                            <div className="comp-search-results" style={{marginTop:10}}>
                              {compNameResults.map((r) => {
                                const alreadyTracked = competitors.some((c) => c.place_id === r.place_id);
                                const isOwn = profile?.place_id === r.place_id;
                                const isAdding = compAdding === r.place_id;
                                return (
                                  <div key={r.place_id} className="comp-result" style={{cursor:"default"}}>
                                    <div className="comp-result-info">
                                      <div className="comp-result-name">{r.name}</div>
                                      <div className="comp-result-meta">
                                        {r.rating != null ? `${r.rating.toFixed(1)} ★` : "—"}
                                        {r.user_rating_count != null && (
                                          <span style={{color:"var(--text2)"}}> · {r.user_rating_count.toLocaleString()} reviews</span>
                                        )}
                                      </div>
                                      {r.address && <div className="comp-result-addr">{r.address}</div>}
                                      <a
                                        href={r.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{display:"inline-block",marginTop:6,fontSize:11.5,color:"var(--gold)",textDecoration:"none",fontWeight:600}}
                                      >🗺 {t.comp_view_maps}</a>
                                    </div>
                                    <button
                                      className="comp-track-btn"
                                      onClick={() => handleCompPick(r)}
                                      disabled={!!compAdding || alreadyTracked || isOwn}
                                    >
                                      {isAdding ? t.comp_tracking : alreadyTracked ? t.comp_added : isOwn ? "—" : t.comp_track_btn}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {compNameResults && compNameResults.length === 0 && (
                            <p style={{fontSize:11.5,color:"var(--text3)",marginTop:8}}>{t.comp_no_results}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {competitors.length >= 3 && (
                    <p style={{fontSize:12,color:"var(--text3)",fontStyle:"italic"}}>{t.comp_max_reached(3)}</p>
                  )}

                  {/* Per-competitor blocks */}
                  {competitors.length === 0 && (
                    <div className="comp-empty">
                      <h4>{t.comp_empty_title}</h4>
                      <p>{t.comp_empty_sub}</p>
                    </div>
                  )}

                  {competitors.map((c) => {
                    const reviewsForComp = competitorReviews.filter((r) => r.competitor_place_id === c.place_id);
                    const top5 = reviewsForComp.slice(0, 5);

                    // Keyword analysis: your store + competitor side-by-side
                    const yourKw = analyseKeywords(reviews).slice(0, 5);
                    const compKwAll = analyseKeywords(reviewsForComp.map((r) => ({ content: r.review_content })));
                    const compKw = compKwAll.slice(0, 5);

                    return (
                      <div key={c.id} className="comp-block">
                        <div className="comp-block-header">
                          <div className="comp-block-info">
                            <div className="comp-block-name">{c.name || "Competitor"}</div>
                            <div className="comp-block-meta">
                              {typeof c.rating === "number" ? `${c.rating.toFixed(1)} ★` : "—"}
                              {c.user_rating_count != null && <span style={{color:"var(--text2)"}}> · {c.user_rating_count.toLocaleString()} reviews</span>}
                            </div>
                            {c.address && <div className="comp-block-addr" title={c.address}>{c.address}</div>}
                            <a
                              className="comp-block-maps"
                              href={c.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(c.place_id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >{t.comp_view_maps}</a>
                            {c.last_synced_at && (
                              <div style={{fontSize:10.5,color:"var(--text3)",marginTop:4}}>
                                {t.comp_synced_at(new Date(c.last_synced_at).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US"))}
                              </div>
                            )}
                          </div>
                          <div className="comp-block-actions">
                            <button className="btn-comp-remove" onClick={() => handleCompRemove(c.id)}>{t.comp_remove}</button>
                          </div>
                        </div>

                        {/* Keyword comparison */}
                        <div>
                          <div className="comp-section-title" style={{marginBottom:8}}>{t.comp_keyword_compare_title}</div>
                          <div className="kw-compare">
                            <div className="kw-side">
                              <div className="kw-side-label you">{t.comp_your_store}</div>
                              {yourKw.length === 0 && <div className="kw-empty-side">—</div>}
                              {yourKw.map((kw) => (
                                <div key={kw.name} className="kw-row">
                                  <span className="kw-row-name">{kw.name}</span>
                                  <span className="kw-row-stats">
                                    <span className="kw-row-pos">+{kw.posCount}</span>
                                    <span className="kw-row-neg">−{kw.negCount}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="kw-side">
                              <div className="kw-side-label">{c.name || "Competitor"}</div>
                              {compKw.length === 0 && <div className="kw-empty-side">—</div>}
                              {compKw.map((kw) => (
                                <div key={kw.name} className="kw-row">
                                  <span className="kw-row-name">{kw.name}</span>
                                  <span className="kw-row-stats">
                                    <span className="kw-row-pos">+{kw.posCount}</span>
                                    <span className="kw-row-neg">−{kw.negCount}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Latest reviews */}
                        <div>
                          <div className="comp-section-title" style={{marginBottom:8}}>{t.comp_latest_reviews_title}</div>
                          {top5.length === 0 ? (
                            <p style={{fontSize:12.5,color:"var(--text3)",fontStyle:"italic"}}>{t.comp_no_reviews}</p>
                          ) : (
                            <div className="comp-reviews-list">
                              {top5.map((r) => (
                                <div key={r.id} className="comp-review-item">
                                  <div className="comp-review-head">
                                    <span className="comp-review-name">{r.reviewer_name || "Anonymous"}</span>
                                    <span className="comp-review-stars">{starsDisplay(r.stars || 3)}</span>
                                    <span className="comp-review-date">{new Date(r.review_date || r.created_at).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                  </div>
                                  <div className="comp-review-text">{r.review_content}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COL — acts as a fixed bottom drawer on mobile */}
        <div
          className={`col right-col${mobileEditorOpen ? " mobile-open" : ""}`}
          ref={drawerRef}
        >
          <div
            className="mobile-drawer-handle"
            onTouchStart={onDrawerTouchStart}
            onTouchMove={onDrawerTouchMove}
            onTouchEnd={onDrawerTouchEnd}
          />
          <button
            className="mobile-drawer-close"
            onClick={closeMobileDrawer}
            aria-label="Close"
          >✕</button>
          {!selectedReview ? (
            <div className="editor-empty">
              <div className="editor-empty-icon">✦</div>
              <h4>{t.editor_empty_title}</h4>
              <p>{t.editor_empty_sub}</p>
            </div>
          ) : (
            <>
              <div className="editor-header">
                <div className="editor-review-name">{selectedReview.reviewer_name}</div>
                <div className="editor-review-meta">
                  <span className="stars" style={{fontSize:13}}>{starsDisplay(selectedReview.stars)}</span>
                  <span className={`sentiment-tag sent-${selectedReview.sentiment}`}>{t[`sent_${selectedReview.sentiment}`] || selectedReview.sentiment}</span>
                </div>
              </div>
              <div className="editor-review-text">"{selectedReview.content}"</div>

              <div className="style-tabs">
                {styleTabs.map((s) => (
                  <button key={s.key} className={`style-tab${activeStyle === s.key ? " active" : ""}`} onClick={() => setActiveStyle(s.key)} title={s.desc}>{s.label}</button>
                ))}
              </div>

              <div className="lang-row">
                <span className="lang-label">{t.lang_label}</span>
                {LANGS.map((l) => (
                  <button key={l.key} className={`lang-btn${activeLang === l.key ? " active" : ""}`} onClick={() => setActiveLang(l.key)}>{l.label}</button>
                ))}
              </div>

              {overLimit && (
                <div className="upgrade-banner">
                  <p>{t.over_limit(plan.reply_limit)}</p>
                  <button className="btn-upgrade" onClick={() => window.location.href = "/dashboard/settings"}>{t.upgrade_plan}</button>
                </div>
              )}

              <div className="generate-area">
                <button className="btn-generate" onClick={handleGenerate} disabled={generating || overLimit}>
                  {generating ? t.btn_generating : currentReplies ? t.btn_regenerate : t.btn_generate}
                </button>
                {generateError && <div style={{marginTop:10,padding:"8px 12px",background:"rgba(224,96,96,.12)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:12.5,color:"var(--neg-fg)"}}>{generateError}</div>}
              </div>

              {currentReplies && (
                <div className="reply-cards">
                  {styleTabs.map((s, idx) => {
                    // Your Style: show a learning hint if not enough samples yet
                    if (s.key === "your_style" && !currentReplies.your_style) {
                      const status = yourStyleStatus[selectedReview.id];
                      if (status === "learning") {
                        return (
                          <div key={s.key} className="style-learning" style={{margin:"0 0 0 0"}}>
                            <div className="style-learning-title">{t.ys_learning_title}</div>
                            <p>{t.ys_learning_p}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                    return currentReplies[s.key] && (
                      <div key={s.key} className="reply-card">
                        <div className="reply-style">{s.label}</div>
                        <div className="reply-text">{currentReplies[s.key]}</div>
                        <div className="reply-actions">
                          <button className="btn-copy" onClick={() => handleCopy(currentReplies[s.key], idx)}>
                            {copiedIdx === idx ? t.btn_copied : t.btn_copy}
                          </button>
                          <button className="btn-regen" onClick={() => handleGenerate()}>{t.btn_regen}</button>
                          {copiedIdx === idx && <span className="copied-hint">{t.ready_paste}</span>}
                          {!selectedReview.replied && (
                            <button className="btn-regen" style={{marginLeft:"auto"}} onClick={openMarkRepliedModal}>{t.mark_replied}</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            <h3>{t.modal_add_title}</h3>
            <p className="modal-sub">{t.modal_add_sub}</p>
            {modalError && <div style={{padding:"8px 12px",background:"rgba(224,96,96,.12)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:13,color:"var(--neg-fg)",marginBottom:14}}>{modalError}</div>}
            <div className="modal-group">
              <label className="modal-label">{t.label_reviewer}</label>
              <input className="modal-input" placeholder={t.placeholder_name} value={newReview.reviewer_name} onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })} />
            </div>
            <div className="modal-group">
              <label className="modal-label">{t.label_stars}</label>
              <div className="star-select">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} className={`star-btn${newReview.stars >= n ? " active" : ""}`} onClick={() => setNewReview({ ...newReview, stars: n })}>★</button>
                ))}
              </div>
            </div>
            <div className="modal-group">
              <label className="modal-label">{t.label_content}</label>
              <textarea className="modal-input modal-textarea" placeholder={t.placeholder_content} value={newReview.content} onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddModal(false)}>{t.cancel}</button>
              <button className="modal-save" onClick={handleAddReview} disabled={savingReview || !newReview.content}>{savingReview ? t.saving : t.modal_add_title}</button>
            </div>
          </div>
        </div>
      )}

      {/* MARK REPLIED MODAL — collects the actual posted text */}
      {showMarkRepliedModal && (
        <div className="modal-overlay" onClick={() => setShowMarkRepliedModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.mr_title}</h3>
            <p className="modal-sub">{t.mr_sub}</p>
            <div className="modal-group">
              <label className="modal-label">{t.label_content}</label>
              <textarea
                className="modal-input modal-textarea"
                placeholder={t.mr_placeholder}
                value={markRepliedText}
                onChange={(e) => setMarkRepliedText(e.target.value)}
                style={{minHeight:140}}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => saveActualReply(true)} disabled={markRepliedSaving}>
                {t.mr_skip}
              </button>
              <button className="modal-save" onClick={() => saveActualReply(false)} disabled={markRepliedSaving || !markRepliedText.trim()}>
                {markRepliedSaving ? t.saving : t.mr_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLE LEARNED TOAST */}
      {styleLearnedToast && (
        <div style={{
          position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",
          padding:"12px 22px",background:"linear-gradient(135deg,#e8c96a,#c9a84c)",color:"#000",
          fontWeight:700,fontSize:13.5,borderRadius:999,boxShadow:"0 6px 20px rgba(201,168,76,.5)",
          zIndex:200,animation:"fadeIn .3s ease"
        }}>
          {t.mr_learned_just_now}
        </div>
      )}

      {/* CSV UPLOAD MODAL */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.csv_title}</h3>
            <p className="modal-sub">{t.csv_sub}</p>
            <label className="csv-drop">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => { setCsvFile(e.target.files?.[0] || null); setCsvResult(null); setCsvError(""); }}
              />
              <div className="csv-drop-icon">📄</div>
              <div className="csv-drop-text">{t.csv_select}</div>
              {csvFile && <div className="csv-drop-filename">{csvFile.name}</div>}
            </label>
            <div className="csv-format-hint">{t.csv_format}</div>
            <a className="csv-help-link" href="/help#csv-import" target="_blank" rel="noreferrer">{t.csv_help}</a>
            {csvError && (
              <div style={{padding:"8px 12px",background:"rgba(224,96,96,.12)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:13,color:"var(--neg-fg)",marginTop:12}}>{csvError}</div>
            )}
            {csvResult && (
              <div className="csv-success">{t.csv_result(csvResult.inserted, csvResult.skipped_duplicates, csvResult.total)}</div>
            )}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowCsvModal(false)}>{t.cancel}</button>
              <button className="modal-save" onClick={handleCsvUpload} disabled={!csvFile || csvUploading}>
                {csvUploading ? t.csv_uploading : t.csv_upload}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
