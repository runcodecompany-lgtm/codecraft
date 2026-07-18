import React from "react"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import QuizEditClient from "./quiz-edit-client"

interface Props {
  params: Promise<{ id: string; quizId: string }>
}

export const dynamic = "force-dynamic"

export default async function QuizDetailPage({ params }: Props) {
  const { id, quizId } = await params
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { createdAt: "asc" }
      },
      module: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              teacherId: true
            }
          }
        }
      }
    }
  })

  if (!quiz) notFound()

  const teacherId = quiz.module?.course.teacherId || ""
  if (teacherId !== session.id && session.role !== "ADMIN") {
    redirect("/dashboard/teacher/courses?unauthorized=true")
  }

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Link href="/dashboard/teacher/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          إدارة الدورات
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/teacher/courses/${id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          {quiz.module?.course.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          منشئ الأسئلة للاختبار: {quiz.title}
        </span>
      </div>

      {/* Quiz edit workspace */}
      <QuizEditClient quiz={quiz} courseId={id} />
      
    </div>
  )
}
