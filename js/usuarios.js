// usuarios.js — Gerenciamento de usuários com localStorage

var USR_KEY = 'nxp_usuarios';

function usrCarregar() {
  var saved = localStorage.getItem(USR_KEY);
  if (saved) return JSON.parse(saved);
  // Usuário padrão
  return [{
    id: 'u1',
    nome: 'Mariane Galani',
    email: 'mariane@nexopsi.com',
    perfil: 'admin',
    crp: '06/XXXXX',
    ativo: true,
    criado: '2025-01-01'
  }];
}

function usrSalvarTodos(lista) {
  localStorage.setItem(USR_KEY, JSON.stringify(lista));
}

function usrRender() {
  var lista = document.getElementById('usr-lista');
  if (!lista) return;
  var usuarios = usrCarregar();

  var perfilLabel = { admin: 'Admin', psicologa: 'Psicóloga colaboradora', secretaria: 'Secretária' };
  var perfilCor   = { admin: 'var(--teal)', psicologa: '#7B68EE', secretaria: '#E0A020' };

  lista.innerHTML = usuarios.map(function(u) {
    var iniciais = u.nome.split(' ').slice(0,2).map(function(n){ return n[0]; }).join('').toUpperCase();
    var cor = perfilCor[u.perfil] || 'var(--teal)';
    var label = perfilLabel[u.perfil] || u.perfil;
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--warm);border-radius:8px;border:1px solid var(--border)">'
      + '<div style="width:38px;height:38px;border-radius:50%;background:'+cor+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0">'+iniciais+'</div>'
      + '<div style="flex:1">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text)">'+u.nome+'</div>'
      + '<div style="font-size:11px;color:var(--text3)">'+u.email+(u.crp?' · CRP '+u.crp:'')+'</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<span class="badge" style="background:'+cor+'22;color:'+cor+'">'+label+'</span>'
      + (u.id !== 'u1' ? '<button onclick="usrExcluir(\''+u.id+'\')" title="Remover" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px"><i class="ti ti-trash"></i></button>' : '')
      + '</div>'
      + '</div>';
  }).join('')
  + '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--warm);border-radius:8px;border:1px dashed var(--border);cursor:pointer;opacity:0.6" onclick="usrAbrirNovo()">'
  + '<div style="width:38px;height:38px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--text3)"><i class="ti ti-plus"></i></div>'
  + '<div style="font-size:13px;color:var(--text3)">Adicionar psicóloga ou secretária...</div>'
  + '</div>';
}

function usrAbrirNovo() {
  var form = document.getElementById('usr-form-card');
  var perfis = document.getElementById('usr-perfis-card');
  if (form) form.style.display = 'block';
  if (perfis) perfis.style.display = 'none';
  var nome = document.getElementById('usr-nome');
  if (nome) nome.focus();
}

function usrCancelar() {
  var form = document.getElementById('usr-form-card');
  var perfis = document.getElementById('usr-perfis-card');
  if (form) form.style.display = 'none';
  if (perfis) perfis.style.display = 'block';
  ['usr-nome','usr-email','usr-senha'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var err = document.getElementById('usr-erro');
  if (err) err.style.display = 'none';
}

function usrSalvar() {
  var nome  = (document.getElementById('usr-nome')||{}).value || '';
  var email = (document.getElementById('usr-email')||{}).value || '';
  var perfil= (document.getElementById('usr-perfil')||{}).value || 'psicologa';
  var senha = (document.getElementById('usr-senha')||{}).value || '';
  var err   = document.getElementById('usr-erro');

  if (!nome.trim())  { if(err){err.textContent='Informe o nome completo.'; err.style.display='block';} return; }
  if (!email.trim()) { if(err){err.textContent='Informe o e-mail.'; err.style.display='block';} return; }
  if (senha.length < 6) { if(err){err.textContent='A senha precisa ter ao menos 6 caracteres.'; err.style.display='block';} return; }
  if (err) err.style.display = 'none';

  var usuarios = usrCarregar();
  if (usuarios.some(function(u){ return u.email === email.trim(); })) {
    if(err){err.textContent='Este e-mail já está cadastrado.'; err.style.display='block';}
    return;
  }

  usuarios.push({
    id: 'u' + Date.now(),
    nome: nome.trim(),
    email: email.trim(),
    perfil: perfil,
    ativo: true,
    criado: new Date().toISOString().slice(0,10)
  });
  usrSalvarTodos(usuarios);
  usrCancelar();
  usrRender();
  if (typeof showToast==='function') showToast(nome.trim() + ' adicionado com sucesso!');
}

function usrExcluir(id) {
  if (!confirm('Remover este usuário?')) return;
  var usuarios = usrCarregar().filter(function(u){ return u.id !== id; });
  usrSalvarTodos(usuarios);
  usrRender();
  if (typeof showToast==='function') showToast('Usuário removido.');
}

window.usuarios = { render: usrRender, abrirNovo: usrAbrirNovo };
