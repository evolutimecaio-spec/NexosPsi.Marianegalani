'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { fmtData, calcIdade } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import type { Paciente } from '@/types'

type TipoDoc = 'comparecimento'|'encaminhamento'|'declaracao'

const hoje = () => new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})

function gerarHTML(tipo: TipoDoc, pac: Paciente, extra: Record<string,string>): string {
  const { psicologa } = CONFIG
  const base = `
    <html><head><meta charset="UTF-8">
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #000; max-width: 680px; margin: 60px auto; padding: 0 40px; }
      h1 { font-size: 14pt; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
      .sub { text-align: center; font-size: 10pt; color: #555; margin-bottom: 40px; }
      p { margin-bottom: 12px; text-align: justify; }
      .assinatura { margin-top: 60px; text-align: center; }
      .linha { border-top: 1px solid #000; width: 260px; margin: 0 auto 6px; }
      .rodape { margin-top: 40px; font-size: 9pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
    </style></head><body>`

  if (tipo === 'comparecimento') return base + `
    <h1>Declaração de Comparecimento</h1>
    <div class="sub">Atendimento Psicológico</div>
    <p>Declaro, para os devidos fins, que o(a) Sr(a). <strong>${pac.nome}</strong>, 
    ${pac.nascimento ? `nascido(a) em ${fmtData(pac.nascimento)}, ${calcIdade(pac.nascimento)} anos, ` : ''}
    compareceu a atendimento psicológico neste consultório na data de 
    <strong>${extra.data || hoje()}</strong>${extra.hora ? `, às ${extra.hora}` : ''}, 
    com duração de <strong>${extra.duracao || '50 minutos'}</strong>.</p>
    <p>A presente declaração é fornecida a pedido do(a) interessado(a) para fins de 
    ${extra.finalidade || 'justificativa de ausência ao trabalho/escola'}.</p>
    <div class="assinatura">
      <div class="linha"></div>
      <strong>${psicologa.nome}</strong><br>
      Psicóloga — CRP ${psicologa.crp}<br>
      ${psicologa.cidade}, ${hoje()}
    </div>
    <div class="rodape">${psicologa.endereco}</div>
    </body></html>`

  if (tipo === 'encaminhamento') return base + `
    <h1>Encaminhamento Psicológico</h1>
    <div class="sub">Documento Clínico Confidencial</div>
    <p>Encaminho o(a) paciente <strong>${pac.nome}</strong>, 
    ${pac.nascimento ? `${calcIdade(pac.nascimento)} anos, ` : ''}
    ${pac.cid ? `CID-10: ${pac.cid}, ` : ''}
    para avaliação e/ou acompanhamento especializado em 
    <strong>${extra.especialidade || '____________________________'}</strong>.</p>
    <p><strong>Motivo do encaminhamento:</strong><br>
    ${extra.motivo || '____________________________________________________________________________________________.'}</p>
    <p><strong>Hipótese diagnóstica:</strong> ${pac.cid || extra.hipotese || 'A ser confirmada por especialista.'}</p>
    <p><strong>Observações relevantes:</strong><br>
    ${extra.obs || 'Paciente em acompanhamento psicológico regular. Encaminhamento para complementação do cuidado.'}</p>
    <div class="assinatura">
      <div class="linha"></div>
      <strong>${psicologa.nome}</strong><br>
      Psicóloga — CRP ${psicologa.crp}<br>
      ${psicologa.cidade}, ${hoje()}
    </div>
    <div class="rodape">${psicologa.endereco}</div>
    </body></html>`

  return base + `
    <h1>Declaração Psicológica</h1>
    <div class="sub">Documento Clínico</div>
    <p>Declaro que o(a) Sr(a). <strong>${pac.nome}</strong>, 
    ${pac.nascimento ? `nascido(a) em ${fmtData(pac.nascimento)}, ` : ''}
    encontra-se em acompanhamento psicológico regular neste consultório, 
    com sessões <strong>${pac.modalidade === 'Online' ? 'online' : 'presenciais'}</strong>, 
    desde ${extra.desde || '____/____/______'}.</p>
    <p>${extra.texto || 'O acompanhamento visa o suporte emocional e o desenvolvimento do bem-estar psicológico do(a) paciente.'}</p>
    <p>Esta declaração é fornecida a pedido do(a) interessado(a) e não substitui laudo ou relatório psicológico.</p>
    <div class="assinatura">
      <div class="linha"></div>
      <strong>${psicologa.nome}</strong><br>
      Psicóloga — CRP ${psicologa.crp}<br>
      ${psicologa.cidade}, ${hoje()}
    </div>
    <div class="rodape">${psicologa.endereco}</div>
    </body></html>`
}

