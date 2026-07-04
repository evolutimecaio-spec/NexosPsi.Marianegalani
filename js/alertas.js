// alertas.js — compatibilidade e helper de histórico de envios WhatsApp
// Lógica real de alertas em render.js (RENDER._gerarAlertas, RENDER.alertasDash)

// diffDays: helper de datas (pode ser usado por código legado)
function diffDays(a, b) {
  const d1 = new Date(a); d1.setHours(0,0,0,0);
  const d2 = new Date(b); d2.setHours(0,0,0,0);
  return Math.round((d2 - d1) / 86400000);
}

// renderAlerts: alias — o render.js sobrescreve com a versão real
function renderAlerts() {
  if (window.RENDER) RENDER.alertasDash();
}

// filterAlerts: chamado pelos botões de filtro na view de alertas
function filterAlerts(tipo, btn) {
  window._alertFiltro = tipo;
  document.querySelectorAll('#alert-filter-btns .btn, .alert-filter-btn').forEach(b => {
    b.className = b === btn ? 'btn btn-sage' : 'btn btn-ghost';
    b.style.fontSize = '12px';
  });
  if (window.RENDER) RENDER.alertasFull();
}

// logAlertSend: registrar envio de WhatsApp no histórico
function logAlertSend(nome, tipo) {
  if (window.WPP) { WPP.logEnvio(nome, tipo); return; }
  const hist = JSON.parse(localStorage.getItem('nxp_wpp_hist') || '[]');
  hist.unshift({ nome, tipo, data: new Date().toISOString() });
  localStorage.setItem('nxp_wpp_hist', JSON.stringify(hist.slice(0,50)));
  const histEl = document.getElementById('wpp-hist-list');
  if (!histEl) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:80px 1fr 120px;font-size:12px;padding:6px 0;border-bottom:1px solid var(--border)';
  const now = new Date();
  const dt = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' ' + now.getHours().toString().padStart(2,'0') + 'h' + now.getMinutes().toString().padStart(2,'0');
  div.innerHTML = `<span>${dt}</span><span>${nome}</span><span><span class="tag-pago">Enviado</span></span>`;
  histEl.insertBefore(div, histEl.firstChild);
}
