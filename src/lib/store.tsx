'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import * as DB from './db'
import type { Paciente, Agendamento, Inadimplente, MetricasDashboard } from '@/types'

interface Store {
  pacientes:  Paciente[]
  agHoje:     Agendamento[]
  inad:       Inadimplente[]
  metrics:    MetricasDashboard | null
  alertCount: number
  pronto:     boolean
  modoDemo:   boolean
  reload: (key?: 'pacientes'|'agenda'|'financeiro'|'all') => Promise<void>
}

const Ctx = createContext<Store>({
  pacientes: [], agHoje: [], inad: [],
  metrics: null, alertCount: 0, pronto: false, modoDemo: false,
  reload: async () => {},
})

// Timeout wrapper — se demorar mais de 3s, usa fallback
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ])
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const hoje = DB.today()

  // Inicializar vazio — banco da Mariane estará limpo
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [agHoje,    setAgHoje]    = useState<Agendamento[]>([])
  const [inad,      setInad]      = useState<Inadimplente[]>([])
  const [metrics,   setMetrics]   = useState<MetricasDashboard>({
    sessoesHoje: 0, confirmados: 0, totalSessoesMes: 0,
    faturamentoMes: 0, totalDevedor: 0, agHoje: [],
  })
  const [pronto,   setPronto]   = useState(true)  // pronto desde o início com demo
  const [modoDemo, setModoDemo] = useState(true)

  const loadFromDB = useCallback(async () => {
    try {
      // Tentar Supabase com timeout de 3s cada
      const [pacs, ags, inadList] = await Promise.all([
        withTimeout(DB.getPacientes(),          5000, []),
        withTimeout(DB.getAgendamentosDia(hoje), 5000, []),
        withTimeout(DB.getInadimplentes(),       5000, []),
      ])

      const isDemo = false
      setModoDemo(isDemo)
      setPacientes(pacs)
      setAgHoje(ags)
      setInad(inadList)
      setMetrics({
        sessoesHoje: ags.length,
        confirmados: ags.filter(a => a.status === 'confirmado').length,
        totalSessoesMes: ags.length,
        faturamentoMes: 0,
        totalDevedor: inadList.reduce((s,i) => s + Number(i.fatura.valor), 0),
        agHoje: ags,
      })
    } catch { /* mantém demo */ }
  }, [])

  useEffect(() => {
    // Carregar dados reais em background sem bloquear a UI
    loadFromDB()
  }, [loadFromDB])

  const reload = useCallback(async (key?: string) => {
    try {
      if (!key || key === 'all' || key === 'pacientes') {
        const p = await withTimeout(DB.getPacientes(), 5000, [])
        setPacientes(p); setModoDemo(false)
      }
      if (!key || key === 'all' || key === 'agenda') {
        const a = await withTimeout(DB.getAgendamentosDia(hoje), 5000, [])
        setAgHoje(a)
      }
      if (!key || key === 'all' || key === 'financeiro') {
        const i = await withTimeout(DB.getInadimplentes(), 5000, [])
        setInad(i)
      }
    } catch { /* mantém estado atual */ }
  }, [])

  return (
    <Ctx.Provider value={{
      pacientes, agHoje, inad, metrics,
      alertCount: inad.length,
      pronto, modoDemo, reload,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useStore = () => useContext(Ctx)
