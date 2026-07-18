// app/articles/page.tsx
import React from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Clock, User2, BookOpen, FileText, ArrowLeft, Search, SlidersHorizontal, ChevronRight, ChevronLeft } from "lucide-react"

export const metadata = {
  title: "المدونة والمقالات التقنية | Code Craft Core",
  description: "اقرأ أحدث المقالات التقنية، النصائح البرمجية، وشروحات لغات البرمجة من معلمي المنصة.",
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    search?: string
    courseId?: string
    page?: string
  }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ""
  const courseId = params.courseId || "all"
  const page = Number(params.page) || 1
  const limit = 6
  const skip = (page - 1) * limit

  // Define database query filters
  const filterClause: any = {
    published: true,
    AND: [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      },
      courseId !== "all" ? { courseId: courseId } : {},
    ],
  }

  // Fetch count and paginated items in parallel
  const [articles, totalCount, courses] = await Promise.all([
    prisma.article.findMany({
      where: filterClause,
      include: {
        author: { select: { name: true } },
        course: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.article.count({ where: filterClause }),
    prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      {/* Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Link>
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3">المدونة التقنية</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            اقرأ شروحات برمجية عملية ونصائح تقنية من إعداد طاقم المعلمين وخبراء هندسة البرمجيات.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 h-fit space-y-6">
            <div className="flex items-center gap-2 text-base font-bold pb-4 border-b border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>البحث والتصفية</span>
            </div>

            {/* Search */}
            <form method="GET" className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">كلمات البحث</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="ابحث عن مقال..."
                  className="w-full px-4 py-3 bg-slate-850 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 text-white"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {courseId !== "all" && <input type="hidden" name="courseId" value={courseId} />}
            </form>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">حسب الدورة المرتبطة</label>
              <div className="flex flex-col gap-2">
                <Link
                  href={`?courseId=all${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-right block border transition-all ${
                    courseId === "all"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-450"
                      : "border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  جميع المقالات
                </Link>
                {courses.map((course) => {
                  const active = courseId === course.id
                  const href = `?courseId=${course.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`
                  return (
                    <Link
                      key={course.id}
                      href={href}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-right block border transition-all ${
                        active
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-450"
                          : "border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {course.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Articles List */}
          <section className="lg:col-span-3 space-y-10">
            {articles.length === 0 ? (
              <div className="text-center text-slate-500 py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <span>لا توجد مقالات منشورة تطابق بحثك حالياً.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.map((article) => {
                    const readingMins = Math.max(1, Math.ceil(article.content.split(" ").length / 200))
                    return (
                      <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 p-6 hover:border-indigo-500/30 hover:bg-slate-905/60 transition-all duration-300"
                      >
                        {article.course && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full mb-4 w-fit">
                            <BookOpen className="w-3 h-3" />
                            {article.course.title}
                          </span>
                        )}
                        <h2 className="font-extrabold text-white text-base leading-snug mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-slate-400 text-xs leading-relaxed flex-1 line-clamp-3 mb-4">
                          {article.content.replace(/[#*`]/g, "").slice(0, 140)}...
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 border-t border-slate-850 pt-4 mt-auto">
                          <span className="flex items-center gap-1">
                            <User2 className="w-3.5 h-3.5" />
                            {article.author?.name ?? "معلم بالمنصة"}
                          </span>
                          <span className="w-px h-3 bg-slate-800" />
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {readingMins} د قراءة
                          </span>
                          <span className="w-px h-3 bg-slate-800" />
                          <span>
                            {new Date(article.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
                    {page > 1 ? (
                      <Link
                        href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${courseId !== "all" ? `&courseId=${courseId}` : ""}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                        السابق
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-650 inline-flex items-center gap-1 cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                        السابق
                      </span>
                    )}

                    <span className="text-xs text-slate-500 font-bold">صفحة {page} من {totalPages}</span>

                    {page < totalPages ? (
                      <Link
                        href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${courseId !== "all" ? `&courseId=${courseId}` : ""}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-650 inline-flex items-center gap-1 cursor-not-allowed">
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
