import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/payments')) {
    return NextResponse.next()
  }
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let isAuthenticated = false

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      isAuthenticated = true
    }
    if (error && (error.status === 400 || error.code === 'refresh_token_not_found' || error.message?.includes('Refresh Token'))) {
      // Clear stale/expired Supabase auth cookies so they do not error repeatedly on every request
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
          supabaseResponse.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
        }
      })
    }
  } catch {
    // Gracefully ignore session refresh issues in middleware
  }

  // Check phone session cookie (used for phone OTP logins and registration)
  const phoneSession = request.cookies.get('phone_user_session')?.value
  if (phoneSession && phoneSession.trim().length > 0) {
    isAuthenticated = true
  }

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  // If user is already authenticated and visits '/', redirect straight to /dashboard
  if (isAuthenticated && pathname === '/') {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // If user is already authenticated and attempts to visit /login or /register, redirect to /dashboard
  if (isAuthenticated && isAuthRoute) {
    const redirectParam = request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('from')
    const destination = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/register')
      ? redirectParam
      : '/dashboard'

    const redirectResponse = NextResponse.redirect(new URL(destination, request.url))
    // Forward any updated cookies
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)|api/payments|api/auth).*)',
  ],
}
