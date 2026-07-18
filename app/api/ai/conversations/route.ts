// app/api/ai/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Retrieve all conversations for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('id')

    if (conversationId) {
      const conversation = await prisma.aiConversation.findFirst({
        where: {
          id: conversationId,
          userId: session.id,
          isActive: true,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      return NextResponse.json(conversation)
    }

    const conversations = await prisma.aiConversation.findMany({
      where: {
        userId: session.id,
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Include only the last message for preview
        },
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('[GET Conversations Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Deactivate or delete a specific conversation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('id')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Verify ownership
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Delete or mark inactive (we'll perform a soft delete by marking isActive = false)
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE Conversation Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
