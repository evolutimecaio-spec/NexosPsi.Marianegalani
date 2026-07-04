// ══════════════════════════════════════
// SISTEMA DE MODAIS
// ══════════════════════════════════════
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow='hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow=''; }
}
// Fechar clicando fora
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
// ESC fecha modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

// TOAST
let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  const ico = document.getElementById('toast-icon');
  t.className = 'toast show ' + type;
  ico.className = type === 'success' ? 'ti ti-check' : type === 'danger' ? 'ti ti-x' : 'ti ti-info-circle';
  m.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── NOVO PACIENTE ──
function salvarNovoPaciente() {
  const nome = document.getElementById('np-nome').value.trim();
  const tel = document.getElementById('np-tel').value.trim();
  const err = document.getElementById('np-erro');
  if (!nome) { err.textContent = 'Informe o nome completo do paciente.'; err.style.display='block'; return; }
  if (!tel)  { err.textContent = 'Informe o telefone / WhatsApp.'; err.style.display='block'; return; }
  err.style.display='none';
  // Adicionar na lista de pacientes
  const list = document.getElementById('patient-list');
  if (list) {
    const item = document.createElement('div');
    item.className = 'patient-mini';
    item.innerHTML = `<div class="pm-row"><div class="pm-name">${nome}</div><span class="tag-conf">Novo</span></div><div class="pm-meta">${tel} · Cadastrado hoje</div>`;
    item.onclick = function() { selectPatient(this, nome); };
    list.insertBefore(item, list.firstChild);
    const cnt = document.getElementById('pac-count');
    if (cnt) cnt.textContent = (parseInt(cnt.textContent) + 1) + ' pacientes ativos';
  }
  // Adicionar no select da agenda e whatsapp
  ['ag-pac','nc-pac','na-pac','wpp-pac'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (sel) {
      const opt = document.createElement('option');
      opt.value = nome + '|' + tel.replace(/\D/g,'') + '||10h00|presencial';
      opt.textContent = nome + ' · ' + tel;
      sel.appendChild(opt);
    }
  });
  closeModal('modal-paciente');
  showToast('Paciente ' + nome + ' cadastrado com sucesso!');
  // Limpar form
  ['np-nome','np-cpf','np-tel','np-email','np-cid','np-valor','np-obs'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
}

