'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Paciente, Evolucao } from '@/types'

const DEMO_CHUNKS = [
  'Paciente relata melhora nos episódios de ansiedade noturna. Praticou técnicas de respiração diafragmática.',
  'Trabalhamos reestruturação cognitiva em crenças disfuncionais associadas ao desempenho profissional.',
  'Sessão focada em autocompaixão. Resposta emocional intensa e produtiva. Planejamos exposição gradual.',
  'Paciente reconhece evolução significativa. Combinamos registro diário de pensamentos automáticos.',
]

export default function SmartNotes() {
  const { pacientes } = useStore()
  const [pacSel, setPacSel]       = useState<Paciente|null>(null)
  const [evsSel, setEvsSel]       = useState<Evolucao[]>([])
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]     = useState(0)
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft]         = useState('')
  const [showDraft, setShowDraft] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [cfgAuto, setCfgAuto]     = useState(true)
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const chunkRef = useRef<NodeJS.Timeout|null>(null)
  const idxRef   = useRef(0)
  const toast    = useToast()

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (chunkRef.current) clearInterval(chunkRef.current)
  }, [])

  const selectPac = async (id: string) => {
    const p = pacientes.find(x=>x.id===id)||null
    setPacSel(p)
    if (p) setEvsSel(await DB.getEvolucoes(p.id))
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startRec = () => {
    if (!pacSel) { toast('Selecione um paciente primeiro','danger'); return }
    setRecording(true); setSeconds(0); setTranscript(''); setShowDraft(false); setSaved(false)
    idxRef.current = 0
    timerRef.current = setInterval(()=>setSeconds(s=>s+1), 1000)
    chunkRef.current = setInterval(()=>{
      if (idxRef.current < DEMO_CHUNKS.length) {
        setTranscript(t => t + (t?'\n\n':'') + `[${fmtTime(idxRef.current*4)}] ${DEMO_CHUNKS[idxRef.current++]}`)
      }
    }, 4000)
  }

  const stopRec = () => {
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (chunkRef.current) clearInterval(chunkRef.current)
    if (cfgAuto) gerarDraft()
  }

  const gerarDraft = () => {
    setDraft(`Queixa principal:\nEpisódios de ansiedade relatados na semana, com impacto no contexto laboral e no sono.\n\nIntervenção:\nIdentificação e questionamento socrático de pensamento automático disfuncional. Reestruturação cognitiva com boa adesão.\n\nResposta à sessão:\nPositiva — alívio emocional observado. Reconhecimento de distorção cognitiva.\n\nPlano:\nRegistro diário de pensamentos automáticos entre sessões. Retorno em 1 semana.`)
    setShowDraft(true)
  }

  const salvarNoPront = async () => {
    if (!pacSel || !draft.trim()) return
    await DB.addEvolucao(pacSel.id, { texto: draft, gerado_luma: true, transcricao: transcript })
    setSaved(true); toast('Evolução salva no prontuário!')
    setEvsSel(await DB.getEvolucoes(pacSel.id))
  }

  return (
    <div>
      {/* Banner LUMA */}
      <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>LUMA ativada</div>
          <div style={{fontSize:12,color:'var(--luma-mid)'}}>Selecione o paciente, grave a sessão, acompanhe a transcrição e salve a evolução com 1 clique.</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
        {/* Coluna principal */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div className="card-title"><i className="ti ti-microphone"/>Gravação da sessão</div>

            <div className="field" style={{marginBottom:20}}>
              <label>Paciente desta sessão</label>
              <select value={pacSel?.id||''} onChange={e=>selectPac(e.target.value)}>
                <option value="">Selecione o paciente...</option>
                {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            {/* Timer e controles */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'20px 0'}}>
              <div style={{fontSize:36,fontWeight:800,color:'var(--text)',fontVariantNumeric:'tabular-nums',letterSpacing:'0.05em'}}>
                {fmtTime(seconds)}
              </div>

              {/* Waveform */}
              <div style={{display:'flex',gap:3,alignItems:'center',height:36}}>
                {Array.from({length:9}).map((_,i)=>(
                  <div key={i} style={{
                    width:5,height:recording?`${8+Math.random()*20}px`:'6px',
                    background:recording?'var(--teal)':'var(--border)',
                    borderRadius:3,transition:'height 0.2s',
                  }}/>
                ))}
              </div>

              <button
                onClick={recording?stopRec:startRec}
                style={{
                  width:66,height:66,borderRadius:'50%',border:'none',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'#fff',
                  background:recording?'var(--danger)':'var(--teal)',
                  boxShadow:recording?'0 0 0 6px rgba(198,40,40,0.2)':'0 4px 16px rgba(32,128,160,0.4)',
                  transition:'all 0.2s',
                }}>
                <i className={`ti ti-${recording?'player-stop-filled':'microphone'}`}/>
              </button>

              <div style={{fontSize:12,color:'var(--text3)',textAlign:'center'}}>
                {!pacSel?'Selecione o paciente e clique no microfone'
                  :recording?`Gravando · ${pacSel.nome}`
                  :seconds>0?`Gravação encerrada · ${fmtTime(seconds)}`
                  :'Pronto para gravar'}
              </div>
            </div>

            {/* Transcrição */}
            <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:13,minHeight:110}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                {recording&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--danger)',animation:'pulse 1s infinite'}}/>}
                Transcrição ao vivo
              </div>
              <div style={{fontSize:13,color:transcript?'var(--text2)':'var(--text3)',fontStyle:transcript?'normal':'italic',lineHeight:1.6,whiteSpace:'pre-line'}}>
                {transcript||'A transcrição aparecerá aqui durante a gravação...'}
              </div>
            </div>
          </div>

          {/* Rascunho LUMA */}
          {showDraft&&(
            <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:16}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>Rascunho gerado pela LUMA</div>
                  <div style={{fontSize:11,color:'var(--luma-mid)'}}>Revise e salve no prontuário</div>
                </div>
              </div>
              <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={6}
                style={{width:'100%',background:'#fff',border:'1px solid #DDD8F8',borderRadius:6,padding:'10px 12px',fontSize:13,color:'var(--text2)',lineHeight:1.65,resize:'vertical',fontFamily:'var(--font)'}}/>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button style={{flex:1,justifyContent:'center',background:'var(--luma)',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}
                  onClick={salvarNoPront}>
                  <i className="ti ti-device-floppy"/>Salvar no prontuário
                </button>
                <button className="btn btn-ghost" onClick={()=>setShowDraft(false)}><i className="ti ti-x"/>Descartar</button>
              </div>
              {saved&&<div style={{marginTop:10,fontSize:12,color:'var(--success)',background:'var(--success-bg)',padding:'8px 12px',borderRadius:8,textAlign:'center'}}><i className="ti ti-check"/> Evolução salva!</div>}
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {pacSel&&(
            <div className="card">
              <div className="card-title"><i className="ti ti-user"/>Sessão atual</div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:11,background:'var(--teal-light)',borderRadius:8}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {pacSel.avatar||pacSel.nome.slice(0,2)}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--teal)'}}>{pacSel.nome}</div>
                  <div style={{fontSize:11,color:'var(--teal-mid)'}}>{pacSel.modalidade} · {pacSel.sessoes_total} sessões</div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title" style={{color:'var(--luma)'}}><i className="ti ti-settings" style={{color:'var(--luma)'}}/>Config. LUMA</div>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer',marginBottom:8}}>
              <input type="checkbox" checked={cfgAuto} onChange={e=>setCfgAuto(e.target.checked)} style={{accentColor:'var(--luma)',width:16,height:16}}/>
              Gerar evolução ao parar gravação
            </label>
            {!cfgAuto&&<button className="btn btn-ghost btn-sm" onClick={gerarDraft} disabled={!transcript}><i className="ti ti-sparkles"/>Gerar com LUMA</button>}
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-history"/>Últimas sessões LUMA</div>
            {!pacSel
              ? <div style={{fontSize:12,color:'var(--text3)'}}>Selecione um paciente para ver o histórico.</div>
              : evsSel.filter(e=>e.gerado_luma).length===0
              ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma sessão LUMA registrada.</div>
              : evsSel.filter(e=>e.gerado_luma).slice(0,5).map(e=>(
                  <div key={e.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:12,color:'var(--text2)'}}>{e.data} — {e.texto.slice(0,40)}...</span>
                    <span className="badge b-luma" style={{fontSize:10,flexShrink:0}}>LUMA</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
