import { createBrowserClient } from "@supabase/ssr"

let client = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL || (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL),
    import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  )

  return client
}
