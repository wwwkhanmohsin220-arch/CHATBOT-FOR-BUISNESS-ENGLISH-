import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up';
  const isLandingPage = request.nextUrl.pathname === '/';
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding');
  
  // Exclude static files, API routes, etc.
  const isPublicRoute = request.nextUrl.pathname.startsWith('/_next') || 
                        request.nextUrl.pathname.startsWith('/api') || 
                        request.nextUrl.pathname.includes('.');

  if (!isPublicRoute) {
    if (!user && !isAuthPage && !isLandingPage && !isOnboarding) {
      // User is NOT logged in and trying to access a protected route
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }

    if (user && (isAuthPage || isLandingPage)) {
      // User IS logged in and trying to access auth pages or landing page
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
