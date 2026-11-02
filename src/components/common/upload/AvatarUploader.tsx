import React, { useRef, useState } from 'react'
import { Camera, RotateCcw, AlertCircle } from 'lucide-react'
import { INSTITUTION } from '../../../constants/institution'
import { resolveStorageUrl } from '../../../utils/security'

export interface AvatarUploaderProps {
  currentUrl?: string | null
  onUpload: (file: File) => void | Promise<void>
  onReset?: () => void | Promise<void>
  disabled?: boolean
  size?: number
  maxSizeMB?: number
}

/**
 * Standard AvatarUploader UBK
 * Sesuai DESAIN.md Bab 17.1
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentUrl,
  onUpload,
  onReset,
  disabled = false,
  size = 100,
  maxSizeMB = 2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const activeSrc =
    previewUrl ||
    (currentUrl && currentUrl !== '-' ? resolveStorageUrl(currentUrl) : INSTITUTION.userFallbackPath)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    // Validasi format
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format berkas harus PNG, JPEG, atau WEBP.')
      return
    }

    // Validasi ukuran (max 2MB)
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran foto melebihi batas maksimal ${maxSizeMB} MB.`)
      return
    }

    try {
      setIsProcessing(true)
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)
      await onUpload(file)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengunggah foto.')
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
        setErrorMessage(err?.message || 'Gagal mereset foto profil.')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
      />

      {/* Avatar Container */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2.5px solid #cbd5e1',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src={activeSrc}
          alt="Foto Profil"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            e.currentTarget.src = INSTITUTION.userFallbackPath
          }}
        />

        {/* Hover / Camera Overlay */}
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '34%',
              background: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'background 0.2s',
            }}
            title="Klik untuk mengganti foto profil"
          >
            <Camera size={size > 80 ? 16 : 14} />
          </button>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 6,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          <Camera size={13} />
          <span>{isProcessing ? 'Mengunggah...' : 'Pilih Foto'}</span>
        </button>

        {onReset && (currentUrl || previewUrl) && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || isProcessing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
            }}
            title="Kembalikan foto profil ke default sistem"
          >
            <RotateCcw size={12} />
            <span>Default</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '11.5px',
            color: '#ef4444',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
