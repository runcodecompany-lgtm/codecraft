'use client'

import { Trash2 } from 'lucide-react'
import { deletePost } from '@/lib/actions'
import { useState } from 'react'

export default function DeletePostButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      setLoading(true)
      await deletePost(id)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
