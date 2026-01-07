'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 text-right" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ ما!</h2>
        <p className="text-gray-600 mb-6">
          واجهنا مشكلة في تحميل الصفحة. قد يكون هناك خلل في الاتصال بقاعدة البيانات.
        </p>
        <div className="text-xs text-gray-400 mb-6 font-mono bg-gray-100 p-2 rounded overflow-auto">
          {error.message || "Unknown error"}
          {error.digest && <div className="mt-1">Digest: {error.digest}</div>}
        </div>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          حاول مرة أخرى
        </button>
      </div>
    </div>
  )
}
