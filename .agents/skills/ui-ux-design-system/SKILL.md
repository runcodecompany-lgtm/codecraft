---
name: ui-ux-design-system
description: Guidelines and instructions for building a premium, consistent UI/UX with tailwind v4, custom glassmorphism, responsive designs, Alexandria font, and RTL Arabic support for Code Craft Core.
---

# Code Craft Core - UI/UX Design System Skill 🎨

تحدد هذه المهارة المعايير والممارسات اللازمة لبناء واجهات مستخدم مذهلة، تفاعلية، ومتسقة بالكامل مع الهوية البصرية لمنصة **Code Craft Core**، باستخدام Tailwind CSS v4 والرموز المحددة في `app/design-tokens.css` و `app/globals.css`.

---

## 🎨 1. الألوان والتدرجات الأساسية
عند إنشاء عناصر الواجهة، استخدم المتغيرات التالية بدلاً من درجات الألوان العشوائية:
- **درجات الألوان (CSS Variables)**:
  - الخلفية العامة: `var(--bg-base)`
  - خلفية البطاقات/الأسطح: `var(--bg-surface)`
  - النصوص الرئيسية: `var(--text-primary)` (داكن في المضيء، فاتح جداً في الداكن)
  - النصوص الفرعية: `var(--text-secondary)` (رمادي متناسق)
  - تدرج الألوان الأساسي للمنصة (البراند): `var(--gradient-brand)` (تدرج من Cyan إلى Purple)
  - تدرج لوحات التحكم الرئيسية والـ Hero: `var(--gradient-hero)`
  - تدرج النصوص المتوهجة: `var(--gradient-text)`

---

## ✨ 2. الأنماط البصرية الجاهزة (UI Patterns)

### أ. البطاقات الزجاجية الفاخرة (Premium Glassmorphic Cards)
استخدم التركيبة التالية للبطاقات لتبدو عصرية وفخمة:
```tsx
<div className="bg-[var(--bg-surface)] border border-[var(--border-card)] shadow-card rounded-[var(--radius-lg)] p-6 transition-all duration-[var(--transition-base)] hover:border-[var(--border-focus)] hover:shadow-md">
  {/* محتوى البطاقة */}
</div>
```

### ب. الأزرار التفاعلية المتوهجة (Interactive Glowing Buttons)
- **الزر الرئيسي (Primary Button with Brand Gradient)**:
```tsx
<button className="relative overflow-hidden bg-[var(--gradient-brand)] text-white font-semibold px-6 py-3 rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
  {text}
</button>
```
- **الزر الفرعي (Subtle/Secondary Button)**:
```tsx
<button className="bg-[var(--bg-muted)] hover:bg-[var(--surface-card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium px-6 py-3 rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)]">
  {text}
</button>
```

### ج. عناصر الإدخال الفاخرة (Form Inputs)
```tsx
<input 
  type="text" 
  className="w-full bg-[var(--surface-input)] border border-[var(--border-input)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
  placeholder="أدخل النص..."
/>
```

---

## ⚡ 3. الحركة والتفاعل (Framer Motion Presets)
استخدم `framer-motion` لإضافة طابع حيوي وتفاعلي:
- **تأثير الظهور التدريجي من الأسفل (Fade-in-up)**:
```typescript
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};
```
- **تأثير التحويم والضغط (Hover/Tap Interaction)**:
```typescript
export const hoverTap = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 }
};
```

---

## 🌐 4. دعم اللغة العربية والـ RTL والخطوط
- **الخط الأساسي**: خط `Alexandria` هو الخط المعتمد. لا تستخدم خطوطاً افتراضية أخرى.
- **اتجاه النصوص**: استخدم فئات محاذاة النصوص التلقائية بناءً على اللغة وتجنب فرض الاتجاه اليساري إلا في الأكواد البرمجية.
- **الأيقونات والرموز**: عند عرض الأسهم (`->` أو `<-`)، تأكد من عكس اتجاه السهم في الواجهة العربية (الـ RTL) ليعبّر عن التقدم أو العودة بشكل صحيح.
