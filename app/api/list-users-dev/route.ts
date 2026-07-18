import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production mode" }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
