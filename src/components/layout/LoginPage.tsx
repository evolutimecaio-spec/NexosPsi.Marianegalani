'use client'
import { useState } from 'react'

export default function LoginPage({ onLogin }: { onLogin: (senha: string) => Promise<boolean> }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setLoading(true)
    const ok = await onLogin(senha)
    if (!ok) setErro('Senha incorreta.')
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Nexo<span>Psi</span></div>
        <div className="login-sub">gestão clínica inteligente</div>

        <form onSubmit={handleSubmit}>
          <label className="login-label">Senha de acesso</label>
          <input
            type="password"
            className="login-input"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
          {erro && <div className="login-error"><i className="ti ti-alert-circle" /> {erro}</div>}
          <button type="submit" className="login-btn" disabled={loading || !senha}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Demo</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Senha: <strong style={{ color: 'rgba(144,208,208,0.8)' }}>mariane2025</strong></div>
        </div>
      </div>
    </div>
  )
}
