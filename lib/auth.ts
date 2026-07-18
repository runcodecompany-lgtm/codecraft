// lib/auth.ts
"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import bcrypt from "bcrypt"
import { randomBytes } from "crypto"
import { createAuditLog, createNotification, validateSession } from "@/lib/foundation"
import { calculateProfileCompletion, createEmailVerification } from "@/lib/identity-governance"

// Generates a unique referral code for a new user
async function generateUniqueReferralCode(): Promise<string> {
  let referralCode = ""
  let isUnique = false
  
  while (!isUnique) {
    const randomHex = randomBytes(3).toString("hex").toUpperCase()
    referralCode = `CRAFT-${randomHex}`
    
    const existing = await prisma.user.findUnique({
      where: { referralCode }
    })
    
    if (!existing) {
      isUnique = true
    }
  }
  
  return referralCode
}

// Fetch the currently authenticated user session from database with full system verification
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const localSessionToken = cookieStore.get("session_token")?.value
    if (localSessionToken) {
      const localSession = await validateSession(localSessionToken)
      if (localSession) {
        return await prisma.user.findUnique({
          where: { id: localSession.id },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            status: true,
            emailVerified: true,
            craftCoins: true,
            streakCount: true,
            referralCode: true,
            referredById: true,
            country: true,
            teacherProfile: {
              select: {
                applicationStatus: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        })
      }
    }

    const supabase = await createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    
    if (!authUser || error) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        craftCoins: true,
        streakCount: true,
        referralCode: true,
        referredById: true,
        country: true,
        teacherProfile: {
          select: {
            applicationStatus: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      }
    })

    // Account state / status validation check
    if (dbUser && dbUser.status !== "ACTIVE") {
      // If user account is suspended or inactive, deny session
      return null
    }

    if (dbUser && !dbUser.emailVerified && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return null
    }

    return dbUser
  } catch (err) {
    console.error("Error retrieving server session:", err)
    return null
  }
}

// User Registration with referral tracking and password hashing
export async function registerUser(
  formData: FormData | Record<string, string>, 
  explicitReferralCode?: string,
  learningSetup?: {
    primaryTrackId: string
    secondaryTrackIds: string[]
    learningGoals?: string[]
  },
) {
  // Normalize input from FormData or JSON object
  const email = (formData instanceof FormData ? formData.get("email") : formData.email)?.toString().trim()
  const password = (formData instanceof FormData ? formData.get("password") : formData.password)?.toString()
  const name = (formData instanceof FormData ? formData.get("name") : formData.name || formData.fullName)?.toString().trim()

  if (!email || !password || !name) {
    return { error: "جميع الحقول الأساسية مطلوبة." }
  }

  if (!learningSetup?.primaryTrackId) {
    return { error: "يجب اختيار مسار رئيسي واحد على الأقل." }
  }

  try {
    // 1. Sign up the user in Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "STUDENT",
        }
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    const authUser = authData.user
    if (!authUser) {
      return { error: "تعذر إنشاء حساب المستخدم في نظام المصادقة." }
    }

    // 2. Hash password locally with bcrypt to store in PostgreSQL
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 3. Resolve referral code from cookies or parameters
    const cookieStore = await cookies()
    const refCookie = cookieStore.get("ref")?.value
    const activeReferralCode = explicitReferralCode || refCookie

    // 4. Run database insertions inside a transaction to ensure atomic consistency
    const result = await prisma.$transaction(async (tx) => {
      const normalizedSecondaryTrackIds = Array.from(
        new Set(
          (learningSetup.secondaryTrackIds || [])
            .filter(Boolean)
            .filter((trackId) => trackId !== learningSetup.primaryTrackId),
        ),
      )
      const selectedTrackIds = [learningSetup.primaryTrackId, ...normalizedSecondaryTrackIds]

      const tracks = await tx.learningTrack.findMany({
        where: { id: { in: selectedTrackIds }, isActive: true },
        select: { id: true },
      })

      if (tracks.length !== selectedTrackIds.length) {
        throw new Error("بعض المسارات المحددة غير متاحة حالياً.")
      }

      // Check for double registration in local DB
      const existingDbUser = await tx.user.findUnique({
        where: { id: authUser.id }
      })

      if (existingDbUser) {
        return existingDbUser
      }

      let referredById: string | null = null
      let coinsToAward = 100 // Default base registration bonus
      let referrerName = ""

      if (activeReferralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: activeReferralCode }
        })

        if (referrer) {
          referredById = referrer.id
          coinsToAward = 200 // Bonus increase for referred users
          referrerName = referrer.name || "عضو"
        }
      }

      // Generate a brand new referral code for this user
      const referralCode = await generateUniqueReferralCode()

      // Create the User record in PostgreSQL
      const newUser = await tx.user.create({
        data: {
          id: authUser.id,
          email,
          passwordHash,
          name,
          country: (formData instanceof FormData ? formData.get("country") : formData.country)?.toString().trim() || null,
          role: "STUDENT",
          craftCoins: coinsToAward,
          streakCount: 0,
          referralCode,
          referredById,
          status: "ACTIVE",
        }
      })

      // Create initial economy transaction record
      await tx.transaction.create({
        data: {
          userId: newUser.id,
          amount: coinsToAward,
          type: "EARN",
          description: referredById 
            ? `هدية التسجيل عبر كود الإحالة (دعوة من ${referrerName})` 
            : "هدية الترحيب والتسجيل الأساسية",
        }
      })

      await tx.userTrack.createMany({
        data: [
          {
            userId: newUser.id,
            trackId: learningSetup.primaryTrackId,
            isPrimary: true,
          },
          ...normalizedSecondaryTrackIds.map((trackId) => ({
            userId: newUser.id,
            trackId,
            isPrimary: false,
          })),
        ],
      })

      await tx.learningProfile.create({
        data: {
          userId: newUser.id,
          primaryTrackId: learningSetup.primaryTrackId,
          learningGoals: learningSetup.learningGoals || [],
        },
      })

      return newUser
    })

    // 5. Clean up referral cookie if registration succeeded
    if (refCookie) {
      cookieStore.delete("ref")
    }

    // 6. Write to Audit Logs & Notifications
    const verification = await createEmailVerification(result.id, email)
    console.log("==========================================")
    console.log(`🔑 EMAIL VERIFICATION TOKEN FOR ${email}:`)
    console.log(`Token: ${verification.token}`)
    console.log(`Link: http://localhost:3000/verify-email?token=${verification.token}`)
    console.log("==========================================")
    await calculateProfileCompletion(result.id)
    await createAuditLog(result.id, "Register Success", null, null, `Registered with email: ${email}`)
    await createNotification(
      result.id,
      "مرحباً بك في Code Craft Core!",
      "تم إنشاء حسابك بنجاح مع تهيئة ملفك التعليمي متعدد المسارات. أكمل اختبارات تحديد المستوى لبدء خطة التعلم المناسبة لك.",
      "SYSTEM"
    )

    return { success: true, user: result }
  } catch (err) {
    console.error("Error during registration process:", err)
    return { error: "حدث خطأ غير متوقع أثناء تسجيل الحساب." }
  }
}

