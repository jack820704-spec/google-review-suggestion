import { createServiceClient } from "@/lib/supabase-server";
import { Resend } from "resend";
import { canUseFeature } from "@/lib/plans";

const resend = new Resend(process.env.RESEND_API_KEY);

function avgRating(reviews) {
  if (!reviews.length) return 0;
  return (reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length).toFixed(1);
}

function topKeywords(reviews) {
  const counts = {};
  const words = ["delicious","fresh","friendly","attentive","cozy","slow","expensive","noisy","great","excellent","amazing","terrible","rude","wait","overpriced"];
  reviews.forEach((r) => {
    const text = (r.content || "").toLowerCase();
    words.forEach((w) => { if (text.includes(w)) counts[w] = (counts[w] || 0) + 1; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: profiles } = await db.from("profiles").select("*").eq("weekly_report", true);
  if (!profiles?.length) return Response.json({ sent: 0 });

  const now = new Date();
  const thisWeekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const lastWeekStart = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  let sent = 0;
  for (const profile of profiles) {
    if (!canUseFeature(profile.plan, "weekly_report")) continue;

    const { data: thisWeekRevs } = await db.from("reviews").select("*").eq("user_id", profile.id).gte("review_date", thisWeekStart);
    const { data: lastWeekRevs } = await db.from("reviews").select("*").eq("user_id", profile.id).gte("review_date", lastWeekStart).lt("review_date", thisWeekStart);
    const { data: allRevs } = await db.from("reviews").select("*").eq("user_id", profile.id);

    const thisAvg = avgRating(thisWeekRevs || []);
    const lastAvg = avgRating(lastWeekRevs || []);
    const diff = (parseFloat(thisAvg) - parseFloat(lastAvg)).toFixed(1);
    const diffStr = diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : "→ 0.0";
    const keywords = topKeywords(thisWeekRevs || []);
    const unanswered = (allRevs || []).filter((r) => !r.replied).length;
    const replyRate = allRevs?.length ? Math.round((allRevs.filter((r) => r.replied).length / allRevs.length) * 100) : 0;

    const kwRows = keywords.map(([kw, count]) => `<tr><td style="padding:8px 12px;font-size:13.5px;color:#a09888">${kw}</td><td style="padding:8px 12px;font-size:13.5px;color:#c9a84c;font-weight:700;text-align:right">${count}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="margin-bottom:28px"><span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">✦ Revuly</span></div>
  <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#f0ede6;margin:0 0 6px">Weekly Report</h1>
  <p style="font-size:13px;color:#5a5550;margin:0 0 28px">${profile.restaurant_name} · Week of ${new Date(thisWeekStart).toLocaleDateString("en-US",{month:"long",day:"numeric"})}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px">
    ${[["Reviews This Week",(thisWeekRevs||[]).length],["Average Rating",thisAvg+" ★"],["vs Last Week",diffStr],["Reply Rate",replyRate+"%"],["Unanswered",unanswered]].map(([l,v])=>`<div style="background:#1c1c22;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px"><div style="font-size:22px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">${v}</div><div style="font-size:12px;color:#5a5550;margin-top:3px">${l}</div></div>`).join("")}
  </div>
  ${keywords.length ? `<div style="margin-bottom:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a5550;margin-bottom:12px">Top Keywords This Week</div><table style="width:100%;border-collapse:collapse;background:#1c1c22;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden">${kwRows}</table></div>` : ""}
  <div style="text-align:center;margin-bottom:28px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">View Full Dashboard →</a></div>
  <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:20px;text-align:center"><p style="font-size:12px;color:#5a5550;margin:0">Revuly · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#5a5550;text-decoration:none">Manage notifications</a></p></div>
</div></body></html>`;

    try {
      await resend.emails.send({
        from: "Revuly Reports <reports@revuly.com>",
        to: profile.email,
        subject: `📊 Weekly Report — ${profile.restaurant_name} (${thisWeekRevs?.length || 0} reviews)`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Weekly report failed for ${profile.email}:`, err.message);
    }
  }

  return Response.json({ sent });
}
