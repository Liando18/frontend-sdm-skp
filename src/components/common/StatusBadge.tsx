import React from 'react'
import {
  getSkpStatusMeta,
  getPredikatKinerjaMeta,
} from '../../constants/statusConfig'

export interface StatusBadgeProps {
  status?: string | null
  type?: 'skp' | 'predikat'
  size?: 'sm' | 'md'
  className?: string
  showIcon?: boolean
}

/**
 * Standard StatusBadge UBK
 * Membaca Single Source of Truth dari src/constants/statusConfig.ts
 * Sesuai DESAIN.md Bab 19
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'skp',
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  const meta =
    type === 'predikat' ? getPredikatKinerjaMeta(status) : getSkpStatusMeta(status)
  const IconComponent = meta.icon

  const isSmall = size === 'sm'

  return (
    <span
      className={`ubk-status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 4 : 6,
        padding: isSmall ? '2.5px 8px' : '4px 10px',
        borderRadius: 999,
        fontSize: isSmall ? '11.5px' : '12.5px',
        fontWeight: 600,
        backgroundColor: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
    >
      {showIcon && <IconComponent size={isSmall ? 12 : 14} style={{ flexShrink: 0 }} />}
      <span>{meta.label}</span>
    </span>
  )
}
