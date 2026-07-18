import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ role: "GUEST" })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    })

    return NextResponse.json({ role: user?.role || "GUEST" })
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
