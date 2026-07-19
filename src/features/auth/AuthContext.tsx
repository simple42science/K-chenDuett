import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AppSupabaseClient } from '../../lib/supabase/client'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContextStore'

type AuthProviderProps = {
  client: AppSupabaseClient
  children: ReactNode
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'anonymous')
      setError(null)
    })

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError(sessionError.message)
        setStatus('error')
        return
      }
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'anonymous')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await client.auth.signOut()
    if (signOutError) throw new Error(signOutError.message)
  }, [client])

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session,
      user: session?.user ?? null,
      status,
      error,
      signOut,
    }),
    [client, error, session, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
