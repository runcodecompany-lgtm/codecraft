// components/student-ai-insights.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  Compass,
  CheckCircle,
  Lightbulb,
  Bot
} from 'lucide-react'

interface KnowledgeGap {
  topic: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  suggestedLessons: string[]
}

interface InsightsProfile {
  interests: string[]
  strengths: string[]
  weaknesses: string[]
  preferredStyle: 'visual' | 'text' | 'interactive'
  goals: string[]
  knowledgeGaps: KnowledgeGap[]
  personalityNotes: string
  lastAnalyzedAt: string
}

export default function StudentAIInsights() {
  const [insights, setInsights] = useState<InsightsProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchInsights = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const url = `/api/ai/analysis${forceRefresh ? '?refresh=true' : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setInsights(data)
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full animate-pulse" style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-lg)' }}>
        <div className="skeleton skeleton-lg" style={{ width: '25%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--ccc-space-lg)' }}>
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
        <div className="skeleton" style={{ height: 80 }} />
      </div>
    )
  }

  if (!insights || !insights.lastAnalyzedAt) {
    return (
      <div style={{ direction: 'rtl', padding: 'var(--ccc-space-xl)', borderRadius: 'var(--ccc-radius-xl)', background: '#fff', border: '1px solid var(--ccn-200)', boxShadow: 'var(--ccc-shadow-sm)', textAlign: 'center', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ccc-space-md)' }}>
        <div style={{ padding: 16, background: 'color-mix(in srgb, var(--ccc-500) 8%, transparent)', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain className="w-8 h-8" style={{ color: 'var(--ccc-500)' }} />
        </div>
        <h3 style={{ font: 'var(--ccc-h3)', fontWeight: 900, color: 'var(--ccn-900)', margin: 0 }}>لم يتم إنشاء ملفك التعليمي الذكي بعد</h3>
        <p style={{ font: 'var(--ccc-body-sm)', color: 'var(--ccn-600)', maxWidth: 360 }}>
          الرجاء إكمال بعض الدروس والاختبارات أولاً، لكي يتمكن محرك الذكاء الاصطناعي من تحليل مستواك وتقديم تقرير مفصل.
        </p>
        <button
          onClick={() => fetchInsights(true)}
          disabled={isRefreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--ccc-radius-lg)', background: 'var(--ccc-500)', color: '#fff', font: 'var(--ccc-label)', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: 'var(--ccc-glow-primary)', transition: 'all 0.15s' }}
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isRefreshing ? 'جاري التحليل...' : 'توليد التحليل الآن'}
        </button>
      </div>
    )
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400'
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'ثغرة حرجة'
      case 'MEDIUM': return 'متوسطة'
      default: return 'طفيفة'
    }
  }

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'visual': return 'مرئي (فيديوهات ورسوم توضيحية)'
      case 'text': return 'قرائي (ملاحظات ومقالات)'
      case 'interactive': return 'تفاعلي (تحديات برمجية وألعاب)'
      default: return style
    }
  }

  return (
    <div style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-lg)' }}>
      {/* ── Header ── */}
      <div style={{ padding: 'var(--ccc-space-lg)', borderRadius: 'var(--ccc-radius-xl)', background: '#141C2F', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ccc-space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ccc-space-md)' }}>
          <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--ccc-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--cca-500)' }} />
          </div>
          <div>
            <h2 style={{ font: 'var(--ccc-h3)', fontWeight: 900, color: '#fff', margin: 0 }}>ملف التعلم الذكي الخاص بك</h2>
            <p style={{ font: 'var(--ccc-caption)', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>يتم تحديث هذه التحليلات تلقائياً بناءً على أدائك في المنصة.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ccc-space-sm)' }}>
          {insights.lastAnalyzedAt && (
            <span style={{ font: 'var(--ccc-caption)', color: 'rgba(255,255,255,0.4)' }}>
              آخر تحديث: {new Date(insights.lastAnalyzedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchInsights(true)}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--ccc-radius-lg)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', font: 'var(--ccc-caption)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'جاري التحديث...' : 'تحديث التحليل'}
          </button>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--ccc-space-lg)' }}>
        {/* Strengths & Weaknesses */}
        <div style={{ padding: 'var(--ccc-space-lg)', borderRadius: 'var(--ccc-radius-xl)', background: '#fff', border: '1px solid var(--ccn-200)', boxShadow: 'var(--ccc-shadow-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 'var(--ccc-space-sm)', borderBottom: '1px solid var(--ccn-200)' }}>
            <Brain className="w-5 h-5" style={{ color: 'var(--ccc-500)' }} />
            <h3 style={{ font: 'var(--ccc-label)', fontWeight: 700, color: 'var(--ccn-900)', margin: 0 }}>تحليل المعرفة البرمجية</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ccc-space-lg)' }}>
            {/* Strengths */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-sm)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccs-500)', margin: 0 }}>
                <CheckCircle className="w-4 h-4" />
                نقاط القوة والمفاهيم المتقنة:
              </h4>
              {insights.strengths?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {insights.strengths.map((str, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', borderRadius: 'var(--ccc-radius-lg)', font: 'var(--ccc-caption)', fontWeight: 700, background: 'color-mix(in srgb, var(--ccs-500) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ccs-500) 20%, transparent)', color: 'var(--ccs-500)' }}>
                      {str}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ font: 'var(--ccc-caption)', color: 'var(--ccn-400)' }}>لم يتم تحديد نقاط قوة بعد.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-sm)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccr-500)', margin: 0 }}>
                <AlertTriangle className="w-4 h-4" />
                مفاهيم تحتاج إلى مراجعة وتطوير:
              </h4>
              {insights.weaknesses?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {insights.weaknesses.map((weak, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', borderRadius: 'var(--ccc-radius-lg)', font: 'var(--ccc-caption)', fontWeight: 700, background: 'color-mix(in srgb, var(--ccr-500) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ccr-500) 20%, transparent)', color: 'var(--ccr-500)' }}>
                      {weak}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ font: 'var(--ccc-caption)', color: 'var(--ccn-400)' }}>لم يتم تحديد نقاط ضعف حالياً.</p>
              )}
            </div>
          </div>

          {/* Interests & Goals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ccc-space-lg)', paddingTop: 'var(--ccc-space-md)', borderTop: '1px solid var(--ccn-200)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-sm)' }}>
              <h4 style={{ font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccn-500)', margin: 0 }}>الاهتمامات البرمجية:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {insights.interests?.map((interest, idx) => (
                  <span key={idx} style={{ padding: '4px 10px', borderRadius: 'var(--ccc-radius-md)', background: 'var(--ccn-100)', font: 'var(--ccc-caption)', color: 'var(--ccn-700)' }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-sm)' }}>
              <h4 style={{ font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccn-500)', margin: 0 }}>الأهداف الدراسية المحددة:</h4>
              <ul style={{ margin: 0, paddingRight: 16, font: 'var(--ccc-caption)', color: 'var(--ccn-700)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {insights.goals?.map((goal, idx) => (
                  <li key={idx}>{goal}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Style & Preferences */}
        <div style={{ padding: 'var(--ccc-space-lg)', borderRadius: 'var(--ccc-radius-xl)', background: '#fff', border: '1px solid var(--ccn-200)', boxShadow: 'var(--ccc-shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 'var(--ccc-space-sm)', borderBottom: '1px solid var(--ccn-200)', marginBottom: 'var(--ccc-space-md)' }}>
              <Compass className="w-5 h-5" style={{ color: 'var(--ccc-500)' }} />
              <h3 style={{ font: 'var(--ccc-label)', fontWeight: 700, color: 'var(--ccn-900)', margin: 0 }}>النمط التعليمي المفضل</h3>
            </div>
            
            <div style={{ padding: 'var(--ccc-space-md)', background: 'color-mix(in srgb, var(--ccc-500) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)', borderRadius: 'var(--ccc-radius-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ccc-space-sm)' }}>
              <div style={{ width: 48, height: 48, background: 'var(--ccc-500)', borderRadius: 'var(--ccc-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--ccc-shadow-sm)' }}>
                <Lightbulb className="w-6 h-6" style={{ color: 'var(--cca-500)' }} />
              </div>
              <h4 style={{ font: 'var(--ccc-caption)', fontWeight: 900, color: 'var(--ccn-900)', margin: 0 }}>أسلوب التعلم الأمثل لك:</h4>
              <span style={{ padding: '6px 12px', borderRadius: 'var(--ccc-radius-lg)', font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccc-500)', background: 'color-mix(in srgb, var(--ccc-500) 8%, transparent)' }}>
                {getStyleLabel(insights.preferredStyle)}
              </span>
            </div>
          </div>

          <p style={{ font: 'var(--ccc-caption)', color: 'var(--ccn-400)', lineHeight: 1.6, marginTop: 'var(--ccc-space-md)' }}>
            نقوم بتهيئة واجهة الاستخدام ومقترحات الدروس والتحديات وفقاً لأسلوب التعلم المفضل لديك لضمان أقصى استفادة.
          </p>
        </div>
      </div>

      {/* Knowledge Gaps Section */}
      {insights.knowledgeGaps?.length > 0 && (
        <div style={{ padding: 'var(--ccc-space-lg)', borderRadius: 'var(--ccc-radius-xl)', background: '#fff', border: '1px solid var(--ccn-200)', boxShadow: 'var(--ccc-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 'var(--ccc-space-sm)', borderBottom: '1px solid var(--ccn-200)', marginBottom: 'var(--ccc-space-md)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--ccr-500)' }} />
            <h3 style={{ font: 'var(--ccc-label)', fontWeight: 700, color: 'var(--ccn-900)', margin: 0 }}>فجوات المعرفة الحالية وخطة العلاج</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--ccc-space-md)' }}>
            {insights.knowledgeGaps.map((gap, idx) => (
              <div key={idx} style={{ padding: 'var(--ccc-space-md)', borderRadius: 'var(--ccc-radius-lg)', border: '1px solid var(--ccn-200)', background: 'var(--ccn-50)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ccc-space-sm)' }}>
                    <span style={{ font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccn-800)' }}>{gap.topic}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSeverityStyle(gap.severity)}`}>
                      {getSeverityLabel(gap.severity)}
                    </span>
                  </div>
                  
                  <p style={{ font: 'var(--ccc-caption)', color: 'var(--ccn-500)', marginTop: 8 }}>المواضيع المقترحة للمذاكرة:</p>
                  <ul style={{ margin: '4px 0 0 0', paddingRight: 16, font: 'var(--ccc-caption)', color: 'var(--ccn-600)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {gap.suggestedLessons?.map((les, lidx) => (
                      <li key={lidx}>{les}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach Card */}
      {insights.personalityNotes && (
        <div style={{ padding: 'var(--ccc-space-lg)', borderRadius: 'var(--ccc-radius-xl)', background: 'color-mix(in srgb, var(--ccc-500) 4%, var(--ccn-50))', border: '1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)', display: 'flex', alignItems: 'flex-start', gap: 'var(--ccc-space-md)' }}>
          <div style={{ padding: 12, background: 'var(--ccc-500)', borderRadius: 'var(--ccc-radius-lg)', flexShrink: 0 }}>
            <Bot className="w-6 h-6" style={{ color: '#fff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ccc-space-sm)' }}>
            <h4 style={{ font: 'var(--ccc-caption)', fontWeight: 700, color: 'var(--ccc-500)', margin: 0 }}>نصيحة مدربك الشخصي AI:</h4>
            <p style={{ font: 'var(--ccc-body-sm)', color: 'var(--ccn-700)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              &ldquo;{insights.personalityNotes}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
