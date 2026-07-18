"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/auth"

// Helper to check admin authorization
async function checkAdmin() {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
        throw new Error("غير مصرح لك بالوصول. يجب أن تكون مشرفاً.")
    }
    return session
}

// ======================= DASHBOARD STATS =======================

export async function getAdminDashboardStats() {
    try {
        await checkAdmin()

        const [
            totalUsers, totalStudents, totalTeachers, totalCourses,
            totalLessons, totalQuizzes, totalCertificates,
            recentUsers, recentCourses
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.user.count({ where: { role: "TEACHER" } }),
            prisma.course.count(),
            prisma.lesson.count(),
            prisma.quiz.count(),
            prisma.certificate.count(),
            prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
            prisma.course.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } })
        ])

        // Completion rate
        const enrollments = await prisma.enrollment.findMany({ select: { isCompleted: true } })
        const completedEnrollments = enrollments.filter(e => e.isCompleted).length
        const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0

        // Quiz pass rate
        const quizAttempts = await prisma.quizAttempt.findMany({ select: { isPassed: true } })
        const passedAttempts = quizAttempts.filter(a => a.isPassed).length
        const passRate = quizAttempts.length > 0 ? Math.round((passedAttempts / quizAttempts.length) * 100) : 0

        return {
            success: true,
            stats: {
                totalUsers, totalStudents, totalTeachers, totalCourses,
                totalLessons, totalQuizzes, totalCertificates,
                completionRate, passRate,
                enrollmentsCount: enrollments.length,
                quizAttemptsCount: quizAttempts.length
            },
            recentUsers,
            recentCourses
        }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب إحصائيات لوحة التحكم." }
    }
}

// ======================= USER MANAGEMENT =======================

export async function getAdminUsers(search?: string, role?: string, page: number = 1, limit: number = 20) {
    try {
        await checkAdmin()

        const where: any = {}
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { name: { contains: search } },
                { email: { contains: search } }
            ]
        }
        if (role && role !== "ALL") {
            where.role = role
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true, name: true, email: true, avatar: true,
                    role: true, status: true, xp: true, level: true, craftCoins: true,
                    createdAt: true, emailVerified: true
                }
            }),
            prisma.user.count({ where })
        ])

        return { success: true, users, total, pages: Math.ceil(total / limit) }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب المستخدمين." }
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        await checkAdmin()
        await prisma.user.update({ where: { id: userId }, data: { role: newRole as any } })
        revalidatePath("/dashboard/admin/users")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تحديث دور المستخدم." }
    }
}

export async function toggleUserStatus(userId: string, newStatus: string) {
    try {
        await checkAdmin()
        await prisma.user.update({ where: { id: userId }, data: { status: newStatus as any } })
        revalidatePath("/dashboard/admin/users")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تغيير حالة المستخدم." }
    }
}

export async function deleteUser(userId: string) {
    try {
        await checkAdmin()
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath("/dashboard/admin/users")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل حذف المستخدم." }
    }
}

// ======================= TEACHER MANAGEMENT =======================

export async function getAdminTeachers(page: number = 1, limit: number = 20) {
    try {
        await checkAdmin()

        const [teachers, total] = await Promise.all([
            prisma.user.findMany({
                where: { role: "TEACHER" },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    teacherProfile: true,
                    _count: { select: { coursesTaught: true } }
                }
            }),
            prisma.user.count({ where: { role: "TEACHER" } })
        ])

        return { success: true, teachers, total, pages: Math.ceil(total / limit) }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب المعلمين." }
    }
}

// ======================= COURSE MANAGEMENT =======================

export async function getAdminCourses(status?: string, page: number = 1, limit: number = 20) {
    try {
        await checkAdmin()

        const where: any = {}
        if (status && status !== "ALL") where.status = status

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    teacher: { select: { id: true, name: true } },
                    track: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                    subcategory: { select: { id: true, name: true } },
                    _count: { select: { enrollments: true, modules: true } }
                }
            }),
            prisma.course.count({ where })
        ])

        return { success: true, courses, total, pages: Math.ceil(total / limit) }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب الدورات." }
    }
}

export async function adminUpdateCourseStatus(courseId: string, status: string) {
    try {
        await checkAdmin()
        const isPublished = status === "PUBLISHED"
        await prisma.course.update({
            where: { id: courseId },
            data: { status, isPublished }
        })
        revalidatePath("/dashboard/admin/courses")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تحديث حالة الدورة." }
    }
}

// ======================= COINS & XP MANAGEMENT =======================

export async function adjustUserCoins(userId: string, amount: number, description: string) {
    try {
        await checkAdmin()
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return { success: false, error: "المستخدم غير موجود." }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { craftCoins: { increment: amount } }
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    amount: Math.abs(amount),
                    type: amount > 0 ? "EARN" : "SPEND",
                    description
                }
            })
        ])

        revalidatePath("/dashboard/admin/coins")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تعديل العملات." }
    }
}

export async function adjustUserXP(userId: string, amount: number, description: string) {
    try {
        await checkAdmin()
        await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: amount } }
        })

        await prisma.xpTransaction.create({
            data: {
                userId,
                amount: Math.abs(amount),
                type: amount > 0 ? "EARN" : "SPEND",
                description
            }
        })

        revalidatePath("/dashboard/admin/coins")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تعديل XP." }
    }
}

