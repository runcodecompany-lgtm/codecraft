// lib/gamification.ts
import prisma from "@/lib/prisma"
import { createNotification, createAuditLog } from "@/lib/foundation"
import { revalidatePath } from "next/cache"

/**
 * Calculate the cumulative XP required to reach a specific level.
 * Level 1 -> Level 2 needs 100 XP (Total: 100)
 * Level 2 -> Level 3 needs 200 XP (Total: 300)
 * Level 3 -> Level 4 needs 300 XP (Total: 600)
 * Cumulative XP to reach level L = 50 * L * (L - 1)
 */
export function getCumulativeXpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

/**
 * Calculate XP needed to level up from the current level.
 * e.g. from level 1, needs 100 XP to reach level 2.
 */
export function getXpForNextLevel(level: number): number {
  return level * 100
}

/**
 * Add XP to user, manage level ups, and record XP transaction
 */
export async function addXp(userId: string, amount: number, description: string) {
  try {
    if (amount <= 0) return { success: false }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current user XP and Level
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, craftCoins: true, name: true },
      })

      if (!user) throw new Error("المستخدم غير موجود")

      const oldXp = user.xp
      const newXp = oldXp + amount
      let newLevel = user.level
      let leveledUp = false
      let totalBonusCoins = 0

      // 2. Check for level ups
      // Cumulative XP needed to reach newLevel + 1
      let xpNeededForNext = getCumulativeXpForLevel(newLevel + 1)
      while (newXp >= xpNeededForNext) {
        newLevel++
        const levelUpBonus = newLevel * 50
        totalBonusCoins += levelUpBonus
        leveledUp = true
        xpNeededForNext = getCumulativeXpForLevel(newLevel + 1)
      }

      // 3. Update user model
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
          craftCoins: leveledUp ? { increment: totalBonusCoins } : undefined,
        },
      })

      // 4. Record XP Transaction
      await tx.xpTransaction.create({
        data: {
          userId,
          amount,
          type: "EARN",
          description,
        },
      })

      // 5. If leveled up, log coin transaction and send notifications
      if (leveledUp) {
        await tx.transaction.create({
          data: {
            userId,
            amount: totalBonusCoins,
            type: "EARN",
            description: `مكافأة الصعود للمستوى ${newLevel}`,
          },
        })

        await tx.notification.create({
          data: {
            userId,
            title: `🎉 تهانينا! لقد صعدت للمستوى ${newLevel}`,
            message: `لقد وصلت إلى المستوى ${newLevel} وحصلت على مكافأة قدرها ${totalBonusCoins} عملة Craft Coins! واصل التميز.`,
            type: "SYSTEM",
          },
        })

        await tx.auditLog.create({
          data: {
            userId,
            action: "Level Up",
            details: `Leveled up from ${user.level} to ${newLevel}. Awarded ${totalBonusCoins} Coins.`,
          },
        })
      }

      return { updatedUser, leveledUp, newLevel, totalBonusCoins }
    })

    revalidatePath("/dashboard/student")
    return { success: true, ...result }
  } catch (error) {
    console.error("Error adding XP:", error)
    return { success: false, error: "فشل إضافة نقاط الخبرة" }
  }
}

/**
 * Add craft coins to user and record transaction
 */
export async function addCoins(userId: string, amount: number, description: string) {
  try {
    if (amount <= 0) return { success: false }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { craftCoins: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          type: "EARN",
          description,
        },
      }),
    ])

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/wallet")
    return { success: true }
  } catch (error) {
    console.error("Error adding coins:", error)
    return { success: false, error: "فشل إضافة العملات" }
  }
}

/**
 * Standard definitions for achievements
 */
