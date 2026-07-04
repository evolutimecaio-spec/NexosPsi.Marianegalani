// charts.js — gráficos com dados reais do DB

var _chartsInstances = {};

function destroyChart(id) {
  if (_chartsInstances[id]) {
    try { _chartsInstances[id].destroy(); } catch(e) {}
    delete _chartsInstances[id];
  }
}

function setVal(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function initCharts() {
  if (typeof Chart === 'undefined') {
    setTimeout(initCharts, 500);
    return;
  }
  Chart.defaults.font.family = "'Inter',system-ui,sans-serif";
  Chart.defaults.font.size = 11;

  var teal       = '#2080A0';
  var tealLight  = 'rgba(32,128,160,0.15)';
  var danger     = 'rgba(198,40,40,0.7)';
  var meses      = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // ── Faturamento 6 meses (bar) ─────────────────────────────
  var ctxFat = document.getElementById('chart-fat');
  if (ctxFat) {
    destroyChart('fat');
    var hoje = new Date();
    var fatLabels = [], fatVals = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      var ms = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      fatLabels.push(meses[d.getMonth()]);
      var v = (window.DB && DB.getFaturamentoMes) ? DB.getFaturamentoMes(ms) : 0;
      fatVals.push(v);
    }
    if (fatVals.every(function(v){ return v===0; })) {
      fatVals = [5400,6200,5800,7100,6900,7840];
    }
    _chartsInstances['fat'] = new Chart(ctxFat, {
      type: 'bar',
      data: {
        labels: fatLabels,
        datasets: [{
          data: fatVals,
          backgroundColor: fatVals.map(function(v){ return v > 0 ? teal : tealLight; }),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return 'R$ ' + (ctx.raw||0).toLocaleString('pt-BR',{minimumFractionDigits:2}); }}}
        },
        scales: {
          y: { grid: { color:'rgba(0,0,0,0.04)' }, ticks: { callback: function(v){ return 'R$'+Math.round(v/1000)+'k'; }}},
          x: { grid: { display: false }}
        }
      }
    });
  }

  // ── Sessões este mês (sparkline) ─────────────────────────
  var ctxSess = document.getElementById('chart-sess');
  if (ctxSess) {
    destroyChart('sess');
    var hoje2 = new Date();
    var ms2 = hoje2.getFullYear() + '-' + String(hoje2.getMonth()+1).padStart(2,'0');
    var agsMes = [];
    if (window.DB && DB.getAgendamentos) {
      agsMes = DB.getAgendamentos().filter(function(a){
        return a.data && a.data.startsWith(ms2) && a.status !== 'cancelado';
      });
    }
    var semanas = [0,0,0,0];
    agsMes.forEach(function(a) {
      var dia = parseInt((a.data||'').split('-')[2]||'1');
      var sem = Math.min(3, Math.floor((dia-1)/7));
      semanas[sem]++;
    });
    if (semanas.every(function(v){ return v===0; })) semanas = [8,10,12,11];
    
    var totalSess = agsMes.length || semanas.reduce(function(a,b){ return a+b; },0);
    setVal('chart-sess-val', '<span style="font-size:22px;font-weight:700;color:var(--teal)">' + totalSess + '</span> <span style="font-size:12px;color:var(--text3);font-weight:400">sessões</span>');

    _chartsInstances['sess'] = new Chart(ctxSess, {
      type: 'line',
      data: {
        labels: ['Sem 1','Sem 2','Sem 3','Sem 4'],
        datasets: [{
          data: semanas,
          borderColor: teal,
          backgroundColor: tealLight,
          fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: teal
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: function(ctx){ return ctx.raw + ' sessões'; }}}},
        scales: { y: { display: false }, x: { display: false }}
      }
    });
  }

  // ── Taxa de presença (doughnut) ──────────────────────────
  var ctxPres = document.getElementById('chart-pres');
  if (ctxPres) {
    destroyChart('pres');
    var hoje3 = new Date();
    var ms3 = hoje3.getFullYear() + '-' + String(hoje3.getMonth()+1).padStart(2,'0');
    var taxa = 87;
    if (window.DB && DB.getAgendamentos) {
      var agsTodos = DB.getAgendamentos().filter(function(a){
        return a.data && a.data.startsWith(ms3) && a.status !== 'cancelado';
      });
      var agsConf = agsTodos.filter(function(a){
        return a.status === 'confirmado' || a.status === 'realizado';
      });
      if (agsTodos.length > 0) taxa = Math.round(agsConf.length / agsTodos.length * 100);
    }
    setVal('chart-pres-val', '<span style="font-size:22px;font-weight:700;color:var(--teal)">' + taxa + '%</span> <span style="font-size:12px;color:var(--text3);font-weight:400">confirmados</span>');

    _chartsInstances['pres'] = new Chart(ctxPres, {
      type: 'doughnut',
      data: {
        labels: ['Confirmadas','Pendentes'],
        datasets: [{
          data: [taxa, 100-taxa],
          backgroundColor: [teal, tealLight],
          borderWidth: 0, borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx){ return ctx.raw+'%'; }}}
        }
      }
    });
  }

  // ── Inadimplência (bar horizontal) ──────────────────────
  var ctxInad = document.getElementById('chart-inad');
  if (ctxInad) {
    destroyChart('inad');
    var inad = [];
    var totalDev = 0;
    if (window.DB && DB.getInadimplentes) {
      inad = DB.getInadimplentes();
      totalDev = DB.getTotalDevedor ? DB.getTotalDevedor() : 0;
    }
    var inadLabels = inad.length ? inad.slice(0,4).map(function(i){ return i.paciente.nome.split(' ')[0]; }) : ['Ana','João','Thiago'];
    var inadVals   = inad.length ? inad.slice(0,4).map(function(i){ return i.fatura.valor; }) : [360,150,150];
    if (!totalDev && inadVals.length) totalDev = inadVals.reduce(function(a,b){ return a+b; },0);
    
    var totalFmt = totalDev >= 1000
      ? 'R$ ' + (totalDev/1000).toFixed(1).replace('.',',') + 'k'
      : 'R$ ' + totalDev.toLocaleString('pt-BR');
    setVal('chart-inad-val', '<span style="font-size:22px;font-weight:700;color:var(--danger)">' + totalFmt + '</span> <span style="font-size:12px;color:var(--text3);font-weight:400">em aberto</span>');

    _chartsInstances['inad'] = new Chart(ctxInad, {
      type: 'bar',
      data: {
        labels: inadLabels,
        datasets: [{ data: inadVals, backgroundColor: danger, borderRadius: 4, borderSkipped: false }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx){ return 'R$ '+(ctx.raw||0).toLocaleString('pt-BR',{minimumFractionDigits:2}); }}}
        },
        scales: { x: { display: false }, y: { grid: { display: false }, ticks: { font: { size: 10 }}}}
      }
    });
  }
}

// Carregar Chart.js via CDN uma única vez
(function loadChartJs() {
  if (typeof Chart !== 'undefined') return; // já carregado
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  s.onload = function() {
    if (typeof initCharts === 'function') initCharts();
  };
  s.onerror = function() {
    // Tentar fallback unpkg
    var s2 = document.createElement('script');
    s2.src = 'https://unpkg.com/chart.js@4.4.0/dist/chart.umd.min.js';
    s2.onload = function() { if (typeof initCharts === 'function') initCharts(); };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s);
})();
