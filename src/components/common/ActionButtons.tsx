import React from 'react'
import { Eye, Edit2, Trash2, Printer, ExternalLink } from 'lucide-react'

export interface ActionButtonsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPrint?: () => void
  onExternal?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  viewTitle?: string
  editTitle?: string
  deleteTitle?: string
  printTitle?: string
}

/**
 * Standard Table ActionButtons UBK
 * Sesuai DESAIN.md Bab 19
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  onPrint,
  onExternal,
  disabled = false,
  size = 'sm',
  viewTitle = 'Lihat Detail',
  editTitle = 'Ubah Data',
  deleteTitle = 'Hapus Data',
  printTitle = 'Cetak Dokumen',
}) => {
  const btnSize = size === 'sm' ? 28 : 32
  const iconSize = size === 'sm' ? 14 : 16

  const baseStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {onView && (
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          title={viewTitle}
          style={{
            ...baseStyle,
            backgroundColor: '#f0f9ff',
            borderColor: '#bae6fd',
            color: '#0284c7',
          }}
          aria-label={viewTitle}
        >
          <Eye size={iconSize} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          title={editTitle}
          style={{
            ...baseStyle,
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            color: '#1d4ed8',
          }}
          aria-label={editTitle}
        >
          <Edit2 size={iconSize} />
        </button>
      )}

      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          disabled={disabled}
          title={printTitle}
          style={{
            ...baseStyle,
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#334155',
          }}
          aria-label={printTitle}
        >
          <Printer size={iconSize} />
        </button>
      )}

      {onExternal && (
        <button
          type="button"
          onClick={onExternal}
          disabled={disabled}
          title="Buka Tautan Eksternal"
          style={{
            ...baseStyle,
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#475569',
          }}
          aria-label="Buka Tautan Eksternal"
        >
          <ExternalLink size={iconSize} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          title={deleteTitle}
          style={{
            ...baseStyle,
            backgroundColor: '#fff1f2',
            borderColor: '#fecdd3',
            color: '#e11d48',
          }}
          aria-label={deleteTitle}
        >
          <Trash2 size={iconSize} />
        </button>
      )}
    </div>
  )
}
