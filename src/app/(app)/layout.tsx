'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AppSidebar from '@/components/layout/AppSidebar'
import LoginPage from '@/components/layout/LoginPage'
import { DBLoading } from '@/components/ui'
import * as DB from '@/lib/db'

const TITLES: Record<string, string> = {
  '/dashboard':   'Painel',
  '/agenda':      'Agenda',
  '/prontuario':  'Prontuários',
  '/smartnotes':  'Smart Notes',
  '/anamnese':    'Anamneses',
  '/cartoes':     'Cartões do Paciente',
  '/alertas':     'Alertas',
  '/financeiro':  'Financeiro',
  '/relatorios':  'Relatórios',
  '/whatsapp':    'WhatsApp',
  '/usuarios':    'Usuários',
  '/config':      'Configurações',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando, login, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [dbLoading, setDbLoading] = useState(false)
  const [inited, setInited] = useState(false)
  const router = useRouter()
  const path = usePathname()

  // Inicializar DB + seed + alertas
  useEffect(() => {
    if (!autenticado || inited) return
    setInited(true)
    setDbLoading(true)
    DB.seedSeNecessario()
      .then(() => DB.getInadimplentes())
      .then(inad => setAlertCount(inad.length))
      .catch(console.error)
      .finally(() => setDbLoading(false))
  }, [autenticado, inited])

  if (carregando) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0F1E2E'}}>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>Carregando...</div>
    </div>
  )

  if (!autenticado) return <LoginPage onLogin={login} />

  const title = TITLES[path] || 'NexxoPsi'

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      <div className={`sb-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <AppSidebar
        currentPath={path}
        alertCount={alertCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        onNavigate={(p) => { router.push(p); setSidebarOpen(false) }}
      />

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(s => !s)}>
            <i className="ti ti-menu-2" />
          </button>
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>

      <DBLoading show={dbLoading} />
    </div>
  )
}
