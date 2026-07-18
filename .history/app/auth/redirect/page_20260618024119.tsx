// app/auth/redirect/page.tsx
// Server Component that reads the user role and redirects to correct dashboard
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AuthRedirectPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role === 'SUPER_ADMIN' || session.role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin')
  } else if (session.role === 'TEACHER') {
    redirect('/dashboard/teacher')
  } else if (session.role === 'STUDENT') {
    redirect('/dashboard/student')
  } else {
    redirect('/')
  }
}
