import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'

export interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void | Promise<void>
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  label?: string
  helperText?: string
  currentFileName?: string | null
  onClear?: () => void
}

/**
 * Standard FileUploadDropzone UBK
 * Sesuai DESAIN.md Bab 17.3
 */
export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSizeMB = 5,
  disabled = false,
  label = 'Unggah Berkas Bukti Luaran Tridharma',
  helperText,
  currentFileName,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setErrorMessage(null)

    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran berkas (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal ${maxSizeMB} MB.`)
      return
    }

    try {
      setIsUploading(true)
      await onFileSelect(file)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses berkas.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div style={{ width: '100%', marginBottom: 14 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {label && (
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
          {label}
        </div>
      )}

      {currentFileName ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <FileText size={20} style={{ color: '#0284c7', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentFileName}
            </span>
          </div>

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled || isUploading}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Hapus berkas"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${isDragging ? '#0284c7' : '#cbd5e1'}`,
            borderRadius: 8,
            padding: '20px 16px',
            textAlign: 'center',
            background: isDragging ? '#f0f9ff' : '#f8fafc',
            cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          <UploadCloud
            size={28}
            style={{
              margin: '0 auto 6px',
              color: isDragging ? '#0284c7' : '#94a3b8',
            }}
          />
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            {isUploading ? 'Sedang Memproses...' : 'Tarik & letakkan berkas di sini atau klik untuk memilih'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 3 }}>
            {helperText || `Maksimal ${maxSizeMB} MB (${accept.split(',').join(', ')})`}
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            fontSize: '12px',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
