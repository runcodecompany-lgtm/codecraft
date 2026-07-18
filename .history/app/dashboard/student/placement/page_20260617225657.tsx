// app/dashboard/student/placement/page.tsx
"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getPlacementQuestions, submitPlacementTest } from "@/actions/placement"
import { getCurrentUserLearningSetup } from "@/actions/user-tracks"
import { 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Timer, 
  Award, 
  Coins, 
  Zap, 
  GraduationCap, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { getTrackRoleLabel } from "@/lib/learning"

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
  latestAttempt: {
    id: string
    score: number
    level: string
    createdAt: Date
  } | null
}

export default function PlacementTestPage() {
  const router = useRouter()
  const [tracks, setTracks] = useState<TrackSetup[]>([])
  const [activeTrackIndex, setActiveTrackIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for test execution
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  
  // Results state
  const [results, setResults] = useState<Record<string, TrackTestResult>>({})

  // Timer: 5 minutes (300 seconds) for the entire test
  const [timeLeft, setTimeLeft] = useState(300)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const activeTrack = tracks[activeTrackIndex]
  const remainingTracks = tracks.filter((track) => !results[track.trackId] && !track.latestAttempt)
  const currentTrackResult = activeTrack ? results[activeTrack.trackId] : null
  const completedTrackCount = tracks.filter((track) => results[track.trackId] || track.latestAttempt).length

  useEffect(() => {
    async function loadTrackSetup() {
      try {
        const setup = await getCurrentUserLearningSetup()
        if (!setup.success || !setup.tracks) {
          throw new Error(setup.error || "تعذر تحميل المسارات التعليمية.")
        }

        const selectedTracks = setup.tracks.map((track) => ({
          trackId: track.trackId,
          name: track.name,
          description: track.description,
          isPrimary: track.isPrimary,
          latestAttempt: track.latestAttempt,
        }))

        setTracks(selectedTracks)

        const firstPendingIndex = selectedTracks.findIndex((track) => !track.latestAttempt)
        if (firstPendingIndex >= 0) {
          setActiveTrackIndex(firstPendingIndex)
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || "حدث خطأ أثناء تحميل بيانات اختبارات تحديد المستوى.")
      } finally {
        setLoading(false)
      }
    }
    loadTrackSetup()
  }, [])

  useEffect(() => {
    async function loadQuestionsForTrack() {
      if (!activeTrack || activeTrack.latestAttempt || results[activeTrack.trackId]) {
        setQuestions([])
        return
      }

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
      } finally {
        setLoading(false)
      }
    }

    void loadQuestionsForTrack()
  }, [activeTrack?.trackId, activeTrack?.latestAttempt, results])

  // Start timer when questions are loaded for the active track
  useEffect(() => {
    if (loading || error || currentTrackResult || submitting || questions.length === 0 || !activeTrack) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading, error, currentTrackResult, submitting, questions, activeTrack])

  const selectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleAutoSubmit = () => {
    void handleSubmit()
  }

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
            score: response.score ?? 0,
            level: response.level,
            arLevel: response.arLevel ?? "",
            coinsAward: response.coinsAward ?? 0,
            xpAward: response.xpAward ?? 0,
            recommendedCourses: response.recommendedCourses ?? [],
          },
        }))
      } else {
        setError(response.error || "فشل إرسال نتائج الاختبار.")
      }
    } catch (err) {
      console.error(err)
      setError("حدث خطأ أثناء إرسال إجاباتك.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white gap-4" dir="rtl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-400 font-bold text-sm">جاري تحميل اختبارات تحديد المستوى للمسارات المختارة...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center text-white space-y-4" dir="rtl">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-rose-300">عذراً، حدث خطأ ما!</h2>
        <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
        <Link
          href="/dashboard/student"
          className="inline-block rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-8 text-white space-y-6 animate-fade-in" dir="rtl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-2">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-l from-amber-400 to-orange-400 bg-clip-text text-transparent">
            لا توجد مسارات مختارة بعد
          </h2>
          <p className="text-slate-400 text-sm">اختر مسارك الرئيسي والمسارات الثانوية أولاً من إعدادات الملف الشخصي.</p>
        </div>
        <Link
          href="/dashboard/student/profile"
          className="block w-full py-4 text-center rounded-2xl bg-gradient-to-l from-amber-600 to-orange-600 hover:scale-[1.01] active:scale-100 text-sm font-bold shadow-lg shadow-amber-500/15 transition-all"
        >
          اذهب إلى الملف الشخصي
        </Link>
      </div>
    )
  }

  if (remainingTracks.length === 0 && !activeTrack) {
    return null
  }

  if (remainingTracks.length === 0 && tracks.length > 0) {
    return (
      <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-8 text-white space-y-8 animate-fade-in" dir="rtl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 mb-2">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            اكتملت جميع اختبارات تحديد المستوى
          </h2>
          <p className="text-slate-400 text-sm">تم تحديد مستوى مستقل لكل مسار تعليمي اخترته في ملفك.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tracks.map((track) => {
            const result = results[track.trackId]
            const latestAttempt = track.latestAttempt
            const levelLabel = result?.arLevel || latestAttempt?.level || "غير متاح"

            return (
              <div key={track.trackId} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg text-white">{track.name}</h3>
                    <p className="text-[11px] text-slate-400">{getTrackRoleLabel(track.isPrimary)}</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
                    {levelLabel}
                  </span>
                </div>
                {result && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <span className="block text-[10px] text-slate-500">النتيجة</span>
                      <span className="text-lg font-black">{result.score} / {questions.length || 6}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <span className="block text-[10px] text-slate-500">XP</span>
                      <span className="text-lg font-black text-indigo-400">+{result.xpAward}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <span className="block text-[10px] text-slate-500">العملات</span>
                      <span className="text-lg font-black text-amber-400">+{result.coinsAward}</span>
                    </div>
                  </div>
                )}
                {result?.recommendedCourses?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-300">الدورات الموصى بها لهذا المسار</p>
                    <div className="space-y-2">
                      {result.recommendedCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.slug}`}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-violet-500/40 transition-colors"
                        >
                          <span className="font-bold text-white">{course.title}</span>
                          <span className="text-slate-400">{course.priceInCoins === 0 ? "مجاني" : `${course.priceInCoins} CC`}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">لا توجد توصيات جديدة لهذا المسار حالياً.</p>
                )}
              </div>
            )
          })}
        </div>

        <Link
          href="/dashboard/student"
          className="block w-full py-4 text-center rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 hover:scale-[1.01] active:scale-100 text-sm font-bold shadow-lg shadow-violet-500/15 transition-all"
        >
          اذهب للوحة تحكم الطالب الرئيسية
        </Link>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  if (!activeTrack || !currentQ) return null

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 lg:p-8 text-white relative overflow-hidden" dir="rtl">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {submitting ? (
        <div className="py-20 flex flex-col items-center gap-3 justify-center text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <h3 className="font-bold text-lg text-slate-200">جاري مراجعة وتصحيح إجاباتك...</h3>
          <p className="text-xs text-slate-500">يقوم النظام الآن بتصحيح اختبارك وتحديد مستواك المناسب في مسار {activeTrack.name}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-indigo-300">{getTrackRoleLabel(activeTrack.isPrimary)}</p>
                <h2 className="text-lg font-black text-white">اختبار تحديد المستوى لمسار {activeTrack.name}</h2>
              </div>
              <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300">
                {completedTrackCount + 1} / {tracks.length}
              </span>
            </div>
            {activeTrack.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{activeTrack.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {tracks.map((track) => {
                const isDone = Boolean(results[track.trackId] || track.latestAttempt)
                const isActive = track.trackId === activeTrack.trackId

                return (
                  <span
                    key={track.trackId}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                        : isDone
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {track.name}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Header Panel */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-slate-400">
                السؤال {currentIndex + 1} من {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Difficulty badge */}
              <span className="text-xs font-bold px-3 py-1 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl">
                الصعوبة: {currentQ.difficulty === "BEGINNER" ? "سهل" : currentQ.difficulty === "INTERMEDIATE" ? "متوسط" : "متقدم"}
              </span>

              {/* Timer */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-sm">
                <Timer className={`w-4 h-4 ${timeLeft < 60 ? "text-rose-400 animate-pulse" : "text-slate-400"}`} />
                <span className={timeLeft < 60 ? "text-rose-400 font-bold animate-pulse" : "text-slate-200"}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Time indicator progress bar */}
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft < 60 ? "bg-rose-500" : timeLeft < 150 ? "bg-amber-500" : "bg-violet-500"
              }`}
              style={{ width: `${(timeLeft / 300) * 100}%` }}
            ></div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-lg md:text-xl font-bold leading-relaxed text-slate-100">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.id] === option
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(currentQ.id, option)}
                  className={`flex items-center w-full p-4 rounded-xl border text-right transition-all font-semibold text-sm ${
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 text-violet-200 font-bold"
                      : "border-slate-800 bg-slate-950 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="w-6 text-slate-500 text-xs font-mono">{idx + 1}.</span>
                  <span className="flex-grow">{option}</span>
                </button>
              )
            })}
          </div>

          {/* Nav Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              السابق
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                type="button"
                className="flex items-center gap-2 bg-gradient-to-l from-violet-600 to-indigo-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-violet-500/10 hover:opacity-90"
              >
                <CheckCircle className="w-4 h-4" />
                إنهاء وإرسال الاختبار
              </button>
            ) : (
              <button
                onClick={handleNext}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors text-xs font-bold"
              >
                التالي
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
