import React, { useEffect } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'

interface PrintPageContainerProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  onClose?: () => void
  onPrint?: () => void
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Kontainer Kertas Standar A4 Cetak Formal UBK
 * Dilengkapi Floating Toolbar Pratinjau & Visualisasi Pemisah Lembar Fisik (297mm)
 * Sesuai DESAIN.md Bab 22
 */
export const PrintPageContainer: React.FC<PrintPageContainerProps> = ({
  title,
  subtitle,
  badge,
  onClose,
  onPrint,
  actions,
  children,
}) => {
  useEffect(() => {
    document.documentElement.classList.add('print-mode')
    document.body.classList.add('print-mode')

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevHtmlHeight = document.documentElement.style.height
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyHeight = document.body.style.height

    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important')
    document.documentElement.style.setProperty('height', 'auto', 'important')
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.body.style.setProperty('overflow-y', 'auto', 'important')
    document.body.style.setProperty('height', 'auto', 'important')

    return () => {
      document.documentElement.classList.remove('print-mode')
      document.body.classList.remove('print-mode')
      document.documentElement.style.overflow = prevHtmlOverflow
      document.documentElement.style.height = prevHtmlHeight
      document.body.style.overflow = prevBodyOverflow
      document.body.style.height = prevBodyHeight
    }
  }, [])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      window.close()
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className="print-standalone-wrapper">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 14mm 16mm 14mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print-bar {
            display: none !important;
          }

          .a4-paper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            border: none !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        @media screen {
          body {
            background-color: #334155;
            margin: 0;
            padding: 0;
          }

          .no-print-bar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
            padding: 10px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          }

          .a4-paper {
            background: #ffffff;
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto 40px;
            padding: 12mm 14mm 16mm 14mm;
            box-shadow: 0 8px 30px rgba(0,0,0,0.35);
            box-sizing: border-box;
            position: relative;
            background-image: linear-gradient(
              to bottom,
              transparent 296.2mm,
              #cbd5e1 296.2mm,
              #cbd5e1 297mm,
              transparent 297mm
            );
            background-size: 100% 297mm;
          }
        }

        .print-standalone-wrapper {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
        }
      `}</style>

      {/* Floating Toolbar */}
      <div className="no-print-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Tutup pratinjau cetak ini"
          >
            <ArrowLeft size={14} />
            <span>Tutup Tab</span>
          </button>

          <div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{title}</span>
              {badge}
            </div>
            {subtitle && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {actions}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: '#0284c7',
              color: '#ffffff',
              border: '1px solid #0369a1',
              borderRadius: 8,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
            }}
            title="Buka dialog cetak browser (Pilih Save as PDF untuk menyimpan file PDF)"
          >
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Kontainer Lembar Kertas A4 */}
      <div className="a4-paper">
        {children}
      </div>
    </div>
  )
}
