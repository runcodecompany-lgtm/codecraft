// app/api/ai/analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { getOrGenerateStudentInsights } from '@/lib/ai-analytics'

export const dynamic = 'force-dynamic'

// GET: Fetch student learning insights
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === 'true'

    const insights = await getOrGenerateStudentInsights(session.id, refresh)
    return NextResponse.json(insights)
  } catch (error) {
    console.error('[GET Analysis API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
