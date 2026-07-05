'use client'
import { useEffect, useState } from 'react'
import * as DB from '@/lib/db'
import type { Paciente } from '@/types'
import { wppLembrete, wppBoasVindas, wppCobranca, wppCartao } from '@/lib/config'

type Tipo = 'lembrete'|'boasvindas'|'cobranca'|'cartao'|'livre'

export default function WhatsApp() {
  const [pacs, setPacs]   = useState<Paciente[]>([])
  const [sel, setSel]     = useState<Paciente|null>(null)
  const [tipo, setTipo]   = useState<Tipo>('lembrete')
  const [msg, setMsg]     = useState('')
  const [hist, setHist]   = useState<{nome:string;tipo:string;data:string}[]>([])

  useEffect(()=>{ DB.getPacientes().then(setPacs) },[])

  const buildMsg = (pac: Paciente|null, t: Tipo) => {
    if (!pac) return ''
    const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    if (t==='lembrete')   return wppLembrete(pac.nome.split(' ')[0], hoje, '10:00', pac.modalidade)
    if (t==='boasvindas') return wppBoasVindas(pac.nome.split(' ')[0], hoje, '10:00', pac.modalidade)
    if (t==='cobranca')   return wppCobranca(pac.nome.split(' ')[0], Number(pac.devedor_total))
    if (t==='cartao')     return wppCartao(pac.nome.split(' ')[0], ['Registro de humor', 'Respiração 4-7-8'])
    return ''
  }

  const onPac = (nome: string) => {
    const p = pacs.find(x=>x.nome===nome)||null
    setSel(p); setMsg(buildMsg(p, tipo))
  }
  const onTipo = (t: Tipo) => { setTipo(t); setMsg(buildMsg(sel, t)) }

  const enviar = () => {
    if (!sel?.fone || !msg.trim()) return
    window.open(`https://wa.me/${sel.fone}?text=${encodeURIComponent(msg)}`, '_blank')
    const novo = { nome: sel.nome, tipo, data: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
    setHist(h=>[novo,...h.slice(0,19)])
  }

  return (
    <div className="wpp-layout">
      <div className="col">
        <div className="card">
          <div className="card-title"><i className="ti ti-brand-whatsapp"/>Enviar mensagem</div>
          <div className="field"><label>Paciente</label>
            <select value={sel?.nome||''} onChange={e=>onPac(e.target.value)}>
              <option value="">Selecione o paciente...</option>
              {pacs.map(p=><option key={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="field"><label>Tipo de mensagem</label>
            <select value={tipo} onChange={e=>onTipo(e.target.value as Tipo)}>
              <option value="lembrete">Lembrete de sessão</option>
              <option value="boasvindas">Boas-vindas</option>
              <option value="cobranca">Cobrança</option>
              <option value="cartao">Cartão terapêutico</option>
              <option value="livre">Mensagem livre</option>
            </select>
          </div>
          <div className="field"><label>Mensagem</label>
            <textarea rows={8} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Selecione um paciente e tipo..."/>
          </div>
          {sel?.fone && (
            <a href={`https://wa.me/${sel.fone}?text=${encodeURIComponent(msg)}`} target="_blank"
              className="btn btn-sage btn-full" onClick={enviar} style={{justifyContent:'center'}}>
              <i className="ti ti-send"/>Abrir no WhatsApp
            </a>
          )}
          {!sel?.fone && sel && <div style={{fontSize:12,color:'var(--warn)',marginTop:8}}><i className="ti ti-alert-circle"/> {sel.nome} não tem WhatsApp cadastrado.</div>}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <div className="card-title"><i className="ti ti-eye"/>Preview</div>
          <div className="wpp-preview">
            <div className="wpp-bubble">{msg||'A mensagem aparecerá aqui...'}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-history"/>Histórico</div>
          {!hist.length ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma mensagem enviada ainda.</div>
          : hist.map((h,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <span><strong>{h.nome}</strong> — {h.tipo}</span>
              <span style={{color:'var(--text3)'}}>{h.data}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
