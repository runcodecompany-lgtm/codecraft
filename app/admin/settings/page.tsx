'use client'

import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [formData, setFormData] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
    contactEmail: '',
    phoneNumber: '',
    officeAddress: '',
    siteName: 'أخبارنا',
    siteDescription: '',
    footerCopyright: '',
    googleMapsEmbedUrl: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data && !data.error) {
        // تصفية البيانات لإزالة id و updatedAt
        const { id, updatedAt, ...rest } = data
        setFormData(prev => ({ ...prev, ...rest }))
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل حفظ الإعدادات، حاول مرة أخرى.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">إعدادات الموقع</h1>
            <p className="text-sm text-gray-500">إدارة بيانات التواصل والروابط الاجتماعية والمعلومات العامة</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات التواصل الأساسية */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Mail className="w-5 h-5 text-blue-600" />
            بيانات التواصل الأساسية
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">البريد الإلكتروني الرسمي</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="info@yourdomain.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="+966 50 000 0000"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700">عنوان المكتب / المقر</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={formData.officeAddress}
                  onChange={(e) => setFormData({...formData, officeAddress: e.target.value})}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="الرياض، المملكة العربية السعودية"
                />
              </div>
            </div>
          </div>
        </div>

        {/* روابط التواصل الاجتماعي */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            حسابات التواصل الاجتماعي
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'facebook', label: 'فيسبوك', icon: Facebook, color: 'text-blue-600' },
              { id: 'twitter', label: 'تويتر / X', icon: Twitter, color: 'text-gray-900' },
              { id: 'instagram', label: 'انستجرام', icon: Instagram, color: 'text-pink-600' },
              { id: 'youtube', label: 'يوتيوب', icon: Youtube, color: 'text-red-600' },
              { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, color: 'text-green-600' },
            ].map((social) => (
              <div key={social.id} className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{social.label}</label>
                <div className="relative">
                  <social.icon className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${social.color}`} />
                  <input 
                    type="url"
                    value={(formData as any)[social.id]}
                    onChange={(e) => setFormData({...formData, [social.id]: e.target.value})}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    placeholder={`رابط حساب ${social.label}`}
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* إعدادات الموقع والتذييل */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            إعدادات الموقع والتذييل (Footer)
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم الموقع</label>
              <input 
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">وصف الموقع (يظهر في الفوتر)</label>
              <textarea 
                value={formData.siteDescription}
                onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[100px]"
                placeholder="وصف مختصر للموقع يظهر أسفل اللوجو في الفوتر..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">حقوق النشر (Copyright)</label>
              <input 
                type="text"
                value={formData.footerCopyright}
                onChange={(e) => setFormData({...formData, footerCopyright: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="© 2026 جميع الحقوق محفوظة لشبكة أخبارنا"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رابط خريطة جوجل (Embed URL)</label>
              <input 
                type="text"
                value={formData.googleMapsEmbedUrl}
                onChange={(e) => setFormData({...formData, googleMapsEmbedUrl: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="https://www.google.com/maps/embed?pb=..."
                dir="ltr"
              />
              <p className="text-[10px] text-gray-400 mr-2">أدخل رابط src الموجود داخل وسم iframe من خرائط جوجل</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  )
}
