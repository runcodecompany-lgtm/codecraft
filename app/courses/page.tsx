// app/courses/page.tsx
import React from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { BookOpen, Coins, Search, Sparkles, SlidersHorizontal, ArrowLeft, GraduationCap } from "lucide-react"

export const metadata = {
  title: "المسارات والدورات البرمجية | Code Craft Core",
  description: "استكشف مساراتنا البرمجية المتنوعة وتعلّم البرمجة مجاناً بأسلوب الألعاب التفاعلي.",
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    search?: string
    price?: string
  }>
}

export default async function PublicCoursesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ""
  const price = params.price || "all"

  // Query courses matching search and price filter
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      AND: [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
        price === "free" 
          ? { priceInCoins: 0 }
          : price === "paid"
          ? { priceInCoins: { gt: 0 } }
          : {},
      ],
    },
    include: {
      teacher: { select: { name: true } },
      modules: {
        select: {
          lessons: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 pb-24" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#141C2F] py-16">
        <div
          aria-hidden="true"
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#2B4C7E]/5 rounded-full blur-[100px] pointer-events-none"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2B4C7E]/20 bg-[#2B4C7E]/6 dark:bg-[#2B4C7E]/12 px-4 py-2 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] mb-6">
            <Sparkles className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
            <span>مسارات تعليمية معدّة بأحدث التقنيات</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-slate-50">
            استكشف{" "}
            <span className="bg-gradient-to-l from-[#2B4C7E] to-[#4A7C59] bg-clip-text text-transparent">
              الدورات والمناهج
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            اختر دورتك، ابدأ التحديات، واكسب عملات كرافت كوينز وشهادات إتمام معتمدة بعد إنهاء مسارك.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-6 h-fit space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-base font-bold pb-4 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
              <span>تصفية النتائج</span>
            </div>

            {/* Search Input */}
            <form method="GET" className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">ابحث عن دورة</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="اسم الدورة أو الكلمات المفتاحية..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2B4C7E] focus:ring-2 focus:ring-[#2B4C7E]/15 outline-none text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 text-right"
                  dir="rtl"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 dark:hover:text-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {price !== "all" && <input type="hidden" name="price" value={price} />}
            </form>

            {/* Price Filter */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">تكلفة الدورة</span>
              <div className="flex flex-col gap-2">
                {[
                  { label: "الكل", value: "all" },
                  { label: "مجاني", value: "free" },
                  { label: "مدفوع (بالعملات)", value: "paid" },
                ].map((item) => {
                  const active = price === item.value
                  const href = `?price=${item.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`
                  return (
                    <Link
                      key={item.value}
                      href={href}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border text-right block ${
                        active
                          ? "bg-[#2B4C7E]/8 border-[#2B4C7E] text-[#2B4C7E] dark:text-[#7FA8D4] dark:bg-[#2B4C7E]/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Courses List Grid */}
          <section className="lg:col-span-3">
            {courses.length === 0 ? (
              <div className="text-center text-slate-400 py-24 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#141C2F]">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-40" />
                <span>لا توجد دورات مطابقة لخيارات التصفية حالياً.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] hover:border-[#2B4C7E]/30 dark:hover:border-[#2B4C7E]/45 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Course Image */}
                      <div className="h-44 bg-gradient-to-tr from-[#2B4C7E]/5 to-[#4A7C59]/5 relative overflow-hidden flex items-center justify-center">
                        {course.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <GraduationCap className="w-16 h-16 text-[#2B4C7E]/20" />
                        )}
                        {/* Cost Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          {course.priceInCoins === 0 ? (
                            <span className="inline-flex items-center text-xs font-bold bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/20 px-3 py-1 rounded-full">
                              مجاناً
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#2B4C7E]/10 text-[#2B4C7E] border border-[#2B4C7E]/20 px-3 py-1 rounded-full">
                              <Coins className="w-3.5 h-3.5 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                              {course.priceInCoins} CC
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-6 flex flex-col flex-1 gap-3">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-snug group-hover:text-[#2B4C7E] dark:group-hover:text-[#7FA8D4] transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 flex-1">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                            {totalLessons} درس
                          </span>
                          <span>المدرب: {course.teacher?.name ?? "معلم متميز"}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
