"use client"

import React, { useState } from "react"
import { updateTeacherProfile } from "@/actions/teacher-profile"
import {
  Save, Plus, Trash2, Briefcase, Award,
  Share2, Linkedin, Github, Twitter, Globe,
  Info, AlertCircle, Sparkles, Upload, Camera
} from "lucide-react"
import { uploadImage } from "@/lib/upload"

export default function TeacherProfileClient({ profile: initialProfile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Fields
  const [title, setTitle] = useState(initialProfile.title)
  const [bio, setBio] = useState(initialProfile.bio)
  const [skills, setSkills] = useState(initialProfile.skills)

  // Social links
  const [socialLinks, setSocialLinks] = useState({
    github: initialProfile.socialLinks?.github || "",
    linkedin: initialProfile.socialLinks?.linkedin || "",
    twitter: initialProfile.socialLinks?.twitter || "",
    website: initialProfile.socialLinks?.website || ""
  })

  // Experiences lists
  const [experiences, setExperiences] = useState<any[]>(initialProfile.experience || [])
  const [newExp, setNewExp] = useState({ period: "", role: "" })

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar || "")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const result = await uploadImage(file)
    if (result) {
      setAvatarUrl(result)
      // Save avatar to database immediately
      const res = await updateTeacherProfile({ avatar: result })
      if (res.success) {
        setStatusMsg({ type: "success", text: "تم رفع الصورة وحفظها بنجاح!" })
        // Force refresh to show updated avatar
        window.location.reload()
      } else {
        setStatusMsg({ type: "error", text: "تم رفع الصورة لكن فشل حفظها." })
      }
    } else {
      setStatusMsg({ type: "error", text: "فشل رفع الصورة." })
    }
    setUploadingAvatar(false)
  }

  // Achievements lists
  const [achievements, setAchievements] = useState<string[]>(initialProfile.achievements || [])
  const [newAch, setNewAch] = useState("")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMsg(null)

    const res = await updateTeacherProfile({
      title,
      bio,
      skills,
      experience: experiences,
      achievements,
      socialLinks
    })

    if (res.success) {
      setStatusMsg({ type: "success", text: "تم حفظ الملف التعريفي بنجاح وجعله مرئياً!" })
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل تحديث البيانات." })
    }
    setLoading(false)
  }

  const handleAddExperience = () => {
    if (!newExp.period || !newExp.role) return
    setExperiences([...experiences, newExp])
    setNewExp({ period: "", role: "" })
  }

  const handleRemoveExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx))
  }

  const handleAddAchievement = () => {
    if (!newAch.trim()) return
    setAchievements([...achievements, newAch.trim()])
    setNewAch("")
  }

  const handleRemoveAchievement = (idx: number) => {
    setAchievements(achievements.filter((_, i) => i !== idx))
  }

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">

      {/* Basic Data fields - Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6">

        {/* Basic profile info card */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          {/* Avatar upload section */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-900">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-2xl text-white shadow-md overflow-hidden group">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 opacity-60" />
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                <Upload className="w-6 h-6 text-white" />
              </label>
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white text-sm">الصورة الشخصية</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">اضغط على الصورة لتغييرها (PNG, JPG)</p>
              {uploadingAvatar && <span className="text-[10px] text-indigo-500 font-bold">جاري الرفع...</span>}
            </div>
          </div>

          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500" />
            <span>البيانات المهنية الأساسية</span>
          </h2>

          {statusMsg && (
            <div className={`p-4 rounded-xl border ${statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
              } text-sm font-semibold`}>
              {statusMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-350">المسمى الوظيفي / التخصص العلمي</label>
              <input
                type="text"
                placeholder="مثال: دكتور علوم الحاسب وخبير الويب"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-350">المهارات التقنية (افصل بينها بفاصلة)</label>
              <input
                type="text"
                placeholder="مثال: React.js, TypeScript, Next.js, Node.js"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-350">نبذة تعريفية / السيرة الذاتية المفصلة</label>
              <textarea
                rows={5}
                placeholder="اكتب نبذة مهنية تغطي مسارك العلمي وخبراتك..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm resize-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Experience Timeline Editor card */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-955 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <span>الخبرات المهنية والتاريخ الوظيفي</span>
          </h2>

          {/* List of experiences */}
          <div className="space-y-3">
            {experiences.length === 0 ? (
              <p className="text-xs text-gray-400 italic">لا توجد خبرات مسجلة حالياً.</p>
            ) : (
              <div className="space-y-2">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-55/25 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 text-xs">
                    <div className="flex gap-3">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg shrink-0">
                        {exp.period}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">{exp.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add experience inputs */}
          <div className="p-4 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-900 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-gray-900 dark:text-white">إضافة خبرة جديدة</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="الفترة الزمنية (مثل: 2020 - الآن)"
                value={newExp.period}
                onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                className="px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="المسمى أو طبيعة الخبرة"
                value={newExp.role}
                onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                className="md:col-span-2 px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-lg text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للجدول الزمني</span>
            </button>
          </div>
        </div>

        {/* Achievements Timeline card */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-955 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Award className="w-5 h-5 text-indigo-500" />
            <span>الجوائز والإنجازات الأكاديمية</span>
          </h2>

          <div className="space-y-3">
            {achievements.length === 0 ? (
              <p className="text-xs text-gray-400 italic">لا توجد إنجازات مضافة حالياً.</p>
            ) : (
              <div className="space-y-2">
                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-55/25 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 text-xs">
                    <span className="font-bold text-gray-800 dark:text-slate-200">{ach}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-900 rounded-2xl flex gap-3">
            <input
              type="text"
              placeholder="مثال: وسام التميز لتدريس البرمجيات لعام 2025"
              value={newAch}
              onChange={(e) => setNewAch(e.target.value)}
              className="flex-grow px-3 py-2 bg-white dark:bg-slate-955 border border-gray-200 dark:border-slate-855 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={handleAddAchievement}
              className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-lg text-xs font-bold shrink-0"
            >
              إضافة
            </button>
          </div>
        </div>

      </div>

      {/* Social Links & Save - Right Sidebar Column */}
      <div className="space-y-6">

        {/* Social Links card */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-955 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Share2 className="w-4.5 h-4.5 text-indigo-500" />
            <span>روابط التواصل الاجتماعي</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-500 flex items-center gap-1.5">
                <Github className="w-4 h-4 text-gray-400" />
                <span>GitHub</span>
              </label>
              <input
                type="text"
                placeholder="https://github.com/..."
                value={socialLinks.github}
                onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-500 flex items-center gap-1.5">
                <Linkedin className="w-4 h-4 text-blue-500" />
                <span>LinkedIn</span>
              </label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/..."
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-500 flex items-center gap-1.5">
                <Twitter className="w-4 h-4 text-sky-500" />
                <span>Twitter (X)</span>
              </label>
              <input
                type="text"
                placeholder="https://twitter.com/..."
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-500 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>الموقع الشخصي</span>
              </label>
              <input
                type="text"
                placeholder="https://mywebsite.com"
                value={socialLinks.website}
                onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Global Save Profile trigger */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-650 to-violet-650 px-6 py-4 font-bold text-white hover:scale-[1.01] hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/10"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>حفظ ملف المعلم العام</span>
        </button>

      </div>

    </form>
  )
}
