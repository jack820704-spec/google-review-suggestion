"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--neg:#e06060}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;min-height:100vh}
  .layout{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
  @media(max-width:800px){.layout{grid-template-columns:1fr}}

  /* LEFT BRAND PANEL */
  .brand-panel{background:linear-gradient(160deg,#111116,#0a0a0b);border-right:1px solid rgba(201,168,76,.12);padding:36px 44px 28px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;min-height:100vh}
  @media(max-width:800px){.brand-panel{display:none}}
  .brand-panel::before{content:'';position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.1),transparent 70%);pointer-events:none}
  .brand-panel::after{content:'';position:absolute;bottom:-120px;left:-80px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.05),transparent 70%);pointer-events:none}
  .logo{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:9px;text-decoration:none;position:relative;z-index:1}
  .logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}

  .brand-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:28px 0;position:relative;z-index:1}
  .brand-body h2{font-family:'Playfair Display',serif;font-size:clamp(26px,2.8vw,34px);font-weight:900;line-height:1.2;margin-bottom:14px}
  .brand-accent{background:linear-gradient(135deg,var(--gold-lt),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .brand-body p.brand-lead{font-size:14.5px;color:var(--text2);line-height:1.7;margin-bottom:26px}

  /* Six-feature checklist — tighter row so the testimonial + CTA fit below */
  .brand-feats{display:flex;flex-direction:column;gap:11px;margin-bottom:24px}
  .brand-feat{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--text2);line-height:1.5}
  .feat-icon{width:28px;height:28px;border-radius:7px;background:rgba(201,168,76,.1);border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--gold-lt);flex-shrink:0}
  .brand-feat strong{color:var(--text1);font-weight:600}

  /* Testimonial card */
  .brand-testi{background:rgba(255,255,255,.025);border:1px solid rgba(201,168,76,.18);border-radius:12px;padding:18px 20px;margin-bottom:18px;position:relative}
  .brand-testi::before{content:"\\201C";position:absolute;top:-6px;left:14px;font-family:'Playfair Display',serif;font-size:48px;color:var(--gold-dim);line-height:1;opacity:.55}
  .testi-stars{color:var(--gold);letter-spacing:2px;font-size:12px;margin-bottom:8px}
  .testi-quote{font-size:13.5px;color:var(--text1);font-style:italic;line-height:1.6;margin-bottom:10px}
  .testi-author{display:flex;align-items:center;gap:10px}
  .testi-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--gold));display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#000;flex-shrink:0}
  .testi-meta-name{font-size:12.5px;color:var(--text1);font-weight:700;line-height:1.2}
  .testi-meta-role{font-size:11.5px;color:var(--text3);margin-top:1px}

  /* "See full product tour" CTA */
  .brand-tour-btn{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:10px 18px;border-radius:9px;border:1px solid var(--gold-border);background:rgba(201,168,76,.06);color:var(--gold-lt);font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;transition:all .2s;letter-spacing:.2px}
  .brand-tour-btn:hover{background:rgba(201,168,76,.12);border-color:var(--gold);transform:translateY(-1px)}

  .brand-footer{font-size:12px;color:var(--text3);position:relative;z-index:1}

  /* RIGHT FORM PANEL */
  .form-panel{display:flex;align-items:center;justify-content:center;padding:48px 6vw;background:var(--bg)}
  .form-inner{width:100%;max-width:400px}
  .form-logo-mobile{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold-lt);display:none;align-items:center;gap:9px;margin-bottom:32px;text-decoration:none}
  @media(max-width:800px){.form-logo-mobile{display:flex}}
  .form-logo-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}
  .form-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:6px}
  .form-sub{font-size:14px;color:var(--text2);margin-bottom:32px}
  .form-sub a{color:var(--gold);text-decoration:none;font-weight:600}
  .form-sub a:hover{text-decoration:underline}

  .form-group{margin-bottom:16px}
  .form-group label{display:block;font-size:12.5px;font-weight:600;color:var(--text2);letter-spacing:.3px;margin-bottom:7px;text-transform:uppercase}
  .form-input{width:100%;padding:11px 14px;background:var(--surface);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:14.5px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .form-input:focus{border-color:var(--gold-border)}
  .form-input::placeholder{color:var(--text3)}

  .btn-submit{width:100%;padding:13px;border-radius:var(--r);font-size:15px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 3px 14px rgba(201,168,76,.3);margin-top:8px}
  .btn-submit:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.45)}
  .btn-submit:disabled{opacity:.6;cursor:not-allowed;transform:none}

  .divider{display:flex;align-items:center;gap:12px;margin:20px 0}
  .div-line{flex:1;height:1px;background:rgba(255,255,255,.08)}
  .div-text{font-size:12px;color:var(--text3);font-weight:500;letter-spacing:.5px}

  .btn-google{width:100%;padding:12px;border-radius:var(--r);font-size:14px;font-weight:600;font-family:inherit;color:var(--text1);background:var(--surface);border:1px solid rgba(255,255,255,.12);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px}
  .btn-google:hover{border-color:var(--gold-border);background:rgba(201,168,76,.05)}
  .google-icon{width:18px;height:18px}

  .error-msg{padding:10px 14px;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.3);border-radius:8px;font-size:13.5px;color:var(--neg);margin-bottom:16px}
  .success-msg{padding:10px 14px;background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.3);border-radius:8px;font-size:13.5px;color:#5dba7a;margin-bottom:16px}
  .form-toggle{text-align:center;margin-top:20px;font-size:13.5px;color:var(--text2)}
  .form-toggle button{background:none;border:none;color:var(--gold);font-weight:600;cursor:pointer;font-size:13.5px;font-family:inherit}
  .form-toggle button:hover{text-decoration:underline}
  .form-footer{margin-top:28px;text-align:center;font-size:12px;color:var(--text3)}
  .form-footer a{color:var(--text3);text-decoration:none}
  .form-footer a:hover{color:var(--gold)}
  /* Persistent "Back to home" link above the form title */
  .back-to-home{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--text2);text-decoration:none;font-weight:600;margin-bottom:22px;transition:color .2s}
  .back-to-home:hover{color:var(--gold-lt)}
  /* Mobile-only "Learn more about Revuly" CTA at the bottom of the form panel */
  .mobile-tour-cta{display:none;margin-top:24px;padding:14px 18px;background:rgba(201,168,76,.06);border:1px solid var(--gold-border);border-radius:10px;text-align:center;text-decoration:none;color:var(--gold-lt);font-size:13.5px;font-weight:700;transition:all .2s}
  .mobile-tour-cta:hover{background:rgba(201,168,76,.12)}

  /* ════════════ MOBILE (≤ 800px) ════════════ */
  @media (max-width: 800px) {
    .form-panel{padding:28px 6vw 36px}
    .form-title{font-size:24px}
    .form-sub{font-size:13.5px;margin-bottom:22px}
    .form-input{padding:11px 13px;font-size:14px}
    .btn-submit{padding:12px;font-size:14.5px}
    .btn-google{padding:11px;font-size:13.5px}
    .back-to-home{margin-bottom:18px}
    .mobile-tour-cta{display:block}
  }
  /* iPhone SE-class — keep form inputs comfortable at 320–375px */
  @media (max-width: 380px) {
    .form-panel{padding:24px 5vw 32px}
    .form-title{font-size:22px}
    .form-input{padding:10px 12px}
    .btn-submit{padding:11px;font-size:14px}
    .form-logo-mobile{margin-bottom:24px;font-size:18px}
    .form-logo-icon{width:26px;height:26px;font-size:12px}
    .mobile-tour-cta{padding:12px 14px;font-size:13px}
  }
