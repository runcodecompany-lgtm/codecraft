"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  updateQuiz, 
  addQuestionToQuiz, 
  updateQuizQuestion, 
  deleteQuizQuestion, 
  saveToQuestionBank, 
  getQuestionBank, 
  importFromQuestionBank 
} from "@/actions/teacher-quiz"
import { 
  Save, Plus, Trash2, Edit2, HelpCircle, ArrowLeft, 
  Info, Database, CheckSquare, ListPlus, ShieldCheck, 
  ArrowRightLeft, AlertCircle, RefreshCw 
} from "lucide-react"

export default function QuizEditClient({ quiz: initialQuiz, courseId }: { quiz: any; courseId: string }) {
  const router = useRouter()
  const [quiz, setQuiz] = useState(initialQuiz)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Quiz details
  const [quizTitle, setQuizTitle] = useState(quiz.title)

  // Question editing / adding states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    difficulty: "BEGINNER",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1
  })

  // Question bank modal
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<any[]>([])
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [searchBankQuery, setSearchBankQuery] = useState("")

  const loadQuestionBank = async () => {
    setBankLoading(true)
    const res = await getQuestionBank()
    if (res.success && res.questions) {
      setBankQuestions(res.questions)
    }
    setBankLoading(false)
  }

  useEffect(() => {
    if (showBankModal) {
      loadQuestionBank()
    }
  }, [showBankModal])

  const handleSaveQuizTitle = async () => {
    setLoading(true)
    const res = await updateQuiz(quiz.id, quizTitle)
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم تحديث عنوان الاختبار." })
      router.refresh()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل التحديث." })
    }
    setLoading(false)
  }

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...questionForm.options]
    opts[idx] = val
    setQuestionForm({ ...questionForm, options: opts })
  }

  const handleQuestionTypeChange = (type: string) => {
    if (type === "TRUE_FALSE") {
      setQuestionForm({
        ...questionForm,
        questionType: type,
        options: ["صح", "خطأ"],
        correctAnswer: "صح"
      })
    } else {
      setQuestionForm({
        ...questionForm,
        questionType: type,
        options: ["", "", "", ""],
        correctAnswer: ""
      })
    }
  }

  // Add or edit question submit
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Form checks
    if (!questionForm.questionText.trim()) {
      alert("يرجى إدخال نص السؤال.")
      setLoading(false)
      return
    }

    if (!questionForm.correctAnswer.trim()) {
      alert("يرجى إدخال أو اختيار الإجابة الصحيحة.")
      setLoading(false)
      return
    }

    const payload = {
      ...questionForm,
      options: questionForm.options.filter(o => o.trim() !== "")
    }

    if (editingQuestionId) {
      // Edit
      const res = await updateQuizQuestion(editingQuestionId, payload as any)
      if (res.success) {
        setStatusMsg({ type: "success", text: "تم تعديل السؤال بنجاح!" })
        setEditingQuestionId(null)
        setShowAddForm(false)
        router.refresh()
        window.location.reload()
      } else {
        alert(res.error)
      }
    } else {
      // Add
      const res = await addQuestionToQuiz(quiz.id, payload as any)
      if (res.success) {
        setStatusMsg({ type: "success", text: "تمت إضافة السؤال للاختبار!" })
        setShowAddForm(false)
        router.refresh()
        window.location.reload()
      } else {
        alert(res.error)
      }
    }
    setLoading(false)
  }

  const handleEditClick = (q: any) => {
    setQuestionForm({
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      options: Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options)),
      correctAnswer: q.correctAnswer,
      points: q.points
    })
    setEditingQuestionId(q.id)
    setShowAddForm(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("هل تريد حذف هذا السؤال؟")) return
    const res = await deleteQuizQuestion(questionId)
    if (res.success) {
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter((q: any) => q.id !== questionId)
      })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  // Question Bank integration
  const handleSaveToBank = async (q: any) => {
    const res = await saveToQuestionBank({
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      options: Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options)),
      correctAnswer: q.correctAnswer,
      points: q.points
    })
    if (res.success) {
      alert("تم حفظ السؤال في بنك الأسئلة الخاص بك بنجاح!")
    } else {
      alert(res.error)
    }
  }

  const handleImportSelected = async () => {
    if (selectedBankIds.length === 0) return
    const res = await importFromQuestionBank(quiz.id, selectedBankIds)
    if (res.success) {
      setShowBankModal(false)
      setSelectedBankIds([])
      router.refresh()
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const toggleSelectBankId = (id: string) => {
    setSelectedBankIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const filteredBankQuestions = bankQuestions.filter(q => 
    q.questionText.toLowerCase().includes(searchBankQuery.toLowerCase()) ||
    (q.category && q.category.toLowerCase().includes(searchBankQuery.toLowerCase()))
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
      
      {/* Questions Manager List - Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Questions card header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-200/65 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <span>أسئلة هذا الاختبار ({quiz.questions?.length || 0})</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-1">أنشئ أسئلة الاختيار من متعدد، الصواب والخطأ، أو الاختيارات المتعددة لدعم التعلم التفاعلي.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddForm(true)
                setEditingQuestionId(null)
                setQuestionForm({
                  questionText: "",
                  questionType: "MULTIPLE_CHOICE",
                  difficulty: "BEGINNER",
                  options: ["", "", "", ""],
                  correctAnswer: "",
                  points: 1
                })
              }}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سؤال</span>
            </button>
            <button
              onClick={() => setShowBankModal(true)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-slate-900"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>استيراد من بنك الأسئلة</span>
            </button>
          </div>
        </div>

        {/* Question editor/add form inside dashboard */}
        {showAddForm && (
          <form onSubmit={handleSaveQuestion} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {editingQuestionId ? "تعديل السؤال الحالي" : "إضافة سؤال جديد للاختبار"}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">نص السؤال</label>
              <textarea
                rows={2}
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                placeholder="مثال: ما هو الوسم الصحيح لتعريف رابط في HTML؟"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">نوع السؤال</label>
                <select
                  value={questionForm.questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-700 dark:text-slate-350"
                >
                  <option value="MULTIPLE_CHOICE">اختيار من متعدد (Multiple Choice)</option>
                  <option value="TRUE_FALSE">صواب أو خطأ (True / False)</option>
                  <option value="MULTIPLE_SELECT">اختيارات متعددة (Multiple Select)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">مستوى الصعوبة</label>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-700 dark:text-slate-350"
                >
                  <option value="BEGINNER">مبتدئ</option>
                  <option value="INTERMEDIATE">متوسط</option>
                  <option value="ADVANCED">متقدم</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الدرجة الكلية (الوزن)</label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                  min={1}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Answer Options list config */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الخيارات والإجابة الصحيحة</label>
              
              {questionForm.questionType !== "TRUE_FALSE" ? (
                <div className="space-y-2">
                  {questionForm.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <span className="text-xs font-extrabold text-gray-400">الخيار {oIdx + 1}:</span>
                      <input
                        type="text"
                        placeholder={`محتوى الخيار ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                        className="flex-grow px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-lg text-xs"
                      />
                      <label className="text-[10px] font-bold text-gray-400 shrink-0 flex items-center gap-1 select-none">
                        <input
                          type={questionForm.questionType === "MULTIPLE_SELECT" ? "checkbox" : "radio"}
                          name="isCorrect"
                          checked={
                            questionForm.questionType === "MULTIPLE_SELECT" 
                              ? questionForm.correctAnswer.split(",").includes(opt) 
                              : questionForm.correctAnswer === opt
                          }
                          onChange={() => {
                            if (questionForm.questionType === "MULTIPLE_SELECT") {
                              const selected = questionForm.correctAnswer.split(",").filter(x => x !== "")
                              const next = selected.includes(opt) 
                                ? selected.filter(x => x !== opt) 
                                : [...selected, opt]
                              setQuestionForm({ ...questionForm, correctAnswer: next.join(",") })
                            } else {
                              setQuestionForm({ ...questionForm, correctAnswer: opt })
                            }
                          }}
                        />
                        صح؟
                      </label>
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    * يرجى كتابة الخيارات ثم تحديد الخيار (أو الخيارات في حال المتعدد) الصحيح بالضغط على زر الراديو/المربع.
                  </span>
                </div>
              ) : (
                <div className="flex gap-4">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tf"
                      checked={questionForm.correctAnswer === "صح"}
                      onChange={() => setQuestionForm({ ...questionForm, correctAnswer: "صح" })}
                    />
                    صح
                  </label>
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tf"
                      checked={questionForm.correctAnswer === "خطأ"}
                      onChange={() => setQuestionForm({ ...questionForm, correctAnswer: "خطأ" })}
                    />
                    خطأ
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-900">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-250 dark:border-slate-800 text-gray-500 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                {editingQuestionId ? "حفظ التعديل" : "إضافة السؤال"}
              </button>
            </div>
          </form>
        )}

        {/* Questions list display */}
        {quiz.questions?.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/20">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-gray-500">لا توجد أسئلة مضافة في هذا الاختبار.</p>
            <p className="text-xs text-gray-400 mt-1">اضغط على زر "إضافة سؤال" للبدء.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quiz.questions.map((q: any, qIdx: number) => {
              const opts = Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options))
              return (
                <div key={q.id} className="p-5 bg-white dark:bg-slate-950 border border-gray-200/60 dark:border-slate-850 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-relaxed">
                        <span>س {qIdx + 1}: </span>
                        {q.questionText}
                      </h4>
                      <div className="flex gap-2 items-center text-[10px] text-gray-400 mt-1 font-bold">
                        <span className="text-indigo-650 dark:text-indigo-400">
                          {q.questionType === "MULTIPLE_CHOICE" ? "اختيار من متعدد" : q.questionType === "TRUE_FALSE" ? "صواب وخطأ" : "اختيارات متعددة"}
                        </span>
                        <span>•</span>
                        <span>درجة السؤال: {q.points}</span>
                        <span>•</span>
                        <span>الصعوبة: {q.difficulty === "BEGINNER" ? "مبتدئ" : q.difficulty === "INTERMEDIATE" ? "متوسط" : "متقدم"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSaveToBank(q)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 font-bold text-xs"
                        title="حفظ في بنك الأسئلة"
                      >
                        <Database className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(q)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-900 text-gray-550"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options render list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-900/60">
                    {opts.map((opt: string, oIdx: number) => {
                      const isCorrect = q.questionType === "MULTIPLE_SELECT" 
                        ? q.correctAnswer.split(",").includes(opt)
                        : q.correctAnswer === opt
                      return (
                        <div 
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                            isCorrect 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-50/50 dark:bg-slate-900/40 border-gray-100 dark:border-slate-900 text-gray-600 dark:text-slate-350"
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">صحيحة</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Quiz details configuration - Right Sidebar */}
      <div className="space-y-6">
        
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Info className="w-4.5 h-4.5 text-indigo-500" />
            <span>بيانات الاختبار</span>
          </h2>

          {statusMsg && (
            <div className={`p-3 rounded-xl border ${
              statusMsg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
            } text-xs font-semibold`}>
              {statusMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">اسم الاختبار</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleSaveQuizTitle}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ عنوان الاختبار</span>
            </button>
          </div>
        </div>

      </div>

      {/* Question Bank Importer Modal/Drawer */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col justify-between space-y-4 text-right">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">بنك الأسئلة الخاص بك</h3>
              </div>
              <button 
                onClick={() => setShowBankModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            {/* Search filter */}
            <input
              type="text"
              placeholder="البحث في الأسئلة المحفوظة ببنك الأسئلة..."
              value={searchBankQuery}
              onChange={(e) => setSearchBankQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs outline-none"
            />

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 max-h-[40vh] py-2">
              {bankLoading ? (
                <div className="py-10 text-center text-xs text-gray-400">جاري تحميل الأسئلة...</div>
              ) : filteredBankQuestions.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400 italic">لا توجد أسئلة متوافقة مع بحثك في البنك.</div>
              ) : (
                filteredBankQuestions.map((bq) => {
                  const isChecked = selectedBankIds.includes(bq.id)
                  return (
                    <div key={bq.id} className="py-3 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectBankId(bq.id)}
                        className="mt-1 shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-xs text-gray-900 dark:text-white leading-relaxed">{bq.questionText}</p>
                        <div className="flex gap-2 text-[9px] text-gray-400 mt-1">
                          <span className="font-extrabold text-indigo-500">{bq.questionType}</span>
                          <span>•</span>
                          <span>النقاط: {bq.points}</span>
                          <span>•</span>
                          <span>الصعوبة: {bq.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-150 dark:border-slate-800">
              <button
                onClick={() => setShowBankModal(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-850 text-gray-600 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleImportSelected}
                disabled={selectedBankIds.length === 0}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                استيراد الأسئلة المحددة ({selectedBankIds.length})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
