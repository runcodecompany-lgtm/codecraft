# المرحلة الثامنة: AI & Smart Learning Ecosystem

## الهدف
تحويل منصة Code Craft Core من منصة تعليمية تقليدية إلى منصة تعليمية ذكية قادرة على مساعدة الطالب، تخصيص التعلم، تحليل الأداء، اقتراح المحتوى، توليد المحتوى التعليمي، ودعم المعلمين والإدارة.

## تحليل الوضع الحالي

### ما هو موجود بالفعل:
- ✅ مكتبة `groq-sdk` مثبتة ومستخدمة في `/api/seo-analyze`
- ✅ مكتبة `@google/generative-ai` مثبتة (لم تُستخدم بعد)
- ✅ `GROQ_API_KEY` و `GEMINI_API_KEY` في `.env`
- ✅ نظام إشعارات أساسي (`Notification` model)
- ✅ نظام gamification (XP, Coins, Achievements, Streaks)
- ✅ نظام تتبع تقدم الطالب (`UserProgress`, `Enrollment`)
- ✅ نظام اختبارات (`Quiz`, `QuizAttempt`, `QuizAnswer`)
- ✅ نظام مسارات تعليمية (`LearningTrack`, `LearningPath`, `UserTrack`)
- ✅ نظام توصيات أساسي (`TrackRecommendation`)
- ✅ نظام ملف تعليمي (`LearningProfile`)
- ✅ نظام بحث بسيط (text-based search في `/search`)
- ✅ نظام تحديات وإنجازات (`Challenge`, `ChallengeCompletion`)
- ✅ نظام تقييمات ومراجعات (`Review`, `Rating`)
- ✅ نظام واجبات (`Assignment`, `AssignmentSubmission`)
- ✅ نظام مجتمع ومنتديات وتبليغات

### ما هو ناقص تماماً (يجب بناؤه من الصفر):
- ❌ AI Configuration Layer (دعم متعدد المزودين)
- ❌ AI Learning Assistant (المساعد التعليمي الذكي)
- ❌ مساعد داخل الدروس (Lesson AI Assistant)
- ❌ AI Context Awareness
- ❌ التوصيات الذكية المبنية على AI
- ❌ تحليل الأداء التعليمي بالذكاء الاصطناعي
- ❌ اكتشاف فجوات المعرفة
- ❌ توليد الاختبارات بالذكاء الاصطناعي
- ❌ توليد الملخصات
- ❌ إنشاء بطاقات مراجعة (Flashcards)
- ❌ مولد الواجبات الذكي
- ❌ مساعد المعلم الذكي
- ❌ AI Analytics للمعلمين والإدارة
- ❌ البحث الذكي (Natural Language + Semantic Search)
- ❌ AI Chat History & Memory Layer
- ❌ AI Notifications (اقتراحات ذكية)
- ❌ AI Gamification (تحديات ذكية)
- ❌ AI Content Moderation
- ❌ جداول قاعدة البيانات للأنظمة الذكية
- ❌ APIs الخاصة بالذكاء الاصطناعي
- ❌ نظام Caching و Rate Limiting للـ AI
- ❌ Streaming Responses

---

## خطة التنفيذ

### المكون 1: البنية التحتية للذكاء الاصطناعي (AI Infrastructure)

#### [NEW] [ai-config.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-config.ts)
- إنشاء AI Configuration Layer المرن
- دعم مزودين متعددين: Groq (أساسي)، Google Gemini، OpenAI (مستقبلي)
- واجهة موحدة `AIProvider` مع `generateText()` و `generateStream()`
- نظام fallback بين المزودين
- إدارة التكاليف: Rate Limiting + Caching + Token Counting
- إعدادات قابلة للتبديل بدون إعادة بناء

#### [NEW] [ai-cache.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-cache.ts)
- نظام Caching ذكي للاستجابات
- مفاتيح Cache مبنية على السياق (دورة + درس + سؤال)
- TTL قابل للتكوين
- استخدام Map في الذاكرة (يمكن ترقيته لـ Redis لاحقاً)

---

### المكون 2: قاعدة البيانات - جداول AI الجديدة

#### [MODIFY] [schema.prisma](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/prisma/schema.prisma)

إضافة النماذج التالية:

```
AiConversation     - محادثات الذكاء الاصطناعي
AiMessage          - رسائل المحادثات
AiRecommendation   - التوصيات الذكية
AiLearningProfile  - ملف التعلم الذكي (يمتد LearningProfile الحالي)
AiGeneratedQuiz    - الاختبارات المولدة
AiFlashcard        - بطاقات المراجعة
AiLearningPath     - مسارات التعلم المقترحة بالـ AI
AiAnalysisReport   - تقارير التحليل الذكية
AiSummary          - الملخصات المولدة
AiModerationLog    - سجل المراقبة الذكية
```

---

### المكون 3: المساعد التعليمي الذكي (AI Learning Assistant)

