'use client'
import { useEffect, useState, useCallback } from 'react'
import * as DB from '@/lib/db'
import { Modal, useToast, Empty } from '@/components/ui'
import type { Paciente, Cartao } from '@/types'
import { fmtData } from '@/lib/db'
import { CONFIG } from '@/lib/config'

export default function Cartoes() {
  const [pacs, setPacs] = useState<Paciente[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [sel, setSel]   = useState<Cartao|null>(null)
  const [filtro, setFiltro] = useState('')
  const [modal, setModal]   = useState(false)
  const [formPac, setFormPac] = useState('')
  const [formTit, setFormTit] = useState('')
  const [formVal, setFormVal] = useState('Semanal')
  const [tarefas, setTarefas] = useState(['','',''])
  const [saving, setSaving]   = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([DB.getPacientes(), DB.getCartoes()])
    setPacs(p); setCartoes(c)
  }, [])

  useEffect(()=>{ load() },[load])

  const filtrados = filtro ? cartoes.filter(c=>c.paciente_id===filtro) : cartoes

  const toggle = async (tarefaId: string, feita: boolean, cartaoId: string) => {
    await DB.toggleTarefa(tarefaId, !feita)
    const c = await DB.getCartoes()
    setCartoes(c)
    setSel(c.find(x=>x.id===cartaoId)||null)
  }

  const salvar = async () => {
    if (!formPac || !formTit) { toast('Preencha paciente e título','danger'); return }
    const ts = tarefas.filter(t=>t.trim())
    if (!ts.length) { toast('Adicione ao menos uma tarefa','danger'); return }
    const pac = pacs.find(p=>p.nome===formPac)
    if (!pac) return
    setSaving(true)
    await DB.addCartao(pac.id, { titulo:formTit, validade:formVal, tarefas:ts.map(t=>({titulo:t})) })
    toast('Cartão criado!')
    setModal(false); setFormPac(''); setFormTit(''); setTarefas(['','',''])
    await load()
    setSaving(false)
  }

  const enviarWpp = (c: Cartao) => {
    const pac = pacs.find(p=>p.id===c.paciente_id)
    if (!pac?.fone) { toast('Paciente sem WhatsApp cadastrado','danger'); return }
    const msg = CONFIG.financeiro ? `Oi, ${pac.nome.split(' ')[0]}! 🌿\n\nSuas atividades terapêuticas da semana:\n\n*${c.titulo}*\n\n${c.tarefas.map((t,i)=>`${i+1}. ${t.titulo}`).join('\n')}\n\nLembre-se: cada tarefa é um passo! 💚` : ''
    window.open(`https://wa.me/${pac.fone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>Envie tarefas terapêuticas entre sessões e acompanhe a adesão.</div>
        <div style={{display:'flex',gap:8}}>
          <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontSize:12,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
            <option value="">Todos os pacientes</option>
            {pacs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button className="btn btn-sage" onClick={()=>setModal(true)}><i className="ti ti-plus"/>Novo cartão</button>
        </div>
      </div>

      <div className="cartao-layout">
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Cartões ({filtrados.length})</div>
          {!filtrados.length ? <Empty icon="cards" msg="Nenhum cartão criado ainda"/> : filtrados.map(c=>{
            const pac = pacs.find(p=>p.id===c.paciente_id)
            const feitas = c.tarefas.filter(t=>t.feita).length
            const pct = c.tarefas.length ? Math.round(feitas/c.tarefas.length*100) : 0
            const statusCls = pct===100?'tag-pago':pct>0?'tag-conf':'tag-pend'
            return (
              <div key={c.id} className={`cartao-item${sel?.id===c.id?' active':''}`} onClick={()=>setSel(c)}>
                <div className="ci-head">
                  <div><div className="ci-title">{c.titulo}</div><div className="ci-meta">{pac?.nome||'?'} · {c.tarefas.length} tarefas</div></div>
                  <span className={statusCls}>{pct===100?'Concluído':pct>0?'Ativo':'Aguardando'}</span>
                </div>
                <div className="ci-bar"><div className="ci-fill" style={{width:`${pct}%`}}/></div>
                <div className="ci-adesao">Adesão: {pct}% · {feitas} de {c.tarefas.length}</div>
              </div>
            )
          })}
        </div>

        <div id="cartao-detail" className="card">
          {!sel ? <Empty icon="cards" msg="Selecione um cartão"/> : <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
              <div style={{fontSize:14,fontWeight:600}}>{sel.titulo}</div>
              {sel.gerado_luma && <span className="badge badge-luma">LUMA sugeriu</span>}
            </div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:14,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
              {pacs.find(p=>p.id===sel.paciente_id)?.nome||'?'} · {sel.validade} · {sel.tarefas.length} tarefas
            </div>
            <div id="tarefa-list">
              {sel.tarefas.map(t=>(
                <div key={t.id} className={`tarefa${t.feita?' done':''}`} onClick={()=>toggle(t.id, t.feita, sel.id)}>
                  <div className="tar-chk">{t.feita&&<i className="ti ti-check" style={{fontSize:11}}/>}</div>
                  <div className="tar-info"><div className="tar-title">{t.titulo}</div>{t.descricao&&<div className="tar-desc">{t.descricao}</div>}</div>
                </div>
              ))}
            </div>
            <div className="adesao-row">
              <span style={{fontSize:12,color:'var(--text3)'}}>Adesão geral</span>
              <div className="ad-bar">
                <div className="ad-fill" style={{width:`${sel.tarefas.length?Math.round(sel.tarefas.filter(t=>t.feita).length/sel.tarefas.length*100):0}%`}}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:'var(--teal)'}}>{sel.tarefas.length?Math.round(sel.tarefas.filter(t=>t.feita).length/sel.tarefas.length*100):0}%</span>
            </div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn btn-sage" style={{flex:1,justifyContent:'center',fontSize:12}} onClick={()=>setModal(true)}><i className="ti ti-plus"/>Novo cartão</button>
              <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>enviarWpp(sel)}><i className="ti ti-brand-whatsapp"/>Enviar</button>
            </div>
          </>}
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Novo cartão terapêutico" icon="cards">
        <div className="field"><label>Paciente *</label><select value={formPac} onChange={e=>setFormPac(e.target.value)}><option value="">Selecione...</option>{pacs.map(p=><option key={p.id}>{p.nome}</option>)}</select></div>
        <div className="field"><label>Título *</label><input value={formTit} onChange={e=>setFormTit(e.target.value)} placeholder="Ex: Diário de humor + respiração"/></div>
        <div className="field"><label>Validade</label><select value={formVal} onChange={e=>setFormVal(e.target.value)}><option>Semanal</option><option>Quinzenal</option><option>Por sessão</option><option>Sem prazo</option></select></div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:8}}>Tarefas *</label>
          {tarefas.map((t,i)=>(
            <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
              <input value={t} onChange={e=>{const ts=[...tarefas]; ts[i]=e.target.value; setTarefas(ts)}} placeholder={`Tarefa ${i+1}...`}/>
              {i>0 && <button className="btn btn-ghost btn-sm" onClick={()=>setTarefas(ts=>ts.filter((_,j)=>j!==i))}><i className="ti ti-trash"/></button>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={()=>setTarefas(ts=>[...ts,''])}><i className="ti ti-plus"/>Adicionar tarefa</button>
        </div>
        <button className="btn btn-sage btn-full" onClick={salvar} disabled={saving}>{saving?'Salvando...':'Criar e enviar'}</button>
      </Modal>
    </div>
  )
}
