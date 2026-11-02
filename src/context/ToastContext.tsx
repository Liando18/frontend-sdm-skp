import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast } from '../components/Toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Global Toast Provider UBK
 * Sesuai DESAIN.md Bab 20.1
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setToast({ message, type })

    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, 4500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  )
}

/**
 * Custom hook untuk mengakses sistem toast global dari komponen manapun
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback jika dipanggil di luar ToastProvider (misal test environment)
    return {
      showToast: (msg: string) => console.log('[Toast Fallback]', msg),
      hideToast: () => {},
    }
  }
  return context
}
