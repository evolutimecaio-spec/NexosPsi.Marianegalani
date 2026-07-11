'use client'
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { Modal, useToast, erroLegivel } from '@/components/ui'
import type { Agendamento } from '@/types'
import { getLocal, fmtData, fmtMoeda } from '@/lib/db'

const DIAS  = ['Seg','Ter','Qua','Qui','Sex']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const HORAS = ['08','09','10','11','12','13','14','15','16','17','18']
const fmt = (d: Date) => d.toISOString().slice(0,10)

function addWeeks(date: Date, weeks: number) {
  const d = new Date(date); d.setDate(d.getDate() + weeks * 7); return d
}

export default function Agenda() {
  const { pacientes, reload } = useStore()
  const [offset, setOffset]       = useState(0)
  const [ags, setAgs]             = useState<Agendamento[]>([])
  const [filtroLocal, setFiltro]  = useState('')
  const [loading, setLoading]     = useState(true)
  const [modalAg, setModalAg]     = useState<Agendamento|null>(null)
  const [modalNova, setModalNova] = useState<{data:string;hora:string}|null>(null)
  const [formPacId, setFormPacId] = useState('')
  const [formTipo, setFormTipo]   = useState('Terapia Individual')
  const [formModal, setFormModal] = useState('Presencial')
  const [recorrente, setRecorrente] = useState(false)
  const [semanas, setSemanas]     = useState(12)
  const [saving, setSaving]       = useState(false)
  const toast = useToast()

  const hoje = new Date()
  const dom  = new Date(hoje); dom.setDate(hoje.getDate() - hoje.getDay() + 1 + offset*7)
  const sex  = new Date(dom);  sex.setDate(dom.getDate() + 4)

  const load = useCallback(async (currentOffset?: number) => {
    const off = currentOffset ?? offset
    const hoje2 = new Date()
    const dom2 = new Date(hoje2); dom2.setDate(hoje2.getDate() - hoje2.getDay() + 1 + off*7)
    const sex2 = new Date(dom2); sex2.setDate(dom2.getDate() + 4)
    setLoading(true)
    try { setAgs(await DB.getAgendamentosSemana(fmt(dom2), fmt(sex2))) }
    finally { setLoading(false) }
  }, [offset])

  useEffect(() => { load() }, [load])

  const salvar = async () => {
    if (!formPacId || !modalNova) { toast('Selecione um paciente','danger'); return }
    const pac = pacientes.find(p => p.id === formPacId)
    if (!pac) { toast('Paciente não encontrado','danger'); return }
    setSaving(true)
    try {
      if (recorrente) {
        // Criar todas as sessões recorrentes de uma vez
        const base = new Date(modalNova.data + 'T00:00:00')
        const promises = Array.from({ length: semanas }, (_, i) => {
          const d = addWeeks(base, i)
          return DB.addAgendamento({
            paciente_id: pac.id, data: fmt(d), hora: modalNova.hora,
            tipo: formTipo, modalidade: formModal, local_id: pac.local_id, valor_sessao: pac.valor_sessao,
          })
        })
        await Promise.all(promises)
        toast(`${semanas} sessões recorrentes agendadas!`)
      } else {
        await DB.addAgendamento({
          paciente_id: pac.id, data: modalNova.data, hora: modalNova.hora,
          tipo: formTipo, modalidade: formModal, local_id: pac.local_id, valor_sessao: pac.valor_sessao,
        })
        toast('Sessão agendada!')
      }
      setModalNova(null); setFormPacId(''); setRecorrente(false)
      // Aguardar um tick para garantir que o banco processou
      await new Promise(r => setTimeout(r, 300))
      await load(offset); reload('agenda')
    } catch(e:any){ toast(erroLegivel(e),'danger') }
    finally { setSaving(false) }
  }

  const pagar = async (agId: string) => {
    await DB.pagarAgendamento(agId)
    toast('Pagamento registrado!'); setModalAg(null); await load()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setOffset(o=>o-1)}><i className="ti ti-chevron-left"/></button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setOffset(0)}><i className="ti ti-calendar-today"/></button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setOffset(o=>o+1)}><i className="ti ti-chevron-right"/></button>
        <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>
          {dom.getDate()} {MESES[dom.getMonth()]} — {sex.getDate()} {MESES[sex.getMonth()]} {sex.getFullYear()}
        </span>
        <select value={filtroLocal} onChange={e=>setFiltro(e.target.value)}
          style={{marginLeft:'auto',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontSize:12,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
          <option value="">Todos os locais</option>
          <option value="unimed">🏥 Unimed</option>
          <option value="aquarela">🏡 Aquarela</option>
          <option value="ceped">🏢 CEPED</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={()=>setModalNova({data:fmt(hoje),hora:'10:00'})}>
          <i className="ti ti-plus"/>Novo agendamento
        </button>
      </div>

      <div className="cal-wrap">
        <div className="cal-header">
          <div className="cal-corner"/>
          {DIAS.map((d,i)=>{
            const dia=new Date(dom); dia.setDate(dom.getDate()+i)
            const isHoje=fmt(dia)===fmt(hoje)
            return (
              <div key={d} className={`cal-day-hdr${isHoje?' today':''}`}>
                <span className="day-name">{d}</span>
                <span className="day-num">{dia.getDate()} {MESES[dia.getMonth()]}</span>
              </div>
            )
          })}
        </div>
        <div className="cal-grid">
          {loading
            ? Array.from({length:55}).map((_,i)=>(
                <div key={i} style={{background:'var(--warm)',height:60,borderTop:'1px solid var(--border)',borderLeft:i%6===0?'none':'1px solid var(--border)'}}/>
              ))
            : HORAS.map(h=>[
                <div key={`t${h}`} className="cal-time">{h}h</div>,
                ...DIAS.map((_,di)=>{
                  const dia=new Date(dom); dia.setDate(dom.getDate()+di)
                  const dataStr=fmt(dia)
                  const cells=ags.filter(a=>{
                    if(a.data!==dataStr||a.hora.slice(0,2)!==h) return false
                    if(filtroLocal&&(a.local_id||(a.paciente as any)?.local_id)!==filtroLocal) return false
                    return true
                  })
                  return (
                    <div key={`c${h}${di}`} className="cal-cell"
                      onClick={()=>setModalNova({data:dataStr,hora:`${h}:00`})}>
                      {cells.map(ag=>{
                        const pac=ag.paciente as any||{}
                        const loc=getLocal(ag.local_id||pac.local_id)
                        return (
                          <div key={ag.id}
                            className={`cal-appt ${ag.modalidade==='Online'?'online':'presencial'}`}
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
      <Modal open={!!modalNova} onClose={()=>{setModalNova(null);setFormPacId('');setRecorrente(false)}}
        title="Novo agendamento" icon="calendar-plus">
        <div className="field">
          <label>Paciente *</label>
          <select value={formPacId} onChange={e=>setFormPacId(e.target.value)}>
            <option value="">Selecione o paciente...</option>
            {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div className="field-row">
          <div className="field"><label>Data</label>
            <input type="date" value={modalNova?.data||''} onChange={e=>setModalNova(n=>n?{...n,data:e.target.value}:n)}/>
          </div>
          <div className="field"><label>Horário</label>
            <input type="time" value={modalNova?.hora||''} onChange={e=>setModalNova(n=>n?{...n,hora:e.target.value}:n)}/>
          </div>
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

        {/* Recorrência */}
        <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:12,marginBottom:12}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:recorrente?10:0}}>
            <input type="checkbox" checked={recorrente} onChange={e=>setRecorrente(e.target.checked)}
              style={{width:15,height:15,accentColor:'var(--teal)'}}/>
            <span style={{fontSize:13,fontWeight:500}}>Agendamento recorrente (semanal)</span>
          </label>
          {recorrente && (
            <div>
              <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>Repetir por quantas semanas?</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="range" min={2} max={52} value={semanas} onChange={e=>setSemanas(+e.target.value)}
                  style={{flex:1,accentColor:'var(--teal)'}}/>
                <span style={{fontSize:14,fontWeight:700,color:'var(--teal)',minWidth:60}}>{semanas} sem.</span>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>
                Criará {semanas} sessões toda semana neste dia/horário
              </div>
            </div>
          )}
        </div>

        {formPacId && (
          <div style={{background:'var(--teal-light)',padding:'8px 12px',borderRadius:8,fontSize:12,color:'var(--teal)',marginBottom:12}}>
            <i className="ti ti-info-circle" style={{marginRight:6}}/>
            Valor: {fmtMoeda(pacientes.find(p=>p.id===formPacId)?.valor_sessao)} · Local: {getLocal(pacientes.find(p=>p.id===formPacId)?.local_id)?.nome||'—'}
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={salvar} disabled={saving||!formPacId}>
          {saving?'Salvando...':(recorrente?`Agendar ${semanas} sessões recorrentes`:'Agendar sessão')}
        </button>
      </Modal>

      {/* Modal: detalhes */}
      {modalAg&&(()=>{
        const pac=modalAg.paciente as any||{}
        const loc=getLocal(modalAg.local_id||pac.local_id)
        return (
          <Modal open={!!modalAg} onClose={()=>setModalAg(null)}
            title={`${pac.nome||'?'} — ${fmtData(modalAg.data)}`} icon="calendar-event">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Data',`${fmtData(modalAg.data)} às ${modalAg.hora}`],['Valor',fmtMoeda(modalAg.valor_sessao)],['Tipo',modalAg.tipo],['Modalidade',modalAg.modalidade],['Status',modalAg.status],['Local',loc?.nome||'—']].map(([l,v])=>(
                <div key={l} style={{background:'var(--warm)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              {!modalAg.pago&&(
                <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={()=>pagar(modalAg.id)}>
                  <i className="ti ti-coin"/>Registrar pagamento
                </button>
              )}
              {modalAg.pago&&<span style={{fontSize:12,color:'var(--success)',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-check"/>Pago</span>}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}
