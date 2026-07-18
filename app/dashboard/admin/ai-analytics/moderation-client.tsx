// app/dashboard/admin/ai-analytics/moderation-client.tsx
'use client'

import React, { useState } from 'react'
import { Check, ShieldAlert, AlertTriangle, Eye, ShieldCheck, FileText } from 'lucide-react'

interface ModerationLog {
  id: string
  contentType: string
  contentId: string
  contentText: string
  isAppropriate: boolean
  severity: string
  reason: string | null
  categories: string[]
  autoAction: string | null
  reviewedByAdmin: boolean
  createdAt: Date | string
}

interface AdminModerationClientProps {
  initialLogs: ModerationLog[]
}

export default function AdminModerationClient({ initialLogs }: AdminModerationClientProps) {
  const [logs, setLogs] = useState<ModerationLog[]>(initialLogs)
  const [filter, setFilter] = useState<'ALL' | 'FLAGGED' | 'CLEAN'>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleMarkReviewed = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/ai/moderate?id=${id}&action=REVIEW`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setLogs(prev => prev.map(log => log.id === id ? { ...log, reviewedByAdmin: true } : log))
      } else {
        alert('حدث خطأ أثناء تحديث حالة السجل.')
      }
    } catch (error) {
      console.error('Moderation action error:', error)
      alert('فشل الاتصال بالخادم.')
    } finally {
      setUpdatingId(null)
    }
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'HIGH': return 'text-red-400 bg-red-500/10 border-red-500/25'
      case 'MEDIUM': return 'text-amber-405 bg-amber-500/10 border-amber-500/25'
      case 'LOW': return 'text-yellow-405 bg-yellow-500/10 border-yellow-500/25'
      default: return 'text-slate-400 bg-slate-800/40 border-slate-700'
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'FORUM_TOPIC': return 'موضوع منتدى'
      case 'FORUM_REPLY': return 'رد منتدى'
      case 'COMMENT': return 'تعليق مقال'
      case 'QUESTION': return 'سؤال Q&A'
      case 'ANSWER': return 'إجابة Q&A'
      case 'MESSAGE': return 'رسالة خاصة'
      default: return type
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'FLAGGED') return !log.isAppropriate
    if (filter === 'CLEAN') return log.isAppropriate
    return true
  })

  return (
    <div className="flex flex-col">
      {/* Filtering Tab Controls */}
      <div className="flex items-center gap-3 p-4 bg-slate-900/60 border-b border-slate-800">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
          }`}
        >
          الكل ({logs.length})
        </button>
        <button
          onClick={() => setFilter('FLAGGED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            filter === 'FLAGGED'
              ? 'bg-rose-600 border-rose-500 text-white'
              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
          }`}
        >
          المخالفات فقط ({logs.filter(l => !l.isAppropriate).length})
        </button>
        <button
          onClick={() => setFilter('CLEAN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            filter === 'CLEAN'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
          }`}
        >
          المحتوى السليم ({logs.filter(l => l.isAppropriate).length})
        </button>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <ShieldCheck className="w-12 h-12 mb-3 text-emerald-500 opacity-60" />
          <p className="font-bold text-xs">لا يوجد سجلات مطابقة للفحص</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/20 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">نوع المحتوى</th>
                <th className="p-4">مقتطف من النص</th>
                <th className="p-4">حالة المحتوى</th>
                <th className="p-4">مستوى الخطورة</th>
                <th className="p-4">التصنيف والسبب</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4 font-bold text-slate-300">
                    {getContentTypeLabel(log.contentType)}
                  </td>
                  <td className="p-4 text-slate-400 max-w-xs truncate" title={log.contentText}>
                    {log.contentText}
                  </td>
                  <td className="p-4">
                    {log.isAppropriate ? (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        سليم ونظيف
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1 w-max">
                        <ShieldAlert className="w-3.5 h-3.5" /> مخالف
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getSeverityColor(log.severity)}`}>
                      {log.severity === 'HIGH' ? 'مرتفع جداً' : log.severity === 'MEDIUM' ? 'متوسط' : log.severity === 'LOW' ? 'منخفض' : 'لا يوجد'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {log.categories?.map((cat, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono">
                            {cat}
                          </span>
                        ))}
                      </div>
                      {log.reason && (
                        <p className="text-[10px] text-slate-500 leading-normal max-w-xs">{log.reason}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleString('ar-EG')}
                  </td>
                  <td className="p-4 text-center">
                    {log.reviewedByAdmin ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1 text-[10px] font-bold">
                        <Check className="w-4 h-4" /> تم الاعتماد
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkReviewed(log.id)}
                        disabled={updatingId === log.id}
                        className="mx-auto flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-bold transition-all disabled:opacity-45 shadow-sm hover:shadow-indigo-600/10 cursor-pointer"
                      >
                        {updatingId === log.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        اعتماد ومراجعة
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
