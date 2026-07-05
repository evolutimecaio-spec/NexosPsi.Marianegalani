// NexxoPsi — Configurações centrais

export const CONFIG = {
  psicologa: {
    nome:      'Mariane Galani',
    crp:       '06/XXXXX',
    cpf:       '123.456.789-00',
    email:     'mariane@email.com',
    whatsapp:  '5511999990000',
    endereco:  'R. Exemplo, 123 – Jundiaí, SP',
    cidade:    'Jundiaí, SP',
    instagram: '@marianeGalani',
  },
  financeiro: {
    valorSessaoPadrao:     180,
    metaMensalFaturamento: 10000,
    chavePix:              'mariane@email.com',
    diasAlerteVencimento:  [7, 3, 1, 0],
  },
  clinica: {
    prazoAvisoCancelamento: 24,
    duracaoSessaoMinutos:   50,
    intervaloEntreSessiones: 10,
  },
}

// Templates WhatsApp
export const wppLembrete = (nome: string, data: string, hora: string, modal: string) => {
  const local = modal === 'Online'
    ? 'Seu link de acesso chegará em breve.'
    : `Endereço: ${CONFIG.psicologa.endereco}.`
  return `Olá, ${nome}! 🌿\n\nPassando para lembrar da sua consulta *amanhã, ${data} às ${hora}* com ${CONFIG.psicologa.nome}.\n${local}\n\nPor favor, confirme sua presença respondendo *SIM* ou *NÃO*.\n\nAté lá! 💚`
}

export const wppBoasVindas = (nome: string, data: string, hora: string, modal: string) => {
  const local = modal === 'Online'
    ? 'O link de acesso será enviado no dia da sessão.'
    : `Endereço: ${CONFIG.psicologa.endereco}.`
  return `Olá, ${nome}! 🌸\n\nSeja muito bem-vinde! Sou a ${CONFIG.psicologa.nome}, psicóloga (CRP ${CONFIG.psicologa.crp}).\n\nSua primeira sessão está marcada para *${data} às ${hora}*. ${local}\n\nEm caso de cancelamento, avise com pelo menos ${CONFIG.clinica.prazoAvisoCancelamento}h de antecedência.\n\nQualquer dúvida, estou por aqui! 💚`
}

export const wppCobranca = (nome: string, valor: number) =>
  `Olá, ${nome}! 🌿\n\nPassando para lembrar sobre o pagamento de R$ ${valor.toFixed(2).replace('.', ',')} referente às suas sessões.\n\nVocê pode quitar pelo PIX: *${CONFIG.financeiro.chavePix}*\n\nSe já realizou o pagamento, desconsidere. Obrigada! 😊`

export const wppCartao = (nome: string, tarefas: string[]) =>
  `Oi, ${nome}! 🌿\n\nSuas atividades terapêuticas da semana estão prontas:\n\n${tarefas.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nLembre-se: cada tarefa concluída é um passo na sua jornada! 💚`
