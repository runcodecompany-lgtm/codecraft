import { DifficultyLevel } from "@prisma/client"

export interface PlacementQuestion {
  id: string
  questionText: string
  options: string[]
  correctAnswer: string
  difficulty: DifficultyLevel
}

type TrackQuestionBank = {
  title: string
  description: string
  questions: PlacementQuestion[]
}

function question(
  id: string,
  questionText: string,
  options: string[],
  correctAnswer: string,
  difficulty: DifficultyLevel,
): PlacementQuestion {
  return { id, questionText, options, correctAnswer, difficulty }
}

const GENERIC_BANK: TrackQuestionBank = {
  title: "اختبار تحديد المستوى",
  description: "اختبار عام لتحديد المستوى في المسارات التي لا تملك بنك أسئلة مخصصاً بعد.",
  questions: [
    question("g1", "كيف تقيّم معرفتك الحالية بأساسيات هذا المجال؟", ["محدودة", "متوسطة", "جيدة", "متقدمة"], "متوسطة", "BEGINNER"),
    question("g2", "عند مواجهة مفهوم جديد، ما هو أسلوبك المعتاد؟", ["أحتاج شرحاً خطوة بخطوة", "أفهم بعد مثالين", "أستوعب بسرعة", "أحلل المفهوم وحدي"], "أستوعب بسرعة", "BEGINNER"),
    question("g3", "كيف تتعامل مع المصطلحات التخصصية في هذا المجال؟", ["ما زالت جديدة علي", "أفهم بعضها", "أفهم معظمها", "أستخدمها بثقة"], "أفهم معظمها", "INTERMEDIATE"),
    question("g4", "ما مستوى قدرتك على تطبيق المفاهيم عملياً؟", ["أحتاج تدريباً أساسياً", "أطبق مع توجيه", "أطبق بشكل مستقل", "أقود حلولاً معقدة"], "أطبق بشكل مستقل", "INTERMEDIATE"),
    question("g5", "كيف تقيّم خبرتك في حل المشكلات في هذا المجال؟", ["مبتدئ", "أستطيع حل مسائل بسيطة", "أحل مسائل متوسطة", "أحل مسائل متقدمة"], "أحل مسائل متقدمة", "ADVANCED"),
    question("g6", "إلى أي مدى تستطيع شرح المفاهيم للآخرين؟", ["بصعوبة", "في المواضيع الأساسية", "في معظم المواضيع", "في المواضيع المتقدمة"], "في معظم المواضيع", "ADVANCED"),
  ],
}