`;

// Six product highlights — matches the brief. Compact single-line copy
// so all six fit comfortably alongside the testimonial + CTA below.
const BRAND_FEATS = [
  { icon: "✦", label: "Auto-detect new Google reviews" },
  { icon: "◉", label: "AI reply suggestions in seconds" },
  { icon: "◈", label: "Three reply styles — sounds like you" },
  { icon: "⚠", label: "Crisis alerts & weekly reports" },
  { icon: "▦", label: "Keyword Intelligence analytics" },
  { icon: "⬡", label: "Competitor tracking (Pro)" },
];

const TESTIMONIAL = {
  quote:
    "We used to spend an hour every day writing review replies. With Revuly, it's three minutes — and the replies sound more like us than what we used to write ourselves.",
  name: "Marcus Renaud",
  role: "Owner, Maison Renaud · Paris",
  initials: "MR",
};

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  // Where to land after a successful login. Defaults to the dashboard, but a
  // ?next=… param (e.g. resuming Paddle checkout from /pricing) takes priority.
  const nextDest = () => {
    if (typeof window === "undefined") return "/dashboard";
    const n = new URL(window.location.href).searchParams.get("next");
    return n && n.startsWith("/") ? n : "/dashboard";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = nextDest();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (err) throw err;
        if (data.user) {
          // Create profile row
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: name,
            plan: "free_trial",
            used_count: 0,
          });
          setSuccess("Account created! Taking you to your dashboard…");
          setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    // Use the configured app URL so the callback always lands on the canonical
    // host (https://revuly.dev) — avoids www vs apex cookie/redirect mismatches.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/api/auth/google/callback` },
    });
    if (err) setError(err.message);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="login" />
      <div className="layout">
        {/* LEFT: BRAND PANEL (hidden on mobile) */}
        <div className="brand-panel">
          <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
          <div className="brand-body">
            <h2>The Reputation Platform for <span className="brand-accent">Elite Hospitality</span></h2>
            <p className="brand-lead">Join 10,000+ restaurants using AI to craft perfect Google review replies — and turn guest feedback into lasting loyalty.</p>

            <div className="brand-feats">
              {BRAND_FEATS.map((f) => (
                <div key={f.label} className="brand-feat">
                  <span className="feat-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="brand-testi">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-quote">"{TESTIMONIAL.quote}"</div>
              <div className="testi-author">
                <div className="testi-avatar">{TESTIMONIAL.initials}</div>
                <div>
                  <div className="testi-meta-name">{TESTIMONIAL.name}</div>
                  <div className="testi-meta-role">{TESTIMONIAL.role}</div>
                </div>
              </div>
            </div>

            <a className="brand-tour-btn" href="/tour">
              See full product tour →
            </a>
          </div>
          <div className="brand-footer">© 2026 Revuly Inc. · <a href="/privacy" style={{color:"inherit",textDecoration:"none"}}>Privacy</a> · <a href="/terms" style={{color:"inherit",textDecoration:"none"}}>Terms</a></div>
        </div>

        {/* RIGHT: FORM PANEL */}
        <div className="form-panel">
          <div className="form-inner">
            <a className="form-logo-mobile" href="/"><span className="form-logo-icon">✦</span>Revuly</a>
            <a className="back-to-home" href="/">← Back to home</a>
            <h1 className="form-title">{mode === "login" ? "Welcome back" : "Start your free trial"}</h1>
            <p className="form-sub">{mode === "login" ? "Don't have an account? " : "Already have an account? "}<a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Sign up free" : "Log in"}</a></p>

            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="form-group">
                  <label>Your Name</label>
                  <input className="form-input" type="text" placeholder="Marcus Renaud" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-input" type="email" placeholder="marcus@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account — Free 14-Day Trial"}
              </button>
            </form>

            <div className="divider"><div className="div-line" /><span className="div-text">OR</span><div className="div-line" /></div>

            <button className="btn-google" onClick={handleGoogle}>
              <svg className="google-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="form-toggle">
              {mode === "signup" && "By signing up, you agree to our "}
              {mode === "signup" && <><a href="/terms" style={{color:"var(--gold)",textDecoration:"none"}}>Terms</a> and <a href="/privacy" style={{color:"var(--gold)",textDecoration:"none"}}>Privacy Policy</a></>}
            </div>
            <div className="form-footer"><a href="/">← Back to Revuly.com</a></div>

            {/* Mobile-only — desktop already has the brand panel with this link */}
            <a className="mobile-tour-cta" href="/tour">Learn more about Revuly →</a>
          </div>
        </div>
      </div>
    </>
  );
}
