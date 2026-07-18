import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/lib/supabase"
import { UserRole } from "@prisma/client"
import { randomBytes } from "crypto"

function generateReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase()
}

// GET: جلب جميع المستخدمين (Admin فقط)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const caller = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        craftCoins: true,
        streakCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST: إنشاء مستخدم جديد (Admin فقط)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const caller = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase Admin Client not initialized. Please add SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields: name, email, password, role" }, { status: 400 })
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}` }, { status: 400 })
    }

    if (role === "SUPER_ADMIN" && (caller.role as string) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only Super Admin can assign the Super Admin role." }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const newUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role: role as UserRole,
        referralCode: generateReferralCode(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
