import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin routes — only role=admin
  if (pathname.startsWith("/admin")) {
    if (!user)
      return NextResponse.redirect(new URL("/login", request.url));
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin")
      return NextResponse.redirect(new URL("/dashboard", request.url));
    return supabaseResponse;
  }

  // Protected: dashboard and onboarding
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding")
  ) {
    if (!user)
      return NextResponse.redirect(new URL("/login", request.url));

    if (pathname.startsWith("/dashboard")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_name, plan, trial_ends_at")
        .eq("id", user.id)
        .single();
      // First-time users (no restaurant yet) are NOT forced to /onboarding —
      // the dashboard shows an onboarding guide modal on first visit instead.

      // Plan gating: an expired free trial with no paid plan → /pricing.
      // Paid plans (starter/growth/pro) are managed by Paddle and stay valid
      // until the webhook drops them back to free_trial. Skip the gate right
      // after checkout (?upgraded=1) so a fresh payer isn't bounced before the
      // webhook has flipped their plan.
      if (!request.nextUrl.searchParams.has("upgraded")) {
        const plan = profile.plan || "free_trial";
        if (plan === "free_trial" && profile.trial_ends_at) {
          const endsAt = new Date(profile.trial_ends_at).getTime();
          if (Number.isFinite(endsAt) && endsAt < Date.now()) {
            return NextResponse.redirect(new URL("/pricing?expired=1", request.url));
          }
        }
      }
    }
    return supabaseResponse;
  }

  // Already logged in → skip login page (always land on the dashboard; the
  // onboarding guide appears there as a modal for first-time users).
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/login",
  ],
};
