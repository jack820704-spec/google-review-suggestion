"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getPlan, canUseFeature, usagePercent } from "@/lib/plans";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--neg:#e06060;--pos:#5dba7a}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:sticky;top:0;z-index:10}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .topbar-right{display:flex;align-items:center;gap:10px}
  .icon-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .2s}
  .icon-btn:hover{border-color:var(--gold-border);color:var(--gold-lt)}
  .wrap{max-width:700px;margin:0 auto;padding:40px 6vw 80px}
  .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:4px}
  .page-sub{font-size:14px;color:var(--text2);margin-bottom:36px}
  .section{margin-bottom:32px}
  .section-header{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
  .card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:20px}
  .form-group{margin-bottom:16px}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  label{display:block;font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.3px;text-transform:uppercase;margin-bottom:6px}
  .form-input,.form-select{width:100%;padding:10px 13px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:14px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .form-input:focus,.form-select:focus{border-color:var(--gold-border)}
  .form-input::placeholder{color:var(--text3)}
  .form-select option{background:var(--bg2)}
  .toggle-item{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .toggle-item:last-child{border-bottom:none}
  .toggle-info h4{font-size:14px;font-weight:600;margin-bottom:3px}
  .toggle-info p{font-size:12.5px;color:var(--text2);line-height:1.5}
  .toggle{position:relative;width:40px;height:22px;flex-shrink:0;margin-top:2px}
  .toggle input{opacity:0;width:0;height:0}
  .toggle-track{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:999px;cursor:pointer;transition:background .25s}
  .toggle input:checked+.toggle-track{background:linear-gradient(135deg,var(--gold-dim),var(--gold))}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .25s;pointer-events:none}
  .toggle input:checked~.toggle-thumb{transform:translateX(18px)}
  .freq-options{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .freq-opt{padding:6px 14px;border-radius:999px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--text2);transition:all .2s}
  .freq-opt.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .usage-bar-wrap{height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-top:10px}
  .usage-bar-fill{height:100%;border-radius:999px}
  .plan-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px}
  .plan-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700}
  .plan-price{font-size:13.5px;color:var(--text2)}
  .btn-upgrade{padding:8px 20px;border-radius:var(--r);font-size:13.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s}
  .btn-upgrade:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(201,168,76,.35)}
  .connect-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .connect-status{font-size:13.5px;display:flex;align-items:center;gap:8px}
  .status-dot{width:8px;height:8px;border-radius:50%}
  .btn-connect{padding:7px 16px;border-radius:var(--r);font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;border:1px solid var(--gold-border);background:transparent;color:var(--gold-lt);transition:all .2s}
  .btn-connect:hover{background:rgba(201,168,76,.08)}
  .keyword-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .kw-tag{padding:4px 12px;border-radius:999px;font-size:12.5px;font-weight:600;background:rgba(201,168,76,.1);border:1px solid var(--gold-border);color:var(--gold);display:flex;align-items:center;gap:6px}
  .kw-remove{cursor:pointer;opacity:.6;transition:opacity .2s;font-size:14px;line-height:1}
  .kw-remove:hover{opacity:1}
  .kw-add-row{display:flex;gap:10px;margin-top:10px}
  .kw-input{flex:1;padding:8px 12px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:13.5px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .kw-input:focus{border-color:var(--gold-border)}
  .kw-input::placeholder{color:var(--text3)}
  .btn-add-kw{padding:8px 14px;border-radius:var(--r);font-size:13px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer}
  .locked-msg{font-size:12.5px;color:var(--text3);font-style:italic;margin-top:8px}
  .btn-save{width:100%;padding:13px;border-radius:var(--r);font-size:15px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 3px 12px rgba(201,168,76,.28);margin-top:8px}
  .btn-save:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.4)}
  .btn-save:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .success-msg{padding:10px 14px;background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.3);border-radius:8px;font-size:13.5px;color:var(--pos);margin-bottom:16px}
  .danger-zone{background:rgba(224,96,96,.05);border:1px solid rgba(224,96,96,.2);border-radius:var(--r);padding:20px}
  .danger-zone h4{font-size:14px;font-weight:700;color:var(--neg);margin-bottom:6px}
  .danger-zone p{font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.6}
  .btn-danger{padding:10px 20px;border-radius:var(--r);font-size:13.5px;font-weight:700;font-family:inherit;color:var(--neg);background:transparent;border:1px solid rgba(224,96,96,.3);cursor:pointer;transition:all .2s}
  .btn-danger:hover{background:rgba(224,96,96,.1)}

  /* PLACES SEARCH */
  .places-search-row{display:flex;gap:10px;margin-bottom:12px}
  .places-search-input{flex:1;padding:10px 13px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:14px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .places-search-input:focus{border-color:var(--gold-border)}
  .places-search-input::placeholder{color:var(--text3)}
  .btn-places-search{padding:10px 18px;border-radius:var(--r);font-size:13.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;white-space:nowrap}
  .btn-places-search:disabled{opacity:.6;cursor:not-allowed}
  .places-results{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .places-result{background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:var(--r);padding:12px 14px;cursor:pointer;transition:all .18s}
  .places-result:hover{border-color:var(--gold-border);background:rgba(201,168,76,.04)}
  .places-result-name{font-size:14px;font-weight:700;color:var(--text1);margin-bottom:3px}
  .places-result-meta{font-size:12px;color:var(--gold);margin-bottom:4px}
  .places-result-addr{font-size:12.5px;color:var(--text2);line-height:1.5}
  .places-connected{background:rgba(93,186,122,.06);border:1px solid rgba(93,186,122,.25);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .places-connected-icon{width:34px;height:34px;border-radius:50%;background:rgba(93,186,122,.18);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--pos);flex-shrink:0}
  .places-connected-info{flex:1;min-width:0}
  .places-connected-name{font-size:14px;font-weight:700;color:var(--text1)}
  .places-connected-meta{font-size:12.5px;color:var(--gold);margin-top:2px}
  .places-connected-addr{font-size:12px;color:var(--text2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .btn-disconnect-places{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;background:transparent;border:1px solid rgba(255,255,255,.12);color:var(--text2);cursor:pointer;transition:all .2s;white-space:nowrap}
  .btn-disconnect-places:hover{border-color:rgba(224,96,96,.35);color:var(--neg)}
  .places-err{padding:8px 12px;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.25);border-radius:8px;font-size:12.5px;color:var(--neg);margin-top:8px}
  .places-locked{font-size:12.5px;color:var(--text3);font-style:italic}
  .places-verify-warning{padding:10px 14px;background:rgba(232,184,75,.08);border:1px solid rgba(232,184,75,.28);border-radius:8px;font-size:12.5px;color:#e8b84b;margin-bottom:12px;display:flex;align-items:flex-start;gap:8px;line-height:1.5}
  .places-verify-icon{font-size:14px;flex-shrink:0;margin-top:1px}
  .places-maps-link{display:inline-block;margin-top:6px;font-size:11.5px;color:var(--gold);text-decoration:none;font-weight:600}
  .places-maps-link:hover{text-decoration:underline}
  .places-connected-maps{font-size:11.5px;color:var(--gold);text-decoration:none;font-weight:600;margin-top:6px;display:inline-block}
  .places-connected-maps:hover{text-decoration:underline}
  .places-connected-verify{padding:10px 14px;background:rgba(232,184,75,.06);border:1px solid rgba(232,184,75,.22);border-radius:8px;font-size:12px;color:var(--text2);margin-top:10px;line-height:1.55}

  /* AI STYLE LEARNING (Pro) */
  .style-progress-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .style-progress-label{font-size:13px;color:var(--text2);font-weight:600}
  .style-progress-count{font-size:13px;color:var(--gold);font-weight:700}
  .style-progress-bar{height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-bottom:14px}
  .style-progress-fill{height:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold-lt));border-radius:999px;transition:width .4s}
  .style-learned-banner{padding:10px 14px;background:rgba(93,186,122,.08);border:1px solid rgba(93,186,122,.28);border-radius:8px;font-size:13px;color:var(--pos);margin-bottom:14px}
  .style-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
  @media (max-width:768px){.style-summary{grid-template-columns:1fr}}
  .style-card{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 12px}
  .style-card-label{font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
  .style-card-value{font-size:13px;color:var(--text1);line-height:1.5;font-weight:500}
  .style-card-value.muted{color:var(--text2);font-weight:400}
  .style-phrases{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
  .style-phrase-tag{padding:3px 9px;border-radius:999px;background:rgba(201,168,76,.1);border:1px solid var(--gold-border);font-size:11.5px;color:var(--gold)}
  .btn-reset-style{padding:8px 14px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:inherit;background:transparent;border:1px solid rgba(255,255,255,.12);color:var(--text2);cursor:pointer;transition:all .2s}
  .btn-reset-style:hover{border-color:rgba(224,96,96,.35);color:var(--neg)}
  .style-pre-summary{font-size:12.5px;color:var(--text2);line-height:1.6;margin:0 0 10px;font-style:italic}

  /* AI REPLY PREFERENCES */
  .pref-help{font-size:12.5px;color:var(--text2);line-height:1.55;margin:-4px 0 14px}
  .pref-block{padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05)}
  .pref-block:first-of-type{padding-top:4px}
  .pref-block:last-of-type{border-bottom:none}
  .pref-label{font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--text2);margin-bottom:8px;display:block}
  .pref-sub{font-size:11.5px;color:var(--text3);margin-top:4px;line-height:1.5}
  .pref-slider-row{display:flex;align-items:center;gap:10px;margin-top:6px}
  .pref-slider{flex:1;-webkit-appearance:none;height:4px;background:linear-gradient(90deg,rgba(255,255,255,.1),rgba(201,168,76,.4),rgba(255,255,255,.1));border-radius:999px;outline:none;cursor:pointer}
  .pref-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;box-shadow:0 2px 6px rgba(201,168,76,.4)}
  .pref-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;box-shadow:0 2px 6px rgba(201,168,76,.4)}
  .pref-slider-labels{display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-top:4px;font-weight:600;letter-spacing:.3px}
  .pref-slider-ends{min-width:64px;font-size:11.5px;color:var(--text2);font-weight:600}
  .pref-textarea{width:100%;min-height:64px;padding:10px 13px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:13.5px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s;resize:vertical;line-height:1.5}
  .pref-textarea:focus{border-color:var(--gold-border)}
  .pref-textarea::placeholder{color:var(--text3)}
  .pref-counter{font-size:11px;color:var(--text3);text-align:right;margin-top:4px}
  .pref-counter.over{color:var(--neg)}
  .pref-pro-badge{display:inline-block;margin-left:8px;padding:1px 7px;border-radius:6px;font-size:9.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;background:rgba(201,168,76,.16);border:1px solid var(--gold-border);color:var(--gold-lt);vertical-align:1px}
  .pref-length-row{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
  .pref-length-opt{padding:6px 14px;border-radius:999px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--text2);transition:all .2s}
  .pref-length-opt.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .pref-locked-note{font-size:12px;color:var(--text3);font-style:italic;margin-top:6px}

  /* COMPETITOR TRACKING */
  .comp-row{display:flex;gap:8px;align-items:stretch}
  .comp-row .form-input{flex:1;min-width:0}
  .comp-row-btn{padding:10px 16px;border-radius:var(--r);font-size:13px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;white-space:nowrap}
  .comp-row-btn:disabled{opacity:.55;cursor:not-allowed}
  .comp-row-btn.secondary{background:transparent;border:1px solid var(--gold-border);color:var(--gold-lt)}
  .comp-results{display:flex;flex-direction:column;gap:8px;margin-top:10px}
  .comp-result-card{background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:var(--r);padding:12px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .comp-result-card:hover{border-color:var(--gold-border)}
  .comp-result-body{min-width:0;flex:1}
  .comp-result-title{font-size:14px;font-weight:700;color:var(--text1);margin-bottom:3px}
  .comp-result-meta{font-size:12px;color:var(--gold);margin-bottom:4px}
  .comp-result-addr{font-size:12.5px;color:var(--text2);line-height:1.5}
  .comp-result-maps{display:inline-block;margin-top:6px;font-size:11.5px;color:var(--gold);text-decoration:none;font-weight:600}
  .comp-result-maps:hover{text-decoration:underline}
  .comp-track-btn{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;white-space:nowrap;flex-shrink:0}
  .comp-track-btn:disabled{opacity:.55;cursor:not-allowed;background:rgba(255,255,255,.08);color:var(--text3)}
  .comp-warning{margin-top:10px;padding:8px 12px;background:rgba(232,184,75,.06);border:1px solid rgba(232,184,75,.25);border-radius:8px;font-size:11.5px;color:#e8b84b;line-height:1.5}
  .comp-err{margin-top:10px;padding:8px 12px;background:rgba(224,96,96,.08);border:1px solid rgba(224,96,96,.25);border-radius:8px;font-size:12px;color:var(--neg);line-height:1.5}
  .comp-list{margin-top:18px;display:flex;flex-direction:column;gap:8px}
  .comp-list-empty{font-size:12.5px;color:var(--text3);font-style:italic;padding:14px;text-align:center;background:var(--bg2);border-radius:8px;border:1px dashed rgba(255,255,255,.06)}
  .comp-card{background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:var(--r);padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .comp-card-body{min-width:0;flex:1}
  .comp-card-name{font-size:14px;font-weight:700;color:var(--text1);margin-bottom:3px}
  .comp-card-meta{font-size:12.5px;color:var(--gold);margin-bottom:4px}
  .comp-card-addr{font-size:12px;color:var(--text2);margin-bottom:6px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .comp-card-maps{font-size:11.5px;color:var(--gold);text-decoration:none;font-weight:600}
  .comp-card-maps:hover{text-decoration:underline}
  .comp-card-sync{font-size:10.5px;color:var(--text3);margin-top:6px;letter-spacing:.3px}
  .comp-card-remove{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;background:transparent;border:1px solid rgba(255,255,255,.12);color:var(--text2);cursor:pointer;transition:all .2s;flex-shrink:0}
  .comp-card-remove:hover{border-color:rgba(224,96,96,.35);color:var(--neg)}
  .comp-count-chip{display:inline-block;margin-left:8px;font-size:11.5px;font-weight:600;letter-spacing:.3px;color:var(--gold-lt);background:rgba(201,168,76,.1);border:1px solid var(--gold-border);padding:2px 10px;border-radius:999px;vertical-align:2px}
  @media (max-width:768px){
    .comp-row{flex-direction:column}
    .comp-row-btn{width:100%}
    .comp-card{flex-direction:column;align-items:stretch}
    .comp-card-remove{width:100%;padding:8px}
    .comp-result-card{flex-direction:column;align-items:stretch}
    .comp-track-btn{width:100%;padding:9px}
  }

  /* ════════════ MOBILE (≤ 768px) ════════════ */
  @media (max-width: 768px) {
    .topbar{padding:0 12px;height:54px}
    .logo{font-size:16px}
    .wrap{padding:24px 4vw 60px;max-width:none}
    .page-title{font-size:22px}
    .page-sub{font-size:13px;margin-bottom:26px;line-height:1.55}
    .section{margin-bottom:24px}
    .section-header{font-size:10.5px;letter-spacing:1.2px;margin-bottom:10px}
    .card{padding:16px}
    /* Stack side-by-side form fields */
    .form-row{grid-template-columns:1fr;gap:0}
    .goal-row{grid-template-columns:1fr;gap:8px}
    .goal-sep{display:none}
    /* Connected card: stack info above the disconnect button */
    .places-connected{flex-direction:column;align-items:stretch;gap:10px}
    .btn-disconnect-places{width:100%;padding:8px}
    /* Connect button row wraps */
    .connect-row{flex-direction:column;align-items:stretch;gap:10px}
    .btn-connect{width:100%;text-align:center}
    /* Plan & usage row */
    .plan-row{flex-direction:column;align-items:flex-start;gap:8px}
    .btn-upgrade{width:100%}
    /* Keyword chips wrap nicely (already do, just tighter) */
    .kw-add-row{flex-direction:column;gap:6px}
    .kw-input{width:100%}
    .btn-add-kw{width:100%}
    /* Frequency option pills wrap */
    .freq-options{gap:6px}
    .freq-opt{padding:6px 11px;font-size:12px}
    /* Places search results: stack action */
    .places-search-row{flex-direction:column;gap:8px}
    .btn-places-search{width:100%}
    .places-result{padding:12px}
  }
`;

const RESTAURANT_TYPES = ["Fine Dining","Casual Dining","Fast Casual","Café","Bar","Bistro","Steakhouse","Seafood","Italian","French","Japanese","Other"];
const FREQ_OPTIONS = [{ value:"immediately",label:"Immediately" },{ value:"daily",label:"Daily Digest" },{ value:"weekly",label:"Weekly Only" }];

// Restaurant style options for AI Reply Preferences. The value strings are
// the canonical English keys that match the prompt builder's lookup table.
const REST_STYLE_OPTIONS = [
  { value: "Fine Dining",            en: "Fine Dining",            zh: "Fine Dining（優雅正式）" },
  { value: "Casual Dining",          en: "Casual Dining",          zh: "Casual Dining（輕鬆親切）" },
  { value: "Fast Casual",            en: "Fast Casual",            zh: "Fast Casual（簡短直接）" },
  { value: "Izakaya / Asian Fusion", en: "Izakaya / Asian Fusion", zh: "Izakaya / Asian Fusion（活潑有個性）" },
  { value: "Café & Brunch",          en: "Café & Brunch",          zh: "Café & Brunch（溫暖文青）" },
];

const LENGTH_PREFS = [
  { value: "short",  en: "Short (30–50 words)",   zh: "短（30–50 字）" },
  { value: "medium", en: "Medium (50–80 words)",  zh: "中（50–80 字）" },
  { value: "long",   en: "Long (80–120 words)",   zh: "長（80–120 字）" },
];

const BRAND_VOICE_MAX = 100;

const T = {
  en: {
    pref_section: "AI Reply Preferences",
    pref_help: "These preferences fine-tune all three reply styles (Warm & Personal, Professional & Gracious, Brief & Direct) to match your restaurant's personality. The more you customise, the more the AI sounds like you.",
    pref_restaurant_style: "Restaurant Style",
    pref_restaurant_style_help: "Sets the overall voice the AI uses for your venue.",
    pref_tone_formality: "Tone — Formality",
    pref_tone_warmth: "Tone — Warmth",
    pref_tone_detail: "Tone — Detail",
    pref_formal: "Formal",
    pref_casual: "Casual",
    pref_reserved: "Reserved",
    pref_warm: "Warm",
    pref_brief: "Brief",
    pref_detailed: "Detailed",
    pref_owner_name: "Owner Name (optional)",
    pref_owner_name_ph: "e.g. James",
    pref_owner_name_help: "If set, replies will be signed “— James, Owner”. Leave blank to skip the signature.",
    pref_brand_voice: "Brand Voice (optional, max 100 chars)",
    pref_brand_voice_ph: "e.g. Family-run izakaya known for fresh seafood and warm hospitality.",
    pref_brand_voice_help: "The AI weaves this into the voice — don't quote it back at guests, just let it shape the tone.",
    pref_banned: "Banned Words / Phrases",
    pref_banned_ph: "apologize, inconvenience, strive",
    pref_banned_help: "Comma-separated. The AI will rephrase to avoid these.",
    pref_required: "Signature Phrases (use at least one)",
    pref_required_ph: "Come back soon!, Our door is always open",
    pref_required_help: "Comma-separated. The AI will naturally weave in at least one when fitting.",
    pref_length: "Reply Length Preference",
    pref_length_help: "Overrides the default 50–80 word target.",
    pref_pro_only: "Pro only",
    pref_pro_locked: "Upgrade to Pro to use banned/required word lists and length targeting.",
    // Competitor tracking
    comp_section: "Competitor Tracking",
    comp_pro_only_note: "(Pro)",
    comp_section_help: "Track up to 3 rival restaurants. New reviews and ratings sync daily; comparison views live on your dashboard.",
    comp_locked_msg: "Competitor tracking is a Pro plan feature.",
    comp_upgrade_link: "Upgrade to Pro →",
    comp_max_label: (n, max) => `${n} / ${max} tracked`,
    comp_max_reached: (max) => `Maximum ${max} competitors reached. Remove one to add another.`,
    comp_add_title: "Add a competitor",
    comp_add_help: "Search Google by restaurant name and city — pick the right business from the top 5 matches.",
    comp_name_ph: "Restaurant name",
    comp_city_ph: "City",
    comp_search_btn: "Search",
    comp_searching: "Searching…",
    comp_no_results: "No matches. Try a different name or city.",
    comp_top_matches: "Top matches",
    comp_track_btn: "Track →",
    comp_tracking: "Adding…",
    comp_already_tracked: "Tracking",
    comp_thats_you: "That's your business",
    comp_paste_link_toggle: "Or paste a Google Maps link",
    comp_paste_link_warning: "⚠ Short links (maps.app.goo.gl) are not supported. Please copy the full URL from your browser address bar.",
    comp_paste_full_ph: "https://www.google.com/maps/place/...",
    comp_preview_btn: "Preview",
    comp_resolving: "Resolving…",
    comp_confirm_track: "Confirm & Track",
    comp_cancel: "Cancel",
    comp_invalid_link: "Not a valid Google Maps link",
    comp_resolve_failed: "Couldn't resolve that link",
    comp_pick_correct: "Pick the correct business:",
    comp_preview_title: "Is this the right business?",
    comp_full_url_help: "How to get the full Google Maps URL →",
    comp_view_maps: "View on Google Maps →",
    comp_list_title: "Tracked competitors",
    comp_list_empty: "No competitors yet — add one above.",
    comp_remove_btn: "Remove",
    comp_remove_confirm: "Remove this competitor and its cached reviews?",
    comp_synced_at: (date) => `Last synced ${date}`,
  },
  zh: {
    pref_section: "AI 回覆偏好設定",
    pref_help: "這些偏好會微調全部三種回覆風格（Warm & Personal、Professional & Gracious、Brief & Direct），讓它們更符合你餐廳的個性。設定愈完整，AI 寫出來就愈像你本人。",
    pref_restaurant_style: "餐廳風格",
    pref_restaurant_style_help: "決定 AI 為你的店家使用的整體語氣。",
    pref_tone_formality: "語氣 — 正式度",
    pref_tone_warmth: "語氣 — 溫度",
    pref_tone_detail: "語氣 — 詳細度",
    pref_formal: "正式",
    pref_casual: "輕鬆",
    pref_reserved: "保守",
    pref_warm: "熱情",
    pref_brief: "簡短",
    pref_detailed: "詳細",
    pref_owner_name: "老闆名字（可選）",
    pref_owner_name_ph: "例如：James",
    pref_owner_name_help: "若填寫，回覆會以「— James, Owner」署名。留空則不署名。",
    pref_brand_voice: "品牌特色（可選，最多 100 字）",
    pref_brand_voice_ph: "例如：家族經營的居酒屋，主打新鮮海鮮與熱情款待。",
    pref_brand_voice_help: "AI 會把它融入語氣裡，不會直接引用給顧客，只是用來塑造整體調性。",
    pref_banned: "禁用詞彙",
    pref_banned_ph: "apologize, inconvenience, strive",
    pref_banned_help: "用逗號分隔。AI 會改寫以避開這些字詞。",
    pref_required: "招牌語（至少使用其一）",
    pref_required_ph: "Come back soon!, Our door is always open",
    pref_required_help: "用逗號分隔。AI 會在合適的時機自然帶入其中之一。",
    pref_length: "回覆長度偏好",
    pref_length_help: "覆寫預設的 50–80 字長度。",
    pref_pro_only: "僅限 Pro 方案",
    pref_pro_locked: "升級至 Pro 才能使用禁用/必用詞彙清單與長度控制。",
    // Competitor tracking — zh
    comp_section: "競爭對手追蹤",
    comp_pro_only_note: "（Pro）",
    comp_section_help: "最多追蹤 3 家對手餐廳。新評論與評分每天自動同步，比較分析會顯示在 Dashboard。",
    comp_locked_msg: "競爭對手追蹤是 Pro 方案功能。",
    comp_upgrade_link: "升級至 Pro →",
    comp_max_label: (n, max) => `已追蹤 ${n} / ${max} 家`,
    comp_max_reached: (max) => `已達 ${max} 家上限，請先移除其中一家再新增。`,
    comp_add_title: "新增競爭對手",
    comp_add_help: "輸入餐廳名稱與城市，從前 5 個最相符的商家中選擇。",
    comp_name_ph: "餐廳名稱",
    comp_city_ph: "城市",
    comp_search_btn: "搜尋",
    comp_searching: "搜尋中…",
    comp_no_results: "找不到符合的商家，請換個名稱或城市試試。",
    comp_top_matches: "最相符的商家",
    comp_track_btn: "追蹤 →",
    comp_tracking: "新增中…",
    comp_already_tracked: "已追蹤",
    comp_thats_you: "這是你的店",
    comp_paste_link_toggle: "或貼上完整 Google Maps 連結",
    comp_paste_link_warning: "⚠ 不支援短連結（maps.app.goo.gl）。請從瀏覽器網址列複製完整網址。",
    comp_paste_full_ph: "https://www.google.com/maps/place/...",
    comp_preview_btn: "預覽",
    comp_resolving: "解析中…",
    comp_confirm_track: "確認並追蹤",
    comp_cancel: "取消",
    comp_invalid_link: "不是有效的 Google Maps 連結",
    comp_resolve_failed: "無法解析此連結",
    comp_pick_correct: "請選擇正確的商家：",
    comp_preview_title: "確認是這家商家嗎？",
    comp_full_url_help: "如何取得完整 Google Maps 網址 →",
    comp_view_maps: "在 Google Maps 查看 →",
    comp_list_title: "已追蹤的競爭對手",
    comp_list_empty: "尚未新增競爭對手——從上方新增。",
    comp_remove_btn: "移除",
    comp_remove_confirm: "確定要移除這位競爭對手及其已快取的評論嗎？",
    comp_synced_at: (date) => `最後同步：${date}`,
  },
};

// Settings page has no language toggle of its own — read the choice the
// user set on the dashboard so the two surfaces stay in sync.
function detectLang() {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem("revuly-lang") === "zh" ? "zh" : "en";
  } catch { return "en"; }
}

// Stable Google Maps URL for any place_id — Google redirects this to the canonical listing.
const mapsUrlFor = (placeId) => `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId || "")}`;

// Default AI preferences for a profile that has never opened this section.
const DEFAULT_AI_PREFS = {
  restaurant_style: "",
  tone_formality: 50,
  tone_warmth: 50,
  tone_detail: 50,
  owner_name: "",
  brand_voice: "",
  banned_words: [],
  required_words: [],
  length_preference: "medium",
};

// Normalize comma-separated text input back to an array (trimmed, no empties).
const csvToArray = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [newKw, setNewKw] = useState("");
  const [styleStatus, setStyleStatus] = useState(null); // { samples_have, needs, ai_style_learned, analysis }
  const [styleResetting, setStyleResetting] = useState(false);
  const [placesQuery, setPlacesQuery] = useState("");
  const [placesResults, setPlacesResults] = useState(null); // null = not searched, [] = no matches
  const [placesSearching, setPlacesSearching] = useState(false);
  const [placesSaving, setPlacesSaving] = useState(false);
  const [placesError, setPlacesError] = useState("");
  const [lang, setLang] = useState("en");
  // Competitor tracking (Pro) — list, add via name-search (primary) or
  // full-URL paste (secondary). All add/remove flow lives here now;
  // the dashboard tab is analysis-only.
  const [competitors, setCompetitors] = useState([]);
  const [compNameQuery, setCompNameQuery] = useState("");
  const [compCityQuery, setCompCityQuery] = useState("");
  const [compNameResults, setCompNameResults] = useState(null);
  const [compNameSearching, setCompNameSearching] = useState(false);
  const [compLinkInput, setCompLinkInput] = useState("");
  const [compCandidates, setCompCandidates] = useState(null);
  const [compResolving, setCompResolving] = useState(false);
  const [compAdding, setCompAdding] = useState("");
  const [compError, setCompError] = useState("");
  const supabase = createClient();
  const t = T[lang];

  // Mirror the dashboard's language choice (stored in localStorage on toggle).
  useEffect(() => { setLang(detectLang()); }, []);

  // Load competitors once we know the user is Pro.
  const reloadCompetitors = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("competitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setCompetitors(data || []);
  };
  useEffect(() => {
    if (profile?.plan === "pro") reloadCompetitors();
  }, [profile?.plan]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data || {});
      setLoading(false);
      // For Pro users, pull current AI style learning status.
      if (data?.plan === "pro") {
        try {
          const res = await fetch("/api/ai/learn-style");
          const status = await res.json();
          if (status.ok) setStyleStatus(status);
        } catch {}
      }
    });
  }, []);

  const handleResetStyle = async () => {
    if (!confirm("Reset your AI Style Learning? Your past replies stay on file, but the AI will need to re-learn your voice the next time you Mark Replied.")) return;
    setStyleResetting(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles")
      .update({ ai_style_data: {}, ai_style_learned: false })
      .eq("id", user.id);
    setStyleResetting(false);
    setProfile((p) => ({ ...p, ai_style_data: {}, ai_style_learned: false }));
    setStyleStatus((s) => s ? { ...s, ai_style_learned: false, analysis: null } : s);
  };

  const update = (key, val) => setProfile((p) => ({ ...p, [key]: val }));
  const planKey = profile?.plan || "free_trial";
  const plan = getPlan(planKey);
  const pct = usagePercent(planKey, profile?.used_count || 0);
  const canCustomKw = canUseFeature(planKey, "custom_keywords");

  // Merge any unset preference keys into the existing object so saving
  // never wipes a field the user hasn't touched.
  const currentPrefs = () => ({ ...DEFAULT_AI_PREFS, ...(profile?.ai_preferences || {}) });
  const updatePref = (key, val) => {
    setProfile((p) => ({
      ...p,
      ai_preferences: { ...DEFAULT_AI_PREFS, ...(p?.ai_preferences || {}), [key]: val },
    }));
  };

  const handleSave = async () => {
    setSaving(true); setSuccess("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      restaurant_name: profile.restaurant_name,
      restaurant_type: profile.restaurant_type,
      city: profile.city,
      country: profile.country,
      rating_goal: profile.rating_goal,
      rating_goal_months: profile.rating_goal_months,
      crisis_alerts: profile.crisis_alerts,
      weekly_report: profile.weekly_report,
      custom_keywords: profile.custom_keywords || [],
      ai_preferences: currentPrefs(),
    }).eq("id", user.id);
    if (!error) {
      await supabase.from("profiles").update({
        email_notifications: profile.email_notifications ?? true,
        notification_frequency: profile.notification_frequency || "immediately",
      }).eq("id", user.id);
    }
    setSaving(false);
    if (error) {
      setSuccess("❌ " + error.message);
    } else {
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const addKw = () => {
    if (!newKw.trim() || !canCustomKw) return;
    update("custom_keywords", [...(profile.custom_keywords || []), newKw.trim()]);
    setNewKw("");
  };

  const removeKw = (kw) => update("custom_keywords", (profile.custom_keywords || []).filter((k) => k !== kw));

  const canAutoSync = canUseFeature(planKey, "auto_sync");

  const handlePlacesSearch = async () => {
    setPlacesError("");
    setPlacesResults(null);
    const name = (placesQuery || profile.restaurant_name || "").trim();
    if (!name) { setPlacesError("Enter a restaurant name to search"); return; }
    setPlacesSearching(true);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city: profile.city, country: profile.country }),
      });
      const data = await res.json();
      if (data.error) { setPlacesError(data.error); setPlacesResults([]); return; }
      setPlacesResults(data.results || []);
    } catch (err) {
      setPlacesError(err.message);
      setPlacesResults([]);
    } finally {
      setPlacesSearching(false);
    }
  };

  const handlePlacesSelect = async (result) => {
    setPlacesSaving(true);
    setPlacesError("");
    try {
      // Calls the server route which saves place_id AND pulls the initial 5-review digest.
      const res = await fetch("/api/places/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: result.place_id,
          place_name: result.name,
          place_address: result.address,
          place_rating: result.rating,
          place_user_rating_count: result.user_rating_count,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPlacesError(data.error || "Failed to connect");
        return;
      }
      setProfile((p) => ({
        ...p,
        place_id: result.place_id,
        place_name: result.name,
        place_address: result.address,
        place_rating: result.rating,
        place_user_rating_count: result.user_rating_count,
        place_first_sync_done: true,
      }));
      setPlacesResults(null);
      setPlacesQuery("");
      if (data.new_reviews > 0) {
        setSuccess(`✓ Connected. We've synced ${data.new_reviews} review${data.new_reviews === 1 ? "" : "s"}${data.email_sent ? " and emailed AI replies to you" : ""}.`);
        setTimeout(() => setSuccess(""), 5000);
      } else if (data.alreadySynced) {
        setSuccess("✓ Connected.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setPlacesError(err.message);
    } finally {
      setPlacesSaving(false);
    }
  };

  const handlePlacesDisconnect = async () => {
    setPlacesSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    // Reset place_first_sync_done so a fresh initial digest fires if they reconnect later.
    await supabase.from("profiles").update({
      place_id: null, place_name: null, place_address: null, place_rating: null, place_user_rating_count: null,
      place_first_sync_done: false,
    }).eq("id", user.id);
    setPlacesSaving(false);
    setProfile((p) => ({ ...p, place_id: null, place_name: null, place_address: null, place_rating: null, place_user_rating_count: null, place_first_sync_done: false }));
  };

  // ───────── Competitor tracking handlers (Pro) ─────────
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
        body: JSON.stringify({
          name: q,
          city: (compCityQuery || profile?.city || "").trim(),
          country: profile?.country,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCompError(data.error || "Search failed");
        setCompNameResults([]);
        return;
      }
      setCompNameResults(data.results || []);
    } catch (e) {
      setCompError(e.message);
      setCompNameResults([]);
    } finally {
      setCompNameSearching(false);
    }
  };

  const handleCompResolve = async () => {
    setCompError("");
    setCompCandidates(null);
    const url = compLinkInput.trim();
    if (!url) { setCompError(t.comp_invalid_link); return; }
    if (/^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl|[^/]+\.goo\.gl)\b/i.test(url)) {
      setCompError(t.comp_paste_link_warning);
      return;
    }
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
      await reloadCompetitors();
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

  const handleCompRemove = async (compId) => {
    if (!confirm(t.comp_remove_confirm)) return;
    setCompError("");
    try {
      await fetch("/api/competitors/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: compId }),
      });
      setCompetitors((prev) => prev.filter((c) => c.id !== compId));
    } catch (e) {
      setCompError(e.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.from("reviews").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <div style={{height:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text3)"}}>Loading…</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="settings" />
      <div className="topbar">
        <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly</a>
        <div className="topbar-right">
          <button className="icon-btn" onClick={() => window.location.href = "/dashboard"}>← Dashboard</button>
          <button className="icon-btn" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>↩</button>
        </div>
      </div>

      <div className="wrap">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your restaurant profile, notifications, and subscription.</p>

        {success && <div className="success-msg">{success}</div>}

        {/* RESTAURANT INFO */}
        <div className="section">
          <div className="section-header">Restaurant Information</div>
          <div className="card">
            <div className="form-group"><label>Restaurant Name</label><input className="form-input" value={profile.restaurant_name || ""} onChange={(e) => update("restaurant_name", e.target.value)} /></div>
            <div className="form-group"><label>Restaurant Type</label><select className="form-select" value={profile.restaurant_type || "Fine Dining"} onChange={(e) => update("restaurant_type", e.target.value)}>{RESTAURANT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input className="form-input" value={profile.city || ""} onChange={(e) => update("city", e.target.value)} /></div>
              <div className="form-group"><label>Country</label><input className="form-input" value={profile.country || ""} onChange={(e) => update("country", e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Target Rating</label><select className="form-select" value={profile.rating_goal || "4.8"} onChange={(e) => update("rating_goal", e.target.value)}>{["4.5","4.6","4.7","4.8","4.9","5.0"].map((r) => <option key={r} value={r}>{r} ★</option>)}</select></div>
              <div className="form-group"><label>Target Timeline</label><select className="form-select" value={profile.rating_goal_months || "6"} onChange={(e) => update("rating_goal_months", parseInt(e.target.value))}>{["3","6","9","12"].map((m) => <option key={m} value={m}>{m} months</option>)}</select></div>
            </div>
          </div>
        </div>

        {/* GOOGLE PLACES AUTO-SYNC */}
        <div className="section">
          <div className="section-header">Google Reviews Auto-Sync {!canAutoSync && "(Growth/Pro)"}</div>
          <div className="card">
            {!canAutoSync ? (
              <p className="places-locked">Automatic Google review sync is available on Growth and Pro plans. <a href="#plan-section" style={{color:"var(--gold)",textDecoration:"none"}}>Upgrade →</a></p>
            ) : profile.place_id ? (
              <>
                <div className="places-connected">
                  <div className="places-connected-icon">✓</div>
                  <div className="places-connected-info">
                    <div className="places-connected-name">{profile.place_name || profile.restaurant_name || "Connected"}</div>
                    <div className="places-connected-meta">
                      {profile.place_rating != null ? `${Number(profile.place_rating).toFixed(1)} ★` : "—"}
                      {profile.place_user_rating_count != null && <span style={{color:"var(--text2)"}}> · {profile.place_user_rating_count.toLocaleString()} reviews</span>}
                    </div>
                    {profile.place_address && <div className="places-connected-addr" title={profile.place_address}>{profile.place_address}</div>}
                    <a
                      className="places-connected-maps"
                      href={mapsUrlFor(profile.place_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🗺 View on Google Maps →
                    </a>
                  </div>
                  <button className="btn-disconnect-places" onClick={handlePlacesDisconnect} disabled={placesSaving}>Disconnect</button>
                </div>
                <div className="places-connected-verify">
                  <strong style={{color:"var(--text1)"}}>⚠ Please verify this is your correct business.</strong>{" "}
                  Open the Google Maps link above and confirm the name, address, and rating match your venue.
                  Wrong business connected? Click <strong>Disconnect</strong> and search again.
                </div>
                <p style={{fontSize:12.5,color:"var(--text2)",margin:"12px 0 0",lineHeight:1.6}}>
                  New Google reviews are pulled automatically every day. You'll receive AI reply suggestions by email the moment a new review lands.
                </p>
              </>
            ) : (
              <>
                <p style={{fontSize:13.5,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>
                  Search for your restaurant on Google to enable automatic review sync. We'll fetch new reviews every 6 hours and email AI reply suggestions to you.
                </p>
                <div className="places-search-row">
                  <input
                    className="places-search-input"
                    placeholder={`e.g. ${profile.restaurant_name || "Maison Renaud"}`}
                    value={placesQuery}
                    onChange={(e) => setPlacesQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePlacesSearch(); }}
                  />
                  <button className="btn-places-search" onClick={handlePlacesSearch} disabled={placesSearching}>
                    {placesSearching ? "Searching…" : "Search Google"}
                  </button>
                </div>
                {placesResults && placesResults.length > 0 && (
                  <>
                    <div className="places-verify-warning">
                      <span className="places-verify-icon">⚠</span>
                      <span>
                        <strong>Please verify this is your correct business before connecting.</strong>{" "}
                        Click the <em>View on Google Maps</em> link on each result and confirm the name, address, and photos match your venue.
                      </span>
                    </div>
                    <div className="places-results">
                      {placesResults.map((r) => {
                        const mapsHref = r.maps_uri || mapsUrlFor(r.place_id);
                        return (
                          <div key={r.place_id} className="places-result" onClick={() => !placesSaving && handlePlacesSelect(r)}>
                            <div className="places-result-name">{r.name}</div>
                            <div className="places-result-meta">
                              {r.rating != null ? `${r.rating.toFixed(1)} ★` : "No rating"}
                              {r.user_rating_count != null && <span style={{color:"var(--text2)"}}> · {r.user_rating_count.toLocaleString()} reviews</span>}
                              {r.type && <span style={{color:"var(--text2)"}}> · {r.type}</span>}
                            </div>
                            {r.address && <div className="places-result-addr">{r.address}</div>}
                            <a
                              className="places-maps-link"
                              href={mapsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🗺 View on Google Maps →
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {placesResults && placesResults.length === 0 && !placesError && (
                  <p style={{fontSize:13,color:"var(--text3)",marginTop:8}}>No matches found. Try refining the search.</p>
                )}
                {placesError && <div className="places-err">{placesError}</div>}
              </>
            )}
          </div>
        </div>

        {/* GOOGLE BUSINESS */}
        <div className="section">
          <div className="section-header">Google Business Connection (OAuth)</div>
          <div className="card">
            <div className="connect-row">
              <div className="connect-status">
                <span className="status-dot" style={{background: profile.google_connected ? "var(--pos)" : "var(--text3)"}} />
                {profile.google_connected ? "Connected" : "Not Connected"}
                {profile.google_location_name && <span style={{color:"var(--text2)",fontSize:13}}> — {profile.google_location_name}</span>}
              </div>
              <button className="btn-connect" onClick={() => { const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin; const params = new URLSearchParams({ client_id: "770454655106-5p8d5f78dobbsmjfq329reqmn19pc5rr.apps.googleusercontent.com", redirect_uri: `${appUrl}/api/auth/google/callback`, response_type: "code", scope: "https://www.googleapis.com/auth/business.manage email profile", access_type: "offline", prompt: "consent", state: "business_link" }); window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`; }}>
                {profile.google_connected ? "Reconnect" : "Connect Google Business"}
              </button>
            </div>
          </div>
        </div>

        {/* AI REPLY PREFERENCES — all plans (Pro gets extras) */}
        <div className="section">
          <div className="section-header">{t.pref_section}</div>
          <div className="card">
            <p className="pref-help">{t.pref_help}</p>

            {(() => {
              const prefs = currentPrefs();
              const isPro = planKey === "pro";
              const bvLen = (prefs.brand_voice || "").length;
              return (
                <>
                  {/* Restaurant style */}
                  <div className="pref-block">
                    <label className="pref-label">{t.pref_restaurant_style}</label>
                    <select
                      className="form-select"
                      value={prefs.restaurant_style || ""}
                      onChange={(e) => updatePref("restaurant_style", e.target.value)}
                    >
                      <option value="">—</option>
                      {REST_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt[lang]}</option>
                      ))}
                    </select>
                    <div className="pref-sub">{t.pref_restaurant_style_help}</div>
                  </div>

                  {/* Tone sliders */}
                  <div className="pref-block">
                    <label className="pref-label">{t.pref_tone_formality}</label>
                    <div className="pref-slider-row">
                      <span className="pref-slider-ends" style={{textAlign:"right"}}>{t.pref_formal}</span>
                      <input
                        type="range" min="0" max="100" className="pref-slider"
                        value={prefs.tone_formality}
                        onChange={(e) => updatePref("tone_formality", parseInt(e.target.value, 10))}
                      />
                      <span className="pref-slider-ends">{t.pref_casual}</span>
                    </div>
                  </div>

                  <div className="pref-block">
                    <label className="pref-label">{t.pref_tone_warmth}</label>
                    <div className="pref-slider-row">
                      <span className="pref-slider-ends" style={{textAlign:"right"}}>{t.pref_reserved}</span>
                      <input
                        type="range" min="0" max="100" className="pref-slider"
                        value={prefs.tone_warmth}
                        onChange={(e) => updatePref("tone_warmth", parseInt(e.target.value, 10))}
                      />
                      <span className="pref-slider-ends">{t.pref_warm}</span>
                    </div>
                  </div>

                  <div className="pref-block">
                    <label className="pref-label">{t.pref_tone_detail}</label>
                    <div className="pref-slider-row">
                      <span className="pref-slider-ends" style={{textAlign:"right"}}>{t.pref_brief}</span>
                      <input
                        type="range" min="0" max="100" className="pref-slider"
                        value={prefs.tone_detail}
                        onChange={(e) => updatePref("tone_detail", parseInt(e.target.value, 10))}
                      />
                      <span className="pref-slider-ends">{t.pref_detailed}</span>
                    </div>
                  </div>

                  {/* Owner name */}
                  <div className="pref-block">
                    <label className="pref-label">{t.pref_owner_name}</label>
                    <input
                      className="form-input"
                      placeholder={t.pref_owner_name_ph}
                      value={prefs.owner_name || ""}
                      onChange={(e) => updatePref("owner_name", e.target.value)}
                    />
                    <div className="pref-sub">{t.pref_owner_name_help}</div>
                  </div>

                  {/* Brand voice */}
                  <div className="pref-block">
                    <label className="pref-label">{t.pref_brand_voice}</label>
                    <textarea
                      className="pref-textarea"
                      placeholder={t.pref_brand_voice_ph}
                      value={prefs.brand_voice || ""}
                      onChange={(e) => updatePref("brand_voice", e.target.value.slice(0, BRAND_VOICE_MAX))}
                      maxLength={BRAND_VOICE_MAX}
                    />
                    <div className={`pref-counter${bvLen > BRAND_VOICE_MAX ? " over" : ""}`}>{bvLen} / {BRAND_VOICE_MAX}</div>
                    <div className="pref-sub">{t.pref_brand_voice_help}</div>
                  </div>

                  {/* Banned words (Pro) */}
                  <div className="pref-block">
                    <label className="pref-label">
                      {t.pref_banned}
                      <span className="pref-pro-badge">{t.pref_pro_only}</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder={t.pref_banned_ph}
                      value={(prefs.banned_words || []).join(", ")}
                      onChange={(e) => updatePref("banned_words", csvToArray(e.target.value))}
                      disabled={!isPro}
                    />
                    {isPro ? (
                      <div className="pref-sub">{t.pref_banned_help}</div>
                    ) : (
                      <div className="pref-locked-note">{t.pref_pro_locked}</div>
                    )}
                  </div>

                  {/* Required words (Pro) */}
                  <div className="pref-block">
                    <label className="pref-label">
                      {t.pref_required}
                      <span className="pref-pro-badge">{t.pref_pro_only}</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder={t.pref_required_ph}
                      value={(prefs.required_words || []).join(", ")}
                      onChange={(e) => updatePref("required_words", csvToArray(e.target.value))}
                      disabled={!isPro}
                    />
                    {isPro && <div className="pref-sub">{t.pref_required_help}</div>}
                  </div>

                  {/* Length preference (Pro) */}
                  <div className="pref-block">
                    <label className="pref-label">
                      {t.pref_length}
                      <span className="pref-pro-badge">{t.pref_pro_only}</span>
                    </label>
                    <div className="pref-length-row">
                      {LENGTH_PREFS.map((opt) => (
                        <button
                          key={opt.value}
                          className={`pref-length-opt${prefs.length_preference === opt.value ? " active" : ""}`}
                          onClick={() => isPro && updatePref("length_preference", opt.value)}
                          disabled={!isPro}
                        >
                          {opt[lang]}
                        </button>
                      ))}
                    </div>
                    {isPro && <div className="pref-sub">{t.pref_length_help}</div>}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* CUSTOM KEYWORDS */}
        <div className="section">
          <div className="section-header">Custom Keywords {!canCustomKw && "(Growth/Pro)"}</div>
          <div className="card">
            {canCustomKw ? (
              <>
                <p style={{fontSize:13.5,color:"var(--text2)",marginBottom:12}}>Add keywords specific to your cuisine or brand to track in Keyword Intelligence.</p>
                <div className="keyword-tags">
                  {(profile.custom_keywords || []).map((kw) => (
                    <span key={kw} className="kw-tag">{kw}<span className="kw-remove" onClick={() => removeKw(kw)}>×</span></span>
                  ))}
                </div>
                <div className="kw-add-row">
                  <input className="kw-input" placeholder="e.g. truffle, wagyu, tasting menu…" value={newKw} onChange={(e) => setNewKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKw()} />
                  <button className="btn-add-kw" onClick={addKw}>Add</button>
                </div>
              </>
            ) : (
              <p className="locked-msg">Custom keyword tracking is available on Growth and Pro plans. <a href="#plan-section" style={{color:"var(--gold)",textDecoration:"none"}}>Upgrade →</a></p>
            )}
          </div>
        </div>

        {/* COMPETITOR TRACKING — Pro only */}
        <div className="section" id="comp-section">
          <div className="section-header">
            {t.comp_section} {planKey !== "pro" && t.comp_pro_only_note}
            {planKey === "pro" && (
              <span className="comp-count-chip">{t.comp_max_label(competitors.length, 3)}</span>
            )}
          </div>
          <div className="card">
            {planKey !== "pro" ? (
              <p className="places-locked">
                {t.comp_locked_msg}{" "}
                <a href="#plan-section" style={{color:"var(--gold)",textDecoration:"none"}}>{t.comp_upgrade_link}</a>
              </p>
            ) : (
              <>
                <p style={{fontSize:13.5,color:"var(--text2)",marginBottom:14,lineHeight:1.6}}>
                  {t.comp_section_help}
                </p>

                {/* Add competitor (only if under cap) */}
                {competitors.length < 3 ? (
                  <>
                    <label className="pref-label">{t.comp_add_title}</label>
                    <p style={{fontSize:12,color:"var(--text3)",margin:"-4px 0 10px",lineHeight:1.5}}>{t.comp_add_help}</p>

                    {/* PRIMARY: name + city search */}
                    <div className="comp-row">
                      <input
                        className="form-input"
                        placeholder={t.comp_name_ph}
                        value={compNameQuery}
                        onChange={(e) => setCompNameQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCompNameSearch(); }}
                        style={{flex:2}}
                      />
                      <input
                        className="form-input"
                        placeholder={t.comp_city_ph}
                        value={compCityQuery || profile?.city || ""}
                        onChange={(e) => setCompCityQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCompNameSearch(); }}
                        style={{flex:1,minWidth:100}}
                      />
                      <button
                        className="comp-row-btn"
                        onClick={handleCompNameSearch}
                        disabled={compNameSearching || !compNameQuery.trim()}
                      >
                        {compNameSearching ? t.comp_searching : t.comp_search_btn}
                      </button>
                    </div>

                    {compNameResults && compNameResults.length > 0 && (
                      <>
                        <div style={{fontSize:12.5,fontWeight:700,color:"var(--gold-lt)",letterSpacing:".3px",marginTop:14,marginBottom:8}}>
                          {t.comp_top_matches}
                        </div>
                        <div className="comp-results">
                          {compNameResults.map((r) => {
                            const alreadyTracked = competitors.some((c) => c.place_id === r.place_id);
                            const isOwn = profile?.place_id === r.place_id;
                            const isAdding = compAdding === r.place_id;
                            return (
                              <div key={r.place_id} className="comp-result-card">
                                <div className="comp-result-body">
                                  <div className="comp-result-title">{r.name}</div>
                                  <div className="comp-result-meta">
                                    {r.rating != null ? `${r.rating.toFixed(1)} ★` : "—"}
                                    {r.user_rating_count != null && (
                                      <span style={{color:"var(--text2)"}}> · {r.user_rating_count.toLocaleString()} reviews</span>
                                    )}
                                    {r.type && <span style={{color:"var(--text2)"}}> · {r.type}</span>}
                                  </div>
                                  {r.address && <div className="comp-result-addr">{r.address}</div>}
                                  <a
                                    className="comp-result-maps"
                                    href={r.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >🗺 {t.comp_view_maps}</a>
                                </div>
                                <button
                                  className="comp-track-btn"
                                  onClick={() => handleCompPick(r)}
                                  disabled={!!compAdding || alreadyTracked || isOwn}
                                  title={isOwn ? t.comp_thats_you : alreadyTracked ? t.comp_already_tracked : ""}
                                >
                                  {isAdding ? t.comp_tracking : alreadyTracked ? t.comp_already_tracked : isOwn ? "—" : t.comp_track_btn}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {compNameResults && compNameResults.length === 0 && !compError && (
                      <p style={{fontSize:12,color:"var(--text3)",marginTop:10}}>{t.comp_no_results}</p>
                    )}

                    {/* SECONDARY (collapsed): full-URL paste */}
                    <details style={{marginTop:18,paddingTop:14,borderTop:"1px dashed rgba(255,255,255,.08)"}}>
                      <summary style={{fontSize:12.5,color:"var(--gold-lt)",cursor:"pointer",fontWeight:700,letterSpacing:".3px",padding:"4px 0"}}>
                        {t.comp_paste_link_toggle}
                      </summary>
                      <div className="comp-warning">{t.comp_paste_link_warning}</div>
                      <div className="comp-row" style={{marginTop:10}}>
                        <input
                          className="form-input"
                          placeholder={t.comp_paste_full_ph}
                          value={compLinkInput}
                          onChange={(e) => setCompLinkInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleCompResolve(); }}
                        />
                        <button
                          className="comp-row-btn secondary"
                          onClick={handleCompResolve}
                          disabled={compResolving || !compLinkInput.trim()}
                        >
                          {compResolving ? t.comp_resolving : t.comp_preview_btn}
                        </button>
                      </div>
                      <a
                        href="/help#competitor-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{display:"inline-block",marginTop:8,fontSize:11.5,color:"var(--gold)",textDecoration:"none",fontWeight:600}}
                      >
                        {t.comp_full_url_help}
                      </a>

                      {compCandidates && compCandidates.length > 0 && (
                        <>
                          <div style={{fontSize:12.5,fontWeight:700,color:"var(--gold-lt)",letterSpacing:".3px",marginTop:14,marginBottom:8}}>
                            {compCandidates.length === 1 ? t.comp_preview_title : t.comp_pick_correct}
                          </div>
                          <div className="comp-results">
                            {compCandidates.map((r) => {
                              const alreadyTracked = competitors.some((c) => c.place_id === r.place_id);
                              const isOwn = profile?.place_id === r.place_id;
                              const isAdding = compAdding === r.place_id;
                              return (
                                <div key={r.place_id} className="comp-result-card">
                                  <div className="comp-result-body">
                                    <div className="comp-result-title">{r.name}</div>
                                    <div className="comp-result-meta">
                                      {r.rating != null ? `${r.rating.toFixed(1)} ★` : "—"}
                                      {r.user_rating_count != null && (
                                        <span style={{color:"var(--text2)"}}> · {r.user_rating_count.toLocaleString()} reviews</span>
                                      )}
                                    </div>
                                    {r.address && <div className="comp-result-addr">{r.address}</div>}
                                    <a
                                      className="comp-result-maps"
                                      href={r.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >🗺 {t.comp_view_maps}</a>
                                  </div>
                                  <button
                                    className="comp-track-btn"
                                    onClick={() => handleCompPick(r)}
                                    disabled={!!compAdding || alreadyTracked || isOwn}
                                  >
                                    {isAdding ? t.comp_tracking : alreadyTracked ? t.comp_already_tracked : isOwn ? "—" : t.comp_confirm_track}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            className="comp-card-remove"
                            style={{marginTop:10}}
                            onClick={() => { setCompCandidates(null); setCompError(""); }}
                          >
                            {t.comp_cancel}
                          </button>
                        </>
                      )}
                    </details>

                    {compError && <div className="comp-err">{compError}</div>}
                  </>
                ) : (
                  <div className="comp-warning" style={{margin:"0 0 14px"}}>
                    {t.comp_max_reached(3)}
                  </div>
                )}

                {/* Tracked list */}
                <div style={{marginTop:18}}>
                  <label className="pref-label">{t.comp_list_title}</label>
                  {competitors.length === 0 ? (
                    <div className="comp-list-empty">{t.comp_list_empty}</div>
                  ) : (
                    <div className="comp-list">
                      {competitors.map((c) => (
                        <div key={c.id} className="comp-card">
                          <div className="comp-card-body">
                            <div className="comp-card-name">{c.name || "Competitor"}</div>
                            <div className="comp-card-meta">
                              {typeof c.rating === "number" ? `${c.rating.toFixed(1)} ★` : "—"}
                              {c.user_rating_count != null && (
                                <span style={{color:"var(--text2)"}}> · {c.user_rating_count.toLocaleString()} reviews</span>
                              )}
                            </div>
                            {c.address && <div className="comp-card-addr" title={c.address}>{c.address}</div>}
                            <a
                              className="comp-card-maps"
                              href={c.maps_uri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(c.place_id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >🗺 {t.comp_view_maps}</a>
                            {c.last_synced_at && (
                              <div className="comp-card-sync">
                                {t.comp_synced_at(new Date(c.last_synced_at).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US"))}
                              </div>
                            )}
                          </div>
                          <button className="comp-card-remove" onClick={() => handleCompRemove(c.id)}>
                            {t.comp_remove_btn}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI STYLE LEARNING — Pro only */}
        {planKey === "pro" && (
          <div className="section">
            <div className="section-header">AI Style Learning (Pro)</div>
            <div className="card">
              {(() => {
                const have = styleStatus?.samples_have ?? 0;
                const needs = styleStatus?.needs ?? 5;
                const learned = !!profile.ai_style_learned;
                const analysis = profile.ai_style_data && profile.ai_style_data.tone
                  ? profile.ai_style_data
                  : styleStatus?.analysis;
                const pct = Math.min(100, Math.round((have / needs) * 100));

                return (
                  <>
                    <p style={{fontSize:13,color:"var(--text2)",marginBottom:14,lineHeight:1.6}}>
                      As you use <strong style={{color:"var(--text1)"}}>Mark Replied</strong> on the dashboard and paste your actual posted reply, Revuly learns the voice you use with guests — your tone, openers, closers, and signature phrases. Once 5 replies are on file, the AI's <strong style={{color:"var(--gold-lt)"}}>Your Style</strong> tab generates new replies in that exact voice.
                    </p>

                    <div className="style-progress-row">
                      <span className="style-progress-label">Replies analyzed</span>
                      <span className="style-progress-count">{have} / {needs}</span>
                    </div>
                    <div className="style-progress-bar">
                      <div className="style-progress-fill" style={{width:`${pct}%`}} />
                    </div>

                    {learned && (
                      <div className="style-learned-banner">
                        ✓ Your style has been learned ({analysis?._samples ?? have} {analysis?._samples === 1 ? "reply" : "replies"} analysed{analysis?._learned_at ? ` · ${new Date(analysis._learned_at).toLocaleDateString()}` : ""}).
                      </div>
                    )}

                    {analysis && analysis.tone && (
                      <>
                        {analysis.summary && (
                          <p className="style-pre-summary">"{analysis.summary}"</p>
                        )}
                        <div className="style-summary">
                          <div className="style-card">
                            <div className="style-card-label">Tone</div>
                            <div className="style-card-value">{analysis.tone}</div>
                          </div>
                          <div className="style-card">
                            <div className="style-card-label">Avg length</div>
                            <div className="style-card-value">{analysis.avg_length_words ?? "?"} words</div>
                          </div>
                          <div className="style-card">
                            <div className="style-card-label">Opener</div>
                            <div className="style-card-value muted">{analysis.common_opener || "—"}</div>
                          </div>
                          <div className="style-card">
                            <div className="style-card-label">Closer</div>
                            <div className="style-card-value muted">{analysis.common_closer || "—"}</div>
                          </div>
                          <div className="style-card">
                            <div className="style-card-label">Addresses by name</div>
                            <div className="style-card-value">{analysis.addresses_by_name ? "Yes" : "No"}</div>
                          </div>
                          <div className="style-card">
                            <div className="style-card-label">Language</div>
                            <div className="style-card-value">{analysis.language || "—"}</div>
                          </div>
                        </div>
                        {Array.isArray(analysis.signature_phrases) && analysis.signature_phrases.length > 0 && (
                          <>
                            <div className="style-card-label" style={{marginBottom:6}}>Signature phrases</div>
                            <div className="style-phrases">
                              {analysis.signature_phrases.map((p, i) => (
                                <span key={i} className="style-phrase-tag">{p}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {learned && (
                      <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
                        <button className="btn-reset-style" onClick={handleResetStyle} disabled={styleResetting}>
                          {styleResetting ? "Resetting…" : "Reset Style"}
                        </button>
                      </div>
                    )}

                    {!learned && have < needs && (
                      <p style={{fontSize:12,color:"var(--text3)",marginTop:8}}>
                        {needs - have} more {needs - have === 1 ? "reply" : "replies"} needed before the AI can start mirroring your voice.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        <div className="section">
          <div className="section-header">Email Notifications</div>
          <div className="card">
            <div className="toggle-item">
              <div className="toggle-info"><h4>Email Notifications</h4><p>Receive email alerts with AI reply suggestions for new reviews</p></div>
              <label className="toggle"><input type="checkbox" checked={!!profile.email_notifications} onChange={(e) => update("email_notifications", e.target.checked)} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            {profile.email_notifications && (
              <div style={{padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <label>Notification Frequency</label>
                <div className="freq-options">
                  {FREQ_OPTIONS.map((o) => <button key={o.value} className={`freq-opt${profile.notification_frequency===o.value?" active":""}`} onClick={() => update("notification_frequency", o.value)}>{o.label}</button>)}
                </div>
              </div>
            )}
            <div className="toggle-item">
              <div className="toggle-info"><h4>🚨 Crisis Alerts</h4><p>Immediate alert when 3+ low-rating reviews appear in 24 hours</p></div>
              <label className="toggle"><input type="checkbox" checked={!!profile.crisis_alerts} onChange={(e) => update("crisis_alerts", e.target.checked)} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            <div className="toggle-item">
              <div className="toggle-info"><h4>Weekly Report {!canUseFeature(planKey,"weekly_report") && <span style={{fontSize:11,color:"var(--text3)",fontWeight:400}}>(Growth/Pro)</span>}</h4><p>Weekly email summarising your review performance and top keywords</p></div>
              <label className="toggle"><input type="checkbox" checked={!!profile.weekly_report} disabled={!canUseFeature(planKey,"weekly_report")} onChange={(e) => update("weekly_report", e.target.checked)} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
          </div>
        </div>

        {/* PLAN & USAGE */}
        <div className="section" id="plan-section">
          <div className="section-header">Plan & Usage</div>
          <div className="card">
            <div className="plan-row">
              <div><div className="plan-name">{plan.name}</div><div className="plan-price">{plan.price === 0 ? "Free Trial" : `$${plan.price}/month`}</div></div>
              {planKey !== "pro" && <button className="btn-upgrade" onClick={() => window.location.href = "/#pricing"}>Upgrade Plan</button>}
            </div>
            <div style={{fontSize:13,color:"var(--text2)",marginBottom:6}}>AI Replies: {profile.used_count || 0} / {plan.reply_limit === Infinity ? "Unlimited" : plan.reply_limit} used this period</div>
            {plan.reply_limit !== Infinity && (
              <div className="usage-bar-wrap">
                <div className="usage-bar-fill" style={{width:`${pct}%`,background:pct>=80?(pct>=100?"var(--neg)":"var(--neu-fg)"):"linear-gradient(90deg,var(--gold-dim),var(--gold-lt))"}} />
              </div>
            )}
          </div>
        </div>

        <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</button>

        {/* DANGER ZONE */}
        <div className="section" style={{marginTop:40}}>
          <div className="section-header" style={{color:"var(--neg)"}}>Danger Zone</div>
          <div className="danger-zone">
            <h4>Delete Account</h4>
            <p>Permanently delete your Revuly account, all restaurant data, reviews, and Google connection. This action cannot be undone and all data will be removed within 30 days.</p>
            <button className="btn-danger" onClick={handleDeleteAccount}>Delete My Account</button>
          </div>
        </div>
      </div>
    </>
  );
}
