import React, { useEffect, useRef, useState, useMemo, useId } from 'react'
import { motion } from 'motion/react'
import { useRive, useStateMachineInput } from '@rive-app/react-webgl2'

export interface OwlMascotProps {
  isChecking?: boolean
  numLook?: number
  isHandsUp?: boolean
  isPeeking?: boolean
  isWaving?: boolean
  useRiveFile?: boolean
  className?: string
}

/* ==========================================================================
   Mode A: Rive Runtime (Opsional jika file /owl-login.riv tersedia)
   ========================================================================== */
const RiveMascot: React.FC<Omit<OwlMascotProps, 'useRiveFile'>> = ({
  isChecking = false,
  numLook = 0,
  isHandsUp = false,
  isPeeking = false,
  className = '',
}) => {
  const { rive, RiveComponent } = useRive({
    src: '/owl-login.riv',
    stateMachines: 'Login Machine',
    autoplay: true,
  })

  const isCheckingInput = useStateMachineInput(rive, 'Login Machine', 'isChecking')
  const numLookInput = useStateMachineInput(rive, 'Login Machine', 'numLook')
  const isHandsUpInput = useStateMachineInput(rive, 'Login Machine', 'isHandsUp')
  const isPeekingInput = useStateMachineInput(rive, 'Login Machine', 'isPeeking')

  useEffect(() => {
    if (isCheckingInput) isCheckingInput.value = isChecking
  }, [isChecking, isCheckingInput])

  useEffect(() => {
    if (numLookInput) numLookInput.value = Math.min(100, Math.max(0, numLook))
  }, [numLook, numLookInput])

  useEffect(() => {
    if (isHandsUpInput) isHandsUpInput.value = isHandsUp
  }, [isHandsUp, isHandsUpInput])

  useEffect(() => {
    if (isPeekingInput) isPeekingInput.value = isPeeking
  }, [isPeeking, isPeekingInput])

  return (
    <div
      className={`w-full max-w-[240px] h-[190px] mx-auto flex items-center justify-center overflow-visible select-none ${className}`}
    >
      <RiveComponent className="w-full h-full" />
    </div>
  )
}

/* ==========================================================================
   Mode B: Interactive 3D Owl Mascot (Pixar-Style Vector SVG)
   - Karakter Burung Hantu 3D menggemaskan dengan bulu oranye cerah
   - Topi baseball abu-abu dengan tulisan tebal "SDM" warna oranye
   - Mata interaktif mengikuti kursor dan melirik teks input
   - Menutup KEDUA mata rapat-rapat saat input kata sandi
   - Membuka SATU mata mengintip ceria saat show password (1 mata tertutup)
   - Melambai-lambai memanggil user jika tidak ada interaksi selama 30 detik
   ========================================================================== */
