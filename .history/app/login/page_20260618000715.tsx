// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Code2, Loader2, AlertCircle, Mail, Lock, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react'
import { loginAction, requestPasswordResetAction, resetPasswordAction } from '@/actions/auth'
import { useUser } from '@/components/user-provider'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useUser()

  // Tabs / Views: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login')
  
  // Login Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  
  // Reset Password States
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Loading and Error States
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
        setLoading(false)
      } else {
        setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...')
        // Refresh User Context
        await refreshUser()
        
        // Wait a tiny bit and redirect to dashboard route (which role checks and routes)
        setTimeout(() => {
          window.location.href = '/auth/redirect'
        }, 1000)
      }
    } catch {
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول.')
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

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full opacity-20 blur-3xl animate-pulse" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, #6366f1, transparent)', top: '-100px', right: '-100px' }} />
        <div className="absolute rounded-full opacity-15 blur-3xl animate-pulse" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '-80px', left: '-80px', animationDelay: '1s' }} />
      </div>

      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Code Craft Core</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            {view === 'login' ? 'مرحباً بعودتك' : view === 'forgot' ? 'استعادة كلمة المرور' : 'تعيين كلمة المرور الجديدة'}
          </h1>
          <p className="text-sm text-slate-400">
            {view === 'login' ? 'سجّل دخولك للوصول إلى لوحة التحكم' : view === 'forgot' ? 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة' : 'أدخل رمز التحقق وكلمة المرور الجديدة'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-450 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}

        {/* ── VIEW: LOGIN ── */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@codecraftcore.com"
                  className="w-full px-4 py-3 bg-white/7 border border-white/12 rounded-xl text-white text-sm outline-none transition-all focus:border-indigo-500/60 focus:bg-white/10 pr-11"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-300">كلمة المرور</label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/7 border border-white/12 rounded-xl text-white text-sm outline-none transition-all focus:border-indigo-500/60 focus:bg-white/10 pr-11"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/50 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                تذكرني على هذا الجهاز
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/35"
              style={{
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الدخول...</> : 'تسجيل الدخول'}
            </button>
          </form>
        )}

        {/* ── VIEW: FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <div className="space-y-5">
            {resetMessage ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-350">{resetMessage}</p>
                </div>
                {resetToken && (
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-400 font-bold">تطوير/بيئة اختبار: رمز الاستعادة هو</p>
                    <code className="text-xs text-amber-400 font-mono select-all block break-all">{resetToken}</code>
                    <button
                      onClick={() => setView('reset')}
                      className="w-full mt-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors"
                    >
                      الانتقال لصفحة تعيين كلمة المرور
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setView('login')
                    setResetMessage(null)
                  }}
                  className="w-full py-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-350 hover:bg-white/5 transition-all text-center"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="example@codecraftcore.com"
                      className="w-full px-4 py-3 bg-white/7 border border-white/12 rounded-xl text-white text-sm outline-none transition-all focus:border-indigo-500/60 focus:bg-white/10 pr-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/35"
                  style={{
                    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  }}
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإرسال...</> : 'إرسال رابط الاستعادة'}
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full py-3 rounded-xl border border-slate-750 text-sm font-bold text-slate-350 hover:bg-white/5 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  العودة لتسجيل الدخول
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── VIEW: RESET PASSWORD ── */}
        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">رمز التحقق</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="أدخل رمز التحقق هنا..."
                className="w-full px-4 py-3 bg-white/7 border border-white/12 rounded-xl text-white text-sm outline-none transition-all focus:border-indigo-500/60 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className="w-full px-4 py-3 bg-white/7 border border-white/12 rounded-xl text-white text-sm outline-none transition-all focus:border-indigo-500/60 focus:bg-white/10 pr-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/35"
              style={{
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري التغيير...</> : 'تعيين كلمة المرور الجديدة'}
            </button>

            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full py-3 rounded-xl border border-slate-750 text-sm font-bold text-slate-350 hover:bg-white/5 transition-all text-center"
            >
              إلغاء والعودة للدخول
            </button>
          </form>
        )}

        {/* Divider */}
        {view === 'login' && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-slate-500">بيانات الاختبار</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Test accounts */}
            <div className="space-y-2">
              {[
                { role: 'مدير', email: 'admin@codecraftcore.com', pw: 'Admin@123456', color: '#f59e0b' },
                { role: 'معلم', email: 'teacher@codecraftcore.com', pw: 'Teacher@123456', color: '#10b981' },
                { role: 'طالب', email: 'student@codecraftcore.com', pw: 'Student@123456', color: '#6366f1' },
              ].map(({ role, email: testEmail, pw, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setEmail(testEmail)
                    setPassword(pw)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    borderRadius: '10px',
                    color: color,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'right',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                >
                  <span>{role}</span>
                  <span style={{ opacity: 0.7, fontSize: '11px', direction: 'ltr' }}>{testEmail}</span>
                </button>
              ))}
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500 mt-6">
              ليس لديك حساب؟{' '}
              <Link
                href="/register"
                className="font-semibold"
                style={{ color: '#6366f1' }}
              >
                سجّل الآن
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
