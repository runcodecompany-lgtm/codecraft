// app/dashboard/student/flashcards/flashcards-client.tsx
'use client'

import React, { useState } from 'react'
import AIFlashcards from '@/components/ai-flashcards'
import { BookOpen, ChevronLeft, Sparkles, GraduationCap, Layers, BrainCircuit } from 'lucide-react'

interface LessonOption {
  id: string
  title: string
  courseTitle: string
}

interface FlashcardsClientProps {
  lessons: LessonOption[]
}

export default function FlashcardsClient({ lessons }: FlashcardsClientProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  const selectedLesson = lessons.find(l => l.id === selectedLessonId)

  const courseGroups = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.courseTitle]) {
      acc[lesson.courseTitle] = []
    }
    acc[lesson.courseTitle].push(lesson)
    return acc
  }, {} as Record<string, LessonOption[]>)

  if (selectedLessonId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }}>
        <button
          onClick={() => setSelectedLessonId(null)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            font: "var(--ccc-caption)", fontWeight: 700,
            color: "var(--ccc-500)", cursor: "pointer",
            border: "none", background: "none", padding: 0,
            width: "fit-content",
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          العودة لاختيار درس آخر
        </button>

        <div style={{
          padding: "var(--ccc-space-lg)",
          borderRadius: "var(--ccc-radius-xl)",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
          border: "1px solid var(--ccn-200)",
        }}>
          <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", margin: 0 }}>
            الدرس الحالي:
          </p>
          <h3 style={{ font: "700 14px/22px var(--ccc-font-sans)", color: "var(--ccn-900)", marginTop: 2, margin: "2px 0 0 0" }}>
            {selectedLesson?.title}
          </h3>
          <span style={{
            display: "inline-block",
            font: "var(--ccc-micro)", fontWeight: 700,
            padding: "2px 10px", borderRadius: "var(--ccc-radius-full)",
            background: "color-mix(in srgb, var(--ccc-500) 7%, transparent)",
            color: "var(--ccc-500)",
            border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)",
            marginTop: "var(--ccc-space-sm)",
          }}>
            {selectedLesson?.courseTitle}
          </span>
        </div>

        <AIFlashcards lessonId={selectedLessonId} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }}>
      {lessons.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "var(--ccc-space-3xl) var(--ccc-space-xl)",
          border: "1.5px dashed var(--ccn-200)",
          borderRadius: "var(--ccc-radius-2xl)",
          maxWidth: 400, margin: "0 auto",
        }}>
          <GraduationCap className="w-10 h-10" style={{ margin: "0 auto var(--ccc-space-md)", color: "var(--ccn-300)" }} />
          <div style={{ font: "var(--ccc-h4)", fontWeight: 700, color: "var(--ccn-600)" }}>
            لا توجد دروس متاحة
          </div>
          <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", marginTop: 4, lineHeight: 1.8 }}>
            يجب عليك التسجيل في دورة دراسية وبدء التعلم أولاً لتتمكن من إنشاء بطاقات مراجعة.
          </p>
        </div>
      ) : (
        <>
          {/* Info box */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "var(--ccc-space-md)",
            padding: "var(--ccc-space-lg)",
            borderRadius: "var(--ccc-radius-xl)",
            background: "color-mix(in srgb, var(--ccc-500) 4%, #fff)",
            border: "1px solid color-mix(in srgb, var(--ccc-500) 8%, transparent)",
          }}>
            <BrainCircuit className="w-5 h-5" style={{ color: "var(--ccc-500)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ font: "var(--ccc-label)", fontWeight: 700, color: "var(--ccc-600)" }}>
                كيف تعمل بطاقات المراجعة؟
              </div>
              <p style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", marginTop: 4, lineHeight: 1.8, margin: 0 }}>
                اختر أي درس من قائمة مقرراتك الدراسية بالأسفل، وسنقوم باستخدام الذكاء الاصطناعي لاستخراج المصطلحات والمفاهيم الهامة وصنع بطاقات مراجعة تفاعلية (Flip Cards) لمساعدتك في تثبيت معلوماتك بسرعة.
              </p>
            </div>
          </div>

          {/* Lesson list */}
          <div>
            <h3 style={{
              font: "700 14px/22px var(--ccc-font-sans)", color: "var(--ccn-800)",
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: "var(--ccc-space-md)",
            }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--ccc-500)" }} />
              اختر درساً للبدء:
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }}>
              {Object.entries(courseGroups).map(([courseTitle, courseLessons]) => (
                <div key={courseTitle}>
                  <h4 style={{
                    display: "flex", alignItems: "center", gap: 6,
                    font: "var(--ccc-caption)", fontWeight: 700,
                    color: "var(--ccn-600)",
                    marginBottom: "var(--ccc-space-sm)",
                  }}>
                    <BookOpen className="w-4 h-4" style={{ color: "var(--ccc-500)" }} />
                    {courseTitle}
                  </h4>

                  <div className="md:grid-cols-2" style={{
                    display: "grid", gap: "var(--ccc-space-sm)",
                  }}>
                    {courseLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "right", width: "100%",
                          padding: "12px 16px",
                          borderRadius: "var(--ccc-radius-xl)",
                          border: "1px solid var(--ccn-200)",
                          background: "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          font: "var(--ccc-body-sm)", fontWeight: 600,
                          color: "var(--ccn-800)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--ccc-300)"
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(43,76,126,0.06)"
                          e.currentTarget.style.transform = "translateY(-1px)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--ccn-200)"
                          e.currentTarget.style.boxShadow = "none"
                          e.currentTarget.style.transform = "none"
                        }}
                      >
                        <span>{lesson.title}</span>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--ccn-300)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
