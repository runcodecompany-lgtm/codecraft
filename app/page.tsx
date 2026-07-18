import React, { Suspense } from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import Leaderboard from "@/components/leaderboard"
import HeroSection from "@/components/HeroSection"
import LearningTracks from "@/components/LearningTracks"
import {
  GraduationCap,
  Code2,
  Trophy,
  Zap,
  BookOpen,
  Users,
  Star,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Coins,
  Award,
  Target,
  Quote,
  Clock,
  Briefcase,
  ChevronLeft,
  CheckCircle,
} from "lucide-react"

export const metadata = {
  title: "Code Craft Core — منصة تعلّم تفاعلية ذكية للبرمجة والعلوم",
  description:
    "تعلّم البرمجة والعلوم بطريقة ممتعة وتفاعلية. اختر مسارك، اكسب نقاط الخبرة، وانضم لمجتمع المتعلمين العرب.",
}

const testimonials = [
  {
    name: "أحمد الشمري",
    role: "مهندس برمجيات",
    avatar: "أ",
    rating: 5,
    text: "منصة رائعة غيّرت مسيرتي المهنية بالكامل. المحتوى عالي الجودة وأسلوب التعلم التفاعلي يجعلك تتعلم أسرع وبمتعة حقيقية.",
  },
  {
    name: "نور الفران",
    role: "طالبة هندسة",
    avatar: "ن",
    rating: 5,
    text: "أفضل منصة عربية تعليمية. المعلمون محترفون، المحتوى منظّم، ونظام النقاط يحفّزني على الاستمرار كل يوم.",
  },
  {
    name: "نايف الفران",
    role: "مطوّر ويب",
    avatar: "ن",
    rating: 5,
    text: 'شعار "تعلّم وتنافس وابتكر" ليس مجرد شعار، بل هو تجربة حقيقية. وصلت لمستوى احترافي في البرمجة خلال ٦ أشهر فقط.',
  },
]

const steps = [
  { step: "١", icon: GraduationCap, title: "أنشئ حسابك مجاناً", desc: "سجّل بريدك الإلكتروني في ثوانٍ وانطلق في رحلة التعلم." },
  { step: "٢", icon: Target,        title: "اختر مسارك التعليمي", desc: "حدّد مجالك المفضل وسنوجّهك للمسار الأمثل لك." },
  { step: "٣", icon: Zap,           title: "أتمّ الدروس واكسب النقاط", desc: "كل درس تُكمله يمنحك عملات Craft Coins ونقاط خبرة." },
  { step: "٤", icon: Award,         title: "احصل على شهادتك", desc: "أكمل المسار واحصل على شهادة معتمدة تُعزز سيرتك الذاتية." },
]

async function getLatestCourses() {
  try {
    return await prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        priceInCoins: true,
        coverImage: true,
        teacher: { select: { name: true } },
        modules: { select: { lessons: { select: { id: true } } } },
      },
    })
  } catch { return [] }
}

async function getLatestArticles() {
  try {
    return await prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    })
  } catch { return [] }
}

