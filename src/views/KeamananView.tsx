import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Shield,
  Activity,
  Sparkles,
  Check,
  AlertTriangle,
  Globe,
  Clock,
  IdCard,
  LogOut,
  Info,
} from 'lucide-react'
import { UserSession } from '../types'
import { api } from '../services/api'
import { getStoredUserSession, saveUserSession, saveAuthToken } from '../utils/authStorage'

interface KeamananViewProps {
  user: UserSession
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  onUpdateUser?: (updated: UserSession) => void
  onLogout?: () => void
}

export const KeamananView: React.FC<KeamananViewProps> = ({
  user,
  onShowToast,
  onUpdateUser,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Deteksi Platform Sederhana & Aman (User Agent)
  const getDetectedPlatform = () => {
    if (typeof window === 'undefined' || !navigator?.userAgent) return 'Peramban Web Resmi'
    const ua = navigator.userAgent
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS (Desktop)'
    if (ua.includes('Windows')) return 'Windows (Desktop)'
    if (ua.includes('Linux')) return 'Linux (Desktop)'
    if (ua.includes('Android')) return 'Android (Mobile)'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS (Mobile)'
    return 'Peramban Web Institusi'
  }

  // Pengukur Kekuatan Kata Sandi
  const getPasswordStrength = () => {
    if (!newPassword) return { label: 'Belum Diisi', color: 'var(--muted)', width: '0%' }
    if (newPassword.length < 6) return { label: 'Terlalu Pendek (Min. 6)', color: '#ef4444', width: '25%' }

    let score = 0
    if (newPassword.length >= 8) score += 1
    if (/[A-Z]/.test(newPassword)) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1

    if (score <= 1) return { label: 'Lemah', color: '#f59e0b', width: '45%' }
    if (score === 2) return { label: 'Cukup Aman', color: '#3b82f6', width: '75%' }
    return { label: 'Sangat Kuat & Aman', color: '#10b981', width: '100%' }
  }

  const passwordStrength = getPasswordStrength()

  // Auto-Fill Dummy Password untuk Mempermudah Pengujian
  const handleAutoFillDummyPassword = () => {
    const dummyCurrent = user.nip || '198104152011011002'
    const dummyNew = 'BhaktiKencana2026!'
    setCurrentPassword(dummyCurrent)
    setNewPassword(dummyNew)
    setConfirmPassword(dummyNew)
    onShowToast('Data sandi pengujian berhasil diisikan ke formulir.', 'info')
  }

  // Handler Submit Ganti Kata Sandi
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
      const res = await api.auth.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })

      if (res && res.token) {
        saveAuthToken(res.token)
      }

      if (res && res.message) {
        onShowToast(res.message, 'success')
      } else {
        onShowToast('Kata sandi akun institusi berhasil diperbarui di sistem server!', 'success')
      }

      onUpdateUser?.({
        ...user,
        mustChangePassword: false,
      })
      const stored = getStoredUserSession()
      if (stored) {
        try {
          stored.mustChangePassword = false
          saveUserSession(stored)
        } catch {}
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi di server'
      onShowToast(errMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabel = () => {
    switch (user.role) {
      case 'sdm':
        return 'Direktorat SDM (Administrator Utama)'
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ========================================================= */}
      {/* HEADER UTAMA PUSAT KEAMANAN (DESAIN SPESIFIK & MANDIRI)   */}
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
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--brand-50)',
              border: '1px solid var(--brand-100)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--brand-600)',
              boxShadow: 'var(--shadow-xs)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Pusat Keamanan &amp; Kredensial Akun
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--status-success-ink)',
                  background: 'var(--status-success-bg)',
                  padding: '3px 9px',
                  borderRadius: 'var(--r-full)',
                  border: '1px solid var(--status-success-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={11} strokeWidth={2.5} />
                <span>Akun Terverifikasi</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Kelola proteksi kata sandi akun institusi, kredensial autentikasi, dan pantau aktivitas sesi aktif perangkat Anda.
            </p>
          </div>
        </div>

        {/* Status Ringkas Akun */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            padding: '8px 14px',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--hair)',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Pemilik Akun</span>
            <strong style={{ color: 'var(--ink)', fontSize: '12.5px' }}>{user.name}</strong>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--hair)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Otoritas Peran</span>
            <span style={{ color: 'var(--brand-600)', fontWeight: 700, fontSize: '12px' }}>{user.role?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3 STAT KESEHATAN KEAMANAN (HEALTH METRICS CARDS)          */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-lg)',
            padding: '18px 20px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#047857',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Status Kredensial</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#047857' }}>Aktif &amp; Terlindungi</div>
            <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>Pangkalan Data SDM BKU</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-lg)',
            padding: '18px 20px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#1d4ed8',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <IdCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Identitas Autentikasi</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace' }}>
              NIP. {user.nip || 'Belum Terdaftar'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{user.email}</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-lg)',
            padding: '18px 20px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Sesi Perangkat Saat Ini</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>{getDetectedPlatform()}</div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
              Koneksi Online Aktif
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KONTEN UTAMA: 2 KOLOM (FORMULIR SANDI & STATUS KEAMANAN)   */}
      {/* ========================================================= */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Kolom 1: Formulir Ganti Kata Sandi */}
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
          }}
        >
          {user.mustChangePassword && (
            <div
              style={{
                marginBottom: '18px',
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                color: 'var(--status-warning-ink)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '12.5px',
                lineHeight: '1.5',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--status-warning-ink)' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>
                  Kewajiban Penggantian Kata Sandi Awal Institusi
                </strong>
                Akun Anda saat ini masih menggunakan kredensial bawaan awal institusi (NUPTK/NIP). Demi menjaga integritas data kepegawaian dan kepatuhan standar keamanan informasi Universitas Bhakti Kencana, Anda diwajibkan untuk membuat kata sandi baru yang unik dan aman.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="var(--brand-600)" />
                <span>Perbarui Kata Sandi Akun</span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', margin: 0 }}>
                Disarankan mengganti kata sandi secara berkala dengan minimal 6 karakter kombinasi.
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
              <span>Isi Dummy Password</span>
            </button>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Kata Sandi Saat Ini */}
            <div className="form-field">
              <label className="form-label" htmlFor="sec-cur-pass">
                Kata Sandi Saat Ini *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="sec-cur-pass"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px', width: '100%' }}
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
              <label className="form-label" htmlFor="sec-new-pass">
                Kata Sandi Baru *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="sec-new-pass"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px', width: '100%' }}
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
              <label className="form-label" htmlFor="sec-conf-pass">
                Konfirmasi Kata Sandi Baru *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="sec-conf-pass"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px', width: '100%' }}
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

        {/* Kolom 2: Sesi Perangkat, Kebijakan, & Tindakan Cepat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Sesi Perangkat & Aktivitas Masuk */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
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
                  borderRadius: '10px',
                  background: 'var(--brand-50)',
                  color: 'var(--brand-600)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Globe size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Sesi Perangkat Saat Ini
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0 }}>
                  Informasi koneksi dan peramban yang aktif
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)' }}>
                  <Globe size={14} color="var(--brand-600)" />
                  <span>Platform Perangkat</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                  {getDetectedPlatform()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)' }}>
                  <Activity size={14} color="#16a34a" />
                  <span>Status Koneksi Sesi</span>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                  Online (Aktif)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)' }}>
                  <Clock size={14} color="var(--brand-600)" />
                  <span>Zona Waktu Institusi</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                  WIB (Asia/Jakarta, UTC+7)
                </span>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--panel-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>
                  <Shield size={13} color="var(--brand-600)" />
                  <span>Otoritas Sesi Berjalan</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Terautentikasi resmi sebagai {roleLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Standar & Kebijakan Keamanan Institusi */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
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
                  borderRadius: '10px',
                  background: 'var(--brand-50)',
                  color: 'var(--brand-600)',
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
                <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0 }}>
                  Standar integritas dan perlindungan data pegawai institusi
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--ink)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Kerahasiaan Kredensial:</strong> Jangan pernah membagikan kata sandi atau NIP Anda kepada pihak lain.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Bukan Permintaan Resmi:</strong> Petugas Direktorat SDM maupun TI tidak akan pernah meminta kata sandi Anda.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Perangkat Publik:</strong> Selalu lakukan logout apabila menggunakan komputer bersama di lingkungan kampus.
                </span>
              </div>
            </div>
          </div>

          {/* Card: Tindakan Darurat Sesi */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--r-xl)',
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412', margin: 0 }}>
                  Deteksi Aktivitas Mencurigakan?
                </h4>
                <p style={{ fontSize: '12px', color: '#7c2d12', margin: 0, marginTop: '4px', lineHeight: 1.5 }}>
                  Jika Anda merasa akun Anda diakses dari lokasi atau perangkat tidak dikenal, segera perbarui kata sandi di formulir samping dan keluar dari sesi aktif.
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--r-md)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={14} />
                <span>Keluar dari Sesi Ini (Logout)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
