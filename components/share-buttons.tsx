// components/share-buttons.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react"

interface ShareButtonsProps {
  title: string
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
  }

  return (
    <div className="flex flex-col gap-3.5 p-5 border border-slate-800 bg-slate-900/60 rounded-2xl">
      <h3 className="font-bold text-sm text-slate-450 uppercase tracking-wider">مشاركة المقال</h3>
      <div className="flex items-center gap-3">
        {/* Twitter */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-indigo-650 hover:text-white transition-all flex items-center justify-center text-slate-400"
          aria-label="شارك على تويتر"
        >
          <Twitter className="w-4.5 h-4.5" />
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-blue-650 hover:text-white transition-all flex items-center justify-center text-slate-400"
          aria-label="شارك على فيسبوك"
        >
          <Facebook className="w-4.5 h-4.5" />
        </a>

        {/* LinkedIn */}
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-sky-750 hover:text-white transition-all flex items-center justify-center text-slate-400"
          aria-label="شارك على لينكد إن"
        >
          <Linkedin className="w-4.5 h-4.5" />
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center focus:outline-none ${
            copied 
              ? "bg-emerald-500/20 text-emerald-450 border border-emerald-500/30" 
              : "bg-slate-800/80 hover:bg-slate-700 text-slate-400"
          }`}
          aria-label="نسخ رابط المقال"
        >
          {copied ? <Check className="w-4.5 h-4.5" /> : <Link2 className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  )
}
