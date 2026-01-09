import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('مفاتيح Supabase غير موجودة في ملف .env.local')
}

// العميل العادي للواجهة الأمامية
export const supabase = createBrowserClient(
  (supabaseUrl || '').trim(),
  (supabaseAnonKey || '').trim()
)

// عميل المسؤول للعمليات في الخلفية (API)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(
      (supabaseUrl || '').trim(),
      supabaseServiceKey.trim(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null