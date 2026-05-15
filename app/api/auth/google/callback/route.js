// Unified Google OAuth callback.
// Handles TWO flows distinguished by the `state` query parameter:
//   1. Supabase login (default): redirectTo from supabase.auth.signInWithOAuth
//      → exchange PKCE code for a session, ensure profile row, route to dashboard/onboarding.
//   2. Business linking (state=business_link): manual OAuth from /dashboard/settings
//      → exchange code with Google, fetch tokens + business info, store in google_connections.
//
// Both flows use the redirect URI: ${NEXT_PUBLIC_APP_URL}/api/auth/google/callback
// (e.g. https://revuly.dev/api/auth/google/callback)

import { createServiceClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    const dest = state === "business_link" ? "/dashboard/settings?google_error=1" : "/login?error=oauth";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", req.url));
  }

  if (state === "business_link") {
    return handleBusinessLink(code, req);
  }

  return handleSupabaseLogin(code, req);
}

async function handleSupabaseLogin(code, req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !user) {
    return NextResponse.redirect(new URL("/login?error=auth", req.url));
  }

  // Ensure a profile row exists; route first-time users through onboarding.
  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      plan: "free_trial",
      used_count: 0,
    });
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (!profile.restaurant_name) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

async function handleBusinessLink(code, req) {
  try {
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
      return NextResponse.redirect(new URL("/dashboard/settings?google_error=1", req.url));
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleProfile = await profileRes.json();

    let locationId = null, locationName = null, accountId = null;
    try {
      const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const accountsData = await accountsRes.json();
      const account = accountsData.accounts?.[0];
      if (account) {
        accountId = account.name;
        const locsRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
          { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        );
        const locsData = await locsRes.json();
        const loc = locsData.locations?.[0];
        if (loc) { locationId = loc.name; locationName = loc.title; }
      }
    } catch {
      // Business API access may require additional permissions — proceed without it.
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", req.url));

    const db = createServiceClient();

    await db.from("google_connections").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        location_id: locationId,
        location_name: locationName,
        account_id: accountId,
        google_email: googleProfile.email,
      },
      { onConflict: "user_id" }
    );

    await db.from("profiles")
      .update({ google_connected: true, google_location_name: locationName })
      .eq("id", user.id);

    return NextResponse.redirect(new URL("/dashboard/settings?google_connected=1", req.url));
  } catch (err) {
    console.error("Google business linking error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?google_error=1", req.url));
  }
}
