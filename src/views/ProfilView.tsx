import React, { useState } from 'react'
import {
  Building,
  Mail,
  GraduationCap,
  KeyRound,
  IdCard,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  FileBadge,
  User,
  PenTool,
  UploadCloud,
  Camera,
  RotateCcw,
  X,
  Lightbulb,
  Info,
  Phone,
} from 'lucide-react'
import { UserSession } from '../types'
import { api } from '../services/api'
import { resolveStorageUrl, getAvatarSrc } from '../utils/security'
import { saveUserSession } from '../utils/authStorage'

interface ProfilViewProps {
  user: UserSession
  initialTab?: 'profil' | 'ttd'
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  onUpdateUser?: (updated: UserSession) => void
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  user,
  initialTab = 'profil',
  onShowToast,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'ttd'>(initialTab)

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Form State untuk Edit Identitas Pegawai (Bisa Diedit Seluruh Role)
  const [formName, setFormName] = useState(user.name || '')
  const [formNip, setFormNip] = useState(user.nip || '')
  const [formNuptk, setFormNuptk] = useState(user.nuptk || '')
  const [formEmail, setFormEmail] = useState(user.email || '')
  const [formPhone, setFormPhone] = useState(user.phone || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [hasProfileChanges, setHasProfileChanges] = useState(false)
  const [isCopiedNip, setIsCopiedNip] = useState(false)

  React.useEffect(() => {
    setFormName(user.name || '')
    setFormNip(user.nip || '')
    setFormNuptk(user.nuptk || '')
    setFormEmail(user.email || '')
    setFormPhone(user.phone || '')
  }, [user])

  React.useEffect(() => {
    const isChanged =
      formName !== (user.name || '') ||
      formNip !== (user.nip || '') ||
      formNuptk !== (user.nuptk || '') ||
      formEmail !== (user.email || '') ||
      formPhone !== (user.phone || '')
    setHasProfileChanges(isChanged)
  }, [formName, formNip, formNuptk, formEmail, formPhone, user])

  // Foto Profil State
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleSelectAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi Format
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      onShowToast('Format foto profil harus berupa gambar PNG, JPG, JPEG, atau WEBP.', 'error')
      return
    }

