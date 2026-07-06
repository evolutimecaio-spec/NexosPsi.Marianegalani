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
  return `Olá, ${nome}!\n\nPassando para lembrar da nossa sessão *${data} às ${hora}*.\n${local}\n\nPor favor confirme respondendo *SIM* ou *NÃO*.\n\nAté lá!`
}

export const wppBoasVindas = (nome: string, data: string, hora: string, modal: string) => {
  const local = modal === 'Online'
    ? 'O link de acesso será enviado no dia da sessão.'
    : `Endereço: ${CONFIG.psicologa.endereco}.`
  return `Olá, ${nome}!\n\nSeja bem-vinde! Sou a ${CONFIG.psicologa.nome}, psicóloga (CRP ${CONFIG.psicologa.crp}).\n\nNossa primeira sessão está marcada para *${data} às ${hora}*. ${local}\n\nEm caso de cancelamento, avise com pelo menos 24h de antecedência, combinado?\n\nQualquer dúvida, pode me chamar aqui!`
}

export const wppCobranca = (nome: string, valor: number) =>
  `Olá, ${nome}!\n\nPassando para te lembrar sobre o pagamento de *R$ ${valor.toFixed(2).replace('.', ',')}* referente às nossas sessões.\n\nPode pagar pelo PIX: *${CONFIG.financeiro.chavePix}*\n\nSe já realizou o pagamento, desconsidere. Obrigada!`

export const wppCartao = (nome: string, tarefas: string[]) =>
  `Oi, ${nome}! \n\nSuas atividades terapêuticas da semana estão prontas:\n\n${tarefas.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nLembre-se: cada tarefa concluída é um passo na sua jornada! `
