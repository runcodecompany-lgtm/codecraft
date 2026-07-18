// app/dashboard/student/ai-insights/page.tsx
import React from 'react'
import StudentAIInsights from '@/components/student-ai-insights'
import { Brain } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function StudentAIInsightsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">تحليلات الأداء بالذكاء الاصطناعي</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ملفك الشخصي الذكي، نقاط قوتك، فجواتك المعرفية، وخطة علاجية مخصصة.
          </p>
        </div>
      </div>
      <StudentAIInsights />
    </div>
  )
}
