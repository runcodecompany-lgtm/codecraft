import React from "react"
import { Users, BookOpen, Map, Award, TrendingUp } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "١.٢ مليون+",
    label: "متعلم نشط",
    gradient: "from-cyan-500 to-blue-500",
    suffix: "متعلماً",
  },
  {
    icon: BookOpen,
    value: "٨٠٠+",
    label: "دورة تعليمية",
    gradient: "from-violet-500 to-purple-500",
    suffix: "دورة",
  },
  {
    icon: Map,
    value: "٤٨",
    label: "مسار تعليمي",
    gradient: "from-emerald-500 to-green-500",
    suffix: "مساراً",
  },
  {
    icon: Award,
    value: "١٢٠ ألف+",
    label: "شهادة مُنحت",
    gradient: "from-amber-500 to-orange-500",
    suffix: "شهادة",
  },
]

export default function StatisticsSection() {
  return (
    <section className="py-20 md:py-28 px-4 bg-slate-50/70 dark:bg-[#0a1020]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="group relative rounded-2xl md:rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-card p-6 md:p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

                <div className={`relative inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.5} />
                </div>

                <p className="text-3xl md:text-4xl font-black text-text-main tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-sm md:text-base font-bold text-text-muted">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