export const ACHIEVEMENT_TYPES = {
  FIRST_LESSON: {
    title: "أول خطوة برمجية 🚀",
    description: "أكملت أول درس تعليمي لك على المنصة بنجاح.",
    icon: "BookOpen",
    xpReward: 100,
    coinsReward: 100,
  },
  FIRST_QUIZ: {
    title: "بطل الامتحانات 🧠",
    description: "اجتزت أول اختبار تقييمي تكيفي لك.",
    icon: "Brain",
    xpReward: 100,
    coinsReward: 100,
  },
  FIRST_CERTIFICATE: {
    title: "الخريج المعتمد 🎓",
    description: "حصلت على أول شهادة إتمام دورة رسمية.",
    icon: "Award",
    xpReward: 100,
    coinsReward: 100,
  },
  FIRST_COURSE: {
    title: "متقن المسار 🏆",
    description: "أكملت جميع دروس واختبارات دورة كاملة.",
    icon: "Trophy",
    xpReward: 100,
    coinsReward: 100,
  },
} as const

export type AchievementType = keyof typeof ACHIEVEMENT_TYPES

/**
 * Check and award an achievement if not already awarded
 */
export async function checkAndAwardAchievement(userId: string, type: AchievementType) {
  try {
    const config = ACHIEVEMENT_TYPES[type]
    if (!config) return { success: false, error: "نوع الإنجاز غير صالح" }

    // Check if user already has this achievement
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    })

    if (existing) return { success: false, alreadyAwarded: true }

    // Award achievement atomically
    await prisma.$transaction(async (tx) => {
      // 1. Create achievement record
      await tx.userAchievement.create({
        data: {
          userId,
          type,
          title: config.title,
          description: config.description,
          icon: config.icon,
        },
      })

      // 2. Create notification
      await tx.notification.create({
        data: {
          userId,
          title: `🏆 إنجاز جديد: ${config.title}`,
          message: `لقد حصلت على إنجاز "${config.title}"! تم منحك +${config.xpReward} XP و +${config.coinsReward} عملة.`,
          type: "SYSTEM",
        },
      })
    })

    // 3. Add rewards (XP and Coins)
    await addXp(userId, config.xpReward, `مكافأة إنجاز: ${config.title}`)
    await addCoins(userId, config.coinsReward, `مكافأة إنجاز: ${config.title}`)

    revalidatePath("/dashboard/student/achievements")
    return { success: true, awarded: true, title: config.title }
  } catch (error) {
    console.error("Error checking/awarding achievement:", error)
    return { success: false, error: "فشل التحقق من الإنجازات" }
  }
}

/**
 * Handle user daily login streaks and reward daily login
 */
export async function handleDailyLoginStreak(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginDate: true, streakCount: true, longestStreak: true },
    })

    if (!user) return { success: false }

    const now = new Date()
    const lastLogin = user.lastLoginDate

    // If logged in today already, do nothing
    if (lastLogin && lastLogin.toDateString() === now.toDateString()) {
      return { success: true, streakUpdated: false, streakCount: user.streakCount }
    }

    let newStreak = 1
    let rewardXp = 10
    let rewardCoins = 5

    if (lastLogin) {
      const oneDay = 24 * 60 * 60 * 1000
      const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
      const diffDays = Math.ceil(diffTime / oneDay)

      if (diffDays === 1 || (diffDays <= 2 && lastLogin.getDate() === now.getDate() - 1)) {
        // Streak continues
        newStreak = user.streakCount + 1
        // Bonus rewards for higher streaks
        rewardXp += Math.min(newStreak * 2, 50)
        rewardCoins += Math.min(newStreak, 20)
      }
    }

    const currentLongest = user.longestStreak || 0
    const newLongestStreak = newStreak > currentLongest ? newStreak : currentLongest

    await prisma.user.update({
      where: { id: userId },
      data: {
        streakCount: newStreak,
        longestStreak: newLongestStreak,
        lastLoginDate: now,
      },
    })

    // Award rewards
    await addXp(userId, rewardXp, `تسجيل دخول يومي متتالي (يوم ${newStreak})`)
    await addCoins(userId, rewardCoins, `مكافأة تسجيل دخول يومي متتالي`)

    await createNotification(
      userId,
      `🔥 شعلة التعلم: اليوم ${newStreak}!`,
      `أحسنت في الحفاظ على استمراريتك! حصلت اليوم على +${rewardXp} XP و +${rewardCoins} عملة.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/student")
    return { success: true, streakUpdated: true, streakCount: newStreak }
  } catch (error) {
    console.error("Error updating daily login streak:", error)
    return { success: false }
  }
}
