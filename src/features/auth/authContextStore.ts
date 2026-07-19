import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AppSupabaseClient } from '../../lib/supabase/client'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export type AuthContextValue = {
  client: AppSupabaseClient
  session: Session | null
  user: User | null
  status: AuthStatus
  error: string | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
