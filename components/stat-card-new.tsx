// components/stat-card-new.tsx
"use client"

import React from "react"
import {
  BookOpen, Trophy, Award, Brain, Gamepad2, Coins, Target,
  Sparkles, Zap, Flame, Medal, Star
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  BookOpen, Trophy, Award, Brain, Gamepad2, Coins, Target,
  Sparkles, Zap, Flame, Medal, Star,
}

interface StatCardNewProps {
  title: string
  value: number
  desc: string
  iconName: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color: string
  bgColor: string
  delay?: number
}

export default function StatCardNew({
  title,
  value,
  desc,
  iconName,
  trend,
  trendValue,
  color,
  bgColor,
  delay = 0,
}: StatCardNewProps) {
  const Icon = iconMap[iconName] || BookOpen

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms`, borderRadius: "var(--ccc-radius-xl)", background: "#fff", border: "1px solid var(--ccn-200)", boxShadow: "var(--ccc-shadow-sm)", padding: "var(--ccc-space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ccc-space-md)" }}>
        <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>{title}</div>
        <div style={{ width: 40, height: 40, borderRadius: "var(--ccc-radius-lg)", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", color, border: "1px solid color-mix(in srgb, " + color + " 15%, transparent)" }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div style={{ font: "var(--ccc-display)", fontWeight: 900, color: "var(--ccn-900)", lineHeight: 1, marginBottom: 4 }}>
        {value.toLocaleString("ar")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
        <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>{desc}</div>
        {trend && (
          <span style={{ font: "var(--ccc-micro)", fontWeight: 700, padding: "1px 8px", borderRadius: "var(--ccc-radius-full)", background: trend === "up" ? "color-mix(in srgb, var(--ccg-500) 10%, transparent)" : trend === "down" ? "color-mix(in srgb, var(--ccr-500) 10%, transparent)" : "color-mix(in srgb, var(--ccn-900) 5%, transparent)", color: trend === "up" ? "var(--ccg-500)" : trend === "down" ? "var(--ccr-500)" : "var(--ccn-500)" }}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue || ""}
          </span>
        )}
      </div>
    </div>
  )
}
