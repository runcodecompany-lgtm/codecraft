"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Type, 
  Hash, 
  FileText,
  AlertCircle
} from "lucide-react";

export const dynamic = 'force-dynamic';

interface SEOData {
  titles: string[];
  keywords: string[];
  description?: string;     // لدعم رد Groq
  metaDescription?: string; // لدعم رد Gemini القديم
}

export default function SEOAssistantPage() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SEOData | null>(null);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<{type: string, index: number} | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError("يرجى إدخال محتوى الخبر أولاً");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/seo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("فشل في تحليل البيانات");

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string, index: number = 0) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex({ type, index });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // استخراج الوصف بشكل آمن بغض النظر عن الاسم القادم من الـ API
  const finalDescription = result?.description || result?.metaDescription || "";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center gap-3 mb-8 text-right">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مساعد السيو والكلمات المفتاحية الذكي</h1>
          <p className="text-gray-500 text-sm">استخرج أفضل العناوين والكلمات المفتاحية لخبرك باستخدام الذكاء الاصطناعي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
        {/* منطقة المدخلات */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              محتوى الخبر
            </label>
            <textarea
              className="w-full h-64 p-4 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="قم بلصق محتوى الخبر هنا ليقوم الذكاء الاصطناعي بتحليله..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isLoading 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  تحليل الخبر واستخراج الاقتراحات
                </>
              )}
            </button>
          </div>
        </div>

        {/* منطقة النتائج */}
        <div className="space-y-6">
          {!result && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <p>بانتظار إدخال الخبر لبدء عملية التحليل الذكي</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* العناوين المقترحة */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600" />
                  العناوين المقترحة (SEO Titles)
                </h3>
                <div className="space-y-3">
                  {result.titles?.map((title, i) => (
                    <div key={i} className="group relative bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-gray-800 text-sm leading-relaxed pr-2">{title}</p>
                      <button
                        onClick={() => copyToClipboard(title, "title", i)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 bg-white shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {copiedIndex?.type === "title" && copiedIndex.index === i ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الكلمات المفتاحية */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    الكلمات المفتاحية (Keywords)
                  </h3>
                  {result.keywords && result.keywords.length > 0 && (
                    <button
                      onClick={() => copyToClipboard(result.keywords.join(', '), "all_keywords", 0)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {copiedIndex?.type === "all_keywords" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          تم نسخ الكل
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          نسخ الكل
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* عرض جماعي للكلمات المفتاحية */}
                {result.keywords && result.keywords.length > 0 && (
                  <div className="mb-4">
                    <textarea
                      readOnly
                      className="w-full p-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none resize-none font-sans leading-relaxed"
                      rows={3}
                      value={result.keywords.join(', ')}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {result.keywords?.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(word, "keyword", i)}
                      className="group flex items-center gap-2 bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-colors"
                    >
                      {word}
                      {copiedIndex?.type === "keyword" && copiedIndex.index === i ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* وصف الميتا */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    وصف الميتا (Meta Description)
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {finalDescription.length} حرف
                  </span>
                </div>
                <div className="group relative bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 pl-8">
                    {finalDescription || "لا يوجد وصف مقترح"}
                  </p>
                  <button
                    onClick={() => copyToClipboard(finalDescription, "meta", 0)}
                    className="absolute left-2 bottom-2 p-2 text-gray-400 hover:text-blue-600 bg-white shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedIndex?.type === "meta" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}