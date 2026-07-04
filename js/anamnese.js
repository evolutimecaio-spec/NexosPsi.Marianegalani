// anamnese.js — Formulários de anamnese

var ANA_MODELOS = {
  adulto: [
    { nome: 'Nome completo', tipo: 'Texto curto', obrig: true },
    { nome: 'Data de nascimento', tipo: 'Data', obrig: true },
    { nome: 'Gênero / identidade', tipo: 'Seleção única', obrig: false },
    { nome: 'Queixa principal / motivo de busca', tipo: 'Texto longo', obrig: true },
    { nome: 'Há quanto tempo sente isso?', tipo: 'Texto curto', obrig: false },
    { nome: 'Já fez acompanhamento psicológico antes?', tipo: 'Sim/Não', obrig: true },
    { nome: 'Usa medicação psiquiátrica?', tipo: 'Sim/Não + campo aberto', obrig: true },
    { nome: 'Histórico de saúde relevante', tipo: 'Texto longo', obrig: false },
    { nome: 'Situação familiar atual', tipo: 'Texto longo', obrig: false },
    { nome: 'Trabalho / ocupação', tipo: 'Texto curto', obrig: false },
    { nome: 'Expectativa com a terapia', tipo: 'Texto longo', obrig: false },
    { nome: 'Como soube sobre meu trabalho?', tipo: 'Seleção única', obrig: false }
  ],
  infantil: [
    { nome: 'Nome da criança', tipo: 'Texto curto', obrig: true },
    { nome: 'Data de nascimento', tipo: 'Data', obrig: true },
    { nome: 'Nome do responsável', tipo: 'Texto curto', obrig: true },
    { nome: 'Diagnóstico ou suspeita (se houver)', tipo: 'Texto curto', obrig: false },
    { nome: 'Queixa principal dos responsáveis', tipo: 'Texto longo', obrig: true },
    { nome: 'Histórico escolar', tipo: 'Texto longo', obrig: false },
    { nome: 'Medicação em uso', tipo: 'Sim/Não + campo aberto', obrig: true },
    { nome: 'Histórico de desenvolvimento', tipo: 'Texto longo', obrig: false },
    { nome: 'Dinâmica familiar', tipo: 'Texto longo', obrig: false },
    { nome: 'Interesses e habilidades da criança', tipo: 'Texto longo', obrig: false }
  ],
  supervisao: [
    { nome: 'Nome da supervisanda', tipo: 'Texto curto', obrig: true },
    { nome: 'CRP', tipo: 'Texto curto', obrig: true },
    { nome: 'Abordagem teórica', tipo: 'Texto curto', obrig: false },
    { nome: 'Caso a ser supervisionado', tipo: 'Texto longo', obrig: true },
    { nome: 'Hipótese diagnóstica', tipo: 'Texto curto', obrig: false },
    { nome: 'Dificuldade ou dúvida específica', tipo: 'Texto longo', obrig: true },
    { nome: 'Objetivo da supervisão', tipo: 'Texto longo', obrig: false }
  ]
};

function anaSelecionarModelo() {
  var val = document.getElementById('ana-modelo-sel').value;
  anaRenderCampos(val);
  var titulos = { adulto: 'Anamnese Inicial — Adultos', infantil: 'Anamnese Infantil / Neurodivergente', supervisao: 'Ficha de Supervisão' };
  var el = document.getElementById('ana-preview-titulo');
  if (el) el.textContent = titulos[val] || 'Formulário';
}

