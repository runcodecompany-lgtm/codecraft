"use client"

import React, { useState, useMemo } from "react"
import { replyToReview } from "@/actions/review"
import { Star, MessageSquare, BookOpen, Send, Reply, ChevronLeft, ChevronRight } from "lucide-react"

export default function ReviewsListClient({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE)
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return reviews.slice(start, start + ITEMS_PER_PAGE)
  }, [reviews, currentPage])

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return
    setLoading(true)

    const res = await replyToReview(reviewId, replyText)
    if (res.success) {
      setReviews(prev =>
        prev.map(rev => rev.id === reviewId ? { ...rev, reply: replyText } : rev)
      )
      setActiveReplyId(null)
      setReplyText("")
      alert("تم إرسال ردك للطالب بنجاح!")
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  const handleOpenReply = (rev: any) => {
    setActiveReplyId(rev.id)
    setReplyText(rev.reply || "")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
        <span>إجمالي {reviews.length} تقييم</span>
        {totalPages > 1 && <span>الصفحة {currentPage} من {totalPages}</span>}
      </div>

      {reviews.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/20 text-sm text-gray-400 italic">
          لا توجد تقييمات مضافة لدوراتك بعد.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-950 border border-gray-200/60 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4 text-right"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-extrabold text-indigo-500 text-sm shrink-0">
                    {rev.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rev.user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      (rev.user.fullName || rev.user.name || "S").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
                      {rev.user.fullName || rev.user.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-current" : "text-gray-250 dark:text-slate-800"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                  <span>دورة: {rev.course.title}</span>
                </div>
              </div>

              {/* Review Comment */}
              <div className="p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-gray-100 dark:border-slate-900 text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                "{rev.comment}"
              </div>

              {/* Reply Section */}
              {rev.reply && activeReplyId !== rev.id && (
                <div className="mr-8 p-4 bg-indigo-50/20 dark:bg-indigo-500/5 border-r-2 border-indigo-500 rounded-l-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black">
                    <Reply className="w-4 h-4 rotate-180" />
                    <span>ردك البرمجي:</span>
                  </div>
                  <p className="text-gray-650 dark:text-slate-350 leading-relaxed font-medium">{rev.reply}</p>
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold"
                  >
                    تعديل الرد
                  </button>
                </div>
              )}

              {/* Active reply input */}
              {activeReplyId === rev.id ? (
                <div className="mr-8 space-y-2.5">
                  <textarea
                    rows={3}
                    placeholder="اكتب ردك التوضيحي أو شكرك للطالب هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setActiveReplyId(null)}
                      className="px-3.5 py-1.5 border border-gray-200 dark:border-slate-800 text-gray-500 text-xs font-bold rounded-lg"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleReplySubmit(rev.id)}
                      disabled={loading}
                      className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>إرسال الرد</span>
                    </button>
                  </div>
                </div>
              ) : (
                !rev.reply && (
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-900"
                  >
                    <Reply className="w-3.5 h-3.5 rotate-180" />
                    <span>كتابة رد على الطالب</span>
                  </button>
                )
              )}

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6" dir="ltr">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)}
              className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all ${page === currentPage
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900"
                }`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
