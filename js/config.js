// ═══════════════════════════════════════════════════════════
// config.js — NexxoPsi · Configurações do sistema
// ═══════════════════════════════════════════════════════════
// EDITE ESTE ARQUIVO para personalizar o sistema.
// Todos os dados da psicóloga, financeiro e mensagens
// estão centralizados aqui — nenhum outro arquivo precisa
// ser alterado para configurar o sistema.
// ═══════════════════════════════════════════════════════════

const CONFIG = {

  // ── IDENTIDADE DA PSICÓLOGA ──────────────────────────────
  psicologa: {
    nome:       "Mariane Galani",
    crp:        "06/XXXXX",
    cpf:        "123.456.789-00",
    email:      "mariane@email.com",
    whatsapp:   "5511999990000",          // código do país + DDD + número (só dígitos)
    endereco:   "R. Exemplo, 123 – Jundiaí, SP",
    cidade:     "Jundiaí, SP",
    instagram:  "@marianeGalani",         // opcional
  },

  // ── FINANCEIRO ───────────────────────────────────────────
  financeiro: {
    valorSessaoPadrao:    180,            // R$ por sessão (padrão para novos pacientes)
    metaMensalFaturamento: 10000,         // meta de faturamento mensal em R$
    chavePix:             "mariane@email.com",  // chave PIX (e-mail, CPF ou telefone)
    diasAlerteVencimento: [7, 3, 1, 0],  // quantos dias antes gera alerta financeiro
  },

  // ── SISTEMA ──────────────────────────────────────────────
  sistema: {
    // Senha de acesso — hash SHA-256 (NÃO coloque a senha em texto)
    // Para gerar: https://emn178.github.io/online-tools/sha256.html
    // Senha atual: mariane2025
    hashSenha:    "9b2a95534511812f0fe3a7407822b796b928fcf9bb7e93f9c477e756182cf02d",
    sessaoHoras:  8,                      // horas de sessão sem precisar logar de novo
    nomeApp:      "NexxoPsi",
    versao:       "1.0.0",
  },

  // ── MENSAGENS WHATSAPP ───────────────────────────────────
  mensagens: {
    // Lembrete 24h antes da sessão
    lembrete: (nome, data, hora, modal) => {
      const local = modal === "online"
        ? "Seu link de acesso chegará em breve."
        : `Endereço: ${CONFIG.psicologa.endereco}.`;
      return `Olá, ${nome}! 🌿\n\nPassando para lembrar da sua consulta *amanhã, ${data} às ${hora}* com ${CONFIG.psicologa.nome}.\n${local}\n\nPor favor, confirme sua presença respondendo *SIM* ou *NÃO*.\n\nAté lá! 💚`;
    },

    // Boas-vindas ao novo paciente
    boasVindas: (nome, data, hora, modal) => {
      const local = modal === "online"
        ? "O link de acesso será enviado no dia da sessão."
        : `Endereço: ${CONFIG.psicologa.endereco}.`;
      return `Olá, ${nome}! 🌸\n\nSeja muito bem-vinde! Sou a ${CONFIG.psicologa.nome}, psicóloga (CRP ${CONFIG.psicologa.crp}).\n\nSua primeira sessão está marcada para *${data} às ${hora}*. ${local}\n\nAntes de nos encontrarmos, peço que preencha a ficha de anamnese: [link]\n\nEm caso de cancelamento, avise com pelo menos ${CONFIG.clinica.prazoAvisoCancelamento}h de antecedência.\n\nQualquer dúvida, estou por aqui! 💚`;
    },

    // Alerta de cobrança
    cobranca: (nome, valorAberto) => {
      const valor = valorAberto ? `R$ ${valorAberto.toFixed(2).replace(".", ",")}` : "o valor em aberto";
      return `Olá, ${nome}! 🌿\n\nPassando para lembrar sobre o pagamento de ${valor} referente às suas sessões.\n\nVocê pode quitar pelo PIX: *${CONFIG.financeiro.chavePix}*\n\nSe já realizou o pagamento, desconsidere esta mensagem. Obrigada! 😊`;
    },

    // Envio de cartão terapêutico
    cartao: (nome, linkCartao) => {
      return `Oi, ${nome}! 🌿\n\nSuas atividades terapêuticas da semana estão prontas.\n\nAcesse pelo link: ${linkCartao || "[link do cartão]"}\n\nLembre-se: cada tarefa concluída é um passo na sua jornada. Estou na torcida! 💚`;
    },

    // Mensagem livre (template inicial)
    livre: () => "",
  },

  // ── CLÍNICA ──────────────────────────────────────────────
  clinica: {
    prazoAvisoCancelamento: 24,           // horas de antecedência para cancelamento
    duracaoSessaoMinutos:   50,           // duração padrão de uma sessão
    intervaloEntreSessiones: 10,          // minutos de intervalo entre sessões
    modalidadesDisponiveis: [             // tipos de sessão disponíveis
      "Terapia Individual",
      "Terapia de Casal",
      "Avaliação Psicológica",
      "Sessão Inicial",
      "Orientação Parental",
    ],
  },

  // ── ALERTAS ──────────────────────────────────────────────
  alertas: {
    // Dias antes do vencimento para disparar alerta financeiro
    diasAntes: [7, 3, 1, 0],
    // Lembrete de sessão: alertar N dias antes (1 = dia anterior)
    diasAntesSessao: 1,
  },
};

