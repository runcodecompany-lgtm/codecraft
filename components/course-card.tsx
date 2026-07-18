// components/course-card.tsx
import React from "react"
import Link from "next/link"
import { BookOpen, Award, ArrowRight } from "lucide-react"
import ProgressBar from "./progress-bar"

interface CourseCardProps {
  id: string
  title: string
  description: string
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  completedLessons: number
  totalLessons: number
}

export default function CourseCard({
  id,
  title,
  description,
  difficulty,
  completedLessons,
  totalLessons,
}: CourseCardProps) {
  // Difficulty levels style mapping
  const difficultyColors = {
    BEGINNER: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    INTERMEDIATE: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    ADVANCED: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
  }

  const difficultyNames = {
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
  }

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300 group">
      {/* Visual Header / Gradient Accent */}
      <div className="h-2.5 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />

      <div className="p-5 flex-grow space-y-4">
        {/* Difficulty Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${difficultyColors[difficulty]}`}>
            {difficultyNames[difficulty]}
          </span>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-slate-500">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{totalLessons} درس</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Progress & Bottom Actions */}
      <div className="p-5 pt-0 border-t border-gray-100 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/40 space-y-4">
        <div className="pt-4">
          <ProgressBar
            value={completedLessons}
            max={totalLessons}
            label="التقدم المحرز"
            colorClass="bg-gradient-to-r from-indigo-600 to-violet-600"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
            <Award className="h-4 w-4 text-amber-500" />
            <span>
              {completedLessons === totalLessons ? "مكتمل!" : `${completedLessons}/${totalLessons} مكتمل`}
            </span>
          </div>

          <Link
            href={`/courses/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all group/btn"
          >
            <span>{completedLessons > 0 ? "متابعة" : "ابدأ التعلّم"}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-[-2px] transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
