'use client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { fmtData, fmtMoeda } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { Empty } from '@/components/ui'

export default function Alertas() {
  const router = useRouter()
  const { inad, pronto, reload } = useStore()

  if (!pronto) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Carregando...</div>

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>
          <strong>{inad.length}</strong> paciente(s) com pagamento em aberto ou atrasado.
        </div>
        <button className="btn btn-ghost btn-sm" onClick={()=>reload('financeiro')}>
          <i className="ti ti-refresh"/>Atualizar
        </button>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title" style={{color:'var(--danger)'}}><i className="ti ti-alert-triangle"/>Inadimplência</div>
          {!inad.length ? <Empty icon="check" msg="Nenhuma inadimplência! Todos em dia."/>
            : inad.map(({paciente,fatura,diasAtraso}) => {
                const msg = `Olá, ${paciente.nome.split(' ')[0]}! 🌿\n\nPassando para lembrar sobre o pagamento de ${fmtMoeda(fatura.valor)}.\n\nPIX: *${CONFIG.financeiro.chavePix}*\n\nObrigada! 😊`
                return (
                  <div key={fatura.id} className="fin-inad-item">
                    <div style={{flex:1,cursor:'pointer'}} onClick={()=>router.push(`/prontuario?id=${paciente.id}`)}>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--teal)',marginBottom:2}}>{paciente.nome}</div>
                      <div style={{fontSize:11,color:'var(--danger)',fontWeight:600}}>{diasAtraso>0?`${diasAtraso}d em atraso`:'Vence hoje'}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>Venceu em {fmtData(fatura.vencimento)}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:'var(--danger)'}}>{fmtMoeda(fatura.valor)}</div>
                      {paciente.fone && (
                        <a href={`https://wa.me/${paciente.fone}?text=${encodeURIComponent(msg)}`} target="_blank"
                          className="btn btn-ghost btn-sm" style={{marginTop:6,fontSize:11}}>
                          <i className="ti ti-brand-whatsapp"/>Cobrar
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
          }
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-list-check"/>Resumo</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              ['Total em aberto', fmtMoeda(inad.reduce((s,i)=>s+Number(i.fatura.valor),0)), 'var(--danger)'],
              ['Pacientes inadimplentes', String(inad.length), 'var(--text)'],
              ['Maior atraso', inad.length?`${inad[0].diasAtraso}d`:'—', 'var(--warn)'],
            ].map(([l,v,c])=>(
              <div key={l as string} style={{background:'var(--warm)',padding:'11px 13px',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                <div style={{fontSize:16,fontWeight:700,color:c as string}}>{v}</div>
              </div>
            ))}
            <button className="btn btn-primary btn-full" onClick={()=>router.push('/financeiro')}>
              <i className="ti ti-report-money"/>Ver financeiro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
