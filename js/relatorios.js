// relatorios.js — Relatórios, exportações e filtros globais

// ══════════════════════════════════════════════════════════
// HELPERS DE PERÍODO
// ══════════════════════════════════════════════════════════
function getPeriodoFiltro() {
  const sel = document.getElementById('rel-periodo')?.value || 'mes-atual';
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  switch(sel) {
    case 'mes-atual':
      return { ini: `${ano}-${String(mes+1).padStart(2,'0')}-01`, fim: hoje.toISOString().slice(0,10) };
    case 'mes-anterior': {
      const d = new Date(ano, mes-1, 1);
      const last = new Date(ano, mes, 0);
      return { ini: d.toISOString().slice(0,10), fim: last.toISOString().slice(0,10) };
    }
    case 'ultimos-3': {
      const d = new Date(ano, mes-2, 1);
      return { ini: d.toISOString().slice(0,10), fim: hoje.toISOString().slice(0,10) };
    }
    case 'ano':
      return { ini: `${ano}-01-01`, fim: hoje.toISOString().slice(0,10) };
    default:
      return { ini: '2020-01-01', fim: hoje.toISOString().slice(0,10) };
  }
}

function getAgsFiltrados() {
  const { ini, fim } = getPeriodoFiltro();
  const localFiltro = document.getElementById('rel-local')?.value || '';
  let ags = DB.getAgendamentos().filter(a => a.data >= ini && a.data <= fim && a.status !== 'cancelado');
  if (localFiltro) {
    ags = ags.filter(a => {
      const pac = DB.getPaciente(a.pacienteId);
      return pac && (a.local || pac.local) === localFiltro;
    });
  }
  return ags;
}

