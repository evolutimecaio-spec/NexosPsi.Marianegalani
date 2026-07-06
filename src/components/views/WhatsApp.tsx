'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { Paciente } from '@/types'
import { fmtMoeda } from '@/lib/db'
import { CONFIG } from '@/lib/config'

type Tipo = 'lembrete'|'boasvindas'|'cobranca'|'cartao'|'livre'

function buildMsg(pac: Paciente, tipo: Tipo, agHoje: any[]): string {
  const nome = pac.nome.split(' ')[0]
  const agPac = agHoje.find((a:any) => a.paciente_id === pac.id)
  const dataHoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
  const hora = agPac?.hora || '10:00'
  const local = pac.modalidade === 'Online'
    ? 'O link será enviado em breve.'
    : `Local: ${CONFIG.psicologa.endereco}.`

  switch(tipo) {
    case 'lembrete':
      return `Olá, ${nome}! \n\nPassando para lembrar da nossa sessão *${dataHoje} às ${hora}*.\n${local}\n\nPode confirmar respondendo *SIM* ou *NÃO*.\n\nAté lá! `
    case 'boasvindas':
      return `Olá, ${nome}! \n\nSeja bem-vinde! Fico muito feliz em te ter aqui.\n\nSou a ${CONFIG.psicologa.nome}, psicóloga (CRP ${CONFIG.psicologa.crp}).\n\nNossa primeira sessão está marcada para *${dataHoje} às ${hora}*. ${local}\n\nEm caso de cancelamento, avise com pelo menos 24h de antecedência.\n\nQualquer dúvida, estou por aqui! `
    case 'cobranca':
      const valor = pac.devedor_total > 0 ? fmtMoeda(pac.devedor_total) : 'o valor em aberto'
      return `Olá, ${nome}! \n\nPassando para te lembrar sobre o pagamento de ${valor} referente às nossas sessões.\n\nPode pagar pelo PIX: *${CONFIG.financeiro.chavePix}*\n\nSe já pagou, desconsidere. Obrigada! `
    case 'cartao':
      return `Oi, ${nome}! \n\nPreparei as suas atividades terapêuticas para esta semana.\n\n1. Registro diário de humor\n2. Respiração 4-7-8 pela manhã\n3. Identificar 1 pensamento automático\n\nQualquer dúvida, pode me perguntar. Estou torcendo por você! `
    default:
      return ''
  }
}

export default function WhatsApp() {
  const { pacientes, agHoje } = useStore()
  const [sel, setSel]   = useState<Paciente|null>(null)
  const [tipo, setTipo] = useState<Tipo>('lembrete')
  const [msg, setMsg]   = useState('')
  const [hist, setHist] = useState<{nome:string;tipo:string;hora:string}[]>([])

  const onPac = (id: string) => {
    const p = pacientes.find(x=>x.id===id)||null
    setSel(p)
    if (p) setMsg(buildMsg(p, tipo, agHoje))
    else setMsg('')
  }

  const onTipo = (t: Tipo) => {
    setTipo(t)
    if (sel) setMsg(buildMsg(sel, t, agHoje))
  }

  const enviar = () => {
    if (!sel?.fone||!msg.trim()) return
    window.open(`https://wa.me/${sel.fone}?text=${encodeURIComponent(msg)}`, '_blank')
    setHist(h=>[{nome:sel.nome,tipo,hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})},...h.slice(0,19)])
  }

  const TIPOS: [Tipo,string][] = [
    ['lembrete',' Lembrete de sessão'],
    ['boasvindas',' Boas-vindas'],
    ['cobranca',' Cobrança'],
    ['cartao',' Cartão terapêutico'],
    ['livre','✏️ Mensagem livre'],
  ]

  return (
    <div className="wpp-layout">
      <div className="col">
        <div className="card">
          <div className="card-title"><i className="ti ti-brand-whatsapp"/>Enviar mensagem</div>

          <div className="field">
            <label>Paciente</label>
            <select value={sel?.id||''} onChange={e=>onPac(e.target.value)}>
              <option value="">Selecione o paciente...</option>
              {pacientes.map(p=>(
                <option key={p.id} value={p.id}>
                  {p.nome}{agHoje.find((a:any)=>a.paciente_id===p.id)?' · Hoje':''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Tipo de mensagem</label>
            <select value={tipo} onChange={e=>onTipo(e.target.value as Tipo)}>
              {TIPOS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {sel && (
            <div style={{background:'var(--teal-light)',padding:'8px 12px',borderRadius:8,fontSize:12,color:'var(--teal)',marginBottom:12,display:'flex',gap:12}}>
              <span><strong>{sel.nome}</strong></span>
              <span>{sel.modalidade}</span>
              {sel.devedor_total>0&&<span style={{color:'var(--danger)',fontWeight:600}}>Dev. {fmtMoeda(sel.devedor_total)}</span>}
            </div>
          )}

          <div className="field">
            <label>Mensagem</label>
            <textarea rows={8} value={msg} onChange={e=>setMsg(e.target.value)}
              placeholder={sel?'':'Selecione um paciente para gerar a mensagem...'}
              style={{resize:'vertical'}}/>
          </div>

          {sel?.fone ? (
            <a href={`https://wa.me/${sel.fone}?text=${encodeURIComponent(msg)}`} target="_blank"
              className="btn btn-primary btn-full" onClick={enviar}
              style={{justifyContent:'center',textDecoration:'none'}}>
              <i className="ti ti-brand-whatsapp"/>Abrir no WhatsApp
            </a>
          ) : sel ? (
            <div style={{fontSize:12,color:'var(--warn)',padding:'8px 0'}}>
              <i className="ti ti-alert-circle" style={{marginRight:6}}/>{sel.nome} não tem WhatsApp cadastrado.
            </div>
          ) : null}
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="card-title"><i className="ti ti-eye"/>Preview</div>
          <div className="wpp-preview">
            {msg
              ? <div className="wpp-bubble">{msg}</div>
              : <div style={{padding:'20px',color:'#999',fontSize:13,fontStyle:'italic'}}>Selecione um paciente e tipo para ver o preview</div>
            }
          </div>
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-history"/>Histórico da sessão</div>
          {!hist.length
            ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma mensagem enviada nesta sessão.</div>
            : hist.map((h,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                  <div><strong>{h.nome}</strong> <span style={{color:'var(--text3)'}}>{h.tipo}</span></div>
                  <span style={{color:'var(--text3)'}}>{h.hora}</span>
                </div>
              ))
          }
        </div>

        <div className="card" style={{background:'var(--warm)'}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Templates disponíveis</div>
          {TIPOS.map(([v,l])=>(
            <div key={v} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}
              onClick={()=>onTipo(v)}>
              <span style={{fontSize:13}}>{l}</span>
              {tipo===v&&<span className="badge b-teal" style={{marginLeft:'auto',fontSize:10}}>Ativo</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
