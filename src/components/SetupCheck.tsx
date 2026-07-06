'use client'
import { useEffect } from 'react'

// Executa o setup automático do banco na primeira visita
// Usa /api/setup que tem a SUPABASE_SERVICE_ROLE_KEY no servidor
export default function SetupCheck() {
  useEffect(() => {
    const STORAGE_KEY = 'nexopsi_db_ready_v2'
    if (localStorage.getItem(STORAGE_KEY)) return

    fetch('/api/setup')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          localStorage.setItem(STORAGE_KEY, '1')
          // Recarregar a página para buscar dados reais do banco recém-criado
          window.location.reload()
        }
      })
      .catch(() => {}) // silencioso se falhar
  }, [])

  return null
}
