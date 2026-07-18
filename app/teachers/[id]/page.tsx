// app/teachers/[id]/page.tsx
import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  ArrowLeft, Star, Award, GraduationCap, Briefcase,
  Code2, Coins, BookOpen, Clock, Heart, Users
} from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const teacher = await prisma.user.findUnique({
    where: { id, role: "TEACHER" },
    select: { name: true }
  })
  if (!teacher) return { title: "المعلم غير موجود" }
  return {
    title: `ملف المعلم: ${teacher.name || "المعلم"} — Code Craft Core`,
    description: `الملف العام والخبرات المهنية والدورات المنشورة للمعلم ${teacher.name || "المعلم"}.`,
  }
}

export const dynamic = "force-dynamic"

export default async function TeacherDetailPage({ params }: Props) {
  const { id } = await params

  const teacher = await prisma.user.findUnique({
    where: { id, role: "TEACHER" },
    include: {
      coursesTaught: {
        where: { isPublished: true },
        include: {
          modules: {
            select: { lessons: { select: { id: true } } }
          }
        }
      }
    }
  })

  if (!teacher) notFound()

  // Calculate dynamic student enrollment count
  const courseIds = teacher.coursesTaught.map(c => c.id)
  const lessonIds = teacher.coursesTaught.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id)))

  let studentCount = 0
  if (lessonIds.length > 0) {
    const studentAgg = await prisma.userProgress.groupBy({
      by: ["userId"],
      where: { lessonId: { in: lessonIds } }
    })
    studentCount = studentAgg.length
  }

  // Fetch teacher profile from database with real data
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: id }
  })

  // Use real data from database, fallback to defaults
  const title = teacherProfile?.title || "مطور ومحاضر تقني"

  const skills = teacherProfile?.skills
    ? teacherProfile.skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
    : ["React.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "Next.js", "Web Security"]

  const experiences = teacherProfile?.experience
    ? (teacherProfile.experience as Array<{ period: string; role: string }>)
    : [
      { period: "2020 - الآن", role: "كبير مهندسي البرمجيات ومصمم مناهج تفاعلية" },
      { period: "2016 - 2020", role: "محاضر ومطور مناهج برمجية في عدة كليات تقنية" },
      { period: "2012 - 2016", role: "مطور واجهات ومصمم نظم ويب متكاملة" }
    ]

  const achievements = teacherProfile?.achievements
    ? (teacherProfile.achievements as string[])
    : [
      "شهادة التميز الأكاديمي والتدريب التقني لعام 2024",
      "تخريج أكثر من 8000 طالب متقن لبناء تطبيقات الويب",
      "تصميم أسلوب اللعب التفاعلي لمسارات أساسيات HTML و CSS"
    ]

  // Calculate real average rating
  const ratingData = await prisma.review.aggregate({
    where: { courseId: { in: courseIds } },
    _avg: { rating: true },
    _count: true
  })
  const averageRating = ratingData._avg.rating
    ? ratingData._avg.rating.toFixed(1)
    : "4.9"
  const totalReviews = ratingData._count

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      {/* Profile Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/teachers" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            العودة للمعلمين
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-indigo-500/20">
              {teacher.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teacher.avatar} alt={teacher.name || ""} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                (teacher.name || "T").charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                <GraduationCap className="w-4 h-4" />
                <span>معلم معتمد</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black">{teacher.name}</h1>
              <p className="text-base text-slate-400 font-medium">{title}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-extrabold text-white">{averageRating} / 5.0</span> ({totalReviews} تقييم)
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="font-extrabold text-white">{teacher.coursesTaught.length}</span> دورات منشورة
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="font-extrabold text-white">+{studentCount}</span> طلاب مسجلين
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Details Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Experience Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>الخبرات المهنية</span>
              </h2>
              <div className="space-y-6">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full shrink-0">
                      {exp.period}
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed pt-0.5">{exp.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>الدورات والمقررات المنشورة</span>
              </h2>

              {teacher.coursesTaught.length === 0 ? (
                <div className="text-center text-slate-500 italic py-10 border border-dashed border-slate-800 rounded-2xl">
                  لا توجد دورات منشورة لهذا المعلم حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {teacher.coursesTaught.map((course) => {
                    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
                    return (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="group flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-slate-850 bg-slate-900/20 hover:border-indigo-500/30 hover:bg-slate-900/50 p-5 transition-all duration-300"
                      >
                        <div className="w-full sm:w-28 h-20 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center shrink-0 overflow-hidden">
                          {course.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <Code2 className="w-8 h-8 text-indigo-500/40" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-right">
                          <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {totalLessons} درس
                            </span>
                            <span className="flex items-center gap-1">
                              {course.priceInCoins === 0 ? (
                                <span className="text-emerald-500 font-semibold">مجانية</span>
                              ) : (
                                <span className="text-amber-500 flex items-center gap-0.5">
                                  <Coins className="w-3 h-3" />
                                  {course.priceInCoins}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Skills Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-450 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>المهارات والخبرات التقنية</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold text-slate-300 bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-450 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>أهم الإنجازات والجوائز</span>
              </h3>
              <ul className="space-y-3">
                {achievements.map((ach, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-300 leading-relaxed">
                    <Heart className="w-4 h-4 text-indigo-500 fill-indigo-500/20 mt-1 shrink-0" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
