// app/courses/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import {
  BookOpen, Clock, Code2, Coins, GraduationCap,
  Lock, ChevronLeft, Play, FileQuestion, Sparkles, Users, CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, description: true },
  })
  if (!course) return { title: 'الدورة غير موجودة' }
  return {
    title: `${course.title} — Code Craft Core`,
    description: course.description,
  }
}

import EnrollButton from '@/components/enroll-button'

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession()

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      teacher: { select: { id: true, name: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              progress: session
                ? { where: { userId: session.id }, select: { isCompleted: true } }
                : false,
            },
          },
          quizzes: { select: { id: true, title: true } },
        },
      },
    },
  })

  if (!course) notFound()

  // Verify enrollment
  const enrollment = session
    ? await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.id,
            courseId: course.id,
          },
        },
      })
    : null
  const isEnrolled = !!enrollment

  // Get user coins
  const dbUser = session
    ? await prisma.user.findUnique({
        where: { id: session.id },
        select: { craftCoins: true },
      })
    : null
  const userCoins = dbUser?.craftCoins ?? 0

  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0)
  const totalQuizzes = course.modules.reduce((a, m) => a + m.quizzes.length, 0)
  const completedLessons = session
    ? course.modules.reduce(
        (a, m) => a + m.lessons.filter((l) => l.progress?.[0]?.isCompleted).length,
        0
      )
    : 0
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة للرئيسية
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              دورة تعليمية
            </span>
            {course.price === 0 && course.priceInCoins === 0 ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">مجانية</span>
            ) : (
              <div className="flex gap-2">
                {course.price > 0 && (
                  <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                    ${course.price} USD
                  </span>
                )}
                {course.priceInCoins > 0 && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Coins className="w-3 h-3" />{course.priceInCoins} CC
                  </span>
                )}
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{course.title}</h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">{course.description}</p>

          <div className="flex flex-wrap gap-6 text-sm text-slate-400 mb-8">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              {totalLessons} درس
            </span>
            <span className="flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4 text-violet-400" />
              {totalQuizzes} اختبار
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              {course.teacher?.name ?? 'معلم'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              {course.modules.length} وحدة
            </span>
          </div>

          {/* Progress bar (if logged in & enrolled) */}
          {session && isEnrolled && totalLessons > 0 && (
            <div className="mb-8 max-w-md">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>تقدّمك في الدورة</span>
                <span className="font-bold text-white">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{completedLessons} من {totalLessons} درس مكتمل</p>
            </div>
          )}

          {/* Enrollment Button */}
          <div className="flex flex-wrap gap-3">
            <EnrollButton
              courseId={course.id}
              priceInCoins={course.priceInCoins}
              priceUsd={course.price}
              userCoins={userCoins}
              isEnrolled={isEnrolled}
              isAuthenticated={!!session}
            />
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-400" />
          محتوى الدورة
        </h2>

        {course.modules.length === 0 ? (
          <div className="text-center text-slate-500 py-16 border border-dashed border-slate-800 rounded-2xl">
            لا توجد وحدات بعد — ترقّب الإضافات قريباً!
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod, mi) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                {/* Module header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/30">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-black">
                    {mi + 1}
                  </div>
                  <h3 className="font-bold text-white">{mod.title}</h3>
                  <span className="mr-auto text-xs text-slate-500">
                    {mod.lessons.length} درس{mod.quizzes.length > 0 ? ` · ${mod.quizzes.length} اختبار` : ''}
                  </span>
                </div>

                {/* Lessons */}
                <ul className="divide-y divide-slate-800/60">
                  {mod.lessons.map((lesson, li) => {
                    const done = lesson.progress?.[0]?.isCompleted
                    return (
                      <li key={lesson.id}>
                        {session && isEnrolled ? (
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                          >
                            <span className="flex-shrink-0">
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Play className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                              )}
                            </span>
                            <span className={`text-sm flex-1 ${done ? 'text-emerald-400 line-through decoration-emerald-600' : 'text-slate-300'}`}>
                              {li + 1}. {lesson.title}
                            </span>
                            {lesson.duration > 0 && (
                              <span className="flex items-center gap-1 text-xs text-slate-600">
                                <Clock className="w-3.5 h-3.5" />
                                {lesson.duration} د
                              </span>
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                            <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{li + 1}. {lesson.title}</span>
                          </div>
                        )}
                      </li>
                    )
                  })}

                  {/* Quizzes */}
                  {mod.quizzes.map((quiz) => (
                    <li key={quiz.id}>
                      {session && isEnrolled ? (
                        <Link
                          href={`/quizzes/${quiz.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                        >
                          <FileQuestion className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors flex-shrink-0" />
                          <span className="text-sm text-slate-300 flex-1">{quiz.title}</span>
                          <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">اختبار</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                          <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{quiz.title}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
