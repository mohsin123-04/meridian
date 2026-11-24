import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (isAuthCallback) return supabaseResponse;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Redirect authenticated users away from login
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check if user has a workspace
    if (isProtected) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("workspace_id")
        .eq("id", user.id)
        .single();

      if (!profile?.workspace_id && !isOnboarding) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
