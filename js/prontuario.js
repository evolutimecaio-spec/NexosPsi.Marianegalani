// prontuario.js — abas internas do prontuário + evoluções

function pronTab(btn, targetId) {
  // Highlight do botão
  document.querySelectorAll('.inner-tabs .it').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Mostrar/ocultar painéis
  ['pron-ev','pron-fin','pron-ana','pron-cart','pron-docs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === targetId) ? '' : 'none';
  });
  // Renderizar conteúdo dinâmico conforme a aba
  const pacId = window.RENDER && RENDER._pacienteSelecionadoId;
  if (!pacId) return;
  if (targetId === 'pron-fin')  { if (RENDER.financeiroPaciente)  RENDER.financeiroPaciente(pacId); }
  if (targetId === 'pron-cart') { if (RENDER.cartoesPaciente)     RENDER.cartoesPaciente(pacId); }
  if (targetId === 'pron-ev')   { if (RENDER.evolucoes)           RENDER.evolucoes(pacId); }
  if (targetId === 'pron-docs') { if (RENDER.documentosPaciente)  RENDER.documentosPaciente(pacId); }
}

function openEvolucao() {
  const f = document.getElementById('evolucao-form');
  if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
}

function applyModel(v) {
  const t = document.getElementById('ev-text');
  if (!t) return;
  if (v === 'tcc')
    t.value = 'Queixa principal:\n\nIntervenção:\n\nPlano para a próxima sessão:';
  else if (v === 'psicod')
    t.value = 'Material trazido:\n\nDinâmica transferencial:\n\nInterpretações:\n\nEncaminhamento:';
  else
    t.value = '';
}

function saveEvolucao() {
  // Usar RENDER.salvarEvolucao se disponível (persiste no DB)
  if (window.RENDER && RENDER.salvarEvolucao) {
    RENDER.salvarEvolucao();
    return;
  }
  // Fallback: adicionar na timeline sem persistir
  const text = document.getElementById('ev-text').value.trim();
  if (!text) return;
  const tl = document.getElementById('ev-timeline');
  if (!tl) return;
  const entry = document.createElement('div');
  entry.className = 'tl-entry';
  const today = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  entry.innerHTML = `<div class="tl-dot"></div><div class="tl-body"><div class="tl-date">${today}</div><div class="tl-card"><div class="tl-head"><span class="tl-title">Evolução clínica</span><span class="tag-conf">Nova</span></div><div class="tl-text">${text.replace(/\n/g,'<br>')}</div></div></div>`;
  tl.insertBefore(entry, tl.firstChild);
  const form = document.getElementById('evolucao-form');
  if (form) form.style.display = 'none';
  document.getElementById('ev-text').value = '';
}
