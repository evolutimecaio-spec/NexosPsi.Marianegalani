'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Anamnese as AnamneseType } from '@/types'
import { fmtData } from '@/lib/db'
import { CONFIG } from '@/lib/config'

const MODELOS = {
  adulto:     { titulo:'Anamnese Inicial — Adultos',     campos:['Nome completo *','Data de nascimento *','Queixa principal *','Histórico de tratamentos anteriores','Uso de medicação','Como soube do trabalho','Expectativas com a terapia'] },
  infantil:   { titulo:'Anamnese Infantil',              campos:['Nome da criança *','Data de nascimento *','Responsável *','Queixa dos responsáveis *','Histórico escolar','Medicação em uso','Diagnósticos anteriores','Comportamentos observados'] },
  supervisao: { titulo:'Ficha de Supervisão Clínica',   campos:['Nome da supervisanda *','CRP *','Abordagem terapêutica','Caso supervisionado *','Hipótese diagnóstica','Objetivo da supervisão'] },
}
type Modelo = keyof typeof MODELOS

export default function Anamnese() {
  const { pacientes } = useStore()
  const [anas, setAnas]       = useState<AnamneseType[]>([])
  const [modelo, setModelo]   = useState<Modelo>('adulto')
  const [pacId, setPacId]     = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(()=>{ DB.getAnamneses().then(setAnas).catch(()=>{}) },[])

  const enviar = async () => {
    if (!pacId) { toast('Selecione o paciente','danger'); return }
    const pac = pacientes.find(p=>p.id===pacId)
    if (!pac) return
    setLoading(true)
    try {
      await DB.addAnamnese(pac.id, modelo)
      const msg = `Olá, ${pac.nome.split(' ')[0]}! 🌸\n\nAqui é ${CONFIG.psicologa.nome}. Para prepararmos nossa conversa, gostaria que você preenchesse a ficha de anamnese antes da nossa sessão.\n\nResponda com calma e honestidade. Tudo é confidencial. 🌿\n\nQualquer dúvida, estou por aqui!`
      if (pac.fone) window.open(`https://wa.me/${pac.fone}?text=${encodeURIComponent(msg)}`, '_blank')
      toast('Anamnese enviada para '+pac.nome.split(' ')[0]+'!')
      setAnas(await DB.getAnamneses())
    } finally { setLoading(false) }
  }

  const m = MODELOS[modelo]
  const pac = pacientes.find(p=>p.id===pacId)

  return (
    <div>
      <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>
        Crie formulários de anamnese e envie ao paciente por WhatsApp.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:16}}>
        {/* Formulário */}
        <div className="card">
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:'var(--text2)',display:'block',marginBottom:6}}>Modelo de anamnese</label>
            <select value={modelo} onChange={e=>setModelo(e.target.value as Modelo)}
              style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
              <option value="adulto">Anamnese Inicial — Adultos</option>
              <option value="infantil">Anamnese Infantil / Neurodivergente</option>
              <option value="supervisao">Ficha de Supervisão Clínica</option>
            </select>
          </div>

          <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>
            Campos do formulário
          </div>

          {m.campos.map((campo,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,marginBottom:6}}>
              <i className="ti ti-grip-vertical" style={{color:'var(--text3)',fontSize:14,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{campo.replace(' *','')}</div>
                <div style={{fontSize:11,color:campo.includes('*')?'var(--teal)':'var(--text3)',fontWeight:campo.includes('*')?600:400}}>
                  {campo.includes('*')?'Obrigatório':'Opcional'}
                </div>
              </div>
              {campo.includes('*')&&<span className="badge b-teal" style={{fontSize:10}}>*</span>}
            </div>
          ))}
        </div>

        {/* Painel direito */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Enviar */}
          <div className="card">
            <div className="card-title"><i className="ti ti-send"/>Enviar formulário</div>
            <div className="field">
              <label>Selecionar paciente</label>
              <select value={pacId} onChange={e=>setPacId(e.target.value)}>
                <option value="">Selecione...</option>
                {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            {pac&&(
              <div style={{background:'var(--teal-light)',padding:'8px 12px',borderRadius:8,fontSize:12,color:'var(--teal)',marginBottom:12}}>
                📱 {pac.fone||'Sem telefone cadastrado'} · {pac.modalidade}
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={enviar} disabled={loading||!pacId}>
              <i className="ti ti-brand-whatsapp"/>
              {loading?'Enviando...':'Enviar por WhatsApp'}
            </button>

            {/* Histórico */}
            <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Histórico</div>
              {anas.length === 0
                ? <div style={{fontSize:12,color:'var(--text3)',textAlign:'center',padding:'12px 0'}}>Nenhuma anamnese enviada ainda.</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr>
                        <th style={{padding:'6px 8px',textAlign:'left',fontWeight:700,color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Paciente</th>
                        <th style={{padding:'6px 8px',textAlign:'left',fontWeight:700,color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Enviado</th>
                        <th style={{padding:'6px 8px',textAlign:'left',fontWeight:700,color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anas.slice(0,8).map(a=>{
                        const nome = pacientes.find(p=>p.id===a.paciente_id)?.nome || '?'
                        const statusCls = a.status==='preenchido'?'sp-ok':a.status==='enviado'?'sp-sent':'sp-pend'
                        return (
                          <tr key={a.id}>
                            <td style={{padding:'7px 8px',borderBottom:'1px solid var(--border)',color:'var(--text2)'}}>{nome}</td>
                            <td style={{padding:'7px 8px',borderBottom:'1px solid var(--border)',color:'var(--text3)'}}>{a.enviado_em?fmtData(a.enviado_em.slice(0,10)):'—'}</td>
                            <td style={{padding:'7px 8px',borderBottom:'1px solid var(--border)'}}><span className={`status-pill ${statusCls}`}>{a.status}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              }
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <div className="card-title"><i className="ti ti-eye"/>Preview — como o paciente vê</div>
            <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:10,padding:16}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2,color:'var(--text)'}}>{m.titulo}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>{CONFIG.psicologa.nome} · Psicóloga · {CONFIG.psicologa.cidade}</div>
              <div className="field"><label>Queixa principal</label><textarea rows={2} readOnly placeholder="Descreva o que te trouxe à terapia..." style={{resize:'none',cursor:'default'}}/></div>
              <div className="field"><label>Histórico de tratamentos</label><textarea rows={2} readOnly placeholder="Tratamentos anteriores..." style={{resize:'none',cursor:'default'}}/></div>
              <button className="btn btn-primary btn-full" disabled style={{opacity:0.5,cursor:'not-allowed'}}>Enviar respostas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