const Interactive3DOwl: React.FC<Omit<OwlMascotProps, 'useRiveFile'>> = ({
  isChecking = false,
  numLook = 0,
  isHandsUp = false,
  isPeeking = false,
  isWaving: forceWaving,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 })
  const [isBlinking, setIsBlinking] = useState(false)
  const [owlCuriosityAngle, setOwlCuriosityAngle] = useState(0)
  const [idleWaving, setIdleWaving] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Apakah sedang melambai (otomatis 30 detik tanpa aktivitas atau di-force)
  const isWaving = forceWaving !== undefined ? forceWaving : idleWaving

  // 30 Detik Tanpa Interaksi -> Melambai Memanggil User
  useEffect(() => {
    if (forceWaving !== undefined) return
    if (isChecking || isHandsUp) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      return
    }

    idleTimerRef.current = setTimeout(() => {
      setIdleWaving(true)
    }, 30000)

    const onUserActivity = () => {
      setIdleWaving(false)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        setIdleWaving(true)
      }, 30000)
    }

    const onTriggerWave = () => setIdleWaving(true)
    window.addEventListener('trigger-owl-wave', onTriggerWave)

    window.addEventListener('mousemove', onUserActivity, { passive: true })
    window.addEventListener('keydown', onUserActivity, { passive: true })
    window.addEventListener('touchstart', onUserActivity, { passive: true })
    window.addEventListener('click', onUserActivity, { passive: true })

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      window.removeEventListener('trigger-owl-wave', onTriggerWave)
      window.removeEventListener('mousemove', onUserActivity)
      window.removeEventListener('keydown', onUserActivity)
      window.removeEventListener('touchstart', onUserActivity)
      window.removeEventListener('click', onUserActivity)
    }
  }, [isChecking, isHandsUp, forceWaving])

  // Gerakan Miring Kepala Inkuisitif Alami Burung Hantu
  useEffect(() => {
    if (isChecking || isHandsUp || isWaving) return

    const tiltInterval = setInterval(() => {
      const angles = [-5, 5, -3, 4, 0, 0]
      const pick = angles[Math.floor(Math.random() * angles.length)]
      setOwlCuriosityAngle(pick)
    }, 3600)

    return () => clearInterval(tiltInterval)
  }, [isChecking, isHandsUp, isWaving])

  // Pelacakan Posisi Kursor Mouse untuk Arah Pandangan Mata
  useEffect(() => {
    if (isChecking || isHandsUp || isWaving) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height * 0.45

      const dx = e.clientX - centerX
      const dy = e.clientY - centerY
      const dist = Math.hypot(dx, dy)

      const maxR = 6.2
      const angle = Math.atan2(dy, dx)
      const r = Math.min(maxR, dist / 40)

      setCursorOffset({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isChecking, isHandsUp, isWaving])

  // Kedipan Mata Alami
  useEffect(() => {
    if (isHandsUp && !isPeeking) return

    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 130)
    }, 4500)

    return () => clearInterval(blinkInterval)
  }, [isHandsUp, isPeeking])

  // Perhitungan Koordinat Pandangan Bola Mata
  const eyes = useMemo(() => {
    if (isChecking) {
      // Melirik ke arah formulir dari kiri ke kanan mengikuti panjang input
      const p = Math.max(0, Math.min(100, numLook)) / 100
      const gx = -4.5 + p * 9
      return { lx: gx, ly: 4.8, rx: gx, ry: 4.8 }
    }
    if (isHandsUp) {
      if (isPeeking) {
        // Mata kanan terbuka ceria menatap user
        return { lx: 0, ly: 2, rx: 2, ry: 0.5 }
      }
      return { lx: 0, ly: 3, rx: 0, ry: 3 }
    }
    if (isWaving) {
      // Menatap ramah ke arah user saat melambai
      return { lx: 1.5, ly: -1.2, rx: 1.5, ry: -1.2 }
    }
    return { lx: cursorOffset.x, ly: cursorOffset.y, rx: cursorOffset.x, ry: cursorOffset.y }
  }, [isChecking, numLook, isHandsUp, isPeeking, isWaving, cursorOffset])

  // Animasi Kepala (Tilting, Nodding, Peeking)
  const headAnim = useMemo(() => {
    if (isChecking) {
      return { y: 2.5, rotate: 2.5, scale: 1.01 }
    }
    if (isHandsUp) {
      if (isPeeking) {
        return { y: 0, rotate: -4.5, scale: 1.01 }
      }
      return { y: 2, rotate: 0, scale: 0.99 }
    }
    if (isWaving) {
      return { y: -2, rotate: 4, scale: 1.02 }
    }
    return {
      y: 0,
      rotate: owlCuriosityAngle + cursorOffset.x * 0.35,
      scale: 1,
    }
  }, [isChecking, isHandsUp, isPeeking, isWaving, owlCuriosityAngle, cursorOffset.x])

  // Unique ID prefix untuk SVG gradients & filters
  const rawId = useId()
  const uid = rawId.replace(/:/g, '')
  const g = (s: string) => `${uid}${s}`

  const spring = { type: 'spring' as const, stiffness: 280, damping: 22 }
  const eyeSpring = { type: 'spring' as const, stiffness: 320, damping: 26 }

  return (
    <div
      className={`w-full flex items-center justify-center select-none overflow-visible ${className}`}
      style={{ touchAction: 'none' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 320 250"
        className="w-full max-w-[215px] sm:max-w-[235px] h-auto overflow-visible drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Maskot Burung Hantu 3D SDM Universitas Bhakti Kencana"
        role="img"
      >
        <defs>
          {/* ── 3D Pixar Warm Orange Shading Gradients ── */}
          <radialGradient id={g('head3d')} cx="40%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="35%" stopColor="#F97316" />
            <stop offset="80%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </radialGradient>

          <radialGradient id={g('wing3d')} cx="36%" cy="28%" r="66%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="82%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </radialGradient>

          {/* Facial Mask (Warm Ivory to Peach Contour) */}
          <radialGradient id={g('mask3d')} cx="50%" cy="36%" r="62%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="50%" stopColor="#FEF3C7" />
            <stop offset="88%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FB923C" />
          </radialGradient>

          {/* Baseball Cap Slate 3D Gradients */}
          <radialGradient id={g('cap3d')} cx="38%" cy="24%" r="65%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="42%" stopColor="#64748B" />
            <stop offset="85%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          <linearGradient id={g('visor3d')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="55%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Heather Grey T-Shirt Gradient */}
          <linearGradient id={g('shirt3d')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="35%" stopColor="#64748B" />
            <stop offset="85%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Golden Orange Beak Gradient */}
          <radialGradient id={g('beak3d')} cx="44%" cy="26%" r="66%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </radialGradient>

          {/* Iris Luminous Deep Amber Radial Gradient */}
          <radialGradient id={g('iris3d')} cx="38%" cy="36%" r="56%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="68%" stopColor="#B45309" />
            <stop offset="92%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </radialGradient>

          {/* Soft Depth Shadow for Eyes */}
          <radialGradient id={g('eyeShadow')} cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </radialGradient>

          {/* Clip Paths untuk Mata Kiri (122, 116) dan Kanan (198, 116) */}
          <clipPath id={g('leftEyeClip')}>
            <circle cx="122" cy="116" r="23" />
          </clipPath>
          <clipPath id={g('rightEyeClip')}>
            <circle cx="198" cy="116" r="23" />
          </clipPath>

          {/* 3D Drop Shadow */}
          <filter id={g('dropShadow')} x="-20%" y="-15%" width="140%" height="135%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#7C2D12" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* ── Root Floating Group (Napas Alami) ── */}
        <motion.g
          animate={{
            y: [0, -3, 0],
            scaleY: [1, 1.012, 1],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* ── Kepala 3D (Bisa Meliuk, Condong, & Mengangguk) ── */}
          <motion.g
            animate={headAnim}
            transition={spring}
            style={{ transformOrigin: '160px 160px' }}
          >
            {/* Jambul Telinga Lembut Khas Burung Hantu (Kiri & Kanan) */}
            {/* Left Ear Tuft */}
            <motion.g
              animate={{ rotate: isChecking ? -3 : [-1, 2, -1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '104px 78px' }}
            >
              <path
                d="M 104 80 C 88 66, 68 46, 56 34 C 68 50, 84 68, 96 84 M 70 48 C 60 60, 54 72, 50 82 C 64 78, 80 78, 94 82"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </motion.g>

            {/* Right Ear Tuft */}
            <motion.g
              animate={{ rotate: isPeeking ? 5 : isChecking ? 3 : [1, -2, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '216px 78px' }}
            >
              <path
                d="M 216 80 C 232 66, 252 46, 264 34 C 252 50, 236 68, 224 84 M 250 48 C 260 60, 266 72, 270 82 C 256 78, 240 78, 226 82"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </motion.g>

            {/* Bulatan Kepala 3D Chubby */}
            <ellipse cx="160" cy="118" rx="68" ry="58" fill={`url(#${g('head3d')})`} filter={`url(#${g('dropShadow')})`} />

            {/* Bulu Pipi Bertingkat Kiri & Kanan (Cheek Tufts) */}
            {/* Left Cheek */}
            <path
              d="M 98 102 C 82 110, 66 124, 60 134 C 70 134, 80 132, 88 130 C 74 140, 66 152, 64 160 C 76 156, 86 152, 94 146 C 84 158, 80 168, 80 174 C 94 166, 106 158, 114 150 Z"
              fill={`url(#${g('wing3d')})`}
              stroke="#EA580C"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Right Cheek */}
            <path
              d="M 222 102 C 238 110, 254 124, 260 134 C 250 134, 240 132, 232 130 C 246 140, 254 152, 256 160 C 244 156, 234 152, 226 146 C 236 158, 240 168, 240 174 C 226 166, 214 158, 206 150 Z"
              fill={`url(#${g('wing3d')})`}
              stroke="#EA580C"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Kontur Masker Wajah Hangat */}
            <ellipse cx="122" cy="116" rx="36" ry="34" fill={`url(#${g('mask3d')})`} />
            <ellipse cx="198" cy="116" rx="36" ry="34" fill={`url(#${g('mask3d')})`} />
            <ellipse cx="160" cy="116" rx="24" ry="26" fill={`url(#${g('mask3d')})`} />

            {/* Pipi Merona Lembut */}
            <ellipse cx="100" cy="138" rx="11" ry="7" fill="#F43F5E" opacity="0.25" />
            <ellipse cx="220" cy="138" rx="11" ry="7" fill="#F43F5E" opacity="0.25" />

            {/* ── Mata Bulat Besar 3D ── */}
            {/* Sklera Putih Kiri & Kanan */}
            <circle cx="122" cy="116" r="23" fill="#FFFFFF" stroke="#FED7AA" strokeWidth="2.5" />
            <circle cx="122" cy="116" r="23" fill={`url(#${g('eyeShadow')})`} />

            <circle cx="198" cy="116" r="23" fill="#FFFFFF" stroke="#FED7AA" strokeWidth="2.5" />
            <circle cx="198" cy="116" r="23" fill={`url(#${g('eyeShadow')})`} />

            {/* Pupil Mata Kiri (Interaktif & Bisa Kedip) */}
            <g clipPath={`url(#${g('leftEyeClip')})`}>
              <motion.g animate={{ x: eyes.lx, y: eyes.ly }} transition={eyeSpring}>
                <circle cx="122" cy="116" r="13" fill={`url(#${g('iris3d')})`} />
                <circle cx="122" cy="116" r="8" fill="#090D16" />
                {/* Catchlight berkilau */}
                <circle cx="119" cy="112.5" r="4" fill="#FFFFFF" />
                <circle cx="125.5" cy="119.5" r="1.8" fill="#FFFFFF" opacity="0.9" />
                <circle cx="120" cy="120" r="1.2" fill="#FFFFFF" opacity="0.75" />
              </motion.g>

              {/* Kelopak Mata Berkedip Kiri */}
              <motion.rect
                x="96"
                y="90"
                width="52"
                animate={{ height: isBlinking ? 52 : 0 }}
                transition={{ duration: 0.08 }}
                fill={`url(#${g('head3d')})`}
                stroke="#EA580C"
                strokeWidth="1.5"
              />
            </g>

            {/* Pupil Mata Kanan (Interaktif & Bisa Mengintip) */}
            <g clipPath={`url(#${g('rightEyeClip')})`}>
              <motion.g animate={{ x: eyes.rx, y: eyes.ry }} transition={eyeSpring}>
                <circle cx="198" cy="116" r="13" fill={`url(#${g('iris3d')})`} />
                <circle cx="198" cy="116" r="8" fill="#090D16" />
                {/* Catchlight berkilau */}
                <circle cx="195" cy="112.5" r="4" fill="#FFFFFF" />
                <circle cx="201.5" cy="119.5" r="1.8" fill="#FFFFFF" opacity="0.9" />
                <circle cx="196" cy="120" r="1.2" fill="#FFFFFF" opacity="0.75" />
              </motion.g>

              {/* Kelopak Mata Berkedip Kanan */}
              <motion.rect
                x="172"
                y="90"
                width="52"
                animate={{ height: isBlinking && (!isHandsUp || isPeeking) ? 52 : 0 }}
                transition={{ duration: 0.08 }}
                fill={`url(#${g('head3d')})`}
                stroke="#EA580C"
                strokeWidth="1.5"
              />
            </g>

            {/* Bulu Mata Lentik */}
            <path
              d="M 102 104 C 96 98, 92 92, 90 84 M 106 98 C 102 90, 100 82, 100 76"
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 218 104 C 224 98, 228 92, 230 84 M 214 98 C 218 90, 220 82, 220 76"
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Alis Ekspresif */}
            <motion.path
              d="M 102 94 Q 120 86 138 94"
              stroke="#475569"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              animate={{ y: isHandsUp && !isPeeking ? 4 : 0 }}
            />
            <motion.path
              d="M 182 94 Q 200 86 218 94"
              stroke="#475569"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              animate={{ y: isPeeking ? -5 : isHandsUp ? 4 : 0, rotate: isPeeking ? -8 : 0 }}
            />

            {/* Paruh Tersenyum Ceria dengan Lidah */}
            <g id="owl-smiling-mouth">
              {/* Rongga Mulut Dalam */}
              <path d="M 148 124 C 148 124, 160 144, 172 124 C 168 138, 152 138, 148 124 Z" fill="#881337" />
              {/* Lidah Merah Muda */}
              <path d="M 154 132 C 156 138, 164 138, 166 132 C 164 134, 156 134, 154 132 Z" fill="#FB7185" />
              {/* Paruh Atas */}
              <path
                d="M 150 112 C 150 112, 160 116, 170 112 C 171 122, 167 134, 160 136 C 153 134, 149 122, 150 112 Z"
                fill={`url(#${g('beak3d')})`}
                stroke="#B45309"
                strokeWidth="1.2"
              />
              {/* Kilau Paruh */}
              <path d="M 154 115 Q 160 125, 160 130" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* Topi Baseball SDM */}
            <g id="cap-sdm-3d">
              {/* Kubah Topi */}
              <path
                d="M 112 88 C 110 46, 130 32, 160 32 C 190 32, 210 46, 208 88 Z"
                fill={`url(#${g('cap3d')})`}
                stroke="#334155"
                strokeWidth="1.6"
              />

              {/* Kancing Atas Topi (Squatchee) */}
              <ellipse cx="160" cy="32" rx="6.5" ry="3.5" fill="#334155" stroke="#1E293B" strokeWidth="1" />

              {/* Jahitan Panel Topi */}
              <path d="M 160 32 L 160 84" stroke="#64748B" strokeWidth="1.2" strokeDasharray="3,2" />
              <path d="M 160 32 Q 132 56, 122 88" stroke="#64748B" strokeWidth="1.2" strokeDasharray="3,2" />
              <path d="M 160 32 Q 188 56, 198 88" stroke="#64748B" strokeWidth="1.2" strokeDasharray="3,2" />

              {/* Tulisan Bordir Tebal "SDM" Oranye Cerah */}
              <text
                x="160"
                y="65"
                textAnchor="middle"
                fill="#F97316"
                fontWeight="900"
                fontSize="18"
                letterSpacing="1.2px"
                fontFamily="system-ui, -apple-system, sans-serif"
                stroke="#C2410C"
                strokeWidth="0.8"
                paintOrder="stroke"
              >
                SDM
              </text>

              {/* Visor / Lidah Topi 3D */}
              {/* Bayangan Bawah Visor */}
              <path d="M 104 84 C 124 102, 160 102, 216 84 C 204 92, 160 96, 116 91 Z" fill="#1E293B" />
              {/* Permukaan Atas Visor */}
              <path
                d="M 104 84 C 104 84, 124 102, 160 102 C 196 102, 216 84, 216 84 C 216 84, 198 96, 160 96 C 122 96, 104 84, 104 84 Z"
                fill={`url(#${g('visor3d')})`}
                stroke="#1E293B"
                strokeWidth="1.5"
              />
            </g>
          </motion.g>

          {/* ── Badan & Kaos Abu-Abu (Menempel Pas di Atas Rim Form) ── */}
          <g id="torso-compact">
            <path
              d="M 118 160 C 130 154, 146 150, 160 150 C 174 150, 190 154, 202 160 L 208 220 C 194 228, 176 230, 160 230 C 144 230, 126 228, 112 220 Z"
              fill={`url(#${g('shirt3d')})`}
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Kerah Kaos */}
            <path d="M 140 152 C 146 160, 174 160, 180 152 C 174 156, 146 156, 140 152 Z" fill="#334155" />
          </g>

          {/* ── SAYAP INTERAKTIF (Tutup Mata, Mengintip, Melambai 30s) ── */}

          {/* ── SAYAP KIRI ── */}
          <g id="left-wing-system">
            {/* 1. Sayap Kiri Menutup Mata Kiri (Active saat isHandsUp) */}
            <motion.g
              animate={{
                opacity: isHandsUp ? 1 : 0,
                scale: isHandsUp ? 1 : 0.85,
                y: isHandsUp ? 0 : 20,
              }}
              transition={spring}
              style={{ pointerEvents: 'none' }}
            >
              {/* Sayap Bulu Lebar Menutup Mata Kiri (122, 116) Secara Total */}
              <path
                d="M 112 185 C 98 165, 90 140, 94 112 C 96 92, 114 84, 132 86 C 150 88, 160 104, 156 122 C 152 144, 132 168, 124 188 Z"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.8"
                filter={`url(#${g('dropShadow')})`}
              />
              {/* Jari-Jari Bulu Penutup Mata */}
              <path
                d="M 108 96 Q 126 98 142 106 M 102 112 Q 124 115 142 122 M 106 128 Q 126 132 140 138"
                stroke="#FED7AA"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
              />
            </motion.g>

            {/* 2. Sayap Kiri Mode Santai (Active saat !isHandsUp) */}
            <motion.g
              animate={{
                opacity: !isHandsUp ? 1 : 0,
                scale: !isHandsUp ? 1 : 0.9,
                y: !isHandsUp ? 0 : -8,
              }}
              transition={spring}
            >
              <path
                d="M 114 175 C 88 185, 70 205, 65 228 C 62 238, 72 244, 82 238 C 78 248, 90 252, 100 244 C 98 252, 110 254, 118 246 C 126 226, 124 200, 118 175 Z"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.6"
              />
              <path
                d="M 94 200 Q 82 216, 80 224 M 102 208 Q 94 226, 92 234 M 110 216 Q 104 234, 104 240"
                stroke="#FED7AA"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.75"
              />
            </motion.g>
          </g>

          {/* ── SAYAP KANAN ── */}
          <g id="right-wing-system">
            {/* 1. Sayap Kanan Menutup Mata Kanan (Active saat isHandsUp && !isPeeking) */}
            <motion.g
              animate={{
                opacity: isHandsUp && !isPeeking ? 1 : 0,
                scale: isHandsUp && !isPeeking ? 1 : 0.85,
                y: isHandsUp && !isPeeking ? 0 : 20,
              }}
              transition={spring}
              style={{ pointerEvents: 'none' }}
            >
              {/* Sayap Bulu Lebar Menutup Mata Kanan (198, 116) Secara Total */}
              <path
                d="M 208 185 C 222 165, 230 140, 226 112 C 224 92, 206 84, 188 86 C 170 88, 160 104, 164 122 C 168 144, 188 168, 196 188 Z"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.8"
                filter={`url(#${g('dropShadow')})`}
              />
              {/* Jari-Jari Bulu Penutup Mata */}
              <path
                d="M 212 96 Q 194 98 178 106 M 218 112 Q 196 115 178 122 M 214 128 Q 194 132 180 138"
                stroke="#FED7AA"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
              />
            </motion.g>

            {/* 2. Sayap Kanan Melambai 30 Detik Tanpa Aktivitas */}
            <motion.g
              animate={{
                opacity: isWaving ? 1 : 0,
                scale: isWaving ? 1 : 0.85,
              }}
              transition={spring}
              style={{ pointerEvents: 'none' }}
            >
              <g transform="translate(220, 165)">
                <motion.g
                  animate={{
                    rotate: isWaving ? [-16, 18, -16] : 0,
                    y: isWaving ? [0, -4, 0] : 0,
                  }}
                  transition={{
                    rotate: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
                    y: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
                  }}
                >
                  <g transform="translate(-220, -165)">
                    {/* Sayap Diangkat Tinggi ke Atas Melambai Memanggil User */}
                    <path
                      d="M 220 165 C 235 140, 250 110, 265 80 C 275 70, 288 75, 282 88 C 294 82, 302 92, 295 104 C 304 102, 306 114, 296 124 C 280 140, 250 160, 230 170 Z"
                      fill={`url(#${g('wing3d')})`}
                      stroke="#C2410C"
                      strokeWidth="1.8"
                      filter={`url(#${g('dropShadow')})`}
                    />
                    <path
                      d="M 254 100 Q 268 88 275 82 M 264 110 Q 278 98 286 94 M 272 120 Q 286 110 292 108"
                      stroke="#FED7AA"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </g>
                </motion.g>
              </g>
            </motion.g>

            {/* 3. Sayap Kanan Mode Santai / Mengintip (Mata Kanan Terbuka Lebar) */}
            <motion.g
              animate={{
                opacity: (!isHandsUp || isPeeking) && !isWaving ? 1 : 0,
                scale: (!isHandsUp || isPeeking) && !isWaving ? 1 : 0.9,
                y: (!isHandsUp || isPeeking) && !isWaving ? 0 : -8,
              }}
              transition={spring}
            >
              <path
                d="M 206 175 C 232 185, 250 205, 255 228 C 258 238, 248 244, 238 238 C 242 248, 230 252, 220 244 C 222 252, 210 254, 202 246 C 194 226, 196 200, 202 175 Z"
                fill={`url(#${g('wing3d')})`}
                stroke="#C2410C"
                strokeWidth="1.6"
              />
              <path
                d="M 226 200 Q 238 216, 240 224 M 218 208 Q 226 226, 228 234 M 210 216 Q 216 234, 216 240"
                stroke="#FED7AA"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.75"
              />
            </motion.g>
          </g>

          {/* Kaki Cakar Duduk Pas di Tepi Kartu Form */}
          <g id="feet-on-rim">
            {/* Kaki Kiri */}
            <path
              d="M 126 228 C 126 238, 130 244, 133 244 C 135 244, 137 238, 138 228 C 140 238, 144 244, 146 244 C 148 244, 149 238, 150 228"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Kaki Kanan */}
            <path
              d="M 170 228 C 170 238, 174 244, 176 244 C 178 244, 180 238, 181 228 C 183 238, 187 244, 189 244 C 191 244, 192 238, 193 228"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        </motion.g>
      </svg>
    </div>
  )
}

/* ==========================================================================
   Public Export
   ========================================================================== */
export const OwlMascot: React.FC<OwlMascotProps> = ({
  isChecking = false,
  numLook = 0,
  isHandsUp = false,
  isPeeking = false,
  isWaving,
  useRiveFile = false,
  className = '',
}) => {
  if (useRiveFile) {
    return (
      <RiveMascot
        isChecking={isChecking}
        numLook={numLook}
        isHandsUp={isHandsUp}
        isPeeking={isPeeking}
        className={className}
      />
    )
  }

  return (
    <Interactive3DOwl
      isChecking={isChecking}
      numLook={numLook}
      isHandsUp={isHandsUp}
      isPeeking={isPeeking}
      isWaving={isWaving}
      className={className}
    />
  )
}
