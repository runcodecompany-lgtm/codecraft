"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  getTeacherCourses,
  changeCourseStatus,
  deleteCourse
} from "@/actions/teacher-course"
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Archive,
  BookOpen, Users, Coins, HelpCircle, GraduationCap, AlertTriangle,
  ChevronLeft, ChevronRight
} from "lucide-react"

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  const loadCourses = async () => {
    setLoading(true)
    setError("")
    const res = await getTeacherCourses()
    if (res.success && res.courses) {
      setCourses(res.courses)
    } else {
      setError(res.error || "فشل تحميل قائمة الدورات.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    setStatusMsg(null)
    const res = await changeCourseStatus(courseId, newStatus)
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم تغيير حالة الدورة بنجاح!" })
      loadCourses()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل تغيير الحالة." })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setStatusMsg(null)
    const res = await deleteCourse(deletingId)
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم حذف الدورة بنجاح!" })
      setDeletingId(null)
      loadCourses()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل حذف الدورة." })
      setDeletingId(null)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(courses.length / ITEMS_PER_PAGE)
  const start = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCourses = courses.slice(start, start + ITEMS_PER_PAGE)

  // Reset page when courses change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [courses.length])

  return (
    <div className="space-y-8 text-right" dir="rtl">

      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">إدارة الدورات التدريبية</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">أنشئ المناهج البرمجية، وتابع حالات النشر والأرشفة بشكل مباشر.</p>
        </div>
        <Link
          href="/dashboard/teacher/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دورة جديدة</span>
        </Link>
      </div>

      {/* Messages */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border ${statusMsg.type === "success"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          } text-sm font-semibold`}>
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-400 mt-4">جاري تحميل الدورات...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-500 font-bold">{error}</div>
      ) : courses.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/20">
          <BookOpen className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-4 opacity-40" />
          <p className="text-gray-500 dark:text-slate-400 font-bold text-lg">لا توجد دورات مضافة بعد</p>
          <p className="text-xs text-gray-400 mt-1.5 mb-6">ابدأ الآن بإضافة أول مقرر تعليمي على المنصة.</p>
          <Link
            href="/dashboard/teacher/courses/new"
            className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>أضف دورتك الأولى</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Pagination stats */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-semibold">
              إجمالي {courses.length} دورة
            </div>
            {totalPages > 1 && (
              <div className="text-xs text-gray-400 font-semibold">
                الصفحة {currentPage} من {totalPages}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedCourses.map((course) => {
              const totalStudents = course.enrollments?.length || 0
              const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0

              return (
                <div
                  key={course.id}
                  className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Cover Image or placeholder */}
                  <div className="h-44 relative bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden">
                    {course.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-16 h-16 text-indigo-500/20" />
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${course.status === "PUBLISHED"
                        ? "bg-emerald-500 text-white"
                        : course.status === "REVIEW"
                          ? "bg-amber-500 text-white"
                          : course.status === "ARCHIVED"
                            ? "bg-slate-600 text-white"
                            : "bg-blue-500 text-white"
                        }`}>
                        {course.status === "PUBLISHED" ? "منشورة" : course.status === "REVIEW" ? "قيد المراجعة" : course.status === "ARCHIVED" ? "مؤرشفة" : "مسودة"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 space-y-4">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-snug line-clamp-2">{course.title}</h3>

                    {/* Category and Level info */}
                    <div className="flex gap-2">
                      {course.category && (
                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                          {course.category}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                        {course.level === "BEGINNER" ? "مبتدئ" : course.level === "INTERMEDIATE" ? "متوسط" : "متقدم"}
                      </span>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 dark:border-slate-900 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="font-black text-gray-900 dark:text-white">{totalStudents}</span>
                        <span className="text-[9px] font-bold">الطلاب</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="font-black text-gray-900 dark:text-white">{totalLessons}</span>
                        <span className="text-[9px] font-bold">الدروس</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <Coins className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="font-black text-gray-900 dark:text-white">{course.priceInCoins}</span>
                        <span className="text-[9px] font-bold">عملة</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-900 flex justify-between gap-2 flex-wrap">
                    <div className="flex gap-1">
                      <Link
                        href={`/dashboard/teacher/courses/${course.id}`}
                        className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
                        title="تعديل محتوى الدورة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setDeletingId(course.id)}
                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="حذف الدورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-1">
                      {course.status !== "PUBLISHED" ? (
                        <button
                          onClick={() => handleStatusChange(course.id, "PUBLISHED")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>نشر</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(course.id, "DRAFT")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>إلغاء نشر</span>
                        </button>
                      )}

                      {course.status !== "ARCHIVED" && (
                        <button
                          onClick={() => handleStatusChange(course.id, "ARCHIVED")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>أرشفة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8" dir="ltr">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all ${page === currentPage
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900"
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black">حذف الدورة التدريبية؟</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              تحذير: سيؤدي هذا الإجراء إلى حذف الدورة وجميع الدروس والاختبارات المرتبطة بها بشكل نهائي. لن يتمكن الطلاب المسجلون من الوصول إليها.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}