// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Code2,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  CheckCircle2,
  ChevronLeft,
  Github,
  Sparkles,
  Users,
  Eye,
  EyeOff,
  Zap,
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

// Educational Background Pattern
const EducationBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50/40 to-slate-100/40 dark:from-slate-900/10 dark:to-slate-950/10"></div>
    <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    }}></div>
    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[var(--ccc-primary-focus)] rounded-full blur-3xl opacity-30 animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[var(--ccc-secondary-focus)] rounded-full blur-3xl opacity-30 animate-pulse"></div>
  </div>
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
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

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
    <div className="ccc-login-root min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden" dir="rtl">
      <style>{CCC_STYLES}</style>
      
      {/* Educational Background */}
      <EducationBackground />

      {/* Centralized Card Wrapper */}
      <main className="w-full max-w-md relative z-10 animate-scale-in">

        {/* Enhanced Form Card */}
        <div className="ccc-card rounded-2xl p-8 sm:p-10 space-y-6">

          {/* Enhanced Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-2 select-none">
            <div className="relative mb-2">
              <div className="bg-gradient-to-r from-[var(--ccc-primary)] to-[var(--ccc-primary-dark)] text-white p-3.5 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Code2 className="w-7 h-7" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 bg-[var(--ccc-accent)] text-slate-900 p-1 rounded-full shadow-md animate-bounce">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1.5 px-2">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ccc-text-main)] flex items-center justify-center gap-2">
                {getTitle()}
              </h1>
              <p className="text-xs text-[var(--ccc-text-muted)] leading-relaxed max-w-xs mx-auto">
                {getDescription()}
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="flex justify-center gap-1.5 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--ccc-primary-ghost)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>

          {/* Enhanced Status Feedback Messages */}
          {error && (
            <div role="alert" className="flex items-start gap-3 p-3.5 rounded-xl border border-[#D93025]/20 bg-[#D93025]/08 text-xs font-bold text-[#D93025] animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--ccc-secondary-focus)] bg-[var(--ccc-secondary-ghost)] text-xs font-bold text-[var(--ccc-secondary)]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Login View */}
          {view === 'login' && (
            <div className="space-y-6">

              {/* Form Fields */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">

                {/* Enhanced Email Input */}
                <div className="space-y-1.5 text-start">
                  <label htmlFor="login-email-input" className="block text-xs font-bold text-[var(--ccc-text-main)]">
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
                      className="w-full ps-11 pe-4 py-3 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-sm text-[var(--ccc-text-main)] placeholder-slate-400 focus:border-[var(--ccc-primary)] outline-none transition-all duration-200"
                    />
                    <div className="absolute start-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[var(--ccc-primary-ghost)] rounded-lg">
                      <Mail className="w-4 h-4 text-[var(--ccc-primary)]" />
                    </div>
                  </div>
                </div>

                {/* Enhanced Password Input */}
                <div className="space-y-1.5 text-start">
                  <label htmlFor="login-password-input" className="block text-xs font-bold text-[var(--ccc-text-main)]">
                    كلمة المرور
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="login-password-input"
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-11 pe-10 py-3 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-sm text-[var(--ccc-text-main)] placeholder-slate-400 focus:border-[var(--ccc-primary)] outline-none transition-all duration-200"
                    />
                    <div className="absolute start-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[var(--ccc-primary-ghost)] rounded-lg">
                      <Lock className="w-4 h-4 text-[var(--ccc-primary)]" />
                    </div>
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced Checkbox and Forgot Password Link */}
                <div className="flex justify-between items-center text-xs pt-1.5 select-none">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--ccc-text-muted)] font-bold hover:text-[var(--ccc-text-main)] transition-colors">
                    <div className="relative inline-block w-4.5 h-4.5 rounded border border-[var(--ccc-border)] bg-[var(--ccc-input)] flex items-center justify-center cursor-pointer transition-colors">
                      <input
                        id="login-remember-me-checkbox"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <div className={`w-2.5 h-2.5 rounded bg-[var(--ccc-primary)] transition-all duration-200 flex items-center justify-center ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    تذكرني على هذا الجهاز
                  </label>
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => setView('forgot')}
                    className="font-bold text-[var(--ccc-primary)] hover:underline transition-colors flex items-center gap-1"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* Enhanced Primary Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="ccc-btn-primary w-full py-3 px-4 mt-2 rounded-xl text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      تسجيل الدخول
                    </>
                  )}
                </button>
              </form>

              {/* Enhanced Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[var(--ccc-border)]"></div>
                <span className="flex-shrink mx-3 text-xs text-[var(--ccc-text-muted)] font-bold bg-[var(--ccc-card)] px-2 rounded-lg relative z-10 select-none">أو الدخول بواسطة</span>
                <div className="flex-grow border-t border-[var(--ccc-border)]"></div>
              </div>

              {/* Enhanced Social Buttons */}
              <div className="flex gap-3">
                <button
                  id="google-login-btn"
                  type="button"
                  onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة Google')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-xs font-bold text-[var(--ccc-text-main)] hover:bg-[var(--ccc-primary-ghost)] hover:border-[var(--ccc-primary-focus)] transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="p-0.5 mr-1">
                    <GoogleIcon />
                  </div>
                  Google
                </button>

                <button
                  id="github-login-btn"
                  type="button"
                  onClick={() => alert('تمت محاكاة تسجيل الدخول بواسطة GitHub')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white border border-transparent rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="mr-1">
                    <Github className="w-4 h-4 text-white" />
                  </div>
                  GitHub
                </button>
              </div>

              {/* Enhanced Developer Accounts Sub-panel */}
              <div className="pt-4 border-t border-[var(--ccc-border)] space-y-3">
                <div className="flex items-center justify-center gap-1.5 mb-2 select-none">
                  <Users className="w-4 h-4 text-[var(--ccc-text-muted)]" />
                  <p className="text-center text-xs font-bold text-[var(--ccc-text-muted)] bg-[var(--ccc-bg)] px-2 py-1 rounded-lg inline-block">
                    حسابات تجريبية سريعة:
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { role: 'مدير', id: 'demo-admin-btn', email: 'admin@codecraftcore.com', pw: 'Admin@123456', color: 'border-amber-200/40 text-amber-700 bg-amber-50/20 hover:bg-amber-100/30 dark:border-amber-900/30 dark:text-amber-400 dark:bg-amber-950/10 dark:hover:bg-amber-900/20', icon: '👑' },
                    { role: 'معلم', id: 'demo-teacher-btn', email: 'teacher@codecraftcore.com', pw: 'Teacher@123456', color: 'border-emerald-200/40 text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100/30 dark:border-emerald-900/30 dark:text-emerald-400 dark:bg-emerald-950/10 dark:hover:bg-emerald-900/20', icon: '👨‍🏫' },
                    { role: 'طالب', id: 'demo-student-btn', email: 'student@codecraftcore.com', pw: 'Student@123456', color: 'border-blue-200/40 text-blue-700 bg-blue-50/20 hover:bg-blue-100/30 dark:border-blue-900/30 dark:text-blue-400 dark:bg-blue-950/10 dark:hover:bg-blue-900/20', icon: '👨‍🎓' },
                  ].map(({ role, id, email: testEmail, pw, color, icon }) => (
                    <button
                      key={role}
                      id={id}
                      type="button"
                      onClick={() => { setEmail(testEmail); setPassword(pw); }}
                      className={`py-2 px-1 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer transform hover:scale-105 ${color} flex flex-col items-center justify-center gap-1`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Bottom Switcher Link */}
              <div className="pt-4 border-t border-[var(--ccc-border)] flex flex-col items-center gap-2.5">
                <p className="text-center text-sm text-[var(--ccc-text-muted)] flex items-center gap-1.5">
                  ليس لديك حساب؟{' '}
                  <Link id="register-account-link" href="/register" className="font-bold text-[var(--ccc-primary)] hover:underline flex items-center gap-1 transition-colors">
                    <BookOpen className="w-4 h-4" />
                    أنشئ حساباً جديداً
                  </Link>
                </p>
                <div className="flex gap-1.5 text-xs text-[var(--ccc-text-muted)] opacity-70 select-none">
                  <span>أو استخدم</span>
                  <button 
                    onClick={() => {
                      setEmail('admin@codecraftcore.com');
                      setPassword('Admin@123456');
                      setTimeout(() => {
                        document.getElementById('login-submit-btn')?.click();
                      }, 300);
                    }}
                    className="text-[var(--ccc-primary)] hover:underline transition-colors font-bold px-1.5 py-0.5 rounded-lg hover:bg-[var(--ccc-primary-ghost)]"
                  >
                    حساب المدير
                  </button>
                  <span>للتجربة</span>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password View */}
          {view === 'forgot' && (
            <div className="space-y-4">
              {resetMessage ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--ccc-secondary-focus)] bg-[var(--ccc-secondary-ghost)] text-xs text-[var(--ccc-secondary)] font-bold">
                    <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                    <p>{resetMessage}</p>
                  </div>
                  {resetToken && (
                    <div className="bg-[var(--ccc-bg)] p-4 rounded-xl border border-[var(--ccc-border)] space-y-2">
                      <p className="text-xs text-[var(--ccc-text-muted)] font-bold">للتطوير: رمز الاستعادة هو</p>
                      <code className="text-xs text-[var(--ccc-primary)] font-mono select-all block break-all">{resetToken}</code>
                      <button
                        onClick={() => setView('reset')}
                        className="ccc-btn-primary w-full mt-2 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        الانتقال لصفحة التعيين
                      </button>
                    </div>
                  )}
                  <button
                    id="back-to-login-btn"
                    onClick={() => { setView('login'); setResetMessage(null); }}
                    className="w-full py-2.5 rounded-xl border border-[var(--ccc-border)] text-xs font-bold text-[var(--ccc-text-muted)] hover:bg-[var(--ccc-bg)] transition-all text-center cursor-pointer"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-start">
                    <label htmlFor="forgot-email-input" className="block text-xs font-bold text-[var(--ccc-text-main)]">
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
                        className="w-full ps-11 pe-4 py-2.5 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-sm text-[var(--ccc-text-main)] placeholder-slate-400 focus:border-[var(--ccc-primary)] outline-none transition-all duration-200"
                      />
                      <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ccc-primary)]" />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="ccc-btn-primary w-full py-3 px-4 rounded-xl text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
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
                    className="w-full py-2.5 rounded-xl border border-[var(--ccc-border)] text-xs font-bold text-[var(--ccc-text-muted)] hover:bg-[var(--ccc-bg)] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180 text-[var(--ccc-text-muted)]" />
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
                <label htmlFor="reset-token-input" className="block text-xs font-bold text-[var(--ccc-text-main)]">
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
                  className="w-full px-4 py-2.5 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-sm text-[var(--ccc-text-main)] placeholder-slate-400 focus:border-[var(--ccc-primary)] outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5 text-start">
                <label htmlFor="reset-password-input" className="block text-xs font-bold text-[var(--ccc-text-main)]">
                  كلمة المرور الجديدة
                </label>
                <div className="relative" dir="ltr">
                  <input
                    id="reset-password-input"
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    className="w-full ps-11 pe-10 py-2.5 bg-[var(--ccc-input)] border border-[var(--ccc-border)] rounded-xl text-sm text-[var(--ccc-text-main)] placeholder-slate-400 focus:border-[var(--ccc-primary)] outline-none transition-all duration-200"
                  />
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ccc-primary)]" />
                  <button type="button" onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="reset-submit-btn"
                type="submit"
                disabled={loading}
                className="ccc-btn-primary w-full py-3 px-4 rounded-xl text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
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
                className="w-full py-2.5 rounded-xl border border-[var(--ccc-border)] text-xs font-bold text-[var(--ccc-text-muted)] hover:bg-[var(--ccc-bg)] transition-all text-center cursor-pointer"
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
      <div className="min-h-screen w-full bg-[#F5F7FA] dark:bg-[#0B1220] flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          <div className="bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-white p-4 rounded-2xl shadow-lg transform rotate-3 animate-bounce">
            <Code2 className="w-8 h-8" />
          </div>
          <Loader2 className="w-10 h-10 text-[#2B4C7E] animate-spin" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">جاري التحميل...</span>
        </div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}

// ═══════════════════════════════════════════════════════════
// SCOPED CSS — Corporate Identity
// ═══════════════════════════════════════════════════════════
const CCC_STYLES = `
  .ccc-login-root {
    /* CORPORATE PROFESSIONAL PALETTE */
    --ccc-primary:           #2B4C7E;
    --ccc-primary-dark:      #1c3459;
    --ccc-primary-focus:     rgba(43,76,126,0.18);
    --ccc-primary-ghost:     rgba(43,76,126,0.09);
    --ccc-secondary:         #4A7C59;
    --ccc-secondary-focus:   rgba(74,124,89,0.18);
    --ccc-secondary-ghost:   rgba(74,124,89,0.09);
    --ccc-accent:            #FF9F1C;
    --ccc-accent-border:     rgba(255,159,28,0.30);
    --ccc-accent-ghost:      rgba(255,159,28,0.08);
    --ccc-error:             #D93025;

    --ccc-bg:                #F5F7FA;
    --ccc-card:              #FFFFFF;
    --ccc-border:            #DFE4EC;
    --ccc-text-main:         #1E293B;
    --ccc-text-muted:        #64748B;
    --ccc-input:             #F5F7FA;
    --ccc-shadow-card:       0 8px 32px rgba(30,41,59,0.07);

    font-family: 'Alexandria', 'Cairo', 'Noto Sans Arabic', sans-serif;
    background: var(--ccc-bg);
    min-height: 100vh;
  }

  /* Dark mode */
  .dark .ccc-login-root {
    --ccc-bg:                #0B1220;
    --ccc-card:              #141C2F;
    --ccc-border:            rgba(255,255,255,0.08);
    --ccc-text-main:         #E6EEF6;
    --ccc-text-muted:        #7A91A8;
    --ccc-input:             #1b2438;
    --ccc-shadow-card:       0 8px 32px rgba(0,0,0,0.5);
  }

  .ccc-card {
    background: var(--ccc-card);
    border: 1.5px solid var(--ccc-border);
    box-shadow: var(--ccc-shadow-card);
    transition: all 300ms ease;
  }

  .ccc-btn-primary {
    background: var(--ccc-primary);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 16px var(--ccc-primary-focus);
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ccc-btn-primary:hover:not(:disabled) {
    background: var(--ccc-primary-dark);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px var(--ccc-primary-focus);
  }
  .ccc-btn-primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  @keyframes cccShake {
    0%, 100% { transform: translateX(0); }
    15%     { transform: translateX(-5px); }
    35%     { transform: translateX(5px); }
    55%     { transform: translateX(-3px); }
    75%     { transform: translateX(3px); }
    90%     { transform: translateX(-1px); }
  }
  .ccc-shake { animation: cccShake 0.55s cubic-bezier(.36,.07,.19,.97) both; }

  /* Chrome Autocomplete Fixes */
  .ccc-login-root input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px var(--ccc-input) inset !important;
    -webkit-text-fill-color: var(--ccc-text-main) !important;
  }
`
