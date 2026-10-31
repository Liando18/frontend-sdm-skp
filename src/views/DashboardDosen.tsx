import React, { useRef, useState, useMemo } from 'react'
import {
  FileCheck2,
  TrendingUp,
  Award,
  CheckCircle,
  FileText,
  ChevronRight,
  BookOpen,
  Check,
  Clock,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Filter,
} from 'lucide-react'
import { UserSession, PengajuanSKP, PenilaianKuesioner } from '../types'
import { getAvatarSrc } from '../utils/security'
import { useStaggerEntrance, useGSAP, gsap, GSAP_EASE, useCountUp, useInteractiveCards } from '../utils/animations'

interface DashboardDosenProps {
  user: UserSession
  mySKP?: PengajuanSKP
  skpList?: PengajuanSKP[]
  penilaianList?: PenilaianKuesioner[]
  onNavigateToSKP: () => void
  onNavigateToHasilKinerja?: () => void
  onNavigateToProfil?: () => void
  onNavigateToPanduan?: () => void
}

export const DashboardDosen: React.FC<DashboardDosenProps> = ({
  user,
  mySKP,
  skpList = [],
  penilaianList = [],
  onNavigateToSKP,
  onNavigateToHasilKinerja,
  onNavigateToProfil,
}) => {
  // Extract all available academic years from database skpList, fallback to current institutional years
  const availableTahunList = useMemo(() => {
    const fromDb = Array.from(new Set(skpList.map((s) => s.tahunAkademik).filter(Boolean)))
    const standard = ['2026/2027', '2025/2026', '2024/2025']
    const merged = Array.from(new Set([...fromDb, ...standard]))
    return merged.sort().reverse()
  }, [skpList])

  // Filter state for Semester and Tahun Ajaran
  const [selectedSemester, setSelectedSemester] = useState<'Genap' | 'Ganjil'>(
    (mySKP?.semester as 'Genap' | 'Ganjil') || 'Genap'
  )
  const [selectedTahun, setSelectedTahun] = useState<string>(
    mySKP?.tahunAkademik || availableTahunList[0] || '2025/2026'
  )

  // Find exact SKP from database matching this lecturer, semester & tahun ajaran
  const currentSKP = useMemo(() => {
    const list = skpList.length > 0 ? skpList : mySKP ? [mySKP] : []
    return (
      list.find(
        (s) =>
          (s.dosenId === user.id ||
            s.dosenNama === user.name ||
            (user.nip && s.dosenNip === user.nip)) &&
          s.semester === selectedSemester &&
          s.tahunAkademik === selectedTahun
      ) ||
      (mySKP && mySKP.semester === selectedSemester && mySKP.tahunAkademik === selectedTahun
        ? mySKP
        : undefined)
    )
  }, [skpList, user, selectedSemester, selectedTahun, mySKP])

  // Real database values (strictly 0 or '-' if no data)
  const hasSKP = Boolean(currentSKP)
  const skpStatus = currentSKP?.status || 'Belum Mengajukan'
  const realisasiSks = currentSKP?.totalSksRealisasi ?? 0
  const rencanaSks = currentSKP?.totalSksRencana ?? 0
  const capaianPersen = currentSKP?.persentaseCapaian ?? 0

  // Real BerAKHLAK questionnaire evaluation from database
  const myPenilaian = penilaianList.find(
    (p) => p.dosenId === user.id || p.dosenNama === user.name
  )
  const kuisScore = myPenilaian ? Number(myPenilaian.rataRata.toFixed(2)) : 0
  const kuisPredikat = myPenilaian?.predikat || (kuisScore > 0 ? (kuisScore >= 3.5 ? 'Sangat Baik' : kuisScore >= 2.5 ? 'Baik' : 'Cukup') : '-')

  // Real uploaded proof documents in current SKP
  const totalBerkas = currentSKP?.items
    ? currentSKP.items.reduce((acc, it) => acc + (it.linkDokumen ? 1 : 0), 0)
    : 0
  const displayBerkas = totalBerkas

  // 4 Pilar Tridharma items strictly from database items (if empty, empty array, no fake fallback!)
  const progressItems = useMemo(() => {
    if (!currentSKP?.items || currentSKP.items.length === 0) {
      return []
    }
    return currentSKP.items.map((it, idx) => ({
      label: it.kegiatan,
      kategori: it.kategori || 'Tridharma',
      target: `${it.rencanaAwal ?? 0} ${it.satuan || 'SKS'}`,
      realisasi: `${it.realisasi ?? 0} ${it.satuan || 'SKS'}`,
      val: it.kualitasMutu || it.nilaiCapaian || 0,
      color: idx % 2 === 0 ? 'var(--brand-600)' : 'var(--navy-800)',
      hasLink: Boolean(it.linkDokumen),
    }))
  }, [currentSKP])

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 12, stagger: 0.05 })
  useCountUp(containerRef, '.kpi-count-up', [realisasiSks, capaianPersen, displayBerkas])
  useInteractiveCards(containerRef, '.kpi-card')

  useGSAP(
    () => {
      if (!containerRef.current) return
      const bars = containerRef.current.querySelectorAll('.tridharma-progress-bar')
      if (bars.length) {
        gsap.from(bars, {
          width: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: GSAP_EASE.smooth,
        })
      }
    },
    { scope: containerRef, dependencies: [progressItems] }
  )

  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi'].includes(skpStatus)
  const isSubmitted = ['Diajukan', 'Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi', 'Perlu Revisi'].includes(skpStatus)
  const isRevisi = skpStatus === 'Perlu Revisi'

  // Stepper states derived strictly from active SKP
  const steps = [
    {
      step: '1',
      title: 'Perencanaan',
      desc: 'Beban SKS Tridharma',
      status: !hasSKP || skpStatus === 'Draft' ? 'active' : 'completed',
    },
    {
      step: '2',
      title: 'Pengajuan & Bukti',
      desc: 'Tautan Google Drive',
      status: !hasSKP || skpStatus === 'Draft' ? 'pending' : isRevisi ? 'warning' : isSubmitted ? 'completed' : 'active',
    },
    {
      step: '3',
      title: 'Verifikasi Pimpinan',
      desc: 'Ka.Prodi & Dekan',
      status: isSah ? 'completed' : isSubmitted && !isRevisi ? 'active' : 'pending',
    },
    {
      step: '4',
      title: 'Sah & Terbit',
      desc: 'Pengesahan SDM',
      status: isSah ? 'completed' : 'pending',
    },
  ]

  return (
    <div className="page-container" ref={containerRef}>
      {/* Profile Welcome Banner (Spacious, Elegant & Balanced) */}
      <div className="dashboard-banner">
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
                if (!target.src.endsWith('/user.png')) {
                  target.src = '/user.png'
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-700)',
                  background: 'var(--brand-100)',
                  padding: '3px 8px',
                  borderRadius: 'var(--r-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Dosen UBK
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--navy-900)',
                  background: 'var(--navy-100)',
                  padding: '3px 8px',
                  borderRadius: 'var(--r-xs)',
                }}
              >
                {user.prodi || '-'}
              </span>
              {user.rank && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: 'var(--r-xs)',
                  }}
                >
                  {user.rank}
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: 'clamp(19px, 2.2vw, 23px)',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                margin: '0 0 4px 0',
                lineHeight: 1.3,
              }}
            >
              Selamat Datang, {user.name}
            </h1>

            <div style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', lineHeight: 1.5 }}>
              <span>NIP: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{user.nip || '-'}</strong></span>
              {user.nuptk && (
                <>
                  <span style={{ color: 'var(--hair-strong)' }}>&bull;</span>
                  <span>NUPTK: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{user.nuptk}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onNavigateToSKP}
            className="brand-btn"
            style={{ padding: '9px 18px', borderRadius: 'var(--r-md)', fontSize: '13px', fontWeight: 700 }}
          >
            <FileCheck2 size={15} />
            <span>Kelola SKP Semester Ini</span>
          </button>
        </div>
      </div>

      {/* Alur Tahapan Pengesahan SKP with Period Filter */}
      <div className="dashboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
              Alur Tahapan Pengesahan &amp; Penerbitan SKP Tridharma
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>
              Pantau posisi berkas SKP Anda dalam siklus evaluasi institusional
            </div>
          </div>

          {/* Filter Semester & Tahun Ajaran */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                onChange={(e) => setSelectedSemester(e.target.value as 'Genap' | 'Ganjil')}
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
                {availableTahunList.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>
            </div>

            <span
              className={`badge-pill ${
                isSah
                  ? 'badge-pill--green'
                  : isRevisi
                  ? 'badge-pill--red'
                  : isSubmitted
                  ? 'badge-pill--orange'
                  : 'badge-pill--gray'
              }`}
            >
              {isSah ? <CheckCircle size={12} /> : isRevisi ? <AlertCircle size={12} /> : <Clock size={12} />}
              <span>Status: {isSah ? 'Sah & Terbit' : hasSKP ? skpStatus : 'Belum Mengajukan'}</span>
            </span>
          </div>
        </div>

        {/* Stepper Grid (Strictly 4 cols on desktop, 2x2 on tablet, 1 on mobile) */}
        <div className="stepper-grid-4">
          {steps.map((s, idx) => {
            const isCompleted = s.status === 'completed'
            const isActive = s.status === 'active'
            const isWarning = s.status === 'warning'

            return (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.06)'
                    : isWarning
                    ? 'rgba(239, 68, 68, 0.06)'
                    : isActive
                    ? 'rgba(234, 88, 12, 0.07)'
                    : '#f8fafc',
                  border: isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isWarning
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : isActive
                    ? '1px solid rgba(234, 88, 12, 0.35)'
                    : '1px solid var(--hair)',
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
                      background: isCompleted
                        ? '#10b981'
                        : isWarning
                        ? '#ef4444'
                        : isActive
                        ? '#ea580c'
                        : 'var(--hair-strong)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? <Check size={12} /> : isWarning ? '!' : s.step}
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
                      color: isCompleted
                        ? '#15803d'
                        : isWarning
                        ? '#b91c1c'
                        : isActive
                        ? '#c2410c'
                        : 'var(--muted)',
                    }}
                  >
                    {isCompleted
                      ? 'Tuntas'
                      : isWarning
                      ? 'Perlu Revisi'
                      : isActive
                      ? 'Sedang Berlangsung'
                      : '-'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* KPI Bento Grid (4 Cards - Tight & Responsive) */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Status SKP */}
        <div className="kpi-card kpi-card--hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              Status SKP ({selectedSemester})
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={onNavigateToSKP}
              aria-label="Kelola SKP"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div className="kpi-stat-number">
              {isSah ? 'Sah & Terbit' : isRevisi ? 'Perlu Revisi' : hasSKP ? skpStatus : 'Belum Ada'}
            </div>

            <div style={{ marginTop: 6 }}>
              {isSah ? (
                <span className="kpi-badge" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#dcfce7' }}>
                  <ShieldCheck size={11} />
                  <span>Terverifikasi SPMI</span>
                </span>
              ) : isRevisi ? (
                <span className="kpi-badge" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fee2e2' }}>
                  <AlertCircle size={11} />
                  <span>Perlu Perbaikan Bukti</span>
                </span>
              ) : isSubmitted ? (
                <span className="kpi-badge" style={{ background: 'rgba(234, 88, 12, 0.25)', color: '#ffedd5' }}>
                  <Clock size={11} />
                  <span>Dinilai Pimpinan</span>
                </span>
              ) : (
                <span className="kpi-badge" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                  <FileText size={11} />
                  <span>{hasSKP ? 'Tahap Rencana' : 'Belum Ada Berkas'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Beban Kerja Dosen (BKD SKS) */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Beban Kerja Dosen (BKD)
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color:
                  realisasiSks >= 12
                    ? 'var(--status-success-ink)'
                    : realisasiSks > 0
                    ? 'var(--status-danger-ink)'
                    : 'var(--muted)',
                background:
                  realisasiSks >= 12
                    ? 'var(--status-success-bg)'
                    : realisasiSks > 0
                    ? 'var(--status-danger-bg)'
                    : 'var(--panel-hover)',
                padding: '1px 5px',
                borderRadius: 'var(--r-xs)',
              }}
            >
              {realisasiSks >= 12 ? 'Standar SPMI' : realisasiSks > 0 ? '< 12 SKS' : '0 SKS'}
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-count-up kpi-stat-number" data-count={realisasiSks} style={{ color: 'var(--ink)' }}>
                {realisasiSks}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / {rencanaSks} SKS
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              {realisasiSks >= 12 ? (
                <span className="badge-pill badge-pill--green">
                  <TrendingUp size={11} />
                  <span>Min. 12 SKS Terpenuhi</span>
                </span>
              ) : realisasiSks > 0 ? (
                <span className="badge-pill badge-pill--red">
                  <AlertTriangle size={11} />
                  <span>Kurang {12 - realisasiSks} SKS</span>
                </span>
              ) : (
                <span className="badge-pill badge-pill--gray">
                  <Clock size={11} />
                  <span>Standar SPMI: Min. 12 SKS</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Evaluasi Perilaku BerAKHLAK */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Evaluasi BerAKHLAK
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--brand-700)',
                background: 'var(--brand-100)',
                padding: '1px 5px',
                borderRadius: 'var(--r-xs)',
              }}
            >
              360
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-stat-number" style={{ color: 'var(--ink)' }}>
                {kuisScore > 0 ? kuisScore.toFixed(2) : '-'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                / 4.00
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              {kuisScore > 0 ? (
                <span className="badge-pill badge-pill--orange">
                  <Award size={11} />
                  <span>Predikat: {kuisPredikat}</span>
                </span>
              ) : (
                <span className="badge-pill badge-pill--gray">
                  <Clock size={11} />
                  <span>Belum Dinilai</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Dokumen Bukti */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Bukti Tridharma
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--status-info-ink)',
                background: 'var(--status-info-bg)',
                padding: '1px 5px',
                borderRadius: 'var(--r-xs)',
              }}
            >
              Drive
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kpi-count-up kpi-stat-number" data-count={displayBerkas} style={{ color: 'var(--ink)' }}>
                {displayBerkas}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>

            <div style={{ marginTop: 6 }}>
              {displayBerkas > 0 ? (
                <span className="badge-pill badge-pill--blue">
                  <FileText size={11} />
                  <span>Tautan Siap Diperiksa</span>
                </span>
              ) : (
                <span className="badge-pill badge-pill--gray">
                  <AlertCircle size={11} />
                  <span>Belum Ada Dokumen</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Capaian Tridharma (Full Width) */}
      <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
              Progress Capaian Tridharma Perguruan Tinggi
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
              Semester {selectedSemester} {selectedTahun} &bull; Capaian Keseluruhan: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{capaianPersen}%</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge-pill ${capaianPersen >= 80 ? 'badge-pill--green' : capaianPersen > 0 ? 'badge-pill--orange' : 'badge-pill--gray'}`}>
              <CheckCircle size={11} />
              <span>{capaianPersen >= 80 ? 'Memenuhi Standar Mutu' : capaianPersen > 0 ? 'Dalam Pelaksanaan' : '0%'}</span>
            </span>

            <button
              onClick={onNavigateToSKP}
              className="brand-btn brand-btn--outline"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '12px',
                fontWeight: 600,
                background: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FileText size={13} />
              <span>Kelola SKP</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {progressItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                color: 'var(--muted)',
                background: '#f8fafc',
                borderRadius: 'var(--r-md)',
                border: '1px dashed var(--hair-strong)',
              }}
            >
              <BookOpen size={28} style={{ color: 'var(--faint)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                Belum Ada Rincian Kegiatan Tridharma
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 3, maxWidth: 460, margin: '3px auto 14px' }}>
                Tidak ada rincian beban kegiatan SKP pada periode Semester {selectedSemester} {selectedTahun} (0 SKS).
              </div>
              <button
                onClick={onNavigateToSKP}
                className="brand-btn"
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, margin: '0 auto' }}
              >
                <FileCheck2 size={14} />
                <span>Mulai Isi Sasaran Kinerja (SKP)</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 12,
              }}
            >
              {progressItems.map((tridharma, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--hair)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>
                        {tridharma.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>Target: <strong>{tridharma.target}</strong></span>
                        <span>&bull;</span>
                        <span>Realisasi: <strong style={{ color: 'var(--brand-700)' }}>{tridharma.realisasi}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {tridharma.hasLink ? (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: '#0369a1',
                            background: '#e0f2fe',
                            padding: '1px 6px',
                            borderRadius: 'var(--r-xs)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <FileText size={10} />
                          <span>Bukti Ada</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: 'var(--faint)' }}>-</span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                        {tridharma.val}%
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="tridharma-progress-bar"
                      style={{
                        height: '100%',
                        width: `${Math.min(tridharma.val, 100)}%`,
                        background: tridharma.color,
                        borderRadius: 3,
                        transition: 'width 0.4s var(--ease)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
