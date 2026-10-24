import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_SUPABASE'))
export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : null

export function requireSupabase() {
  if (!supabase) throw new Error('Chưa cấu hình Supabase. Hãy tạo file .env theo hướng dẫn trong README.')
  return supabase
}