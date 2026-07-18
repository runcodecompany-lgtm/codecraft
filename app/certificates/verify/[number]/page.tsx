// app/certificates/verify/[number]/page.tsx
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { ShieldCheck, Award, Calendar, User, BookOpen, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  params: Promise<{ number: string }>
}

export async function generateMetadata({ params }: Props) {
  const { number } = await params
  return {
    title: `التحقق من الشهادة ${number} | Code Craft Core`,
    description: `نظام التحقق الرسمي من صحة وموثوقية الشهادات الأكاديمية الصادرة عن منصة Code Craft Core.`,
  }
}

export default async function CertificateVerificationPage({ params }: Props) {
  const { number } = await params

  // Fetch certificate details from database
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: number },
    include: {
      user: {
        select: { name: true, email: true },
      },
      course: {
        select: { title: true, description: true },
      },
    },
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 py-16" dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 sm:p-10 shadow-2xl text-center space-y-8 animate-fade-in">
        {/* Verification Status Header */}
        {certificate ? (
          <div className="space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-emerald-400">
                شهادة معتمدة وموثقة!
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                تم التحقق من الرقم التسلسلي بنجاح ومطابقته بقاعدة بياناتنا الرسمية.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-rose-400">
                تعذر التحقق من الشهادة!
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                الرقم التسلسلي المدخل غير صحيح أو لم يصدر عن منصة Code Craft Core.
              </p>
            </div>
          </div>
        )}

        {/* Verification Details Box */}
        {certificate ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5 text-right">
            {/* Owner */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-900">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 mt-0.5">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500">اسم الخريج المعتمد</span>
                <span className="text-base font-black text-slate-200">
                  {certificate.user.name || "مستخدم منصة كرافت"}
                </span>
              </div>
            </div>

            {/* Course */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-900">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500">الدورة التدريبية</span>
                <span className="text-base font-black text-violet-400">
                  {certificate.course.title}
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {certificate.course.description}
                </p>
              </div>
            </div>

            {/* Issue Date */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-900">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500">تاريخ إصدار الشهادة</span>
                <span className="text-sm font-bold text-slate-200">
                  {formatDate(certificate.createdAt)}
                </span>
              </div>
            </div>

            {/* Serial number */}
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500">الرقم التسلسلي للشهادة</span>
                <span className="text-sm font-bold font-mono text-amber-400 select-all">
                  {certificate.certificateNumber}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            تنبيه أمان: يرجى التأكد من كتابة الرقم التسلسلي للشهادة بشكل دقيق وبنفس الحروف الكبيرة. إذا كنت تعتقد أن هناك خطأً ما، يمكنك مراجعة الدعم الفني للمنصة.
          </div>
        )}

        {/* Action button */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>الذهاب للموقع الرئيسي</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
