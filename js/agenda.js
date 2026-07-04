// agenda.js — funções de agenda (compatibilidade)
// Lógica real em render.js + db.js

function openNewAppt() { openModal('modal-agend'); }
function abrirModalAgend() { openModal('modal-agend'); }

// agTab: alternar entre avulso e recorrente no modal
let _agModo = 'avulso';
function agTab(modo) {
  _agModo = modo;
  window._agModo = modo;
  const isRec = modo === 'recorrente';
  const ba = document.getElementById('ag-bloco-avulso');
  const br = document.getElementById('ag-bloco-recorrente');
  if (ba) ba.style.display = isRec ? 'none' : '';
  if (br) br.style.display = isRec ? '' : 'none';
  const ta = document.getElementById('ag-tab-avulso');
  const tr = document.getElementById('ag-tab-recorrente');
  if (ta) { ta.className = isRec ? 'btn btn-ghost' : 'btn btn-sage'; ta.style.cssText='flex:1;justify-content:center;font-size:13px;border-radius:7px'+(isRec?';background:transparent;border:none':''); }
  if (tr) { tr.className = isRec ? 'btn btn-sage' : 'btn btn-ghost'; tr.style.cssText='flex:1;justify-content:center;font-size:13px;border-radius:7px'+(isRec?'':';background:transparent;border:none'); }
  const btn = document.getElementById('ag-btn-salvar');
  if (btn) btn.innerHTML = isRec ? '<i class="ti ti-calendar-repeat"></i> Criar recorrência' : '<i class="ti ti-check"></i> Confirmar agendamento';
  if (isRec && typeof calcularPreview === 'function') calcularPreview();
}

function calcularPreview() {
  const inicioEl = document.getElementById('rec-inicio');
  const horaEl   = document.getElementById('rec-hora');
  const freqEl   = document.getElementById('rec-freq');
  const durEl    = document.getElementById('rec-duracao');
  const valorEl  = document.getElementById('rec-valor');
  if (!inicioEl || !inicioEl.value) return;
  const inicio = new Date(inicioEl.value + 'T12:00');
  const freq   = parseInt(freqEl?.value || 7);
  const dur    = parseInt(durEl?.value || 8);
  const valor  = parseFloat(valorEl?.value || 180);
  const indefinido = dur === 0;
  const total = indefinido ? 8 : dur;
  const sessoes = [];
  let data = new Date(inicio);
  for (let i = 0; i < total; i++) {
    sessoes.push(new Date(data));
    data.setDate(data.getDate() + freq);
  }
  const listEl = document.getElementById('rec-preview-list');
  const totEl  = document.getElementById('rec-preview-total');
  if (!listEl) return;
  listEl.innerHTML = sessoes.map((s,i) => {
    const dt = s.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
    const hr = horaEl?.value || '10:00';
    return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)">
      <span><strong>Sessão ${i+1}</strong> · ${dt} às ${hr}</span>
      <span style="color:var(--teal);font-weight:500">R$ ${valor.toFixed(2).replace('.',',')}</span>
    </div>`;
  }).join('') + (indefinido ? '<div style="text-align:center;color:var(--text3);font-size:11px;padding:6px 0">... continua até cancelamento</div>' : '');
  const totalValor = indefinido ? total * valor : total * valor;
  if (totEl) totEl.innerHTML = `<i class="ti ti-calculator"></i> ${total} sessões${indefinido?' (iniciais)':''} · Total: R$ ${totalValor.toFixed(2).replace('.',',')}`;
}
