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

      </div>
    </div>
  )
}