    // Validasi Ukuran (Maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Ukuran berkas foto profil maksimal 2MB.', 'error')
      return
    }

    setSelectedAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewAvatarUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      onShowToast('Silakan pilih berkas foto profil terlebih dahulu.', 'warning')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const res = await api.auth.uploadAvatar(selectedAvatarFile, {
        userId: user.id,
        nip: user.nip,
        email: user.email,
      })

      if (res && res.avatarUrl) {
        setPreviewAvatarUrl(null)
        setSelectedAvatarFile(null)
        if (avatarInputRef.current) avatarInputRef.current.value = ''
        onUpdateUser?.({
          ...user,
          avatar: res.avatarUrl,
        })
        onShowToast('Foto profil resmi berhasil diperbarui di sistem!', 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto profil ke server'
      onShowToast(msg, 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleCancelAvatarSelection = () => {
    setSelectedAvatarFile(null)
    setPreviewAvatarUrl(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleResetAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      await api.auth.resetAvatar({
        userId: user.id,
        nip: user.nip,
        email: user.email,
      })

      setPreviewAvatarUrl(null)
      setSelectedAvatarFile(null)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      onUpdateUser?.({
        ...user,
        avatar: '/user.svg',
      })
      onShowToast('Foto profil berhasil dikembalikan ke avatar profil semula.', 'info')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mereset foto profil'
      onShowToast(msg, 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Tanda Tangan Digital Institusi State
  const [signatureUrl, setSignatureUrl] = useState<string>(
    user.signatureUrl ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23c2410c">TTD Terverifikasi</text></svg>'
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)

  const handleSelectSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi Tipe & Ekstensi
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      onShowToast('Format berkas harus berupa gambar PNG, JPG, JPEG, atau WEBP.', 'error')
      return
    }

    // Validasi Ukuran (Maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Ukuran berkas tanda tangan maksimal 2MB.', 'error')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewFileUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSignature = async () => {
    if (!selectedFile) {
      onShowToast('Silakan pilih berkas tanda tangan terlebih dahulu.', 'warning')
      return
    }

    setIsUploadingSignature(true)
    try {
      const res = await api.auth.uploadSignature(selectedFile, {
        userId: user.id,
        nip: user.nip,
        email: user.email,
      })

      if (res && res.signatureUrl) {
        setSignatureUrl(res.signatureUrl)
        setPreviewFileUrl(null)
        setSelectedFile(null)
        onUpdateUser?.({
          ...user,
          signatureUrl: res.signatureUrl,
        })
        onShowToast('Tanda tangan digital resmi berhasil disimpan permanen di server backend!', 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah tanda tangan ke server'
      onShowToast(msg, 'error')
    } finally {
      setIsUploadingSignature(false)
    }
  }

  const handleUsePresetSignature = async () => {
    try {
      const svgPreset = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80"><path d="M15 50 Q 40 10 80 45 T 150 25 T 205 40" fill="none" stroke="%230f223d" stroke-width="3"/><path d="M70 42 Q 85 65 110 50" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="20" y="72" font-family="sans-serif" font-weight="bold" font-size="11" fill="%23c2410c">TTD RESMI INSTITUSI UBK</text></svg>`
      setSignatureUrl(svgPreset)
      onUpdateUser?.({
        ...user,
        signatureUrl: svgPreset,
      })
      onShowToast('Preset tanda tangan resmi institusi berhasil diaktifkan.', 'success')
    } catch {
      onShowToast('Gagal memuat preset tanda tangan', 'error')
    }
  }

  const handleCopyNip = () => {
    if (user.nip) {
      navigator.clipboard.writeText(user.nip)
      setIsCopiedNip(true)
      setTimeout(() => setIsCopiedNip(false), 2000)
      onShowToast('NIP berhasil disalin ke papan klip!', 'info')
    }
  }

  // Handler Simpan Pembaruan Profil (Nama, NIP, NUPTK, Email, Phone)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim()) {
      onShowToast('Nama lengkap pegawai wajib diisi.', 'warning')
      return
    }

    if (!formNip.trim()) {
      onShowToast('Nomor Induk Pegawai (NIP) wajib diisi.', 'warning')
      return
    }

    if (!formEmail.trim() || !formEmail.includes('@')) {
      onShowToast('Email resmi institusi tidak valid.', 'warning')
      return
    }

    setIsSavingProfile(true)
    try {
      const res = await api.auth.updateProfile({
        name: formName.trim(),
        nip: formNip.trim(),
        nuptk: formNuptk.trim() || undefined,
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
      })

      if (res && res.user) {
        onUpdateUser?.(res.user)
        try {
          saveUserSession(res.user)
        } catch {}
      }

      onShowToast(res.message || 'Data profil dan identitas kepegawaian berhasil diperbarui!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui data profil ke server'
      onShowToast(msg, 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleResetProfileForm = () => {
    setFormName(user.name || '')
    setFormNip(user.nip || '')
    setFormNuptk(user.nuptk || '')
    setFormEmail(user.email || '')
    setFormPhone(user.phone || '')
    onShowToast('Formulir telah dikembalikan ke data awal.', 'info')
  }

  const roleBadgeLabel = () => {
    switch (user.role) {
      case 'sdm':
        return 'Direktorat SDM (Administrator)'
      case 'dosen':
        return 'Dosen Fungsional'
      case 'kaprodi':
        return 'Ketua Program Studi'
      case 'dekan':
        return 'Pimpinan Fakultas (Dekan)'
      default:
        return user.role
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ========================================================= */}
      {/* EXECUTIVE PROFILE HEADER - CARD PUTIH BERSIH & MODERN     */}
      {/* ========================================================= */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar Pegawai dengan Tombol Edit Foto Tunggal */}
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleSelectAvatarFile}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              aria-label="Unggah foto profil"
            />
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '20px',
                overflow: 'hidden',
                background: '#f1f5f9',
                display: 'grid',
                placeItems: 'center',
                boxShadow: 'var(--shadow-sm)',
                border: '3px solid #f8fafc',
                position: 'relative',
              }}
            >
              <img
                src={previewAvatarUrl || getAvatarSrc(user.avatar)}
                alt={user.name}
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.src.endsWith('/user.svg')) {
                    target.src = '/user.svg'
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {previewAvatarUrl && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(217, 119, 6, 0.92)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '2px 0',
                    letterSpacing: '0.04em',
                  }}
                >
                  BARU
                </div>
              )}
            </div>

            {/* Tombol Kamera Ubah Foto */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: -3,
                right: -3,
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--brand-600)',
                color: '#ffffff',
                border: '2px solid #ffffff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
              title="Ganti foto profil akun"
              aria-label="Pilih foto baru"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Info Pegawai */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-700)',
                  background: 'var(--brand-100)',
                  padding: '2px 8px',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                {roleBadgeLabel()}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: 'var(--r-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} />
                <span>Pegawai Aktif</span>
              </span>
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              {user.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '12.5px',
                color: 'var(--muted)',
                marginTop: '6px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IdCard size={14} color="var(--brand-600)" />
                <span>NIP:</span>
                <strong style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{user.nip || '-'}</strong>
              </span>
              {user.nuptk && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <GraduationCap size={14} color="var(--brand-600)" />
                  <span>NUPTK:</span>
                  <strong style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{user.nuptk}</strong>
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} color="var(--brand-600)" />
                <span>{user.email}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building size={14} color="var(--brand-600)" />
                <span>{user.prodi || (user.fakultas ? `Fakultas ${user.fakultas}` : 'Direktorat SDM')}</span>
              </span>
            </div>

            {/* Quick Action Preview Bar */}
            {previewAvatarUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '10px',
                  padding: '6px 12px',
                  background: '#fef3c7',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid #fde68a',
                  fontSize: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 600, color: '#92400e' }}>Pratinjau Foto Baru:</span>
                <button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={isUploadingAvatar}
                  className="brand-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={13} />
                  <span>{isUploadingAvatar ? 'Menyimpan...' : 'Simpan Foto'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelAvatarSelection}
                  disabled={isUploadingAvatar}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    background: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <X size={13} />
                  <span>Batal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="brand-btn brand-btn--outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#ffffff',
            }}
            title="Pilih dan ubah foto profil resmi"
          >
            <Camera size={14} color="var(--brand-600)" />
            <span>Ubah Foto Profil</span>
          </button>

          {user.avatar && !user.avatar.endsWith('user.svg') && !user.avatar.endsWith('user.png') && user.avatar.length > 5 && !previewAvatarUrl && (
            <button
              type="button"
              onClick={handleResetAvatar}
              disabled={isUploadingAvatar}
              className="brand-btn brand-btn--outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--muted)',
                background: '#ffffff',
              }}
              title="Kembalikan ke avatar profil semula"
            >
              <RotateCcw size={14} />
              <span>Reset Avatar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyNip}
            className="brand-btn brand-btn--outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#ffffff',
            }}
            title="Salin NIP ke papan klip"
          >
            {isCopiedNip ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{isCopiedNip ? 'Tersalin!' : 'Salin NIP'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB NAVIGATION: PROFIL & TTD ONLY (KEAMANAN TERISOLASI)   */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--hair)', paddingBottom: '2px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--r-md) var(--r-md) 0 0',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'profil' ? '#ffffff' : 'transparent',
            color: activeTab === 'profil' ? 'var(--brand-600)' : 'var(--muted)',
            borderBottom: activeTab === 'profil' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            boxShadow: activeTab === 'profil' ? '0 -2px 6px -1px rgba(0,0,0,0.03)' : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <User size={16} />
          <span>Identitas &amp; Kepegawaian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ttd')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--r-md) var(--r-md) 0 0',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'ttd' ? '#ffffff' : 'transparent',
            color: activeTab === 'ttd' ? 'var(--brand-600)' : 'var(--muted)',
            borderBottom: activeTab === 'ttd' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            boxShadow: activeTab === 'ttd' ? '0 -2px 6px -1px rgba(0,0,0,0.03)' : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <PenTool size={16} />
          <span>Tanda Tangan Digital (TTD)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB TTD: KELOLA TANDA TANGAN DIGITAL INSTITUSI RESMI       */}
      {/* ========================================================= */}
      {activeTab === 'ttd' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px' }}>
          {/* Card 1: Pratinjau TTD Aktif Saat Ini */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '26px 28px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--r-xl)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PenTool size={18} className="text-orange-600" />
                  <span>Tanda Tangan Digital Aktif</span>
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px', margin: 0 }}>
                  Terdaftar resmi di sistem backend dan digunakan otomatis saat verifikasi SKP &amp; surat-menyurat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUsePresetSignature}
                className="brand-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Gunakan contoh preset tanda tangan institusi resmi"
              >
                <Sparkles size={13} className="text-amber-600 animate-pulse" />
                <span>Gunakan Preset TTD</span>
              </button>
            </div>

            {/* Kotak Fisik TTD */}
            <div
              style={{
                borderRadius: 'var(--r-lg)',
                border: '1.5px dashed var(--hair-strong)',
                background: '#fafbfc',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '160px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--r-sm)',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                }}
              >
                <ShieldCheck size={12} />
                <span>TTD Terverifikasi</span>
              </div>

              {(previewFileUrl || signatureUrl) ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={resolveStorageUrl(previewFileUrl || signatureUrl)}
                    alt={`Tanda Tangan Digital ${user.name}`}
                    onError={(e) => {
                      const target = e.currentTarget
                      target.onerror = null
                      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="70"><path d="M12 45 Q 50 12 90 42 T 160 20" fill="none" stroke="%230f223d" stroke-width="2.6"/><text x="14" y="62" font-family="sans-serif" font-weight="bold" font-size="10.5" fill="%23059669">TTD Terverifikasi: ${encodeURIComponent(user.name.split(',')[0])}</text></svg>`
                    }}
                    style={{
                      maxHeight: '85px',
                      maxWidth: '240px',
                      objectFit: 'contain',
                      margin: '0 auto',
                    }}
                  />
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--hair)', paddingTop: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ink)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      NIP. {user.nip || '198104152011011002'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                  <PenTool size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>Belum ada tanda tangan yang diunggah.</p>
                  <p style={{ fontSize: '11.5px', marginTop: 4 }}>Silakan unggah berkas gambar tanda tangan di samping.</p>
                </div>
              )}
            </div>

            {/* Manfaat Otomatisasi TTD */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                border: '1px solid var(--hair-subtle)',
                fontSize: '12px',
                lineHeight: 1.55,
                color: '#334155',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} className="text-emerald-600" />
                <span>Alur Otomatisasi Tanda Tangan:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
                <li><strong>Untuk Pimpinan yang Menyetujui (Kaprodi / Dekan / KeCab):</strong> Pada saat memverifikasi dan menyetujui (ACC) SKP dosen, tanda tangan persetujuan ini akan langsung tersemat otomatis tanpa perlu unggah berkas lagi.</li>
                <li><strong>Untuk Dosen yang Dinilai:</strong> Tanda tangan ini otomatis tersemat berdampingan di formulir cetak SKP saat pengajuan Anda disetujui pimpinan.</li>
                <li><strong>Keperluan Kedinasan:</strong> Dapat dipakai untuk transkrip kinerja BerAKHLAK dan formulir tahunan.</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Formulir Unggah Tanda Tangan Baru ke Backend */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '26px 28px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--r-xl)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--hair-subtle)', paddingBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--brand-50)',
                  color: 'var(--brand-600)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <UploadCloud size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Unggah Berkas Tanda Tangan
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  Ganti atau perbarui tanda tangan digital resmi akun Anda
                </p>
              </div>
            </div>

            {/* Input File Box */}
            <div
              style={{
                border: '2px dashed var(--hair-strong)',
                borderRadius: 'var(--r-lg)',
                padding: '24px 20px',
                textAlign: 'center',
                background: previewFileUrl ? '#f0fdf4' : '#fafbfc',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => document.getElementById('signature-input-field')?.click()}
            >
              <input
                id="signature-input-field"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleSelectSignatureFile}
                style={{ display: 'none' }}
              />

              {previewFileUrl ? (
                <div>
                  <img
                    src={previewFileUrl}
                    alt="Pratinjau Berkas"
                    style={{ maxHeight: '75px', maxWidth: '200px', objectFit: 'contain', margin: '0 auto 10px' }}
                  />
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#15803d' }}>
                    Berkas baru siap disimpan: {selectedFile?.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Klik untuk mengganti berkas lain
                  </div>
                </div>
              ) : (
                <div>
                  <PenTool size={32} color="var(--brand-600)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    Klik untuk memilih berkas tanda tangan
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                    Format PNG, JPG, JPEG, atau WEBP (Maksimal 2MB)
                  </div>
                </div>
              )}
            </div>

            {/* Tips Hasil Terbaik */}
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Lightbulb size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Tips Hasil Terbaik:</strong> Disarankan menggunakan gambar dengan latar belakang transparan (format PNG/WEBP) dengan resolusi tajam agar hasil verifikasi dan cetak SKP terlihat rapi dan elegan.
              </div>
            </div>

            {/* Tombol Simpan ke Server */}
            <button
              type="button"
              disabled={!selectedFile || isUploadingSignature}
              onClick={handleUploadSignature}
              className="brand-btn brand-btn--dark"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '11px',
                fontSize: '13px',
                fontWeight: 700,
                opacity: !selectedFile || isUploadingSignature ? 0.6 : 1,
                cursor: !selectedFile || isUploadingSignature ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploadingSignature ? (
                <>
                  <div className="btn-spinner" />
                  <span>Mengunggah ke Server Backend...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Unggah &amp; Simpan ke Server Institusi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: IDENTITAS & KEPEGAWAIAN LENGKAP                   */}
      {/* ========================================================= */}
      {activeTab === 'profil' && (
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Card Formulir Data Identitas Pegawai (Dapat Diedit Seluruh Role) */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '26px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              borderRadius: 'var(--r-xl)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--hair-subtle)',
                paddingBottom: '14px',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--brand-50)',
                    color: 'var(--brand-600)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IdCard size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                    Perbarui Data Identitas Pegawai
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Kelola nama, NIP, NUPTK, email, dan nomor kontak resmi Anda
                  </p>
                </div>
              </div>

              {hasProfileChanges && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#d97706',
                    background: '#fef3c7',
                    padding: '3px 10px',
                    borderRadius: 'var(--r-full)',
                    border: '1px solid #fde68a',
                  }}
                >
                  Perubahan Belum Disimpan
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nama Lengkap & Gelar */}
              <div className="form-field">
                <label className="form-label" htmlFor="input-profile-name">
                  Nama Lengkap &amp; Gelar Resmi *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="input-profile-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="custom-input"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', width: '100%' }}
                    placeholder="Contoh: Aprilian Gevindo, M.Kom"
                  />
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>
                  Nama dan gelar resmi yang disinkronkan ke lembar pengesahan dan cetak SKP.
                </span>
              </div>

              {/* Grid 2 Kolom: NIP & NUPTK */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                {/* NIP */}
                <div className="form-field">
                  <label className="form-label" htmlFor="input-profile-nip">
                    Nomor Induk Pegawai (NIP) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-profile-nip"
                      type="text"
                      required
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      className="custom-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', fontFamily: 'monospace', width: '100%' }}
                      placeholder="Contoh: 198104152011011002"
                    />
                    <IdCard size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  </div>
                </div>

                {/* NUPTK */}
                <div className="form-field">
                  <label className="form-label" htmlFor="input-profile-nuptk">
                    NUPTK Pegawai / Dosen
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-profile-nuptk"
                      type="text"
                      value={formNuptk}
                      onChange={(e) => setFormNuptk(e.target.value)}
                      className="custom-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', fontFamily: 'monospace', width: '100%' }}
                      placeholder="16 digit NUPTK resmi"
                    />
                    <GraduationCap size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom: Email & No. HP / WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                {/* Email */}
                <div className="form-field">
                  <label className="form-label" htmlFor="input-profile-email">
                    Email Akun Institusi *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-profile-email"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="custom-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', width: '100%' }}
                      placeholder="nama@bku.ac.id"
                    />
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  </div>
                </div>

                {/* Telepon */}
                <div className="form-field">
                  <label className="form-label" htmlFor="input-profile-phone">
                    Nomor WhatsApp / Telepon
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-profile-phone"
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="custom-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', width: '100%' }}
                      placeholder="Contoh: 081234567890"
                    />
                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  </div>
                </div>
              </div>

              {/* Tautan Cepat ke Pusat Keamanan Akun */}
              <div
                style={{
                  marginTop: '4px',
                  padding: '14px 18px',
                  background: '#f8fafc',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--hair)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--brand-50)',
                      color: 'var(--brand-600)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                      Pengaturan Kata Sandi &amp; Akses Akun
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      Ingin mengganti kata sandi atau memeriksa sesi? Kelola di Pusat Keamanan.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({ nav: 'keamanan' }, '', '/akun/keamanan')
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  }}
                  className="brand-btn brand-btn--outline"
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <span>Buka Pusat Keamanan</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="brand-btn brand-btn--dark"
                  style={{
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    minHeight: '44px',
                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={16} />
                  <span>{isSavingProfile ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Identitas'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetProfileForm}
                  disabled={isSavingProfile || !hasProfileChanges}
                  className="brand-btn brand-btn--outline"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    minHeight: '44px',
                    background: '#ffffff',
                    color: 'var(--muted)',
                    cursor: (!hasProfileChanges || isSavingProfile) ? 'not-allowed' : 'pointer',
                    opacity: hasProfileChanges ? 1 : 0.6,
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Reset Formulir</span>
                </button>
              </div>
            </form>
          </div>

          {/* Kolom 2: Status Kepegawaian & Legalitas Resmi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              className="panel"
              style={{
                background: '#ffffff',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                borderRadius: 'var(--r-xl)',
                border: '1px solid var(--hair)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--hair-subtle)', paddingBottom: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <FileBadge size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                    Legalitas &amp; Dokumen Kepegawaian
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Kelayakan administratif Tridharma dan sertifikasi pendidik
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Status Ikatan Kerja
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    Pegawai Tetap Yayasan (Dosen Tetap Universitas)
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Hak Akses &amp; Otoritas Sistem
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-700)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} />
                    <span>{roleBadgeLabel()}</span>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Homebase Penugasan / Unit Kerja
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {user.prodi || (user.fakultas ? `Fakultas ${user.fakultas}` : 'Direktorat Sumber Daya Manusia')}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Jabatan Fungsional &amp; Pangkat
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {user.rank || 'Penata Tk I / IIId (Lektor)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan Sinkronisasi Resmi */}
            <div
              style={{
                background: '#eff6ff',
                borderRadius: 'var(--r-xl)',
                padding: '18px 20px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <Info size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.55 }}>
                <strong style={{ display: 'block', fontSize: '12.5px', marginBottom: '3px' }}>
                  Sinkronisasi Otomatis Antar Sistem
                </strong>
                Pembaruan NIP, NUPTK, nama, email, dan kontak Anda akan disinkronkan langsung ke akun login, profil dosen, serta lembar pengesahan dan cetak SKP resmi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
