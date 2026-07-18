// app/quizzes/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import AdaptiveQuiz from '@/components/adaptive-quiz'
import Link from 'next/link'
import { ChevronLeft, FileQuestion, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { title: true },
  })
  if (!quiz) return { title: 'الاختبار غير موجود' }
  return { title: `${quiz.title} — Code Craft Core` }
}

export default async function QuizDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: { select: { id: true } },
      module: {
        select: {
          title: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
      lesson: { select: { title: true } },
    },
  })

  if (!quiz) notFound()

  // Verify enrollment if course exists
  if (quiz.module?.course) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId: quiz.module.course.id,
        },
      },
    })

    if (!enrollment) {
      redirect(`/courses/${quiz.module.course.slug}`)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {quiz.module?.course ? (
            <Link
              href={`/courses/${quiz.module.course.slug}`}
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              {quiz.module.course.title}
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              الرئيسية
            </Link>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{quiz.title}</h1>
              {quiz.module && (
                <p className="text-sm text-slate-400">{quiz.module.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
              {quiz.questions.length} سؤال
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              اكسب عملات كرافت
            </span>
          </div>
        </div>
      </div>

      {/* Quiz Engine */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <AdaptiveQuiz quizId={quiz.id} />
      </div>
    </main>
  )
}
