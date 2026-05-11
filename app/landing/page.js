"use client";
import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0a0a0b;
    --bg2:       #111114;
    --bg3:       #17171c;
    --surface:   #1c1c22;
    --surface2:  #222229;
    --gold:      #c9a84c;
    --gold-lt:   #e8c96a;
    --gold-dim:  #8a6e2f;
    --gold-glow: rgba(201,168,76,0.18);
    --gold-border: rgba(201,168,76,0.22);
    --text1:     #f0ede6;
    --text2:     #a09888;
    --text3:     #5a5550;
    --pos-fg:    #5dba7a;
    --neg-fg:    #e06060;
    --r:         12px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text1);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* ── NOISE OVERLAY ── */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    opacity: .025;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px;
  }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 6vw;
    height: 68px;
    background: rgba(10,10,11,0.82);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(201,168,76,0.1);
    transition: background .3s;
  }
  .nav.scrolled {
    background: rgba(10,10,11,0.97);
    border-bottom-color: rgba(201,168,76,0.18);
  }
  .nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 20px; font-weight: 700;
    color: var(--gold-lt); letter-spacing: .5px;
    text-decoration: none;
    display: flex; align-items: center; gap: 9px;
  }
  .nav-logo-icon {
    width: 30px; height: 30px;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold));
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
  }
  .nav-links {
    display: flex; align-items: center; gap: 32px;
    list-style: none;
  }
  .nav-links a {
    font-size: 13.5px; font-weight: 500;
    color: var(--text2); text-decoration: none;
    letter-spacing: .2px;
    transition: color .2s;
  }
  .nav-links a:hover { color: var(--text1); }
  .nav-ctas { display: flex; align-items: center; gap: 10px; }
  .btn-ghost {
    padding: 8px 18px; border-radius: 8px;
    font-size: 13.5px; font-weight: 600; font-family: inherit;
    color: var(--text2); background: transparent;
    border: 1px solid var(--gold-border); cursor: pointer;
    transition: all .2s; letter-spacing: .3px;
  }
  .btn-ghost:hover { color: var(--gold-lt); border-color: var(--gold); }
  .btn-gold {
    padding: 8px 20px; border-radius: 8px;
    font-size: 13.5px; font-weight: 700; font-family: inherit;
    color: #000;
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    border: none; cursor: pointer;
    transition: all .22s; letter-spacing: .3px;
    box-shadow: 0 2px 12px rgba(201,168,76,0.3);
  }
  .btn-gold:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 20px rgba(201,168,76,0.45);
  }
  .btn-gold:active { transform: translateY(0); }

  /* ── HERO ── */
  .hero {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    padding: 120px 6vw 80px;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 50% 50% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 60%);
  }
  .hero-grid {
    position: absolute; inset: 0; z-index: 0; opacity: .04;
    background-image:
      linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }
  .hero-inner { position: relative; z-index: 1; max-width: 820px; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 16px; border-radius: 999px;
    border: 1px solid var(--gold-border);
    background: rgba(201,168,76,0.07);
    font-size: 12px; font-weight: 600; color: var(--gold);
    letter-spacing: .8px; text-transform: uppercase;
    margin-bottom: 28px;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 6px var(--gold);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .5; transform: scale(.8); }
  }
  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(38px, 6.5vw, 72px);
    font-weight: 900; line-height: 1.1;
    letter-spacing: -.5px;
    margin-bottom: 24px;
  }
  .hero h1 .accent {
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    font-size: clamp(16px, 2vw, 19px);
    color: var(--text2); font-weight: 400; line-height: 1.65;
    max-width: 600px; margin: 0 auto 40px;
  }
  .hero-ctas { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
  .btn-hero-primary {
    padding: 14px 34px; border-radius: 10px;
    font-size: 15px; font-weight: 700; font-family: inherit;
    color: #000;
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    border: none; cursor: pointer;
    transition: all .25s; letter-spacing: .3px;
    box-shadow: 0 4px 20px rgba(201,168,76,0.38);
  }
  .btn-hero-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(201,168,76,0.5);
  }
  .btn-hero-secondary {
    padding: 14px 34px; border-radius: 10px;
    font-size: 15px; font-weight: 600; font-family: inherit;
    color: var(--text1); background: transparent;
    border: 1px solid rgba(240,237,230,0.15);
    cursor: pointer; transition: all .25s;
    display: flex; align-items: center; gap: 8px;
  }
  .btn-hero-secondary:hover {
    border-color: var(--gold-border);
    color: var(--gold-lt);
    background: var(--gold-glow);
  }
  .hero-stats {
    display: flex; justify-content: center; gap: 48px;
    margin-top: 64px; padding-top: 48px;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
  }
  .hero-stat-n {
    font-family: 'Playfair Display', serif;
    font-size: 32px; font-weight: 700;
    color: var(--gold-lt);
  }
  .hero-stat-l {
    font-size: 13px; color: var(--text2); margin-top: 2px;
  }

  /* ── SECTION COMMON ── */
  section { position: relative; z-index: 1; }
  .section-wrap { max-width: 1120px; margin: 0 auto; padding: 100px 6vw; }
  .section-label {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 14px;
  }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 4vw, 44px); font-weight: 700;
    line-height: 1.2; margin-bottom: 16px;
  }
  .section-title .accent {
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .section-sub {
    font-size: 16px; color: var(--text2); line-height: 1.65;
    max-width: 540px;
  }
  .section-header { margin-bottom: 56px; }
  .section-header.center { text-align: center; }
  .section-header.center .section-sub { margin: 0 auto; }

  /* ── FEATURES ── */
  .features-bg { background: var(--bg2); }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }
  .feature-card {
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: var(--r);
    padding: 28px;
    transition: all .28s;
    cursor: default;
  }
  .feature-card:hover {
    border-color: var(--gold-border);
    background: var(--surface2);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  }
  .feature-icon {
    width: 46px; height: 46px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06));
    border: 1px solid var(--gold-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 21px; margin-bottom: 18px;
  }
  .feature-card h3 {
    font-size: 15.5px; font-weight: 700;
    margin-bottom: 10px; color: var(--text1);
  }
  .feature-card p {
    font-size: 13.5px; color: var(--text2); line-height: 1.65;
  }
  .feature-tag {
    display: inline-block; margin-top: 14px;
    padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 600; letter-spacing: .4px;
    background: rgba(201,168,76,0.1);
    color: var(--gold); border: 1px solid rgba(201,168,76,0.2);
  }

  /* ── PRICING ── */
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px; align-items: start;
  }
  @media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; } }
  .pricing-card {
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px; padding: 32px;
    transition: all .28s;
    position: relative; overflow: hidden;
  }
  .pricing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }
  .pricing-card.popular {
    border-color: var(--gold);
    background: linear-gradient(160deg, rgba(201,168,76,0.07) 0%, var(--surface) 60%);
    box-shadow: 0 0 40px rgba(201,168,76,0.12);
  }
  .popular-badge {
    position: absolute; top: 18px; right: 18px;
    padding: 4px 11px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: .5px;
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    color: #000;
  }
  .pricing-name {
    font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 12px;
  }
  .pricing-price {
    display: flex; align-items: baseline; gap: 3px;
    margin-bottom: 6px;
  }
  .price-currency { font-size: 22px; font-weight: 600; color: var(--text1); }
  .price-amount {
    font-family: 'Playfair Display', serif;
    font-size: 52px; font-weight: 900; line-height: 1;
    color: var(--text1);
  }
  .price-custom {
    font-family: 'Playfair Display', serif;
    font-size: 32px; font-weight: 700; color: var(--text1);
    line-height: 1; margin: 10px 0;
  }
  .price-period { font-size: 14px; color: var(--text2); }
  .pricing-desc { font-size: 13.5px; color: var(--text2); margin-bottom: 24px; line-height: 1.5; }
  .pricing-divider {
    height: 1px; background: rgba(255,255,255,0.07);
    margin-bottom: 22px;
  }
  .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
  .pricing-features li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13.5px; color: var(--text2); line-height: 1.45;
  }
  .check-icon {
    width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: var(--gold);
  }
  .btn-pricing {
    width: 100%; padding: 12px; border-radius: 9px;
    font-size: 14px; font-weight: 700; font-family: inherit;
    cursor: pointer; transition: all .22s; letter-spacing: .3px;
  }
  .btn-pricing-outline {
    background: transparent; color: var(--text1);
    border: 1px solid rgba(255,255,255,0.14);
  }
  .btn-pricing-outline:hover { border-color: var(--gold-border); color: var(--gold-lt); }
  .btn-pricing-fill {
    background: linear-gradient(135deg, var(--gold-lt), var(--gold));
    color: #000; border: none;
    box-shadow: 0 3px 14px rgba(201,168,76,0.32);
  }
  .btn-pricing-fill:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(201,168,76,0.45);
  }

  /* ── TESTIMONIALS ── */
  .testimonials-bg { background: var(--bg2); }
  .testi-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 20px;
  }
  @media (max-width: 860px) { .testi-grid { grid-template-columns: 1fr; } }
  .testi-card {
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: var(--r); padding: 30px;
    display: flex; flex-direction: column; gap: 20px;
    transition: all .28s;
  }
  .testi-card:hover {
    border-color: var(--gold-border);
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(0,0,0,0.35);
  }
  .testi-stars { display: flex; gap: 3px; color: var(--gold); font-size: 14px; }
  .testi-quote {
    font-size: 14.5px; line-height: 1.75; color: var(--text2);
    font-style: italic; flex: 1;
  }
  .testi-quote::before { content: '"'; color: var(--gold); font-size: 20px; font-style: normal; }
  .testi-quote::after  { content: '"'; color: var(--gold); font-size: 20px; font-style: normal; }
  .testi-author { display: flex; align-items: center; gap: 13px; }
  .testi-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-dim), var(--surface2));
    border: 2px solid var(--gold-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 700;
    color: var(--gold-lt);
    font-family: 'Playfair Display', serif;
    flex-shrink: 0;
  }
  .testi-name { font-size: 14px; font-weight: 700; color: var(--text1); }
  .testi-role { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .testi-restaurant {
    font-size: 12px; color: var(--gold); font-weight: 600; margin-top: 1px;
  }

  /* ── FAQ ── */
  .faq-wrap { max-width: 720px; margin: 0 auto; }
  .faq-item {
    border-bottom: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
  }
  .faq-item:first-child { border-top: 1px solid rgba(255,255,255,0.07); }
  .faq-q {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    padding: 22px 0; background: transparent; border: none; cursor: pointer;
    font-family: inherit; text-align: left;
    font-size: 15px; font-weight: 600; color: var(--text1);
    transition: color .2s; gap: 16px;
  }
  .faq-q:hover { color: var(--gold-lt); }
  .faq-icon {
    width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%;
    border: 1px solid var(--gold-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: var(--gold); transition: transform .25s;
  }
  .faq-icon.open { transform: rotate(45deg); }
  .faq-a {
    max-height: 0; overflow: hidden;
    transition: max-height .35s cubic-bezier(0.4,0,0.2,1), padding .35s;
    font-size: 14.5px; color: var(--text2); line-height: 1.75;
  }
  .faq-a.open {
    max-height: 300px;
    padding-bottom: 20px;
  }

  /* ── CTA BANNER ── */
  .cta-banner {
    margin: 0 6vw 80px;
    background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04));
    border: 1px solid var(--gold-border);
    border-radius: 20px; padding: 60px 6vw;
    text-align: center; position: relative; overflow: hidden;
  }
  .cta-banner::before {
    content: '';
    position: absolute; top: -80px; right: -80px;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%);
    pointer-events: none;
  }
  .cta-banner h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 4vw, 40px); font-weight: 700;
    margin-bottom: 14px;
  }
  .cta-banner p {
    font-size: 16px; color: var(--text2); margin-bottom: 32px;
  }
  .cta-banner-btns { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }

  /* ── FOOTER ── */
  .footer {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 60px 6vw 32px;
  }
  .footer-top {
    display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr;
    gap: 40px; margin-bottom: 48px;
  }
  @media (max-width: 860px) { .footer-top { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) { .footer-top { grid-template-columns: 1fr; } }
  .footer-brand p {
    font-size: 13.5px; color: var(--text2); line-height: 1.7;
    margin-top: 14px; max-width: 240px;
  }
  .footer-col h4 {
    font-size: 12px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--text1); margin-bottom: 16px;
  }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .footer-col ul a {
    font-size: 13.5px; color: var(--text2); text-decoration: none;
    transition: color .2s;
  }
  .footer-col ul a:hover { color: var(--gold-lt); }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 28px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 12px;
    font-size: 12.5px; color: var(--text3);
  }
  .footer-bottom a { color: var(--text3); text-decoration: none; transition: color .2s; }
  .footer-bottom a:hover { color: var(--gold); }
  .footer-bottom-links { display: flex; gap: 20px; }

  /* ── SCROLL REVEAL ── */
  .reveal {
    opacity: 0; transform: translateY(24px);
    transition: opacity .6s ease, transform .6s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: .1s; }
  .reveal-delay-2 { transition-delay: .2s; }
  .reveal-delay-3 { transition-delay: .3s; }
  .reveal-delay-4 { transition-delay: .4s; }
  .reveal-delay-5 { transition-delay: .5s; }
