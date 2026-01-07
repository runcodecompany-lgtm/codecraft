import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="lg:mr-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-gray-500">أهلاً بك، {user.email}</span>
          </div>
          <div className="flex items-center">
            {/* يمكنك إضافة زر إشعارات أو بروفايل هنا */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
