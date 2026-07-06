// NexxoPsi — Tipos TypeScript

export type LocalId = 'unimed' | 'aquarela' | 'ceped'
export type PerfilClinico = 'adulto_emocional' | 'adulto_neuro' | 'adolescente_emocional' | 'adolescente_neuro' | 'crianca_emocional' | 'crianca_neuro' | 'supervisao'
export type StatusAgendamento = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'aguardando'
export type StatusFatura = 'aberto' | 'pago' | 'atrasado' | 'cancelado'
export type StatusAnamnese = 'pendente' | 'enviado' | 'preenchido'
export type ModeloAnamnese = 'adulto' | 'infantil' | 'supervisao'
export type ViewId = 'dashboard'|'agenda'|'prontuario'|'smartnotes'|'anamnese'|'cartoes'|'alertas'|'financeiro'|'relatorios'|'whatsapp'|'usuarios'|'config'

export interface Local {
  id: LocalId; nome: string; cor: string; icon: string; endereco: string
}

export interface Paciente {
  id: string; nome: string; nascimento?: string; sexo?: string; cpf?: string
  fone?: string; email?: string; endereco?: string; cid?: string
  modalidade: string; local_id: LocalId; perfil: PerfilClinico[]
  valor_sessao: number; venc_dia: number; inicio?: string
  sessoes_total: number; devedor_total: number; ativo: boolean; obs?: string
  avatar?: string; created_at?: string; updated_at?: string
}

export interface Agendamento {
  id: string; paciente_id: string
  paciente?: Pick<Paciente,'id'|'nome'|'avatar'|'fone'|'local_id'|'valor_sessao'>
  data: string; hora: string; tipo: string; modalidade: string
  local_id?: string; status: StatusAgendamento; valor_sessao: number
  pago: boolean; recorrencia_id?: string; notas?: string; created_at?: string
}

export interface Fatura {
  id: string; paciente_id: string
  paciente?: Pick<Paciente,'id'|'nome'|'fone'|'local_id'>
  mes: string; valor: number; sessoes_count: number; vencimento: string
  pago: boolean; data_pagamento?: string; status: StatusFatura; created_at?: string
}

export interface Evolucao {
  id: string; paciente_id: string; agendamento_id?: string
  data: string; sessao_num?: number; texto: string; cid?: string
  gerado_luma: boolean; transcricao?: string; created_at?: string
}

export interface TarefaCartao {
  id: string; cartao_id: string; titulo: string; descricao?: string
  feita: boolean; ordem: number
}

export interface Cartao {
  id: string; paciente_id: string; titulo: string; gerado_luma: boolean
  ativo: boolean; validade: string; tarefas: TarefaCartao[]; created_at?: string
}

export interface Anamnese {
  id: string; paciente_id: string
  paciente?: Pick<Paciente,'id'|'nome'>
  modelo: ModeloAnamnese; status: StatusAnamnese
  respostas?: Record<string, string>
  enviado_em?: string; respondido_em?: string; created_at?: string
}

export interface Documento {
  id: string; paciente_id: string; nome: string; tipo?: string
  url?: string; created_at?: string
}

export interface MetricasDashboard {
  sessoesHoje: number; confirmados: number; totalSessoesMes: number
  faturamentoMes: number; totalDevedor: number; agHoje: Agendamento[]
}

export interface Inadimplente {
  paciente: Pick<Paciente,'id'|'nome'|'fone'|'local_id'>
  fatura: Pick<Fatura,'id'|'valor'|'vencimento'|'status'>
  diasAtraso: number
}