// ── Aplicar CONFIG globalmente ────────────────────────────
// Sobrescreve valores hardcoded ao carregar o sistema
(function aplicarConfig() {
  // Atualizar hash da senha em auth.js quando carregado
  window._NEXOPSI_CONFIG = CONFIG;

  // Atualizar título da página
  document.addEventListener("DOMContentLoaded", () => {
    document.title = `${CONFIG.sistema.nomeApp} — Gestão Clínica`;

    // Atualizar nome na sidebar e topbar
    document.querySelectorAll(".sb-uname").forEach(el => el.textContent = CONFIG.psicologa.nome);
    document.querySelectorAll(".sb-ucrp").forEach(el => el.textContent = `CRP ${CONFIG.psicologa.crp} · Admin`);
    document.querySelectorAll(".sb-footer-city").forEach(el => {
      el.innerHTML = `<i class="ti ti-map-pin"></i> ${CONFIG.psicologa.cidade}`;
    });

    // Atualizar inputs pré-preenchidos de configurações
    const inputs = {
      "np-email": CONFIG.psicologa.email,
    };
    // Campos de config (se existirem)
    const configFields = {
      "cfg-nome":     CONFIG.psicologa.nome,
      "cfg-crp":      CONFIG.psicologa.crp,
      "cfg-cpf":      CONFIG.psicologa.cpf,
      "cfg-email":    CONFIG.psicologa.email,
      "cfg-tel":      CONFIG.psicologa.whatsapp,
      "cfg-endereco": CONFIG.psicologa.endereco,
      "cfg-pix":      CONFIG.financeiro.chavePix,
      "cfg-meta":     CONFIG.financeiro.metaMensalFaturamento,
      "cfg-valor":    CONFIG.financeiro.valorSessaoPadrao,
    };
    Object.entries(configFields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
  });
})();

// ── Salvar configurações da tela de Config ──────────────
function saveConfig() {
  const updates = {
    "cfg-nome":        ["psicologa", "nome"],
    "cfg-crp":         ["psicologa", "crp"],
    "cfg-cpf":         ["psicologa", "cpf"],
    "cfg-email":       ["psicologa", "email"],
    "cfg-tel":         ["psicologa", "whatsapp"],
    "cfg-endereco":    ["psicologa", "endereco"],
    "cfg-pix":         ["financeiro", "chavePix"],
    "cfg-meta":        ["financeiro", "metaMensalFaturamento"],
    "cfg-valor":       ["financeiro", "valorSessaoPadrao"],
    "cfg-cancelamento":["clinica",   "prazoAvisoCancelamento"],
  };

  let changed = 0;
  Object.entries(updates).forEach(([id, [section, key]]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = isNaN(el.value) ? el.value : Number(el.value);
    CONFIG[section][key] = val;
    changed++;
  });

  // Persistir no localStorage para sobreviver ao reload
  try {
    const saveable = {
      psicologa:  CONFIG.psicologa,
      financeiro: { ...CONFIG.financeiro, diasAlerteVencimento: CONFIG.financeiro.diasAlerteVencimento },
      sistema:    { nomeApp: CONFIG.sistema.nomeApp, sessaoHoras: CONFIG.sistema.sessaoHoras },
      clinica:    CONFIG.clinica,
    };
    localStorage.setItem("nexopsi_config", JSON.stringify(saveable));
  } catch(e) { console.warn("localStorage indisponível:", e); }

  // Aplicar mudanças imediatamente
  document.querySelectorAll(".sb-uname").forEach(el => el.textContent = CONFIG.psicologa.nome);
  document.querySelectorAll(".sb-ucrp").forEach(el => el.textContent = `CRP ${CONFIG.psicologa.crp} · Admin`);
  document.querySelectorAll(".sb-footer-city").forEach(el => {
    el.innerHTML = `<i class="ti ti-map-pin"></i> ${CONFIG.psicologa.cidade || CONFIG.psicologa.endereco.split("–")[1]?.trim() || CONFIG.psicologa.endereco}`;
  });

  // Feedback
  const m = document.getElementById("config-msg");
  if (m) { m.style.display = "block"; setTimeout(() => m.style.display = "none", 3000); }
  if (typeof showToast === "function") showToast("Configurações salvas com sucesso!");
  if (typeof renderAlerts === "function") renderAlerts();
}

// ── Carregar configurações salvas do localStorage ────────
(function carregarConfigSalva() {
  try {
    const saved = localStorage.getItem("nexopsi_config");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    // Merge: preservar funções do CONFIG original, só sobrescrever dados
    if (parsed.psicologa)  Object.assign(CONFIG.psicologa,  parsed.psicologa);
    if (parsed.financeiro) Object.assign(CONFIG.financeiro, parsed.financeiro);
    if (parsed.sistema)    Object.assign(CONFIG.sistema,    parsed.sistema);
    if (parsed.clinica)    Object.assign(CONFIG.clinica,    parsed.clinica);
    window._NEXOPSI_CONFIG = CONFIG;
  } catch(e) { console.warn("Erro ao carregar config salva:", e); }
})();

// ══════════════════════════════════════════════════════════
// CONFIGURAÇÕES — ABAS, RECIBO, LOGO, CORES, SENHA, RECORRÊNCIA
// ══════════════════════════════════════════════════════════

// ── Abas de configuração ──
function cfgTab(btn, targetId) {
  document.querySelectorAll('.inner-tabs .it').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['cfg-perfil','cfg-logo','cfg-recibo','cfg-sistema'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === targetId) ? '' : 'none';
  });
  if (targetId === 'cfg-recibo') carregarConfigRecibo();
}

