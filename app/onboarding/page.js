"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--neg:#e06060;--pos:#5dba7a}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased;min-height:100vh}
  .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 6vw}
  .logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:9px;text-decoration:none;margin-bottom:40px}
  .logo-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}

  /* PROGRESS */
  .progress-wrap{width:100%;max-width:540px;margin-bottom:40px}
  .progress-labels{display:flex;justify-content:space-between;margin-bottom:10px}
  .prog-label{font-size:12px;font-weight:600;letter-spacing:.3px;color:var(--text3);transition:color .3s}
  .prog-label.active{color:var(--gold)}
  .prog-label.done{color:var(--pos)}
  .progress-bar{height:4px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold-lt));border-radius:999px;transition:width .4s ease}

  /* CARD */
  .card{width:100%;max-width:540px;background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:40px}
  .card-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:8px}
  .card-sub{font-size:14px;color:var(--text2);margin-bottom:32px;line-height:1.6}

  .form-group{margin-bottom:18px}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  label{display:block;font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.3px;text-transform:uppercase;margin-bottom:7px}
  .form-input,.form-select{width:100%;padding:11px 14px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);font-size:14.5px;font-family:inherit;color:var(--text1);outline:none;transition:border-color .2s}
  .form-input:focus,.form-select:focus{border-color:var(--gold-border)}
  .form-input::placeholder{color:var(--text3)}
  .form-select option{background:var(--bg2)}
  .goal-row{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center}
  .goal-sep{font-size:13px;color:var(--text3);text-align:center}

  /* TOGGLE SWITCH */
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

  /* GOOGLE CONNECT */
  .google-card{background:rgba(201,168,76,.05);border:1px solid var(--gold-border);border-radius:var(--r);padding:24px;margin-bottom:20px}
  .google-card h4{font-size:15px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .google-card p{font-size:13.5px;color:var(--text2);line-height:1.65;margin-bottom:16px}
  .btn-connect{width:100%;padding:12px;border-radius:var(--r);font-size:14px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 3px 14px rgba(201,168,76,.28)}
  .btn-connect:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.4)}
  .connect-note{font-size:12px;color:var(--text3);text-align:center;margin-top:10px}
  .connect-note a{color:var(--gold);text-decoration:none}
  .btn-skip{width:100%;padding:11px;border-radius:var(--r);font-size:13.5px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .2s;margin-top:10px}
  .btn-skip:hover{border-color:var(--gold-border);color:var(--text1)}

  /* FREQ SELECTOR */
  .freq-options{display:flex;gap:10px;flex-wrap:wrap}
  .freq-opt{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--text2);transition:all .2s}
  .freq-opt.active{background:rgba(201,168,76,.12);border-color:var(--gold-border);color:var(--gold-lt)}

  /* ACTIONS */
  .actions{display:flex;gap:12px;margin-top:28px;align-items:center}
  .btn-next{flex:1;padding:13px;border-radius:var(--r);font-size:15px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer;transition:all .22s;box-shadow:0 3px 14px rgba(201,168,76,.3)}
  .btn-next:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(201,168,76,.45)}
  .btn-next:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .btn-back{padding:13px 20px;border-radius:var(--r);font-size:15px;font-weight:600;font-family:inherit;color:var(--text2);background:transparent;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .2s}
  .btn-back:hover{border-color:var(--gold-border);color:var(--text1)}
  .error-msg{padding:10px 14px;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.3);border-radius:8px;font-size:13.5px;color:var(--neg);margin-bottom:16px}
