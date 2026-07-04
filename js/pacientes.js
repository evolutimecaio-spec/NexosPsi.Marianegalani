// ── BUSCA DE PACIENTES ──
function filterPatients() {
  const q = document.getElementById('pac-search').value.toLowerCase();
  const items = document.querySelectorAll('#patient-list .patient-mini');
  let visible = 0;
  items.forEach(item => {
    const name = item.querySelector('.pm-name').textContent.toLowerCase();
    const show = name.includes(q);
    item.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('pac-count').textContent = visible + ' paciente' + (visible !== 1 ? 's' : '') + ' encontrado' + (visible !== 1 ? 's' : '');
}


// ── SELECIONAR PACIENTE ──
// ── BASE DE PACIENTES — fonte única de verdade ──
// valorSessao: valor individual por paciente (cada um tem o seu)
// Carregado do localStorage ao iniciar, persistido ao salvar/editar
let patData = loadPatData();

function loadPatData() {
  try {
    const saved = localStorage.getItem('nexopsi_pacientes');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  // Dados padrão (demo)
  return {
    'Ana Silva':    {av:'AS', meta:'34 anos · F', cpf:'123.456.789-00', fone:'5511999990001', sessoes:'18 sessões', inicio:'Mar 2024', devedor:'R$ 360,00', semDevedor:false, valorSessao:180, cid:'F41.1', vencDia:28, modalidade:'Presencial'},
    'Carla Nunes':  {av:'CN', meta:'28 anos · F', cpf:'234.567.890-11', fone:'5511999990002', sessoes:'12 sessões', inicio:'Jan 2025', devedor:'—',        semDevedor:true,  valorSessao:200, cid:'',     vencDia:5,  modalidade:'Presencial'},
    'Marcos Lima':  {av:'ML', meta:'41 anos · M', cpf:'345.678.901-22', fone:'5511999990003', sessoes:'28 sessões', inicio:'Ago 2023', devedor:'—',        semDevedor:true,  valorSessao:160, cid:'F32.0', vencDia:10, modalidade:'Online'},
    'Paula Mendes': {av:'PM', meta:'26 anos · F', cpf:'456.789.012-33', fone:'5511999990004', sessoes:'8 sessões',  inicio:'Fev 2025', devedor:'—',        semDevedor:true,  valorSessao:220, cid:'',     vencDia:15, modalidade:'Presencial'},
    'Rafael Costa': {av:'RC', meta:'33 anos · M', cpf:'567.890.123-44', fone:'5511999990005', sessoes:'15 sessões', inicio:'Mai 2024', devedor:'—',        semDevedor:true,  valorSessao:180, cid:'F40.1', vencDia:20, modalidade:'Online'},
    'Thiago Braga': {av:'TB', meta:'29 anos · M', cpf:'678.901.234-55', fone:'5511999990006', sessoes:'3 sessões',  inicio:'Jun 2025', devedor:'R$ 150,00',semDevedor:false, valorSessao:150, cid:'',     vencDia:2,  modalidade:'Online'},
    'João Pereira': {av:'JP', meta:'45 anos · M', cpf:'789.012.345-66', fone:'5511999990007', sessoes:'6 sessões',  inicio:'Abr 2025', devedor:'R$ 150,00',semDevedor:false, valorSessao:150, cid:'',     vencDia:15, modalidade:'Presencial'},
  };
}

function savePatData() {
  try { localStorage.setItem('nexopsi_pacientes', JSON.stringify(patData)); } catch(e) {}
}

function getValorPaciente(nome) {
  const p = patData[nome];
  return p ? p.valorSessao : (window._NEXOPSI_CONFIG?.financeiro?.valorSessaoPadrao || 180);
}
function selectPatient(el, name) {
  document.querySelectorAll('.patient-mini').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const d = patData[name];
  if (!d) return;
  document.getElementById('ph-av').textContent = d.av;
  document.getElementById('ph-name').textContent = name;
  document.getElementById('ph-meta').textContent = d.meta;
  document.getElementById('ph-sessoes').textContent = d.sessoes;
  document.getElementById('ph-inicio').textContent = d.inicio;
  document.getElementById('ph-devedor').textContent = d.devedor;
  const df = document.getElementById('ph-devedor-field');
  df.className = 'ph-field' + (d.semDevedor ? '' : ' warn-field');
}