// ── NOVO CARTÃO ──
function addTarefaRow() {
  const list = document.getElementById('nc-tarefas-list');
  const row = document.createElement('div');
  row.className = 'nc-tarefa-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
  row.innerHTML = '<input class="nc-tar-input" placeholder="Descrição da tarefa..." style="flex:1;border:1px solid var(--border);border-radius:8px;padding:8px 11px;font-size:13px;font-family:var(--font);background:var(--warm);outline:none"><button onclick="removeTarefaRow(this)" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer;color:var(--text3)"><i class="ti ti-trash"></i></button>';
  list.appendChild(row);
  row.querySelector('input').focus();
}
function removeTarefaRow(btn) {
  const rows = document.querySelectorAll('.nc-tarefa-row');
  if (rows.length > 1) btn.parentElement.remove();
}
function salvarNovoCartao() {
  const pac = document.getElementById('nc-pac').value;
  const titulo = document.getElementById('nc-titulo').value.trim();
  const err = document.getElementById('nc-erro');
  const tarefas = [...document.querySelectorAll('.nc-tar-input')].map(i=>i.value.trim()).filter(Boolean);
  if (!pac)        { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
  if (!titulo)     { err.textContent='Informe o título do cartão.'; err.style.display='block'; return; }
  if (!tarefas.length) { err.textContent='Adicione ao menos uma tarefa.'; err.style.display='block'; return; }
  err.style.display='none';
  // Salvar no DB
  if (window.DB) {
    const p = DB.getPacienteByNome(pac);
    if (p) {
      DB.addCartao(p.id, {
        titulo,
        tarefas: tarefas.map((t,i) => ({ id:'t'+Date.now()+i, titulo:t, desc:'', feita:false })),
        geradoLuma: false,
        validade: document.getElementById('nc-val')?.value || 'Semanal'
      });
    }
  }
  closeModal('modal-cartao');
  showToast('Cartão "' + titulo + '" criado para ' + pac + '!');
  document.getElementById('nc-titulo').value='';
  document.getElementById('nc-pac').value='';
  document.querySelectorAll('.nc-tar-input').forEach((inp,i) => { if(i>0) inp.parentElement.remove(); else inp.value=''; });
  // Atualizar aba cartões se prontuário aberto
  if (window.RENDER && RENDER._pacienteSelecionadoId) {
    const p = window.DB && DB.getPacienteByNome(pac);
    if (p && p.id === RENDER._pacienteSelecionadoId) RENDER.cartoesPaciente(p.id);
  }
}

// ── NOVA ANAMNESE ──
function salvarNovaAnamnese() {
  const nome = document.getElementById('na-nome').value.trim();
  const err = document.getElementById('na-erro');
  if (!nome){ err.textContent='Informe o nome do formulário.'; err.style.display='block'; return; }
  err.style.display='none';
  closeModal('modal-anamnese');
  showToast('Formulário "' + nome + '" criado com sucesso!');
  document.getElementById('na-nome').value='';
}

// ── RENOVAR CARTÃO ──
function abrirRenovar() { openModal('modal-renovar'); }
function confirmarRenovar() {
  const envWpp = document.getElementById('ren-wpp').value === 'sim';
  closeModal('modal-renovar');
  showToast('Cartão renovado!' + (envWpp ? ' Link enviado por WhatsApp.' : ''));
}

// ── ANEXAR DOCUMENTO ──
function docFileSelected(input) {
  if (input.files && input.files[0]) {
    const name = input.files[0].name;
    document.getElementById('doc-file-name').textContent = name;
    document.getElementById('doc-file-info').style.display = 'flex';
    if (!document.getElementById('doc-nome').value) {
      document.getElementById('doc-nome').value = name.replace(/\.[^.]+$/, '');
    }
  }
}
function salvarDocumento() {
  const nome = document.getElementById('doc-nome').value.trim();
  const tipo = document.getElementById('doc-tipo').value;
  if (!nome) { showToast('Informe o nome do documento.', 'danger'); return; }
  // Adicionar na lista de documentos
  const docList = document.querySelector('#pron-docs .col, #pron-docs > div:last-child') ||
                  document.querySelector('#pron-docs');
  if (docList) {
    const existing = docList.querySelectorAll('[style*="display:flex;align-items:center;gap:10px;padding:10px"]');
    const cont = existing.length ? existing[0].parentElement : docList;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--warm);border-radius:8px;border:1px solid var(--border);margin-bottom:6px';
    const today = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
    div.innerHTML = '<i class="ti ti-file-text" style="color:var(--teal);font-size:18px"></i><div style="flex:1"><div style="font-size:13px;font-weight:500;color:var(--text)">' + nome + '.pdf</div><div style="font-size:11px;color:var(--text3)">' + tipo + ' · Adicionado em ' + today + '</div></div><i class="ti ti-download" style="color:var(--text3);cursor:pointer;font-size:16px"></i>';
    cont.insertBefore(div, cont.firstChild);
  }
  // Salvar no localStorage do paciente
  if (window.RENDER && RENDER._pacienteSelecionadoId && window.DB) {
    const key = 'nxp_docs_' + RENDER._pacienteSelecionadoId;
    const docs = DB.load(key) || [];
    docs.unshift({ nome, tipo, data: new Date().toISOString().slice(0,10) });
    DB.save(key, docs);
  }
  closeModal('modal-doc');
  showToast('Documento "' + nome + '" anexado ao prontuário!');
  document.getElementById('doc-nome').value='';
  const fi = document.getElementById('doc-file-info');
  if (fi) fi.style.display='none';
  // Atualizar aba documentos
  if (window.RENDER && RENDER._pacienteSelecionadoId && RENDER.documentosPaciente) {
    RENDER.documentosPaciente(RENDER._pacienteSelecionadoId);
  }
}

// ── AGENDAMENTO (modal) ──
function abrirModalAgend() { openModal('modal-agend'); }
function salvarAgendamento() {
  const pac = document.getElementById('ag-pac').value;
  const data = document.getElementById('ag-data').value;
  const hora = document.getElementById('ag-hora').value;
  const err = document.getElementById('ag-erro');
  if (!pac)  { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
  if (!data) { err.textContent='Selecione a data.'; err.style.display='block'; return; }
  if (!hora) { err.textContent='Informe o horário.'; err.style.display='block'; return; }
  err.style.display='none';
  const tipo = document.getElementById('ag-tipo').value;
  const mod  = document.getElementById('ag-mod').value;
  const dt   = new Date(data+'T'+hora).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  // Adicionar na lista do dashboard
  const sessLists = document.querySelectorAll('.session-item');
  closeModal('modal-agend');
  showToast('Sessão de ' + pac + ' agendada para ' + dt + ' às ' + hora + '!');
}
