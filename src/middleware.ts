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

  try {
    const { error } = await supabase.auth.getUser()
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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)|api/payments|api/auth).*)',
  ],
}