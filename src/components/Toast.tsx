import React, { useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const toastRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!toastRef.current) return
      gsap.fromTo(
        toastRef.current,
        { y: 24, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: GSAP_EASE.bounce }
      )
    },
    { scope: toastRef }
  )

  const handleClose = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        y: 16,
        opacity: 0,
        scale: 0.94,
        duration: 0.2,
        ease: GSAP_EASE.smooth,
        onComplete: onClose,
      })
    } else {
      onClose()
    }
  }

  return (
    <div
      ref={toastRef}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'var(--ink)',
        color: '#ffffff',
        borderRadius: '999px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {type === 'success' && <CheckCircle2 size={18} color="#f0752e" />}
      {type === 'error' && <AlertCircle size={18} color="#ef4444" />}
      {type === 'info' && <Info size={18} color="#38bdf8" />}
      <span>{message}</span>
      <button
        onClick={handleClose}
        style={{
          marginLeft: 8,
          background: 'none',
          border: 'none',
          color: '#ffffff80',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          padding: 2,
        }}
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>
    </div>
  )
}
