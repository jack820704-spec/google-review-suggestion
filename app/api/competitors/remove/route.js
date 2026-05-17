// POST /api/competitors/remove
// Body: { id }  — competitors.id (uuid)
// Deletes the competitor row; cascades nothing on competitor_reviews because
// those reference by competitor_place_id (not FK). We delete reviews here
// in the same request so the dashboard doesn't keep stale rows around.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const supa = createServiceClient();
    const { data: comp } = await supa
      .from("competitors")
      .select("id, user_id, place_id, maps_uri")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!comp) return Response.json({ error: "Competitor not found" }, { status: 404 });

    // Delete its cached reviews first
    await supa
      .from("competitor_reviews")
      .delete()
      .eq("user_id", user.id)
      .eq("competitor_place_id", comp.place_id);

    await supa.from("competitors").delete().eq("id", id).eq("user_id", user.id);

    // Mirror removal in profiles.competitor_urls (text[]) — best-effort.
    if (comp.maps_uri) {
      try {
        const { data: prof } = await supa
          .from("profiles")
          .select("competitor_urls")
          .eq("id", user.id)
          .single();
        const current = Array.isArray(prof?.competitor_urls) ? prof.competitor_urls : [];
        const next = current.filter((u) => u !== comp.maps_uri);
        if (next.length !== current.length) {
          await supa.from("profiles").update({ competitor_urls: next }).eq("id", user.id);
        }
      } catch (e) {
        console.warn("[competitors/remove] profiles.competitor_urls mirror failed:", e.message);
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
