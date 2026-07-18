# Code Craft Core 🚀

**منصة التعلم التفاعلية والألعاب البرمجية** — بيئة تعليمية متكاملة لتعلم البرمجة باللغة العربية بأسلوب الألعاب والمكافآت.

---

## ✨ المميزات الرئيسية

- **مسارات برمجية منظّمة** — من الصفر حتى الاحتراف
- **نظام نقاط وإنجازات** — اكسب XP و Craft Coins
- **تحديات يومية** — حافظ على شعلتك اليومية
- **مجتمع نشط** — انضم لآلاف المبرمجين العرب
- **نظام المعلمين** — إنشاء وإدارة المقررات والدروس
- **لوحة إدارة** — تحكم كامل بالمنصة والمستخدمين

---

## 🛠 المتطلبات التقنية

- **Node.js** 18+ (موصى به 20)
- **PostgreSQL** 14+
- **Supabase** حساب (مصادقة + تخزين)
- **npm** أو **yarn**

---

## ⚙️ الإعداد والتشغيل المحلي

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/code-craft-core.git
cd code-craft-core
```

### 2. تثبيت الاعتماديات

```bash
npm install
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.example .env.local
```

ثم قم بتعبئة المتغيرات في `.env.local`:

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط قاعدة بيانات PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح Supabase العام |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح Supabase الخدمي |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع (محلي: `http://localhost:3000`) |

### 4. إعداد قاعدة البيانات

```bash
npx prisma generate
npx prisma db push
```

### 5. تشغيل البذور (اختياري — لحسابات تجريبية)

```bash
npx tsx prisma/seed.ts
```

### 6. تشغيل الخادم المحلي

```bash
npm run dev
```

المنصة تعمل على: [http://localhost:3000](http://localhost:3000)

---

## 🐳 التشغيل عبر Docker

```bash
# بناء الصورة
docker build -t code-craft-core .

# تشغيل الحاوية
docker run -p 3000:3000 --env-file .env.local code-craft-core
```

---

## 📁 هيكل المشروع

```
├── actions/           # Server Actions
├── app/               # Next.js App Router (pages & APIs)
│   ├── api/           # API Routes
│   ├── dashboard/     # لوحات التحكم (Student, Teacher, Admin)
│   └── ...
├── components/        # مكونات React المشتركة
├── lib/               # مكتبات وأدوات مساعدة
├── prisma/            # Prisma schema + migrations
├── public/            # الملفات الثابتة
├── types/             # أنواع TypeScript
└── utils/             # أدوات Supabase
```

---

## ✅ الفرق بين البيئات

| الميزة | التطوير (dev) | الإنتاج (production) |
|--------|--------------|---------------------|
| TypeScript checking | متساهل | صارم (`ignoreBuildErrors: false`) |
| Cache | معطل | مفعل (ISR, SSG) |
| Source Maps | مفعلة | معطلة |
| Security Headers | غير مفعلة | مفعلة بالكامل |
| Rate Limiting | معطل | مفعل |
| Logging | Console | ملفات + استعداد لـ Sentry |

---

## 🧪 الاختبارات

```bash
# اختبارات الوحدة
npx vitest run

# مع تقرير التغطية
npx vitest run --coverage
```

---

## 🚀 النشر (Deployment)

### Vercel (موصى به)

1. اربط المستودع بـ Vercel
2. أضف جميع متغيرات البيئة من `.env.example`
3. أمر البناء: `npm run build` (مُعد مسبقاً في `package.json`)

### VPS / Dedicated Server

```bash
# بناء النسخة الإنتاجية
npm run build

# التشغيل
npm start
```

### Docker

```bash
docker build -t code-craft-core .
docker run -p 3000:3000 --env-file .env.production code-craft-core
```

---

## 🔐 الأمان

- **Security Headers**: X-Frame-Options, HSTS, CSP, إلخ
- **Rate Limiting**: حماية ضد الهجمات التكرارية
- **Input Validation**: عبر Zod schema validation
- **Session Management**: جلسات Supabase + محلية
- **Audit Logging**: تسجيل جميع الأنشطة الهامة
- **RBAC**: نظام صلاحيات متكامل

---

## 📊 المراقبة (Monitoring)

| المسار | الوصف |
|--------|-------|
| `/api/health` | فحص صحة الخادم وقاعدة البيانات |
| `AuditLog` model | تسجيل جميع الأنشطة الأمنية |
| جاهزية Sentry | يمكن ربط Sentry عبر `SENTRY_DSN` |

---

## 🔑 حسابات التجربة (Seed)

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|------------------|-------------|
| 👑 مدير | admin@codecraftcore.com | Admin@123456 |
| 🎓 معلم | teacher@codecraftcore.com | Teacher@123456 |
| 📚 طالب 1 | student@codecraftcore.com | Student@123456 |
| 📚 طالب 2 | student2@codecraftcore.com | Student@123456 |
| 📚 طالب 3 | student3@codecraftcore.com | Student@123456 |

---

## 📝 الترخيص

MIT License

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى فتح Issue أو Pull Request للمساهمة في تطوير المنصة.