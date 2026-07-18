/**
 * prisma/seed.ts
 * Database seeder for Code Craft Core LMS
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or:  npx tsx prisma/seed.ts
 */

import { createClient } from "@supabase/supabase-js"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcrypt"
import crypto from "crypto"

// ─── Load env ─────────────────────────────────────────────────────────────────
// WARNING: Do NOT hardcode secrets. Use environment variables only.
// Next.js does NOT auto-load .env files for ts-node/tsx scripts.
// Run: npx tsx --env-file=.env prisma/seed.ts
// Or set environment variables manually before running.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "",
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Test accounts ────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    email: "admin@codecraftcore.com",
    password: "Admin@123456",
    name: "مدير المنصة",
    role: "ADMIN" as const,
    craftCoins: 9999,
    streakCount: 30,
  },
  {
    email: "teacher@codecraftcore.com",
    password: "Teacher@123456",
    name: "د. أحمد الشافعي",
    role: "TEACHER" as const,
    craftCoins: 2500,
    streakCount: 15,
  },
  {
    email: "student@codecraftcore.com",
    password: "Student@123456",
    name: "سارة المطيري",
    role: "STUDENT" as const,
    craftCoins: 750,
    streakCount: 7,
  },
  {
    email: "student2@codecraftcore.com",
    password: "Student@123456",
    name: "خالد العمري",
    role: "STUDENT" as const,
    craftCoins: 1200,
    streakCount: 12,
  },
  {
    email: "student3@codecraftcore.com",
    password: "Student@123456",
    name: "نورة السالم",
    role: "STUDENT" as const,
    craftCoins: 550,
    streakCount: 5,
  },
]

