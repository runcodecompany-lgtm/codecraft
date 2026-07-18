// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Fetch authenticated user from Supabase auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 3. Capture and set referral cookie if present in request url
  const ref = request.nextUrl.searchParams.get("ref")
  if (ref) {
    supabaseResponse.cookies.set("ref", ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    })
  }

  // 4. Auth Route Guards
  if ((pathname === "/login" || pathname === "/register") && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/redirect"
    return NextResponse.redirect(redirectUrl)
  }

  // Protect sensitive dashboard paths.
  // Role enforcement happens in the server layouts/pages where the canonical
  // session source is available. Keeping middleware to auth-only checks avoids
  // redirect loops when metadata and session roles drift out of sync.
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and internal next routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