`;

const RESTAURANT_TYPES = ["Fine Dining","Casual Dining","Fast Casual","Café","Bar","Bistro","Steakhouse","Seafood","Italian","French","Japanese","Other"];
const FREQ_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Only" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const supabase = createClient();

  const [info, setInfo] = useState({ restaurant_name: "", restaurant_type: "Fine Dining", city: "", country: "", rating_goal: "4.8", rating_goal_months: "6" });
  const [googleConnected, setGoogleConnected] = useState(false);
  const [notif, setNotif] = useState({ email_notifications: true, notification_frequency: "immediately", crisis_alerts: true, weekly_report: false });
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true); setCsvError(""); setCsvResult(null);
    try {
      const text = await csvFile.text();
      const res = await fetch("/api/reviews/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setCsvError(data.error || "Upload failed"); return; }
      setCsvResult(data);
    } catch (e) {
      setCsvError(e.message);
    } finally {
      setCsvUploading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = "/login";
      else setUser(user);
    });
  }, []);

  const pct = ((step - 1) / 2) * 100;

  const handleInfoNext = () => {
    if (!info.restaurant_name || !info.city || !info.country) { setError("Please fill in all required fields."); return; }
    setError(""); setStep(2);
  };

  const handleGoogleConnect = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SUPABASE_URL ? "770454655106-5p8d5f78dobbsmjfq329reqmn19pc5rr.apps.googleusercontent.com" : "",
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/business.manage email profile",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        restaurant_name: info.restaurant_name,
        restaurant_type: info.restaurant_type,
        city: info.city,
        country: info.country,
        rating_goal: parseFloat(info.rating_goal),
        rating_goal_months: parseInt(info.rating_goal_months),
        crisis_alerts: notif.crisis_alerts,
        weekly_report: notif.weekly_report,
        google_connected: googleConnected,
        plan: "free_trial",
        used_count: 0,
      });
      if (upsertError) throw upsertError;

      // Send welcome email
      await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: info.restaurant_name }),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Restaurant Info", "Connect Google", "Notifications"];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="onboarding" />
      <div className="page">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>

        <div className="progress-wrap">
          <div className="progress-labels">
            {stepLabels.map((l, i) => (
              <span key={l} className={`prog-label${step === i+1 ? " active" : step > i+1 ? " done" : ""}`}>{step > i+1 ? "✓ " : ""}{l}</span>
            ))}
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        {error && <div className="error-msg" style={{maxWidth:540,width:"100%",marginBottom:16}}>{error}</div>}

        {/* STEP 1 — RESTAURANT INFO */}
        {step === 1 && (
          <div className="card">
            <h2 className="card-title">Tell us about your restaurant</h2>
            <p className="card-sub">This helps Revuly personalise AI replies to match your establishment's voice and context.</p>
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input className="form-input" placeholder="e.g. Maison Renaud" value={info.restaurant_name} onChange={(e) => setInfo({ ...info, restaurant_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Restaurant Type</label>
              <select className="form-select" value={info.restaurant_type} onChange={(e) => setInfo({ ...info, restaurant_type: e.target.value })}>
                {RESTAURANT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input className="form-input" placeholder="New York" value={info.city} onChange={(e) => setInfo({ ...info, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <input className="form-input" placeholder="United States" value={info.country} onChange={(e) => setInfo({ ...info, country: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Rating Goal</label>
              <div className="goal-row">
                <div>
                  <label style={{marginBottom:6}}>Target Rating</label>
                  <select className="form-select" value={info.rating_goal} onChange={(e) => setInfo({ ...info, rating_goal: e.target.value })}>
                    {["4.5","4.6","4.7","4.8","4.9","5.0"].map((r) => <option key={r} value={r}>{r} ★</option>)}
                  </select>
                </div>
                <div className="goal-sep">within</div>
                <div>
                  <label style={{marginBottom:6}}>Months</label>
                  <select className="form-select" value={info.rating_goal_months} onChange={(e) => setInfo({ ...info, rating_goal_months: e.target.value })}>
                    {["3","6","9","12"].map((m) => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
              </div>
            </div>
            {/* OPTIONAL — Import past Google reviews via CSV */}
            <div style={{marginTop:24,padding:"18px 20px",background:"rgba(201,168,76,.04)",border:"1px dashed var(--gold-border)",borderRadius:"var(--r)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--gold-lt)",marginBottom:6}}>📄 Import past reviews (optional)</div>
              <p style={{fontSize:12.5,color:"var(--text2)",lineHeight:1.6,marginBottom:12}}>
                Have a CSV of your historical Google reviews? Upload it here to seed your dashboard. We'll dedupe and import them in bulk. You can also do this later from the dashboard.
              </p>
              <label style={{display:"inline-block",padding:"8px 14px",borderRadius:8,border:"1px solid var(--gold-border)",color:"var(--gold)",cursor:"pointer",fontSize:12.5,fontWeight:600,background:"transparent"}}>
                {csvFile ? `📎 ${csvFile.name}` : "Choose CSV file"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{display:"none"}}
                  onChange={(e) => { setCsvFile(e.target.files?.[0] || null); setCsvResult(null); setCsvError(""); }}
                />
              </label>
              {csvFile && !csvResult && (
                <button
                  className="btn-next"
                  style={{display:"block",marginTop:10,padding:"8px 14px",fontSize:13}}
                  onClick={handleCsvUpload}
                  disabled={csvUploading}
                >
                  {csvUploading ? "Uploading…" : "Upload CSV"}
                </button>
              )}
              {csvResult && (
                <div style={{marginTop:10,padding:"8px 12px",background:"rgba(93,186,122,.08)",border:"1px solid rgba(93,186,122,.25)",borderRadius:8,fontSize:12.5,color:"var(--pos)"}}>
                  ✓ Imported {csvResult.inserted} new · skipped {csvResult.skipped_duplicates} duplicate{csvResult.skipped_duplicates === 1 ? "" : "s"}
                </div>
              )}
              {csvError && (
                <div style={{marginTop:10,padding:"8px 12px",background:"rgba(224,96,96,.1)",border:"1px solid rgba(224,96,96,.3)",borderRadius:8,fontSize:12.5,color:"var(--neg)"}}>
                  {csvError}
                </div>
              )}
              <a href="/help#csv-import" target="_blank" style={{display:"inline-block",marginTop:8,fontSize:11.5,color:"var(--gold)",textDecoration:"none"}}>
                How to export from Google Maps →
              </a>
            </div>
            <div className="actions"><button className="btn-next" onClick={handleInfoNext}>Continue →</button></div>
          </div>
        )}

        {/* STEP 2 — GOOGLE BUSINESS */}
        {step === 2 && (
          <div className="card">
            <h2 className="card-title">Connect Google Business</h2>
            <p className="card-sub">Link your verified Google Business Profile to start monitoring reviews automatically. You'll need a verified business account.</p>
            <div className="google-card">
              <h4>🔗 Why connect Google Business?</h4>
              <p>Once connected, Revuly will automatically sync new reviews, analyse sentiment, and pre-generate AI reply suggestions — delivered straight to your inbox before you even open the dashboard.</p>
              {!googleConnected ? (
                <>
                  <button className="btn-connect" onClick={handleGoogleConnect}>Connect Google Business Account</button>
                  <p className="connect-note">Don't have a verified account yet? <a href="https://business.google.com" target="_blank">Apply at business.google.com</a> — verification takes 1–2 weeks.</p>
                </>
              ) : (
                <div style={{textAlign:"center",padding:"12px",color:"var(--pos)",fontWeight:600}}>✓ Google Business Connected</div>
              )}
            </div>
            {!googleConnected && <button className="btn-skip" onClick={() => { setStep(3); }}>Skip for now — I'll connect later</button>}
            <div className="actions">
              <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-next" onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — NOTIFICATIONS */}
        {step === 3 && (
          <div className="card">
            <h2 className="card-title">Notification Preferences</h2>
            <p className="card-sub">Choose how and when Revuly keeps you informed. You can change these anytime in Settings.</p>
            <div className="toggle-item">
              <div className="toggle-info"><h4>Email Notifications</h4><p>Receive an email with AI reply suggestions for each new review</p></div>
              <label className="toggle"><input type="checkbox" checked={notif.email_notifications} onChange={(e) => setNotif({ ...notif, email_notifications: e.target.checked })} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            {notif.email_notifications && (
              <div style={{padding:"14px 0"}}>
                <label style={{marginBottom:10}}>Notification Frequency</label>
                <div className="freq-options">
                  {FREQ_OPTIONS.map((o) => (
                    <button key={o.value} className={`freq-opt${notif.notification_frequency===o.value?" active":""}`} onClick={() => setNotif({ ...notif, notification_frequency: o.value })}>{o.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="toggle-item">
              <div className="toggle-info"><h4>🚨 Crisis Alerts</h4><p>Immediate notification when 3+ low-rating reviews appear within 24 hours</p></div>
              <label className="toggle"><input type="checkbox" checked={notif.crisis_alerts} onChange={(e) => setNotif({ ...notif, crisis_alerts: e.target.checked })} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            <div className="toggle-item">
              <div className="toggle-info"><h4>Weekly Report</h4><p>A weekly summary of your review performance, trends, and top keywords</p></div>
              <label className="toggle"><input type="checkbox" checked={notif.weekly_report} onChange={(e) => setNotif({ ...notif, weekly_report: e.target.checked })} /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            <div className="actions">
              <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-next" onClick={handleComplete} disabled={loading}>{loading ? "Setting up…" : "Complete Setup →"}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
