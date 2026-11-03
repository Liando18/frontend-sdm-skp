import React, { useRef, useState, useMemo, useEffect } from 'react'
import {
  Users,
  FileCheck2,
  Award,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  BookOpen,
  ChevronDown,
  Filter,
  ExternalLink,
  Send,
  Check,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  X,
  Eye,
} from 'lucide-react'
import { UserSession, PengajuanSKP, Dosen, ProgramStudi, Fakultas, Psdku } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'
import { getAvatarSrc } from '../utils/security'
import {
  getDynamicAcademicYearList,
  getDefaultAcademicYear,
  getDeviceCurrentSemester,
} from '../constants/academic'

interface DashboardDekanProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  prodiList?: ProgramStudi[]
  fakultasList?: Fakultas[]
  psdkuList?: Psdku[]
  onNavigateToSKP?: () => void
  onNavigateToReview: () => void
  onNavigateToEvaluasiKaprodi?: () => void
  onNavigateToHasilKinerjaSelf?: () => void
  onNavigateToPanduan?: () => void
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export const DashboardDekan: React.FC<DashboardDekanProps> = ({
  user,
  skpList,
  dosenList,
  prodiList = [],
  fakultasList = [],
  psdkuList = [],
  onNavigateToSKP,
  onNavigateToReview,
  onNavigateToEvaluasiKaprodi,
  onNavigateToHasilKinerjaSelf,
  onNavigateToPanduan,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  // Filter Periode Dinamis
  const [selectedSemester, setSelectedSemester] = useState<'Genap' | 'Ganjil' | 'Semua'>(() => {
    return getDeviceCurrentSemester()
  })
  const [selectedTahun, setSelectedTahun] = useState<string>(() => {
    return getDefaultAcademicYear()
  })
  const [statusTab, setStatusTab] = useState<'semua' | 'menunggu' | 'disahkan' | 'belum'>('semua')
  const [searchKaprodi, setSearchKaprodi] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

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

  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 12, stagger: 0.05 })
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [], { y: 8, stagger: 0.03, delay: 0.1 })

  // 1. Identifikasi Dekan Fakultas (Pusat) vs Kepala Cabang (KeCab PSDKU)
  const isKacap = Boolean(
    user.tipeLokasi === 'PSDKU' ||
    user.psdkuId ||
    (user as any).psdku_id ||
    user.jabatanStruktural?.toLowerCase().includes('cabang') ||
    user.jabatanStruktural?.toLowerCase().includes('kecab') ||
    user.jabatanKampusId === 'jab-kecab'
  )

  const userPsdkuId = user.psdkuId || (user as any).psdku_id
  const currentPsdku = psdkuList.find((p) => p.id === userPsdkuId)
  const userKampusName = (user.kampus || currentPsdku?.nama || '').toLowerCase()

  const dekanFakultasId = user.fakultasId || (user as any).fakultas_id
  const dekanFakultasName = (user.fakultas || '').toLowerCase()

  const roleLabel = isKacap ? 'Kepala Cabang' : 'Dekan'
  const territoryLabel = isKacap
    ? (user.kampus || currentPsdku?.nama || 'PSDKU')
    : (user.fakultas || 'Fakultas')

  // 2. Filter ID Program Studi yang sah di bawah ranah wewenang pimpinan
  const psdkuProdiIds = useMemo(() => {
    const ids = new Set<string>()
    if (isKacap && prodiList && prodiList.length > 0) {
      prodiList.forEach((p) => {
        const isPsdkuUnit = p.tipe_unit === 'PSDKU' || p.tipeUnit === 'PSDKU' || Boolean(p.psdku_id || p.psdkuId)
        if (!isPsdkuUnit) return

        const matchPsdkuId = userPsdkuId && (p.psdku_id === userPsdkuId || p.psdkuId === userPsdkuId)
        const matchKampus = userKampusName && (p.kampus || '').toLowerCase().includes(userKampusName)
        if (matchPsdkuId || matchKampus || (!userPsdkuId && !userKampusName)) {
          ids.add(p.id)
        }
      })
    }
    return ids
  }, [isKacap, prodiList, userPsdkuId, userKampusName])

  const fakultasProdiIds = useMemo(() => {
    const ids = new Set<string>()
    if (!isKacap && prodiList && prodiList.length > 0) {
      prodiList.forEach((p) => {
        const isPsdkuUnit = p.tipe_unit === 'PSDKU' || p.tipeUnit === 'PSDKU' || Boolean(p.psdku_id || p.psdkuId)
        if (isPsdkuUnit) return

        const matchFakId = dekanFakultasId && (p.fakultas_id === dekanFakultasId || p.fakultasId === dekanFakultasId)
        const matchFakName = dekanFakultasName && (p.fakultas || '').toLowerCase().includes(dekanFakultasName)
        if (matchFakId || matchFakName) {
          ids.add(p.id)
        }
      })
    }
    return ids
  }, [isKacap, prodiList, dekanFakultasId, dekanFakultasName])

  // 3. Filter daftar Ka.Prodi di bawah naungan Dekan/KaCap
  const kaprodiList = useMemo(() => {
    return dosenList.filter((d) => {
      if (d.id === user.id) return false
      if (user.nip && user.nip !== '-' && d.nip === user.nip) return false

      const isActualKaprodi = Boolean(
        d.isKaprodi ||
        d.jabatanKampusId === 'jab-kaprodi' ||
        d.jabatanStruktural === 'Ketua Program Studi' ||
        d.jabatan_struktural === 'Ketua Program Studi' ||
        d.jabatanStruktural?.toLowerCase().includes('kaprodi') ||
        d.jabatan_struktural?.toLowerCase().includes('kaprodi')
      )
      if (!isActualKaprodi) return false

      if (isKacap) {
        const isDosenPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
          d.tipe_lokasi === 'PSDKU' ||
          d.psdkuId ||
          d.psdku_id ||
          (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        if (!isDosenPsdku) return false

        const matchPsdkuId = userPsdkuId && (d.psdkuId === userPsdkuId || d.psdku_id === userPsdkuId)
        const matchKampus = userKampusName && (d.kampus || '').toLowerCase().includes(userKampusName)
        const matchProdiId =
          (d.programStudiId && psdkuProdiIds.has(d.programStudiId)) ||
          (d.program_studi_id && psdkuProdiIds.has(d.program_studi_id))

        return Boolean(matchPsdkuId || matchKampus || matchProdiId)
      } else {
        const isDosenPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
          d.tipe_lokasi === 'PSDKU' ||
          d.psdkuId ||
          d.psdku_id ||
          (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        if (isDosenPsdku) return false

        const matchFakId = dekanFakultasId && (d.fakultasId === dekanFakultasId || d.fakultas_id === dekanFakultasId)
        const matchFakName = dekanFakultasName && (d.fakultas || '').toLowerCase().includes(dekanFakultasName)
        const matchProdiId =
          (d.programStudiId && fakultasProdiIds.has(d.programStudiId)) ||
          (d.program_studi_id && fakultasProdiIds.has(d.program_studi_id))

        return Boolean(matchFakId || matchFakName || matchProdiId)
      }
    })
  }, [dosenList, user.id, user.nip, isKacap, userPsdkuId, userKampusName, psdkuProdiIds, dekanFakultasId, dekanFakultasName, fakultasProdiIds])

  // Opsi Tahun Akademik Dinamis
  const availableTahunList = useMemo(() => {
    return getDynamicAcademicYearList(skpList.map((s) => s.tahunAkademik))
  }, [skpList])

  // 4. Hubungkan seluruh Kaprodi dengan berkas SKP mereka pada periode terpilih (Anti-Empty Table)
  const kaprodiRoster = useMemo(() => {
    return kaprodiList.map((kaprodi) => {
      // Cari SKP aktif Kaprodi yang cocok dengan periode yang dipilih
      const matchingSkp = skpList.find((s) => {
        if (s.dosenId === user.id) return false
        if (user.nuptk && user.nuptk !== '-' && s.dosenNuptk === user.nuptk) return false
        if (user.nip && user.nip !== '-' && s.dosenNip === user.nip) return false

        const matchDosen =
          (s.dosenId && s.dosenId === kaprodi.id) ||
          (s.dosenNuptk && kaprodi.nuptk && s.dosenNuptk.trim() === kaprodi.nuptk.trim()) ||
          (s.dosenNip && kaprodi.nip && s.dosenNip.trim() === kaprodi.nip.trim()) ||
          ((s.dosenNama || '').trim().toLowerCase() === (kaprodi.nama || '').trim().toLowerCase())

        if (!matchDosen) return false

        const matchSem = selectedSemester === 'Semua' || s.semester === selectedSemester
        const matchThn = selectedTahun === 'Semua' || s.tahunAkademik === selectedTahun
        return matchSem && matchThn
      })

      const isSah = Boolean(
        matchingSkp &&
        ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan'].includes(matchingSkp.status) &&
        matchingSkp.ttdDekanUrl
      )
      const isNeedsReview = Boolean(
        matchingSkp &&
        !isSah &&
        (matchingSkp.status === 'Diajukan' || matchingSkp.status === 'Dinilai Kaprodi' || !matchingSkp.ttdDekanUrl)
      )
      const isRevisi = matchingSkp?.status === 'Perlu Revisi'
      const isUnsubmitted = !matchingSkp || (matchingSkp as any).status === 'Draft'

      return {
        kaprodi,
        skp: matchingSkp || null,
        hasSkp: Boolean(matchingSkp),
        isSah,
        isNeedsReview,
        isRevisi,
        isUnsubmitted,
        displayStatus: isSah
          ? 'Sah & Terbit'
          : isRevisi
          ? 'Perlu Revisi'
          : isNeedsReview
          ? 'Menunggu Review'
          : 'Belum Mengajukan',
      }
    })
  }, [kaprodiList, skpList, selectedSemester, selectedTahun, user])

  // Metriks KPI
  const pendingReviewCount = useMemo(() => {
    return kaprodiRoster.filter((r) => r.isNeedsReview).length
  }, [kaprodiRoster])

  const approvedCount = useMemo(() => {
    return kaprodiRoster.filter((r) => r.isSah).length
  }, [kaprodiRoster])

  const submittedCount = useMemo(() => {
    return kaprodiRoster.filter((r) => r.hasSkp && !r.isUnsubmitted).length
  }, [kaprodiRoster])

  const unsubmittedCount = useMemo(() => {
    return kaprodiRoster.filter((r) => r.isUnsubmitted).length
  }, [kaprodiRoster])

  const compliancePercentage = useMemo(() => {
    if (kaprodiList.length === 0) return 0
    return Math.round((submittedCount / kaprodiList.length) * 100)
  }, [submittedCount, kaprodiList.length])

  // Filter Roster berdasarkan Tab & Pencarian
  const filteredRoster = useMemo(() => {
    return kaprodiRoster.filter((item) => {
      if (statusTab === 'menunggu' && !item.isNeedsReview) return false
      if (statusTab === 'disahkan' && !item.isSah) return false
      if (statusTab === 'belum' && !item.isUnsubmitted) return false

      const q = (searchKaprodi || '').trim().toLowerCase()
      if (!q) return true
      const k = item.kaprodi
      const s = item.skp
      return (
        (k.nama || '').toLowerCase().includes(q) ||
        (k.nuptk && k.nuptk.toLowerCase().includes(q)) ||
        (k.nip && k.nip !== '-' && k.nip.toLowerCase().includes(q)) ||
        (k.prodi || '').toLowerCase().includes(q) ||
        (s?.dosenNama && s.dosenNama.toLowerCase().includes(q)) ||
        (s?.dosenProdi && s.dosenProdi.toLowerCase().includes(q))
      )
    })
  }, [kaprodiRoster, statusTab, searchKaprodi])

  const paginatedRoster = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRoster.slice(start, start + pageSize)
  }, [filteredRoster, page, pageSize])

  const handleSendReminder = (kaprodiNama: string) => {
    if (onShowToast) {
      onShowToast(`Notifikasi pengingat pengisian SKP berhasil dikirimkan ke ${kaprodiNama}.`, 'success')
    }
  }

  // Tahapan Alur Kerja Dekan
  const workflowSteps = [
    {
      step: 1,
      title: 'Pemeriksaan Beban SKS',
      desc: 'Standar BKD 12 - 16 SKS Tridharma',
      status: kaprodiRoster.some((r) => (r.skp?.totalSksRealisasi ?? 0) >= 12) ? 'completed' : 'active',
    },
    {
      step: 2,
      title: 'Validasi Berkas Bukti',
      desc: 'Pemeriksaan portofolio di Google Drive',
      status: submittedCount > 0 ? (pendingReviewCount === 0 ? 'completed' : 'active') : 'pending',
    },
    {
      step: 3,
      title: 'Evaluasi BerAKHLAK 360',
      desc: 'Penilaian perilaku kepemimpinan prodi',
      status: approvedCount > 0 ? 'completed' : submittedCount > 0 ? 'active' : 'pending',
    },
    {
      step: 4,
      title: 'Pengesahan TTD Digital',
      desc: 'Penerbitan SKP & transkrip resmi',
      status: approvedCount === kaprodiList.length && kaprodiList.length > 0 ? 'completed' : approvedCount > 0 ? 'active' : 'pending',
    },
  ]

  return (
    <div className="page-container" ref={containerRef}>
      {/* 1. Header Banner Eksekutif Dekanat (Prestisius & Ergonomis) */}
      <div
        className="dashboard-banner"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0f223d 55%, #173359 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(10, 22, 40, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 280 }}>
          <img
            src={getAvatarSrc(user.avatar)}
            alt={user.name}
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              border: '2.5px solid rgba(255, 255, 255, 0.28)',
              objectFit: 'cover',
              background: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fdba74',
                  letterSpacing: '0.02em',
                }}
              >
                <Building2 size={13} />
                <span>{isKacap ? `Portal Pimpinan Cabang \u2022 ${territoryLabel}` : `Portal Pimpinan Fakultas \u2022 ${territoryLabel}`}</span>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(16, 185, 129, 0.18)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#6ee7b7',
                }}
              >
                <ShieldCheck size={12} />
                <span>Otoritas Pengesahan Sah</span>
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(20px, 2.3vw, 24px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 5px 0', lineHeight: 1.25 }}>
              Selamat Datang, {user.name}
            </h1>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
              Pusat kendali evaluasi Sasaran Kinerja Pegawai (SKP) Tridharma, kepatuhan standar mutu SKS, dan legalitas pengesahan digital Ketua Program Studi di lingkungan {isKacap ? `kampus cabang (${territoryLabel})` : `fakultas (${territoryLabel})`}.
            </p>
          </div>
        </div>

        {/* Action Button Cluster */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          {/* Menu Pintas Dropdown */}
          <div ref={quickMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickMenu((prev) => !prev)}
              className="brand-btn"
              style={{
                padding: '9.5px 15px',
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(4px)',
                cursor: 'pointer',
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
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 215,
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 4px 8px -2px rgba(15, 23, 42, 0.05)',
                  border: '1px solid #cbd5e1',
                  padding: '6px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
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
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={14} style={{ color: 'var(--brand-600)' }} />
                    <span style={{ fontWeight: 600 }}>SKP Pribadi ({roleLabel})</span>
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
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Award size={14} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 600 }}>Hasil Kinerja Tahunan</span>
                  </button>
                )}
                {onNavigateToEvaluasiKaprodi && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false)
                      onNavigateToEvaluasiKaprodi()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <CheckCircle2 size={14} style={{ color: '#7c3aed' }} />
                    <span style={{ fontWeight: 600 }}>Evaluasi Perilaku Ka.Prodi</span>
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
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <BookOpen size={14} style={{ color: '#059669' }} />
                    <span style={{ fontWeight: 600 }}>Buku Panduan &amp; SPMI</span>
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
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: '9999px',
              background: pendingReviewCount > 0 ? 'var(--brand-600)' : '#10b981',
              color: '#ffffff',
              boxShadow: pendingReviewCount > 0
                ? '0 4px 14px rgba(234, 88, 12, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.35)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <FileCheck2 size={16} />
            <span>Verifikasi SKP ({pendingReviewCount})</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Periode & Tab Status Roster (Pill-Rounded 9999px) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Filter Periode Akademik Dinamis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="filter-pill-container">
            <Filter size={13} style={{ color: 'var(--brand-600)' }} />
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700 }}>Periode:</span>

            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value as any)
                setPage(1)
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '9999px',
              }}
              aria-label="Pilih Semester"
            >
              <option value="Semua">Semua Semester</option>
              <option value="Genap">Semester Genap</option>
              <option value="Ganjil">Semester Ganjil</option>
            </select>

            <span style={{ color: '#cbd5e1', fontWeight: 300 }}>|</span>

            <select
              value={selectedTahun}
              onChange={(e) => {
                setSelectedTahun(e.target.value)
                setPage(1)
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '9999px',
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

          <span
            className={`badge-pill ${
              pendingReviewCount > 0
                ? 'badge-pill--orange'
                : approvedCount > 0
                ? 'badge-pill--green'
                : 'badge-pill--gray'
            }`}
          >
            {pendingReviewCount > 0 ? (
              <Clock size={12} />
            ) : approvedCount > 0 ? (
              <CheckCircle2 size={12} />
            ) : (
              <FileText size={12} />
            )}
            <span>
              {pendingReviewCount > 0
                ? `${pendingReviewCount} Perlu Ditandatangani`
                : approvedCount > 0
                ? `${approvedCount} SKP Disahkan`
                : 'Menunggu Pengajuan'}
            </span>
          </span>
        </div>

        {/* Quick Filter Status Tabs */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '9999px',
            padding: '4px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          {[
            { id: 'semua', label: 'Semua', count: kaprodiRoster.length },
            { id: 'menunggu', label: 'Menunggu Review', count: pendingReviewCount },
            { id: 'disahkan', label: 'Disahkan', count: approvedCount },
            { id: 'belum', label: 'Belum Mengajukan', count: unsubmittedCount },
          ].map((tab) => {
            const isActive = statusTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusTab(tab.id as any)
                  setPage(1)
                }}
                style={{
                  border: 'none',
                  background: isActive ? 'var(--navy-900)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--muted)',
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
                    color: isActive ? '#ffffff' : 'var(--ink-secondary)',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Empat Kartu KPI Metriks Eksekutif (4-Grid Refined) */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Status Pengesahan Dekan (Hero Dark Navy) */}
        <div className="kpi-card kpi-card--hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.92)', fontWeight: 700 }}>
              Status Verifikasi Dekan
            </span>
            <button
              onClick={onNavigateToReview}
              title="Buka Meja Verifikasi Dekan"
              style={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={14} />
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            {pendingReviewCount > 0 ? (
              <>
                <div className="kpi-stat-number" style={{ color: '#ffffff', fontSize: '26px', lineHeight: 1.1 }}>
                  {pendingReviewCount}
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, marginLeft: 6 }}>
                    Berkas
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    className="badge-pill"
                    style={{
                      background: 'rgba(249, 115, 22, 0.25)',
                      border: '1px solid rgba(249, 115, 22, 0.45)',
                      color: '#ffedd5',
                      padding: '3px 10px',
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={11} />
                    <span>Perlu Ditinjau Dekan</span>
                  </span>
                </div>
              </>
            ) : approvedCount === kaprodiList.length && kaprodiList.length > 0 ? (
              <>
                <div className="kpi-stat-number" style={{ color: '#ffffff', fontSize: '26px', lineHeight: 1.1 }}>
                  Tuntas 100%
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    className="badge-pill"
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#dcfce7',
                      padding: '3px 10px',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>Semua SKP Telah Disahkan</span>
                  </span>
                </div>
              </>
            ) : submittedCount === 0 ? (
              <>
                <div className="kpi-stat-number" style={{ color: '#ffffff', fontSize: '26px', lineHeight: 1.1 }}>
                  0
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, marginLeft: 6 }}>
                    Antrean
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    className="badge-pill"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      padding: '3px 10px',
                      fontWeight: 600,
                    }}
                  >
                    <Clock size={11} />
                    <span>Menunggu Pengajuan Kaprodi</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="kpi-stat-number" style={{ color: '#ffffff', fontSize: '26px', lineHeight: 1.1 }}>
                  0
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, marginLeft: 6 }}>
                    Antrean
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    className="badge-pill"
                    style={{
                      background: 'rgba(56, 189, 248, 0.25)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#bae6fd',
                      padding: '3px 10px',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>{approvedCount}/{kaprodiList.length} Disahkan</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Total Ketua Program Studi */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 700 }}>
              Ketua Program Studi (Kaprodi)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#f1f5f9',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--navy-900)',
              }}
            >
              <Users size={16} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-stat-number" style={{ color: 'var(--ink)' }}>
                {kaprodiList.length}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Kaprodi</span>
            </div>

            <div style={{ marginTop: 8 }}>
              <span className="badge-pill badge-pill--blue">
                <Building2 size={11} />
                <span>Homebase {territoryLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Kepatuhan Pengajuan SKP */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 700 }}>
              Kepatuhan Pengajuan SKP
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: compliancePercentage === 100 ? '#ecfdf5' : '#fff7ed',
                display: 'grid',
                placeItems: 'center',
                color: compliancePercentage === 100 ? '#15803d' : '#ea580c',
              }}
            >
              <FileCheck2 size={16} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-stat-number" style={{ color: 'var(--ink)' }}>
                {submittedCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / {kaprodiList.length} Berkas
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <span
                className={`badge-pill ${
                  compliancePercentage === 100
                    ? 'badge-pill--green'
                    : compliancePercentage > 0
                    ? 'badge-pill--orange'
                    : 'badge-pill--gray'
                }`}
              >
                <TrendingUp size={11} />
                <span>{compliancePercentage}% Berkas Masuk</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Dokumen Sah & Diterbitkan */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 700 }}>
              SKP Sah &amp; Diterbitkan
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: approvedCount > 0 ? '#ecfdf5' : '#f8fafc',
                display: 'grid',
                placeItems: 'center',
                color: approvedCount > 0 ? '#15803d' : 'var(--muted)',
              }}
            >
              <ShieldCheck size={16} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-stat-number" style={{ color: 'var(--ink)' }}>
                {approvedCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>

            <div style={{ marginTop: 8 }}>
              <span className={`badge-pill ${approvedCount > 0 ? 'badge-pill--green' : 'badge-pill--gray'}`}>
                <ShieldCheck size={11} />
                <span>TTD Digital {isKacap ? 'KeCab' : 'Dekan'} Sah</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Alur Evaluasi & Pengesahan Pimpinan Fakultas (Stepper 4 Langkah) */}
      <div
        className="dashboard-panel"
        style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
              Alur Evaluasi &amp; Pengesahan SKP Tridharma ({territoryLabel})
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
              Pedoman tahapan verifikasi dokumen bukti, pengujian beban kerja SKS, dan pembubuhan pengesahan digital pimpinan.
            </p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
            Target Evaluasi: Periode {selectedSemester === 'Semua' ? 'Ganjil/Genap' : selectedSemester} {selectedTahun}
          </span>
        </div>

        <div className="stepper-grid-4">
          {workflowSteps.map((s) => {
            const isCompleted = s.status === 'completed'
            const isActive = s.status === 'active'

            return (
              <div
                key={s.step}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.06)'
                    : isActive
                    ? 'rgba(234, 88, 12, 0.07)'
                    : '#f8fafc',
                  border: isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isActive
                    ? '1px solid rgba(234, 88, 12, 0.35)'
                    : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isCompleted ? '#10b981' : isActive ? '#ea580c' : '#cbd5e1',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? <Check size={12} /> : s.step}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.desc}
                    </div>
                  </div>
                </div>

                <div style={{ paddingLeft: 30, marginTop: 'auto' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: isCompleted ? '#15803d' : isActive ? '#c2410c' : 'var(--muted)',
                    }}
                  >
                    {isCompleted ? 'Terpenuhi' : isActive ? 'Sedang Berlangsung' : 'Tahap Berikutnya'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Daftar Lengkap Ketua Program Studi & Pengesahan SKP (Anti-Empty Roster) */}
      <div
        className="dashboard-panel"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
              Daftar Evaluasi &amp; Pengesahan SKP Ketua Program Studi ({territoryLabel})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
              Daftar seluruh Ketua Program Studi di bawah binaan fakultas beserta status capaian dan legalitas SKP Tridharma.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '6px 14px',
                minWidth: 230,
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={searchKaprodi}
                onChange={(e) => {
                  setSearchKaprodi(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama kaprodi / prodi..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  width: '100%',
                }}
              />
              {searchKaprodi && (
                <button
                  onClick={() => setSearchKaprodi('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--muted)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={onNavigateToReview}
              className="brand-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '9999px',
                background: 'var(--navy-900)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span>Meja Review Lengkap</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Tabel Data Roster Kaprodi */}
        <div className="table-container" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Ketua Program Studi</th>
                <th>Program Studi</th>
                <th style={{ textAlign: 'center' }}>Periode Evaluasi</th>
                <th style={{ textAlign: 'center' }}>Beban SKS</th>
                <th style={{ textAlign: 'center' }}>Nilai SKP</th>
                <th style={{ textAlign: 'center' }}>Status Berkas</th>
                <th style={{ textAlign: 'center' }}>Legalitas Dekan</th>
                <th style={{ textAlign: 'right', minWidth: 140 }}>Aksi Kepemimpinan</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                    <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--muted)',
                        }}
                      >
                        <Search size={20} />
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13.5px' }}>
                        Tidak Ditemukan Data Kaprodi
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                        Tidak ada Ketua Program Studi yang sesuai dengan kriteria filter atau kata kunci pencarian.
                      </div>
                      {searchKaprodi && (
                        <button
                          onClick={() => {
                            setSearchKaprodi('')
                            setStatusTab('semua')
                          }}
                          className="brand-btn brand-btn--outline"
                          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '9999px', marginTop: 4 }}
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRoster.map(({ kaprodi, skp, isSah, isNeedsReview, isRevisi, isUnsubmitted, displayStatus }) => {
                  const realisasiSks = skp?.totalSksRealisasi ?? 0
                  const isSksMemenuhi = realisasiSks >= 12

                  return (
                    <tr key={kaprodi.id} style={{ transition: 'background 0.15s' }}>
                      {/* Kolom 1: Profil Kaprodi */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={getAvatarSrc(kaprodi.avatar)}
                            alt={kaprodi.nama}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #cbd5e1',
                              background: '#f8fafc',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {kaprodi.nama}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span className="tabular-nums font-mono font-medium">
                                {kaprodi.nuptk && kaprodi.nuptk.trim() !== '-'
                                  ? `NUPTK: ${kaprodi.nuptk}`
                                  : kaprodi.nip && kaprodi.nip.trim() !== '-'
                                  ? `NIP: ${kaprodi.nip}`
                                  : 'NUPTK: -'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Program Studi */}
                      <td>
                        <span className="badge-pill badge-pill--blue" style={{ fontWeight: 600 }}>
                          {kaprodi.prodi || skp?.dosenProdi || '-'}
                        </span>
                      </td>

                      {/* Kolom 3: Periode Evaluasi */}
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--navy-900)' }}>
                        {skp ? `${skp.semester} ${skp.tahunAkademik}` : `${selectedSemester === 'Semua' ? 'Semester' : selectedSemester} ${selectedTahun}`}
                      </td>

                      {/* Kolom 4: Beban SKS */}
                      <td style={{ textAlign: 'center' }}>
                        {skp ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>
                              {realisasiSks} <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>SKS</span>
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <span
                                className={`badge-pill ${
                                  isSksMemenuhi ? 'badge-pill--green' : 'badge-pill--red'
                                }`}
                                style={{ fontSize: '10px', padding: '1px 6px' }}
                              >
                                {isSksMemenuhi ? 'SPMI Terpenuhi' : `Kurang ${12 - realisasiSks} SKS`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontStyle: 'italic' }}>
                            Belum Ada Berkas
                          </span>
                        )}
                      </td>

                      {/* Kolom 5: Nilai Kinerja SKP */}
                      <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                        {skp?.nilaiKinerjaSKP ? (
                          <span style={{ color: 'var(--brand-700)' }}>{skp.nilaiKinerjaSKP}%</span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>-</span>
                        )}
                      </td>

                      {/* Kolom 6: Status Berkas */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge-pill ${
                            isSah
                              ? 'badge-pill--green'
                              : isRevisi
                              ? 'badge-pill--red'
                              : isNeedsReview
                              ? 'badge-pill--orange'
                              : 'badge-pill--gray'
                          }`}
                        >
                          {isSah ? <CheckCircle2 size={11} /> : isNeedsReview ? <Clock size={11} /> : null}
                          <span>{displayStatus}</span>
                        </span>
                      </td>

                      {/* Kolom 7: Legalitas TTD Dekan */}
                      <td style={{ textAlign: 'center' }}>
                        {skp?.ttdDekanUrl ? (
                          <span className="badge-pill badge-pill--green" title="Telah Ditandatangani Dekan">
                            <ShieldCheck size={11} />
                            <span>Sah Ditandatangani</span>
                          </span>
                        ) : (
                          <span className="badge-pill badge-pill--gray" title="Belum Dibubuhi TTD Digital">
                            <Clock size={11} />
                            <span>Belum TTD</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom 8: Aksi Kepemimpinan */}
                      <td style={{ textAlign: 'right' }}>
                        {isNeedsReview ? (
                          <button
                            onClick={onNavigateToReview}
                            className="brand-btn btn-action-view"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <FileCheck2 size={13} />
                            <span>Verifikasi &amp; TTD</span>
                          </button>
                        ) : isSah ? (
                          <button
                            onClick={onNavigateToReview}
                            className="brand-btn brand-btn--outline"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} />
                            <span>Lihat SKP Sah</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendReminder(kaprodi.nama)}
                            className="brand-btn brand-btn--outline"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              color: 'var(--muted)',
                              borderColor: '#cbd5e1',
                              cursor: 'pointer',
                            }}
                            title="Kirim notifikasi pengingat pengisian SKP ke Kaprodi"
                          >
                            <Send size={11} />
                            <span>Kirim Pengingat</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Table */}
        <TablePagination
          totalItems={filteredRoster.length}
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
