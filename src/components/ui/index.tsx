'use client'
import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react'

// ── Toast ─────────────────────────────────────────────────────
type ToastType = 'success' | 'danger' | 'warn' | 'info'
interface ToastData { id: number; msg: string; type: ToastType }
const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const show = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  const icon = (type: ToastType) => ({
    success: 'ti-check', danger: 'ti-alert-circle', warn: 'ti-alert-triangle', info: 'ti-info-circle'
  }[type])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`ti ${icon(t.type)}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void
  title: string; icon?: string; large?: boolean
  children: ReactNode; footer?: ReactNode
}
export function Modal({ open, onClose, title, icon, large, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal${large ? ' modal-lg' : ''}`}>
        <div className="modal-header">
          <div className="modal-title">
            {icon && <i className={`ti ti-${icon}`} />}
            {title}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && (
          <div style={{ padding: '12px 22px 18px', borderTop: '1px solid var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" className="spinner">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

export function DBLoading({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 12, fontWeight: 600, gap: 8, alignItems: 'center', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', display: 'flex' }}>
      <Spinner size={14} /> Sincronizando...
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────
export function Empty({ icon = 'database', msg, action }: { icon?: string; msg: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <i className={`ti ti-${icon}`} />
      <p>{msg}</p>
      {action}
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────
export function Loading({ msg = 'Carregando...' }: { msg?: string }) {
  return (
    <div className="loading-overlay">
      <Spinner size={20} color="var(--teal)" />
      <span>{msg}</span>
    </div>
  )
}

// ── Confirm ───────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, msg }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; msg: string
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon="alert-triangle">
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>{msg}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { onConfirm(); onClose() }}>
          <i className="ti ti-trash" /> Confirmar
        </button>
      </div>
    </Modal>
  )
}
