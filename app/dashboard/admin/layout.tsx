import React from "react"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin-sidebar"
import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login?unauthorized=true")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
    })

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/login?unauthorized=true")
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 dark:bg-slate-900/10" dir="rtl">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-0">
                <AdminSidebar />
                <main className="flex-grow p-6 md:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
