'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Paciente, Evolucao } from '@/types'

const TRANSCRIPT_CHUNKS = [
  '[00:00] Paciente inicia relatando a semana. Descreve dois episódios de ansiedade — um em reunião de trabalho, outro antes de dormir.',
  '[04:23] Identificamos pensamento automático: "Vou falhar na apresentação e serei demitida." Iniciamos questionamento socrático.',
  '[09:47] Paciente reconhece que nunca recebeu feedback negativo formal. Reestruturação cognitiva em andamento.',
  '[14:30] Planejamento comportamental. Combinamos registro diário de pensamentos automáticos.',
]

export default function SmartNotes() {
  const [pacs, setPacs]         = useState<Paciente[]>([])
  const [pacSel, setPacSel]     = useState<Paciente|null>(null)
  const [evsSel, setEvsSel]     = useState<Evolucao[]>([])
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]   = useState(0)
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft]       = useState('')
  const [showDraft, setShowDraft] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [cfgAuto, setCfgAuto]   = useState(true)
  const [cfgModelo, setCfgModelo] = useState(true)
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const tRef     = useRef<NodeJS.Timeout|null>(null)
  const tIdxRef  = useRef(0)
  const toast    = useToast()

  useEffect(() => {
    DB.getPacientes().then(setPacs)
    return () => { if(timerRef.current) clearInterval(timerRef.current); if(tRef.current) clearInterval(tRef.current) }
  }, [])

  const selectPac = async (nome: string) => {
    const p = pacs.find(x=>x.nome===nome)||null
    setPacSel(p)
    if (p) setEvsSel(await DB.getEvolucoes(p.id))
  }

  const fmtTime = (s: number) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startRec = () => {
    if (!pacSel) { toast('Selecione um paciente antes de gravar','danger'); return }
    setRecording(true); setSeconds(0); setTranscript(''); setShowDraft(false); setSaved(false)
    tIdxRef.current = 0
    timerRef.current = setInterval(()=>setSeconds(s=>s+1),1000)
    tRef.current = setInterval(()=>{
      if (tIdxRef.current < TRANSCRIPT_CHUNKS.length) {
        setTranscript(t=>t+(t?'\n\n':'')+TRANSCRIPT_CHUNKS[tIdxRef.current++])
      }
    },3500)
  }

  const stopRec = () => {
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (tRef.current)     clearInterval(tRef.current)
    if (cfgAuto) gerarDraft()
  }

  const gerarDraft = () => {
    const txt = cfgModelo
      ? `**Queixa principal:** Episódios de ansiedade relatados na semana, com impacto no contexto laboral e no sono.\n\n**Intervenção:** Identificação e questionamento socrático de pensamento automático disfuncional. Reestruturação cognitiva com boa adesão.\n\n**Resposta à sessão:** Positiva — alívio emocional observado. Reconhecimento de distorção cognitiva.\n\n**Plano:** Registro diário de pensamentos automáticos entre sessões. Retorno em 1 semana.`
      : transcript
    setDraft(txt); setShowDraft(true)
  }

  const salvarNoPront = async () => {
    if (!pacSel || !draft.trim()) return
    await DB.addEvolucao(pacSel.id, { texto: draft, gerado_luma: true, transcricao: transcript })
    setSaved(true); toast('Evolução salva no prontuário de '+pacSel.nome.split(' ')[0]+'!')
    setEvsSel(await DB.getEvolucoes(pacSel.id))
  }

  return (
    <div>
      <div style={{background:'#EAF4FB',border:'1px solid #B0D4EC',borderRadius:'var(--radius)',padding:'13px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:11,fontSize:13,color:'var(--luma)'}}>
        <div className="luma-mark">L</div>
        <div><strong>LUMA ativada</strong> — Selecione o paciente, grave a sessão, acompanhe a transcrição e salve a evolução com 1 clique.</div>
      </div>
      <div className="g-sn">
        <div className="col">
          <div className="recorder">
            <div className="card-title"><i className="ti ti-microphone"/>Gravação da sessão</div>
            <div className="field" style={{marginBottom:14}}>
              <label>Paciente desta sessão</label>
              <select value={pacSel?.nome||''} onChange={e=>selectPac(e.target.value)}>
                <option value="">Selecione o paciente...</option>
                {pacs.map(p=><option key={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="rec-panel">
              <div className="rec-timer">{fmtTime(seconds)}</div>
              <div className="waveform">
                {Array.from({length:9}).map((_,i)=>(
                  <div key={i} className={`wv${recording?' active':''}`} style={{height:'8px','--h':`${12+Math.random()*20}px`,'--d':`${0.35+Math.random()*0.5}s`} as any}/>
                ))}
              </div>
              <button className={`rec-big-btn ${recording?'recording':'idle'}`} onClick={recording?stopRec:startRec}>
                <i className={`ti ti-${recording?'player-stop-filled':'microphone'}`}/>
              </button>
              <div className="rec-status-label">
                {!pacSel ? 'Selecione o paciente e clique no microfone' : recording ? `Gravando · ${pacSel.nome}` : seconds>0 ? `Gravação encerrada · ${fmtTime(seconds)}` : 'Pronto para gravar'}
              </div>
            </div>
            <div className="transcript-box">
              <div className="transcript-header">
                {recording && <div className="live-pulse"/>}Transcrição ao vivo
              </div>
              <div className="transcript-text" style={{color:transcript?'var(--text2)':'var(--text3)',fontStyle:transcript?'normal':'italic'}}>
                {transcript || 'A transcrição aparecerá aqui durante a gravação...'}
              </div>
            </div>
            {showDraft && (
              <div className="luma-draft-box">
                <div className="luma-hdr">
                  <div className="luma-mark">L</div>
                  <div><div className="luma-title">Rascunho gerado pela LUMA</div><div className="luma-sub">Revise e salve no prontuário com 1 clique</div></div>
                </div>
                <textarea className="luma-text" value={draft} onChange={e=>setDraft(e.target.value)} rows={6} style={{width:'100%'}}/>
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  <button className="btn btn-luma" style={{flex:1,justifyContent:'center'}} onClick={salvarNoPront}><i className="ti ti-device-floppy"/>Salvar no prontuário</button>
                  <button className="btn btn-ghost" onClick={()=>setShowDraft(false)}><i className="ti ti-x"/>Descartar</button>
                </div>
                {saved && <div style={{marginTop:10,fontSize:12,color:'var(--success)',background:'var(--success-bg)',padding:'8px 12px',borderRadius:8,textAlign:'center'}}><i className="ti ti-check"/> Evolução salva no prontuário!</div>}
              </div>
            )}
          </div>
        </div>
        <div className="col">
          {pacSel && (
            <div className="card" style={{padding:14}}>
              <div className="card-title"><i className="ti ti-user"/>Sessão atual</div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:11,background:'var(--teal-light)',borderRadius:8,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{pacSel.avatar||pacSel.nome.slice(0,2)}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:'var(--teal)'}}>{pacSel.nome}</div><div style={{fontSize:11,color:'var(--teal-mid)'}}>{pacSel.modalidade} · {pacSel.sessoes_total} sessões</div></div>
              </div>
            </div>
          )}
          <div className="card" style={{padding:14}}>
            <div className="card-title"><i className="ti ti-history"/>Últimas sessões LUMA</div>
            {!pacSel ? <div style={{fontSize:12,color:'var(--text3)'}}>Selecione um paciente para ver o histórico.</div>
            : evsSel.filter(e=>e.gerado_luma).length===0 ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma sessão LUMA para {pacSel.nome.split(' ')[0]}.</div>
            : evsSel.filter(e=>e.gerado_luma).slice(0,5).map(e=>(
                <div key={e.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text2)'}}>{e.data} — {e.texto.slice(0,40)}...</span>
                  <span className="badge-luma badge" style={{fontSize:10}}>LUMA</span>
                </div>
              ))
            }
          </div>
          <div className="card" style={{padding:14,background:'var(--luma-light)',border:'1px solid #C8BEF0'}}>
            <div className="card-title" style={{color:'var(--luma)'}}><i className="ti ti-settings" style={{color:'var(--luma)'}}/>Config. LUMA</div>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginBottom:8}}>
              <input type="checkbox" checked={cfgAuto} onChange={e=>setCfgAuto(e.target.checked)} style={{accentColor:'var(--luma)'}}/>Gerar evolução ao parar
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
              <input type="checkbox" checked={cfgModelo} onChange={e=>setCfgModelo(e.target.checked)} style={{accentColor:'var(--luma)'}}/>Usar modelo estruturado (TCC)
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
