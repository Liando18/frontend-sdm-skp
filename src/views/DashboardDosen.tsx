import React, { useRef } from 'react'
import {
  FileCheck2,
  TrendingUp,
  Award,
  CheckCircle,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { UserSession, PengajuanSKP } from '../types'
import { useStaggerEntrance, useGSAP, gsap, GSAP_EASE, useCountUp, useInteractiveCards } from '../utils/animations'

interface DashboardDosenProps {
  user: UserSession
  mySKP?: PengajuanSKP
  onNavigateToSKP: () => void
  onNavigateToHasilKinerja?: () => void
}

export const DashboardDosen: React.FC<DashboardDosenProps> = ({
  user,
  mySKP,
  onNavigateToSKP,
  onNavigateToHasilKinerja,
}) => {
  const skpStatus = mySKP?.status || 'Disetujui SDM'
  const realisasiSks = mySKP?.totalSksRealisasi || 16
  const rencanaSks = mySKP?.totalSksRencana || 16
  const capaianPersen = mySKP?.persentaseCapaian || 100

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up', [realisasiSks, capaianPersen])
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
    { scope: containerRef }
  )

  return (
    <div className="page-container" ref={containerRef}>
      {/* Profile Welcome Banner */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '28px 32px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--r-full)',
              background: 'var(--navy-900)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '20px',
              display: 'grid',
              placeItems: 'center',
              border: '2px solid var(--hair)',
            }}
          >
            {user.avatar}
          </div>
          <div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--brand-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Portal Kinerja Dosen UBK
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                marginTop: 2,
              }}
            >
              Selamat Datang, {user.name}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 2 }}>
              NIP: {user.nip} &bull; Homebase: {user.prodi} &bull; {user.rank}
            </div>
          </div>
        </div>

        <button onClick={onNavigateToSKP} className="brand-btn" style={{ padding: '10px 20px' }}>
          <FileCheck2 size={16} />
          <span>Kelola SKP Semester Ini</span>
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Status SKP */}
        <div className="kpi-card kpi-card--hero">
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
            Status SKP Semester Genap
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {skpStatus}
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="kpi-badge">
                <CheckCircle size={12} />
                <span>Terverifikasi SPMI UBK</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Realisasi BKD */}
        <div className="kpi-card">
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Beban Kerja Dosen (BKD)
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count={realisasiSks}>{realisasiSks}</span> <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--muted)' }}>/ {rencanaSks} SKS</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-ink)',
                }}
              >
                <TrendingUp size={12} />
                <span>Target Min 12 SKS Terpenuhi</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Evaluasi BerAKHLAK */}
        <div className="kpi-card">
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Evaluasi Perilaku (BerAKHLAK)
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count="3.86">3.86</span> <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>/ 4.00</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--brand-100)',
                  color: 'var(--brand-700)',
                }}
              >
                <Award size={12} />
                <span>Predikat Sangat Baik</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Dokumen Bukti */}
        <div className="kpi-card">
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Dokumen Bukti Terunggah
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count="8">8</span> <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-info-bg)',
                  color: 'var(--status-info-ink)',
                }}
              >
                <FileText size={12} />
                <span>100% Bukti Fisik Valid</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Tridharma Progress & Evaluasi Pimpinan */}
      <div className="responsive-split">
        {/* Left: Tridharma Progress */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--r-xl)',
            padding: '24px 28px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                Progress Tridharma Perguruan Tinggi
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                Sasaran Kinerja Semester Genap 2025/2026 &bull; Capaian {capaianPersen}%
              </div>
            </div>
            <span className="badge-pill badge-pill--green">Memenuhi Standar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              {
                label: 'Pendidikan & Pengajaran',
                sub: 'Perkuliahan tatap muka, RPS, BAP & penilaian Siakad',
                val: 94,
                color: 'var(--brand-600)',
              },
              {
                label: 'Bimbingan Seminar & Skripsi',
                sub: '4 Mahasiswa bimbingan tugas akhir & naskah publikasi',
                val: 100,
                color: 'var(--navy-800)',
              },
              {
                label: 'Penelitian & Publikasi Jurnal',
                sub: '1 Naskah Jurnal Nasional Terakreditasi SINTA 2',
                val: 100,
                color: 'var(--brand-700)',
              },
              {
                label: 'Pengabdian kepada Masyarakat (PKM)',
                sub: 'Bimbingan desa sehat binaan Farmasi UBK',
                val: 100,
                color: 'var(--navy-900)',
              },
            ].map((tridharma, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                      {tridharma.label}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 8 }}>
                      {tridharma.sub}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    {tridharma.val}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="tridharma-progress-bar"
                    style={{
                      height: '100%',
                      width: `${tridharma.val}%`,
                      background: tridharma.color,
                      borderRadius: 4,
                      transition: 'width 0.4s var(--ease)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Catatan Evaluasi & Navigasi */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--r-xl)',
            padding: '24px 28px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
              Catatan Evaluasi Pimpinan
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 16 }}>
              Umpan balik dari Ketua Program Studi &amp; Direktorat SDM
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
                fontSize: '13px',
                color: 'var(--ink-secondary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              "{mySKP?.catatanKaprodi || 'Seluruh luaran Tridharma telah sesuai dengan standar SPMI UBK dan telah diverifikasi lengkap oleh Ketua Program Studi.'}"
            </div>

            <div style={{ marginTop: 14, fontSize: '12px', color: 'var(--muted)' }}>
              Terakhir diperbarui: <strong>20 Oktober 2026</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={onNavigateToSKP}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--brand-100)',
                color: 'var(--brand-700)',
                border: '1px solid var(--brand-500)',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              <span>Buka Formulir SKP Saya</span>
              <ChevronRight size={16} />
            </button>
            {onNavigateToHasilKinerja && (
              <button
                onClick={onNavigateToHasilKinerja}
                className="btn-action-view"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 18px',
                  borderRadius: 'var(--r-lg)',
                  fontSize: '13.5px',
                  boxShadow: 'none',
                }}
              >
                <span>Lihat Hasil Kinerja Tahunan</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
