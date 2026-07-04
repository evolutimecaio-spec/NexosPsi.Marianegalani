// ══════════════════════════════════════
// LOGIN + SESSÃO
// ══════════════════════════════════════
// Senha definida em js/config.js → CONFIG.sistema.hashSenha
const HASH_CORRETO = (window._NEXOPSI_CONFIG || {sistema:{}}).sistema.hashSenha
  || '9b2a95534511812f0fe3a7407822b796b928fcf9bb7e93f9c477e756182cf02d';

async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function doLogin() {
  const pwd = document.getElementById('login-pwd').value;
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-err');
  const inp = document.getElementById('login-pwd');

  if (!pwd) { inp.classList.add('error'); setTimeout(()=>inp.classList.remove('error'),400); return; }

  btn.disabled = true;
  document.getElementById('login-btn-text').textContent = 'Verificando...';

  const hash = await sha256(pwd);
  
  if (hash === HASH_CORRETO) {
    sessionStorage.setItem('nexopsi_auth', '1');
    sessionStorage.setItem('nexopsi_ts', Date.now().toString());
    document.getElementById('login-screen').classList.add('hidden');
    renderAlerts();
    err.style.display = 'none';
  } else {
    err.style.display = 'block';
    inp.classList.add('error');
    inp.value = '';
    setTimeout(()=>inp.classList.remove('error'),400);
    btn.disabled = false;
    document.getElementById('login-btn-text').textContent = 'Entrar no sistema';
  }
}

function togglePwd() {
  const inp = document.getElementById('login-pwd');
  const ico = document.getElementById('eye-icon');
  if (inp.type === 'password') {
    inp.type = 'text';
    ico.className = 'ti ti-eye-off';
  } else {
    inp.type = 'password';
    ico.className = 'ti ti-eye';
  }
}

function logout() {
  sessionStorage.removeItem('nexopsi_auth');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-pwd').value = '';
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn-text').textContent = 'Entrar no sistema';
}

// Checar sessão ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const auth = sessionStorage.getItem('nexopsi_auth');
  const ts = parseInt(sessionStorage.getItem('nexopsi_ts') || '0');
  const horas = ((window._NEXOPSI_CONFIG || {sistema:{}}).sistema.sessaoHoras || 8);
const OITO_HORAS = horas * 60 * 60 * 1000;
  if (auth === '1' && (Date.now() - ts) < OITO_HORAS) {
    document.getElementById('login-screen').classList.add('hidden');
    renderAlerts();
  }
  // Logout no botão da sidebar
  const logoutBtn = document.querySelector('.sb-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

// ══════════════════════════════════════
// MOBILE
