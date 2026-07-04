// ── MOBILE SIDEBAR + BOTTOM NAV ──
function openSidebar() {
  document.querySelector('.sidebar').classList.add('mobile-open');
  document.getElementById('mobile-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('mobile-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

function mbnGo(view, el) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.mbn-item').forEach(m=>m.classList.remove('active'));
  const v = document.getElementById('v-' + view);
  if (v) v.classList.add('active');
  const nav = document.querySelector('.nav-item[data-view="' + view + '"]');
  if (nav) nav.classList.add('active');
  el.classList.add('active');
  document.getElementById('tb-title').textContent = ({
    dashboard:'Bom dia, Mariane 👋', agenda:'Agenda',
    prontuario:'Prontuários', alertas:'Alertas'
  })[view] || view;
}

// Fechar sidebar ao clicar em item (mobile)
document.querySelectorAll('.nav-item[data-view]').forEach(el => {
  el.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// Bottom nav
const mbnViews = {'dashboard':'mbn-dashboard','agenda':'mbn-agenda','prontuario':'mbn-prontuario','alertas':'mbn-alertas'};
function mbnGo(view, el) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.mbn-item').forEach(m=>m.classList.remove('active'));
  const v = document.getElementById('v-' + view);
  if (v) v.classList.add('active');
  const nav = document.querySelector('.nav-item[data-view="' + view + '"]');
  if (nav) nav.classList.add('active');
  el.classList.add('active');
  document.getElementById('tb-title').textContent = ({
    dashboard:'Bom dia, Mariane 👋', agenda:'Agenda',
    prontuario:'Prontuários', alertas:'Alertas'
  })[view] || view;
}

// Sincronizar bottom nav quando nav lateral é clicada
document.querySelectorAll('.nav-item[data-view]').forEach(el => {
  el.addEventListener('click', () => {
    const view = el.dataset.view;
    document.querySelectorAll('.mbn-item').forEach(m=>m.classList.remove('active'));
    const mbn = document.getElementById('mbn-' + view);
    if (mbn) mbn.classList.add('active');
  });

});
