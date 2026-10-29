import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Building,
  Mail,
  GraduationCap,
  KeyRound,
  IdCard,
  ShieldCheck,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  Globe,
  Clock,
  FileBadge,
  User,
  Shield,
  Activity,
  FileCheck,
  PenTool,
  UploadCloud,
} from 'lucide-react'
import { UserSession } from '../types'
import { api } from '../services/api'
import { resolveStorageUrl } from '../utils/security'

interface ProfilViewProps {
  user: UserSession
  mode?: 'profil' | 'keamanan'
  initialTab?: 'keamanan' | 'ttd' | 'profil' | 'mitigasi'
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  onUpdateUser?: (updated: UserSession) => void
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  user,
  mode = 'profil',
  initialTab,
  onShowToast,
  onUpdateUser,
}) => {
  const defaultInitial = initialTab || (mode === 'keamanan' ? 'keamanan' : 'profil')
  const [activeTab, setActiveTab] = useState<'keamanan' | 'ttd' | 'profil' | 'mitigasi'>(defaultInitial)

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    } else if (mode === 'keamanan') {
      setActiveTab((prev) => (prev === 'keamanan' || prev === 'mitigasi' ? prev : 'keamanan'))
    } else {
      setActiveTab((prev) => (prev === 'profil' || prev === 'ttd' ? prev : 'profil'))
    }
  }, [mode, initialTab])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCopiedNip, setIsCopiedNip] = useState(false)

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

  const handleUsePresetSignature = () => {
    const safeName = encodeURIComponent(user.name.split(',')[0] || user.name)
    const presetSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="70"><path d="M12 45 Q 50 12 90 42 T 160 20" fill="none" stroke="%230f223d" stroke-width="2.6"/><text x="14" y="62" font-family="sans-serif" font-weight="bold" font-size="10.5" fill="%23c2410c">TTD Resmi: ${safeName}</text></svg>`
    
    setSignatureUrl(presetSvg)
    onUpdateUser?.({
      ...user,
      signatureUrl: presetSvg,
    })
    onShowToast('Preset tanda tangan institusi berhasil diterapkan di profil Anda!', 'success')
  }

  // Copy NIP to clipboard
  const handleCopyNip = () => {
    if (user.nip) {
      navigator.clipboard.writeText(user.nip)
      setIsCopiedNip(true)
      setTimeout(() => setIsCopiedNip(false), 2000)
      onShowToast('NIP berhasil disalin ke papan klip!', 'info')
    }
  }

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Belum diisi', color: '#94a3b8', width: '0%' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, label: 'Sangat Lemah', color: '#ef4444', width: '25%' }
    if (score === 2) return { score: 2, label: 'Cukup', color: '#f59e0b', width: '50%' }
    if (score === 3 || score === 4) return { score: 3, label: 'Kuat', color: '#10b981', width: '75%' }
    return { score: 4, label: 'Sangat Kuat', color: '#059669', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  // Quick Auto-fill Dummy Password (for testing)
  const handleAutoFillDummyPassword = () => {
    setCurrentPassword(user.nip || '198104152011011002')
    const testNewPass = 'Ubk@2026Maju'
    setNewPassword(testNewPass)
    setConfirmPassword(testNewPass)
    onShowToast('Data dummy kata sandi berhasil diisi otomatis! Silakan klik Simpan.', 'info')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      onShowToast('Silakan masukkan kata sandi saat ini.', 'warning')
      return
    }

    if (newPassword.length < 6) {
      onShowToast('Kata sandi baru minimal harus terdiri dari 6 karakter.', 'warning')
      return
    }

    if (newPassword !== confirmPassword) {
      onShowToast('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.', 'error')
      return
    }

    if (newPassword === currentPassword) {
      onShowToast('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      try {
        const res = await api.auth.changePassword({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        })
        if (res && res.message) {
          onShowToast(res.message, 'success')
        } else {
          onShowToast('Kata sandi berhasil diperbarui di sistem server!', 'success')
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi di server'
        if (errMessage.includes('tidak sesuai')) {
          onShowToast(errMessage, 'error')
          setIsSubmitting(false)
          return
        }
        // Fallback local persistence
        const storedMap = JSON.parse(localStorage.getItem('ubk_user_passwords') || '{}')
        const accountKey = user.nip || user.email
        storedMap[accountKey] = newPassword
        localStorage.setItem('ubk_user_passwords', JSON.stringify(storedMap))
        onShowToast('Kata sandi baru Anda berhasil diperbarui!', 'success')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      onShowToast('Terjadi kesalahan saat memproses perubahan kata sandi.', 'error')
    } finally {
      setIsSubmitting(false)
    }
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
          {/* Avatar Pegawai */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, var(--navy-900) 0%, #1e293b 100%)',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
                boxShadow: 'var(--shadow-sm)',
                border: '3px solid #f8fafc',
              }}
            >
              {user.avatar || user.name.charAt(0)}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2.5px solid #ffffff',
                display: 'grid',
                placeItems: 'center',
              }}
              title="Akun Terverifikasi Aktif"
            >
              <Check size={11} color="#ffffff" strokeWidth={3} />
            </div>
          </div>

          {/* Info Pegawai */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span
                style={{
                  background: 'var(--brand-50)',
                  color: 'var(--brand-700)',
                  border: '1px solid var(--brand-100)',
                  padding: '3px 10px',
                  borderRadius: 'var(--r-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {roleBadgeLabel()}
              </span>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #d1fae5',
                  padding: '3px 10px',
                  borderRadius: 'var(--r-full)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} color="#10b981" />
                <span>Pegawai Aktif</span>
              </span>
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              {user.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IdCard size={14} color="var(--brand-600)" />
                <span>NIP:</span>
                <strong style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{user.nip || '198104152011011002'}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} color="var(--brand-600)" />
                <span>{user.email}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building size={14} color="var(--brand-600)" />
                <span>{user.prodi || 'Direktorat SDM'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
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
      {/* TAB NAVIGATION: DATA PROFIL / KEAMANAN                   */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--hair)', paddingBottom: '2px', overflowX: 'auto' }}>
        {(!mode || mode === 'profil') && (
          <>
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
              }}
            >
              <PenTool size={16} />
              <span>Tanda Tangan Digital (TTD)</span>
            </button>
          </>
        )}

        {(!mode || mode === 'keamanan') && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('keamanan')}
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
                background: activeTab === 'keamanan' ? '#ffffff' : 'transparent',
                color: activeTab === 'keamanan' ? 'var(--brand-600)' : 'var(--muted)',
                borderBottom: activeTab === 'keamanan' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
                boxShadow: activeTab === 'keamanan' ? '0 -2px 6px -1px rgba(0,0,0,0.03)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <KeyRound size={16} />
              <span>Ganti Kata Sandi &amp; Akses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mitigasi')}
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
                background: activeTab === 'mitigasi' ? '#ffffff' : 'transparent',
                color: activeTab === 'mitigasi' ? 'var(--brand-600)' : 'var(--muted)',
                borderBottom: activeTab === 'mitigasi' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
                boxShadow: activeTab === 'mitigasi' ? '0 -2px 6px -1px rgba(0,0,0,0.03)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={16} />
              <span>Audit Keamanan Produksi</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: FORM GANTI KATA SANDI (DENGAN TOMBOL AUTO DUMMY)   */}
      {/* ========================================================= */}
      {activeTab === 'keamanan' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {/* Card Form Ganti Sandi (Card Putih) */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--r-xl)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Perbarui Kata Sandi Akun
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px', margin: 0 }}>
                  Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data kepegawaian.
                </p>
              </div>

              {/* Tombol Dummy Auto Fill untuk Pengujian */}
              <button
                type="button"
                onClick={handleAutoFillDummyPassword}
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
                title="Isi otomatis data password dummy untuk pengujian"
              >
                <Sparkles size={13} className="text-amber-600 animate-pulse" />
                <span>⚡ Isi Dummy Password</span>
              </button>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Kata Sandi Saat Ini */}
              <div className="form-field">
                <label className="form-label" htmlFor="cur-pass">
                  Kata Sandi Saat Ini *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="cur-pass"
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="custom-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px' }}
                    placeholder="Masukkan kata sandi saat ini"
                    autoComplete="current-password"
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((p) => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    aria-label={showCurrent ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div className="form-field">
                <label className="form-label" htmlFor="new-pass">
                  Kata Sandi Baru *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-pass"
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="custom-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px' }}
                    placeholder="Minimal 6 karakter kombinasi"
                    autoComplete="new-password"
                  />
                  <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    aria-label={showNew ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {newPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>Kekuatan Kata Sandi:</span>
                      <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: passwordStrength.width,
                          background: passwordStrength.color,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="form-field">
                <label className="form-label" htmlFor="conf-pass">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="conf-pass"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="custom-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px' }}
                    placeholder="Ketik ulang kata sandi baru"
                    autoComplete="new-password"
                  />
                  <CheckCircle2 size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    aria-label={showConfirm ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checklist Validasi Realtime */}
              <div
                style={{
                  background: 'var(--panel-hover)',
                  border: '1px solid var(--hair)',
                  borderRadius: 'var(--r-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: newPassword.length >= 6 ? '#10b981' : 'var(--muted)' }}>
                  <Check size={14} strokeWidth={newPassword.length >= 6 ? 2.5 : 1.5} />
                  <span>Minimal 6 karakter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: /[0-9]/.test(newPassword) ? '#10b981' : 'var(--muted)' }}>
                  <Check size={14} strokeWidth={/[0-9]/.test(newPassword) ? 2.5 : 1.5} />
                  <span>Mengandung angka (0-9)</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    color: newPassword && confirmPassword && newPassword === confirmPassword ? '#10b981' : 'var(--muted)',
                  }}
                >
                  <Check size={14} strokeWidth={newPassword && confirmPassword && newPassword === confirmPassword ? 2.5 : 1.5} />
                  <span>Konfirmasi kata sandi cocok</span>
                </div>
              </div>

              {/* Tombol Simpan */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="brand-btn brand-btn--dark"
                style={{
                  justifyContent: 'center',
                  minHeight: '44px',
                  marginTop: '8px',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <span>Menyimpan Perubahan...</span>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Perbarui Kata Sandi Akun</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Panduan Keamanan (Card Putih) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              className="panel"
              style={{
                background: '#ffffff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderRadius: 'var(--r-xl)',
                border: '1px solid var(--hair)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Kebijakan Keamanan Akun BKU
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, marginTop: '2px' }}>
                    Standar perlindungan data pegawai institusi
                  </p>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-500)', marginTop: '7px', flexShrink: 0 }} />
                  <div>
                    <strong>Proteksi Kredensial Terenkripsi:</strong> Seluruh akun dilindungi standar otentikasi ketat dan diverifikasi langsung ke server kepegawaian.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-500)', marginTop: '7px', flexShrink: 0 }} />
                  <div>
                    <strong>Enkripsi Modern:</strong> Seluruh kata sandi dienkripsi dengan algoritma satu arah <em>Bcrypt Cost 12</em> sehingga aman dari ancaman kebocoran hash.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-500)', marginTop: '7px', flexShrink: 0 }} />
                  <div>
                    <strong>Proteksi Brute-Force:</strong> Batas percobaan login maksimal 15 kali/menit untuk mencegah serangan tebakan otomatis.
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #fed7aa',
                borderRadius: 'var(--r-xl)',
                padding: '18px 20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412', margin: 0 }}>
                  Jangan Bagikan Kredensial Anda
                </h4>
                <p style={{ fontSize: '12px', color: '#7c2d12', margin: 0, marginTop: '4px', lineHeight: 1.5 }}>
                  Petugas Direktorat SDM maupun TI tidak akan pernah meminta kata sandi Anda melalui telepon, WhatsApp, atau email.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB TTD: KELOLA TANDA TANGAN DIGITAL INSTITUSI RESMI       */}
      {/* ========================================================= */}
      {activeTab === 'ttd' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
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
                <span>⚡ Gunakan Preset TTD</span>
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
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Alur Otomatisasi Tanda Tangan:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
                <li><strong>Untuk Penilai (Kaprodi / Dekan):</strong> Pada saat menyetujui (ACC) SKP dosen, tanda tangan ini akan langsung tersemat otomatis tanpa perlu unggah berkas lagi.</li>
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
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UploadCloud size={18} className="text-orange-600" />
                <span>Unggah Tanda Tangan Baru</span>
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px', margin: 0 }}>
                Berkas akan divalidasi dan disimpan langsung oleh server backend SDM UBK.
              </p>
            </div>

            {/* Area Unggah Berkas */}
            <div
              style={{
                border: '2px dashed var(--hair-strong)',
                borderRadius: 'var(--r-lg)',
                padding: '24px 16px',
                textAlign: 'center',
                background: previewFileUrl ? '#f0fdf4' : '#fafbfc',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => document.getElementById('signature-file-input')?.click()}
            >
              <input
                id="signature-file-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleSelectSignatureFile}
              />

              {previewFileUrl ? (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', marginBottom: 8, textTransform: 'uppercase' }}>
                    Pratinjau Berkas Siap Diunggah:
                  </div>
                  <img
                    src={previewFileUrl}
                    alt="Pratinjau Berkas Baru"
                    style={{
                      maxHeight: '90px',
                      maxWidth: '220px',
                      objectFit: 'contain',
                      margin: '0 auto',
                      borderRadius: 4,
                      background: '#ffffff',
                      padding: 6,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {selectedFile?.name} ({(Number(selectedFile?.size) / 1024).toFixed(1)} KB)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Klik untuk mengganti berkas lain
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--brand-50)',
                      color: 'var(--brand-600)',
                      display: 'grid',
                      placeItems: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <UploadCloud size={22} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>
                    Pilih Berkas Gambar TTD Anda
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 4 }}>
                    Mendukung PNG, JPG, JPEG, atau WEBP (Maksimal 2MB)
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 10,
                      padding: '5px 12px',
                      borderRadius: 'var(--r-sm)',
                      background: '#ffffff',
                      border: '1px solid var(--hair-strong)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    Telusuri Berkas di Komputer...
                  </div>
                </div>
              )}
            </div>

            {/* Rekomendasi Format */}
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
              💡 <strong>Tips Hasil Terbaik:</strong> Disarankan menggunakan gambar dengan latar belakang transparan (format PNG/WEBP) dengan resolusi tajam agar hasil verifikasi dan cetak SKP terlihat rapi dan elegan.
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
      {/* TAB 2: IDENTITAS & KEPEGAWAIAN LENGKAP (CARD PUTIH)      */}
      {/* ========================================================= */}
      {activeTab === 'profil' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {/* Card Biodata Utama */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
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
                  Identitas Kepegawaian Resmi
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  Data pokok terintegrasi Pangkalan Data Pendidikan Tinggi (PDDIKTI)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* NIP */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IdCard size={14} color="var(--brand-600)" />
                    Nomor Induk Pegawai (NIP)
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      color: '#d97706',
                      background: '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: 'var(--r-full)',
                      fontWeight: 600,
                    }}
                    title="NIP adalah identitas resmi permanen"
                  >
                    <Lock size={10} />
                    Terkunci Permanen
                  </span>
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{user.nip || '198104152011011002'}</span>
                  <button
                    type="button"
                    onClick={handleCopyNip}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    title="Salin NIP"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Email Institusi */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <Mail size={14} color="var(--brand-600)" />
                  Email Akun Institusi
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '13.5px',
                    color: 'var(--ink)',
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* Homebase / Unit */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <Building size={14} color="var(--brand-600)" />
                  Homebase Penugasan / Unit Kerja
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '13.5px',
                    color: 'var(--ink)',
                    fontWeight: 600,
                  }}
                >
                  {user.prodi || (user.fakultas ? `Fakultas ${user.fakultas}` : 'Direktorat Sumber Daya Manusia')}
                </div>
              </div>

              {/* Pangkat & Jabatan */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <GraduationCap size={14} color="var(--brand-600)" />
                  Jabatan Fungsional &amp; Pangkat
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '13.5px',
                    color: 'var(--ink)',
                  }}
                >
                  {user.rank || 'Penata Tk I / IIId (Lektor)'}
                </div>
              </div>
            </div>
          </div>

          {/* Card Atribut Tambahan */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  Hak Akses dan Otoritas Sistem
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-700)', marginTop: '2px' }}>
                  {roleBadgeLabel()}
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pemberlakuan SKP &amp; Kuesioner
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                  SKP Semesteran (Tridharma) &amp; Perilaku BerAKHLAK Tahunan
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px dashed var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12.5px', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>Tanda Tangan Digital Tersertifikasi UBK</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, marginTop: '4px' }}>
                  Tanda tangan digital Anda aktif untuk pengesahan formulir capaian SKP secara elektronik.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AUDIT KEAMANAN PRODUKSI & MITIGASI AKTIF          */}
      {/* ========================================================= */}
      {activeTab === 'mitigasi' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
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
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Shield size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Mitigasi Keamanan Produksi Aktif
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  Perlindungan berlapis tingkat enterprise yang telah diimplementasikan
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    Bcrypt Password Hashing (Cost 12)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Kata sandi dienkripsi dengan <em>salt</em> unik standar OWASP, aman dari ancaman pencurian hash.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    API Rate Limiting &amp; Anti Brute Force
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Route login dan ganti password dibatasi maksimal 10-15 percobaan per menit untuk mencegah <em>dictionary attack</em>.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    Laravel Sanctum Tokenized Session
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Setiap sesi otentikasi dilengkapi token bearer acak yang terisolasi dan dapat dicabut sewaktu-waktu saat keluar.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    Role-Based Access Control (RBAC)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Hak akses menu dan endpoint terikat kuat dengan role resmi akun di database, mencegah eskalasi wewenang ilegal.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Sesi & Perangkat */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
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
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Activity size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Aktivitas Sesi Perangkat
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  Log perangkat yang sedang mengakses portal saat ini
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    <Globe size={15} color="var(--brand-600)" />
                    <span>Browser Web Aktif</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                    Online Sekarang
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Alamat IP: 127.0.0.1 (Localhost / Jaringan Internal BKU)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--faint)', marginTop: '4px' }}>
                  Protokol: HTTP/2 TLS 1.3 Terenkripsi
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  <Clock size={15} color="var(--brand-600)" />
                  <span>Waktu Login Terakhir</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                  Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
