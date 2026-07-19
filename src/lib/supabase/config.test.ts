import { readSupabaseConfig } from './config'

describe('Supabase-Konfiguration', () => {
  it('akzeptiert URL und Publishable Key', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toEqual({
      ok: true,
      config: {
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_test',
      },
    })
  })

  it('nennt fehlende Werte, ohne einen Client zu starten', () => {
    expect(readSupabaseConfig({})).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    })
  })

  it('weist ungültige URLs und Schlüssel zurück', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'kein-url',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toEqual({ ok: false, missing: ['VITE_SUPABASE_URL (ungültig)'] })

    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'geheim-oder-kaputt',
      }),
    ).toEqual({ ok: false, missing: ['VITE_SUPABASE_PUBLISHABLE_KEY (ungültig)'] })
  })
})