function anaRenderCampos(modelo) {
  var campos = ANA_MODELOS[modelo] || ANA_MODELOS.adulto;
  var lista = document.getElementById('ana-campos-list');
  if (!lista) return;
  lista.innerHTML = campos.map(function(c) {
    return '<div class="field-row">'
      + '<i class="ti ti-grip-vertical fr-icon"></i>'
      + '<div class="fr-info">'
      + '<div class="fr-name">' + c.nome + (c.obrig ? ' <span style="color:var(--danger)">*</span>' : '') + '</div>'
      + '<div class="fr-type">' + c.tipo + (c.obrig ? ' · Obrigatório' : ' · Opcional') + '</div>'
      + '</div>'
      + '<div class="fr-actions">'
      + '<button onclick="showToast(\'Campo em edição...\',\'info\')"><i class="ti ti-edit"></i></button>'
      + '</div>'
      + '</div>';
  }).join('')
  + '<button style="width:100%;border:1px dashed var(--border);border-radius:8px;padding:10px;background:none;color:var(--text3);cursor:pointer;font-size:13px;margin-top:8px;font-family:var(--font)" onclick="showToast(\'Adição de campos personalizados em breve!\',\'info\')"><i class="ti ti-plus"></i> Adicionar campo personalizado</button>';
}

function anaEnviar() {
  var sel = document.getElementById('ana-pac-envio');
  if (!sel || !sel.value) {
    if (typeof showToast === 'function') showToast('Selecione o paciente antes de enviar.', 'danger');
    return;
  }
  anaEnviarPaciente();
}

function anaEnviarPaciente() {
  var sel = document.getElementById('ana-pac-envio');
  if (!sel || !sel.value) {
    if (typeof showToast === 'function') showToast('Selecione o paciente para enviar.', 'danger');
    sel && sel.focus();
    return;
  }
  var p = window.DB ? DB.getPaciente(sel.value) : null;
  if (!p) return;

  var modelo = document.getElementById('ana-modelo-sel') ? document.getElementById('ana-modelo-sel').value : 'adulto';
  var titulos = { adulto: 'Anamnese Inicial', infantil: 'Anamnese Infantil', supervisao: 'Supervisão Clínica' };
  var titulo = titulos[modelo] || 'Anamnese';

  var cfg = window._NEXOPSI_CONFIG || {};
  var psiNome = (cfg.psicologa || {}).nome || 'Mariane Galani';
  var fone = p.fone || '';

  var msg = 'Olá, ' + p.nome.split(' ')[0] + '! 😊\n\n'
    + 'Aqui é ' + psiNome + '. Para preparar o nosso primeiro encontro, gostaria que você preenchesse a ' + titulo + '.\n\n'
    + 'Por favor, responda com calma antes da nossa sessão. Suas respostas me ajudam muito a personalizar o acompanhamento! 🌿\n\n'
    + 'Qualquer dúvida, é só me chamar.';

  var url = fone
    ? 'https://wa.me/' + fone + '?text=' + encodeURIComponent(msg)
    : 'https://wa.me/?text=' + encodeURIComponent(msg);

  window.open(url, '_blank');

  // Salvar envio no DB
  if (window.DB) {
    var key = 'nxp_anamneses';
    var anas = DB.load(key) || [];
    anas.push({ pacienteId: p.id, modelo: modelo, data: DB.today(), status: 'enviado' });
    DB.save(key, anas);
  }

  // Atualizar tabela de status
  var tbody = document.getElementById('ana-status-table');
  if (tbody) {
    var tr = document.createElement('tr');
    var hoje = new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'short'});
    tr.innerHTML = '<td>' + p.nome.split(' ')[0] + '</td><td>' + hoje + '</td><td><span class="status-pill sp-sent"><i class="ti ti-clock" style="font-size:11px"></i> Enviado</span></td>';
    tbody.insertBefore(tr, tbody.firstChild);
  }

  var msg2 = document.getElementById('ana-send-msg');
  if (msg2) { msg2.style.display = 'flex'; setTimeout(function(){ msg2.style.display='none'; }, 3000); }
  if (typeof showToast === 'function') showToast('Anamnese enviada para ' + p.nome.split(' ')[0] + ' por WhatsApp!');
}

function sendAna() { anaEnviarPaciente(); }

// Inicializar ao entrar na view
function anaInit() {
  anaRenderCampos('adulto');
}
