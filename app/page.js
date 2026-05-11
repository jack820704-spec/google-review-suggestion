"use client";
import { useState, useEffect, useRef } from "react";

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
`;

const FEATURES = [
  { icon: "✦", title: "AI Reply Generation", desc: "Three distinct reply styles — Warm & Personal, Professional & Gracious, Brief & Direct — crafted in seconds and contextually tailored to each review.", tag: "Claude AI" },
  { icon: "◉", title: "Real-Time Monitoring", desc: "Never miss a review. Get instant email alerts the moment a guest posts, across every location in your portfolio.", tag: "Instant Alerts" },
  { icon: "◈", title: "Sentiment Analysis", desc: "Automatic classification of every review as positive, neutral, or negative — so you can prioritise where to focus your attention.", tag: "AI-Powered" },
  { icon: "⚠", title: "Crisis Alerts", desc: "Detect patterns of negative feedback before they escalate. Receive immediate alerts when 3+ low-rating reviews appear in 24 hours.", tag: "Growth & Pro" },
  { icon: "▦", title: "Competitor Tracking", desc: "Monitor up to 3 competitor restaurants' review trends. Understand what your market peers are doing right — and wrong.", tag: "Pro Only" },
  { icon: "⬡", title: "Multi-Language", desc: "Reply fluently in English, Traditional Chinese, Vietnamese, French, Spanish, and more. Authentic communication across every guest demographic.", tag: "6+ Languages" },
];

const PRICING = [
  { name: "Free Trial", price: null, period: "14 days free", desc: "Explore the full platform risk-free.", feats: ["5 AI reply credits", "1 location", "Manual review input", "Basic sentiment labels", "Email support"], popular: false },
  { name: "Starter", price: "39", desc: "For independent fine dining establishments.", feats: ["30 AI replies / month", "1 location", "Manual review input", "Sentiment analysis", "Email support"], popular: false },
  { name: "Growth", price: "99", desc: "The complete solution for growing groups.", feats: ["150 AI replies / month", "Up to 5 locations", "Auto Google sync", "Crisis alerts + weekly reports", "Custom keywords", "Multi-language replies", "Reply templates"], popular: true },
  { name: "Pro", price: "199", desc: "Unlimited scale for elite portfolios.", feats: ["Unlimited AI replies", "Unlimited locations", "AI learns your style", "Competitor tracking (3)", "Reply effect tracking", "Priority 24/7 support", "API access"], popular: false },
];

const TESTIMONIALS = [
  { init: "M", name: "Marcus Renaud", role: "Executive Chef & Owner", rest: "Maison Renaud, New York", quote: "Our Google rating climbed from 4.2 to 4.8 in three months. The AI replies are indistinguishable from our own voice — guests have actually complimented how thoughtful our responses are." },
  { init: "S", name: "Sophia Hartwell", role: "Director of Operations", rest: "The Hartwell Collection, London", quote: "Managing reviews across seven properties used to consume two full-time staff. Now it takes one person under an hour a day — and the quality has genuinely improved." },
  { init: "L", name: "Laurent Beaumont", role: "General Manager", rest: "Château Beaumont, Paris", quote: "The multi-language capability is exceptional. We serve guests from around the world and can respond in their native language with complete confidence. Indispensable." },
];

const FAQS = [
  { q: "How does the AI generate contextually relevant replies?", a: "Revuly uses Anthropic's Claude AI to analyse each review's specific content — identifying sentiment, concerns, and compliments — then generates three distinct reply styles that directly address the reviewer's experience. No templates, no filler." },
  { q: "Can I customise the tone to match my brand voice?", a: "Yes. Growth and Pro subscribers can provide brand guidelines and example replies to fine-tune the AI. Pro users benefit from an adaptive model that learns your unique vocabulary and style over time." },
  { q: "Which languages are supported?", a: "Currently: English, Traditional Chinese, Simplified Chinese, Vietnamese, French, Spanish, and Japanese. Additional languages are added regularly based on subscriber demand." },
  { q: "Is there a free trial, and does it require a credit card?", a: "Every new account receives a 14-day free trial of the platform with 5 AI reply credits — no credit card required. You can explore all features before any commitment." },
  { q: "How does multi-location management work?", a: "Each venue is added as a separate property within your account. View consolidated analytics across all locations, switch between them seamlessly, or assign team members to specific venues. Enterprise clients can configure role-based permissions across their entire group." },
];

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const revealRefs = useRef([]);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="home" />

      <nav className={`nav${navScrolled ? " scrolled" : ""}`}>
        <a className="logo" href="#"><span className="logo-icon">✦</span>Revuly</a>
        <ul className="nav-links">
          {["Features", "Pricing", "Testimonials", "FAQ"].map((l) => (
            <li key={l}><a href={`#${l.toLowerCase()}`} onClick={(e) => { e.preventDefault(); go(l.toLowerCase()); }}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-ctas">
          <button className="btn-ghost" onClick={() => window.location.href = "/login"}>Login</button>
          <button className="btn-gold" onClick={() => window.location.href = "/login"}>Start Free Trial</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" /><div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-badge"><span className="badge-dot" />AI-Powered Reputation Management</div>
          <h1>Turn Every Review Into<br /><span className="accent">Customer Trust</span></h1>
          <p className="hero-sub">The intelligent Google review management platform built exclusively for elite hospitality brands. Reply perfectly in seconds. Monitor sentiment in real time.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => window.location.href = "/login"}>Start Free Trial — No Card Required</button>
            <button className="btn-secondary" onClick={() => go("features")}>See How It Works</button>
          </div>
          <div className="hero-stats">
            {[["10,000+","Restaurants worldwide"],["4.8★","Average platform rating"],["2M+","AI replies generated"],["< 30s","Reply crafted"]].map(([n,l]) => (
              <div key={l} style={{textAlign:"center"}}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feat-bg" id="features">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">Platform Features</div><h2 className="section-title">Everything Your <span className="accent">Reputation Demands</span></h2><p className="section-sub">Precision-engineered for establishments where guest experience is the brand.</p></div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feat-card" {...r(Math.min(i+1,5))}>
                <div className="feat-icon">{f.icon}</div>
                <h3>{f.title}</h3><p>{f.desc}</p>
                <span className="feat-tag">{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">How It Works</div><h2 className="section-title">Up and Running in <span className="accent">3 Minutes</span></h2></div>
          <div className="how-grid">
            {[["1","Connect Google Business","Link your verified Google Business Profile. Revuly begins monitoring immediately."],["2","Get Notified Instantly","Receive a beautifully formatted email the moment a new review appears — with full review details."],["3","Reply with AI","Select a reply style, review the suggestion, copy it, and paste directly into Google. Done."]].map(([n,t,d]) => (
              <div key={n} className="how-step" {...r(n)}><div className="how-num">{n}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:"var(--bg2)"}} id="pricing">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">Pricing</div><h2 className="section-title">Transparent Plans for <span className="accent">Every Scale</span></h2><p className="section-sub">All plans include a 14-day free trial. No credit card required to start.</p></div>
          <div className="price-grid">
            {PRICING.map((plan, i) => (
              <div key={plan.name} className={`price-card${plan.popular?" popular":""}`} {...r(i+1)}>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <div className="price-name">{plan.name}</div>
                {plan.price ? <div className="price-row"><span className="price-cur">$</span><span className="price-amt">{plan.price}</span></div> : <div className="price-custom">Free</div>}
                <div className="price-period">{plan.price ? "/month, billed monthly" : plan.period}</div>
                <p className="price-desc">{plan.desc}</p>
                <div className="price-div" />
                <ul className="price-feats">{plan.feats.map((f) => <li key={f}><span className="chk">✓</span>{f}</li>)}</ul>
                <button className={`btn-price ${plan.popular?"btn-price-fill":"btn-price-outline"}`} onClick={() => window.location.href="/login"}>{plan.price?"Start Free Trial":"Get Started Free"}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi-bg" id="testimonials">
        <div className="section-wrap">
          <div className="section-header center" {...r()}><div className="section-label">Testimonials</div><h2 className="section-title">Trusted by <span className="accent">Industry Leaders</span></h2></div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
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
          <div className="section-header center" {...r()}><div className="section-label">FAQ</div><h2 className="section-title">Frequently Asked <span className="accent">Questions</span></h2></div>
          <div className="faq-wrap" {...r(1)}>
            {FAQS.map((faq, i) => (
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
        <h2>Ready to <span className="accent">Elevate Your Reputation?</span></h2>
        <p>Join 10,000+ elite restaurants managing their guest experience with Revuly.</p>
        <div className="cta-btns">
          <button className="btn-primary" onClick={() => window.location.href="/login"}>Start Free Trial — No Card Required</button>
          <button className="btn-secondary" onClick={() => go("pricing")}>View Pricing</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="logo" href="#"><span className="logo-icon">✦</span>Revuly</a>
            <p>The intelligent reputation management platform for elite hospitality brands. Every review, handled with precision.</p>
          </div>
          <div className="footer-col"><h4>Product</h4><ul>{["Features","Pricing","Changelog","Help Centre","API Docs"].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
          <div className="footer-col"><h4>Company</h4><ul>{["About","Blog","Careers","Press Kit","Contact"].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
          <div className="footer-col"><h4>Legal</h4><ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li><li><a href="#">Cookie Policy</a></li><li><a href="#">GDPR</a></li><li><a href="#">Security</a></li></ul></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Revuly Inc. All rights reserved.</span>
          <div className="foot-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/help">Help</a></div>
        </div>
      </footer>
    </>
  );
}
