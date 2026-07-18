import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"

// GET: جلب إعدادات المنصة العامة
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // إعدادات ثابتة — يمكن توسيعها لاحقاً بجدول Settings في Prisma
    return NextResponse.json({
      siteName: "Code Craft Core",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://codecraftcore.com",
      maintenanceMode: false,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// POST: تحديث الإعدادات (Admin فقط)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    // في المستقبل: حفظ الإعدادات في جدول مخصص
    console.log("Settings update requested:", body)

    return NextResponse.json({ success: true, message: "Settings saved." })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