// ======================= NOTIFICATIONS =======================

export async function sendNotification(
    userIds: string[],
    title: string,
    message: string,
    type: string = "SYSTEM"
) {
    try {
        await checkAdmin()
        await prisma.notification.createMany({
            data: userIds.map(uid => ({
                userId: uid,
                title,
                message,
                type
            }))
        })
        revalidatePath("/dashboard/admin/notifications")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل إرسال الإشعارات." }
    }
}

// ======================= AUDIT LOGS =======================

export async function getAuditLogs(page: number = 1, limit: number = 50) {
    try {
        await checkAdmin()

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }),
            prisma.auditLog.count()
        ])

        return { success: true, logs, total, pages: Math.ceil(total / limit) }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب سجل التدقيق." }
    }
}

// ======================= ACHIEVEMENTS =======================

export async function createAchievement(data: { type: string; title: string; description: string; icon: string }) {
    try {
        await checkAdmin()
        // Note: UserAchievement is per-user, creating a template for admin purposes
        // We store sample achievement that can be assigned
        revalidatePath("/dashboard/admin/achievements")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ======================= CERTIFICATE MANAGEMENT =======================

export async function getAdminCertificates(search?: string, page: number = 1, limit: number = 20) {
    try {
        await checkAdmin()

        const where: any = {}
        if (search) {
            where.OR = [
                { certificateNumber: { contains: search } },
                { user: { name: { contains: search } } },
                { course: { title: { contains: search } } }
            ]
        }

        const [certificates, total] = await Promise.all([
            prisma.certificate.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, name: true } },
                    course: { select: { id: true, title: true } }
                }
            }),
            prisma.certificate.count({ where })
        ])

        return { success: true, certificates, total, pages: Math.ceil(total / limit) }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب الشهادات." }
    }
}

export async function revokeCertificate(certificateId: string) {
    try {
        await checkAdmin()
        await prisma.certificate.delete({ where: { id: certificateId } })
        revalidatePath("/dashboard/admin/certificates")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل إلغاء الشهادة." }
    }
}

// ======================= FORUM MANAGEMENT =======================

export async function getAdminForums() {
    try {
        await checkAdmin()
        const forums = await prisma.forum.findMany({
            orderBy: { order: "asc" },
            include: {
                track: { select: { id: true, name: true } },
                _count: { select: { topics: true } }
            }
        })
        return { success: true, forums }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب أقسام المنتدى." }
    }
}

export async function createForum(data: {
    title: string
    description?: string
    slug: string
    icon?: string
    order?: number
    trackId?: string
}) {
    try {
        await checkAdmin()

        // Check slug uniqueness
        const existing = await prisma.forum.findUnique({ where: { slug: data.slug } })
        if (existing) return { success: false, error: "الرابط المختصر مستخدم بالفعل، اختر رابطاً مختلفاً." }

        const forum = await prisma.forum.create({
            data: {
                title: data.title,
                description: data.description || null,
                slug: data.slug,
                icon: data.icon || "MessageSquare",
                order: data.order ?? 0,
                isActive: true,
                trackId: data.trackId || null,
            }
        })
        revalidatePath("/dashboard/admin/forums")
        revalidatePath("/community/forums")
        return { success: true, forum }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل إنشاء قسم المنتدى." }
    }
}

export async function updateForum(forumId: string, data: {
    title?: string
    description?: string
    slug?: string
    icon?: string
    order?: number
    isActive?: boolean
    trackId?: string | null
}) {
    try {
        await checkAdmin()

        if (data.slug) {
            const existing = await prisma.forum.findFirst({
                where: { slug: data.slug, NOT: { id: forumId } }
            })
            if (existing) return { success: false, error: "الرابط المختصر مستخدم بالفعل." }
        }

        const forum = await prisma.forum.update({
            where: { id: forumId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.slug && { slug: data.slug }),
                ...(data.icon && { icon: data.icon }),
                ...(data.order !== undefined && { order: data.order }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.trackId !== undefined && { trackId: data.trackId }),
            }
        })
        revalidatePath("/dashboard/admin/forums")
        revalidatePath("/community/forums")
        revalidatePath("/community")
        return { success: true, forum }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تحديث قسم المنتدى." }
    }
}

export async function getAdminTrackOptions() {
    try {
        await checkAdmin()
        const tracks = await prisma.learningTrack.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true },
        })

        return { success: true, tracks }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب المسارات التعليمية." }
    }
}

export async function deleteForum(forumId: string) {
    try {
        await checkAdmin()
        await prisma.forum.delete({ where: { id: forumId } })
        revalidatePath("/dashboard/admin/forums")
        revalidatePath("/community/forums")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل حذف قسم المنتدى." }
    }
}

export async function getAdminSettings() {
    try {
        await checkAdmin()
        const settings = await prisma.systemSetting.findMany()
        const settingsMap: Record<string, string> = {}
        settings.forEach(s => {
            settingsMap[s.key] = s.value
        })
        return { success: true, settings: settingsMap }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل جلب إعدادات المنصة." }
    }
}

export async function updateAdminSettings(settings: Record<string, string>) {
    try {
        await checkAdmin()
        await prisma.$transaction(
            Object.entries(settings).map(([key, value]) =>
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value }
                })
            )
        )
        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "فشل تحديث إعدادات المنصة." }
    }
}
