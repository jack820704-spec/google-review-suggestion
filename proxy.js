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
        .select("restaurant_name")
        .eq("id", user.id)
        .single();
      if (!profile?.restaurant_name) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
    return supabaseResponse;
  }

  // Already logged in → skip login page
  if (pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("restaurant_name")
      .eq("id", user.id)
      .single();
    if (!profile?.restaurant_name)
      return NextResponse.redirect(new URL("/onboarding", request.url));
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
