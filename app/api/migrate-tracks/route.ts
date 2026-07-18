import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Create default Programming Track
    const programmingTrack = await prisma.learningTrack.upsert({
      where: { name: 'Programming' },
      update: {},
      create: {
        name: 'Programming',
        description: 'Default programming track for existing users and courses.',
        isActive: true,
      }
    })

    // 2. Migrate existing courses
    await prisma.course.updateMany({
      where: { trackId: null },
      data: { trackId: programmingTrack.id }
    })

    // 3. Migrate placement attempts
    await prisma.placementTestAttempt.updateMany({
      where: { trackId: null },
      data: { trackId: programmingTrack.id }
    })

    // 4. Create UserTrack for all existing users
    const users = await prisma.user.findMany({
       include: { placementAttempts: { take: 1, orderBy: { createdAt: 'desc' } } }
    })

    let userTracksCreated = 0
    for (const user of users) {
      const level = user.placementAttempts.length > 0 ? user.placementAttempts[0].level as any : 'BEGINNER'
      
      const existingUserTrack = await prisma.userTrack.findUnique({
        where: { userId_trackId: { userId: user.id, trackId: programmingTrack.id } }
      })

      if (!existingUserTrack) {
        await prisma.userTrack.create({
          data: {
            userId: user.id,
            trackId: programmingTrack.id,
            isPrimary: true,
            level: level
          }
        })
        userTracksCreated++
      }
    }

    // 5. Migrate communities (Forums, Q&A, Challenges)
    await prisma.forum.updateMany({
      where: { trackId: null },
      data: { trackId: programmingTrack.id }
    })
    await prisma.qaQuestion.updateMany({
      where: { trackId: null },
      data: { trackId: programmingTrack.id }
    })
    await prisma.challenge.updateMany({
      where: { trackId: null },
      data: { trackId: programmingTrack.id }
    })

    return NextResponse.json({ success: true, message: 'Migration completed', programmingTrackId: programmingTrack.id, userTracksCreated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
