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

  // Exclude static files, API routes, etc.
  const isPublicRoute = request.nextUrl.pathname.startsWith('/_next') || 
                        request.nextUrl.pathname.startsWith('/api') || 
                        request.nextUrl.pathname.includes('.');

  if (!isPublicRoute) {
    // refreshing the auth token only for protected routes
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up';
    const isLandingPage = request.nextUrl.pathname === '/';
    const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding');

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

  // Forward Authorization header to FastAPI if hitting Next.js API proxy
  if (request.nextUrl.pathname.startsWith('/api')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
      
      // We must recreate the response to pass the new headers downstream
      const newResponse = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      // Copy cookies from the old response to the new one
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        newResponse.cookies.set(cookie.name, cookie.value);
      });
      supabaseResponse = newResponse;
    }
  }

  return supabaseResponse;
}
