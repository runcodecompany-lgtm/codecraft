// components/coding-game.tsx
"use client"

import React, { useState, useEffect } from "react"
import { submitGameScore } from "@/actions/game"
import { 
  Gamepad2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Coins, 
  Zap, 
  Trophy, 
  Code,
  ArrowRight,
  HelpCircle
} from "lucide-react"
import Link from "next/link"

interface CodingGameProps {
  gameId: string
  title: string
  description: string
}

export default function CodingGame({ gameId, title, description }: CodingGameProps) {
  const [gameState, setGameState] = useState<"PLAYING" | "SUCCESS" | "ERROR">("PLAYING")
  const [submitting, setSubmitting] = useState(false)
  const [rewards, setRewards] = useState<{ coins: number; xp: number; highScore: number } | null>(null)

  // 1. Game Mode #1: CSS Flexbox
  const [justifyContent, setJustifyContent] = useState("flex-start")
  const [alignItems, setAlignItems] = useState("flex-start")
  const [flexDirection, setFlexDirection] = useState("row")

  // Target goals for CSS Flexbox game
  const flexTargetJustify = "space-between"
  const flexTargetAlign = "center"
  const flexTargetDirection = "row"

  // 2. Game Mode #2: HTML Semantic Structuring
  const [htmlBlocks, setHtmlBlocks] = useState([
    { id: "footer", label: "<footer> - تذييل الصفحة", correctOrder: 4, currentOrder: 2 },
    { id: "main", label: "<main> - المحتوى الرئيسي", correctOrder: 2, currentOrder: 0 },
    { id: "nav", label: "<nav> - شريط التنقل", correctOrder: 1, currentOrder: 3 },
    { id: "header", label: "<header> - ترويسة الصفحة", correctOrder: 0, currentOrder: 1 },
    { id: "section", label: "<section> - قسم فرعي", correctOrder: 3, currentOrder: 4 },
  ])

  // 3. Game Mode #3: JS Array Methods
  const [jsCode, setJsCode] = useState("")
  const jsTargetMethod = "filter"

  const handleFlexSubmit = async () => {
    if (
      justifyContent === flexTargetJustify &&
      alignItems === flexTargetAlign &&
      flexDirection === flexTargetDirection
    ) {
      handleGameWin()
    } else {
      setGameState("ERROR")
      setTimeout(() => setGameState("PLAYING"), 1500)
    }
  }

  const handleHtmlMove = (index: number, direction: "UP" | "DOWN") => {
    const newBlocks = [...htmlBlocks]
    const swapIndex = direction === "UP" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= htmlBlocks.length) return

    const temp = newBlocks[index].currentOrder
    newBlocks[index].currentOrder = newBlocks[swapIndex].currentOrder
    newBlocks[swapIndex].currentOrder = temp

    setHtmlBlocks(newBlocks)
  }

  const handleHtmlSubmit = () => {
    // Check if sorted correctly
    const sorted = [...htmlBlocks].sort((a, b) => a.currentOrder - b.currentOrder)
    const isCorrect = sorted.every((b, idx) => b.correctOrder === idx)

    if (isCorrect) {
      handleGameWin()
    } else {
      setGameState("ERROR")
      setTimeout(() => setGameState("PLAYING"), 1500)
    }
  }

  const handleJsSubmit = () => {
    const trimmed = jsCode.toLowerCase().trim()
    if (trimmed.includes(jsTargetMethod) && trimmed.includes("x > 10")) {
      handleGameWin()
    } else {
      setGameState("ERROR")
      setTimeout(() => setGameState("PLAYING"), 1500)
    }
  }

  const handleGameWin = async () => {
    setSubmitting(true)
    try {
      const response = await submitGameScore(gameId, 100) // 100 max score
      if (response.success) {
        setRewards({
          coins: response.coinsReward ?? 50,
          xp: response.xpReward ?? 30,
          highScore: response.highScore ?? 100,
        })
        setGameState("SUCCESS")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setGameState("PLAYING")
    setJustifyContent("flex-start")
    setAlignItems("flex-start")
    setFlexDirection("row")
    setJsCode("")
    // Reshuffle HTML blocks
    setHtmlBlocks([
      { id: "footer", label: "<footer> - تذييل الصفحة", correctOrder: 4, currentOrder: 2 },
      { id: "main", label: "<main> - المحتوى الرئيسي", correctOrder: 2, currentOrder: 0 },
      { id: "nav", label: "<nav> - شريط التنقل", correctOrder: 1, currentOrder: 3 },
      { id: "header", label: "<header> - ترويسة الصفحة", correctOrder: 0, currentOrder: 1 },
      { id: "section", label: "<section> - قسم فرعي", correctOrder: 3, currentOrder: 4 },
    ])
  }

  return (
    <div className="max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/90 p-6 lg:p-8 text-white relative overflow-hidden" dir="rtl">
      {/* ambient lights */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
      
      {gameState === "SUCCESS" && rewards ? (
        <div className="text-center py-12 space-y-6 animate-fade-in">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black bg-gradient-to-l from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              لقد انتصرت في التحدي! 🎉
            </h2>
            <p className="text-slate-400 text-sm">تم حفظ نتيجتك ومنح مكافأتك بنجاح.</p>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <span className="block text-slate-500 text-xs font-bold mb-1">نقاط الخبرة</span>
              <span className="text-2xl font-black text-cyan-400">+{rewards.xp} XP</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <span className="block text-slate-500 text-xs font-bold mb-1">العملات المكتسبة</span>
              <span className="text-2xl font-black text-amber-400">+{rewards.coins} CC</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-300 transition-all"
            >
              العب مجدداً
            </button>
            <Link
              href="/dashboard/student/games"
              className="px-6 py-3 rounded-xl bg-gradient-to-l from-cyan-600 to-indigo-600 hover:opacity-90 text-sm font-bold text-white transition-all flex items-center gap-1.5"
            >
              <span>العودة للساحة</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>

          {/* 1. CSS Flexbox Arena Game */}
          {gameId === "css-flexbox" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">المهمة المطلوبة:</p>
                <p>قم بمطابقة الخواص البرمجية لوضع العناصر الثلاثة داخل الحاوية بالتساوي أفقياً وفي المنتصف عمودياً.</p>
                <p className="text-cyan-400 mt-1 font-bold">الهدف: justify-content: space-between & align-items: center</p>
              </div>

              {/* Flex Visual Sandbox */}
              <div className="border border-dashed border-slate-700/80 rounded-2xl aspect-[3/1] bg-slate-950 relative flex p-4"
                style={{
                  justifyContent: justifyContent,
                  alignItems: alignItems,
                  flexDirection: flexDirection as any
                }}
              >
                {/* 3 blocks */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/10 font-bold text-white">📦</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/10 font-bold text-white">📦</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/10 font-bold text-white">📦</div>
              </div>

              {/* Select inputs */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">justify-content</label>
                  <select
                    value={justifyContent}
                    onChange={(e) => setJustifyContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="flex-start">flex-start</option>
                    <option value="center">center</option>
                    <option value="flex-end">flex-end</option>
                    <option value="space-between">space-between</option>
                    <option value="space-around">space-around</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">align-items</label>
                  <select
                    value={alignItems}
                    onChange={(e) => setAlignItems(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="flex-start">flex-start</option>
                    <option value="center">center</option>
                    <option value="flex-end">flex-end</option>
                    <option value="stretch">stretch</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">flex-direction</label>
                  <select
                    value={flexDirection}
                    onChange={(e) => setFlexDirection(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="row">row</option>
                    <option value="column">column</option>
                  </select>
                </div>
              </div>

              {/* Submit flex */}
              <button
                onClick={handleFlexSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-l from-cyan-600 to-indigo-600 hover:opacity-95 text-sm font-bold shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5 text-white"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تحقق من المحاذاة البرمجية</span>
              </button>
            </div>
          )}

          {/* 2. HTML Semantic Structure Game */}
          {gameId === "html-structure" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">المهمة المطلوبة:</p>
                <p>رتّب الوسوم الهيكلية التالية للحصول على تخطيط صفحة ويب صحيح وفق معايير HTML5 (من الأعلى للأسفل).</p>
              </div>

              {/* HTML Blocks List */}
              <div className="space-y-2.5">
                {[...htmlBlocks]
                  .sort((a, b) => a.currentOrder - b.currentOrder)
                  .map((block, index) => (
                    <div
                      key={block.id}
                      className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-cyan-400 font-mono" />
                        <span className="font-mono text-sm text-slate-100">{block.label}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleHtmlMove(index, "UP")}
                          disabled={index === 0}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleHtmlMove(index, "DOWN")}
                          disabled={index === htmlBlocks.length - 1}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Submit HTML */}
              <button
                onClick={handleHtmlSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-l from-cyan-600 to-indigo-600 hover:opacity-95 text-sm font-bold shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5 text-white"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تحقق من الهيكلية البرمجية</span>
              </button>
            </div>
          )}

          {/* 3. JS Array Methods Wizard */}
          {gameId === "js-array-methods" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">المهمة المطلوبة:</p>
                <p>لديك مصفوفة أرقام: <code className="font-mono text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">const numbers = [5, 12, 8, 130, 44]</code>.</p>
                <p>اكتب ميثود التصفية البرمجي المناسب في الفراغ أدناه للحصول على الأرقام الأكبر من 10 فقط.</p>
              </div>

              {/* Code Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-sm space-y-4">
                <div className="text-slate-500">// الكود البرمجي:</div>
                <div className="space-y-2 text-slate-300">
                  <div>const numbers = [5, 12, 8, 130, 44];</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>const filtered = numbers.</span>
                    <input
                      type="text"
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      placeholder="writeCode(x => x > 10)"
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-cyan-300 outline-none focus:border-cyan-500 font-mono w-64 text-left"
                      dir="ltr"
                    />
                    <span>;</span>
                  </div>
                  <div>console.log(filtered); // [12, 130, 44]</div>
                </div>
              </div>

              {/* Submit JS */}
              <button
                onClick={handleJsSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-l from-cyan-600 to-indigo-600 hover:opacity-95 text-sm font-bold shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5 text-white"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تحقق من الكود البرمجي</span>
              </button>
            </div>
          )}

          {/* Feedback error state */}
          {gameState === "ERROR" && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center text-xs text-rose-300 font-bold animate-pulse">
              الإجابة غير صحيحة، حاول التركيز والترتيب مجدداً! ❌
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return <div className={`h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`}></div>
}
