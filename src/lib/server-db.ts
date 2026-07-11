// NexxoPsi — queries que rodam no SERVIDOR (Server Components)
// Dados chegam prontos no HTML — sem esperar JS carregar no browser
import { createClient } from '@supabase/supabase-js'
import { DEMO_PACIENTES, DEMO_AGENDAMENTOS, DEMO_INADIMPLENTES } from './demo'
import type { Paciente, Agendamento, Inadimplente, MetricasDashboard } from '@/types'

function makeClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !anon) return null
  return createClient(url, anon, { auth: { persistSession: false } })
}

export async function serverGetPacientes(): Promise<Paciente[]> {
  try {
    const sb = makeClient(); if (!sb) return DEMO_PACIENTES
    const { data, error } = await sb.from('pacientes').select('*').eq('ativo', true).order('nome')
    if (error || !data || data.length === 0) return DEMO_PACIENTES
    return data
  } catch { return DEMO_PACIENTES }
}

export async function serverGetAgendamentosHoje(): Promise<Agendamento[]> {
  try {
    const sb = makeClient(); if (!sb) return DEMO_AGENDAMENTOS.filter(a => a.data === (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})())
    const hoje = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()
    const { data, error } = await sb.from('agendamentos')
      .select('*, paciente:pacientes(id,nome,avatar,fone,local_id,valor_sessao)')
      .eq('data', hoje).order('hora')
    if (error || !data) return []
    if (data.length === 0) return DEMO_AGENDAMENTOS.filter(a => a.data === hoje)
    return data
  } catch { return [] }
}

export async function serverGetInadimplentes(): Promise<Inadimplente[]> {
  try {
    const sb = makeClient(); if (!sb) return DEMO_INADIMPLENTES
    const hoje = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()
    const { data, error } = await sb.from('faturas')
      .select('*, paciente:pacientes(id,nome,fone,local_id)')
      .eq('pago', false).lte('vencimento', hoje).order('vencimento')
    if (error || !data) return DEMO_INADIMPLENTES
    if (data.length === 0) return DEMO_INADIMPLENTES
    return data.map((f: any) => ({
      paciente: f.paciente,
      fatura: { id: f.id, valor: f.valor, vencimento: f.vencimento, status: f.status },
      diasAtraso: Math.round((Date.now() - new Date(f.vencimento).getTime()) / 86400000),
    }))
  } catch { return DEMO_INADIMPLENTES }
}

export async function serverGetDashboard(): Promise<{
  pacientes: Paciente[]
  agHoje: Agendamento[]
  inad: Inadimplente[]
  metrics: MetricasDashboard
}> {
  // Tudo em paralelo no servidor
  const [pacientes, agHoje, inad] = await Promise.all([
    serverGetPacientes(),
    serverGetAgendamentosHoje(),
    serverGetInadimplentes(),
  ])

  const metrics: MetricasDashboard = {
    sessoesHoje:     agHoje.length,
    confirmados:     agHoje.filter(a => a.status === 'confirmado').length,
    totalSessoesMes: 0, // calculado client-side
    faturamentoMes:  0,
    totalDevedor:    inad.reduce((s, i) => s + Number(i.fatura.valor), 0),
    agHoje,
  }

  return { pacientes, agHoje, inad, metrics }
}
