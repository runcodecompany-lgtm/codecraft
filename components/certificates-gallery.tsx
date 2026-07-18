// components/certificates-gallery.tsx
"use client"

import React, { useState } from "react"
import { Award, Eye, Calendar, AwardIcon, Bookmark, XCircle } from "lucide-react"
import CertificateViewer from "@/components/certificate-viewer"

interface CertificateItem {
  id: string
  certificateNumber: string
  createdAt: Date
  course: {
    title: string
  }
}

interface CertificatesGalleryProps {
  certificates: CertificateItem[]
  studentName: string
}

export default function CertificatesGallery({
  certificates,
  studentName,
}: CertificatesGalleryProps) {
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6" dir="rtl">
      {certificates.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
          <Award className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">لا توجد شهادات بعد</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            أكمل 100% من دروس واختبارات أي دورة تعليمية لتوليد شهادة إتمام معتمدة هنا تلقائياً!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 rounded-2xl p-5 hover:border-violet-500/40 dark:hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
            >
              {/* Decorative accent top bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-violet-500 to-indigo-500" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400">
                  <AwardIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-mono">
                  {cert.certificateNumber}
                </span>
              </div>

              <div className="flex-1 mt-4">
                <h4 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {cert.course.title}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>أنجزت في: {formatDate(cert.createdAt)}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-violet-500 dark:text-violet-400">
                <span>عرض الشهادة المعتمدة</span>
                <Eye className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal View Overlay */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl relative shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="pt-4 pb-2 text-center text-white">
              <h3 className="font-black text-xl">عرض الشهادة المعتمدة</h3>
              <p className="text-xs text-slate-400 mt-0.5">الرقم التسلسلي: {selectedCert.certificateNumber}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl flex justify-center">
              <CertificateViewer
                studentName={studentName}
                courseName={selectedCert.course.title}
                completionDate={formatDate(selectedCert.createdAt)}
                serialNumber={selectedCert.certificateNumber}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
