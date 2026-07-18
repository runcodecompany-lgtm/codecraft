import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserSquare2 } from "lucide-react"
import TeacherProfileClient from "./teacher-profile-client"

export const dynamic = "force-dynamic"

export default async function TeacherProfilePage() {
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch teacher profile
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.id }
  })

  // Normalize details
  const formattedProfile = {
    title: profile?.title || "",
    bio: profile?.bio || "",
    skills: profile?.skills || "",
    experience: profile?.experience ? JSON.parse(JSON.stringify(profile.experience)) : [],
    achievements: profile?.achievements ? JSON.parse(JSON.stringify(profile.achievements)) : [],
    socialLinks: profile?.socialLinks ? JSON.parse(JSON.stringify(profile.socialLinks)) : { github: "", linkedin: "", twitter: "", website: "" }
  }

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Title */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <UserSquare2 className="w-7 h-7 text-indigo-500" />
          <span>إعدادات ملف المعلم</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">نسّق ملفك العام الذي يظهر للطلاب والزوار على المنصة ليعكس خبراتك وإنجازاتك.</p>
      </div>

      {/* Profile Client Component */}
      <TeacherProfileClient profile={formattedProfile} />

    </div>
  )
}