const TRACK_BANKS: Record<string, TrackQuestionBank> = {
  programming: {
    title: "اختبار تحديد مستوى البرمجة",
    description: "يقيس أساسيات تطوير الويب والمنطق البرمجي وJavaScript وReact.",
    questions: [
      question("p1", "أي وسم HTML يستخدم لإنشاء رابط؟", ["<link>", "<a>", "<href>", "<src>"], "<a>", "BEGINNER"),
      question("p2", "ما القيمة الافتراضية لخاصية display لعنصر div؟", ["inline", "block", "flex", "grid"], "block", "BEGINNER"),
      question("p3", "ما ناتج typeof NaN في JavaScript؟", ["number", "string", "undefined", "object"], "number", "INTERMEDIATE"),
      question("p4", "ما وظيفة event.preventDefault()؟", ["إلغاء العنصر", "منع السلوك الافتراضي", "منع الانتشار فقط", "إعادة الحدث"], "منع السلوك الافتراضي", "INTERMEDIATE"),
      question("p5", "لماذا تكون [1,2] === [1,2] قيمتها false؟", ["لاختلاف المراجع", "لاختلاف الطول", "لأنها نصوص", "لأنها undefined"], "لاختلاف المراجع", "ADVANCED"),
      question("p6", "أي Hook يستخدم لتشغيل Side Effects في React؟", ["useState", "useEffect", "useMemo", "useRef"], "useEffect", "ADVANCED"),
    ],
  },
  physics: {
    title: "اختبار تحديد مستوى الفيزياء",
    description: "يقيس الفهم الأساسي للميكانيكا والكهرباء والمفاهيم الفيزيائية العامة.",
    questions: [
      question("ph1", "ما وحدة قياس القوة في النظام الدولي؟", ["جول", "نيوتن", "وات", "فولت"], "نيوتن", "BEGINNER"),
      question("ph2", "إذا كانت السرعة ثابتة، فالتسارع يساوي:", ["1", "صفر", "يعتمد على الكتلة", "لا يمكن تحديده"], "صفر", "BEGINNER"),
      question("ph3", "ما العلاقة بين الجهد والتيار والمقاومة؟", ["P=VI", "V=IR", "F=ma", "E=mc2"], "V=IR", "INTERMEDIATE"),
      question("ph4", "الطاقة الحركية تتناسب مع:", ["الكتلة فقط", "السرعة فقط", "مربع السرعة", "الحجم"], "مربع السرعة", "INTERMEDIATE"),
      question("ph5", "أي وصف أفضل للقصور الذاتي؟", ["مقاومة الجسم لتغيير حالته الحركية", "قوة تجذب الأجسام للأرض", "قدرة الجسم على الشحن", "تحول الطاقة إلى حرارة"], "مقاومة الجسم لتغيير حالته الحركية", "ADVANCED"),
      question("ph6", "عند زيادة التردد في الموجة مع ثبات السرعة، فإن الطول الموجي:", ["يزداد", "ينعدم", "يقل", "يبقى ثابتاً"], "يقل", "ADVANCED"),
    ],
  },
  chemistry: {
    title: "اختبار تحديد مستوى الكيمياء",
    description: "يقيس أساسيات الذرة والروابط والتفاعلات وتصنيف المواد.",
    questions: [
      question("c1", "العدد الذري يمثل:", ["عدد البروتونات", "عدد النيوترونات", "عدد مستويات الطاقة", "عدد الروابط"], "عدد البروتونات", "BEGINNER"),
      question("c2", "الماء H2O مثال على:", ["عنصر", "مخلوط", "مركب", "فلز"], "مركب", "BEGINNER"),
      question("c3", "الرابطة التي تنتج عن مشاركة الإلكترونات هي:", ["أيونية", "فلزية", "تساهمية", "هيدروجينية"], "تساهمية", "INTERMEDIATE"),
      question("c4", "عند انخفاض قيمة pH فإن المحلول يصبح:", ["أكثر قاعدية", "أكثر حمضية", "متعادل", "أقل تركيزاً"], "أكثر حمضية", "INTERMEDIATE"),
      question("c5", "ما الذي يحدث في تفاعل الأكسدة؟", ["اكتساب إلكترونات", "فقد إلكترونات", "ثبات إلكترونات", "تحول إلى نيوترونات"], "فقد إلكترونات", "ADVANCED"),
      question("c6", "الكيمياء العضوية تركز غالباً على مركبات:", ["الحديد", "الكربون", "الغازات النبيلة", "الأملاح فقط"], "الكربون", "ADVANCED"),
    ],
  },
  mathematics: {
    title: "اختبار تحديد مستوى الرياضيات",
    description: "يقيس الحساب والجبر والدوال وبعض مفاهيم التفكير الرياضي.",
    questions: [
      question("m1", "ما ناتج 12 ÷ 3؟", ["2", "3", "4", "6"], "4", "BEGINNER"),
      question("m2", "حل المعادلة x + 5 = 9 هو:", ["2", "3", "4", "5"], "4", "BEGINNER"),
      question("m3", "ما ميل المستقيم الذي يمر بالنقطتين (0,0) و(2,4)؟", ["1", "2", "3", "4"], "2", "INTERMEDIATE"),
      question("m4", "ما مشتقة x^2؟", ["x", "2x", "x^2", "2"], "2x", "INTERMEDIATE"),
      question("m5", "إذا كانت f(x)=2x+1 فإن f(3)=", ["5", "6", "7", "8"], "7", "ADVANCED"),
      question("m6", "أي فرع رياضي يهتم بدراسة التغير والمعدلات؟", ["الجبر", "الإحصاء", "التفاضل والتكامل", "الهندسة"], "التفاضل والتكامل", "ADVANCED"),
    ],
  },
  languages: {
    title: "اختبار تحديد مستوى اللغات",
    description: "يقيس القراءة والمفردات وفهم التراكيب الأساسية والمتوسطة.",
    questions: [
      question("l1", "أي مهارة تعبّر عن فهم النص المكتوب؟", ["الاستماع", "القراءة", "المحادثة", "الكتابة"], "القراءة", "BEGINNER"),
      question("l2", "المفردات تعني:", ["قواعد اللغة فقط", "الكلمات ومعانيها", "علامات الترقيم", "أصوات الحروف"], "الكلمات ومعانيها", "BEGINNER"),
      question("l3", "ما أفضل طريقة لتحسين الطلاقة؟", ["الحفظ فقط", "الممارسة المنتظمة", "إهمال الأخطاء", "الترجمة الحرفية"], "الممارسة المنتظمة", "INTERMEDIATE"),
      question("l4", "فهم السياق يساعد على:", ["إبطاء التعلم", "تخمين المعنى بدقة", "إلغاء الحاجة للمفردات", "تجنب القراءة"], "تخمين المعنى بدقة", "INTERMEDIATE"),
      question("l5", "أي مهارة تحتاج إلى إنتاج لغوي مباشر؟", ["القراءة", "الاستماع", "المحادثة", "الاستيعاب"], "المحادثة", "ADVANCED"),
      question("l6", "في المستوى المتقدم يركز المتعلم أكثر على:", ["الحروف فقط", "التواصل الدقيق والأسلوب", "الجمل القصيرة فقط", "الترجمة الآلية"], "التواصل الدقيق والأسلوب", "ADVANCED"),
    ],
  },
}

