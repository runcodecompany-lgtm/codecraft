// app/register/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { registerUser, registerTeacherUser } from '@/lib/auth'
import { getLearningTracks } from '@/actions/tracks'
import { uploadCV } from '@/lib/upload'
import Link from 'next/link'
import {
  Code2, Loader2, AlertCircle, Mail, Lock, User,
  CheckCircle2, Gift, ArrowLeft, ArrowRight, Eye, EyeOff,
  Star, Zap, Target, BookOpen, Cpu, Globe, Shield,
  Database, Trophy, Coins, GraduationCap, UserCog, Sparkles,
  Phone, Briefcase, FileText, Link2, MapPin, Clock,
  Award, Info,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// TRACK COLORS
// ═══════════════════════════════════════════════════════════
const TRACK_PALETTE = [
  { from: '#2B4C7E', to: '#3B5FA0', border: 'rgba(43,76,126,0.35)',  bg: 'rgba(43,76,126,0.07)'  },
  { from: '#4A7C59', to: '#5A9C6E', border: 'rgba(74,124,89,0.35)',  bg: 'rgba(74,124,89,0.07)'  },
  { from: '#7C3AED', to: '#a855f7', border: 'rgba(124,58,237,0.35)', bg: 'rgba(124,58,237,0.07)' },
  { from: '#0891B2', to: '#22d3ee', border: 'rgba(8,145,178,0.35)',  bg: 'rgba(8,145,178,0.07)'  },
  { from: '#D97706', to: '#FF9F1C', border: 'rgba(217,119,6,0.35)',  bg: 'rgba(217,119,6,0.07)'  },
  { from: '#DC2626', to: '#f87171', border: 'rgba(220,38,38,0.35)',  bg: 'rgba(220,38,38,0.07)'  },
]

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function getTrackIcon(name: string): React.ReactNode {
  const l = name.toLowerCase()
  if (l.includes('ويب') || l.includes('web'))      return <Globe    className="w-5 h-5" />
  if (l.includes('أمن') || l.includes('security')) return <Shield   className="w-5 h-5" />
  if (l.includes('بيانات') || l.includes('data'))  return <Database className="w-5 h-5" />
  if (l.includes('ذكاء') || l.includes('ai'))      return <Cpu      className="w-5 h-5" />
  return <Code2 className="w-5 h-5" />
}

interface StrengthResult { score: 0|1|2|3|4; label: string; color: string; pct: number }
function calcStrength(pw: string): StrengthResult {
  if (!pw) return { score: 0, label: '', color: '#DFE4EC', pct: 0 }
  let s = 0
  if (pw.length >= 8)                        s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw))                      s++
  if (/[^a-zA-Z0-9]/.test(pw))              s++
  const map: Record<number, StrengthResult> = {
    1: { score: 1, label: 'ضعيفة',    color: '#D93025', pct: 25  },
    2: { score: 2, label: 'متوسطة',   color: '#FF9F1C', pct: 50  },
    3: { score: 3, label: 'جيدة',     color: '#4A7C59', pct: 75  },
    4: { score: 4, label: 'قوية جداً',color: '#2B4C7E', pct: 100 },
  }
  return map[s] ?? { score: 0, label: '', color: '#DFE4EC', pct: 0 }
}

// ═══════════════════════════════════════════════════════════
// WIZARD STEPS — dynamic based on account type
// ═══════════════════════════════════════════════════════════
const STUDENT_STEPS = [
  { label: 'نوع الحساب',      icon: <UserCog className="w-3.5 h-3.5" /> },
  { label: 'البيانات الأساسية', icon: <User className="w-3.5 h-3.5" />   },
  { label: 'المسارات والإنهاء',icon: <BookOpen className="w-3.5 h-3.5" /> },
]
const TEACHER_STEPS = [
  { label: 'نوع الحساب',      icon: <UserCog className="w-3.5 h-3.5" /> },
  { label: 'البيانات الأساسية', icon: <User className="w-3.5 h-3.5" />   },
  { label: 'ملف المعلم المهني',icon: <Briefcase className="w-3.5 h-3.5" /> },
]

