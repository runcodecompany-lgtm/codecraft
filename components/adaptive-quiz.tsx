"use client"

import React, { useState, useEffect, useRef } from "react"
import { HelpCircle, ArrowRight, Award, Flame, RefreshCw, CheckCircle2, XCircle, Timer, Coins } from "lucide-react"
import { getQuizQuestion, submitQuizAnswer, QuizQuestion } from "@/actions/quiz"
import { DifficultyLevel } from "@prisma/client"

interface AdaptiveQuizProps {
  quizId: string | null
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  BEGINNER: "سهل",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
}

const difficultyColors: Record<DifficultyLevel, string> = {
  BEGINNER: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  INTERMEDIATE: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  ADVANCED: "bg-rose-500/15 border-rose-500/30 text-rose-400",
}

export default function AdaptiveQuiz({ quizId }: AdaptiveQuizProps) {
  // Quiz states
  const [question, setQuestion] = useState<Omit<QuizQuestion, "correctAnswer"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<{
    submitted: boolean
    isCorrect: boolean
    correctAnswer: string
  } | null>(null)

  // Session stats kept in state and updated via server actions response
  const [quizState, setQuizState] = useState({
    answeredQuestionIds: [] as string[],
    correctCount: 0,
    totalAnswered: 0,
    currentDifficulty: "BEGINNER" as DifficultyLevel,
  })

  const [answersHistory, setAnswersHistory] = useState<{ questionId: string; selectedAnswer: string }[]>([])

  // Results screen
  const [results, setResults] = useState<{
    totalQuestions: number
    correctCount: number
    accuracy: number
    coinsEarned: number
    xpGained: number
  } | null>(null)

  // Timer: 30 seconds per question
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch first question on mount
  useEffect(() => {
    async function loadFirstQuestion() {
      setLoading(true)
      try {
        const firstQ = await getQuizQuestion(quizId, "BEGINNER", [])
        setQuestion(firstQ)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadFirstQuestion()
  }, [quizId])

  // Timer ticking logic
  useEffect(() => {
    if (loading || results || answerResult?.submitted) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          // Auto submit with empty answer
          handleAutoSubmitTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [question, loading, results, answerResult])

  const handleAutoSubmitTimeOut = () => {
    handleSubmitAnswer("")
  }

  const handleSubmitAnswer = async (option: string) => {
    if (!question || answerResult?.submitted) return

    setSelectedOption(option)
    setLoading(true)

    const updatedHistory = [...answersHistory, { questionId: question.id, selectedAnswer: option }]
    setAnswersHistory(updatedHistory)

    try {
      const response = await submitQuizAnswer({
        quizId,
        questionId: question.id,
        selectedAnswer: option,
        currentDifficulty: quizState.currentDifficulty,
        answeredQuestionIds: quizState.answeredQuestionIds,
        correctCount: quizState.correctCount,
        totalAnswered: quizState.totalAnswered,
        answersHistory: updatedHistory,
      })

      if (response.error) {
        alert(response.error)
        setLoading(false)
        return
      }

      setAnswerResult({
        submitted: true,
        isCorrect: response.correct || false,
        correctAnswer: response.correctAnswer || "",
      })

      if (response.isFinished && response.summary) {
        // Delay moving to results screen for feedback animation
        setTimeout(() => {
          setResults(response.summary)
          setLoading(false)
        }, 2000)
      } else if (response.nextQuestion && response.updatedState) {
        // Store next question information to transition to when user clicks Next
        setQuizState({
          answeredQuestionIds: response.updatedState.answeredQuestionIds,
          correctCount: response.updatedState.correctCount,
          totalAnswered: response.updatedState.totalAnswered,
          currentDifficulty: response.nextDifficulty as DifficultyLevel,
        })
        setNextQuestionData(response.nextQuestion)
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  // Temporary container to hold the next question until the user clicks "Next"
  const [nextQuestionData, setNextQuestionData] = useState<Omit<QuizQuestion, "correctAnswer"> | null>(null)

  const handleNextQuestion = () => {
    if (nextQuestionData) {
      setQuestion(nextQuestionData)
      setNextQuestionData(null)
      setSelectedOption(null)
      setAnswerResult(null)
    }
  }

  const handleRestartQuiz = async () => {
    setLoading(true)
    setResults(null)
    setSelectedOption(null)
    setAnswerResult(null)
    setNextQuestionData(null)
    setAnswersHistory([])
    setQuizState({
      answeredQuestionIds: [],
      correctCount: 0,
      totalAnswered: 0,
      currentDifficulty: "BEGINNER",
    })

    try {
      const firstQ = await getQuizQuestion(quizId, "BEGINNER", [])
      setQuestion(firstQ)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Results / Statistics Display
  if (results) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-8 text-center text-white animate-fadeIn" dir="rtl">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 mb-6">
          <Award className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black mb-2 bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          اكتمل الاختبار!
        </h2>
        <p className="text-slate-400 text-sm mb-8">لقد أنجزت الاختبار التكيفي بنجاح. إليك ملخص أدائك:</p>

        {/* Score Ring / Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <span className="block text-slate-500 text-xs font-bold mb-1">النتيجة</span>
            <span className="text-2xl font-black text-white">{results.correctCount} / {results.totalQuestions}</span>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <span className="block text-slate-500 text-xs font-bold mb-1">الدقة</span>
            <span className="text-2xl font-black text-violet-400">{results.accuracy}%</span>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <span className="block text-slate-500 text-xs font-bold mb-1">الخبرة (XP)</span>
            <span className="text-2xl font-black text-indigo-400">+{results.xpGained}</span>
          </div>
        </div>

        {/* Reward card */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-amber-400 animate-bounce" />
            <div className="text-right">
              <span className="text-amber-300 font-bold block text-sm">العملات المكتسبة</span>
              <span className="text-xs text-slate-400">تمت إضافتها تلقائياً لمحفظتك بأمان.</span>
            </div>
          </div>
          <span className="text-3xl font-black text-amber-300">+{results.coinsEarned}</span>
        </div>

        <button
          onClick={handleRestartQuiz}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 px-8 py-4 font-bold hover:scale-105 transition-all w-full justify-center shadow-lg shadow-violet-500/20"
        >
          <RefreshCw className="w-5 h-5" />
          <span>بدء اختبار جديد</span>
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 lg:p-8 text-white relative overflow-hidden" dir="rtl">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {loading && !question && (
        <div className="py-20 flex flex-col items-center gap-3 justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm">جاري تحميل السؤال...</p>
        </div>
      )}

      {question && (
        <div className="space-y-6">
          {/* Top Panel: Progress & Difficulty */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-slate-400">
                السؤال {quizState.totalAnswered + 1} من 5
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Difficulty indicator badge */}
              <div
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  difficultyColors[question.difficulty]
                }`}
              >
                المستوى التكيفي: {difficultyLabels[question.difficulty]}
              </div>

              {/* Timer indicator */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-sm">
                <Timer className={`w-4 h-4 ${timeLeft < 10 ? "text-rose-400 animate-pulse" : "text-slate-400"}`} />
                <span className={timeLeft < 10 ? "text-rose-400 font-bold" : "text-slate-200"}>{timeLeft}ث</span>
              </div>
            </div>
          </div>

          {/* Time Limit Progress Bar */}
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft < 10 ? "bg-rose-500" : timeLeft < 20 ? "bg-amber-500" : "bg-violet-500"
              }`}
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-xl font-bold leading-relaxed text-slate-100">{question.questionText}</h3>
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === option
              const isSubmitted = !!answerResult?.submitted
              const isCorrectAnswer = answerResult?.correctAnswer === option
              const isWrongSelection = isSelected && !answerResult?.isCorrect

              let optionStyle = "border-slate-800 bg-slate-950 hover:bg-slate-800/50 hover:border-slate-700"
              let icon = null

              if (isSubmitted) {
                if (isCorrectAnswer) {
                  optionStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                } else if (isWrongSelection) {
                  optionStyle = "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  icon = <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                } else {
                  optionStyle = "border-slate-800 bg-slate-950/40 text-slate-600 opacity-60 pointer-events-none"
                }
              } else if (isSelected) {
                optionStyle = "border-violet-500 bg-violet-500/10 text-violet-200"
              }

              return (
                <button
                  key={index}
                  onClick={() => !isSubmitted && handleSubmitAnswer(option)}
                  disabled={isSubmitted || loading}
                  className={`flex items-center justify-between gap-4 w-full p-4.5 rounded-2xl border text-right transition-all font-bold text-sm ${optionStyle}`}
                >
                  <span className="flex-grow">{option}</span>
                  {icon}
                </button>
              )
            })}
          </div>

          {/* Answer Feedback Banner */}
          {answerResult && (
            <div
              className={`rounded-2xl border p-5 transition-all animate-fadeIn ${
                answerResult.isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/5 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-black">
                  {answerResult.isCorrect ? "إجابة صحيحة رائعة!" : "إجابة خاطئة."}
                </span>
                {!answerResult.isCorrect && (
                  <span className="text-slate-400 text-xs">
                    الإجابة الصحيحة هي: <strong className="text-slate-200 font-bold">{answerResult.correctAnswer}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Navigation Footer */}
          {answerResult?.submitted && nextQuestionData && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 px-7 py-3 font-bold hover:scale-105 transition-all"
              >
                <span>السؤال التالي</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
