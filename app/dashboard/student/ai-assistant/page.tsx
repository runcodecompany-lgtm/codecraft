// app/dashboard/student/ai-assistant/page.tsx
import React from 'react'
import AIAssistant from '@/components/ai-assistant'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function StudentAIAssistantPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">المساعد التعليمي الذكي</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحدث مع المساعد التعليمي لمراجعة الأكواد، شرح المفاهيم، أو المساعدة في الدروس.
          </p>
        </div>
      </div>
      <div className="max-w-4xl border border-gray-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900">
        <AIAssistant inline={true} />
      </div>
    </div>
  )
}
