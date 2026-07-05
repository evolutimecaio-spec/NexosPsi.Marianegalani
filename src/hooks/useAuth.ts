'use client'
import { useState, useEffect, useCallback } from 'react'

const HASH_CORRETO = '9b2a95534511812f0fe3a7407822b796b928fcf9bb7e93f9c477e756182cf02d'
const SESSION_KEY  = 'nexopsi_auth'
const TS_KEY       = 'nexopsi_ts'
const HORAS        = 8

async function sha256(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAuth() {
  const [autenticado, setAutenticado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const auth = sessionStorage.getItem(SESSION_KEY)
    const ts   = parseInt(sessionStorage.getItem(TS_KEY) || '0')
    if (auth === '1' && Date.now() - ts < HORAS * 3600000) setAutenticado(true)
    setCarregando(false)
  }, [])

  const login = useCallback(async (senha: string): Promise<boolean> => {
    const hash = await sha256(senha)
    if (hash === HASH_CORRETO) {
      sessionStorage.setItem(SESSION_KEY, '1')
      sessionStorage.setItem(TS_KEY, Date.now().toString())
      setAutenticado(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(TS_KEY)
    setAutenticado(false)
  }, [])

  return { autenticado, carregando, login, logout }
}
