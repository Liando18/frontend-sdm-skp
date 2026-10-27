import React, { useRef } from 'react'
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Award,
  ChevronRight,
  FileCheck2,
  FileText,
} from 'lucide-react'
import { UserSession, PengajuanSKP, Dosen, PenilaianKuesioner } from '../types'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'

interface DashboardKaprodiProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  penilaianList?: PenilaianKuesioner[]
  onNavigateToSKP?: () => void
  onNavigateToReview: () => void
  onNavigateToKuesioner?: () => void
  onNavigateToHasilKinerjaSelf?: () => void
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
  onSelectSKP,
}) => {
  const prodiDosen = dosenList.filter((d) => d.prodi === user.prodi)
  const totalProdiDosen = prodiDosen.length

  const prodiSKP = skpList.filter(
    (s) => s.dosenProdi === user.prodi
  )
  const pendingReview = prodiSKP.filter((s) => s.status === 'Diajukan').length
  const approvedReview = prodiSKP.filter(
    (s) => s.status === 'Dinilai Kaprodi' || s.status === 'Disetujui SDM'
  ).length

  const prodiDosenIds = prodiDosen.map((d) => d.id)
  const prodiPenilaianCount = penilaianList.filter(
    (p) => prodiDosenIds.includes(p.dosenId) || p.dosenProdi === user.prodi
  ).length
  const kuisPersen = totalProdiDosen > 0 ? ((prodiPenilaianCount / totalProdiDosen) * 100).toFixed(1) : '0'

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up', [totalProdiDosen, pendingReview, approvedReview, prodiPenilaianCount])
  useInteractiveCards(containerRef, '.kpi-card')
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [skpList], { y: 8, stagger: 0.04, delay: 0.15 })

  return (
    <div className="page-container" ref={containerRef}>
      {/* Kaprodi Welcome Banner */}
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
              Ketua Program Studi
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
              Dashboard {user.prodi}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 2 }}>
              {user.name} &bull; NIP: {user.nip}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {onNavigateToSKP && (
            <button
              onClick={onNavigateToSKP}
              className="brand-btn brand-btn--outline"
              style={{ padding: '9px 16px', background: '#ffffff' }}
            >
              <FileText size={15} />
              <span>SKP Saya</span>
            </button>
          )}
          {onNavigateToHasilKinerjaSelf && (
            <button
              onClick={onNavigateToHasilKinerjaSelf}
              className="btn-action-view"
              style={{ padding: '9px 16px' }}
            >
              <Award size={15} />
              <span>Hasil Kinerja Tahunan</span>
            </button>
          )}
          <button onClick={onNavigateToReview} className="btn-action-view" style={{ padding: '9px 18px' }}>
            <FileCheck2 size={15} />
            <span>Verifikasi SKP Dosen</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="kpi-bento-grid-4">
        {/* Card 1: Dosen Homebase */}
        <div className="kpi-card kpi-card--hero">
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
            Dosen Homebase Prodi
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count={totalProdiDosen}>{totalProdiDosen}</span> <span style={{ fontSize: '18px', fontWeight: 500 }}>Dosen</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="kpi-badge">
                <Users size={12} />
                <span>Homebase {user.prodi}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Menunggu Review */}
        <div className="kpi-card">
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Menunggu Review Kaprodi
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count={pendingReview}>{pendingReview}</span> <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-warning-bg)',
                  color: 'var(--status-warning-ink)',
                }}
              >
                <Clock size={12} />
                <span>Siap Diverifikasi &amp; Dinilai</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Telah Dinilai */}
        <div className="kpi-card">
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Telah Dinilai &amp; Disetujui
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="kpi-count-up" data-count={approvedReview}>{approvedReview}</span> <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>Dosen</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-ink)',
                }}
              >
                <CheckCircle size={12} />
                <span>Sesuai SPMI Fakultas</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Kuesioner Perilaku */}
        <div
          className="kpi-card"
          onClick={onNavigateToKuesioner}
          style={{ cursor: onNavigateToKuesioner ? 'pointer' : 'default' }}
        >
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Kuesioner Perilaku Terisi
          </span>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {prodiPenilaianCount} <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>/ {totalProdiDosen}</span>
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
                <span>{kuisPersen}% Partisipasi</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lecturers Table Card */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
              Daftar Dosen Prodi {user.prodi}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              Verifikasi sasaran kinerja semester genap dan berikan penilaian perilaku Tridharma
            </div>
          </div>

          <button
            onClick={onNavigateToReview}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-600)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Buka Panel Review SKP Lengkap</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nama Dosen</th>
                <th>Jabatan Fungsional</th>
                <th>Target SKS</th>
                <th>Realisasi SKS</th>
                <th>Status SKP</th>
                <th style={{ textAlign: 'right' }}>Aksi Review</th>
              </tr>
            </thead>
            <tbody>
              {prodiDosen.map((dosen) => {
                const skp = skpList.find((s) => s.dosenId === dosen.id)
                return (
                  <tr key={dosen.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{dosen.nama}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>NUPTK: {dosen.nuptk || '-'}</div>
                    </td>
                    <td>{dosen.jafung} ({dosen.golongan})</td>
                    <td>{skp ? `${skp.totalSksRencana} SKS` : '-'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--brand-700)' }}>
                        {skp ? `${skp.totalSksRealisasi} SKS` : '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-pill ${
                          dosen.skpStatus === 'Disetujui SDM'
                            ? 'badge-pill--green'
                            : dosen.skpStatus === 'Dinilai Kaprodi'
                            ? 'badge-pill--blue'
                            : 'badge-pill--orange'
                        }`}
                      >
                        {dosen.skpStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action-view"
                        style={{ padding: '6px 14px', fontSize: '12.5px' }}
                        onClick={() => {
                          if (skp) onSelectSKP(skp)
                          else onNavigateToReview()
                        }}
                      >
                        <FileCheck2 size={13} />
                        <span>Verifikasi SKP</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
