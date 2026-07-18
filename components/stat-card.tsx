// components/stat-card.tsx
import React from "react"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColorClass?: string
  gradientClass?: string
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColorClass = "text-indigo-600 dark:text-indigo-400",
  gradientClass = "from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5",
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
      {/* Decorative Glow */}
      <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradientClass} opacity-70 blur-xl group-hover:scale-125 transition-transform`} />

      <div className="flex items-center justify-between">
        <div className="space-y-2 relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            {title}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 group-hover:rotate-6 transition-all">
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
      </div>
    </div>
  )
}
