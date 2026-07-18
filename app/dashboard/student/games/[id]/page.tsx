// app/dashboard/student/games/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import CodingGame from "@/components/coding-game"
import Link from "next/link"
import { ChevronLeft, Gamepad2, Trophy, Sparkles } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

const gameConfigs: Record<
  string,
  { title: string; description: string; difficulty: string; reward: number }
> = {
  "html-structure": {
    title: "بناء هيكل صفحة HTML",
    description: "ابنِ هيكلاً متكاملاً لصفحة ويب يشمل: header, nav, main, section, footer. اختبر مهاراتك الأساسية في HTML5.",
    difficulty: "BEGINNER",
    reward: 30,
  },
  "css-flexbox": {
    title: "تحدي CSS Flexbox",
    description: "صمّم شريط تنقّل متجاوب باستخدام Flexbox. يجب أن تكون العناصر مرتّبة أفقياً وتتوزّع بالتساوي.",
    difficulty: "BEGINNER",
    reward: 40,
  },
  "js-array-methods": {
    title: "مسابقة Array Methods",
    description: "استخدم map(), filter(), reduce() لحل سلسلة من تحديات المصفوفات في JavaScript. الحل الأنيق يمنحك نقاط مضاعفة!",
    difficulty: "INTERMEDIATE",
    reward: 60,
  },
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const config = gameConfigs[id]
  if (!config) return { title: "اللعبة غير موجودة" }
  return { title: `${config.title} — ساحة الألعاب التفاعلية` }
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  const config = gameConfigs[id]
  if (!config) notFound()

  // Fetch highest score from database
  const result = await prisma.gameResult.findUnique({
    where: {
      userId_gameType: {
        userId: session.id,
        gameType: id,
      },
    },
    select: { highScore: true, playCount: true },
  })

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Link
            href="/dashboard/student/games"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors animate-fade-in"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة لساحة البرمجة
          </Link>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/10">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black">{config.title}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full font-bold">
                {config.difficulty === "BEGINNER" ? "مبتدئ" : "متوسط"}
              </span>
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                اكسب +{config.reward} CC
              </span>
            </div>
          </div>

          {result && (
            <div className="flex gap-4 mt-4 text-xs text-slate-400 font-bold border-t border-slate-800/60 pt-3">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                أعلى نتيجة مسجلة: {result.highScore}
              </span>
              <span className="w-px h-3 bg-slate-800" />
              <span>مرات اللعب: {result.playCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game sandbox */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <CodingGame
          gameId={id}
          title={config.title}
          description={config.description}
        />
      </div>
    </main>
  )
}
