// components/profile-settings-form.tsx
"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfileAction } from "@/actions/auth"
import { getLearningTracks } from "@/actions/tracks"
import { updateUserTracks } from "@/actions/user-tracks"
import { Loader2, Save, User, Image, CheckCircle, GraduationCap, Upload } from "lucide-react"
import { uploadAvatar } from "@/lib/upload"

interface ProfileSettingsFormProps {
  userId: string
  initialName: string
  initialAvatar: string
  initialPrimaryTrackId?: string
  initialSecondaryTrackIds: string[]
  initialLearningGoals: string[]
}

interface TrackNode {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
  children: TrackNode[]
}

export default function ProfileSettingsForm({
  userId,
  initialName,
  initialAvatar,
  initialPrimaryTrackId,
  initialSecondaryTrackIds,
  initialLearningGoals,
}: ProfileSettingsFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  
  const [fullName, setFullName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [tracksTree, setTracksTree] = useState<TrackNode[]>([])
  
  // Combine all initial tracks into a single list of selected track IDs
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(() => {
    const list = [...initialSecondaryTrackIds]
    if (initialPrimaryTrackId) {
      list.push(initialPrimaryTrackId)
    }
    return Array.from(new Set(list))
  })
  
  const [learningGoals, setLearningGoals] = useState(initialLearningGoals.join("\n"))
  const [tracksLoading, setTracksLoading] = useState(true)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadTracks() {
      setTracksLoading(true)
      const result = await getLearningTracks()
      if (result.success && result.tracks) {
        setTracksTree(result.tracks as TrackNode[])
      }
      setTracksLoading(false)
    }

    loadTracks()
  }, [])

  const toggleTrack = (trackId: string) => {
    setSelectedTrackIds((current) =>
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (fullName.trim().length < 2) {
      setError("الاسم يجب أن يكون حرفين على الأقل.")
      return
    }

    if (selectedTrackIds.length === 0) {
      setError("يجب تحديد مسار تعليمي واحد على الأقل.")
      return
    }

    startTransition(async () => {
      const [profileResult, tracksResult] = await Promise.all([
        updateProfileAction(userId, {
          fullName: fullName.trim(),
          avatar: avatar.trim(),
        }),
        updateUserTracks(
          selectedTrackIds,
          learningGoals
            .split("\n")
            .map((goal) => goal.trim())
            .filter(Boolean),
        ),
      ])

      if (profileResult.success && tracksResult.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(profileResult.error || tracksResult.error || "فشل تحديث البيانات الشخصية.")
      }
    })
  }

  // Renders departments as headers and pathways as selectable checkboxes
  const renderTrackTreeCheckboxes = (nodes: TrackNode[]) => {
    return nodes.map((dept) => {
      // Department (root) - render as a group header, NOT a selectable checkbox
      const isDept = !dept.parentId
      if (isDept) {
        return (
          <div key={dept.id} className="mb-4">
            {/* Department header */}
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                {dept.name}
              </span>
            </div>

            {/* Pathways inside this department */}
            {dept.children && dept.children.length > 0 ? (
              <div className="space-y-1.5 pr-2">
                {dept.children.map((pathway) => {
                  const isChecked = selectedTrackIds.includes(pathway.id)
                  return (
                    <label
                      key={pathway.id}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                        isChecked
                          ? "border-indigo-500/50 bg-indigo-50/80 dark:bg-indigo-950/30 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTrack(pathway.id)}
                        className="rounded text-indigo-600 mt-0.5 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-gray-900 dark:text-white">
                          {pathway.name}
                        </span>
                        {pathway.description && (
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {pathway.description}
                          </span>
                        )}
                      </div>
                      {isChecked && (
                        <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      )}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 pr-2">لا توجد مسارات متاحة</p>
            )}
          </div>
        )
      }
      return null
    })
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {/* Name Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-500" />
          <span>الاسم الكامل</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="أدخل اسمك بالكامل"
          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-2">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
          <span>المسارات التعليمية المحددة</span>
        </label>

        {tracksLoading ? (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>جاري تحميل هيكل المسارات...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hierarchical checkbox tree */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 select-none">
              {renderTrackTreeCheckboxes(tracksTree)}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-850">
              <label className="text-xs font-bold text-slate-500">أهداف التعلم الشخصية</label>
              <textarea
                rows={3}
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                placeholder={"ضع كل هدف في سطر منفصل"}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Avatar Upload / URL */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-indigo-500" />
            <span>الصورة الشخصية</span>
          </label>
          <span className="text-[10px] text-slate-400">اختر رفع صورة أو وضع رابط</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Avatar preview */}
          <div className="sm:col-span-2 flex justify-center">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Upload input and Link input */}
          <div className="sm:col-span-10 flex gap-2">
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="رابط الصورة أو اختر ملفاً للرفع..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
              dir="ltr"
            />
            
            <input
              type="file"
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingAvatar(true)
                setError(null)
                const url = await uploadAvatar(file)
                if (url) {
                  setAvatar(url)
                } else {
                  setError("فشل رفع الصورة الشخصية، حاول مرة أخرى.")
                }
                setUploadingAvatar(false)
              }}
              className="hidden"
              id="avatar-file-upload"
            />
            <label
              htmlFor="avatar-file-upload"
              className="px-3.5 py-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer flex-shrink-0 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-right">
          {error}
        </div>
      )}

      {/* Success alert */}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 text-right flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>تم حفظ التعديلات والمسارات بنجاح!</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={pending || tracksLoading}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>حفظ التغييرات والمسارات</span>
      </button>
    </form>
  )
}
