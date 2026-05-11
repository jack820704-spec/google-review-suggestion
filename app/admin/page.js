"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--neg:#e06060;--pos:#5dba7a}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:sticky;top:0;z-index:10}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .admin-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(224,96,96,.15);border:1px solid rgba(224,96,96,.3);color:var(--neg);letter-spacing:.5px}
  .wrap{max-width:1100px;margin:0 auto;padding:32px 6vw 80px}
  .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:4px}
  .page-sub{font-size:14px;color:var(--text2);margin-bottom:32px}
  .stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:32px}
  @media(max-width:900px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
  .stat-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:16px}
  .stat-n{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--text1)}
  .stat-n.gold{color:var(--gold-lt)}
  .stat-l{font-size:12px;color:var(--text2);margin-top:3px}
  .section-header{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
  .table-wrap{overflow-x:auto;border-radius:var(--r);border:1px solid rgba(255,255,255,.06)}
  table{width:100%;border-collapse:collapse}
  th{padding:11px 14px;text-align:left;font-size:11.5px;font-weight:700;color:var(--text2);background:var(--surface);letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)}
  td{padding:12px 14px;font-size:13.5px;color:var(--text2);border-bottom:1px solid rgba(255,255,255,.04)}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.02)}
  .plan-tag{padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.4px}
  .plan-free_trial{background:rgba(90,85,80,.2);border:1px solid rgba(90,85,80,.3);color:var(--text3)}
  .plan-starter{background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--gold)}
  .plan-growth{background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.25);color:var(--pos)}
  .plan-pro{background:rgba(201,168,76,.18);border:1px solid var(--gold-border);color:var(--gold-lt)}
  .plan-select{padding:4px 8px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:6px;font-size:12.5px;font-family:inherit;color:var(--text1);cursor:pointer}
  .btn-disable{padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;font-family:inherit;border:1px solid rgba(224,96,96,.3);background:transparent;color:var(--neg);cursor:pointer;transition:all .2s}
  .btn-disable:hover{background:rgba(224,96,96,.1)}
  .btn-enable{padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;font-family:inherit;border:1px solid rgba(93,186,122,.3);background:transparent;color:var(--pos);cursor:pointer;transition:all .2s}
  .btn-enable:hover{background:rgba(93,186,122,.1)}
  .disabled-row td{opacity:.5}
  .loading{padding:60px;text-align:center;color:var(--text3)}
`;

const PLAN_OPTS = ["free_trial","starter","growth","pro"];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const updatePlan = async (userId, plan) => {
    await supabase.from("profiles").update({ plan }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
  };

  const toggleDisable = async (userId, disabled) => {
    await supabase.from("profiles").update({ disabled: !disabled }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, disabled: !disabled } : u));
  };

  const planCounts = PLAN_OPTS.reduce((acc, p) => { acc[p] = users.filter((u) => u.plan === p).length; return acc; }, {});
  const totalRevenue = users.reduce((s, u) => s + (getPlan(u.plan).price || 0), 0);
  const thisMonth = users.filter((u) => { if (!u.created_at) return false; const d = new Date(u.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="topbar">
        <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly</a>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span className="admin-badge">ADMIN</span>
          <button style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"var(--text2)",cursor:"pointer",fontFamily:"inherit",fontSize:13}} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>Logout</button>
        </div>
      </div>

      <div className="wrap">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">User management and platform overview.</p>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-n">{users.length}</div><div className="stat-l">Total Users</div></div>
          <div className="stat-card"><div className="stat-n">{thisMonth}</div><div className="stat-l">New This Month</div></div>
          <div className="stat-card"><div className="stat-n">{planCounts.growth + planCounts.pro}</div><div className="stat-l">Paid Users</div></div>
          <div className="stat-card"><div className="stat-n gold">${totalRevenue.toLocaleString()}</div><div className="stat-l">Est. MRR</div></div>
          <div className="stat-card"><div className="stat-n">{planCounts.free_trial}</div><div className="stat-l">On Trial</div></div>
        </div>

        <div className="section-header">User Management</div>

        {loading ? <div className="loading">Loading users…</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th><th>Restaurant</th><th>Plan</th><th>Replies Used</th><th>Joined</th><th>Change Plan</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.disabled ? "disabled-row" : ""}>
                    <td>{u.email}</td>
                    <td>{u.restaurant_name || <span style={{color:"var(--text3)"}}>—</span>}</td>
                    <td><span className={`plan-tag plan-${u.plan || "free_trial"}`}>{getPlan(u.plan).name}</span></td>
                    <td>{u.reply_count || 0}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}) : "—"}</td>
                    <td>
                      <select className="plan-select" value={u.plan || "free_trial"} onChange={(e) => updatePlan(u.id, e.target.value)}>
                        {PLAN_OPTS.map((p) => <option key={p} value={p}>{getPlan(p).name}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className={u.disabled ? "btn-enable" : "btn-disable"} onClick={() => toggleDisable(u.id, u.disabled)}>
                        {u.disabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