// ══════════════════════════════════════════════════════════
// RENDER RELATÓRIOS
// ══════════════════════════════════════════════════════════
var REL = {

  render() {
    const ags = getAgsFiltrados();
    const pacs = new Set(ags.map(a => a.pacienteId));
    const faturado = ags.filter(a=>a.pago).reduce((s,a)=>s+(a.valorSessao||0),0);
    const inad = DB.getTotalDevedor();

    // Métricas
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('rel-m-sessoes', ags.length);
    set('rel-m-fat', DB.fmtMoeda(faturado));
    set('rel-m-inad', DB.fmtMoeda(inad));
    set('rel-m-pacs', pacs.size);

    this._renderFatTable(ags);
    this._renderAtendTable(ags);
    this._renderInadTable();
    this._renderLocalTable(ags);
    this._renderCharts(ags);
  },

  _renderFatTable(ags) {
    const el = document.getElementById('rel-fat-table');
    if (!el) return;
    // Agrupar por mês
    const porMes = {};
    ags.forEach(a => {
      const mes = a.data.slice(0,7);
      if (!porMes[mes]) porMes[mes] = { sessoes:0, faturado:0, pendente:0 };
      porMes[mes].sessoes++;
      if (a.pago) porMes[mes].faturado += a.valorSessao||0;
      else        porMes[mes].pendente  += a.valorSessao||0;
    });
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--teal-light)">
        <th style="padding:7px 10px;text-align:left;color:var(--teal)">Mês</th>
        <th style="padding:7px 10px;text-align:right;color:var(--teal)">Sessões</th>
        <th style="padding:7px 10px;text-align:right;color:var(--teal)">Faturado</th>
        <th style="padding:7px 10px;text-align:right;color:var(--teal)">Pendente</th>
      </tr></thead>
      <tbody>${Object.entries(porMes).sort().map(([mes,d]) => {
        const [y,m] = mes.split('-');
        return `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:7px 10px;font-weight:500">${meses[parseInt(m)-1]}/${y.slice(2)}</td>
          <td style="padding:7px 10px;text-align:right">${d.sessoes}</td>
          <td style="padding:7px 10px;text-align:right;color:var(--success);font-weight:600">${DB.fmtMoeda(d.faturado)}</td>
          <td style="padding:7px 10px;text-align:right;color:var(--danger)">${d.pendente>0?DB.fmtMoeda(d.pendente):'—'}</td>
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr style="border-top:2px solid var(--border);font-weight:700">
        <td style="padding:8px 10px">Total</td>
        <td style="padding:8px 10px;text-align:right">${ags.length}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--success)">${DB.fmtMoeda(ags.filter(a=>a.pago).reduce((s,a)=>s+(a.valorSessao||0),0))}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--danger)">${DB.fmtMoeda(ags.filter(a=>!a.pago).reduce((s,a)=>s+(a.valorSessao||0),0))}</td>
      </tr></tfoot>
    </table>`;
  },

  _renderAtendTable(ags) {
    const el = document.getElementById('rel-atend-table');
    if (!el) return;
    const porPac = {};
    ags.forEach(a => {
      if (!porPac[a.pacienteId]) porPac[a.pacienteId] = { sessoes:0, pago:0, pendente:0 };
      porPac[a.pacienteId].sessoes++;
      if (a.pago) porPac[a.pacienteId].pago += a.valorSessao||0;
      else        porPac[a.pacienteId].pendente += a.valorSessao||0;
    });
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--teal-light)">
        <th style="padding:7px 10px;text-align:left;color:var(--teal)">Paciente</th>
        <th style="padding:7px 10px;text-align:center;color:var(--teal)">Sessões</th>
        <th style="padding:7px 10px;text-align:right;color:var(--teal)">Faturado</th>
        <th style="padding:7px 10px;text-align:right;color:var(--teal)">Pendente</th>
      </tr></thead>
      <tbody>${Object.entries(porPac).sort((a,b)=>b[1].sessoes-a[1].sessoes).map(([pacId,d]) => {
        const pac = DB.getPaciente(pacId);
        const loc = pac ? DB.getLocal(pac.local) : null;
        const locBadge = loc ? `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${loc.cor}22;color:${loc.cor};margin-left:4px">${loc.nome}</span>` : '';
        return `<tr style="border-bottom:1px solid var(--border);cursor:pointer" onclick="RENDER.irParaPaciente('${pacId}')">
          <td style="padding:7px 10px;font-weight:500">${pac?.nome||pacId}${locBadge}</td>
          <td style="padding:7px 10px;text-align:center">${d.sessoes}</td>
          <td style="padding:7px 10px;text-align:right;color:var(--success)">${DB.fmtMoeda(d.pago)}</td>
          <td style="padding:7px 10px;text-align:right;color:${d.pendente>0?'var(--danger)':'var(--text3)'}">${d.pendente>0?DB.fmtMoeda(d.pendente):'—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  _renderInadTable() {
    const el = document.getElementById('rel-inad-table');
    if (!el) return;
    const inad = DB.getInadimplentes();
    if (!inad.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--success);font-size:13px"><i class="ti ti-check"></i> Nenhuma inadimplência!</div>';
      return;
    }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#FFEBEE">
        <th style="padding:7px 10px;text-align:left;color:var(--danger)">Paciente</th>
        <th style="padding:7px 10px;text-align:center;color:var(--danger)">Vencimento</th>
        <th style="padding:7px 10px;text-align:center;color:var(--danger)">Atraso</th>
        <th style="padding:7px 10px;text-align:right;color:var(--danger)">Valor</th>
        <th style="padding:7px 10px;color:var(--danger)">Ação</th>
      </tr></thead>
      <tbody>${inad.map(({paciente,fatura,diasAtraso}) => {
        const fone = paciente.fone||'';
        const cfg = window._NEXOPSI_CONFIG;
        const pix = cfg?.financeiro?.chavePix||'';
        const msg = `Olá, ${paciente.nome}! 🌿\n\nPassando para lembrar sobre o pagamento de ${DB.fmtMoeda(fatura.valor)} em aberto.\n\nPIX: *${pix}*\n\nObrigada! 😊`;
        const url = fone ? `https://wa.me/${fone}?text=${encodeURIComponent(msg)}` : '#';
        return `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:7px 10px;font-weight:500;cursor:pointer;color:var(--teal)" onclick="RENDER.irParaPaciente('${paciente.id}')">${paciente.nome}</td>
          <td style="padding:7px 10px;text-align:center">${DB.fmtData(fatura.vencimento)}</td>
          <td style="padding:7px 10px;text-align:center;color:var(--danger);font-weight:600">${diasAtraso}d</td>
          <td style="padding:7px 10px;text-align:right;color:var(--danger);font-weight:700">${DB.fmtMoeda(fatura.valor)}</td>
          <td style="padding:7px 10px"><a href="${url}" target="_blank" style="color:var(--success);font-size:11px;text-decoration:none;display:flex;align-items:center;gap:3px" onclick="logAlertSend('${paciente.nome}','cobranca')"><i class="ti ti-brand-whatsapp"></i> Cobrar</a></td>
        </tr>`;
      }).join('')}
      <tr style="border-top:2px solid var(--danger);font-weight:700;background:#FFF5F5">
        <td style="padding:8px 10px" colspan="3">Total em aberto</td>
        <td style="padding:8px 10px;text-align:right;color:var(--danger)">${DB.fmtMoeda(inad.reduce((s,i)=>s+i.fatura.valor,0))}</td>
        <td></td>
      </tr></tbody>
    </table>`;
  },

  _renderLocalTable(ags) {
    const el = document.getElementById('rel-local-table');
    if (!el) return;
    const porLocal = {};
    ags.forEach(a => {
      const pac = DB.getPaciente(a.pacienteId);
      const localId = a.local || pac?.local || 'outros';
      if (!porLocal[localId]) porLocal[localId] = { sessoes:0, faturado:0 };
      porLocal[localId].sessoes++;
      if (a.pago) porLocal[localId].faturado += a.valorSessao||0;
    });
    el.innerHTML = Object.entries(porLocal).map(([lid, d]) => {
      const loc = DB.getLocal(lid);
      const nome = loc?.nome || lid;
      const cor = loc?.cor || 'var(--teal)';
      const pct = ags.length > 0 ? Math.round(d.sessoes/ags.length*100) : 0;
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="width:10px;height:10px;border-radius:50%;background:${cor};flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500;color:var(--text)">${nome}</div>
          <div style="height:5px;background:var(--border);border-radius:3px;margin-top:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${cor};border-radius:3px"></div>
          </div>
        </div>
        <div style="text-align:right;min-width:80px">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${d.sessoes} sessões</div>
          <div style="font-size:11px;color:var(--text3)">${DB.fmtMoeda(d.faturado)}</div>
        </div>
      </div>`;
    }).join('') || '<div style="font-size:13px;color:var(--text3);padding:12px 0">Nenhum dado.</div>';
  },

  _relChartFat: null,
  _relChartLocal: null,

  _renderCharts(ags) {
    if (typeof Chart === 'undefined') return;
    // Chart faturamento por mês
    const ctxFat = document.getElementById('chart-rel-fat');
    if (ctxFat) {
      if (this._relChartFat) { this._relChartFat.destroy(); }
      const porMes = {};
      ags.forEach(a => {
        const mes = a.data.slice(0,7);
        if (!porMes[mes]) porMes[mes] = { pago:0, pendente:0 };
        if (a.pago) porMes[mes].pago += a.valorSessao||0;
        else porMes[mes].pendente += a.valorSessao||0;
      });
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const labels = Object.keys(porMes).sort().map(m => meses[parseInt(m.split('-')[1])-1]+'/'+m.slice(2,4));
      this._relChartFat = new Chart(ctxFat, {
        type:'bar',
        data:{ labels, datasets:[
          { label:'Recebido', data:Object.keys(porMes).sort().map(m=>porMes[m].pago), backgroundColor:'#2080A0', borderRadius:4 },
          { label:'Pendente', data:Object.keys(porMes).sort().map(m=>porMes[m].pendente), backgroundColor:'rgba(198,40,40,0.6)', borderRadius:4 }
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:11} }}},
          scales:{ x:{grid:{display:false}}, y:{ ticks:{ callback:v=>'R$'+v/1000+'k' }, grid:{color:'rgba(0,0,0,0.04)'}}}}
      });
    }
    // Chart por local
    const ctxLocal = document.getElementById('chart-rel-local');
    if (ctxLocal) {
      if (this._relChartLocal) { this._relChartLocal.destroy(); }
      const porLocal = {};
      ags.forEach(a => {
        const pac = DB.getPaciente(a.pacienteId);
        const lid = a.local || pac?.local || 'outros';
        porLocal[lid] = (porLocal[lid]||0) + 1;
      });
      const locais = Object.entries(porLocal);
      this._relChartLocal = new Chart(ctxLocal, {
        type:'doughnut',
        data:{ labels: locais.map(([lid]) => DB.getLocal(lid)?.nome || lid),
          datasets:[{ data: locais.map(([,v])=>v),
            backgroundColor: locais.map(([lid]) => DB.getLocal(lid)?.cor || '#888'),
            borderWidth:2, borderColor:'#fff' }]},
        options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
          plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:11}}}}}
      });
    }
  },

  // ══════════════════════════════════════════════════════════
  // EXPORTAÇÕES
  // ══════════════════════════════════════════════════════════

  _toCsv(rows, headers) {
    const esc = v => `"${String(v||'').replace(/"/g,'""')}"`;
    return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  },

  _download(content, filename, type='text/csv') {
    const BOM = type.includes('csv') ? '\uFEFF' : '';
    const blob = new Blob([BOM + content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  _print(titulo, htmlBody) {
    const win = window.open('', '_blank');
    const cfg = window._NEXOPSI_CONFIG;
    const nome = cfg?.psicologa?.nome || 'NexxoPsi';
    const crp = cfg?.psicologa?.crp || '';
    const data = new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'});
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        body{font-family:'Times New Roman',serif;font-size:13px;padding:40px;color:#222;max-width:800px;margin:0 auto}
        h1{font-size:18px;font-weight:700;color:#1E3654;margin-bottom:4px}
        .sub{font-size:12px;color:#666;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
        th{background:#E8F4F8;color:#1E3654;padding:8px 10px;text-align:left;border:1px solid #ccc}
        td{padding:7px 10px;border:1px solid #ddd}
        tr:nth-child(even) td{background:#F9FCFD}
        .total{font-weight:700;background:#F0F8FA}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ccc;font-size:11px;color:#666;display:flex;justify-content:space-between}
        @media print{@page{margin:20mm}}
      </style></head><body>
      <h1>${titulo}</h1>
      <div class="sub">${nome}${crp?' · CRP '+crp:''} · Emitido em ${data}</div>
      ${htmlBody}
      <div class="footer"><span>${nome}${crp?' · CRP '+crp:''}</span><span>NexxoPsi v1.0</span></div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  exportarFinanceiro() {
    const ags = getAgsFiltrados();
    const rows = ags.sort((a,b)=>a.data.localeCompare(b.data)).map(a => {
      const pac = DB.getPaciente(a.pacienteId);
      return [DB.fmtData(a.data), pac?.nome||'?', a.tipo, a.modal,
              DB.fmtMoeda(a.valorSessao||0), a.pago?'Pago':'Pendente',
              DB.getLocal(a.local||pac?.local)?.nome||''];
    });
    this._download(this._toCsv(rows, ['Data','Paciente','Tipo','Modalidade','Valor','Status','Local']),
      `nexopsi-financeiro-${new Date().toISOString().slice(0,10)}.csv`);
    if (typeof showToast==='function') showToast('Relatório financeiro exportado!');
  },

  exportarAtendimentos() {
    const ags = getAgsFiltrados();
    const porPac = {};
    ags.forEach(a => {
      if (!porPac[a.pacienteId]) porPac[a.pacienteId] = { sessoes:0, pago:0, pend:0 };
      porPac[a.pacienteId].sessoes++;
      if (a.pago) porPac[a.pacienteId].pago += a.valorSessao||0;
      else porPac[a.pacienteId].pend += a.valorSessao||0;
    });
    const rows = Object.entries(porPac).map(([pid,d]) => {
      const pac = DB.getPaciente(pid);
      return [pac?.nome||pid, d.sessoes, DB.fmtMoeda(d.pago), DB.fmtMoeda(d.pend),
              DB.getLocal(pac?.local)?.nome||''];
    });
    this._download(this._toCsv(rows, ['Paciente','Sessões','Faturado','Pendente','Local']),
      `nexopsi-atendimentos-${new Date().toISOString().slice(0,10)}.csv`);
    if (typeof showToast==='function') showToast('Relatório de atendimentos exportado!');
  },

  exportarInadimplencia() {
    const inad = DB.getInadimplentes();
    const rows = inad.map(({paciente,fatura,diasAtraso}) => [
      paciente.nome, DB.fmtData(fatura.vencimento), diasAtraso+'d',
      DB.fmtMoeda(fatura.valor), fatura.status,
      DB.getLocal(paciente.local)?.nome||''
    ]);
    this._download(this._toCsv(rows, ['Paciente','Vencimento','Atraso','Valor','Status','Local']),
      `nexopsi-inadimplencia-${new Date().toISOString().slice(0,10)}.csv`);
    if (typeof showToast==='function') showToast('Relatório de inadimplência exportado!');
  },

  exportarPorLocal() {
    const ags = getAgsFiltrados();
    const porLocal = {};
    ags.forEach(a => {
      const pac = DB.getPaciente(a.pacienteId);
      const lid = a.local || pac?.local || 'outros';
      if (!porLocal[lid]) porLocal[lid] = { sessoes:0, faturado:0 };
      porLocal[lid].sessoes++;
      if (a.pago) porLocal[lid].faturado += a.valorSessao||0;
    });
    const rows = Object.entries(porLocal).map(([lid,d]) => [
      DB.getLocal(lid)?.nome||lid, d.sessoes, DB.fmtMoeda(d.faturado)
    ]);
    this._download(this._toCsv(rows, ['Local','Sessões','Faturado']),
      `nexopsi-por-local-${new Date().toISOString().slice(0,10)}.csv`);
    if (typeof showToast==='function') showToast('Relatório por local exportado!');
  },

  imprimirFinanceiro() {
    const ags = getAgsFiltrados().sort((a,b)=>a.data.localeCompare(b.data));
    const total = ags.reduce((s,a)=>s+(a.valorSessao||0),0);
    const pago = ags.filter(a=>a.pago).reduce((s,a)=>s+(a.valorSessao||0),0);
    const tabela = `<table>
      <thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>${ags.map(a=>{const pac=DB.getPaciente(a.pacienteId);return`<tr>
        <td>${DB.fmtData(a.data)}</td><td>${pac?.nome||'?'}</td><td>${a.tipo}</td>
        <td>${DB.fmtMoeda(a.valorSessao||0)}</td>
        <td style="color:${a.pago?'#2E7D32':'#C62828'}">${a.pago?'Pago':'Pendente'}</td>
      </tr>`;}).join('')}
      <tr class="total"><td colspan="3">Total</td><td>${DB.fmtMoeda(total)}</td><td>${DB.fmtMoeda(pago)} recebido</td></tr>
      </tbody></table>`;
    this._print('Relatório Financeiro', tabela);
  },

  imprimirAtendimentos() {
    const ags = getAgsFiltrados();
    const porPac = {};
    ags.forEach(a => {
      if (!porPac[a.pacienteId]) porPac[a.pacienteId] = { sessoes:0, pago:0, pend:0 };
      porPac[a.pacienteId].sessoes++;
      if (a.pago) porPac[a.pacienteId].pago += a.valorSessao||0;
      else porPac[a.pacienteId].pend += a.valorSessao||0;
    });
    const tabela = `<table>
      <thead><tr><th>Paciente</th><th>Local</th><th>Sessões</th><th>Faturado</th><th>Pendente</th></tr></thead>
      <tbody>${Object.entries(porPac).sort((a,b)=>b[1].sessoes-a[1].sessoes).map(([pid,d])=>{
        const pac=DB.getPaciente(pid);
        return`<tr><td>${pac?.nome||pid}</td><td>${DB.getLocal(pac?.local)?.nome||'—'}</td>
          <td style="text-align:center">${d.sessoes}</td>
          <td style="color:#2E7D32">${DB.fmtMoeda(d.pago)}</td>
          <td style="color:${d.pend>0?'#C62828':'#999'}">${d.pend>0?DB.fmtMoeda(d.pend):'—'}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
    this._print('Relatório de Atendimentos por Paciente', tabela);
  },

  exportarRecibos() {
    if (typeof showToast==='function') showToast('Para gerar recibos individuais, use Financeiro → Gerar recibo.','info');
    if (window.NAV) NAV.go('financeiro');
  },
};

// Garantir acesso global
window.REL = REL;
// RENDER.relatorios será registrado pelo main.js após todos os scripts carregarem

// Atualizar quando período muda
document.addEventListener('DOMContentLoaded', () => {
  ['rel-periodo','rel-local'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => REL.render());
  });
});
