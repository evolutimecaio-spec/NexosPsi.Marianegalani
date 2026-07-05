// NexxoPsi — Camada de dados Supabase
import { supabase } from './supabase'
import type {
  Paciente, Agendamento, Fatura, Evolucao, Cartao, TarefaCartao,
  Anamnese, Documento, MetricasDashboard, Inadimplente, Local, LocalId
} from '@/types'

// ── Locais de atendimento ────────────────────────────────────────
export const LOCAIS: Record<string, Local> = {
  unimed:     { id: 'unimed',     nome: 'Unimed',            cor: '#1565C0', icon: 'building-hospital',  endereco: 'Unimed Jundiaí' },
  aquarela:   { id: 'aquarela',   nome: 'Casa Aquarela',     cor: '#6A1B9A', icon: 'home-heart',          endereco: 'Casa Aquarela' },
  anhangabau: { id: 'anhangabau', nome: 'Clínica Anhangabaú',cor: '#2E7D32', icon: 'building-community', endereco: 'Clínica do Anhangabaú' },
}
export const getLocal = (id?: string | null): Local | null => LOCAIS[id ?? ''] ?? null
export const getLocais = (): Local[] => Object.values(LOCAIS)

// ── Helpers ──────────────────────────────────────────────────────
export const today = () => new Date().toISOString().slice(0, 10)
export const fmtData = (str?: string | null): string => {
  if (!str) return '—'
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
export const fmtMoeda = (v?: number | null): string =>
  'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',')
export const calcIdade = (nasc?: string | null): number | null => {
  if (!nasc) return null
  const n = new Date(nasc), h = new Date()
  let i = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--
  return i
}
export const makeAvatar = (nome: string) =>
  nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

// ── Tratamento de erro ───────────────────────────────────────────
function check<T>(data: T | null, error: unknown, ctx: string): T {
  if (error) throw new Error(`[DB] ${ctx}: ${(error as { message?: string }).message}`)
  return data as T
}

// ══════════════════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════════════════
export async function getPacientes(filtros?: { local_id?: string; perfil?: string; ativo?: boolean }): Promise<Paciente[]> {
  let q = supabase.from('pacientes').select('*').order('nome')
  if (filtros?.ativo !== false) q = q.eq('ativo', true)
  if (filtros?.local_id) q = q.eq('local_id', filtros.local_id)
  if (filtros?.perfil) q = q.contains('perfil', [filtros.perfil])
  const { data, error } = await q
  return check(data, error, 'listar pacientes') ?? []
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function addPaciente(dados: Omit<Paciente, 'id'|'created_at'|'updated_at'|'sessoes_total'|'devedor_total'>): Promise<Paciente> {
  const row = { ...dados, avatar: dados.avatar || makeAvatar(dados.nome), sessoes_total: 0, devedor_total: 0 }
  const { data, error } = await supabase.from('pacientes').insert(row).select().single()
  return check(data, error, 'cadastrar paciente')
}

export async function updatePaciente(id: string, dados: Partial<Paciente>): Promise<void> {
  const { error } = await supabase.from('pacientes').update(dados).eq('id', id)
  check(null, error, 'atualizar paciente')
}

// ══════════════════════════════════════════════════════════════════
// AGENDAMENTOS
// ══════════════════════════════════════════════════════════════════
const AGS_SELECT = `*, paciente:pacientes(id, nome, avatar, fone, local_id, valor_sessao)`

export async function getAgendamentos(filtros?: {
  data?: string; dataIni?: string; dataFim?: string; pacienteId?: string
}): Promise<Agendamento[]> {
  let q = supabase.from('agendamentos').select(AGS_SELECT).order('data').order('hora')
  if (filtros?.data)       q = q.eq('data', filtros.data)
  if (filtros?.dataIni)    q = q.gte('data', filtros.dataIni)
  if (filtros?.dataFim)    q = q.lte('data', filtros.dataFim)
  if (filtros?.pacienteId) q = q.eq('paciente_id', filtros.pacienteId)
  const { data, error } = await q
  return check(data, error, 'listar agendamentos') ?? []
}

export const getAgendamentosDia  = (d: string) => getAgendamentos({ data: d })
export const getAgendamentosSemana = (ini: string, fim: string) =>
  getAgendamentos({ dataIni: ini, dataFim: fim })

export async function addAgendamento(ag: {
  paciente_id: string; data: string; hora: string; tipo?: string
  modalidade?: string; local_id?: string; valor_sessao?: number
  status?: string; recorrencia_id?: string; notas?: string
}): Promise<Agendamento> {
  const { data, error } = await supabase.from('agendamentos').insert({
    ...ag, tipo: ag.tipo || 'Terapia Individual',
    modalidade: ag.modalidade || 'Presencial',
    status: ag.status || 'agendado', pago: false,
  }).select(AGS_SELECT).single()
  return check(data, error, 'criar agendamento')
}

export async function updateAgendamento(id: string, dados: Partial<Agendamento>): Promise<void> {
  const { error } = await supabase.from('agendamentos').update(dados).eq('id', id)
  check(null, error, 'atualizar agendamento')
}

export async function pagarAgendamento(id: string): Promise<void> {
  await updateAgendamento(id, { pago: true, status: 'realizado' })
}

// ══════════════════════════════════════════════════════════════════
// FATURAS
// ══════════════════════════════════════════════════════════════════
const FAT_SELECT = `*, paciente:pacientes(id, nome, fone, local_id)`

export async function getFaturas(pacienteId?: string): Promise<Fatura[]> {
  let q = supabase.from('faturas').select(FAT_SELECT).order('vencimento', { ascending: false })
  if (pacienteId) q = q.eq('paciente_id', pacienteId)
  const { data, error } = await q
  return check(data, error, 'listar faturas') ?? []
}

export async function getInadimplentes(): Promise<Inadimplente[]> {
  const { data, error } = await supabase.from('faturas')
    .select(FAT_SELECT).eq('pago', false).lte('vencimento', today()).order('vencimento')
  const rows = check(data, error, 'inadimplentes') ?? []
  return rows.map((f: Fatura) => ({
    paciente: f.paciente as Inadimplente['paciente'],
    fatura: { id: f.id, valor: f.valor, vencimento: f.vencimento, status: f.status },
    diasAtraso: Math.round((Date.now() - new Date(f.vencimento).getTime()) / 86400000),
  }))
}

export async function getTotalDevedor(): Promise<number> {
  const rows = await getInadimplentes()
  return rows.reduce((s, i) => s + Number(i.fatura.valor), 0)
}

export async function getFaturamentoMes(mes: string): Promise<number> {
  const { data } = await supabase.from('faturas').select('valor').eq('mes', mes).eq('pago', true)
  return (data ?? []).reduce((s: number, f: { valor: number }) => s + Number(f.valor), 0)
}

export async function addFatura(pacienteId: string, fatura: {
  mes: string; valor: number; sessoes_count?: number; vencimento: string
}): Promise<Fatura> {
  const { data, error } = await supabase.from('faturas').insert({
    paciente_id: pacienteId, ...fatura, status: 'aberto', pago: false,
  }).select().single()
  return check(data, error, 'criar fatura')
}

export async function pagarFatura(faturaId: string, pacienteId: string): Promise<void> {
  const { data: f } = await supabase.from('faturas').select('valor').eq('id', faturaId).single()
  await supabase.from('faturas').update({ pago: true, status: 'pago', data_pagamento: today() }).eq('id', faturaId)
  if (f) {
    const pac = await getPaciente(pacienteId)
    if (pac) await updatePaciente(pacienteId, { devedor_total: Math.max(0, Number(pac.devedor_total) - Number(f.valor)) })
  }
}

// ══════════════════════════════════════════════════════════════════
// EVOLUÇÕES
// ══════════════════════════════════════════════════════════════════
export async function getEvolucoes(pacienteId: string): Promise<Evolucao[]> {
  const { data, error } = await supabase.from('evolucoes').select('*')
    .eq('paciente_id', pacienteId).order('data', { ascending: false })
  return check(data, error, 'listar evoluções') ?? []
}

export async function addEvolucao(pacienteId: string, ev: {
  texto: string; cid?: string; gerado_luma?: boolean; transcricao?: string; data?: string
}): Promise<Evolucao> {
  const { data, error } = await supabase.from('evolucoes').insert({
    paciente_id: pacienteId, data: ev.data || today(),
    texto: ev.texto, cid: ev.cid || '', gerado_luma: ev.gerado_luma || false,
    transcricao: ev.transcricao || null,
  }).select().single()
  const ev2 = check(data, error, 'salvar evolução')
  // Incrementar sessões
  const pac = await getPaciente(pacienteId)
  if (pac) await updatePaciente(pacienteId, { sessoes_total: (pac.sessoes_total || 0) + 1 })
  return ev2
}

// ══════════════════════════════════════════════════════════════════
// CARTÕES TERAPÊUTICOS
// ══════════════════════════════════════════════════════════════════
export async function getCartoes(pacienteId?: string): Promise<Cartao[]> {
  let q = supabase.from('cartoes').select(`*, tarefas:tarefas_cartao(*)`)
    .order('created_at', { ascending: false })
  if (pacienteId) q = q.eq('paciente_id', pacienteId)
  const { data, error } = await q
  const rows = check(data, error, 'listar cartões') ?? []
  return rows.map((c: Cartao) => ({
    ...c, tarefas: [...(c.tarefas || [])].sort((a: TarefaCartao, b: TarefaCartao) => a.ordem - b.ordem),
  }))
}

export async function addCartao(pacienteId: string, cartao: {
  titulo: string; gerado_luma?: boolean; validade?: string
  tarefas: { titulo: string; descricao?: string }[]
}): Promise<Cartao> {
  const { data: cRow, error } = await supabase.from('cartoes').insert({
    paciente_id: pacienteId, titulo: cartao.titulo,
    gerado_luma: cartao.gerado_luma || false, ativo: true,
    validade: cartao.validade || 'Semanal',
  }).select().single()
  const c = check(cRow, error, 'criar cartão')
  if (cartao.tarefas.length) {
    await supabase.from('tarefas_cartao').insert(
      cartao.tarefas.map((t, i) => ({ cartao_id: c.id, titulo: t.titulo, descricao: t.descricao || '', feita: false, ordem: i }))
    )
  }
  return { ...c, tarefas: [] }
}

export async function toggleTarefa(tarefaId: string, feita: boolean): Promise<void> {
  const { error } = await supabase.from('tarefas_cartao').update({ feita }).eq('id', tarefaId)
  check(null, error, 'toggleTarefa')
}

// ══════════════════════════════════════════════════════════════════
// ANAMNESES
// ══════════════════════════════════════════════════════════════════
export async function getAnamneses(pacienteId?: string): Promise<Anamnese[]> {
  let q = supabase.from('anamneses').select(`*, paciente:pacientes(id, nome)`).order('created_at', { ascending: false })
  if (pacienteId) q = q.eq('paciente_id', pacienteId)
  const { data, error } = await q
  return check(data, error, 'listar anamneses') ?? []
}

export async function addAnamnese(pacienteId: string, modelo: string): Promise<Anamnese> {
  const { data, error } = await supabase.from('anamneses').insert({
    paciente_id: pacienteId, modelo, status: 'enviado', enviado_em: new Date().toISOString(),
  }).select().single()
  return check(data, error, 'criar anamnese')
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════════════════════════
export async function getDocumentos(pacienteId: string): Promise<Documento[]> {
  const { data, error } = await supabase.from('documentos').select('*')
    .eq('paciente_id', pacienteId).order('created_at', { ascending: false })
  return check(data, error, 'listar documentos') ?? []
}

export async function addDocumento(pacienteId: string, doc: { nome: string; tipo?: string; url?: string }): Promise<Documento> {
  const { data, error } = await supabase.from('documentos').insert({ paciente_id: pacienteId, ...doc }).select().single()
  return check(data, error, 'salvar documento')
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD — métricas agregadas em paralelo
// ══════════════════════════════════════════════════════════════════
export async function getMetricasDashboard(): Promise<MetricasDashboard> {
  const h = today()
  const mesAtual = h.slice(0, 7)
  const [agHoje, agMes, inad, fatMes] = await Promise.all([
    getAgendamentosDia(h),
    getAgendamentos({ dataIni: `${mesAtual}-01`, dataFim: `${mesAtual}-31` }),
    getInadimplentes(),
    getFaturamentoMes(mesAtual),
  ])
  return {
    sessoesHoje:     agHoje.length,
    confirmados:     agHoje.filter(a => a.status === 'confirmado').length,
    totalSessoesMes: agMes.filter(a => a.status !== 'cancelado').length,
    faturamentoMes:  fatMes,
    totalDevedor:    inad.reduce((s, i) => s + Number(i.fatura.valor), 0),
    agHoje,
  }
}

export async function getAniversariantesSemana(): Promise<{ paciente: Paciente; diasAte: number; data: Date }[]> {
  const pacs = await getPacientes()
  const hoje = new Date()
  const result: { paciente: Paciente; diasAte: number; data: Date }[] = []
  pacs.forEach(p => {
    if (!p.nascimento) return
    const nasc = new Date(p.nascimento)
    for (let i = 0; i <= 7; i++) {
      const d = new Date(hoje); d.setDate(hoje.getDate() + i)
      if (nasc.getMonth() === d.getMonth() && nasc.getDate() === d.getDate())
        result.push({ paciente: p, diasAte: i, data: d })
    }
  })
  return result.sort((a, b) => a.diasAte - b.diasAte)
}

// ══════════════════════════════════════════════════════════════════
// SEED — dados demo na primeira execução
// ══════════════════════════════════════════════════════════════════
export async function seedSeNecessario(): Promise<void> {
  const { count } = await supabase.from('agendamentos').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return
  const pacs = await getPacientes()
  if (!pacs.length) return
  const byNome: Record<string, string> = {}
  pacs.forEach(p => { byNome[p.nome] = p.id })
  const d = (off: number) => { const x = new Date(); x.setDate(x.getDate() + off); return x.toISOString().slice(0, 10) }
  const ags = [
    { paciente_id: byNome['Ana Silva'],    data: d(0), hora: '10:00', tipo: 'Terapia Individual', modalidade: 'Presencial', status: 'confirmado', valor_sessao: 180 },
    { paciente_id: byNome['Rafael Costa'], data: d(0), hora: '09:00', tipo: 'Terapia Individual', modalidade: 'Online',     status: 'confirmado', valor_sessao: 180 },
    { paciente_id: byNome['Paula Mendes'], data: d(0), hora: '08:00', tipo: 'Terapia Individual', modalidade: 'Presencial', status: 'confirmado', valor_sessao: 220 },
    { paciente_id: byNome['Marcos Lima'],  data: d(0), hora: '14:00', tipo: 'Terapia Individual', modalidade: 'Online',     status: 'confirmado', valor_sessao: 160 },
    { paciente_id: byNome['Ana Silva'],    data: d(7), hora: '10:00', tipo: 'Terapia Individual', modalidade: 'Presencial', status: 'agendado',   valor_sessao: 180 },
  ].filter(a => a.paciente_id)
  if (ags.length) await supabase.from('agendamentos').insert(ags)

  const { count: fatCount } = await supabase.from('faturas').select('id', { count: 'exact', head: true })
  if ((fatCount ?? 0) > 0) return
  const h = today(), mes = h.slice(0, 7)
  const fat = [
    { paciente_id: byNome['Ana Silva'],    mes, valor: 360, sessoes_count: 2, vencimento: `${mes}-03`, pago: false, status: 'aberto' },
    { paciente_id: byNome['Thiago Braga'], mes, valor: 150, sessoes_count: 1, vencimento: `${mes}-02`, pago: false, status: 'atrasado' },
  ].filter(f => f.paciente_id)
  if (fat.length) await supabase.from('faturas').insert(fat)
}

// ══════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ══════════════════════════════════════════════════════════════════
export async function saveConfig(dados: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('configuracoes')
    .upsert({ id: 'nexopsi', dados, updated_at: new Date().toISOString() })
  if (error) console.error('[DB] saveConfig:', error.message)
}
