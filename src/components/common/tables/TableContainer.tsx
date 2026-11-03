import React, { ReactNode } from 'react'

export interface TableContainerProps {
  children: ReactNode
  className?: string
  maxHeight?: number | string
}

/**
 * Standard TableContainer UBK
 * Dilengkapi isolasi horizontal scroll & border melingkar aman
 * Sesuai DESAIN.md Bab 19.1
 */
export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = '',
  maxHeight = 'calc(100dvh - 240px)',
}) => {
  return (
    <div
      className={`table-container ubk-table-container ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: maxHeight,
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'relative',
      }}
    >
      {children}
    </div>
  )
}
