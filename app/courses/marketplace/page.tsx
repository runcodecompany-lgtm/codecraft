// app/courses/marketplace/page.tsx
import React from "react"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { getActivePromotion } from "@/actions/payment"
import {
  ShoppingCart,
  BookOpen,
  Star,
  Sparkles,
  Coins,
  Tag,
  Clock,
  Users,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Award,
  Search,
} from "lucide-react"
import { addToCart } from "@/actions/cart"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "سوق الدورات التعليمية | Code Craft Core",
  description: "تصفّح وابحث في مئات الدورات التعليمية الاحترافية في البرمجة والعلوم والأعمال.",
}

// Level helpers
const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
}

// Sort helpers
const SORT_OPTIONS = [
  { label: "الأكثر شيوعاً", value: "popular" },
  { label: "الأعلى تقييماً", value: "rating" },
  { label: "الأحدث", value: "newest" },
  { label: "الأرخص", value: "price_asc" },
  { label: "الأغلى", value: "price_desc" },
]

export default async function MarketplacePage(props: {
  searchParams: Promise<{
    category?: string
    query?: string
    price?: string   // "free" | "paid"
    level?: string   // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    rating?: string  // "3" | "3.5" | "4" | "4.5"
    sort?: string
  }>
}) {
  const searchParams = await props.searchParams
  const categoryFilter = searchParams.category
  const searchQuery = searchParams.query
  const priceFilter = searchParams.price
  const levelFilter = searchParams.level
  const ratingFilter = searchParams.rating ? parseFloat(searchParams.rating) : null
  const sortFilter = searchParams.sort || "popular"

  // Helper to get all sub-track IDs recursively
  async function getDescendantTrackIds(trackId: string): Promise<string[]> {
    const ids = [trackId]
    let currentLevelIds = [trackId]
    while (currentLevelIds.length > 0) {
      const children = await prisma.learningTrack.findMany({
        where: { parentId: { in: currentLevelIds }, isActive: true },
        select: { id: true }
      })
      currentLevelIds = children.map(c => c.id)
      ids.push(...currentLevelIds)
    }
    return ids
  }

  const descendantTrackIds = categoryFilter ? await getDescendantTrackIds(categoryFilter) : []

  // Build Prisma where clause
  const whereClause: any = {
    isPublished: true,
    ...(categoryFilter ? { trackId: { in: descendantTrackIds } } : {}),
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(priceFilter === "free" ? { priceInCoins: 0, price: 0 } : {}),
    ...(priceFilter === "paid" ? { OR: [{ priceInCoins: { gt: 0 } }, { price: { gt: 0 } }] } : {}),
    ...(searchQuery
      ? {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      }
      : {}),
  }

  // Fetch courses
  const allCourses = await prisma.course.findMany({
    where: whereClause,
    include: {
      teacher: { select: { name: true } },
      track: { select: { id: true, name: true } },
      modules: { select: { lessons: { select: { id: true } } } },
    },
    orderBy: sortFilter === "newest" ? { createdAt: "desc" } : { createdAt: "desc" },
  })

  // Simulate ratings (will be replaced when DB has real ratings)
  const courses = allCourses
    .map((c, i) => ({
      ...c,
      simulatedRating: parseFloat((4.4 + ((i * 7) % 6) * 0.1).toFixed(1)),
      simulatedReviews: 1200 + (i * 317) % 50000,
      totalLessons: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    }))
    .filter((c) => ratingFilter === null || c.simulatedRating >= ratingFilter)

  // Fetch active tracks for sidebar
  const categories = await prisma.learningTrack.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const promotion = await getActivePromotion()

  // Server Action
  async function handleAddToCart(formData: FormData) {
    "use server"
    const courseId = formData.get("courseId") as string
    if (courseId) {
      await addToCart(courseId)
      revalidatePath("/courses/marketplace")
      revalidatePath("/cart")
    }
  }

  // Check if any filter is active
  const hasActiveFilters = !!(categoryFilter || priceFilter || levelFilter || ratingFilter || searchQuery)

  return (
    <div
      className="min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100"
      dir="rtl"
    >
      {/* ── Promotion Banner ── */}
      {promotion && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1">
              <span className="font-black">{promotion.name}</span>
              {promotion.description ? ` — ${promotion.description}` : " — خصومات على جميع الدورات المدفوعة لفترة محدودة!"}
            </p>
            <span className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-black shrink-0">
              {promotion.discountValue}{promotion.discountType === "PERCENT" ? "%" : "$"} خصم
            </span>
          </div>
        </div>
      )}

      {/* ── Page Header Banner ── */}
      <div className="bg-white dark:bg-[#141C2F] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors font-medium">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <Link href="/courses" className="hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors font-medium">الدورات</Link>
            {categoryFilter && categories.find(c => c.id === categoryFilter) && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {categories.find(c => c.id === categoryFilter)?.name}
                </span>
              </>
            )}
          </nav>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">
            {categoryFilter
              ? categories.find(c => c.id === categoryFilter)?.name ?? "جميع الدورات"
              : searchQuery
                ? `نتائج البحث عن: "${searchQuery}"`
                : "جميع الدورات التعليمية"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            دورات لمساعدتك على البدء. استكشف دوراتنا من أصحاب الخبرة العملية.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ──────────────────────────────── */}
          {/* RIGHT SIDEBAR (Filters) — RTL  */}
          {/* ──────────────────────────────── */}
          <aside className="w-64 shrink-0 space-y-6">

            {/* Search box in sidebar */}
            <div>
              <form method="GET" className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="query"
                  defaultValue={searchQuery || ""}
                  placeholder="ابحث في الدورات..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-lg text-sm bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#2B4C7E] focus:ring-2 focus:ring-[#2B4C7E]/15 text-right placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
                  dir="rtl"
                />
                {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
                {priceFilter && <input type="hidden" name="price" value={priceFilter} />}
                {levelFilter && <input type="hidden" name="level" value={levelFilter} />}
                {ratingFilter && <input type="hidden" name="rating" value={ratingFilter} />}
              </form>
            </div>

            {/* Clear Filters (shown when filters active) */}
            {hasActiveFilters && (
              <Link
                href="/courses/marketplace"
                className="flex items-center gap-1.5 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                مسح جميع الفلاتر
              </Link>
            )}

            {/* ── Ratings Filter ── */}
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                التقييم
              </h3>
              <div className="space-y-2.5">
                {[4.5, 4.0, 3.5, 3.0].map((val) => {
                  const isActive = ratingFilter === val
                  const params = new URLSearchParams()
                  if (categoryFilter) params.set("category", categoryFilter)
                  if (searchQuery) params.set("query", searchQuery)
                  if (priceFilter) params.set("price", priceFilter)
                  if (levelFilter) params.set("level", levelFilter)
                  params.set("rating", String(val))

                  return (
                    <Link
                      key={val}
                      href={`/courses/marketplace?${params.toString()}`}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? "border-[#2B4C7E] bg-[#2B4C7E]"
                        : "border-slate-300 dark:border-slate-700 group-hover:border-[#2B4C7E]"
                        }`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= Math.round(val) ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700"}`}
                            />
                          ))}
                        </div>
                        <span className={`font-bold ${isActive ? "text-[#2B4C7E] dark:text-[#7FA8D4]" : "text-slate-600 dark:text-slate-400"}`}>
                          {val} فأكثر
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* ── Price Filter ── */}
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                السعر
              </h3>
              <div className="space-y-2">
                {[
                  { label: "الكل", value: "" },
                  { label: "مدفوع", value: "paid" },
                  { label: "مجاني", value: "free" },
                ].map((opt) => {
                  const isActive = (priceFilter ?? "") === opt.value
                  const params = new URLSearchParams()
                  if (categoryFilter) params.set("category", categoryFilter)
                  if (searchQuery) params.set("query", searchQuery)
                  if (levelFilter) params.set("level", levelFilter)
                  if (ratingFilter) params.set("rating", String(ratingFilter))
                  if (opt.value) params.set("price", opt.value)

                  return (
                    <Link
                      key={opt.value}
                      href={`/courses/marketplace?${params.toString()}`}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? "border-[#2B4C7E] bg-[#2B4C7E]"
                        : "border-slate-300 dark:border-slate-700 group-hover:border-[#2B4C7E]"
                        }`}>
                        {isActive && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? "text-[#2B4C7E] dark:text-[#7FA8D4]" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                        {opt.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* ── Level Filter ── */}
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                المستوى
              </h3>
              <div className="space-y-2">
                {[
                  { label: "جميع المستويات", value: "" },
                  { label: "مبتدئ", value: "BEGINNER" },
                  { label: "متوسط", value: "INTERMEDIATE" },
                  { label: "متقدم", value: "ADVANCED" },
                ].map((opt) => {
                  const isActive = (levelFilter ?? "") === opt.value
                  const params = new URLSearchParams()
                  if (categoryFilter) params.set("category", categoryFilter)
                  if (searchQuery) params.set("query", searchQuery)
                  if (priceFilter) params.set("price", priceFilter)
                  if (ratingFilter) params.set("rating", String(ratingFilter))
                  if (opt.value) params.set("level", opt.value)

                  return (
                    <Link
                      key={opt.value}
                      href={`/courses/marketplace?${params.toString()}`}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? "border-[#2B4C7E] bg-[#2B4C7E]"
                        : "border-slate-300 dark:border-slate-700 group-hover:border-[#2B4C7E]"
                        }`}>
                        {isActive && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? "text-[#2B4C7E] dark:text-[#7FA8D4]" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                        {opt.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* ── Category Filter ── */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  الفئة
                </h3>
                <div className="space-y-2">
                  {[{ id: "", name: "جميع الفئات" }, ...categories].map((cat) => {
                    const isActive = (categoryFilter ?? "") === cat.id
                    const params = new URLSearchParams()
                    if (searchQuery) params.set("query", searchQuery)
                    if (priceFilter) params.set("price", priceFilter)
                    if (levelFilter) params.set("level", levelFilter)
                    if (ratingFilter) params.set("rating", String(ratingFilter))
                    if (cat.id) params.set("category", cat.id)

                    return (
                      <Link
                        key={cat.id}
                        href={`/courses/marketplace?${params.toString()}`}
                        className="flex items-center gap-2 group cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isActive
                          ? "border-[#2B4C7E] bg-[#2B4C7E]"
                          : "border-slate-300 dark:border-slate-700 group-hover:border-[#2B4C7E]"
                          }`}>
                          {isActive && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-[#2B4C7E] dark:text-[#7FA8D4]" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                          {cat.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </aside>

          {/* ──────────────────────────────────── */}
          {/* LEFT MAIN CONTENT (Course Listings) */}
          {/* ──────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Results header row */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="text-slate-900 dark:text-slate-50 font-black text-base">{courses.length.toLocaleString("ar-EG")}</span>
                  {" "}من النتائج
                </p>
                {hasActiveFilters && (
                  <Link
                    href="/courses/marketplace"
                    className="text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    مسح الفلاتر
                  </Link>
                )}
              </div>

              {/* Sort select */}
              <form method="GET" className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">فرز حسب:</label>
                <select
                  name="sort"
                  defaultValue={sortFilter}
                  className="text-xs font-bold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#2B4C7E] cursor-pointer"
                  dir="rtl"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
                {searchQuery && <input type="hidden" name="query" value={searchQuery} />}
                {priceFilter && <input type="hidden" name="price" value={priceFilter} />}
                {levelFilter && <input type="hidden" name="level" value={levelFilter} />}
                {ratingFilter && <input type="hidden" name="rating" value={ratingFilter} />}
                <button type="submit" className="px-3 py-2 rounded-lg bg-[#2B4C7E] text-white text-xs font-bold hover:bg-[#1c3459] transition-colors shrink-0">
                  ترتيب
                </button>
              </form>
            </div>

            {/* Empty state */}
            {courses.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#141C2F] rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="h-14 w-14 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">لا توجد دورات مطابقة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  جرّب تغيير خيارات البحث أو الفلترة للحصول على نتائج.
                </p>
                <Link
                  href="/courses/marketplace"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B4C7E] text-white text-xs font-bold hover:bg-[#1c3459] transition-colors"
                >
                  عرض جميع الدورات
                </Link>
              </div>
            ) : (
              /* ── Course Cards (Udemy horizontal row style) ── */
              <div className="space-y-4">
                {courses.map((course, i) => {
                  let displayPrice = course.price
                  let isDiscounted = false
                  let finalPrice = course.price

                  if (promotion && course.price > 0) {
                    isDiscounted = true
                    if (promotion.discountType === "PERCENT") {
                      finalPrice = parseFloat((course.price * (1 - promotion.discountValue / 100)).toFixed(2))
                    } else {
                      finalPrice = Math.max(0, course.price - promotion.discountValue)
                    }
                  }

                  const isFree = course.price === 0 && course.priceInCoins === 0
                  const isBestSeller = course.simulatedReviews > 20000 || i === 0

                  return (
                    <div
                      key={course.id}
                      className="group flex gap-4 bg-white dark:bg-[#141C2F] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#2B4C7E]/30 dark:hover:border-[#2B4C7E]/40 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Course Thumbnail */}
                      <Link
                        href={`/courses/${course.slug}`}
                        className="relative w-52 sm:w-60 md:w-64 shrink-0 bg-slate-100 dark:bg-slate-900 overflow-hidden"
                      >
                        {course.coverImage ? (
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[140px]"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-2 bg-gradient-to-tr from-[#2B4C7E]/8 to-[#4A7C59]/8">
                            <BookOpen className="w-10 h-10 text-[#2B4C7E]/30" />
                          </div>
                        )}
                        {/* Best Seller badge */}
                        {isBestSeller && (
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase">
                            الأكثر مبيعاً
                          </span>
                        )}
                      </Link>

                      {/* Course Details */}
                      <div className="flex flex-1 min-w-0 flex-col gap-2.5 py-4 pl-4 pr-2">

                        {/* Title */}
                        <Link href={`/courses/${course.slug}`}>
                          <h3 className="font-black text-slate-900 dark:text-slate-50 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#2B4C7E] dark:group-hover:text-[#7FA8D4] transition-colors">
                            {course.title}
                          </h3>
                        </Link>

                        {/* Description */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1">
                          {course.description}
                        </p>

                        {/* Instructor */}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {course.teacher?.name ?? "معلم متميز"}
                        </p>

                        {/* Rating row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {course.simulatedRating}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= Math.round(course.simulatedRating)
                                  ? "fill-amber-500 text-amber-500"
                                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            ({course.simulatedReviews.toLocaleString("ar-EG")} تقييم)
                          </span>
                        </div>

                        {/* Meta: lessons · level */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                            {course.totalLessons} درس
                          </span>
                          {course.level && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3 text-[#4A7C59] dark:text-[#6AAD7A]" />
                              {LEVEL_MAP[course.level] ?? course.level}
                            </span>
                          )}
                          {course.track && (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                              {course.track.name}
                            </span>
                          )}
                        </div>

                      </div>

                      {/* Price Column (far left in RTL) */}
                      <div className="flex flex-col items-end justify-between py-4 pl-4 shrink-0 min-w-[100px]">
                        {/* Price display */}
                        <div className="text-right space-y-0.5">
                          {isFree ? (
                            <span className="text-sm font-black text-[#4A7C59] dark:text-[#6AAD7A]">مجاناً</span>
                          ) : course.priceInCoins > 0 && course.price === 0 ? (
                            <span className="flex items-center gap-1 text-sm font-black text-amber-500 justify-end">
                              <Coins className="w-4 h-4" />
                              {course.priceInCoins} CC
                            </span>
                          ) : (
                            <>
                              <span className="text-base font-black text-slate-900 dark:text-slate-50">
                                ${finalPrice}
                              </span>
                              {isDiscounted && (
                                <span className="block text-xs text-slate-400 line-through text-left">
                                  ${displayPrice}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Add to Cart */}
                        <form action={handleAddToCart} className="w-full">
                          <input type="hidden" name="courseId" value={course.id} />
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#2B4C7E] hover:bg-[#1c3459] text-white text-[11px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>أضف للسلة</span>
                          </button>
                        </form>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
