'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Paciente, Evolucao } from '@/types'

// Tipagem da Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function SmartNotes() {
  const { pacientes } = useStore()
  const [pacSel, setPacSel]           = useState<Paciente|null>(null)
  const [evsSel, setEvsSel]           = useState<Evolucao[]>([])
  const [recording, setRecording]     = useState(false)
  const [seconds, setSeconds]         = useState(0)
  const [transcript, setTranscript]   = useState('')
  const [interimText, setInterimText] = useState('')
  const [draft, setDraft]             = useState('')
  const [showDraft, setShowDraft]     = useState(false)
  const [saved, setSaved]             = useState(false)
  const [cfgAuto, setCfgAuto]         = useState(true)
  const [suportado, setSuportado]     = useState(true)
  const [saving, setSaving]           = useState(false)

  const timerRef  = useRef<NodeJS.Timeout|null>(null)
  const recognRef = useRef<any>(null)
  const toast     = useToast()

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSuportado(false)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognRef.current) recognRef.current.stop()
    }
  }, [])

  const selectPac = async (id: string) => {
    const p = pacientes.find(x => x.id === id) || null
    setPacSel(p)
    if (p) setEvsSel(await DB.getEvolucoes(p.id))
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const gerarDraft = useCallback((texto: string) => {
    if (!texto.trim()) return
    setDraft(
      `Queixa principal:\n${texto.split('.')[0] || '—'}.\n\n` +
      `Conteúdo da sessão:\n${texto}\n\n` +
      `Plano:\n`
    )
    setShowDraft(true)
  }, [])

  const startRec = () => {
    if (!pacSel) { toast('Selecione um paciente primeiro', 'danger'); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.', 'danger'); return }

    const recog = new SR()
    recog.lang = 'pt-BR'
    recog.continuous = true
    recog.interimResults = true
    recog.maxAlternatives = 1

    recog.onresult = (event: any) => {
      let finalChunk = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += text + ' '
        } else {
          interim += text
        }
      }
      if (finalChunk) {
        setTranscript(prev => prev + finalChunk)
      }
      setInterimText(interim)
    }

    recog.onerror = (event: any) => {
      if (event.error === 'no-speech') return // silencioso
      if (event.error === 'not-allowed') {
        toast('Permissão de microfone negada. Permita o acesso ao microfone no navegador.', 'danger')
        stopRec()
      }
    }

    recog.onend = () => {
      // Reiniciar automaticamente se ainda estiver gravando
      if (recognRef.current === recog && recording) {
        try { recog.start() } catch {}
      }
    }

    recognRef.current = recog
    recog.start()

    setRecording(true)
    setSeconds(0)
    setTranscript('')
    setInterimText('')
    setShowDraft(false)
    setSaved(false)

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const stopRec = () => {
    setRecording(false)
    setInterimText('')
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognRef.current) {
      recognRef.current.onend = null // evitar restart
      recognRef.current.stop()
      recognRef.current = null
    }
    if (cfgAuto) {
      setTimeout(() => {
        setTranscript(prev => { gerarDraft(prev); return prev })
      }, 300)
    }
  }

  const salvarNoPront = async () => {
    if (!pacSel || !draft.trim()) return
    setSaving(true)
    try {
      await DB.addEvolucao(pacSel.id, { texto: draft, gerado_luma: true, transcricao: transcript })
      setSaved(true)
      toast('Evolução salva no prontuário!')
      setEvsSel(await DB.getEvolucoes(pacSel.id))
    } catch(e:any) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  const textoCompleto = transcript + interimText

  return (
    <div>
      {/* Banner LUMA */}
      <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>LUMA ativada</div>
          <div style={{fontSize:12,color:'var(--luma-mid)'}}>
            {suportado
              ? 'Selecione o paciente, grave a sessão em português e salve a evolução com 1 clique.'
              : 'Seu navegador não suporta reconhecimento de voz. Use Google Chrome ou Microsoft Edge.'}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
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

            {/* Timer */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'20px 0'}}>
              <div style={{fontSize:40,fontWeight:800,color:'var(--text)',fontVariantNumeric:'tabular-nums',letterSpacing:'0.05em'}}>
                {fmtTime(seconds)}
              </div>

              {/* Waveform animado */}
              <div style={{display:'flex',gap:4,alignItems:'center',height:40}}>
                {Array.from({length:11}).map((_,i)=>(
                  <div key={i} style={{
                    width:5,
                    height: recording ? `${10 + Math.abs(Math.sin(Date.now()/200 + i) * 24)}px` : '6px',
                    background: recording ? 'var(--teal)' : 'var(--border)',
                    borderRadius:3,
                    transition:'height 0.15s ease',
                  }}/>
                ))}
              </div>

              {/* Botão gravar */}
              <button
                onClick={recording ? stopRec : startRec}
                disabled={!suportado}
                style={{
                  width:70,height:70,borderRadius:'50%',border:'none',cursor:suportado?'pointer':'not-allowed',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'#fff',
                  background: recording ? 'var(--danger)' : 'var(--teal)',
                  boxShadow: recording ? '0 0 0 8px rgba(198,40,40,0.15)' : '0 4px 20px rgba(32,128,160,0.4)',
                  transition:'all 0.2s',
                }}>
                <i className={`ti ti-${recording ? 'player-stop-filled' : 'microphone'}`}/>
              </button>

              <div style={{fontSize:12,color:'var(--text3)',textAlign:'center'}}>
                {!pacSel ? 'Selecione o paciente e clique no microfone'
                  : recording ? `Gravando — ${pacSel.nome}`
                  : seconds > 0 ? `Gravação encerrada · ${fmtTime(seconds)}`
                  : 'Pronto para gravar'}
              </div>
            </div>

            {/* Transcrição em tempo real */}
            <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:13,minHeight:120}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                {recording && <div style={{width:8,height:8,borderRadius:'50%',background:'var(--danger)',animation:'pulse 1s infinite'}}/>}
                Transcrição ao vivo
              </div>
              <div style={{fontSize:13,lineHeight:1.7,minHeight:60}}>
                {transcript && <span style={{color:'var(--text2)'}}>{transcript}</span>}
                {interimText && <span style={{color:'var(--text3)',fontStyle:'italic'}}>{interimText}</span>}
                {!textoCompleto && <span style={{color:'var(--text3)',fontStyle:'italic'}}>A transcrição aparecerá aqui durante a gravação...</span>}
              </div>
            </div>

            {/* Botão gerar manualmente */}
            {!cfgAuto && transcript && !showDraft && (
              <button className="btn btn-ghost" style={{marginTop:10}} onClick={()=>gerarDraft(transcript)}>
                <i className="ti ti-sparkles"/>Gerar rascunho com LUMA
              </button>
            )}
          </div>

          {/* Rascunho LUMA */}
          {showDraft && (
            <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:16}}>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>Rascunho gerado pela LUMA</div>
                  <div style={{fontSize:11,color:'var(--luma-mid)'}}>Revise e salve no prontuário</div>
                </div>
              </div>
              <textarea
                value={draft}
                onChange={e=>setDraft(e.target.value)}
                rows={7}
                style={{width:'100%',background:'#fff',border:'1px solid #DDD8F8',borderRadius:6,padding:'10px 12px',fontSize:13,color:'var(--text2)',lineHeight:1.65,resize:'vertical',fontFamily:'var(--font)'}}
              />
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button
                  onClick={salvarNoPront}
                  disabled={saving}
                  style={{flex:1,justifyContent:'center',background:'var(--luma)',color:'#fff',border:'none',borderRadius:8,padding:'9px 14px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,opacity:saving?0.6:1}}>
                  <i className="ti ti-device-floppy"/>
                  {saving ? 'Salvando...' : 'Salvar no prontuário'}
                </button>
                <button className="btn btn-ghost" onClick={()=>setShowDraft(false)}>
                  <i className="ti ti-x"/>Descartar
                </button>
              </div>
              {saved && (
                <div style={{marginTop:10,fontSize:12,color:'var(--success)',background:'var(--success-bg)',padding:'8px 12px',borderRadius:8,textAlign:'center'}}>
                  <i className="ti ti-check"/> Evolução salva com sucesso!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {pacSel && (
            <div className="card">
              <div className="card-title"><i className="ti ti-user"/>Sessão atual</div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:11,background:'var(--teal-light)',borderRadius:8}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {pacSel.avatar || pacSel.nome.slice(0,2)}
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
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer',marginBottom:12}}>
              <input type="checkbox" checked={cfgAuto} onChange={e=>setCfgAuto(e.target.checked)} style={{accentColor:'var(--luma)',width:16,height:16}}/>
              Gerar evolução ao parar gravação
            </label>
            <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.6,background:'var(--warm)',padding:'8px 10px',borderRadius:8}}>
              <i className="ti ti-info-circle" style={{marginRight:5}}/>
              Requer Chrome ou Edge. Fale em <strong>português</strong>. Mantenha o microfone próximo.
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-history"/>Últimas sessões LUMA</div>
            {!pacSel
              ? <div style={{fontSize:12,color:'var(--text3)'}}>Selecione um paciente.</div>
              : evsSel.filter(e=>e.gerado_luma).length === 0
              ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma sessão LUMA registrada.</div>
              : evsSel.filter(e=>e.gerado_luma).slice(0,5).map(e=>(
                  <div key={e.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>{DB.fmtData(e.data)}</div>
                      <div style={{fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.texto.slice(0,50)}...</div>
                    </div>
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
