"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { startCheckout } from "@/lib/paddle-client";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--surface2:#222229;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-glow:rgba(201,168,76,0.18);--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--pos:#5dba7a;--neg:#e06060;--r:12px}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;min-height:100vh}

  .nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 6vw;height:64px;background:rgba(10,10,11,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(201,168,76,.12)}
  .logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold-lt);text-decoration:none;display:flex;align-items:center;gap:9px}
  .logo-icon{width:30px;height:30px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .nav-right{display:flex;align-items:center;gap:10px}
  .btn-ghost{padding:8px 18px;border-radius:8px;font-size:13.5px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid var(--gold-border);cursor:pointer;transition:all .2s;text-decoration:none}
  .btn-ghost:hover{color:var(--gold-lt);border-color:var(--gold)}

  .wrap{max-width:1120px;margin:0 auto;padding:64px 6vw 90px}
  .head{text-align:center;margin-bottom:52px}
  .head .label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:14px}
  .head h1{font-family:'Playfair Display',serif;font-size:clamp(30px,5vw,48px);font-weight:900;line-height:1.15;margin-bottom:16px}
  .accent{background:linear-gradient(135deg,var(--gold-lt),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .head p{font-size:16px;color:var(--text2);line-height:1.6;max-width:560px;margin:0 auto}

  .err{max-width:560px;margin:0 auto 26px;padding:11px 16px;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.3);border-radius:9px;font-size:13.5px;color:var(--neg);text-align:center}
  .notice{max-width:560px;margin:0 auto 26px;padding:11px 16px;background:rgba(93,186,122,.08);border:1px solid rgba(93,186,122,.28);border-radius:9px;font-size:13.5px;color:var(--pos);text-align:center}

  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}
  @media(max-width:1000px){.grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.grid{grid-template-columns:1fr;max-width:420px;margin:0 auto}}
  .card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:28px;transition:all .28s;position:relative;overflow:hidden;display:flex;flex-direction:column}
  .card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
  .card.popular{border-color:var(--gold);background:linear-gradient(160deg,rgba(201,168,76,.07),var(--surface) 60%);box-shadow:0 0 40px rgba(201,168,76,.12)}
  @media(max-width:600px){.card.popular{order:-1}}
  .badge{position:absolute;top:16px;right:16px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000}
  .name{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
  .price-row{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
  .cur{font-size:18px;font-weight:600}
  .amt{font-family:'Playfair Display',serif;font-size:44px;font-weight:900;line-height:1}
  .free{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin:8px 0 4px}
  .period{font-size:13px;color:var(--text2)}
  .desc{font-size:13px;color:var(--text2);margin:12px 0 20px;line-height:1.55}
  .div{height:1px;background:rgba(255,255,255,.07);margin-bottom:18px}
  .feats{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px;flex:1}
  .feats li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text2);line-height:1.45}
  .chk{width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:1px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--gold)}
  .btn{width:100%;padding:12px;border-radius:9px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .22s;letter-spacing:.3px}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .btn-outline{background:transparent;color:var(--text1);border:1px solid rgba(255,255,255,.14)}
  .btn-outline:hover{border-color:var(--gold-border);color:var(--gold-lt)}
  .btn-fill{background:linear-gradient(135deg,var(--gold-lt),var(--gold));color:#000;border:none;box-shadow:0 3px 14px rgba(201,168,76,.32)}
  .btn-fill:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.45)}
  .enterprise{margin-top:10px;font-size:11.5px;color:var(--text3);text-align:center;line-height:1.5}
  .enterprise a{color:var(--gold);text-decoration:none}
  .foot-note{text-align:center;margin-top:40px;font-size:13px;color:var(--text3)}

  @media(max-width:600px){.wrap{padding:44px 5vw 70px}.amt{font-size:38px}.card{padding:24px}}
