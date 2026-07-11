'use client'
import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import type { Paciente, Evolucao } from '@/types'

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any }
}

type Status = 'idle'|'solicitando'|'gravando'|'encerrado'

export default function SmartNotes() {
  const { pacientes } = useStore()
  const [pacSel, setPacSel]       = useState<Paciente|null>(null)
  const [evsSel, setEvsSel]       = useState<Evolucao[]>([])
  const [status, setStatus]       = useState<Status>('idle')
  const [seconds, setSeconds]     = useState(0)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim]     = useState('')
  const [draft, setDraft]         = useState('')
  const [showDraft, setShowDraft] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const recordingRef  = useRef(false)
  const transcriptRef = useRef('')
  const timerRef      = useRef<NodeJS.Timeout|null>(null)
  const recognRef     = useRef<any>(null)
  const streamRef     = useRef<MediaStream|null>(null)
  const toast = useToast()

  const suportado = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const fmtTime = (s: number) =>
    `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const gerarDraft = useCallback((texto: string) => {
    if (!texto.trim()) { toast('Nenhuma fala detectada. Verifique o microfone.', 'danger'); return }
    const frases = texto.split(/[.!?]/).filter(f => f.trim())
    setDraft(
      `Queixa principal:\n${frases[0]?.trim() || '—'}.\n\n` +
      `Conteúdo da sessão:\n${texto.trim()}\n\n` +
      `Plano para próxima sessão:\n`
    )
    setShowDraft(true)
  }, [])

  const criarRecognizer = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'pt-BR'
    r.continuous = true
    r.interimResults = true
    r.maxAlternatives = 1

    r.onstart = () => {
      setStatusMsg('Microfone ativo — fale normalmente')
    }

    r.onresult = (event: any) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += t + ' '
        else interimChunk += t
      }
      if (finalChunk) {
        transcriptRef.current += finalChunk
        setTranscript(transcriptRef.current)
      }
      setInterim(interimChunk)
    }

    r.onspeechend = () => {
      setStatusMsg('Silêncio detectado...')
    }

    r.onerror = (event: any) => {
      console.warn('speech error:', event.error)
      if (event.error === 'not-allowed') {
        setStatusMsg('Permissão de microfone negada!')
        stopRec()
      } else if (event.error === 'network') {
        setStatusMsg('Erro de rede — verifique sua conexão')
      } else if (event.error === 'no-speech') {
        setStatusMsg('Nenhuma fala detectada, continue...')
      }
    }

    r.onend = () => {
      if (!recordingRef.current) return
      setStatusMsg('Reconectando...')
      try {
        recognRef.current = criarRecognizer()
        recognRef.current.start()
      } catch (e) {
        console.warn('restart error:', e)
      }
    }

    return r
  }, [])

  const startRec = async () => {
    if (!pacSel) { toast('Selecione um paciente primeiro', 'danger'); return }
    if (!suportado) { toast('Use Google Chrome ou Microsoft Edge', 'danger'); return }

    setStatus('solicitando')
    setStatusMsg('Solicitando permissão do microfone...')
    setTranscript('')
    setInterim('')
    transcriptRef.current = ''
    setShowDraft(false)
    setSaved(false)

    // Pedir permissão explícita — liberar imediatamente para o SpeechRecognition usar
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Liberar o mic imediatamente — SpeechRecognition precisa do acesso exclusivo
      stream.getTracks().forEach(t => t.stop())
      setStatusMsg('Permissão concedida! Iniciando reconhecimento...')
    } catch (err: any) {
      setStatus('idle')
      if (err.name === 'NotAllowedError') {
        setStatusMsg('Permissão negada. Clique no cadeado na barra de endereços e permita o microfone.')
        toast('Permissão de microfone negada. Permita o acesso e tente novamente.', 'danger')
      } else {
        setStatusMsg('Microfone não encontrado.')
        toast('Microfone não encontrado.', 'danger')
      }
      return
    }

    // Iniciar reconhecimento
    recordingRef.current = true
    setStatus('gravando')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    try {
      const r = criarRecognizer()
      recognRef.current = r
      r.start()
    } catch (e: any) {
      toast('Erro ao iniciar reconhecimento: ' + e.message, 'danger')
      setStatus('idle')
      recordingRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const stopRec = useCallback(() => {
    recordingRef.current = false
    setStatus('encerrado')
    setInterim('')
    setStatusMsg('')
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognRef.current) {
      try { recognRef.current.onend = null; recognRef.current.abort() } catch {}
      recognRef.current = null
    }
    // Stream já foi liberado imediatamente após obter permissão
    const texto = transcriptRef.current
    setTimeout(() => gerarDraft(texto), 300)
  }, [gerarDraft])

  const selectPac = async (id: string) => {
    const p = pacientes.find(x => x.id === id) || null
    setPacSel(p)
    if (p) setEvsSel(await DB.getEvolucoes(p.id))
  }

  const salvar = async () => {
    if (!pacSel || !draft.trim()) return
    setSaving(true)
    try {
      await DB.addEvolucao(pacSel.id, { texto: draft, gerado_luma: true, transcricao: transcriptRef.current })
      setSaved(true)
      toast('Evolução salva no prontuário!')
      setEvsSel(await DB.getEvolucoes(pacSel.id))
    } catch (e: any) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  const isGravando = status === 'gravando'

  return (
    <div>
      <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>L</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>LUMA ativada</div>
          <div style={{fontSize:12,color:'var(--luma-mid)'}}>
            {suportado ? 'Grave a sessão em português e salve a evolução com 1 clique.' : 'Use Google Chrome ou Microsoft Edge para transcrição.'}
          </div>
        </div>
        {!suportado && <span style={{fontSize:11,background:'#FFF0F0',color:'var(--danger)',padding:'3px 8px',borderRadius:6,fontWeight:600}}>Navegador incompatível</span>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
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

            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'16px 0'}}>
              <div style={{fontSize:40,fontWeight:800,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>
                {fmtTime(seconds)}
              </div>

              {/* Indicador de áudio */}
              <div style={{display:'flex',gap:3,alignItems:'center',height:36}}>
                {Array.from({length:11}).map((_,i)=>(
                  <div key={i} style={{
                    width:5, borderRadius:3,
                    height: isGravando ? `${8 + Math.abs(Math.sin(i * 0.8) * 20)}px` : '6px',
                    background: isGravando ? 'var(--teal)' : 'var(--border)',
                    animation: isGravando ? `wave${i%3} ${0.6+i*0.08}s ease-in-out infinite alternate` : 'none',
                  }}/>
                ))}
              </div>
              <style>{`
                @keyframes wave0{from{height:6px}to{height:28px}}
                @keyframes wave1{from{height:6px}to{height:20px}}
                @keyframes wave2{from{height:6px}to{height:24px}}
              `}</style>

              {/* Botão */}
              <button
                onClick={isGravando ? stopRec : startRec}
                disabled={!suportado || status === 'solicitando'}
                style={{
                  width:72,height:72,borderRadius:'50%',border:'none',
                  cursor: suportado && status !== 'solicitando' ? 'pointer' : 'not-allowed',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:28,color:'#fff',
                  background: status === 'solicitando' ? 'var(--border)' : isGravando ? 'var(--danger)' : 'var(--teal)',
                  boxShadow: isGravando ? '0 0 0 10px rgba(198,40,40,0.12)' : '0 4px 20px rgba(32,128,160,0.4)',
                  transition:'all 0.2s',
                }}>
                <i className={`ti ti-${status === 'solicitando' ? 'loader' : isGravando ? 'player-stop-filled' : 'microphone'}`}/>
              </button>

              {/* Status em tempo real */}
              <div style={{fontSize:12,textAlign:'center',minHeight:18}}>
                {statusMsg
                  ? <span style={{color: statusMsg.includes('negada') || statusMsg.includes('Erro') ? 'var(--danger)' : isGravando ? 'var(--teal)' : 'var(--text3)'}}>{statusMsg}</span>
                  : <span style={{color:'var(--text3)'}}>
                      {status === 'idle' && !pacSel && 'Selecione o paciente e clique no microfone'}
                      {status === 'idle' && pacSel && 'Clique no microfone para iniciar'}
                      {status === 'encerrado' && `Gravação encerrada · ${fmtTime(seconds)}`}
                    </span>
                }
              </div>
            </div>

            {/* Transcrição */}
            <div style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:8,padding:13,minHeight:100}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                {isGravando && <div style={{width:8,height:8,borderRadius:'50%',background:'var(--danger)',animation:'pulse 1s infinite'}}/>}
                Transcrição ao vivo
              </div>
              <div style={{fontSize:13,lineHeight:1.7,minHeight:60,wordBreak:'break-word'}}>
                {transcript && <span style={{color:'var(--text2)'}}>{transcript}</span>}
                {interim && <span style={{color:'var(--text3)',fontStyle:'italic'}}>{interim}</span>}
                {!transcript && !interim && (
                  <span style={{color:'var(--text3)',fontStyle:'italic'}}>
                    {isGravando ? 'Aguardando fala...' : 'A transcrição aparecerá aqui durante a gravação...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showDraft && (
            <div style={{background:'var(--luma-light)',border:'1px solid #C8BEF0',borderRadius:10,padding:16}}>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--luma)',color:'#fff',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>L</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--luma)'}}>Rascunho gerado pela LUMA</div>
                  <div style={{fontSize:11,color:'var(--luma-mid)'}}>Revise e salve no prontuário</div>
                </div>
              </div>
              <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={7}
                style={{width:'100%',background:'#fff',border:'1px solid #DDD8F8',borderRadius:6,padding:'10px 12px',fontSize:13,color:'var(--text2)',lineHeight:1.65,resize:'vertical',fontFamily:'var(--font)'}}/>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button onClick={salvar} disabled={saving}
                  style={{flex:1,background:'var(--luma)',color:'#fff',border:'none',borderRadius:8,padding:'9px 14px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:saving?0.6:1}}>
                  <i className="ti ti-device-floppy"/>{saving?'Salvando...':'Salvar no prontuário'}
                </button>
                <button className="btn btn-ghost" onClick={()=>setShowDraft(false)}>
                  <i className="ti ti-x"/>Descartar
                </button>
              </div>
              {saved && <div style={{marginTop:10,fontSize:12,color:'var(--success)',background:'var(--success-bg)',padding:'8px 12px',borderRadius:8,textAlign:'center'}}><i className="ti ti-check"/> Evolução salva!</div>}
            </div>
          )}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {pacSel && (
            <div className="card">
              <div className="card-title"><i className="ti ti-user"/>Sessão atual</div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:11,background:'var(--teal-light)',borderRadius:8}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>
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
            <div className="card-title" style={{color:'var(--luma)'}}><i className="ti ti-settings" style={{color:'var(--luma)'}}/>Como usar</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                ['1', 'Selecione o paciente'],
                ['2', 'Clique no microfone'],
                ['3', 'Permita o acesso quando o Chrome perguntar'],
                ['4', 'Fale normalmente em português'],
                ['5', 'Clique em parar — a LUMA gera o rascunho'],
                ['6', 'Revise e salve no prontuário'],
              ].map(([n, t]) => (
                <div key={n} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'var(--luma)',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{n}</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.4}}>{t}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:'8px 10px',background:'#FFF8E1',borderRadius:8,fontSize:11,color:'#7A5800'}}>
              <i className="ti ti-alert-triangle" style={{marginRight:5}}/>
              Funciona apenas no <strong>Chrome</strong> ou <strong>Edge</strong>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-history"/>Últimas sessões LUMA</div>
            {!pacSel ? <div style={{fontSize:12,color:'var(--text3)'}}>Selecione um paciente.</div>
              : evsSel.filter(e=>e.gerado_luma).length === 0
              ? <div style={{fontSize:12,color:'var(--text3)'}}>Nenhuma sessão LUMA ainda.</div>
              : evsSel.filter(e=>e.gerado_luma).slice(0,5).map(e=>(
                  <div key={e.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:8}}>
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
