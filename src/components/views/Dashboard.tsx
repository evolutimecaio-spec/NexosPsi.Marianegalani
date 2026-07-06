'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { fmtMoeda, calcIdade, getLocal } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { Empty } from '@/components/ui'

function Skel({ h = 20, w = '100%' }: { h?: number; w?: string }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'linear-gradient(90deg,var(--border) 25%,var(--warm) 50%,var(--border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />
}

export default function Dashboard() {
  const router = useRouter()
  const { metrics, inad, pronto } = useStore()

  const [bdays, setBdays]     = useState<any[]>([])
  const MESES_NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const fatMesesInicial = Array.from({ length: 5 }, (_, i) => {
    const hoje = new Date()
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (4 - i), 1)
    return { mes: MESES_NOMES[d.getMonth()], valor: 0 }
  })
  const [fatMeses, setFatMeses] = useState<{ mes: string; valor: number }[]>(fatMesesInicial)

  useEffect(() => {
    if (!pronto) return
    DB.getAniversariantesSemana().then(setBdays).catch(() => {})
    const hoje2 = new Date()
    Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const d = new Date(hoje2.getFullYear(), hoje2.getMonth() - (4 - i), 1)
        const ms = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
        return DB.getFaturamentoMes(ms).then(v => ({ mes: MESES_NOMES[d.getMonth()], valor: v }))
      })
    ).then(setFatMeses).catch(() => {})
  }, [pronto])

  const meta = CONFIG.financeiro.metaMensalFaturamento
  const pct  = metrics ? Math.min(100, Math.round(metrics.faturamentoMes / meta * 100)) : 0

  const statusTag = (s: string) => {
    const map: Record<string,string> = { confirmado:'tag-confirmado', realizado:'tag-realizado', agendado:'tag-agendado', aguardando:'tag-aguardando', cancelado:'tag-cancelado' }
    const lbl: Record<string,string> = { confirmado:'Confirmou', realizado:'Realizado', agendado:'Agendado', aguardando:'Aguardando', cancelado:'Cancelado' }
    return <span className={`tag ${map[s]||'tag-agendado'}`}>{lbl[s]||s}</span>
  }

  if (!pronto) return (
    <div>
      <div className="metrics">
        {[0,1,2,3].map(i=><div key={i} className="metric"><Skel h={10} w="60%"/><div style={{height:6}}/><Skel h={30} w="45%"/><div style={{height:4}}/><Skel h={10} w="75%"/></div>)}
      </div>
      <div className="g2"><div className="card"><Skel h={170}/></div><div className="card"><Skel h={170}/></div></div>
    </div>
  )

  return (
    <div>
      <div className="metrics">
        <div className="metric accent-teal">
          <div className="metric-label">Sessões hoje</div>
          <div className="metric-value">{metrics?.sessoesHoje ?? 0}</div>
          <div className="metric-sub">{metrics?.confirmados ?? 0} confirmadas</div>
        </div>
        <div className="metric">
          <div className="metric-label">Sessões no mês</div>
          <div className="metric-value">{metrics?.totalSessoesMes ?? 0}</div>
          <div className="metric-sub">agendadas + realizadas</div>
        </div>
        <div className="metric accent-green">
          <div className="metric-label">Faturado no mês</div>
          <div className="metric-value" style={{fontSize:20}}>{fmtMoeda(metrics?.faturamentoMes)}</div>
          <div style={{marginTop:6,height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:'var(--success)',borderRadius:3,transition:'width 0.5s'}}/>
          </div>
          <div className="metric-sub" style={{marginTop:4}}>{pct}% da meta</div>
        </div>
        <div className="metric accent-red">
          <div className="metric-label">Inadimplência</div>
          <div className="metric-value" style={{fontSize:20,color:'var(--danger)'}}>{fmtMoeda(metrics?.totalDevedor)}</div>
          <div className="metric-sub">{inad.length} paciente(s)</div>
        </div>
      </div>

      <div className="g2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-title"><i className="ti ti-chart-bar"/>Faturamento — últimos 5 meses</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={fatMeses} margin={{top:4,right:4,bottom:0,left:0}}>
              <Bar dataKey="valor" fill="var(--teal)" radius={[4,4,0,0]}/>
              <Tooltip formatter={(v) => fmtMoeda(Number(v))} labelFormatter={String}/>
            </BarChart>
          </ResponsiveContainer>
          {fatMeses.every(m => m.valor === 0) && (
            <div style={{textAlign:'center',fontSize:11,color:'var(--text3)',marginTop:6}}>
              Sem faturamento registrado ainda. Registre pagamentos para ver o gráfico.
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-calendar-today"/>Agenda de hoje</div>
          {!metrics?.agHoje.length
            ? <Empty icon="calendar-off" msg="Nenhuma sessão hoje"/>
            : metrics.agHoje.map(ag => {
                const pac = ag.paciente as any || {}
                return (
                  <div key={ag.id} className="session-item"
                    onClick={()=>router.push(`/prontuario?id=${ag.paciente_id}`)}>
                    <div className="si-time">{ag.hora}</div>
                    <div><div className="si-name">{pac.nome||'?'}</div><div className="si-type">{ag.tipo}</div></div>
                    <div className="si-tags">
                      <span className={`tag tag-${ag.modalidade==='Online'?'online':'presencial'}`}>{ag.modalidade}</span>
                      {statusTag(ag.status)}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title" style={{color:'var(--danger)'}}><i className="ti ti-bell-ringing"/>Alertas financeiros</div>
          {!inad.length
            ? <div style={{fontSize:13,color:'var(--success)',display:'flex',alignItems:'center',gap:6}}><i className="ti ti-check"/>Em dia!</div>
            : inad.slice(0,4).map(({paciente,fatura,diasAtraso})=>(
                <div key={fatura.id} className="alert-row" style={{cursor:'pointer'}}
                  onClick={()=>router.push(`/prontuario?id=${paciente.id}`)}>
                  <div style={{flex:1}}>
                    <div className="alert-name">{paciente.nome}</div>
                    <div className="alert-msg">{diasAtraso}d em atraso · {fmtMoeda(fatura.valor)}</div>
                  </div>
                  {paciente.fone&&<a href={`https://wa.me/${paciente.fone}`} target="_blank" onClick={e=>e.stopPropagation()} className="btn btn-ghost btn-sm"><i className="ti ti-brand-whatsapp"/></a>}
                </div>
              ))
          }
          {inad.length>0&&<button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={()=>router.push('/alertas')}>Ver todos <i className="ti ti-arrow-right"/></button>}
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-cake"/>Aniversariantes esta semana</div>
          {bdays.length===0
            ? <div style={{fontSize:13,color:'var(--text3)'}}>Nenhum aniversariante.</div>
            : bdays.map(({paciente,diasAte})=>(
                <div key={paciente.id} className="bday-item">
                  <div className="bday-av" style={{background:getLocal(paciente.local_id)?.cor||'var(--teal)'}}>{paciente.avatar||paciente.nome?.slice(0,2)}</div>
                  <div style={{flex:1}}><div className="bday-name">{paciente.nome}</div><div className="bday-age">{calcIdade(paciente.nascimento)} anos</div></div>
                  {diasAte===0&&<span className="badge b-red">🎂 Hoje</span>}
                  {diasAte===1&&<span style={{fontSize:11,color:'var(--warn)',fontWeight:600}}>Amanhã</span>}
                  {diasAte>1&&<span style={{fontSize:11,color:'var(--text3)'}}>{diasAte}d</span>}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
