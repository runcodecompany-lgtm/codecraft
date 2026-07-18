// app/lessons/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import MarkLessonComplete from '@/components/mark-lesson-complete'
import VideoPlayer from '@/components/video-player'
import {
  ChevronLeft, Play, BookOpen, Clock, CheckCircle2, FileQuestion,
} from 'lucide-react'
import LessonAIHelper from '@/components/lesson-ai-helper'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { title: true },
  })
  if (!lesson) return { title: 'الدرس غير موجود' }
  return { title: `${lesson.title} — Code Craft Core` }
}

export default async function LessonDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          course: { select: { id: true, title: true, slug: true } },
          lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
          quizzes: { select: { id: true, title: true } },
        },
      },
      progress: {
        where: { userId: session.id },
        select: { isCompleted: true, lastWatchedSeconds: true },
      },
    },
  })

  if (!lesson) notFound()

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: lesson.module.course.id,
      },
    },
  })

  if (!enrollment) {
    redirect(`/courses/${lesson.module.course.slug}`)
  }

  const isCompleted = lesson.progress?.[0]?.isCompleted ?? false
  const currentIndex = lesson.module.lessons.findIndex((l) => l.id === id)
  const prevLesson = currentIndex > 0 ? lesson.module.lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lesson.module.lessons.length - 1
    ? lesson.module.lessons[currentIndex + 1]
    : null

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Top nav */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link
            href={`/courses/${lesson.module.course.slug}`}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span className="hidden sm:inline">{lesson.module.course.title}</span>
            <span className="sm:hidden">الدورة</span>
          </Link>
          <ChevronLeft className="w-4 h-4 text-slate-700" />
          <span className="text-sm text-slate-300 truncate max-w-xs">{lesson.title}</span>

          {isCompleted && (
            <span className="mr-auto flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مكتمل
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main lesson content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lesson.module.title}</span>
                {lesson.duration > 0 && (
                  <>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.duration} دقيقة</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black">{lesson.title}</h1>
            </div>

            {/* Video player */}
            {lesson.videoUrl && (
              <VideoPlayer
                lessonId={lesson.id}
                videoUrl={lesson.videoUrl}
                initialWatchedSeconds={lesson.progress?.[0]?.lastWatchedSeconds ?? 0}
              />
            )}

            {/* No video placeholder */}
            {!lesson.videoUrl && lesson.type !== "TEXT" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">لا يوجد فيديو لهذا الدرس</p>
                </div>
              </div>
            )}

            {/* Lesson content / notes */}
            {lesson.content && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  ملاحظات الدرس
                </h2>
                <div
                  className="text-slate-300 text-sm leading-relaxed"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {lesson.content}
                </div>
              </div>
            )}

            {/* Mark complete / navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              {prevLesson ? (
                <Link
                  href={`/lessons/${prevLesson.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  الدرس السابق
                </Link>
              ) : (
                <div />
              )}

              <MarkLessonComplete
                lessonId={lesson.id}
                isCompleted={isCompleted}
                courseSlug={lesson.module.course.slug}
              />

              {nextLesson ? (
                <Link
                  href={`/lessons/${nextLesson.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                >
                  الدرس التالي
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/courses/${lesson.module.course.slug}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  العودة للدورة
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar — module curriculum */}
          <aside className="space-y-4 lg:sticky lg:top-20 h-fit">
            <LessonAIHelper
              lessonId={lesson.id}
              courseId={lesson.module.course.id}
              lessonTitle={lesson.title}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40">
                <h3 className="font-bold text-sm">{lesson.module.title}</h3>
              </div>
              <ul className="divide-y divide-slate-800/60 max-h-[40vh] overflow-y-auto">
                {lesson.module.lessons.map((l, i) => (
                  <li key={l.id}>
                    <Link
                      href={`/lessons/${l.id}`}
                      className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                        l.id === id
                          ? 'bg-indigo-600/20 text-indigo-300'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate">{l.title}</span>
                    </Link>
                  </li>
                ))}
                {lesson.module.quizzes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/quizzes/${q.id}`}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-violet-400 hover:bg-slate-800/40 transition-colors"
                    >
                      <FileQuestion className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{q.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
