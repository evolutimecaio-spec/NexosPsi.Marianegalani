// Configuração central de locais e perfis clínicos

export const LOCAIS_CONFIG = [
  { id: 'unimed',   nome: 'Unimed',        cor: '#1565C0', emoji: '🏥' },
  { id: 'aquarela', nome: 'Casa Aquarela', cor: '#6A1B9A', emoji: '🏡' },
  { id: 'ceped',    nome: 'CEPED',         cor: '#2E7D32', emoji: '🏢' },
] as const

// Hierarquia de perfis: categoria principal → subcategorias
export const PERFIS_CONFIG = [
  {
    id: 'adulto',
    label: 'Adulto',
    emoji: '👤',
    subs: [
      { id: 'adulto_emocional', label: 'Emocional' },
      { id: 'adulto_neuro',     label: 'Neurodivergente' },
    ],
  },
  {
    id: 'adolescente',
    label: 'Adolescente',
    emoji: '🧑',
    subs: [
      { id: 'adolescente_emocional', label: 'Emocional' },
      { id: 'adolescente_neuro',     label: 'Neurodivergente' },
    ],
  },
  {
    id: 'crianca',
    label: 'Criança',
    emoji: '🧒',
    subs: [
      { id: 'crianca_emocional', label: 'Emocional' },
      { id: 'crianca_neuro',     label: 'Neurodivergente' },
    ],
  },
  {
    id: 'supervisao',
    label: 'Supervisão',
    emoji: '🎓',
    subs: [],
  },
] as const

// Label legível para qualquer id de perfil
const LABEL_MAP: Record<string, string> = {
  adulto:               'Adulto',
  adulto_emocional:     'Adulto · Emocional',
  adulto_neuro:         'Adulto · Neurodivergente',
  adolescente:          'Adolescente',
  adolescente_emocional:'Adolescente · Emocional',
  adolescente_neuro:    'Adolescente · Neurodivergente',
  crianca:              'Criança',
  crianca_emocional:    'Criança · Emocional',
  crianca_neuro:        'Criança · Neurodivergente',
  supervisao:           'Supervisão',
  // compatibilidade legada
  neurodiverge:         'Neurodivergente',
  mulher:               'Adulto',
}

export const perfilLabel = (id: string): string => LABEL_MAP[id] ?? id