`;

const FEATURES = [
  {
    icon: "✦",
    title: "AI Reply Generation",
    desc: "Generate three distinct reply styles — Sophisticated, Professional, and Diplomatic — in seconds. Each reply is contextually tailored to the specific review content.",
    tag: "Powered by Claude AI",
  },
  {
    icon: "◉",
    title: "Real-Time Monitoring",
    desc: "Stay ahead of every review the moment it's posted. Instant notifications ensure no guest feedback goes unacknowledged across all your locations.",
    tag: "Live Updates",
  },
  {
    icon: "⬡",
    title: "Multi-Language Support",
    desc: "Reply fluently in English, Traditional Chinese, Vietnamese, and more. Maintain authentic brand voice across every language and cultural context.",
    tag: "6+ Languages",
  },
  {
    icon: "◈",
    title: "Sentiment Analysis",
    desc: "Automatic classification of every review as positive, neutral, or negative. Focus your attention where it matters most and track sentiment trends over time.",
    tag: "AI-Powered",
  },
  {
    icon: "▦",
    title: "Analytics Dashboard",
    desc: "Track your average rating trajectory, response rates, and sentiment breakdowns. Data-driven insights to continuously elevate your guest experience strategy.",
    tag: "Deep Insights",
  },
  {
    icon: "⊞",
    title: "Multi-Location Management",
    desc: "Manage reviews for your entire portfolio — from a single flagship to a global collection — from one unified, elegantly designed command centre.",
    tag: "Enterprise Ready",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "49",
    period: "/month",
    desc: "Perfect for independent fine dining establishments looking to elevate their reputation management.",
    features: [
      "1 restaurant location",
      "50 AI-generated replies / month",
      "3 reply styles per review",
      "Basic sentiment analytics",
      "English & Chinese language support",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "129",
    period: "/month",
    desc: "The complete solution for growing hospitality groups with multiple venues and higher review volume.",
    features: [
      "Up to 5 restaurant locations",
      "Unlimited AI-generated replies",
      "All reply styles & languages",
      "Advanced analytics & reporting",
      "Custom brand voice training",
      "Priority email & chat support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: null,
    period: null,
    desc: "Tailored for luxury hospitality groups, hotel collections, and franchise networks at scale.",
    features: [
      "Unlimited locations",
      "Dedicated AI model fine-tuning",
      "Custom API integrations",
      "White-label dashboard option",
      "Dedicated account manager",
      "SLA-backed 24/7 support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    initial: "M",
    name: "Marcus Renaud",
    role: "Executive Chef & Owner",
    restaurant: "Maison Renaud, New York",
    quote:
      "Since deploying this platform, our average Google rating climbed from 4.2 to 4.8 within three months. The AI-crafted replies are indistinguishable from our own voice — our guests have even complimented us on how thoughtful our responses are.",
  },
  {
    initial: "S",
    name: "Sophia Hartwell",
    role: "Director of Operations",
    restaurant: "The Hartwell Collection, London",
    quote:
      "Managing reviews across seven properties used to consume two full-time staff members. Now it takes one person less than an hour a day. The quality and consistency of replies has actually improved dramatically.",
  },
  {
    initial: "L",
    name: "Laurent Beaumont",
    role: "General Manager",
    restaurant: "Château Beaumont, Paris",
    quote:
      "The multi-language capability is exceptional. We serve guests from around the world and can now respond to reviews in their native language with complete confidence. A truly indispensable tool for modern hospitality.",
  },
];

const FAQS = [
  {
    q: "How does the AI generate contextually relevant replies?",
    a: "Our platform uses Claude, Anthropic's state-of-the-art language model, to analyse the specific content of each review — identifying the sentiment, key concerns, and compliments. It then generates three distinct reply styles that directly address the reviewer's experience, ensuring every response feels genuine and personalised rather than templated.",
  },
  {
    q: "Can I customise the tone to match my brand voice?",
    a: "Absolutely. Professional and Enterprise plan subscribers can provide brand guidelines, tone-of-voice documents, and example replies to fine-tune how the AI writes on your behalf. The platform learns your specific vocabulary, formality level, and signature phrases over time.",
  },
  {
    q: "Which languages are currently supported for replies?",
    a: "We currently support English, Traditional Chinese, Simplified Chinese, Vietnamese, French, Spanish, and Japanese. Additional languages are added regularly. Our multi-language capability is particularly valued by establishments in cosmopolitan cities and international tourism destinations.",
  },
  {
    q: "Is there a free trial, and does it require a credit card?",
    a: "Yes — every new account receives a 14-day free trial of the Professional plan with no credit card required. You can explore all features, generate replies, and assess the platform's impact on your workflow before making any commitment.",
  },
  {
    q: "How does multi-location management work in practice?",
    a: "Each location is added as a separate property within your account dashboard. You can view consolidated analytics across all locations, switch between them seamlessly, or assign team members to manage specific venues. Enterprise clients can also set role-based permissions for large hospitality groups.",
  },
];

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const revealRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (delay = "") => ({
    ref: (el) => revealRefs.current.push(el),
    className: `reveal${delay ? ` reveal-delay-${delay}` : ""}`,
  });

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="landing" />

      {/* NAV */}
      <nav className={`nav${navScrolled ? " scrolled" : ""}`}>
        <a className="nav-logo" href="#">
          <span className="nav-logo-icon">✦</span>
          ReviewIQ
        </a>
        <ul className="nav-links">
          {["Features", "Pricing", "Testimonials", "FAQ"].map((l) => (
            <li key={l}>
              <a href={`#${l.toLowerCase()}`} onClick={(e) => { e.preventDefault(); scrollTo(l.toLowerCase()); }}>
                {l}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-ctas">
          <button className="btn-ghost" onClick={() => scrollTo("pricing")}>Login</button>
          <button className="btn-gold" onClick={() => scrollTo("pricing")}>Start Free Trial</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Reputation Management
          </div>
          <h1>
            Turn Every Review Into<br />
            a <span className="accent">Revenue Opportunity</span>
          </h1>
          <p className="hero-sub">
            The intelligent review management platform built exclusively for elite hospitality brands.
            Generate perfect replies in seconds. Monitor sentiment in real time. Protect and elevate your reputation.
          </p>
          <div className="hero-ctas">
            <button className="btn-hero-primary" onClick={() => scrollTo("pricing")}>
              Start Free Trial — No Card Required
            </button>
            <button className="btn-hero-secondary" onClick={() => scrollTo("features")}>
              <span style={{ fontSize: 13 }}>▶</span> See How It Works
            </button>
          </div>
          <div className="hero-stats">
            {[
              { n: "4.9★", l: "Average platform rating" },
              { n: "2,400+", l: "Restaurants served" },
              { n: "98%", l: "Response rate achieved" },
              { n: "< 30s", l: "Reply generated" },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div className="hero-stat-n">{s.n}</div>
                <div className="hero-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-bg" id="features">
        <div className="section-wrap">
          <div className="section-header center" {...addReveal()}>
            <div className="section-label">Platform Features</div>
            <h2 className="section-title">
              Everything Your <span className="accent">Reputation Demands</span>
            </h2>
            <p className="section-sub">
              Precision-engineered for establishments where guest experience is the brand.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card" {...addReveal(Math.min(i + 1, 5))}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="feature-tag">{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="section-wrap">
          <div className="section-header center" {...addReveal()}>
            <div className="section-label">Pricing</div>
            <h2 className="section-title">
              Transparent Plans for <span className="accent">Every Scale</span>
            </h2>
            <p className="section-sub">
              All plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
          <div className="pricing-grid">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={`pricing-card${plan.popular ? " popular" : ""}`}
                {...addReveal(i + 1)}
              >
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-price">
                  {plan.price ? (
                    <>
                      <span className="price-currency">$</span>
                      <span className="price-amount">{plan.price}</span>
                    </>
                  ) : (
                    <span className="price-custom">Custom</span>
                  )}
                </div>
                {plan.period && <div className="price-period">{plan.period}, billed monthly</div>}
                <p className="pricing-desc" style={{ marginTop: 12 }}>{plan.desc}</p>
                <div className="pricing-divider" />
                <ul className="pricing-features">
                  {plan.features.map((feat) => (
                    <li key={feat}>
                      <span className="check-icon">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn-pricing ${plan.popular ? "btn-pricing-fill" : "btn-pricing-outline"}`}
                  onClick={() => scrollTo("faq")}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-bg" id="testimonials">
        <div className="section-wrap">
          <div className="section-header center" {...addReveal()}>
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">
              Trusted by <span className="accent">Industry Leaders</span>
            </h2>
            <p className="section-sub">
              Hear from the restaurateurs and hospitality directors who rely on ReviewIQ every day.
            </p>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="testi-card" {...addReveal(i + 1)}>
                <div className="testi-stars">{"★★★★★"}</div>
                <p className="testi-quote">{t.quote}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.initial}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                    <div className="testi-restaurant">{t.restaurant}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="section-wrap">
          <div className="section-header center" {...addReveal()}>
            <div className="section-label">FAQ</div>
            <h2 className="section-title">
              Frequently Asked <span className="accent">Questions</span>
            </h2>
          </div>
          <div className="faq-wrap" {...addReveal(1)}>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className={`faq-icon${openFaq === i ? " open" : ""}`}>+</span>
                </button>
                <div className={`faq-a${openFaq === i ? " open" : ""}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner" {...addReveal()}>
        <h2>
          Ready to <span style={{ background: "linear-gradient(135deg,#e8c96a,#c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Elevate Your Reputation?</span>
        </h2>
        <p>Join 2,400+ elite restaurants managing their guest experience with ReviewIQ.</p>
        <div className="cta-banner-btns">
          <button className="btn-hero-primary" onClick={() => scrollTo("pricing")}>
            Start Free Trial — No Card Required
          </button>
          <button className="btn-hero-secondary" onClick={() => scrollTo("pricing")}>
            View Pricing
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="nav-logo" href="#" style={{ justifyContent: "flex-start" }}>
              <span className="nav-logo-icon">✦</span>
              ReviewIQ
            </a>
            <p>
              The intelligent reputation management platform for elite hospitality brands.
              Crafted with precision for establishments where every impression counts.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              {["Features", "Pricing", "Changelog", "Roadmap", "API Docs"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {["About Us", "Blog", "Careers", "Press Kit", "Contact"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 ReviewIQ. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#">Twitter / X</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </>
  );
}
