import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * في Next.js 16، يتم استبدال middleware.ts بـ proxy.ts
 * ويجب تصدير دالة باسم 'proxy' أو تصديرها كـ default.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // إنشاء عميل Supabase خاص بالخادم للتعامل مع الجلسات
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // التحقق من حالة المستخدم
  const { data: { user } } = await supabase.auth.getUser()

  // منطق الحماية: إذا حاول غير المسجل دخول /admin يتم تحويله
  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

// التصدير الافتراضي لضمان توافق Next.js 16
export default proxy;

// تحديد المسارات التي سيتم تطبيق الـ Proxy عليها
export const config = {
  matcher: ['/admin/:path*'],
}