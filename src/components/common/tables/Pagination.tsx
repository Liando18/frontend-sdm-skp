import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationProps {
  totalItems: number
  currentPage: number
  pageSize?: number
  itemsPerPage?: number
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newSize: number) => void
  pageSizeOptions?: number[]
}

/**
 * Standard Pagination Control UBK
 * Sesuai DESAIN.md Bab 19.2
 */
export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  itemsPerPage = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const activePageSize = pageSize || itemsPerPage
  const totalPages = Math.max(1, Math.ceil(totalItems / activePageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * activePageSize + 1
  const endItem = Math.min(currentPage * activePageSize, totalItems)

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
        padding: '12px 18px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '13px',
        color: '#64748b',
      }}
    >
      {/* Left Info & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          Menampilkan <strong style={{ color: '#0f172a' }}>{startItem} - {endItem}</strong> dari{' '}
          <strong style={{ color: '#0f172a' }}>{totalItems}</strong> data
        </div>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Baris per hal:</span>
            <select
              value={activePageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              style={{
                fontSize: '12.5px',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
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

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === 1 ? '#cbd5e1' : '#334155',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Halaman Pertama"
        >
          <ChevronsLeft size={15} />
        </button>

        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={{
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === 1 ? '#cbd5e1' : '#334155',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>
                ...
              </span>
            )
          }

          const isCurrent = p === currentPage
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p as number)}
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: 6,
                border: `1px solid ${isCurrent ? '#0284c7' : '#cbd5e1'}`,
                background: isCurrent ? '#0284c7' : '#ffffff',
                color: isCurrent ? '#ffffff' : '#334155',
                fontWeight: isCurrent ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          )
        })}

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === totalPages ? '#cbd5e1' : '#334155',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Selanjutnya"
        >
          <ChevronRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === totalPages ? '#cbd5e1' : '#334155',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Halaman Terakhir"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  )
}