function carregarConfigRecibo() {
  try {
    const saved = localStorage.getItem('nexopsi_recibo_cfg');
    if (!saved) return;
    const cfg = JSON.parse(saved);
    if (cfg.titulo) {
      const sel = document.getElementById('rec-titulo');
      if (sel) { Array.from(sel.options).forEach(o => { o.selected = o.value === cfg.titulo || o.text === cfg.titulo; }); }
    }
    if (cfg.rodape) { const el = document.getElementById('rec-rodape'); if (el) el.value = cfg.rodape; }
    if (cfg.local)  { const el = document.getElementById('rec-local');  if (el) el.value = cfg.local; }
    if (cfg.campos) {
      Object.entries(cfg.campos).forEach(([key, val]) => {
        const el = document.getElementById('rec-c-' + key);
        if (el) el.checked = !!val;
      });
    }
    if (typeof atualizarPrevRecibo === 'function') atualizarPrevRecibo();
  } catch(e) { console.warn('Erro ao carregar config recibo:', e); }
}

// ── LOGO ──
function trocarLogo(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    const prev = document.getElementById('logo-nova-img');
    if (prev) { prev.src = src; prev.parentElement.style.display = 'block'; }
    window._novaLogoSrc = src;
  };
  reader.readAsDataURL(input.files[0]);
}
function aplicarLogo() {
  if (!window._novaLogoSrc) return;
  // Aplicar em todos os locais do logo
  document.querySelectorAll('#logo-preview, .login-logo img, #rec-prev-logo').forEach(img => {
    img.src = window._novaLogoSrc;
  });
  // Salvar no localStorage
  try { localStorage.setItem('nexopsi_logo', window._novaLogoSrc); } catch(e) {}
  if (typeof showToast === 'function') showToast('Logo atualizado com sucesso!');
  document.getElementById('logo-nova-preview').style.display = 'none';
}

