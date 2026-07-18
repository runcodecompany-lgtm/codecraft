// actions/auth.ts
"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"
import { createAuditLog, createSession, revokeSession, createNotification } from "@/lib/foundation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import {
  calculateProfileCompletion,
  createEmailVerification,
  createPasswordReset,
  hashToken,
  verifyEmailToken,
} from "@/lib/identity-governance"

// Input validation schemas
const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  referralCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional(),
})

const passwordResetRequestSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
})

const passwordResetSchema = z.object({
  token: z.string().min(1, "رمز التحقق مطلوب"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
})

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").optional(),
  avatar: z.string().url("رابط الصورة الرمزية غير صالح").or(z.literal("")).optional(),
})

/**
 * Register user with validation, duplication check, password hashing, and audit log.
 */
export async function registerAction(data: unknown) {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { fullName, email, password, referralCode } = parsed.data

  try {
    // 1. Prevent duplicate email in local database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "البريد الإلكتروني مسجل بالفعل." }
    }

    // 2. Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 3. Register user with Supabase Auth to maintain synchronization
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          role: "STUDENT",
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    const authUser = authData.user
    if (!authUser) {
      return { error: "تعذر إنشاء الحساب في نظام المصادقة." }
    }

    // Generate unique referral code
    const uniqueRefCode = `CRAFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // 4. Handle referral system
    let referredById: string | null = null
    let coinsToAward = 100
    let referrerName = ""

    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      })
      if (referrer) {
        referredById = referrer.id
        coinsToAward = 200
        referrerName = referrer.name || "عضو"
      }
    }

    // Create user in postgres database
    const newUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email,
        passwordHash,
        name: fullName, // Legacy compatibility
        role: "STUDENT",
        craftCoins: coinsToAward,
        referralCode: uniqueRefCode,
        referredById,
        status: "ACTIVE",
      },
    })

    // Award welcome/referral coins
    await prisma.transaction.create({
      data: {
        userId: newUser.id,
        amount: coinsToAward,
        type: "EARN",
        description: referredById
          ? `هدية التسجيل عبر كود الإحالة (دعوة من ${referrerName})`
          : "هدية الترحيب والتسجيل الأساسية",
      },
    })

    // Send initial notification
    await createNotification(
      newUser.id,
      "مرحباً بك في Code Craft Core!",
      "تم إنشاء حسابك بنجاح. ابدأ مسيرتك البرمجية الممتعة الآن واكسب الإنجازات!",
      "SYSTEM"
    )

    // Log the register action in audit logs
    const verification = await createEmailVerification(newUser.id, email)
    console.log("==========================================")
    console.log(`🔑 EMAIL VERIFICATION TOKEN FOR ${email}:`)
    console.log(`Token: ${verification.token}`)
    console.log(`Link: http://localhost:3000/verify-email?token=${verification.token}`)
    console.log("==========================================")
    await calculateProfileCompletion(newUser.id)
    await createAuditLog(newUser.id, "Register Success", null, null, `Registered with email: ${email}`)

    return { success: true }
  } catch (error) {
    console.error("Registration action error:", error)
    return { error: "حدث خطأ غير متوقع أثناء تسجيل الحساب." }
  }
}

/**
 * Login user with validation, local session creation, status verification, and audit logs.
 */
export async function loginAction(data: unknown, ipAddress?: string | null, userAgent?: string | null) {
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password, rememberMe } = parsed.data

  try {
    // 1. Fetch user from local db
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: "بيانات الدخول غير صحيحة." }
    }

    // 2. Check account status (e.g. SUSPENDED or INACTIVE)
    if (user.status !== "ACTIVE") {
      return { error: "هذا الحساب تم تعطيله. يرجى التواصل مع الدعم الفني." }
    }

    if (!user.emailVerified && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { error: "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول." }
    }

    // 3. Verify password hash
    if (!user.passwordHash) {
      return { error: "يرجى تسجيل الدخول باستخدام طريقة المصادقة الخارجية المستخدمة عند التسجيل." }
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      // Log failed login attempt
      await createAuditLog(user.id, "Login Failed (Incorrect Password)", ipAddress, userAgent)
      return { error: "بيانات الدخول غير صحيحة." }
    }

    // 4. Authenticate through Supabase to sync auth state
    const supabase = await createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { error: authError.message }
    }

    // 5. Create local session
    const sessionToken = await createSession(user.id, ipAddress, userAgent, rememberMe)

    // Update last login date
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginDate: new Date() },
    })

    // 6. Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    })

    return { success: true, user }
  } catch (error) {
    console.error("Login action error:", error)
    return { error: "حدث خطأ غير متوقع أثناء تسجيل الدخول." }
  }
}

