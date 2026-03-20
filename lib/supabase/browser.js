import { createBrowserClient } from '@supabase/ssr'

let browserClient

export function getSupabaseBrowser() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase browser environment variables.')
  }

  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}