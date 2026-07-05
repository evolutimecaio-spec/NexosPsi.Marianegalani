'use client'
import { useState, useEffect } from 'react'
import * as DB from '@/lib/db'
import { useToast } from '@/components/ui'
import { CONFIG } from '@/lib/config'

type Aba = 'perfil'|'sistema'|'financeiro'|'locais'

export default function Config() {
  const [aba, setAba] = useState<Aba>('perfil')
  const [cfg, setCfg] = useState({ ...CONFIG })
  const [saved, setSaved] = useState(false)
  const toast = useToast()

  const salvar = async () => {
    await DB.saveConfig(cfg as any)
    setSaved(true)
    toast('Configurações salvas!')
    setTimeout(()=>setSaved(false), 2000)
  }

  return (
    <div>
      <div className="inner-tabs" style={{marginBottom:18}}>
        {([['perfil','Perfil','ti-user'],['sistema','Sistema','ti-settings'],['financeiro','Financeiro','ti-coin'],['locais','Locais','ti-map-pin']] as [Aba,string,string][]).map(([id,label,icon])=>(
          <div key={id} className={`it${aba===id?' active':''}`} onClick={()=>setAba(id)}>
            <i className={icon} style={{marginRight:4}}/>{label}
          </div>
        ))}
      </div>

      {aba==='perfil' && (
        <div className="card" style={{maxWidth:600}}>
          <div className="card-title"><i className="ti ti-user"/>Dados da psicóloga</div>
          {[['Nome completo','psicologa.nome'],['CRP','psicologa.crp'],['E-mail','psicologa.email'],['WhatsApp (só números)','psicologa.whatsapp'],['Endereço do consultório','psicologa.endereco'],['Cidade','psicologa.cidade']].map(([label, path])=>(
            <div key={label} className="field">
              <label>{label}</label>
              <input value={getPath(cfg as any,path)} onChange={e=>setCfg(c=>setPath({...c},path,e.target.value) as any)}/>
            </div>
          ))}
          <button className="btn btn-sage" onClick={salvar}>{saved?'Salvo ✓':'Salvar alterações'}</button>
        </div>
      )}

      {aba==='sistema' && (
        <div className="card" style={{maxWidth:600}}>
          <div className="card-title"><i className="ti ti-lock"/>Segurança e sistema</div>
          <div style={{background:'#FFF8E1',border:'1px solid #FFD740',borderRadius:8,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#B7760A'}}>
            <i className="ti ti-alert-triangle" style={{marginRight:6}}/>A senha é armazenada como hash SHA-256. Para alterar, gere um novo hash em <strong>emn178.github.io/online-tools/sha256.html</strong> e cole abaixo.
          </div>
          <div className="field"><label>Hash SHA-256 da senha</label><input type="text" defaultValue="" placeholder="Deixe em branco para manter a senha atual"/></div>
          <div className="field"><label>Horas de sessão sem login</label><input type="number" defaultValue="8" min="1" max="24"/></div>
          <div style={{marginTop:8,padding:'12px 14px',background:'var(--warm)',borderRadius:8,fontSize:12,color:'var(--text2)'}}>
            <strong>Senha atual:</strong> mariane2025<br/>
            <strong>Versão:</strong> 1.0.0 · Supabase conectado
          </div>
        </div>
      )}

      {aba==='financeiro' && (
        <div className="card" style={{maxWidth:600}}>
          <div className="card-title"><i className="ti ti-coin"/>Configurações financeiras</div>
          <div className="field"><label>Valor padrão por sessão (R$)</label><input type="number" defaultValue={CONFIG.financeiro.valorSessaoPadrao}/></div>
          <div className="field"><label>Meta mensal de faturamento (R$)</label><input type="number" defaultValue={CONFIG.financeiro.metaMensalFaturamento}/></div>
          <div className="field"><label>Chave PIX</label><input defaultValue={CONFIG.financeiro.chavePix}/></div>
          <button className="btn btn-sage" onClick={salvar}>{saved?'Salvo ✓':'Salvar alterações'}</button>
        </div>
      )}

      {aba==='locais' && (
        <div>
          {[
            { id:'unimed',     nome:'Unimed',            cor:'#1565C0', icon:'building-hospital',  end:'Unimed Jundiaí' },
            { id:'aquarela',   nome:'Casa Aquarela',     cor:'#6A1B9A', icon:'home-heart',          end:'Casa Aquarela' },
            { id:'anhangabau', nome:'Clínica Anhangabaú',cor:'#2E7D32', icon:'building-community', end:'Clínica do Anhangabaú' },
          ].map(loc=>(
            <div key={loc.id} className="card" style={{marginBottom:14,maxWidth:600,borderLeft:`4px solid ${loc.cor}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:8,background:loc.cor+'22',display:'flex',alignItems:'center',justifyContent:'center',color:loc.cor,fontSize:18}}>
                  <i className={`ti ti-${loc.icon}`}/>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:loc.cor}}>{loc.nome}</div>
              </div>
              <div className="field"><label>Endereço</label><input defaultValue={loc.end}/></div>
              <div className="field"><label>Cor de identificação</label><input type="color" defaultValue={loc.cor} style={{width:60,height:36,padding:2,borderRadius:8,border:'1px solid var(--border)',cursor:'pointer'}}/></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helpers para paths aninhados
function getPath(obj: any, path: string): string {
  return path.split('.').reduce((o,k)=>o?.[k],obj) ?? ''
}
function setPath(obj: any, path: string, val: string): any {
  const parts = path.split('.'); const last = parts.pop()!
  let cur = obj; parts.forEach(p=>{ if(!cur[p]) cur[p]={}; cur=cur[p] }); cur[last]=val; return obj
}
