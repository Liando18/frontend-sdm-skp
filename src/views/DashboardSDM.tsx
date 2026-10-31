import React, { useRef, useState, useMemo, useEffect } from 'react'
import {
  TrendingUp,
  Clock,
  Send,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Award,
  Search,
  Users,
  GraduationCap,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Dosen, PengajuanSKP } from '../types'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'

interface DashboardSDMProps {
  dosenList: Dosen[]
  skpList: PengajuanSKP[]
  onNavigate: (viewId: string) => void
  onAddDosenModal: () => void
  onSelectSKPToReview: (skp: PengajuanSKP) => void
  onShowToast: (msg: string) => void
}

export const DashboardSDM: React.FC<DashboardSDMProps> = ({
  dosenList,
  skpList,
  onNavigate,
  onAddDosenModal,
  onSelectSKPToReview,
  onShowToast,
}) => {
  const totalDosen = dosenList.length
  const skpDisetujui = skpList.filter((s) =>
    ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(s.status)
  ).length
  const skpMenungguSDM = skpList.filter((s) =>
    ['Diajukan', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(s.status)
  ).length
  const skpRevisi = skpList.filter((s) => s.status === 'Perlu Revisi').length

  // Breakdown status dosen
  const dosenTetap = dosenList.filter((d) => (d.status || '').toLowerCase().includes('tetap')).length
  const dosenPns = dosenList.filter((d) => (d.status || '').toLowerCase().includes('pns')).length
  const dosenKontrak = totalDosen - dosenTetap - dosenPns

  // Dynamically calculate JAD distribution from database
  const countGuruBesar = dosenList.filter((d) => d.jafung === 'Guru Besar').length
  const countLektorKepala = dosenList.filter((d) => d.jafung === 'Lektor Kepala').length
  const countLektor = dosenList.filter((d) => d.jafung === 'Lektor').length
  const countAsistenAhli = dosenList.filter(
    (d) => d.jafung === 'Asisten Ahli' || d.jafung === 'Tenaga Pengajar'
  ).length

  // Table Search, Filter Tabs & Pagination states
  const [tableSearch, setTableSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'semua' | 'perlu-sdm' | 'proses' | 'disahkan' | 'revisi'>('semua')
  const [chartFilter, setChartFilter] = useState<'aktif' | 'semua'>('aktif')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  // Dynamically calculate SKS per prodi from database skpList & dosenList
  const prodis = Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))
  const latestSkp = skpList[0]
  const activePeriode = latestSkp ? `${latestSkp.semester} ${latestSkp.tahunAkademik}` : 'Semester Genap 2025/2026'

  const formatProdiName = (p: string) => {
    return p
      .replace('Kesehatan Masyarakat', 'Kesmas')
      .replace('Sarjana Terapan ', '')
      .replace('Direktorat Sumber Daya Manusia', 'SDM')
  }

  const chartData = useMemo(() => {
    return prodis.map((prodi, idx) => {
      const dosenInProdi = dosenList.filter((d) => d.prodi === prodi).map((d) => d.id)
      const skpInProdi = skpList.filter((s) => dosenInProdi.includes(s.dosenId) || s.dosenProdi === prodi)
      const avgSks =
        skpInProdi.length > 0
          ? skpInProdi.reduce((acc, curr) => acc + (curr.totalSksRealisasi || curr.totalSksRencana || 0), 0) /
            skpInProdi.length
          : 0
      const val = Number(avgSks.toFixed(1))
      return {
        label: formatProdiName(prodi),
        value: val,
        fullProdi: prodi,
        active: idx < 4,
      }
    })
  }, [prodis, dosenList, skpList])

  const displayChartData = useMemo(() => {
    if (chartFilter === 'aktif') {
      const active = chartData.filter((d) => d.value > 0)
      return active.length > 0 ? active : chartData.slice(0, 6)
    }
    return chartData
  }, [chartData, chartFilter])

  // SPMI compliance and summary statistics (Strictly from real database)
  const activeProdisWithData = chartData.filter((d) => d.value > 0)
  const spmiCompliantCount = activeProdisWithData.filter((d) => d.value >= 12).length
  const spmiComplianceRate =
    activeProdisWithData.length > 0
      ? Math.round((spmiCompliantCount / activeProdisWithData.length) * 100)
      : 0
  const highestProdi =
    chartData.length > 0 && chartData.some((d) => d.value > 0)
      ? chartData.reduce((max, d) => (d.value > max.value ? d : max), chartData[0])
      : { label: '-', value: 0 }
  const totalSksAll = activeProdisWithData.reduce((acc, d) => acc + d.value, 0)
  const averageSksPt = activeProdisWithData.length > 0 ? totalSksAll / activeProdisWithData.length : 0

  // Filter across whole dataset
  const filteredSkpList = useMemo(() => {
    return skpList.filter((s) => {
      const q = (tableSearch || '').toLowerCase().trim()
      const matchSearch =
        q === '' ||
        (s.dosenNama || '').toLowerCase().includes(q) ||
        (s.dosenNip || '').toLowerCase().includes(q) ||
        (s.dosenProdi || '').toLowerCase().includes(q)

      const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM'].includes(s.status)
      const isPerluSDM = ['Dinilai Kaprodi', 'Dinilai Dekan', 'Diajukan'].includes(s.status)
      const isProses = ['Diajukan', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(s.status)
      const isRevisi = s.status === 'Perlu Revisi'

      let matchTab = true
      if (filterTab === 'perlu-sdm') matchTab = isPerluSDM
      else if (filterTab === 'proses') matchTab = isProses
      else if (filterTab === 'disahkan') matchTab = isSah
      else if (filterTab === 'revisi') matchTab = isRevisi

      return matchSearch && matchTab
    })
  }, [skpList, tableSearch, filterTab])

  // Slice for current page
  const paginatedSkp = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSkpList.slice(start, start + pageSize)
  }, [filteredSkpList, page, pageSize])

  const handleSendReminder = () => {
    onShowToast('Pengingat batas waktu pengesahan SKP telah disiarkan ke seluruh Dosen dan Ketua Program Studi.')
  }

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
  useCountUp(containerRef, '.kpi-count-up', [totalDosen, skpDisetujui, skpMenungguSDM, skpRevisi])
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
      {/* Executive Institutional Header (Spacious, Balanced & Clean) */}
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
        {/* Identitas & Wewenang SDM */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 'var(--r-xs)',
                background: 'var(--brand-100)',
                color: 'var(--brand-700)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Building2 size={12} />
              <span>Direktorat SDM</span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 'var(--r-xs)',
                background: 'var(--navy-100)',
                color: 'var(--navy-900)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Calendar size={12} />
              <span>{activePeriode}</span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 'var(--r-xs)',
                background: 'var(--panel-hover)',
                color: 'var(--muted)',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              <Sparkles size={11} style={{ color: 'var(--brand-600)' }} />
              <span>SPMI: 12 - 16 SKS</span>
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(20px, 2.2vw, 24px)',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: '0 0 4px 0',
              lineHeight: 1.25,
            }}
          >
            Dashboard Pemantauan Kinerja &amp; Validasi SKP
          </h1>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--muted)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 680,
            }}
          >
            Pengawasan beban Tridharma institusional, evaluasi perilaku BerAKHLAK, dan penetapan status pengesahan SKP dosen Universitas Bhakti Kencana.
          </p>
        </div>

        {/* Action Controls: Compact Menu Cepat + Primary CTA Tambah Dosen */}
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
                <button
                  onClick={() => {
                    setShowQuickMenu(false)
                    onNavigate('skp-sdm-self')
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
                <button
                  onClick={() => {
                    setShowQuickMenu(false)
                    onNavigate('hasil-kinerja-sdm')
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
                <button
                  onClick={() => {
                    setShowQuickMenu(false)
                    onNavigate('panduan')
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
                  <span>Panduan SDM</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false)
                    onNavigate('laporan')
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
                  <Download size={14} style={{ color: '#d97706' }} />
                  <span>Ekspor Laporan</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onAddDosenModal}
            className="btn-action-add"
            style={{
              padding: '9.5px 18px',
              borderRadius: 'var(--r-md)',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            aria-label="Tambah data dosen baru"
          >
            <Plus size={15} />
            <span>Tambah Dosen</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid (4 Cards with Visual Hierarchy - Responsive & Compact) */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Hero Deep Navy - Total Dosen Aktif */}
        <div className="kpi-card kpi-card--hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              Total Dosen Aktif UBK
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('data-dosen')}
              aria-label="Lihat master data dosen"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={totalDosen}
              >
                {totalDosen}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Dosen</span>
            </div>

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span className="kpi-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                <Users size={11} />
                <span>{dosenTetap} Tetap</span>
              </span>
              <span className="kpi-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                <span>{dosenPns} DPK</span>
              </span>
              {dosenKontrak > 0 && (
                <span className="kpi-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                  <span>{dosenKontrak} Kontrak</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: SKP Terverifikasi & Disahkan */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              SKP Sah &amp; Terbit SDM
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('skp-dosen')}
              aria-label="Buka berkas SKP terverifikasi"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={skpDisetujui}
                style={{ color: 'var(--ink)' }}
              >
                {skpDisetujui}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / {totalDosen} Berkas
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="badge-pill badge-pill--green">
                <CheckCircle2 size={11} />
                <span>
                  {totalDosen > 0 ? ((skpDisetujui / totalDosen) * 100).toFixed(1) : 0}% Dosen Tervalidasi
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu Validasi SDM */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Menunggu Pengesahan
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => {
                setFilterTab('perlu-sdm')
                const el = document.getElementById('section-tabel-skp')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Lihat pengajuan menunggu validasi"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={skpMenungguSDM}
                style={{ color: 'var(--brand-700)' }}
              >
                {skpMenungguSDM}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Pengajuan</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="badge-pill badge-pill--orange">
                <Clock size={11} />
                <span>Siap Diperiksa SDM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Perlu Revisi Dokumen */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Perlu Revisi Dokumen
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => {
                setFilterTab('revisi')
                const el = document.getElementById('section-tabel-skp')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Lihat pengajuan perlu revisi"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="kpi-count-up kpi-stat-number"
                data-count={skpRevisi}
                style={{ color: skpRevisi > 0 ? 'var(--status-danger-ink)' : 'var(--ink)' }}
              >
                {skpRevisi}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className={`badge-pill ${skpRevisi > 0 ? 'badge-pill--red' : 'badge-pill--gray'}`}>
                {skpRevisi > 0 ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
                <span>{skpRevisi > 0 ? 'Menunggu Dosen' : 'Nihil Hambatan'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Institutional Insights Section */}
      <div className="dashboard-chart-grid">
        {/* SKS Chart Card */}
        <div
          className="dashboard-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Rata-rata Capaian Beban SKS per Program Studi
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>
                Pemenuhan Standar Mutu Tridharma UBK (Target Beban Ideal: 12 - 16 SKS per semester)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Tab Selector: Prodi Aktif vs Semua Prodi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f1f5f9', padding: '3px', borderRadius: 'var(--r-md)' }}>
                <button
                  type="button"
                  onClick={() => setChartFilter('aktif')}
                  style={{
                    border: 'none',
                    background: chartFilter === 'aktif' ? '#ffffff' : 'transparent',
                    color: chartFilter === 'aktif' ? 'var(--brand-700)' : 'var(--muted)',
                    fontWeight: chartFilter === 'aktif' ? 700 : 500,
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    boxShadow: chartFilter === 'aktif' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Prodi Aktif ({activeProdisWithData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChartFilter('semua')}
                  style={{
                    border: 'none',
                    background: chartFilter === 'semua' ? '#ffffff' : 'transparent',
                    color: chartFilter === 'semua' ? 'var(--brand-700)' : 'var(--muted)',
                    fontWeight: chartFilter === 'semua' ? 700 : 500,
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    boxShadow: chartFilter === 'semua' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Semua ({prodis.length})
                </button>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-700)',
                  background: 'var(--brand-100)',
                  padding: '3px 8px',
                  borderRadius: 'var(--r-xs)',
                }}
              >
                {activePeriode}
              </span>
            </div>
          </div>

          {/* Clean Legend Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: '11px',
              color: 'var(--muted)',
              padding: '4px 0',
              borderBottom: '1px solid var(--hair-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ea580c', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Capaian SKS Aktual</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: '#10b981', display: 'inline-block' }} />
              <span>Ambang Batas SPMI (Min. 12 SKS)</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: '#94a3b8', display: 'inline-block' }} />
              <span>Batas Maksimum (16 SKS)</span>
            </span>
          </div>

          {/* Bar Chart Area (Pure React & SVG - Isolated layout, zero overflow collision) */}
          <div
            style={{
              width: '100%',
              height: 220,
              position: 'relative',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            {/* Y Axis Guide Lines & Labels (Fixed 135px height) */}
            <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 135, pointerEvents: 'none' }}>
              {[20, 16, 12, 8, 4, 0].map((val) => {
                const bottomPct = (val / 20) * 100
                const isMinSpmi = val === 12
                const isMaxSpmi = val === 16
                return (
                  <div
                    key={`y-${val}`}
                    style={{
                      position: 'absolute',
                      bottom: `${bottomPct}%`,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        fontSize: '10px',
                        fontWeight: isMinSpmi || isMaxSpmi ? 700 : 500,
                        color: isMinSpmi ? '#10b981' : isMaxSpmi ? '#64748b' : '#94a3b8',
                        fontVariantNumeric: 'tabular-nums',
                        transform: 'translateY(50%)',
                        width: 26,
                        textAlign: 'right',
                      }}
                    >
                      {val}
                    </span>
                    <div
                      style={{
                        marginLeft: 32,
                        width: 'calc(100% - 32px)',
                        borderBottom: isMinSpmi
                          ? '1.5px dashed #10b981'
                          : isMaxSpmi
                          ? '1.5px dashed #94a3b8'
                          : '1px solid rgba(226, 232, 240, 0.7)',
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Scrollable Bars Area (Strictly isolated, guaranteed no overflow leakage) */}
            <div
              style={{
                marginLeft: 32,
                height: 220,
                overflowX: chartFilter === 'semua' ? 'auto' : 'hidden',
                overflowY: 'hidden',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: chartFilter === 'aktif' ? 'center' : 'flex-start',
                  gap: chartFilter === 'aktif' ? 48 : 12,
                  minWidth: chartFilter === 'semua' ? displayChartData.length * 68 : '100%',
                  height: 155,
                  paddingTop: 20,
                }}
              >
                {displayChartData.map((d, idx) => {
                  const clampedVal = Math.min(20, Math.max(0, d.value))
                  const barHeightPx = Math.max(d.value > 0 ? 8 : 2, (clampedVal / 20) * 135)
                  const isOverMin = d.value >= 12
                  return (
                    <div
                      key={`bar-${idx}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: chartFilter === 'aktif' ? 88 : 56,
                        minWidth: chartFilter === 'aktif' ? 88 : 56,
                        height: 155,
                        position: 'relative',
                      }}
                      title={`${d.fullProdi}: ${d.value} SKS`}
                    >
                      {/* Exact Number Badge floating cleanly above bar */}
                      {d.value > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: isOverMin ? '#ea580c' : '#b45309',
                            marginBottom: 4,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {d.value} SKS
                        </span>
                      )}

                      {/* Bar Pill */}
                      <div
                        style={{
                          width: chartFilter === 'aktif' ? 38 : 24,
                          height: barHeightPx,
                          background: d.value === 0
                            ? '#e2e8f0'
                            : isOverMin
                            ? 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
                            : 'linear-gradient(180deg, #fdba74 0%, #f97316 100%)',
                          borderRadius: '4px 4px 1px 1px',
                          boxShadow: d.value > 0 ? '0 2px 4px rgba(234, 88, 12, 0.18)' : 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1.03)'
                          e.currentTarget.style.filter = 'brightness(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1)'
                          e.currentTarget.style.filter = 'none'
                        }}
                      />

                      {/* X Axis Label */}
                      <span
                        style={{
                          marginTop: 8,
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: d.value > 0 ? 'var(--ink)' : 'var(--muted)',
                          textAlign: 'center',
                          width: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}
                        title={d.fullProdi}
                      >
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Insights Footer Bar */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 10,
              borderTop: '1px solid var(--hair-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Kepatuhan SPMI Beban SKS</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                {spmiComplianceRate}% Terpenuhi
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--faint)', marginTop: 1 }}>{spmiCompliantCount} dari {activeProdisWithData.length} prodi &ge; 12 SKS</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Capaian Tertinggi Prodi</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 1 }}>
                {highestProdi.label}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--brand-700)', fontWeight: 600, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                Rata-rata {highestProdi.value} SKS / Dosen
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Rata-rata Universitas</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ea580c', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                {averageSksPt.toFixed(1)} SKS / Dosen
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--faint)', marginTop: 1 }}>Agregat seluruh program studi</div>
            </div>
          </div>
        </div>

        {/* Side Column: JAD Distribution & Deadline Action Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* JAD Summary with MUI PieChart */}
          <div
            className="dashboard-panel"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  Jabatan Fungsional Dosen (JAD)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 1 }}>
                  Distribusi kualifikasi akademik institusi
                </div>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 'var(--r-xs)',
                  background: 'var(--panel-hover)',
                  color: 'var(--navy-900)',
                }}
              >
                SPMI SDM
              </span>
            </div>

            {/* Pure SVG Donut Chart (Zero dependency, high performance, robust) */}
            <div style={{ height: 130, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {(() => {
                const totalJad = countGuruBesar + countLektorKepala + countLektor + countAsistenAhli || 1
                const radius = 45
                const circumference = 2 * Math.PI * radius
                const slices = [
                  { label: 'Guru Besar', count: countGuruBesar, color: '#0f223d' },
                  { label: 'Lektor Kepala', count: countLektorKepala, color: '#ea580c' },
                  { label: 'Lektor', count: countLektor, color: '#0284c7' },
                  { label: 'Asisten Ahli', count: countAsistenAhli, color: '#10b981' },
                ]
                let accumulated = 0

                return (
                  <svg width={130} height={130} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="18"
                    />
                    {slices.map((slice, idx) => {
                      const strokeDash = (slice.count / totalJad) * circumference
                      const offset = -accumulated
                      accumulated += strokeDash
                      if (slice.count === 0) return null
                      return (
                        <circle
                          key={`slice-${idx}`}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="18"
                          strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                          strokeDashoffset={offset}
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        >
                          <title>{`${slice.label}: ${slice.count} Dosen (${Math.round((slice.count / totalJad) * 100)}%)`}</title>
                        </circle>
                      )
                    })}
                  </svg>
                )
              })()}
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                  {totalDosen}
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Dosen
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 8 }}>
              <div style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', background: '#f8fafc', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0f223d' }} />
                  <span>Guru Besar</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {countGuruBesar} <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--muted)' }}>Dosen</span>
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', background: '#f8fafc', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c' }} />
                  <span>Lektor Kepala</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {countLektorKepala} <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--muted)' }}>Dosen</span>
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', background: '#f8fafc', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7' }} />
                  <span>Lektor</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {countLektor} <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--muted)' }}>Dosen</span>
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', background: '#f8fafc', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                  <span>Asisten Ahli</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {countAsistenAhli} <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--muted)' }}>Dosen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deadline reminder Card */}
          <div
            className="dashboard-panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--r-xs)',
                    background: 'var(--brand-100)',
                    color: 'var(--brand-700)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Clock size={14} />
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Jadwal Pengesahan SKP
                </span>
              </div>

              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.3 }}>
                Batas Akhir Validasi {activePeriode}
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                Seluruh SKP yang telah dinilai Kaprodi dan Dekan wajib disahkan paling lambat akhir semester pukul 23:59 WIB.
              </p>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                className="brand-btn brand-btn--dark"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  borderRadius: 'var(--r-md)',
                  fontSize: '12px',
                }}
                onClick={handleSendReminder}
              >
                <Send size={13} />
                <span>Kirim Pengingat Masal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Hub / Recent SKP Table Section */}
      <div
        id="section-tabel-skp"
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                Pusat Validasi &amp; Pengesahan SKP Dosen
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>
                Daftar pengajuan SKP dosen dari seluruh fakultas untuk diverifikasi dan diterbitkan Direktorat SDM
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                {filteredSkpList.length} Pengajuan Ditemukan
              </span>
            </div>
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
                { id: 'semua', label: 'Semua Status' },
                { id: 'perlu-sdm', label: 'Perlu Tindakan SDM', badge: skpMenungguSDM },
                { id: 'disahkan', label: 'Sah & Terbit' },
                { id: 'revisi', label: 'Perlu Revisi', badge: skpRevisi },
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
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
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

            {/* Global Search and Reset */}
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
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari nama dosen, NIP, prodi..."
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
                onClick={() => onNavigate('skp-dosen')}
                className="btn-back"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <span>Kelola Lengkap</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Dosen Pengusul</th>
                <th>Homebase Program Studi</th>
                <th>Periode Semester</th>
                <th>Target SKS</th>
                <th>Realisasi SKS (SPMI)</th>
                <th>Status Berkas</th>
                <th style={{ textAlign: 'right' }}>Aksi SDM</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSkp.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={28} style={{ color: 'var(--faint)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                        Tidak Ada Pengajuan SKP yang Cocok
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                        Silakan sesuaikan kata kunci pencarian atau pilih tab status lain di atas.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSkp.map((skp) => {
                  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM'].includes(skp.status)
                  const isReviewedKaprodi = ['Dinilai Kaprodi', 'Dinilai Dekan'].includes(skp.status)
                  const isSubmitted = skp.status === 'Diajukan'
                  const isRevisi = skp.status === 'Perlu Revisi'

                  const realisasi = skp.totalSksRealisasi || 0
                  const isSpmiMet = realisasi >= 12 && realisasi <= 16
                  const isSpmiUnder = realisasi < 12
                  const isSpmiOver = realisasi > 16

                  return (
                    <tr key={skp.id}>
                      {/* Dosen Pengusul with Avatar Initials */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 'var(--r-md)',
                              background: 'var(--navy-100)',
                              color: 'var(--navy-900)',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(skp.dosenNama)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{skp.dosenNama}</div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--muted)',
                                marginTop: 1,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              NIP: {skp.dosenNip || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Homebase Prodi */}
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--ink-secondary)',
                            display: 'inline-block',
                            background: '#f8fafc',
                            padding: '3px 8px',
                            borderRadius: 'var(--r-xs)',
                            border: '1px solid var(--hair)',
                            fontSize: '12.5px',
                          }}
                        >
                          {skp.dosenProdi}
                        </span>
                      </td>

                      {/* Periode */}
                      <td style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                        {skp.semester} {skp.tahunAkademik}
                      </td>

                      {/* Target SKS */}
                      <td style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {skp.totalSksRencana || 0} SKS
                      </td>

                      {/* Realisasi SKS with SPMI Pill */}
                      <td>
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
                      </td>

                      {/* Status Berkas */}
                      <td>
                        {isSah ? (
                          <span className="badge-pill badge-pill--green">
                            <CheckCircle2 size={12} />
                            <span>Sah &amp; Terbit</span>
                          </span>
                        ) : isReviewedKaprodi ? (
                          <span className="badge-pill badge-pill--blue">
                            <CheckCircle size={12} />
                            <span>Dinilai Kaprodi / Dekan</span>
                          </span>
                        ) : isSubmitted ? (
                          <span className="badge-pill badge-pill--orange">
                            <Clock size={12} />
                            <span>Diajukan Dosen</span>
                          </span>
                        ) : isRevisi ? (
                          <span className="badge-pill badge-pill--red">
                            <AlertCircle size={12} />
                            <span>Perlu Revisi</span>
                          </span>
                        ) : (
                          <span className="badge-pill badge-pill--gray">
                            <span>{skp.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={isReviewedKaprodi ? 'brand-btn' : 'btn-action-view'}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            borderRadius: 'var(--r-sm)',
                          }}
                          onClick={() => onSelectSKPToReview(skp)}
                        >
                          <span>{isReviewedKaprodi ? 'Sahkan SKP' : 'Periksa'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <TablePagination
          totalItems={filteredSkpList.length}
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
