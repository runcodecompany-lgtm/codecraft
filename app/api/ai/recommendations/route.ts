// app/api/ai/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getAIRecommendationsForUser } from '@/lib/ai-recommendations'

export const dynamic = 'force-dynamic'

// GET: Fetch recommendations for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === 'true'

    const recommendations = await getAIRecommendationsForUser(session.id, refresh)
    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('[GET Recommendations API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Update recommendation status (Dismiss or Act on)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, action } = await req.json()
    if (!id || !action || !['DISMISS', 'ACT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Verify ownership
    const recommendation = await prisma.aiRecommendation.findFirst({
      where: { id, userId: session.id },
    })

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    if (action === 'DISMISS') {
      await prisma.aiRecommendation.update({
        where: { id },
        data: { isDismissed: true },
      })
    } else if (action === 'ACT') {
      await prisma.aiRecommendation.update({
        where: { id },
        data: { isActedOn: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST Recommendations API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
