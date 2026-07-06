'use client'
import { useEffect } from 'react'

// Chama /api/setup na primeira visita para criar tabelas automaticamente
// Usa localStorage para não chamar mais de uma vez por browser
export default function SetupCheck() {
  useEffect(() => {
    const key = 'nexopsi_setup_v1'
    if (typeof window === 'undefined') return
    if (localStorage.getItem(key)) return

    fetch('/api/setup')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          localStorage.setItem(key, '1')
          console.log('[NexxoPsi] Setup automático:', d.status)
        }
      })
      .catch(() => {}) // silencioso — fallback para modo demo
  }, [])

  return null
}
