'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { StoreProvider, useStore } from '@/lib/store'
import AppSidebar from '@/components/layout/AppSidebar'
import SetupCheck from '@/components/SetupCheck'
import LoginPage from '@/components/layout/LoginPage'
import * as DB from '@/lib/db'

const TITLES: Record<string, string> = {
  '/dashboard':  'Painel',
  '/agenda':     'Agenda',
  '/prontuario': 'Prontuários',
  '/smartnotes': 'Smart Notes',
  '/anamnese':   'Anamneses',
  '/cartoes':    'Cartões do Paciente',
  '/alertas':    'Alertas',
  '/financeiro': 'Financeiro',
  '/relatorios': 'Relatórios',
  '/whatsapp':   'WhatsApp',
  '/usuarios':   'Usuários',
  '/config':     'Configurações',
}



function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertCount, setAlertCount]   = useState(0)
  const { logout } = useAuth()
  const router   = useRouter()
  const path     = usePathname()

  // Pré-carregar alertas em background SEM bloquear render
  useEffect(() => {
    DB.getInadimplentes().then(i => setAlertCount(i.length)).catch(() => {})
  }, [path]) // atualiza ao navegar

  return (
    <StoreProvider>
      <SetupCheck />
      <div className="app-shell">
        <div className={`sb-overlay${sidebarOpen ? ' show' : ''}`}
          onClick={() => setSidebarOpen(false)} />

        <AppSidebar
          currentPath={path}
          alertCount={alertCount}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={logout}
          onNavigate={p => { router.push(p); setSidebarOpen(false) }}
        />

        <div className="main-area">
          <header className="topbar">
            <button className="topbar-menu-btn"
              onClick={() => setSidebarOpen(s => !s)}>
              <i className="ti ti-menu-2" />
            </button>
            <h1 className="topbar-title">{TITLES[path] || 'NexxoPsi'}</h1>
            <div className="topbar-actions">
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>
          </header>
          <main className="page-content">{children}</main>
        </div>
      </div>
    </StoreProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando, login } = useAuth()

  if (carregando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0F1E2E' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Nexo<span style={{ fontWeight: 300, color: 'rgba(144,208,208,0.8)' }}>Psi</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>carregando...</div>
      </div>
    </div>
  )

  if (!autenticado) return <LoginPage onLogin={login} />

  return <AppShell>{children}</AppShell>
}
