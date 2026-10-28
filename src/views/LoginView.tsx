import React, { useState, useRef } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Role } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'
import { OwlMascot } from '../components/OwlMascot'

interface LoginViewProps {
  onLogin: (role: Role, identifier: string, password: string, rememberMe?: boolean) => void
}

interface TestActor {
  role: Role
  label: string
  name: string
  email: string
  nip: string
}

const TEST_ACTORS: TestActor[] = [
  {
    role: 'sdm',
    label: 'SDM',
    name: 'Asep Rohimat, S.Kom., M.T.',
    email: 'sdm@bku.ac.id',
    nip: '198104152011011002',
  },
  {
    role: 'dosen',
    label: 'Dosen',
    name: 'Agus Miraj D., M.Kep',
    email: 'agus.miraj@bku.ac.id',
    nip: '873841838401375170',
  },
  {
    role: 'kaprodi',
    label: 'Kaprodi',
    name: 'Ade Iwan M., M.Kep',
    email: 'ade.iwan@bku.ac.id',
    nip: '7737027039520350',
  },
  {
    role: 'dekan',
    label: 'Dekan',
    name: 'Dr. Hj. Ratna Dian S.',
    email: 'dekan.fkeperawatan@bku.ac.id',
    nip: '197506122005012001',
  },
]

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem('ubk_saved_identifier') || ''
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('ubk_remember_me') !== 'false'
  })
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
    if (rememberMe) {
      localStorage.setItem('ubk_saved_identifier', identifier)
      localStorage.setItem('ubk_remember_me', 'true')
    } else {
      localStorage.removeItem('ubk_saved_identifier')
      localStorage.setItem('ubk_remember_me', 'false')
    }
    const detectedRole = resolveRole(identifier)
    onLogin(detectedRole, identifier, password, rememberMe)
  }

  const handleQuickTestLogin = (actor: TestActor, autoSubmit = false) => {
    setIdentifier(actor.email)
    setPassword(actor.nip)
    if (autoSubmit) {
      if (rememberMe) {
        localStorage.setItem('ubk_saved_identifier', actor.email)
        localStorage.setItem('ubk_remember_me', 'true')
      }
      onLogin(actor.role, actor.email, actor.nip, rememberMe)
    }
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
        minHeight: '100dvh',
        overflowY: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        background: 'radial-gradient(ellipse at 50% 20%, #fff7ed 0%, #f8fafc 60%, #f1f5f9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-[420px] sm:max-w-[440px] flex flex-col items-center"
        style={{ margin: 'auto 0' }}
      >
        {/* Kepala Maskot Burung Hantu 3D */}
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

        {/* Card Form Login */}
        <div
          className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 pt-5 sm:pt-6 relative z-0"
          style={{
            boxShadow: '0 16px 36px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Identitas Institusi */}
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
            {/* Input NIP atau Email Akun */}
            <div className="form-field">
              <label className="form-label" htmlFor="input-identifier">
                Email Institusi / NIP Pegawai
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
                  placeholder="Contoh: sdm@bku.ac.id atau 19810415..."
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
                  onClick={() => setShowPassword((prev) => !prev)}
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
                <span>Ingat saya di perangkat ini</span>
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
              className="brand-btn brand-btn--dark w-full justify-center text-sm font-semibold mt-1 py-2.5 sm:py-3 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <span>Masuk ke Sistem Portal</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* ========================================================= */}
          {/* UJI LOGIN CEPAT (PENGEMBANGAN) - MINIMALIS & AMAN        */}
          {/* ========================================================= */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">
              Uji Cepat:
            </span>
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              {TEST_ACTORS.map((actor) => (
                <button
                  key={actor.role}
                  type="button"
                  onClick={() => handleQuickTestLogin(actor, true)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 cursor-pointer"
                  title={`Login cepat sebagai ${actor.name}`}
                >
                  <Zap size={10} className="text-amber-500" />
                  <span>{actor.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Autentikasi Resmi PDDIKTI & BKU */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500 text-center">
            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
            <span>Autentikasi terenkripsi terhubung ke Basis Data SDM UBK</span>
          </div>

          {/* Copyright */}
          <div className="mt-2 text-center text-[11px] text-slate-400">
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
              Untuk pemulihan atau pengaturan ulang kata sandi akun, silakan hubungi Direktorat Sumber Daya Manusia (SDM) atau Unit TI Universitas Bhakti Kencana.
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