export function normalizeTrackKey(name?: string | null) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .trim()
}

function resolveTrackBank(trackName?: string | null): TrackQuestionBank {
  const key = normalizeTrackKey(trackName)

  // Programming & subpathways (web dev, python, etc.)
  if (key.includes("program") || key.includes("برمج") || key.includes("ويب") || key.includes("web") || key.includes("بايثون") || key.includes("python")) return TRACK_BANKS.programming
  if (key.includes("physics") || key.includes("فيزياء")) return TRACK_BANKS.physics
  if (key.includes("chem") || key.includes("كيمي")) return TRACK_BANKS.chemistry
  if (key.includes("math") || key.includes("رياض")) return TRACK_BANKS.mathematics
  // Languages & subpathways (English, Arabic, etc.)
  if (key.includes("language") || key.includes("لغ") || key.includes("english") || key.includes("arabic") || key.includes("انجليز") || key.includes("عربي")) return TRACK_BANKS.languages

  return GENERIC_BANK
}


export function getPlacementBank(trackName?: string | null) {
  return resolveTrackBank(trackName)
}

export function getPlacementQuestionsForTrack(trackName?: string | null) {
  return resolveTrackBank(trackName).questions
}

export function getDifficultyLabel(level: DifficultyLevel) {
  return {
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
  }[level]
}

export function getDifficultyLabelWithEnglish(level: DifficultyLevel) {
  return {
    BEGINNER: "مبتدئ (Beginner)",
    INTERMEDIATE: "متوسط (Intermediate)",
    ADVANCED: "متقدم (Advanced)",
  }[level]
}

export function getTrackRoleLabel(isPrimary: boolean) {
  return isPrimary ? "المسار الرئيسي" : "مسار ثانوي"
}
