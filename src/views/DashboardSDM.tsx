import React, { useRef } from 'react'
import {
  TrendingUp,
  Clock,
  Send,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FileText,
  Award,
} from 'lucide-react'
import { Dosen, PengajuanSKP } from '../types'
import { useStaggerEntrance, useChartBarAnimation, useCountUp, useInteractiveCards } from '../utils/animations'

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
  const skpDisetujui = skpList.filter((s) => s.status === 'Disetujui SDM').length
  const skpMenunggu = skpList.filter((s) => s.status === 'Diajukan' || s.status === 'Dinilai Kaprodi').length
  const skpRevisi = skpList.filter((s) => s.status === 'Perlu Revisi').length

  const chartData = [
    { label: 'Farmasi', value: 16.4, height: 92, active: true },
    { label: 'Keperawatan', value: 15.8, height: 86, active: true },
    { label: 'Kebidanan', value: 14.6, height: 78, active: true },
    { label: 'Infokes', value: 15.2, height: 82, active: true },
    { label: 'Psikologi', value: 14.0, height: 74, active: false },
    { label: 'Kesmas', value: 13.8, height: 72, active: false },
    { label: 'Anestesi', value: 15.0, height: 80, active: false },
  ]

  const handleSendReminder = () => {
    onShowToast('Notifikasi pengingat batas waktu SKP telah dikirimkan ke email dosen UBK.')
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up', [totalDosen, skpDisetujui, skpMenunggu, skpRevisi])
  useInteractiveCards(containerRef, '.kpi-card')
  useChartBarAnimation(containerRef, '.sks-chart-bar')
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [skpList], { y: 8, stagger: 0.04, delay: 0.18 })

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Direktorat SDM</h1>
          <p className="page-desc">
            Pemantauan Kinerja, Sasaran Kinerja Pegawai (SKP), dan Evaluasi Dosen Universitas Bhakti Kencana.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('skp-sdm-self')}
            className="brand-btn brand-btn--outline"
            style={{ padding: '8px 16px', background: '#ffffff', borderRadius: 'var(--r-md)' }}
          >
            <FileText size={15} />
            <span>SKP Saya</span>
          </button>
          <button
            onClick={() => onNavigate('hasil-kinerja-sdm')}
            className="btn-action-view"
            style={{ padding: '8px 16px', borderRadius: 'var(--r-md)' }}
          >
            <Award size={15} />
            <span>Hasil Kinerja Tahunan</span>
          </button>
          <button
            onClick={() => onNavigate('data-dosen')}
            className="btn-action-add"
            style={{ padding: '8px 16px', borderRadius: 'var(--r-md)' }}
          >
            <Plus size={15} />
            <span>Tambah Dosen</span>
          </button>
          <button
            onClick={() => onNavigate('laporan')}
            className="btn-action-print"
            style={{ padding: '8px 16px', borderRadius: 'var(--r-md)' }}
          >
            <Download size={15} />
            <span>Ekspor Laporan</span>
          </button>
        </div>
      </div>

      <div className="kpi-bento-grid-4">
        <div className="kpi-card kpi-card--hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              Total Dosen Aktif UBK
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('data-dosen')}
              aria-label="Lihat master data dosen"
            >
              <ExternalLink size={14} />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="kpi-count-up" data-count={totalDosen * 20 + 8} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {totalDosen * 20 + 8}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="kpi-badge">
                <TrendingUp size={12} />
                <span>+12 dosen baru semester ini</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
              SKP Terverifikasi SDM
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('skp-dosen')}
              aria-label="Buka daftar SKP terverifikasi"
            >
              <ExternalLink size={14} />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="kpi-count-up" data-count={skpDisetujui * 60 + 4} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpDisetujui * 60 + 4}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge-pill badge-pill--green">
                <CheckCircle size={12} />
                <span>74.2% dari target universitas</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
              Menunggu Review Kaprodi
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('skp-dosen')}
              aria-label="Buka berkas menunggu review"
            >
              <ExternalLink size={14} />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="kpi-count-up" data-count={skpMenunggu * 20 + 6} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpMenunggu * 20 + 6}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge-pill badge-pill--orange">
                <Clock size={12} />
                <span>Dalam proses review Kaprodi</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
              Perlu Revisi Dokumen
            </span>
            <button
              className="kpi-arrow-btn"
              onClick={() => onNavigate('skp-dosen')}
              aria-label="Buka berkas perlu revisi"
            >
              <ExternalLink size={14} />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="kpi-count-up" data-count={skpRevisi * 8 + 2} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpRevisi * 8 + 2}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge-pill badge-pill--red">
                <AlertCircle size={12} />
                <span>Tindak lanjut kelengkapan bukti</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: 18,
        }}
      >
        {/* SKS Chart Card */}
        <div
          style={{
            background: 'var(--panel-bg)',
            borderRadius: 'var(--r-lg)',
            padding: '24px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                Rata-rata Capaian SKS per Program Studi
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
                Standar SPMI Tridharma UBK: Beban ideal 12 - 16 SKS per semester
              </div>
            </div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--brand-700)',
                background: 'var(--brand-100)',
                padding: '4px 10px',
                borderRadius: 'var(--r-sm)',
              }}
            >
              Genap 2025/2026
            </span>
          </div>

          {/* Bar Chart Area */}
          <div
            style={{
              height: '210px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              padding: '16px 8px 0',
              borderBottom: '1px solid var(--hair)',
              position: 'relative',
            }}
          >
            {/* SPMI Baseline Markers */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '30%',
                borderTop: '1px dashed #cbd5e1',
                pointerEvents: 'none',
              }}
            >
              <span style={{ position: 'absolute', right: 4, top: -14, fontSize: '10px', color: 'var(--faint)' }}>
                Batas Maks 16 SKS
              </span>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '55%',
                borderTop: '1px dashed #cbd5e1',
                pointerEvents: 'none',
              }}
            >
              <span style={{ position: 'absolute', right: 4, top: -14, fontSize: '10px', color: 'var(--faint)' }}>
                Batas Min 12 SKS
              </span>
            </div>

            {chartData.map((bar, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  height: '100%',
                  justifyContent: 'flex-end',
                  zIndex: 2,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -22,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: bar.active ? 'var(--navy-900)' : 'var(--muted)',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--r-xs)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bar.value}
                  </div>
                  <div
                    className="sks-chart-bar"
                    style={{
                      width: 32,
                      height: `${bar.height}%`,
                      borderRadius: '6px 6px 0 0',
                      background: bar.active ? 'var(--brand-600)' : 'var(--navy-700)',
                      transition: 'height 0.3s var(--ease)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textAlign: 'center',
                    maxWidth: 58,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Side Summary Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Deadline reminder */}
          <div
            style={{
              background: 'var(--panel-bg)',
              borderRadius: 'var(--r-lg)',
              padding: '22px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jadwal Batas Waktu Validasi
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.3 }}>
                Batas Akhir Validasi SKP Semester Genap
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4 }}>
                30 November 2026 &bull; 23:59 WIB
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                className="brand-btn brand-btn--dark"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px 16px',
                }}
                onClick={handleSendReminder}
              >
                <Send size={14} />
                <span>Kirim Pengingat Masal</span>
              </button>
            </div>
          </div>

          {/* JAD Summary */}
          <div
            style={{
              background: 'var(--panel-bg)',
              borderRadius: 'var(--r-lg)',
              padding: '20px 22px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Jenjang Jabatan Fungsional (JAD)
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--faint)' }}>Standar SPMI</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Guru Besar (GB)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>6 Dosen</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Lektor Kepala (LK)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>42 Dosen</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Lektor (L)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>118 Dosen</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Asisten Ahli (AA)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>82 Dosen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent SKP Table */}
      <div
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--r-lg)',
          padding: '24px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
              Pengajuan SKP Terbaru Menunggu Validasi SDM
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
              Daftar berkas yang telah diverifikasi Kaprodi dan siap disahkan Direktorat SDM
            </div>
          </div>
          <button
            onClick={() => onNavigate('skp-dosen')}
            className="btn-back"
          >
            <span>Lihat Semua Berkas</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Dosen Pengusul</th>
                <th>Homebase Prodi</th>
                <th>Semester</th>
                <th>Target SKS</th>
                <th>Realisasi SKS</th>
                <th>Status SKP</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {skpList.map((skp) => (
                <tr key={skp.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{skp.dosenNama}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>NIP: {skp.dosenNip}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{skp.dosenProdi}</span>
                  </td>
                  <td>{skp.semester} {skp.tahunAkademik}</td>
                  <td>{skp.totalSksRencana} SKS</td>
                  <td>
                    <span style={{ fontWeight: 700, color: skp.totalSksRealisasi >= 12 ? 'var(--status-success-ink)' : 'var(--status-danger-ink)' }}>
                      {skp.totalSksRealisasi} SKS
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        skp.status === 'Disetujui SDM'
                          ? 'badge-pill--green'
                          : skp.status === 'Dinilai Kaprodi'
                          ? 'badge-pill--blue'
                          : skp.status === 'Diajukan'
                          ? 'badge-pill--orange'
                          : 'badge-pill--red'
                      }`}
                    >
                      {skp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="brand-btn"
                      style={{ padding: '6px 14px', fontSize: '12.5px' }}
                      onClick={() => onSelectSKPToReview(skp)}
                    >
                      <span>Validasi</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
