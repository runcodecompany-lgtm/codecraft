"use client"

import React, { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash, BookOpen, Layers, FileText, Coins, Save, AlertCircle, Sparkles } from "lucide-react"
import { createNestedCourse } from "@/actions/course"

// Zod nested validation schema
const lessonSchema = z.object({
  title: z.string().min(3, "عنوان الدرس يجب أن يكون 3 حروف على الأقل"),
  content: z.string().optional(),
  videoUrl: z.string().url("يجب إدخال رابط فيديو صالح").or(z.literal("")).optional(),
  duration: z.coerce.number().min(1, "المدة الزمنية يجب أن تكون دقيقة واحدة على الأقل"),
})

const moduleSchema = z.object({
  title: z.string().min(3, "عنوان الوحدة يجب أن يكون 3 حروف على الأقل"),
  lessons: z.array(lessonSchema).min(1, "يجب إضافة درس واحد على الأقل داخل كل وحدة تعليمية"),
})

const courseBuilderSchema = z.object({
  title: z.string().min(5, "عنوان الدورة يجب أن يكون 5 حروف على الأقل"),
  description: z.string().min(15, "وصف الدورة يجب أن يكون 15 حرفاً على الأقل"),
  coverImage: z.string().url("رابط الصورة غير صالح").or(z.literal("")).optional(),
  priceInCoins: z.coerce.number().min(0, "السعر بالعملات يجب أن يكون صفر أو أكثر"),
  isPublished: z.boolean().default(false),
  modules: z.array(moduleSchema).min(1, "يجب إضافة وحدة تعليمية واحدة على الأقل للدورة"),
})

type CourseBuilderFormValues = z.infer<typeof courseBuilderSchema>