// ── FOTO ──
function trocarFoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    const fotoEl = document.getElementById('foto-preview');
    const iniciais = document.getElementById('foto-iniciais');
    if (fotoEl) { fotoEl.src = src; fotoEl.style.display = 'block'; }
    if (iniciais) iniciais.style.display = 'none';
    // Atualizar avatar da sidebar e topbar
    document.querySelectorAll('.sb-avatar, .tb-avatar').forEach(av => {
      av.style.backgroundImage = `url(${src})`;
      av.style.backgroundSize = 'cover';
      av.textContent = '';
    });
    try { localStorage.setItem('nexopsi_foto', src); } catch(e) {}
    if (typeof showToast === 'function') showToast('Foto atualizada!');
  };
  reader.readAsDataURL(input.files[0]);
}

// ── CORES ──
function syncCor(tipo) {
  const val = document.getElementById('cor-' + tipo).value;
  document.getElementById('cor-' + tipo + '-hex').value = val;
  atualizarPrevCores();
}
function syncCorHex(tipo) {
  const val = document.getElementById('cor-' + tipo + '-hex').value;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    document.getElementById('cor-' + tipo).value = val;
    atualizarPrevCores();
  }
}
function atualizarPrevCores() {
  const prim = document.getElementById('cor-primaria').value;
  const dest = document.getElementById('cor-destaque').value;
  const b1 = document.getElementById('prev-badge');
  const b2 = document.getElementById('prev-badge2');
  const b3 = document.getElementById('prev-badge3');
  if (b1) b1.style.background = prim;
  if (b2) b2.style.background = dest;
  if (b3) { b3.style.background = prim + '20'; b3.style.color = prim; }
}
function aplicarCores() {
  const prim = document.getElementById('cor-primaria').value;
  const dest = document.getElementById('cor-destaque').value;
  // Converter hex para rgb para os gradientes
  const r = p => { const c = parseInt(p.slice(1), 16); return [(c>>16)&255, (c>>8)&255, c&255]; };
  const [pr,pg,pb] = r(prim);
  const [dr,dg,db] = r(dest);
  // Calcular variantes
  const darken = (hex, amt) => { const [rr,gg,bb] = r(hex); return `rgb(${Math.max(0,rr-amt)},${Math.max(0,gg-amt)},${Math.max(0,bb-amt)})`; };
  const lighten = (hex, alpha) => { const [rr,gg,bb] = r(hex); return `rgba(${rr},${gg},${bb},${alpha})`; };

  document.documentElement.style.setProperty('--teal', prim);
  document.documentElement.style.setProperty('--teal-h', darken(prim, 20));
  document.documentElement.style.setProperty('--teal-mid', `rgb(${Math.min(255,pr+30)},${Math.min(255,pg+30)},${Math.min(255,pb+30)})`);
  document.documentElement.style.setProperty('--teal-light', lighten(prim, 0.12));
  document.documentElement.style.setProperty('--navy', dest);
  document.documentElement.style.setProperty('--navy-h', darken(dest, 20));

  // Atualizar sidebar gradient
  document.querySelector('.sidebar').style.background =
    `linear-gradient(160deg, ${darken(dest,10)} 0%, ${dest} 45%, ${darken(dest,5)} 100%)`;

  try {
    localStorage.setItem('nexopsi_cores', JSON.stringify({ prim, dest }));
  } catch(e) {}
  if (typeof showToast === 'function') showToast('Cores aplicadas com sucesso!');
}
function resetarCores() {
  document.getElementById('cor-primaria').value = '#2080A0';
  document.getElementById('cor-primaria-hex').value = '#2080A0';
  document.getElementById('cor-destaque').value = '#1E3654';
  document.getElementById('cor-destaque-hex').value = '#1E3654';
  atualizarPrevCores();
  aplicarCores();
  localStorage.removeItem('nexopsi_cores');
  if (typeof showToast === 'function') showToast('Cores restauradas ao padrão!');
}

