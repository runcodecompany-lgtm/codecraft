// app/auth/redirect/page.tsx
// Server Component that reads the current Supabase user and redirects to the correct dashboard
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AuthRedirectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (!dbUser) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  const role = dbUser.role

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin')
  } else if (role === 'TEACHER') {
    redirect('/dashboard/teacher')
  } else if (role === 'STUDENT') {
    redirect('/dashboard/student')
  } else {
    redirect('/')
  }
}
