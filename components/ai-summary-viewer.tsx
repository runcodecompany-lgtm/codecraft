// components/ai-summary-viewer.tsx
'use client'

import React, { useState } from 'react'
import { Sparkles, FileText, Loader2, Copy, Check, Info } from 'lucide-react'

interface AISummaryViewerProps {
  lessonId: string
  lessonTitle: string
}

export default function AISummaryViewer({ lessonId, lessonTitle }: AISummaryViewerProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [level, setLevel] = useState<'SHORT' | 'MEDIUM' | 'DETAILED'>('MEDIUM')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (selectedLevel = level) => {
    setIsLoading(true)
    setSummary(null)
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, level: selectedLevel })
      })

      if (res.ok) {
        const data = await res.json()
        setSummary(data.content)
      } else {
        const err = await res.json()
        alert(err.error || 'حدث خطأ أثناء توليد الملخص')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('فشل الاتصال بالخادم لتوليد الملخص')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!summary) return
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Very basic Markdown Parser for headers, lists and text
  const renderSummaryMarkdown = (text: string) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      if (line.trim().startsWith('###')) {
        return <h4 key={idx} className="font-black text-white text-sm mt-4 mb-2">{line.replace('###', '').trim()}</h4>
      }
      if (line.trim().startsWith('-')) {
        return <li key={idx} className="text-xs text-slate-300 pr-4 list-disc my-1">{line.replace('-', '').trim()}</li>
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />
      }
      return <p key={idx} className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">{line}</p>
    })
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm">التلخيص الذكي بالذكاء الاصطناعي</h3>
        </div>
        
        {summary && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-all text-[11px] cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ الملخص'}
          </button>
        )}
      </div>

      {/* Control buttons */}
      {!summary && !isLoading ? (
        <div className="space-y-4 py-2">
          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              يمكنك توليد ملخص ذكي ومختصر لهذا الدرس لمساعدتك في المذاكرة والمراجعة السريعة. اختر طول التلخيص المناسب لك:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['SHORT', 'MEDIUM', 'DETAILED'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  level === lvl
                    ? 'bg-indigo-650 border-indigo-550 text-white'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-750'
                }`}
              >
                {lvl === 'SHORT' ? 'موجز جداً' : lvl === 'MEDIUM' ? 'متوسط' : 'تفصيلي'}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-350" />
            إنشاء الملخص الذكي للدرس
          </button>
        </div>
      ) : isLoading ? (
        <div className="py-8 flex flex-col justify-center items-center text-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <div>
            <p className="text-xs font-bold text-slate-200">جاري قراءة محتوى الدرس وتلخيصه...</p>
            <p className="text-[10px] text-slate-500 mt-1">يستغرق هذا الإجراء بضع ثوانٍ فقط</p>
          </div>
        </div>
      ) : (
        /* Summary Content */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-850 max-h-[350px] overflow-y-auto space-y-2">
            {renderSummaryMarkdown(summary!)}
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>طول التلخيص: {level === 'SHORT' ? 'موجز' : level === 'MEDIUM' ? 'متوسط' : 'تفصيلي'}</span>
            <button 
              onClick={() => handleGenerate()}
              className="text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer flex items-center gap-1"
            >
              <RefreshCwIcon className="w-3 h-3" /> إعادة توليد الملخص
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
