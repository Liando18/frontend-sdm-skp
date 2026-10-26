import React, { useState, useRef } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Info } from 'lucide-react'
import { Role } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'
import { OwlMascot } from '../components/OwlMascot'

interface LoginViewProps {
  onLogin: (role: Role) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('sdm@bku.ac.id')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  // Mascot focus states
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  // Eye gaze calculation based on input string length
  const numLook = Math.min(identifier.length * 2.8, 100)

  // Automatic role resolution from identifier
  const resolveRole = (input: string): Role => {
    const clean = input.trim().toLowerCase()
    if (clean.includes('dekan') || clean.includes('ratna') || clean.includes('197506122005012001')) {
      return 'dekan'
    }
    if (clean.includes('kaprodi') || clean.includes('ade') || clean.includes('7737027039520350')) {
      return 'kaprodi'
    }
    if (clean.includes('dosen') || clean.includes('agus') || clean.includes('873841838401375170')) {
      return 'dosen'
    }
    return 'sdm'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const detectedRole = resolveRole(identifier)
    onLogin(detectedRole)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!containerRef.current) return
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: GSAP_EASE.smooth }
      )
    },
    { scope: containerRef }
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(ellipse at 50% 25%, #fff7ed 0%, #f8fafc 60%, #f1f5f9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 16px 24px',
      }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-[410px] sm:max-w-[430px] flex flex-col items-center"
      >
        {/* Kepala Maskot Burung Hantu 3D: Duduk Rapat & Menyatu di Atas Rim Form */}
        <div className="w-full flex justify-center -mb-5 sm:-mb-6 relative z-10 pointer-events-none select-none">
          <div className="pointer-events-auto">
            <OwlMascot
              isChecking={isEmailFocused}
              numLook={numLook}
              isHandsUp={isPasswordFocused || showPassword}
              isPeeking={showPassword}
            />
          </div>
        </div>

        {/* Card Form Login Terpadu */}
        <div
          className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 pt-5 sm:pt-6 relative z-0"
          style={{
            boxShadow: '0 16px 36px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Identitas Institusi Kompak */}
          <div className="text-center mb-4 sm:mb-5">
            <img
              src="/logo.png"
              alt="Logo Universitas Bhakti Kencana"
              className="w-10 h-9 object-contain mx-auto mb-1.5 block drop-shadow-sm"
            />
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              Direktorat Sumber Daya Manusia
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Universitas Bhakti Kencana Bandung
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Input Email Akun / NUPTK */}
            <div className="form-field">
              <label className="form-label" htmlFor="input-identifier">
                Email Akun / NUPTK
              </label>
              <div className="relative">
                <input
                  id="input-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                  placeholder="nama@bku.ac.id / NUPTK"
                  autoComplete="username"
                />
                <Mail
                  size={16}
                  className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div className="form-field">
              <label className="form-label" htmlFor="input-password">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="custom-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px' }}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                />
                <Lock
                  size={16}
                  className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Ingat Saya & Lupa Sandi */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer text-xs"
              >
                Lupa sandi?
              </button>
            </div>

            {/* Tombol Masuk Portal */}
            <button
              type="submit"
              className="brand-btn brand-btn--dark w-full justify-center text-sm font-semibold mt-1 py-2.5 sm:py-3"
              style={{ minHeight: '44px' }}
            >
              <span>Masuk ke Sistem Portal</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Fill (Kompak & Bersih) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <span>Uji Akun:</span>
            <button
              type="button"
              onClick={() => setIdentifier('sdm@bku.ac.id')}
              className={`px-2 py-0.5 rounded transition-colors ${
                identifier === 'sdm@bku.ac.id'
                  ? 'bg-orange-50 text-orange-700 font-semibold border border-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              SDM
            </button>
            <button
              type="button"
              onClick={() => setIdentifier('agus.miraj@bku.ac.id')}
              className={`px-2 py-0.5 rounded transition-colors ${
                identifier === 'agus.miraj@bku.ac.id'
                  ? 'bg-orange-50 text-orange-700 font-semibold border border-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Dosen
            </button>
            <button
              type="button"
              onClick={() => setIdentifier('ade.iwan@bku.ac.id')}
              className={`px-2 py-0.5 rounded transition-colors ${
                identifier === 'ade.iwan@bku.ac.id'
                  ? 'bg-orange-50 text-orange-700 font-semibold border border-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Kaprodi
            </button>
            <button
              type="button"
              onClick={() => setIdentifier('dekan.fkeperawatan@bku.ac.id')}
              className={`px-2 py-0.5 rounded transition-colors ${
                identifier === 'dekan.fkeperawatan@bku.ac.id'
                  ? 'bg-orange-50 text-orange-700 font-semibold border border-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Dekan
            </button>
          </div>

          {/* Copyright */}
          <div className="mt-2.5 text-center text-[11px] text-slate-400">
            Universitas Bhakti Kencana &copy; 2026
          </div>
        </div>
      </div>

      {/* Modal Pemulihan Kata Sandi */}
      {showForgotPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotPasswordModal(false)}>
          <div
            className="modal-card anim-modal"
            style={{ maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Info size={20} className="text-orange-600" />
              <div className="text-base font-bold text-slate-900">
                Pemulihan Kata Sandi Akun
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pemulihan kata sandi portal dosen dan staf terintegrasi dengan email resmi institusi <code>@bku.ac.id</code> atau NUPTK yang terdaftar di PDDIKTI. Silakan hubungi Helpdesk Direktorat SDM atau Unit TI Gedung Rektorat UBK.
            </p>
            <div className="flex justify-end mt-5">
              <button
                className="brand-btn brand-btn--dark"
                onClick={() => setShowForgotPasswordModal(false)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
