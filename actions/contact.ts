// actions/contact.ts
"use server"

import prisma from "@/lib/prisma"
import { z } from "zod"
import { promises as fs } from "fs"
import path from "path"
import { createAuditLog } from "@/lib/foundation"

const contactSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  subject: z.string().min(3, "الموضوع يجب أن يكون 3 أحرف على الأقل"),
  message: z.string().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل"),
  captchaAnswer: z.preprocess((val) => Number(val), z.number({ message: "إجابة التحقق يجب أن تكون رقماً" })),
  expectedCaptcha: z.coerce.number(),
  honeypot: z.string().max(0, "كشف محاولة إرسال تلقائية (سبام)"),
})

export async function submitContactFormAction(data: unknown) {
  const parsed = contactSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { fullName, email, subject, message, captchaAnswer, expectedCaptcha } = parsed.data

  // CAPTCHA verification
  if (captchaAnswer !== expectedCaptcha) {
    return { error: "إجابة التحقق غير صحيحة، يرجى المحاولة مرة أخرى." }
  }

  try {
    // 1. Prepare directory and save message to local JSON database file
    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "contact-messages.json")

    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true })

    let existingMessages: any[] = []
    try {
      const fileData = await fs.readFile(filePath, "utf-8")
      existingMessages = JSON.parse(fileData)
    } catch {
      // File does not exist yet, start with empty list
    }

    const newMessage = {
      id: Math.random().toString(36).substring(2, 9),
      fullName,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    }

    existingMessages.push(newMessage)
    await fs.writeFile(filePath, JSON.stringify(existingMessages, null, 2), "utf-8")

    // 2. Audit Log (store in postgres DB)
    // Find if user is logged in
    let userId: string | null = null
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })
      if (dbUser) userId = dbUser.id
    } catch {
      // Ignored if user not found or db down
    }

    await createAuditLog(
      userId,
      "Contact Message Submitted",
      null,
      null,
      `Sender: ${fullName} (${email}) | Subject: ${subject}`
    )

    return { success: true, message: "تم إرسال رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن!" }
  } catch (error) {
    console.error("Error submitting contact form action:", error)
    return { error: "حدث خطأ غير متوقع أثناء إرسال الرسالة. يرجى المحاولة لاحقاً." }
  }
}
