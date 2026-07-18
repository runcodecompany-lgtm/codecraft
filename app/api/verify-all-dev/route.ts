import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production mode" }, { status: 403 })
  }

  try {
    const unverified = await prisma.user.findMany({
      where: { emailVerified: null },
      select: { id: true, email: true, name: true }
    })

    if (unverified.length === 0) {
      return NextResponse.json({ success: true, message: "لا يوجد أي مستخدمين غير مؤكدين في قاعدة البيانات." })
    }

    const updated = []
    for (const user of unverified) {
      const u = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
        select: { id: true, email: true, name: true, emailVerified: true }
      })
      updated.push(u)
    }

    return NextResponse.json({
      success: true,
      message: `تم تأكيد جميع الحسابات المعلقة (${unverified.length}) بنجاح!`,
      users: updated
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