function WizardBar({ current, steps }: { current: number; steps: typeof STUDENT_STEPS }) {
  const total = steps.length
  return (
    <div className="mb-8 select-none">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--ccc-border)]" style={{ zIndex: 0 }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 transition-all duration-500 ease-out"
          style={{
            background: 'linear-gradient(90deg, var(--ccc-secondary), var(--ccc-primary))',
            width: `${((current - 1) / (total - 1)) * 100}%`,
            right: 0, left: 'auto', zIndex: 1,
          }}
        />
        {steps.map((meta, i) => {
          const idx = i + 1
          const done = idx < current, active = idx === current, pending = idx > current
          return (
            <div key={i} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 border-2"
                style={{
                  background: done ? 'var(--ccc-secondary)' : active ? 'var(--ccc-primary)' : 'var(--ccc-card)',
                  borderColor: pending ? 'var(--ccc-border)' : 'transparent',
                  color: done || active ? '#fff' : 'var(--ccc-text-muted)',
                  boxShadow: active ? '0 0 0 4px var(--ccc-primary-focus)' : 'none',
                }}
              >
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : meta.icon}
              </div>
              <span className="text-[11px] font-bold whitespace-nowrap transition-colors duration-300"
                style={{ color: done || active ? 'var(--ccc-primary)' : 'var(--ccc-text-muted)' }}>
                {meta.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FORM FIELD WRAPPER
// ═══════════════════════════════════════════════════════════
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[var(--ccc-text-main)]">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[var(--ccc-text-muted)] leading-relaxed">{hint}</p>}
      {error && (
        <div className="flex items-center gap-1.5 mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--ccc-error)]" />
          <p className="text-[11px] font-bold text-[var(--ccc-error)]">{error}</p>
        </div>
      )}
    </div>
  )
}

const inputBase = `w-full h-11 px-4 text-sm outline-none transition-all duration-200 rounded-xl border font-sans
  bg-[var(--ccc-input)] border-[var(--ccc-border)] text-[var(--ccc-text-main)]`

// ═══════════════════════════════════════════════════════════
// ACCOUNT TYPE CARD (Step 1)
// ═══════════════════════════════════════════════════════════
function AccountTypeCard({ type, selected, onSelect }: { type: 'student'|'teacher'; selected: boolean; onSelect: () => void }) {
  const isStudent = type === 'student'
  return (
    <button type="button" onClick={onSelect}
      className="relative flex flex-col items-center gap-4 rounded-2xl p-6 w-full transition-all duration-250 cursor-pointer text-center border-2"
      style={{
        background:  selected ? (isStudent ? 'var(--ccc-primary-ghost)' : 'rgba(74,124,89,0.08)') : 'var(--ccc-card)',
        borderColor: selected ? (isStudent ? 'var(--ccc-primary)' : 'var(--ccc-secondary)') : 'var(--ccc-border)',
        boxShadow:   selected ? `0 0 0 4px var(--ccc-${isStudent ? 'primary' : 'secondary'}-focus)` : 'var(--ccc-shadow-card)',
        transform:   selected ? 'translateY(-2px)' : 'none',
      }} aria-pressed={selected}
    >
      {selected && (
        <div className="absolute top-3 left-3 flex items-center justify-center w-5 h-5 rounded-full"
          style={{ background: isStudent ? 'var(--ccc-primary)' : 'var(--ccc-secondary)' }}>
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
        style={{
          background: selected ? (isStudent ? 'var(--ccc-primary)' : 'var(--ccc-secondary)') : 'var(--ccc-bg)',
          boxShadow: selected ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
        }}>
        {isStudent
          ? <GraduationCap className="w-8 h-8" style={{ color: selected ? '#fff' : 'var(--ccc-primary)' }} />
          : <UserCog       className="w-8 h-8" style={{ color: selected ? '#fff' : 'var(--ccc-secondary)' }} />
        }
      </div>
      <div>
        <p className="text-base font-black mb-1 text-[var(--ccc-text-main)]">{isStudent ? 'طالب' : 'معلم'}</p>
        <p className="text-xs leading-relaxed text-[var(--ccc-text-muted)]">
          {isStudent
            ? 'تعلّم وطوّر مهاراتك بالسرعة التي تناسبك مع ألعاب برمجية ذكية'
            : 'قدّم ملفك المهني وانتظر قبول الإدارة لبدء نشر دوراتك التعليمية'
          }
        </p>
      </div>
      {selected && (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full"
          style={{ background: isStudent ? 'var(--ccc-primary-ghost)' : 'var(--ccc-secondary-ghost)', color: isStudent ? 'var(--ccc-primary)' : 'var(--ccc-secondary)' }}>
          ✓ محدد
        </span>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// TRACK CARD (Student Step 3)
// ═══════════════════════════════════════════════════════════
function TrackCard({ track, colorIdx, isPrimary, isSecondary, onSelectPrimary, onToggleSecondary }: {
  track: { id: string; name: string; description?: string | null }
  colorIdx: number; isPrimary: boolean; isSecondary: boolean
  onSelectPrimary: () => void; onToggleSecondary: () => void
}) {
  const p = TRACK_PALETTE[colorIdx % TRACK_PALETTE.length]
  const active = isPrimary || isSecondary
  return (
    <div className="relative rounded-2xl p-4 cursor-pointer transition-all duration-250 border border-[var(--ccc-border)]"
      style={{ background: active ? p.bg : 'var(--ccc-card)', borderColor: active ? p.border : 'var(--ccc-border)', transform: active ? 'translateY(-2px)' : 'none' }}>
      {isPrimary && (
        <div className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white"
          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
          <Star className="w-2.5 h-2.5" /> رئيسي
        </div>
      )}
      {isSecondary && !isPrimary && (
        <div className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-[var(--ccc-secondary)]">
          <CheckCircle2 className="w-2.5 h-2.5" /> ثانوي
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: active ? `linear-gradient(135deg, ${p.from}, ${p.to})` : 'var(--ccc-bg)', color: active ? '#fff' : p.from }}>
          {getTrackIcon(track.name)}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="font-bold text-sm leading-tight mb-0.5 text-[var(--ccc-text-main)]">{track.name}</h4>
          {track.description && <p className="text-[11px] leading-relaxed line-clamp-2 text-[var(--ccc-text-muted)]">{track.description}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onSelectPrimary}
          className="flex-1 h-8 rounded-lg text-[11px] font-black transition-all duration-200 cursor-pointer"
          style={{ background: isPrimary ? `linear-gradient(135deg, ${p.from}, ${p.to})` : 'var(--ccc-primary-ghost)', color: isPrimary ? '#fff' : 'var(--ccc-primary)', border: isPrimary ? 'none' : '1px solid var(--ccc-primary-focus)' }}>
          {isPrimary ? '✓ رئيسي' : 'رئيسي'}
        </button>
        <button type="button" onClick={onToggleSecondary} disabled={isPrimary}
          className="flex-1 h-8 rounded-lg text-[11px] font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: isSecondary && !isPrimary ? 'var(--ccc-secondary)' : 'var(--ccc-secondary-ghost)', color: isSecondary && !isPrimary ? '#fff' : 'var(--ccc-secondary)', border: isSecondary && !isPrimary ? 'none' : '1px solid var(--ccc-secondary-focus)' }}>
          {isSecondary && !isPrimary ? '✓ ثانوي' : 'ثانوي'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SIDE PANEL
// ═══════════════════════════════════════════════════════════
function SidePanel({ accountType }: { accountType: 'student'|'teacher'|'' }) {
  const isTeacher = accountType === 'teacher'
  const benefits = isTeacher ? [
    { icon: <Sparkles className="w-5 h-5" />, title: 'أنشئ دوراتك الاحترافية', desc: 'محرر متقدم لبناء محتوى تعليمي تفاعلي بعد قبول طلبك' },
    { icon: <Coins    className="w-5 h-5" />, title: 'اربح من تعليمك', desc: 'عائد مالي مستقر من كل طالب يلتحق بدوراتك' },
    { icon: <Award    className="w-5 h-5" />, title: 'شارة معلم موثّق', desc: 'هوية رقمية وتقييمات حقيقية تعزز مكانتك المهنية' },
  ] : [
    { icon: <BookOpen className="w-5 h-5" />, title: 'مسارات تعليمية ذكية', desc: 'توصيات مخصصة تتلاءم مع مستواك وأهدافك المهنية' },
    { icon: <Coins    className="w-5 h-5" />, title: 'عملات كرافت', desc: 'اكسب العملات بالتعلم واستبدلها بجوائز حصرية' },
    { icon: <Trophy   className="w-5 h-5" />, title: 'شهادات معتمدة', desc: 'شهادات رقمية مشفرة جاهزة للمشاركة على LinkedIn' },
  ]
  return (
    <aside className="hidden lg:flex flex-col justify-between p-10 rounded-3xl text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--ccc-primary) 0%, #152d5a 60%, #0b1a34 100%)', minHeight: '640px' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-black text-lg tracking-wide">Code Craft Core</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 leading-snug">
          {isTeacher ? 'كن معلماً موثّقاً' : 'ابدأ رحلتك البرمجية'}
        </h2>
        <p className="text-xs text-white/70 leading-relaxed mb-8">
          {isTeacher
            ? 'قدّم ملفك المهني وانضم إلى نخبة المعلمين المعتمدين في Code Craft Core.'
            : 'انضم إلى منصتنا واختر مسارك التعليمي المخصص لبناء مهاراتك التقنية.'}
        </p>

        {/* Teacher pending notice */}
        {isTeacher && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 border border-white/15 mb-6">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/80" />
            <p className="text-xs text-white/80 leading-relaxed">
              طلبات المعلمين تمر بمراجعة إدارية. بعد إرسال طلبك، ستصلك إشعارات بحالة الاعتماد خلال 2–5 أيام عمل.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-white border border-white/10">{b.icon}</div>
              <div>
                <p className="font-bold text-white text-sm">{b.title}</p>
                <p className="text-white/60 text-xs leading-relaxed mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 pt-6 border-t border-white/15">
        <p className="text-white/40 text-[10px] mb-3 font-bold uppercase tracking-widest">موثوق ومصمم لمطوري</p>
        <div className="flex gap-2 flex-wrap">
          {['MIT', 'Google', 'Microsoft', 'AWS', 'Meta'].map(l => (
            <span key={l} className="px-3 py-1 rounded-full text-[11px] font-black text-white/90 border border-white/15 bg-white/10">{l}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN REGISTER PAGE
// ═══════════════════════════════════════════════════════════
export default function RegisterPage() {

  // ── Wizard ──
  const [step,       setStep]       = useState(1)
  const [slideClass, setSlideClass] = useState('')

  // ── Step 1 ──
  const [accountType, setAccountType] = useState<'student'|'teacher'|''>('')

  // ── Step 2: shared basic info ──
  const [name,            setName]            = useState('')
  const [contactMethod,   setContactMethod]   = useState<'email'|'phone'>('email')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [countryCode,     setCountryCode]     = useState('+966')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showConfirmPw,   setShowConfirmPw]   = useState(false)

  // ── Step 3 – Student tracks ──
  const [tracks,            setTracks]            = useState<Array<{id:string;name:string;description?:string|null}>>([])
  const [primaryTrackId,    setPrimaryTrackId]    = useState('')
  const [secondaryTrackIds, setSecondaryTrackIds] = useState<string[]>([])
  const [tracksLoading,     setTracksLoading]     = useState(true)
  const [trackSearch,       setTrackSearch]       = useState('')
  const [learningGoals,     setLearningGoals]     = useState('')
  const [referralCode,      setReferralCode]      = useState('')

  // ── Step 3 – Teacher professional profile ──
  const [country,          setCountry]          = useState('')
  const [specialization,   setSpecialization]   = useState('')
  const [bio,              setBio]              = useState('')
  const [skills,           setSkills]           = useState('')
  const [yearsOfExperience,setYearsOfExperience]= useState('')
  const [linkedin,         setLinkedin]         = useState('')
  const [portfolioWebsite, setPortfolioWebsite] = useState('')
  const [cvUrl,            setCvUrl]            = useState('')
  const [cvMode,           setCvMode]           = useState<'file' | 'url'>('file')
  const [uploadingCv,      setUploadingCv]      = useState(false)
  const [cvFileName,       setCvFileName]       = useState('')

  // ── Validation & Errors ──
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({})
  const [error,       setError]       = useState<string|null>(null)
  const [shakeKey,    setShakeKey]    = useState<string|null>(null)

  // ── Submission ──
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = calcStrength(password)
  const steps = accountType === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS

  // Load tracks - flatten to show only Level 2 pathways (not root departments)
  useEffect(() => {
    getLearningTracks().then(res => {
      if (res.success && res.tracks) {
        // Flatten: extract only child (pathway) tracks from each department
        const pathways: Array<{id: string; name: string; description: string | null; parentName?: string}> = []
        for (const dept of res.tracks) {
          if (dept.children && dept.children.length > 0) {
            for (const pathway of dept.children) {
              pathways.push({
                id: pathway.id,
                name: pathway.name,
                description: pathway.description,
                parentName: dept.name,
              })
            }
          }
        }
        setTracks(pathways)
      }
      setTracksLoading(false)
    })
  }, [])


  const shake = (key: string) => { setShakeKey(key); setTimeout(() => setShakeKey(null), 600) }

  const goTo = (next: number) => {
    const dir = next > step ? 'forward' : 'backward'
    setSlideClass(dir === 'forward' ? 'ccc-slide-out-left' : 'ccc-slide-out-right')
    setTimeout(() => {
      setStep(next)
      setError(null)
      setSlideClass(dir === 'forward' ? 'ccc-slide-in-right' : 'ccc-slide-in-left')
    }, 200)
    setTimeout(() => setSlideClass(''), 420)
  }

  // Step validations
  const nextStep1 = () => {
    if (!accountType) { shake('type'); setError('يرجى اختيار نوع الحساب للمتابعة.'); return }
    setError(null); goTo(2)
  }

  const nextStep2 = () => {
    const errs: Record<string,string> = {}
    if (!name.trim()) { errs.name = 'الاسم الكامل مطلوب'; shake('name') }
    if (contactMethod === 'email') {
      if (!email.trim() || !email.includes('@')) { errs.email = 'يرجى إدخال بريد إلكتروني صحيح'; shake('email') }
    } else {
      if (!phone.trim() || !/^\d{7,}$/.test(phone)) { errs.phone = 'يرجى إدخال رقم هاتف صحيح'; shake('phone') }
    }
    if (password.length < 8) { errs.password = 'كلمة المرور 8 أحرف على الأقل'; shake('password') }
    if (password !== confirmPassword) { errs.confirmPassword = 'كلمتا المرور غير متطابقتين'; shake('confirmPassword') }
    setFieldErrors(errs)
    if (!Object.keys(errs).length) { setError(null); goTo(3) }
  }

  const toggleSecondary = useCallback((id: string) => {
    setSecondaryTrackIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }, [])

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Teacher submit
    if (accountType === 'teacher') {
      const errs: Record<string,string> = {}
      if (!country.trim())        { errs.country        = 'الدولة مطلوبة';               shake('country')        }
      if (!specialization.trim()) { errs.specialization = 'التخصص مطلوب';               shake('specialization') }
      if (!bio.trim())            { errs.bio            = 'السيرة المهنية مطلوبة';       shake('bio')            }
      if (!skills.trim())         { errs.skills         = 'المهارات مطلوبة';             shake('skills')         }
      if (!yearsOfExperience || isNaN(Number(yearsOfExperience)) || Number(yearsOfExperience) < 1)
                                  { errs.yearsOfExperience = 'أدخل سنوات الخبرة (1+)'; shake('yearsOfExperience') }
      if (!cvUrl.trim())          { errs.cvUrl          = 'رابط السيرة الذاتية مطلوب'; shake('cvUrl')          }
      setFieldErrors(errs)
      if (Object.keys(errs).length) return

      setLoading(true); setError(null)
      const finalEmail = contactMethod === 'email' ? email.trim() : `${countryCode.replace('+','')}${phone.trim()}@phone.codecraftcore.com`
      try {
        const res = await registerTeacherUser({
          name, email: finalEmail, password,
          country, specialization, bio, skills,
          yearsOfExperience, linkedin, portfolioWebsite, cvUrl,
        })
        if (res?.error) setError(res.error)
        else setSuccess(true)
      } catch { setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.') }
      finally  { setLoading(false) }
      return
    }

    // Student submit
    if (!primaryTrackId) { shake('tracks'); setError('يرجى اختيار مسار رئيسي واحد على الأقل.'); return }
    setLoading(true); setError(null)
    const finalEmail = contactMethod === 'email' ? email.trim() : `${countryCode.replace('+','')}${phone.trim()}@phone.codecraftcore.com`
    try {
      const res = await registerUser(
        { name, email: finalEmail, password },
        referralCode.trim() || undefined,
        { primaryTrackId, secondaryTrackIds, learningGoals: learningGoals.split('\n').map(g => g.trim()).filter(Boolean) }
      )
      if (res?.error) setError(res.error)
      else setSuccess(true)
    } catch { setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.') }
    finally  { setLoading(false) }
  }

  const filteredTracks = tracks.filter(t =>
    t.name.toLowerCase().includes(trackSearch.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(trackSearch.toLowerCase())
  )

  // ══════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════
  if (success) {
    const isTeacher = accountType === 'teacher'
    return (
      <div className="ccc-register-root min-h-screen flex items-center justify-center p-4" dir="rtl">
        <style>{CCC_STYLES}</style>
        <div className="ccc-card w-full max-w-md text-center p-8 sm:p-10 rounded-2xl">
          <div className="ccc-success-bounce w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: isTeacher ? 'linear-gradient(135deg, var(--ccc-primary), #1c3459)' : 'linear-gradient(135deg, var(--ccc-secondary), #2a6e3f)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            {isTeacher ? <Briefcase className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[var(--ccc-primary)] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--ccc-primary)]">Code Craft Core</span>
            <Sparkles className="w-4 h-4 text-[var(--ccc-primary)] animate-pulse" />
          </div>

          <h2 className="text-2xl font-black mb-2 text-[var(--ccc-text-main)]">
            {isTeacher ? 'طلبك قيد المراجعة! 📋' : 'مرحباً بك في مجتمعنا! 🎉'}
          </h2>

          {isTeacher ? (
            <>
              <p className="text-sm leading-relaxed mb-4 text-[var(--ccc-text-muted)]">
                تم إرسال طلب تسجيل المعلم بنجاح. ستتلقى إشعاراً على{' '}
                <span className="font-bold text-[var(--ccc-primary)]">{email}</span>{' '}
                خلال <strong>2–5 أيام عمل</strong> بقرار الإدارة.
              </p>
              {/* Teacher pending steps */}
              <div className="text-right bg-[var(--ccc-bg)] border border-[var(--ccc-border)] rounded-xl p-4 mb-6 space-y-2.5">
                {[
                  { n:'1', t:'تفعيل بريدك الإلكتروني', d:'تحقق من رسالة التفعيل في بريدك' },
                  { n:'2', t:'مراجعة الإدارة',          d:'فريقنا يراجع ملفك المهني' },
                  { n:'3', t:'قبول الطلب وتفعيل الحساب',d:'ستصلك رسالة تأكيد بعد القبول' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: 'var(--ccc-primary)' }}>{s.n}</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--ccc-text-main)]">{s.t}</p>
                      <p className="text-[11px] text-[var(--ccc-text-muted)]">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed mb-6 text-[var(--ccc-text-muted)]">
                أرسلنا رابط التفعيل إلى{' '}
                <span className="font-bold text-[var(--ccc-primary)]">{contactMethod === 'email' ? email : `${countryCode} ${phone}`}</span>
                . بعد التفعيل تبدأ رحلتك التنافسية!
              </p>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-right border border-[var(--ccc-accent-border)] bg-[var(--ccc-accent-ghost)]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-[#FF9F1C] to-[#e8850a]">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--ccc-text-main)]">+100 عملة كرافت</p>
                  <p className="text-xs text-[var(--ccc-text-muted)]">ستُضاف تلقائياً بعد تفعيل حسابك 🪙</p>
                </div>
              </div>
            </>
          )}

          <Link href="/login" className="ccc-btn-primary flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-sm text-white cursor-pointer">
            <Zap className="w-4 h-4" /> {isTeacher ? 'تسجيل الدخول ومتابعة الطلب' : 'تسجيل الدخول الآن'}
          </Link>
          {!isTeacher && (
            <p className="text-xs mt-4 text-[var(--ccc-text-muted)]">
              لم يصلك رابط التفعيل؟{' '}
              <button className="font-bold underline text-[#FF9F1C] cursor-pointer bg-transparent border-none">أعد الإرسال</button>
            </p>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ══════════════════════════════════════════════════════════
  return (
    <div className="ccc-register-root min-h-screen py-8 px-4 flex flex-col justify-between" dir="rtl">
      <style>{CCC_STYLES}</style>

      <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center my-4">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-8 items-start w-full">

          {/* ─── Form Card ─── */}
          <div className="ccc-card p-6 sm:p-8 w-full" style={{ borderRadius: '16px' }}>
            <WizardBar current={step} steps={steps} />

            {/* Step heading */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-black mb-1 text-[var(--ccc-text-main)]">
                {step === 1 && 'إنشاء حساب جديد'}
                {step === 2 && (accountType === 'teacher' ? 'بيانات المعلم الأساسية' : 'أدخل بياناتك الأساسية')}
                {step === 3 && (accountType === 'teacher' ? 'ملفك المهني كمعلم' : 'المسارات والإنهاء')}
              </h1>
              <p className="text-xs text-[var(--ccc-text-muted)] leading-relaxed">
                {step === 1 && 'اختر نوع حسابك للبدء في إنشاء ملفك الشخصي على المنصة.'}
                {step === 2 && 'معلوماتك الشخصية محمية بالكامل ولن تُشارك مع أي طرف خارجي.'}
                {step === 3 && accountType === 'teacher' && 'أكمل ملفك المهني — ستتم مراجعته من قِبل الإدارة قبل تفعيل صلاحيات النشر.'}
                {step === 3 && accountType !== 'teacher' && 'اختر مسارك الرئيسي وراجع ملخص حسابك لإتمام التسجيل.'}
              </p>
            </div>

            {/* Global error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-5 border border-[#D93025]/20 bg-[#D93025]/08" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D93025]" />
                <p className="text-xs font-bold text-[#D93025]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={`ccc-step-content ${slideClass}`} key={`${step}-${accountType}`}>

                {/* ════ STEP 1 ════ */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className={`grid grid-cols-2 gap-4 ${shakeKey === 'type' ? 'ccc-shake' : ''}`}>
                      <AccountTypeCard type="student" selected={accountType === 'student'} onSelect={() => { setAccountType('student'); setError(null) }} />
                      <AccountTypeCard type="teacher" selected={accountType === 'teacher'} onSelect={() => { setAccountType('teacher'); setError(null) }} />
                    </div>

                    {/* Teacher notice banner */}
                    {accountType === 'teacher' && (
                      <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--ccc-secondary)]/20 bg-[var(--ccc-secondary-ghost)] animate-fade-in">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--ccc-secondary)]" />
                        <div>
                          <p className="text-xs font-bold text-[var(--ccc-text-main)] mb-0.5">طلب المعلم يمر بمراجعة إدارية</p>
                          <p className="text-[11px] leading-relaxed text-[var(--ccc-text-muted)]">
                            ستُكمل بياناتك الأساسية ثم ملفك المهني (تخصص، مهارات، CV). تُفعَّل صلاحيات إنشاء الدورات فقط بعد قبول الإدارة.
                          </p>
                        </div>
                      </div>
                    )}

                    <button type="button" onClick={nextStep1}
                      className="ccc-btn-primary w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                      متابعة <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-center text-xs text-[var(--ccc-text-muted)]">
                      لديك حساب؟{' '}
                      <Link href="/login" className="font-bold hover:underline text-[var(--ccc-primary)]">سجّل الدخول</Link>
                    </p>
                  </div>
                )}

                {/* ════ STEP 2 — Shared Basic Info ════ */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Name */}
                    <Field label="الاسم الكامل" error={fieldErrors.name}>
                      <div className={`relative ${shakeKey === 'name' ? 'ccc-shake' : ''}`}>
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                        <input type="text" required value={name}
                          onChange={e => { setName(e.target.value); setFieldErrors(p => ({...p,name:''})) }}
                          placeholder="مثال: أحمد عبد الله" className={`${inputBase} pl-10 pr-4`} />
                      </div>
                    </Field>

                    {/* Contact method toggle */}
                    <div className="flex gap-2 p-1 bg-[var(--ccc-bg)] rounded-xl border border-[var(--ccc-border)]">
                      {(['email','phone'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setContactMethod(m)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${contactMethod === m ? 'bg-[var(--ccc-primary)] text-white shadow-sm' : 'text-[var(--ccc-text-muted)]'}`}>
                          {m === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
                        </button>
                      ))}
                    </div>

                    {/* Email or Phone */}
                    {contactMethod === 'email' ? (
                      <Field label="البريد الإلكتروني" error={fieldErrors.email}>
                        <div className={`relative ${shakeKey === 'email' ? 'ccc-shake' : ''}`}>
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input type="email" required dir="ltr" value={email}
                            onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({...p,email:''})) }}
                            placeholder="username@domain.com" className={`${inputBase} pl-10 pr-4 text-left`} />
                        </div>
                      </Field>
                    ) : (
                      <Field label="رقم الهاتف" error={fieldErrors.phone}>
                        <div className={`flex gap-2 ${shakeKey === 'phone' ? 'ccc-shake' : ''}`}>
                          <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                            className="h-11 px-3 text-xs rounded-xl border bg-[var(--ccc-input)] border-[var(--ccc-border)] text-[var(--ccc-text-main)] outline-none">
                            {['+966','+971','+965','+962','+20','+1','+44'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                            <input type="tel" required dir="ltr" value={phone}
                              onChange={e => { setPhone(e.target.value); setFieldErrors(p => ({...p,phone:''})) }}
                              placeholder="501234567" className={`${inputBase} pl-10 pr-4 text-left`} />
                          </div>
                        </div>
                      </Field>
                    )}

                    {/* Password */}
                    <Field label="كلمة المرور" error={fieldErrors.password}>
                      <div className={`relative ${shakeKey === 'password' ? 'ccc-shake' : ''}`}>
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                        <input type={showPw ? 'text' : 'password'} required value={password}
                          onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p,password:''})) }}
                          placeholder="8 أحرف على الأقل" className={`${inputBase} pl-10 pr-10`} />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex gap-1.5">
                            {[25,50,75,100].map((thresh,i) => (
                              <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                style={{ background: strength.pct >= thresh ? strength.color : 'var(--ccc-border)' }} />
                            ))}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[11px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
                            <span className="text-[11px] text-[var(--ccc-text-muted)]">قوة كلمة المرور</span>
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Confirm Password */}
                    <Field label="تأكيد كلمة المرور" error={fieldErrors.confirmPassword}>
                      <div className={`relative ${shakeKey === 'confirmPassword' ? 'ccc-shake' : ''}`}>
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                        <input type={showConfirmPw ? 'text' : 'password'} required value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p,confirmPassword:''})) }}
                          placeholder="أعد إدخال كلمة المرور" className={`${inputBase} pl-10 pr-10`} />
                        <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>

                    <div className="flex gap-3 pt-3">
                      <button type="button" onClick={() => goTo(1)}
                        className="ccc-btn-secondary h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        <ArrowRight className="w-4 h-4" /> السابق
                      </button>
                      <button type="button" onClick={nextStep2}
                        className="ccc-btn-primary flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        متابعة <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ════ STEP 3 — STUDENT: Tracks ════ */}
                {step === 3 && accountType === 'student' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                      <input type="text" value={trackSearch} onChange={e => setTrackSearch(e.target.value)}
                        placeholder="ابحث عن مسار تعليمي..." className={`${inputBase} pl-10 pr-4`} />
                    </div>

                    <div className={`space-y-3 ${shakeKey === 'tracks' ? 'ccc-shake' : ''}`}>
                      {tracksLoading ? (
                        <div className="grid gap-3">{[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
                      ) : filteredTracks.length === 0 ? (
                        <div className="text-center py-6 text-[var(--ccc-text-muted)]">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-xs">لا توجد مسارات مطابقة لبحثك</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-56 overflow-y-auto pl-1 ccc-scrollbar">
                          {filteredTracks.map((track, idx) => (
                            <TrackCard key={track.id} track={track} colorIdx={idx}
                              isPrimary={primaryTrackId === track.id}
                              isSecondary={secondaryTrackIds.includes(track.id)}
                              onSelectPrimary={() => { setPrimaryTrackId(track.id); setSecondaryTrackIds(c => c.filter(id => id !== track.id)); setError(null) }}
                              onToggleSecondary={() => toggleSecondary(track.id)} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary mini card */}
                    <div className="rounded-2xl p-4 space-y-2.5 bg-[var(--ccc-bg)] border border-[var(--ccc-border)]">
                      <p className="text-xs font-bold flex items-center gap-1.5 text-[var(--ccc-text-main)]">
                        <CheckCircle2 className="w-4 h-4 text-[var(--ccc-secondary)]" /> ملخص الحساب
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          { label: 'الاسم',          value: name },
                          { label: 'المسار الرئيسي', value: tracks.find(t => t.id === primaryTrackId)?.name ?? '—' },
                          { label: contactMethod === 'email' ? 'البريد' : 'الهاتف', value: contactMethod === 'email' ? (email.length > 20 ? email.slice(0,18)+'…' : email) : `${countryCode} ${phone}` },
                          { label: 'مسارات ثانوية', value: secondaryTrackIds.length > 0 ? `${secondaryTrackIds.length} مسار` : 'لا يوجد' },
                        ].map(({label,value}) => (
                          <div key={label}>
                            <p className="text-[10px] font-bold text-[var(--ccc-text-muted)]">{label}</p>
                            <p className="text-xs font-black truncate text-[var(--ccc-text-main)] mt-0.5">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Goals */}
                    <Field label="أهداف التعلم (اختياري)">
                      <div className="relative">
                        <Target className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none text-slate-400" />
                        <textarea rows={2} value={learningGoals} onChange={e => setLearningGoals(e.target.value)}
                          placeholder={'• إتقان خوارزميات الويب\n• بناء محفظة أعمال'}
                          className="w-full px-4 pl-10 py-2.5 text-xs outline-none transition-all duration-200 resize-none rounded-xl border bg-[var(--ccc-input)] border-[var(--ccc-border)] text-[var(--ccc-text-main)] leading-relaxed" />
                      </div>
                    </Field>

                    {/* Referral */}
                    <div className="rounded-xl p-3 border border-[var(--ccc-accent-border)] bg-[var(--ccc-accent-ghost)]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-[#FF9F1C] to-[#e8850a]">
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ccc-text-main)]">كود الإحالة</p>
                          <p className="text-[10px] text-[var(--ccc-text-muted)]">احصل على <span className="font-bold text-[#FF9F1C]">+100 عملة</span> 🪙</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[#FF9F1C]" />
                        <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="CRAFT-XXXXXX"
                          className={`${inputBase} pl-10 pr-4 uppercase font-mono tracking-wider`}
                          style={{ borderColor: 'var(--ccc-accent-border)', color: '#FF9F1C' }} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => goTo(2)}
                        className="ccc-btn-secondary h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        <ArrowRight className="w-4 h-4" /> السابق
                      </button>
                      <button type="submit" disabled={loading}
                        className="ccc-btn-primary flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Zap className="w-4 h-4" /> إنهاء وإنشاء الحساب</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ════ STEP 3 — TEACHER: Professional Profile ════ */}
                {step === 3 && accountType === 'teacher' && (
                  <div className="space-y-4">
                    {/* Pending notice */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--ccc-secondary)]/20 bg-[var(--ccc-secondary-ghost)]">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--ccc-secondary)]" />
                      <p className="text-[11px] leading-relaxed text-[var(--ccc-text-muted)]">
                        سيتم إنشاء حسابك بوضع <strong className="text-[var(--ccc-text-main)]">قيد المراجعة</strong>. تُفعَّل صلاحيات نشر الدورات فقط بعد قبول الإدارة.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Country */}
                      <Field label="الدولة" error={fieldErrors.country}>
                        <div className={`relative ${shakeKey === 'country' ? 'ccc-shake' : ''}`}>
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input type="text" value={country}
                            onChange={e => { setCountry(e.target.value); setFieldErrors(p => ({...p,country:''})) }}
                            placeholder="المملكة العربية السعودية" className={`${inputBase} pl-10 pr-4`} />
                        </div>
                      </Field>

                      {/* Years of Experience */}
                      <Field label="سنوات الخبرة" error={fieldErrors.yearsOfExperience}>
                        <div className={`relative ${shakeKey === 'yearsOfExperience' ? 'ccc-shake' : ''}`}>
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input type="number" min="1" max="50" value={yearsOfExperience}
                            onChange={e => { setYearsOfExperience(e.target.value); setFieldErrors(p => ({...p,yearsOfExperience:''})) }}
                            placeholder="مثال: 5" className={`${inputBase} pl-10 pr-4`} />
                        </div>
                      </Field>
                    </div>

                    {/* Specialization */}
                    <Field label="التخصص الرئيسي" error={fieldErrors.specialization}>
                      <div className={`relative ${shakeKey === 'specialization' ? 'ccc-shake' : ''}`}>
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                        <input type="text" value={specialization}
                          onChange={e => { setSpecialization(e.target.value); setFieldErrors(p => ({...p,specialization:''})) }}
                          placeholder="مثال: مطور ويب - تخصص React وNext.js" className={`${inputBase} pl-10 pr-4`} />
                      </div>
                    </Field>

                    {/* Skills */}
                    <Field label="المهارات (مفصولة بفاصلة)" error={fieldErrors.skills}
                      hint="مثال: JavaScript, Python, React, Node.js, SQL">
                      <div className={`relative ${shakeKey === 'skills' ? 'ccc-shake' : ''}`}>
                        <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                        <input type="text" value={skills}
                          onChange={e => { setSkills(e.target.value); setFieldErrors(p => ({...p,skills:''})) }}
                          placeholder="JavaScript, React, Node.js, Python..." className={`${inputBase} pl-10 pr-4`} />
                      </div>
                    </Field>

                    {/* Bio */}
                    <Field label="السيرة المهنية" error={fieldErrors.bio}
                      hint="اشرح خبرتك وإنجازاتك المهنية باختصار مقنع (100–400 حرف)">
                      <div className={`relative ${shakeKey === 'bio' ? 'ccc-shake' : ''}`}>
                        <FileText className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none text-slate-400" />
                        <textarea rows={3} value={bio}
                          onChange={e => { setBio(e.target.value); setFieldErrors(p => ({...p,bio:''})) }}
                          placeholder="أنا مطور ويب بخبرة 5 سنوات، عملت في تطوير تطبيقات React وNext.js وقدّمت دورات لأكثر من 500 طالب..."
                          className="w-full px-4 pl-10 py-2.5 text-xs outline-none transition-all duration-200 resize-none rounded-xl border bg-[var(--ccc-input)] border-[var(--ccc-border)] text-[var(--ccc-text-main)] leading-relaxed" />
                      </div>
                    </Field>

                    {/* CV Upload / URL — required */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[var(--ccc-text-main)]">السيرة الذاتية (CV) <span className="text-red-500">*</span></label>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 text-[10px] font-bold border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => { setCvMode('file'); setFieldErrors(p => ({...p,cvUrl:''})) }}
                            className={`px-3 py-1 rounded-md transition-all ${cvMode === 'file' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-650' : 'text-slate-500'}`}
                          >
                            رفع ملف
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCvMode('url'); setFieldErrors(p => ({...p,cvUrl:''})) }}
                            className={`px-3 py-1 rounded-md transition-all ${cvMode === 'url' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-650' : 'text-slate-500'}`}
                          >
                            رابط خارجي
                          </button>
                        </div>
                      </div>

                      {cvMode === 'file' ? (
                        <div className={`rounded-xl border border-dashed p-4 text-center transition-all ${
                          uploadingCv 
                            ? 'border-indigo-300 bg-indigo-50/10' 
                            : cvUrl 
                            ? 'border-emerald-300 bg-emerald-50/10' 
                            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            disabled={uploadingCv}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setUploadingCv(true)
                              setCvFileName(file.name)
                              setError(null)
                              const url = await uploadCV(file)
                              if (url) {
                                setCvUrl(url)
                                setFieldErrors(p => ({...p,cvUrl:''}))
                              } else {
                                setError('فشل رفع الملف، يرجى المحاولة مرة أخرى.')
                              }
                              setUploadingCv(false)
                            }}
                            className="hidden"
                            id="cv-file-upload"
                          />
                          <label htmlFor="cv-file-upload" className="cursor-pointer block space-y-2">
                            {uploadingCv ? (
                              <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-500">جاري رفع الملف السحابي ({cvFileName})...</span>
                              </div>
                            ) : cvUrl ? (
                              <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">تم رفع الملف بنجاح!</span>
                                <span className="text-[10px] text-slate-400 truncate max-w-xs">{cvFileName || 'ملف السيرة الذاتية'}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                                <FileText className="w-6 h-6 text-slate-400" />
                                <span className="text-xs text-slate-500">انقر هنا لاختيار ملف السيرة الذاتية (PDF, Doc, صور)</span>
                                <span className="text-[10px] text-slate-400">الحد الأقصى للحجم 10 ميجا</span>
                              </div>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className={`relative ${shakeKey === 'cvUrl' ? 'ccc-shake' : ''}`}>
                          <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input
                            type="url"
                            dir="ltr"
                            value={cvUrl}
                            onChange={e => { setCvUrl(e.target.value); setFieldErrors(p => ({...p,cvUrl:''})) }}
                            placeholder="https://drive.google.com/file/..."
                            className={`${inputBase} pl-10 pr-4 text-left text-[11px]`}
                          />
                        </div>
                      )}
                      
                      {fieldErrors.cvUrl && (
                        <p className="text-[10px] text-red-500 font-bold">{fieldErrors.cvUrl}</p>
                      )}
                      {!fieldErrors.cvUrl && cvMode === 'url' && (
                        <p className="text-[10px] text-slate-400">أرفق رابطاً لملف PDF عام (Google Drive, Dropbox, أو أي رابط مباشر)</p>
                      )}
                    </div>

                    {/* Optional links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="رابط LinkedIn (اختياري)">
                        <div className="relative">
                          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input type="url" dir="ltr" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/in/..." className={`${inputBase} pl-10 pr-4 text-left text-[11px]`} />
                        </div>
                      </Field>
                      <Field label="الموقع أو معرض الأعمال (اختياري)">
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                          <input type="url" dir="ltr" value={portfolioWebsite} onChange={e => setPortfolioWebsite(e.target.value)}
                            placeholder="https://yourportfolio.com" className={`${inputBase} pl-10 pr-4 text-left text-[11px]`} />
                        </div>
                      </Field>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => goTo(2)}
                        className="ccc-btn-secondary h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        <ArrowRight className="w-4 h-4" /> السابق
                      </button>
                      <button type="submit" disabled={loading}
                        className="ccc-btn-primary flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري إرسال الطلب...</> : <><Zap className="w-4 h-4" /> إرسال طلب المعلم</>}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-4 flex justify-center gap-5 flex-wrap border-t border-[var(--ccc-border)]">
              {['سياسة الخصوصية','الشروط والأحكام','مساعدة'].map(link => (
                <Link key={link} href="#" className="text-[11px] text-[var(--ccc-text-muted)] hover:underline hover:text-[var(--ccc-primary)] transition-colors">{link}</Link>
              ))}
            </div>
          </div>

          {/* ─── Side Panel ─── */}
          <SidePanel accountType={accountType} />

        </div>
      </div>

      <footer className="w-full text-center text-[10px] text-[var(--ccc-text-muted)] py-4 select-none">
        منصة Code Craft Core © {new Date().getFullYear()} · جميع الحقوق محفوظة
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SCOPED CSS
// ═══════════════════════════════════════════════════════════
const CCC_STYLES = `
  .ccc-register-root {
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
  .dark .ccc-register-root {
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
    transition: all 250ms cubic-bezier(0.4,0,0.2,1);
  }
  .ccc-btn-primary:hover:not(:disabled) {
    background: var(--ccc-primary-dark);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px var(--ccc-primary-focus);
  }
  .ccc-btn-primary:active:not(:disabled) { transform: scale(0.98); }

  .ccc-btn-secondary {
    background: transparent;
    color: var(--ccc-secondary);
    border: 2px solid var(--ccc-secondary);
    transition: all 250ms cubic-bezier(0.4,0,0.2,1);
  }
  .ccc-btn-secondary:hover {
    background: var(--ccc-secondary-ghost);
    transform: translateY(-1px);
  }

  @keyframes cccShake {
    0%,100% { transform: translateX(0); }
    15% { transform: translateX(-5px); }
    35% { transform: translateX(5px); }
    55% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
    90% { transform: translateX(-1px); }
  }
  .ccc-shake { animation: cccShake 0.55s cubic-bezier(.36,.07,.19,.97) both; }

  @keyframes cccSlideInRight  { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
  @keyframes cccSlideInLeft   { from { opacity:0; transform:translateX(24px);  } to { opacity:1; transform:translateX(0); } }
  @keyframes cccSlideOutLeft  { from { opacity:1; transform:translateX(0); }  to { opacity:0; transform:translateX(24px);  } }
  @keyframes cccSlideOutRight { from { opacity:1; transform:translateX(0); }  to { opacity:0; transform:translateX(-24px); } }
  .ccc-slide-in-right  { animation: cccSlideInRight  0.22s ease-out forwards; }
  .ccc-slide-in-left   { animation: cccSlideInLeft   0.22s ease-out forwards; }
  .ccc-slide-out-left  { animation: cccSlideOutLeft  0.18s ease-in  forwards; }
  .ccc-slide-out-right { animation: cccSlideOutRight 0.18s ease-in  forwards; }

  @keyframes cccSuccessBounce {
    0%  { transform:scale(0); opacity:0; }
    60% { transform:scale(1.12); opacity:1; }
    80% { transform:scale(0.96); }
    100%{ transform:scale(1); }
  }
  .ccc-success-bounce { animation: cccSuccessBounce 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards; }

  .ccc-scrollbar::-webkit-scrollbar { width: 5px; }
  .ccc-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .ccc-scrollbar::-webkit-scrollbar-thumb { background: var(--ccc-primary-focus); border-radius: 9999px; }

  .ccc-register-root input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px var(--ccc-input) inset !important;
    -webkit-text-fill-color: var(--ccc-text-main) !important;
  }
`
