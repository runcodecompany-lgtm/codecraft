// app/dashboard/student/placement/page.tsx
"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getPlacementQuestions, submitPlacementTest } from "@/actions/placement"
import { getCurrentUserLearningSetup } from "@/actions/user-tracks"
import {
  Sparkles, HelpCircle, ArrowRight, ArrowLeft, Timer, Award, Coins, Zap,
  GraduationCap, CheckCircle, AlertCircle, BookOpen, ArrowUpRight, Target, Layers,
} from "lucide-react"
import Link from "next/link"
import { getTrackRoleLabel, getDifficultyLabelWithEnglish } from "@/lib/learning"

interface Question {
  id: string
  questionText: string
  options: string[]
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
}

interface TrackTestResult {
  score: number
  level: string
  arLevel: string
  coinsAward: number
  xpAward: number
  recommendedCourses: {
    id: string
    title: string
    slug: string
    description: string
    priceInCoins: number
  }[]
}

interface TrackSetup {
  trackId: string
  name: string
  description?: string | null
  isPrimary: boolean
  level: string
  latestAttempt: {
    id: string
    score: number
    level: string
    createdAt: Date
  } | null
  recommendations?: {
    id: string
    reason: string | null
    course: {
      id: string
      title: string
      slug: string
      description: string | null
      level: string
      priceInCoins: number
    }
  }[]
}

function PlacementTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryTrackId = searchParams.get("trackId")

  const [tracks, setTracks] = useState<TrackSetup[]>([])
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(-1)
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const [results, setResults] = useState<Record<string, TrackTestResult>>({})

  const [timeLeft, setTimeLeft] = useState(300)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const activeTrack = activeTrackIndex >= 0 ? tracks[activeTrackIndex] : null
  const currentTrackResult = activeTrack ? results[activeTrack.trackId] : null

  const loadTrackSetup = async () => {
    try {
      setLoading(true)
      const setup = await getCurrentUserLearningSetup()
      if (!setup.success || !setup.tracks) {
        throw new Error(setup.error || "تعذر تحميل المسارات التعليمية.")
      }
      const selectedTracks = setup.tracks.map((track) => ({
        trackId: track.trackId,
        name: track.name,
        description: track.description,
        isPrimary: track.isPrimary,
        level: track.level,
        latestAttempt: track.latestAttempt,
        recommendations: track.recommendations,
      }))
      setTracks(selectedTracks)
      if (queryTrackId) {
        const index = selectedTracks.findIndex((t) => t.trackId === queryTrackId)
        if (index >= 0) {
          setActiveTrackIndex(index)
          if (!selectedTracks[index].latestAttempt) {
            setIsTestStarted(true)
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "حدث خطأ أثناء تحميل بيانات اختبارات تحديد المستوى.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTrackSetup() }, [queryTrackId])

  useEffect(() => {
    async function loadQuestionsForTrack() {
      if (!activeTrack || !isTestStarted || activeTrack.latestAttempt || results[activeTrack.trackId]) return
      setLoading(true)
      setError(null)
      setAnswers({})
      setCurrentIndex(0)
      setTimeLeft(300)
      try {
        const data = await getPlacementQuestions(activeTrack.trackId)
        setQuestions(data)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "حدث خطأ أثناء تحميل أسئلة الاختبار.")
      } finally { setLoading(false) }
    }
    if (isTestStarted) void loadQuestionsForTrack()
  }, [activeTrack?.trackId, isTestStarted])

  useEffect(() => {
    if (loading || error || currentTrackResult || submitting || questions.length === 0 || !isTestStarted) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); handleAutoSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading, error, currentTrackResult, submitting, questions, isTestStarted])

  const selectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const handleNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1) }
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex((prev) => prev - 1) }
  const handleAutoSubmit = () => { void handleSubmit() }

  const handleSubmit = async () => {
    if (!activeTrack) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const response = await submitPlacementTest(answers, activeTrack.trackId)
      if (response.success && response.level) {
        setResults((current) => ({
          ...current,
          [activeTrack.trackId]: {
            score: response.score ?? 0, level: response.level, arLevel: response.arLevel ?? "",
            coinsAward: response.coinsAward ?? 0, xpAward: response.xpAward ?? 0,
            recommendedCourses: response.recommendedCourses ?? [],
          },
        }))
      } else { setError(response.error || "فشل إرسال نتائج الاختبار.") }
    } catch (err) { console.error(err); setError("حدث خطأ أثناء إرسال إجاباتك.") }
    finally { setSubmitting(false) }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ADVANCED": return { bg: "color-mix(in srgb, var(--cca-500) 12%, transparent)", text: "var(--cca-500)", label: "متقدم" }
      case "INTERMEDIATE": return { bg: "color-mix(in srgb, var(--ccc-500) 12%, transparent)", text: "var(--ccc-500)", label: "متوسط" }
      default: return { bg: "color-mix(in srgb, var(--ccs-500) 12%, transparent)", text: "var(--ccs-500)", label: "مبتدئ" }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════
  if (loading && !submitting) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ccc-space-3xl) 0", gap: "var(--ccc-space-lg)" }} dir="rtl">
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid color-mix(in srgb, var(--ccc-500) 20%, transparent)", borderTopColor: "var(--ccc-500)", animation: "spin 1s linear infinite" }} />
        <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-400)", fontWeight: 700 }}>جاري تحميل اختبارات تحديد المستوى...</p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // ERROR
  // ═══════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "var(--ccc-space-2xl)", borderRadius: "var(--ccc-radius-2xl)", background: "#fff", boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ccc-space-lg)" }} dir="rtl">
        <div style={{ width: 56, height: 56, borderRadius: "var(--ccc-radius-xl)", background: "color-mix(in srgb, var(--ccr-500) 10%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertCircle className="w-7 h-7" style={{ color: "var(--ccr-500)" }} />
        </div>
        <h2 style={{ font: "var(--ccc-h2)", color: "var(--ccn-900)", margin: 0 }}>عذراً، حدث خطأ ما!</h2>
        <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)" }}>{error}</p>
        <button
          onClick={() => { setError(null); setIsTestStarted(false); loadTrackSetup() }}
          style={{ padding: "10px 24px", borderRadius: "var(--ccc-radius-lg)", background: "var(--ccc-500)", color: "#fff", font: "var(--ccc-label)", fontWeight: 700, border: "none", cursor: "pointer" }}
        >
          العودة للمسارات
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // NO TRACKS
  // ═══════════════════════════════════════════════════════════════
  if (tracks.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "var(--ccc-space-2xl)", borderRadius: "var(--ccc-radius-2xl)", background: "#fff", boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ccc-space-lg)" }} dir="rtl">
        <div style={{ width: 64, height: 64, borderRadius: "var(--ccc-radius-xl)", background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GraduationCap className="w-8 h-8" style={{ color: "var(--ccc-500)" }} />
        </div>
        <div>
          <h2 style={{ font: "var(--ccc-h2)", color: "var(--ccn-900)", margin: 0 }}>لا توجد مسارات مختارة بعد</h2>
          <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)", marginTop: 4 }}>اختر مسارك الرئيسي أولاً من إعدادات الملف الشخصي</p>
        </div>
        <Link href="/dashboard/student/profile" style={{ padding: "12px 28px", borderRadius: "var(--ccc-radius-lg)", background: "var(--ccc-500)", color: "#fff", font: "var(--ccc-label)", fontWeight: 700, textDecoration: "none" }}>
          اذهب إلى الملف الشخصي
        </Link>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD — قائمة المسارات
  // ═══════════════════════════════════════════════════════════════
  if (!isTestStarted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-xl)" }} dir="rtl">
        {/* Hero */}
        <div style={{
          padding: "var(--ccc-space-2xl)", borderRadius: "var(--ccc-radius-2xl)",
          background: "#fff", boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
          borderTop: "4px solid var(--ccc-500)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: "var(--ccc-radius-full)", background: "color-mix(in srgb, var(--ccc-500) 7%, transparent)", border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)", font: "var(--ccc-caption)", fontWeight: 600, color: "var(--ccc-500)", marginBottom: "var(--ccc-space-sm)" }}>
            <Target className="w-3.5 h-3.5" />
            <span>تحديد المستوى</span>
          </div>
          <h1 style={{ font: "700 24px/32px var(--ccc-font-sans)", color: "var(--ccn-900)", margin: 0 }}>
            اختبارات تحديد المستوى
          </h1>
          <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)", marginTop: 4, maxWidth: 560 }}>
            قس مهاراتك في كل مسار لتحصل على المستوى الأنسب وخطة دراسية مخصصة
          </p>
        </div>

        {/* Track Cards */}
        <div style={{ display: "grid", gap: "var(--ccc-space-lg)" }} className="md:grid-cols-2">
          {tracks.map((track) => {
            const result = results[track.trackId]
            const isCompleted = Boolean(track.latestAttempt || result)
            const scoreText = result ? `${result.score} إجابات` : track.latestAttempt ? `${track.latestAttempt.score} إجابات` : ""
            const levelLabel = result?.arLevel || getDifficultyLabelWithEnglish(track.level as any)
            const recommended = result?.recommendedCourses || track.recommendations?.map(r => r.course) || []
            const lvlColor = getLevelColor(result?.level || track.level)

            return (
              <div key={track.trackId} style={{
                padding: "var(--ccc-space-xl)",
                borderRadius: "var(--ccc-radius-2xl)",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
                display: "flex", flexDirection: "column", gap: "var(--ccc-space-md)",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ font: "700 15px/22px var(--ccc-font-sans)", color: "var(--ccn-900)" }}>{track.name}</div>
                    <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", fontWeight: 500 }}>{getTrackRoleLabel(track.isPrimary)}</span>
                  </div>
                  {isCompleted ? (
                    <span style={{
                      padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                      background: lvlColor.bg, color: lvlColor.text,
                      font: "var(--ccc-micro)", fontWeight: 700,
                      border: "1px solid color-mix(in srgb, " + lvlColor.text + " 20%, transparent)",
                      whiteSpace: "nowrap",
                    }}>
                      {levelLabel}
                    </span>
                  ) : (
                    <span style={{
                      padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                      background: "color-mix(in srgb, var(--cca-500) 8%, transparent)",
                      color: "var(--cca-500)",
                      font: "var(--ccc-micro)", fontWeight: 700,
                      border: "1px solid color-mix(in srgb, var(--cca-500) 15%, transparent)",
                    }}>
                      غير مكتمل
                    </span>
                  )}
                </div>

                {track.description && (
                  <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", lineHeight: 1.7, margin: 0 }}>
                    {track.description}
                  </p>
                )}

                {/* Completed: Score + Level + Recommendations */}
                {isCompleted ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-md)" }}>
                    {/* Mini score row */}
                    <div style={{ display: "flex", gap: "var(--ccc-space-sm)" }}>
                      <div style={{
                        flex: 1, textAlign: "center", padding: "8px 12px",
                        borderRadius: "var(--ccc-radius-lg)", background: "var(--ccn-50)",
                      }}>
                        <div style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)" }}>النتيجة</div>
                        <div style={{ font: "700 14px/1 var(--ccc-font-sans)", color: "var(--ccn-900)", marginTop: 2 }}>{scoreText || "معدية"}</div>
                      </div>
                      <div style={{
                        flex: 1, textAlign: "center", padding: "8px 12px",
                        borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--ccc-500) 4%, transparent)",
                      }}>
                        <div style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)" }}>المستوى</div>
                        <div style={{ font: "700 14px/1 var(--ccc-font-sans)", color: "lvlColor.text", marginTop: 2 }}>{levelLabel}</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {recommended.length > 0 && (
                      <div>
                        <div style={{ font: "var(--ccc-caption)", fontWeight: 700, color: "var(--ccn-600)", marginBottom: "var(--ccc-space-sm)" }}>
                          الدورات المقترحة
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {recommended.map((course: any) => (
                            <Link key={course.id} href={`/courses/${course.slug}`} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 12px", borderRadius: "var(--ccc-radius-lg)",
                              background: "var(--ccn-50)", border: "1px solid var(--ccn-200)",
                              textDecoration: "none", transition: "all 0.15s",
                              font: "var(--ccc-caption)", color: "var(--ccn-700)", fontWeight: 600,
                            }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.title}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--ccc-500)", flexShrink: 0 }} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { const idx = tracks.findIndex(t => t.trackId === track.trackId); setActiveTrackIndex(idx); setIsTestStarted(true) }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px 0", width: "100%",
                      borderRadius: "var(--ccc-radius-lg)",
                      background: "var(--ccc-500)", color: "#fff",
                      font: "var(--ccc-label)", fontWeight: 600,
                      border: "none", cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: "0 1px 2px rgba(43,76,126,0.12)",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    ابدأ اختبار تحديد المستوى
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <Link href="/dashboard/student" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "12px 0", width: "100%",
          borderRadius: "var(--ccc-radius-lg)",
          border: "1px solid var(--ccn-200)",
          color: "var(--ccn-600)", font: "var(--ccc-label)", fontWeight: 600,
          textDecoration: "none", transition: "all 0.15s",
        }}>
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  if (currentTrackResult) {
    const lvlColor = getLevelColor(currentTrackResult.level)
    const scorePercent = questions.length > 0 ? Math.round((currentTrackResult.score / questions.length) * 100) : 0

    return (
      <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--ccc-space-xl)" }} dir="rtl">
        {/* Main result card */}
        <div style={{
          padding: "var(--ccc-space-2xl)", borderRadius: "var(--ccc-radius-2xl)",
          background: "#fff", boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
          textAlign: "center",
          borderTop: "4px solid var(--ccs-500)",
        }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "color-mix(in srgb, var(--ccs-500) 10%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--ccc-space-md)" }}>
            <Award className="w-8 h-8" style={{ color: "var(--ccs-500)" }} />
          </div>
          <h2 style={{ font: "700 22px/30px var(--ccc-font-sans)", color: "var(--ccn-900)", margin: 0 }}>
            اكتمل الاختبار بنجاح!
          </h2>
          <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)", marginTop: 4 }}>
            مسار {activeTrack?.name}
          </p>

          {/* Score ring */}
          <div style={{ width: 100, height: 100, margin: "var(--ccc-space-lg) auto", position: "relative" }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ccn-200)" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ccc-500)" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - scorePercent / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.7s ease", transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ font: "700 22px/1 var(--ccc-font-sans)", color: "var(--ccn-900)" }}>{currentTrackResult.score}</span>
              <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>/{questions.length}</span>
            </div>
          </div>

          {/* Level */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: "var(--ccc-radius-full)",
            background: lvlColor.bg, border: "1px solid color-mix(in srgb, " + lvlColor.text + " 20%, transparent)",
          }}>
            <span style={{ font: "var(--ccc-caption)", color: lvlColor.text, fontWeight: 700 }}>
              المستوى: {currentTrackResult.arLevel}
            </span>
          </div>
        </div>

        {/* Awards row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ccc-space-md)" }}>
          <div style={{
            padding: "var(--ccc-space-lg)", borderRadius: "var(--ccc-radius-xl)",
            background: "#fff", boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
            textAlign: "center",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--ccc-space-sm)" }}>
              <Zap className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
            </div>
            <div style={{ font: "700 20px/1 var(--ccc-font-sans)", color: "var(--ccc-500)" }}>+{currentTrackResult.xpAward}</div>
            <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>XP</div>
          </div>
          <div style={{
            padding: "var(--ccc-space-lg)", borderRadius: "var(--ccc-radius-xl)",
            background: "#fff", boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
            textAlign: "center",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--cca-500) 8%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--ccc-space-sm)" }}>
              <Coins className="w-5 h-5" style={{ color: "var(--cca-500)" }} />
            </div>
            <div style={{ font: "700 20px/1 var(--ccc-font-sans)", color: "var(--cca-500)" }}>+{currentTrackResult.coinsAward}</div>
            <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>Craft Coins</div>
          </div>
        </div>

        {/* Recommended courses */}
        {currentTrackResult.recommendedCourses.length > 0 && (
          <div style={{
            padding: "var(--ccc-space-lg)", borderRadius: "var(--ccc-radius-xl)",
            background: "#fff", boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
          }}>
            <div style={{ font: "var(--ccc-h4)", color: "var(--ccn-900)", fontWeight: 700, marginBottom: "var(--ccc-space-md)" }}>
              الدورات الموصى بها لمستواك
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-sm)" }}>
              {currentTrackResult.recommendedCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "var(--ccc-radius-lg)",
                  background: "var(--ccn-50)", border: "1px solid var(--ccn-200)",
                  textDecoration: "none", transition: "all 0.15s",
                }}>
                  <span style={{ font: "var(--ccc-body-sm)", fontWeight: 600, color: "var(--ccn-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {course.title}
                  </span>
                  <span style={{
                    font: "var(--ccc-micro)", fontWeight: 700,
                    padding: "2px 10px", borderRadius: "var(--ccc-radius-full)",
                    background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)",
                    color: "var(--ccc-500)", flexShrink: 0,
                  }}>
                    {course.priceInCoins === 0 ? "مجاني" : `${course.priceInCoins} CC`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => { setIsTestStarted(false); setActiveTrackIndex(-1); loadTrackSetup() }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 0", width: "100%",
            borderRadius: "var(--ccc-radius-lg)",
            background: "var(--ccc-500)", color: "#fff",
            font: "var(--ccc-label)", fontWeight: 600,
            border: "none", cursor: "pointer",
            boxShadow: "0 1px 2px rgba(43,76,126,0.12)",
          }}
        >
          العودة إلى لوحة الاختبارات
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST IN PROGRESS
  // ═══════════════════════════════════════════════════════════════
  const currentQ = questions[currentIndex]
  if (!activeTrack || !currentQ) return null

  const timerPercent = (timeLeft / 300) * 100
  const getTimerColor = () => {
    if (timeLeft < 60) return "var(--ccr-500)"
    if (timeLeft < 150) return "var(--cca-500)"
    return "var(--ccc-500)"
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }} dir="rtl">
      {submitting ? (
        <div style={{
          padding: "var(--ccc-space-3xl) var(--ccc-space-xl)",
          borderRadius: "var(--ccc-radius-2xl)",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ccc-space-md)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid color-mix(in srgb, var(--ccc-500) 20%, transparent)", borderTopColor: "var(--ccc-500)", animation: "spin 1s linear infinite" }} />
          <h3 style={{ font: "var(--ccc-h3)", color: "var(--ccn-900)", margin: 0 }}>جاري تصحيح إجاباتك...</h3>
          <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)" }}>يقوم النظام بتحديد مستواك المناسب في مسار {activeTrack.name}</p>
        </div>
      ) : (
        <div style={{
          padding: "var(--ccc-space-2xl)",
          borderRadius: "var(--ccc-radius-2xl)",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
          display: "flex", flexDirection: "column", gap: "var(--ccc-space-xl)",
        }}>
          {/* Track info + progress */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ccc-space-sm)" }}>
            <div>
              <div style={{ font: "var(--ccc-caption)", color: "var(--ccc-500)", fontWeight: 600, marginBottom: 2 }}>{getTrackRoleLabel(activeTrack.isPrimary)}</div>
              <h2 style={{ font: "var(--ccc-h3)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>
                {activeTrack.name}
              </h2>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: "var(--ccc-radius-full)",
              background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--ccc-500) 15%, transparent)",
              font: "var(--ccc-caption)", fontWeight: 700, color: "var(--ccc-500)",
            }}>
              السؤال {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Timer + Difficulty */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ccc-space-md)", flexWrap: "wrap" }}>
            <span style={{
              font: "var(--ccc-caption)", fontWeight: 600,
              padding: "4px 10px", borderRadius: "var(--ccc-radius-md)",
              background: "var(--ccn-50)", color: "var(--ccn-500)",
            }}>
              {currentQ.difficulty === "BEGINNER" ? "مبتدئ" : currentQ.difficulty === "INTERMEDIATE" ? "متوسط" : "متقدم"}
            </span>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: "var(--ccc-radius-md)",
              background: "var(--ccn-50)", direction: "ltr",
            }}>
              <Timer className="w-4 h-4" style={{ color: getTimerColor() }} />
              <span style={{
                font: "700 14px/1 monospace",
                color: timeLeft < 60 ? getTimerColor() : "var(--ccn-700)",
              }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Timer progress bar */}
          <div style={{ height: 5, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "var(--ccc-radius-full)",
              background: getTimerColor(),
              width: `${timerPercent}%`,
              transition: "width 1s linear, background 0.5s",
            }} />
          </div>

          {/* Question */}
          <div>
            <h3 style={{ font: "700 18px/28px var(--ccc-font-sans)", color: "var(--ccn-900)", margin: 0 }}>
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-sm)" }}>
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.id] === option
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(currentQ.id, option)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", width: "100%",
                    borderRadius: "var(--ccc-radius-xl)",
                    border: isSelected ? "2px solid var(--ccc-500)" : "1.5px solid var(--ccn-200)",
                    background: isSelected ? "color-mix(in srgb, var(--ccc-500) 6%, transparent)" : "var(--ccn-50)",
                    cursor: "pointer", textAlign: "right",
                    font: "var(--ccc-body-sm)", color: isSelected ? "var(--ccc-500)" : "var(--ccn-700)",
                    fontWeight: isSelected ? 700 : 500,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "var(--ccc-radius-md)",
                    background: isSelected ? "var(--ccc-500)" : "var(--ccn-200)",
                    color: isSelected ? "#fff" : "var(--ccn-500)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    font: "700 12px/1 var(--ccc-font-sans)", flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ flex: 1 }}>{option}</span>
                </button>
              )
            })}
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--ccc-space-sm)", borderTop: "1px solid var(--ccn-200)" }}>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "10px 16px",
                borderRadius: "var(--ccc-radius-lg)",
                border: "1.5px solid var(--ccn-200)",
                background: "var(--ccn-50)", color: "var(--ccn-600)",
                font: "var(--ccc-label)", fontWeight: 600, cursor: currentIndex === 0 ? "default" : "pointer",
                opacity: currentIndex === 0 ? 0.3 : 1,
                transition: "all 0.15s",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              السابق
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 20px",
                  borderRadius: "var(--ccc-radius-lg)",
                  background: "var(--ccs-500)", color: "#fff",
                  font: "var(--ccc-label)", fontWeight: 700,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(74,124,89,0.2)",
                }}
              >
                <CheckCircle className="w-4 h-4" />
                إنهاء الاختبار
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "10px 16px",
                  borderRadius: "var(--ccc-radius-lg)",
                  background: "var(--ccc-500)", color: "#fff",
                  font: "var(--ccc-label)", fontWeight: 600,
                  border: "none", cursor: "pointer",
                }}
              >
                التالي
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlacementTestPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ccc-space-3xl) 0", gap: "var(--ccc-space-lg)" }} dir="rtl">
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid color-mix(in srgb, var(--ccc-500) 20%, transparent)", borderTopColor: "var(--ccc-500)", animation: "spin 1s linear infinite" }} />
        <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-400)", fontWeight: 700 }}>جاري تحميل اختبارات التحديد...</p>
      </div>
    }>
      <PlacementTestContent />
    </Suspense>
  )
}
