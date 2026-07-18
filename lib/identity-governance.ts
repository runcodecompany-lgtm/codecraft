import prisma from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { randomBytes, createHash } from "crypto"
import { Prisma } from "@prisma/client"
import type { ApprovalRequestStatus, TeacherApplicationStatus, UserRole } from "@prisma/client"

export const ADMIN_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN"]
export const STAFF_ROLES: UserRole[] = ["MODERATOR", "ADMIN", "SUPER_ADMIN"]
export const AUTHENTICATED_ROLES: UserRole[] = ["STUDENT", "TEACHER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]

export type RoleGate = {
  allowedRoles?: UserRole[]
  requireEmailVerified?: boolean
  requireApprovedTeacher?: boolean
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSecureToken() {
  return randomBytes(32).toString("hex")
}

export async function createEmailVerification(userId: string, email: string) {
  const token = createSecureToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.emailVerification.create({
    data: {
      userId,
      email,
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  await createAuditLog(userId, "Email Verification Sent", null, null, email)
  return { token, expiresAt }
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token)
  const record = await prisma.emailVerification.findUnique({
    where: { tokenHash },
  })

  if (!record || record.verifiedAt || record.expiresAt < new Date()) {
    return { success: false, error: "رمز التحقق غير صالح أو منتهي الصلاحية." }
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
  ])

  await createAuditLog(record.userId, "Email Verified", null, null, record.email)
  await createNotification(record.userId, "تم تأكيد البريد الإلكتروني", "تم تفعيل بريدك الإلكتروني بنجاح.", "SECURITY")
  return { success: true }
}

export async function createPasswordReset(userId: string) {
  const token = createSecureToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordReset.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  await createAuditLog(userId, "Password Reset Requested")
  return { token, expiresAt }
}

export async function getGovernedUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      teacherProfile: {
        select: {
          applicationStatus: true,
        },
      },
    },
  })
}

export async function evaluateAccess(userId: string, gate: RoleGate = {}) {
  const user = await getGovernedUser(userId)
  if (!user || user.status !== "ACTIVE") {
    return { ok: false as const, error: "الحساب غير نشط أو غير موجود." }
  }

  if (gate.allowedRoles?.length && !gate.allowedRoles.includes(user.role)) {
    return { ok: false as const, error: "لا تملك صلاحية تنفيذ هذه العملية." }
  }

  if (gate.requireEmailVerified && !user.emailVerified) {
    return { ok: false as const, error: "يجب تأكيد البريد الإلكتروني قبل تنفيذ هذه العملية." }
  }

  if (gate.requireApprovedTeacher && user.role === "TEACHER" && user.teacherProfile?.applicationStatus !== "APPROVED") {
    return { ok: false as const, error: "حساب المعلم بانتظار الاعتماد ولا يمكنه تنفيذ هذه العملية حالياً." }
  }

  return { ok: true as const, user }
}

export async function calculateProfileCompletion(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true, learningProfile: true, userTracks: true },
  })

  if (!user) return null

  const required =
    user.role === "TEACHER"
      ? [
          ["name", user.name],
          ["email", user.email],
          ["country", user.country || user.teacherProfile?.country],
          ["bio", user.teacherProfile?.bio],
          ["specialization", user.teacherProfile?.specialization],
          ["skills", user.teacherProfile?.skills],
          ["yearsOfExperience", user.teacherProfile?.yearsOfExperience],
          ["cvUrl", user.teacherProfile?.cvUrl],
        ]
      : [
          ["name", user.name],
          ["email", user.email],
          ["country", user.country],
          ["primaryTrack", user.learningProfile?.primaryTrackId],
          ["tracks", user.userTracks.length > 0],
        ]

  const missingFields = required.filter(([, value]) => !value).map(([field]) => field)
  const percentage = Math.round(((required.length - missingFields.length) / required.length) * 100)

  await prisma.profileCompletion.upsert({
    where: { userId },
    update: { percentage, missingFields: missingFields as Prisma.InputJsonValue, lastCalculatedAt: new Date() },
    create: { userId, percentage, missingFields: missingFields as Prisma.InputJsonValue },
  })

  return { percentage, missingFields }
}

export async function assertTeacherReadyForSubmission(userId: string) {
  const completion = await calculateProfileCompletion(userId)
  if (!completion || completion.percentage < 100) {
    return { ok: false as const, error: "يجب إكمال ملف المعلم ورفع السيرة الذاتية قبل إرسال الطلب.", completion }
  }
  return { ok: true as const, completion }
}

export async function submitTeacherApplication(userId: string) {
  const ready = await assertTeacherReadyForSubmission(userId)
  if (!ready.ok) return ready

  const profile = await prisma.teacherProfile.findUnique({ where: { userId } })
  if (!profile) return { ok: false as const, error: "ملف المعلم غير موجود." }

  const application = await prisma.teacherApplication.create({
    data: {
      teacherId: userId,
      teacherProfileId: profile.id,
      status: "PENDING",
      documents: profile.cvUrl ? { cvUrl: profile.cvUrl } : undefined,
      approvalRequests: {
        create: {
          subjectType: "TEACHER",
          subjectId: profile.id,
          requestedById: userId,
          status: "PENDING",
        },
      },
    },
  })

  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: { applicationStatus: "PENDING" },
  })

  await createAuditLog(userId, "Teacher Application Submitted", null, null, application.id)
  await createNotification(userId, "تم إرسال طلب المعلم", "طلبك الآن قيد مراجعة الإدارة.", "TEACHER_APPLICATION")
  return { ok: true as const, application }
}

export async function reviewTeacherApplication(params: {
  applicationId: string
  reviewerId: string
  status: Extract<TeacherApplicationStatus, "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "SUSPENDED">
  reviewerNotes?: string
  requestedChanges?: string
}) {
  const access = await evaluateAccess(params.reviewerId, { allowedRoles: ADMIN_ROLES })
  if (!access.ok) return access

  const approvalStatus = params.status as ApprovalRequestStatus
  const reviewedAt = new Date()

  const application = await prisma.teacherApplication.update({
    where: { id: params.applicationId },
    data: {
      status: params.status,
      reviewedAt,
      reviewedById: params.reviewerId,
      reviewerNotes: params.reviewerNotes || null,
      requestedChanges: params.requestedChanges || null,
      approvalRequests: {
        updateMany: {
          where: { status: "PENDING" },
          data: {
            status: approvalStatus,
            reviewedById: params.reviewerId,
            reviewedAt,
            reviewerNotes: params.reviewerNotes || null,
            requestedChanges: params.requestedChanges || null,
          },
        },
      },
    },
    include: { teacher: true },
  })

  await prisma.teacherProfile.update({
    where: { id: application.teacherProfileId },
    data: {
      applicationStatus: params.status,
      approvedAt: params.status === "APPROVED" ? reviewedAt : null,
      approvedById: params.status === "APPROVED" ? params.reviewerId : null,
    },
  })

  const event =
    params.status === "APPROVED"
      ? "Teacher Approved"
      : params.status === "SUSPENDED"
        ? "Teacher Suspended"
        : params.status === "REJECTED"
          ? "Teacher Rejected"
          : "Teacher Changes Requested"

  await createAuditLog(application.teacherId, event, null, null, params.reviewerNotes || params.requestedChanges || null)
  await createNotification(application.teacherId, event, params.reviewerNotes || "تم تحديث حالة طلب المعلم.", "TEACHER_APPLICATION")

  return { ok: true as const, application }
}
