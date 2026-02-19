// // src/lib/supabase/middleware.ts
// // Bu file har bir request da auth ni tekshiradi

// import { createServerClient } from '@supabase/ssr'
// import { NextResponse, type NextRequest } from 'next/server'

// export async function updateSession(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({
//     request,
//   })

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
//           supabaseResponse = NextResponse.next({
//             request,
//           })
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options)
//           )
//         },
//       },
//     }
//   )

//   // IMPORTANT: Auth ni tekshirish
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   // Protected routes
//   const protectedRoutes = ['/dashboard', '/debts', '/settings', '/analytics', '/blacklist', '/sms-credits']
//   const isProtectedRoute = protectedRoutes.some(route => 
//     request.nextUrl.pathname.startsWith(route)
//   )

//   // Agar user yo'q va protected route bo'lsa -> login ga
//   if (!user && isProtectedRoute) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/login'
//     return NextResponse.redirect(url)
//   }

//   // Agar user bor va auth page da bo'lsa -> dashboard ga
//   if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/dashboard'
//     return NextResponse.redirect(url)
//   }

//   return supabaseResponse
// }


// src/middleware.ts
// SESSION PERSISTENCE MIDDLEWARE
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // ✅ getUser() — tokenni yangilaydi
  await supabase.auth.getUser()

  return supabaseResponse // ← supabaseResponse qaytarish muhim!
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}