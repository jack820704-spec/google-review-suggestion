import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(new URL("/onboarding?google_error=1", req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return Response.redirect(new URL("/dashboard/settings?google_error=1", req.url));
    }

    // Get Google profile to identify the user
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleProfile = await profileRes.json();

    // Try to get Google Business accounts
    let locationId = null, locationName = null, accountId = null;
    try {
      const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const accountsData = await accountsRes.json();
      const account = accountsData.accounts?.[0];
      if (account) {
        accountId = account.name;
        const locsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const locsData = await locsRes.json();
        const loc = locsData.locations?.[0];
        if (loc) { locationId = loc.name; locationName = loc.title; }
      }
    } catch {
      // Business API access may require additional permissions — continue anyway
    }

    // Get the logged-in Supabase user from cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return Response.redirect(new URL("/login", req.url));

    const db = createServiceClient();

    // Store Google connection
    await db.from("google_connections").upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      location_id: locationId,
      location_name: locationName,
      account_id: accountId,
      google_email: googleProfile.email,
    }, { onConflict: "user_id" });

    // Update profile
    await db.from("profiles").update({
      google_connected: true,
      google_location_name: locationName,
    }).eq("id", user.id);

    return Response.redirect(new URL("/dashboard/settings?google_connected=1", req.url));
  } catch (err) {
    console.error("Google callback error:", err);
    return Response.redirect(new URL("/dashboard/settings?google_error=1", req.url));
  }
}
