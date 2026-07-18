// lib/foundation.ts
import prisma from "@/lib/prisma"
import { randomBytes } from "crypto"

/**
 * ─── 1. Audit Logs ────────────────────────────────────────────────────────────
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  ip: string | null = null,
  userAgent: string | null = null,
  details: string | null = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: ip,
        userAgent,
        details,
      },
    })
  } catch (err) {
    console.error("Failed to write audit log:", err)
  }
}

/**
 * ─── 2. Session Management ────────────────────────────────────────────────────
 */
export async function createSession(
  userId: string,
  ipAddress: string | null = null,
  userAgent: string | null = null,
  rememberMe: boolean = false
): Promise<string> {
  const sessionToken = randomBytes(32).toString("hex")
  const durationDays = rememberMe ? 30 : 1 // 30 days if remember me, otherwise 1 day
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationDays)

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
    },
  })

  // Also log the login action
  await createAuditLog(userId, "Login (Session Created)", ipAddress, userAgent)

  return sessionToken
}

export async function validateSession(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            avatar: true,
            craftCoins: true,
            streakCount: true,
            emailVerified: true,
          },
        },
      },
    })

    if (!session) return null

    // Check expiration
    if (new Date() > session.expiresAt) {
      // Session expired
      await revokeSession(sessionToken)
      return null
    }

    // Update last active date periodically (only if older than 5 minutes to prevent spam writes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (session.lastActive < fiveMinutesAgo) {
      await prisma.session.update({
        where: { sessionToken },
        data: { lastActive: new Date() },
      })
    }

    return session.user
  } catch (err) {
    console.error("Error validating session:", err)
    return null
  }
}

export async function revokeSession(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { userId: true, ipAddress: true, userAgent: true },
    })

    if (session) {
      await prisma.session.delete({
        where: { sessionToken },
      })
      await createAuditLog(session.userId, "Logout (Session Revoked)", session.ipAddress, session.userAgent)
    }
  } catch (err) {
    console.error("Error revoking session:", err)
  }
}

export async function revokeAllUserSessions(userId: string) {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    })
    await createAuditLog(userId, "All Sessions Revoked")
  } catch (err) {
    console.error("Error revoking all user sessions:", err)
  }
}

/**
 * ─── 3. Notifications Foundation ──────────────────────────────────────────────
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "SYSTEM"
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    })
  } catch (err) {
    console.error("Error creating notification:", err)
    return null
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  } catch (err) {
    console.error("Error marking notification read:", err)
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  } catch (err) {
    console.error("Error marking all notifications read:", err)
  }
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    })
  } catch (err) {
    console.error("Error getting unread notifications count:", err)
    return 0
  }
}

export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  } catch (err) {
    console.error("Error fetching user notifications:", err)
    return []
  }
}
