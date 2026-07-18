// app/teachers/page.tsx
import React from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Users, GraduationCap, ArrowLeft, Star, BookOpen, UserCheck } from "lucide-react"

export const metadata = {
  title: "معلمو المنصة | Code Craft Core",
  description: "تعرف على معلمي وخبراء البرمجيات في منصة Code Craft Core وتعلّم من أفضل المحترفين.",
}

export const dynamic = "force-dynamic"

// Helper to get detailed statistics for each teacher dynamically
async function getTeacherStats(teacherId: string) {
  const courses = await prisma.course.findMany({
    where: { teacherId, isPublished: true },
    select: {
      id: true,
      modules: {
        select: {
          lessons: { select: { id: true } }
        }
      }
    }
  })

  const courseCount = courses.length
  const lessonIds = courses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id)))

  let studentCount = 0
  if (lessonIds.length > 0) {
    const studentAgg = await prisma.userProgress.groupBy({
      by: ["userId"],
      where: { lessonId: { in: lessonIds } }
    })
    studentCount = studentAgg.length
  }

  return { courseCount, studentCount }
}

export default async function TeachersPage() {
  const dbTeachers = await prisma.user.findMany({
    where: { role: "TEACHER", status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      avatar: true,
      email: true,
    },
    orderBy: { createdAt: "desc" }
  })

  // Build full teacher dataset with dynamic counts and static fallback bios
  const teachers = await Promise.all(
    dbTeachers.map(async (t) => {
      const stats = await getTeacherStats(t.id)
      
      // Fallback details for seeded and new teachers
      let bio = "معلم ومطوّر برمجيات متخصص في إعداد المناهج التقنية والتفاعلية."
      let title = "مطور ومحاضر تقني"
      let rating = "4.9"

      if (t.email === "teacher@codecraftcore.com") {
        bio = "أستاذ علوم الحاسب وخبير تطوير نظم الويب المتكاملة مع خبرة أكاديمية وعملية تفوق 12 عاماً في الخليج والشرق الأوسط."
        title = "دكتور علوم الحاسب وخبير الويب"
        rating = "5.0"
      }

      return {
        ...t,
        bio,
        title,
        rating,
        ...stats,
      }
    })
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      {/* Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Link>
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-6">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3">طاقم المعلمين والخبراء</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            تعلّم البرمجة على أيدي خبراء الصناعة وأكاديميين متميزين يرافقونك في رحلتك البرمجية خطوة بخطوة.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {teachers.length === 0 ? (
          <div className="text-center text-slate-500 py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-40" />
            <span>لا يوجد معلمون مسجلون حالياً.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 flex flex-col gap-6"
              >
                {/* Header Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-black text-xl text-white shadow-md flex-shrink-0">
                    {teacher.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={teacher.avatar} alt={teacher.name || ""} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      (teacher.name || "T").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{teacher.name}</h2>
                    <p className="text-xs font-bold text-indigo-400">{teacher.title}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{teacher.rating} تقييم المعلم</span>
                    </div>
                  </div>
                </div>

                {/* Brief bio */}
                <p className="text-slate-400 text-sm leading-relaxed flex-1">
                  {teacher.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/60 my-2">
                  <div className="text-center">
                    <div className="text-lg font-black text-white">{teacher.courseCount}</div>
                    <div className="text-xs text-slate-500 font-bold">دورات منشورة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-white">+{teacher.studentCount}</div>
                    <div className="text-xs text-slate-500 font-bold">طالب مسجل</div>
                  </div>
                </div>

                {/* Link */}
                <Link
                  href={`/teachers/${teacher.id}`}
                  className="w-full py-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-bold text-sm text-center transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تصفح الملف التعريفي والخبرات</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
