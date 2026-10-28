import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface TablePaginationProps {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newSize: number) => void
  pageSizeOptions?: number[]
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Calculate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--hair-subtle)',
        background: 'var(--panel-bg)',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '12.5px',
        color: 'var(--muted)',
      }}
    >
      {/* Left Info & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          Menampilkan <strong style={{ color: 'var(--ink)' }}>{startItem} - {endItem}</strong> dari{' '}
          <strong style={{ color: 'var(--ink)' }}>{totalItems}</strong> data
        </div>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Baris per hal:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              style={{
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair)',
                background: 'var(--card)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Pagination Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '4px 6px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hair)',
            background: 'var(--card)',
            color: currentPage === 1 ? 'var(--faint)' : 'var(--ink)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          title="Halaman Pertama"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous button */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hair)',
            background: 'var(--card)',
            color: currentPage === 1 ? 'var(--faint)' : 'var(--ink)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ChevronLeft size={14} />
          <span>Sebelumnya</span>
        </button>

        {/* Page Number Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--faint)' }}>
                  ...
                </span>
              )
            }
            const isCurrent = p === currentPage
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 'var(--r-sm)',
                  border: isCurrent ? '1px solid var(--brand-600)' : '1px solid var(--hair)',
                  background: isCurrent ? 'var(--brand-600)' : 'var(--card)',
                  color: isCurrent ? '#ffffff' : 'var(--ink)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hair)',
            background: 'var(--card)',
            color: currentPage === totalPages ? 'var(--faint)' : 'var(--ink)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>Berikutnya</span>
          <ChevronRight size={14} />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '4px 6px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hair)',
            background: 'var(--card)',
            color: currentPage === totalPages ? 'var(--faint)' : 'var(--ink)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          title="Halaman Terakhir"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
