// POST /api/admin/update-plan
// Admin-only manual plan management.
//   body: { user_ids: string[] | user_id: string, plan: "free_trial"|"starter"|"growth"|"pro", duration?: number }
//
// - Verifies the caller is an admin (profiles.role === "admin").
// - Sets the plan for one or many users.
//     paid plan  → plan_expires_at = now() + <duration> months, subscription_status = "active"
//     free_trial → plan_expires_at = NULL, subscription_status = NULL  (revoke / downgrade)
// - Records each change in audit_logs.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

const VALID_PLANS = new Set(["free_trial", "starter", "growth", "pro"]);

export async function POST(req) {
  try {
    // ── Authenticate the caller ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();

    // ── Verify admin role ──
    const { data: me } = await supa
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (me?.role !== "admin") {
      return Response.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }

    // ── Parse + validate ──
    const body = await req.json().catch(() => ({}));
    const plan = body?.plan;
    const duration = Number.isFinite(body?.duration) ? Math.max(1, Math.round(body.duration)) : 1;

    let userIds = [];
    if (Array.isArray(body?.user_ids)) userIds = body.user_ids;
    else if (body?.user_id) userIds = [body.user_id];
    userIds = [...new Set(userIds.filter(Boolean))];

    if (!VALID_PLANS.has(plan)) return Response.json({ error: "Invalid plan" }, { status: 400 });
    if (userIds.length === 0) return Response.json({ error: "No users specified" }, { status: 400 });

    // ── Build the profile update ──
    let update;
    let expiresAt = null;
    if (plan === "free_trial") {
      update = { plan: "free_trial", plan_expires_at: null, subscription_status: null };
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + duration);
      expiresAt = d.toISOString();
      update = { plan, plan_expires_at: expiresAt, subscription_status: "active" };
    }

    const { error: updErr } = await supa.from("profiles").update(update).in("id", userIds);
    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });

    // ── Audit log (one row per affected user; best-effort) ──
    const action = plan === "free_trial" ? "admin_revoke_plan" : "admin_set_plan";
    const rows = userIds.map((tid) => ({
      admin_id: user.id,
      action,
      target_user_id: tid,
      details: {
        plan,
        duration_months: plan === "free_trial" ? null : duration,
        plan_expires_at: expiresAt,
      },
    }));
    try {
      await supa.from("audit_logs").insert(rows);
    } catch (e) {
      console.warn("[admin/update-plan] audit log insert failed:", e.message);
    }

    return Response.json({
      ok: true,
      updated: userIds.length,
      plan,
      plan_expires_at: expiresAt,
      subscription_status: update.subscription_status,
    });
  } catch (err) {
    console.error("[admin/update-plan] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
