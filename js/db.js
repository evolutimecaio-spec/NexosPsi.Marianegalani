// ═══════════════════════════════════════════════════════════
// db.js — NexxoPsi · Banco de dados local unificado
// Fonte única de verdade para todo o sistema.
// Tudo lê daqui. Tudo salva aqui. Nada mais hardcoded.
// ═══════════════════════════════════════════════════════════

const DB = {

  // ── Chaves do localStorage ──────────────────────────────
  KEYS: {
    PACIENTES:    'nxp_pacientes',
    AGENDAMENTOS: 'nxp_agendamentos',
    EVOLUCOES:    'nxp_evolucoes',
    FATURAS:      'nxp_faturas',
    CARTOES:      'nxp_cartoes',
    ANAMNESES:    'nxp_anamneses',
    DOCUMENTOS:   'nxp_documentos',
  },


  // ════════════════════════════════════════════════════════
  // LOCAIS DE ATENDIMENTO
  // ════════════════════════════════════════════════════════
  LOCAIS: {
    'unimed':      { id:'unimed',      nome:'Unimed',                cor:'#1565C0', icon:'ti-building-hospital', endereco:'Unimed Jundiaí' },
    'aquarela':    { id:'aquarela',    nome:'Casa Aquarela',          cor:'#6A1B9A', icon:'ti-home-heart',        endereco:'Casa Aquarela' },
    'anhangabau':  { id:'anhangabau',  nome:'Clínica Anhangabaú',     cor:'#2E7D32', icon:'ti-building-community',endereco:'Clínica do Anhangabaú' },
  },

  getLocais() { return Object.values(this.LOCAIS); },
  getLocal(id) { return this.LOCAIS[id] || null; },

  getPacientesPorLocal(localId) {
    return this.getPacientesList().filter(p => p.local === localId);
  },

  // ── LOAD / SAVE genérico ────────────────────────────────
  load(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
  },
  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch(e) { return false; }
  },

  // ════════════════════════════════════════════════════════
  // PACIENTES
  // ════════════════════════════════════════════════════════
  _pacientes: null,

  getPacientes() {
    if (this._pacientes) return this._pacientes;
    const saved = this.load(this.KEYS.PACIENTES);
    if (saved) { this._pacientes = saved; return saved; }
    // Dados demo
    this._pacientes = {
      'ana-silva':    { id:'ana-silva',    nome:'Ana Silva',    av:'AS', nascimento:'1991-03-15', sexo:'F', cpf:'123.456.789-00', fone:'5511999990001', email:'ana@email.com', endereco:'', cid:'F41.1', modalidade:'Presencial', valorSessao:180, vencDia:3,  inicio:'2024-03', sessoes:18, devedorTotal:360, ativo:true, local:'aquarela',   perfil:['adulto'],          obs:'Ansiedade generalizada. Paciente comprometida.' },
      'carla-nunes':  { id:'carla-nunes',  nome:'Carla Nunes',  av:'CN', nascimento:'1997-07-22', sexo:'F', cpf:'234.567.890-11', fone:'5511999990002', email:'', endereco:'', cid:'',     modalidade:'Presencial', valorSessao:200, vencDia:6,  inicio:'2025-01', sessoes:12, devedorTotal:0,   ativo:true, local:'unimed',     perfil:['adulto','mulher'], obs:'' },
      'marcos-lima':  { id:'marcos-lima',  nome:'Marcos Lima',  av:'ML', nascimento:'1984-11-08', sexo:'M', cpf:'345.678.901-22', fone:'5511999990003', email:'', endereco:'', cid:'F32.0', modalidade:'Online',     valorSessao:160, vencDia:10, inicio:'2023-08', sessoes:28, devedorTotal:0,   ativo:true, local:'unimed',     perfil:['adulto'],          obs:'' },
      'paula-mendes': { id:'paula-mendes', nome:'Paula Mendes', av:'PM', nascimento:'1999-07-03', sexo:'F', cpf:'456.789.012-33', fone:'5511999990004', email:'', endereco:'', cid:'',     modalidade:'Presencial', valorSessao:220, vencDia:15, inicio:'2025-02', sessoes:8,  devedorTotal:0,   ativo:true, local:'anhangabau',  perfil:['adulto','mulher'], obs:'' },
      'rafael-costa': { id:'rafael-costa', nome:'Rafael Costa', av:'RC', nascimento:'1992-05-18', sexo:'M', cpf:'567.890.123-44', fone:'5511999990005', email:'', endereco:'', cid:'F40.1', modalidade:'Online',     valorSessao:180, vencDia:20, inicio:'2024-05', sessoes:15, devedorTotal:0,   ativo:true, local:'anhangabau',  perfil:['adulto'],          obs:'' },
      'thiago-braga': { id:'thiago-braga', nome:'Thiago Braga', av:'TB', nascimento:'1996-02-14', sexo:'M', cpf:'678.901.234-55', fone:'5511999990006', email:'', endereco:'', cid:'',     modalidade:'Online',     valorSessao:150, vencDia:2,  inicio:'2025-06', sessoes:3,  devedorTotal:150, ativo:true, local:'aquarela',   perfil:['adulto'],          obs:'' },
      'joao-pereira': { id:'joao-pereira', nome:'João Pereira', av:'JP', nascimento:'1980-09-30', sexo:'M', cpf:'789.012.345-66', fone:'5511999990007', email:'', endereco:'', cid:'',     modalidade:'Presencial', valorSessao:150, vencDia:15, inicio:'2025-04', sessoes:6,  devedorTotal:150, ativo:true, local:'aquarela',   perfil:['adulto'],          obs:'' },
      'sofia-lima':   { id:'sofia-lima',   nome:'Sofia Lima',   av:'SL', nascimento:'2017-04-12', sexo:'F', cpf:'',               fone:'5511999990008', email:'', endereco:'', cid:'F84.0', modalidade:'Presencial', valorSessao:190, vencDia:10, inicio:'2025-03', sessoes:10, devedorTotal:0,   ativo:true, local:'aquarela',   perfil:['crianca','neurodiverge'], obs:'TEA nível 1. Trabalho com ABA e DIR Floortime. Vem com a mãe.' },
      'pedro-mendes': { id:'pedro-mendes', nome:'Pedro Mendes', av:'PD', nascimento:'2018-08-20', sexo:'M', cpf:'',               fone:'5511999990009', email:'', endereco:'', cid:'F90.0', modalidade:'Presencial', valorSessao:190, vencDia:15, inicio:'2025-05', sessoes:6,  devedorTotal:0,   ativo:true, local:'unimed',     perfil:['crianca','neurodiverge'], obs:'TDAH combinado. Sessões 40min. Pais participam nos últimos 10min.' },
      'lucia-psic':   { id:'lucia-psic',   nome:'Lúcia Ferreira (supervisão)', av:'LF', nascimento:'1990-11-05', sexo:'F', cpf:'234.123.456-78', fone:'5511999990010', email:'lucia@psico.com', endereco:'', cid:'', modalidade:'Online', valorSessao:250, vencDia:25, inicio:'2025-02', sessoes:14, devedorTotal:0, ativo:true, local:'anhangabau', perfil:['supervisao'], obs:'Supervisão clínica quinzenal. Psicóloga em formação.' },
    };
    this.save(this.KEYS.PACIENTES, this._pacientes);
    return this._pacientes;
  },

  savePacientes() { this.save(this.KEYS.PACIENTES, this._pacientes); },

  getPacientesList() {
    return Object.values(this.getPacientes()).filter(p => p.ativo);
  },

  getPaciente(id) { return this.getPacientes()[id] || null; },

  getPacienteByNome(nome) {
    return Object.values(this.getPacientes()).find(p => p.nome === nome) || null;
  },

  addPaciente(dados) {
    const id = dados.nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + Date.now().toString(36);
    const p = { id, ativo:true, sessoes:0, devedorTotal:0, inicio: new Date().toISOString().slice(0,7), ...dados };
    this.getPacientes()[id] = p;
    this.savePacientes();
    return p;
  },

  updatePaciente(id, dados) {
    if (!this._pacientes[id]) return false;
    Object.assign(this._pacientes[id], dados);
    this.savePacientes();
    return true;
  },

  // ════════════════════════════════════════════════════════
  // AGENDAMENTOS
  // ════════════════════════════════════════════════════════
  _agendamentos: null,

  getAgendamentos() {
    if (this._agendamentos) return this._agendamentos;
    const saved = this.load(this.KEYS.AGENDAMENTOS);
    if (saved) { this._agendamentos = saved; return saved; }
    const hoje = new Date();
    const ano = hoje.getFullYear(), mes = hoje.getMonth();
    const fmt = d => d.toISOString().slice(0,10);
    const d = (offDias) => { const x = new Date(hoje); x.setDate(hoje.getDate()+offDias); return fmt(x); };
    this._agendamentos = [
      { id:'ag1',  pacienteId:'ana-silva',    data:d(0),  hora:'10:00', tipo:'Terapia Individual',  modal:'Presencial', status:'confirmado', valorSessao:180, pago:false },
      { id:'ag2',  pacienteId:'rafael-costa', data:d(0),  hora:'09:00', tipo:'Terapia Individual',  modal:'Online',     status:'confirmado', valorSessao:180, pago:true  },
      { id:'ag3',  pacienteId:'paula-mendes', data:d(0),  hora:'08:00', tipo:'Terapia Individual',  modal:'Presencial', status:'confirmado', valorSessao:220, pago:true  },
      { id:'ag4',  pacienteId:'marcos-lima',  data:d(0),  hora:'14:00', tipo:'Terapia Individual',  modal:'Online',     status:'confirmado', valorSessao:160, pago:true  },
      { id:'ag5',  pacienteId:'carla-nunes',  data:d(0),  hora:'15:00', tipo:'Terapia de Casal',    modal:'Presencial', status:'confirmado', valorSessao:200, pago:true  },
      { id:'ag6',  pacienteId:'thiago-braga', data:d(0),  hora:'16:30', tipo:'Terapia Individual',  modal:'Online',     status:'aguardando', valorSessao:150, pago:false },
      { id:'ag7',  pacienteId:'ana-silva',    data:d(-3), hora:'10:00', tipo:'Terapia Individual',  modal:'Presencial', status:'realizado',  valorSessao:180, pago:true  },
      { id:'ag8',  pacienteId:'carla-nunes',  data:d(-3), hora:'15:00', tipo:'Terapia de Casal',    modal:'Presencial', status:'realizado',  valorSessao:200, pago:true  },
      { id:'ag9',  pacienteId:'marcos-lima',  data:d(-3), hora:'14:00', tipo:'Terapia Individual',  modal:'Online',     status:'realizado',  valorSessao:160, pago:true  },
      { id:'ag10', pacienteId:'rafael-costa', data:d(-3), hora:'09:00', tipo:'Terapia Individual',  modal:'Online',     status:'realizado',  valorSessao:180, pago:true  },
      { id:'ag11', pacienteId:'paula-mendes', data:d(1),  hora:'08:00', tipo:'Terapia Individual',  modal:'Presencial', status:'agendado',   valorSessao:220, pago:false },
      { id:'ag12', pacienteId:'ana-silva',    data:d(7),  hora:'10:00', tipo:'Terapia Individual',  modal:'Presencial', status:'agendado',   valorSessao:180, pago:false },
      { id:'ag13', pacienteId:'thiago-braga', data:d(1),  hora:'16:30', tipo:'Terapia Individual',  modal:'Online',     status:'agendado',   valorSessao:150, pago:false },
      { id:'ag14', pacienteId:'marcos-lima',  data:d(1),  hora:'14:00', tipo:'Terapia Individual',  modal:'Online',     status:'agendado',   valorSessao:160, pago:false },
      { id:'ag15', pacienteId:'carla-nunes',  data:d(2),  hora:'15:00', tipo:'Terapia de Casal',    modal:'Presencial', status:'agendado',   valorSessao:200, pago:false },
    ];
    this.save(this.KEYS.AGENDAMENTOS, this._agendamentos);
    return this._agendamentos;
  },

  saveAgendamentos() { this.save(this.KEYS.AGENDAMENTOS, this._agendamentos); },

  getAgendamentosDia(dataStr) {
    return this.getAgendamentos()
      .filter(a => a.data === dataStr)
      .sort((a,b) => a.hora.localeCompare(b.hora));
  },

  getAgendamentosSemana(inicioStr, fimStr) {
    return this.getAgendamentos()
      .filter(a => a.data >= inicioStr && a.data <= fimStr)
      .sort((a,b) => a.data === b.data ? a.hora.localeCompare(b.hora) : a.data.localeCompare(b.data));
  },

  addAgendamento(ag) {
    const id = 'ag' + Date.now().toString(36);
    const paciente = this.getPaciente(ag.pacienteId);
    const novo = {
      id, status:'agendado', pago:false,
      valorSessao: paciente ? paciente.valorSessao : 180,
      ...ag
    };
    this.getAgendamentos().push(novo);
    this.saveAgendamentos();
    return novo;
  },

  updateAgendamento(id, dados) {
    const idx = this._agendamentos.findIndex(a => a.id === id);
    if (idx < 0) return false;
    Object.assign(this._agendamentos[idx], dados);
    this.saveAgendamentos();
    return true;
  },

  // ════════════════════════════════════════════════════════
  // EVOLUÇÕES
  // ════════════════════════════════════════════════════════
  _evolucoes: null,

  getEvolucoes(pacienteId) {
    if (!this._evolucoes) {
      this._evolucoes = this.load(this.KEYS.EVOLUCOES) || {};
      if (!Object.keys(this._evolucoes).length) this._initEvolucoesDemo();
    }
    return pacienteId ? (this._evolucoes[pacienteId] || []) : this._evolucoes;
  },

  _initEvolucoesDemo() {
    const d = (off) => { const x = new Date(); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
    this._evolucoes = {
      'ana-silva': [
        { id:'ev1', data:d(-14), sessaoNum:18, texto:'Paciente relata melhora em episódios de ansiedade noturna. Praticou técnicas de respiração diafragmática. Resistência menor ao enfrentamento das situações evitadas. Planejamos exposição gradual.', cid:'F41.1', geradoLuma:true, agId:'ag7', pago:true },
        { id:'ev2', data:d(-21), sessaoNum:17, texto:'Retomada após 15 dias de intervalo. Relatou aumento de tensão. Trabalhamos reestruturação cognitiva em crenças disfuncionais associadas ao desempenho profissional.', cid:'F41.1', geradoLuma:false, pago:true },
        { id:'ev3', data:d(-28), sessaoNum:16, texto:'Sessão focada em autocompaixão. Paciente trouxe crítica interna intensa. Técnica de cadeiras para externalizar o crítico interno. Resposta emocional intensa e produtiva.', cid:'F41.1', geradoLuma:false, pago:false },
      ],
      'carla-nunes': [
        { id:'ev4', data:d(-7), sessaoNum:12, texto:'Paciente relata melhora no relacionamento conjugal. Trabalhamos comunicação não-violenta com o parceiro. Exercício de validação emocional realizado durante a sessão.', cid:'', geradoLuma:false, pago:true },
      ],
    };
    this.save(this.KEYS.EVOLUCOES, this._evolucoes);
  },

  addEvolucao(pacienteId, ev) {
    if (!this._evolucoes) this.getEvolucoes();
    if (!this._evolucoes[pacienteId]) this._evolucoes[pacienteId] = [];
    const nova = { id:'ev'+Date.now().toString(36), data:new Date().toISOString().slice(0,10), ...ev };
    this._evolucoes[pacienteId].unshift(nova);
    this.save(this.KEYS.EVOLUCOES, this._evolucoes);
    // Incrementar contador de sessões do paciente
    if (this._pacientes?.[pacienteId]) {
      this._pacientes[pacienteId].sessoes = (this._pacientes[pacienteId].sessoes || 0) + 1;
      this.savePacientes();
    }
    return nova;
  },

  // ════════════════════════════════════════════════════════
  // FATURAS
  // ════════════════════════════════════════════════════════
  _faturas: null,

  getFaturas(pacienteId) {
    if (!this._faturas) {
      this._faturas = this.load(this.KEYS.FATURAS) || {};
      if (!Object.keys(this._faturas).length) this._initFaturasDemo();
    }
    return pacienteId ? (this._faturas[pacienteId] || []) : this._faturas;
  },

  _initFaturasDemo() {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const mesAnterior = (() => { const d = new Date(hoje); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
    this._faturas = {
      'ana-silva': [
        { id:'ft1', mes:mesAtual,    valor:360, sessoes:2, status:'aberto',  vencimento:`${mesAtual}-03`,    pago:false },
        { id:'ft2', mes:mesAnterior, valor:720, sessoes:4, status:'pago',    vencimento:`${mesAnterior}-03`, pago:true  },
      ],
      'thiago-braga': [
        { id:'ft3', mes:mesAtual, valor:150, sessoes:1, status:'atrasado', vencimento:`${mesAtual}-02`, pago:false },
      ],
      'joao-pereira': [
        { id:'ft4', mes:mesAnterior, valor:150, sessoes:1, status:'atrasado', vencimento:`${mesAnterior}-15`, pago:false },
      ],
    };
    this.save(this.KEYS.FATURAS, this._faturas);
  },

  getInadimplentes() {
    const todos = this.getFaturas();
    const result = [];
    Object.entries(todos).forEach(([pacId, faturas]) => {
      const paciente = this.getPaciente(pacId);
      if (!paciente) return;
      faturas.filter(f => !f.pago).forEach(f => {
        const diasAtraso = Math.round((new Date() - new Date(f.vencimento)) / 86400000);
        result.push({ paciente, fatura: f, diasAtraso });
      });
    });
    return result.sort((a,b) => b.diasAtraso - a.diasAtraso);
  },

  getTotalDevedor() {
    return this.getInadimplentes().reduce((s, i) => s + i.fatura.valor, 0);
  },

  getFaturamentoMes(mesStr) {
    const todos = this.getFaturas();
    let total = 0;
    Object.values(todos).forEach(faturas => {
      faturas.filter(f => f.mes === mesStr && f.pago).forEach(f => total += f.valor);
    });
    return total;
  },

  addFatura(pacienteId, fatura) {
    if (!this._faturas) this.getFaturas();
    if (!this._faturas[pacienteId]) this._faturas[pacienteId] = [];
    const nova = { id:'ft'+Date.now().toString(36), status:'aberto', pago:false, ...fatura };
    this._faturas[pacienteId].unshift(nova);
    this.save(this.KEYS.FATURAS, this._faturas);
    return nova;
  },

  pagarFatura(pacienteId, faturaId) {
    if (!this._faturas?.[pacienteId]) return false;
    const f = this._faturas[pacienteId].find(x => x.id === faturaId);
    if (!f) return false;
    f.pago = true; f.status = 'pago'; f.dataPagamento = new Date().toISOString().slice(0,10);
    this.save(this.KEYS.FATURAS, this._faturas);
    // Atualizar devedor do paciente
    const pac = this.getPaciente(pacienteId);
    if (pac) {
      pac.devedorTotal = Math.max(0, (pac.devedorTotal||0) - f.valor);
      this.savePacientes();
    }
    return true;
  },

  // ════════════════════════════════════════════════════════
  // CARTÕES TERAPÊUTICOS
  // ════════════════════════════════════════════════════════
  _cartoes: null,

  getCartoes(pacienteId) {
    if (!this._cartoes) {
      this._cartoes = this.load(this.KEYS.CARTOES) || {};
      if (!Object.keys(this._cartoes).length) this._initCartoesDemo();
    }
    return pacienteId ? (this._cartoes[pacienteId] || []) : this._cartoes;
  },

  _initCartoesDemo() {
    this._cartoes = {
      'ana-silva': [{
        id:'ct1', titulo:'Diário de humor + respiração', criadoEm:'2025-06-19',
        tarefas:[
          { id:'t1', titulo:'Registro diário de humor', desc:'Anote como se sentiu ao acordar e ao dormir. Escala 1–10.', feita:true },
          { id:'t2', titulo:'Respiração 4-7-8 pela manhã', desc:'Inspire 4s, segure 7s, expire 8s. Repita 3 vezes ao acordar.', feita:true },
          { id:'t3', titulo:'Identificar 1 pensamento automático', desc:'Escreva o pensamento, a situação e a emoção que gerou.', feita:true },
          { id:'t4', titulo:'Leitura do material enviado', desc:'Leia o capítulo sobre reestruturação cognitiva.', feita:true },
          { id:'t5', titulo:'Registro de conquistas da semana', desc:'Liste 3 coisas positivas que aconteceram ou que você fez bem.', feita:false },
        ],
        geradoLuma:true, ativo:true,
      }],
    };
    this.save(this.KEYS.CARTOES, this._cartoes);
  },

  addCartao(pacienteId, cartao) {
    if (!this._cartoes) this.getCartoes();
    if (!this._cartoes[pacienteId]) this._cartoes[pacienteId] = [];
    const novo = { id:'ct'+Date.now().toString(36), criadoEm:new Date().toISOString().slice(0,10), ativo:true, ...cartao };
    this._cartoes[pacienteId].unshift(novo);
    this.save(this.KEYS.CARTOES, this._cartoes);
    return novo;
  },

  toggleTarefa(pacienteId, cartaoId, tarefaId) {
    const cartoes = this._cartoes?.[pacienteId];
    if (!cartoes) return;
    const cartao = cartoes.find(c => c.id === cartaoId);
    if (!cartao) return;
    const tarefa = cartao.tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;
    tarefa.feita = !tarefa.feita;
    this.save(this.KEYS.CARTOES, this._cartoes);
  },

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  today() { return new Date().toISOString().slice(0,10); },

  fmtData(str) {
    if (!str) return '—';
    const [y,m,d] = str.split('-');
    return `${d}/${m}/${y}`;
  },

  fmtMoeda(v) {
    return 'R$ ' + (v||0).toFixed(2).replace('.',',');
  },

  calcIdade(nascStr) {
    if (!nascStr) return null;
    const nasc = new Date(nascStr), hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  },

  slug(nome) {
    return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  },

  getMetricasDashboard() {
    const hoje = this.today();
    const mesAtual = hoje.slice(0,7);
    const sessoesHoje = this.getAgendamentosDia(hoje);
    const confirmados = sessoesHoje.filter(a => a.status === 'confirmado').length;
    const totalDevedor = this.getTotalDevedor();
    const faturamentoMes = this.getFaturamentoMes(mesAtual);
    const totalSessoesMes = this.getAgendamentos().filter(a => a.data.startsWith(mesAtual) && a.status !== 'cancelado').length;
    return { sessoesHoje: sessoesHoje.length, confirmados, totalDevedor, faturamentoMes, totalSessoesMes };
  },

  getAniversariantesSemana() {
    const hoje = new Date();
    const result = [];
    this.getPacientesList().forEach(p => {
      if (!p.nascimento) return;
      const nasc = new Date(p.nascimento);
      for (let i = 0; i <= 7; i++) {
        const d = new Date(hoje); d.setDate(hoje.getDate() + i);
        if (nasc.getMonth() === d.getMonth() && nasc.getDate() === d.getDate()) {
          result.push({ paciente:p, diasAte:i, data:d });
        }
      }
    });
    return result.sort((a,b) => a.diasAte - b.diasAte);
  },

  // Limpar tudo (reset)
  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    this._pacientes = null; this._agendamentos = null; this._evolucoes = null;
    this._faturas = null; this._cartoes = null;
  },
};

// Disponibilizar globalmente
window.DB = DB;
