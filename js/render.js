// ═══════════════════════════════════════════════════════════
// render.js — NexxoPsi · Renderização dinâmica de todas as views
// Cada função renderiza uma seção completa a partir do DB.
// ═══════════════════════════════════════════════════════════

var RENDER = {

  // ════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════
  dashboard() {
    const m = DB.getMetricasDashboard();
    const hoje = DB.today();
    const agHoje = DB.getAgendamentosDia(hoje);

    // Métricas
    this._set('dash-sessoes-hoje', agHoje.length);
    this._set('dash-sessoes-mes', m.totalSessoesMes);
    this._set('dash-faturamento', DB.fmtMoeda(m.faturamentoMes));
    this._set('dash-devedor', m.totalDevedor > 0 ? DB.fmtMoeda(m.totalDevedor) : '0');
    this._set('dash-confirmados', `${m.confirmados} de ${agHoje.length} confirmaram`);

    // Meta de faturamento
    const meta = window._NEXOPSI_CONFIG?.financeiro?.metaMensalFaturamento || 10000;
    const pct = Math.min(100, Math.round(m.faturamentoMes / meta * 100));
    this._set('dash-meta-pct', `${pct}% da meta`);
    const bar = document.getElementById('dash-meta-bar');
    if (bar) bar.style.width = pct + '%';

    // Sessões de hoje
    const list = document.getElementById('dash-sessoes-list');
    if (list) {
      if (!agHoje.length) {
        list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px"><i class="ti ti-calendar-off" style="font-size:24px;display:block;margin-bottom:6px"></i> Nenhuma sessão hoje</div>';
      } else {
        list.innerHTML = agHoje.map(ag => {
          const pac = DB.getPaciente(ag.pacienteId);
          if (!pac) return '';
          const statusTag = this._statusTag(ag.status);
          const modalTag = ag.modal === 'Online'
            ? '<span class="tag-online">Online</span>'
            : '<span class="tag-pres">Presencial</span>';
          return `<div class="session-item" onclick="RENDER.irParaPaciente('${ag.pacienteId}')" style="cursor:pointer">
            <div class="si-time">${ag.hora}</div>
            <div class="si-info">
              <div class="si-name">${pac.nome}</div>
              <div class="si-type">${ag.tipo}</div>
            </div>
            <div class="si-tags">${modalTag}${statusTag}</div>
          </div>`;
        }).join('');
      }
    }

    // Alertas
    this.alertasDash();

    // Aniversariantes
    const bdList = document.getElementById('dash-bday-list');
    if (bdList) {
      const bdArr = DB.getAniversariantesSemana();
      if (!bdArr.length) {
        bdList.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0">Nenhum aniversariante esta semana.</div>';
      } else {
        bdList.innerHTML = bdArr.map(b => {
          const label = b.diasAte === 0 ? '<span class="badge badge-red">🎂 Hoje</span>'
            : b.diasAte === 1 ? '<span style="font-size:11px;color:var(--warn)">Amanhã</span>'
            : `<span style="font-size:11px;color:var(--text3)">${DB.fmtData(b.data.toISOString().slice(0,10))}</span>`;
          return `<div class="bday-item">
            <div class="bday-av">${b.paciente.av}</div>
            <div><div class="bday-name">${b.paciente.nome}</div><div class="bday-date">${DB.calcIdade(b.paciente.nascimento)} anos</div></div>
            ${label}
          </div>`;
        }).join('');
      }
    }

    // Charts: inicializar após render (CDN pode já estar carregado)
    setTimeout(function() {
      if (typeof Chart !== 'undefined' && typeof initCharts === 'function') {
        initCharts();
      }
    }, 200);
  },

  // ════════════════════════════════════════════════════════
  // ALERTAS (dashboard e view completa)
  // ════════════════════════════════════════════════════════
  alertasDash() {
    const alertas = this._gerarAlertas();
    const pill = document.getElementById('nav-alert-pill');
    const count = document.getElementById('alert-count');
    const mbnDot = document.getElementById('mbn-dot');
    if (pill) { pill.textContent = alertas.length; pill.style.display = alertas.length ? '' : 'none'; }
    if (count) count.textContent = alertas.length + ' alerta' + (alertas.length !== 1 ? 's' : '');
    if (mbnDot) mbnDot.style.display = alertas.filter(a => a.urgencia === 'danger').length ? '' : 'none';

    const dashList = document.getElementById('alert-list');
    if (dashList) {
      if (!alertas.length) {
        dashList.innerHTML = '<div class="alerta info"><i class="ti ti-check"></i><div>Nenhum alerta no momento. Tudo em dia!</div></div>';
      } else {
        dashList.innerHTML = alertas.slice(0,4).map(a => this._alertaHTML(a, true)).join('');
        if (alertas.length > 4)
          dashList.innerHTML += `<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0;cursor:pointer" onclick="NAV.go('alertas')">Ver todos os ${alertas.length} alertas →</div>`;
      }
    }

    this.alertasFull(alertas);
    this.calendarioVenc();
  },

  alertasFull(alertas) {
    alertas = alertas || this._gerarAlertas();
    const el = document.getElementById('alert-full-list');
    if (!el) return;
    const filtro = window._alertFiltro || 'todos';
    const filtered = filtro === 'todos' ? alertas
      : filtro === 'urgente' ? alertas.filter(a => a.urgencia === 'danger')
      : alertas.filter(a => a.tipo === filtro);

    if (!filtered.length) {
      el.innerHTML = '<div class="alerta info"><i class="ti ti-check"></i><div>Nenhum alerta para este filtro.</div></div>';
      return;
    }
    const grupos = [
      { label:'Urgentes — ação imediata', key:'danger', icon:'ti-alert-circle' },
      { label:'Atenção — próximos dias',  key:'warn',   icon:'ti-alert-triangle' },
      { label:'Informativos',             key:'info',   icon:'ti-info-circle' },
    ];
    let html = '';
    grupos.forEach(g => {
      const items = filtered.filter(a => a.urgencia === g.key);
      if (!items.length) return;
      html += `<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;margin:14px 0 8px;display:flex;align-items:center;gap:6px"><i class="ti ${g.icon}" style="font-size:14px"></i>${g.label} (${items.length})</div>`;
      html += items.map(a => this._alertaHTML(a, false)).join('');
    });
    el.innerHTML = html;
  },

  _gerarAlertas() {
    const alertas = [];
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const diffDias = (d) => Math.round((new Date(d) - hoje) / 86400000);

    // Alertas financeiros — lendo do DB.getInadimplentes e faturas
    const inad = DB.getInadimplentes();
    inad.forEach(({ paciente, fatura, diasAtraso }) => {
      if (diasAtraso > 0) {
        alertas.push({ tipo:'financeiro', urgencia:'danger', paciente, icon:'ti-coin-off',
          titulo: `Pagamento atrasado — ${diasAtraso} dia${diasAtraso>1?'s':''} em atraso`,
          detalhe: `${DB.fmtMoeda(fatura.valor)} em aberto. Venceu em ${DB.fmtData(fatura.vencimento)}.`,
          wppTipo:'cobranca', ordem:0 });
      }
    });

    // Vencimentos futuros (7,3,1,0)
    const diasConfig = window._NEXOPSI_CONFIG?.financeiro?.diasAlerteVencimento || [7,3,1,0];
    DB.getPacientesList().forEach(pac => {
      if (!pac.vencDia) return;
      const hoje2 = new Date();
      const proxVenc = new Date(hoje2.getFullYear(), hoje2.getMonth(), pac.vencDia);
      if (proxVenc < hoje2) proxVenc.setMonth(proxVenc.getMonth() + 1);
      const diff = diffDias(proxVenc.toISOString().slice(0,10));
      if (diasConfig.includes(diff) && diff >= 0) {
        const urg = diff === 0 ? 'danger' : diff <= 1 ? 'warn' : 'info';
        const label = diff === 0 ? 'vence hoje' : diff === 1 ? 'vence amanhã' : `vence em ${diff} dias`;
        alertas.push({ tipo:'financeiro', urgencia:urg, paciente:pac, icon:'ti-calendar-due',
          titulo: `Pagamento ${label}`, detalhe: `Vencimento dia ${pac.vencDia}.`,
          wppTipo:'cobranca', ordem: diff === 0 ? 1 : diff <= 1 ? 2 : diff <= 3 ? 3 : 4 });
      }
    });

    // Lembretes de sessão (amanhã)
    const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().slice(0,10);
    DB.getAgendamentosDia(amanhaStr).forEach(ag => {
      const pac = DB.getPaciente(ag.pacienteId);
      if (!pac) return;
      alertas.push({ tipo:'sessao', urgencia:'info', paciente:pac, icon:'ti-calendar-event',
        titulo: `Sessão amanhã — ${ag.hora} · ${ag.modal}`,
        detalhe: 'Enviar lembrete de confirmação.', wppTipo:'lembrete',
        sessaoData: DB.fmtData(amanhaStr), sessaoHora: ag.hora, sessaoModal: ag.modal,
        ordem: 5 });
    });

    return alertas.sort((a,b) => a.ordem - b.ordem || a.paciente.nome.localeCompare(b.paciente.nome));
  },

  _alertaHTML(a, compact) {
    const pac = a.paciente;
    const fone = pac.fone || '';
    const cfg = window._NEXOPSI_CONFIG;
    let msg = '';
    if (a.wppTipo === 'cobranca') {
      const pix = cfg?.financeiro?.chavePix || 'mariane@email.com';
      msg = `Olá, ${pac.nome}! 🌿\n\nPassando para lembrar sobre o pagamento em aberto.\n\nPIX: *${pix}*\n\nObrigada! 😊`;
    } else {
      const ender = cfg?.psicologa?.endereco || 'R. Exemplo, 123 – Jundiaí, SP';
      const extra = a.sessaoModal === 'Online' ? 'Seu link chegará em breve.' : `Endereço: ${ender}.`;
      msg = `Olá, ${pac.nome}! 🌿\n\nLembrando da sua sessão *amanhã, ${a.sessaoData} às ${a.sessaoHora}*.\n${extra}\n\nConfirme respondendo *SIM* ou *NÃO*. Até lá! 💚`;
    }
    const wppUrl = fone ? `https://wa.me/${fone}?text=${encodeURIComponent(msg)}` : '#';
    const urgClass = { danger:'danger', warn:'warn', info:'info' }[a.urgencia] || 'info';
    return `<div class="alerta ${urgClass}" style="flex-direction:column;align-items:flex-start;gap:6px;margin-bottom:8px">
      <div style="display:flex;align-items:flex-start;gap:10px;width:100%">
        <i class="ti ${a.icon}" style="font-size:16px;flex-shrink:0;margin-top:1px"></i>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--text);font-size:13px;cursor:pointer" onclick="RENDER.irParaPaciente('${pac.id}')">${pac.nome}</div>
          <div style="font-size:12px;margin-top:1px">${a.titulo}</div>
          <div style="font-size:11px;opacity:0.8;margin-top:2px">${a.detalhe}</div>
        </div>
        <span style="font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600;background:rgba(0,0,0,0.06);white-space:nowrap">${a.tipo==='financeiro'?'Financeiro':'Sessão'}</span>
      </div>
      ${!compact && fone ? `<div style="margin-left:26px">
        <a href="${wppUrl}" target="_blank" class="btn btn-ghost" style="font-size:11px;padding:5px 12px;text-decoration:none;color:var(--success)" onclick="WPP.logEnvio('${pac.nome}','${a.wppTipo}')">
          <i class="ti ti-brand-whatsapp"></i> Enviar lembrete
        </a>
      </div>` : ''}
    </div>`;
  },

  calendarioVenc() {
    const el = document.getElementById('venc-calendar');
    if (!el) return;
    const hoje = new Date();
    const eventos = [];
    DB.getPacientesList().forEach(p => {
      if (!p.vencDia) return;
      const proxVenc = new Date(hoje.getFullYear(), hoje.getMonth(), p.vencDia);
      if (proxVenc < hoje) proxVenc.setMonth(proxVenc.getMonth() + 1);
      const diff = Math.round((proxVenc - hoje) / 86400000);
      if (diff <= 30) eventos.push({ paciente:p, data:proxVenc, diff });
    });
    eventos.sort((a,b) => a.diff - b.diff);
    if (!eventos.length) { el.innerHTML = '<div style="font-size:13px;color:var(--text3)">Sem vencimentos nos próximos 30 dias.</div>'; return; }
    el.innerHTML = eventos.map(e => {
      const label = e.diff < 0 ? `<span style="color:var(--danger);font-weight:600">${Math.abs(e.diff)}d atrasado</span>`
        : e.diff === 0 ? `<span style="color:var(--danger);font-weight:600">Hoje</span>`
        : e.diff === 1 ? `<span style="color:var(--warn);font-weight:600">Amanhã</span>`
        : `<span style="color:var(--text2)">em ${e.diff} dias</span>`;
      const barW = Math.max(4, Math.min(100, 100 - e.diff/30*100));
      const barC = e.diff <= 0 ? 'var(--danger)' : e.diff <= 3 ? 'var(--warn)' : 'var(--teal)';
      return `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="RENDER.irParaPaciente('${e.paciente.id}')">
        <div style="width:56px;text-align:center;font-size:11px;font-weight:600;color:var(--text3)">${DB.fmtData(e.data.toISOString().slice(0,10))}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:500;color:var(--text)">${e.paciente.nome}</div>
        <div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${barW}%;background:${barC};border-radius:2px"></div></div></div>
        <div>${label}</div>
        ${(e.paciente.devedorTotal||0) > 0 ? '<span class="tag-pend">Em aberto</span>' : '<span class="tag-pago">Em dia</span>'}
      </div>`;
    }).join('');
  },

  // ════════════════════════════════════════════════════════
  // AGENDA DINÂMICA
  // ════════════════════════════════════════════════════════
  _semanaOffset: 0,

  agenda() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + this._semanaOffset * 7);
    const dias = Array.from({length:5}, (_,i) => { const d=new Date(seg); d.setDate(seg.getDate()+i); return d; });
    const todayStr = hoje.toISOString().slice(0,10);
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    // Atualizar header
    const header = document.getElementById('agenda-header');
    if (header) {
      const ini = `${dias[0].getDate()} ${meses[dias[0].getMonth()]}`;
      const fim = `${dias[4].getDate()} ${meses[dias[4].getMonth()]} ${dias[4].getFullYear()}`;
      header.textContent = `${ini} – ${fim}`;
    }

    const horarios = ['08','09','10','11','12','13','14','15','16','17','18'];
    const diasNames = ['Seg','Ter','Qua','Qui','Sex'];
    const iniStr = dias[0].toISOString().slice(0,10);
    const fimStr = dias[4].toISOString().slice(0,10);
    const filtroLocalAgenda = document.getElementById('agenda-filtro-local')?.value || '';
    let ags = DB.getAgendamentosSemana(iniStr, fimStr);
    if (filtroLocalAgenda) {
      ags = ags.filter(a => {
        const pac = DB.getPaciente(a.pacienteId);
        return pac && (a.local || pac.local) === filtroLocalAgenda;
      });
    }

    // Montar HTML completo da grade num único elemento cal-grid
    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    let html = '';
    // Linha de cabeçalho
    html += '<div class="cal-head"></div>';
    dias.forEach((d,i) => {
      const isToday = d.toISOString().slice(0,10) === todayStr;
      html += `<div class="cal-head${isToday?' today':''}">${diasNames[i]}<br><strong>${d.getDate()}</strong></div>`;
    });

    // Linhas de horário
    horarios.forEach(hh => {
      html += `<div class="cal-time">${hh}h</div>`;
      dias.forEach(d => {
        const dStr = d.toISOString().slice(0,10);
        const isToday = dStr === todayStr;
        const sessoes = ags.filter(a => a.data === dStr && a.hora.startsWith(hh+':'));
        const bgStyle = isToday ? 'style="background:rgba(32,128,160,0.04)"' : '';
        if (!sessoes.length) {
          html += `<div class="cal-cell" ${bgStyle} onclick="RENDER.novoAgendamentoNaData('${dStr}','${hh}:00')"></div>`;
        } else {
          const appts = sessoes.map(ag => {
            const pac = DB.getPaciente(ag.pacienteId);
            const nome = pac ? pac.nome.split(' ')[0] : '?';
            const cls = ag.modal === 'Online' ? 'cal-appt online' : 'cal-appt pres';
            const dot = ag.status === 'aguardando' ? '⚠ ' : ag.pago ? '✓ ' : '';
            return `<div class="${cls}" onclick="RENDER.abrirSessao('${ag.id}',event)" title="${pac?.nome||''} · ${ag.hora} · ${ag.tipo}">${dot}${nome}<br><span style="font-size:9px">${ag.hora}</span></div>`;
          }).join('');
          html += `<div class="cal-cell" ${bgStyle}>${appts}</div>`;
        }
      });
    });

    grid.innerHTML = html;
  },

  novoAgendamentoNaData(data, hora) {
    const dataEl = document.getElementById('ag-data');
    const horaEl = document.getElementById('ag-hora');
    if (dataEl) dataEl.value = data;
    if (horaEl) horaEl.value = hora;
    if (typeof openModal === 'function') openModal('modal-agend');
  },

  abrirSessao(agId, e) {
    if (e) e.stopPropagation();
    const ag = DB.getAgendamentos().find(a => a.id === agId);
    if (!ag) return;
    const pac = DB.getPaciente(ag.pacienteId);
    if (!pac) return;
    // Preencher modal de detalhes da sessão
    const loc = DB.getLocal(ag.local || pac.local);
    const locHtml = loc ? `<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${loc.cor}22;color:${loc.cor}">${loc.nome}</span>` : '';
    const statusCls = {confirmado:'tag-pago',agendado:'badge-gray badge',realizado:'tag-pago',aguardando:'tag-conf',cancelado:'tag-pend'}[ag.status]||'tag-conf';
    let html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--teal-light);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--teal);flex-shrink:0">${pac.av}</div>
      <div><div style="font-size:16px;font-weight:700;color:var(--text)">${pac.nome}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${ag.tipo} · ${ag.modal}</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:var(--warm);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Data e horário</div>
      <div style="font-size:14px;font-weight:600;color:var(--text)">${DB.fmtData(ag.data)} às ${ag.hora}</div></div>
      <div style="background:var(--warm);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Valor</div>
      <div style="font-size:14px;font-weight:600;color:var(--teal)">${DB.fmtMoeda(ag.valorSessao || pac.valorSessao)}</div></div>
      <div style="background:var(--warm);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Status</div>
      <span class="${statusCls}" style="font-size:12px">${ag.status}</span></div>
      <div style="background:var(--warm);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Local</div>
      <div>${locHtml || '<span style="color:var(--text3);font-size:12px">—</span>'}</div></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sage" style="flex:1;justify-content:center;font-size:13px" onclick="RENDER.irParaPaciente('${ag.pacienteId}');closeModal('modal-sessao')">
        <i class="ti ti-clipboard-text"></i> Abrir prontuário
      </button>
      ${!ag.pago ? `<button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:13px;color:var(--success);border-color:var(--success)" onclick="RENDER.pagarSessao('${ag.id}','${ag.pacienteId}');closeModal('modal-sessao')">
        <i class="ti ti-coin"></i> Registrar pagamento
      </button>` : '<span style="font-size:12px;color:var(--success);display:flex;align-items:center;gap:4px;padding:8px"><i class="ti ti-check"></i> Pagamento registrado</span>'}
    </div>`;
    const body = document.getElementById('modal-sessao-body');
    const title = document.getElementById('modal-sessao-title');
    if (body) body.innerHTML = html;
    if (title) title.textContent = pac.nome + ' — ' + DB.fmtData(ag.data);
    if (typeof openModal === 'function') openModal('modal-sessao');
  },

  semanaAnterior() { this._semanaOffset--; this.agenda(); },
  semanaSeguinte() { this._semanaOffset++; this.agenda(); },

  // ════════════════════════════════════════════════════════
  // PRONTUÁRIOS
  // ════════════════════════════════════════════════════════
  _pacienteSelecionadoId: null,

  prontuario(busca) {
    const pacs = DB.getPacientesList();
    const filtroLocal  = document.getElementById('pac-filtro-local')?.value  || '';
    const filtroPerfil = document.getElementById('pac-filtro-perfil')?.value || '';
    let filtrados = pacs;
    if (busca) filtrados = filtrados.filter(p =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.cpf||'').includes(busca));
    if (filtroLocal)  filtrados = filtrados.filter(p => p.local === filtroLocal);
    if (filtroPerfil) filtrados = filtrados.filter(p => (p.perfil||[]).includes(filtroPerfil));

    const cnt = document.getElementById('pac-count');
    if (cnt) cnt.textContent = filtrados.length + ' paciente' + (filtrados.length !== 1 ? 's' : '');

    const list = document.getElementById('patient-list');
    if (!list) return;
    list.innerHTML = filtrados.map(p => {
      const devedor = (p.devedorTotal||0) > 0;
      const tagHtml = devedor ? '<span class="tag-pend">Pgto. pend.</span>' : '<span class="tag-pago">Em dia</span>';
      const idade = DB.calcIdade(p.nascimento);
      const valorFmt = DB.fmtMoeda(p.valorSessao || 180);
      const loc = DB.getLocal(p.local);
      const locBadge = loc ? `<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:${loc.cor}22;color:${loc.cor};font-weight:600">${loc.nome}</span>` : '';
      const perfilBadges = (p.perfil||[]).filter(t=>t!=='adulto').map(t => {
        const lbl = {crianca:'👦',neurodiverge:'🧠',mulher:'👩',supervisao:'📚'}[t]||t;
        return `<span style="font-size:10px">${lbl}</span>`;
      }).join('');
      return `<div class="patient-mini ${this._pacienteSelecionadoId===p.id?'active':''}" onclick="RENDER.selecionarPaciente('${p.id}')">
        <div class="pm-row"><div class="pm-name">${p.nome}</div><div style="display:flex;gap:4px;align-items:center">${locBadge}${perfilBadges}${tagHtml}</div></div>
        <div class="pm-meta">${idade?idade+' anos · ':''}${p.modalidade||''} · ${valorFmt}/sessão</div>
      </div>`;
    }).join('');

    if (!this._pacienteSelecionadoId && filtrados.length) {
      this.selecionarPaciente(filtrados[0].id);
    } else if (this._pacienteSelecionadoId) {
      this.detalhesPaciente(this._pacienteSelecionadoId);
    }
  },

  selecionarPaciente(id) {
    this._pacienteSelecionadoId = id;
    window._pacienteSelecionado = id;
    document.querySelectorAll('.patient-mini').forEach(el => {
      el.classList.toggle('active', el.onclick?.toString().includes(id));
    });
    this.detalhesPaciente(id);
  },

  detalhesPaciente(id) {
    const p = DB.getPaciente(id);
    if (!p) return;
    const idade = DB.calcIdade(p.nascimento);

    this._set('ph-av', p.av);
    this._set('ph-name', p.nome);
    this._set('ph-meta', `${idade?idade+' anos · ':''}${p.sexo||''} · CPF: ${p.cpf||'—'}`);
    this._set('ph-sessoes', p.sessoes + ' sessões');
    this._set('ph-inicio', p.inicio ? p.inicio.slice(0,7).replace('-','/') : '—');
    this._set('ph-devedor', (p.devedorTotal||0)>0 ? DB.fmtMoeda(p.devedorTotal) : '—');
    this._set('ph-cid', p.cid || '—');

    // Local de atendimento
    const localEl = document.getElementById('ph-local');
    if (localEl) {
      const loc = DB.getLocal(p.local);
      if (loc) {
        localEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${loc.cor}22;color:${loc.cor}"><i class="ti ${loc.icon}" style="font-size:12px"></i>${loc.nome}</span>`;
      } else {
        localEl.innerHTML = '<span style="color:var(--text3)">Não definido</span>';
      }
    }

    // Tags de perfil
    const perfilEl = document.getElementById('ph-perfil-tags');
    if (perfilEl && p.perfil) {
      const labelMap = { adulto:'Adulto', crianca:'Criança', neurodiverge:'Neurodivergente', mulher:'Mulher', supervisao:'Supervisão' };
      const corMap = { adulto:'var(--teal)', crianca:'#E65100', neurodiverge:'#6A1B9A', mulher:'#C2185B', supervisao:'#1565C0' };
      perfilEl.innerHTML = p.perfil.map(tag => {
        const cor = corMap[tag] || 'var(--text3)';
        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${cor}22;color:${cor};margin-right:4px">${labelMap[tag]||tag}</span>`;
      }).join('');
    }

    // Valor da sessão com botão editar
    const valorEl = document.getElementById('ph-valor-sessao');
    if (valorEl) valorEl.innerHTML = `${DB.fmtMoeda(p.valorSessao||180)}
      <button onclick="RENDER.editarValorSessao('${id}')" style="background:none;border:none;cursor:pointer;color:var(--teal);font-size:13px;padding:0 0 0 4px;line-height:1" title="Editar valor"><i class="ti ti-edit"></i></button>`;

    const df = document.getElementById('ph-devedor-field');
    if (df) df.className = 'ph-field' + ((p.devedorTotal||0)>0 ? ' warn-field' : '');

    // Renderizar aba ativa
    const abaAtiva = document.querySelector('.inner-tabs .it.active')?.textContent?.trim();
    this.prontuarioAba(id, abaAtiva || 'Evoluções');
  },

  prontuarioAba(pacienteId, aba) {
    const id = pacienteId || this._pacienteSelecionadoId;
    if (!id) return;
    if (aba === 'Evoluções') this.evolucoes(id);
    if (aba === 'Financeiro') this.financeiroPaciente(id);
    if (aba === 'Cartões') this.cartoesPaciente(id);
    if (aba === 'Documentos') this.documentosPaciente(id);
  },

  evolucoes(pacienteId) {
    const el = document.getElementById('ev-timeline');
    if (!el) return;
    const evs = DB.getEvolucoes(pacienteId);
    if (!evs.length) {
      el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px"><i class="ti ti-notes-off" style="font-size:24px;display:block;margin-bottom:6px"></i>Nenhuma evolução registrada.</div>';
      return;
    }
    el.innerHTML = evs.map((ev,i) => {
      const lumaTag = ev.geradoLuma ? '<span class="badge badge-luma">Gerado por LUMA</span>' : '';
      const pagoTag = ev.pago ? '<span class="tag-pago">Pago</span>' : '<span class="tag-pend">Pend.</span>';
      return `<div class="tl-entry">
        <div class="tl-dot ${ev.pago?'':'red'}"></div>
        <div class="tl-body">
          <div class="tl-date">${DB.fmtData(ev.data)} · Sessão #${ev.sessaoNum||'—'}</div>
          <div class="tl-card">
            <div class="tl-head"><span class="tl-title">Evolução clínica</span>${pagoTag}${lumaTag}</div>
            <div class="tl-text">${ev.texto}</div>
            ${ev.cid ? `<div class="tl-cid"><i class="ti ti-stethoscope" style="font-size:12px"></i> ${ev.cid}</div>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  },

  financeiroPaciente(pacienteId) {
    const el = document.getElementById('pron-fin-content') || document.getElementById('pron-fin');
    if (!el) return;
    const pac = DB.getPaciente(pacienteId);
    const faturas = DB.getFaturas(pacienteId);
    const agsPac = DB.getAgendamentos().filter(a => a.pacienteId === pacienteId);

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:13px;font-weight:600;color:var(--text)">Histórico financeiro</div>
      <div style="font-size:13px;color:${(pac?.devedorTotal||0)>0?'var(--danger)':'var(--success)'};font-weight:600">
        ${(pac?.devedorTotal||0)>0 ? '⚠ Em aberto: '+DB.fmtMoeda(pac.devedorTotal) : '✓ Em dia'}
      </div>
    </div>`;

    if (!faturas.length && !agsPac.length) {
      html += '<div style="font-size:13px;color:var(--text3);padding:12px 0">Nenhum registro financeiro.</div>';
    } else {
      html += `<div style="display:grid;grid-template-columns:80px 1fr 80px 90px 80px;gap:4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;padding:0 0 8px;border-bottom:1px solid var(--border)">
        <span>Data</span><span>Descrição</span><span>Valor</span><span>Status</span><span>Ação</span></div>`;

      // Sessões
      agsPac.sort((a,b)=>b.data.localeCompare(a.data)).slice(0,20).forEach(ag => {
        const statusTag = ag.pago ? '<span class="tag-pago">Pago</span>' : '<span class="tag-pend">Pendente</span>';
        const btnPagar = !ag.pago ? `<button onclick="RENDER.pagarSessao('${ag.id}','${pacienteId}')" style="font-size:11px;padding:3px 8px;background:var(--success-bg);color:var(--success);border:none;border-radius:6px;cursor:pointer">Pagar</button>` : '—';
        html += `<div style="display:grid;grid-template-columns:80px 1fr 80px 90px 80px;gap:4px;font-size:12px;color:var(--text);padding:9px 0;border-bottom:1px solid var(--border);align-items:center">
          <span>${DB.fmtData(ag.data)}</span>
          <span>${ag.tipo}</span>
          <span>${DB.fmtMoeda(ag.valorSessao)}</span>
          <span>${statusTag}</span>
          <span>${btnPagar}</span>
        </div>`;
      });
    }
    el.innerHTML = html;
  },

  pagarSessao(agId, pacienteId) {
    DB.updateAgendamento(agId, { pago:true });
    // Recalcular devedor
    const pac = DB.getPaciente(pacienteId);
    if (pac) {
      const agsPend = DB.getAgendamentos().filter(a => a.pacienteId === pacienteId && !a.pago && a.status !== 'cancelado');
      pac.devedorTotal = agsPend.reduce((s,a) => s + (a.valorSessao||0), 0);
      DB.savePacientes();
    }
    this.financeiroPaciente(pacienteId);
    this.detalhesPaciente(pacienteId);
    if (typeof showToast === 'function') showToast('Pagamento registrado!');
  },

  cartoesPaciente(pacienteId) {
    const el = document.getElementById('pron-cart');
    if (!el) return;
    const cartoes = DB.getCartoes(pacienteId);
    if (!cartoes.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Nenhum cartão criado para este paciente.<br><button class="btn btn-sage" style="margin-top:10px;font-size:12px" onclick="openModal(\'modal-cartao\')"><i class="ti ti-plus"></i> Criar cartão</button></div>';
      return;
    }
    el.innerHTML = cartoes.map(c => {
      const feitas = c.tarefas.filter(t=>t.feita).length;
      const pct = Math.round(feitas/c.tarefas.length*100);
      return `<div class="cartao-item active" style="margin-bottom:10px">
        <div class="ci-head"><div><div class="ci-title">${c.titulo}</div><div class="ci-meta">${DB.fmtData(c.criadoEm)} · ${c.tarefas.length} tarefas${c.geradoLuma?' · LUMA':''}</div></div>
        <span class="${pct===100?'tag-pago':'tag-conf'}">${pct}%</span></div>
        <div class="ci-bar"><div class="ci-fill" style="width:${pct}%"></div></div>
        <div class="ci-adesao">Adesão: ${pct}% · ${feitas} de ${c.tarefas.length} concluídas</div>
      </div>`;
    }).join('');
  },

  documentosPaciente(pacienteId) {
    const el = document.getElementById('pron-docs');
    if (!el) return;
    const docs = DB.load('nxp_docs_'+pacienteId) || [];
    let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-ghost" style="font-size:12px" onclick="openModal('modal-doc')"><i class="ti ti-upload"></i> Anexar documento</button>
    </div>`;
    if (!docs.length) {
      html += '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px"><i class="ti ti-file-off" style="font-size:24px;display:block;margin-bottom:6px"></i>Nenhum documento anexado.</div>';
    } else {
      html += docs.map(d => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--warm);border-radius:8px;border:1px solid var(--border);margin-bottom:6px">
        <i class="ti ti-file-text" style="color:var(--teal);font-size:18px"></i>
        <div style="flex:1"><div style="font-size:13px;font-weight:500;color:var(--text)">${d.nome}</div>
        <div style="font-size:11px;color:var(--text3)">${d.tipo} · ${DB.fmtData(d.data)}</div></div>
        <i class="ti ti-download" style="color:var(--text3);cursor:pointer;font-size:16px"></i>
      </div>`).join('');
    }
    el.innerHTML = html;
  },

  editarValorSessao(pacienteId) {
    const p = DB.getPaciente(pacienteId);
    if (!p) return;
    const atual = p.valorSessao || 180;
    const novoStr = prompt(`Valor por sessão de ${p.nome}:\nAtual: ${DB.fmtMoeda(atual)}`, atual);
    if (novoStr === null) return;
    const novo = parseFloat(String(novoStr).replace(',','.'));
    if (isNaN(novo) || novo <= 0) { alert('Valor inválido.'); return; }
    DB.updatePaciente(pacienteId, { valorSessao:novo });
    this.detalhesPaciente(pacienteId);
    this.prontuario(document.getElementById('pac-search')?.value || '');
    if (typeof showToast === 'function') showToast(`Valor de ${p.nome} atualizado: ${DB.fmtMoeda(novo)}/sessão`);
  },

  // ════════════════════════════════════════════════════════
  // FINANCEIRO (view)
  // ════════════════════════════════════════════════════════
  financeiro() {
    // Pacotes
    const pacGrid = document.getElementById('fin-pacotes-grid');
    if (pacGrid) {
      const pacs = DB.getPacientesList().filter(p => p.pacoteTotal);
      if (!pacs.length) {
        pacGrid.innerHTML = '<div style="font-size:13px;color:var(--text3)">Nenhum pacote ativo.</div>';
      } else {
        pacGrid.innerHTML = pacs.map(p => {
          const pct = Math.round((p.pacoteUsado||0)/p.pacoteTotal*100);
          const barCls = pct >= 80 ? 'crit' : pct >= 60 ? 'warn' : 'ok';
          return `<div class="pacote">
            <div class="pac-name">Pacote ${p.pacoteTotal} sessões</div>
            <div class="pac-pac">${p.nome}</div>
            <div class="pac-bar-wrap"><div class="pac-bar-label"><span>${p.pacoteUsado||0} de ${p.pacoteTotal}</span><span>${p.pacoteTotal-(p.pacoteUsado||0)} restantes</span></div>
            <div class="pac-bar"><div class="pac-fill ${barCls}" style="width:${pct}%"></div></div></div>
            <div class="pac-valor">${DB.fmtMoeda(p.valorSessao*(p.pacoteTotal||0))} total</div>
          </div>`;
        }).join('');
      }
    }

    // Inadimplência
    const iadEl = document.getElementById('fin-inad-list');
    if (iadEl) {
      const inad = DB.getInadimplentes();
      if (!inad.length) {
        iadEl.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--success);padding:16px"><i class="ti ti-check"></i> Nenhuma inadimplência!</td></tr>';
      } else {
        iadEl.innerHTML = inad.map(({paciente,fatura,diasAtraso}) => `<tr>
          <td style="cursor:pointer" onclick="RENDER.irParaPaciente('${paciente.id}')">${paciente.nome}</td>
          <td>${DB.fmtData(fatura.vencimento)}</td>
          <td>${diasAtraso > 0 ? diasAtraso+'d atraso' : 'Hoje'}</td>
          <td style="color:var(--danger);font-weight:600">${DB.fmtMoeda(fatura.valor)}</td>
        </tr>`).join('');
      }
      const total = document.getElementById('fin-inad-total');
      if (total) total.textContent = DB.fmtMoeda(DB.getTotalDevedor());
    }

    // Select de pacientes no recibo
    const finPac = document.getElementById('fin-pac');
    if (finPac) {
      const atual = finPac.value;
      finPac.innerHTML = '<option value="">Selecione o paciente...</option>' +
        DB.getPacientesList().map(p => `<option value="${p.id}" ${p.id===atual?'selected':''}>${p.nome}</option>`).join('');
    }
  },

  finPacienteChanged() {
    const sel = document.getElementById('fin-pac');
    if (!sel?.value) return;
    const p = DB.getPaciente(sel.value);
    if (!p) return;
    // Calcular sessões não pagas
    const agsPend = DB.getAgendamentos().filter(a => a.pacienteId === p.id && !a.pago && a.status !== 'cancelado');
    const total = agsPend.reduce((s,a) => s+(a.valorSessao||p.valorSessao||180), 0);
    let info = document.getElementById('fin-valor-info');
    if (!info) {
      info = document.createElement('div');
      info.id = 'fin-valor-info';
      info.style.cssText = 'font-size:12px;color:var(--teal);margin-top:6px;padding:8px 10px;background:var(--teal-light);border-radius:8px;display:flex;align-items:center;gap:6px';
      sel.parentElement.appendChild(info);
    }
    info.innerHTML = `<i class="ti ti-coin" style="font-size:14px"></i> <strong>${p.nome}</strong> · ${DB.fmtMoeda(p.valorSessao)}/sessão · ${agsPend.length} sessões pendentes · Total: <strong>${DB.fmtMoeda(total)}</strong>`;
    const prevTotal = document.getElementById('rec-prev-total-val');
    if (prevTotal) prevTotal.textContent = DB.fmtMoeda(total || p.valorSessao * 4);
  },

  // ════════════════════════════════════════════════════════
  // WHATSAPP — popular selects do DB
  // ════════════════════════════════════════════════════════
  wppSelects() {
    const sel = document.getElementById('wpp-pac');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o paciente...</option>' +
      DB.getPacientesList()
        .filter(p => p.fone)
        .map(p => {
          const ag = DB.getAgendamentos().filter(a => a.pacienteId === p.id && a.data >= DB.today()).sort((a,b)=>a.data.localeCompare(b.data))[0];
          const data = ag ? ag.data : DB.today();
          const hora = ag ? ag.hora : '10:00';
          const modal = ag ? ag.modal.toLowerCase() : 'presencial';
          return `<option value="${p.nome}|${p.fone}|${DB.fmtData(data)}|${hora}|${modal}">${p.nome} · ${p.fone.slice(-11).replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</option>`;
        }).join('');
  },

  // ════════════════════════════════════════════════════════
  // NAVEGAÇÃO CRUZADA
  // ════════════════════════════════════════════════════════
  irParaPaciente(pacienteId) {
    // Guardar antes de navegar
    this._pacienteSelecionadoId = pacienteId;
    window._pacienteSelecionado = pacienteId;
    // Navegar sem disparar _onViewChange (evita prontuario() limpar a seleção)
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    const target = document.getElementById('v-prontuario');
    if (target) target.classList.add('active');
    const navEl = document.querySelector('.nav-item[data-view="prontuario"]');
    if (navEl) navEl.classList.add('active');
    const titleEl = document.getElementById('tb-title');
    if (titleEl) titleEl.textContent = 'Prontuários';
    // Renderizar com paciente já selecionado
    this.prontuario();
    this.selecionarPaciente(pacienteId);
    // Fechar sidebar mobile se aberta
    if (window.innerWidth <= 768 && typeof closeSidebar === 'function') closeSidebar();
  },

  // ════════════════════════════════════════════════════════
  // MODAL AGENDAMENTO — salvar no DB
  // ════════════════════════════════════════════════════════
  salvarAgendamento() {
    const modo = window._agModo || 'avulso';
    if (modo === 'recorrente') { this.salvarRecorrencia(); return; }
    const pacSel = document.getElementById('ag-pac')?.value;
    const data = document.getElementById('ag-data')?.value;
    const hora = document.getElementById('ag-hora')?.value;
    const err = document.getElementById('ag-erro');
    if (!pacSel) { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
    if (!data)   { err.textContent='Selecione a data.'; err.style.display='block'; return; }
    if (!hora)   { err.textContent='Informe o horário.'; err.style.display='block'; return; }
    err.style.display='none';
    const pac = DB.getPacienteByNome(pacSel) || DB.getPaciente(pacSel);
    if (!pac) { err.textContent='Paciente não encontrado.'; err.style.display='block'; return; }
    const ag = DB.addAgendamento({
      pacienteId: pac.id,
      data, hora,
      tipo:  document.getElementById('ag-tipo')?.value  || 'Terapia Individual',
      modal: document.getElementById('ag-mod')?.value   || 'Presencial',
      local: document.getElementById('ag-local')?.value || pac.local || '',
      valorSessao: pac.valorSessao || 180,
    });
    if (typeof closeModal === 'function') closeModal('modal-agend');
    if (typeof showToast === 'function') showToast(`Sessão de ${pac.nome} agendada para ${DB.fmtData(data)} às ${hora}!`);
    this.agenda();
    this.alertasDash();
  },

  salvarRecorrencia() {
    const pacSel = document.getElementById('ag-pac')?.value;
    const inicio = document.getElementById('rec-inicio')?.value;
    const hora   = document.getElementById('rec-hora')?.value;
    const err    = document.getElementById('ag-erro');
    if (!pacSel) { err.textContent='Selecione o paciente.'; err.style.display='block'; return; }
    if (!inicio) { err.textContent='Informe a data de início.'; err.style.display='block'; return; }
    err.style.display='none';
    const pac = DB.getPacienteByNome(pacSel) || DB.getPaciente(pacSel);
    if (!pac) { err.textContent='Paciente não encontrado.'; err.style.display='block'; return; }
    const freq  = parseInt(document.getElementById('rec-freq')?.value || 7);
    const dur   = parseInt(document.getElementById('rec-duracao')?.value || 8);
    const valor = parseFloat(document.getElementById('rec-valor')?.value || pac.valorSessao || 180);
    const total = dur === 0 ? 12 : dur;
    let data = new Date(inicio + 'T12:00');
    const criados = [];
    for (let i = 0; i < total; i++) {
      const ag = DB.addAgendamento({
        pacienteId: pac.id,
        data: data.toISOString().slice(0,10), hora,
        tipo: document.getElementById('ag-tipo')?.value || 'Terapia Individual',
        modal: document.getElementById('ag-mod')?.value || 'Presencial',
        valorSessao: valor,
      });
      criados.push(ag);
      data.setDate(data.getDate() + freq);
    }
    // Gerar faturas mensais
    const faturasMes = {};
    criados.forEach(ag => {
      const mes = ag.data.slice(0,7);
      if (!faturasMes[mes]) faturasMes[mes] = { sessoes:0, total:0 };
      faturasMes[mes].sessoes++;
      faturasMes[mes].total += ag.valorSessao;
    });
    const vencDia = parseInt(document.getElementById('rec-venc')?.value || pac.vencDia || 10);
    Object.entries(faturasMes).forEach(([mes, ft]) => {
      DB.addFatura(pac.id, { mes, valor:ft.total, sessoes:ft.sessoes, vencimento:`${mes}-${String(vencDia).padStart(2,'0')}` });
    });
    if (typeof closeModal === 'function') closeModal('modal-agend');
    const totalVal = criados.reduce((s,a)=>s+a.valorSessao,0);
    if (typeof showToast === 'function') showToast(`✓ ${criados.length} sessões criadas para ${pac.nome} · ${Object.keys(faturasMes).length} faturas geradas · ${DB.fmtMoeda(totalVal)} total`);
    this.agenda();
    this.alertasDash();
    if (typeof agTab === 'function') agTab('avulso');
  },

  // ════════════════════════════════════════════════════════
  // SALVAR NOVO PACIENTE
  // ════════════════════════════════════════════════════════
  salvarNovoPaciente() {
    const nome  = document.getElementById('np-nome')?.value.trim();
    const tel   = document.getElementById('np-tel')?.value.trim();
    const err   = document.getElementById('np-erro');
    if (!nome) { err.textContent='Informe o nome completo.'; err.style.display='block'; return; }
    if (!tel)  { err.textContent='Informe o telefone / WhatsApp.'; err.style.display='block'; return; }
    err.style.display='none';
    const nascStr = document.getElementById('np-nasc')?.value || '';
    const idade = nascStr ? DB.calcIdade(nascStr) : null;
    const sexo = document.getElementById('np-sexo')?.value || '';
    const partes = nome.split(' ');
    const av = (partes[0][0]+(partes[1]?.[0]||'')).toUpperCase();
    const valor = parseFloat(document.getElementById('np-valor')?.value || 0);
    const perfilChecks = [...document.querySelectorAll('input[name="np-perfil"]:checked')].map(cb => cb.value);
    const p = DB.addPaciente({
      nome, av, nascimento: nascStr, sexo: sexo?sexo[0]:'?',
      cpf:       document.getElementById('np-cpf')?.value.trim() || '',
      fone:      '55' + tel.replace(/\D/g,''),
      email:     document.getElementById('np-email')?.value.trim() || '',
      cid:       document.getElementById('np-cid')?.value.trim() || '',
      modalidade:document.getElementById('np-modal')?.value || 'Presencial',
      local:     document.getElementById('np-local')?.value || '',
      perfil:    perfilChecks.length ? perfilChecks : ['adulto'],
      valorSessao: valor > 0 ? valor : (window._NEXOPSI_CONFIG?.financeiro?.valorSessaoPadrao || 180),
      vencDia:   parseInt(document.getElementById('np-venc')?.value || 10),
      obs:       document.getElementById('np-obs')?.value.trim() || '',
      meta:      `${idade?idade+' anos · ':''}${sexo?sexo[0]:'?'}`,
    });
    if (typeof closeModal === 'function') closeModal('modal-paciente');
    if (typeof showToast === 'function') showToast(`${p.nome} cadastrado! Valor: ${DB.fmtMoeda(p.valorSessao)}/sessão`);
    ['np-nome','np-cpf','np-tel','np-email','np-cid','np-valor','np-obs'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value='';
    });
    // Resetar checkboxes de perfil
    document.querySelectorAll('input[name="np-perfil"]').forEach(cb => cb.checked = false);
    // Atualizar tudo
    this.prontuario();
    this.wppSelects();
    this.popularSelects();
  },

  // Popular todos os selects de paciente no sistema
  popularSelects() {
    const pacs = DB.getPacientesList();
    ['ag-pac','nc-pac','na-pac','fin-pac'].forEach(selId => {
      const sel = document.getElementById(selId);
      if (!sel) return;
      const val = sel.value;
      sel.innerHTML = '<option value="">Selecione o paciente...</option>' +
        pacs.map(p => {
          const loc = DB.getLocal(p.local);
          const locLabel = loc ? ` [${loc.nome}]` : '';
          return `<option value="${p.nome}" ${p.nome===val?'selected':''}>${p.nome}${locLabel}</option>`;
        }).join('');
    });
  },

  // ════════════════════════════════════════════════════════
  // SALVAR EVOLUÇÃO NO DB
  // ════════════════════════════════════════════════════════
  salvarEvolucao() {
    const id = this._pacienteSelecionadoId;
    if (!id) return;
    const texto = document.getElementById('ev-text')?.value.trim();
    if (!texto) return;
    const pac = DB.getPaciente(id);
    const ev = DB.addEvolucao(id, {
      texto,
      sessaoNum: (pac?.sessoes || 0),
      cid: document.getElementById('ev-cid-input')?.value?.trim() || pac?.cid || '',
      geradoLuma: false,
      pago: false,
    });
    document.getElementById('evolucao-form').style.display='none';
    document.getElementById('ev-text').value='';
    this.evolucoes(id);
    this.detalhesPaciente(id);
    if (typeof showToast === 'function') showToast('Evolução salva no prontuário!');
  },

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  _statusTag(status) {
    const map = {
      confirmado: '<span class="tag-pago">Confirmou</span>',
      aguardando: '<span class="tag-conf">Aguardando</span>',
      realizado:  '<span class="tag-pago">Realizado</span>',
      agendado:   '<span class="badge-gray badge">Agendado</span>',
      cancelado:  '<span class="tag-pend">Cancelado</span>',
    };
    return map[status] || '';
  },
};

window.RENDER = RENDER;

// Alias de compatibilidade com funções antigas chamadas inline
function renderAlerts() { RENDER.alertasDash(); }
function filterAlerts(tipo, btn) {
  window._alertFiltro = tipo;
  document.querySelectorAll('#alert-filter-btns .btn').forEach(b => {
    b.className = b === btn ? 'btn btn-sage' : 'btn btn-ghost';
    b.style.fontSize = '12px';
  });
  RENDER.alertasFull();
}
function shiftWeek(dir) {
  RENDER._semanaOffset += dir;
  RENDER.agenda();
}
function selectPatient(el, nome) {
  const p = DB.getPacienteByNome(nome);
  if (p) RENDER.selecionarPaciente(p.id);
}
function saveEvolucao() { RENDER.salvarEvolucao(); }
function salvarNovoPaciente() { RENDER.salvarNovoPaciente(); }
function salvarAgendamento() { RENDER.salvarAgendamento(); }
function finPacienteChanged() { RENDER.finPacienteChanged(); }
function agPacienteChanged() {
  const nome = document.getElementById('ag-pac')?.value;
  const p = DB.getPacienteByNome(nome);
  if (!p) return;
  const recVal = document.getElementById('rec-valor');
  if (recVal) { recVal.value = p.valorSessao; if(typeof calcularPreview==='function') calcularPreview(); }
  let info = document.getElementById('ag-valor-info');
  if (!info) { info = document.createElement('div'); info.id='ag-valor-info'; info.style.cssText='font-size:11px;color:var(--teal);margin-top:4px'; document.getElementById('ag-pac')?.parentElement?.appendChild(info); }
  info.innerHTML = `<i class="ti ti-coin" style="font-size:13px"></i> Valor configurado: <strong>${DB.fmtMoeda(p.valorSessao)}/sessão</strong>`;
}

// ════════════════════════════════════════════════════════
// INICIALIZAÇÃO — roda tudo quando o DOM estiver pronto
// ════════════════════════════════════════════════════════
// Inicialização movida para main.js

// Chamado ao trocar de view
RENDER._onViewChange = function(view) {
  if (view === 'dashboard')   { RENDER.dashboard(); }
  if (view === 'agenda')      { RENDER.agenda(); }
  if (view === 'prontuario')  { RENDER.prontuario(); }
  if (view === 'alertas')     { RENDER.alertasFull(); RENDER.calendarioVenc(); }
  if (view === 'financeiro')  { RENDER.financeiro(); }
  if (view === 'whatsapp')    { RENDER.wppSelects(); }
  if (view === 'relatorios')  { RENDER.relatorios && RENDER.relatorios(); }
};

// renderAlerts definido em main.js

// WPP definido em alertas.js
