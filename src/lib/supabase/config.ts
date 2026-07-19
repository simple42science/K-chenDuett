export type SupabaseConfig = {
  url: string
  publishableKey: string
}

export type SupabaseConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: string[] }

type PublicEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export function readSupabaseConfig(env: PublicEnv = import.meta.env): SupabaseConfigResult {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  const missing: string[] = []

  if (!url) missing.push('VITE_SUPABASE_URL')
  if (!publishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')

  if (!url || !publishableKey) return { ok: false, missing }

  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Ungültiges Protokoll')
  } catch {
    return { ok: false, missing: ['VITE_SUPABASE_URL (ungültig)'] }
  }

  if (!publishableKey.startsWith('sb_publishable_') && publishableKey.split('.').length !== 3) {
    return { ok: false, missing: ['VITE_SUPABASE_PUBLISHABLE_KEY (ungültig)'] }
  }

  return { ok: true, config: { url, publishableKey } }
}

export function getAuthRedirectUrl(origin = window.location.origin): string {
  return new URL(import.meta.env.BASE_URL, `${origin}/`).toString()
}
