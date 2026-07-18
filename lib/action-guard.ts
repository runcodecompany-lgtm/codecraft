"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { evaluateAccess } from "@/lib/identity-governance"
import type { UserRole } from "@prisma/client"

export type GuardResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

export async function guardAction(options?: {
  allowedRoles?: UserRole[]
  requireEmailVerified?: boolean
  requireApprovedTeacher?: boolean
  cooldownMs?: number
}): Promise<GuardResult> {
  const {
    allowedRoles,
    requireEmailVerified = true,
    requireApprovedTeacher = false,
    cooldownMs = 3_000,
  } = options ?? {}

  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: "يجب تسجيل الدخول لتنفيذ هذه العملية." }
  }

  const access = await evaluateAccess(authUser.id, {
    allowedRoles,
    requireEmailVerified,
    requireApprovedTeacher,
  })

  if (!access.ok) {
    return { ok: false, error: access.error }
  }

  if (cooldownMs > 0) {
    const lastEarn = await prisma.transaction.findFirst({
      where: { userId: authUser.id, type: "EARN" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    if (lastEarn) {
      const elapsed = Date.now() - lastEarn.createdAt.getTime()
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000)
        return { ok: false, error: `يرجى الانتظار ${remaining} ثانية قبل المحاولة مرة أخرى.` }
      }
    }
  }

  return { ok: true, userId: authUser.id }
}
