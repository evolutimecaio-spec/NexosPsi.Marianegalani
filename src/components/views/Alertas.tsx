'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import * as DB from '@/lib/db'
import { fmtData, fmtMoeda, getLocal } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { Empty } from '@/components/ui'
import type { Paciente } from '@/types'

type TipoAlerta = 'sessao'|'cobranca'|'anamnese'|'cartao'|'todos'
interface Alerta {
  id: string
  tipo: TipoAlerta
  paciente: Paciente
  titulo: string
  subtitulo: string
  msg: string
  urgencia: 'alta'|'media'|'baixa'
}

function buildMsgSessao(pac: Paciente, data: string, hora: string): string {
  const local = pac.modalidade === 'Online' ? 'Envio o link um pouco antes.' : `Nos encontramos em ${CONFIG.psicologa.endereco}.`
  return `Olá, ${pac.nome.split(' ')[0]}!\n\nPassando para lembrar da nossa sessão *${fmtData(data)} às ${hora}*.\n${local}\n\nPode confirmar respondendo *SIM* ou *NÃO*?\n\nAté lá!`
}
function buildMsgCobranca(pac: Paciente, valor: number): string {
  return `Olá, ${pac.nome.split(' ')[0]}!\n\nPassando para te lembrar sobre o pagamento de *${fmtMoeda(valor)}* referente às nossas sessões.\n\nPode pagar pelo PIX: *${CONFIG.financeiro.chavePix}*\n\nSe já realizou o pagamento, desconsidere. Obrigada!`
}
function buildMsgAnamnese(pac: Paciente): string {
  return `Olá, ${pac.nome.split(' ')[0]}!\n\nAntes da nossa primeira sessão, gostaria que você preenchesse uma ficha de anamnese para me ajudar a te conhecer melhor.\n\nResponda com calma, tudo que você compartilhar é confidencial. Qualquer dúvida, pode me chamar aqui!`
}
function buildMsgCartao(pac: Paciente, tarefas: string[]): string {
  const lista = tarefas.map((t,i) => `${i+1}. ${t}`).join('\n')
  return `Olá, ${pac.nome.split(' ')[0]}!\n\nPreparei as suas atividades terapêuticas para esta semana:\n\n${lista}\n\nQualquer dúvida sobre as atividades, pode me perguntar. Estou torcendo por você!`
}

