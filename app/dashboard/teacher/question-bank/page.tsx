import React from "react"
import { getQuestionBank } from "@/actions/teacher-quiz"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HelpCircle } from "lucide-react"
import QuestionBankClient from "./question-bank-client"

export const dynamic = "force-dynamic"

export default async function TeacherQuestionBankPage() {
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch teacher's saved questions
  const res = await getQuestionBank()
  const questions = res.success && res.questions ? res.questions : []
  const normalizedQuestions = questions.map((q) => {
    const raw = q.options as unknown
    let options: string[] = []

    if (Array.isArray(raw)) {
      options = raw.filter((v): v is string => typeof v === "string")
    } else if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          options = parsed.filter((v): v is string => typeof v === "string")
        } else if (raw.trim()) {
          options = [raw]
        }
      } catch {
        if (raw.trim()) options = [raw]
      }
    }

    return { ...q, options }
  })

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Title */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-indigo-500" />
          <span>مستودع بنك الأسئلة</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">احفظ أسئلتك المفضلة هنا لإعادة استخدامها وصياغتها لاحقاً في أي من اختبارات دوراتك.</p>
      </div>

      {/* Bank Client UI */}
      <QuestionBankClient initialQuestions={normalizedQuestions} />

    </div>
  )
}
