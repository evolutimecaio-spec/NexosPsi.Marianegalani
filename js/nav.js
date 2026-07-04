// nav.js
var titles = {
  dashboard:'Bom dia, Mariane 👋', alertas:'Alertas', agenda:'Agenda',
  prontuario:'Prontuários', smartnotes:'Smart Notes — IA', anamnese:'Anamneses',
  cartoes:'Cartões Terapêuticos', financeiro:'Financeiro', whatsapp:'WhatsApp',
  relatorios:'Relatórios', usuarios:'Usuários', config:'Configurações'
};

var NAV = {
  go: function(view) {
    document.querySelectorAll('.view').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.mbn-item').forEach(function(x){ x.classList.remove('active'); });
    var target = document.getElementById('v-' + view);
    if (target) target.classList.add('active');
    var navEl = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navEl) navEl.classList.add('active');
    var mbnEl = document.getElementById('mbn-' + view);
    if (mbnEl) mbnEl.classList.add('active');
    var titleEl = document.getElementById('tb-title');
    if (titleEl) titleEl.textContent = titles[view] || view;
    if (window.RENDER && RENDER._onViewChange) RENDER._onViewChange(view);
  }
};
window.NAV = NAV;

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-item[data-view]').forEach(function(el) {
    el.addEventListener('click', function() { NAV.go(el.dataset.view); });
  });
});
