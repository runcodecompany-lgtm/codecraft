// app/dashboard/student/profile/page.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { 
  User, 
  Settings, 
  Trophy, 
  Award, 
  Zap, 
  Coins, 
  Flame, 
  Mail, 
  Calendar,
  ShieldAlert,
  GraduationCap,
  Target
} from "lucide-react"
import ProfileSettingsForm from "@/components/profile-settings-form"
import { getTrackRoleLabel, getDifficultyLabelWithEnglish } from "@/lib/learning"

export const dynamic = "force-dynamic"

export default async function StudentProfilePage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch full student database details
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      achievements: { orderBy: { createdAt: "desc" } },
      certificates: { include: { course: { select: { title: true } } } },
      _count: { select: { enrollments: true, quizAttempts: true, gameResults: true } },
      learningProfile: true,
      userTracks: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        include: {
          track: true,
        },
      },
      placementAttempts: {
        where: { trackId: { not: null } },
        orderBy: { createdAt: "desc" },
        include: {
          track: true,
        },
      },
    },
  })

  if (!dbUser) redirect("/login")

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const latestPlacementByTrack = new Map(
    dbUser.placementAttempts
      .filter((attempt) => attempt.trackId)
      .map((attempt) => [attempt.trackId as string, attempt]),
  )

  const profileStats = [
    { title: "نقاط الخبرة (XP)", value: `${dbUser.xp.toLocaleString("ar")} XP`, desc: "إجمالي تقدمك التراكمي", icon: Zap, color: "text-[#2B4C7E] dark:text-sky-400", bg: "from-[#2B4C7E]/10 to-transparent dark:from-[#2B4C7E]/20" },
    { title: "رصيد العملات", value: `${dbUser.craftCoins.toLocaleString("ar")} CC`, desc: "Craft Coins المتاحة", icon: Coins, color: "text-amber-500", bg: "from-amber-500/10 to-transparent dark:from-amber-500/20" },
    { title: "شعلة الاستمرارية", value: `${dbUser.streakCount} أيام`, desc: "أيام متواصلة من التعلم", icon: Flame, color: "text-orange-500", bg: "from-orange-500/10 to-transparent dark:from-orange-500/20" },
    { title: "الدورات المسجلة", value: dbUser._count.enrollments, desc: "مقررات قيد الدراسة", icon: GraduationCap, color: "text-[#4A7C59] dark:text-emerald-400", bg: "from-[#4A7C59]/10 to-transparent dark:from-[#4A7C59]/20" },
  ]

  return (
    <div className="space-y-8 animate-fade-in relative pb-10" dir="rtl">
      {/* Decorative Ambient Background Lights */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#2B4C7E]/5 dark:bg-[#2B4C7E]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4A7C59]/5 dark:bg-[#4A7C59]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Page Hero / Profile Header ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#141C2F]/80 backdrop-blur-xl p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2B4C7E]/10 to-[#4A7C59]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar circle with glow ring */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#2B4C7E] via-sky-400 to-[#4A7C59] opacity-75 blur-md group-hover:opacity-100 transition duration-300" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#141C2F] to-[#2B4C7E] border-2 border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-xl flex-shrink-0">
              {dbUser.avatar ? (
                <img
                  src={dbUser.avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                (dbUser.name || "ط").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
              )}
            </div>
          </div>

          <div className="space-y-2 text-center md:text-right flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white leading-tight">
              {dbUser.name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 px-2.5 py-1 rounded-xl">
                <Mail className="w-4 h-4 text-[#2B4C7E]" />
                {dbUser.email}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 px-2.5 py-1 rounded-xl">
                <Calendar className="w-4 h-4 text-[#4A7C59]" />
                عضو منذ: {formatDate(dbUser.createdAt)}
              </span>
              <span className="text-[#2B4C7E] dark:text-sky-400 font-black">
                مستوى المنصة {dbUser.level} 🌟
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {profileStats.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-5 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
              <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${item.bg} opacity-70 blur-xl group-hover:scale-125 transition-transform`} />
              <div className="flex items-center justify-between">
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.title}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{item.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 group-hover:rotate-6 transition-all flex-shrink-0">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tabs Content Columns ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Achievements & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2B4C7E]" />
              <span>ملف التعلم متعدد المسارات الشجري</span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {dbUser.userTracks.map((userTrack) => {
                const latestPlacement = latestPlacementByTrack.get(userTrack.trackId)

                return (
                  <div
                    key={userTrack.id}
                    className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-5 space-y-3 shadow-sm hover:border-[#2B4C7E]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white group-hover:text-[#2B4C7E] transition-colors">{userTrack.track.name}</h3>
                          <p className="text-[9px] font-black text-[#2B4C7E] dark:text-sky-400 tracking-wider mt-0.5">
                            {getTrackRoleLabel(userTrack.isPrimary)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#2B4C7E]/10 px-3 py-1 text-[9px] font-black text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-sky-300">
                          {getDifficultyLabelWithEnglish(userTrack.level)}
                        </span>
                      </div>

                      {userTrack.track.description && (
                        <p className="text-[11px] leading-relaxed text-slate-450 dark:text-slate-400 mt-2.5 line-clamp-2">
                          {userTrack.track.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-850/60">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 text-center">
                        <span className="block text-[9px] font-bold text-slate-400">تقدم المسار</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          {Math.round(userTrack.progress)}%
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 text-center">
                        <span className="block text-[9px] font-bold text-slate-400">اختبار التحديد</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          {latestPlacement ? `${latestPlacement.score} نقاط` : "غير مكتمل"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3">أهداف التعلم المسجلة</h3>
              {Array.isArray(dbUser.learningProfile?.learningGoals) && dbUser.learningProfile?.learningGoals.length ? (
                <div className="flex flex-wrap gap-2">
                  {(dbUser.learningProfile.learningGoals as string[]).map((goal, index) => (
                    <span
                      key={`${goal}-${index}`}
                      className="rounded-full border border-[#2B4C7E]/20 bg-[#2B4C7E]/10 px-3.5 py-1 text-xs font-bold text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-sky-300"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  لم يتم تحديد أهداف تعلم بعد. يمكنك إضافتها أو تعديلها من إعدادات الملف الشخصي.
                </p>
              )}
            </div>
          </div>

          {/* Section: Achievements */}
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>أحدث الإنجازات المفتوحة ({dbUser.achievements.length})</span>
            </h2>

            {dbUser.achievements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 rounded-3xl">
                لم تفتح أي إنجازات بعد. ابدأ حل التحديات والاختبارات لتجميع الشارات!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {dbUser.achievements.map((ach) => (
                  <div key={ach.id} className="flex gap-3 bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl items-center shadow-xs hover:shadow-md transition-all">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 text-center font-bold text-sm flex-shrink-0 animate-pulse">
                      🏆
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-850 dark:text-white">{ach.title}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Certificates */}
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2B4C7E]" />
              <span>الشهادات الأكاديمية الصادرة ({dbUser.certificates.length})</span>
            </h2>

            {dbUser.certificates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 rounded-3xl">
                لا توجد شهادات صادرة لك حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {dbUser.certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#2B4C7E]/30 transition-all">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white">{cert.course.title}</h4>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">الرقم: {cert.certificateNumber}</span>
                    </div>
                    
                    <span className="text-[10px] font-bold text-[#4A7C59] bg-[#4A7C59]/10 border border-[#4A7C59]/20 px-3 py-1 rounded-xl flex-shrink-0">
                      موثقة ونشطة ✓
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Settings Form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
              <Settings className="w-4 h-4 text-[#2B4C7E]" />
              <span>تعديل إعدادات الحساب</span>
            </h3>

            <ProfileSettingsForm
              userId={dbUser.id}
              initialName={dbUser.name || ""}
              initialAvatar={dbUser.avatar || ""}
              initialPrimaryTrackId={dbUser.learningProfile?.primaryTrackId || dbUser.userTracks.find((track) => track.isPrimary)?.trackId}
              initialSecondaryTrackIds={dbUser.userTracks.filter((track) => !track.isPrimary).map((track) => track.trackId)}
              initialLearningGoals={
                Array.isArray(dbUser.learningProfile?.learningGoals)
                  ? (dbUser.learningProfile.learningGoals as string[])
                  : []
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
