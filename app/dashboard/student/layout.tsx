// app/dashboard/student/layout.tsx
import React from "react"
import StudentSidebar from "@/components/student-sidebar"
import StudentDashboardHeader from "@/components/student-dashboard-header"

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--ccn-50)" }}>
      <StudentDashboardHeader />
      <div className="flex mx-auto" style={{ maxWidth: "1600px" }}>
        <StudentSidebar />
        <main
          className="flex-1 overflow-x-hidden"
          style={{
            minHeight: "calc(100vh - 72px)",
            padding: "var(--ccc-space-xl) var(--ccc-space-2xl)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}