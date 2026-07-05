'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import * as DB from '@/lib/db'
import { Modal, useToast, Empty, Loading } from '@/components/ui'
import type { Paciente, Evolucao, Fatura, Cartao, Documento } from '@/types'
import { getLocal, fmtData, fmtMoeda, calcIdade } from '@/lib/db'

type Aba = 'ev'|'fin'|'cart'|'docs'

function ProntuarioInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idParam = searchParams.get('id')

  const [pacs, setPacs]   = useState<Paciente[]>([])
  const [sel,  setSel]    = useState<Paciente|null>(null)
  const [aba,  setAba]    = useState<Aba>('ev')
  const [busca, setBusca] = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  // conteúdo das abas
  const [evs,  setEvs]    = useState<Evolucao[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [docs, setDocs]   = useState<Documento[]>([])
  // ui
  const [showFormEv, setShowFormEv] = useState(false)
  const [formEv, setFormEv] = useState('')
  const [modeloEv, setModeloEv] = useState('')
  const [modalPac, setModalPac] = useState(false)
  const [formPac, setFormPac] = useState({ nome:'',fone:'',email:'',nascimento:'',sexo:'',cid:'',modalidade:'Presencial',local_id:'unimed',valor_sessao:'180',venc_dia:'10',obs:'' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const MODELOS: Record<string,string> = {
    '': '',
    tcc: 'Queixa principal:\n\nIntervenção:\n\nPlano para a próxima sessão:',
    psicod: 'Material trazido:\n\nDinâmica transferencial:\n\nInterpretações:\n\nEncaminhamento:',
    cbt_full: 'Humor/nível de angústia (0-10):\n\nPensamento automático identificado:\n\nEvidências a favor:\nEvidências contra:\n\nPensamento alternativo:\n\nResultado emocional:',
  }

  const selectPac = useCallback(async (p: Paciente) => {
    setSel(p); setAba('ev')
    const [e, f, c, d] = await Promise.all([
      DB.getEvolucoes(p.id), DB.getFaturas(p.id),
      DB.getCartoes(p.id), DB.getDocumentos(p.id)
    ])
    setEvs(e); setFaturas(f); setCartoes(c); setDocs(d)
    // Atualizar URL sem navegar
    const url = new URL(window.location.href)
    url.searchParams.set('id', p.id)
    window.history.pushState({}, '', url)
  }, [])

  const loadPacs = useCallback(async () => {
    setLoading(true)
    const p = await DB.getPacientes()
    setPacs(p)
    if (idParam) {
      const found = p.find(x => x.id === idParam)
      if (found) await selectPac(found)
      else if (p.length) await selectPac(p[0])
    } else if (p.length) {
      await selectPac(p[0])
    }
    setLoading(false)
  }, [idParam])

  useEffect(() => { loadPacs() }, [loadPacs])

  const loadAba = async (a: Aba) => {
    if (!sel) return; setAba(a)
    if (a==='ev')   setEvs(await DB.getEvolucoes(sel.id))
    if (a==='fin')  setFaturas(await DB.getFaturas(sel.id))
    if (a==='cart') setCartoes(await DB.getCartoes(sel.id))
    if (a==='docs') setDocs(await DB.getDocumentos(sel.id))
  }

  const salvarEv = async () => {
    if (!sel || !formEv.trim()) { toast('Digite o texto da evolução','danger'); return }
    setSaving(true)
    try {
      await DB.addEvolucao(sel.id, { texto: formEv.trim() })
      toast('Evolução salva!'); setFormEv(''); setShowFormEv(false)
      setEvs(await DB.getEvolucoes(sel.id))
    } finally { setSaving(false) }
  }

  const pagarFatura = async (fId: string) => {
    if (!sel) return
    await DB.pagarFatura(fId, sel.id)
    toast('Pagamento registrado!')
    setFaturas(await DB.getFaturas(sel.id))
    const p = await DB.getPaciente(sel.id); if (p) setSel(p)
  }

  const salvarPac = async () => {
    if (!formPac.nome || !formPac.fone) { toast('Nome e telefone obrigatórios','danger'); return }
    setSaving(true)
    try {
      await DB.addPaciente({ ...formPac, valor_sessao: +formPac.valor_sessao, venc_dia: +formPac.venc_dia, ativo:true, sessoes_total:0, devedor_total:0 } as any)
      toast('Paciente cadastrado!')
      setModalPac(false)
      await loadPacs()
    } catch (e:any){ toast(e.message,'danger') }
    finally { setSaving(false) }
  }

  const filtrados = pacs.filter(p => {
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false
    if (filtroLocal && p.local_id !== filtroLocal) return false
    if (filtroPerfil && !p.perfil.includes(filtroPerfil as any)) return false
    return true
  })

  if (loading) return <Loading />

  return (
    <div>
      {/* Filtros topo */}
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input placeholder="🔍 Buscar paciente..." value={busca} onChange={e=>setBusca(e.target.value)} style={{flex:'1 1 160px',minWidth:0}}/>
        <select value={filtroLocal} onChange={e=>setFiltroLocal(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
          <option value="">Todos os locais</option>
          <option value="unimed">🏥 Unimed</option>
          <option value="aquarela">🏡 Aquarela</option>
          <option value="anhangabau">🏢 Anhangabaú</option>
        </select>
        <select value={filtroPerfil} onChange={e=>setFiltroPerfil(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
          <option value="">Todos os perfis</option>
          <option value="adulto">Adulto</option>
          <option value="crianca">Criança</option>
          <option value="neurodiverge">Neurodivergente</option>
          <option value="mulher">Mulher</option>
          <option value="supervisao">Supervisão</option>
        </select>
        <button className="btn btn-primary" onClick={()=>setModalPac(true)}><i className="ti ti-user-plus"/>Novo paciente</button>
      </div>

      <div className="pron-layout">
        {/* Lista */}
        <div className="patient-list-wrap">
          {filtrados.length === 0 && <Empty icon="users" msg="Nenhum paciente encontrado"/>}
          {filtrados.map(p => {
            const loc = getLocal(p.local_id)
            return (
              <div key={p.id} className={`patient-item${sel?.id===p.id?' sel':''}`} onClick={()=>selectPac(p)}>
                <div className="pi-av" style={{background:loc?.cor||'var(--teal)'}}>{p.avatar||p.nome.slice(0,2)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="pi-name" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                  <div className="pi-sub">{p.modalidade} · {fmtMoeda(p.valor_sessao)}/sessão</div>
                  <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                    {loc && <span className="badge" style={{background:loc.cor+'22',color:loc.cor,fontSize:10}}>{loc.nome}</span>}
                    {p.devedor_total>0 && <span className="badge b-red" style={{fontSize:10}}>Dev. {fmtMoeda(p.devedor_total)}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detalhe */}
        <div className="pron-detail">
          {!sel ? <div className="card"><Empty icon="clipboard-text" msg="Selecione um paciente"/></div> : <>
            {/* Header do paciente */}
            <div className="card">
              <div className="pac-header">
                <div className="pac-av-lg" style={{background:getLocal(sel.local_id)?.cor||'var(--teal)'}}>{sel.avatar||sel.nome.slice(0,2)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:2}}>{sel.nome}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>{sel.modalidade} · CID {sel.cid||'—'} · {sel.sessoes_total} sessões</div>
                  <div style={{display:'flex',gap:6,marginTop:7,flexWrap:'wrap'}}>
                    {sel.perfil.map(pf=><span key={pf} className="badge b-teal" style={{fontSize:10}}>{pf}</span>)}
                    {getLocal(sel.local_id) && <span className="badge" style={{background:getLocal(sel.local_id)!.cor+'22',color:getLocal(sel.local_id)!.cor,fontSize:10}}>{getLocal(sel.local_id)!.nome}</span>}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {sel.devedor_total>0
                    ? <><div style={{fontSize:11,color:'var(--text3)'}}>Em aberto</div><div style={{fontSize:16,fontWeight:800,color:'var(--danger)'}}>{fmtMoeda(sel.devedor_total)}</div></>
                    : <span className="badge b-green">✓ Em dia</span>
                  }
                </div>
              </div>
              <div className="pac-info-grid">
                {[
                  ['Nascimento', sel.nascimento?`${fmtData(sel.nascimento)} (${calcIdade(sel.nascimento)} anos)`:'—'],
                  ['Telefone', sel.fone||'—'],
                  ['E-mail', sel.email||'—'],
                  ['Valor/sessão', fmtMoeda(sel.valor_sessao)],
                ].map(([l,v])=>(
                  <div key={l} className="pac-field">
                    <div className="pac-field-label">{l}</div>
                    <div className="pac-field-value">{v}</div>
                  </div>
                ))}
              </div>
              {sel.obs && <div style={{marginTop:10,fontSize:12,color:'var(--text2)',background:'var(--teal-light)',padding:'8px 12px',borderRadius:8,lineHeight:1.5}}><i className="ti ti-note" style={{marginRight:6}}/>{sel.obs}</div>}
            </div>

            {/* Abas */}
            <div className="card" style={{flex:1}}>
              <div className="itabs">
                {([['ev','Evoluções','ti-note'],['fin','Financeiro','ti-coin'],['cart','Cartões','ti-cards'],['docs','Documentos','ti-folder']] as [Aba,string,string][]).map(([id,label,icon])=>(
                  <div key={id} className={`itab${aba===id?' active':''}`} onClick={()=>loadAba(id)}>
                    <i className={icon}/>{label}
                  </div>
                ))}
              </div>

              {/* Aba: Evoluções */}
              {aba==='ev' && (
                <>
                  <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                    <button className="btn btn-primary btn-sm" onClick={()=>setShowFormEv(s=>!s)}>
                      <i className="ti ti-plus"/>{showFormEv?'Cancelar':'Nova evolução'}
                    </button>
                  </div>
                  {showFormEv && (
                    <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:14,marginBottom:14}}>
                      <div className="field">
                        <label>Modelo de evolução</label>
                        <select value={modeloEv} onChange={e=>{setModeloEv(e.target.value);setFormEv(MODELOS[e.target.value]||'')}}>
                          <option value="">Texto livre</option>
                          <option value="tcc">TCC (padrão)</option>
                          <option value="psicod">Psicodinâmico</option>
                          <option value="cbt_full">TCC estruturado (ABC)</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Texto da evolução *</label>
                        <textarea rows={5} value={formEv} onChange={e=>setFormEv(e.target.value)} placeholder="Descreva a sessão..."/>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn btn-primary" onClick={salvarEv} disabled={saving}>{saving?'Salvando...':'Salvar'}</button>
                        <button className="btn btn-ghost" onClick={()=>{setShowFormEv(false);setFormEv('')}}>Cancelar</button>
                      </div>
                    </div>
                  )}
                  {evs.length===0 ? <Empty icon="note" msg="Nenhuma evolução registrada ainda."/> : evs.map(ev=>(
                    <div key={ev.id} className="ev-entry">
                      <div className={`ev-dot${ev.gerado_luma?' luma':''}`}/>
                      <div style={{flex:1}}>
                        <div className="ev-date">{fmtData(ev.data)}{ev.sessao_num?` · Sessão #${ev.sessao_num}`:''}</div>
                        <div className="ev-card">
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>Evolução clínica</span>
                            {ev.gerado_luma&&<span className="badge b-luma">LUMA</span>}
                            {ev.cid&&<span className="badge b-teal">{ev.cid}</span>}
                          </div>
                          <div className="ev-text">{ev.texto}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Aba: Financeiro */}
              {aba==='fin' && (
                faturas.length===0 ? <Empty icon="coin" msg="Nenhuma fatura registrada."/> : <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <span style={{fontSize:13,fontWeight:600}}>Histórico de pagamentos</span>
                    {sel.devedor_total>0 && <span style={{color:'var(--danger)',fontWeight:700,fontSize:13}}>{fmtMoeda(sel.devedor_total)} em aberto</span>}
                  </div>
                  {faturas.map(f=>(
                    <div key={f.id} className="fatura-row">
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500}}>{f.mes} · {f.sessoes_count} sess.</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Venc. {fmtData(f.vencimento)}</div>
                      </div>
                      <span style={{fontSize:14,fontWeight:700,color:f.pago?'var(--success)':'var(--danger)'}}>{fmtMoeda(f.valor)}</span>
                      {!f.pago
                        ? <button className="btn btn-primary btn-sm" onClick={()=>pagarFatura(f.id)}><i className="ti ti-coin"/>Pagar</button>
                        : <span className="tag tag-pago" style={{fontSize:11}}>Pago {fmtData(f.data_pagamento)}</span>
                      }
                    </div>
                  ))}
                </>
              )}

              {/* Aba: Cartões */}
              {aba==='cart' && (
                cartoes.length===0 ? <Empty icon="cards" msg="Nenhum cartão criado.">
                </Empty> : cartoes.map(c=>{
                  const feitas = c.tarefas.filter(t=>t.feita).length
                  const pct = c.tarefas.length?Math.round(feitas/c.tarefas.length*100):0
                  return (
                    <div key={c.id} style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:10,padding:14,marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{fontSize:13,fontWeight:600}}>{c.titulo}</div>
                        <span style={{fontSize:13,fontWeight:700,color:'var(--teal)'}}>{pct}%</span>
                      </div>
                      <div className="ci-bar"><div className="ci-fill" style={{width:`${pct}%`}}/></div>
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{feitas} de {c.tarefas.length} tarefas · {c.validade}</div>
                    </div>
                  )
                })
              )}

              {/* Aba: Documentos */}
              {aba==='docs' && (
                docs.length===0 ? <Empty icon="folder" msg="Nenhum documento."/> : docs.map(d=>(
                  <div key={d.id} className="fatura-row">
                    <i className="ti ti-file-text" style={{color:'var(--teal)',fontSize:18,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500}}>{d.nome}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{d.tipo||'Documento'} · {fmtData(d.created_at?.slice(0,10))}</div>
                    </div>
                    {d.url&&<a href={d.url} target="_blank" className="btn btn-ghost btn-sm"><i className="ti ti-download"/></a>}
                  </div>
                ))
              )}
            </div>
          </>}
        </div>
      </div>

      {/* Modal novo paciente */}
      <Modal open={modalPac} onClose={()=>setModalPac(false)} title="Novo paciente" icon="user-plus" large>
        <div className="field-row">
          <div className="field"><label>Nome completo *</label><input value={formPac.nome} onChange={e=>setFormPac(p=>({...p,nome:e.target.value}))}/></div>
          <div className="field"><label>WhatsApp *</label><input value={formPac.fone} onChange={e=>setFormPac(p=>({...p,fone:e.target.value}))}/></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Data de nascimento</label><input type="date" value={formPac.nascimento} onChange={e=>setFormPac(p=>({...p,nascimento:e.target.value}))}/></div>
          <div className="field"><label>Sexo</label><select value={formPac.sexo} onChange={e=>setFormPac(p=>({...p,sexo:e.target.value}))}><option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option><option value="NB">Não-binário</option></select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>CID</label><input value={formPac.cid} onChange={e=>setFormPac(p=>({...p,cid:e.target.value}))}/></div>
          <div className="field"><label>Modalidade</label><select value={formPac.modalidade} onChange={e=>setFormPac(p=>({...p,modalidade:e.target.value}))}><option>Presencial</option><option>Online</option></select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Local</label><select value={formPac.local_id} onChange={e=>setFormPac(p=>({...p,local_id:e.target.value}))}><option value="unimed">🏥 Unimed</option><option value="aquarela">🏡 Aquarela</option><option value="anhangabau">🏢 Anhangabaú</option></select></div>
          <div className="field"><label>Valor/sessão (R$)</label><input type="number" value={formPac.valor_sessao} onChange={e=>setFormPac(p=>({...p,valor_sessao:e.target.value}))}/></div>
        </div>
        <div className="field"><label>Observações</label><textarea value={formPac.obs} onChange={e=>setFormPac(p=>({...p,obs:e.target.value}))} rows={2}/></div>
        <button className="btn btn-primary btn-full" onClick={salvarPac} disabled={saving}>{saving?'Salvando...':'Cadastrar paciente'}</button>
      </Modal>
    </div>
  )
}

export default function Prontuario() {
  return (
    <Suspense fallback={<Loading />}>
      <ProntuarioInner />
    </Suspense>
  )
}
