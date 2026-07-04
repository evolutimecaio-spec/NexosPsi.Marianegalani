// smartnotes.js — Smart Notes + LUMA

var recOn = false;
var recSeconds = 0;
var recInterval = null;
var transcriptInterval = null;

var transcriptChunks = [
  '<span class="ts">[00:00]</span> Paciente inicia relatando a semana. Descreve dois episódios de ansiedade — um em reunião de trabalho, outro antes de dormir.',
  '<br><br><span class="ts">[04:23]</span> Identificamos pensamento automático: <em>"Vou falhar na apresentação e serei demitida."</em> Iniciamos questionamento socrático.',
  '<br><br><span class="ts">[09:47]</span> Paciente reconhece que nunca recebeu feedback negativo formal. Reestruturação: <em>"Posso cometer erros e continuar sendo competente."</em>',
  '<br><br><span class="ts">[14:30]</span> Planejamento comportamental para a semana. Combinamos registro diário de pensamentos automáticos.',
  '<br><br><span class="ts" style="color:var(--teal);font-style:italic">● Transcrevendo...</span>'
];
var tChunkIdx = 0;

function snPacienteChanged() {
  var sel = document.getElementById('sn-pac');
  var nome = sel ? sel.value : '';
  var infoCard = document.getElementById('sn-pac-info');
  if (!infoCard) return;

  if (!nome) {
    infoCard.style.display = 'none';
    document.getElementById('sn-historico').innerHTML = '<span style="color:var(--text3)">Selecione um paciente para ver o histórico.</span>';
    return;
  }

  var p = window.DB ? DB.getPacienteByNome(nome) : null;
  if (!p) return;

  infoCard.style.display = 'block';
  var avEl = document.getElementById('sn-av');
  var nomeEl = document.getElementById('sn-nome');
  var metaEl = document.getElementById('sn-meta');
  var cidEl = document.getElementById('sn-cid');
  if (avEl) avEl.textContent = p.av || p.nome.slice(0,2).toUpperCase();
  if (nomeEl) nomeEl.textContent = p.nome;

  // Próxima sessão
  var proxSessao = '';
  if (window.DB && DB.getAgendamentos) {
    var hoje = DB.today();
    var proxAg = DB.getAgendamentos()
      .filter(function(a) { return a.pacienteId === p.id && a.data >= hoje && a.status !== 'cancelado'; })
      .sort(function(a,b) { return a.data.localeCompare(b.data); })[0];
    if (proxAg) proxSessao = 'Próxima sessão: ' + DB.fmtData(proxAg.data) + ' às ' + proxAg.hora;
    else proxSessao = 'Sem sessão agendada';
  }
  if (metaEl) metaEl.textContent = proxSessao;
  if (cidEl && p.cid) cidEl.value = p.cid;

  // Histórico de evoluções com LUMA
  var hist = document.getElementById('sn-historico');
  if (hist && window.DB && DB.getEvolucoes) {
    var evs = DB.getEvolucoes(p.id).filter(function(e) { return e.luma; }).slice(0, 5);
    if (!evs.length) {
      hist.innerHTML = '<span style="color:var(--text3)">Nenhuma sessão LUMA registrada para ' + p.nome.split(' ')[0] + '.</span>';
    } else {
      hist.innerHTML = evs.map(function(e) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">'
          + '<span style="font-size:12px;color:var(--text2)">' + DB.fmtData(e.data) + ' — ' + (e.texto||'').slice(0,40) + '...</span>'
          + '<span class="badge b-teal" style="font-size:10px">LUMA</span>'
          + '</div>';
      }).join('');
    }
  }
}

function toggleRec() {
  var pacSel = document.getElementById('sn-pac');
  if (!recOn && pacSel && !pacSel.value) {
    if (typeof showToast === 'function') showToast('Selecione o paciente antes de gravar.', 'danger');
    pacSel.focus();
    return;
  }
  if (!recOn) startRec(); else stopRec();
}

function startRec() {
  recOn = true;
  recSeconds = 0;
  tChunkIdx = 0;
  var pac = document.getElementById('sn-pac').value || 'Paciente';
  document.getElementById('rec-btn').className = 'rec-big-btn recording';
  document.getElementById('rec-icon').className = 'ti ti-player-stop-filled';
  document.getElementById('rec-label').innerHTML = 'Gravando · ' + pac + '<br><span style="font-size:11px">Clique no botão vermelho para encerrar</span>';
  document.getElementById('live-pulse').style.display = 'flex';
  var tt = document.getElementById('transcript-text');
  tt.style.cssText = 'color:var(--text2);font-style:normal';
  tt.innerHTML = '';
  document.getElementById('luma-box').style.display = 'none';
  document.getElementById('luma-saved').style.display = 'none';
  document.querySelectorAll('.wv').forEach(function(el) {
    el.classList.add('active');
    el.style.setProperty('--h', (12 + Math.random()*20) + 'px');
    el.style.setProperty('--d', (.35 + Math.random()*.5) + 's');
  });
  recInterval = setInterval(function() {
    recSeconds++;
    document.getElementById('rec-timer').textContent = fmtTime(recSeconds);
  }, 1000);
  transcriptInterval = setInterval(function() {
    if (tChunkIdx < transcriptChunks.length) {
      document.getElementById('transcript-text').innerHTML += transcriptChunks[tChunkIdx++];
    }
  }, 3500);
}

