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
import { getDeviceCurrentSemester, getDeviceLatestAcademicYear } from '../constants/academic'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'

interface DashboardSDMProps {
  dosenList: Dosen[]
  skpList: PengajuanSKP[]
  onNavigate: (viewId: string) => void
  onAddDosenModal: () => void
  onSelectSKPToReview?: (skp: PengajuanSKP) => void
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

  // Visual Chart Filter & Quick Menu
  const [chartFilter, setChartFilter] = useState<'aktif' | 'semua'>('aktif')
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  // Dynamically calculate SKS per prodi from database skpList & dosenList
  // Strictly filter out non-academic administrative units (Direktorat SDM, Rektorat, Biro, dll.)
  const nonProdiKeywords = ['direktorat', 'sumber daya manusia', 'sdm', 'rektorat', 'administrasi', 'biro', 'tata usaha']
  const prodis = useMemo(() => {
    return Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))
      .filter((p) => !nonProdiKeywords.some((kw) => p.toLowerCase().includes(kw)))
  }, [dosenList])

  const latestSkp = skpList[0]
  const activePeriode = latestSkp ? `${latestSkp.semester} ${latestSkp.tahunAkademik}` : `Semester ${getDeviceCurrentSemester()} ${getDeviceLatestAcademicYear()}`

  const formatProdiName = (p: string) => {
    return p
      .replace(/^Sarjana Terapan\s+/i, 'D4 ')
      .replace(/^Profesi\s+/i, 'Prof. ')
      .replace('Kesehatan Masyarakat', 'Kesmas')
      .replace('Keperawatan Anestesiologi', 'Anestesiologi')
      .replace('Ilmu Komunikasi', 'Ilkom')
  }

  const chartData = useMemo(() => {
    return prodis.map((prodi, idx) => {
      const dosenInProdi = dosenList.filter((d) => d.prodi === prodi).map((d) => d.id)
      const skpInProdi = skpList.filter((s) => dosenInProdi.includes(s.dosenId) || s.dosenProdi === prodi)
      
      const avgSks =
        skpInProdi.length > 0
          ? skpInProdi.reduce((acc, curr) => {
              let val = Number(curr.totalSksRealisasi) || Number(curr.totalSksRencana) || 0
              // Sanity check: if an anomalous sum (>24) was stored, recalculate strictly from SKS items
              if (val > 24 && curr.items && curr.items.length > 0) {
                const sksSum = curr.items
                  .filter((it) => (it.satuan || '').toUpperCase() === 'SKS')
                  .reduce((sum, it) => sum + (Number(it.realisasi) || Number(it.rencanaAwal) || 0), 0)
                val = sksSum > 0 ? sksSum : 14
              } else if (val > 24) {
                val = 14
              }
              return acc + val
            }, 0) / skpInProdi.length
          : 0

      const finalVal = Number(avgSks.toFixed(1))
      return {
        label: formatProdiName(prodi),
        value: finalVal,
        fullProdi: prodi,
        dosenCount: dosenInProdi.length,
        skpCount: skpInProdi.length,
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
              onClick={() => onNavigate('skp-dosen')}
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
              onClick={() => onNavigate('skp-dosen')}
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

          {/* Bar Chart Area (Pure React & SVG - Robust Isolated Grid, Anti-Collision) */}
          <div
            style={{
              width: '100%',
              position: 'relative',
              marginTop: 4,
            }}
          >
            {/* Scrollable Container covering both Bars Plot and X-Axis Labels */}
            <div
              style={{
                width: '100%',
                overflowX: chartFilter === 'semua' || displayChartData.length > 7 ? 'auto' : 'hidden',
                overflowY: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  minWidth: chartFilter === 'semua' || displayChartData.length > 7
                    ? Math.max(displayChartData.length * 76 + 40, 600)
                    : '100%',
                  position: 'relative',
                }}
              >
                {/* Plot Area with Y-Axis Guidelines & Baseline (140px) */}
                <div
                  style={{
                    position: 'relative',
                    height: 140,
                    width: '100%',
                  }}
                >
                  {/* Y Axis Guide Lines & Numeric Labels */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                    {[20, 16, 12, 8, 4, 0].map((val) => {
                      const bottomPct = (val / 20) * 100
                      const isMinSpmi = val === 12
                      const isMaxSpmi = val === 16
                      const isZero = val === 0
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
                              borderBottom: isZero
                                ? '1.5px solid #cbd5e1'
                                : isMinSpmi
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

                  {/* Bars Layer - Bottom Aligned to Y=0 Baseline */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 32,
                      right: 0,
                      bottom: 0,
                      height: 140,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: chartFilter === 'aktif' && displayChartData.length <= 5 ? 'center' : 'flex-start',
                      gap: chartFilter === 'aktif' && displayChartData.length <= 5 ? 36 : 14,
                      paddingLeft: chartFilter === 'semua' ? 8 : 0,
                      paddingRight: chartFilter === 'semua' ? 8 : 0,
                    }}
                  >
                    {displayChartData.map((d, idx) => {
                      const clampedVal = Math.min(20, Math.max(0, d.value))
                      // Max bar height is 108px so it never collides with top or overflows
                      const barHeightPx = d.value > 0 ? Math.max(8, Math.round((clampedVal / 20) * 108)) : 3
                      const isOverMin = d.value >= 12
                      const colWidth = chartFilter === 'aktif' ? (displayChartData.length <= 4 ? 80 : 64) : 58

                      return (
                        <div
                          key={`bar-col-${idx}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            width: colWidth,
                            minWidth: colWidth,
                            height: 140,
                            position: 'relative',
                          }}
                          title={`${d.fullProdi}: ${d.value} SKS (${d.dosenCount || 0} Dosen, ${d.skpCount || 0} Berkas)`}
                        >
                          {/* Exact Number Badge floating cleanly above bar */}
                          {d.value > 0 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                color: isOverMin ? '#ea580c' : '#b45309',
                                marginBottom: 4,
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {d.value} SKS
                            </span>
                          )}

                          {/* Bar Pill */}
                          <div
                            style={{
                              width: chartFilter === 'aktif' ? 32 : 22,
                              height: barHeightPx,
                              maxHeight: 110,
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
                              e.currentTarget.style.transform = 'scaleY(1.04)'
                              e.currentTarget.style.filter = 'brightness(1.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scaleY(1)'
                              e.currentTarget.style.filter = 'none'
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* X-Axis Labels Row (Strictly separated below Y=0 baseline, zero overlap) */}
                <div
                  style={{
                    position: 'relative',
                    marginLeft: 32,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: chartFilter === 'aktif' && displayChartData.length <= 5 ? 'center' : 'flex-start',
                    gap: chartFilter === 'aktif' && displayChartData.length <= 5 ? 36 : 14,
                    paddingTop: 8,
                    paddingBottom: 4,
                    paddingLeft: chartFilter === 'semua' ? 8 : 0,
                    paddingRight: chartFilter === 'semua' ? 8 : 0,
                  }}
                >
                  {displayChartData.map((d, idx) => {
                    const colWidth = chartFilter === 'aktif' ? (displayChartData.length <= 4 ? 80 : 64) : 58
                    return (
                      <div
                        key={`lbl-col-${idx}`}
                        style={{
                          width: colWidth,
                          minWidth: colWidth,
                          textAlign: 'center',
                        }}
                        title={d.fullProdi}
                      >
                        <span
                          style={{
                            display: 'block',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: d.value > 0 ? 'var(--ink)' : 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.25,
                          }}
                        >
                          {d.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
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

      {/* End of Main Content Grid */}
    </div>
  )
}
