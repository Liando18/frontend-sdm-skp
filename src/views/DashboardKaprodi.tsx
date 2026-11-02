import React, { useRef, useState, useMemo, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  Users,
  Award,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FileCheck2,
  FileText,
  Search,
  Check,
  Calendar,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react'
import { UserSession, PengajuanSKP, Dosen, PenilaianKuesioner } from '../types'
import { getAvatarSrc } from '../utils/security'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'

interface DashboardKaprodiProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  penilaianList?: PenilaianKuesioner[]
  onNavigateToSKP?: () => void
  onNavigateToReview: () => void
  onNavigateToKuesioner?: () => void
  onNavigateToHasilKinerjaSelf?: () => void
  onNavigateToPanduan?: () => void
  onSelectSKP: (skp: PengajuanSKP) => void
}

export const DashboardKaprodi: React.FC<DashboardKaprodiProps> = ({
  user,
  skpList,
  dosenList,
  penilaianList = [],
  onNavigateToSKP,
  onNavigateToReview,
  onNavigateToKuesioner,
  onNavigateToHasilKinerjaSelf,
  onNavigateToPanduan,
  onSelectSKP,
}) => {
  const [searchDosen, setSearchDosen] = useState('')
  const [filterTab, setFilterTab] = useState<'semua' | 'menunggu' | 'disetujui' | 'revisi'>('semua')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Period Filter: Semester & Tahun Akademik
  const availableTahunList = useMemo(() => {
    const fromDb = Array.from(new Set(skpList.map((s) => s.tahunAkademik).filter(Boolean)))
    const standard = ['2026/2027', '2025/2026', '2024/2025']
    const merged = Array.from(new Set([...fromDb, ...standard]))
    return merged.sort().reverse()
  }, [skpList])

  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Genap' | 'Ganjil'>('Semua')
  const [selectedTahun, setSelectedTahun] = useState<string>(availableTahunList[0] || '2025/2026')
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  // Identifikasi ranah wilayah Ka.Prodi (PSDKU vs Pusat)
  const isKaprodiPsdku = Boolean(
    user.tipeLokasi === 'PSDKU' ||
      user.psdkuId ||
      (user as any).psdku_id ||
      (user.kampus && user.kampus.toLowerCase().includes('psdku'))
  )
  const userPsdkuId = user.psdkuId || (user as any).psdku_id
  const userKampusName = (user.kampus || '').toLowerCase()
  const userFakultasId = user.fakultasId || (user as any).fakultas_id
  const userFakultasName = (user.fakultas || '').toLowerCase()

  // Dosen homebase prodi yang dibimbing (mengecualikan Ka.Prodi itu sendiri)
  const prodiDosen = useMemo(() => {
    return dosenList.filter((d) => {
      // 1. Wajib sama prodi
      const matchProdi =
        (user.programStudiId &&
          (d.programStudiId === user.programStudiId || (d as any).program_studi_id === user.programStudiId)) ||
        d.prodi === user.prodi
      if (!matchProdi) return false

      // 2. Dilarang menilai diri sendiri
      const isSelf =
        d.id === user.id ||
        (user.nip && d.nip === user.nip) ||
        (user.name && d.nama.trim().toLowerCase() === user.name.trim().toLowerCase())
      if (isSelf) return false

      // 3. Ka.Prodi lain tidak dinilai oleh Ka.Prodi (dinilai oleh Dekan/Kacap)
      if (
        d.isKaprodi ||
        d.jabatanStruktural === 'Ketua Program Studi' ||
        d.jabatan_struktural === 'Ketua Program Studi'
      ) {
        return false
      }

      // 4. Strict Territorial Isolation
      if (isKaprodiPsdku) {
        const isDosenPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
            d.tipe_lokasi === 'PSDKU' ||
            d.psdkuId ||
            (d as any).psdku_id ||
            (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        if (!isDosenPsdku) return false

        const matchPsdkuId = userPsdkuId && (d.psdkuId === userPsdkuId || (d as any).psdku_id === userPsdkuId)
        const matchKampus = userKampusName && (d.kampus || '').toLowerCase().includes(userKampusName)
        if (userPsdkuId || userKampusName) {
          return Boolean(matchPsdkuId || matchKampus)
        }
        return true
      } else {
        const isDosenPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
            d.tipe_lokasi === 'PSDKU' ||
            d.psdkuId ||
            (d as any).psdku_id ||
            (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        if (isDosenPsdku) return false

        if (userFakultasId && (d.fakultasId || (d as any).fakultas_id)) {
          return d.fakultasId === userFakultasId || (d as any).fakultas_id === userFakultasId
        }
        if (userFakultasName && d.fakultas) {
          return (d.fakultas || '').toLowerCase().includes(userFakultasName)
        }
        return true
      }
    })
  }, [dosenList, user, isKaprodiPsdku, userPsdkuId, userKampusName, userFakultasId, userFakultasName])

  const totalProdiDosen = prodiDosen.length
  const prodiDosenIds = useMemo(() => new Set(prodiDosen.map((d) => d.id)), [prodiDosen])
  const prodiDosenNips = useMemo(() => new Set(prodiDosen.map((d) => d.nip).filter(Boolean)), [prodiDosen])
  const prodiDosenNames = useMemo(
    () => new Set(prodiDosen.map((d) => (d.nama || '').trim().toLowerCase())),
    [prodiDosen]
  )

  const prodiSKP = useMemo(() => {
    return skpList.filter((s) => {
      const isSelf =
        (user.id && s.dosenId === user.id) ||
        (user.nip && s.dosenNip === user.nip) ||
        (user.name && (s.dosenNama || '').trim().toLowerCase() === user.name.trim().toLowerCase())
      if (isSelf) return false

      const isProdiDosen =
        (s.dosenId && prodiDosenIds.has(s.dosenId)) ||
        (s.dosenNip && prodiDosenNips.has(s.dosenNip)) ||
        (s.dosenNama && prodiDosenNames.has((s.dosenNama || '').trim().toLowerCase()))

      if (!isProdiDosen) return false

      const matchSemester = selectedSemester === 'Semua' || s.semester === selectedSemester
      const matchTahun = selectedTahun === 'Semua' || s.tahunAkademik === selectedTahun

      return matchSemester && matchTahun
    })
  }, [skpList, user, prodiDosenIds, prodiDosenNips, prodiDosenNames, selectedSemester, selectedTahun])

  const pendingReview = prodiSKP.filter((s) => s.status === 'Diajukan').length
  const approvedReview = prodiSKP.filter((s) =>
    ['Disahkan', 'Terbit', 'Dinilai Kaprodi', 'Dinilai Dekan', 'Disetujui SDM'].includes(s.status)
  ).length
  const revisiReview = prodiSKP.filter((s) => s.status === 'Perlu Revisi').length

  const prodiPenilaianCount = useMemo(() => {
    return penilaianList.filter((p) => prodiDosenIds.has(p.dosenId)).length
  }, [penilaianList, prodiDosenIds])
  const kuisPersen = totalProdiDosen > 0 ? ((prodiPenilaianCount / totalProdiDosen) * 100).toFixed(1) : '0'

  // Workload SPMI stats among prodi lecturers strictly from filtered prodiSKP
  const workloadStats = useMemo(() => {
    let ideal = 0
    let under = 0
    let over = 0
    let totalSks = 0
    let countWithData = 0

    prodiDosen.forEach((d) => {
      const skp = prodiSKP.find((s) => s.dosenId === d.id)
      if (skp && typeof skp.totalSksRealisasi === 'number' && skp.totalSksRealisasi > 0) {
        totalSks += skp.totalSksRealisasi
        countWithData++
        if (skp.totalSksRealisasi < 12) under++
        else if (skp.totalSksRealisasi <= 16) ideal++
        else over++
      }
    })

    const avg = countWithData > 0 ? (totalSks / countWithData).toFixed(1) : '0.0'
    return { ideal, under, over, avg, countWithData }
  }, [prodiDosen, prodiSKP])

  // Filter & Search table
  const filteredProdiDosen = useMemo(() => {
    return prodiDosen.filter((d) => {
      const q = (searchDosen || '').toLowerCase().trim()
      const matchSearch =
        q === '' ||
        (d.nama || '').toLowerCase().includes(q) ||
        (d.nuptk || '').includes(q) ||
        (d.nip || '').includes(q) ||
        (d.jafung || '').toLowerCase().includes(q)

      const skp = prodiSKP.find((s) => s.dosenId === d.id)
      const st = skp?.status || 'Belum Mengajukan'

      const isMenunggu = st === 'Diajukan'
      const isDisetujui = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(st)
      const isRevisi = st === 'Perlu Revisi'

      let matchTab = true
      if (filterTab === 'menunggu') matchTab = isMenunggu
      else if (filterTab === 'disetujui') matchTab = isDisetujui
      else if (filterTab === 'revisi') matchTab = isRevisi

      return matchSearch && matchTab
    })
  }, [prodiDosen, searchDosen, filterTab, prodiSKP])

  const paginatedDosen = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProdiDosen.slice(start, start + pageSize)
  }, [filteredProdiDosen, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showQuickMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showQuickMenu])
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up', [totalProdiDosen, pendingReview, approvedReview, prodiPenilaianCount])
  useInteractiveCards(containerRef, '.kpi-card')
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [], { y: 8, stagger: 0.04, delay: 0.15 })

  // Helper avatar initials
  const getInitials = (name: string) => {
    const parts = name.replace(/(Dr\.|Prof\.|M\.[A-Za-z]+|S\.[A-Za-z]+|Ners|\,)/g, '').trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="page-container" ref={containerRef}>
      {/* Kaprodi Leadership Banner (Spacious, Balanced & Clean) */}
      <div
        className="dashboard-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '20px 24px',
        }}
      >
        {/* Profil & Wewenang Kaprodi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--r-full)',
              overflow: 'hidden',
              background: '#f1f5f9',
              border: '2.5px solid var(--hair-strong)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <img
              src={getAvatarSrc(user.avatar)}
              alt={user.name}
              onError={(e) => {
                const target = e.currentTarget
                if (!target.src.endsWith('/user.svg')) {
                  target.src = '/user.svg'
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-700)',
                  background: 'var(--brand-100)',
                  padding: '2px 8px',
                  borderRadius: 'var(--r-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Ketua Program Studi
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--navy-900)',
                  background: 'var(--navy-100)',
                  padding: '2px 8px',
                  borderRadius: 'var(--r-xs)',
                }}
              >
                {isKaprodiPsdku ? `PSDKU ${user.kampus || 'Wilayah'}` : 'Kampus Bandung'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: 'var(--r-xs)',
                }}
              >
                Homebase {user.prodi || '-'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(20px, 2.2vw, 24px)',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                margin: '0 0 3px 0',
                lineHeight: 1.25,
              }}
            >
              Dashboard Program Studi {user.prodi}
            </h1>

            <div style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', lineHeight: 1.4 }}>
              <span>{user.name}</span>
              <span style={{ color: 'var(--hair-strong)' }}>&bull;</span>
              <span>NIP: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{user.nip || '-'}</strong></span>
              <span style={{ color: 'var(--hair-strong)' }}>&bull;</span>
              <span>Total Bimbingan: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{totalProdiDosen} Dosen</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls: Compact Menu Cepat + Primary CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Menu Pintas Dropdown */}
          <div ref={quickMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickMenu((prev) => !prev)}
              className="brand-btn brand-btn--outline"
              style={{
                padding: '9px 14px',
                background: '#ffffff',
                borderRadius: 'var(--r-md)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              aria-expanded={showQuickMenu}
              aria-label="Menu Akses Cepat"
            >
              <FileText size={14} />
              <span>Menu Cepat</span>
              <ChevronDown size={14} style={{ transform: showQuickMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {showQuickMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 200,
                  background: '#ffffff',
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--hair)',
                  padding: '6px',
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {onNavigateToSKP && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false)
                      onNavigateToSKP()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={14} style={{ color: 'var(--brand-600)' }} />
                    <span>SKP Saya</span>
                  </button>
                )}
                {onNavigateToHasilKinerjaSelf && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false)
                      onNavigateToHasilKinerjaSelf()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Award size={14} style={{ color: '#2563eb' }} />
                    <span>Hasil Kinerja</span>
                  </button>
                )}
                {onNavigateToKuesioner && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false)
                      onNavigateToKuesioner()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Award size={14} style={{ color: '#7c3aed' }} />
                    <span>Kuesioner Perilaku</span>
                  </button>
                )}
                {onNavigateToPanduan && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false)
                      onNavigateToPanduan()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <BookOpen size={14} style={{ color: '#059669' }} />
                    <span>Panduan Kaprodi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onNavigateToReview}
            className="brand-btn"
            style={{
              padding: '9.5px 18px',
              borderRadius: 'var(--r-md)',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileCheck2 size={15} />
            <span>Verifikasi SKP Dosen ({pendingReview})</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid (4 Cards - Responsive & Compact) */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Hero Deep Navy - Total Dosen Homebase */}
        <div className="kpi-card kpi-card--hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              Dosen Homebase Prodi
            </span>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(255,255,255,0.12)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
              }}
            >
              <Users size={13} />
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={totalProdiDosen}
              >
                {totalProdiDosen}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Dosen Aktif</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="kpi-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                <Building2 size={11} />
                <span>Homebase {user.prodi || '-'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Menunggu Review Kaprodi */}
        <div
          className="kpi-card"
          onClick={onNavigateToReview}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Menunggu Review
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={(e) => {
                e.stopPropagation()
                onNavigateToReview()
              }}
              aria-label="Buka review SKP"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={pendingReview}
                style={{ color: pendingReview > 0 ? 'var(--brand-700)' : 'var(--ink)' }}
              >
                {pendingReview}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className={`badge-pill ${pendingReview > 0 ? 'badge-pill--orange' : 'badge-pill--green'}`}>
                <Clock size={11} />
                <span>{pendingReview > 0 ? 'Siap Diverifikasi' : 'Tuntas Dinilai'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Telah Diverifikasi & Disetujui */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Disetujui Prodi
            </span>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 'var(--r-sm)',
                background: 'var(--status-success-bg)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--status-success-ink)',
              }}
            >
              <CheckCircle2 size={13} />
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={approvedReview}
                style={{ color: 'var(--ink)' }}
              >
                {approvedReview}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / {totalProdiDosen} Dosen
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="badge-pill badge-pill--green">
                <CheckCircle size={11} />
                <span>
                  {totalProdiDosen > 0 ? ((approvedReview / totalProdiDosen) * 100).toFixed(0) : 0}% Lolos Verifikasi
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Kuesioner Evaluasi BerAKHLAK */}
        <div
          className="kpi-card"
          onClick={onNavigateToKuesioner}
          style={{ cursor: onNavigateToKuesioner ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Kuesioner BerAKHLAK
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={(e) => {
                e.stopPropagation()
                if (onNavigateToKuesioner) onNavigateToKuesioner()
              }}
              aria-label="Isi kuesioner perilaku"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                className="kpi-stat-number"
                style={{ color: 'var(--ink)' }}
              >
                {prodiPenilaianCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / {totalProdiDosen} Dosen
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="badge-pill badge-pill--blue">
                <Award size={11} />
                <span>{kuisPersen}% Partisipasi</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prodi Monitoring & Distribution Summary Bar with Integrated Period Filter */}
      <div
        className="dashboard-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
              Pemantauan Beban Kerja Dosen (SPMI Tridharma)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 1 }}>
              Distribusi beban SKS dosen prodi sesuai standar mutu perguruan tinggi (12 - 16 SKS)
            </div>
          </div>

          {/* Period Filter for Kaprodi */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1px solid var(--hair-strong)',
              borderRadius: 'var(--r-md)',
              padding: '3px 10px',
            }}
          >
            <Filter size={12} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Periode:</span>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                cursor: 'pointer',
                padding: '2px',
              }}
              aria-label="Pilih Semester"
            >
              <option value="Semua">Semua Semester</option>
              <option value="Genap">Semester Genap</option>
              <option value="Ganjil">Semester Ganjil</option>
            </select>

            <span style={{ color: 'var(--hair-strong)' }}>|</span>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                cursor: 'pointer',
                padding: '2px',
              }}
              aria-label="Pilih Tahun Akademik"
            >
              <option value="Semua">Semua Tahun</option>
              {availableTahunList.map((th) => (
                <option key={th} value={th}>
                  {th}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--hair-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-md)',
                background: 'var(--brand-100)',
                color: 'var(--brand-700)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rata-rata Beban
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                {workloadStats.avg} SKS / Dosen
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--hair-subtle)', paddingLeft: 12 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Standar SPMI (12 - 16 SKS)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
              {workloadStats.ideal} Dosen
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--faint)' }}>Beban Tridharma ideal</div>
          </div>

          <div style={{ borderLeft: '1px solid var(--hair-subtle)', paddingLeft: 12 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Beban Kurang (&lt; 12 SKS)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: workloadStats.under > 0 ? '#b91c1c' : 'var(--ink)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
              {workloadStats.under} Dosen
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--faint)' }}>Perlu pembinaan prodi</div>
          </div>

          <div style={{ borderLeft: '1px solid var(--hair-subtle)', paddingLeft: 12 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Beban Lebih (&gt; 16 SKS)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
              {workloadStats.over} Dosen
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--faint)' }}>Penugasan tambahan</div>
          </div>
        </div>
      </div>

      {/* Action Hub / Daftar Dosen Homebase Table */}
      <div
        className="dashboard-panel"
        style={{
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Table Header & Controls */}
        <div
          style={{
            padding: '14px 18px 12px',
            borderBottom: '1px solid var(--hair-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                Daftar Dosen Homebase {user.prodi}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>
                Verifikasi Sasaran Kinerja Pegawai (SKP) dan kuesioner perilaku kerja dosen
              </div>
            </div>

            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--navy-800)',
                background: 'var(--navy-100)',
                padding: '3px 10px',
                borderRadius: 'var(--r-full)',
              }}
            >
              {filteredProdiDosen.length} Dosen Terdaftar
            </span>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: 'var(--r-md)',
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'semua', label: 'Semua Dosen' },
                { id: 'menunggu', label: 'Menunggu Review', badge: pendingReview },
                { id: 'disetujui', label: 'Disetujui Prodi', badge: approvedReview },
                { id: 'revisi', label: 'Perlu Revisi', badge: revisiReview },
              ].map((tab) => {
                const isActive = filterTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilterTab(tab.id as any)
                      setPage(1)
                    }}
                    style={{
                      border: 'none',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? 'var(--ink)' : 'var(--muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '11.5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--r-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        style={{
                          background: isActive ? 'var(--brand-600)' : 'rgba(100, 116, 139, 0.2)',
                          color: isActive ? '#ffffff' : 'var(--muted)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 'var(--r-full)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  border: '1px solid var(--hair-strong)',
                  borderRadius: 'var(--r-md)',
                  padding: '5px 10px',
                  minWidth: 200,
                }}
              >
                <Search size={13} style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={searchDosen}
                  onChange={(e) => {
                    setSearchDosen(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari dosen, NIP, NUPTK..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--ink)',
                    width: '100%',
                  }}
                />
              </div>

              <button
                onClick={onNavigateToReview}
                className="btn-back"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <span>Panel Verifikasi</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Lecturers Table */}
        <div className="table-container">
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Nama Dosen</th>
                <th>Jabatan Fungsional</th>
                <th>Target SKS</th>
                <th>Realisasi SKS</th>
                <th>Status SKP</th>
                <th>Kuesioner Ka.Prodi</th>
                <th style={{ textAlign: 'right' }}>Aksi Review</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDosen.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={28} style={{ color: 'var(--faint)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                        Tidak Ada Dosen yang Sesuai dengan Kriteria
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                        Silakan ubah kata kunci pencarian atau pilih tab status lain di atas.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDosen.map((dosen) => {
                  const skp = skpList.find((s) => s.dosenId === dosen.id)
                  const st = skp?.status || dosen.skpStatus || 'Draft'

                  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(st)
                  const isSubmitted = st === 'Diajukan'
                  const isRevisi = st === 'Perlu Revisi'

                  const realisasi = skp?.totalSksRealisasi || 0
                  const isSpmiMet = realisasi >= 12 && realisasi <= 16
                  const isSpmiUnder = realisasi > 0 && realisasi < 12
                  const isSpmiOver = realisasi > 16

                  // Check if this lecturer has been evaluated by this Kaprodi
                  const isEvaluated = penilaianList.some(
                    (p) => p.dosenId === dosen.id && (p.penilaiRole === 'Kaprodi' || p.penilaiNama === user.name)
                  )

                  return (
                    <tr key={dosen.id}>
                      {/* Nama Dosen with Initials */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 'var(--r-md)',
                              background: 'var(--brand-100)',
                              color: 'var(--brand-700)',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(dosen.nama)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{dosen.nama}</div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--muted)',
                                marginTop: 1,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              NIP: {dosen.nip || '-'} &bull; NUPTK: {dosen.nuptk || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* JAD */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>{dosen.jafung}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>Golongan: {dosen.golongan || '-'}</div>
                      </td>

                      {/* Target SKS */}
                      <td style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {skp && typeof skp.totalSksRencana === 'number' && skp.totalSksRencana > 0 ? `${skp.totalSksRencana} SKS` : '-'}
                      </td>

                      {/* Realisasi SKS with SPMI Pill */}
                      <td>
                        {skp && typeof skp.totalSksRealisasi === 'number' && skp.totalSksRealisasi > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '13.5px',
                                color: isSpmiMet ? 'var(--status-success-ink)' : isSpmiUnder ? 'var(--status-danger-ink)' : 'var(--brand-700)',
                              }}
                            >
                              {realisasi} SKS
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 'var(--r-xs)',
                                background: isSpmiMet ? 'var(--status-success-bg)' : isSpmiUnder ? 'var(--status-danger-bg)' : 'var(--brand-100)',
                                color: isSpmiMet ? 'var(--status-success-ink)' : isSpmiUnder ? 'var(--status-danger-ink)' : 'var(--brand-700)',
                              }}
                            >
                              {isSpmiMet ? 'Standar' : isSpmiUnder ? '< 12 SKS' : '> 16 SKS'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--faint)', fontSize: '12.5px' }}>-</span>
                        )}
                      </td>

                      {/* Status SKP */}
                      <td>
                        {isSah ? (
                          <span className="badge-pill badge-pill--green">
                            <CheckCircle2 size={12} />
                            <span>Sah &amp; Terbit</span>
                          </span>
                        ) : isSubmitted ? (
                          <span className="badge-pill badge-pill--orange">
                            <Clock size={12} />
                            <span>Menunggu Review</span>
                          </span>
                        ) : isRevisi ? (
                          <span className="badge-pill badge-pill--red">
                            <AlertCircle size={12} />
                            <span>Perlu Revisi</span>
                          </span>
                        ) : skp ? (
                          <span className="badge-pill badge-pill--gray">
                            <span>{st}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--faint)', fontSize: '12px' }}>-</span>
                        )}
                      </td>

                      {/* Status Kuesioner Ka.Prodi */}
                      <td>
                        {isEvaluated ? (
                          <span className="badge-pill badge-pill--green">
                            <Check size={12} />
                            <span>Sudah Dinilai</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--faint)', fontSize: '12px' }}>-</span>
                        )}
                      </td>

                      {/* Aksi Review */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={isSubmitted ? 'brand-btn' : 'btn-action-view'}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            borderRadius: 'var(--r-sm)',
                          }}
                          onClick={() => {
                            if (skp) onSelectSKP(skp)
                            else onNavigateToReview()
                          }}
                        >
                          <FileCheck2 size={13} />
                          <span>{isSubmitted ? 'Verifikasi' : 'Buka SKP'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <TablePagination
          totalItems={filteredProdiDosen.length}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </div>
  )
}