function stopRec() {
  recOn = false;
  clearInterval(recInterval);
  clearInterval(transcriptInterval);
  document.getElementById('rec-btn').className = 'rec-big-btn idle';
  document.getElementById('rec-icon').className = 'ti ti-microphone';
  document.getElementById('rec-label').innerHTML = 'Gravação encerrada · ' + fmtTime(recSeconds) + '<br><span style="font-size:11px">Evolução gerada pela LUMA abaixo ↓</span>';
  document.getElementById('live-pulse').style.display = 'none';
  document.querySelectorAll('.wv').forEach(function(el) { el.classList.remove('active'); });

  var cfg = document.getElementById('sn-cfg-auto');
  if (!cfg || cfg.checked) {
    gerarEvLuma();
  }
}

function gerarEvLuma() {
  var luma = document.getElementById('luma-box');
  if (!luma) return;
  luma.style.display = 'block';
  var transcript = document.getElementById('transcript-text').innerText || document.getElementById('transcript-text').textContent || '';
  // Template LUMA estruturado
  var modelo = document.getElementById('sn-cfg-modelo');
  var texto = '';
  if (!modelo || modelo.checked) {
    texto = '<strong>Queixa principal:</strong> Episódios de ansiedade relatados na semana, com impacto no contexto laboral e no sono.'
      + '<br><br><strong>Intervenção:</strong> Identificação e questionamento socrático de pensamento automático disfuncional. Reestruturação cognitiva com boa adesão da paciente.'
      + '<br><br><strong>Resposta à sessão:</strong> Positiva — alívio emocional observado ao longo da sessão. Reconhecimento de distorção cognitiva.'
      + '<br><br><strong>Plano:</strong> Registro diário de pensamentos automáticos entre sessões. Retorno em 1 semana.';
  } else {
    texto = transcript || 'Sessão realizada. Transcrição acima para referência.';
  }
  document.getElementById('luma-draft').innerHTML = texto;
  document.getElementById('luma-saved').style.display = 'none';
}

function saveLumaDraft() {
  var pac = document.getElementById('sn-pac') ? document.getElementById('sn-pac').value : '';
  if (!pac) {
    if (typeof showToast === 'function') showToast('Selecione o paciente antes de salvar.', 'danger');
    return;
  }
  var p = window.DB ? DB.getPacienteByNome(pac) : null;
  if (!p) { if (typeof showToast === 'function') showToast('Paciente não encontrado.', 'danger'); return; }

  var draft = document.getElementById('luma-draft');
  var texto = draft ? (draft.innerText || draft.textContent || '') : '';
  var inclTranscript = document.getElementById('sn-cfg-transcript');
  if (inclTranscript && inclTranscript.checked) {
    var tt = document.getElementById('transcript-text');
    texto += '\n\nTranscrição: ' + (tt ? (tt.innerText || tt.textContent || '') : '');
  }

  if (window.DB && DB.addEvolucao) {
    DB.addEvolucao(p.id, { texto: texto, luma: true, sessoes: recSeconds });
    if (typeof showToast === 'function') showToast('Evolução salva no prontuário de ' + p.nome.split(' ')[0] + '!');
    document.getElementById('luma-saved').style.display = 'block';
    snPacienteChanged(); // atualizar histórico
  }
}

function fmtTime(s) {
  var h = String(Math.floor(s/3600)).padStart(2,'0');
  var m = String(Math.floor((s%3600)/60)).padStart(2,'0');
  var sec = String(s%60).padStart(2,'0');
  return h+':'+m+':'+sec;
}

function goSmartNotes() {
  if (window.NAV) NAV.go('smartnotes');
}

// Popular sn-pac quando a view é ativada
function snPopularSelect() {
  var sel = document.getElementById('sn-pac');
  if (!sel || !window.DB) return;
  var pacs = DB.getPacientesList();
  sel.innerHTML = '<option value="">Selecione o paciente...</option>'
    + pacs.map(function(p) {
        var loc = DB.getLocal(p.local);
        return '<option value="' + p.nome + '">' + p.nome + (loc ? ' ['+loc.nome+']' : '') + '</option>';
      }).join('');
  // Também popular cart-filtro-pac e ana-pac-envio
  var cartFiltro = document.getElementById('cart-filtro-pac');
  if (cartFiltro) {
    cartFiltro.innerHTML = '<option value="">Todos os pacientes</option>'
      + pacs.map(function(p) { return '<option value="'+p.id+'">'+p.nome+'</option>'; }).join('');
  }
  var anaEnvio = document.getElementById('ana-pac-envio');
  if (anaEnvio) {
    anaEnvio.innerHTML = '<option value="">Selecione o paciente...</option>'
      + pacs.map(function(p) { return '<option value="'+p.id+'">'+p.nome+'</option>'; }).join('');
  }
}
