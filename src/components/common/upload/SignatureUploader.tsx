import React, { useRef, useState } from 'react'
import { Pen, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { resolveStorageUrl } from '../../../utils/security'

export interface SignatureUploaderProps {
  currentUrl?: string | null
  onUpload: (file: File) => void | Promise<void>
  onReset?: () => void | Promise<void>
  title?: string
  disabled?: boolean
  maxSizeMB?: number
}

/**
 * Standard SignatureUploader UBK
 * Sesuai DESAIN.md Bab 17.2
 */
export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  currentUrl,
  onUpload,
  onReset,
  title = 'Tanda Tangan Digital Resmi',
  disabled = false,
  maxSizeMB = 2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const activeSrc = previewUrl || (currentUrl ? resolveStorageUrl(currentUrl) : null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format tanda tangan harus PNG transparan, JPEG, atau WEBP.')
      return
    }

    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran berkas melebihi batas maksimal ${maxSizeMB} MB.`)
      return
    }

    try {
      setIsProcessing(true)
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)
      await onUpload(file)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengunggah tanda tangan.')
      setPreviewUrl(null)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleReset = async () => {
    setErrorMessage(null)
    setPreviewUrl(null)
    if (onReset) {
      try {
        setIsProcessing(true)
        await onReset()
      } catch (err: any) {
        setErrorMessage(err?.message || 'Gagal menghapus tanda tangan.')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div style={{ width: '100%', marginBottom: 14 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{title}</span>
        {activeSrc && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '11px',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            <CheckCircle2 size={12} />
            <span>Tersimpan Sah</span>
          </span>
        )}
      </div>

      {/* Signature Preview Box */}
      <div
        style={{
          width: '100%',
          height: 110,
          border: '1.5px dashed #94a3b8',
          borderRadius: 8,
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt="Tanda Tangan Digital"
            style={{
              maxHeight: 90,
              maxWidth: '85%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <Pen size={22} style={{ margin: '0 auto 6px', color: '#94a3b8' }} />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Belum Ada Tanda Tangan</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
              Format PNG transparan resolusi tinggi direkomendasikan
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 6,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          <Pen size={13} />
          <span>{isProcessing ? 'Mengunggah...' : activeSrc ? 'Ganti Tanda Tangan' : 'Unggah Tanda Tangan'}</span>
        </button>

        {onReset && activeSrc && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || isProcessing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 6,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Hapus</span>
          </button>
        )}
      </div>

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
