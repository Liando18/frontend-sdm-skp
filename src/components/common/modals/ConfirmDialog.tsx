import React, { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useGSAP, gsap, GSAP_EASE } from '../../../utils/animations'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Standard ConfirmDialog UBK
 * Sesuai DESAIN.md Bab 18.2
 */
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

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        padding: '16px',
      }}
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isDestructive ? '#fff1f2' : '#eff6ff',
              color: isDestructive ? '#e11d48' : '#0284c7',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                marginTop: 6,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 6,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: 6,
              background: isDestructive ? '#dc2626' : '#c2410c',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: isDestructive
                ? '0 2px 6px rgba(220, 38, 38, 0.3)'
                : '0 2px 6px rgba(194, 65, 12, 0.3)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
