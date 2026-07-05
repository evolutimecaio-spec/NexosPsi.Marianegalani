'use client'
import { useState, useEffect } from 'react'
import { useToast, Modal } from '@/components/ui'

interface Usuario { id:string; nome:string; email:string; perfil:string; ativo:boolean; criado:string }
const KEY = 'nxp_usuarios'
const PERFIS: Record<string,{label:string;cor:string;desc:string}> = {
  admin:     { label:'Admin',    cor:'var(--teal)',   desc:'Acesso total: prontuários, finanças, relatórios, configurações.' },
  psicologa: { label:'Psicóloga',cor:'#7B68EE',       desc:'Agenda, prontuários dos seus pacientes, Smart Notes. Sem financeiro geral.' },
  secretaria:{ label:'Secretária',cor:'#E0A020',      desc:'Agenda e agendamentos. Sem prontuários clínicos.' },
}

export default function Usuarios() {
  const [users, setUsers]   = useState<Usuario[]>([])
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState({ nome:'', email:'', perfil:'psicologa', senha:'' })
  const [erro, setErro]     = useState('')
  const toast = useToast()

  const load = () => {
    try { const s=localStorage.getItem(KEY); setUsers(s?JSON.parse(s):[{id:'u1',nome:'Mariane Galani',email:'mariane@email.com',perfil:'admin',ativo:true,criado:'2025-01-01'}]) }
    catch { setUsers([]) }
  }
  const save = (list: Usuario[]) => { localStorage.setItem(KEY,JSON.stringify(list)); setUsers(list) }

  useEffect(()=>{ load() },[])

  const salvar = () => {
    if (!form.nome) { setErro('Informe o nome.'); return }
    if (!form.email) { setErro('Informe o e-mail.'); return }
    if (form.senha.length < 6) { setErro('Senha mínima: 6 caracteres.'); return }
    if (users.some(u=>u.email===form.email)) { setErro('E-mail já cadastrado.'); return }
    const novo: Usuario = { id:'u'+Date.now(), ...form, ativo:true, criado:new Date().toISOString().slice(0,10) }
    save([...users, novo])
    setModal(false); setForm({nome:'',email:'',perfil:'psicologa',senha:''}); setErro('')
    toast(form.nome+' adicionado!')
  }

  const excluir = (id: string) => {
    if (!confirm('Remover este usuário?')) return
    save(users.filter(u=>u.id!==id))
    toast('Usuário removido.')
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>Gerencie quem tem acesso ao NexxoPsi.</div>
        <button className="btn btn-sage" onClick={()=>setModal(true)}><i className="ti ti-user-plus"/>Adicionar usuário</button>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title"><i className="ti ti-users"/>Usuários da conta</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {users.map(u=>{
              const pf = PERFIS[u.perfil]||PERFIS.secretaria
              const ini = u.nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
              return (
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'var(--warm)',borderRadius:8,border:'1px solid var(--border)'}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:pf.cor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{u.nome}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{u.email}</div>
                  </div>
                  <span className="badge" style={{background:pf.cor+'22',color:pf.cor}}>{pf.label}</span>
                  {u.id!=='u1' && <button onClick={()=>excluir(u.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)'}}><i className="ti ti-trash"/></button>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title"><i className="ti ti-shield-check"/>Perfis de acesso</div>
          {Object.entries(PERFIS).map(([k,pf])=>(
            <div key={k} style={{padding:'11px 13px',background:'var(--warm)',borderRadius:8,border:'1px solid var(--border)',marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:3,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:pf.cor,display:'inline-block'}}/>
                {pf.label}
              </div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{pf.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Novo usuário" icon="user-plus">
        <div className="field"><label>Nome *</label><input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div>
        <div className="field"><label>E-mail *</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
        <div className="field"><label>Perfil</label><select value={form.perfil} onChange={e=>setForm(f=>({...f,perfil:e.target.value}))}>{Object.entries(PERFIS).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}</select></div>
        <div className="field"><label>Senha temporária *</label><input type="password" value={form.senha} onChange={e=>setForm(f=>({...f,senha:e.target.value}))}/></div>
        {erro && <div className="form-error">{erro}</div>}
        <button className="btn btn-sage btn-full" onClick={salvar}>Salvar</button>
      </Modal>
    </div>
  )
}
