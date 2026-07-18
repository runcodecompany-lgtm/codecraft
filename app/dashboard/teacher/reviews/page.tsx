import React from "react"
import { getTeacherAllReviews } from "@/actions/review"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Star, MessageSquare, BookOpen, AlertCircle } from "lucide-react"
import ReviewsListClient from "./reviews-list-client"

export const dynamic = "force-dynamic"

export default async function TeacherReviewsPage() {
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch reviews for courses taught by this teacher
  const res = await getTeacherAllReviews()
  const reviews = res.success && res.reviews ? res.reviews : []

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Title */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Star className="w-7 h-7 text-amber-500 fill-amber-500/10" />
          <span>التقييمات والمراجعات</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">تفاعل مع مراجعات طلابك، وأجب عن استفساراتهم حول المناهج التعليمية.</p>
      </div>

      {/* Reviews list client editor */}
      <ReviewsListClient initialReviews={reviews} />

    </div>
  )
}
