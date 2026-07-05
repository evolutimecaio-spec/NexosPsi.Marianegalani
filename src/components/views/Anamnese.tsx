'use client'
import { useEffect, useState } from 'react'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Paciente, Anamnese as AnamneseType } from '@/types'
import { fmtData } from '@/lib/db'
import { CONFIG } from '@/lib/config'

const MODELOS = {
  adulto:    ['Nome completo *','Data de nascimento *','Queixa principal *','Histórico anterior','Uso de medicação','Expectativa'],
  infantil:  ['Nome da criança *','Responsável *','Diagnóstico/suspeita','Queixa dos responsáveis *','Histórico escolar','Medicação em uso'],
  supervisao:['Supervisanda *','CRP *','Abordagem','Caso supervisionado *','Hipótese diagnóstica','Objetivo'],
}

export default function Anamnese() {
  const [pacs, setPacs]     = useState<Paciente[]>([])
  const [anas, setAnas]     = useState<AnamneseType[]>([])
  const [modelo, setModelo] = useState<keyof typeof MODELOS>('adulto')
  const [pacEnvio, setPacEnvio] = useState('')
  const [loading, setLoading]   = useState(false)
  const toast = useToast()

  useEffect(()=>{
    Promise.all([DB.getPacientes(), DB.getAnamneses()]).then(([p,a])=>{ setPacs(p); setAnas(a) })
  },[])

  const enviar = async () => {
    if (!pacEnvio) { toast('Selecione o paciente','danger'); return }
    const pac = pacs.find(p=>p.id===pacEnvio)
    if (!pac) return
    setLoading(true)
    await DB.addAnamnese(pac.id, modelo)
    const msg = `Olá, ${pac.nome.split(' ')[0]}! 🌸\n\nAqui é ${CONFIG.psicologa.nome}. Para preparar nosso encontro, gostaria que você preenchesse a anamnese inicial.\n\nResponda com calma antes da nossa sessão. 🌿\n\nQualquer dúvida, estou por aqui!`
    if (pac.fone) window.open(`https://wa.me/${pac.fone}?text=${encodeURIComponent(msg)}`, '_blank')
    toast('Anamnese enviada para '+pac.nome.split(' ')[0]+'!')
    setAnas(await DB.getAnamneses())
    setLoading(false)
  }

  const titulos: Record<string,string> = { adulto:'Anamnese Inicial — Adultos', infantil:'Anamnese Infantil', supervisao:'Ficha de Supervisão' }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>Crie formulários de anamnese e envie ao paciente por WhatsApp.</div>
      </div>
      <div className="ana-layout">
        <div className="card">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <select value={modelo} onChange={e=>setModelo(e.target.value as any)} style={{flex:1,border:'1px solid var(--border)',borderRadius:8,padding:'7px 12px',fontSize:13,fontFamily:'var(--font)',background:'var(--warm)',color:'var(--text)'}}>
              <option value="adulto">Anamnese Inicial — Adultos</option>
              <option value="infantil">Anamnese Infantil / Neurodivergente</option>
              <option value="supervisao">Ficha de Supervisão</option>
            </select>
          </div>
          {MODELOS[modelo].map((campo,i)=>(
            <div key={i} className="field-row-item">
              <i className="ti ti-grip-vertical" style={{color:'var(--text3)',fontSize:14}}/>
              <div className="fr-info">
                <div className="fr-name">{campo}</div>
                <div className="fr-type">{campo.includes('*')?'Obrigatório':'Opcional'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="col">
          <div className="card">
            <div className="card-title"><i className="ti ti-send"/>Enviar formulário</div>
            <div className="field"><label>Selecionar paciente</label>
              <select value={pacEnvio} onChange={e=>setPacEnvio(e.target.value)}>
                <option value="">Selecione...</option>
                {pacs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <button className="btn btn-sage btn-full" onClick={enviar} disabled={loading}><i className="ti ti-brand-whatsapp"/>{loading?'Enviando...':'Enviar por WhatsApp'}</button>
            <div style={{marginTop:16,borderTop:'1px solid var(--border)',paddingTop:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Histórico</div>
              <table className="ana-table">
                <thead><tr><th>Paciente</th><th>Enviado</th><th>Status</th></tr></thead>
                <tbody>
                  {anas.slice(0,10).map(a=>{
                    const pac = pacs.find(p=>p.id===a.paciente_id)
                    return (
                      <tr key={a.id}>
                        <td>{(a.paciente as any)?.nome||pac?.nome||'?'}</td>
                        <td>{a.enviado_em?fmtData(a.enviado_em.slice(0,10)):'—'}</td>
                        <td><span className={`status-pill ${a.status==='preenchido'?'sp-ok':a.status==='enviado'?'sp-sent':'sp-pend'}`}>{a.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-title"><i className="ti ti-eye"/>Preview — como o paciente vê</div>
            <div className="preview-shell">
              <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{titulos[modelo]}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>{CONFIG.psicologa.nome} · Psicóloga · {CONFIG.psicologa.cidade}</div>
              <div className="field"><label>Queixa principal</label><textarea rows={3} readOnly placeholder="Descreva o que te trouxe à terapia..."/></div>
              <button className="btn btn-sage btn-full" style={{fontSize:13}} disabled>Enviar respostas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
