"use client"

import React from "react"
import Link from "next/link"
import { Star, GraduationCap, BookOpen, ArrowLeft, Users, Quote } from "lucide-react"

const teachers = [
  {
    name: "د. أحمد الشمري",
    role: "خوارزميات وهياكل بيانات",
    avatar: "أ",
    gradient: "from-cyan-500 to-blue-500",
    rating: 4.9,
    students: "٢٨٬٤٠٠+",
    courses: "١٢",
    bio: "دكتوراه في علوم الحاسوب، خبرة ١٥ سنة في تدريس البرمجة في أعرق الجامعات.",
  },
  {
    name: "م. سارة السالم",
    role: "ذكاء اصطناعي وتعلم آلة",
    avatar: "س",
    gradient: "from-violet-500 to-purple-500",
    rating: 4.8,
    students: "٢١٬٧٠٠+",
    courses: "٩",
    bio: "مهندسة ذكاء اصطناعي في إحدى كبرى شركات التقنية، شغوفة بنقل الخبرة للعرب.",
  },
  {
    name: "م. عبدالله الحربي",
    role: "أمن سيبراني واختراق أخلاقي",
    avatar: "ع",
    gradient: "from-emerald-500 to-green-500",
    rating: 4.9,
    students: "١٩٬٢٠٠+",
    courses: "٨",
    bio: "خبير أمن سيبراني معتمد (CISSP, CEH)، مؤسس فريق قرصنة أخلاقية عربي.",
  },
  {
    name: "أ. ليلى المحيميد",
    role: "تطوير ويب وتطبيقات",
    avatar: "ل",
    gradient: "from-amber-500 to-orange-500",
    rating: 4.7,
    students: "١٥٬٨٠٠+",
    courses: "١١",
    bio: "مطوّرة ويب محترفة، أسست مجتمع نسوي عربي للبرمجة درّبت مئات المبتدئات.",
  },
]

export default function TeachersSection() {
  return (
    <section className="py-20 md:py-28 px-4 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-14 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/8 px-4 py-1.5 text-xs font-extrabold text-purple-400">
            <GraduationCap className="w-3.5 h-3.5" />
            نخبة المعلمين
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-main">
            تعلّم من{" "}
            <span className="bg-gradient-to-l from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              أفضل الخبراء
            </span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            نخبة من أمهر المعلمين والخبراء في مجالات التقنية والعلوم، يشاركونك معرفتهم وخبراتهم العملية.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teachers.map((teacher, i) => (
            <div
              key={teacher.name}
              className="group relative rounded-2xl md:rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-card p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in overflow-hidden flex flex-col"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${teacher.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

              <div className="flex items-center gap-3 mb-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${teacher.gradient} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  {teacher.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-text-main text-sm leading-snug">{teacher.name}</h3>
                  <p className="text-[11px] text-text-muted font-semibold truncate">{teacher.role}</p>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1 line-clamp-2">
                {teacher.bio}
              </p>

              <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-3 mt-auto">
                <span className="flex items-center gap-1 text-text-muted">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {teacher.students}
                </span>
                <span className="flex items-center gap-1 text-text-muted">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  {teacher.courses} دورة
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {teacher.rating}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/teachers"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border border-purple-400/25 bg-purple-400/6 text-purple-400 font-bold text-sm hover:bg-purple-400/12 hover:border-purple-400/40 hover:scale-105 transition-all duration-300"
          >
            <GraduationCap className="h-4 w-4" />
            عرض جميع المعلمين
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