export default function CourseBuilder() {
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(courseBuilderSchema),
    defaultValues: {
      title: "",
      description: "",
      coverImage: "",
      priceInCoins: 0,
      isPublished: false,
      modules: [
        {
          title: "الوحدة التعليمية الأولى",
          lessons: [{ title: "الدرس الأول الممهد", duration: 10, content: "", videoUrl: "" }],
        },
      ],
    },
  })

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control,
    name: "modules",
  })

  const onSubmit = async (data: CourseBuilderFormValues) => {
    setLoading(true)
    setStatusMsg(null)
    try {
      const response = await createNestedCourse(data)
      if (response.success) {
        setStatusMsg({
          type: "success",
          text: `تم حفظ الدورة بنجاح! معرف الدورة: ${response.courseId}. الرابط المختصر: /courses/${response.slug}`,
        })
        reset()
      } else {
        setStatusMsg({
          type: "error",
          text: response.error || "فشل حفظ الدورة.",
        })
      }
    } catch (err) {
      console.error(err)
      setStatusMsg({
        type: "error",
        text: "حدث خطأ أثناء الاتصال بالخادم وحفظ البيانات.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 lg:p-8 text-white relative" dir="rtl">
      {/* Glow top right */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <Sparkles className="w-8 h-8 text-indigo-400" />
        <div>
          <h2 className="text-2xl font-black">منشئ المقررات التعليمية المتطور</h2>
          <p className="text-sm text-slate-400 mt-1">ابنِ دورتك بهيكلية متداخلة (دورة ➔ وحدات ➔ دروس) بكل مرونة وسهولة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Course Info Grid */}
        <div className="space-y-4 bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl">
          <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5" />
            <span>بيانات الدورة الأساسية</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">عنوان الدورة</label>
              <input
                type="text"
                placeholder="أدخل عنواناً جذاباً..."
                {...register("title")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 transition-all"
              />
              {errors.title?.message && (
                <p className="text-rose-400 text-xs mt-1">{String(errors.title.message)}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">السعر بعملات Craft (0 للمجاني)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="250"
                  {...register("priceInCoins")}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 transition-all"
                />
                <Coins className="absolute left-3 top-3 w-5 h-5 text-amber-500" />
              </div>
              {errors.priceInCoins?.message && (
                <p className="text-rose-400 text-xs mt-1">{String(errors.priceInCoins.message)}</p>
              )}
            </div>

            {/* Cover Image Link */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">رابط صورة الغلاف (اختياري)</label>
              <input
                type="text"
                placeholder="https://example.com/image.png"
                {...register("coverImage")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 transition-all"
              />
              {errors.coverImage?.message && (
                <p className="text-rose-400 text-xs mt-1">{String(errors.coverImage.message)}</p>
              )}
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 px-4 py-3 rounded-xl">
              <span className="text-sm font-bold text-slate-300">نشر الدورة فوراً؟</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register("isPublished")} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">وصف الدورة</label>
            <textarea
              rows={3}
              placeholder="اكتب وصفاً مفصلاً يغطي أهداف الدورة وما سيتعلمه الطالب..."
              {...register("description")}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 transition-all resize-none"
            />
            {errors.description?.message && (
              <p className="text-rose-400 text-xs mt-1">{String(errors.description.message)}</p>
            )}
          </div>
        </div>

        {/* Modules & Lessons Fields */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Layers className="w-5.5 h-5.5 text-indigo-400" />
              <span>مخطط الوحدات والدروس</span>
            </h3>
            <button
              type="button"
              onClick={() => appendModule({ title: `الوحدة التعليمية ${moduleFields.length + 1}`, lessons: [{ title: "الدرس الأول", duration: 10 }] })}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3.5 py-2 rounded-xl border border-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وحدة جديدة</span>
            </button>
          </div>

          {(errors.modules as any)?.message && (
            <p className="text-rose-400 text-sm">{String((errors.modules as any).message)}</p>
          )}

          {moduleFields.map((moduleField, moduleIndex) => (
            <div key={moduleField.id} className="rounded-2xl border border-slate-800 bg-slate-950/20 p-5 space-y-4 relative">
              <button
                type="button"
                onClick={() => removeModule(moduleIndex)}
                className="absolute top-4 left-4 text-slate-500 hover:text-rose-400 transition-colors"
                title="حذف الوحدة"
              >
                <Trash className="w-4.5 h-4.5" />
              </button>

              <div className="w-2/3 space-y-1">
                <label className="text-xs font-bold text-indigo-300">اسم الوحدة {moduleIndex + 1}</label>
                <input
                  type="text"
                  {...register(`modules.${moduleIndex}.title`)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
                {(errors.modules as any)?.[moduleIndex]?.title?.message && (
                  <p className="text-rose-400 text-xs mt-1">
                    {String((errors.modules as any)[moduleIndex].title.message)}
                  </p>
                )}
              </div>

              {/* Lessons inside this module */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>الدروس داخل هذه الوحدة</span>
                  </h4>
                  <AddLessonButton control={control} moduleIndex={moduleIndex} />
                </div>

                {(errors.modules as any)?.[moduleIndex]?.lessons?.message && (
                  <p className="text-rose-400 text-xs">
                    {String((errors.modules as any)[moduleIndex].lessons.message)}
                  </p>
                )}

                <LessonsList control={control} moduleIndex={moduleIndex} register={register} errors={errors} />
              </div>
            </div>
          ))}
        </div>

        {/* Server action response status alerts */}
        {statusMsg && (
          <div
            className={`rounded-2xl border p-5 transition-all ${
              statusMsg.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/5 text-rose-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{statusMsg.text}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-8 py-4 font-bold hover:scale-[1.01] hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/10"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>حفظ وتوليد المقرر التعليمي بالكامل</span>
        </button>
      </form>
    </div>
  )
}

// Subcomponents helper to safely manage nesting layers
interface LessonsListProps {
  control: any
  moduleIndex: number
  register: any
  errors: any
}

function LessonsList({ control, moduleIndex, register, errors }: LessonsListProps) {
  const { fields: lessonFields, remove: removeLesson } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  })

  return (
    <div className="space-y-3.5">
      {lessonFields.map((lessonField, lessonIndex) => (
        <div key={lessonField.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800/80 p-4 rounded-xl relative">
          {lessonFields.length > 1 && (
            <button
              type="button"
              onClick={() => removeLesson(lessonIndex)}
              className="absolute -top-1.5 -left-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 p-1.5 rounded-full border border-slate-800 shadow"
              title="حذف الدرس"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Title */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">عنوان الدرس {lessonIndex + 1}</label>
            <input
              type="text"
              placeholder="مثال: مدخل إلى وسوم التنسيق"
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.title`)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
            {(errors.modules as any)?.[moduleIndex]?.lessons?.[lessonIndex]?.title?.message && (
              <p className="text-rose-400 text-[10px]">
                {String((errors.modules as any)[moduleIndex].lessons[lessonIndex].title.message)}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">المدة الزمنية (بالدقائق)</label>
            <input
              type="number"
              placeholder="10"
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.duration`)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
            {(errors.modules as any)?.[moduleIndex]?.lessons?.[lessonIndex]?.duration?.message && (
              <p className="text-rose-400 text-[10px]">
                {String((errors.modules as any)[moduleIndex].lessons[lessonIndex].duration.message)}
              </p>
            )}
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">رابط فيديو الشرح</label>
            <input
              type="text"
              placeholder="https://youtube.com/..."
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.videoUrl`)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
            {(errors.modules as any)?.[moduleIndex]?.lessons?.[lessonIndex]?.videoUrl?.message && (
              <p className="text-rose-400 text-[10px]">
                {String((errors.modules as any)[moduleIndex].lessons[lessonIndex].videoUrl.message)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AddLessonButton({ control, moduleIndex }: { control: any; moduleIndex: number }) {
  const { append } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  })

  return (
    <button
      type="button"
      onClick={() => append({ title: "", duration: 10, content: "", videoUrl: "" })}
      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>إضافة درس</span>
    </button>
  )
}
