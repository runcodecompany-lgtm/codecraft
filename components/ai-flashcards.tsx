// components/ai-flashcards.tsx
'use client'

import React, { useState } from 'react'
import { Sparkles, Layers, Loader2, ArrowRight, ArrowLeft, RefreshCw, CheckCircle, BrainCircuit } from 'lucide-react'

interface Flashcard {
  id: string
  front: string
  back: string
  mastery: number
}

interface FlashcardDeck {
  id: string
  title: string
  cards: Flashcard[]
}

interface AIFlashcardsProps {
  lessonId: string
}

export default function AIFlashcards({ lessonId }: AIFlashcardsProps) {
  const [deck, setDeck] = useState<FlashcardDeck | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [masteredCount, setMasteredCount] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)

  const handleGenerateDeck = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, count: 6 })
      })

      if (res.ok) {
        const data = await res.json()
        setDeck(data)
        setCurrentIndex(0)
        setIsFlipped(false)
        setMasteredCount(0)
        setReviewedCount(0)
      } else {
        const err = await res.json()
        alert(err.error || 'حدث خطأ أثناء إنشاء بطاقات المراجعة')
      }
    } catch (error) {
      alert('فشل الاتصال بالخادم لإنشاء بطاقات المراجعة')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (!deck) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.cards.length)
    }, 150)
  }

  const handlePrev = () => {
    if (!deck) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length)
    }, 150)
  }

  const handleMasteryClick = (isMastered: boolean) => {
    if (isMastered) {
      setMasteredCount(prev => prev + 1)
    }
    setReviewedCount(prev => prev + 1)
    handleNext()
  }

  if (isLoading) {
    return (
      <div style={{
        padding: "var(--ccc-space-3xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
        textAlign: "center", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "var(--ccc-space-md)",
        height: 320,
      }} dir="rtl">
        <Loader2 className="w-8 h-8" style={{ color: "var(--ccc-500)", animation: "spin 1s linear infinite" }} />
        <div>
          <p style={{ font: "var(--ccc-label)", fontWeight: 700, color: "var(--ccn-800)" }}>
            جاري استخراج المفاهيم وتوليد بطاقات المراجعة...
          </p>
          <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", marginTop: 2 }}>
            نصنع لك بطاقات مذاكرة مخصصة بالذكاء الاصطناعي
          </p>
        </div>
      </div>
    )
  }

  if (!deck || deck.cards.length === 0) {
    return (
      <div style={{
        padding: "var(--ccc-space-2xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
        textAlign: "center", display: "flex", flexDirection: "column",
        alignItems: "center", gap: "var(--ccc-space-lg)",
      }} dir="rtl">
        <div style={{
          width: 56, height: 56, borderRadius: "var(--ccc-radius-xl)",
          background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Layers className="w-7 h-7" style={{ color: "var(--ccc-500)" }} />
        </div>
        <div>
          <div style={{ font: "var(--ccc-h4)", fontWeight: 700, color: "var(--ccn-900)" }}>
            بطاقات المراجعة التفاعلية (Flashcards)
          </div>
          <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", marginTop: 4, lineHeight: 1.8, maxWidth: 420, margin: "4px auto 0" }}>
            استخرج المفاهيم الرئيسية للدرس في بطاقات مراجعة تفاعلية (سؤال وجواب) لاختبار مدى استيعابك للمادة العلمية.
          </p>
        </div>
        <button
          onClick={handleGenerateDeck}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px",
            borderRadius: "var(--ccc-radius-lg)",
            background: "var(--ccc-500)", color: "#fff",
            font: "var(--ccc-label)", fontWeight: 700,
            border: "none", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(43,76,126,0.15)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.02)" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "var(--cca-400)" }} />
          توليد بطاقات المراجعة الذكية
        </button>
      </div>
    )
  }

  const currentCard = deck.cards[currentIndex]
  const progressPercent = Math.min(100, Math.round((reviewedCount / deck.cards.length) * 100))

  return (
    <div style={{
      padding: "var(--ccc-space-lg)",
      borderRadius: "var(--ccc-radius-2xl)",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
      display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)",
    }} dir="rtl">
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; position: absolute; width: 100%; height: 100%; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes fc-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "var(--ccc-space-md)",
        borderBottom: "1px solid var(--ccn-200)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrainCircuit className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
          <span style={{ font: "var(--ccc-label)", fontWeight: 700, color: "var(--ccn-800)" }}>
            بطاقات المراجعة: {deck.cards.length} بطاقات
          </span>
        </div>
        <button
          onClick={handleGenerateDeck}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            font: "var(--ccc-caption)", fontWeight: 600,
            color: "var(--ccn-400)", cursor: "pointer",
            border: "none", background: "none", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ccc-500)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ccn-400)" }}
          title="إعادة توليد البطاقات"
        >
          <RefreshCw className="w-3 h-3" />
          توليد جديد
        </button>
      </div>

      {/* Flashcard */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "var(--ccc-space-md) 0",
      }}>
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="perspective-1000"
          style={{ width: "100%", maxWidth: 340, height: 190, cursor: "pointer" }}
        >
          <div className={`transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            style={{
              position: "relative", width: "100%", height: "100%",
              textAlign: "center", transition: "transform 0.5s ease",
            }}
          >
            {/* Front */}
            <div className="backface-hidden" style={{
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: "var(--ccc-space-xl)",
              borderRadius: "var(--ccc-radius-2xl)",
              background: "#fff",
              border: "1px solid var(--ccn-200)",
              boxShadow: "0 4px 16px rgba(30,41,59,0.06)",
            }}>
              <span style={{
                font: "var(--ccc-micro)", fontWeight: 700,
                color: "var(--ccc-500)", marginBottom: 8,
              }}>
                المفهوم / السؤال
              </span>
              <p style={{
                font: "700 13px/22px var(--ccc-font-sans)",
                color: "var(--ccn-900)", margin: 0,
                whiteSpace: "pre-wrap",
              }}>
                {currentCard.front}
              </p>
              <span style={{
                font: "var(--ccc-micro)", color: "var(--ccn-300)",
                marginTop: "auto", paddingTop: 8, userSelect: "none",
              }}>
                اضغط على البطاقة لكشف الجواب
              </span>
            </div>

            {/* Back */}
            <div className="backface-hidden rotate-y-180" style={{
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: "var(--ccc-space-xl)",
              borderRadius: "var(--ccc-radius-2xl)",
              background: "color-mix(in srgb, var(--ccc-500) 4%, #fff)",
              border: "1px solid color-mix(in srgb, var(--ccc-500) 10%, transparent)",
              boxShadow: "0 4px 16px rgba(43,76,126,0.06)",
              overflowY: "auto",
            }}>
              <span style={{
                font: "var(--ccc-micro)", fontWeight: 700,
                color: "var(--ccs-500)", marginBottom: 8,
              }}>
                التعريف / الجواب
              </span>
              <p style={{
                font: "var(--ccc-body-sm)", color: "var(--ccn-800)",
                margin: 0, lineHeight: 1.8,
                whiteSpace: "pre-wrap", maxHeight: 110, overflowY: "auto",
              }}>
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery buttons — visible only when flipped */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ccc-space-sm)",
        maxWidth: 340, margin: "0 auto", width: "100%",
        transition: "all 0.3s ease",
        opacity: isFlipped ? 1 : 0,
        transform: isFlipped ? "scale(1)" : "scale(0.95)",
        pointerEvents: isFlipped ? "auto" : "none",
        height: isFlipped ? "auto" : 0,
        overflow: isFlipped ? "visible" : "hidden",
      }}>
        <button
          onClick={() => handleMasteryClick(false)}
          style={{
            padding: "8px 12px", borderRadius: "var(--ccc-radius-lg)",
            background: "color-mix(in srgb, var(--ccr-500) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--ccr-500) 15%, transparent)",
            color: "var(--ccr-500)",
            font: "var(--ccc-caption)", fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--ccr-500) 15%, transparent)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--ccr-500) 8%, transparent)" }}
        >
          بحاجة لمراجعة
        </button>
        <button
          onClick={() => handleMasteryClick(true)}
          style={{
            padding: "8px 12px", borderRadius: "var(--ccc-radius-lg)",
            background: "var(--ccs-500)",
            border: "none",
            color: "#fff",
            font: "var(--ccc-caption)", fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: "0 1px 3px rgba(74,124,89,0.2)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.02)" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)" }}
        >
          ✓ تم الحفظ والإتقان
        </button>
      </div>

      {/* Navigation + Progress */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        font: "var(--ccc-caption)", color: "var(--ccn-500)",
        paddingTop: "var(--ccc-space-md)",
        borderTop: "1px solid var(--ccn-200)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={handlePrev}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28,
              borderRadius: "var(--ccc-radius-md)",
              background: "var(--ccn-50)", border: "1px solid var(--ccn-200)",
              color: "var(--ccn-600)", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ccc-300)"; e.currentTarget.style.color = "var(--ccc-500)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--ccn-200)"; e.currentTarget.style.color = "var(--ccn-600)" }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span style={{ font: "700 11px/1 monospace", color: "var(--ccn-600)", minWidth: 50, textAlign: "center" }}>
            {currentIndex + 1} / {deck.cards.length}
          </span>
          <button
            onClick={handleNext}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28,
              borderRadius: "var(--ccc-radius-md)",
              background: "var(--ccn-50)", border: "1px solid var(--ccn-200)",
              color: "var(--ccn-600)", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ccc-300)"; e.currentTarget.style.color = "var(--ccc-500)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--ccn-200)"; e.currentTarget.style.color = "var(--ccn-600)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
          {/* Thin progress bar */}
          <div style={{
            width: 60, height: 4,
            background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: "var(--ccc-radius-full)",
              background: "var(--ccc-500)",
              width: `${progressPercent}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)" }}>
            {progressPercent}%
          </span>
          {masteredCount > 0 && (
            <span style={{
              font: "var(--ccc-micro)", fontWeight: 700,
              color: "var(--ccs-500)",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <CheckCircle className="w-3 h-3" />
              {masteredCount} متقنة
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
