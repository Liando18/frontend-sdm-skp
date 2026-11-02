import React, { ReactNode } from 'react'
import { SearchX, RotateCcw } from 'lucide-react'

export interface TableEmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  onResetFilter?: () => void
  actionText?: string
}

/**
 * Standard TableEmptyState UBK
 * Sesuai DESAIN.md Bab 19.3
 */
export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title = 'Tidak Ada Data Ditemukan',
  description = 'Tidak ada catatan data yang cocok dengan kriteria filter pencarian saat ini.',
  icon,
  onResetFilter,
  actionText = 'Reset Filter',
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 12,
        }}
      >
        {icon || <SearchX size={26} />}
      </div>

      <h4
        style={{
          margin: '0 0 6px 0',
          fontSize: '15px',
          fontWeight: 700,
          color: '#1e293b',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          color: '#64748b',
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {onResetFilter && (
        <button
          type="button"
          onClick={onResetFilter}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderRadius: 6,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          <RotateCcw size={13} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  )
}
