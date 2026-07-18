// app/dashboard/student/certificates/page.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Award, Target, Trophy, Sparkles } from "lucide-react"
import StatCard from "@/components/stat-card"
import CertificatesGallery from "@/components/certificates-gallery"

export const dynamic = "force-dynamic"

export default async function StudentCertificatesPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch student certificates
  const certificates = await prisma.certificate.findMany({
    where: { userId: session.id },
    select: {
      id: true,
      certificateNumber: true,
      createdAt: true,
      course: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Count enrolled courses
  const enrolledCount = await prisma.enrollment.count({
    where: { userId: session.id },
  })

  // Count completed courses
  const completedCoursesCount = await prisma.enrollment.count({
    where: { userId: session.id, isCompleted: true },
  })

  const studentName = session.name || "طالب العلم"

  return (
    <div className="space-y-8" dir="rtl">
      {/* ── Page Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-100/80 dark:border-violet-950/40 bg-gradient-to-tr from-violet-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-bold mb-3">
            <Award className="h-3.5 w-3.5" />
            <span>الشهادات الأكاديمية والاعتماد</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">معرض الشهادات</h1>
          <p className="text-violet-200 text-sm mt-2 max-w-xl">
            اعرض وحمل جميع شهادات إتمام المقررات الدراسية الصادرة رسمياً لك من منصة Code Craft Core.
          </p>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="الشهادات المكتسبة"
          value={certificates.length}
          description="شهادة معتمدة رقمياً"
          icon={Award}
          iconColorClass="text-violet-500 dark:text-violet-400"
          gradientClass="from-violet-500/20 to-indigo-500/20"
        />
        <StatCard
          title="المقررات المنجزة"
          value={completedCoursesCount}
          description="من إجمالي مساراتك الدراسية"
          icon={Trophy}
          iconColorClass="text-emerald-500 dark:text-emerald-400"
          gradientClass="from-emerald-500/20 to-teal-500/20"
        />
        <StatCard
          title="الدورات النشطة"
          value={enrolledCount}
          description="مقررات قيد الدراسة حالياً"
          icon={Target}
          iconColorClass="text-amber-500 dark:text-amber-400"
          gradientClass="from-amber-500/20 to-orange-500/20"
        />
      </div>

      {/* ── Section Title ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          شهاداتي المعتمدة
        </h2>
        <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
          {certificates.length} شهادة
        </span>
      </div>

      {/* ── Gallery ────────────────────────────────────────────── */}
      <CertificatesGallery certificates={certificates} studentName={studentName} />
    </div>
  )
}
