// Verifica e cria tabelas automaticamente (chamado no layout servidor)
import { createClient } from '@supabase/supabase-js'

let setupDone = false // cache em memória do processo

export async function ensureSetup(): Promise<void> {
  if (setupDone) return

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || (!svcKey && !anon)) return

  try {
    const key = svcKey || anon!
    const sb = createClient(url, key, { auth: { persistSession: false } })

    // Testar se tabela existe
    const { error } = await sb.from('pacientes').select('id').limit(1)
    if (!error) { setupDone = true; return } // já configurado

    if (!svcKey) return // sem service_role não consegue criar tabelas

    // Criar tabelas via Management API
    const ref = url.replace('https://', '').split('.')[0]
    const SETUP_SQL = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/setup-sql`)
      .then(r => r.text()).catch(() => '')

    if (!SETUP_SQL) return

    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${svcKey}` },
      body: JSON.stringify({ query: SETUP_SQL }),
    })
    setupDone = true
  } catch { /* silencioso */ }
}
