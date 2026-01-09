'use client'
export const dynamic = 'force-dynamic';
import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface KeywordsInputProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
}

export default function KeywordsInput({ keywords, onChange }: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeywords(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      removeKeyword(keywords.length - 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    addKeywords(pastedData)
  }

  const addKeywords = (text: string) => {
    if (!text.trim()) return

    // تقسيم النص بناءً على الفواصل (العربية والإنجليزية)
    const newKeywordsArray = text
      .split(/[،,]/)
      .map(word => word.trim())
      .filter(word => word !== '' && !keywords.includes(word))

    if (newKeywordsArray.length > 0) {
      // إزالة التكرار من الكلمات الجديدة نفسها
      const uniqueNewKeywords = [...new Set(newKeywordsArray)]
      onChange([...keywords, ...uniqueNewKeywords])
      setInputValue('')
    } else {
      setInputValue('')
    }
  }

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index)
    onChange(newKeywords)
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all min-h-[46px]">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
          >
            <span>{keyword}</span>
            <button
              type="button"
              onClick={() => removeKeyword(index)}
              className="hover:text-blue-900 transition-colors focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => addKeywords(inputValue)}
          placeholder={keywords.length === 0 ? "أضف كلمات مفتاحية (Enter أو فاصلة)..." : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px] py-1"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 mr-1">
        اضغط Enter أو استخدم الفاصلة لإضافة كلمة جديدة.
      </p>
    </div>
  )
}
