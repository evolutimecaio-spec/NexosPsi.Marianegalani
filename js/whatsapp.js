// ── WHATSAPP MANUAL ──
const wppTemplates = {
  lembrete:    (nome, data, hora, modal) => (window._NEXOPSI_CONFIG?.mensagens?.lembrete || 
    ((n,d,h,m) => `Olá, ${n}! Sessão em ${d} às ${h}.`))(nome, data, hora, modal),
  boasvindas:  (nome, data, hora, modal) => (window._NEXOPSI_CONFIG?.mensagens?.boasVindas || 
    ((n,d,h,m) => `Olá, ${n}! Bem-vinde! Sessão em ${d} às ${h}.`))(nome, data, hora, modal),
  cobranca:    (nome) => (window._NEXOPSI_CONFIG?.mensagens?.cobranca || 
    ((n) => `Olá, ${n}! Há um pagamento em aberto.`))(nome),
  cartao:      (nome) => (window._NEXOPSI_CONFIG?.mensagens?.cartao || 
    ((n) => `Oi, ${n}! Suas atividades da semana estão prontas.`))(nome),
  livre:       () => "",
};

function wppBuildMsg() {
  const pacSel = document.getElementById('wpp-pac').value;
  const tipo = document.getElementById('wpp-tipo').value;
  const btn = document.getElementById('wpp-send-btn');
  const phoneLabel = document.getElementById('wpp-phone-label');

  if (!pacSel) {
    document.getElementById('wpp-msg').value = '';
    btn.style.opacity = '0.4';
    btn.style.pointerEvents = 'none';
    phoneLabel.textContent = '';
    return;
  }

  const parts = pacSel.split('|');
  const nome = parts[0];
  const phone = parts[1];
  const data = parts[2];
  const hora = parts[3];
  const modal = parts[4];

  const fn = wppTemplates[tipo];
  const msg = fn ? fn(nome, data, hora, modal) : '';
  document.getElementById('wpp-msg').value = msg;

  phoneLabel.textContent = 'Número: ' + phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

  // habilitar botão
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  updateWppLink();
}

function updateWppLink() {
  const pacSel = document.getElementById('wpp-pac').value;
  if (!pacSel) return;
  const phone = '55' + pacSel.split('|')[1];
  const msg = document.getElementById('wpp-msg').value;
  const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
  document.getElementById('wpp-send-btn').href = url;
}

document.addEventListener('DOMContentLoaded', () => {
  const ta = document.getElementById('wpp-msg');
  if (ta) ta.addEventListener('input', updateWppLink);
});

function wppSend() {
  const pacSel = document.getElementById('wpp-pac').value;
  if (!pacSel) return false;
  const msg = document.getElementById('wpp-msg').value.trim();
  if (!msg) return false;

  // Registrar no histórico
  const nome = pacSel.split('|')[0];
  const tipos = {
    lembrete:'Lembrete sessão', boasvindas:'Boas-vindas',
    cobranca:'Cobrança', cartao:'Cartão terapêutico', livre:'Mensagem livre'
  };
  const tipo = document.getElementById('wpp-tipo').value;
  const now = new Date();
  const dt = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' · ' +
              now.getHours().toString().padStart(2,'0') + 'h' +
              now.getMinutes().toString().padStart(2,'0');

  const hist = document.getElementById('wpp-hist-list');
  const row = document.createElement('div');
  row.style.cssText = 'display:grid;grid-template-columns:120px 1fr 140px 100px;gap:8px;font-size:12px;color:var(--text2);padding:9px 0;border-bottom:1px solid var(--border)';
  row.innerHTML = `<span>${dt}</span><span>${nome}</span><span>${tipos[tipo]||tipo}</span><span><span class="tag-pago">Enviado</span></span>`;
  hist.insertBefore(row, hist.firstChild);

  // Feedback
  const sentMsg = document.getElementById('wpp-sent-msg');
  sentMsg.style.display = 'flex';
  setTimeout(() => sentMsg.style.display = 'none', 4000);

  updateWppLink();
  return true; // abre o link
}


// ══════════════════════════════════════════════
// SISTEMA DE ALERTAS — NexxoPsi
// ══════════════════════════════════════════════

// Data de referência: hoje (simulamos 03/07/2025)
const TODAY = new Date(2025, 6, 3); // mês é 0-based

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
}

// ── DADOS DOS PACIENTES ──
// vencimento: data do próximo vencimento financeiro
// sessaoAmanha: data/hora da próxima sessão
// devedora: se há valor em aberto
const PACIENTES = [
  {
    nome:'Ana Silva', fone:'5511999990001',
    vencimento: new Date(2025, 6, 3),  // hoje — vence hoje
    valorAberto: 360, sessoes: [
      {data: new Date(2025, 6, 3),  hora:'10h00', modal:'presencial'},
      {data: new Date(2025, 6, 10), hora:'10h00', modal:'presencial'},
    ]
  },
  {
    nome:'Carla Nunes', fone:'5511999990002',
    vencimento: new Date(2025, 6, 6),  // daqui 3 dias
    valorAberto: 0, sessoes: [
      {data: new Date(2025, 6, 4),  hora:'15h00', modal:'presencial'},
      {data: new Date(2025, 6, 11), hora:'15h00', modal:'presencial'},
    ]
  },
  {
    nome:'Marcos Lima', fone:'5511999990003',
    vencimento: new Date(2025, 6, 10), // daqui 7 dias
    valorAberto: 0, sessoes: [
      {data: new Date(2025, 6, 4),  hora:'14h00', modal:'online'},
    ]
  },
  {
    nome:'Paula Mendes', fone:'5511999990004',
    vencimento: new Date(2025, 6, 15),
    valorAberto: 0, sessoes: [
      {data: new Date(2025, 6, 4),  hora:'08h00', modal:'presencial'},
    ]
  },
  {
    nome:'Rafael Costa', fone:'5511999990005',
    vencimento: new Date(2025, 6, 20),
    valorAberto: 0, sessoes: [
      {data: new Date(2025, 6, 4),  hora:'09h00', modal:'online'},
    ]
  },
  {
    nome:'Thiago Braga', fone:'5511999990006',
    vencimento: new Date(2025, 6, 2),  // venceu ontem — atrasado!
    valorAberto: 150, sessoes: [
      {data: new Date(2025, 6, 3),  hora:'16h30', modal:'online'},
    ]
  },
  {
    nome:'João Pereira', fone:'5511999990007',
    vencimento: new Date(2025, 6, 1),  // venceu há 2 dias
    valorAberto: 150, sessoes: []
  },
];

