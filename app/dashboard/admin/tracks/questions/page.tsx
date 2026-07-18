// app/dashboard/admin/tracks/questions/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  Loader2,
  Check,
  X,
  BookOpen,
  Filter,
  HelpCircle,
} from "lucide-react"
import {
  getGlobalQuestionsAction,
  createGlobalQuestionAction,
  updateGlobalQuestionAction,
  deleteGlobalQuestionAction,
} from "@/actions/admin-questions"

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters & Search
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  
  // Available categories in the bank (extracted dynamically)
  const [categories, setCategories] = useState<string[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  
  // Form State
  const [questionText, setQuestionText] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER")
  const [options, setOptions] = useState<string[]>(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [points, setPoints] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Load questions
  const loadQuestions = async () => {
    setLoading(true)
    setError(null)
    const res = await getGlobalQuestionsAction(
      categoryFilter === "all" ? undefined : categoryFilter,
      difficultyFilter === "all" ? undefined : difficultyFilter
    )
    if (res.success && res.questions) {
      setQuestions(res.questions)
      // Extract unique categories
      const cats = Array.from(new Set(res.questions.map((q: any) => q.category).filter(Boolean))) as string[]
      setCategories(cats)
    } else {
      setError(res.error || "فشل تحميل أسئلة بنك الأسئلة.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [categoryFilter, difficultyFilter])

  // Handle open modal for create
  const handleCreateOpen = () => {
    setEditingQuestion(null)
    setQuestionText("")
    setCategory("")
    setDifficulty("BEGINNER")
    setOptions(["", "", "", ""])
    setCorrectAnswer("")
    setPoints(1)
    setIsModalOpen(true)
  }

  // Handle open modal for edit
  const handleEditOpen = (q: any) => {
    setEditingQuestion(q)
    setQuestionText(q.questionText)
    setCategory(q.category || "")
    setDifficulty(q.difficulty)
    setOptions([...q.options])
    setCorrectAnswer(q.correctAnswer)
    setPoints(q.points || 1)
    setIsModalOpen(true)
  }

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (options.some(opt => !opt.trim())) {
      setError("يرجى ملء جميع الاختيارات الأربعة.")
      return
    }
    if (!correctAnswer || !options.includes(correctAnswer)) {
      setError("يجب اختيار إحدى الإجابات المكتوبة كإجابة صحيحة.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const payload = {
      questionText,
      questionType: "MULTIPLE_CHOICE",
      difficulty,
      options,
      correctAnswer,
      points,
      category: category.trim() || null,
    }

    let res
    if (editingQuestion) {
      res = await updateGlobalQuestionAction(editingQuestion.id, payload)
    } else {
      res = await createGlobalQuestionAction(payload)
    }

    if (res.success) {
      setSuccess(editingQuestion ? "تم تعديل السؤال بنجاح!" : "تم إضافة السؤال بنجاح!")
      setIsModalOpen(false)
      loadQuestions()
    } else {
      setError(res.error || "فشل حفظ السؤال.")
    }
    setSubmitting(false)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا السؤال من بنك الأسئلة؟")) return

    setError(null)
    setSuccess(null)
    const res = await deleteGlobalQuestionAction(id)
    if (res.success) {
      setSuccess("تم حذف السؤال بنجاح.")
      loadQuestions()
    } else {
      setError(res.error || "فشل حذف السؤال.")
    }
  }

  // Filter local search
  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(search.toLowerCase()) ||
    (q.category && q.category.toLowerCase().includes(search.toLowerCase()))
  )

  const difficultyLabels = {
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 md:p-10 font-sans" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/tracks"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">بنك الأسئلة العالمي</h1>
          </div>
          <p className="mt-2 text-slate-500">إدارة أسئلة تحديد المستوى المصنفة حسب الموضوع ومستويات الصعوبة للمسارات التعليمية.</p>
        </div>
        
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 rounded-xl bg-[var(--gradient-brand)] text-white px-5 py-3 font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          <span>إضافة سؤال للبنك</span>
        </button>
      </div>

      {/* Alert Banner */}
      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-950 dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Filters & Search Control Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-surface)] p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن نص السؤال أو التصنيف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">كل التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-1">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">كل الصعوبات</option>
              <option value="BEGINNER">مبتدئ</option>
              <option value="INTERMEDIATE">متوسط</option>
              <option value="ADVANCED">متقدم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-slate-800">
          <HelpCircle className="h-16 w-16 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-500">لا توجد أسئلة تطابق فلاتر البحث الحالية.</p>
          <button
            onClick={handleCreateOpen}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            أضف سؤالاً أولاً
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="group relative rounded-2xl border border-[var(--border-card)] bg-[var(--bg-surface)] p-6 shadow-sm transition-all hover:border-[var(--border-focus)] hover:shadow-md"
            >
              {/* Badges row */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    q.difficulty === "BEGINNER"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : q.difficulty === "INTERMEDIATE"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                  }`}
                >
                  {difficultyLabels[q.difficulty as keyof typeof difficultyLabels]}
                </span>
                
                {q.category && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                    #{q.category}
                  </span>
                )}

                <span className="text-xs text-slate-400 mr-auto">{q.points} نقاط</span>
              </div>

              {/* Question Text */}
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{q.questionText}</h3>

              {/* Options */}
              <div className="grid gap-3 sm:grid-cols-2">
                {q.options.map((opt: string, idx: number) => {
                  const isCorrect = opt === q.correctAnswer
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-all ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                          : "border-gray-100 bg-gray-50/30 text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/20 dark:text-slate-400"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white font-bold text-xs shadow-sm border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 font-medium">{opt}</span>
                      {isCorrect && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  )
                })}
              </div>

              {/* Hover actions */}
              <div className="absolute left-6 top-6 flex gap-2 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditOpen(q)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Add / Edit Question */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--border-card)] bg-[var(--bg-surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">
                {editingQuestion ? "تعديل سؤال في بنك الأسئلة" : "إضافة سؤال لبنك الأسئلة"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نص السؤال</label>
                <textarea
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="مثال: أي من الدوال التالية تعتبر دالة نقية في بايثون؟"
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">التصنيف / الوسم</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثال: python"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">مستوى الصعوبة</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </div>

                {/* Points */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">النقاط المستحقة</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 block">الاختيارات الأربعة وحدد الإجابة الصحيحة</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={correctAnswer === opt && opt !== ""}
                      disabled={opt === ""}
                      onChange={() => setCorrectAnswer(opt)}
                      className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-400">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      placeholder={`أدخل الخيار ${idx + 1}`}
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options]
                        newOpts[idx] = e.target.value
                        setOptions(newOpts)
                        // If we are changing the correct answer, keep it synchronized
                        if (correctAnswer === opt) {
                          setCorrectAnswer(e.target.value)
                        }
                      }}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingQuestion ? "حفظ التعديلات" : "إضافة للبنك"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
