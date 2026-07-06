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
  pacientes:[], agHoje:[], inad:[], metrics:null, alertCount:0, pronto:false, modoDemo:false,
  reload: async () => {},
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [agHoje,    setAgHoje]    = useState<Agendamento[]>([])
  const [inad,      setInad]      = useState<Inadimplente[]>([])
  const [metrics,   setMetrics]   = useState<MetricasDashboard | null>(null)
  const [pronto,    setPronto]    = useState(false)
  const [modoDemo,  setModoDemo]  = useState(false)

  const loadAll = useCallback(async () => {
    const hoje = DB.today()
    // Cada query independente — falha isolada não bloqueia as outras
    const [pacs, ags, inadList, m] = await Promise.allSettled([
      DB.getPacientes(),
      DB.getAgendamentosDia(hoje),
      DB.getInadimplentes(),
      DB.getMetricasDashboard(),
    ])
    if (pacs.status === 'fulfilled')    { setPacientes(pacs.value); setModoDemo(pacs.value[0]?.id === 'p1') }
    if (ags.status === 'fulfilled')     setAgHoje(ags.value)
    if (inadList.status === 'fulfilled') setInad(inadList.value)
    if (m.status === 'fulfilled')       setMetrics(m.value)
    setPronto(true)
  }, [])

  const reload = useCallback(async (key?: string) => {
    const hoje = DB.today()
    try {
      if (!key || key === 'all') {
        const [pacs, ags, inadList, m] = await Promise.allSettled([
          DB.getPacientes(), DB.getAgendamentosDia(hoje),
          DB.getInadimplentes(), DB.getMetricasDashboard(),
        ])
        if (pacs.status === 'fulfilled')     setPacientes(pacs.value)
        if (ags.status === 'fulfilled')      setAgHoje(ags.value)
        if (inadList.status === 'fulfilled') setInad(inadList.value)
        if (m.status === 'fulfilled')        setMetrics(m.value)
      } else if (key === 'pacientes') {
        const p = await DB.getPacientes(); setPacientes(p)
      } else if (key === 'agenda') {
        const [a, m] = await Promise.all([DB.getAgendamentosDia(hoje), DB.getMetricasDashboard()])
        setAgHoje(a); setMetrics(m)
      } else if (key === 'financeiro') {
        const [i, m] = await Promise.all([DB.getInadimplentes(), DB.getMetricasDashboard()])
        setInad(i); setMetrics(m)
      }
    } catch (e) { console.warn('[store reload]', e) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <Ctx.Provider value={{ pacientes, agHoje, inad, metrics, alertCount: inad.length, pronto, modoDemo, reload }}>
      {children}
    </Ctx.Provider>
  )
}

export const useStore = () => useContext(Ctx)
