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
  // Delete if already exists (idempotent seed)
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)
  if (found) {
    await supabaseAdmin.auth.admin.deleteUser(found.id)
    console.log(`  ✗ Deleted old Supabase user: ${email}`)
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // bypass email confirmation
    user_metadata: { name },
  })

  if (error) throw new Error(`Supabase create failed for ${email}: ${error.message}`)
  return data.user!
}

async function main() {
  console.log("\n🚀 Code Craft Core — Database Seeder\n")

  // ── 1. Clear existing seed data from Prisma ──────────────────────────────
  console.log("🧹 Clearing existing data...")
  await prisma.transaction.deleteMany()
  await prisma.userProgress.deleteMany()
  await prisma.article.deleteMany()
  await prisma.question.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  console.log("   ✓ Tables cleared\n")

  // ── 2. Create users ───────────────────────────────────────────────────────
  console.log("👥 Creating users...")
  const createdUsers: Record<string, string> = {} // email -> prismaId

  for (const u of SEED_USERS) {
    process.stdout.write(`   Creating ${u.role}: ${u.email} ... `)

    const authUser = await createSupabaseUser(u.email, u.password, u.name)
    const passwordHash = await bcrypt.hash(u.password, 10)

    // Ensure unique referral code
    let referralCode = generateReferralCode()
    let tries = 0
    while (await prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode()
      if (++tries > 20) throw new Error("Cannot generate unique referral code")
    }

    await prisma.user.create({
      data: {
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
      },
    })

    createdUsers[u.email] = authUser.id
    console.log("✓")
  }

  // ── 2.5 Seed Roles and Permissions ────────────────────────────────────────
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

  // Create roles
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name as any },
      update: { description: r.desc },
      create: { name: r.name as any, description: r.desc },
    })
  }

  // Create permissions
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
  console.log("   ✓ Roles and Permissions configured")

  // ── 3. Create Courses (taught by teacher) ─────────────────────────────────
  console.log("\n📚 Creating courses...")
  const teacherId = createdUsers["teacher@codecraftcore.com"]

  const course1 = await prisma.course.create({
    data: {
      title: "أساسيات HTML & CSS من الصفر",
      slug: "html-css-basics",
      description:
        "تعلّم بناء صفحات الويب الاحترافية باستخدام HTML5 و CSS3 بأسلوب تفاعلي ممتع. مناسب للمبتدئين تماماً.",
      priceInCoins: 0,
      isPublished: true,
      teacherId,
      modules: {
        create: [
          {
            title: "مقدمة إلى HTML",
            order: 1,
            lessons: {
              create: [
                { title: "ما هو HTML؟", order: 1, duration: 10, content: "مقدمة عن لغة HTML وتاريخها." },
                { title: "الوسوم الأساسية", order: 2, duration: 15, content: "تعلّم h1-h6، p، div، span" },
                { title: "إنشاء أول صفحة ويب", order: 3, duration: 20, content: "نبني معاً صفحة ويب كاملة." },
              ],
            },
          },
          {
            title: "أساسيات CSS",
            order: 2,
            lessons: {
              create: [
                { title: "المحددات (Selectors)", order: 1, duration: 12, content: "class, id, element selectors" },
                { title: "الألوان والخطوط", order: 2, duration: 15, content: "color, font-family, font-size" },
                { title: "النموذج الصندوقي (Box Model)", order: 3, duration: 18, content: "margin, padding, border" },
              ],
            },
          },
          {
            title: "التخطيط المتجاوب",
            order: 3,
            lessons: {
              create: [
                { title: "Flexbox من البداية", order: 1, duration: 25, content: "display:flex, align-items, justify-content" },
                { title: "CSS Grid Layout", order: 2, duration: 22, content: "grid-template-columns, grid-gap" },
                { title: "Media Queries", order: 3, duration: 18, content: "التصميم المتجاوب للجوال" },
              ],
            },
          },
        ],
      },
    },
    select: { id: true, modules: { select: { lessons: { select: { id: true } } } } },
  })

  const course2 = await prisma.course.create({
    data: {
      title: "JavaScript الحديث — ES6+",
      slug: "javascript-modern-es6",
      description:
        "انتقل من المبتدئ إلى المتمكن في JavaScript الحديثة. تشمل الوعود، Async/Await، الوحدات، وأنماط البرمجة الحديثة.",
      priceInCoins: 200,
      isPublished: true,
      teacherId,
      modules: {
        create: [
          {
            title: "مراجعة الأساسيات",
            order: 1,
            lessons: {
              create: [
                { title: "المتغيرات: var, let, const", order: 1, duration: 12 },
                { title: "الدوال السهمية (Arrow Functions)", order: 2, duration: 15 },
                { title: "Template Literals", order: 3, duration: 10 },
              ],
            },
          },
          {
            title: "البرمجة غير المتزامنة",
            order: 2,
            lessons: {
              create: [
                { title: "Callbacks والمشكلة", order: 1, duration: 15 },
                { title: "Promises — الوعود", order: 2, duration: 20 },
                { title: "Async/Await بعمق", order: 3, duration: 25 },
              ],
            },
          },
        ],
      },
    },
    select: { id: true, modules: { select: { lessons: { select: { id: true } } } } },
  })

  const course3 = await prisma.course.create({
    data: {
      title: "React.js للمبتدئين المتقدمين",
      slug: "reactjs-beginners-advanced",
      description: "أتقن React.js من الـ Components حتى الـ Hooks المتقدمة وإدارة الحالة بـ Context API.",
      priceInCoins: 350,
      isPublished: true,
      teacherId,
      modules: {
        create: [
          {
            title: "React Fundamentals",
            order: 1,
            lessons: {
              create: [
                { title: "ما هو React وما الـ JSX؟", order: 1, duration: 15 },
                { title: "المكونات (Components)", order: 2, duration: 20 },
                { title: "الـ Props و State", order: 3, duration: 25 },
              ],
            },
          },
          {
            title: "Hooks المتقدمة",
            order: 2,
            lessons: {
              create: [
                { title: "useState و useEffect", order: 1, duration: 20 },
                { title: "useCallback و useMemo", order: 2, duration: 22 },
                { title: "Custom Hooks", order: 3, duration: 28 },
              ],
            },
          },
        ],
      },
    },
    select: { id: true },
  })

  console.log("   ✓ 3 courses created")

  // ── 4. Create Quizzes ────────────────────────────────────────────────────
  console.log("\n📝 Creating quizzes with questions...")

  const quiz1 = await prisma.quiz.create({
    data: {
      title: "اختبار HTML الأساسي",
      questions: {
        create: [
          {
            questionText: "ما هو الوسم الصحيح لإنشاء عنوان رئيسي في HTML؟",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "BEGINNER",
            options: ["<h1>", "<heading>", "<head>", "<title>"],
            correctAnswer: "<h1>",
          },
          {
            questionText: "أي وسم يُستخدم لإنشاء رابط في HTML؟",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "BEGINNER",
            options: ["<link>", "<href>", "<a>", "<url>"],
            correctAnswer: "<a>",
          },
          {
            questionText: "ما معنى CSS؟",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "INTERMEDIATE",
            options: [
              "Cascading Style Sheets",
              "Creative Style System",
              "Computer Style Sheets",
              "Colorful Style Syntax",
            ],
            correctAnswer: "Cascading Style Sheets",
          },
        ],
      },
    },
  })

  const quiz2 = await prisma.quiz.create({
    data: {
      title: "اختبار JavaScript المتقدم",
      questions: {
        create: [
          {
            questionText: "ما نتيجة: typeof []",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "INTERMEDIATE",
            options: ["'array'", "'object'", "'null'", "'list'"],
            correctAnswer: "'object'",
          },
          {
            questionText: "ما الفرق بين == و === في JavaScript؟",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "INTERMEDIATE",
            options: [
              "=== يتحقق من القيمة فقط",
              "=== يتحقق من القيمة والنوع معاً",
              "لا فرق بينهما",
              "== أسرع في التنفيذ دائماً",
            ],
            correctAnswer: "=== يتحقق من القيمة والنوع معاً",
          },
          {
            questionText: "ما فائدة Promise.all()؟",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "ADVANCED",
            options: [
              "تنفيذ الوعود بالتوالي",
              "انتظار كل الوعود وإرجاع نتائجها مجتمعة",
              "إلغاء الوعود البطيئة",
              "إرجاع أول وعد يكتمل",
            ],
            correctAnswer: "انتظار كل الوعود وإرجاع نتائجها مجتمعة",
          },
        ],
      },
    },
  })

  console.log("   ✓ 2 quizzes with questions created")

  // ── 5. Create Articles (by teacher) ──────────────────────────────────────
  console.log("\n📰 Creating articles...")

  await prisma.article.create({
    data: {
      title: "10 نصائح لكتابة كود HTML احترافي وقابل للصيانة",
      slug: "10-html-professional-tips",
      content: `# 10 نصائح لكتابة كود HTML احترافي

## 1. استخدام الوسوم الدلالية (Semantic Tags)
لا تستخدم div لكل شيء. استخدم header, main, article, section, footer بشكل صحيح.

## 2. إضافة خاصية alt للصور
\`\`\`html
<img src="logo.png" alt="شعار Code Craft Core" />
\`\`\`

## 3. تنظيم الكود بشكل هرمي
احرص على المسافة البادئة (indentation) الصحيحة لقراءة أفضل.

## 4. استخدام HTML5 DOCTYPE
ابدأ دائماً بـ \`<!DOCTYPE html>\`

## 5. تحسين SEO بـ meta tags
أضف title و description و keywords مناسبة لكل صفحة.`,
      published: true,
      authorId: teacherId,
      courseId: course1.id,
    },
  })

  await prisma.article.create({
    data: {
      title: "دليلك الشامل لفهم Async/Await في JavaScript",
      slug: "javascript-async-await-guide",
      content: `# دليل Async/Await في JavaScript

## ما هي البرمجة غير المتزامنة؟
البرمجة غير المتزامنة تسمح لبرنامجك بتنفيذ مهام متعددة دون الانتظار.

## من Callbacks إلى Promises
\`\`\`javascript
// Callback Hell (الطريقة القديمة)
fetchData(function(data) {
  processData(data, function(result) {
    saveData(result, function() {
      console.log('Done!')
    })
  })
})

// Async/Await (الطريقة الحديثة)
async function main() {
  const data = await fetchData()
  const result = await processData(data)
  await saveData(result)
  console.log('Done!')
}
\`\`\`

## معالجة الأخطاء مع try/catch
استخدم try/catch مع async/await لمعالجة الأخطاء بشكل نظيف.`,
      published: true,
      authorId: teacherId,
      courseId: course2.id,
    },
  })

  await prisma.article.create({
    data: {
      title: "مقارنة React Hooks vs Class Components — أيهما أفضل في 2025؟",
      slug: "react-hooks-vs-class-components-2025",
      content: `# React Hooks vs Class Components

## الإجابة المختصرة
استخدم Hooks دائماً في المشاريع الجديدة.

## مزايا Hooks
- كود أقصر وأوضح
- إعادة استخدام المنطق بسهولة (Custom Hooks)
- لا حاجة لـ this.state أو this.setState

## مثال مقارن
\`\`\`javascript
// Class Component
class Counter extends React.Component {
  state = { count: 0 }
  render() {
    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>
      {this.state.count}
    </button>
  }
}

// Functional + Hooks
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\``,
      published: true,
      authorId: teacherId,
      courseId: course3.id,
    },
  })

  console.log("   ✓ 3 articles created")

  // ── 6. Add UserProgress & Transactions for students ───────────────────────
  console.log("\n🎮 Simulating student progress and transactions...")

  const student1Id = createdUsers["student@codecraftcore.com"]
  const student2Id = createdUsers["student2@codecraftcore.com"]
  const student3Id = createdUsers["student3@codecraftcore.com"]

  // Get all lesson IDs from course1
  const course1Lessons = course1.modules.flatMap((m) => m.lessons.map((l) => l.id))

  // student1: completed first 5 lessons of course1
  for (let i = 0; i < Math.min(5, course1Lessons.length); i++) {
    await prisma.userProgress.create({
      data: {
        userId: student1Id,
        lessonId: course1Lessons[i],
        isCompleted: true,
      },
    })
  }

  // student2: completed all lessons of course1
  for (const lessonId of course1Lessons) {
    await prisma.userProgress.create({
      data: { userId: student2Id, lessonId, isCompleted: true },
    })
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  const txData = [
    // Admin
    { userId: createdUsers["admin@codecraftcore.com"], amount: 9999, type: "EARN" as const, description: "رصيد مسؤول النظام الافتراضي" },
    // Teacher
    { userId: teacherId, amount: 2500, type: "EARN" as const, description: "مكافأة نشر المقررات التعليمية" },
    // Students
    { userId: student1Id, amount: 100, type: "EARN" as const, description: "هدية الترحيب والتسجيل الأساسية" },
    { userId: student1Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: html-basics" },
    { userId: student1Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: css-selectors" },
    { userId: student1Id, amount: 20, type: "SPEND" as const, description: "شراء تلميح للدرس: css-box-model" },
    { userId: student1Id, amount: 30, type: "EARN" as const, description: "إكمال اختبار (3/5 إجابات صحيحة)" },
    { userId: student1Id, amount: 500, type: "EARN" as const, description: "مكافأة الإحالة بعد إكمال 3 دروس" },

    { userId: student2Id, amount: 200, type: "EARN" as const, description: "هدية التسجيل عبر كود الإحالة" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: html-basics" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: html-tags" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: css-basics" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: flexbox" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: grid" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: media-queries" },
    { userId: student2Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: responsive" },
    { userId: student2Id, amount: 100, type: "EARN" as const, description: "إكمال اختبار (5/5 إجابات صحيحة)" },
    { userId: student2Id, amount: 500, type: "EARN" as const, description: "مكافأة إكمال المقرر الكامل" },

    { userId: student3Id, amount: 100, type: "EARN" as const, description: "هدية الترحيب والتسجيل الأساسية" },
    { userId: student3Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: html-basics" },
    { userId: student3Id, amount: 50, type: "EARN" as const, description: "إكمال تحدي البرمجة للدرس: css-selectors" },
    { userId: student3Id, amount: 20, type: "SPEND" as const, description: "شراء تلميح للدرس: flexbox" },
    { userId: student3Id, amount: 10, type: "PENALTY" as const, description: "غرامة محاولة التحايل على النظام" },
    { userId: student3Id, amount: 30, type: "EARN" as const, description: "إكمال اختبار (3/5 إجابات صحيحة)" },
  ]

  for (const tx of txData) {
    await prisma.transaction.create({ data: tx })
  }

  console.log("   ✓ Progress and transactions seeded")

  // ── 7. Summary ────────────────────────────────────────────────────────────
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