export default async function HomePage() {
  const [courses, articles] = await Promise.all([getLatestCourses(), getLatestArticles()])

  return (
    <main className="min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 overflow-x-hidden" dir="rtl">

      {/* Hero Section */}
      <HeroSection />

      {/* Udemy-Style Trusted Partner Logos */}
      <section className="py-8 bg-white dark:bg-[#141C2F] border-y border-slate-200 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            تثق بنا كبرى الشركات والجامعات لتدريب موظفيها وطلابها
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 dark:opacity-40 grayscale">
            {["Apple", "Volkswagen", "Box", "Netflix", "NetApp", "Eventbrite"].map((partner) => (
              <span key={partner} className="text-base md:text-lg font-black tracking-widest text-slate-650 dark:text-white uppercase select-none">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Broad Selection of Courses (Udemy style course showcase) */}
      <section className="py-16 md:py-24 px-4 bg-white dark:bg-[#0a0f1d]">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-right mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B4C7E]/20 bg-[#2B4C7E]/6 px-4 py-1.5 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مجموعة واسعة من الخيارات التعليمية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              الدورات الأكثر تميزاً وجدوى
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
              اختر من بين مئات الدروس التعليمية والمقاطع المسجلة بأساليب مبتكرة لتطوير مهاراتك اليوم.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center text-slate-500 py-16 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-[#141C2F]">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm">لا توجد دورات منشورة حالياً. ترقبوا المزيد قريباً!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => {
                const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
                // Random rating simulating professional courses
                const simulatedRating = (4.7 + (i % 3) * 0.1).toFixed(1)
                const simulatedReviews = (120 + i * 45).toLocaleString("ar-EG")
                
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Cover image container */}
                    <div className="h-44 bg-slate-100 dark:bg-slate-850 relative overflow-hidden shrink-0">
                      {course.coverImage ? (
                        <img
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#2B4C7E]/5 to-[#4A7C59]/5">
                          <Code2 className="w-12 h-12 text-[#2B4C7E]/20" />
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {course.priceInCoins === 0 ? (
                          <span className="inline-flex items-center text-[10px] font-bold bg-[#4A7C59] text-white px-2.5 py-1 rounded-full shadow-md">
                            مجاناً
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#2B4C7E] text-white px-2.5 py-1 rounded-full shadow-md">
                            <Coins className="w-3 h-3" /> {course.priceInCoins} CC
                          </span>
                        )}
                      </div>

                      {/* Best Seller / Tag Badge */}
                      {i === 0 && (
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="inline-flex items-center text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded shadow-sm uppercase">
                            الأكثر مبيعاً
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Course details */}
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-[#2B4C7E] dark:group-hover:text-[#7FA8D4] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        المدرب: {course.teacher?.name ?? "معلم متميز"}
                      </p>

                      {/* Ratings stars row */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{simulatedRating}</span>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${
                                idx < Math.round(parseFloat(simulatedRating)) ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-400">({simulatedReviews})</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          {totalLessons} درس
                        </span>
                        <span className="flex items-center gap-1 text-[#2B4C7E] dark:text-[#7FA8D4] font-semibold group-hover:translate-x-1 transition-transform">
                          عرض التفاصيل <ArrowLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/courses/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-850 bg-white/80 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-sm font-bold transition-all duration-200"
            >
              عرض جميع الدورات المتاحة
            </Link>
          </div>

        </div>
      </section>

      {/* Learning Tracks */}
      <LearningTracks />

      {/* Udemy-Style Become Instructor / Become Student Banners */}
      <section className="py-16 md:py-24 px-4 bg-white dark:bg-[#0a0f1d]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Box A: Become Teacher */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#141C2F]">
              <div className="h-16 w-16 rounded-2xl bg-[#2B4C7E]/10 dark:bg-[#2B4C7E]/20 flex items-center justify-center text-[#2B4C7E] dark:text-[#7FA8D4] shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-3 flex-1 text-center md:text-right">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">كن معلماً معنا</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  هل تمتلك الخبرة والمعرفة وتريد مشاركتها؟ انضم لنخبة من المعلمين وصانعي المحتوى العرب وحقّق دخلاً إضافياً.
                </p>
                <Link
                  href="/register?role=teacher"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#2B4C7E] hover:bg-[#1c3459] text-white text-xs font-bold transition-all"
                >
                  <span>سجل كمعلم الآن</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Box B: Corporate Training */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#141C2F]">
              <div className="h-16 w-16 rounded-2xl bg-[#4A7C59]/10 dark:bg-[#4A7C59]/20 flex items-center justify-center text-[#4A7C59] dark:text-[#6AAD7A] shrink-0">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="space-y-3 flex-1 text-center md:text-right">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Code Craft للأعمال</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  ارتقِ بمهارات فريق عملك وساعدهم على التفوق. اشتراكات مرنة ومخصصة للمؤسسات والشركات الناشئة مع لوحة تحكم إدارية.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[#4A7C59] text-[#4A7C59] hover:bg-[#4A7C59]/5 text-xs font-bold transition-all"
                >
                  <span>تواصل معنا للأعمال</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Best Experts (Teachers Showcase) */}
      <section className="py-16 md:py-24 px-4 bg-[#F5F7FA] dark:bg-[#0a0f1d] border-t border-slate-200 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4A7C59]/25 bg-[#4A7C59]/8 px-4 py-1.5 text-xs font-bold text-[#4A7C59]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>معلمون متميزون</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              تعلّم من أفضل الخبراء
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              نخبة من أمهر المعلمين والخبراء في مجالات التقنية والعلوم، يشاركونك معرفتهم وخبراتهم العملية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "د. أحمد الشمري", role: "خوارزميات وهياكل بيانات", avatar: "أ", bg: "from-[#2B4C7E] to-[#1c3459]", rating: 4.9, students: "٢٨٬٤٠٠+", courses: "١٢", bio: "دكتوراه في علوم الحاسوب، خبرة ١٥ سنة في تدريس البرمجة في أعرق الجامعات." },
              { name: "م. سارة السالم", role: "ذكاء اصطناعي وتعلم آلة", avatar: "س", bg: "from-[#4A7C59] to-[#2B4C7E]", rating: 4.8, students: "٢١٬٧٠٠+", courses: "٩", bio: "مهندسة ذكاء اصطناعي في إحدى كبرى شركات التقنية، شغوفة بنقل الخبرة للعرب." },
              { name: "م. عبدالله الحربي", role: "أمن سيبراني واختراق أخلاقي", avatar: "ع", bg: "from-[#2B4C7E] to-[#4A7C59]", rating: 4.9, students: "١٩٬٢٠٠+", courses: "٨", bio: "خبير أمن سيبراني معتمد (CISSP, CEH)، مؤسس فريق قرصنة أخلاقية عربي." },
              { name: "أ. ليلى المحيميد", role: "تطوير ويب وتطبيقات", avatar: "ل", bg: "from-[#4A7C59] to-[#1c3459]", rating: 4.7, students: "١٥٬٨٠٠+", courses: "١١", bio: "مطوّرة ويب محترفة، أسست مجتمع نسوي عربي للبرمجة درّبت مئات المبتدئات." },
            ].map((teacher, i) => (
              <div
                key={teacher.name}
                className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${teacher.bg} flex items-center justify-center text-white font-black text-lg shrink-0`}>
                    {teacher.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">{teacher.name}</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate">{teacher.role}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-2">{teacher.bio}</p>
                <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                  <span className="flex items-center gap-1 text-slate-400"><Users className="w-3.5 h-3.5 text-[#2B4C7E]" />{teacher.students}</span>
                  <span className="flex items-center gap-1 text-slate-400"><BookOpen className="w-3.5 h-3.5 text-[#4A7C59]" />{teacher.courses} دورة</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-3.5 h-3.5 fill-amber-500" />{teacher.rating}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-850 bg-white/80 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-sm font-bold transition-all duration-200"
            >
              عرض جميع المعلمين
            </Link>
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section className="py-16 md:py-24 px-4 bg-white dark:bg-[#0a0f1d]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B4C7E]/25 bg-[#2B4C7E]/8 px-4 py-1.5 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>كيف تبدأ؟</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              أربع خطوات للنجاح والاحتراف
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">البداية أسهل مما تتخيل</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={item.step}
                  className="group flex items-start gap-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#141C2F] hover:border-[#2B4C7E]/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-sm font-black text-white shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.title}</h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#4A7C59] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Leaderboard & Latest Tech Articles */}
      <section className="py-16 md:py-24 px-4 bg-[#F5F7FA] dark:bg-[#0a0f1d] border-t border-slate-200 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Leaderboard column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#4A7C59] to-[#2B4C7E] flex items-center justify-center shadow-md">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">لوحة الشرف</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">أفضل المتعلمين هذا الأسبوع</p>
                </div>
              </div>
              <Suspense fallback={
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] h-64 animate-pulse" />
              }>
                <Leaderboard />
              </Suspense>
            </div>

            {/* Tech Articles column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2B4C7E] to-[#1c3459] flex items-center justify-center shadow-md">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">المقالات التقنية</h2>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">أحدث مقالات مجتمعنا</p>
                  </div>
                </div>
                <Link href="/articles" className="text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] hover:underline flex items-center gap-1">
                  تصفّح الكل <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="text-center text-slate-500 py-16 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#141C2F]">
                  لا توجد مقالات منشورة بعد.
                </div>
              ) : (
                <ul className="space-y-4">
                  {articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="group flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-5 hover:border-[#2B4C7E]/45 transition-all duration-300"
                      >
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-[#2B4C7E] dark:group-hover:text-[#7FA8D4] transition-colors">{article.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">{article.content.replace(/[#*`_]/g, "").slice(0, 120)}...</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#2B4C7E]" />{article.author?.name ?? "كاتب مجهول"}</span>
                          <span className="w-px h-3 bg-slate-200 dark:bg-slate-850" />
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#4A7C59]" />{new Date(article.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 bg-white dark:bg-[#0a0f1d]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4A7C59]/25 bg-[#4A7C59]/8 px-4 py-1.5 text-xs font-bold text-[#4A7C59] mb-4">
              <Star className="w-3.5 h-3.5" />
              <span>آراء المتعلمين</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              ماذا يقول متعلمونا؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-[#141C2F] p-7 hover:shadow-md transition-all flex flex-col"
              >
                <Quote className="h-6 w-6 text-[#2B4C7E]/20 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 flex-1">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-white font-black text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-50 text-xs">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                  <div className="mr-auto flex gap-0.5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 md:py-24 px-4 bg-[#F5F7FA] dark:bg-[#0a0f1d]">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-[2rem] p-10 md:p-14 text-center overflow-hidden bg-gradient-to-tr from-[#1c3459] via-[#2B4C7E] to-[#141C2F] border border-[#2B4C7E]/30">
            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#4A7C59]/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-[#2B4C7E]/10 rounded-full blur-[70px]" />
            
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white mb-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>انضم اليوم مجاناً</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight max-w-2xl mx-auto">
                جاهز لتبدأ مسيرتك التعليمية وتصنع مستقبلك اليوم؟
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                سجّل حسابك الآن مجاناً وابدأ رحلتك في عالم المعرفة. أكثر من ١٫٢ مليون متعلم يثقون بنا.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 px-8 py-4 text-sm font-black text-[#2B4C7E] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <GraduationCap className="w-5 h-5" />
                  <span>ابدأ رحلتك مجاناً</span>
                </Link>
                <Link href="/courses/marketplace" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/15 px-8 py-4 text-sm font-bold text-white transition-all">
                  <BookOpen className="w-4 h-4" />
                  <span>استكشف الدورات</span>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 flex-wrap">
                {[
                  { icon: "🔒", text: "بدون بطاقة ائتمان" },
                  { icon: "⚡", text: "تفعيل فوري" },
                  { icon: "🎓", text: "شهادات معتمدة" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-white/70 text-xs font-semibold">
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
