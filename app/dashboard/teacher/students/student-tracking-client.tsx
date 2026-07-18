"use client"

import React, { useState, useMemo } from "react"
import { Search, Percent, Calendar, BookOpen, HelpCircle, User, Award, ShieldClose, X, ChevronLeft, ChevronRight } from "lucide-react"

export default function StudentTrackingClient({
  enrollments,
  quizAttempts
}: {
  enrollments: any[]
  quizAttempts: any[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  // Filter enrollments
  const filtered = enrollments.filter(e => {
    const studentName = (e.user.fullName || e.user.name || "").toLowerCase()
    const studentEmail = (e.user.email || "").toLowerCase()
    const courseTitle = (e.course.title || "").toLowerCase()
    const query = searchQuery.toLowerCase()

    return studentName.includes(query) || studentEmail.includes(query) || courseTitle.includes(query)
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Get attempts for selected student
  const studentQuizAttempts = selectedStudent
    ? quizAttempts.filter(qa => qa.userId === selectedStudent.user.id)
    : []

  return (
    <div className="space-y-6">

      {/* Search Input */}
      <div className="relative max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-gray-250/60 dark:border-slate-800">
        <input
          type="text"
          placeholder="ابحث عن طالب بالاسم، البريد الإلكتروني، أو اسم الدورة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-3 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500"
        />
        <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
      </div>

      {/* Grid of student enrollment cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950/20 border border-gray-200 dark:border-slate-800 rounded-3xl text-sm text-gray-400 italic">
          لم يتم العثور على نتائج للطلاب المسجلين.
        </div>
      ) : (
        <>
          <div className="mb-2 text-xs text-gray-400 font-semibold flex items-center gap-2">
            <span>عرض {paginatedEnrollments.length} من أصل {filtered.length} طالب</span>
            {filtered.length > ITEMS_PER_PAGE && (
              <span>(الصفحة {currentPage} من {totalPages})</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedEnrollments.map((enr) => (
              <div
                key={enr.id}
                className="bg-white dark:bg-slate-950 border border-gray-250/60 dark:border-slate-850 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >

                {/* Top part */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {enr.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={enr.user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        (enr.user.fullName || enr.user.name || "S").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
                        {enr.user.fullName || enr.user.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{enr.user.email}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-900/60 text-xs">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1">مسجل في:</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200 leading-snug">{enr.course.title}</span>
                  </div>
                </div>

                {/* Bottom stats part */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-900 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>منذ: {new Date(enr.createdAt).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      <span>مستوى الطالب: {enr.user.level || 1}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400">التقدم بالمقرر</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{Math.round(enr.progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-indigo-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${enr.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudent(enr)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-1"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>تفاصيل نتائج الاختبارات</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6" dir="ltr">
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

      {/* Details modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col justify-between space-y-4 text-right">

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">سجل اختبارات الطالب</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile info inside modal */}
            <div className="flex items-center gap-3 p-3 bg-gray-55/10 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-850">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
                {selectedStudent.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedStudent.user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  (selectedStudent.user.fullName || selectedStudent.user.name || "S").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{selectedStudent.user.fullName || selectedStudent.user.name}</h4>
                <p className="text-[10px] text-gray-450 mt-0.5">مستوى {selectedStudent.user.level || 1} • {selectedStudent.user.xp || 0} نقطة خبرة XP</p>
              </div>
            </div>

            {/* Quiz attempts list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/80 max-h-[45vh] pr-1">
              {studentQuizAttempts.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 italic">لا توجد محاولات اختبار مسجلة لهذا الطالب بعد.</div>
              ) : (
                studentQuizAttempts.map((attempt) => (
                  <div key={attempt.id} className="py-3.5 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{attempt.quiz.title}</p>
                      <span className="text-[9px] text-gray-400 mt-1 block">تاريخ الإجراء: {new Date(attempt.createdAt).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <div className="text-left shrink-0">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${attempt.isPassed
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}>
                        {attempt.isPassed ? "ناجح" : "لم يجتز"}
                      </span>
                      <span className="block text-[10px] font-extrabold text-gray-700 dark:text-slate-300 mt-1">
                        {attempt.score} / {attempt.total} ({attempt.percentage}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-150 dark:border-slate-800 text-left">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
