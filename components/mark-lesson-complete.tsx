'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId: string
  isCompleted: boolean
  courseSlug: string
}

async function markLessonComplete(lessonId: string) {
  const res = await fetch('/api/lessons/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId }),
  })
  return res.ok
}

export default function MarkLessonComplete({ lessonId, isCompleted, courseSlug }: Props) {
  const router = useRouter()
  const [done, setDone] = useState(isCompleted)
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (done) return
    startTransition(async () => {
      const ok = await markLessonComplete(lessonId)
      if (ok) {
        setDone(true)
        router.refresh()
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
        <CheckCircle2 className="w-4 h-4" />
        تم إكمال الدرس!
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-emerald-500/20"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {pending ? 'جاري الحفظ...' : 'أكملت هذا الدرس'}
    </button>
  )
}