export default function DocumentosClinicos() {
  const { pacientes } = useStore()
  const [pacId, setPacId]   = useState('')
  const [tipo, setTipo]     = useState<TipoDoc>('comparecimento')
  const [extra, setExtra]   = useState<Record<string,string>>({})
  const [preview, setPreview] = useState(false)

  const pac = pacientes.find(p => p.id === pacId)

  const abrirPDF = () => {
    if (!pac) return
    const html = gerarHTML(tipo, pac, extra)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  const TIPOS = [
    { id:'comparecimento', label:'Declaração de comparecimento', icon:'ti-calendar-check', desc:'Para justificar ausência ao trabalho ou escola' },
    { id:'encaminhamento', label:'Encaminhamento', icon:'ti-arrow-right-circle', desc:'Para enviar a outro profissional de saúde' },
    { id:'declaracao',     label:'Declaração de acompanhamento', icon:'ti-file-certificate', desc:'Comprova que o paciente está em terapia' },
  ] as { id: TipoDoc; label: string; icon: string; desc: string }[]

  const CAMPOS: Record<TipoDoc, { key: string; label: string; tipo?: string; placeholder?: string }[]> = {
    comparecimento: [
      { key:'data', label:'Data da sessão', tipo:'date' },
      { key:'hora', label:'Horário', tipo:'time' },
      { key:'duracao', label:'Duração', placeholder:'50 minutos' },
      { key:'finalidade', label:'Finalidade', placeholder:'justificativa de ausência ao trabalho' },
    ],
    encaminhamento: [
      { key:'especialidade', label:'Especialidade / Profissional', placeholder:'Psiquiatria, Neurologia...' },
      { key:'motivo', label:'Motivo do encaminhamento', placeholder:'Descreva brevemente...' },
      { key:'hipotese', label:'Hipótese diagnóstica', placeholder:'CID ou descrição' },
      { key:'obs', label:'Observações', placeholder:'Informações relevantes...' },
    ],
    declaracao: [
      { key:'desde', label:'Em acompanhamento desde', tipo:'date' },
      { key:'texto', label:'Texto adicional', placeholder:'Observações sobre o acompanhamento...' },
    ],
  }

  return (
    <div style={{maxWidth:700}}>
      <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>
        Gere documentos clínicos com os dados do paciente preenchidos automaticamente.
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-title"><i className="ti ti-user"/>Paciente</div>
        <select value={pacId} onChange={e=>setPacId(e.target.value)}>
          <option value="">Selecione o paciente...</option>
          {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {pac && (
          <div style={{marginTop:10,background:'var(--teal-light)',padding:'8px 12px',borderRadius:8,fontSize:12,color:'var(--teal)',display:'flex',gap:16}}>
            <span>{pac.nascimento ? `${calcIdade(pac.nascimento)} anos` : '—'}</span>
            <span>{pac.modalidade}</span>
            {pac.cid && <span>CID: {pac.cid}</span>}
          </div>
        )}
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-title"><i className="ti ti-file-certificate"/>Tipo de documento</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {TIPOS.map(t=>(
            <label key={t.id} style={{
              display:'flex',gap:12,padding:'12px 14px',borderRadius:8,cursor:'pointer',
              border:`1px solid ${tipo===t.id?'var(--teal)':'var(--border)'}`,
              background:tipo===t.id?'var(--teal-light)':'var(--warm)',
            }}>
              <input type="radio" name="tipo" value={t.id} checked={tipo===t.id}
                onChange={()=>setTipo(t.id)} style={{accentColor:'var(--teal)',marginTop:2}}/>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <i className={`ti ${t.icon}`} style={{color:'var(--teal)',fontSize:14}}/>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{t.label}</span>
                </div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-title"><i className="ti ti-edit"/>Dados do documento</div>
        {CAMPOS[tipo].map(c=>(
          <div key={c.key} className="field">
            <label>{c.label}</label>
            {c.tipo==='date'||c.tipo==='time'
              ? <input type={c.tipo} value={extra[c.key]||''} onChange={e=>setExtra(x=>({...x,[c.key]:e.target.value}))}/>
              : <input placeholder={c.placeholder||''} value={extra[c.key]||''} onChange={e=>setExtra(x=>({...x,[c.key]:e.target.value}))}/>
            }
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}}
          onClick={abrirPDF} disabled={!pac}>
          <i className="ti ti-printer"/>Gerar e imprimir PDF
        </button>
        <button className="btn btn-ghost" onClick={()=>setPreview(p=>!p)} disabled={!pac}>
          <i className="ti ti-eye"/>{preview?'Fechar':'Preview'}
        </button>
      </div>

      {preview && pac && (
        <div style={{marginTop:16,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'8px 14px',background:'var(--warm)',borderBottom:'1px solid var(--border)',fontSize:11,color:'var(--text3)',display:'flex',justifyContent:'space-between'}}>
            <span>Preview do documento</span>
            <button onClick={()=>setPreview(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)'}}>✕</button>
          </div>
          <iframe
            srcDoc={gerarHTML(tipo, pac, extra)}
            style={{width:'100%',height:500,border:'none'}}
            title="Preview do documento"
          />
        </div>
      )}
    </div>
  )
}
