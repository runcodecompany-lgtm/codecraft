// app/dashboard/student/roadmap/roadmap-client.tsx
"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Map, CheckCircle2, Lock, PlayCircle, BookOpen, Trophy,
  ChevronDown, ChevronRight, Target, Zap, Star, ArrowLeft,
  GraduationCap, AlertCircle, Sparkles, Clock, Users,
} from "lucide-react"

type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

interface CourseInfo {
  id: string
  title: string
  slug: string
  description: string | null
  level: DifficultyLevel
  coverImage: string | null
  priceInCoins: number
  moduleCount: number
  enrollmentCount: number
  enrollment: { id: string; progress: number; isCompleted: boolean } | null
}

interface LearningPathInfo {
  id: string
  level: DifficultyLevel
  title: string
  description: string | null
  courses: Array<{ order: number; course: CourseInfo }>
}

interface UserTrackInfo {
  id: string
  level: DifficultyLevel
  progress: number
  isPrimary: boolean
  track: {
    id: string
    name: string
    description: string | null
    icon: string | null
    parent: { id: string; name: string; icon: string | null } | null
    courses: CourseInfo[]
    learningPaths: LearningPathInfo[]
  }
}

interface Props {
  userTracks: UserTrackInfo[]
  userName: string
}

const LEVEL_CONFIG = {
  BEGINNER: {
    label: "مبتدئ",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    ring: "ring-emerald-400",
    glow: "shadow-emerald-200 dark:shadow-emerald-900/40",
    order: 0,
  },
  INTERMEDIATE: {
    label: "متوسط",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    ring: "ring-blue-400",
    glow: "shadow-blue-200 dark:shadow-blue-900/40",
    order: 1,
  },
  ADVANCED: {
    label: "متقدم",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    text: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    ring: "ring-violet-400",
    glow: "shadow-violet-200 dark:shadow-violet-900/40",
    order: 2,
  },
}

const LEVEL_ORDER: Record<DifficultyLevel, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 }

function getCourseStatus(
  course: CourseInfo,
  userLevel: DifficultyLevel
): "mastered" | "active" | "locked" {
  const courseOrder = LEVEL_ORDER[course.level]
  const userOrder = LEVEL_ORDER[userLevel]
  if (courseOrder < userOrder) return "mastered"
  if (courseOrder === userOrder) return "active"
  return "locked"
}

