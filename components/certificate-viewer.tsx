"use client"

import React, { useRef, useState } from "react"
import { Download, Award, CheckCircle, Loader2 } from "lucide-react"

interface CertificateViewerProps {
  studentName: string
  courseName: string
  completionDate?: string
  /** Optional: pass a pre-generated serial; if omitted, one is generated client-side */
  serialNumber?: string
}

function generateSerial(): string {
  const now = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CC-${now}-${rand}`
}

export default function CertificateViewer({
  studentName,
  courseName,
  completionDate,
  serialNumber,
}: CertificateViewerProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const serial = serialNumber ?? generateSerial()
  const date =
    completionDate ??
    new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)

    try {
      // Dynamic imports to keep bundle size lean (only load when user clicks)
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      // A4 landscape: 297 × 210 mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH)
      pdf.save(`شهادة-${studentName.replace(/\s+/g, "_")}-${serial}.pdf`)
    } catch (err) {
      console.error("Error generating PDF:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6" dir="rtl">
      {/* ── Certificate Canvas ──────────────────────────────────────────────── */}
      <div
        ref={certRef}
        className="w-full max-w-3xl aspect-[297/210] relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        {/* Decorative outer border ring */}
        <div className="absolute inset-3 rounded-xl border-2 border-violet-500/30 pointer-events-none" />
        <div className="absolute inset-4 rounded-xl border border-indigo-400/20 pointer-events-none" />

        {/* Corner ornaments */}
        <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-amber-400/50 rounded-tr-2xl" />
        <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-amber-400/50 rounded-tl-2xl" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-amber-400/50 rounded-br-2xl" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-amber-400/50 rounded-bl-2xl" />

        {/* Ambient glows */}
        <div className="absolute top-0 right-1/3 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-16 py-12 gap-5">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30 mb-2">
            <Award className="w-9 h-9 text-slate-900" />
          </div>

          {/* Platform name */}
          <p className="text-sm font-bold tracking-[0.3em] text-violet-300 uppercase">
            Code Craft Core
          </p>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            شهادة إتمام الدورة
          </h1>

          {/* Body */}
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            يُشهد بأن الطالب
          </p>

          <p className="text-2xl md:text-3xl font-black bg-gradient-to-l from-violet-300 to-indigo-300 bg-clip-text text-transparent">
            {studentName}
          </p>

          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            قد أتمّ بنجاح متطلبات الدورة التعليمية
          </p>

          <p className="text-xl font-bold text-amber-400">
            {courseName}
          </p>

          {/* Date & Serial */}
          <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 font-mono border-t border-slate-700/50 pt-4 w-full justify-center">
            <span>تاريخ الإصدار: {date}</span>
            <span className="w-px h-4 bg-slate-700" />
            <span>الرقم التسلسلي: {serial}</span>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
          <CheckCircle className="w-4 h-4" />
          <span>الدورة مكتملة بنجاح</span>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold hover:scale-105 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/20"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{downloading ? "جارٍ التوليد..." : "تحميل الشهادة PDF"}</span>
        </button>
      </div>
    </div>
  )
}