// ── RECIBO — PREVIEW AO VIVO ──
function atualizarPrevRecibo() {
  const titulo = document.getElementById('rec-titulo')?.value || '';
  const rodape = document.getElementById('rec-rodape')?.value || '';
  const local  = document.getElementById('rec-local')?.value || '';
  const showLogo   = document.getElementById('rec-c-logo')?.checked;
  const showCpf    = document.getElementById('rec-c-cpf')?.checked;
  const showPac    = document.getElementById('rec-c-pac')?.checked;
  const showDetalhe= document.getElementById('rec-c-detalhe')?.checked;
  const showDiag   = document.getElementById('rec-c-diag')?.checked;
  const showAssin  = document.getElementById('rec-c-assin')?.checked;

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const show = (id, visible) => { const el = document.getElementById(id); if(el) el.style.display = visible ? '' : 'none'; };

  set('rec-prev-titulo', titulo);
  const rodapeEl = document.getElementById('rec-prev-rodape');
  if (rodapeEl) rodapeEl.textContent = rodape;
  set('rec-prev-local', local + ', ___/___/2025');
  const logoEl = document.getElementById('rec-prev-logo');
  if (logoEl) logoEl.style.display = showLogo ? 'block' : 'none';
  const cpfEl = document.getElementById('rec-prev-cpf');
  if (cpfEl) cpfEl.style.display = showCpf ? '' : 'none';
  show('rec-bloco-pac', showPac);
  show('rec-bloco-detalhe', showDetalhe);
  show('rec-bloco-diag', showDiag);
  show('rec-bloco-assin', showAssin);
}
function salvarConfigRecibo() {
  const cfg = {
    titulo:   document.getElementById('rec-titulo')?.value,
    rodape:   document.getElementById('rec-rodape')?.value,
    local:    document.getElementById('rec-local')?.value,
    campos: {
      nome:    document.getElementById('rec-c-nome')?.checked,
      cpf:     document.getElementById('rec-c-cpf')?.checked,
      pac:     document.getElementById('rec-c-pac')?.checked,
      total:   document.getElementById('rec-c-total')?.checked,
      detalhe: document.getElementById('rec-c-detalhe')?.checked,
      diag:    document.getElementById('rec-c-diag')?.checked,
      assin:   document.getElementById('rec-c-assin')?.checked,
      logo:    document.getElementById('rec-c-logo')?.checked,
    }
  };
  try { localStorage.setItem('nexopsi_recibo_cfg', JSON.stringify(cfg)); } catch(e) {}
  const m = document.getElementById('recibo-cfg-msg');
  if (m) { m.style.display = 'block'; setTimeout(() => m.style.display = 'none', 3000); }
  if (typeof showToast === 'function') showToast('Layout de recibo salvo!');
}
function imprimirRecibo() {
  const preview = document.getElementById('recibo-preview');
  if (!preview) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo</title>
  <style>body{font-family:'Times New Roman',serif;font-size:13px;padding:40px;max-width:680px;margin:0 auto;color:#222}
  @media print{body{padding:20px}}</style></head><body>${preview.innerHTML}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ── SENHA ──
async function trocarSenha() {
  const nova = document.getElementById('cfg-nova-senha').value;
  const conf = document.getElementById('cfg-conf-senha').value;
  const msg  = document.getElementById('senha-msg');
  const showMsg = (txt, ok) => {
    msg.textContent = txt;
    msg.style.display = 'block';
    msg.style.background = ok ? 'var(--success-bg)' : 'var(--danger-bg)';
    msg.style.color = ok ? 'var(--success)' : 'var(--danger)';
    setTimeout(() => msg.style.display = 'none', 4000);
  };
  if (!nova) return showMsg('Digite a nova senha.', false);
  if (nova.length < 6) return showMsg('A senha deve ter ao menos 6 caracteres.', false);
  if (nova !== conf)  return showMsg('As senhas não coincidem.', false);
  const hash = await (async msg => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  })(nova);
  CONFIG.sistema.hashSenha = hash;
  try {
    const saved = JSON.parse(localStorage.getItem('nexopsi_config') || '{}');
    saved.sistema = saved.sistema || {};
    saved.sistema.hashSenha = hash;
    localStorage.setItem('nexopsi_config', JSON.stringify(saved));
  } catch(e) {}
  document.getElementById('cfg-nova-senha').value = '';
  document.getElementById('cfg-conf-senha').value = '';
  showMsg('Senha alterada com sucesso! Use a nova senha no próximo login.', true);
}

// ── DADOS ──
function exportarDados() {
  const dados = {
    config: { psicologa: CONFIG.psicologa, financeiro: CONFIG.financeiro, clinica: CONFIG.clinica },
    exportado: new Date().toISOString(),
    versao: CONFIG.sistema.versao,
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nexopsi-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
}
function limparDados() {
  if (!confirm('Tem certeza? Todos os dados locais serão apagados. O sistema voltará às configurações padrão.')) return;
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}

// ── Carregar logo/foto/cores salvas ──
document.addEventListener('DOMContentLoaded', () => {
  try {
    const logo = localStorage.getItem('nexopsi_logo');
    if (logo) document.querySelectorAll('#logo-preview, .login-logo img').forEach(img => img.src = logo);
    const foto = localStorage.getItem('nexopsi_foto');
    if (foto) {
      const fotoEl = document.getElementById('foto-preview');
      if (fotoEl) { fotoEl.src = foto; fotoEl.style.display = 'block'; }
      const iniciais = document.getElementById('foto-iniciais');
      if (iniciais) iniciais.style.display = 'none';
    }
    const cores = JSON.parse(localStorage.getItem('nexopsi_cores') || 'null');
    if (cores) {
      document.getElementById('cor-primaria').value = cores.prim;
      document.getElementById('cor-primaria-hex').value = cores.prim;
      document.getElementById('cor-destaque').value = cores.dest;
      document.getElementById('cor-destaque-hex').value = cores.dest;
      aplicarCores();
    }
  } catch(e) {}
});

// ══════════════════════════════════════════════════════════
// AGENDAMENTO RECORRENTE
// ══════════════════════════════════════════════════════════
let agModo = 'avulso';

function agTab(modo) {
  agModo = modo;
  const isRec = modo === 'recorrente';
  document.getElementById('ag-bloco-avulso').style.display     = isRec ? 'none' : '';
  document.getElementById('ag-bloco-recorrente').style.display = isRec ? '' : 'none';

  const btnAv  = document.getElementById('ag-tab-avulso');
  const btnRec = document.getElementById('ag-tab-recorrente');
  if (btnAv)  { btnAv.className  = isRec ? 'btn btn-ghost' : 'btn btn-sage'; btnAv.style.cssText  = 'flex:1;justify-content:center;font-size:13px;border-radius:7px' + (isRec ? ';background:transparent;border:none' : ''); }
  if (btnRec) { btnRec.className = isRec ? 'btn btn-sage'  : 'btn btn-ghost'; btnRec.style.cssText = 'flex:1;justify-content:center;font-size:13px;border-radius:7px' + (isRec ? '' : ';background:transparent;border:none'); }

  const btnSalvar = document.getElementById('ag-btn-salvar');
  if (btnSalvar) btnSalvar.innerHTML = isRec
    ? '<i class="ti ti-calendar-repeat"></i> Criar recorrência'
    : '<i class="ti ti-check"></i> Confirmar agendamento';

  if (isRec) calcularPreview();
}

function calcularPreview() {
  const inicioEl = document.getElementById('rec-inicio');
  const horaEl   = document.getElementById('rec-hora');
  const freqEl   = document.getElementById('rec-freq');
  const durEl    = document.getElementById('rec-duracao');
  const valorEl  = document.getElementById('rec-valor');
  if (!inicioEl) return;

  const inicio = new Date(inicioEl.value + 'T' + (horaEl?.value || '10:00'));
  const freq   = parseInt(freqEl?.value || 7);
  const dur    = parseInt(durEl?.value || 8);
  const valor  = parseFloat(valorEl?.value || 180);
  const indefinido = dur === 0;
  const total = indefinido ? 8 : dur; // mostrar 8 como exemplo se indeterminado

  const sessoes = [];
  let data = new Date(inicio);
  for (let i = 0; i < total; i++) {
    sessoes.push(new Date(data));
    data.setDate(data.getDate() + freq);
  }

  const listEl = document.getElementById('rec-preview-list');
  const totEl  = document.getElementById('rec-preview-total');
  if (!listEl) return;

  listEl.innerHTML = sessoes.map((s, i) => {
    const dt = s.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' });
    const hr = s.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)">
      <span><strong>Sessão ${i+1}</strong> · ${dt} às ${hr}</span>
      <span style="color:var(--teal);font-weight:500">R$ ${valor.toFixed(2).replace('.',',')}</span>
    </div>`;
  }).join('') + (indefinido ? '<div style="text-align:center;color:var(--text3);font-size:11px;padding:6px 0">... continua até cancelamento</div>' : '');

  const totalValor = (indefinido ? 0 : total * valor);
  totEl.innerHTML = indefinido
    ? `<i class="ti ti-infinity"></i> ${total} sessões criadas inicialmente · R$ ${(total*valor).toFixed(2).replace('.',',')} | continuação automática`
    : `<i class="ti ti-calculator"></i> ${total} sessões · Total: R$ ${totalValor.toFixed(2).replace('.',',')}`;
}

// Substituir salvarAgendamento para suportar recorrência
const _salvarAgendamentoOriginal = window.salvarAgendamento;
function salvarAgendamento() {
  if (agModo === 'recorrente') {
    salvarRecorrencia();
  } else {
    // Versão avulsa original
    const pac  = document.getElementById('ag-pac').value;
    const data = document.getElementById('ag-data')?.value;
    const hora = document.getElementById('ag-hora')?.value;
    const err  = document.getElementById('ag-erro');
    if (!pac)  { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
    if (!data) { err.textContent='Selecione a data.'; err.style.display='block'; return; }
    if (!hora) { err.textContent='Informe o horário.'; err.style.display='block'; return; }
    err.style.display='none';
    const tipo = document.getElementById('ag-tipo').value;
    const mod  = document.getElementById('ag-mod').value;
    const dt   = new Date(data+'T'+hora).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    if (typeof closeModal === 'function') closeModal('modal-agend');
    if (typeof showToast === 'function') showToast('Sessão de '+pac+' agendada para '+dt+' às '+hora+'!');
  }
}

function salvarRecorrencia() {
  const pac    = document.getElementById('ag-pac').value;
  const inicio = document.getElementById('rec-inicio')?.value;
  const hora   = document.getElementById('rec-hora')?.value;
  const freq   = parseInt(document.getElementById('rec-freq')?.value || 7);
  const dur    = parseInt(document.getElementById('rec-duracao')?.value || 8);
  const valor  = parseFloat(document.getElementById('rec-valor')?.value || 180);
  const venc   = document.getElementById('rec-venc')?.value || '10';
  const cobr   = document.getElementById('rec-cobr')?.value || 'mensal';
  const err    = document.getElementById('ag-erro');

  if (!pac)    { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
  if (!inicio) { err.textContent='Informe a data de início.'; err.style.display='block'; return; }
  err.style.display='none';

  const total = dur === 0 ? 12 : dur;
  let data = new Date(inicio + 'T' + hora);
  const sessoes = [];
  for (let i = 0; i < total; i++) {
    sessoes.push({
      data: new Date(data).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}),
      hora,
      paciente: pac,
      tipo: document.getElementById('ag-tipo')?.value || 'Terapia Individual',
      modalidade: document.getElementById('ag-mod')?.value || 'Presencial',
      valor
    });
    data.setDate(data.getDate() + freq);
  }

  // Gerar faturas mensais
  const faturas = {};
  sessoes.forEach(s => {
    const mesAno = s.data.slice(3); // MM/YYYY
    if (!faturas[mesAno]) faturas[mesAno] = { sessoes: 0, total: 0, pac };
    faturas[mesAno].sessoes++;
    faturas[mesAno].total += s.valor;
  });

  // Salvar no localStorage
  try {
    const key = 'recorrencia_' + pac.replace(/\s/g,'_') + '_' + Date.now();
    localStorage.setItem(key, JSON.stringify({ pac, sessoes, faturas, freq, venc, cobr }));
  } catch(e) {}

  closeModal('modal-agend');
  const nSessoes = sessoes.length;
  const nMeses = Object.keys(faturas).length;
  const totalGeral = sessoes.reduce((a,s)=>a+s.valor, 0);
  showToast(`✓ ${nSessoes} sessões criadas para ${pac} · ${nMeses} faturas geradas · R$ ${totalGeral.toFixed(2).replace('.',',')} total`);
  agTab('avulso'); // resetar para avulso
}
