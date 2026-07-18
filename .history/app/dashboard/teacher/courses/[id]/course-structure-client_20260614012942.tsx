"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  updateCourseDetails,
  createModule,
  updateModule,
  deleteModule,
  updateModuleOrder,
  updateLessonOrder
} from "@/actions/teacher-course"
import { createLesson, deleteLesson } from "@/actions/teacher-lesson"
import { createQuiz, deleteQuiz } from "@/actions/teacher-quiz"
import { createAssignment, deleteAssignment } from "@/actions/teacher-assignment"
import {
  Save, Plus, Trash2, Edit3, ArrowUp, ArrowDown, ChevronDown,
  ChevronUp, Play, FileText, HelpCircle, BookOpen, AlertCircle,
  Settings, Award, RefreshCw, Calendar, Layers
} from "lucide-react"

export default function CourseStructureClient({ course: initialCourse }: { course: any }) {
  const router = useRouter()
  const [course, setCourse] = useState(initialCourse)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Metadata edit states
  const [metadata, setMetadata] = useState({
    title: course.title,
    description: course.description,
    category: course.category || "",
    level: course.level,
    language: course.language || "العربية",
    priceInCoins: course.priceInCoins,
    coverImage: course.coverImage || "",
    requirements: course.requirements || "",
    learningObjectives: course.learningObjectives || "",
    status: course.status
  })

  // Collapsed modules state
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({})

  // Modal / Add states
  const [showNewModuleInput, setShowNewModuleInput] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState("")

  // Quick addition states
  const [activeAddForm, setActiveAddForm] = useState<{ type: "lesson" | "quiz" | "assignment", moduleId: string } | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: "", type: "VIDEO", duration: 10 })
  const [quizForm, setQuizForm] = useState({ title: "" })
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", dueDate: "", points: 100 })

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setMetadata(prev => ({ ...prev, [name]: name === "priceInCoins" ? Number(value) : value }))
  }

  // Update basic metadata
  const handleSaveMetadata = async () => {
    setLoading(true)
    setStatusMsg(null)
    const res = await updateCourseDetails(course.id, metadata as any)
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم تحديث بيانات الدورة بنجاح!" })
      router.refresh()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل تحديث البيانات." })
    }
    setLoading(false)
  }

  // Section Add / Edit / Delete
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return
    const res = await createModule(course.id, newModuleTitle)
    if (res.success) {
      setNewModuleTitle("")
      setShowNewModuleInput(false)
      // Local addition for instant UX before refresh
      const updatedModules = [
        ...course.modules,
        { id: res.moduleId, title: newModuleTitle, order: course.modules.length + 1, lessons: [], quizzes: [], assignments: [] }
      ]
      setCourse({ ...course, modules: updatedModules })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleEditModule = async (moduleId: string) => {
    if (!editingModuleTitle.trim()) return
    const res = await updateModule(moduleId, editingModuleTitle)
    if (res.success) {
      setCourse({
        ...course,
        modules: course.modules.map((m: any) => m.id === moduleId ? { ...m, title: editingModuleTitle } : m)
      })
      setEditingModuleId(null)
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوحدة وجميع محتوياتها؟")) return
    const res = await deleteModule(moduleId)
    if (res.success) {
      setCourse({
        ...course,
        modules: course.modules.filter((m: any) => m.id !== moduleId)
      })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  // Reorder Modules
  const handleMoveModule = async (index: number, direction: "up" | "down") => {
    const updated = [...course.modules]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= updated.length) return

    // Swap
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    setCourse({ ...course, modules: updated })

    // Save order immediately
    const res = await updateModuleOrder(course.id, updated.map(m => m.id))
    if (!res.success) {
      alert("فشل حفظ الترتيب الجديد.")
    } else {
      router.refresh()
    }
  }

  // Reorder Lessons inside Module
  const handleMoveLesson = async (moduleId: string, lessonIndex: number, direction: "up" | "down") => {
    const mod = course.modules.find((m: any) => m.id === moduleId)
    if (!mod) return

    const updatedLessons = [...mod.lessons]
    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1
    if (targetIndex < 0 || targetIndex >= updatedLessons.length) return

    const temp = updatedLessons[lessonIndex]
    updatedLessons[lessonIndex] = updatedLessons[targetIndex]
    updatedLessons[targetIndex] = temp

    setCourse({
      ...course,
      modules: course.modules.map((m: any) => m.id === moduleId ? { ...m, lessons: updatedLessons } : m)
    })

    const res = await updateLessonOrder(moduleId, updatedLessons.map(l => l.id))
    if (!res.success) {
      alert("فشل حفظ ترتيب الدرس الجديد.")
    } else {
      router.refresh()
    }
  }

  // Add Lesson
  const handleAddLesson = async (moduleId: string) => {
    if (!lessonForm.title.trim()) return
    const res = await createLesson(moduleId, lessonForm as any)
    if (res.success) {
      setActiveAddForm(null)
      setLessonForm({ title: "", type: "VIDEO", duration: 10 })
      router.refresh()
      // Reload course structure
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدرس نهائياً؟")) return
    const res = await deleteLesson(lessonId)
    if (res.success) {
      setCourse({
        ...course,
        modules: course.modules.map((m: any) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m)
      })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  // Add Quiz
  const handleAddQuiz = async (moduleId: string) => {
    if (!quizForm.title.trim()) return
    const res = await createQuiz(moduleId, null, quizForm.title)
    if (res.success) {
      setActiveAddForm(null)
      setQuizForm({ title: "" })
      router.refresh()
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string, moduleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاختبار نهائياً؟")) return
    const res = await deleteQuiz(quizId)
    if (res.success) {
      setCourse({
        ...course,
        modules: course.modules.map((m: any) => m.id === moduleId ? { ...m, quizzes: m.quizzes.filter((q: any) => q.id !== quizId) } : m)
      })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  // Add Assignment
  const handleAddAssignment = async (moduleId: string) => {
    if (!assignmentForm.title.trim() || !assignmentForm.dueDate) return
    const res = await createAssignment(moduleId, null, {
      ...assignmentForm,
      dueDate: new Date(assignmentForm.dueDate)
    })
    if (res.success) {
      setActiveAddForm(null)
      setAssignmentForm({ title: "", description: "", dueDate: "", points: 100 })
      router.refresh()
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  // Delete Assignment
  const handleDeleteAssignment = async (assignmentId: string, moduleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الواجب نهائياً؟")) return
    const res = await deleteAssignment(assignmentId)
    if (res.success) {
      setCourse({
        ...course,
        modules: course.modules.map((m: any) => m.id === moduleId ? { ...m, assignments: m.assignments.filter((a: any) => a.id !== assignmentId) } : m)
      })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const toggleCollapse = (id: string) => {
    setCollapsedModules(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Course structure planner / builder - Left side */}
      <div className="lg:col-span-2 space-y-6">

        {/* Sections Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-200/60 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>مخطط الوحدات والمقررات</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-1">أضف الأقسام، رتب الوحدات، وابنِ محتوى الدروس والاختبارات التفاعلية.</p>
          </div>

          <button
            onClick={() => setShowNewModuleInput(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وحدة</span>
          </button>
        </div>

        {/* New Module Input Block */}
        {showNewModuleInput && (
          <div className="p-4 bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl flex gap-3 text-right">
            <input
              type="text"
              placeholder="اسم الوحدة التعليمية الجديدة (مثل: أساسيات لغة HTML)"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="flex-grow px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
            <button
              onClick={handleAddModule}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0"
            >
              إضافة
            </button>
            <button
              onClick={() => setShowNewModuleInput(false)}
              className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-xl text-xs shrink-0"
            >
              إلغاء
            </button>
          </div>
        )}

        {/* Modules List */}
        {course.modules.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/20">
            <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-gray-500">لا توجد وحدات بعد في هذه الدورة.</p>
            <p className="text-xs text-gray-400 mt-1">اضغط على زر "إضافة وحدة" في الأعلى للبدء.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod: any, modIndex: number) => {
              const isCollapsed = collapsedModules[mod.id]
              const isFirst = modIndex === 0
              const isLast = modIndex === course.modules.length - 1

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-gray-200/60 dark:border-slate-850 bg-white dark:bg-slate-950 overflow-hidden shadow-sm"
                >

                  {/* Module Header Row */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-900/20 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-900/60">
                    <div className="flex items-center gap-2 flex-grow">
                      <button
                        onClick={() => toggleCollapse(mod.id)}
                        className="p-1 rounded-lg hover:bg-gray-150 dark:hover:bg-slate-900 text-gray-400"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>

                      {editingModuleId === mod.id ? (
                        <div className="flex gap-2 flex-grow max-w-sm">
                          <input
                            type="text"
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            className="px-3 py-1 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-sm outline-none w-full"
                          />
                          <button
                            onClick={() => handleEditModule(mod.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingModuleId(null)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span className="text-indigo-500 font-bold">الوحدة {modIndex + 1}:</span>
                          <span>{mod.title}</span>
                        </h3>
                      )}
                    </div>

                    {/* Module Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reordering buttons */}
                      <button
                        disabled={isFirst}
                        onClick={() => handleMoveModule(modIndex, "up")}
                        className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-slate-900 text-gray-400 disabled:opacity-30"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isLast}
                        onClick={() => handleMoveModule(modIndex, "down")}
                        className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-slate-900 text-gray-400 disabled:opacity-30"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-[1px] bg-gray-200 dark:bg-slate-800 mx-1" />

                      <button
                        onClick={() => {
                          setEditingModuleId(mod.id)
                          setEditingModuleTitle(mod.title)
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-slate-900 text-indigo-500"
                        title="تعديل اسم الوحدة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-slate-900 text-rose-500"
                        title="حذف الوحدة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Module Content List (Lessons, Quizzes, Assignments) */}
                  {!isCollapsed && (
                    <div className="p-4 space-y-4 bg-white dark:bg-slate-950/20">

                      {/* Sub-items (lessons, quizzes, assignments) */}
                      <div className="space-y-2.5">

                        {/* Render Lessons */}
                        {mod.lessons?.map((les: any, lesIdx: number) => {
                          const isFirstLes = lesIdx === 0
                          const isLastLes = lesIdx === mod.lessons.length - 1

                          return (
                            <div
                              key={les.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-900 bg-gray-50/25 dark:bg-slate-900/10 hover:border-indigo-500/10"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs shrink-0">
                                  <Play className="w-3 h-3 fill-indigo-500" />
                                </span>
                                <div>
                                  <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-snug">
                                    <span>الدرس {lesIdx + 1}: </span>
                                    {les.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-0.5">
                                    <span>{les.duration} دقيقة</span>
                                    <span>•</span>
                                    <span className="font-extrabold text-indigo-650 dark:text-indigo-400">
                                      {les.type === "VIDEO" ? "فيديو" : les.type === "TEXT" ? "مقال/نص" : "ملف مرفق"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lesson operations */}
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={isFirstLes}
                                  onClick={() => handleMoveLesson(mod.id, lesIdx, "up")}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-900 text-gray-400 disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={isLastLes}
                                  onClick={() => handleMoveLesson(mod.id, lesIdx, "down")}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-900 text-gray-400 disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>

                                <div className="h-3 w-[1px] bg-gray-200 dark:bg-slate-800 mx-1" />

                                <Link
                                  href={`/dashboard/teacher/courses/${course.id}/lessons/${les.id}`}
                                  className="p-1 rounded text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs font-bold"
                                  title="تعديل محتوى وتفاصيل الدرس"
                                >
                                  تعديل
                                </Link>
                                <button
                                  onClick={() => handleDeleteLesson(les.id, mod.id)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  title="حذف الدرس"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        {/* Render Quizzes */}
                        {mod.quizzes?.map((quiz: any) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-amber-250/20 dark:border-amber-900/30 bg-amber-500/5 hover:border-amber-500/30"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs shrink-0">
                                <HelpCircle className="w-3 h-3" />
                              </span>
                              <div>
                                <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 leading-snug">
                                  <span>اختبار: </span>
                                  {quiz.title}
                                </h4>
                                <span className="block text-[9px] text-gray-400 mt-0.5">اختبار تقييمي للوحدة</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Link
                                href={`/dashboard/teacher/courses/${course.id}/quizzes/${quiz.id}`}
                                className="p-1.5 rounded text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/25 text-xs font-bold"
                                title="منشئ الأسئلة"
                              >
                                منشئ الأسئلة
                              </Link>
                              <button
                                onClick={() => handleDeleteQuiz(quiz.id, mod.id)}
                                className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Render Assignments */}
                        {mod.assignments?.map((asg: any) => (
                          <div
                            key={asg.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-violet-200/50 dark:border-violet-900/35 bg-violet-500/5 hover:border-violet-500/35"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 text-xs shrink-0">
                                <Calendar className="w-3 h-3" />
                              </span>
                              <div>
                                <h4 className="font-bold text-xs text-violet-600 dark:text-violet-400 leading-snug">
                                  <span>واجب: </span>
                                  {asg.title}
                                </h4>
                                <span className="block text-[9px] text-gray-400 mt-0.5">تاريخ التسليم: {new Date(asg.dueDate).toLocaleDateString("ar-EG")} • الدرجة: {asg.points}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Link
                                href={`/dashboard/teacher/courses/${course.id}/assignments/${asg.id}`}
                                className="p-1.5 rounded text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-950/25 text-xs font-bold"
                              >
                                تقييم التسليمات
                              </Link>
                              <button
                                onClick={() => handleDeleteAssignment(asg.id, mod.id)}
                                className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                      </div>

                      {/* Content Addition buttons inside Module */}
                      <div className="pt-2 flex justify-start gap-2 flex-wrap border-t border-gray-100 dark:border-slate-900">

                        <button
                          onClick={() => setActiveAddForm({ type: "lesson", moduleId: mod.id })}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-slate-900 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة درس</span>
                        </button>

                        <button
                          onClick={() => setActiveAddForm({ type: "quiz", moduleId: mod.id })}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30 text-amber-600 text-[10px] font-bold hover:bg-amber-50 dark:hover:bg-amber-950/10 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة اختبار</span>
                        </button>

                        <button
                          onClick={() => setActiveAddForm({ type: "assignment", moduleId: mod.id })}
                          className="px-2.5 py-1.5 rounded-lg border border-violet-200/50 dark:border-violet-900/30 text-violet-600 text-[10px] font-bold hover:bg-violet-50 dark:hover:bg-violet-950/10 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة واجب</span>
                        </button>

                      </div>

                      {/* Interactive Add Form (inline drawer) */}
                      {activeAddForm?.moduleId === mod.id && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-850 space-y-3 mt-3 text-right">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white">
                            {activeAddForm!.type === "lesson" ? "درس جديد" : activeAddForm!.type === "quiz" ? "اختبار جديد للوحدة" : "واجب دراسي جديد"}
                          </h4>

                          {activeAddForm.type === "lesson" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  placeholder="عنوان الدرس"
                                  value={lessonForm.title}
                                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                  className="md:col-span-2 px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg text-xs"
                                />
                                <input
                                  type="number"
                                  placeholder="المدة بالدقائق"
                                  value={lessonForm.duration}
                                  onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg text-xs"
                                />
                              </div>
                              <div className="flex gap-4">
                                <label className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                                  <input
                                    type="radio"
                                    name="lessonType"
                                    checked={lessonForm.type === "VIDEO"}
                                    onChange={() => setLessonForm({ ...lessonForm, type: "VIDEO" })}
                                  />
                                  فيديو شرح
                                </label>
                                <label className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                                  <input
                                    type="radio"
                                    name="lessonType"
                                    checked={lessonForm.type === "TEXT"}
                                    onChange={() => setLessonForm({ ...lessonForm, type: "TEXT" })}
                                  />
                                  نص مقالي
                                </label>
                                <label className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                                  <input
                                    type="radio"
                                    name="lessonType"
                                    checked={lessonForm.type === "RESOURCE"}
                                    onChange={() => setLessonForm({ ...lessonForm, type: "RESOURCE" })}
                                  />
                                  ملف مرفق/تحميلي
                                </label>
                              </div>
                              <button
                                onClick={() => handleAddLesson(mod.id)}
                                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-bold rounded-lg"
                              >
                                إضافة الدرس
                              </button>
                            </div>
                          )}

                          {activeAddForm.type === "quiz" && (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="عنوان الاختبار (مثال: اختبار تقييمي لأساسيات HTML)"
                                value={quizForm.title}
                                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg text-xs"
                              />
                              <button
                                onClick={() => handleAddQuiz(mod.id)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                              >
                                إضافة الاختبار
                              </button>
                            </div>
                          )}

                          {activeAddForm.type === "assignment" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="عنوان الواجب"
                                  value={assignmentForm.title}
                                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-lg text-xs"
                                />
                                <input
                                  type="date"
                                  value={assignmentForm.dueDate}
                                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-lg text-xs text-gray-550 dark:text-slate-400"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                  type="number"
                                  placeholder="الدرجة الكلية (القصوى)"
                                  value={assignmentForm.points}
                                  onChange={(e) => setAssignmentForm({ ...assignmentForm, points: Number(e.target.value) })}
                                  className="md:col-span-1 px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-lg text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="ملاحظات أو وصف للواجب"
                                  value={assignmentForm.description}
                                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                                  className="md:col-span-3 px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-lg text-xs"
                                />
                              </div>
                              <button
                                onClick={() => handleAddAssignment(mod.id)}
                                className="px-4 py-2 bg-violet-650 hover:bg-violet-755 text-white text-xs font-bold rounded-lg"
                              >
                                إضافة الواجب
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setActiveAddForm(null)}
                            className="px-3 py-1.5 border border-gray-200 dark:border-slate-800 text-gray-500 rounded-lg text-[10px] mt-1 hover:bg-gray-100 dark:hover:bg-slate-900"
                          >
                            إلغاء الإجراء
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Course metadata edit panel - Right side */}
      <div className="space-y-6">

        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm text-right">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Settings className="w-4.5 h-4.5 text-indigo-500" />
            <span>تحديث بيانات الدورة</span>
          </h2>

          {/* Status response */}
          {statusMsg && (
            <div className={`p-3 rounded-xl border ${statusMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
              } text-xs font-semibold`}>
              {statusMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">العنوان</label>
              <input
                type="text"
                name="title"
                value={metadata.title}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">الوصف</label>
              <textarea
                name="description"
                rows={3}
                value={metadata.description}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">الفئة</label>
                <input
                  type="text"
                  name="category"
                  value={metadata.category}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">السعر (عملات)</label>
                <input
                  type="number"
                  name="priceInCoins"
                  value={metadata.priceInCoins}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">المستوى</label>
                <select
                  name="level"
                  value={metadata.level}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none text-gray-650 dark:text-slate-400 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="BEGINNER">مبتدئ</option>
                  <option value="INTERMEDIATE">متوسط</option>
                  <option value="ADVANCED">متقدم</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">حالة الدورة</label>
                <select
                  name="status"
                  value={metadata.status}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none text-gray-650 dark:text-slate-400 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="DRAFT">مسودة (Draft)</option>
                  <option value="REVIEW">قيد المراجعة (Review)</option>
                  <option value="PUBLISHED">منشورة (Published)</option>
                  <option value="ARCHIVED">مؤرشفة (Archived)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">متطلبات الدورة (سطر جديد لكل متطلب)</label>
              <textarea
                name="requirements"
                rows={2}
                value={metadata.requirements}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">الأهداف التعليمية (سطر جديد لكل هدف)</label>
              <textarea
                name="learningObjectives"
                rows={2}
                value={metadata.learningObjectives}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">رابط صورة الغلاف</label>
              <input
                type="text"
                name="coverImage"
                value={metadata.coverImage}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleSaveMetadata}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
