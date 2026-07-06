'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { DEMO_PACIENTES, DEMO_AGENDAMENTOS, DEMO_INADIMPLENTES } from './demo'
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
  pacientes: DEMO_PACIENTES, agHoje: [], inad: DEMO_INADIMPLENTES,
  metrics: null, alertCount: 2, pronto: true, modoDemo: true,
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
  const demAgs = DEMO_AGENDAMENTOS.filter(a => a.data === hoje)

  // Inicializar com dados demo IMEDIATAMENTE — sem tela branca
  const [pacientes, setPacientes] = useState<Paciente[]>(DEMO_PACIENTES)
  const [agHoje,    setAgHoje]    = useState<Agendamento[]>(demAgs)
  const [inad,      setInad]      = useState<Inadimplente[]>(DEMO_INADIMPLENTES)
  const [metrics,   setMetrics]   = useState<MetricasDashboard>({
    sessoesHoje: demAgs.length,
    confirmados: demAgs.filter(a => a.status === 'confirmado').length,
    totalSessoesMes: demAgs.length,
    faturamentoMes: 0,
    totalDevedor: DEMO_INADIMPLENTES.reduce((s,i) => s + Number(i.fatura.valor), 0),
    agHoje: demAgs,
  })
  const [pronto,   setPronto]   = useState(true)  // pronto desde o início com demo
  const [modoDemo, setModoDemo] = useState(true)

  const loadFromDB = useCallback(async () => {
    try {
      // Tentar Supabase com timeout de 3s cada
      const [pacs, ags, inadList] = await Promise.all([
        withTimeout(DB.getPacientes(),          3000, DEMO_PACIENTES),
        withTimeout(DB.getAgendamentosDia(hoje), 3000, demAgs),
        withTimeout(DB.getInadimplentes(),       3000, DEMO_INADIMPLENTES),
      ])

      const isDemo = pacs[0]?.id === 'p1'
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
        const p = await withTimeout(DB.getPacientes(), 3000, DEMO_PACIENTES)
        setPacientes(p); setModoDemo(p[0]?.id === 'p1')
      }
      if (!key || key === 'all' || key === 'agenda') {
        const a = await withTimeout(DB.getAgendamentosDia(hoje), 3000, demAgs)
        setAgHoje(a)
      }
      if (!key || key === 'all' || key === 'financeiro') {
        const i = await withTimeout(DB.getInadimplentes(), 3000, DEMO_INADIMPLENTES)
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
