'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { Empty } from '@/components/ui'
import { fmtData, fmtMoeda } from '@/lib/db'
import { CONFIG } from '@/lib/config'

export default function Financeiro() {
  const router = useRouter()
  const { inad, pronto, reload } = useStore()
  const [filtroLocal, setFiltroLocal] = useState('')
  const [fatMes, setFatMes] = useState(0)

  useEffect(() => {
    if (!pronto) return
    DB.getFaturamentoMes(new Date().toISOString().slice(0,7)).then(setFatMes).catch(()=>{})
  }, [pronto])

  const filtrados = filtroLocal ? inad.filter(i=>i.paciente.local_id===filtroLocal) : inad
  const total = filtrados.reduce((s,i)=>s+Number(i.fatura.valor),0)

  if (!pronto) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Carregando...</div>

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>Controle financeiro e inadimplência.</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <select value={filtroLocal} onChange={e=>setFiltroLocal(e.target.value)}
            style={{border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontSize:12,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
            <option value="">Todos os locais</option>
            <option value="unimed">🏥 Unimed</option>
            <option value="aquarela">🏡 Aquarela</option>
            <option value="ceped">🏢 CEPED</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>reload('financeiro')}><i className="ti ti-refresh"/></button>
        </div>
      </div>

      <div className="g3" style={{marginBottom:20}}>
        <div className="metric accent-green">
          <div className="metric-label">Faturado este mês</div>
          <div className="metric-value" style={{fontSize:20,color:'var(--success)'}}>{fmtMoeda(fatMes)}</div>
          <div className="metric-sub">pagamentos confirmados</div>
        </div>
        <div className="metric accent-red">
          <div className="metric-label">Inadimplência</div>
          <div className="metric-value" style={{fontSize:20,color:'var(--danger)'}}>{fmtMoeda(total)}</div>
          <div className="metric-sub">{filtrados.length} paciente(s)</div>
        </div>
        <div className="metric">
          <div className="metric-label">PIX</div>
          <div style={{fontSize:14,fontWeight:600,marginTop:8,color:'var(--teal)'}}>{CONFIG.financeiro.chavePix}</div>
          <div className="metric-sub">Meta: {fmtMoeda(CONFIG.financeiro.metaMensalFaturamento)}</div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div className="card-title" style={{marginBottom:0}}><i className="ti ti-alert-triangle"/>Inadimplentes</div>
            {total>0&&<span style={{fontWeight:700,color:'var(--danger)',fontSize:13}}>{fmtMoeda(total)}</span>}
          </div>
          {!filtrados.length ? <Empty icon="check" msg="Nenhuma inadimplência!"/>
            : filtrados.map(({paciente,fatura,diasAtraso})=>{
                const msg=`Olá, ${paciente.nome.split(' ')[0]}! 🌿\n\nPassando para lembrar sobre o pagamento de ${fmtMoeda(fatura.valor)}.\n\nPIX: *${CONFIG.financeiro.chavePix}*\n\nObrigada! 😊`
                return (
                  <div key={fatura.id} className="fin-inad-item">
                    <div style={{flex:1,cursor:'pointer'}} onClick={()=>router.push(`/prontuario?id=${paciente.id}`)}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--teal)',marginBottom:2}}>{paciente.nome}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>Venc. {fmtData(fatura.vencimento)} · {diasAtraso}d em atraso</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:'var(--danger)'}}>{fmtMoeda(fatura.valor)}</div>
                      {paciente.fone&&<a href={`https://wa.me/${paciente.fone}?text=${encodeURIComponent(msg)}`} target="_blank" className="btn btn-ghost btn-sm" style={{marginTop:6,fontSize:11}}><i className="ti ti-brand-whatsapp"/>Cobrar</a>}
                    </div>
                  </div>
                )
              })
          }
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-report-money"/>Ações rápidas</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn btn-primary btn-full" onClick={()=>router.push('/relatorios')}><i className="ti ti-file-analytics"/>Gerar relatório</button>
            <button className="btn btn-ghost btn-full" onClick={()=>router.push('/alertas')}><i className="ti ti-bell-ringing"/>Ver alertas</button>
            <button className="btn btn-ghost btn-full" onClick={()=>router.push('/whatsapp')}><i className="ti ti-brand-whatsapp"/>Enviar cobranças</button>
          </div>
          <div style={{marginTop:20,fontSize:12,color:'var(--text2)',lineHeight:1.7}}>
            PIX: <strong>{CONFIG.financeiro.chavePix}</strong><br/>
            Valor padrão: {fmtMoeda(CONFIG.financeiro.valorSessaoPadrao)}/sessão<br/>
            Meta mensal: {fmtMoeda(CONFIG.financeiro.metaMensalFaturamento)}
          </div>
        </div>
      </div>
    </div>
  )
}
