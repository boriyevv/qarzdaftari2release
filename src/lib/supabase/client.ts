// src/lib/supabase/client.ts
// Bu file brauzerda ishlaydi (client-side)

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Qulaylik uchun
export const supabase = createClient()