/**
 * Logout action to revoke session and delete cookies.
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      await revokeSession(sessionToken)
      cookieStore.delete("session_token")
    }

    // Logout from Supabase auth
    const supabase = await createClient()
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error("Logout action error:", error)
    return { error: "حدث خطأ غير متوقع أثناء تسجيل الخروج." }
  }
}

/**
 * Password Reset request (Generates a token and simulated sending email link).
 */
export async function requestPasswordResetAction(data: unknown) {
  const parsed = passwordResetRequestSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Return success even if email is not found to prevent user enumeration attacks
      return { success: true, message: "إذا كان البريد مسجلاً، فقد تم إرسال رابط إعادة التعيين." }
    }

    const reset = await createPasswordReset(user.id)

    // Log the request
    await createAuditLog(user.id, "Password Reset Requested", null, null, `Token generated: ${reset.token}`)

    // Simulation of sending mail (in real application, send token link /auth/reset-password?token=X)
    return {
      success: true,
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
      debugToken: reset.token, // For development/test environments
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return { error: "حدث خطأ أثناء معالجة الطلب." }
  }
}

/**
 * Reset password with token.
 */
export async function resetPasswordAction(data: unknown) {
  const parsed = passwordResetSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { token, password } = parsed.data

  try {
    const tokenHash = hashToken(token)
    const dbToken = await prisma.passwordReset.findUnique({
      where: { tokenHash },
    })

    if (!dbToken || dbToken.usedAt) {
      return { error: "رمز الاستعادة غير صالح أو قد تم استخدامه بالفعل." }
    }

    if (new Date() > dbToken.expiresAt) {
      await prisma.passwordReset.delete({ where: { tokenHash } })
      return { error: "رمز التحقق منتهي الصلاحية." }
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: dbToken.userId },
    })

    if (!user) {
      return { error: "المستخدم غير موجود." }
    }

    // Hash new password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Update locally and in Supabase
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Mark token as used
    await prisma.passwordReset.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    })

    // Log the change
    await createAuditLog(user.id, "Password Changed via Reset", null, null)

    return { success: true, message: "تم تغيير كلمة المرور بنجاح. يمكنك الدخول الآن." }
  } catch (error) {
    console.error("Reset password action error:", error)
    return { error: "حدث خطأ غير متوقع أثناء إعادة تعيين كلمة المرور." }
  }
}

export async function verifyEmailAction(data: unknown) {
  const schema = z.object({
    token: z.string().min(1),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const result = await verifyEmailToken(parsed.data.token)
    if (!result.success) {
      return { error: result.error }
    }

    return { success: true, message: "تم تأكيد البريد الإلكتروني بنجاح." }
  } catch (error) {
    console.error("Verify email action error:", error)
    return { error: "تعذر تأكيد البريد الإلكتروني." }
  }
}

/**
 * Update user profile (Name, avatar, status).
 */
export async function updateProfileAction(userId: string, data: unknown) {
  const parsed = profileUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const updateData: Record<string, string> = {}
    if (parsed.data.fullName) {
      updateData.name = parsed.data.fullName
    }
    if (parsed.data.avatar !== undefined) {
      updateData.avatar = parsed.data.avatar
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    await createAuditLog(userId, "Profile Updated", null, null, JSON.stringify(parsed.data))

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Update profile action error:", error)
    return { error: "حدث خطأ غير متوقع أثناء تحديث الملف الشخصي." }
  }
}