export async function registerTeacherUser(formData: FormData | Record<string, string>) {
  const email = (formData instanceof FormData ? formData.get("email") : formData.email)?.toString().trim()
  const password = (formData instanceof FormData ? formData.get("password") : formData.password)?.toString()
  const name = (formData instanceof FormData ? formData.get("name") : formData.name || formData.fullName)?.toString().trim()
  const country = (formData instanceof FormData ? formData.get("country") : formData.country)?.toString().trim()
  const specialization = (formData instanceof FormData ? formData.get("specialization") : formData.specialization)?.toString().trim()
  const bio = (formData instanceof FormData ? formData.get("bio") : formData.bio)?.toString().trim()
  const skills = (formData instanceof FormData ? formData.get("skills") : formData.skills)?.toString().trim()
  const yearsOfExperience = Number((formData instanceof FormData ? formData.get("yearsOfExperience") : formData.yearsOfExperience) || 0)
  const linkedin = (formData instanceof FormData ? formData.get("linkedin") : formData.linkedin)?.toString().trim()
  const portfolioWebsite = (formData instanceof FormData ? formData.get("portfolioWebsite") : formData.portfolioWebsite)?.toString().trim()
  const cvUrl = (formData instanceof FormData ? formData.get("cvUrl") : formData.cvUrl)?.toString().trim()

  if (!email || !password || !name || !country || !specialization || !bio || !skills || !yearsOfExperience || !cvUrl) {
    return { error: "جميع حقول طلب المعلم الأساسية مطلوبة، بما في ذلك السيرة الذاتية." }
  }

  if (password.length < 8) {
    return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "البريد الإلكتروني مسجل بالفعل." }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "TEACHER", teacherStatus: "PENDING" },
      },
    })

    if (authError) return { error: authError.message }
    if (!authData.user) return { error: "تعذر إنشاء حساب المعلم في نظام المصادقة." }

    const passwordHash = await bcrypt.hash(password, 12)
    const referralCode = await generateUniqueReferralCode()

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: authData.user!.id,
          email,
          passwordHash,
          name,
          country,
          role: "TEACHER",
          status: "ACTIVE",
          referralCode,
          teacherProfile: {
            create: {
              title: specialization,
              bio,
              country,
              specialization,
              skills,
              yearsOfExperience,
              linkedin: linkedin || null,
              portfolioWebsite: portfolioWebsite || null,
              cvUrl,
              applicationStatus: "PENDING",
            },
          },
        },
        include: { teacherProfile: true },
      })

      if (!user.teacherProfile) throw new Error("Teacher profile creation failed")

      await tx.teacherApplication.create({
        data: {
          teacherId: user.id,
          teacherProfileId: user.teacherProfile.id,
          status: "PENDING",
          documents: { cvUrl },
          approvalRequests: {
            create: {
              subjectType: "TEACHER",
              subjectId: user.teacherProfile.id,
              requestedById: user.id,
              status: "PENDING",
            },
          },
        },
      })

      return user
    })

    const verification = await createEmailVerification(result.id, email)
    console.log("==========================================")
    console.log(`🔑 EMAIL VERIFICATION TOKEN FOR TEACHER ${email}:`)
    console.log(`Token: ${verification.token}`)
    console.log(`Link: http://localhost:3000/verify-email?token=${verification.token}`)
    console.log("==========================================")
    await calculateProfileCompletion(result.id)
    await createAuditLog(result.id, "Teacher Submitted", null, null, `Teacher registration: ${email}`)
    await createNotification(result.id, "طلب المعلم قيد المراجعة", "تم إنشاء حسابك كمعلم بانتظار التحقق من البريد ومراجعة الإدارة.", "TEACHER_APPLICATION")

    return { success: true, user: result }
  } catch (err) {
    console.error("Error during teacher registration:", err)
    return { error: "حدث خطأ غير متوقع أثناء تسجيل طلب المعلم." }
  }
}
