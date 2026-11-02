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
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { UserSession, PengajuanSKP, Dosen, ProgramStudi, Fakultas, Psdku } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'

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
  onShowToast?: (msg: string) => void
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const [showQuickMenu, setShowQuickMenu] = useState(false)

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

  const [searchKaprodi, setSearchKaprodi] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // 1. Identifikasi apakah user adalah Kepala Cabang (KeCab PSDKU) atau Dekan Fakultas (Pusat)
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

  // 2. Filter ID Program Studi yang sah di bawah ranah wewenang pimpinan ini
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
        if (isPsdkuUnit) return // Dekan Fakultas Pusat tidak membina PSDKU

        const matchFakId = dekanFakultasId && (p.fakultas_id === dekanFakultasId || p.fakultasId === dekanFakultasId)
        const matchFakName = dekanFakultasName && (p.fakultas || '').toLowerCase().includes(dekanFakultasName)
        if (matchFakId || matchFakName) {
          ids.add(p.id)
        }
      })
    }
    return ids
  }, [isKacap, prodiList, dekanFakultasId, dekanFakultasName])

  // 3. Filter daftar Ka.Prodi eksklusif sesuai ranah/wilayah
  const kaprodiList = useMemo(() => {
    return dosenList.filter((d) => {
      // Dekan/KaCap tidak boleh memverifikasi dirinya sendiri di meja verifikasi
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
        // KECAB HANYA MENILAI KA.PRODI DI PSDKU ASALNYA SAJA (TIDAK BISA PUSAT ATAU PSDKU LAIN)
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
        // DEKAN FAKULTAS PUSAT HANYA MENILAI KA.PRODI DI FAKULTAS PUSAT (TIDAK BISA PSDKU)
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

  // Kaprodi SKP list
  const kaprodiSKPs = useMemo(() => {
    const kIds = new Set(kaprodiList.map((k) => k.id).filter(Boolean))
    const kNuptks = new Set(
      kaprodiList
        .map((k) => k.nuptk)
        .filter((n): n is string => typeof n === 'string' && n.trim() !== '-' && n.trim().length >= 10)
    )
    const kNips = new Set(
      kaprodiList
        .map((k) => (k.nip || '').trim())
        .filter((nip): nip is string => Boolean(nip) && nip !== '-' && nip.length > 3)
    )
    const kNames = new Set(
      kaprodiList
        .map((k) => (k.nama || '').trim().toLowerCase())
        .filter((nama): nama is string => Boolean(nama) && nama.length > 3)
    )

    return skpList.filter((s) => {
      // Dekan/KaCap tidak boleh menilai dirinya sendiri di meja review
      if (s.dosenId === user.id) return false
      if (user.nuptk && user.nuptk !== '-' && s.dosenNuptk === user.nuptk) return false
      if (user.nip && user.nip !== '-' && s.dosenNip === user.nip) return false
      if (user.name && (s.dosenNama || '').trim().toLowerCase() === user.name.trim().toLowerCase()) return false

      const matchId = Boolean(s.dosenId && kIds.has(s.dosenId))
      const matchNuptk = Boolean(s.dosenNuptk && s.dosenNuptk.trim() !== '-' && kNuptks.has(s.dosenNuptk.trim()))
      const matchNip = Boolean(s.dosenNip && s.dosenNip !== '-' && kNips.has(s.dosenNip.trim()))
      const matchName = Boolean(s.dosenNama && kNames.has(s.dosenNama.trim().toLowerCase()))

      return matchId || matchNuptk || matchNip || matchName
    })
  }, [skpList, kaprodiList, user.id, user.nuptk, user.nip, user.name])

  const filteredKaprodiSKPs = useMemo(() => {
    return kaprodiSKPs.filter((s) => {
      const q = (searchKaprodi || '').trim().toLowerCase()
      if (!q) return true
      return (
        (s.dosenNama || '').toLowerCase().includes(q) ||
        (s.dosenNuptk && s.dosenNuptk.toLowerCase().includes(q)) ||
        (s.dosenNip && s.dosenNip !== '-' && s.dosenNip.toLowerCase().includes(q)) ||
        (s.dosenProdi || '').toLowerCase().includes(q)
      )
    })
  }, [kaprodiSKPs, searchKaprodi])

  const paginatedKaprodiSKPs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredKaprodiSKPs.slice(start, start + pageSize)
  }, [filteredKaprodiSKPs, page, pageSize])

  const pendingReviewCount = kaprodiSKPs.filter(
    (s) => s.status === 'Diajukan' || !s.ttdDekanUrl
  ).length

  const approvedCount = kaprodiSKPs.filter(
    (s) => ['Disahkan', 'Terbit', 'Dinilai Dekan', 'Disetujui SDM'].includes(s.status)
  ).length

  return (
    <div className="page-container" ref={containerRef}>
      {/* Header Banner (Spacious, Elegant & Balanced) */}
      <div
        className="dashboard-banner"
        style={{
          background: 'linear-gradient(135deg, var(--navy-900) 0%, #1e3a5f 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(4px)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#fdba74',
              marginBottom: 6,
            }}
          >
            <Building2 size={13} />
            <span>{isKacap ? `Portal Pimpinan Cabang \u2022 ${territoryLabel}` : `Portal Pimpinan Fakultas \u2022 ${territoryLabel}`}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(19px, 2.2vw, 23px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0', lineHeight: 1.3 }}>
            Selamat Datang, {user.name}
          </h1>
          <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Evaluasi dokumen bukti, validasi standar mutu SKS, dan bubuhkan pengesahan TTD digital SKP Ketua Program Studi lingkungan {isKacap ? `kampus cabang (${territoryLabel})` : `fakultas (${territoryLabel})`}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Menu Pintas Dropdown */}
          <div ref={quickMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickMenu((prev) => !prev)}
              className="brand-btn"
              style={{
                padding: '9px 14px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--r-md)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(4px)',
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
                    <CheckCircle2 size={14} style={{ color: '#7c3aed' }} />
                    <span>Evaluasi Ka.Prodi</span>
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
                    <span>Panduan Dekan</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onNavigateToReview}
            className="brand-btn btn-action-add"
            style={{
              padding: '9.5px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileCheck2 size={15} />
            <span>Verifikasi SKP ({pendingReviewCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Clean, Solid, Industry-Standard) */}
      <div className="kpi-bento-grid-3">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Total Ketua Program Studi
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--r-sm)',
                background: 'var(--panel-hover)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--navy-900)',
              }}
            >
              <Users size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="kpi-stat-number" style={{ color: 'var(--ink)' }}>
              {kaprodiList.length} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Kaprodi</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="kpi-badge">
                <Building2 size={11} />
                <span>Homebase {user.fakultas || 'Fakultas'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Menunggu Verifikasi Dekan
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(217, 119, 6, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#b45309',
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="kpi-stat-number" style={{ color: pendingReviewCount > 0 ? '#b45309' : 'var(--ink)' }}>
              {pendingReviewCount} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-warning-bg)',
                  color: 'var(--status-warning-ink)',
                }}
              >
                <Clock size={11} />
                <span>{pendingReviewCount > 0 ? 'Siap Ditandatangani' : 'Tuntas'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              SKP Disahkan Dekan
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#15803d',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="kpi-stat-number" style={{ color: 'var(--status-success-ink)' }}>
              {approvedCount} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-ink)',
                }}
              >
                <ShieldCheck size={11} />
                <span>TTD Digital {isKacap ? 'KeCab' : 'Dekan'} Sah</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar SKP Kaprodi Yang Harus Dinilai */}
      <div className="dashboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
              Daftar Persetujuan &amp; Pengesahan SKP Ketua Program Studi ({territoryLabel})
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
              Verifikasi kelayakan kinerja dan bubuhkan tanda tangan pengesahan SKP kepemimpinan prodi.
            </p>
          </div>

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
                minWidth: 180,
              }}
            >
              <Search size={13} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={searchKaprodi}
                onChange={(e) => {
                  setSearchKaprodi(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari Kaprodi / prodi..."
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
              className="brand-btn brand-btn--outline"
              style={{ padding: '6px 12px', fontSize: '12px', gap: 5 }}
            >
              <span>Panel Verifikasi</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Nama Ketua Program Studi</th>
                <th>Program Studi</th>
                <th style={{ textAlign: 'center' }}>Semester</th>
                <th style={{ textAlign: 'center' }}>Total SKS</th>
                <th style={{ textAlign: 'center' }}>Nilai SKP</th>
                <th style={{ textAlign: 'center' }}>Status SKP</th>
                <th style={{ textAlign: 'center' }}>TTD Dekan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKaprodiSKPs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                    Tidak ada berkas SKP Kaprodi yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                paginatedKaprodiSKPs.map((skp) => (
                  <tr key={skp.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px' }}>{skp.dosenNama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }} className="tabular-nums font-mono font-medium">
                        {skp.dosenNuptk && skp.dosenNuptk.trim() !== '-'
                          ? `NUPTK: ${skp.dosenNuptk}`
                          : skp.dosenNip && skp.dosenNip.trim() !== '-'
                          ? `NIP: ${skp.dosenNip}`
                          : 'NUPTK: -'}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill badge-pill--blue">{skp.dosenProdi || '-'}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '12.5px' }}>
                      {skp.semester} {skp.tahunAkademik}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '12.5px' }}>
                      {skp.totalSksRealisasi ?? 0} SKS
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums', fontSize: '12.5px' }}>
                      {skp.nilaiKinerjaSKP ? `${skp.nilaiKinerjaSKP}%` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {(() => {
                        const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan'].includes(skp.status)
                        return (
                          <span
                            className={`badge-pill ${
                              isSah
                                ? 'badge-pill--green'
                                : skp.status === 'Perlu Revisi'
                                ? 'badge-pill--red'
                                : 'badge-pill--orange'
                            }`}
                          >
                            {isSah ? 'Sah & Terbit' : skp.status || '-'}
                          </span>
                        )
                      })()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {skp.ttdDekanUrl ? (
                        <span className="badge-pill badge-pill--green" title="TTD Dekan Terverifikasi">
                          Sudah TTD
                        </span>
                      ) : (
                        <span className="badge-pill badge-pill--gray">Belum TTD</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={onNavigateToReview}
                        className="brand-btn btn-action-view"
                        style={{ padding: '5px 12px', fontSize: '11.5px' }}
                      >
                        Verifikasi &amp; TTD
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          totalItems={filteredKaprodiSKPs.length}
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
