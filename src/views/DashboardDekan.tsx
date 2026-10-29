import React, { useRef, useState, useMemo } from 'react'
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
} from 'lucide-react'
import { UserSession, PengajuanSKP, Dosen } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'

interface DashboardDekanProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  onNavigateToSKP?: () => void
  onNavigateToReview: () => void
  onNavigateToEvaluasiKaprodi?: () => void
  onNavigateToHasilKinerjaSelf?: () => void
  onShowToast?: (msg: string) => void
}

export const DashboardDekan: React.FC<DashboardDekanProps> = ({
  user,
  skpList,
  dosenList,
  onNavigateToSKP,
  onNavigateToReview,
  onNavigateToEvaluasiKaprodi,
  onNavigateToHasilKinerjaSelf,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 12, stagger: 0.05 })
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [], { y: 8, stagger: 0.03, delay: 0.1 })

  const [searchKaprodi, setSearchKaprodi] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Find all Kaprodi
  const kaprodiList = dosenList.filter((d) => d.isKaprodi)
  // Kaprodi SKP list
  const kaprodiSKPs = useMemo(() => {
    return skpList.filter((s) => {
      const isKap = kaprodiList.some((k) => k.id === s.dosenId || k.nama === s.dosenNama)
      return isKap
    })
  }, [skpList, kaprodiList])

  const filteredKaprodiSKPs = useMemo(() => {
    return kaprodiSKPs.filter((s) => {
      const q = (searchKaprodi || '').trim().toLowerCase()
      if (!q) return true
      return (
        (s.dosenNama || '').toLowerCase().includes(q) ||
        (s.dosenNip || '').toLowerCase().includes(q) ||
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
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--navy-900) 0%, #1e3a5f 100%)',
          borderRadius: 'var(--r-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#fdba74',
              marginBottom: 10,
            }}
          >
            <Building2 size={14} />
            <span>Portal Pimpinan Fakultas &bull; {user.fakultas || 'Fakultas Keperawatan'}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Selamat Datang, {user.name}
          </h1>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginTop: 6, maxWidth: 640 }}>
            Anda memiliki wewenang untuk mengevaluasi, memverifikasi dokumen bukti, memberikan skor mutu, dan mengesahkan TTD digital SKP Ketua Program Studi di lingkungan fakultas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onNavigateToSKP && (
            <button
              onClick={onNavigateToSKP}
              className="brand-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '10px 18px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <FileText size={16} />
              <span>Sasaran Kinerja Pegawai (SKP)</span>
            </button>
          )}

          {onNavigateToHasilKinerjaSelf && (
            <button
              onClick={onNavigateToHasilKinerjaSelf}
              className="brand-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '10px 18px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Award size={16} />
              <span>Hasil Kinerja Tahunan</span>
            </button>
          )}

          {onNavigateToEvaluasiKaprodi && (
            <button
              onClick={onNavigateToEvaluasiKaprodi}
              className="brand-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '10px 18px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Evaluasi Kinerja Ka Prodi</span>
            </button>
          )}

          <button
            onClick={onNavigateToReview}
            className="brand-btn btn-action-add"
            style={{
              padding: '10px 20px',
            }}
          >
            <FileCheck2 size={16} />
            <span>Verifikasi SKP Ka Prodi ({pendingReviewCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Clean, Solid, Industry-Standard) */}
      <div className="kpi-bento-grid-3" style={{ marginTop: 16 }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Total Ketua Program Studi
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'var(--panel-hover)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--navy-900)',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {kaprodiList.length} <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>Kaprodi</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="kpi-badge">
                <Building2 size={12} />
                <span>Homebase {user.fakultas || 'Fakultas Keperawatan'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Menunggu Verifikasi Dekan
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(217, 119, 6, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#b45309',
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: pendingReviewCount > 0 ? '#b45309' : 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {pendingReviewCount} <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
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
                <span>Diajukan &bull; Siap Ditandatangani</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              SKP Disahkan Dekan
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#15803d',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-success-ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {approvedCount} <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>Berkas</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-ink)',
                }}
              >
                <ShieldCheck size={12} />
                <span>Telah Dibubuhi TTD Digital Dekan</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar SKP Kaprodi Yang Harus Dinilai Dekan */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
              Daftar Penilaian SKP Ketua Program Studi (Tingkat Fakultas)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
              Sebagai Dekan, Anda adalah atasan penilai langsung yang menandatangani SKP Ketua Program Studi.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--panel-bg)',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-md)',
                padding: '6px 12px',
                minWidth: 200,
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
                placeholder="Cari Kaprodi / prodi..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  width: '100%',
                }}
              />
            </div>

            <button
              onClick={onNavigateToReview}
              className="brand-btn brand-btn--outline"
              style={{ padding: '8px 16px', fontSize: '12.5px', gap: 6 }}
            >
              <span>Panel Verifikasi</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Nama Ketua Program Studi</th>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                    Tidak ada berkas SKP Kaprodi yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                paginatedKaprodiSKPs.map((skp) => (
                  <tr key={skp.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{skp.dosenNama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>NIP: {skp.dosenNip}</div>
                    </td>
                    <td>
                      <span className="badge-pill badge-pill--blue">{skp.dosenProdi}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {skp.semester} {skp.tahunAkademik}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {skp.totalSksRealisasi} SKS
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)' }}>
                      {skp.nilaiKinerjaSKP}%
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
                            {isSah ? 'Sah & Terbit' : skp.status}
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
                        style={{ padding: '6px 14px', fontSize: '12px' }}
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
