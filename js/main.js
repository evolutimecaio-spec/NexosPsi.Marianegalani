// main.js — ponto de entrada único do NexxoPsi
// Garante que todas as funções inline do HTML existam no escopo global
// e inicializa o sistema após o DOM estar pronto

// ── WRAPPERS GLOBAIS (chamados inline no HTML) ──────────────────────────
// Navegação
function goView(v)          { NAV.go(v); }
function shiftWeek(d)       { RENDER._semanaOffset = (RENDER._semanaOffset||0)+d; RENDER.agenda(); }
function abrirModalAgend()  { openModal('modal-agend'); }

// Prontuário
function selectPatient(el, nome) {
  var p = DB.getPacienteByNome(nome);
  if (p) RENDER.selecionarPaciente(p.id);
}
function salvarNovoPaciente()  { RENDER.salvarNovoPaciente(); }
function saveEvolucao()        { RENDER.salvarEvolucao(); }
function salvarAgendamento()   { RENDER.salvarAgendamento(); }
function agPacienteChanged()   {
  var nome = document.getElementById('ag-pac').value;
  var p = DB.getPacienteByNome(nome);
  if (!p) return;
  var rv = document.getElementById('rec-valor');
  if (rv) { rv.value = p.valorSessao; if (typeof calcularPreview==='function') calcularPreview(); }
  var info = document.getElementById('ag-valor-info');
  if (!info) {
    info = document.createElement('div');
    info.id = 'ag-valor-info';
    info.style.cssText = 'font-size:11px;color:var(--teal);margin-top:4px;padding:4px 0';
    var sel = document.getElementById('ag-pac');
    if (sel && sel.parentElement) sel.parentElement.appendChild(info);
  }
  info.innerHTML = '<i class="ti ti-coin" style="font-size:13px"></i> Valor configurado: <strong>' + DB.fmtMoeda(p.valorSessao) + '/sessão</strong>';
}
function finPacienteChanged()  { RENDER.finPacienteChanged(); }
function editarValorSessao()   { RENDER.editarValorSessao(window._pacienteSelecionado || RENDER._pacienteSelecionadoId); }

// Alertas
function renderAlerts() {
  if (!window.RENDER) return;
  RENDER.dashboard();
  RENDER.prontuario();
  RENDER.wppSelects();
  RENDER.popularSelects();
  // Charts: tentar imediatamente e com delays crescentes (CDN pode demorar)
  function tryCharts(attempt) {
    if (typeof Chart !== 'undefined' && typeof initCharts === 'function') {
      initCharts();
    } else if (attempt < 10) {
      setTimeout(function() { tryCharts(attempt + 1); }, 500);
    }
  }
  tryCharts(0);
}
function filterAlerts(tipo, btn) {
  window._alertFiltro = tipo;
  document.querySelectorAll('#alert-filter-btns .btn').forEach(function(b) {
    b.className = b===btn ? 'btn btn-sage' : 'btn btn-ghost';
    b.style.fontSize = '12px';
  });
  if(RENDER) RENDER.alertasFull();
}

// Financeiro
function gerarRecibo() {
  NAV.go('config');
  setTimeout(function() {
    var btn = document.querySelector('.inner-tabs .it:nth-child(3)');
    if (btn && typeof cfgTab==='function') cfgTab(btn,'cfg-recibo');
  }, 150);
}

// WhatsApp
function wppBuildMsg()  {
  var sel = document.getElementById('wpp-pac');
  if (!sel || !sel.value) return;
  var parts = sel.value.split('|');
  var tipo  = document.getElementById('wpp-tipo').value;
  var nome  = parts[0]||''; var fone = parts[1]||'';
  var data  = parts[2]||''; var hora = parts[3]||''; var modal= parts[4]||'presencial';
  var cfg   = window._NEXOPSI_CONFIG||{};
  var msgs  = cfg.mensagens||{};
  var msg   = '';
  if      (tipo==='lembrete')   msg = typeof msgs.lembrete   ==='function' ? msgs.lembrete(nome,data,hora,modal)   : 'Olá, '+nome+'! Lembrete da sua sessão amanhã, '+data+' às '+hora+'.';
  else if (tipo==='boasvindas') msg = typeof msgs.boasVindas ==='function' ? msgs.boasVindas(nome,data,hora,modal) : 'Olá, '+nome+'! Bem-vinde ao consultório!';
  else if (tipo==='cobranca')   msg = typeof msgs.cobranca   ==='function' ? msgs.cobranca(nome)                   : 'Olá, '+nome+'! Há um pagamento em aberto.';
  else if (tipo==='cartao')     msg = typeof msgs.cartao     ==='function' ? msgs.cartao(nome)                     : 'Oi, '+nome+'! Suas atividades da semana estão prontas.';
  var ta = document.getElementById('wpp-msg');
  if (ta) ta.value = msg;
  var ph = document.getElementById('wpp-phone-label');
  if (ph) ph.textContent = fone ? '('+fone.slice(2,4)+') '+fone.slice(4) : '';
  updateWppLink();
}
function updateWppLink() {
  var sel = document.getElementById('wpp-pac');
  if (!sel || !sel.value) return;
  var fone = sel.value.split('|')[1]||'';
  var msg  = (document.getElementById('wpp-msg')||{}).value||'';
  var btn  = document.getElementById('wpp-send-btn');
  if (btn && fone) btn.href = 'https://wa.me/'+fone+'?text='+encodeURIComponent(msg);
}
function wppSend() {
  var msg = (document.getElementById('wpp-msg')||{}).value||'';
  var sel = document.getElementById('wpp-pac');
  if (!sel||!sel.value||!msg.trim()) return false;
  var nome = sel.value.split('|')[0];
  var tipo = (document.getElementById('wpp-tipo')||{}).value||'livre';
  if (typeof logAlertSend==='function') logAlertSend(nome, tipo);
  var el = document.getElementById('wpp-sent-msg');
  if (el) { el.style.display='block'; setTimeout(function(){ el.style.display='none'; },3000); }
  return true;
}

// ── INICIALIZAÇÃO PRINCIPAL ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Garantir globals (todos os scripts defer já rodaram neste ponto)
  window.RENDER = window.RENDER || {};
  window.NAV    = window.NAV    || { go: function(v){ console.warn('NAV não pronto',v); } };
  window.REL    = window.REL    || {};
  window.DB     = window.DB     || {};

  // Registrar módulos nos seus respectivos objetos
  if (typeof REL !== 'undefined' && REL.render) {
    RENDER.relatorios = function() { REL.render(); };
  }

  // Popular selects
  if (RENDER.popularSelects) RENDER.popularSelects();
  if (RENDER.wppSelects)     RENDER.wppSelects();

  // Verificar sessão ativa
  var auth   = sessionStorage.getItem('nexopsi_auth');
  var ts     = parseInt(sessionStorage.getItem('nexopsi_ts')||'0');
  var maxAge = ((window._NEXOPSI_CONFIG||{}).sistema||{}).sessaoHoras||8;
  maxAge *= 3600000;

  if (auth==='1' && (Date.now()-ts) < maxAge) {
    var ls = document.getElementById('login-screen');
    if (ls) ls.classList.add('hidden');
    renderAlerts();
  }

  // Bottom nav mobile
  document.querySelectorAll('.mbn-item[data-view]').forEach(function(el) {
    el.addEventListener('click', function() { NAV.go(el.dataset.view); });
  });
});
