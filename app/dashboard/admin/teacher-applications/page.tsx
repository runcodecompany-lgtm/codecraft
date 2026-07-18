import { getTeacherApplicationsForAdmin, reviewTeacherApplicationAction } from "@/actions/teacher-applications"
import Link from "next/link"

export default async function TeacherApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>
}) {
  const params = (await searchParams) || {}
  const result = await getTeacherApplicationsForAdmin(params.q, params.status)

  if (!result.success) {
    return <div className="p-6 text-sm text-red-600">{result.error}</div>
  }

  return (
    <main className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">طلبات اعتماد المعلمين</h1>
          <p className="text-sm text-slate-500">مراجعة ملفات المعلمين والوثائق ومنح أو حجب صلاحيات التدريس.</p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="بحث بالاسم أو البريد أو التخصص"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <option value="">كل الحالات</option>
            <option value="PENDING">قيد المراجعة</option>
            <option value="APPROVED">معتمد</option>
            <option value="REJECTED">مرفوض</option>
            <option value="CHANGES_REQUESTED">تعديلات مطلوبة</option>
            <option value="SUSPENDED">موقوف</option>
          </select>
          <button className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
            تطبيق
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-right">المعلم</th>
              <th className="px-4 py-3 text-right">التخصص</th>
              <th className="px-4 py-3 text-right">الخبرة</th>
              <th className="px-4 py-3 text-right">الوثائق</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.applications.map((application) => (
              <tr key={application.id}>
                <td className="px-4 py-4 align-top">
                  <div className="font-bold text-slate-950 dark:text-white">{application.teacher.name}</div>
                  <div className="text-xs text-slate-500">{application.teacher.email}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {application.teacher.country || application.teacherProfile.country || "غير محدد"} ·{" "}
                    {application.teacher.emailVerified ? "بريد موثق" : "بريد غير موثق"}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="font-semibold">{application.teacherProfile.specialization || application.teacherProfile.title || "-"}</div>
                  <p className="mt-1 line-clamp-2 max-w-sm text-xs text-slate-500">{application.teacherProfile.bio || "-"}</p>
                  <div className="mt-2 text-xs text-slate-500">{application.teacherProfile.skills || "-"}</div>
                </td>
                <td className="px-4 py-4 align-top">{application.teacherProfile.yearsOfExperience || 0} سنة</td>
                <td className="px-4 py-4 align-top">
                  {application.teacherProfile.cvUrl ? (
                    <Link className="font-bold text-indigo-600 hover:underline" href={application.teacherProfile.cvUrl}>
                      عرض السيرة
                    </Link>
                  ) : (
                    <span className="text-slate-400">لا يوجد</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-900">
                    {application.status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {(["APPROVED", "REJECTED", "CHANGES_REQUESTED", "SUSPENDED"] as const).map((status) => (
                      <form
                        key={status}
                        action={async () => {
                          "use server"
                          await reviewTeacherApplicationAction({
                            applicationId: application.id,
                            status,
                            reviewerNotes: status === "APPROVED" ? "Approved by admin review." : undefined,
                            requestedChanges: status === "CHANGES_REQUESTED" ? "Please complete or update the required documents." : undefined,
                          })
                        }}
                      >
                        <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
                          {status === "APPROVED"
                            ? "اعتماد"
                            : status === "REJECTED"
                              ? "رفض"
                              : status === "CHANGES_REQUESTED"
                                ? "طلب تعديل"
                                : "إيقاف"}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {result.applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  لا توجد طلبات مطابقة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
