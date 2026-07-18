// app/dashboard/student/flashcards/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BrainCircuit } from 'lucide-react'
import FlashcardsClient from './flashcards-client'

export const dynamic = 'force-dynamic'

export default async function StudentFlashcardsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
                    select: { id: true, title: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!dbUser) redirect('/login')

  const lessons = dbUser.enrollments.flatMap(e =>
    e.course.modules.flatMap(m =>
      m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        courseTitle: e.course.title
      }))
    )
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-xl)" }} dir="rtl">
      <div style={{
        padding: "var(--ccc-space-2xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
        borderTop: "4px solid var(--ccc-500)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 12px", borderRadius: "var(--ccc-radius-full)",
          background: "color-mix(in srgb, var(--ccc-500) 7%, transparent)",
          border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)",
          font: "var(--ccc-caption)", fontWeight: 600, color: "var(--ccc-500)",
          marginBottom: "var(--ccc-space-sm)",
        }}>
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>الذكاء الاصطناعي التعليمي</span>
        </div>
        <h1 style={{
          font: "700 24px/32px var(--ccc-font-sans)",
          color: "var(--ccn-900)", margin: 0,
        }}>
          بطاقات المراجعة الذكية
        </h1>
        <p style={{
          font: "var(--ccc-body-sm)", color: "var(--ccn-500)",
          marginTop: 4, maxWidth: 500,
        }}>
          راجع دروسك بذكاء من خلال بطاقات السؤال والجواب المستخرجة تلقائياً بالذكاء الاصطناعي
        </p>
      </div>

      <FlashcardsClient lessons={lessons} />
    </div>
  )
}
