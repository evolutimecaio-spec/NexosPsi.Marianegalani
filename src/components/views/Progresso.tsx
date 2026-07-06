'use client'
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { fmtData, calcIdade, getLocal, fmtMoeda } from '@/lib/db'
import type { Paciente, Evolucao } from '@/types'
import { Empty } from '@/components/ui'
import { perfilLabel } from '@/lib/config-clinica'

function Skel({ h=20 }: { h?: number }) {
  return <div style={{height:h,borderRadius:6,background:'linear-gradient(90deg,var(--border) 25%,var(--warm) 50%,var(--border) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.2s infinite',marginBottom:8}}/>
}

export default function Progresso() {
  const { pacientes } = useStore()
  const [sel, setSel]       = useState<Paciente|null>(null)
  const [evs, setEvs]       = useState<Evolucao[]>([])
  const [ags, setAgs]       = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca]   = useState('')

  const selectPac = useCallback(async (p: Paciente) => {
    setSel(p); setLoading(true)
    try {
      const [e, a] = await Promise.all([
        DB.getEvolucoes(p.id),
        DB.getAgendamentos({ pacienteId: p.id }),
      ])
      setEvs(e); setAgs(a)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (pacientes.length > 0 && !sel) selectPac(pacientes[0])
  }, [pacientes])

  const filtrados = pacientes.filter(p => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()))

  // Calcular métricas
  const sessoesMes = (m: string) => ags.filter(a => a.data?.startsWith(m) && a.status !== 'cancelado').length
  const hoje = new Date()
  const meses = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  }).reverse()

  const TIPOS_EV = ['TCC','Psicodinâmico','TCC estruturado (ABC)','Texto livre']

  return (
    <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:14}}>
      {/* Lista */}
      <div>
        <input placeholder="Buscar paciente..." value={busca} onChange={e=>setBusca(e.target.value)} style={{marginBottom:10}}/>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {filtrados.map(p => {
            const loc = getLocal(p.local_id)
            return (
              <div key={p.id}
                onClick={()=>selectPac(p)}
                style={{
                  padding:'10px 12px',borderRadius:10,cursor:'pointer',
                  background: sel?.id===p.id ? 'var(--teal-light)' : 'var(--warm)',
                  border: `1px solid ${sel?.id===p.id ? 'var(--teal-mid)' : 'var(--border)'}`,
                  display:'flex',gap:10,alignItems:'center',
                }}>
                <div style={{width:34,height:34,borderRadius:'50%',background:loc?.cor||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {p.avatar||p.nome.slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{p.sessoes_total} sessões</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalhe */}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {!sel ? <div className="card"><Empty icon="chart-line" msg="Selecione um paciente"/></div> : <>

          {/* Header do paciente */}
          <div className="card">
            <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:getLocal(sel.local_id)?.cor||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                {sel.avatar||sel.nome.slice(0,2)}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:4}}>{sel.nome}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {sel.perfil.map(pf=><span key={pf} className="badge b-teal" style={{fontSize:10}}>{perfilLabel(pf)}</span>)}
                  {getLocal(sel.local_id)&&<span className="badge" style={{background:getLocal(sel.local_id)!.cor+'22',color:getLocal(sel.local_id)!.cor,fontSize:10}}>{getLocal(sel.local_id)!.nome}</span>}
                  {sel.cid&&<span className="badge" style={{background:'var(--warm)',color:'var(--text2)',fontSize:10}}>CID {sel.cid}</span>}
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:24,fontWeight:800,color:'var(--teal)'}}>{sel.sessoes_total}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>sessões totais</div>
              </div>
            </div>
          </div>

          {loading ? <><Skel h={120}/><Skel h={200}/></> : <>

          {/* Métricas mensais */}
          <div className="card">
            <div className="card-title"><i className="ti ti-chart-bar"/>Sessões por mês</div>
            <div style={{display:'flex',gap:10,alignItems:'flex-end',marginTop:8}}>
              {meses.map(m => {
                const cnt = sessoesMes(m)
                const maxCnt = Math.max(...meses.map(sessoesMes), 1)
                const pct = Math.round(cnt/maxCnt*100)
                const [ano, mes] = m.split('-')
                const nomeMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][+mes-1]
                return (
                  <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--teal)'}}>{cnt}</div>
                    <div style={{width:'100%',background:'var(--border)',borderRadius:4,overflow:'hidden',height:60,display:'flex',alignItems:'flex-end'}}>
                      <div style={{width:'100%',height:`${pct}%`,background:m===`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`?'var(--teal)':'var(--teal-mid)',transition:'height 0.4s',borderRadius:'4px 4px 0 0'}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{nomeMes}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Timeline de evoluções */}
          <div className="card">
            <div className="card-title"><i className="ti ti-timeline"/>Linha do tempo terapêutica</div>
            {evs.length === 0
              ? <Empty icon="notes" msg="Nenhuma evolução registrada ainda."/>
              : <div style={{position:'relative',paddingLeft:24}}>
                  <div style={{position:'absolute',left:8,top:0,bottom:0,width:2,background:'var(--border)',borderRadius:1}}/>
                  {evs.slice(0,15).map((ev, i) => (
                    <div key={ev.id} style={{position:'relative',marginBottom:16}}>
                      <div style={{
                        position:'absolute',left:-20,top:2,width:12,height:12,borderRadius:'50%',
                        background: ev.gerado_luma ? 'var(--luma)' : 'var(--teal)',
                        border:'2px solid #fff',boxShadow:'0 0 0 1px var(--teal)',
                      }}/>
                      <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:700,color:'var(--text3)'}}>{fmtData(ev.data)}</span>
                          {ev.sessao_num&&<span style={{fontSize:11,color:'var(--text3)'}}>· Sessão #{ev.sessao_num}</span>}
                          {ev.gerado_luma&&<span className="badge b-luma" style={{fontSize:10}}>LUMA</span>}
                          {ev.cid&&<span className="badge" style={{background:'var(--warm)',color:'var(--teal)',fontSize:10}}>{ev.cid}</span>}
                        </div>
                        <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,
                          overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>
                          {ev.texto}
                        </div>
                      </div>
                    </div>
                  ))}
                  {evs.length > 15 && (
                    <div style={{fontSize:12,color:'var(--text3)',textAlign:'center',paddingTop:8}}>
                      + {evs.length - 15} evoluções anteriores no prontuário
                    </div>
                  )}
                </div>
            }
          </div>

          {/* Resumo LUMA pré-sessão */}
          {evs.length >= 2 && (
            <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:16}}>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                <div style={{width:30,height:30,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>Resumo pré-sessão — LUMA</div>
                  <div style={{fontSize:11,color:'var(--luma-mid)'}}>Baseado nas últimas evoluções registradas</div>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{background:'#fff',borderRadius:8,padding:'10px 13px',border:'1px solid #DDD8F8'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--luma)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Última sessão · {fmtData(evs[0].data)}</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,
                    overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>
                    {evs[0].texto}
                  </div>
                </div>
                {evs[1] && (
                  <div style={{background:'rgba(255,255,255,0.5)',borderRadius:8,padding:'10px 13px',border:'1px solid #DDD8F8'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--luma-mid)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Sessão anterior · {fmtData(evs[1].data)}</div>
                    <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,
                      overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                      {evs[1].texto}
                    </div>
                  </div>
                )}
                <div style={{fontSize:11,color:'var(--luma-mid)',textAlign:'center',paddingTop:4}}>
                  <i className="ti ti-sparkles" style={{marginRight:4}}/>
                  {evs.length} evoluções registradas no total
                </div>
              </div>
            </div>
          )}
          </>}
        </>}
      </div>
    </div>
  )
}
