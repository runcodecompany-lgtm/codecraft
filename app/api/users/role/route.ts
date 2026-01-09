import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ role: 'WRITER' }) // القيمة الافتراضية إذا لم يوجد في Prisma
    }

    return NextResponse.json({ role: user.role })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
