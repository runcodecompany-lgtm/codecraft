// app/dashboard/admin/ai-analytics/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Brain, MessageSquare, AlertTriangle, ShieldCheck, Check } from 'lucide-react'
import AdminModerationClient from './moderation-client'

export const dynamic = 'force-dynamic'

export default async function AdminAIAnalyticsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.role)
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // 1. Fetch platform-wide AI statistics
  const totalConversations = await prisma.aiConversation.count()
  const totalMessages = await prisma.aiMessage.count()
  
  const totalLogs = await prisma.aiModerationLog.count()
  const totalFlagged = await prisma.aiModerationLog.count({
    where: { isAppropriate: false }
  })

  // 2. Fetch recent moderation logs
  const moderationLogs = await prisma.aiModerationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Parse JSON categories for safety
  const formattedLogs = moderationLogs.map(log => ({
    ...log,
    categories: Array.isArray(log.categories) 
      ? log.categories 
      : typeof log.categories === 'string' 
        ? JSON.parse(log.categories) 
        : []
  }))

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            تحليلات الرقابة الذكية AI Analytics & Moderation
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            مراقبة استخدام الذكاء الاصطناعي على مستوى المنصة ومتابعة عمليات الفلترة التلقائية للمحتوى.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">إجمالي المحادثات:</span>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white">{totalConversations}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">إجمالي رسائل AI:</span>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{totalMessages}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">سجلات الفحص والرقابة:</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{totalLogs}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">محتوى مخالف تم حظره:</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-400">{totalFlagged}</p>
          </div>
        </div>

        {/* Moderation Logs Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80">
            <h2 className="font-bold text-sm text-slate-200">سجل فحص المحتوى الأخير (AI Moderation Logs)</h2>
          </div>

          <AdminModerationClient initialLogs={formattedLogs} />
        </div>
      </div>
    </main>
  )
}
