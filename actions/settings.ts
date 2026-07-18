// actions/settings.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/auth"

export async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    })
    return setting ? setting.value : defaultValue
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error)
    return defaultValue
  }
}

export async function saveSystemSetting(key: string, value: string) {
  try {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return { success: false, error: "غير مصرح لك بتعديل إعدادات النظام." }
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })

    revalidatePath("/dashboard/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error(`Error saving system setting ${key}:`, error)
    return { success: false, error: error.message || "فشل حفظ إعداد النظام." }
  }
}
