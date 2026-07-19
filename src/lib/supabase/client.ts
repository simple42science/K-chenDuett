import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'
import type { SupabaseConfig } from './config'

export type AppSupabaseClient = SupabaseClient<Database>

export function createAppSupabaseClient(config: SupabaseConfig): AppSupabaseClient {
  return createClient<Database>(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      persistSession: true,
    },
  })
}
