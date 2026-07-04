// financeiro.js — funções de financeiro
// Lógica principal em render.js (RENDER.financeiro, RENDER.finPacienteChanged)

function gerarRecibo() {
  // Abrir preview do recibo na aba Config > Layout Recibos
  if (typeof NAV !== 'undefined') {
    NAV.go('config');
    setTimeout(() => {
      if (typeof cfgTab === 'function') {
        const btn = document.querySelector('.inner-tabs .it:nth-child(3)');
        if (btn) cfgTab(btn, 'cfg-recibo');
      }
    }, 100);
  }
  const m = document.getElementById('recibo-msg');
  if (m) { m.style.display='block'; setTimeout(()=>m.style.display='none',3000); }
}
