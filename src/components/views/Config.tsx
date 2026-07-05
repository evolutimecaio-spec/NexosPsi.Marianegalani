'use client'
import { useState } from 'react'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import { CONFIG } from '@/lib/config'

type Aba = 'perfil'|'sistema'|'financeiro'|'locais'

function Field({ label, value, onChange, type='text' }: { label:string; value:string; onChange:(v:string)=>void; type?:string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}

export default function Config() {
  const [aba, setAba] = useState<Aba>('perfil')
  const [nome, setNome]     = useState(CONFIG.psicologa.nome)
  const [crp, setCrp]       = useState(CONFIG.psicologa.crp)
  const [email, setEmail]   = useState(CONFIG.psicologa.email)
  const [wpp, setWpp]       = useState(CONFIG.psicologa.whatsapp)
  const [end, setEnd]       = useState(CONFIG.psicologa.endereco)
  const [cidade, setCidade] = useState(CONFIG.psicologa.cidade)
  const [meta, setMeta]     = useState(String(CONFIG.financeiro.metaMensalFaturamento))
  const [pix, setPix]       = useState(CONFIG.financeiro.chavePix)
  const [valorPad, setValorPad] = useState(String(CONFIG.financeiro.valorSessaoPadrao))
  const [saved, setSaved]   = useState(false)
  const toast = useToast()

  const salvar = async () => {
    await DB.saveConfig({ psicologa:{ nome,crp,email,whatsapp:wpp,endereco:end,cidade }, financeiro:{ metaMensalFaturamento:+meta,chavePix:pix,valorSessaoPadrao:+valorPad } })
    setSaved(true); toast('Configurações salvas!')
    setTimeout(()=>setSaved(false),2500)
  }

  const ABAS: [Aba,string,string][] = [
    ['perfil','Perfil','ti-user'],
    ['financeiro','Financeiro','ti-coin'],
    ['locais','Locais','ti-map-pin'],
    ['sistema','Sistema','ti-settings'],
  ]

  const LOCAIS = [
    { id:'unimed',     nome:'Unimed',            cor:'#1565C0', icon:'ti-building-hospital',  end:'Unimed Jundiaí' },
    { id:'aquarela',   nome:'Casa Aquarela',     cor:'#6A1B9A', icon:'ti-home-heart',          end:'Casa Aquarela' },
    { id:'anhangabau', nome:'Clínica Anhangabaú',cor:'#2E7D32', icon:'ti-building-community', end:'Clínica do Anhangabaú' },
  ]

  return (
    <div style={{maxWidth:680}}>
      {/* Tabs */}
      <div className="cfg-tabs">
        {ABAS.map(([id,label,icon])=>(
          <button key={id} className={`cfg-tab${aba===id?' active':''}`} onClick={()=>setAba(id)}>
            <i className={`ti ${icon}`}/>{label}
          </button>
        ))}
      </div>

      {aba==='perfil' && (
        <div className="card">
          <div className="card-title"><i className="ti ti-user"/>Dados da psicóloga</div>
          <div className="field-row">
            <Field label="Nome completo" value={nome} onChange={setNome}/>
            <Field label="CRP" value={crp} onChange={setCrp}/>
          </div>
          <div className="field-row">
            <Field label="E-mail" value={email} onChange={setEmail} type="email"/>
            <Field label="WhatsApp (só números)" value={wpp} onChange={setWpp}/>
          </div>
          <Field label="Endereço do consultório" value={end} onChange={setEnd}/>
          <Field label="Cidade" value={cidade} onChange={setCidade}/>
          <button className="btn btn-primary" onClick={salvar} style={{marginTop:4}}>
            {saved ? '✓ Salvo!' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {aba==='financeiro' && (
        <div className="card">
          <div className="card-title"><i className="ti ti-coin"/>Configurações financeiras</div>
          <div className="field-row">
            <Field label="Valor padrão por sessão (R$)" value={valorPad} onChange={setValorPad} type="number"/>
            <Field label="Meta mensal de faturamento (R$)" value={meta} onChange={setMeta} type="number"/>
          </div>
          <Field label="Chave PIX (e-mail, CPF ou telefone)" value={pix} onChange={setPix}/>
          <div style={{background:'var(--teal-light)',padding:'12px 14px',borderRadius:8,fontSize:12,color:'var(--teal)',marginBottom:12}}>
            <i className="ti ti-info-circle" style={{marginRight:6}}/>
            O valor padrão é usado como sugestão ao cadastrar novos pacientes. Cada paciente pode ter seu próprio valor.
          </div>
          <button className="btn btn-primary" onClick={salvar}>
            {saved ? '✓ Salvo!' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {aba==='locais' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {LOCAIS.map(loc=>(
            <div key={loc.id} className="card" style={{borderLeft:`4px solid ${loc.cor}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:8,background:loc.cor+'18',display:'flex',alignItems:'center',justifyContent:'center',color:loc.cor,fontSize:18}}>
                  <i className={`ti ${loc.icon}`}/>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:loc.cor}}>{loc.nome}</div>
              </div>
              <Field label="Endereço" value={loc.end} onChange={()=>{}}/>
            </div>
          ))}
          <div style={{fontSize:12,color:'var(--text3)',padding:'4px 0'}}>
            Para alterar cores ou adicionar locais, edite <code>src/lib/db.ts</code> → objeto LOCAIS.
          </div>
        </div>
      )}

      {aba==='sistema' && (
        <div className="card">
          <div className="card-title"><i className="ti ti-lock"/>Segurança</div>
          <div style={{background:'#FFF8E1',border:'1px solid #FFD740',borderRadius:8,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#B7760A'}}>
            <i className="ti ti-alert-triangle" style={{marginRight:6}}/>
            A senha é protegida com SHA-256. Para alterar, gere o hash em{' '}
            <a href="https://emn178.github.io/online-tools/sha256.html" target="_blank" style={{color:'#B7760A',fontWeight:700}}>emn178.github.io</a>{' '}
            e edite o arquivo <code>src/hooks/useAuth.ts</code> → constante <code>HASH_CORRETO</code>.
          </div>
          <div style={{background:'var(--warm)',padding:'12px 14px',borderRadius:8,fontSize:12,color:'var(--text2)',lineHeight:1.7}}>
            <strong>Senha atual:</strong> mariane2025<br/>
            <strong>Sessão expira em:</strong> 8 horas<br/>
            <strong>Versão:</strong> 1.0.0<br/>
            <strong>Banco:</strong> Supabase · {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://','').split('.')[0] || '—'}
          </div>
        </div>
      )}
    </div>
  )
}
