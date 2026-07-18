// components/progress-bar.tsx
import React from "react"

interface ProgressBarProps {
  value: number // 0 to 100
  max?: number
  showLabel?: boolean
  label?: string
  colorClass?: string
  bgClass?: string
}

export default function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  label,
  colorClass = "bg-indigo-600 dark:bg-indigo-500",
  bgClass = "bg-gray-200 dark:bg-slate-800",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)))

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-slate-400">
          <span>{label}</span>
          <span className="font-extrabold">{percentage}%</span>
        </div>
      )}
      <div className={`h-2.5 w-full rounded-full ${bgClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
