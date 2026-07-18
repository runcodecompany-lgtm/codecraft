"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { createNotification } from "@/lib/foundation"
import { revalidatePath } from "next/cache"
import { addXp, addCoins } from "@/lib/gamification"
import { z } from "zod"
import { actionRateLimit, getActionIdentifier } from "@/lib/rate-limiter"
import { evaluateAccess } from "@/lib/identity-governance"

// ─── Helpers ─────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
}

async function requireAuth(): Promise<string> {
    const userId = await getAuthUserId()
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً")
    const access = await evaluateAccess(userId, {
        allowedRoles: ["STUDENT", "TEACHER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
        requireEmailVerified: true,
    })
    if (!access.ok) throw new Error(access.error)
    return userId
}

// ═══════════════════════════════════════════════════════════════════
// 1. FORUMS
// ═══════════════════════════════════════════════════════════════════

const topicSchema = z.object({
    forumId: z.string().uuid(),
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").max(200),
    content: z.string().min(10, "المحتوى يجب أن يكون 10 أحرف على الأقل"),
    tags: z.string().optional(),
})

export async function createTopic(data: unknown) {
    const userId = await requireAuth()
    const parsed = topicSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const rl = actionRateLimit(`create-topic-${userId}`, 5, 60_000)
    if (!rl.allowed) return { error: "يمكنك إنشاء 5 مواضيع فقط في الدقيقة" }

    try {
        const topic = await prisma.forumTopic.create({
            data: {
                forumId: parsed.data.forumId,
                userId,
                title: parsed.data.title,
                content: parsed.data.content,
                tags: parsed.data.tags || null,
            },
        })

        // Activity + XP
        await createActivity(userId, "FORUM_TOPIC", topic.id, "ForumTopic", { title: parsed.data.title })
        await addXp(userId, 10, "إنشاء موضوع في المنتدى")

        revalidatePath(`/community/forums/${parsed.data.forumId}`)
        revalidatePath("/community")
        return { success: true, topic }
    } catch (error) {
        console.error("Error creating topic:", error)
        return { error: "حدث خطأ أثناء إنشاء الموضوع" }
    }
}

export async function updateTopic(topicId: string, data: { title?: string; content?: string; tags?: string }) {
    const userId = await requireAuth()
    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } })
    if (!topic || topic.userId !== userId) return { error: "لا يمكنك تعديل هذا الموضوع" }

    try {
        const updated = await prisma.forumTopic.update({
            where: { id: topicId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(data.tags !== undefined && { tags: data.tags }),
            },
        })
        revalidatePath(`/community/forums/topic/${topicId}`)
        return { success: true, topic: updated }
    } catch (error) {
        return { error: "فشل تحديث الموضوع" }
    }
}

export async function deleteTopic(topicId: string) {
    const userId = await requireAuth()
    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } })
    if (!topic || topic.userId !== userId) return { error: "لا يمكنك حذف هذا الموضوع" }

    try {
        await prisma.forumTopic.delete({ where: { id: topicId } })
        revalidatePath("/community")
        return { success: true }
    } catch (error) {
        return { error: "فشل حذف الموضوع" }
    }
}

export async function togglePinTopic(topicId: string) {
    await requireAuth()
    try {
        const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } })
        if (!topic) return { error: "الموضوع غير موجود" }
        const updated = await prisma.forumTopic.update({
            where: { id: topicId },
            data: { isPinned: !topic.isPinned },
        })
        revalidatePath(`/community/forums/topic/${topicId}`)
        return { success: true, isPinned: updated.isPinned }
    } catch {
        return { error: "فشل تحديث تثبيت الموضوع" }
    }
}

export async function toggleCloseTopic(topicId: string) {
    await requireAuth()
    try {
        const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } })
        if (!topic) return { error: "الموضوع غير موجود" }
        const updated = await prisma.forumTopic.update({
            where: { id: topicId },
            data: { isClosed: !topic.isClosed },
        })
        revalidatePath(`/community/forums/topic/${topicId}`)
        return { success: true, isClosed: updated.isClosed }
    } catch {
        return { error: "فشل تحديث حالة الموضوع" }
    }
}

// ── Forum Replies ─────────────────────────────────────────────────

const replySchema = z.object({
    topicId: z.string().uuid(),
    content: z.string().min(1, "الرد لا يمكن أن يكون فارغاً"),
    quoteId: z.string().uuid().optional(),
})

