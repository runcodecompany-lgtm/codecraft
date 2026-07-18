"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { updateAssignment, gradeSubmission } from "@/actions/teacher-assignment"
import { 
  Save, Calendar, Award, FileText, CheckCircle, Clock, 
  User, Check, AlertCircle, MessageSquare 
} from "lucide-react"

export default function AssignmentEditClient({ 
  assignment: initialAssignment, 
  submissions: initialSubmissions,
  courseId 
}: { 
  assignment: any
  submissions: any[]
  courseId: string 
}) {
  const router = useRouter()
  const [assignment, setAssignment] = useState(initialAssignment)
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Assignment fields
  const [formData, setFormData] = useState({
    title: assignment.title,
    description: assignment.description,
    dueDate: new Date(assignment.dueDate).toISOString().split("T")[0],
    points: assignment.points
  })

  // Grading states
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState<number>(0)
  const [feedbackInput, setFeedbackInput] = useState<string>("")
  const [gradingLoading, setGradingLoading] = useState(false)

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === "points" ? Number(value) : value }))
  }

  // Save Assignment metadata
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMsg(null)
    const res = await updateAssignment(assignment.id, {
      ...formData,
      dueDate: new Date(formData.dueDate)
    })
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم تحديث الواجب بنجاح!" })
      router.refresh()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل التحديث." })
    }
    setLoading(false)
  }

  // Grade Student Submission
  const handleGradeSubmit = async (submissionId: string) => {
    setGradingLoading(true)
    const res = await gradeSubmission(submissionId, gradeInput, feedbackInput)
    if (res.success) {
      setSubmissions(prev => 
        prev.map(sub => sub.id === submissionId 
          ? { ...sub, grade: gradeInput, feedback: feedbackInput, status: "GRADED" } 
          : sub
        )
      )
      setActiveSubmissionId(null)
      alert("تم رصد الدرجة وإشعار الطالب!")
      router.refresh()
    } else {
      alert(res.error)
    }
    setGradingLoading(false)
  }

  const handleOpenGrading = (sub: any) => {
    setActiveSubmissionId(sub.id)
    setGradeInput(sub.grade || 0)
    setFeedbackInput(sub.feedback || "")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
      
      {/* Submissions list - Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Submissions List card */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <User className="w-5 h-5 text-indigo-500" />
            <span>تسليمات الطلاب للواجب ({submissions.length})</span>
          </h2>

          {submissions.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 italic">
              لا توجد تسليمات مضافة من الطلاب لهذا الواجب بعد.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div 
                  key={sub.id}
                  className="rounded-2xl border border-gray-100 dark:border-slate-850 bg-gray-50/20 dark:bg-slate-900/10 p-5 space-y-4"
                >
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    {/* User profile */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {sub.user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sub.user.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          (sub.user.fullName || sub.user.name || "S").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white leading-tight">{sub.user.fullName || sub.user.name}</h4>
                        <span className="text-[9px] text-gray-400">{sub.user.email}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        sub.status === "GRADED" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-550 border border-amber-500/20"
                      }`}>
                        {sub.status === "GRADED" ? "تم التقييم" : "بانتظار التقييم"}
                      </span>
                      {sub.status === "GRADED" && (
                        <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400">
                          الدرجة: {sub.grade} / {assignment.points}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="p-3 bg-white dark:bg-slate-950/80 rounded-xl border border-gray-100 dark:border-slate-850/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {sub.content}
                  </div>

                  {/* Feedback display */}
                  {sub.feedback && (
                    <div className="p-3 bg-indigo-50/20 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-400 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">ملاحظة المعلم:</span>
                        <p>{sub.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Grading trigger */}
                  {activeSubmissionId !== sub.id ? (
                    <button
                      onClick={() => handleOpenGrading(sub)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-750 dark:text-slate-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-900"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{sub.status === "GRADED" ? "تعديل الدرجة" : "رصد الدرجة والتقييم"}</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                      <h5 className="font-extrabold text-xs text-gray-900 dark:text-white">تقييم تسليم الطالب</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">الدرجة</label>
                          <input
                            type="number"
                            value={gradeInput}
                            onChange={(e) => setGradeInput(Number(e.target.value))}
                            max={assignment.points}
                            min={0}
                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">الملاحظات والتقييم النصي</label>
                          <input
                            type="text"
                            placeholder="أدخل ملاحظاتك التوجيهية للطالب..."
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setActiveSubmissionId(null)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-slate-800 text-gray-500 rounded-lg text-xs"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleGradeSubmit(sub.id)}
                          disabled={gradingLoading}
                          className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded-lg text-xs font-bold"
                        >
                          رصد الدرجة وإرسال
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form - Right Sidebar */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <FileText className="w-4.5 h-4.5 text-indigo-500" />
            <span>بيانات الواجب الدراسي</span>
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

          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">العنوان</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">الوصف أو التعليمات</label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleFieldChange}
                placeholder="اكتب تفاصيل الواجب والملفات المطلوبة..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  value={formData.dueDate}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none text-gray-650 dark:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">الدرجة القصوى</label>
                <input
                  type="number"
                  name="points"
                  required
                  value={formData.points}
                  onChange={handleFieldChange}
                  min={1}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ تعديلات الواجب</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}
