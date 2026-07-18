// app/dashboard/teacher/ai-tools/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import TeacherAIToolsClient from './tools-client'

export const dynamic = 'force-dynamic'

export default async function TeacherAIToolsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)
  if (!isTeacherOrAdmin) {
    redirect('/dashboard')
  }

  // Fetch teacher's courses and their reviews
  const courses = await prisma.course.findMany({
    where: {
      teacherId: session.id,
    },
    select: {
      id: true,
      title: true,
      reviews: {
        select: {
          comment: true,
          rating: true,
        },
      },
    },
  })

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            أدوات المعلم المدعومة بالذكاء الاصطناعي
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            صممنا هذه الأدوات الذكية لمساعدتك في التخطيط للمناهج الدراسية، تحسين محتوى دوراتك، وتحليل ملاحظات الطلاب بذكاء.
          </p>
        </div>

        <TeacherAIToolsClient initialCourses={courses} />
      </div>
    </main>
  )
}
