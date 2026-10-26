import React, { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.94, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: GSAP_EASE.bounce }
      )
    },
    { scope: modalRef, dependencies: [isOpen] }
  )

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        ref={modalRef}
        className="modal-card"
        style={{ maxWidth: '420px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isDestructive ? '#fdeceb' : 'var(--brand-100)',
              color: isDestructive ? '#c23b3b' : 'var(--brand-700)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>{title}</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            type="button"
            className="brand-btn brand-btn--outline"
            style={{ padding: '8px 18px', fontSize: '13.5px' }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="brand-btn"
            style={{
              padding: '8px 20px',
              fontSize: '13.5px',
              background: isDestructive ? '#dc2626' : undefined,
              borderColor: isDestructive ? '#dc2626' : undefined,
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