`;

const PLANS = [
  {
    key: "free_trial",
    name: "Free Trial",
    price: null,
    period: "14-day trial",
    desc: "Explore the full platform risk-free.",
    feats: ["14-day trial", "5 smart reply credits", "1 location", "Manual review input", "Basic sentiment labels", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    key: "starter",
    name: "Starter",
    price: "39",
    period: "/month, billed monthly",
    desc: "For independent fine dining establishments.",
    feats: ["30 AI replies / month", "1 location", "Manual review input", "Sentiment analysis", "Email support"],
    cta: "Subscribe",
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: "99",
    period: "/month, billed monthly",
    desc: "The complete solution for growing groups.",
    feats: ["150 AI replies / month", "Auto Google review sync", "Crisis alerts + weekly reports", "Custom keywords", "Multi-language replies", "Reply templates"],
    cta: "Subscribe",
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: "199",
    period: "/month, billed monthly",
    desc: "Unlimited scale for elite portfolios.",
    feats: ["Unlimited AI replies", "Learns your unique style", "Competitor tracking (up to 3)", "Reply effect tracking", "Priority 24/7 support", "Everything in Growth"],
    cta: "Subscribe",
    popular: false,
  },
];

export default function PricingPage() {
  const [isAuthed, setIsAuthed] = useState(null);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthed(!!session?.user));
    // If we bounced through /login with a plan to resume, pick it back up.
    const url = new URL(window.location.href);
    if (url.searchParams.get("expired") === "1") {
      setNotice("Your free trial has ended. Choose a plan to keep using Revuly.");
    }
  }, []);

  const handleSelect = async (plan) => {
    setError("");
    // Free trial just routes to sign-up.
    if (plan.key === "free_trial") {
      window.location.href = "/login";
      return;
    }
    // Not signed in → send to login, remembering the chosen plan.
    if (!isAuthed) {
      window.location.href = `/login?next=${encodeURIComponent(`/pricing?plan=${plan.key}`)}`;
      return;
    }
    setBusyPlan(plan.key);
    try {
      await startCheckout(plan.key);
    } catch (err) {
      setError(err.message || "Could not start checkout. Please try again.");
    } finally {
      setBusyPlan("");
    }
  };

  // If a signed-in user arrived with ?plan=… (resumed after login), auto-open.
  useEffect(() => {
    if (isAuthed !== true) return;
    const url = new URL(window.location.href);
    const wanted = url.searchParams.get("plan");
    if (wanted && ["starter", "growth", "pro"].includes(wanted)) {
      const plan = PLANS.find((p) => p.key === wanted);
      if (plan) handleSelect(plan);
      // Clear the param so a refresh doesn't re-trigger.
      url.searchParams.delete("plan");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isAuthed]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="pricing" />
      <nav className="nav">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
        <div className="nav-right">
          {isAuthed ? (
            <a className="btn-ghost" href="/dashboard">Dashboard</a>
          ) : (
            <a className="btn-ghost" href="/login">Login</a>
          )}
        </div>
      </nav>

      <div className="wrap">
        <div className="head">
          <div className="label">Pricing</div>
          <h1>Transparent Plans for <span className="accent">Every Scale</span></h1>
          <p>All plans start with a 14-day free trial. Upgrade anytime — cancel anytime.</p>
        </div>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="err">{error}</div>}

        <div className="grid">
          {PLANS.map((plan) => (
            <div key={plan.key} className={`card${plan.popular ? " popular" : ""}`}>
              {plan.popular && <span className="badge">Most Popular</span>}
              <div className="name">{plan.name}</div>
              {plan.price ? (
                <div className="price-row"><span className="cur">$</span><span className="amt">{plan.price}</span></div>
              ) : (
                <div className="free">Free</div>
              )}
              <div className="period">{plan.period}</div>
              <p className="desc">{plan.desc}</p>
              <div className="div" />
              <ul className="feats">
                {plan.feats.map((f) => (
                  <li key={f}><span className="chk">✓</span>{f}</li>
                ))}
              </ul>
              <button
                className={`btn ${plan.popular ? "btn-fill" : "btn-outline"}`}
                onClick={() => handleSelect(plan)}
                disabled={busyPlan === plan.key}
              >
                {busyPlan === plan.key ? "Opening checkout…" : plan.cta}
              </button>
              {plan.key === "pro" && (
                <div className="enterprise">
                  Multiple locations or enterprise needs?{" "}
                  <a href="mailto:revuly.support@gmail.com">Contact us →</a>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="foot-note">Secure payments by Paddle · Prices in USD · VAT/sales tax handled at checkout.</p>
      </div>
    </>
  );
}
