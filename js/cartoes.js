// cartoes.js — Cartões terapêuticos

var _cartaoSelecionadoId = null;

function cartRender() {
  var lista = document.getElementById('cart-lista');
  if (!lista || !window.DB) return;

  var filtro = document.getElementById('cart-filtro-pac') ? document.getElementById('cart-filtro-pac').value : '';
  var cartoes = DB.getCartoes ? DB.getCartoes() : [];

  // Filtrar
  if (filtro) cartoes = cartoes.filter(function(c) { return c.pacienteId === filtro; });

  if (!cartoes.length) {
    lista.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px"><i class="ti ti-cards" style="font-size:28px;display:block;margin-bottom:8px"></i>Nenhum cartão criado ainda.<br><br><button class="btn btn-sage" onclick="openModal(\'modal-cartao\')"><i class="ti ti-plus"></i> Criar primeiro cartão</button></div>';
    return;
  }

  lista.innerHTML = cartoes.map(function(c) {
    var pac = DB.getPaciente(c.pacienteId);
    var tarefas = c.tarefas || [];
    var feitas = tarefas.filter(function(t){ return t.feita; }).length;
    var pct = tarefas.length ? Math.round(feitas/tarefas.length*100) : 0;
    var statusCls = pct===100 ? 'tag-pago' : (pct>0 ? 'tag-conf' : 'tag-pend');
    var statusTxt = pct===100 ? 'Concluído' : (pct>0 ? 'Ativo' : 'Aguardando');
    var ativo = c.id === _cartaoSelecionadoId ? ' active' : '';
    return '<div class="cartao-item' + ativo + '" onclick="cartSelecionarCartao(\'' + c.id + '\')">'
      + '<div class="ci-head"><div>'
      + '<div class="ci-title">' + (c.titulo||'Sem título') + '</div>'
      + '<div class="ci-meta">' + (pac ? pac.nome : '?') + ' · ' + (c.data||'') + ' · ' + tarefas.length + ' tarefas</div>'
      + '</div><span class="' + statusCls + '">' + statusTxt + '</span></div>'
      + '<div class="ci-bar"><div class="ci-fill" style="width:' + pct + '%"></div></div>'
      + '<div class="ci-adesao">Adesão: ' + pct + '% · ' + feitas + ' de ' + tarefas.length + ' concluídas</div>'
      + '</div>';
  }).join('');

  // Selecionar o primeiro se nenhum selecionado
  if (!_cartaoSelecionadoId && cartoes.length) {
    cartSelecionarCartao(cartoes[0].id);
  } else if (_cartaoSelecionadoId) {
    cartSelecionarCartao(_cartaoSelecionadoId);
  }
}

function cartSelecionarCartao(id) {
  _cartaoSelecionadoId = id;
  // Highlight
  document.querySelectorAll('.cartao-item').forEach(function(el) { el.classList.remove('active'); });
  var els = document.querySelectorAll('.cartao-item');
  els.forEach(function(el) {
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(id)) el.classList.add('active');
  });

  var vazio = document.getElementById('cart-detalhe-vazio');
  var conteudo = document.getElementById('cart-detalhe-conteudo');
  if (!vazio || !conteudo || !window.DB) return;

  var c = DB.getCartoes ? DB.getCartoes().find(function(x){ return x.id===id; }) : null;
  if (!c) { vazio.style.display='block'; conteudo.style.display='none'; return; }

  vazio.style.display = 'none';
  conteudo.style.display = 'block';

  var pac = DB.getPaciente(c.pacienteId);
  var tarefas = c.tarefas || [];
  var feitas = tarefas.filter(function(t){ return t.feita; }).length;
  var pct = tarefas.length ? Math.round(feitas/tarefas.length*100) : 0;

  document.getElementById('cart-d-titulo').textContent = c.titulo || 'Sem título';
  document.getElementById('cart-d-meta').textContent = (pac ? pac.nome : '?') + ' · ' + (c.data||'') + ' · ' + tarefas.length + ' tarefas';
  document.getElementById('cart-d-badge').innerHTML = c.luma ? '<span class="badge b-teal">LUMA sugeriu</span>' : '';
  document.getElementById('adesao-fill').style.width = pct + '%';
  document.getElementById('adesao-pct').textContent = pct + '%';

  // Tarefas
  var tList = document.getElementById('tarefa-list');
  if (tList) {
    tList.innerHTML = tarefas.map(function(t) {
      return '<div class="tarefa' + (t.feita ? ' done' : '') + '" onclick="toggleTarefa(this,\'' + c.id + '\',\'' + t.id + '\')">'
        + '<div class="tar-chk">' + (t.feita ? '<i class="ti ti-check"></i>' : '') + '</div>'
        + '<div class="tar-info"><div class="tar-title">' + t.titulo + '</div>'
        + (t.desc ? '<div class="tar-desc">' + t.desc + '</div>' : '')
        + '</div></div>';
    }).join('');
  }

  // Botão WhatsApp
  if (pac && pac.fone) {
    document.getElementById('cart-btn-wpp').style.display = 'flex';
  }
}

function toggleTarefa(el, cartaoId, tarefaId) {
  if (!window.DB || !DB.getCartoes) return;
  var cartoes = DB.getCartoes();
  var c = cartoes.find(function(x){ return x.id===cartaoId; });
  if (!c) return;
  var t = (c.tarefas||[]).find(function(x){ return x.id===tarefaId; });
  if (!t) return;
  t.feita = !t.feita;
  DB.save(DB.KEYS.CARTOES, cartoes);
  cartSelecionarCartao(cartaoId);
  cartRender();
}

function cartEnviarWpp() {
  if (!_cartaoSelecionadoId || !window.DB) return;
  var c = DB.getCartoes ? DB.getCartoes().find(function(x){ return x.id===_cartaoSelecionadoId; }) : null;
  if (!c) return;
  var pac = DB.getPaciente(c.pacienteId);
  if (!pac || !pac.fone) { if (typeof showToast==='function') showToast('Paciente sem WhatsApp cadastrado.','danger'); return; }

  var cfg = window._NEXOPSI_CONFIG || {};
  var psiNome = (cfg.psicologa||{}).nome || 'Mariane';
  var msg = 'Olá, ' + pac.nome.split(' ')[0] + '! 🌿\n\n'
    + 'Aqui estão suas atividades terapêuticas desta semana:\n\n'
    + '*' + c.titulo + '*\n\n'
    + (c.tarefas||[]).map(function(t,i){ return (i+1)+'. '+t.titulo+(t.desc?'\n   '+t.desc:''); }).join('\n\n')
    + '\n\nQualquer dúvida, me chame! 😊\n— ' + psiNome;

  window.open('https://wa.me/' + pac.fone + '?text=' + encodeURIComponent(msg), '_blank');
  if (typeof showToast==='function') showToast('Cartão enviado por WhatsApp para '+pac.nome.split(' ')[0]+'!');
}

function selectCartao(el, pct) {
  // Compatibilidade com HTML estático antigo
  document.querySelectorAll('.cartao-item').forEach(function(x){ x.classList.remove('active'); });
  if (el) el.classList.add('active');
  var fill = document.getElementById('adesao-fill');
  var pctEl = document.getElementById('adesao-pct');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}
