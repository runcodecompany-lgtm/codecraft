import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { supabaseAdmin } from '@/lib/supabase'

// حذف مستخدم
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Client not initialized' }, { status: 500 })
    }

    // 1. حذف من Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError) {
      console.error('Supabase Auth Delete Error:', authError)
      // نستمر في الحذف من Prisma حتى لو فشل Auth (ربما الحساب غير موجود أصلاً في Auth)
    }

    // 2. حذف من Prisma
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

// تحديث بيانات مستخدم
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { username, alias, email, password, role, image } = body

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Client not initialized' }, { status: 500 })
    }

    const data: any = {
      username,
      alias,
      email,
      role,
      image,
    }

    // 1. تحديث في Supabase Auth إذا تغيرت كلمة المرور أو البريد
    const authUpdateData: any = {}
    if (password) authUpdateData.password = password
    if (email) authUpdateData.email = email
    
    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData)
      if (authError) {
        console.error('Supabase Auth Update Error:', authError)
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // 2. تشفير كلمة المرور لـ Prisma إذا تغيرت
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    // 3. تحديث في Prisma
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        alias: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
