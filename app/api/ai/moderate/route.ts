// app/api/ai/moderate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { moderateContent, ModerationContentType } from '@/lib/ai-moderation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/moderate
 * Moderate content by type (FORUM_TOPIC, COMMENT, etc.)
 * Body: { contentType, contentId, contentText }
 */
export async function POST(req: NextRequest) {
  try {
    // Check for admin-review action from query params
    const { searchParams } = new URL(req.url)
    const moderationId = searchParams.get('id')
    const action = searchParams.get('action')

    // Handle admin review action
    if (moderationId && action === 'REVIEW') {
      const session = await getServerSession()
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.role)
      if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      await prisma.aiModerationLog.update({
        where: { id: moderationId },
        data: { reviewedByAdmin: true },
      })
      return NextResponse.json({ success: true })
    }

    // Content moderation request
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentType, contentId, contentText } = await req.json()

    const validTypes: ModerationContentType[] = [
      'FORUM_TOPIC', 'FORUM_REPLY', 'COMMENT', 'QUESTION', 'ANSWER', 'MESSAGE',
    ]

    if (!contentType || !validTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 })
    }

    if (!contentId || !contentText || typeof contentText !== 'string') {
      return NextResponse.json({ error: 'contentId and contentText are required' }, { status: 400 })
    }

    const result = await moderateContent(contentType, contentId, contentText)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI Moderate API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
