// components/ai-quiz-generator.tsx
'use client'

import React, { useState } from 'react'
import { Sparkles, FileQuestion, Loader2, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

interface Question {
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECT'
  options: string[]
  correctAnswer: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  points: number
}

interface GeneratedQuiz {
  id: string
  title: string
  questions: Question[]
  questionCount: number
}

interface AIQuizGeneratorProps {
  lessonId: string
}

export default function AIQuizGenerator({ lessonId }: AIQuizGeneratorProps) {
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  // Generate a quiz via API
  const handleGenerateQuiz = async (difficulty = 'MIXED', count = 5) => {
    setIsLoading(true)
    setQuiz(null)
    setCurrentIdx(0)
    setSelectedAnswers({})
    setShowResults(false)
    setScore(0)

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, difficulty, count })
      })

      if (res.ok) {
        const data = await res.json()
        setQuiz(data)
      } else {
        const err = await res.json()
        alert(err.error || 'حدث خطأ أثناء توليد الاختبار')
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('فشل الاتصال بالخادم لتوليد الاختبار')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (option: string) => {
    if (showResults || !quiz) return

    const question = quiz.questions[currentIdx]

    if (question.questionType === 'MULTIPLE_SELECT') {
      // Toggle selection for multiple select
      const currentSelection = selectedAnswers[currentIdx] || ''
      const selectedList = currentSelection ? currentSelection.split(', ') : []
      
      let newSelection: string[]
      if (selectedList.includes(option)) {
        newSelection = selectedList.filter(o => o !== option)
      } else {
        newSelection = [...selectedList, option]
      }
      
      setSelectedAnswers({
        ...selectedAnswers,
        [currentIdx]: newSelection.join(', ')
      })
    } else {
      // Single selection
      setSelectedAnswers({
        ...selectedAnswers,
        [currentIdx]: option
      })
    }
  }

  const handleNext = () => {
    if (!quiz) return
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      // Grade quiz and show results
      gradeQuiz()
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  const gradeQuiz = () => {
    if (!quiz) return
    let totalScore = 0
    
    quiz.questions.forEach((q, idx) => {
      const studentAns = (selectedAnswers[idx] || '').trim().toLowerCase()
      const correctAns = q.correctAnswer.trim().toLowerCase()
      
      if (q.questionType === 'MULTIPLE_SELECT') {
        // Sort selections to check equality
        const studentList = studentAns.split(',').map(s => s.trim()).sort().join(',')
        const correctList = correctAns.split(',').map(c => c.trim()).sort().join(',')
        if (studentList === correctList) {
          totalScore += q.points || 1
        }
      } else {
        if (studentAns === correctAns) {
          totalScore += q.points || 1
        }
      }
    })

    setScore(totalScore)
    setShowResults(true)
  }

  const getTotalPoints = () => {
    if (!quiz) return 0
    return quiz.questions.reduce((acc, q) => acc + (q.points || 1), 0)
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center flex flex-col items-center justify-center gap-3 h-[300px]" style={{ direction: 'rtl' }}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <div>
          <p className="text-xs font-bold text-slate-200">جاري قراءة محتوى الدرس وتأليف الأسئلة...</p>
          <p className="text-[10px] text-slate-500 mt-1">يصيغ لك الذكاء الاصطناعي اختباراً مخصصاً لتقييم فهمك</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-4" style={{ direction: 'rtl' }}>
        <div className="p-3 bg-indigo-950/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-indigo-400">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-200 text-xs">اختبار الفهم السريع الذكي (Quiz)</h4>
          <p className="text-[10px] text-slate-500 mt-1">
            اختبر استيعابك لهذا الدرس فوراً. سيقوم الذكاء الاصطناعي بتحليل المحتوى وتوليد اختبار فوري لك.
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleGenerateQuiz('MIXED', 5)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-xs font-bold hover:opacity-95 shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-350" />
            ابدأ الاختبار الذكي
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentIdx]
  const isSelected = (option: string) => {
    const selection = selectedAnswers[currentIdx] || ''
    if (currentQuestion.questionType === 'MULTIPLE_SELECT') {
      return selection.split(', ').includes(option)
    }
    return selection === option
  }

  const isCorrectAnswer = (idx: number) => {
    if (!quiz) return false
    const q = quiz.questions[idx]
    const studentAns = (selectedAnswers[idx] || '').trim().toLowerCase()
    const correctAns = q.correctAnswer.trim().toLowerCase()

    if (q.questionType === 'MULTIPLE_SELECT') {
      const studentList = studentAns.split(',').map(s => s.trim()).sort().join(',')
      const correctList = correctAns.split(',').map(c => c.trim()).sort().join(',')
      return studentList === correctList
    }
    return studentAns === correctAns
  }

  const maxPoints = getTotalPoints()

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 flex flex-col" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <h3 className="font-bold text-xs flex items-center gap-2">
          <FileQuestion className="w-4 h-4 text-indigo-400" />
          {quiz.title}
        </h3>
        {showResults && (
          <button
            onClick={() => handleGenerateQuiz()}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <RefreshCw className="w-3 h-3" /> إعادة المحاولة
          </button>
        )}
      </div>

      {/* Main Body */}
      {!showResults ? (
        /* Quiz Taker */
        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>السؤال {currentIdx + 1} من {quiz.questions.length}</span>
              <span>درجة السؤال: {currentQuestion.points || 1} نقاط</span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-relaxed">{currentQuestion.questionText}</p>
            {currentQuestion.questionType === 'MULTIPLE_SELECT' && (
              <span className="text-[9px] text-indigo-400 mt-1 block">يمكن اختيار أكثر من إجابة واحدة صحيحة.</span>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(opt)}
                className={`w-full text-right p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                  isSelected(opt)
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:bg-slate-950/60'
                }`}
              >
                <span>{opt}</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 text-[9px] ${
                  isSelected(opt) ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700'
                }`}>
                  {currentQuestion.questionType === 'MULTIPLE_SELECT' 
                    ? (isSelected(opt) ? '✓' : '') 
                    : (isSelected(opt) ? '●' : '')}
                </span>
              </button>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer text-[10px] font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" /> السابق
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white transition-all cursor-pointer text-[10px] font-bold shadow-md shadow-indigo-600/10"
            >
              {currentIdx === quiz.questions.length - 1 ? 'إنهاء وتسليم' : 'التالي'}
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Results Screen */
        <div className="space-y-4 py-2">
          {/* Score Box */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-center space-y-1">
            <h4 className="text-xs text-indigo-300 font-bold">النتيجة النهائية</h4>
            <div className="text-2xl font-black text-white">
              {score} <span className="text-xs text-slate-500">/ {maxPoints} نقطة</span>
            </div>
            <p className="text-[10px] text-slate-400">
              نسبة النجاح: {Math.round((score / maxPoints) * 100)}%
            </p>
          </div>

          {/* Corrections list */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {quiz.questions.map((q, idx) => {
              const correct = isCorrectAnswer(idx)
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border text-[11px] flex items-start justify-between gap-3 ${
                    correct 
                      ? 'bg-emerald-500/5 border-emerald-500/15' 
                      : 'bg-rose-500/5 border-rose-500/15'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <p className="font-bold text-slate-200 truncate">{q.questionText}</p>
                    <p className="text-[10px] text-slate-500">الإجابة الصحيحة: <span className="text-slate-350">{q.correctAnswer}</span></p>
                    {!correct && (
                      <p className="text-[10px] text-rose-405">إجابتك: <span className="text-rose-350/80">{selectedAnswers[idx] || 'لم تجب'}</span></p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-450" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <button
            onClick={() => handleGenerateQuiz()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold cursor-pointer transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة محاولة اختبار آخر
          </button>
        </div>
      )}
    </div>
  )
}
