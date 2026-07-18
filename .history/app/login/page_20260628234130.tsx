// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Code2,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  CheckCircle2,
  ChevronLeft,
  Github,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { loginAction, requestPasswordResetAction, resetPasswordAction } from '@/actions/auth'
import { useUser } from '@/components/user-provider'

// Google Brand Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useUser()

  // Views: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login')

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // UI States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    const token = searchParams.get('token')
    if (tab === 'register') {
      router.push('/register')
    } else if (token) {
      setResetToken(token)
      setView('reset')
    }
  }, [searchParams, router])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await loginAction({ email, password, rememberMe })
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...')
        await refreshUser()
        setTimeout(() => {
          window.location.href = '/auth/redirect'
        }, 1000)
      }
    } catch {
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetMessage(null)
    try {
      const res = await requestPasswordResetAction({ email: forgotEmail })
      if (res.error) {
        setError(res.error)
      } else {
        setResetMessage(res.message || 'تم إرسال رابط الاستعادة.')
        if (res.debugToken) {
          console.log('DEBUG: Reset Token is:', res.debugToken)
          setResetToken(res.debugToken)
        }
      }
    } catch {
      setError('حدث خطأ أثناء إرسال طلب استعادة كلمة المرور.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await resetPasswordAction({ token: resetToken, password: newPassword })
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(res.message || 'تم تغيير كلمة المرور بنجاح. يمكنك الآن الدخول.')
        setTimeout(() => {
          setView('login')
          setError(null)
          setSuccess(null)
        }, 2000)
      }
    } catch {
      setError('حدث خطأ أثناء تغيير كلمة المرور.')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (view) {
      case 'login': return 'مرحباً بعودتك'
      case 'forgot': return 'استعادة كلمة المرور'
      case 'reset': return 'تعيين كلمة مرور جديدة'
    }
  }

  const getDescription = () => {
    switch (view) {
      case 'login': return 'تابع رحلتك التعليمية من خلال بوابتك الشخصية'
      case 'forgot': return 'أدخل بريدك الإلكتروني لإرسال رابط استعادة الحساب'
      case 'reset': return 'أدخل رمز التحقق وكلمة المرور الجديدة لتأمين حسابك'
    }
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-indigo-950 to-cyan-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans" dir="rtl">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-cyan-900 p-8 text-white sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_35%)]" />
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4" />
                منصة تعليمية ذكية
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                  ابدأ رحلتك التعليمية بثقة واحترافية
                </h2>
                <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                  من خلال حسابك، يمكنك متابعة الدورات، والاختبارات، والتقدم اليومي، والاستفادة من أدوات تعليمية متقدمة مصممة لتسريع التعلم.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <div className="rounded-xl bg-white/15 p-2">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  تعلم بذكاء، تابع تقدمك، وحقق أهدافك خطوة بخطوة
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-slate-900/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                      <BookOpen className="h-4 w-4" />
                      محتوى متنوع
                    </div>
                    <p className="text-xs leading-6 text-slate-300">دورات، اختبارات، ومهارات عملية تناسب جميع المستويات.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                      <ShieldCheck className="h-4 w-4" />
                      أمان عالي
                    </div>
                    <p className="text-xs leading-6 text-slate-300">حسابك محمي مع تجربة دخول سلسة وآمنة.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-3 text-sm text-slate-200">
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                <span className="font-semibold text-white">+10K</span> طالب نشط
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                <span className="font-semibold text-white">4.9/5</span> تقييمات ممتازة
              </div>
            </div>
          </section>

          <section className="bg-slate-50/90 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
                    <Code2 className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {getTitle()}
                    </h1>
                    <p className="text-sm leading-6 text-slate-500">
                      {getDescription()}
                    </p>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div role="status" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{success}</span>
                  </div>
                )}

                {view === 'login' && (
                  <div className="mt-6 space-y-6">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-1.5 text-start">
                        <label htmlFor="login-email-input" className="block text-xs font-semibold text-slate-700">
                          البريد الإلكتروني
                        </label>
                        <div className="relative" dir="ltr">
                          <input
                            id="login-email-input"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                          />
                          <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-start">
                        <label htmlFor="login-password-input" className="block text-xs font-semibold text-slate-700">
                          كلمة المرور
                        </label>
                        <div className="relative" dir="ltr">
                          <input
                            id="login-password-input"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                          />
                          <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <label className="flex cursor-pointer items-center gap-2 select-none font-medium text-slate-500">
                          <input
                            id="login-remember-me-checkbox"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                          />
                          تذكرني
                        </label>
                        <button
                          id="forgot-password-link"
                          type="button"
                          onClick={() => setView('forgot')}
                          className="font-semibold text-cyan-600 transition-colors hover:text-cyan-700 hover:underline"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>

                      <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.01] hover:from-indigo-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جاري تسجيل الدخول...
                          </>
                        ) : (
                          <>
                            تسجيل الدخول
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="relative flex items-center py-1">
                      <div className="grow border-t border-slate-200"></div>
                      <span className="mx-3 shrink text-xs font-medium text-slate-400">أو الدخول بواسطة</span>
                      <div className="grow border-t border-slate-200"></div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        id="google-login-btn"
                        type="button"
                        onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة Google')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <GoogleIcon />
                        Google
                      </button>

                      <button
                        id="github-login-btn"
                        type="button"
                        onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة GitHub')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </button>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        حسابات تجريبية سريعة
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { role: 'مدير', id: 'demo-admin-btn', email: 'admin@codecraftcore.com', pw: 'Admin@123456', color: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
                          { role: 'معلم', id: 'demo-teacher-btn', email: 'teacher@codecraftcore.com', pw: 'Teacher@123456', color: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
                          { role: 'طالب', id: 'demo-student-btn', email: 'student@codecraftcore.com', pw: 'Student@123456', color: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' },
                        ].map(({ role, id, email: testEmail, pw, color }) => (
                          <button
                            key={role}
                            id={id}
                            type="button"
                            onClick={() => { setEmail(testEmail); setPassword(pw); }}
                            className={`rounded-lg border px-1 py-1.5 text-[10px] font-bold text-center transition-all ${color}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="pt-2 text-center text-xs text-slate-500">
                      ليس لديك حساب؟{' '}
                      <Link id="register-account-link" href="/register" className="font-bold text-cyan-600 hover:underline">
                        أنشئ حساباً جديداً
                      </Link>
                    </p>
                  </div>
                )}

                {view === 'forgot' && (
                  <div className="mt-6 space-y-4">
                    {resetMessage ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                          <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-green-500" />
                          <p>{resetMessage}</p>
                        </div>
                        {resetToken && (
                          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold text-slate-500">للتطوير: رمز الاستعادة هو</p>
                            <code className="block select-all break-all text-xs font-mono text-cyan-600">{resetToken}</code>
                            <button
                              onClick={() => setView('reset')}
                              className="mt-2 w-full rounded-xl bg-linear-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-xs font-bold text-white transition-colors"
                            >
                              الانتقال لصفحة التعيين
                            </button>
                          </div>
                        )}
                        <button
                          id="back-to-login-btn"
                          onClick={() => { setView('login'); setResetMessage(null); }}
                          className="w-full rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50"
                        >
                          العودة لتسجيل الدخول
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div className="space-y-1.5 text-start">
                          <label htmlFor="forgot-email-input" className="block text-xs font-semibold text-slate-700">
                            البريد الإلكتروني
                          </label>
                          <div className="relative" dir="ltr">
                            <input
                              id="forgot-email-input"
                              type="email"
                              required
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                            />
                            <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <button
                          id="forgot-submit-btn"
                          type="submit"
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.01] hover:from-indigo-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              جاري إرسال الطلب...
                            </>
                          ) : (
                            'إرسال رابط الاستعادة'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setView('login')}
                          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50"
                        >
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                          العودة لتسجيل الدخول
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {view === 'reset' && (
                  <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5 text-start">
                      <label htmlFor="reset-token-input" className="block text-xs font-semibold text-slate-700">
                        رمز التحقق
                      </label>
                      <input
                        id="reset-token-input"
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="أدخل الرمز..."
                        dir="ltr"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="space-y-1.5 text-start">
                      <label htmlFor="reset-password-input" className="block text-xs font-semibold text-slate-700">
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative" dir="ltr">
                        <input
                          id="reset-password-input"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="8 أحرف على الأقل"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                        />
                        <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <button
                      id="reset-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.01] hover:from-indigo-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جاري تعيين كلمة المرور...
                        </>
                      ) : (
                        'تعيين كلمة المرور الجديدة'
                      )}
                    </button>

                    <button
                      id="cancel-reset-btn"
                      type="button"
                      onClick={() => setView('login')}
                      className="w-full rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
