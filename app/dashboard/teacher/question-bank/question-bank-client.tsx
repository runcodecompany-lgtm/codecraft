"use client"

import React, { useState, useTransition, useMemo } from "react"
import {
  Plus, Trash2, Pencil, Check, X, BookMarked,
  ChevronDown, ChevronUp, Search, Filter, Tag
} from "lucide-react"
import {
  saveToQuestionBank,
  deleteFromQuestionBank
} from "@/actions/teacher-quiz"
import type { DifficultyLevel } from "@prisma/client"

type BankQuestion = {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  options: string[]
  correctAnswer: string
  category: string | null
  points: number
  createdAt: Date
}

type Props = {
  initialQuestions: BankQuestion[]
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  EASY: { label: "سهل", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" },
  MEDIUM: { label: "متوسط", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" },
  HARD: { label: "صعب", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" },
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار متعدد",
  TRUE_FALSE: "صح / خطأ",
  MULTIPLE_SELECT: "اختيار من متعدد (إجابات متعددة)",
  SHORT_ANSWER: "إجابة قصيرة",
}

const emptyForm = {
  questionText: "",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  category: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
}

export default function QuestionBankClient({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState<BankQuestion[]>(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState("ALL")
  const [filterCategory, setFilterCategory] = useState("ALL")

  // Unique categories from questions
  const categories = useMemo(() => {
    const cats = new Set<string>()
    questions.forEach((q) => {
      if (q.category) cats.add(q.category)
    })
    return Array.from(cats)
  }, [questions])

  // Filtered questions
  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
      const matchDiff = filterDifficulty === "ALL" || q.difficulty === filterDifficulty
      const matchCat =
        filterCategory === "ALL" ||
        (filterCategory === "NONE" && !q.category) ||
        q.category === filterCategory
      return matchSearch && matchDiff && matchCat
    })
  }, [questions, searchQuery, filterDifficulty, filterCategory])

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...form.options]
    opts[idx] = val
    setForm((prev) => ({ ...prev, options: opts }))
  }

  const handleSave = () => {
    setError(null)
    if (!form.questionText.trim()) {
      setError("نص السؤال مطلوب.")
      return
    }
    if (!form.correctAnswer.trim()) {
      setError("الإجابة الصحيحة مطلوبة.")
      return
    }
    if (form.questionType === "MULTIPLE_CHOICE") {
      const nonEmpty = form.options.filter((o) => o.trim())
      if (nonEmpty.length < 2) {
        setError("يجب توفير خيارين على الأقل.")
        return
      }
      if (!form.options.includes(form.correctAnswer)) {
        setError("الإجابة الصحيحة يجب أن تطابق أحد الخيارات.")
        return
      }
    }

    startTransition(async () => {
      const res = await saveToQuestionBank({
        questionText: form.questionText.trim(),
        questionType: form.questionType,
        difficulty: form.difficulty as DifficultyLevel,
        options: form.questionType === "MULTIPLE_CHOICE" ? form.options.filter((o) => o.trim()) : [],
        correctAnswer: form.correctAnswer.trim(),
        category: form.category.trim() || undefined,
        points: Number(form.points) || 1,
      })

      if (res.success) {
        setSuccessMsg("تم حفظ السؤال في البنك بنجاح ✓")
        setShowForm(false)
        setForm({ ...emptyForm })
        // Optimistically add to list
        setQuestions((prev) => [
          {
            id: res.questionId!,
            questionText: form.questionText.trim(),
            questionType: form.questionType,
            difficulty: form.difficulty,
            options: form.questionType === "MULTIPLE_CHOICE" ? form.options.filter((o) => o.trim()) : [],
            correctAnswer: form.correctAnswer.trim(),
            category: form.category.trim() || null,
            points: Number(form.points) || 1,
            createdAt: new Date(),
          },
          ...prev,
        ])
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setError(res.error || "حدث خطأ غير متوقع.")
      }
    })
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteFromQuestionBank(id)
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="ابحث في بنك الأسئلة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-slate-200 placeholder:text-gray-400"
            dir="rtl"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none cursor-pointer text-gray-700 dark:text-slate-200"
          >
            <option value="ALL">كل المستويات</option>
            <option value="EASY">سهل</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HARD">صعب</option>
          </select>

          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none cursor-pointer text-gray-700 dark:text-slate-200"
            >
              <option value="ALL">كل التصنيفات</option>
              <option value="NONE">بدون تصنيف</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Add Button */}
          <button
            onClick={() => { setShowForm(true); setError(null) }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            سؤال جديد
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add Question Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-indigo-500" />
              إضافة سؤال جديد للبنك
            </h3>
            <button onClick={() => { setShowForm(false); setError(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Question Text */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">نص السؤال *</label>
            <textarea
              rows={2}
              value={form.questionText}
              onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
              placeholder="اكتب نص السؤال هنا..."
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none resize-none focus:border-indigo-400"
              dir="rtl"
            />
          </div>

          {/* Type / Difficulty / Category / Points in row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">نوع السؤال</label>
              <select
                value={form.questionType}
                onChange={(e) => setForm((p) => ({ ...p, questionType: e.target.value, correctAnswer: "", options: ["", "", "", ""] }))}
                className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-2 outline-none text-gray-700 dark:text-slate-200"
              >
                <option value="MULTIPLE_CHOICE">اختيار متعدد</option>
                <option value="TRUE_FALSE">صح / خطأ</option>
                <option value="MULTIPLE_SELECT">اختيار من متعدد (إجابات متعددة)</option>
                <option value="SHORT_ANSWER">إجابة قصيرة</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">الصعوبة</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-2 outline-none text-gray-700 dark:text-slate-200"
              >
                <option value="EASY">سهل</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HARD">صعب</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">التصنيف (اختياري)</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="مثال: JavaScript"
                className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-2 outline-none text-gray-700 dark:text-slate-200"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">النقاط</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.points}
                onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))}
                className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-2 outline-none text-gray-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Options for MCQ */}
          {form.questionType === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block">الخيارات</label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{String.fromCharCode(65 + idx)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`الخيار ${idx + 1}`}
                    className="flex-1 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none text-gray-700 dark:text-slate-200 focus:border-indigo-400"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, correctAnswer: opt }))}
                    title="اجعلها الإجابة الصحيحة"
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${form.correctAnswer === opt && opt ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 dark:border-slate-700"}`}
                  >
                    {form.correctAnswer === opt && opt && <Check className="w-3 h-3" />}
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-gray-400">اضغط على الدائرة بجانب الخيار لتحديده كإجابة صحيحة.</p>
            </div>
          )}

          {/* Multiple Select - checkboxes */}
          {form.questionType === "MULTIPLE_SELECT" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block">الخيارات (اختر الإجابات الصحيحة)</label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{String.fromCharCode(65 + idx)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`الخيار ${idx + 1}`}
                    className="flex-1 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none text-gray-700 dark:text-slate-200 focus:border-indigo-400"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle this option in the correctAnswer JSON array
                      const currentAnswers = form.correctAnswer ? form.correctAnswer.split(",").map(a => a.trim()).filter(a => a.length > 0) : []
                      const idxInAnswer = currentAnswers.indexOf(opt)
                      let newAnswers: string[]
                      if (idxInAnswer >= 0) {
                        newAnswers = currentAnswers.filter((_, i) => i !== idxInAnswer)
                      } else {
                        newAnswers = [...currentAnswers, opt]
                      }
                      setForm((p) => ({ ...p, correctAnswer: newAnswers.join(",") }))
                    }}
                    title={form.correctAnswer.split(",").map(a => a.trim()).includes(opt) ? "إزالة من الإجابات الصحيحة" : "إضافة للإجابات الصحيحة"}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${form.correctAnswer.split(",").map(a => a.trim()).includes(opt) && opt
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 dark:border-slate-700"
                      }`}
                  >
                    {form.correctAnswer.split(",").map(a => a.trim()).includes(opt) && opt && <Check className="w-3 h-3" />}
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-gray-400">اختر جميع الإجابات الصحيحة بالضغط على المربعات.</p>
            </div>
          )}

          {/* Correct answer for True/False and Short Answer */}
          {form.questionType === "TRUE_FALSE" && (
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">الإجابة الصحيحة</label>
              <div className="flex gap-3">
                {["صح", "خطأ"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, correctAnswer: val }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${form.correctAnswer === val
                      ? val === "صح" ? "bg-emerald-500 text-white border-emerald-500" : "bg-rose-500 text-white border-rose-500"
                      : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200"
                      }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.questionType === "SHORT_ANSWER" && (
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">الإجابة النموذجية</label>
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                placeholder="الإجابة الصحيحة أو النموذجية..."
                className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none text-gray-700 dark:text-slate-200 focus:border-indigo-400"
                dir="rtl"
              />
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowForm(false); setError(null) }}
              className="text-xs text-gray-500 hover:text-gray-700 font-semibold px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl transition-colors"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              حفظ في البنك
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookMarked className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto" />
          <p className="text-sm font-bold text-gray-400 dark:text-slate-500">
            {questions.length === 0 ? "بنك الأسئلة فارغ حالياً" : "لا توجد نتائج مطابقة للبحث"}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-600">
            {questions.length === 0
              ? "ابدأ بإضافة أسئلة لبنكك وستتمكن من إعادة استخدامها في أي اختبار."
              : "جرب تغيير كلمة البحث أو الفلاتر المحددة."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stats bar */}
          <div className="flex gap-4 text-xs text-gray-400 font-semibold px-1">
            <span>{filtered.length} سؤال {filtered.length !== questions.length ? `من أصل ${questions.length}` : ""}</span>
          </div>

          {filtered.map((q) => {
            const diff = DIFFICULTY_LABELS[q.difficulty] || DIFFICULTY_LABELS.MEDIUM
            const isExpanded = expandedId === q.id

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header Row */}
                <div className="flex items-start gap-3 p-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="mt-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 shrink-0 transition-colors"
                    title={isExpanded ? "طي" : "عرض التفاصيل"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Question content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                      {q.questionText}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.color}`}>
                        {diff.label}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500">
                        {TYPE_LABELS[q.questionType] || q.questionType}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-500">
                        {q.points} نقطة
                      </span>
                      {q.category && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500">
                          <Tag className="w-3 h-3" />
                          {q.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id || isPending}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    title="حذف من البنك"
                  >
                    {deletingId === q.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin inline-block" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-800/60 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                    {/* Options */}
                    {q.questionType === "MULTIPLE_CHOICE" && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">الخيارات</p>
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 ${opt === q.correctAnswer
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800"
                              : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800/60"
                              }`}
                          >
                            <span className="font-bold text-[10px] w-4">{String.fromCharCode(65 + idx)}</span>
                            <span className="flex-1">{opt}</span>
                            {opt === q.correctAnswer && <Check className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Correct Answer for Multiple Select */}
                    {q.questionType === "MULTIPLE_SELECT" && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">الإجابات الصحيحة (اختر الكل)</p>
                        {(() => {
                          let correctAnswers: string[] = []
                          try {
                            correctAnswers = JSON.parse(q.correctAnswer)
                          } catch {
                            correctAnswers = q.correctAnswer.split(",").map(a => a.trim()).filter(a => a.length > 0)
                          }
                          return q.options.map((opt, idx) => {
                            const isCorrect = correctAnswers.includes(opt)
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 ${isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800"
                                  : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800/60"
                                  }`}
                              >
                                <span className="font-bold text-[10px] w-4">{String.fromCharCode(65 + idx)}</span>
                                <span className="flex-1">{opt}</span>
                                {isCorrect && <Check className="w-3 h-3" />}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}

                    {/* Correct Answer for True/False and Short Answer */}
                    {(q.questionType === "TRUE_FALSE" || q.questionType === "SHORT_ANSWER") && (
                      <div className="text-xs">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">الإجابة الصحيحة</p>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5">
                          <Check className="w-3 h-3" />
                          {q.correctAnswer}
                        </span>
                      </div>
                    )}

                    {/* Saved date */}
                    <p className="text-[10px] text-gray-300 dark:text-slate-700">
                      محفوظ بتاريخ: {new Date(q.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