export default function Alertas() {
  const router = useRouter()
  const { pacientes, inad, reload } = useStore()
  const [alertas, setAlertas]     = useState<Alerta[]>([])
  const [filtro, setFiltro]       = useState<TipoAlerta>('todos')
  const [loading, setLoading]     = useState(true)
  const [enviados, setEnviados]   = useState<Set<string>>(new Set())

  const gerarAlertas = useCallback(async () => {
    setLoading(true)
    const lista: Alerta[] = []

    try {
      // Sessões de amanhã e depois de amanhã
      const amanha = new Date(); amanha.setDate(amanha.getDate() + 1)
      const depois = new Date(); depois.setDate(depois.getDate() + 2)
      const fmt = (d: Date) => d.toISOString().slice(0,10)
      const [agsAmanha, agsDepois] = await Promise.all([
        DB.getAgendamentos({ data: fmt(amanha) }),
        DB.getAgendamentos({ data: fmt(depois) }),
      ])

      ;[...agsAmanha, ...agsDepois].forEach(ag => {
        const pac = pacientes.find(p => p.id === ag.paciente_id)
        if (!pac?.fone) return
        lista.push({
          id: `sessao-${ag.id}`,
          tipo: 'sessao',
          paciente: pac,
          titulo: `Sessão ${fmtData(ag.data)} às ${ag.hora}`,
          subtitulo: `${ag.modalidade} · ${getLocal(pac.local_id)?.nome||'—'}`,
          msg: buildMsgSessao(pac, ag.data, ag.hora),
          urgencia: ag.data === fmt(amanha) ? 'alta' : 'media',
        })
      })

      // Cobranças em aberto
      inad.forEach(({ paciente, fatura, diasAtraso }) => {
        if (!paciente.fone) return
        lista.push({
          id: `cobranca-${fatura.id}`,
          tipo: 'cobranca',
          paciente: paciente as Paciente,
          titulo: `Cobrança em aberto — ${fmtMoeda(fatura.valor)}`,
          subtitulo: `${diasAtraso}d em atraso · Venc. ${fmtData(fatura.vencimento)}`,
          msg: buildMsgCobranca(paciente as Paciente, fatura.valor),
          urgencia: diasAtraso > 7 ? 'alta' : 'media',
        })
      })

      // Anamneses não enviadas — pacientes sem anamnese
      const anas = await DB.getAnamneses()
      const pacsComAna = new Set(anas.map(a => a.paciente_id))
      pacientes.forEach(pac => {
        if (pacsComAna.has(pac.id) || !pac.fone) return
        if (pac.sessoes_total > 0) return // já tem sessões, não é novato
        lista.push({
          id: `anamnese-${pac.id}`,
          tipo: 'anamnese',
          paciente: pac,
          titulo: `Anamnese pendente`,
          subtitulo: `Nenhuma ficha enviada ainda`,
          msg: buildMsgAnamnese(pac),
          urgencia: 'baixa',
        })
      })

      // Cartões com tarefas da semana
      const cartoes = await DB.getCartoes()
      cartoes.forEach(c => {
        const pac = pacientes.find(p => p.id === c.paciente_id)
        if (!pac?.fone || !c.ativo || c.tarefas.length === 0) return
        const feitas = c.tarefas.filter(t => t.feita).length
        if (feitas === c.tarefas.length) return // já completou tudo
        const pendentes = c.tarefas.filter(t => !t.feita).map(t => t.titulo)
        lista.push({
          id: `cartao-${c.id}`,
          tipo: 'cartao',
          paciente: pac,
          titulo: `Cartão terapêutico — ${c.titulo}`,
          subtitulo: `${feitas}/${c.tarefas.length} tarefas concluídas`,
          msg: buildMsgCartao(pac, pendentes.slice(0,3)),
          urgencia: 'baixa',
        })
      })

      // Ordenar: alta → media → baixa
      const ordem = { alta: 0, media: 1, baixa: 2 }
      lista.sort((a, b) => ordem[a.urgencia] - ordem[b.urgencia])
      setAlertas(lista)
    } finally { setLoading(false) }
  }, [pacientes, inad])

  useEffect(() => { gerarAlertas() }, [gerarAlertas])

  const enviarMsg = (al: Alerta) => {
    window.open(`https://wa.me/${al.paciente.fone}?text=${encodeURIComponent(al.msg)}`, '_blank')
    setEnviados(s => new Set([...s, al.id]))
  }

  const enviarTodos = () => {
    const visiveis = alertas.filter(a => filtro === 'todos' || a.tipo === filtro)
    visiveis.forEach(al => {
      if (!enviados.has(al.id)) enviarMsg(al)
    })
  }

  const TIPO_CONFIG: Record<string,{label:string;icon:string;cor:string}> = {
    sessao:   { label:'Sessões', icon:'ti-calendar', cor:'var(--teal)' },
    cobranca: { label:'Cobranças', icon:'ti-coin', cor:'var(--danger)' },
    anamnese: { label:'Anamneses', icon:'ti-clipboard', cor:'var(--warn)' },
    cartao:   { label:'Cartões', icon:'ti-cards', cor:'var(--luma)' },
  }

  const URGENCIA_STYLE = {
    alta:  { bg:'#FFF0F0', border:'#FFCDD2', label:'Urgente' },
    media: { bg:'#FFF8E1', border:'#FFD740', label:'Hoje' },
    baixa: { bg:'var(--warm)', border:'var(--border)', label:'Pendente' },
  }

  const visiveis = alertas.filter(a => filtro === 'todos' || a.tipo === filtro)
  const contagem = Object.fromEntries(
    (['sessao','cobranca','anamnese','cartao'] as TipoAlerta[]).map(t => [t, alertas.filter(a => a.tipo === t).length])
  )

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:2}}>Central de alertas WhatsApp</div>
          <div style={{fontSize:12,color:'var(--text3)'}}>{alertas.length} mensagens pendentes · {enviados.size} enviadas nesta sessão</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={gerarAlertas}><i className="ti ti-refresh"/>Atualizar</button>
          {visiveis.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={enviarTodos}>
              <i className="ti ti-brand-whatsapp"/>Enviar todos ({visiveis.length})
            </button>
          )}
        </div>
      </div>

      {/* Filtros por tipo */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {([['todos','Todos','ti-list',alertas.length],
           ['sessao','Sessões','ti-calendar',contagem.sessao],
           ['cobranca','Cobranças','ti-coin',contagem.cobranca],
           ['anamnese','Anamneses','ti-clipboard',contagem.anamnese],
           ['cartao','Cartões','ti-cards',contagem.cartao],
        ] as [TipoAlerta|'todos', string, string, number][]).map(([id,label,icon,cnt])=>(
          <button key={id}
            onClick={()=>setFiltro(id as TipoAlerta)}
            style={{
              display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,
              border:`1px solid ${filtro===id?'var(--teal)':'var(--border)'}`,
              background:filtro===id?'var(--teal)':'var(--warm)',
              color:filtro===id?'#fff':'var(--text2)',
              fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',
            }}>
            <i className={`ti ${icon}`}/>{label}
            {cnt>0&&<span style={{background:filtro===id?'rgba(255,255,255,0.25)':'var(--border)',color:filtro===id?'#fff':'var(--text)',borderRadius:10,padding:'1px 6px',fontSize:11}}>{cnt}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>
          <i className="ti ti-loader" style={{fontSize:24,display:'block',marginBottom:8}}/>
          Gerando alertas...
        </div>
      ) : visiveis.length === 0 ? (
        <div style={{background:'var(--success-bg)',border:'1px solid #A5D6A7',borderRadius:10,padding:'20px 24px',textAlign:'center'}}>
          <i className="ti ti-check" style={{fontSize:28,color:'var(--success)',display:'block',marginBottom:8}}/>
          <div style={{fontSize:14,fontWeight:600,color:'var(--success)'}}>Tudo em dia!</div>
          <div style={{fontSize:12,color:'var(--success)',marginTop:4}}>Nenhuma mensagem pendente nesta categoria.</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {visiveis.map(al => {
            const tc = TIPO_CONFIG[al.tipo]
            const ug = URGENCIA_STYLE[al.urgencia]
            const jaEnviado = enviados.has(al.id)
            return (
              <div key={al.id} style={{
                background: jaEnviado ? '#F0FFF4' : ug.bg,
                border:`1px solid ${jaEnviado ? '#A5D6A7' : ug.border}`,
                borderRadius:10, padding:'14px 16px',
                display:'flex', alignItems:'flex-start', gap:14,
                opacity: jaEnviado ? 0.7 : 1,
              }}>
                {/* Avatar */}
                <div style={{
                  width:40,height:40,borderRadius:'50%',flexShrink:0,
                  background:getLocal(al.paciente.local_id)?.cor||'var(--teal)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:13,fontWeight:700,color:'#fff',
                }}>
                  {al.paciente.avatar||al.paciente.nome.slice(0,2)}
                </div>

                {/* Conteúdo */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2,flexWrap:'wrap'}}>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{al.paciente.nome}</span>
                    <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:tc.cor,fontWeight:600}}>
                      <i className={`ti ${tc.icon}`}/>{tc.label}
                    </span>
                    {al.urgencia==='alta'&&!jaEnviado&&(
                      <span style={{fontSize:10,fontWeight:700,background:'#FFCDD2',color:'var(--danger)',padding:'1px 7px',borderRadius:10}}>Urgente</span>
                    )}
                    {jaEnviado&&<span style={{fontSize:10,color:'var(--success)',fontWeight:600}}>✓ Enviado</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2}}>{al.titulo}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:10}}>{al.subtitulo}</div>

                  {/* Preview da mensagem */}
                  <div style={{background:'rgba(255,255,255,0.6)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',fontSize:12,color:'var(--text2)',lineHeight:1.5,whiteSpace:'pre-wrap',maxHeight:72,overflow:'hidden',position:'relative'}}>
                    {al.msg}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,height:24,background:'linear-gradient(transparent,rgba(255,255,255,0.8))'}}/>
                  </div>
                </div>

                {/* Ações */}
                <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                  {al.paciente.fone ? (
                    <a href={`https://wa.me/${al.paciente.fone}?text=${encodeURIComponent(al.msg)}`}
                      target="_blank" onClick={()=>setEnviados(s=>new Set([...s,al.id]))}
                      style={{
                        display:'flex',alignItems:'center',gap:6,padding:'7px 12px',
                        background:jaEnviado?'var(--warm)':'#25D366',color:jaEnviado?'var(--text2)':'#fff',
                        borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none',border:'none',cursor:'pointer',
                      }}>
                      <i className="ti ti-brand-whatsapp"/>
                      {jaEnviado?'Reenviar':'Enviar'}
                    </a>
                  ) : (
                    <span style={{fontSize:11,color:'var(--warn)'}}>Sem telefone</span>
                  )}
                  <button className="btn btn-ghost btn-sm"
                    onClick={()=>router.push(`/prontuario?id=${al.paciente.id}`)}>
                    Ver prontuário
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
