import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/lib/supabase"
import { UserRole } from "@prisma/client"

// DELETE: حذف مستخدم (Admin فقط)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const caller = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin Client not initialized." }, { status: 500 })
    }

    await supabaseAdmin.auth.admin.deleteUser(id)
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

// PATCH: تحديث بيانات مستخدم (Admin فقط)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const caller = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin Client not initialized." }, { status: 500 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    const authUpdate: Record<string, string> = {}
    if (email) authUpdate.email = email
    if (password) authUpdate.password = password
    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role && Object.values(UserRole).includes(role)) {
      if (role === "SUPER_ADMIN" && (caller.role as string) !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only Super Admin can assign the Super Admin role." }, { status: 403 })
      }
      updateData.role = role as UserRole
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        craftCoins: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
