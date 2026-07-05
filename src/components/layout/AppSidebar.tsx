'use client'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'

interface NavItem { path: string; label: string; icon: string; pill?: string; pillClass?: string }

const NAV_PRINCIPAL: NavItem[] = [
  { path: '/dashboard',  label: 'Painel',             icon: 'layout-dashboard' },
  { path: '/agenda',     label: 'Agenda',              icon: 'calendar' },
  { path: '/prontuario', label: 'Prontuários',         icon: 'clipboard-text' },
]
const NAV_INTEL: NavItem[] = [
  { path: '/smartnotes', label: 'Smart Notes',         icon: 'microphone',    pill: 'IA', pillClass: 'ia' },
  { path: '/anamnese',   label: 'Anamneses',           icon: 'forms' },
  { path: '/cartoes',    label: 'Cartões do Paciente', icon: 'cards' },
]
const NAV_GESTAO: NavItem[] = [
  { path: '/alertas',    label: 'Alertas',             icon: 'bell-ringing' },
  { path: '/financeiro', label: 'Financeiro',          icon: 'report-money' },
  { path: '/relatorios', label: 'Relatórios',          icon: 'file-analytics' },
  { path: '/whatsapp',   label: 'WhatsApp',            icon: 'brand-whatsapp' },
]
const NAV_CONFIG: NavItem[] = [
  { path: '/usuarios',   label: 'Usuários',            icon: 'users' },
  { path: '/config',     label: 'Configurações',       icon: 'settings' },
]

interface Props {
  currentPath: string
  alertCount: number
  open: boolean
  onClose: () => void
  onLogout: () => void
  onNavigate: (path: string) => void
}

export default function AppSidebar({ currentPath, alertCount, open, onClose, onLogout, onNavigate }: Props) {
  const item = (nav: NavItem) => {
    const active = currentPath === nav.path
    const pill = nav.path === '/alertas' && alertCount > 0
      ? <span className="nav-pill alerta">{alertCount}</span>
      : nav.pill ? <span className={`nav-pill ${nav.pillClass || ''}`}>{nav.pill}</span> : null

    return (
      <div
        key={nav.path}
        className={`nav-item${active ? ' active' : ''}`}
        onClick={() => onNavigate(nav.path)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onNavigate(nav.path)}
      >
        <i className={`ti ti-${nav.icon}`} />
        <span className="nav-label">{nav.label}</span>
        {pill}
      </div>
    )
  }

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sb-logo">
        <div className="sb-brand">Nexo<span>Psi</span></div>
        <div className="sb-tagline">gestão clínica inteligente</div>
      </div>

      <div className="sb-user">
        <div className="sb-avatar">MG</div>
        <div>
          <div className="sb-uname">{CONFIG.psicologa.nome}</div>
          <div className="sb-ucrp">CRP {CONFIG.psicologa.crp} · Admin</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section">Principal</div>
        {NAV_PRINCIPAL.map(item)}
        <div className="nav-section">Inteligência</div>
        {NAV_INTEL.map(item)}
        <div className="nav-section">Gestão</div>
        {NAV_GESTAO.map(item)}
        <div className="nav-section">Configurações</div>
        {NAV_CONFIG.map(item)}
      </nav>

      <div className="sb-footer" onClick={onLogout} role="button" tabIndex={0}>
        <i className="ti ti-logout" style={{ fontSize: 16 }} />
        <span style={{ flex: 1 }}>{CONFIG.psicologa.cidade}</span>
        <span>Sair</span>
      </div>
    </aside>
  )
}
