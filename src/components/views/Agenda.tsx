'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as DB from '@/lib/db'
import { Modal, useToast } from '@/components/ui'
import type { Agendamento, Paciente } from '@/types'
import { getLocal, fmtData, fmtMoeda } from '@/lib/db'

const DIAS = ['Seg','Ter','Qua','Qui','Sex']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const HORAS = ['08','09','10','11','12','13','14','15','16','17','18']

function fmt(d: Date) { return d.toISOString().slice(0,10) }

export default function Agenda() {
  const router = useRouter()
  const [offset, setOffset]   = useState(0)
  const [ags, setAgs]         = useState<Agendamento[]>([])
  const [pacs, setPacs]       = useState<Paciente[]>([])
  const [filtroLocal, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalAg, setModalAg] = useState<Agendamento|null>(null)
  const [modalNova, setModalNova] = useState<{data:string;hora:string}|null>(null)
  // form nova sessão
  const [formPac, setFormPac]   = useState('')
  const [formTipo, setFormTipo] = useState('Terapia Individual')
  const [formModal, setFormModal] = useState('Presencial')
  const [saving, setSaving]     = useState(false)
  const toast = useToast()

  const hoje = new Date()
  const dom  = new Date(hoje); dom.setDate(hoje.getDate() - hoje.getDay() + 1 + offset * 7)
  const sex  = new Date(dom);  sex.setDate(dom.getDate() + 4)

  const load = useCallback(async () => {
    setLoading(true)
    const [a, p] = await Promise.all([
      DB.getAgendamentosSemana(fmt(dom), fmt(sex)),
      DB.getPacientes(),
    ])
    setAgs(a); setPacs(p); setLoading(false)
  }, [offset])

  useEffect(() => { load() }, [load])

  const salvar = async () => {
    if (!formPac || !modalNova) return
    setSaving(true)
    try {
      const pac = pacs.find(p => p.nome === formPac)
      if (!pac) { toast('Paciente não encontrado','danger'); return }
      await DB.addAgendamento({
        paciente_id: pac.id, data: modalNova.data, hora: modalNova.hora,
        tipo: formTipo, modalidade: formModal, local_id: pac.local_id, valor_sessao: pac.valor_sessao,
      })
      toast('Sessão agendada!')
      setModalNova(null)
      await load()
    } catch(e:any){ toast(e.message,'danger') }
    finally{ setSaving(false) }
  }

  const pagar = async (agId: string) => {
    await DB.pagarAgendamento(agId)
    toast('Pagamento registrado!')
    setModalAg(null); await load()
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOffset(o => o-1)}><i className="ti ti-chevron-left"/></button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOffset(0)}><i className="ti ti-calendar-today"/></button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOffset(o => o+1)}><i className="ti ti-chevron-right"/></button>
        <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>
          {dom.getDate()} {MESES[dom.getMonth()]} — {sex.getDate()} {MESES[sex.getMonth()]} {sex.getFullYear()}
        </span>
        <select value={filtroLocal} onChange={e=>setFiltro(e.target.value)} style={{marginLeft:'auto',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontSize:12,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
          <option value="">Todos os locais</option>
          <option value="unimed">🏥 Unimed</option>
          <option value="aquarela">🏡 Aquarela</option>
          <option value="anhangabau">🏢 Anhangabaú</option>
        </select>
        <button className="btn btn-sage btn-sm" onClick={() => setModalNova({data:fmt(hoje),hora:'10:00'})}>
          <i className="ti ti-plus"/>Novo agendamento
        </button>
      </div>

      {/* Grade */}
      <div className="agenda-grid-wrap">
        <div className="cal-header">
          <div className="cal-corner"/>
          {DIAS.map((d,i) => {
            const dia = new Date(dom); dia.setDate(dom.getDate()+i)
            const isHoje = fmt(dia) === fmt(hoje)
            return <div key={d} className={`cal-day-hdr${isHoje?' today':''}`}>{d}<span>{dia.getDate()} {MESES[dia.getMonth()]}</span></div>
          })}
        </div>
        <div className="cal-grid">
          {loading
            ? Array.from({length:22}).map((_,i)=><div key={i} className="skeleton" style={{height:56,margin:2}}/>)
            : HORAS.map(h => [
                <div key={`t${h}`} className="cal-time">{h}h</div>,
                ...Array.from({length:5}).map((_,di) => {
                  const dia = new Date(dom); dia.setDate(dom.getDate()+di)
                  const dataStr = fmt(dia)
                  const cells = ags.filter(a => {
                    if (a.data !== dataStr || a.hora.slice(0,2) !== h) return false
                    if (filtroLocal && (a.local_id || (a.paciente as any)?.local_id) !== filtroLocal) return false
                    return true
                  })
                  return (
                    <div key={`c${h}${di}`} className="cal-cell"
                      onClick={() => setModalNova({data:dataStr,hora:`${h}:00`})}>
                      {cells.map(ag => {
                        const pac = ag.paciente as any || {}
                        const loc = getLocal(ag.local_id || pac.local_id)
                        return (
                          <div key={ag.id} className={`cal-appt ${ag.modalidade==='Online'?'online':'pres'}`}
                            style={{borderLeftColor:loc?.cor||'var(--teal)'}}
                            onClick={e=>{e.stopPropagation();setModalAg(ag)}}>
                            <div className="ca-name">{pac.nome||'?'}</div>
                            <div className="ca-time">{ag.hora} · {ag.modalidade}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              ])
          }
        </div>
      </div>

      {/* Modal: nova sessão */}
      <Modal open={!!modalNova} onClose={()=>setModalNova(null)} title="Novo agendamento" icon="calendar-plus">
        <div className="field">
          <label>Paciente *</label>
          <select value={formPac} onChange={e=>setFormPac(e.target.value)}>
            <option value="">Selecione...</option>
            {pacs.map(p=><option key={p.id} value={p.nome}>{p.nome}</option>)}
          </select>
        </div>
        <div className="field-row">
          <div className="field"><label>Data</label><input type="date" value={modalNova?.data||''} onChange={e=>setModalNova(n=>n?{...n,data:e.target.value}:n)}/></div>
          <div className="field"><label>Horário</label><input type="time" value={modalNova?.hora||''} onChange={e=>setModalNova(n=>n?{...n,hora:e.target.value}:n)}/></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Tipo</label>
            <select value={formTipo} onChange={e=>setFormTipo(e.target.value)}>
              {['Terapia Individual','Terapia de Casal','Terapia Infantil','Avaliação Psicológica','Atendimento Neurodivergente','Supervisão Clínica','Orientação Parental'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field"><label>Modalidade</label>
            <select value={formModal} onChange={e=>setFormModal(e.target.value)}>
              <option>Presencial</option><option>Online</option>
            </select>
          </div>
        </div>
        <button className="btn btn-sage btn-full" onClick={salvar} disabled={saving}>
          {saving?'Salvando...':'Agendar sessão'}
        </button>
      </Modal>

      {/* Modal: detalhes da sessão */}
      {modalAg && (() => {
        const pac = modalAg.paciente as any || {}
        const loc = getLocal(modalAg.local_id || pac.local_id)
        return (
          <Modal open={!!modalAg} onClose={()=>setModalAg(null)} title={`${pac.nome||'?'} — ${fmtData(modalAg.data)}`} icon="calendar-event">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[
                ['Data e horário',`${fmtData(modalAg.data)} às ${modalAg.hora}`],
                ['Valor', fmtMoeda(modalAg.valor_sessao)],
                ['Tipo', modalAg.tipo],
                ['Modalidade', modalAg.modalidade],
                ['Status', modalAg.status],
                ['Local', loc?.nome || '—'],
              ].map(([l,v])=>(
                <div key={l} style={{background:'var(--warm)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-sage" style={{flex:1,justifyContent:'center'}}
                onClick={()=>{setModalAg(null);router.push(`/prontuario?id=${modalAg.paciente_id}`)}}>
                <i className="ti ti-clipboard-text"/>Prontuário
              </button>
              {!modalAg.pago && (
                <button className="btn btn-ghost" style={{flex:1,justifyContent:'center',color:'var(--success)',borderColor:'var(--success)'}}
                  onClick={()=>pagar(modalAg.id)}>
                  <i className="ti ti-coin"/>Registrar pagamento
                </button>
              )}
              {modalAg.pago && <span style={{fontSize:12,color:'var(--success)',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-check"/>Pago</span>}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}