function CourseNode({
  course,
  status,
  isLast,
}: {
  course: CourseInfo
  status: "mastered" | "active" | "locked"
  isLast: boolean
}) {
  const levelCfg = LEVEL_CONFIG[course.level]

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      {!isLast && (
        <div
          className="absolute right-[19px] top-12 w-0.5 bottom-0 z-0"
          style={{
            background: status === "mastered"
              ? "linear-gradient(to bottom, #10b981, #a7f3d0)"
              : status === "active"
              ? "linear-gradient(to bottom, #6366f1, #c7d2fe)"
              : "linear-gradient(to bottom, #e2e8f0, #f1f5f9)",
          }}
        />
      )}

      {/* Node circle */}
      <div className="relative z-10 flex-shrink-0 mt-1.5">
        {status === "mastered" && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}
        {status === "active" && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 ring-4 ring-indigo-100 dark:ring-indigo-900/30 animate-pulse">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
        )}
        {status === "locked" && (
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <Lock className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
          </div>
        )}
      </div>

      {/* Course card */}
      <div className="flex-1 mb-4 pb-1">
        <div
          className={`rounded-2xl border p-4 transition-all duration-300 ${
            status === "mastered"
              ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20"
              : status === "active"
              ? "border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-slate-950 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
              : "border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 opacity-70"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Cover image or icon */}
            <div
              className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${
                status === "locked" ? "opacity-50" : ""
              }`}
              style={{
                background: course.coverImage
                  ? "transparent"
                  : `linear-gradient(135deg, ${
                      status === "mastered"
                        ? "#10b981, #14b8a6"
                        : status === "active"
                        ? "#6366f1, #8b5cf6"
                        : "#94a3b8, #cbd5e1"
                    })`,
              }}
            >
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <BookOpen className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelCfg.badge}`}
                >
                  {levelCfg.label}
                </span>
                {status === "mastered" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    ✓ تم التخطي بالاختبار
                  </span>
                )}
                {status === "active" && course.enrollment && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    جاري التعلم {course.enrollment.progress}%
                  </span>
                )}
                {status === "locked" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    مغلق حالياً
                  </span>
                )}
              </div>

              <h3
                className={`text-sm font-black leading-tight ${
                  status === "locked"
                    ? "text-slate-400 dark:text-slate-600"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {course.title}
              </h3>

              {course.description && (
                <p
                  className={`text-xs mt-0.5 line-clamp-1 ${
                    status === "locked"
                      ? "text-slate-300 dark:text-slate-700"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <BookOpen className="w-3 h-3" />
                  {course.moduleCount} وحدة
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Users className="w-3 h-3" />
                  {course.enrollmentCount} طالب
                </span>
                {course.priceInCoins > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    <Zap className="w-3 h-3" />
                    {course.priceInCoins} عملة
                  </span>
                )}
              </div>

              {/* Progress bar for active */}
              {status === "active" && course.enrollment && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400">التقدم</span>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {course.enrollment.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${course.enrollment.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CTA button */}
            {status !== "locked" && (
              <Link
                href={`/courses/${course.slug}`}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  status === "active"
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:shadow-xl hover:-translate-y-0.5"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200"
                }`}
              >
                {status === "active"
                  ? course.enrollment
                    ? "متابعة"
                    : "ابدأ الآن"
                  : "مراجعة"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LevelSection({
  levelPath,
  userLevel,
}: {
  levelPath: LearningPathInfo
  userLevel: DifficultyLevel
}) {
  const [expanded, setExpanded] = useState(true)
  const cfg = LEVEL_CONFIG[levelPath.level]
  const isCurrentLevel = levelPath.level === userLevel
  const isPastLevel = LEVEL_ORDER[levelPath.level] < LEVEL_ORDER[userLevel]

  const courses = levelPath.courses.map((lpc) => lpc.course)

  return (
    <div className={`rounded-2xl border-2 overflow-hidden mb-4 transition-all ${cfg.border} ${
      isCurrentLevel ? `shadow-lg ${cfg.glow}` : ""
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-right transition-all ${cfg.bg}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-sm`}>
            {isPastLevel ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : isCurrentLevel ? (
              <PlayCircle className="w-4 h-4 text-white" />
            ) : (
              <Lock className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${cfg.text}`}>{levelPath.title}</span>
              {isCurrentLevel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse">
                  مستواك الحالي
                </span>
              )}
              {isPastLevel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                  تم تخطيه
                </span>
              )}
            </div>
            <p className={`text-[10px] mt-0.5 ${cfg.text} opacity-70`}>{levelPath.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {courses.length} دورة
          </span>
          <ChevronDown
            className={`w-4 h-4 ${cfg.text} transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </div>
      </button>

      {expanded && courses.length > 0 && (
        <div className="p-4 pt-2">
          <div className="relative pr-2" dir="rtl">
            {courses.map((course, idx) => (
              <CourseNode
                key={course.id}
                course={course}
                status={getCourseStatus(course, userLevel)}
                isLast={idx === courses.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {expanded && courses.length === 0 && (
        <div className="p-6 text-center text-slate-400 dark:text-slate-600 text-xs">
          لا توجد دورات في هذا المستوى حتى الآن
        </div>
      )}
    </div>
  )
}

function TrackRoadmap({ userTrack }: { userTrack: UserTrackInfo }) {
  const { track, level: userLevel } = userTrack

  // Use learning paths if available, otherwise group direct courses by level
  const hasPaths = track.learningPaths.length > 0

  // Sort learning paths by level order
  const sortedPaths = [...track.learningPaths].sort(
    (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
  )

  // If no learning paths, group courses by level
  const groupedCourses = !hasPaths
    ? (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as DifficultyLevel[]).map((lvl) => ({
        id: lvl,
        level: lvl,
        title: LEVEL_CONFIG[lvl].label,
        description: null,
        courses: track.courses
          .filter((c) => c.level === lvl)
          .map((c, i) => ({ order: i + 1, course: c })),
      }))
    : sortedPaths

  const totalCourses = track.courses.length
  const completedCourses = track.courses.filter(
    (c) => c.enrollment?.isCompleted
  ).length
  const activeCourses = track.courses.filter(
    (c) => c.enrollment && !c.enrollment.isCompleted
  ).length

  return (
    <div>
      {/* Track summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "إجمالي الدورات", value: totalCourses, icon: BookOpen, color: "text-slate-600" },
          { label: "دورات جارية", value: activeCourses, icon: PlayCircle, color: "text-indigo-600" },
          { label: "دورات مكتملة", value: completedCourses, icon: CheckCircle2, color: "text-emerald-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-center"
          >
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <div className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* No placement test taken */}
      {totalCourses > 0 && (
        <div className="space-y-3">
          {groupedCourses.map((levelPath) => (
            <LevelSection key={levelPath.id} levelPath={levelPath as LearningPathInfo} userLevel={userLevel} />
          ))}
        </div>
      )}

      {totalCourses === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-bold text-slate-400 dark:text-slate-600">
            لا توجد دورات مرتبطة بهذا المسار حتى الآن
          </p>
          <Link
            href="/courses/marketplace"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            تصفح الدورات المتاحة
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default function RoadmapClient({ userTracks, userName }: Props) {
  const [activeTrackId, setActiveTrackId] = useState<string>(
    userTracks.find((ut) => ut.isPrimary)?.track.id ?? userTracks[0]?.track.id ?? ""
  )

  const activeUserTrack = userTracks.find((ut) => ut.track.id === activeTrackId)
  const levelCfg = activeUserTrack ? LEVEL_CONFIG[activeUserTrack.level] : LEVEL_CONFIG.BEGINNER

  if (userTracks.length === 0) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto py-16 text-center px-4">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--ccc-500), var(--ccs-500))",
            boxShadow: "0 8px 32px rgba(43,76,126,0.2)",
          }}
        >
          <Map className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
          لا توجد مسارات تعليمية بعد
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          اختر مسارك التعليمي الأول لتبدأ رحلتك وتظهر خريطتك هنا.
        </p>
        <Link
          href="/dashboard/student/placement"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--ccc-500), var(--ccs-500))" }}
        >
          <Target className="w-4 h-4" />
          اختر مساراتك التعليمية
        </Link>
      </div>
    )
  }

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--ccc-500), var(--ccs-500))" }}
            >
              <Map className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">خريطة التعلم</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mr-11">
            مرحباً {userName}! هذه خريطتك التعليمية التفاعلية لمساراتك المختارة.
          </p>
        </div>

        <Link
          href="/dashboard/student/placement"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex-shrink-0"
        >
          <Target className="w-3.5 h-3.5" />
          إعادة تحديد المستوى
        </Link>
      </div>

      {/* Track selector tabs */}
      {userTracks.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {userTracks.map((ut) => {
            const isActive = ut.track.id === activeTrackId
            const cfg = LEVEL_CONFIG[ut.level]
            return (
              <button
                key={ut.track.id}
                onClick={() => setActiveTrackId(ut.track.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${cfg.color} text-white border-transparent shadow-lg ${cfg.glow}`
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                {ut.isPrimary && (
                  <Star className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-amber-500"}`} />
                )}
                <span>{ut.track.parent?.name}</span>
                <ChevronRight className={`w-3 h-3 opacity-60 ${isActive ? "text-white" : ""}`} />
                <span>{ut.track.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    isActive ? "bg-white/20" : cfg.badge
                  }`}
                >
                  {cfg.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Active track info card */}
      {activeUserTrack && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--ccc-500), var(--ccs-500))`,
          }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
            <div
              className="absolute top-4 left-8 w-32 h-32 rounded-full"
              style={{ background: "rgba(255,255,255,0.3)", filter: "blur(30px)" }}
            />
            <div
              className="absolute bottom-0 right-12 w-24 h-24 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)", filter: "blur(20px)" }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {activeUserTrack.track.parent && (
                    <span className="text-white/60 text-xs">{activeUserTrack.track.parent.name}</span>
                  )}
                  {activeUserTrack.track.parent && (
                    <ChevronRight className="w-3 h-3 text-white/40" />
                  )}
                  <h2 className="text-white font-black text-base">{activeUserTrack.track.name}</h2>
                  {activeUserTrack.isPrimary && (
                    <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">
                      رئيسي
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-xs">{activeUserTrack.track.description}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-black`}
              >
                {levelCfg.label}
              </div>
              <span className="text-white/60 text-[10px]">مستواك الحالي</span>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="relative z-10 mt-4">
            <div className="flex justify-between text-[10px] text-white/70 mb-1.5">
              <span>التقدم الإجمالي في المسار</span>
              <span className="font-bold text-white">{Math.round(activeUserTrack.progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${activeUserTrack.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Placement test reminder if level is 0 */}
      {activeUserTrack && activeUserTrack.level === "BEGINNER" && activeUserTrack.track.courses.every(c => !c.enrollment) && (
        <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              لم تجرِ اختبار تحديد المستوى بعد
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              أجرِ اختبار تحديد المستوى لـ{activeUserTrack.track.name} لتحديد نقطة بدايتك الصحيحة وتخطي المستويات التي تتقنها.
            </p>
          </div>
          <Link
            href="/dashboard/student/placement"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            ابدأ الاختبار
          </Link>
        </div>
      )}

      {/* Roadmap legend */}
      <div className="flex items-center gap-4 flex-wrap text-[10px]">
        <span className="text-slate-400 font-bold">الدليل:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
          <span className="text-slate-500 dark:text-slate-400">تم تخطيه بالاختبار</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <PlayCircle className="w-3 h-3 text-white" />
          </div>
          <span className="text-slate-500 dark:text-slate-400">مستواك الحالي</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <Lock className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-slate-500 dark:text-slate-400">مقفل حالياً</span>
        </div>
      </div>

      {/* The actual roadmap */}
      {activeUserTrack && <TrackRoadmap userTrack={activeUserTrack} />}
    </div>
  )
}
