// actions/notifications.ts
"use server"

import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { markNotificationRead, markAllNotificationsRead, getUserNotifications } from "@/lib/foundation"
import { revalidatePath } from "next/cache"

export async function fetchMyNotificationsAction() {
  const session = await getServerSession()
  if (!session) {
    return { error: "غير مصرح لك بالوصول." }
  }

  const notifications = await getUserNotifications(session.id)
  return { success: true, notifications }
}

export async function markAsReadAction(id: string) {
  const session = await getServerSession()
  if (!session) {
    return { error: "غير مصرح لك بالوصول." }
  }

  // Double check notification ownership
  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification || notification.userId !== session.id) {
    return { error: "الإشعار غير موجود أو لا تملكه." }
  }

  await markNotificationRead(id)
  revalidatePath("/dashboard/student")
  return { success: true }
}

export async function markAllAsReadAction() {
  const session = await getServerSession()
  if (!session) {
    return { error: "غير مصرح لك بالوصول." }
  }

  await markAllNotificationsRead(session.id)
  revalidatePath("/dashboard/student")
  return { success: true }
}
