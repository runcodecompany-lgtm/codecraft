import React from "react"
import Link from "next/link"
import {
  Code2,
  Brain,
  Shield,
  BarChart3,
  Atom,
  FlaskConical,
  Globe,
  Palette,
  Briefcase,
  BookOpen,
  ArrowLeft,
  Map,
} from "lucide-react"

const tracks = [
  {
    id: "programming",
    icon: Code2,
    title: "البرمجة",
    description: "لغات البرمجة، تطوير الويب والتطبيقات من الصفر إلى الاحتراف",
    count: "٤٨ دورة",
    iconBg: "bg-[#2B4C7E]/10 dark:bg-[#2B4C7E]/20",
    iconColor: "text-[#2B4C7E] dark:text-[#7FA8D4]",
    badgeBg: "bg-[#2B4C7E]/6 dark:bg-[#2B4C7E]/12",
    badgeBorder: "border-[#2B4C7E]/15 dark:border-[#2B4C7E]/20",
    badgeText: "text-[#2B4C7E] dark:text-[#7FA8D4]",
    hoverBorder: "hover:border-[#2B4C7E]/40 dark:hover:border-[#2B4C7E]/60",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "ai",
    icon: Brain,
    title: "الذكاء الاصطناعي",
    description: "الشبكات العصبية، تعلم الآلة، ومعالجة اللغة الطبيعية",
    count: "٢٦ دورة",
    iconBg: "bg-[#4A7C59]/10 dark:bg-[#4A7C59]/20",
    iconColor: "text-[#4A7C59] dark:text-[#6AAD7A]",
    badgeBg: "bg-[#4A7C59]/6 dark:bg-[#4A7C59]/12",
    badgeBorder: "border-[#4A7C59]/15 dark:border-[#4A7C59]/20",
    badgeText: "text-[#4A7C59] dark:text-[#6AAD7A]",
    hoverBorder: "hover:border-[#4A7C59]/40 dark:hover:border-[#4A7C59]/60",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "cybersecurity",
    icon: Shield,
    title: "الأمن السيبراني",
    description: "حماية الأنظمة، الاختراق الأخلاقي، وأمن الشبكات",
    count: "١٨ دورة",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-350",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeBorder: "border-slate-200 dark:border-slate-800",
    badgeText: "text-slate-650 dark:text-slate-350",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "math",
    icon: BarChart3,
    title: "الرياضيات",
    description: "الجبر، التفاضل والتكامل، الإحصاء، والرياضيات التطبيقية",
    count: "٣٢ دورة",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-350",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeBorder: "border-slate-200 dark:border-slate-800",
    badgeText: "text-slate-650 dark:text-slate-350",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "physics",
    icon: Atom,
    title: "الفيزياء",
    description: "الميكانيكا، الكهرومغناطيسية، والفيزياء الكمية",
    count: "٢٢ دورة",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-350",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeBorder: "border-slate-200 dark:border-slate-800",
    badgeText: "text-slate-650 dark:text-slate-350",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "chemistry",
    icon: FlaskConical,
    title: "الكيمياء",
    description: "الكيمياء العضوية، غير العضوية، والكيمياء الحيوية",
    count: "١٦ دورة",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-350",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeBorder: "border-slate-200 dark:border-slate-800",
    badgeText: "text-slate-650 dark:text-slate-350",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "languages",
    icon: Globe,
    title: "اللغات",
    description: "الإنجليزية، الفرنسية، الألمانية وأكثر من ١٠ لغات",
    count: "٢٩ دورة",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-350",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeBorder: "border-slate-200 dark:border-slate-800",
    badgeText: "text-slate-650 dark:text-slate-350",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم",
    description: "UI/UX، الجرافيك، هوية الماركة والتصميم الرقمي",
    count: "٢١ دورة",
    iconBg: "bg-[#2B4C7E]/10 dark:bg-[#2B4C7E]/20",
    iconColor: "text-[#2B4C7E] dark:text-[#7FA8D4]",
    badgeBg: "bg-[#2B4C7E]/6 dark:bg-[#2B4C7E]/12",
    badgeBorder: "border-[#2B4C7E]/15 dark:border-[#2B4C7E]/20",
    badgeText: "text-[#2B4C7E] dark:text-[#7FA8D4]",
    hoverBorder: "hover:border-[#2B4C7E]/40",
    hoverShadow: "hover:shadow-md",
  },
  {
    id: "business",
    icon: Briefcase,
    title: "الأعمال",
    description: "ريادة الأعمال، التسويق الرقمي، وإدارة المشاريع",
    count: "١٤ دورة",
    iconBg: "bg-[#4A7C59]/10 dark:bg-[#4A7C59]/20",
    iconColor: "text-[#4A7C59] dark:text-[#6AAD7A]",
    badgeBg: "bg-[#4A7C59]/6 dark:bg-[#4A7C59]/12",
    badgeBorder: "border-[#4A7C59]/15 dark:border-[#4A7C59]/20",
    badgeText: "text-[#4A7C59] dark:text-[#6AAD7A]",
    hoverBorder: "hover:border-[#4A7C59]/40",
    hoverShadow: "hover:shadow-md",
  },
]

export default function LearningTracks() {
  return (
    <section className="py-16 md:py-24 px-4 bg-[#F5F7FA] dark:bg-[#0a0f1d] text-slate-850 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2B4C7E]/20 bg-[#2B4C7E]/6 dark:bg-[#2B4C7E]/12 px-4 py-1.5 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4]">
            <Map className="w-3.5 h-3.5" />
            مسارات التعلم
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            استكشف{" "}
            <span className="bg-gradient-to-l from-[#2B4C7E] to-[#4A7C59] bg-clip-text text-transparent">
              مسارات التعلم الأكثر طلباً
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            محتوى تعليمي متخصص لكل مجال، مصمَّم بعناية لكل مستوى ومُحدَّث باستمرار من قِبَل خبراء الصناعة.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {tracks.map((track, i) => {
            const Icon = track.icon
            return (
              <Link
                key={track.id}
                href={`/courses/marketplace?track=${track.id}`}
                className={`
                  group relative flex flex-col gap-4 p-5 md:p-6
                  rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141C2F]
                  ${track.hoverBorder} ${track.hoverShadow}
                  hover:-translate-y-1
                  transition-all duration-300
                  animate-fade-in
                `}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${track.iconBg} ${track.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>

                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {track.description}
                  </p>
                </div>

                <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${track.badgeBg} ${track.badgeBorder} ${track.badgeText} w-fit`}>
                  <BookOpen className="w-3 h-3" />
                  {track.count}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/courses/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2B4C7E] text-white font-bold text-sm hover:bg-[#1c3459] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <BookOpen className="h-4 w-4" />
            <span>عرض جميع المسارات والدورات</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
