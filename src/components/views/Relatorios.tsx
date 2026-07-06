'use client'
import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import { fmtData, fmtMoeda, getLocal } from '@/lib/db'

type Periodo = 'mes-atual'|'mes-anterior'|'ultimos-3'|'ano'|'tudo'

function getPeriodo(p: Periodo) {
  const hoje = new Date()
  const mes = hoje.getMonth(), ano = hoje.getFullYear()
  const fmt = (d: Date) => d.toISOString().slice(0,10)
  if (p==='mes-atual')    return { ini:`${ano}-${String(mes+1).padStart(2,'0')}-01`, fim:fmt(hoje) }
  if (p==='mes-anterior') { const d=new Date(ano,mes-1,1); return { ini:fmt(d), fim:fmt(new Date(ano,mes,0)) } }
  if (p==='ultimos-3')    return { ini:fmt(new Date(ano,mes-2,1)), fim:fmt(hoje) }
  if (p==='ano')          return { ini:`${ano}-01-01`, fim:fmt(hoje) }
  return { ini:'2020-01-01', fim:fmt(hoje) }
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('mes-atual')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [ags, setAgs]  = useState<any[]>([])
  const [inad, setInad] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const { ini, fim } = getPeriodo(periodo)
    const [a, i] = await Promise.all([DB.getAgendamentos({dataIni:ini,dataFim:fim}), DB.getInadimplentes()])
    setAgs(a); setInad(i); setLoading(false)
  }, [periodo])

  useEffect(()=>{ load() },[load])

  const filtrados = filtroLocal ? ags.filter(a=>(a.local_id || a.paciente?.local_id)===filtroLocal) : ags
  const faturado  = filtrados.filter(a=>a.pago).reduce((s:number,a:any)=>s+Number(a.valor_sessao),0)
  const pendente  = filtrados.filter(a=>!a.pago).reduce((s:number,a:any)=>s+Number(a.valor_sessao),0)
  const pacs      = new Set(filtrados.map((a:any)=>a.paciente_id)).size

  // Agrupar por mês para gráfico
  const porMes: Record<string,{faturado:number;pendente:number}> = {}
  filtrados.forEach((a:any) => {
    const m = a.data?.slice(0,7)||''; if(!m) return
    if(!porMes[m]) porMes[m]={faturado:0,pendente:0}
    if(a.pago) porMes[m].faturado+=Number(a.valor_sessao)
    else       porMes[m].pendente+=Number(a.valor_sessao)
  })
  const chartData = Object.entries(porMes).sort().map(([m,v])=>({mes:m.slice(5),faturado:v.faturado,pendente:v.pendente}))

  // Por local
  const porLocal: Record<string,number> = {}
  filtrados.forEach((a:any)=>{ const lid=a.local_id||a.paciente?.local_id||'outros'; porLocal[lid]=(porLocal[lid]||0)+1 })
  const localData = Object.entries(porLocal).map(([lid,v])=>({name:getLocal(lid)?.nome||lid,value:v,cor:getLocal(lid)?.cor||'#888'}))

  // Por paciente
  const porPac: Record<string,{nome:string;sessoes:number;faturado:number;pendente:number}> = {}
  filtrados.forEach((a:any)=>{
    const id=a.paciente_id; const nome=(a.paciente as any)?.nome||'?'
    if(!porPac[id]) porPac[id]={nome,sessoes:0,faturado:0,pendente:0}
    porPac[id].sessoes++
    if(a.pago) porPac[id].faturado+=Number(a.valor_sessao)
    else       porPac[id].pendente+=Number(a.valor_sessao)
  })

  const exportCSV = (rows: string[][], headers: string[], fname: string) => {
    const BOM = '\uFEFF'
    const csv = BOM + [headers, ...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download=fname; a.click()
    toast('Exportado!')
  }

  const exportFinanceiro = () => {
    const rows = filtrados.sort((a,b)=>a.data.localeCompare(b.data)).map((a:any)=>[
      fmtData(a.data),(a.paciente as any)?.nome||'?',a.tipo,a.modalidade,
      fmtMoeda(a.valor_sessao),a.pago?'Pago':'Pendente',getLocal(a.local_id||(a.paciente as any)?.local_id)?.nome||''
    ])
    exportCSV(rows,['Data','Paciente','Tipo','Modalidade','Valor','Status','Local'],`nexopsi-financeiro-${new Date().toISOString().slice(0,10)}.csv`)
  }

  const exportInad = () => {
    const rows = inad.map(({paciente,fatura,diasAtraso})=>[
      paciente.nome,fmtData(fatura.vencimento),`${diasAtraso}d`,fmtMoeda(fatura.valor),fatura.status
    ])
    exportCSV(rows,['Paciente','Vencimento','Atraso','Valor','Status'],`nexopsi-inad-${new Date().toISOString().slice(0,10)}.csv`)
  }

  const imprimirFinanceiro = () => {
    const total = filtrados.reduce((s:number,a:any)=>s+Number(a.valor_sessao),0)
    const win = window.open('','_blank')!
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro</title><style>body{font-family:Arial;padding:40px;font-size:13px}table{width:100%;border-collapse:collapse}th{background:#E8F4F8;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}.total{font-weight:700;background:#F0F8FA}</style></head><body><h1 style="color:#1E3654">Relatório Financeiro — NexxoPsi</h1><p style="color:#666">Emitido em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</p><table><thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead><tbody>${filtrados.sort((a,b)=>a.data.localeCompare(b.data)).map((a:any)=>`<tr><td>${fmtData(a.data)}</td><td>${(a.paciente as any)?.nome||'?'}</td><td>${a.tipo}</td><td>${fmtMoeda(a.valor_sessao)}</td><td style="color:${a.pago?'#2E7D32':'#C62828'}">${a.pago?'Pago':'Pendente'}</td></tr>`).join('')}<tr class="total"><td colspan="3">Total</td><td>${fmtMoeda(total)}</td><td>${fmtMoeda(faturado)} recebido</td></tr></tbody></table></body></html>`)
    win.document.close(); setTimeout(()=>win.print(),300)
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div><div style={{fontSize:18,fontWeight:700}}>Relatórios & Exportações</div><div style={{fontSize:13,color:'var(--text3)'}}>Extraia dados do sistema em PDF ou Excel</div></div>
        <div style={{display:'flex',gap:8}}>
          <select value={periodo} onChange={e=>setPeriodo(e.target.value as Periodo)} style={{border:'1px solid var(--border)',borderRadius:8,padding:'7px 12px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
            <option value="mes-atual">Mês atual</option>
            <option value="mes-anterior">Mês anterior</option>
            <option value="ultimos-3">Últimos 3 meses</option>
            <option value="ano">Ano atual</option>
            <option value="tudo">Todos os registros</option>
          </select>
          <select value={filtroLocal} onChange={e=>setFiltroLocal(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:8,padding:'7px 12px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
            <option value="">Todos os locais</option>
            <option value="unimed">🏥 Unimed</option>
            <option value="aquarela">🏡 Aquarela</option>
            <option value="ceped">🏢 CEPED</option>
          </select>
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics" style={{marginBottom:20}}>
        <div className="metric c-sage"><div className="metric-label">Sessões</div><div className="metric-value">{filtrados.length}</div></div>
        <div className="metric"><div className="metric-label">Faturamento</div><div className="metric-value" style={{fontSize:20}}>{fmtMoeda(faturado)}</div></div>
        <div className="metric c-red"><div className="metric-label">Inadimplência</div><div className="metric-value" style={{fontSize:20,color:'var(--danger)'}}>{fmtMoeda(inad.reduce((s,i)=>s+Number(i.fatura.valor),0))}</div></div>
        <div className="metric"><div className="metric-label">Pacientes</div><div className="metric-value">{pacs}</div></div>
      </div>

      <div className="g2">
        {/* Financeiro */}
        <div className="card">
          <div className="card-title"><i className="ti ti-file-invoice"/>Relatório financeiro</div>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="mes" fontSize={11}/>
                <YAxis tickFormatter={(v) => `R$${v/1000}k`} fontSize={10}/>
                <Tooltip formatter={(v) => fmtMoeda(Number(v))}/>
                <Legend/>
                <Bar dataKey="faturado" name="Recebido" fill="var(--teal)" radius={[4,4,0,0]}/>
                <Bar dataKey="pendente" name="Pendente" fill="rgba(198,40,40,0.6)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{maxHeight:200,overflowY:'auto',marginTop:8}}>
            <table className="rel-table"><thead><tr><th>Mês</th><th>Sessões</th><th>Faturado</th><th>Pendente</th></tr></thead>
              <tbody>{Object.entries(Object.entries(porMes).sort().reduce((acc,[m,v])=>({...acc,[m]:v}),{} as typeof porMes)).map(([m,v]:[string,any])=>(
                <tr key={m}><td>{m}</td><td>{filtrados.filter(a=>a.data?.startsWith(m)).length}</td><td style={{color:'var(--success)'}}>{fmtMoeda(v.faturado)}</td><td style={{color:'var(--danger)'}}>{v.pendente>0?fmtMoeda(v.pendente):'—'}</td></tr>
              ))}</tbody>
              <tfoot><tr><td>Total</td><td>{filtrados.length}</td><td style={{color:'var(--success)'}}>{fmtMoeda(faturado)}</td><td style={{color:'var(--danger)'}}>{fmtMoeda(pendente)}</td></tr></tfoot>
            </table>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn btn-sage btn-sm" style={{flex:1,justifyContent:'center'}} onClick={exportFinanceiro}><i className="ti ti-download"/>Excel</button>
            <button className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}} onClick={imprimirFinanceiro}><i className="ti ti-printer"/>PDF</button>
          </div>
        </div>

        {/* Por paciente */}
        <div className="card">
          <div className="card-title"><i className="ti ti-clipboard-list"/>Por paciente</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            <table className="rel-table"><thead><tr><th>Paciente</th><th>Sessões</th><th>Faturado</th><th>Pendente</th></tr></thead>
              <tbody>{Object.entries(porPac).sort((a,b)=>b[1].sessoes-a[1].sessoes).map(([id,d])=>(
                <tr key={id}><td style={{fontWeight:500}}>{d.nome}</td><td style={{textAlign:'center'}}>{d.sessoes}</td><td style={{color:'var(--success)'}}>{fmtMoeda(d.faturado)}</td><td style={{color:d.pendente>0?'var(--danger)':'var(--text3)'}}>{d.pendente>0?fmtMoeda(d.pendente):'—'}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" style={{marginTop:12}} onClick={()=>{
            const rows=Object.entries(porPac).map(([,d])=>[d.nome,String(d.sessoes),fmtMoeda(d.faturado),fmtMoeda(d.pendente)])
            exportCSV(rows,['Paciente','Sessões','Faturado','Pendente'],`nexopsi-pacs-${new Date().toISOString().slice(0,10)}.csv`)
          }}><i className="ti ti-download"/>Exportar Excel</button>
        </div>

        {/* Por local */}
        <div className="card">
          <div className="card-title"><i className="ti ti-map-pin"/>Por local</div>
          {localData.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={localData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${((percent??0)*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {localData.map((l,i)=><Cell key={i} fill={l.cor}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inadimplência */}
        <div className="card">
          <div className="card-title"><i className="ti ti-alert-triangle"/>Inadimplência</div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            {!inad.length ? <div style={{fontSize:13,color:'var(--success)',padding:12}}><i className="ti ti-check"/>Sem inadimplência!</div>
            : <table className="rel-table"><thead><tr><th>Paciente</th><th>Venc.</th><th>Atraso</th><th>Valor</th></tr></thead>
                <tbody>{inad.map(({paciente,fatura,diasAtraso})=>(
                  <tr key={fatura.id}><td style={{fontWeight:500,color:'var(--teal)'}}>{paciente.nome}</td><td>{fmtData(fatura.vencimento)}</td><td style={{color:'var(--danger)',fontWeight:600}}>{diasAtraso}d</td><td style={{color:'var(--danger)',fontWeight:700}}>{fmtMoeda(fatura.valor)}</td></tr>
                ))}</tbody>
              </table>
            }
          </div>
          <button className="btn btn-ghost btn-sm btn-full" style={{marginTop:12}} onClick={exportInad}><i className="ti ti-download"/>Exportar Excel</button>
        </div>
      </div>
    </div>
  )
}
