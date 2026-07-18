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
  Github
} from 'lucide-react'
import { loginAction, requestPasswordResetAction, resetPasswordAction } from '@/actions/auth'
import { useUser } from '@/components/user-provider'

// Google Brand Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      case 'login': return 'قم بتسجيل الدخول لمتابعة رحلة تعلمك'
      case 'forgot': return 'أدخل بريدك الإلكتروني لإرسال رابط استعادة الحساب'
      case 'reset': return 'أدخل رمز التحقق وكلمة المرور الجديدة لتأمين حسابك'
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 font-sans" dir="rtl">

      {/* Centralized Card Wrapper */}
      <main className="w-full max-w-md animate-scale-in">

        {/* White Breadth-rich Form Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]/60 rounded-2xl shadow-lg p-8 sm:p-10 space-y-6 transition-colors duration-300">

          {/* Centered Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-[#2563EB] text-white p-2.5 rounded-xl shadow-sm">
              <Code2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                {getTitle()}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {getDescription()}
              </p>
            </div>
          </div>

          {/* Status Feedback Messages */}
          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-xs text-green-700 dark:text-green-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Login View */}
          {view === 'login' && (
            <div className="space-y-6">

              {/* Form Fields */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">

                {/* Email Input */}
                <div className="space-y-1.5 text-start">
                  <label htmlFor="login-email-input" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
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
                      className="w-full ps-11 pe-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-200"
                    />
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 text-start">
                  <label htmlFor="login-password-input" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
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
                      className="w-full ps-11 pe-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-200"
                    />
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                  </div>
                </div>

                {/* Checkbox and Forgot Password Link */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#64748B] dark:text-[#94A3B8] font-medium">
                    <input
                      id="login-remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E2E8F0] dark:border-[#334155] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                    />
                    تذكرني على هذا الجهاز
                  </label>
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => setView('forgot')}
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* Primary Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 mt-2 rounded-xl text-white text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#93C5FD] disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>
              </form>

              {/* Minimal Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#E2E8F0] dark:border-[#334155]"></div>
                <span className="flex-shrink mx-3 text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">أو الدخول بواسطة</span>
                <div className="flex-grow border-t border-[#E2E8F0] dark:border-[#334155]"></div>
              </div>

              {/* Minimal Social Buttons */}
              <div className="flex gap-3">
                <button
                  id="google-login-btn"
                  type="button"
                  onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة Google')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-xs font-bold text-gray-700 dark:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors duration-200 cursor-pointer"
                >
                  <GoogleIcon />
                  Google
                </button>

                <button
                  id="github-login-btn"
                  type="button"
                  onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة GitHub')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-[#F8FAFC] dark:hover:bg-white dark:text-[#0F172A] border border-transparent rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
              </div>

              {/* Developer Accounts Sub-panel */}
              <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#334155]/60 space-y-2">
                <p className="text-center text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8]">
                  حسابات تجريبية سريعة:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'مدير', id: 'demo-admin-btn', email: 'admin@codecraftcore.com', pw: 'Admin@123456', color: 'border-amber-200 text-amber-700 bg-amber-50/30 hover:bg-amber-100/30 dark:border-amber-900/30 dark:text-amber-400 dark:bg-amber-950/10 dark:hover:bg-amber-900/20' },
                    { role: 'معلم', id: 'demo-teacher-btn', email: 'teacher@codecraftcore.com', pw: 'Teacher@123456', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-100/30 dark:border-emerald-900/30 dark:text-emerald-400 dark:bg-emerald-950/10 dark:hover:bg-emerald-900/20' },
                    { role: 'طالب', id: 'demo-student-btn', email: 'student@codecraftcore.com', pw: 'Student@123456', color: 'border-blue-200 text-blue-700 bg-blue-50/30 hover:bg-blue-100/30 dark:border-blue-900/30 dark:text-blue-400 dark:bg-blue-950/10 dark:hover:bg-blue-900/20' },
                  ].map(({ role, id, email: testEmail, pw, color }) => (
                    <button
                      key={role}
                      id={id}
                      type="button"
                      onClick={() => { setEmail(testEmail); setPassword(pw); }}
                      className={`py-1.5 px-1 border rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${color}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Switcher Link */}
              <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] pt-2">
                ليس لديك حساب؟{' '}
                <Link id="register-account-link" href="/register" className="font-bold text-[#2563EB] hover:underline">
                  أنشئ حساباً جديداً
                </Link>
              </p>
            </div>
          )}

          {/* Forgot Password View */}
          {view === 'forgot' && (
            <div className="space-y-4">
              {resetMessage ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-xs text-green-700 dark:text-green-300 font-medium">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p>{resetMessage}</p>
                  </div>
                  {resetToken && (
                    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2">
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">للتطوير: رمز الاستعادة هو</p>
                      <code className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-mono select-all block break-all">{resetToken}</code>
                      <button
                        onClick={() => setView('reset')}
                        className="w-full mt-2 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        الانتقال لصفحة التعيين
                      </button>
                    </div>
                  )}
                  <button
                    id="back-to-login-btn"
                    onClick={() => { setView('login'); setResetMessage(null); }}
                    className="w-full py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-all text-center cursor-pointer"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-start">
                    <label htmlFor="forgot-email-input" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
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
                        className="w-full ps-11 pe-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-200"
                      />
                      <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-white text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#93C5FD] disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري إرسال الطلب...
                      </>
                    ) : (
                      'إرسال رابط الاستعادة'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                    العودة لتسجيل الدخول
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Reset Password View */}
          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5 text-start">
                <label htmlFor="reset-token-input" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
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
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5 text-start">
                <label htmlFor="reset-password-input" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
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
                    className="w-full ps-11 pe-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-200"
                  />
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                </div>
              </div>

              <button
                id="reset-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#93C5FD] disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                className="w-full py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-all text-center cursor-pointer"
              >
                إلغاء
              </button>
            </form>
          )}

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
