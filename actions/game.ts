// actions/game.ts
"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { addCoins, addXp } from "@/lib/gamification"
import { revalidatePath } from "next/cache"

export async function submitGameScore(gameType: string, score: number) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً لحفظ نتيجتك." }
    }

    const userId = session.id
    const xpReward = 30
    const coinsReward = 50

    // Fetch existing game result
    const existing = await prisma.gameResult.findUnique({
      where: {
        userId_gameType: {
          userId,
          gameType,
        },
      },
    })

    let finalResult
    if (existing) {
      finalResult = await prisma.gameResult.update({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
        data: {
          playCount: { increment: 1 },
          lastScore: score,
          highScore: Math.max(existing.highScore, score),
          xpEarned: { increment: xpReward },
          coinsEarned: { increment: coinsReward },
        },
      })
    } else {
      finalResult = await prisma.gameResult.create({
        data: {
          userId,
          gameType,
          score,
          highScore: score,
          lastScore: score,
          playCount: 1,
          xpEarned: xpReward,
          coinsEarned: coinsReward,
        },
      })
    }

    // Award Rewards
    await addCoins(userId, coinsReward, `إكمال لعبة تفاعلية: ${gameType}`)
    await addXp(userId, xpReward, `إكمال لعبة تفاعلية: ${gameType}`)

    // Create Notification
    await createNotification(
      userId,
      "🎮 إنجاز في ساحة البرمجة التفاعلية!",
      `لقد أكملت تحدي "${gameType}" بنجاح وحصلت على +${xpReward} XP و +${coinsReward} عملة CC.`,
      "SYSTEM"
    )

    // Audit log
    await createAuditLog(
      userId,
      "Game Played",
      null,
      null,
      `Game: ${gameType}. Score: ${score}. Total plays: ${finalResult.playCount}`
    )

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/games")
    return {
      success: true,
      highScore: finalResult.highScore,
      playCount: finalResult.playCount,
      xpReward,
      coinsReward,
    }
  } catch (error) {
    console.error("Error submitting game score:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ نتيجة اللعبة." }
  }
}
