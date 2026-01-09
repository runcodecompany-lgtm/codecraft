import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { supabaseAdmin } from '@/lib/supabase'

// جلب جميع المستخدمين
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        alias: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// إنشاء مستخدم جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, alias, email, password, role, image } = body

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Client not initialized. Please add SUPABASE_SERVICE_ROLE_KEY to .env' }, { status: 500 })
    }

    // 1. التحقق من وجود المستخدم مسبقاً في Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username or Email already exists' }, { status: 400 })
    }

    // 2. إنشاء الحساب في Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد البريد تلقائياً ليتمكن من الدخول فوراً
      user_metadata: { username, alias, role }
    })

    if (authError) {
      console.error('Supabase Auth Error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 3. تشفير كلمة المرور لقاعدة بيانات Prisma
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. حفظ البيانات في Prisma
    const user = await prisma.user.create({
      data: {
        id: authUser.user.id, // نستخدم نفس الـ ID من Supabase لضمان التطابق
        username,
        alias,
        email,
        password: hashedPassword,
        role,
        image,
      },
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

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
