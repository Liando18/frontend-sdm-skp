import React from 'react'

interface SkeletonBoxProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
  className?: string
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 'var(--r-sm)',
  style,
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/**
 * 4-grid KPI Bento Skeleton Loading
 */
export const BentoKpiSkeleton: React.FC = () => {
  return (
    <div className="kpi-bento-grid-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card" style={{ minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width={24} height={24} borderRadius="50%" />
          </div>
          <div style={{ marginTop: 14 }}>
            <SkeletonBox width="40%" height={36} borderRadius="var(--r-md)" />
          </div>
          <div style={{ marginTop: 8 }}>
            <SkeletonBox width="65%" height={16} borderRadius={20} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Table Skeleton with customizable row count and column count
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div
      style={{
        background: 'var(--panel-bg)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--hair)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Table Header placeholder */}
      <div
        style={{
          display: 'flex',
          padding: '14px 20px',
          background: 'var(--panel-hover)',
          borderBottom: '1px solid var(--hair)',
          gap: 16,
        }}
      >
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} style={{ flex: idx === 0 ? 1.5 : 1 }}>
            <SkeletonBox width="70%" height={14} />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'flex',
            padding: '16px 20px',
            borderBottom: rIdx < rows - 1 ? '1px solid var(--hair-subtle)' : 'none',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} style={{ flex: cIdx === 0 ? 1.5 : 1 }}>
              <SkeletonBox width={cIdx === 0 ? '85%' : '60%'} height={15} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Chart Card Skeleton Loading
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'var(--panel-bg)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        border: '1px solid var(--hair)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '60%' }}>
          <SkeletonBox width="75%" height={20} />
          <SkeletonBox width="45%" height={12} style={{ marginTop: 6 }} />
        </div>
        <SkeletonBox width={100} height={24} borderRadius={12} />
      </div>

      <div style={{ height: 260, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '0 20px' }}>
        {[40, 75, 55, 90, 65, 80].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <SkeletonBox width="100%" height={`${h}%`} borderRadius="6px 6px 0 0" />
            <SkeletonBox width="70%" height={12} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full Dashboard Skeleton View
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner Skeleton */}
      <div
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          border: '1px solid var(--hair)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <SkeletonBox width={52} height={52} borderRadius="50%" />
          <div>
            <SkeletonBox width={140} height={12} />
            <SkeletonBox width={260} height={22} style={{ marginTop: 6 }} />
            <SkeletonBox width={200} height={13} style={{ marginTop: 6 }} />
          </div>
        </div>
        <SkeletonBox width={140} height={38} borderRadius="var(--r-md)" />
      </div>

      {/* Bento Grid */}
      <BentoKpiSkeleton />

      {/* Grid split skeleton */}
      <div className="dashboard-chart-grid">
        <ChartSkeleton />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton-card" style={{ height: 160 }}>
            <SkeletonBox width="40%" height={14} />
            <SkeletonBox width="80%" height={24} style={{ marginTop: 8 }} />
            <SkeletonBox width="100%" height={38} borderRadius="var(--r-md)" style={{ marginTop: 12 }} />
          </div>
          <div className="skeleton-card" style={{ height: 180 }}>
            <SkeletonBox width="50%" height={14} />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <SkeletonBox width={100} height={100} borderRadius="50%" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={4} columns={6} />
    </div>
  )
}
