// app/api/auth/session/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getServerSession()
    return NextResponse.json({ user })
  } catch (error) {
    console.error("API session retrieval error:", error)
    return NextResponse.json({ user: null, error: "Internal server error" }, { status: 500 })
  }
}