function generateReferralCode(): string {
  return `CRAFT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
}

async function createSupabaseUser(email: string, password: string, name: string) {
  const adminApi: any = supabaseAdmin.auth.admin as any
  const getByEmail = typeof adminApi.getUserByEmail === "function"
    ? adminApi.getUserByEmail.bind(adminApi)
    : null

  const existingUser = getByEmail
    ? (await getByEmail(email))?.data?.user
    : (await supabaseAdmin.auth.admin.listUsers())?.data?.users?.find((u) => u.email === email)

  if (existingUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: { name },
      email_confirm: true,
    })
    if (error) throw new Error(`Supabase update failed for ${email}: ${error.message}`)
    return data.user!
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) throw new Error(`Supabase create failed for ${email}: ${error.message}`)
  return data.user!
}

async function main() {
  console.log("\n🚀 Code Craft Core — Database Seeder\n")

  const requiredEnv = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  const missingEnv = requiredEnv.filter((k) => !process.env[k])
  if (missingEnv.length > 0) {
    throw new Error(`Missing required env vars: ${missingEnv.join(", ")}`)
  }

  console.log("👥 Seeding users...")
  const createdUsers: Record<string, string> = {}

  for (const u of SEED_USERS) {
    process.stdout.write(`   Upserting ${u.role}: ${u.email} ... `)

    const authUser = await createSupabaseUser(u.email, u.password, u.name)
    const passwordHash = await bcrypt.hash(u.password, 10)

    const existingByEmail = await prisma.user.findUnique({ where: { email: u.email } })
    if (existingByEmail && existingByEmail.id !== authUser.id) {
      await prisma.user.delete({ where: { id: existingByEmail.id } })
    }

    let referralCode = existingByEmail?.referralCode || generateReferralCode()
    let tries = 0
    while (await prisma.user.findUnique({ where: { referralCode } })) {
      if (existingByEmail?.referralCode === referralCode) break
      referralCode = generateReferralCode()
      if (++tries > 50) throw new Error("Cannot generate unique referral code")
    }

    await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        craftCoins: u.craftCoins,
        streakCount: u.streakCount,
        referralCode,
        lastLoginDate: new Date(),
        status: "ACTIVE",
        emailVerified: new Date(),
        xp: u.role === "STUDENT" ? 1200 : u.role === "TEACHER" ? 2500 : 0,
        level: u.role === "STUDENT" ? 4 : 8,
      },
      create: {
        id: authUser.id,
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        craftCoins: u.craftCoins,
        streakCount: u.streakCount,
        referralCode,
        lastLoginDate: new Date(),
        status: "ACTIVE",
        emailVerified: new Date(),
        xp: u.role === "STUDENT" ? 1200 : u.role === "TEACHER" ? 2500 : 0,
        level: u.role === "STUDENT" ? 4 : 8,
      },
    })

    createdUsers[u.email] = authUser.id
    console.log("✓")
  }

  console.log("\n🔑 Seeding Roles and Permissions...")
  const roles = [
    { name: "STUDENT", desc: "طالب يتعلم على المنصة" },
    { name: "TEACHER", desc: "معلم ينشئ المقررات والمقالات" },
    { name: "ADMIN", desc: "مدير النظام" },
    { name: "SUPER_ADMIN", desc: "المدير العام للنظام بصلاحيات كاملة" },
  ]

  const permissions = [
    { name: "manage_users", desc: "إدارة المستخدمين وحالتهم وصلاحياتهم" },
    { name: "manage_courses", desc: "إدارة المقررات الدراسية بالكامل" },
    { name: "manage_lessons", desc: "إدارة الدروس والمحتوى" },
    { name: "manage_tests", desc: "إدارة الاختبارات والأسئلة" },
    { name: "manage_articles", desc: "إدارة المقالات والمدونة" },
    { name: "manage_games", desc: "إدارة التحديات البرمجية والألعاب" },
    { name: "manage_settings", desc: "إدارة إعدادات المنصة العامة" },
  ]

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name as any },
      update: { description: r.desc },
      create: { name: r.name as any, description: r.desc },
    })
  }

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.desc },
      create: { name: p.name, description: p.desc },
    })
  }

  const dbPermissions = await prisma.permission.findMany()
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } })
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } })
  const teacherRole = await prisma.role.findUnique({ where: { name: "TEACHER" } })

  if (superAdminRole) {
    for (const perm of dbPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: perm.id },
      })
    }
  }

  if (adminRole) {
    for (const perm of dbPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      })
    }
  }

  if (teacherRole) {
    const teacherPerms = ["manage_courses", "manage_lessons", "manage_tests", "manage_articles", "manage_games"]
    for (const permName of teacherPerms) {
      const dbPerm = dbPermissions.find((p) => p.name === permName)
      if (dbPerm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: teacherRole.id, permissionId: dbPerm.id } },
          update: {},
          create: { roleId: teacherRole.id, permissionId: dbPerm.id },
        })
      }
    }
  }

  const teacherId = createdUsers["teacher@codecraftcore.com"]
  const adminId = createdUsers["admin@codecraftcore.com"]
  const student1Id = createdUsers["student@codecraftcore.com"]
  const student2Id = createdUsers["student2@codecraftcore.com"]
  const student3Id = createdUsers["student3@codecraftcore.com"]

  console.log("\n🧭 Seeding tracks, categories, subcategories...")
  const trackBlueprints = [
    {
      name: "تطوير الويب الشامل",
      icon: "Code2",
      description: "مسار عملي لتعلم تطوير الويب من الصفر حتى بناء تطبيقات كاملة.",
      categories: [
        {
          name: "الواجهة الأمامية",
          description: "HTML/CSS/JS/React وبناء واجهات سريعة ومتجاوبة.",
          subcategories: [
            { name: "HTML & CSS", description: "أساسيات بناء الواجهات وتصميمها." },
            { name: "JavaScript", description: "لغة الويب الأساسية وأنماط ES6+." },
            { name: "React", description: "بناء تطبيقات واجهة تفاعلية." },
            { name: "Next.js", description: "بناء تطبيقات React إنتاجية." },
          ],
        },
        {
          name: "الخلفية وواجهات البرمجة",
          description: "Node.js و APIs وقواعد البيانات.",
          subcategories: [
            { name: "Node.js", description: "بناء REST APIs وخدمات backend." },
            { name: "PostgreSQL", description: "تصميم قواعد البيانات والاستعلامات." },
            { name: "Prisma", description: "ORM عملي مع PostgreSQL." },
          ],
        },
      ],
    },
    {
      name: "بايثون وعلوم البيانات",
      icon: "Brain",
      description: "مسار أساسيات بايثون وتحليل البيانات بشكل تطبيقي.",
      categories: [
        {
          name: "أساسيات بايثون",
          description: "المتغيرات، الدوال، الملفات، البرمجة الكائنية.",
          subcategories: [
            { name: "Python Basics", description: "الأساسيات وبناء مشاريع صغيرة." },
            { name: "OOP", description: "البرمجة الكائنية في بايثون." },
          ],
        },
        {
          name: "تحليل البيانات",
          description: "مفاهيم التحليل والتنظيف وتلخيص البيانات.",
          subcategories: [
            { name: "Pandas", description: "التعامل مع الجداول والبيانات." },
            { name: "Visualization", description: "تصوير البيانات ومؤشرات الأداء." },
          ],
        },
      ],
    },
  ]

  const trackByName: Record<string, { id: string }> = {}
  const categoryByKey: Record<string, { id: string }> = {}
  const subcategoryByKey: Record<string, { id: string }> = {}

  for (const t of trackBlueprints) {
    const track = await prisma.learningTrack.upsert({
      where: { name: t.name },
      update: { description: t.description, icon: t.icon, isActive: true },
      create: { name: t.name, description: t.description, icon: t.icon, isActive: true },
      select: { id: true },
    })
    trackByName[t.name] = track

    for (const c of t.categories) {
      const category = await prisma.trackCategory.upsert({
        where: { trackId_name: { trackId: track.id, name: c.name } as any },
        update: { description: c.description },
        create: { trackId: track.id, name: c.name, description: c.description },
        select: { id: true },
      })
      categoryByKey[`${t.name}::${c.name}`] = category

      for (const s of c.subcategories) {
        const sub = await prisma.trackSubcategory.upsert({
          where: { categoryId_name: { categoryId: category.id, name: s.name } as any },
          update: { description: s.description },
          create: { categoryId: category.id, name: s.name, description: s.description },
          select: { id: true },
        })
        subcategoryByKey[`${t.name}::${c.name}::${s.name}`] = sub
      }
    }
  }

  for (const t of Object.values(trackByName)) {
    await prisma.placementTest.upsert({
      where: { trackId: t.id },
      update: { isActive: true },
      create: {
        trackId: t.id,
        title: "اختبار تحديد المستوى",
        description: "اختبار قصير لتحديد المستوى ووضع خطة تعلم مناسبة.",
        timeLimitMinutes: 7,
        questionCount: 10,
        isActive: true,
      },
    })
  }

  await prisma.teacherProfile.upsert({
    where: { userId: teacherId },
    update: {
      title: "دكتور علوم الحاسب وخبير الويب",
      bio: "محاضر ومهندس برمجيات يهتم ببناء مناهج تعليمية عملية وتطبيقية.",
      skills: "HTML,CSS,JavaScript,React,Next.js,Node.js,PostgreSQL,Prisma",
      experience: [
        { period: "2021 - الآن", role: "قائد فريق تطوير ومنتج تعليمي" },
        { period: "2016 - 2021", role: "مطور نظم ويب متكاملة" },
      ],
      achievements: [
        "تصميم مسار تطوير الويب الشامل",
        "تخريج آلاف الطلاب في دورات برمجية عملية",
      ],
      socialLinks: { github: "https://github.com", website: "https://example.com" },
    },
    create: {
      userId: teacherId,
      title: "دكتور علوم الحاسب وخبير الويب",
      bio: "محاضر ومهندس برمجيات يهتم ببناء مناهج تعليمية عملية وتطبيقية.",
      skills: "HTML,CSS,JavaScript,React,Next.js,Node.js,PostgreSQL,Prisma",
      experience: [
        { period: "2021 - الآن", role: "قائد فريق تطوير ومنتج تعليمي" },
        { period: "2016 - 2021", role: "مطور نظم ويب متكاملة" },
      ],
      achievements: [
        "تصميم مسار تطوير الويب الشامل",
        "تخريج آلاف الطلاب في دورات برمجية عملية",
      ],
      socialLinks: { github: "https://github.com", website: "https://example.com" },
    },
  })

  console.log("\n📚 Seeding courses (scoped refresh by slug)...")
  type SeedDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  type SeedQuestion = {
    questionText: string
    questionType: string
    difficulty: SeedDifficulty
    options: string[]
    correctAnswer: string
    points: number
  }
  type SeedQuiz = { title: string; questions: SeedQuestion[] }
  type SeedAssignment = { title: string; description: string; dueDaysFromNow: number; points: number }
  type SeedLesson = { title: string; order: number; duration: number; type: string; content: string }
  type SeedModule = {
    title: string
    order: number
    lessons: SeedLesson[]
    quiz?: SeedQuiz
    assignment?: SeedAssignment
  }
  type SeedCourse = {
    title: string
    slug: string
    description: string
    priceInCoins: number
    isPublished: boolean
    level: SeedDifficulty
    status: string
    track: string
    category: string
    subcategory: string
    modules: SeedModule[]
  }

  const courseSeeds: SeedCourse[] = [
    {
      title: "أساسيات HTML & CSS من الصفر",
      slug: "html-css-basics",
      description: "تعلّم بناء صفحات الويب باستخدام HTML5 و CSS3 بأسلوب عملي.",
      priceInCoins: 0,
      isPublished: true,
      level: "BEGINNER",
      status: "PUBLISHED",
      track: "تطوير الويب الشامل",
      category: "الواجهة الأمامية",
      subcategory: "HTML & CSS",
      modules: [
        {
          title: "مقدمة إلى HTML",
          order: 1,
          lessons: [
            { title: "ما هو HTML؟", order: 1, duration: 10, type: "TEXT", content: "مقدمة عن HTML ولماذا نستخدمه." },
            { title: "الوسوم الدلالية", order: 2, duration: 12, type: "TEXT", content: "header/main/section/article/footer." },
            { title: "النماذج والروابط", order: 3, duration: 15, type: "TEXT", content: "a/form/input وأفضل الممارسات." },
          ],
          quiz: {
            title: "اختبار HTML الأساسي",
            questions: [
              {
                questionText: "ما هو الوسم الصحيح لإنشاء عنوان رئيسي في HTML؟",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "BEGINNER",
                options: ["<h1>", "<heading>", "<head>", "<title>"],
                correctAnswer: "<h1>",
                points: 1,
              },
              {
                questionText: "أي وسم يُستخدم لإنشاء رابط؟",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "BEGINNER",
                options: ["<link>", "<href>", "<a>", "<url>"],
                correctAnswer: "<a>",
                points: 1,
              },
              {
                questionText: "الوسوم الدلالية تساعد بشكل أساسي في:",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "INTERMEDIATE",
                options: ["الأداء فقط", "SEO وإتاحة الوصول وتنظيم الصفحة", "تصغير الصور", "تشفير البيانات"],
                correctAnswer: "SEO وإتاحة الوصول وتنظيم الصفحة",
                points: 2,
              },
            ],
          },
        },
        {
          title: "أساسيات CSS",
          order: 2,
          lessons: [
            { title: "Selectors بشكل عملي", order: 1, duration: 12, type: "TEXT", content: "class/id/attribute selectors." },
            { title: "Box Model", order: 2, duration: 14, type: "TEXT", content: "margin/padding/border وكيفية حساب الحجم." },
            { title: "Flexbox", order: 3, duration: 18, type: "TEXT", content: "layout سريع ومتجاوب." },
          ],
          assignment: {
            title: "تصميم صفحة هبوط بسيطة",
            description: "صمّم صفحة هبوط بسيطة باستخدام Flexbox مع أقسام: Hero/Features/Footer.",
            dueDaysFromNow: 7,
            points: 100,
          },
        },
      ],
    },
    {
      title: "JavaScript الحديث — ES6+",
      slug: "javascript-modern-es6",
      description: "انتقل من المبتدئ إلى المتمكن في JavaScript الحديثة بشكل تطبيقي.",
      priceInCoins: 200,
      isPublished: true,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      track: "تطوير الويب الشامل",
      category: "الواجهة الأمامية",
      subcategory: "JavaScript",
      modules: [
        {
          title: "الأساسيات المهمة",
          order: 1,
          lessons: [
            { title: "let/const ولماذا تهم", order: 1, duration: 10, type: "TEXT", content: "نطاق المتغيرات وأفضل الممارسات." },
            { title: "Functions و Arrow Functions", order: 2, duration: 12, type: "TEXT", content: "this والسياق." },
            { title: "Array Methods", order: 3, duration: 15, type: "TEXT", content: "map/filter/reduce بشكل عملي." },
          ],
        },
        {
          title: "البرمجة غير المتزامنة",
          order: 2,
          lessons: [
            { title: "Promises", order: 1, duration: 14, type: "TEXT", content: "حل مشكلة callback hell." },
            { title: "Async/Await", order: 2, duration: 16, type: "TEXT", content: "كتابة كود أوضح وتعامل مع الأخطاء." },
          ],
          quiz: {
            title: "اختبار JavaScript المتقدم",
            questions: [
              {
                questionText: "ما نتيجة: typeof [] ؟",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "INTERMEDIATE",
                options: ["'array'", "'object'", "'null'", "'list'"],
                correctAnswer: "'object'",
                points: 1,
              },
              {
                questionText: "ما الفرق بين == و === ؟",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "INTERMEDIATE",
                options: [
                  "=== يتحقق من القيمة فقط",
                  "=== يتحقق من القيمة والنوع معاً",
                  "لا فرق بينهما",
                  "== أسرع دائماً",
                ],
                correctAnswer: "=== يتحقق من القيمة والنوع معاً",
                points: 2,
              },
              {
                questionText: "Promise.all تفيد في:",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "ADVANCED",
                options: [
                  "تشغيل الوعود بالتسلسل",
                  "انتظار كل الوعود وإرجاع النتائج مجتمعة",
                  "إرجاع أول وعد ينجح فقط",
                  "منع أي خطأ من الظهور",
                ],
                correctAnswer: "انتظار كل الوعود وإرجاع النتائج مجتمعة",
                points: 2,
              },
            ],
          },
        },
      ],
    },
    {
      title: "React.js — بناء واجهات تفاعلية",
      slug: "reactjs-interactive-ui",
      description: "تعلّم React عملياً من Components حتى Hooks المتقدمة.",
      priceInCoins: 350,
      isPublished: true,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      track: "تطوير الويب الشامل",
      category: "الواجهة الأمامية",
      subcategory: "React",
      modules: [
        {
          title: "React Fundamentals",
          order: 1,
          lessons: [
            { title: "JSX و Rendering", order: 1, duration: 12, type: "TEXT", content: "كيف يترجم JSX إلى عناصر." },
            { title: "Props و State", order: 2, duration: 14, type: "TEXT", content: "متى نستخدم كل واحد." },
          ],
          quiz: {
            title: "اختبار React أساسيات",
            questions: [
              {
                questionText: "Props تُستخدم عادةً لـ:",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "BEGINNER",
                options: ["تخزين حالة داخلية فقط", "تمرير بيانات من الأب للابن", "تنفيذ SQL", "تشفير كلمات المرور"],
                correctAnswer: "تمرير بيانات من الأب للابن",
                points: 1,
              },
              {
                questionText: "أفضل مكان للبيانات المشتركة بين عدة مكونات؟",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "INTERMEDIATE",
                options: ["useState في كل مكون", "رفع الحالة للأعلى أو Context", "localStorage فقط", "innerHTML"],
                correctAnswer: "رفع الحالة للأعلى أو Context",
                points: 2,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Next.js 16 — تطبيقات إنتاجية",
      slug: "nextjs-16-production",
      description: "بناء تطبيقات Next.js مع App Router و Server Actions ومفاهيم الإنتاج.",
      priceInCoins: 450,
      isPublished: true,
      level: "ADVANCED",
      status: "PUBLISHED",
      track: "تطوير الويب الشامل",
      category: "الواجهة الأمامية",
      subcategory: "Next.js",
      modules: [
        {
          title: "App Router",
          order: 1,
          lessons: [
            { title: "الصفحات والتخطيطات", order: 1, duration: 12, type: "TEXT", content: "page.tsx/layout.tsx وفكرة الشجرة." },
            { title: "Server Components", order: 2, duration: 15, type: "TEXT", content: "متى ولماذا تستخدمها." },
          ],
        },
        {
          title: "Server Actions & Data",
          order: 2,
          lessons: [
            { title: "Server Actions عملياً", order: 1, duration: 16, type: "TEXT", content: "تنفيذ عمليات كتابة بأمان." },
            { title: "Caching/Revalidate", order: 2, duration: 12, type: "TEXT", content: "كيف تؤثر على الأداء." },
          ],
        },
      ],
    },
    {
      title: "PostgreSQL للمطورين",
      slug: "postgres-for-developers",
      description: "أساسيات تصميم الجداول والعلاقات والاستعلامات والفهارس.",
      priceInCoins: 300,
      isPublished: true,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      track: "تطوير الويب الشامل",
      category: "الخلفية وواجهات البرمجة",
      subcategory: "PostgreSQL",
      modules: [
        {
          title: "العلاقات والاستعلامات",
          order: 1,
          lessons: [
            { title: "Keys & Indexes", order: 1, duration: 14, type: "TEXT", content: "PRIMARY/FOREIGN/UNIQUE وكيف تؤثر." },
            { title: "JOINs", order: 2, duration: 16, type: "TEXT", content: "INNER/LEFT وطرق تحسين الاستعلام." },
          ],
          quiz: {
            title: "اختبار PostgreSQL سريع",
            questions: [
              {
                questionText: "الفهرس (Index) يساعد بشكل أساسي في:",
                questionType: "MULTIPLE_CHOICE",
                difficulty: "INTERMEDIATE",
                options: ["إبطاء القراءة", "تسريع عمليات البحث", "حذف الجداول", "تغيير نوع الأعمدة تلقائياً"],
                correctAnswer: "تسريع عمليات البحث",
                points: 1,
              },
            ],
          },
        },
      ],
    },
  ]

  const courseIdsBySlug: Record<string, string> = {}
  const quizIdsByKey: Record<string, { quizId: string; questionIds: string[] }> = {}
  const lessonIdsByCourseSlug: Record<string, string[]> = {}

  for (const seed of courseSeeds) {
    const existing = await prisma.course.findUnique({ where: { slug: seed.slug }, select: { id: true } })
    if (existing) {
      await prisma.course.delete({ where: { id: existing.id } })
    }

    const trackId = trackByName[seed.track].id
    const categoryId = categoryByKey[`${seed.track}::${seed.category}`].id
    const subcategoryId = subcategoryByKey[`${seed.track}::${seed.category}::${seed.subcategory}`].id

    const created = await prisma.course.create({
      data: {
        title: seed.title,
        slug: seed.slug,
        description: seed.description,
        coverImage: null,
        priceInCoins: seed.priceInCoins,
        isPublished: seed.isPublished,
        level: seed.level,
        status: seed.status,
        teacherId,
        trackId,
        categoryId,
        subcategoryId,
        modules: {
          create: seed.modules.map((m) => ({
            title: m.title,
            order: m.order,
            lessons: {
              create: m.lessons.map((l) => ({
                title: l.title,
                order: l.order,
                duration: l.duration,
                type: l.type,
                content: l.content,
                videoProcessingStatus: "READY",
              })),
            },
            quizzes: m.quiz
              ? {
                  create: [
                    {
                      title: m.quiz.title,
                      questions: { create: m.quiz.questions.map((q) => ({ ...q })) },
                    },
                  ],
                }
              : undefined,
            assignments: m.assignment
              ? {
                  create: [
                    {
                      title: m.assignment.title,
                      description: m.assignment.description,
                      dueDate: new Date(Date.now() + m.assignment.dueDaysFromNow * 24 * 60 * 60 * 1000),
                      points: m.assignment.points,
                    },
                  ],
                }
              : undefined,
          })),
        },
      },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
            quizzes: { include: { questions: { select: { id: true } } } },
          },
        },
      },
    })

    courseIdsBySlug[seed.slug] = created.id
    lessonIdsByCourseSlug[seed.slug] = created.modules.flatMap((m) => m.lessons.map((l) => l.id))

    for (const mod of created.modules) {
      for (const quiz of mod.quizzes) {
        quizIdsByKey[`${seed.slug}::${quiz.title}`] = { quizId: quiz.id, questionIds: quiz.questions.map((qq) => qq.id) }
      }
    }
  }

  console.log("   ✓ Courses created/updated")

  console.log("\n🧠 Seeding learning paths...")
  const webTrackId = trackByName["تطوير الويب الشامل"].id
  const beginnerPath = await prisma.learningPath.upsert({
    where: { trackId_level: { trackId: webTrackId, level: "BEGINNER" } as any },
    update: { title: "خطة المبتدئ", description: "ابدأ من أساسيات الويب ثم تقدّم خطوة بخطوة." },
    create: { trackId: webTrackId, level: "BEGINNER", title: "خطة المبتدئ", description: "ابدأ من أساسيات الويب ثم تقدّم خطوة بخطوة." },
  })

  const intermediatePath = await prisma.learningPath.upsert({
    where: { trackId_level: { trackId: webTrackId, level: "INTERMEDIATE" } as any },
    update: { title: "خطة المتوسط", description: "تعمّق في JavaScript وReact." },
    create: { trackId: webTrackId, level: "INTERMEDIATE", title: "خطة المتوسط", description: "تعمّق في JavaScript وReact." },
  })

  const advancedPath = await prisma.learningPath.upsert({
    where: { trackId_level: { trackId: webTrackId, level: "ADVANCED" } as any },
    update: { title: "خطة المتقدم", description: "Next.js وإنتاجية وتكامل مع قواعد البيانات." },
    create: { trackId: webTrackId, level: "ADVANCED", title: "خطة المتقدم", description: "Next.js وإنتاجية وتكامل مع قواعد البيانات." },
  })

  const pathCourses: Array<{ pathId: string; slugs: string[] }> = [
    { pathId: beginnerPath.id, slugs: ["html-css-basics"] },
    { pathId: intermediatePath.id, slugs: ["javascript-modern-es6", "reactjs-interactive-ui"] },
    { pathId: advancedPath.id, slugs: ["nextjs-16-production", "postgres-for-developers"] },
  ]

  for (const pc of pathCourses) {
    await prisma.learningPathCourse.deleteMany({ where: { learningPathId: pc.pathId } })
    for (let i = 0; i < pc.slugs.length; i++) {
      await prisma.learningPathCourse.create({
        data: {
          learningPathId: pc.pathId,
          courseId: courseIdsBySlug[pc.slugs[i]],
          order: i + 1,
        },
      })
    }
  }

  console.log("   ✓ Learning paths configured")

  console.log("\n🧩 Seeding learning profiles & user tracks...")
  const primaryTrackId = webTrackId
  const secondaryTrackId = trackByName["بايثون وعلوم البيانات"].id

  for (const userId of [student1Id, student2Id, student3Id]) {
    await prisma.learningProfile.upsert({
      where: { userId },
      update: { primaryTrackId, learningGoals: ["وظيفة", "مشاريع", "أساسيات قوية"] },
      create: { userId, primaryTrackId, learningGoals: ["وظيفة", "مشاريع", "أساسيات قوية"] },
    })

    await prisma.userTrack.upsert({
      where: { userId_trackId: { userId, trackId: primaryTrackId } as any },
      update: { isPrimary: true, level: "BEGINNER", progress: 0 },
      create: { userId, trackId: primaryTrackId, isPrimary: true, level: "BEGINNER", progress: 0 },
    })

    await prisma.userTrack.upsert({
      where: { userId_trackId: { userId, trackId: secondaryTrackId } as any },
      update: { isPrimary: false, level: "BEGINNER", progress: 0 },
      create: { userId, trackId: secondaryTrackId, isPrimary: false, level: "BEGINNER", progress: 0 },
    })
  }

  console.log("\n🧾 Seeding articles (refresh by slug)...")
  const articleSeeds = [
    {
      title: "10 نصائح لكتابة كود HTML احترافي وقابل للصيانة",
      slug: "10-html-professional-tips",
      content:
        "# 10 نصائح لكتابة كود HTML احترافي\n\n- استخدم الوسوم الدلالية.\n- أضف alt للصور.\n- نظّم الهيكل.\n- اهتم بـ meta tags.\n",
      courseSlug: "html-css-basics",
    },
    {
      title: "دليلك الشامل لفهم Async/Await في JavaScript",
      slug: "javascript-async-await-guide",
      content:
        "# دليل Async/Await\n\nكيف تنتقل من callbacks إلى promises ثم async/await مع try/catch.\n",
      courseSlug: "javascript-modern-es6",
    },
    {
      title: "React Hooks في المشاريع الحديثة",
      slug: "react-hooks-modern",
      content:
        "# React Hooks\n\nلماذا hooks هي الافتراضية؟ وكيف تبني custom hooks قابلة لإعادة الاستخدام.\n",
      courseSlug: "reactjs-interactive-ui",
    },
  ]

  for (const a of articleSeeds) {
    const existing = await prisma.article.findUnique({ where: { slug: a.slug }, select: { id: true } })
    if (existing) await prisma.article.delete({ where: { id: existing.id } })
    await prisma.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        content: a.content,
        published: true,
        authorId: teacherId,
        courseId: courseIdsBySlug[a.courseSlug],
      },
    })
  }

  console.log("\n🎓 Seeding enrollments, progress, quiz attempts...")
  const enrollmentPlan = [
    { userId: student1Id, slug: "html-css-basics", completedLessons: 4 },
    { userId: student1Id, slug: "javascript-modern-es6", completedLessons: 2 },
    { userId: student2Id, slug: "html-css-basics", completedLessons: 6 },
    { userId: student2Id, slug: "reactjs-interactive-ui", completedLessons: 2 },
    { userId: student2Id, slug: "javascript-modern-es6", completedLessons: 5 },
    { userId: student3Id, slug: "html-css-basics", completedLessons: 2 },
  ]

  await prisma.enrollment.deleteMany({ where: { userId: { in: [student1Id, student2Id, student3Id] } } })
  await prisma.userProgress.deleteMany({ where: { userId: { in: [student1Id, student2Id, student3Id] } } })
  await prisma.quizAnswer.deleteMany({ where: { attempt: { userId: { in: [student1Id, student2Id, student3Id] } } } })
  await prisma.quizAttempt.deleteMany({ where: { userId: { in: [student1Id, student2Id, student3Id] } } })

  for (const e of enrollmentPlan) {
    const lessonIds = lessonIdsByCourseSlug[e.slug] || []
    const completed = lessonIds.slice(0, Math.min(e.completedLessons, lessonIds.length))
    const progress = lessonIds.length === 0 ? 0 : Math.round((completed.length / lessonIds.length) * 100)

    await prisma.enrollment.create({
      data: {
        userId: e.userId,
        courseId: courseIdsBySlug[e.slug],
        progress,
        isCompleted: progress >= 100,
      },
    })

    for (let i = 0; i < lessonIds.length; i++) {
      const lessonId = lessonIds[i]
      const isCompleted = completed.includes(lessonId)
      await prisma.userProgress.create({
        data: {
          userId: e.userId,
          lessonId,
          isCompleted,
          lastWatchedSeconds: isCompleted ? 999 : 120,
          videoCompletion: isCompleted ? 100 : 25,
        },
      })
    }
  }

  const attemptSeeds = [
    {
      userId: student1Id,
      quizKey: "html-css-basics::اختبار HTML الأساسي",
      correctCount: 2,
    },
    {
      userId: student2Id,
      quizKey: "javascript-modern-es6::اختبار JavaScript المتقدم",
      correctCount: 3,
    },
    {
      userId: student2Id,
      quizKey: "reactjs-interactive-ui::اختبار React أساسيات",
      correctCount: 2,
    },
  ]

  for (const a of attemptSeeds) {
    const meta = quizIdsByKey[a.quizKey]
    if (!meta) continue
    const total = meta.questionIds.length
    const score = Math.min(a.correctCount, total)
    const percentage = total === 0 ? 0 : Math.round((score / total) * 100)
    const isPassed = percentage >= 60

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: a.userId,
        quizId: meta.quizId,
        score,
        total,
        percentage,
        isPassed,
      },
    })

    for (let i = 0; i < meta.questionIds.length; i++) {
      const questionId = meta.questionIds[i]
      const isCorrect = i < score
      await prisma.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId,
          selectedOption: isCorrect ? "seed-correct" : "seed-wrong",
          isCorrect,
        },
      })
    }
  }

  await prisma.placementTestAttempt.deleteMany({ where: { userId: { in: [student1Id, student2Id, student3Id] } } })
  await prisma.placementTestAttempt.createMany({
    data: [
      { userId: student1Id, trackId: webTrackId, score: 6, level: "BEGINNER" },
      { userId: student2Id, trackId: webTrackId, score: 8, level: "INTERMEDIATE" },
      { userId: student3Id, trackId: webTrackId, score: 5, level: "BEGINNER" },
    ],
  })

  await prisma.trackRecommendation.deleteMany({ where: { userId: { in: [student1Id, student2Id, student3Id] } } })
  await prisma.trackRecommendation.createMany({
    data: [
      {
        userId: student1Id,
        trackId: webTrackId,
        courseId: courseIdsBySlug["javascript-modern-es6"],
        reason: "مناسب لتقوية أساسيات JavaScript قبل React.",
      },
      {
        userId: student2Id,
        trackId: webTrackId,
        courseId: courseIdsBySlug["nextjs-16-production"],
        reason: "مستواك يسمح بالانتقال لتطبيقات إنتاجية.",
      },
    ],
    skipDuplicates: true,
  })

  await prisma.transaction.deleteMany({ where: { userId: { in: [adminId, teacherId, student1Id, student2Id, student3Id] } } })
  await prisma.transaction.createMany({
    data: [
      { userId: adminId, amount: 9999, type: "EARN", description: "رصيد مسؤول النظام الافتراضي" },
      { userId: teacherId, amount: 2500, type: "EARN", description: "مكافأة نشر المقررات التعليمية" },
      { userId: student1Id, amount: 100, type: "EARN", description: "هدية الترحيب والتسجيل الأساسية" },
      { userId: student1Id, amount: 50, type: "EARN", description: "إكمال اختبار HTML" },
      { userId: student2Id, amount: 200, type: "EARN", description: "هدية التسجيل عبر كود الإحالة" },
      { userId: student2Id, amount: 100, type: "EARN", description: "إكمال اختبار JavaScript" },
      { userId: student3Id, amount: 100, type: "EARN", description: "هدية الترحيب والتسجيل الأساسية" },
    ],
  })

  console.log("\n" + "═".repeat(60))
  console.log("✅  DATABASE SEEDED SUCCESSFULLY!")
  console.log("═".repeat(60))
  console.log("\n🔐 LOGIN CREDENTIALS:\n")
  console.log("┌─────────────────────────────────────────────────────────┐")
  console.log("│  👑 ADMIN                                               │")
  console.log("│  Email:    admin@codecraftcore.com                      │")
  console.log("│  Password: Admin@123456                                 │")
  console.log("│  Coins:    9,999 🪙                                     │")
  console.log("├─────────────────────────────────────────────────────────┤")
  console.log("│  🎓 TEACHER                                             │")
  console.log("│  Email:    teacher@codecraftcore.com                    │")
  console.log("│  Password: Teacher@123456                               │")
  console.log("│  Coins:    2,500 🪙                                     │")
  console.log("├─────────────────────────────────────────────────────────┤")
  console.log("│  📚 STUDENT 1 (متقدم - لديه تقدم وإحالة)              │")
  console.log("│  Email:    student@codecraftcore.com                    │")
  console.log("│  Password: Student@123456                               │")
  console.log("│  Coins:    750 🪙  |  Streak: 7 🔥                     │")
  console.log("├─────────────────────────────────────────────────────────┤")
  console.log("│  📚 STUDENT 2 (أعلى في الليدربورد)                    │")
  console.log("│  Email:    student2@codecraftcore.com                   │")
  console.log("│  Password: Student@123456                               │")
  console.log("│  Coins:    1,200 🪙  |  Streak: 12 🔥                  │")
  console.log("├─────────────────────────────────────────────────────────┤")
  console.log("│  📚 STUDENT 3                                           │")
  console.log("│  Email:    student3@codecraftcore.com                   │")
  console.log("│  Password: Student@123456                               │")
  console.log("│  Coins:    550 🪙  |  Streak: 5 🔥                     │")
  console.log("└─────────────────────────────────────────────────────────┘")
  console.log("\n📡 Platform URL: http://localhost:3000")
  console.log("📊 Admin Panel:  http://localhost:3000/dashboard/admin")
  console.log("🎓 Teacher:      http://localhost:3000/dashboard/teacher")
  console.log("📚 Student:      http://localhost:3000/dashboard/student")
  console.log("🏆 Leaderboard:  http://localhost:3000 (الصفحة الرئيسية)")
  console.log("")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
