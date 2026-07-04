// ── ANAMNESE ──
function sendAna() {
  const m = document.getElementById('ana-send-msg');
  m.style.display = 'flex';
  setTimeout(() => m.style.display = 'none', 3000);
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
  closeModal('modal-doc');
  showToast('Documento "' + nome + '" anexado ao prontuário!');
  document.getElementById('doc-nome').value='';
  document.getElementById('doc-file-info').style.display='none';
}
