// ── SMART NOTES / GRAVADOR ──
let recOn = false;
let recSeconds = 0;
let recInterval = null;
let transcriptInterval = null;
const transcriptChunks = [
  '<span class="ts">[00:00]</span> Paciente chega relatando uma semana difícil, com dois episódios de crise de ansiedade — um deles no trabalho durante reunião com o gestor.',
  '<br><br><span class="ts">[04:23]</span> Ao explorar o contexto, identifica pensamento automático: <em>"Vou ser demitida se errar nessa apresentação."</em> Iniciamos questionamento socrático.',
  '<br><br><span class="ts">[09:47]</span> Paciente percebe que nunca recebeu feedback negativo. Reformula: <em>"Posso cometer erros e ainda assim ser competente."</em> Alívio emocional visível.',
  '<br><br><span class="ts">[14:30]</span> Trabalhamos planejamento comportamental para a próxima semana. Combinamos registro de pensamentos automáticos diariamente.',
  '<br><br><span class="ts" style="color:var(--sage);font-style:italic">● Transcrevendo...'
];
let tChunkIdx = 0;

function toggleRec() {
  if (!recOn) startRec(); else stopRec();
}
function startRec() {
  recOn = true;
  recSeconds = 0;
  tChunkIdx = 0;
  document.getElementById('rec-btn').className = 'rec-big-btn recording';
  document.getElementById('rec-icon').className = 'ti ti-player-stop-filled';
  document.getElementById('rec-label').innerHTML = 'Gravando · Ana Silva · Sessão #19<br><span style="font-size:11px">Clique para encerrar e gerar evolução</span>';
  document.getElementById('live-pulse').style.display = 'flex';
  document.getElementById('transcript-text').style.cssText = 'color:var(--text2);font-style:normal';
  document.getElementById('transcript-text').innerHTML = '';
  document.getElementById('luma-box').style.display = 'none';
  document.getElementById('luma-saved').style.display = 'none';
  document.querySelectorAll('.wv').forEach((el,i) => {
    el.classList.add('active');
    el.style.setProperty('--h', (12 + Math.random()*20) + 'px');
    el.style.setProperty('--d', (.35 + Math.random()*.5) + 's');
  });
  recInterval = setInterval(() => {
    recSeconds++;
    document.getElementById('rec-timer').textContent = fmtTime(recSeconds);
  }, 1000);
  transcriptInterval = setInterval(() => {
    if (tChunkIdx < transcriptChunks.length) {
      document.getElementById('transcript-text').innerHTML += transcriptChunks[tChunkIdx++];
    }
  }, 4000);
}
function stopRec() {
  recOn = false;
  clearInterval(recInterval);
  clearInterval(transcriptInterval);
  document.getElementById('rec-btn').className = 'rec-big-btn idle';
  document.getElementById('rec-icon').className = 'ti ti-microphone';
  document.getElementById('rec-label').innerHTML = 'Gravação encerrada · ' + fmtTime(recSeconds) + '<br><span style="font-size:11px">Evolução gerada pela LUMA abaixo ↓</span>';
  document.getElementById('live-pulse').style.display = 'none';
  document.querySelectorAll('.wv').forEach(el => el.classList.remove('active'));
  const luma = document.getElementById('luma-box');
  luma.style.display = 'block';
  document.getElementById('luma-draft').innerHTML = '<strong>Queixa principal:</strong> Dois episódios de ansiedade na semana, destaque para crise em contexto laboral durante reunião com chefia.<br><br><strong>Intervenção:</strong> Identificação de pensamento automático disfuncional (medo de demissão). Questionamento socrático com boa adesão. Paciente reformulou a crença com auxílio terapêutico.<br><br><strong>Resposta à sessão:</strong> Positiva — alívio emocional observado ao longo da reestruturação.<br><br><strong>Plano:</strong> Registro de pensamentos automáticos entre sessões; retorno em 1 semana.';
}
function fmtTime(s) {
  const h = String(Math.floor(s/3600)).padStart(2,'0');
  const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return h+':'+m+':'+sec;
}
function saveLumaDraft() {
  document.getElementById('luma-saved').style.display = 'block';
}


// ── SMART NOTES atalho do prontuário ──
function goSmartNotes() {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('v-smartnotes').classList.add('active');
  document.querySelector('.nav-item[data-view="smartnotes"]').classList.add('active');
  document.getElementById('tb-title').textContent = titles['smartnotes'];
}
