---
name: nextjs-development
description: Next.js App Router guidelines, folder structure, React Server/Client Component splitting, Server Actions patterns, caching, metadata, and SEO optimizations for Code Craft Core.
---

# Code Craft Core - Next.js & Frontend Architecture Skill ⚙️

تحدد هذه المهارة الهيكل الهندسي، وأفضل الممارسات، والمعايير المتبعة لتطوير واجهات المستخدم وكود الواجهة الأمامية بمنصة **Code Craft Core** باستخدام Next.js App Router.

---

## 📁 1. تنظيم بنية الملفات والمجلدات
يجب الالتزام بالبنية الحالية للمستودع:
- `actions/`: يحتوي على دوال Server Actions الخاصة بالتواصل مع قاعدة البيانات وإجراءات المستخدمين.
- `app/`: صفحات التطبيق ونقاط اتصال API (مثل `/api/health`).
- `components/`: المكونات المشتركة والقابلة لإعادة الاستخدام (مثل الأزرار، الحقول، القوائم).
- `lib/`: أدوات مساعدة عامة والاتصال بـ Prisma/Supabase.
- `types/`: تعريفات TypeScript الموحدة.

---

## 🖥️ 2. مكونات الخادم مقابل مكونات العميل (Server vs Client Components)
- **مكونات الخادم (Server Components - الافتراضي)**:
  - استخدمها لجلب البيانات مباشرة من قاعدة البيانات (Prisma) أو الاتصال بالخدمات الخلفية.
  - اكتب فيها البيانات الوصفية (Metadata) لـ SEO.
  - تجنب استيراد المكونات التي تتطلب تفاعلية مباشرة أو استخدام Hooks مثل `useState` أو `useEffect` داخلها.
- **مكونات العميل (Client Components - `"use client"`)**:
  - استخدمها فقط عند الحاجة للتفاعل المباشر (مثل النماذج، النوافذ المنبثقة Modals، المؤثرات الحركية Framer Motion، أو استخدام React Hooks).
  - اجعل مكونات العميل صغيرة قدر الإمكان في أسفل شجرة المكونات لتحسين سرعة التحميل الأولية.

---

## 🔄 3. نمط الـ Server Actions المعتمد
يجب كتابة الـ Server Actions باتباع النمط التالي لضمان أداء مستقر ومعالجة أخطاء موحدة:
1. **استيراد `"use server"`** في بداية الملف.
2. **التحقق من المدخلات** باستخدام مكتبة Zod.
3. **التحقق من الصلاحيات والتوثيق** قبل تنفيذ أي عملية حساسة.
4. **تحديث الذاكرة المؤقتة (Cache Revalidation)** عند تحديث البيانات باستخدام `revalidatePath` أو `revalidateTag`.
5. **إرجاع استجابة موحدة** بالصيغة التالية:
```typescript
"use server"

import { db } from "@/lib/db" // أو الاتصال بـ Prisma
import { z } from "zod"
import { revalidatePath } from "next/cache"

const schema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(3),
})

export async function createLessonAction(formData: unknown) {
  try {
    // 1. التحقق من المدخلات
    const validatedFields = schema.safeParse(formData)
    if (!validatedFields.success) {
      return { success: false, error: "المدخلات غير صالحة" }
    }

    // 2. التحقق من الصلاحيات (كمعلم أو مسؤول)
    // const session = await getSession(); ...

    // 3. كتابة البيانات
    const newLesson = await db.lesson.create({
      data: validatedFields.data
    })

    // 4. تحديث الذاكرة المؤقتة لصفحات العرض
    revalidatePath(`/courses/${validatedFields.data.courseId}`)

    return { success: true, data: newLesson }
  } catch (error) {
    console.error("Failed to create lesson:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ الدرس" }
  }
}
```

---

## 📈 4. تحسين الأداء وممارسات الـ SEO
- **التحميل التدريجي (Streaming & Suspense)**: استخدم ملفات `loading.tsx` المخصصة لعرض واجهات هيكلية (Skeleton Loaders) أثناء جلب البيانات في الخلفية.
- **توليد البيانات الوصفية الديناميكية**: استخدم `generateMetadata` للمقالات والدروس والدورات لإنشاء عناوين ووصف وصور معاينة مخصصة لكل صفحة.
- **تجنب الصور الثقيلة**: استخدم مكون `next/image` دائماً مع تحديد الأبعاد والـ Alt text باللغة العربية لضمان تحسين الأرشفة وسرعة التحميل.
