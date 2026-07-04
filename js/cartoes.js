// ── CARTÕES ──
function selectCartao(el, adesao) {
  document.querySelectorAll('.cartao-item').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('adesao-fill').style.width = adesao + '%';
  document.getElementById('adesao-pct').textContent = adesao + '%';
  document.getElementById('adesao-pct').style.color = adesao >= 60 ? 'var(--sage)' : adesao >= 30 ? 'var(--warn)' : 'var(--danger)';
}
function toggleTarefa(el) {
  el.classList.toggle('done');
  const done = document.querySelectorAll('#tarefa-list .tarefa.done').length;
  const total = document.querySelectorAll('#tarefa-list .tarefa').length;
  const pct = Math.round(done/total*100);
  document.getElementById('adesao-fill').style.width = pct + '%';
  document.getElementById('adesao-pct').textContent = pct + '%';
  document.getElementById('adesao-pct').style.color = pct >= 60 ? 'var(--sage)' : pct >= 30 ? 'var(--warn)' : 'var(--danger)';
}
