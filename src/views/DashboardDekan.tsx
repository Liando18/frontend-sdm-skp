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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
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
      const isActualKaprodi = Boolean(
        d.isKaprodi ||
        d.jabatanStruktural === 'Ketua Program Studi' ||
        d.jabatan_struktural === 'Ketua Program Studi'
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
  }, [dosenList, isKacap, userPsdkuId, userKampusName, psdkuProdiIds, dekanFakultasId, dekanFakultasName, fakultasProdiIds])

  // Kaprodi SKP list
  const kaprodiSKPs = useMemo(() => {
    const kIds = new Set(kaprodiList.map((k) => k.id))
    const kNips = new Set(kaprodiList.map((k) => k.nip).filter(Boolean))
    const kNames = new Set(kaprodiList.map((k) => (k.nama || '').trim().toLowerCase()))

    return skpList.filter((s) => {
      return (
        (s.dosenId && kIds.has(s.dosenId)) ||
        (s.dosenNip && kNips.has(s.dosenNip)) ||
        (s.dosenNama && kNames.has(s.dosenNama.trim().toLowerCase()))
      )
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
            <span>{isKacap ? `Portal Pimpinan Cabang \u2022 ${territoryLabel}` : `Portal Pimpinan Fakultas \u2022 ${territoryLabel}`}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Selamat Datang, {user.name}
          </h1>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginTop: 6, maxWidth: 640 }}>
            Anda memiliki wewenang untuk mengevaluasi, memverifikasi dokumen bukti, memberikan skor mutu, dan mengesahkan TTD digital SKP Ketua Program Studi di lingkungan {isKacap ? `kampus cabang (${territoryLabel})` : `fakultas (${territoryLabel})`}.
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
                <span>Telah Dibubuhi TTD Digital {isKacap ? 'KeCab' : 'Dekan'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar SKP Kaprodi Yang Harus Dinilai */}
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
              Daftar Persetujuan &amp; Pengesahan SKP Ketua Program Studi ({territoryLabel})
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
              Sebagai {roleLabel}, Anda memverifikasi dan menyetujui pengesahan SKP Ketua Program Studi.
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