#### [NEW] [ai-assistant.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/ai-assistant.tsx)
- مكون Chat Widget عائم يظهر في كل الصفحات المطلوبة
- واجهة محادثة أنيقة مع تاريخ المحادثات
- دعم Streaming Responses (الرد يظهر حرفاً حرفاً)
- أزرار سريعة: شرح المفهوم، أمثلة إضافية، تبسيط، مصادر
- يتكامل مع سياق الصفحة الحالية (دورة/درس/اختبار)
- تصميم RTL مع دعم الوضع الداكن

#### [NEW] [lesson-ai-helper.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/lesson-ai-helper.tsx)
- مساعد مدمج داخل صفحة الدرس
- تحديد نص وطرح سؤال عنه
- يعرف الدورة والدرس الحالي ومحتواه
- أزرار: "اشرح هذا"، "أعطني مثال"، "بسّط لي"

#### [NEW] API Route: [/api/ai/chat/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/chat/route.ts)
- نقطة نهاية المحادثة الرئيسية
- تدعم Streaming
- تتحقق من Authentication
- تدعم السياق (دورة، درس، اختبار)
- Rate Limiting (15 رسالة/دقيقة)
- حفظ المحادثات والرسائل

#### [NEW] API Route: [/api/ai/conversations/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/conversations/route.ts)
- جلب تاريخ المحادثات
- إنشاء محادثة جديدة
- استرجاع محادثة سابقة

---

### المكون 4: التوصيات الذكية ومسارات التعلم

#### [NEW] [ai-recommendations.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-recommendations.ts)
- تحليل مستوى الطالب واهتماماته ونشاطه
- اقتراح دورات ومسارات ومقالات واختبارات
- اعتماد على: LearningProfile, UserTrack, Enrollments, QuizAttempts
- نتائج مخزنة في `AiRecommendation`

#### [NEW] API Route: [/api/ai/recommendations/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/recommendations/route.ts)
- توليد توصيات ذكية للطالب
- اقتراح الخطوة التالية في المسار

---

### المكون 5: تحليل الأداء واكتشاف الفجوات

#### [NEW] [ai-analytics.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-analytics.ts)
- تحليل نتائج الاختبارات وتحديد نقاط القوة والضعف
- اكتشاف الدروس الصعبة والمفاهيم الضعيفة
- توليد تقارير ذكية مع اقتراحات تحسين
- تحليل أداء الطلاب للمعلمين
- تحليل نمو المنصة وجودة المحتوى للإدارة

#### [NEW] API Route: [/api/ai/analysis/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/analysis/route.ts)
- تحليل أداء طالب معين
- تحليل أداء دورة معينة

#### [NEW] [student-ai-insights.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/student-ai-insights.tsx)
- عرض تقارير الأداء الذكية في لوحة الطالب
- رسوم بيانية لنقاط القوة والضعف
- اقتراحات تحسين مخصصة

---

### المكون 6: توليد المحتوى التعليمي

#### [NEW] API Route: [/api/ai/generate-quiz/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/generate-quiz/route.ts)
- توليد اختبارات من محتوى درس أو دورة
- أنواع: Multiple Choice, True/False, Multiple Select
- استخراج المفاهيم المهمة وتوليد أسئلة متنوعة
- اقتراح الإجابات الصحيحة

#### [NEW] API Route: [/api/ai/generate-summary/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/generate-summary/route.ts)
- تلخيص الدروس والدورات والمقالات
- 3 مستويات: مختصر، متوسط، مفصل

#### [NEW] API Route: [/api/ai/generate-flashcards/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/generate-flashcards/route.ts)
- إنشاء Flashcards تلقائية
- استخراج المصطلحات المهمة

#### [NEW] API Route: [/api/ai/generate-assignments/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/generate-assignments/route.ts)
- اقتراح واجبات ومهام تدريبية وتحديات تعليمية

#### [NEW] [ai-quiz-generator.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/ai-quiz-generator.tsx)
- واجهة للمعلم لتوليد اختبارات بالذكاء الاصطناعي

#### [NEW] [ai-flashcards.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/ai-flashcards.tsx)
- عرض بطاقات المراجعة بشكل تفاعلي (flip cards)

#### [NEW] [ai-summary-viewer.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/ai-summary-viewer.tsx)
- عرض الملخصات مع اختيار المستوى

---

### المكون 7: مساعد المعلم الذكي و AI Analytics

#### [NEW] [teacher-ai-tools/page.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/ai-tools/page.tsx)
- لوحة أدوات الذكاء الاصطناعي للمعلم
- تحسين محتوى الدورة
- اقتراح مواضيع جديدة
- تحليل أداء الطلاب
- اقتراح اختبارات
- توليد واجبات

#### [NEW] [admin AI analytics page](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/admin/ai-analytics/page.tsx)
- تحليل نمو المنصة
- تحليل الاحتفاظ بالمستخدمين
- تحليل جودة المحتوى
- تحليل أداء الطلاب الكلي

#### [NEW] API Route: [/api/ai/teacher-assistant/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/teacher-assistant/route.ts)
- مساعد ذكي للمعلم

