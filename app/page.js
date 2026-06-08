"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0b;--bg2:#111114;--bg3:#17171c;--surface:#1c1c22;--surface2:#222229;
    --gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;
    --gold-glow:rgba(201,168,76,0.18);--gold-border:rgba(201,168,76,0.22);
    --text1:#f0ede6;--text2:#a09888;--text3:#5a5550;
    --pos:#5dba7a;--neg:#e06060;--r:12px;
  }
  html{scroll-behavior:smooth}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;z-index:0;opacity:.025;pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px}

  /* NAV */
  .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 6vw;height:68px;background:rgba(10,10,11,.82);backdrop-filter:blur(18px);border-bottom:1px solid rgba(201,168,76,.1);transition:background .3s}
  .nav.scrolled{background:rgba(10,10,11,.97);border-bottom-color:rgba(201,168,76,.18)}
  .logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold-lt);text-decoration:none;display:flex;align-items:center;gap:9px}
  .logo-icon{width:30px;height:30px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .nav-links{display:flex;align-items:center;gap:32px;list-style:none}
  .nav-links a{font-size:13.5px;font-weight:500;color:var(--text2);text-decoration:none;transition:color .2s}
  .nav-links a:hover{color:var(--text1)}
  .nav-ctas{display:flex;align-items:center;gap:10px}
  .btn-ghost{padding:8px 18px;border-radius:8px;font-size:13.5px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid var(--gold-border);cursor:pointer;transition:all .2s}
  .btn-ghost:hover{color:var(--gold-lt);border-color:var(--gold)}
  .btn-gold{padding:8px 20px;border-radius:8px;font-size:13.5px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 2px 12px rgba(201,168,76,.3)}
  .btn-gold:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(201,168,76,.45)}
  .lang-toggle{height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--gold-border);background:transparent;color:var(--text2);font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s;flex-shrink:0}
  .lang-toggle:hover{border-color:var(--gold);color:var(--gold-lt)}

  /* HERO */
  .hero{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 6vw 80px;overflow:hidden}
  .hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(201,168,76,.12),transparent 65%),radial-gradient(ellipse 50% 50% at 80% 80%,rgba(201,168,76,.05),transparent 60%)}
  .hero-grid{position:absolute;inset:0;z-index:0;opacity:.04;background-image:linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)}
  .hero-inner{position:relative;z-index:1;max-width:860px}
  .hero-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:999px;border:1px solid var(--gold-border);background:rgba(201,168,76,.07);font-size:12px;font-weight:600;color:var(--gold);letter-spacing:.8px;text-transform:uppercase;margin-bottom:28px}
  .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 6px var(--gold);animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
  .hero h1{font-family:'Playfair Display',serif;font-size:clamp(36px,6.5vw,74px);font-weight:900;line-height:1.1;letter-spacing:-.5px;margin-bottom:24px}
  .accent{background:linear-gradient(135deg,var(--gold-lt),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .hero-sub{font-size:clamp(16px,2vw,19px);color:var(--text2);font-weight:400;line-height:1.65;max-width:600px;margin:0 auto 40px}
  .hero-ctas{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
  .btn-primary{padding:14px 34px;border-radius:10px;font-size:15px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px rgba(201,168,76,.38)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(201,168,76,.5)}
  .btn-secondary{padding:14px 34px;border-radius:10px;font-size:15px;font-weight:600;font-family:inherit;color:var(--text1);background:transparent;border:1px solid rgba(240,237,230,.15);cursor:pointer;transition:all .25s}
  .btn-secondary:hover{border-color:var(--gold-border);color:var(--gold-lt);background:var(--gold-glow)}
  /* Trust strip — between CTAs and the dashboard mockup */
  .trust-strip{display:inline-flex;align-items:center;gap:8px;margin:36px auto 0;padding:6px 16px;border-radius:999px;background:rgba(93,186,122,.07);border:1px solid rgba(93,186,122,.22);font-size:12px;font-weight:600;color:var(--pos);letter-spacing:.4px}
  .trust-dot{width:6px;height:6px;border-radius:50%;background:var(--pos);box-shadow:0 0 6px var(--pos)}

  /* Hero dashboard mockup — three-pane mini dashboard rendered in pure CSS */
  .hero-mock{margin:46px auto 0;max-width:920px;background:linear-gradient(180deg,#17171c,#111114);border:1px solid rgba(255,255,255,.08);border-radius:14px;box-shadow:0 40px 100px -20px rgba(0,0,0,.6),0 0 0 1px rgba(201,168,76,.05);overflow:hidden;text-align:left}
  .hero-mock-chrome{display:flex;align-items:center;gap:6px;padding:10px 14px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05)}
  .hero-mock-dot{width:9px;height:9px;border-radius:50%}
  .hero-mock-dot.r{background:#e06060}.hero-mock-dot.y{background:#e8b84b}.hero-mock-dot.g{background:#5dba7a}
  .hero-mock-url{flex:1;margin-left:10px;padding:4px 10px;background:rgba(255,255,255,.04);border-radius:6px;font-size:10.5px;color:var(--text3);font-family:monospace}
  .hero-mock-body{display:grid;grid-template-columns:170px 1fr 240px;gap:0;min-height:280px}
  .hero-mock-side{padding:16px 14px;border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;gap:10px}
  .hero-mock-stat{padding:10px 12px;background:#0a0a0b;border:1px solid rgba(255,255,255,.06);border-radius:8px}
  .hero-mock-stat-n{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold-lt);line-height:1}
  .hero-mock-stat-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin-top:4px}
  .hero-mock-mid{padding:14px;display:flex;flex-direction:column;gap:8px;border-right:1px solid rgba(255,255,255,.05);overflow:hidden}
  .hero-mock-rev{padding:10px 12px;background:#0a0a0b;border:1px solid rgba(255,255,255,.05);border-radius:8px}
  .hero-mock-rev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px}
  .hero-mock-rev-name{font-size:12px;font-weight:700;color:var(--text1)}
  .hero-mock-rev-stars{color:var(--gold);letter-spacing:1.5px;font-size:11px}
  .hero-mock-rev-text{font-size:11.5px;color:var(--text2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .hero-mock-right{padding:14px;display:flex;flex-direction:column;gap:10px}
  .hero-mock-tab-row{display:flex;gap:5px}
  .hero-mock-tab{flex:1;padding:5px 4px;border-radius:6px;font-size:10.5px;font-weight:600;text-align:center;background:transparent;border:1px solid rgba(255,255,255,.08);color:var(--text2)}
  .hero-mock-tab.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}
  .hero-mock-reply{padding:10px 12px;background:#0a0a0b;border:1px solid rgba(201,168,76,.2);border-radius:8px;font-size:11.5px;color:var(--text1);line-height:1.6;flex:1}
  .hero-mock-copy{padding:6px 12px;border-radius:6px;background:transparent;border:1px solid var(--gold-border);color:var(--gold-lt);font-size:10.5px;font-weight:700;font-family:inherit;cursor:default;align-self:flex-end}
  @media (max-width:860px){
    .hero-mock{margin-top:36px}
    .hero-mock-body{grid-template-columns:1fr;min-height:auto}
    .hero-mock-side{flex-direction:row;border-right:none;border-bottom:1px solid rgba(255,255,255,.05);padding:12px;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch}
    .hero-mock-side::-webkit-scrollbar{display:none}
    .hero-mock-stat{flex:0 0 auto;min-width:96px;padding:8px 10px}
    .hero-mock-mid{border-right:none;border-bottom:1px solid rgba(255,255,255,.05);padding:12px;gap:6px}
    .hero-mock-rev-text{-webkit-line-clamp:1}
    .hero-mock-right{padding:12px}
    .trust-strip{font-size:11.5px;padding:5px 14px}
  }
  /* iPhone SE-class (≤ 380px): one more pass on type sizes */
  @media (max-width:380px){
    .hero-mock-stat{min-width:84px}
    .hero-mock-stat-n{font-size:18px}
    .hero-mock-rev-name{font-size:11.5px}
    .hero-mock-rev-text{font-size:11px}
    .hero-mock-reply{font-size:11px;padding:9px 11px}
    .hero-mock-url{font-size:9.5px}
  }

  .hero-stats{display:flex;justify-content:center;gap:48px;margin-top:64px;padding-top:48px;border-top:1px solid rgba(255,255,255,.06);flex-wrap:wrap}
  .stat-n{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--gold-lt)}
  .stat-l{font-size:13px;color:var(--text2);margin-top:2px}

  /* SECTIONS */
  section{position:relative;z-index:1}
  .section-wrap{max-width:1120px;margin:0 auto;padding:100px 6vw}
  .section-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:14px}
  .section-title{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,44px);font-weight:700;line-height:1.2;margin-bottom:16px}
  .section-sub{font-size:16px;color:var(--text2);line-height:1.65;max-width:540px}
  .section-header{margin-bottom:56px}
  .center{text-align:center}
  .center .section-sub{margin:0 auto}

  /* FEATURES */
  .feat-bg{background:var(--bg2)}
  .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  @media(max-width:900px){.feat-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.feat-grid{grid-template-columns:1fr}}
  .feat-card{background:var(--surface);border:1px solid rgba(255,255,255,.05);border-radius:var(--r);padding:28px;transition:all .28s;cursor:default}
  .feat-card:hover{border-color:var(--gold-border);background:var(--surface2);transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.35)}
  .feat-icon{width:46px;height:46px;border-radius:10px;background:linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.06));border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px}
  .feat-card h3{font-size:15.5px;font-weight:700;margin-bottom:10px}
  .feat-card p{font-size:13.5px;color:var(--text2);line-height:1.65}
  .feat-tag{display:inline-block;margin-top:14px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.4px;background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.2)}
  /* Learn-more reveal: collapsed by default, animates open on click. */
  .feat-more{max-height:0;overflow:hidden;font-size:13px;color:var(--text2);line-height:1.7;transition:max-height .4s ease,margin-top .35s ease}
  .feat-more.open{max-height:280px;margin-top:12px}
  .feat-more-btn{margin-top:10px;padding:0;background:transparent;border:none;color:var(--gold);font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:.3px}
  .feat-more-btn:hover{color:var(--gold-lt)}

  /* HOW IT WORKS */
  .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;position:relative}
  .how-grid::before{content:'';position:absolute;top:32px;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-border),transparent)}
  @media(max-width:700px){.how-grid{grid-template-columns:1fr}}
  @media(max-width:700px){.how-grid::before{display:none}}
  .how-step{text-align:center;padding:32px 20px;background:var(--surface);border:1px solid rgba(255,255,255,.05);border-radius:var(--r);transition:border-color .25s}
  .how-step:hover{border-color:var(--gold-border)}
  .how-num{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--gold));display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#000;margin:0 auto 20px}
  .how-step h3{font-size:16px;font-weight:700;margin-bottom:10px}
  .how-step p{font-size:13.5px;color:var(--text2);line-height:1.65}

  /* PRICING */
  .price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}
  @media(max-width:1000px){.price-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.price-grid{grid-template-columns:1fr;max-width:420px;margin:0 auto}}
  .price-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:28px;transition:all .28s;position:relative;overflow:hidden}
  .price-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
  .price-card.popular{border-color:var(--gold);background:linear-gradient(160deg,rgba(201,168,76,.07),var(--surface) 60%);box-shadow:0 0 40px rgba(201,168,76,.12)}
  .popular-badge{position:absolute;top:16px;right:16px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000}
  .price-name{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
  .price-row{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
  .price-cur{font-size:18px;font-weight:600}
  .price-amt{font-family:'Playfair Display',serif;font-size:44px;font-weight:900;line-height:1}
  .price-custom{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin:8px 0 4px}
  .price-period{font-size:13px;color:var(--text2)}
  .price-desc{font-size:13px;color:var(--text2);margin:12px 0 20px;line-height:1.55}
  .price-div{height:1px;background:rgba(255,255,255,.07);margin-bottom:18px}
  .price-feats{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
  .price-feats li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text2);line-height:1.45}
  .chk{width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:1px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--gold)}
  .btn-price{width:100%;padding:11px;border-radius:9px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .22s;letter-spacing:.3px}
  .btn-price-outline{background:transparent;color:var(--text1);border:1px solid rgba(255,255,255,.14)}
  .btn-price-outline:hover{border-color:var(--gold-border);color:var(--gold-lt)}
  .btn-price-fill{background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000;border:none;box-shadow:0 3px 14px rgba(201,168,76,.32)}
  .btn-price-fill:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.45)}

  /* TESTIMONIALS */
  .testi-bg{background:var(--bg2)}
  .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  @media(max-width:860px){.testi-grid{grid-template-columns:1fr}}
  .testi-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:30px;display:flex;flex-direction:column;gap:18px;transition:all .28s}
  .testi-card:hover{border-color:var(--gold-border);transform:translateY(-3px);box-shadow:0 10px 36px rgba(0,0,0,.35)}
  .testi-stars{color:var(--gold);font-size:14px;letter-spacing:2px}
  .testi-quote{font-size:14.5px;line-height:1.75;color:var(--text2);font-style:italic;flex:1}
  .testi-author{display:flex;align-items:center;gap:12px}
  .testi-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--surface2));border:2px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--gold-lt);flex-shrink:0}
  .testi-name{font-size:14px;font-weight:700}
  .testi-role{font-size:12px;color:var(--text2);margin-top:1px}
  .testi-rest{font-size:12px;color:var(--gold);font-weight:600;margin-top:1px}

  /* FAQ */
  .faq-wrap{max-width:720px;margin:0 auto}
  .faq-item{border-bottom:1px solid rgba(255,255,255,.07)}
  .faq-item:first-child{border-top:1px solid rgba(255,255,255,.07)}
  .faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;padding:22px 0;background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;font-size:15px;font-weight:600;color:var(--text1);transition:color .2s;gap:16px}
  .faq-q:hover{color:var(--gold-lt)}
  .faq-icon{width:26px;height:26px;flex-shrink:0;border-radius:50%;border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--gold);transition:transform .25s}
  .faq-icon.open{transform:rotate(45deg)}
  .faq-a{max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(0.4,0,0.2,1),padding .35s;font-size:14.5px;color:var(--text2);line-height:1.75}
  .faq-a.open{max-height:300px;padding-bottom:20px}

  /* CTA BANNER */
  .cta-banner{margin:0 6vw 80px;background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04));border:1px solid var(--gold-border);border-radius:20px;padding:60px 6vw;text-align:center;position:relative;overflow:hidden}
  .cta-banner::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.15),transparent 70%);pointer-events:none}
  .cta-banner h2{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,40px);font-weight:700;margin-bottom:14px}
  .cta-banner p{font-size:16px;color:var(--text2);margin-bottom:32px}
  .cta-btns{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}

  /* FOOTER */
  .footer{border-top:1px solid rgba(255,255,255,.06);padding:60px 6vw 32px}
  .footer-top{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
  @media(max-width:860px){.footer-top{grid-template-columns:1fr 1fr}}
  .footer-brand p{font-size:13.5px;color:var(--text2);line-height:1.7;margin-top:14px;max-width:240px}
  .footer-col h4{font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text1);margin-bottom:16px}
  .footer-col ul{list-style:none;display:flex;flex-direction:column;gap:10px}
  .footer-col ul a{font-size:13.5px;color:var(--text2);text-decoration:none;transition:color .2s}
  .footer-col ul a:hover{color:var(--gold-lt)}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--text3)}
  .footer-bottom a{color:var(--text3);text-decoration:none;transition:color .2s}
  .footer-bottom a:hover{color:var(--gold)}
  .foot-links{display:flex;gap:20px}

  /* REVEAL */
  .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
  .reveal.visible{opacity:1;transform:translateY(0)}
  .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}

  /* Hamburger button (mobile only) */
  .nav-burger{display:none;width:38px;height:38px;border:1px solid var(--gold-border);background:transparent;border-radius:9px;color:var(--gold-lt);cursor:pointer;font-size:18px;align-items:center;justify-content:center;font-family:inherit;flex-shrink:0}
  .nav-burger:hover{background:rgba(201,168,76,.07)}

  /* ════════════ MOBILE (≤ 768px) ════════════ */
  @media (max-width: 768px) {
    .nav{padding:0 4vw;height:60px;gap:8px}
    .nav-burger{display:flex}
    .nav-links{position:absolute;top:60px;left:0;right:0;background:rgba(10,10,11,.97);backdrop-filter:blur(18px);border-bottom:1px solid rgba(201,168,76,.18);flex-direction:column;align-items:flex-start;gap:0;padding:0;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
    .nav-links.open{max-height:340px;padding:14px 6vw}
    .nav-links li{width:100%;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .nav-links li:last-child{border-bottom:none}
    .nav-links a{display:block;font-size:15px;color:var(--text1);font-weight:500}
    .nav-ctas{gap:6px}
    .nav-ctas .btn-ghost{padding:6px 12px;font-size:12px}
    .nav-ctas .btn-gold{padding:6px 14px;font-size:12px}
    .lang-toggle{height:32px;padding:0 9px;font-size:11.5px}

    .hero{padding:100px 5vw 60px;min-height:auto}
    .hero h1{font-size:38px;letter-spacing:-.3px;line-height:1.15}
    .hero-sub{font-size:15px;margin-bottom:28px}
    .hero-ctas{gap:10px}
    .btn-primary{padding:12px 22px;font-size:14px;width:100%}
    .btn-secondary{padding:12px 22px;font-size:14px;width:100%}
    .hero-stats{gap:24px;margin-top:40px;padding-top:32px}
    .stat-n{font-size:24px}
    .stat-l{font-size:12px}

    .section-wrap{padding:64px 5vw}
    .section-title{font-size:26px}
    .section-sub{font-size:14.5px;line-height:1.6}
    .section-header{margin-bottom:36px}

    .feat-grid{grid-template-columns:1fr;gap:14px}
    .feat-card{padding:22px}
    .how-grid{grid-template-columns:1fr;gap:16px}

    /* Pricing — single column, Most Popular pinned to top */
    .price-grid{grid-template-columns:1fr;max-width:420px;margin:0 auto;gap:14px}
    .price-card.popular{order:-1;border-color:var(--gold)}
    .price-card{padding:24px}
    .price-amt{font-size:38px}
    .popular-badge{top:14px;right:14px}

    .testi-grid{grid-template-columns:1fr;gap:14px}
    .testi-card{padding:24px}

    .faq-wrap{padding:0}
    .faq-q{font-size:14px;padding:18px 0}

    .cta-banner{margin:0 5vw 60px;padding:44px 6vw;border-radius:16px}
    .cta-banner h2{font-size:24px}
    .cta-banner p{font-size:14.5px;margin-bottom:24px}
    .cta-btns{flex-direction:column;gap:10px}
    .cta-btns .btn-primary,.cta-btns .btn-secondary{width:100%}

    .footer{padding:48px 5vw 28px}
    .footer-top{grid-template-columns:1fr;gap:28px;margin-bottom:36px}
    .footer-bottom{flex-direction:column;align-items:flex-start;gap:8px;text-align:left}
    .foot-links{flex-wrap:wrap}
  }
`;

// ─────────────── Bilingual content (EN + 繁中) ───────────────
// The navbar 中文 toggle switches `lang` and persists it to localStorage
// ("revuly-lang") so the dashboard, settings, and product tour stay in sync.
const CONTENT = {
  en: {
    nav: { tour: "Product Tour", links: ["Features", "Pricing", "Testimonials", "FAQ"], login: "Login", trial: "Start Free Trial", signOut: "Sign Out", dashboard: "Dashboard" },
    hero: {
      badge: "Intelligent Reputation Management",
      h1a: "Turn Every Review Into", h1b: "Customer Trust",
      sub: "The intelligent Google review management platform built exclusively for elite hospitality brands. Reply perfectly in seconds. Monitor sentiment in real time.",
      cta1: "Start Free Trial — No Card Required", cta2: "See How It Works →",
      trust: "Trusted by restaurants in 12 countries",
    },
    mock: {
      avg: "Avg rating", reply: "Reply rate", month: "This month", copy: "📋 Copy",
      reviews: [
        { name: "Sarah Chen", stars: 5, text: "Hands down the freshest seafood — the salmon sashimi melts. Came back twice this week." },
        { name: "Marcus T.",  stars: 4, text: "Great vibe, generous portions. Service was a tiny bit slow at peak but worth it." },
        { name: "Jenny W.",   stars: 5, text: "Best izakaya in the area. The grilled mackerel and sake pairing — chef's kiss." },
      ],
      tabs: ["Warm", "Pro", "Brief"],
      replyText: "Sarah! You just made our night. Save us a seat next time — we want to send out something special. — James, Owner",
    },
    stats: [["10,000+", "Restaurants worldwide"], ["4.8★", "Average platform rating"], ["2M+", "Replies generated"], ["< 30s", "Reply crafted"]],
    featuresHead: { label: "Platform Features", titleA: "Everything Your", titleB: "Reputation Demands", sub: "Precision-engineered for establishments where guest experience is the brand." },
    features: [
      { icon: "✦", title: "Smart Reply Suggestions", desc: "Three distinct reply styles — Warm & Personal, Professional & Gracious, Brief & Direct — crafted in seconds and contextually tailored to each review.", tag: "Smart Engine", more: "Every reply opens with the guest's first name, picks the right tone for the star rating, and reads like a real owner — never corporate filler. Pro plans add a fourth 'Your Style' tab that learns from your actual posted replies." },
      { icon: "◉", title: "Real-Time Monitoring", desc: "Never miss a review. Get instant email alerts the moment a guest posts, across every location in your portfolio.", tag: "Instant Alerts", more: "Choose Immediate / Daily Digest / Weekly cadences. Every email ships with all three smart reply suggestions inside — copy and paste straight into Google Business Profile." },
      { icon: "◈", title: "Sentiment Analysis", desc: "Automatic classification of every review as positive, neutral, or negative — so you can prioritise where to focus your attention.", tag: "Smart", more: "Sentiment is tagged at sync time and surfaces in the dashboard filter rail, the keyword bars, and the 6-month sentiment trend chart on the Analytics page." },
      { icon: "⚠", title: "Crisis Alerts", desc: "Detect patterns of negative feedback before they escalate. Receive immediate alerts when 3+ low-rating reviews appear in 24 hours.", tag: "Growth & Pro", more: "Crisis emails ignore your notification cadence — they always send immediately with a red banner and a one-click jump to the affected reviews so you can respond inside the hour." },
      { icon: "▦", title: "Competitor Tracking", desc: "Monitor up to 3 competitor restaurants' review trends. Understand what your market peers are doing right — and wrong.", tag: "Pro Only", more: "Add competitors by Google name + city search. The dashboard shows side-by-side rating cards, keyword comparison bars, and their latest reviews. Daily sync keeps everything fresh." },
      { icon: "⬡", title: "Multi-Language", desc: "Reply fluently in English, Traditional Chinese, Vietnamese, French, Spanish, and more. Authentic communication across every guest demographic.", tag: "6+ Languages", more: "Pick the reply language per-review from the reply editor. The full UI ships with EN ↔ 中文 toggle, persisted across dashboard, settings, analytics, and the product tour." },
    ],
    moreShow: "Learn more →", moreHide: "Show less ↑",
    howHead: { label: "How It Works", titleA: "Up and Running in", titleB: "3 Minutes" },
    how: [
      ["1", "Connect Google Business", "Link your verified Google Business Profile. Revuly begins monitoring immediately."],
      ["2", "Get Notified Instantly", "Receive a beautifully formatted email the moment a new review appears — with full review details."],
      ["3", "Reply with Confidence", "Select a reply style, review the suggestion, copy it, and paste directly into Google. Done."],
    ],
    pricingHead: { label: "Pricing", titleA: "Transparent Plans for", titleB: "Every Scale", sub: "All plans include a 14-day free trial. No credit card required to start." },
    perMonth: "/month, billed monthly", free: "Free", subscribe: "Subscribe", startTrial: "Start Free Trial", mostPopular: "Most Popular",
    pricing: [
      { key: "free_trial", name: "Free Trial", price: null, period: "14-day trial", desc: "Explore the full platform risk-free.", feats: ["14-day trial", "5 smart reply credits", "1 location", "Manual review input", "Basic sentiment labels", "Email support"], popular: false },
      { key: "starter", name: "Starter", price: "39", desc: "For independent fine dining establishments.", feats: ["30 smart replies / month", "1 location", "Manual review input", "Sentiment analysis", "Email support"], popular: false },
      { key: "growth", name: "Growth", price: "99", desc: "The complete solution for growing groups.", feats: ["150 smart replies / month", "1 location", "Auto Google review sync", "Crisis alerts + weekly reports", "Custom keywords", "Multi-language replies", "Reply templates"], popular: true },
      { key: "pro", name: "Pro", price: "199", desc: "Unlimited scale for elite portfolios.", feats: ["Unlimited smart replies", "1 location", "Learns your unique style", "Competitor tracking (up to 3)", "Reply effect tracking", "Priority 24/7 support", { label: "Multiple locations — Contact us", href: "mailto:revuly.support@gmail.com" }], popular: false },
    ],
    testiHead: { label: "Testimonials", titleA: "Trusted by", titleB: "Industry Leaders" },
    testimonials: [
      { init: "M", name: "Marcus Renaud", role: "Executive Chef & Owner", rest: "Maison Renaud, New York", quote: "Our Google rating climbed from 4.2 to 4.8 in three months. The replies are indistinguishable from our own voice — guests have actually complimented how thoughtful our responses are." },
      { init: "S", name: "Sophia Hartwell", role: "Director of Operations", rest: "The Hartwell Collection, London", quote: "Managing reviews across seven properties used to consume two full-time staff. Now it takes one person under an hour a day — and the quality has genuinely improved." },
      { init: "L", name: "Laurent Beaumont", role: "General Manager", rest: "Château Beaumont, Paris", quote: "The multi-language capability is exceptional. We serve guests from around the world and can respond in their native language with complete confidence. Indispensable." },
    ],
    faqHead: { label: "FAQ", titleA: "Frequently Asked", titleB: "Questions" },
    faqs: [
      { q: "How does the AI generate contextually relevant replies?", a: "Revuly uses our intelligent suggestion engine to analyse each review's specific content — identifying sentiment, concerns, and compliments — then generates three distinct reply styles that directly address the reviewer's experience. No templates, no filler." },
      { q: "Can I customise the tone to match my brand voice?", a: "Yes. Growth and Pro subscribers can provide brand guidelines and example replies to fine-tune the suggestions. Pro users benefit from an adaptive model that learns your unique vocabulary and style over time." },
      { q: "Which languages are supported?", a: "Currently: English, Traditional Chinese, Simplified Chinese, Vietnamese, French, Spanish, and Japanese. Additional languages are added regularly based on subscriber demand." },
      { q: "Is there a free trial, and does it require a credit card?", a: "Every new account receives a 14-day free trial of the platform with 5 smart reply credits — no credit card required. You can explore all features before any commitment." },
      { q: "Can I manage more than one restaurant?", a: "Revuly is built around a single restaurant location per account — connect your Google Business Profile and everything stays focused on that one venue. If you run several restaurants and want to manage them together, email us at revuly.support@gmail.com and we'll help you set that up." },
    ],
    cta: { hA: "Ready to", hB: "Elevate Your Reputation?", p: "Join 10,000+ elite restaurants managing their guest experience with Revuly.", b1: "Start Free Trial — No Card Required", b2: "View Pricing" },
    footer: {
      brand: "The intelligent reputation management platform for elite hospitality brands. Every review, handled with precision.",
      productH: "Product", companyH: "Company", legalH: "Legal",
      product: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Help Centre", href: "/help" }],
      company: [{ label: "Contact", href: "mailto:revuly.support@gmail.com" }],
      legal: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Refund Policy", href: "/refund" }, { label: "Cookie Policy", href: "/privacy" }, { label: "GDPR", href: "/privacy" }, { label: "Security", href: "/terms" }],
      rights: "© 2026 Revuly Inc. All rights reserved.",
      bottom: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Help", href: "/help" }],
    },
  },
  zh: {
    nav: { tour: "產品導覽", links: ["功能", "方案", "客戶見證", "常見問題"], login: "登入", trial: "免費試用", signOut: "登出", dashboard: "控制台" },
    hero: {
      badge: "智慧品牌聲譽管理",
      h1a: "把每一則評論", h1b: "變成顧客信任",
      sub: "專為頂級餐飲品牌打造的智慧 Google 評論管理平台。幾秒內回覆得體，即時掌握顧客情緒。",
      cta1: "免費試用——無需信用卡", cta2: "看看怎麼運作 →",
      trust: "12 個國家的餐廳都在使用",
    },
    mock: {
      avg: "平均評分", reply: "回覆率", month: "本月新增", copy: "📋 複製",
      reviews: [
        { name: "Sarah Chen", stars: 5, text: "海鮮新鮮到不行——鮭魚生魚片入口即化。這禮拜已經來第二次了。" },
        { name: "Marcus T.",  stars: 4, text: "氣氛很好，份量大方。尖峰時段服務稍慢，但很值得。" },
        { name: "Jenny W.",   stars: 5, text: "這區最棒的居酒屋。炭烤鯖魚配清酒——主廚之吻。" },
      ],
      tabs: ["溫暖", "專業", "簡潔"],
      replyText: "Sarah！你讓我們今晚超開心。下次來記得跟我們說一聲，想為你準備點特別的。—— James，老闆",
    },
    stats: [["10,000+", "全球餐廳"], ["4.8★", "平台平均評分"], ["2M+", "已生成回覆"], ["< 30s", "完成一則回覆"]],
    featuresHead: { label: "平台功能", titleA: "你的品牌聲譽", titleB: "所需的一切", sub: "為「顧客體驗即品牌」的餐廳精心打造。" },
    features: [
      { icon: "✦", title: "智慧回覆建議", desc: "三種不同風格——溫暖親切、專業得體、簡潔直接——幾秒內生成，並貼合每則評論的內容。", tag: "智慧引擎", more: "每則回覆都以顧客的名字開頭，依星等選擇合適語氣，讀起來就像真正的老闆親自寫的，絕非罐頭文字。Pro 方案再加上第四個『你的風格』分頁，從你實際發出的回覆中學習。" },
      { icon: "◉", title: "即時監控", desc: "再也不漏接任何評論。顧客一發布，立即收到 Email 提醒。", tag: "即時提醒", more: "可選擇即時／每日摘要／每週的通知頻率。每封 Email 都附上三種智慧回覆建議——直接複製貼到 Google 商家檔案即可。" },
      { icon: "◈", title: "情緒分析", desc: "自動將每則評論分類為正面、中性或負面，讓你優先處理最該關注的地方。", tag: "智慧", more: "情緒會在同步時自動標記，並呈現在控制台的篩選列、關鍵字長條圖，以及分析頁的六個月情緒趨勢圖中。" },
      { icon: "⚠", title: "危機警示", desc: "在負評擴大之前就察覺。當 24 小時內出現 3 則以上低分評論，立即收到警示。", tag: "Growth & Pro", more: "危機 Email 不受通知頻率限制——一律立即寄出，附紅色橫幅與一鍵跳轉到相關評論，讓你能在一小時內回應。" },
      { icon: "▦", title: "競爭對手追蹤", desc: "監控最多 3 家競爭餐廳的評論趨勢，看清同業做對與做錯了什麼。", tag: "僅限 Pro", more: "用 Google 名稱＋城市搜尋加入競爭對手。控制台會並排顯示評分卡、關鍵字比較長條圖與對方最新評論，每日同步保持最新。" },
      { icon: "⬡", title: "多國語言", desc: "以英文、繁體中文、越南文、法文、西班牙文等語言流暢回覆，與各種客群真誠溝通。", tag: "6+ 語言", more: "在回覆編輯器中可逐則選擇回覆語言。整個介面內建 EN ↔ 中文 切換，並在控制台、設定、分析與產品導覽間保持一致。" },
    ],
    moreShow: "了解更多 →", moreHide: "收合 ↑",
    howHead: { label: "運作方式", titleA: "只要", titleB: "3 分鐘上手" },
    how: [
      ["1", "連接 Google 商家", "綁定你已驗證的 Google 商家檔案，Revuly 立即開始監控。"],
      ["2", "即時收到通知", "新評論一出現，就收到排版精美的 Email，附完整評論內容。"],
      ["3", "安心回覆", "選擇回覆風格、檢視建議、複製後直接貼到 Google，完成。"],
    ],
    pricingHead: { label: "方案", titleA: "適合", titleB: "各種規模的透明方案", sub: "所有方案都含 14 天免費試用，開始無需信用卡。" },
    perMonth: "／月，按月計費", free: "免費", subscribe: "訂閱", startTrial: "免費試用", mostPopular: "最受歡迎",
    pricing: [
      { key: "free_trial", name: "Free Trial", price: null, period: "14 天試用", desc: "零風險體驗完整平台。", feats: ["14 天試用", "5 則回覆額度", "1 個店家", "手動輸入評論", "基本情緒標籤", "Email 客服"], popular: false },
      { key: "starter", name: "Starter", price: "39", desc: "適合獨立經營的精緻餐廳。", feats: ["每月 30 則回覆", "1 個店家", "手動輸入評論", "情緒分析", "Email 客服"], popular: false },
      { key: "growth", name: "Growth", price: "99", desc: "成長中餐飲集團的完整方案。", feats: ["每月 150 則回覆", "1 個店家", "自動同步 Google 評論", "危機警示＋每週報告", "自訂關鍵字", "多語言回覆", "回覆範本"], popular: true },
      { key: "pro", name: "Pro", price: "199", desc: "頂級品牌的無限規模。", feats: ["無限回覆", "1 個店家", "學習你的專屬風格", "競爭對手追蹤（最多 3 家）", "回覆成效追蹤", "24/7 優先客服", { label: "多店需求——聯絡我們", href: "mailto:revuly.support@gmail.com" }], popular: false },
    ],
    testiHead: { label: "客戶見證", titleA: "深受", titleB: "業界領袖信賴" },
    testimonials: [
      { init: "M", name: "Marcus Renaud", role: "行政主廚／老闆", rest: "Maison Renaud，紐約", quote: "我們的 Google 評分三個月內從 4.2 升到 4.8。回覆和我們自己的口吻幾乎一樣——顧客甚至稱讚我們的回覆很用心。" },
      { init: "S", name: "Sophia Hartwell", role: "營運總監", rest: "The Hartwell Collection，倫敦", quote: "以前管理七家分店的評論要兩名全職員工，現在一個人每天不到一小時就搞定——而且品質確實更好了。" },
      { init: "L", name: "Laurent Beaumont", role: "總經理", rest: "Château Beaumont，巴黎", quote: "多語言能力非常出色。我們服務來自世界各地的顧客，能用他們的母語自信回覆，不可或缺。" },
    ],
    faqHead: { label: "常見問題", titleA: "常見", titleB: "問題" },
    faqs: [
      { q: "回覆建議是怎麼產生的？", a: "Revuly 透過我們的智慧建議引擎分析每則評論的具體內容——辨識情緒、疑慮與讚美——再生成三種不同風格、直接回應顧客體驗的回覆。沒有罐頭、沒有廢話。" },
      { q: "可以調整語氣來符合我的品牌嗎？", a: "可以。Growth 與 Pro 訂閱者能提供品牌指南與範例回覆來微調建議。Pro 用戶更享有會隨時間學習你專屬用詞與風格的適應式模型。" },
      { q: "支援哪些語言？", a: "目前支援：英文、繁體中文、簡體中文、越南文、法文、西班牙文與日文。我們會依訂閱者需求持續新增語言。" },
      { q: "有免費試用嗎？需要信用卡嗎？", a: "每個新帳號都享有 14 天免費試用與 5 則回覆額度——無需信用卡。你可以在做任何決定前體驗所有功能。" },
      { q: "可以管理多家餐廳嗎？", a: "Revuly 以單一店家為核心——連接你的 Google 商家檔案，一切都聚焦於那家店。如果你經營多家餐廳並想一起管理，來信 revuly.support@gmail.com，我們會協助你設定。" },
    ],
    cta: { hA: "準備好", hB: "提升你的品牌聲譽了嗎？", p: "加入超過 10,000 家頂級餐廳，用 Revuly 管理顧客體驗。", b1: "免費試用——無需信用卡", b2: "查看方案" },
    footer: {
      brand: "專為頂級餐飲品牌打造的智慧品牌聲譽管理平台。每一則評論，都精準處理。",
      productH: "產品", companyH: "公司", legalH: "法律",
      product: [{ label: "功能", href: "#features" }, { label: "方案", href: "#pricing" }, { label: "幫助中心", href: "/help" }],
      company: [{ label: "聯絡我們", href: "mailto:revuly.support@gmail.com" }],
      legal: [{ label: "隱私政策", href: "/privacy" }, { label: "服務條款", href: "/terms" }, { label: "退款政策", href: "/refund" }, { label: "Cookie 政策", href: "/privacy" }, { label: "GDPR", href: "/privacy" }, { label: "資訊安全", href: "/terms" }],
      rights: "© 2026 Revuly Inc. 版權所有。",
      bottom: [{ label: "條款", href: "/terms" }, { label: "隱私", href: "/privacy" }, { label: "幫助", href: "/help" }],
    },
  },
};

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [openFeat, setOpenFeat] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // null = still resolving (so the navbar doesn't flash the wrong CTAs),
  // true/false = signed-in state.
  const [isAuthed, setIsAuthed] = useState(null);
  const [lang, setLangRaw] = useState("en");
  const revealRefs = useRef([]);
  const supabase = useRef(null);

  // Hydrate the language from localStorage so the landing page matches the
  // preference set on the dashboard / product tour.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("revuly-lang");
      if (saved === "zh" || saved === "en") setLangRaw(saved);
    } catch {}
  }, []);
  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLangRaw(next);
    try { window.localStorage.setItem("revuly-lang", next); } catch {}
  };

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Resolve the current session once on mount and subscribe to
  // sign-in / sign-out so the navbar swaps without a hard reload.
  useEffect(() => {
    supabase.current = createClient();
    let mounted = true;
    supabase.current.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsAuthed(!!session?.user);
    });
    const { data: { subscription } } = supabase.current.auth.onAuthStateChange(
      (_event, session) => { if (mounted) setIsAuthed(!!session?.user); }
    );
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    if (!supabase.current) return;
    await supabase.current.auth.signOut();
    setIsAuthed(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const r = (delay = "") => ({ ref: (el) => revealRefs.current.push(el), className: `reveal${delay ? ` d${delay}` : ""}` });
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const c = CONTENT[lang];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="home" />

      <nav className={`nav${navScrolled ? " scrolled" : ""}`}>
        <a className="logo" href="#"><span className="logo-icon">✦</span>Revuly</a>
        <ul className={`nav-links${mobileMenuOpen ? " open" : ""}`}>
          {/* Product Tour navigates to a real page; the rest scroll to in-page sections. */}
          <li>
            <a href="/tour" onClick={() => setMobileMenuOpen(false)}>{c.nav.tour}</a>
          </li>
          {["Features", "Pricing", "Testimonials", "FAQ"].map((id, i) => (
            <li key={id}>
              <a
                href={`#${id.toLowerCase()}`}
                onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); go(id.toLowerCase()); }}
              >{c.nav.links[i]}</a>
            </li>
          ))}
        </ul>
        <div className="nav-ctas">
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">{lang === "en" ? "中文" : "EN"}</button>
          {isAuthed === null ? (
            // Reserve space while the session check is in flight so the nav
            // doesn't visibly snap between Login/Dashboard on slow networks.
            <span style={{width:174,height:34,display:"inline-block"}} aria-hidden="true" />
          ) : isAuthed ? (
            <>
              <button className="btn-ghost" onClick={handleSignOut}>{c.nav.signOut}</button>
              <button className="btn-gold" onClick={() => window.location.href = "/dashboard"}>{c.nav.dashboard}</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => window.location.href = "/login"}>{c.nav.login}</button>
              <button className="btn-gold" onClick={() => window.location.href = "/login"}>{c.nav.trial}</button>
            </>
          )}
          <button
            className="nav-burger"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" /><div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-badge"><span className="badge-dot" />{c.hero.badge}</div>
          <h1>{c.hero.h1a}<br /><span className="accent">{c.hero.h1b}</span></h1>
          <p className="hero-sub">{c.hero.sub}</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => window.location.href = "/login"}>{c.hero.cta1}</button>
            <button className="btn-secondary" onClick={() => window.location.href = "/tour"}>{c.hero.cta2}</button>
          </div>

          {/* Social proof strip — sits between the CTAs and the stat block */}
          <div className="trust-strip">
            <span className="trust-dot" />{c.hero.trust}
          </div>

          {/* Dashboard preview mockup (HTML/CSS — no real screenshot) */}
          <div className="hero-mock">
            <div className="hero-mock-chrome">
              <span className="hero-mock-dot r" /><span className="hero-mock-dot y" /><span className="hero-mock-dot g" />
              <span className="hero-mock-url">revuly.dev/dashboard</span>
            </div>
            <div className="hero-mock-body">
              <div className="hero-mock-side">
                <div className="hero-mock-stat"><div className="hero-mock-stat-n">4.8★</div><div className="hero-mock-stat-l">{c.mock.avg}</div></div>
                <div className="hero-mock-stat"><div className="hero-mock-stat-n">94%</div><div className="hero-mock-stat-l">{c.mock.reply}</div></div>
                <div className="hero-mock-stat"><div className="hero-mock-stat-n">+12</div><div className="hero-mock-stat-l">{c.mock.month}</div></div>
              </div>
              <div className="hero-mock-mid">
                {c.mock.reviews.map((rev, i) => (
                  <div key={i} className="hero-mock-rev">
                    <div className="hero-mock-rev-head">
                      <span className="hero-mock-rev-name">{rev.name}</span>
                      <span className="hero-mock-rev-stars">{"★".repeat(rev.stars)}</span>
                    </div>
                    <div className="hero-mock-rev-text">{rev.text}</div>
                  </div>
                ))}
              </div>
              <div className="hero-mock-right">
                <div className="hero-mock-tab-row">
                  <div className="hero-mock-tab active">{c.mock.tabs[0]}</div>
                  <div className="hero-mock-tab">{c.mock.tabs[1]}</div>
                  <div className="hero-mock-tab">{c.mock.tabs[2]}</div>
                </div>
                <div className="hero-mock-reply">“{c.mock.replyText}”</div>
                <button className="hero-mock-copy">{c.mock.copy}</button>
              </div>
            </div>
          </div>

          <div className="hero-stats">
            {c.stats.map(([n, l]) => (
              <div key={l} style={{textAlign:"center"}}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feat-bg" id="features">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">{c.featuresHead.label}</div><h2 className="section-title">{c.featuresHead.titleA} <span className="accent">{c.featuresHead.titleB}</span></h2><p className="section-sub">{c.featuresHead.sub}</p></div>
          <div className="feat-grid">
            {c.features.map((f, i) => {
              const open = openFeat === i;
              return (
                <div key={i} className={`feat-card${open ? " expanded" : ""}`} {...r(Math.min(i+1,5))}>
                  <div className="feat-icon">{f.icon}</div>
                  <h3>{f.title}</h3><p>{f.desc}</p>
                  {f.more && (
                    <>
                      <div className={`feat-more${open ? " open" : ""}`}>{f.more}</div>
                      <button
                        type="button"
                        className="feat-more-btn"
                        onClick={() => setOpenFeat(open ? null : i)}
                        aria-expanded={open}
                      >
                        {open ? c.moreHide : c.moreShow}
                      </button>
                    </>
                  )}
                  <span className="feat-tag">{f.tag}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">{c.howHead.label}</div><h2 className="section-title">{c.howHead.titleA} <span className="accent">{c.howHead.titleB}</span></h2></div>
          <div className="how-grid">
            {c.how.map(([n, t, d]) => (
              <div key={n} className="how-step" {...r(n)}><div className="how-num">{n}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:"var(--bg2)"}} id="pricing">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">{c.pricingHead.label}</div><h2 className="section-title">{c.pricingHead.titleA} <span className="accent">{c.pricingHead.titleB}</span></h2><p className="section-sub">{c.pricingHead.sub}</p></div>
          <div className="price-grid">
            {c.pricing.map((plan, i) => (
              <div key={plan.key} className={`price-card${plan.popular?" popular":""}`} {...r(i+1)}>
                {plan.popular && <span className="popular-badge">{c.mostPopular}</span>}
                <div className="price-name">{plan.name}</div>
                {plan.price ? <div className="price-row"><span className="price-cur">$</span><span className="price-amt">{plan.price}</span></div> : <div className="price-custom">{c.free}</div>}
                <div className="price-period">{plan.price ? c.perMonth : plan.period}</div>
                <p className="price-desc">{plan.desc}</p>
                <div className="price-div" />
                <ul className="price-feats">{plan.feats.map((f, idx) => {
                  if (typeof f === "object" && f.href) {
                    return <li key={idx}><span className="chk">✓</span><a href={f.href} style={{color:"var(--gold-lt)",textDecoration:"underline"}}>{f.label}</a></li>;
                  }
                  return <li key={typeof f === "string" ? f : idx}><span className="chk">✓</span>{f}</li>;
                })}</ul>
                <button
                  className={`btn-price ${plan.popular?"btn-price-fill":"btn-price-outline"}`}
                  onClick={() => {
                    // Free Trial → sign-up; paid plans → /pricing with the plan preselected.
                    window.location.href = plan.price ? `/pricing?plan=${plan.key}` : "/login";
                  }}
                >{plan.price ? c.subscribe : c.startTrial}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi-bg" id="testimonials">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">{c.testiHead.label}</div><h2 className="section-title">{c.testiHead.titleA} <span className="accent">{c.testiHead.titleB}</span></h2></div>
          <div className="testi-grid">
            {c.testimonials.map((t, i) => (
              <div key={t.name} className="testi-card" {...r(i+1)}>
                <div className="testi-stars">★★★★★</div>
                <p className="testi-quote">{t.quote}</p>
                <div className="testi-author"><div className="testi-av">{t.init}</div><div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div><div className="testi-rest">{t.rest}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">{c.faqHead.label}</div><h2 className="section-title">{c.faqHead.titleA} <span className="accent">{c.faqHead.titleB}</span></h2></div>
          <div className="faq-wrap" {...r(1)}>
            {c.faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => setOpenFaq(openFaq===i?null:i)}>{faq.q}<span className={`faq-icon${openFaq===i?" open":""}`}>+</span></button>
                <div className={`faq-a${openFaq===i?" open":""}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner" {...r()}>
        <h2>{c.cta.hA} <span className="accent">{c.cta.hB}</span></h2>
        <p>{c.cta.p}</p>
        <div className="cta-btns">
          <button className="btn-primary" onClick={() => window.location.href="/login"}>{c.cta.b1}</button>
          <button className="btn-secondary" onClick={() => go("pricing")}>{c.cta.b2}</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="logo" href="#"><span className="logo-icon">✦</span>Revuly</a>
            <p>{c.footer.brand}</p>
          </div>
          <div className="footer-col"><h4>{c.footer.productH}</h4><ul>{c.footer.product.map((l)=><li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul></div>
          <div className="footer-col"><h4>{c.footer.companyH}</h4><ul>{c.footer.company.map((l)=><li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul></div>
          <div className="footer-col"><h4>{c.footer.legalH}</h4><ul>{c.footer.legal.map((l)=><li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul></div>
        </div>
        <div className="footer-bottom">
          <span>{c.footer.rights}</span>
          <div className="foot-links">{c.footer.bottom.map((l)=><a key={l.label} href={l.href}>{l.label}</a>)}</div>
        </div>
      </footer>
    </>
  );
}
