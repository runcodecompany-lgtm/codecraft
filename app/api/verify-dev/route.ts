import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  // Only allow this endpoint in development mode for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production mode" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")?.trim()

  if (!email) {
    return NextResponse.json({ error: "Email search parameter is required. Example: ?email=test@test.com" }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found in local database." }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: `تم تأكيد البريد الإلكتروني ${email} بنجاح في قاعدة البيانات المحلية!`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