---

### المكون 8: البحث الذكي

#### [MODIFY] [search/page.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/search/page.tsx)
- ترقية من بحث نصي بسيط إلى بحث ذكي
- دعم Natural Language Search
- البحث في الدورات، الدروس، المقالات
- Semantic Search يعتمد على المعنى والسياق

#### [NEW] API Route: [/api/ai/search/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/search/route.ts)
- معالجة استعلامات البحث الذكي
- تحويل الاستعلام الطبيعي إلى معايير بحث
- ترتيب النتائج حسب الملاءمة

---

### المكون 9: AI Chat History & Memory

#### [MODIFY] [ai-assistant.tsx](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/ai-assistant.tsx)
- حفظ واسترجاع المحادثات
- عرض تاريخ المحادثات السابقة

#### يتم من خلال جدول `AiConversation` و `AiMessage` + حقول ذاكرة في `AiLearningProfile`

---

### المكون 10: AI Notifications & Gamification

#### [NEW] [ai-notifications.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-notifications.ts)
- إرسال إشعارات ذكية بناءً على سلوك المستخدم
- اقتراح مراجعة دورة أو اختبار بعد فترة
- سلسلة: فشل اختبار → اكتشاف ضعف → اقتراح درس → خطة مراجعة → إشعار
- سلسلة: إكمال دورة → تحليل أداء → اقتراح الدورة التالية → أهداف جديدة

#### تحسين نظام Gamification بتحديات ذكية وأهداف شخصية

---

### المكون 11: AI Content Moderation

#### [NEW] [ai-moderation.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/lib/ai-moderation.ts)
- فحص المحتوى المجتمعي: سبام، إساءة، محتوى غير مناسب
- تكامل مع نظام التبليغات الحالي (`Report` model)

#### [NEW] API Route: [/api/ai/moderate/route.ts](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/api/ai/moderate/route.ts)

---

### المكون 12: التكامل مع الأنظمة الحالية

#### [MODIFY] [lesson page](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/lessons/[id]/page.tsx)
- إضافة مساعد AI داخل الدرس
- زر تلخيص الدرس
- زر إنشاء flashcards

#### [MODIFY] [student dashboard](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/student/page.tsx)
- إضافة قسم AI Insights
- إضافة التوصيات الذكية
- إضافة زر فتح المساعد الذكي

#### [MODIFY] [course detail page](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/courses/[slug]/page.tsx)
- زر تلخيص الدورة
- عرض توصيات ذكية مرتبطة

#### [MODIFY] [student sidebar](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/student-sidebar.tsx)
- إضافة روابط AI في القائمة الجانبية

#### [MODIFY] [teacher sidebar](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/teacher-sidebar.tsx)
- إضافة روابط أدوات AI للمعلم

#### [MODIFY] [admin sidebar](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/components/admin-sidebar.tsx)
- إضافة رابط AI Analytics للإدارة

#### [MODIFY] [quiz page](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/quizzes/[id]/page.tsx)
- إضافة مساعد AI أثناء الاختبار

#### [NEW] [layout.tsx root](file:///c:/Users/dell/Desktop/AlShafra.com/my-news-site/app/layout.tsx)
- إضافة AI Assistant Widget عالمي

---

## خطة التحقق

### اختبارات تلقائية
- `npm run build` للتأكد من عدم وجود أخطاء TypeScript
- اختبار كل API route بالطلبات المختلفة

### التحقق اليدوي
- تشغيل المساعد الذكي في صفحة الدرس والتحقق من الاستجابات
- توليد اختبار من محتوى درس
- التحقق من عمل البحث الذكي
- التحقق من ظهور التوصيات في لوحة الطالب
- التحقق من أدوات المعلم الذكية

---

## ترتيب التنفيذ

| الترتيب | المكون | الأولوية |
|---------|--------|----------|
| 1 | البنية التحتية AI (ai-config, ai-cache) | 🔴 حرجة |
| 2 | جداول قاعدة البيانات | 🔴 حرجة |
| 3 | المساعد التعليمي الذكي + Chat API | 🔴 حرجة |
| 4 | مساعد داخل الدروس | 🔴 حرجة |
| 5 | توليد المحتوى (اختبارات، ملخصات، flashcards) | 🟡 عالية |
| 6 | التوصيات الذكية | 🟡 عالية |
| 7 | تحليل الأداء واكتشاف الفجوات | 🟡 عالية |
| 8 | البحث الذكي | 🟡 عالية |
| 9 | مساعد المعلم + AI Analytics | 🟢 متوسطة |
| 10 | AI Notifications & Gamification | 🟢 متوسطة |
| 11 | AI Content Moderation | 🟢 متوسطة |
| 12 | التكامل مع الأنظمة الحالية | 🔴 حرجة (مستمر) |

---

> [!IMPORTANT]
> هذه الخطة تحتاج موافقتك قبل البدء بالتنفيذ. هل تريد تعديل أي جزء أو إضافة متطلبات إضافية؟