export async function createReply(data: unknown) {
    const userId = await requireAuth()
    const parsed = replySchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const rl = actionRateLimit(`create-reply-${userId}`, 15, 60_000)
    if (!rl.allowed) return { error: "يمكنك إرسال 15 رداً فقط في الدقيقة" }

    try {
        const reply = await prisma.forumReply.create({
            data: {
                topicId: parsed.data.topicId,
                userId,
                content: parsed.data.content,
                quoteId: parsed.data.quoteId || null,
            },
        })

        await addXp(userId, 5, "مشاركة في المنتدى")
        revalidatePath(`/community/forums/topic/${parsed.data.topicId}`)
        return { success: true, reply }
    } catch (error) {
        return { error: "فشل إضافة الرد" }
    }
}

export async function deleteReply(replyId: string) {
    const userId = await requireAuth()
    const reply = await prisma.forumReply.findUnique({ where: { id: replyId } })
    if (!reply || reply.userId !== userId) return { error: "لا يمكنك حذف هذا الرد" }

    try {
        await prisma.forumReply.delete({ where: { id: replyId } })
        revalidatePath(`/community/forums/topic/${reply.topicId}`)
        return { success: true }
    } catch {
        return { error: "فشل حذف الرد" }
    }
}

export async function updateReply(replyId: string, data: { content: string }) {
    const userId = await requireAuth()
    const reply = await prisma.forumReply.findUnique({ where: { id: replyId } })
    if (!reply || reply.userId !== userId) return { error: "لا يمكنك تعديل هذا الرد" }

    try {
        const updated = await prisma.forumReply.update({
            where: { id: replyId },
            data: {
                content: data.content,
            },
        })
        revalidatePath(`/community/forums/topic/${reply.topicId}`)
        return { success: true, reply: updated }
    } catch (error) {
        return { error: "فشل تحديث الرد" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 2. Q&A SYSTEM
// ═══════════════════════════════════════════════════════════════════

const questionSchema = z.object({
    title: z.string().min(10, "عنوان السؤال يجب أن يكون 10 أحرف على الأقل").max(300),
    content: z.string().min(20, "شرح السؤال يجب أن يكون 20 حرفاً على الأقل"),
    tags: z.string().optional(),
    trackId: z.string().uuid().optional(),
})

export async function askQuestion(data: unknown) {
    const userId = await requireAuth()
    const parsed = questionSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const rl = actionRateLimit(`ask-question-${userId}`, 3, 60_000)
    if (!rl.allowed) return { error: "يمكنك طرح 3 أسئلة فقط في الدقيقة" }

    try {
        const question = await prisma.qaQuestion.create({
            data: {
                userId,
                title: parsed.data.title,
                content: parsed.data.content,
                tags: parsed.data.tags || null,
                trackId: parsed.data.trackId || null,
            },
        })

        await createActivity(userId, "QUESTION", question.id, "Question", { title: parsed.data.title })
        await addXp(userId, 15, "طرح سؤال جديد")

        revalidatePath("/community/questions")
        return { success: true, question }
    } catch (error) {
        return { error: "فشل طرح السؤال" }
    }
}

export async function deleteQuestion(questionId: string) {
    const userId = await requireAuth()
    const q = await prisma.qaQuestion.findUnique({ where: { id: questionId } })
    if (!q || q.userId !== userId) return { error: "لا يمكنك حذف هذا السؤال" }

    try {
        await prisma.qaQuestion.delete({ where: { id: questionId } })
        revalidatePath("/community/questions")
        return { success: true }
    } catch {
        return { error: "فشل حذف السؤال" }
    }
}

export async function updateQuestion(questionId: string, data: { title?: string; content?: string; tags?: string }) {
    const userId = await requireAuth()
    const q = await prisma.qaQuestion.findUnique({ where: { id: questionId } })
    if (!q || q.userId !== userId) return { error: "لا يمكنك تعديل هذا السؤال" }

    try {
        const updated = await prisma.qaQuestion.update({
            where: { id: questionId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(data.tags !== undefined && { tags: data.tags }),
            },
        })
        revalidatePath(`/community/questions/${questionId}`)
        revalidatePath(`/community/questions`)
        return { success: true, question: updated }
    } catch (error) {
        return { error: "فشل تحديث السؤال" }
    }
}

// ── Answers ────────────────────────────────────────────────────────

const answerSchema = z.object({
    questionId: z.string().uuid(),
    content: z.string().min(10, "الإجابة يجب أن تكون 10 أحرف على الأقل"),
})

export async function postAnswer(data: unknown) {
    const userId = await requireAuth()
    const parsed = answerSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    try {
        const answer = await prisma.qaAnswer.create({
            data: {
                questionId: parsed.data.questionId,
                userId,
                content: parsed.data.content,
            },
        })

        // Update answer count
        await prisma.qaQuestion.update({
            where: { id: parsed.data.questionId },
            data: { answerCount: { increment: 1 } },
        })

        await createActivity(userId, "ANSWER", answer.id, "Answer", { questionId: parsed.data.questionId })
        await addXp(userId, 20, "الإجابة على سؤال")

        revalidatePath(`/community/questions/${parsed.data.questionId}`)
        return { success: true, answer }
    } catch (error) {
        return { error: "فشل إرسال الإجابة" }
    }
}

export async function acceptAnswer(answerId: string) {
    const userId = await requireAuth()
    const answer = await prisma.qaAnswer.findUnique({
        where: { id: answerId },
        include: { question: true },
    })
    if (!answer || answer.question.userId !== userId) return { error: "غير مصرح" }

    try {
        await prisma.$transaction([
            prisma.qaAnswer.update({
                where: { id: answerId },
                data: { isAccepted: true },
            }),
            prisma.qaQuestion.update({
                where: { id: answer.questionId },
                data: { isResolved: true },
            }),
        ])

        // Reputation reward for answer author
        await addReputation(answer.userId, 15, "ANSWER_ACCEPTED", `قبول إجابة في سؤال: ${answer.question.title}`)
        await addXp(answer.userId, 50, "قبول الإجابة كأفضل إجابة")

        revalidatePath(`/community/questions/${answer.questionId}`)
        return { success: true }
    } catch {
        return { error: "فشل قبول الإجابة" }
    }
}

export async function updateAnswer(answerId: string, data: { content: string }) {
    const userId = await requireAuth()
    const answer = await prisma.qaAnswer.findUnique({ where: { id: answerId } })
    if (!answer || answer.userId !== userId) return { error: "لا يمكنك تعديل هذه الإجابة" }

    try {
        const updated = await prisma.qaAnswer.update({
            where: { id: answerId },
            data: {
                content: data.content,
            },
        })
        revalidatePath(`/community/questions/${answer.questionId}`)
        return { success: true, answer: updated }
    } catch (error) {
        return { error: "فشل تحديث الإجابة" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 3. VOTING
// ═══════════════════════════════════════════════════════════════════

export async function toggleVote(targetId: string, targetType: "QUESTION" | "ANSWER", value: number) {
    const userId = await requireAuth()
    if (value !== 1 && value !== -1) return { error: "قيمة التصويت غير صالحة" }

    const rl = actionRateLimit(`vote-${userId}`, 30, 60_000)
    if (!rl.allowed) return { error: "طلبات كثيرة جداً" }

    try {
        const existing = await prisma.vote.findUnique({
            where: { userId_targetId_targetType: { userId, targetId, targetType } },
        })

        if (existing) {
            if (existing.value === value) {
                // Remove vote
                await prisma.vote.delete({ where: { id: existing.id } })
                await updateVoteCount(targetId, targetType, -value)
            } else {
                // Change vote
                await prisma.vote.update({
                    where: { id: existing.id },
                    data: { value },
                })
                await updateVoteCount(targetId, targetType, value * 2) // Reverse old + add new
            }
        } else {
            await prisma.vote.create({
                data: { userId, targetId, targetType, value },
            })
            await updateVoteCount(targetId, targetType, value)
        }

        revalidatePath(`/community/questions/${targetId}`)
        revalidatePath(`/community/questions`)
        return { success: true }
    } catch (error) {
        return { error: "فشل التصويت" }
    }
}

async function updateVoteCount(targetId: string, targetType: string, delta: number) {
    if (targetType === "QUESTION") {
        await prisma.qaQuestion.update({
            where: { id: targetId },
            data: { voteCount: { increment: delta } },
        })
    } else if (targetType === "ANSWER") {
        await prisma.qaAnswer.update({
            where: { id: targetId },
            data: { voteCount: { increment: delta } },
        })
    }
}

// ═══════════════════════════════════════════════════════════════════
// 4. REACTIONS (Like, Love, Helpful, Insightful)
// ═══════════════════════════════════════════════════════════════════

export async function toggleReaction(targetId: string, targetType: string, type: string) {
    const userId = await requireAuth()
    const allowedTypes = ["LIKE", "LOVE", "HELPFUL", "INSIGHTFUL"]
    if (!allowedTypes.includes(type)) return { error: "نوع التفاعل غير مدعوم" }

    try {
        const existing = await prisma.reaction.findUnique({
            where: { userId_targetId_targetType_type: { userId, targetId, targetType, type } },
        })

        if (existing) {
            await prisma.reaction.delete({ where: { id: existing.id } })
            return { success: true, active: false }
        } else {
            await prisma.reaction.create({
                data: { userId, targetId, targetType, type },
            })

            if (type === "HELPFUL") {
                // Award reputation for helpful reaction
                if (targetType === "ANSWER") {
                    const answer = await prisma.qaAnswer.findUnique({ where: { id: targetId } })
                    if (answer) await addReputation(answer.userId, 2, "HELPFUL_REACTION", "إجابة مفيدة")
                }
            }

            return { success: true, active: true }
        }
    } catch (error) {
        return { error: "فشل التفاعل" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 5. FOLLOW SYSTEM
// ═══════════════════════════════════════════════════════════════════

export async function toggleFollow(targetUserId: string) {
    const userId = await requireAuth()
    if (userId === targetUserId) return { error: "لا يمكنك متابعة نفسك" }

    try {
        const existing = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
        })

        if (existing) {
            await prisma.$transaction([
                prisma.follow.delete({ where: { id: existing.id } }),
                prisma.user.update({ where: { id: userId }, data: { totalFollowing: { decrement: 1 } } }),
                prisma.user.update({ where: { id: targetUserId }, data: { totalFollowers: { decrement: 1 } } }),
            ])
            return { success: true, following: false }
        } else {
            await prisma.$transaction([
                prisma.follow.create({ data: { followerId: userId, followingId: targetUserId } }),
                prisma.user.update({ where: { id: userId }, data: { totalFollowing: { increment: 1 } } }),
                prisma.user.update({ where: { id: targetUserId }, data: { totalFollowers: { increment: 1 } } }),
            ])

            // Notification for followed user
            const follower = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
            await createNotification(targetUserId, "متابعة جديدة", `قام ${follower?.name || "عضو"} بمتابعتك`, "SOCIAL")

            return { success: true, following: true }
        }
    } catch (error) {
        return { error: "فشل تحديث المتابعة" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 6. ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════

export async function createActivity(userId: string, type: string, targetId?: string, targetType?: string, data?: any) {
    try {
        await prisma.activity.create({
            data: {
                userId,
                type,
                targetId: targetId || null,
                targetType: targetType || null,
                data: data || undefined,
            },
        })
    } catch (error) {
        console.error("Error creating activity:", error)
    }
}

export async function getActivityFeed(userId?: string, page = 1, limit = 20) {
    try {
        const where: any = {}
        if (userId) where.userId = userId

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
            }),
            prisma.activity.count({ where }),
        ])

        return { activities, total, page, totalPages: Math.ceil(total / limit) }
    } catch (error) {
        return { activities: [], total: 0, page: 1, totalPages: 0 }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 7. CHALLENGES
// ═══════════════════════════════════════════════════════════════════

export async function checkAndUpdateChallengeProgress(userId: string, action: string, targetType?: string) {
    try {
        // Get active challenges matching this action
        const challenges = await prisma.challenge.findMany({
            where: {
                isActive: true,
                // Matching challenges by requirements JSON (contains action field)
                // We'll filter in application layer
            },
        })

        for (const challenge of challenges) {
            const reqs = (challenge.requirements as any) || {}
            if (reqs.action !== action) continue
            if (reqs.targetType && reqs.targetType !== targetType) continue

            // Find or create completion record
            const completion = await prisma.challengeCompletion.upsert({
                where: {
                    challengeId_userId: { challengeId: challenge.id, userId },
                },
                update: {
                    progress: { increment: 1 },
                    isCompleted: true, // Will be checked below
                },
                create: {
                    challengeId: challenge.id,
                    userId,
                    progress: 1,
                },
            })

            // Check if completed
            const targetCount = reqs.count || 1
            if (completion.progress >= targetCount && !completion.isCompleted) {
                await prisma.challengeCompletion.update({
                    where: { id: completion.id },
                    data: { isCompleted: true, completedAt: new Date() },
                })

                // Award rewards
                if (challenge.xpReward > 0) await addXp(userId, challenge.xpReward, `مكافأة التحدي: ${challenge.title}`)
                if (challenge.coinsReward > 0) await addCoins(userId, challenge.coinsReward, `مكافأة التحدي: ${challenge.title}`)

                await createNotification(userId, `🏆 تحديث: ${challenge.title}`, `أكملت التحدي وحصلت على ${challenge.xpReward} XP و ${challenge.coinsReward} عملة!`, "SYSTEM")
            }
        }
    } catch (error) {
        console.error("Error checking challenge progress:", error)
    }
}

export async function getActiveChallenges(type?: string) {
    try {
        const where: any = { isActive: true }
        if (type) where.type = type

        return await prisma.challenge.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 10,
        })
    } catch {
        return []
    }
}

// ═══════════════════════════════════════════════════════════════════
// 8. REPUTATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

export async function addReputation(userId: string, amount: number, type: string, description: string) {
    try {
        await prisma.$transaction([
            prisma.reputationTransaction.create({
                data: { userId, amount, type, description },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { reputation: { increment: amount } },
            }),
        ])
    } catch (error) {
        console.error("Error adding reputation:", error)
    }
}

// ═══════════════════════════════════════════════════════════════════
// 9. PRIVATE MESSAGING
// ═══════════════════════════════════════════════════════════════════

const messageSchema = z.object({
    receiverId: z.string().uuid(),
    content: z.string().min(1, "الرسالة لا يمكن أن تكون فارغة").max(5000),
})

export async function sendMessage(data: unknown) {
    const senderId = await requireAuth()
    const parsed = messageSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const rl = actionRateLimit(`message-${senderId}`, 10, 60_000)
    if (!rl.allowed) return { error: "يمكنك إرسال 10 رسائل فقط في الدقيقة" }

    try {
        const message = await prisma.privateMessage.create({
            data: {
                senderId,
                receiverId: parsed.data.receiverId,
                content: parsed.data.content,
            },
        })

        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } })
        await createNotification(parsed.data.receiverId, "رسالة خاصة جديدة", `لديك رسالة جديدة من ${sender?.name || "عضو"}`, "SOCIAL")

        return { success: true, message }
    } catch (error) {
        return { error: "فشل إرسال الرسالة" }
    }
}

export async function markMessageRead(messageId: string) {
    const userId = await requireAuth()
    try {
        await prisma.privateMessage.updateMany({
            where: { id: messageId, receiverId: userId },
            data: { isRead: true, readAt: new Date() },
        })
        return { success: true }
    } catch {
        return { error: "فشل تحديث حالة القراءة" }
    }
}

export async function getConversation(userId1: string, userId2: string) {
    await requireAuth()
    try {
        return await prisma.privateMessage.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            orderBy: { createdAt: "asc" },
            take: 100,
        })
    } catch {
        return []
    }
}

export async function editMessage(messageId: string, newContent: string) {
    const userId = await requireAuth()
    if (!newContent.trim() || newContent.length > 5000) {
        return { error: "محتوى الرسالة غير صالح" }
    }
    try {
        const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } })
        if (!msg || msg.senderId !== userId) {
            return { error: "لا يمكنك تعديل هذه الرسالة" }
        }
        if (msg.isDeleted) {
            return { error: "لا يمكن تعديل رسالة محذوفة" }
        }
        await prisma.privateMessage.update({
            where: { id: messageId },
            data: { content: newContent.trim(), isEdited: true, editedAt: new Date() },
        })
        return { success: true }
    } catch {
        return { error: "فشل تعديل الرسالة" }
    }
}

