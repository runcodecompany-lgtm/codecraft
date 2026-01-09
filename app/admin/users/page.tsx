'use client'

import React, { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  PenTool, 
  Trash2, 
  Edit2, 
  X, 
  Upload, 
  Loader2,
  Mail,
  User as UserIcon,
  Lock,
  Camera
} from 'lucide-react'
import { compressImage } from '@/lib/compress'
import { uploadImage } from '@/lib/upload'

interface User {
  id: string
  username: string
  alias: string | null
  email: string
  role: 'ADMIN' | 'WRITER'
  image: string | null
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    alias: '',
    email: '',
    password: '',
    role: 'WRITER' as 'ADMIN' | 'WRITER',
    image: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // ضغط الصورة وتحويلها لـ WebP
      const compressedFile = await compressImage(file, 400, 0.8)
      // رفع الصورة
      const imageUrl = await uploadImage(compressedFile)
      setFormData(prev => ({ ...prev, image: imageUrl }))
    } catch (err) {
      console.error('Image upload failed:', err)
      setError('فشل رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // التحقق من البيانات
    if (formData.password && formData.password.length < 8) {
      setError('كلمة المرور يجب أن لا تقل عن 8 رموز')
      setSubmitting(false)
      return
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save user')
      }

      await fetchUsers()
      closeModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const openModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        alias: user.alias || '',
        email: user.email,
        password: '', // لا نعرض كلمة المرور الحالية
        role: user.role,
        image: user.image || ''
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        alias: '',
        email: '',
        password: '',
        role: 'WRITER',
        image: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setError('')
  }

  return (
    <div className="p-6 space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">إدارة المستخدمين</h1>
            <p className="text-sm text-gray-500">أضف وتحكم في أعضاء فريق العمل وصلاحياتهم</p>
          </div>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-5 h-5" />
          إضافة عضو جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">المستخدم</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">الدور</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ الانضمام</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          {user.image ? (
                            <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <UserIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.alias || user.username}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-50 text-purple-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.role === 'ADMIN' ? <ShieldCheck className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />}
                        {user.role === 'ADMIN' ? 'مدير' : 'كاتب'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-gray-900">
                {editingUser ? 'تعديل بيانات العضو' : 'إضافة عضو جديد للفريق'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="md:col-span-2 flex flex-col items-center gap-4 py-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-gray-300" />
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-all transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">الصورة الشخصية (سيتم تحويلها لـ WebP تلقائياً)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">اسم المستخدم</label>
                  <div className="relative">
                    <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="مثلاً: ahmed_dev"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">الاسم المستعار (للجمهور)</label>
                  <div className="relative">
                    <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={formData.alias}
                      onChange={(e) => setFormData({...formData, alias: e.target.value})}
                      className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="مثلاً: أحمد علي"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    كلمة المرور {editingUser && '(اتركه فارغاً للحفاظ على القديمة)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">الصلاحية (الدور)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'WRITER'})}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.role === 'WRITER' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <PenTool className="w-5 h-5" />
                      <span className="font-bold">كاتب أخبار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'ADMIN'})}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.role === 'ADMIN' 
                          ? 'border-purple-600 bg-purple-50 text-purple-600' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span className="font-bold">مدير نظام</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {editingUser ? 'تحديث البيانات' : 'إنشاء الحساب الآن'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
