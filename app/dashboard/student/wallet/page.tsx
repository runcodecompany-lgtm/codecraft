// app/dashboard/student/wallet/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Wallet, TrendingUp, TrendingDown, Coins, ArrowUpRight, ArrowDownRight, Zap, Gift, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentWalletPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  // Fetch transaction history
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  // Stats
  const totalEarned = transactions
    .filter((t) => t.type === "EARN")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSpent = transactions
    .filter((t) => t.type === "SPEND")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPenalties = transactions
    .filter((t) => t.type === "PENALTY")
    .reduce((sum, t) => sum + t.amount, 0)

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { craftCoins: true }
  })
  const craftCoins = dbUser?.craftCoins ?? 0

  const txTypeConfig = {
    EARN: {
      icon: ArrowUpRight,
      iconClass: "text-[#4A7C59] dark:text-emerald-400",
      bgClass: "bg-[#4A7C59]/10",
      borderClass: "border-[#4A7C59]/20",
      amountClass: "text-[#4A7C59] dark:text-emerald-450",
      prefix: "+",
      label: "مكسب",
    },
    SPEND: {
      icon: ArrowDownRight,
      iconClass: "text-rose-600 dark:text-rose-450",
      bgClass: "bg-rose-500/10",
      borderClass: "border-rose-500/20",
      amountClass: "text-rose-600 dark:text-rose-400",
      prefix: "-",
      label: "إنفاق",
    },
    PENALTY: {
      icon: AlertTriangle,
      iconClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/20",
      amountClass: "text-amber-600 dark:text-amber-400",
      prefix: "-",
      label: "غرامة",
    },
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const walletStats = [
    { title: "إجمالي المكسب", value: `${totalEarned.toLocaleString("ar")} CC`, desc: "مجموع ما اكتسبته 📈", icon: TrendingUp, color: "text-[#4A7C59]", bg: "from-[#4A7C59]/10 to-transparent dark:from-[#4A7C59]/20" },
    { title: "إجمالي المنفق", value: `${totalSpent.toLocaleString("ar")} CC`, desc: "مجموع ما أنفقته 🛒", icon: TrendingDown, color: "text-rose-500", bg: "from-rose-500/10 to-transparent dark:from-rose-500/20" },
    { title: "الغرامات", value: `${totalPenalties.toLocaleString("ar")} CC`, desc: "الجزاءات المفروضة ⚠️", icon: AlertTriangle, color: "text-amber-500", bg: "from-amber-500/10 to-transparent dark:from-amber-500/20" },
    { title: "عدد العمليات", value: transactions.length, desc: "إجمالي حركات حسابك", icon: Zap, color: "text-[#2B4C7E] dark:text-sky-400", bg: "from-[#2B4C7E]/10 to-transparent dark:from-[#2B4C7E]/20" },
  ]

  return (
    <div className="space-y-6 animate-fade-in relative pb-10" dir="rtl">
      {/* Decorative Ambient Background Lights */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#2B4C7E]/5 dark:bg-[#2B4C7E]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4A7C59]/5 dark:bg-[#4A7C59]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Page Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#141C2F]/85 backdrop-blur-md p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2B4C7E]/10 to-[#4A7C59]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2B4C7E]/10 border border-[#2B4C7E]/20 text-[#2B4C7E] text-xs font-black mb-3">
              <Wallet className="h-3.5 w-3.5" />
              <span>المحفظة الرقمية للمستخدم</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">رصيدي وحركاتي المالية</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-xl leading-relaxed">
              تتبّع رصيدك من عملات المنصة البرمجية Craft Coins وراجع كشوق حساب العمليات المالية اليومية وتفاصيل الإنفاق والمكاسب.
            </p>
          </div>

          {/* Balance display with glowing border */}
          <div className="relative group self-start lg:self-center">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 opacity-75 blur-md" />
            <div className="relative bg-[#141C2F] dark:bg-[#141C2F] border border-white/20 rounded-2xl p-5 text-center min-w-[160px] text-white">
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">الرصيد المتاح حالياً</p>
              <p className="text-3xl font-black text-amber-500">{craftCoins.toLocaleString("ar")}</p>
              <p className="text-amber-500 text-[10px] mt-1 font-bold">Craft Coins 🪙</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {walletStats.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F] p-5 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
              <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${item.bg} opacity-70 blur-xl group-hover:scale-125 transition-transform`} />
              <div className="flex items-center justify-between">
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.title}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{item.value}</p>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 font-medium">{item.desc}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 group-hover:rotate-6 transition-all flex-shrink-0">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── How to earn ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 p-5">
        <h3 className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-4">
          <Gift className="h-4 w-4 text-amber-500 animate-bounce" />
          كيف تكسب المزيد من عملات Craft Coins؟
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { action: "إتمام درس", reward: "+10 CC 🪙" },
            { action: "اجتياز اختبار", reward: "+10~70 CC 🎯" },
            { action: "إحالة صديق", reward: "+100 CC 🤝" },
            { action: "تحدي يومي", reward: "+30~150 CC ⚡" },
          ].map((item) => (
            <div key={item.action} className="text-center bg-white dark:bg-[#141C2F] rounded-2xl p-4 border border-amber-100 dark:border-amber-500/10 shadow-xs hover:border-amber-400/40 hover:scale-[1.01] transition-all">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-250">{item.action}</p>
              <p className="text-xs font-black text-amber-500 mt-1">{item.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transactions list ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#2B4C7E]" />
            سجل العمليات المالية والإنفاق
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            آخر {transactions.length} عملية
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-405 dark:text-slate-500 bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد عمليات مسجلة بعد</p>
            <p className="text-xs text-slate-400 mt-1">ابدأ التعلّم وحل التحديات البرمجية لكسب النقود والعملات!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const cfg = txTypeConfig[tx.type as keyof typeof txTypeConfig] ?? txTypeConfig.EARN
              const Icon = cfg.icon

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 bg-white dark:bg-[#141C2F] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-[#2B4C7E]/40 hover:shadow-xs transition-all shadow-xs"
                >
                  {/* Icon */}
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 border ${cfg.bgClass} ${cfg.borderClass}`}>
                    <Icon className={`h-5 w-5 ${cfg.iconClass}`} />
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-850 dark:text-white truncate">
                      {tx.description || "عملية مالية"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-left flex-shrink-0">
                    <span className={`text-sm font-black ${cfg.amountClass}`}>
                      {cfg.prefix}
                      {tx.amount} CC
                    </span>
                    <span className="block text-[9px] text-slate-405 dark:text-slate-400 font-bold uppercase mt-0.5">
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