export async function deleteMessage(messageId: string) {
    const userId = await requireAuth()
    try {
        const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } })
        if (!msg || msg.senderId !== userId) {
            return { error: "لا يمكنك حذف هذه الرسالة" }
        }
        if (msg.isDeleted) {
            return { error: "الرسالة محذوفة بالفعل" }
        }
        await prisma.privateMessage.update({
            where: { id: messageId },
            data: { isDeleted: true, content: "" },
        })
        return { success: true }
    } catch {
        return { error: "فشل حذف الرسالة" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 10. REPORTING
// ═══════════════════════════════════════════════════════════════════

export async function reportContent(targetId: string, targetType: string, reason: string, description?: string) {
    const userId = await requireAuth()
    const rl = actionRateLimit(`report-${userId}`, 5, 60_000)
    if (!rl.allowed) return { error: "يمكنك الإبلاغ 5 مرات فقط في الدقيقة" }

    try {
        await prisma.report.create({
            data: {
                reporterId: userId,
                targetId,
                targetType,
                reason,
                description: description || null,
            },
        })
        return { success: true }
    } catch {
        return { error: "فشل الإبلاغ" }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 11. ACTIVITY LOG (DAU/WAU tracking)
// ═══════════════════════════════════════════════════════════════════

export async function logActivity(action: string, targetType?: string, targetId?: string, metadata?: any) {
    const userId = await getAuthUserId()
    if (!userId) return

    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                targetType: targetType || null,
                targetId: targetId || null,
                metadata: metadata || undefined,
            },
        })
    } catch (error) {
        // Silent fail for analytics
        console.error("Error logging activity:", error)
    }
}
