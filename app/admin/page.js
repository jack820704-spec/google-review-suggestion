"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--neg:#e06060;--pos:#5dba7a;--warn:#e8b84b}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:sticky;top:0;z-index:20}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .topbar-right{display:flex;align-items:center;gap:10px}
  .admin-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(224,96,96,.15);border:1px solid rgba(224,96,96,.3);color:var(--neg);letter-spacing:.5px}
  .lang-toggle{height:30px;padding:0 10px;border-radius:7px;border:1px solid var(--gold-border);background:transparent;color:var(--text2);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s}
  .lang-toggle:hover{border-color:var(--gold);color:var(--gold-lt)}
  .btn-logout{padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px}
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
  table{width:100%;border-collapse:collapse;min-width:840px}
  th{padding:11px 14px;text-align:left;font-size:11.5px;font-weight:700;color:var(--text2);background:var(--surface);letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap}
  td{padding:12px 14px;font-size:13.5px;color:var(--text2);border-bottom:1px solid rgba(255,255,255,.04)}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.02)}
  .checkbox{width:15px;height:15px;cursor:pointer;accent-color:var(--gold)}
  .plan-tag{padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.4px;white-space:nowrap}
  .plan-free_trial{background:rgba(90,85,80,.2);border:1px solid rgba(90,85,80,.3);color:var(--text3)}
  .plan-starter{background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--gold)}
  .plan-growth{background:rgba(93,186,122,.1);border:1px solid rgba(93,186,122,.25);color:var(--pos)}
  .plan-pro{background:rgba(201,168,76,.18);border:1px solid var(--gold-border);color:var(--gold-lt)}
  .plan-select{padding:4px 8px;background:var(--bg2);border:1px solid rgba(255,255,255,.1);border-radius:6px;font-size:12.5px;font-family:inherit;color:var(--text1);cursor:pointer}
  .exp-red{color:var(--neg);font-weight:600;white-space:nowrap}
  .exp-yellow{color:var(--warn);font-weight:600;white-space:nowrap}
  .exp-muted{color:var(--text3);white-space:nowrap}
  .actions-cell{display:flex;gap:6px;align-items:center;white-space:nowrap}
  .btn-revoke{padding:4px 11px;border-radius:6px;font-size:12px;font-weight:600;font-family:inherit;border:1px solid rgba(224,96,96,.35);background:rgba(224,96,96,.06);color:var(--neg);cursor:pointer;transition:all .2s;white-space:nowrap}
  .btn-revoke:hover{background:rgba(224,96,96,.14)}
  .btn-disable{padding:4px 11px;border-radius:6px;font-size:12px;font-weight:600;font-family:inherit;border:1px solid rgba(224,96,96,.3);background:transparent;color:var(--neg);cursor:pointer;transition:all .2s}
  .btn-disable:hover{background:rgba(224,96,96,.1)}
  .btn-enable{padding:4px 11px;border-radius:6px;font-size:12px;font-weight:600;font-family:inherit;border:1px solid rgba(93,186,122,.3);background:transparent;color:var(--pos);cursor:pointer;transition:all .2s}
  .btn-enable:hover{background:rgba(93,186,122,.1)}
  .disabled-row td{opacity:.5}
  .loading{padding:60px;text-align:center;color:var(--text3)}

  /* Batch action bar */
  .batch-bar{position:sticky;top:58px;z-index:15;display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--surface);border:1px solid var(--gold-border);border-radius:var(--r);padding:12px 16px;margin-bottom:16px;box-shadow:0 6px 24px rgba(0,0,0,.3)}
  .batch-count{font-size:13px;font-weight:700;color:var(--gold-lt)}
  .btn-batch-revoke{padding:6px 14px;border-radius:7px;font-size:12.5px;font-weight:700;font-family:inherit;border:1px solid rgba(224,96,96,.35);background:transparent;color:var(--neg);cursor:pointer}
  .btn-batch-revoke:hover{background:rgba(224,96,96,.1)}
  .btn-clear{margin-left:auto;background:transparent;border:none;color:var(--text2);font-size:18px;cursor:pointer;font-family:inherit;line-height:1}

  /* Confirm modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
  .modal{background:var(--surface);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:26px;width:100%;max-width:440px}
  .modal h3{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;margin-bottom:12px}
  .modal p{font-size:14.5px;color:var(--text1);line-height:1.6;margin-bottom:8px}
  .modal .exp-line{font-size:13px;color:var(--gold-lt);margin-bottom:20px}
  .modal-err{font-size:13px;color:var(--neg);margin-bottom:14px}
  .modal-actions{display:flex;gap:10px;margin-top:4px}
  .modal-cancel{flex:1;padding:11px;border-radius:9px;font-size:14px;font-weight:600;font-family:inherit;background:transparent;color:var(--text2);border:1px solid rgba(255,255,255,.12);cursor:pointer}
  .modal-cancel:hover{border-color:var(--gold-border);color:var(--text1)}
  .modal-confirm{flex:1;padding:11px;border-radius:9px;font-size:14px;font-weight:700;font-family:inherit;color:#000;background:linear-gradient(135deg,var(--gold-lt),var(--gold));border:none;cursor:pointer}
  .modal-confirm.danger{background:linear-gradient(135deg,#e06060,#b84444);color:#fff}
  .modal-confirm:disabled{opacity:.6;cursor:not-allowed}

  @media(max-width:768px){
    .wrap{padding:24px 4vw 60px}
    .page-title{font-size:24px}
    .stat-grid{grid-template-columns:repeat(2,1fr)}
    .batch-bar{top:54px}
    .topbar{height:54px;padding:0 14px}
  }
`;

const PLAN_OPTS = ["free_trial", "starter", "growth", "pro"];
const PAID_OPTS = ["starter", "growth", "pro"];

const T = {
  en: {
    logout: "Logout",
    title: "Admin Dashboard",
    sub: "User management and platform overview.",
    total_users: "Total Users", new_month: "New This Month", paid_users: "Paid Users", mrr: "Est. MRR", on_trial: "On Trial",
    user_mgmt: "User Management",
    loading: "Loading users…",
    th_email: "Email", th_rest: "Restaurant", th_plan: "Plan", th_expires: "Expires", th_replies: "Replies", th_joined: "Joined", th_change: "Change Plan", th_actions: "Actions",
    revoke: "Revoke Plan", enable: "Enable", disable: "Disable",
    none: "—",
    exp_expired: "expired",
    exp_days: (n) => `${n}d left`,
    confirm: "Confirm", cancel: "Cancel", working: "Working…",
    set_q: (email, plan) => `Set ${email} to ${plan} for 1 month?`,
    set_q_many: (n, plan) => `Set ${n} users to ${plan} for 1 month?`,
    plan_expires: (d) => `Plan expires: ${d}`,
    revoke_q: (email) => `Downgrade ${email} to Free Trial?`,
    revoke_q_many: (n) => `Downgrade ${n} users to Free Trial?`,
    selected: (n) => `${n} selected`,
    batch_apply_ph: "Upgrade to…",
    batch_revoke: "Revoke to Free Trial",
  },
  zh: {
    logout: "登出",
    title: "管理後台",
    sub: "用戶管理與平台總覽。",
    total_users: "總用戶", new_month: "本月新增", paid_users: "付費用戶", mrr: "預估月營收", on_trial: "試用中",
    user_mgmt: "用戶管理",
    loading: "載入用戶中…",
    th_email: "Email", th_rest: "餐廳", th_plan: "方案", th_expires: "到期日", th_replies: "已用", th_joined: "加入", th_change: "變更方案", th_actions: "操作",
    revoke: "取消方案", enable: "啟用", disable: "停用",
    none: "—",
    exp_expired: "已過期",
    exp_days: (n) => `剩 ${n} 天`,
    confirm: "確認", cancel: "取消", working: "處理中…",
    set_q: (email, plan) => `將 ${email} 設為 ${plan}（1 個月）？`,
    set_q_many: (n, plan) => `將 ${n} 位用戶設為 ${plan}（1 個月）？`,
    plan_expires: (d) => `方案到期：${d}`,
    revoke_q: (email) => `將 ${email} 降回 Free Trial？`,
    revoke_q_many: (n) => `將 ${n} 位用戶降回 Free Trial？`,
    selected: (n) => `已選 ${n} 位`,
    batch_apply_ph: "升級至…",
    batch_revoke: "降回 Free Trial",
  },
};

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLangRaw] = useState("en");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null); // { userIds, plan, label, expiresAt, isMany }
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const supabase = createClient();
  const t = T[lang];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("revuly-lang");
      if (saved === "zh" || saved === "en") setLangRaw(saved);
    } catch {}
    loadUsers();
  }, []);

  const setLang = (next) => {
    setLangRaw(next);
    try { window.localStorage.setItem("revuly-lang", next); } catch {}
  };
  const toggleLang = () => setLang(lang === "en" ? "zh" : "en");

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  const oneMonthOut = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); };

  // ── Open confirm modals ──
  const openSet = (u, plan) => setConfirmModal({ userIds: [u.id], plan, label: u.email, expiresAt: oneMonthOut(), isMany: false });
  const openRevoke = (u) => setConfirmModal({ userIds: [u.id], plan: "free_trial", label: u.email, expiresAt: null, isMany: false });
  const openBatchSet = (plan) => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ userIds: [...selectedIds], plan, label: t.selected(selectedIds.size), expiresAt: oneMonthOut(), isMany: true });
  };
  const openBatchRevoke = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ userIds: [...selectedIds], plan: "free_trial", label: t.selected(selectedIds.size), expiresAt: null, isMany: true });
  };

  const closeModal = () => { setConfirmModal(null); setModalError(""); };

  // ── Apply via the admin API (verifies admin + writes audit log) ──
  const doConfirm = async () => {
    if (!confirmModal) return;
    setBusy(true); setModalError("");
    try {
      const res = await fetch("/api/admin/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: confirmModal.userIds, plan: confirmModal.plan, duration: 1 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setModalError(data.error || "Failed to update plan"); return; }

      const expiresAt = data.plan_expires_at || null;
      const status = confirmModal.plan === "free_trial" ? null : "active";
      const ids = new Set(confirmModal.userIds);
      setUsers((prev) => prev.map((u) =>
        ids.has(u.id) ? { ...u, plan: confirmModal.plan, plan_expires_at: expiresAt, subscription_status: status } : u
      ));
      setSelectedIds(new Set());
      closeModal();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleDisable = async (userId, disabled) => {
    await supabase.from("profiles").update({ disabled: !disabled }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, disabled: !disabled } : u));
  };

  // ── Selection helpers ──
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(users.map((u) => u.id)));

  // ── Expiry display ──
  const expiryCell = (u) => {
    const plan = u.plan || "free_trial";
    if (plan === "free_trial" || !u.plan_expires_at) return <span className="exp-muted">{t.none}</span>;
    const days = Math.ceil((new Date(u.plan_expires_at).getTime() - Date.now()) / 86400000);
    const date = fmtDate(u.plan_expires_at);
    if (days < 0) return <span className="exp-red">{date} · {t.exp_expired}</span>;
    if (days <= 7) return <span className="exp-yellow">{date} · {t.exp_days(days)}</span>;
    return <span style={{ color: "var(--text2)" }}>{date}</span>;
  };

  const planCounts = PLAN_OPTS.reduce((acc, p) => { acc[p] = users.filter((u) => u.plan === p).length; return acc; }, {});
  const totalRevenue = users.reduce((s, u) => s + (getPlan(u.plan).price || 0), 0);
  const thisMonth = users.filter((u) => { if (!u.created_at) return false; const d = new Date(u.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;

  const modalMessage = confirmModal
    ? (confirmModal.plan === "free_trial"
        ? (confirmModal.isMany ? t.revoke_q_many(confirmModal.userIds.length) : t.revoke_q(confirmModal.label))
        : (confirmModal.isMany ? t.set_q_many(confirmModal.userIds.length, getPlan(confirmModal.plan).name) : t.set_q(confirmModal.label, getPlan(confirmModal.plan).name)))
    : "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="admin" />
      <div className="topbar">
        <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly</a>
        <div className="topbar-right">
          <span className="admin-badge">ADMIN</span>
          <button className="lang-toggle" onClick={toggleLang}>{lang === "en" ? "中文" : "EN"}</button>
          <button className="btn-logout" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>{t.logout}</button>
        </div>
      </div>

      <div className="wrap">
        <h1 className="page-title">{t.title}</h1>
        <p className="page-sub">{t.sub}</p>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-n">{users.length}</div><div className="stat-l">{t.total_users}</div></div>
          <div className="stat-card"><div className="stat-n">{thisMonth}</div><div className="stat-l">{t.new_month}</div></div>
          <div className="stat-card"><div className="stat-n">{planCounts.growth + planCounts.pro}</div><div className="stat-l">{t.paid_users}</div></div>
          <div className="stat-card"><div className="stat-n gold">${totalRevenue.toLocaleString()}</div><div className="stat-l">{t.mrr}</div></div>
          <div className="stat-card"><div className="stat-n">{planCounts.free_trial}</div><div className="stat-l">{t.on_trial}</div></div>
        </div>

        <div className="section-header">{t.user_mgmt}</div>

        {selectedIds.size > 0 && (
          <div className="batch-bar">
            <span className="batch-count">{t.selected(selectedIds.size)}</span>
            <select
              className="plan-select"
              value=""
              onChange={(e) => { if (e.target.value) openBatchSet(e.target.value); e.target.value = ""; }}
            >
              <option value="">{t.batch_apply_ph}</option>
              {PAID_OPTS.map((p) => <option key={p} value={p}>{getPlan(p).name}</option>)}
            </select>
            <button className="btn-batch-revoke" onClick={openBatchRevoke}>{t.batch_revoke}</button>
            <button className="btn-clear" onClick={() => setSelectedIds(new Set())} aria-label="Clear selection">✕</button>
          </div>
        )}

        {loading ? <div className="loading">{t.loading}</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" className="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" /></th>
                  <th>{t.th_email}</th><th>{t.th_rest}</th><th>{t.th_plan}</th><th>{t.th_expires}</th><th>{t.th_replies}</th><th>{t.th_joined}</th><th>{t.th_change}</th><th>{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.disabled ? "disabled-row" : ""}>
                    <td><input type="checkbox" className="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} aria-label={`Select ${u.email}`} /></td>
                    <td>{u.email}</td>
                    <td>{u.restaurant_name || <span style={{color:"var(--text3)"}}>{t.none}</span>}</td>
                    <td><span className={`plan-tag plan-${u.plan || "free_trial"}`}>{getPlan(u.plan).name}</span></td>
                    <td>{expiryCell(u)}</td>
                    <td>{u.used_count || 0}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US",{month:"short",day:"numeric",year:"2-digit"}) : t.none}</td>
                    <td>
                      <select
                        className="plan-select"
                        value={u.plan || "free_trial"}
                        onChange={(e) => {
                          const np = e.target.value;
                          if (np === (u.plan || "free_trial")) return;
                          if (np === "free_trial") openRevoke(u); else openSet(u, np);
                        }}
                      >
                        {PLAN_OPTS.map((p) => <option key={p} value={p}>{getPlan(p).name}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {(u.plan && u.plan !== "free_trial") && (
                          <button className="btn-revoke" onClick={() => openRevoke(u)}>{t.revoke}</button>
                        )}
                        <button className={u.disabled ? "btn-enable" : "btn-disable"} onClick={() => toggleDisable(u.id, u.disabled)}>
                          {u.disabled ? t.enable : t.disable}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{getPlan(confirmModal.plan).name === "Free Trial" ? t.revoke : t.th_change}</h3>
            <p>{modalMessage}</p>
            {confirmModal.expiresAt && <div className="exp-line">{t.plan_expires(fmtDate(confirmModal.expiresAt))}</div>}
            {modalError && <div className="modal-err">{modalError}</div>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeModal} disabled={busy}>{t.cancel}</button>
              <button
                className={`modal-confirm${confirmModal.plan === "free_trial" ? " danger" : ""}`}
                onClick={doConfirm}
                disabled={busy}
              >
                {busy ? t.working : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
