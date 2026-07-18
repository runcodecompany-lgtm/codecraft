// app/dashboard/teacher/ai-analytics/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import TeacherAIAnalyticsClient from './analytics-client'

export const dynamic = 'force-dynamic'

export default async function TeacherAIAnalyticsPage() {
  const session = await getServerSession()

  if (!session) redirect('/login')

  const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)
  if (!isTeacherOrAdmin) redirect('/dashboard')

  // Fetch teacher's courses with student enrollments & reviews
  const courses = await prisma.course.findMany({
    where: { teacherId: session.id },
    select: {
      id: true,
      title: true,
      _count: { select: { enrollments: true } },
      reviews: { select: { rating: true, comment: true, createdAt: true } },
      enrollments: {
        select: {
          user: { select: { name: true, email: true } },
          createdAt: true,
          progress: true,
          isCompleted: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalStudents = courses.reduce((acc, c) => acc + c._count.enrollments, 0)
  const totalReviews = courses.reduce((acc, c) => acc + c.reviews.length, 0)
  const avgRating = totalReviews > 0
    ? courses.reduce((acc, c) => acc + c.reviews.reduce((s, r) => s + r.rating, 0), 0) / totalReviews
    : 0

  const stats = {
    totalCourses: courses.length,
    totalStudents,
    totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
  }

  // Normalize for client (rename user → student shape)
  const normalizedCourses = courses.map(c => ({
    ...c,
    enrollments: c.enrollments.map(e => ({
      student: e.user,
      createdAt: e.createdAt,
      completedLessons: e.isCompleted ? ['done'] : [],
      progress: e.progress,
    })),
  }))

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            تحليل الطلاب بالذكاء الاصطناعي
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            احصل على تحليل ذكي شامل لأداء طلابك، مستوى تفاعلهم، ونقاط القوة والضعف في دوراتك.
          </p>
        </div>

        <TeacherAIAnalyticsClient courses={normalizedCourses as any} stats={stats} />
      </div>
    </main>
  )
}
