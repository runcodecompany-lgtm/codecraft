"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  createLearningTrackAction,
  deleteLearningTrackAction,
  getAdminTrackHierarchy,
  updateLearningTrackAction,
  upsertPlacementTestSettingsAction,
} from "@/actions/tracks"
import { getGlobalQuestionsAction } from "@/actions/admin-questions"
import {
  BookOpen,
  Folder,
  Layers,
  Plus,
  Save,
  Settings2,
  Trash2,
  ChevronDown,
  Brain,
  Database,
  HelpCircle,
  Search,
  X,
  Check,
  Edit,
} from "lucide-react"

type TrackItem = {
  id: string
  name: string
  description: string | null
  icon: string | null
  isActive: boolean
  parentId: string | null
  children: TrackItem[]
  placementTests: Array<{
    id: string
    title: string
    description: string | null
    questionCount: number
    timeLimitMinutes: number
    isActive: boolean
    useAi: boolean
    aiQuestionCount: number
    testQuestions: Array<{
      order: number
      question: {
        id: string
        questionText: string
        questionType: string
        difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
        options: any
        correctAnswer: string
        points: number
        category: string | null
      }
    }>
  }>
  _count: {
    courses: number
    userTracks: number
    forums: number
    qaQuestions: number
  }
}

const emptyTrackForm = {
  name: "",
  description: "",
  icon: "",
  parentId: "",
}

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState("")
  const [trackForm, setTrackForm] = useState(emptyTrackForm)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // Edit track state
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [editParentId, setEditParentId] = useState("")

  // Placement test settings
  const [placementTitle, setPlacementTitle] = useState("")
  const [placementDescription, setPlacementDescription] = useState("")
  const [placementTimeLimit, setPlacementTimeLimit] = useState("5")
  const [placementQuestionCount, setPlacementQuestionCount] = useState("10")
  const [placementIsActive, setPlacementIsActive] = useState(true)
  
  // Placement Test AI & Question States
  const [placementUseAi, setPlacementUseAi] = useState(false)
  const [placementAiQuestionCount, setPlacementAiQuestionCount] = useState("0")
  const [activeTab, setActiveTab] = useState<"general" | "questions">("general")
  const [globalBankQuestions, setGlobalBankQuestions] = useState<any[]>([])
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<any[]>([])
  
  const [showAddFromBankModal, setShowAddFromBankModal] = useState(false)
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  
  // Custom Question Form State
  const [customQText, setCustomQText] = useState("")
  const [customQDifficulty, setCustomQDifficulty] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER")
  const [customQOptions, setCustomQOptions] = useState<string[]>(["", "", "", ""])
  const [customQCorrect, setCustomQCorrect] = useState("")

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Find a node inside the tree recursively
  function findTrackInTree(nodes: TrackItem[], id: string): TrackItem | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children && node.children.length > 0) {
        const found = findTrackInTree(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedTrack = useMemo(
    () => findTrackInTree(tracks, selectedTrackId),
    [selectedTrackId, tracks]
  )

  // Flatten tracks for dropdown lists
  const flatTracks = useMemo(() => {
    function flatten(nodes: TrackItem[], depth = 0): Array<{ id: string; name: string }> {
      const result: Array<{ id: string; name: string }> = []
      nodes.forEach((node) => {
        result.push({
          id: node.id,
          name: "  ".repeat(depth) + (depth > 0 ? "├─ " : "") + node.name,
        })
        if (node.children && node.children.length > 0) {
          result.push(...flatten(node.children, depth + 1))
        }
      })
      return result
    }
    return flatten(tracks)
  }, [tracks])

  async function loadTracks() {
    const result = await getAdminTrackHierarchy()
    if (result.success && result.tracks) {
      setTracks(result.tracks as TrackItem[])
      
      // Auto-select first root track if nothing selected
      if (!selectedTrackId && result.tracks.length > 0) {
        setSelectedTrackId(result.tracks[0].id)
      }
    } else {
      setError(result.error || "فشل جلب بيانات المسارات.")
    }
  }

  useEffect(() => {
    void loadTracks()
    // Load global question bank once
    async function fetchBank() {
      const res = await getGlobalQuestionsAction()
      if (res.success && res.questions) {
        setGlobalBankQuestions(res.questions)
      }
    }
    void fetchBank()
  }, [])

  useEffect(() => {
    if (!selectedTrack) return

    setEditName(selectedTrack.name)
    setEditDescription(selectedTrack.description || "")
    setEditIcon(selectedTrack.icon || "")
    setEditParentId(selectedTrack.parentId || "")

    const existingPlacement = selectedTrack.placementTests[0]
    setPlacementTitle(existingPlacement?.title || `اختبار تحديد مستوى ${selectedTrack.name}`)
    setPlacementDescription(existingPlacement?.description || "")
    setPlacementTimeLimit(String(existingPlacement?.timeLimitMinutes || 5))
    setPlacementQuestionCount(String(existingPlacement?.questionCount || 10))
    setPlacementIsActive(existingPlacement?.isActive ?? true)
    setPlacementUseAi(existingPlacement?.useAi ?? false)
    setPlacementAiQuestionCount(String(existingPlacement?.aiQuestionCount || 0))

    if (existingPlacement && existingPlacement.testQuestions) {
      const bankIds: string[] = []
      const customQs: any[] = []
      existingPlacement.testQuestions.forEach((tq: any) => {
        if (tq.question.category) {
          bankIds.push(tq.question.id)
        } else {
          customQs.push(tq.question)
        }
      })
      setSelectedBankQuestionIds(bankIds)
      setCustomQuestions(customQs)
    } else {
      setSelectedBankQuestionIds([])
      setCustomQuestions([])
    }
  }, [selectedTrack])

  function resetAlerts() {
    setMessage(null)
    setError(null)
  }

  function toggleExpand(id: string) {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Recursive tree renderer for sidebar list
  function renderTreeList(nodes: TrackItem[], depth = 0) {
    return nodes.map((track) => {
      const isSelected = selectedTrackId === track.id
      const hasChildren = track.children && track.children.length > 0
      const isExpanded = !!expandedNodes[track.id]

      return (
        <div key={track.id} className="space-y-1">
          <div
            className={`group flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
              isSelected
                ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-950/20"
                : "border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/80"
            }`}
            style={{ marginRight: `${depth * 16}px` }}
          >
            <button
              type="button"
              onClick={() => setSelectedTrackId(track.id)}
              className="flex flex-1 items-center gap-2 text-right outline-none"
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(track.id)
                  }}
                  className="p-1 rounded hover:bg-gray-250 dark:hover:bg-slate-800 text-slate-400"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transform transition-transform ${
                      isExpanded ? "" : "rotate-90"
                    }`}
                  />
                </button>
              ) : (
                <span className="w-5" />
              )}
              {track.icon ? (
                <span className="text-sm">{track.icon}</span>
              ) : (
                <Folder className="h-4 w-4 text-slate-400" />
              )}
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 dark:text-white">{track.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {track.isActive ? "نشط" : "مؤرشف"} · {track._count.courses} دورات
                </p>
              </div>
            </button>
          </div>

          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {renderTreeList(track.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة شجرة المسارات التعليمية</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            إضافة وتصميم الأقسام الرئيسية والمسارات الفرعية بشكل شجري وتحديد مستويات ومحتوى كل مسار.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr,1.8fr]">
        {/* Right column: Track Tree & Add new form */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-indigo-500" />
              <h2 className="font-black text-gray-900 dark:text-white">إضافة قسم أو مسار جديد</h2>
            </div>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                resetAlerts()
                startTransition(async () => {
                  const result = await createLearningTrackAction({
                    name: trackForm.name,
                    description: trackForm.description,
                    icon: trackForm.icon,
                    parentId: trackForm.parentId || undefined,
                  })
                  if (result.success) {
                    setTrackForm(emptyTrackForm)
                    setMessage("تم إنشاء المسار/القسم بنجاح.")
                    await loadTracks()
                  } else {
                    setError(result.error || "فشل إنشاء المسار.")
                  }
                })
              }}
            >
              <input
                value={trackForm.name}
                onChange={(event) => setTrackForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="اسم القسم أو المسار (مثال: البرمجة أو اللغة الإنجليزية)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <textarea
                value={trackForm.description}
                onChange={(event) => setTrackForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="وصف مختصر للقسم أو المسار التعليمي"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={trackForm.icon}
                  onChange={(event) => setTrackForm((current) => ({ ...current, icon: event.target.value }))}
                  placeholder="رمز أو أيقونة (مثال: Code2)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />

                <select
                  value={trackForm.parentId}
                  onChange={(event) => setTrackForm((current) => ({ ...current, parentId: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">مسار أب (قسم رئيسي)</option>
                  {flatTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all"
              >
                <Save className="h-4 w-4" />
                حفظ القسم / المسار
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-500" />
              <span>هيكل شجرة المسارات الحالي</span>
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pl-1">
              {tracks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد مسارات مضافة بعد.</p>
              ) : (
                renderTreeList(tracks)
              )}
            </div>
          </div>
        </div>

        {/* Left column: Selected Node Details & Settings */}
        <div className="space-y-6">
          {!selectedTrack ? (
            <div className="rounded-3xl border border-dashed border-gray-250 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              اختر مسارًا أو قسمًا من الشجرة لعرض وتعديل تفاصيله.
            </div>
          ) : (
            <>
              {/* Detail Panel */}
              <div className="rounded-3xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">
                  تعديل بيانات: {selectedTrack.name}
                </h2>
                
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    resetAlerts()
                    startTransition(async () => {
                      const result = await updateLearningTrackAction(selectedTrack.id, {
                        name: editName,
                        description: editDescription,
                        icon: editIcon,
                        parentId: editParentId || null,
                      })
                      if (result.success) {
                        setMessage("تم تحديث المسار التعليمي بنجاح.")
                        await loadTracks()
                      } else {
                        setError(result.error || "فشل التحديث.")
                      }
                    })
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">اسم القسم / المسار</label>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder="الاسم"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">الوصف</label>
                    <textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      placeholder="الوصف"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">الأيقونة</label>
                      <input
                        value={editIcon}
                        onChange={(event) => setEditIcon(event.target.value)}
                        placeholder="الأيقونة"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">القسم الأب (الرئيسي)</label>
                      <select
                        value={editParentId}
                        onChange={(event) => setEditParentId(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">لا يوجد (مسار رئيسي)</option>
                        {flatTracks
                          .filter((t) => t.id !== selectedTrack.id) // Avoid self-relation loop
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all"
                      >
                        <Save className="h-3.5 w-3.5" />
                        حفظ التغييرات
                      </button>
                      
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          resetAlerts()
                          startTransition(async () => {
                            const result = await updateLearningTrackAction(selectedTrack.id, {
                              isActive: !selectedTrack.isActive,
                            })
                            if (result.success) {
                              setMessage(selectedTrack.isActive ? "تم أرشفة المسار." : "تم تفعيل المسار.")
                              await loadTracks()
                            } else {
                              setError(result.error || "فشل تحديث حالة المسار.")
                            }
                          })
                        }}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-900"
                      >
                        {selectedTrack.isActive ? "أرشفة" : "تفعيل"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-5 dark:border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 mb-3">إحصائيات مرتبطة بالمسار</h4>
                  <div className="grid gap-3 grid-cols-4">
                    {[
                      { label: "الدورات", value: selectedTrack._count.courses },
                      { label: "المستخدمون", value: selectedTrack._count.userTracks },
                      { label: "المنتديات", value: selectedTrack._count.forums },
                      { label: "الأسئلة", value: selectedTrack._count.qaQuestions },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-900/60 border border-gray-100/40 dark:border-slate-850">
                        <p className="text-lg font-black text-gray-900 dark:text-white">{item.value}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Placement Test Settings */}
              <div className="rounded-3xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-black text-gray-900 dark:text-white">إعدادات اختبار تحديد المستوى</h3>
                  </div>
                  <Link
                    href="/dashboard/admin/tracks/questions"
                    className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    بنك الأسئلة العالمي ↗
                  </Link>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-slate-800 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("general")}
                    className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      activeTab === "general"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    الإعدادات العامة والذكاء الاصطناعي
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("questions")}
                    className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      activeTab === "questions"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    الأسئلة الثابتة ({selectedBankQuestionIds.length + customQuestions.length})
                  </button>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    resetAlerts()
                    startTransition(async () => {
                      const result = await upsertPlacementTestSettingsAction({
                        trackId: selectedTrack.id,
                        title: placementTitle,
                        description: placementDescription,
                        timeLimitMinutes: Number(placementTimeLimit),
                        questionCount: Number(placementQuestionCount),
                        isActive: placementIsActive,
                        useAi: placementUseAi,
                        aiQuestionCount: Number(placementAiQuestionCount),
                        bankQuestionIds: selectedBankQuestionIds,
                        customQuestions: customQuestions.map(cq => ({
                          id: cq.id,
                          questionText: cq.questionText,
                          questionType: cq.questionType || "MULTIPLE_CHOICE",
                          difficulty: cq.difficulty,
                          options: cq.options,
                          correctAnswer: cq.correctAnswer,
                          points: cq.points || 1,
                        }))
                      })
                      if (result.success) {
                        setMessage("تم حفظ إعدادات اختبار تحديد المستوى والأسئلة بنجاح.")
                        await loadTracks()
                      } else {
                        setError(result.error || "فشل حفظ إعدادات الاختبار.")
                      }
                    })
                  }}
                >
                  {activeTab === "general" && (
                    <div className="space-y-3">
                      <input
                        value={placementTitle}
                        onChange={(event) => setPlacementTitle(event.target.value)}
                        placeholder="عنوان اختبار تحديد المستوى"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                      <textarea
                        value={placementDescription}
                        onChange={(event) => setPlacementDescription(event.target.value)}
                        placeholder="وصف الاختبار"
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">المدة بالدقائق</label>
                          <input
                            value={placementTimeLimit}
                            onChange={(event) => setPlacementTimeLimit(event.target.value)}
                            placeholder="المدة بالدقائق"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">العدد الكلي للأسئلة بالاختبار</label>
                          <input
                            value={placementQuestionCount}
                            onChange={(event) => setPlacementQuestionCount(event.target.value)}
                            placeholder="عدد الأسئلة الكلي"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* AI settings */}
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-950/30 dark:bg-indigo-950/5">
                        <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={placementUseAi}
                            onChange={(event) => setPlacementUseAi(event.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <span>تفعيل اختبار الذكاء الاصطناعي (AI Hybrid)</span>
                        </label>
                        {placementUseAi && (
                          <div className="mt-2 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-500">عدد الأسئلة المولدة بالذكاء الاصطناعي</label>
                            <input
                              type="number"
                              min={0}
                              value={placementAiQuestionCount}
                              onChange={(event) => setPlacementAiQuestionCount(event.target.value)}
                              placeholder="عدد أسئلة الذكاء الاصطناعي"
                              className="w-full rounded-xl border border-indigo-150 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                            <p className="text-[9px] text-slate-400">سيقوم النظام بتوليد هذا العدد من الأسئلة ديناميكياً لكل طالب عند بدء الاختبار بناءً على مواضيع المسار.</p>
                          </div>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={placementIsActive}
                          onChange={(event) => setPlacementIsActive(event.target.checked)}
                          className="rounded"
                        />
                        تفعيل الاختبار لهذا المسار
                      </label>
                    </div>
                  )}

                  {activeTab === "questions" && (
                    <div className="space-y-4">
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddFromBankModal(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-700 px-3 py-2.5 text-xs font-bold hover:bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-400"
                        >
                          <Database className="h-4 w-4" />
                          <span>إضافة من البنك</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQText("")
                            setCustomQDifficulty("BEGINNER")
                            setCustomQOptions(["", "", "", ""])
                            setCustomQCorrect("")
                            setShowAddCustomModal(true)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 text-slate-700 px-3 py-2.5 text-xs font-bold hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350"
                        >
                          <Plus className="h-4 w-4" />
                          <span>سؤال مخصص جديد</span>
                        </button>
                      </div>

                      {/* Linked Questions List */}
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {selectedBankQuestionIds.length === 0 && customQuestions.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-gray-200 rounded-2xl dark:border-slate-800">
                            لا توجد أسئلة ثابتة مضافة بعد. الاختبار سيعتمد على التراجع التلقائي أو الذكاء الاصطناعي فقط.
                          </div>
                        ) : (
                          <>
                            {/* Bank Questions */}
                            {selectedBankQuestionIds.map((qId) => {
                              const q = globalBankQuestions.find((qb) => qb.id === qId)
                              if (!q) return null
                              return (
                                <div key={q.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30 text-xs">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-slate-300 truncate">{q.questionText}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">من البنك | #{q.category} | {q.difficulty}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBankQuestionIds(prev => prev.filter(id => id !== qId))}
                                    className="text-rose-500 hover:text-rose-700 font-bold p-1"
                                  >
                                    إزالة
                                  </button>
                                </div>
                              )
                            })}

                            {/* Custom Questions */}
                            {customQuestions.map((q, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/10 dark:border-indigo-950/20 dark:bg-indigo-950/5 text-xs">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-indigo-900 dark:text-indigo-300 truncate">{q.questionText}</p>
                                  <p className="text-[9px] text-indigo-500 mt-1">سؤال مخصص للمسار | {q.difficulty}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomQText(q.questionText)
                                      setCustomQDifficulty(q.difficulty)
                                      setCustomQOptions([...q.options])
                                      setCustomQCorrect(q.correctAnswer)
                                      // store editing index in a temp state or use index matching
                                      setCustomQuestions(prev => prev.filter((_, i) => i !== idx))
                                      setShowAddCustomModal(true)
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold"
                                  >
                                    تعديل
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCustomQuestions(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 font-bold"
                                  >
                                    إزالة
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={isPending} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                    {isPending ? "جاري الحفظ..." : "حفظ إعدادات واختبار المسار"}
                  </button>
                </form>
              </div>

              {/* Safe Delete */}
              <div className="rounded-3xl border border-rose-105 bg-white p-6 shadow-sm dark:border-rose-950/20 dark:bg-slate-950">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">حذف أو أرشفة المسار</h3>
                </div>
                <p className="mb-4 text-xs text-slate-400 leading-relaxed">
                  إذا كان هذا القسم أو المسار يحتوي على دورات أو منتديات أو مستخدمين مسجلين، فسيقوم النظام بأرشفته (إلغاء تفعيله) تلقائياً لحفظ البيانات بدلاً من الحذف الفعلي.
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    resetAlerts()
                    startTransition(async () => {
                      const result = await deleteLearningTrackAction(selectedTrack.id)
                      if (result.success) {
                        setMessage(result.archived ? "تمت أرشفة المسار لوجود بيانات تعتمد عليه." : "تم حذف المسار بنجاح.")
                        setSelectedTrackId("")
                        await loadTracks()
                      } else {
                        setError(result.error || "فشل حذف المسار.")
                      }
                    })
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  تنفيذ الحذف الآمن
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal 1: Add Questions from Global Bank ────────────────── */}
      {showAddFromBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]">إضافة أسئلة من بنك الأسئلة</h3>
              <button
                type="button"
                onClick={() => setShowAddFromBankModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Selection list */}
            <div className="max-h-96 overflow-y-auto space-y-3 mb-6 pr-1">
              {globalBankQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">بنك الأسئلة العالمي فارغ حالياً.</div>
              ) : (
                globalBankQuestions.map((q) => {
                  const isChecked = selectedBankQuestionIds.includes(q.id)
                  return (
                    <label
                      key={q.id}
                      className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-slate-900 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedBankQuestionIds(prev => prev.filter(id => id !== q.id))
                          } else {
                            setSelectedBankQuestionIds(prev => [...prev, q.id])
                          }
                        }}
                        className="rounded text-indigo-600 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 dark:text-slate-300">{q.questionText}</p>
                        <p className="text-[9px] text-slate-400 mt-1">#{q.category} | {q.difficulty === "BEGINNER" ? "مبتدئ" : q.difficulty === "INTERMEDIATE" ? "متوسط" : "متقدم"}</p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddFromBankModal(false)}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                تأكيد الإضافة ({selectedBankQuestionIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Add Custom Question ─────────────────────────── */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]">إضافة سؤال مخصص للمسار</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نص السؤال</label>
                <textarea
                  required
                  value={customQText}
                  onChange={(e) => setCustomQText(e.target.value)}
                  placeholder="مثال: ما معنى الـ OOP في البرمجة؟"
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الصعوبة</label>
                <select
                  value={customQDifficulty}
                  onChange={(e) => setCustomQDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="BEGINNER">مبتدئ</option>
                  <option value="INTERMEDIATE">متوسط</option>
                  <option value="ADVANCED">متقدم</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 block">الاختيارات الأربعة وحدد الصحيح</label>
                {customQOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="custom-correct"
                      checked={customQCorrect === opt && opt !== ""}
                      disabled={opt === ""}
                      onChange={() => setCustomQCorrect(opt)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      placeholder={`خيار ${idx + 1}`}
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...customQOptions]
                        newOpts[idx] = e.target.value
                        setCustomQOptions(newOpts)
                        if (customQCorrect === opt) setCustomQCorrect(e.target.value)
                      }}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customQOptions.some(o => !o.trim())) {
                      alert("يرجى ملء جميع الاختيارات.")
                      return
                    }
                    if (!customQCorrect || !customQOptions.includes(customQCorrect)) {
                      alert("يرجى تحديد الخيار الصحيح.")
                      return
                    }
                    setCustomQuestions(prev => [
                      ...prev,
                      {
                        questionText: customQText,
                        questionType: "MULTIPLE_CHOICE",
                        difficulty: customQDifficulty,
                        options: customQOptions,
                        correctAnswer: customQCorrect,
                        points: 1,
                      },
                    ])
                    setShowAddCustomModal(false)
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  حفظ محلياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
