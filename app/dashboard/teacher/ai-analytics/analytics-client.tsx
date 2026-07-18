// app/dashboard/teacher/ai-analytics/analytics-client.tsx
'use client'

import React, { useState } from 'react'
import {
  Brain,
  Loader2,
  Sparkles,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
} from 'lucide-react'

interface CourseData {
  id: string
  title: string
  _count: { enrollments: number }
  reviews: { rating: number; comment: string; createdAt: string }[]
  enrollments: {
    student: { name: string; email: string }
    createdAt: string
    completedLessons: string[]
  }[]
}

interface Stats {
  totalCourses: number
  totalStudents: number
  totalReviews: number
  avgRating: number
}

interface AnalysisResult {
  overallInsight: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  studentEngagement: string
  riskStudents: string
  successFactors: string[]
}

export default function TeacherAIAnalyticsClient({
  courses,
  stats,
}: {
  courses: CourseData[]
  stats: Stats
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    const targetCourses =
      selectedCourseId === 'ALL' ? courses : courses.filter(c => c.id === selectedCourseId)

    const payload = {
      action: 'ANALYZE_TEACHER_PERFORMANCE',
      payload: {
        courses: targetCourses.map(c => ({
          title: c.title,
          studentCount: c._count.enrollments,
          avgRating:
            c.reviews.length > 0
              ? Math.round((c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length) * 10) / 10
              : null,
          recentReviews: c.reviews.slice(0, 5).map(r => r.comment),
          recentStudents: c.enrollments.slice(0, 5).map(e => ({
            name: e.student.name,
            lessonsCompleted: e.completedLessons.length,
          })),
        })),
        stats,
      },
    }

    try {
      const res = await fetch('/api/ai/teacher-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل التحليل')
      }
      const data = await res.json()
      setAnalysis(data)
    } catch (err: any) {
      setError(err.message || 'تعذر الاتصال بالخادم')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الدورات', value: stats.totalCourses, icon: BookOpen, color: 'indigo' },
          { label: 'إجمالي الطلاب', value: stats.totalStudents, icon: Users, color: 'violet' },
          { label: 'عدد التقييمات', value: stats.totalReviews, icon: Star, color: 'amber' },
          { label: 'متوسط التقييم', value: stats.avgRating > 0 ? `${stats.avgRating} / 5` : 'لا يوجد', icon: TrendingUp, color: 'emerald' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          const colorMap: Record<string, string> = {
            indigo: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/40',
            violet: 'text-violet-400 bg-violet-950/40 border-violet-900/40',
            amber: 'text-amber-400 bg-amber-950/40 border-amber-900/40',
            emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40',
          }
          return (
            <div key={idx} className={`rounded-2xl border p-5 ${colorMap[stat.color]}`}>
              <Icon className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(course => {
          const avg = course.reviews.length > 0
            ? (course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length).toFixed(1)
            : null
          return (
            <div key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-200 leading-tight">{course.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {course._count.enrollments} طالب
                    </span>
                    {avg && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3" /> {avg}
                      </span>
                    )}
                  </div>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-700 flex-shrink-0" />
              </div>

              {/* Rating bar */}
              {avg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>متوسط التقييم</span>
                    <span>{avg} / 5</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full transition-all"
                      style={{ width: `${(parseFloat(avg) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {course.reviews.length === 0 && course._count.enrollments === 0 && (
                <p className="text-[10px] text-slate-600 italic">لا توجد بيانات كافية بعد.</p>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Analysis Control */}
      <div className="rounded-2xl border border-violet-900/40 bg-violet-950/10 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-violet-300">التحليل الذكي الشامل</h2>
            <p className="text-[10px] text-slate-500">احصل على تحليل AI عميق لأداء دوراتك وطلابك</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCourseId}
            onChange={e => { setSelectedCourseId(e.target.value); setAnalysis(null) }}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-violet-600 rounded-xl px-3 py-2.5 text-xs outline-none text-white cursor-pointer"
          >
            <option value="ALL">📊 تحليل جميع دوراتي</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || courses.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/10 cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
            {isLoading ? 'جاري التحليل...' : 'توليد التحليل الذكي'}
          </button>
        </div>

        {courses.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-[10px] text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            لا توجد دورات بعد. أنشئ دورتك الأولى للبدء بالتحليل.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-xs text-slate-400">يعمل النموذج الذكي على تحليل بيانات دوراتك وطلابك...</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-5 border-t border-slate-800 pt-5">
            {/* Overall Insight */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-xs text-violet-300">التقييم العام للأداء</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{analysis.overallInsight}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs text-emerald-400">نقاط القوة</h3>
                </div>
                <ul className="space-y-1.5">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-slate-300">
                      <ChevronLeft className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-xs text-rose-400">نقاط التحسين</h3>
                </div>
                <ul className="space-y-1.5">
                  {analysis.weaknesses?.map((w, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-slate-300">
                      <ChevronLeft className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Student Engagement */}
            {analysis.studentEngagement && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <h3 className="font-bold text-[10px] text-indigo-400">مستوى تفاعل الطلاب</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.studentEngagement}</p>
              </div>
            )}

            {/* Risk Students */}
            {analysis.riskStudents && (
              <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-900/30 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="font-bold text-[10px] text-amber-400">ملاحظات حول الطلاب</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.riskStudents}</p>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 rounded-xl bg-violet-950/15 border border-violet-900/30 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-xs text-violet-300">التوصيات الذكية</h3>
              </div>
              <div className="space-y-2">
                {analysis.recommendations?.map((rec, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-300 items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Success Factors */}
            {analysis.successFactors && analysis.successFactors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-400">🏆 عوامل النجاح الرئيسية:</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.successFactors.map((factor, i) => (
                    <span key={i} className="text-[10px] px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
