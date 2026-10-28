import React, { useRef } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
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

  const getStyleByType = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#064e3b',
          border: '#059669',
          color: '#ecfdf5',
          iconColor: '#34d399',
        }
      case 'error':
        return {
          bg: '#7f1d1d',
          border: '#dc2626',
          color: '#fef2f2',
          iconColor: '#f87171',
        }
      case 'warning':
        return {
          bg: '#78350f',
          border: '#d97706',
          color: '#fffbeb',
          iconColor: '#fbbf24',
        }
      case 'info':
      default:
        return {
          bg: '#0c4a6e',
          border: '#0284c7',
          color: '#f0f9ff',
          iconColor: '#38bdf8',
        }
    }
  }

  const styleConfig = getStyleByType()

  return (
    <div
      ref={toastRef}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: styleConfig.bg,
        border: `1px solid ${styleConfig.border}`,
        color: styleConfig.color,
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: 'calc(100vw - 32px)',
      }}
      role="alert"
    >
      {type === 'success' && <CheckCircle2 size={18} color={styleConfig.iconColor} />}
      {type === 'error' && <AlertCircle size={18} color={styleConfig.iconColor} />}
      {type === 'warning' && <AlertTriangle size={18} color={styleConfig.iconColor} />}
      {type === 'info' && <Info size={18} color={styleConfig.iconColor} />}
      <span style={{ lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={handleClose}
        style={{
          marginLeft: 8,
          background: 'none',
          border: 'none',
          color: 'currentColor',
          opacity: 0.75,
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
