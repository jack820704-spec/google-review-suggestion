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
  .inbound-email-box{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);padding:10px 14px;margin-bottom:14px}
  .inbound-email-addr{flex:1;font-family:monospace;font-size:13px;color:var(--gold-lt);word-break:break-all}
  .btn-copy{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;border:1px solid var(--gold-border);background:transparent;color:var(--gold);transition:all .2s;white-space:nowrap}
  .btn-copy:hover{background:rgba(201,168,76,.1)}
  .inbound-steps{margin:0;padding:0 0 0 18px;font-size:13px;color:var(--text2);line-height:2}
  .inbound-steps li{margin:0}

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
    /* Email inbound box: better wrap */
    .inbound-email-box{flex-direction:column;align-items:stretch;gap:8px;padding:12px}
    .btn-copy{width:100%}
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

const INBOUND_DOMAIN = process.env.NEXT_PUBLIC_INBOUND_EMAIL_DOMAIN || "revuly.dev";

// Stable Google Maps URL for any place_id — Google redirects this to the canonical listing.
const mapsUrlFor = (placeId) => `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId || "")}`;

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [newKw, setNewKw] = useState("");
  const [placesQuery, setPlacesQuery] = useState("");
  const [placesResults, setPlacesResults] = useState(null); // null = not searched, [] = no matches
  const [placesSearching, setPlacesSearching] = useState(false);
  const [placesSaving, setPlacesSaving] = useState(false);
  const [placesError, setPlacesError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const derived = `user-${user.id}@${INBOUND_DOMAIN}`;
      // Persist derived inbound_email if it's missing or stale
      if (data && data.inbound_email !== derived) {
        await supabase.from("profiles").update({ inbound_email: derived }).eq("id", user.id);
      }
      setProfile({ ...(data || {}), inbound_email: derived });
      setLoading(false);
    });
  }, []);

  const update = (key, val) => setProfile((p) => ({ ...p, [key]: val }));
  const planKey = profile?.plan || "free_trial";
  const plan = getPlan(planKey);
  const pct = usagePercent(planKey, profile?.used_count || 0);
  const canCustomKw = canUseFeature(planKey, "custom_keywords");

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

  const inboundEmail = userId ? `user-${userId}@${INBOUND_DOMAIN}` : "";
  const copyInbound = () => {
    navigator.clipboard.writeText(inboundEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* INBOUND EMAIL FORWARDING */}
        <div className="section">
          <div className="section-header">Auto-Import via Email Forwarding</div>
          <div className="card">
            <p style={{fontSize:13.5,color:"var(--text2)",marginBottom:14,lineHeight:1.6}}>
              Forward your Google review notification emails to your unique Revuly address below.
              Each new review is parsed automatically, three AI reply suggestions are generated, and
              we email them straight to you.
            </p>
            <div className="inbound-email-box">
              <span className="inbound-email-addr">{inboundEmail}</span>
              <button className="btn-copy" onClick={copyInbound}>{copied ? "Copied ✓" : "Copy"}</button>
            </div>
            <p style={{fontSize:12,fontWeight:700,letterSpacing:".3px",color:"var(--text3)",textTransform:"uppercase",marginBottom:8}}>Gmail Setup (recommended)</p>
            <ol className="inbound-steps">
              <li>Open <strong style={{color:"var(--text1)"}}>Gmail → ⚙️ Settings → See all settings → Forwarding and POP/IMAP</strong></li>
              <li>Click <strong style={{color:"var(--text1)"}}>Add a forwarding address</strong> and paste the address above, then confirm via the verification email we forward back to you</li>
              <li>Go to the <strong style={{color:"var(--text1)"}}>Filters and Blocked Addresses</strong> tab and click <strong style={{color:"var(--text1)"}}>Create a new filter</strong></li>
              <li>Set <em style={{color:"var(--text2)"}}>From: noreply-business-profile@google.com</em> and <em style={{color:"var(--text2)"}}>Subject contains: review</em>, then click <strong style={{color:"var(--text1)"}}>Create filter</strong></li>
              <li>Choose <strong style={{color:"var(--text1)"}}>Forward it to:</strong> and select your Revuly address — done. New Google reviews now flow into Revuly automatically.</li>
            </ol>
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
