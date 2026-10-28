import React, { useRef, useState, useMemo } from 'react'
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
  Search,
  Filter,
} from 'lucide-react'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
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
  const skpDisetujui = skpList.filter((s) => s.status === 'Disetujui SDM').length
  const skpMenunggu = skpList.filter((s) => s.status === 'Diajukan' || s.status === 'Dinilai Kaprodi').length
  const skpRevisi = skpList.filter((s) => s.status === 'Perlu Revisi').length

  // Dynamically calculate JAD distribution from database
  const countGuruBesar = dosenList.filter((d) => d.jafung === 'Guru Besar').length
  const countLektorKepala = dosenList.filter((d) => d.jafung === 'Lektor Kepala').length
  const countLektor = dosenList.filter((d) => d.jafung === 'Lektor').length
  const countAsistenAhli = dosenList.filter((d) => d.jafung === 'Asisten Ahli' || d.jafung === 'Tenaga Pengajar').length

  // Table Search, Filter & Pagination states
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatus, setTableStatus] = useState('Semua')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Dynamically calculate SKS per prodi from database skpList & dosenList
  const prodis = Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))
  const latestSkp = skpList[0]
  const activePeriode = latestSkp ? `${latestSkp.semester} ${latestSkp.tahunAkademik}` : 'Semester Berjalan'

  const formatProdiName = (p: string) => {
    if (p.includes('Keperawatan')) return 'Keperawatan'
    if (p.includes('Kebidanan')) return 'Kebidanan'
    if (p.includes('Farmasi')) return 'Farmasi'
    if (p.includes('Masyarakat') || p.includes('Kesmas')) return 'Kesmas'
    if (p.includes('Psikologi')) return 'Psikologi'
    return p.replace(/^(S1|S2|D3|Profesi)\s+/i, '')
  }

  const chartData = prodis.map((prodi, idx) => {
    const dosenInProdi = dosenList.filter((d) => d.prodi === prodi).map((d) => d.id)
    const skpInProdi = skpList.filter((s) => dosenInProdi.includes(s.dosenId) || s.dosenProdi === prodi)
    const avgSks = skpInProdi.length > 0
      ? skpInProdi.reduce((acc, curr) => acc + (curr.totalSksRealisasi || curr.totalSksRencana || 0), 0) / skpInProdi.length
      : 0
    const val = Number(avgSks.toFixed(1))
    return {
      label: formatProdiName(prodi),
      value: val,
      fullProdi: prodi,
      active: idx < 4,
    }
  })

  // SPMI compliance and summary statistics
  const activeProdisWithData = chartData.filter((d) => d.value > 0)
  const spmiCompliantCount = activeProdisWithData.filter((d) => d.value >= 12).length
  const spmiComplianceRate = activeProdisWithData.length > 0
    ? Math.round((spmiCompliantCount / activeProdisWithData.length) * 100)
    : 100
  const highestProdi = chartData.reduce(
    (max, d) => (d.value > max.value ? d : max),
    chartData[0] || { label: 'Keperawatan', value: 0 }
  )
  const totalSksAll = chartData.reduce((acc, d) => acc + d.value, 0)
  const averageSksPt = chartData.length > 0 ? totalSksAll / chartData.length : 0

  // Filter across whole dataset
  const filteredSkpList = useMemo(() => {
    return skpList.filter((s) => {
      const q = tableSearch.toLowerCase().trim()
      const matchSearch =
        q === '' ||
        s.dosenNama.toLowerCase().includes(q) ||
        s.dosenNip.includes(q) ||
        s.dosenProdi.toLowerCase().includes(q)
      const matchStatus = tableStatus === 'Semua' || s.status === tableStatus
      return matchSearch && matchStatus
    })
  }, [skpList, tableSearch, tableStatus])

  // Slice for current page
  const paginatedSkp = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSkpList.slice(start, start + pageSize)
  }, [filteredSkpList, page, pageSize])

  const handleSendReminder = () => {
    onShowToast('Notifikasi pengingat batas waktu SKP telah dikirimkan ke email dosen UBK.')
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up', [totalDosen, skpDisetujui, skpMenunggu, skpRevisi])
  useInteractiveCards(containerRef, '.kpi-card')
  // Pass empty deps to avoid flickering on filter/pagination changes
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [], { y: 8, stagger: 0.04, delay: 0.18 })

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
            onClick={onAddDosenModal}
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
            <div className="kpi-count-up" data-count={totalDosen} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {totalDosen}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="kpi-badge">
                <TrendingUp size={12} />
                <span>{totalDosen} Dosen Aktif UBK</span>
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
            <div className="kpi-count-up" data-count={skpDisetujui} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpDisetujui}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge-pill badge-pill--green">
                <CheckCircle size={12} />
                <span>{totalDosen > 0 ? ((skpDisetujui / totalDosen) * 100).toFixed(1) : 0}% dari seluruh dosen</span>
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
            <div className="kpi-count-up" data-count={skpMenunggu} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpMenunggu}
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
            <div className="kpi-count-up" data-count={skpRevisi} style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {skpRevisi}
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

      <div className="dashboard-chart-grid">
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
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
              {activePeriode}
            </span>
          </div>

          {/* Clean Legend Header without overlapping chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '12px', color: 'var(--muted)', padding: '2px 0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f0752e', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Rata-rata Capaian SKS</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 2, background: '#94a3b8', display: 'inline-block' }} />
              <span>Standar SPMI: 12 - 16 SKS</span>
            </span>
          </div>

          {/* Bar Chart Area powered by @mui/x-charts */}
          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: '300px',
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: chartData.map((d) => d.label),
                  tickLabelStyle: { fontSize: 11.5, fill: '#64748b', fontWeight: 500 },
                },
              ]}
              yAxis={[
                {
                  min: 0,
                  max: 22,
                  label: 'SKS',
                  tickLabelStyle: { fontSize: 11, fill: '#64748b' },
                },
              ]}
              series={[
                {
                  data: chartData.map((d) => d.value),
                  label: 'Rata-rata Capaian SKS',
                  color: '#f0752e',
                  highlightScope: { highlight: 'item', fade: 'none' },
                },
              ]}
              height={300}
              margin={{ top: 15, bottom: 35, left: 45, right: 15 }}
              borderRadius={6}
              axisHighlight={{ x: 'none', y: 'none' }}
              hideLegend
            />
          </div>

          {/* Quick Insights Footer Bar */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '14px',
              borderTop: '1px solid var(--hair-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Kepatuhan SPMI</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                {spmiComplianceRate}% Beban Standar
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Capaian Tertinggi</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 2 }}>
                {highestProdi.label} ({highestProdi.value} SKS)
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Rata-rata Gabungan PT</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0752e', marginTop: 2 }}>
                {averageSksPt.toFixed(1)} SKS / Dosen
              </div>
            </div>
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
                Batas Akhir Validasi SKP {activePeriode}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4 }}>
                Sesuai Kalender Akademik Institusi &bull; 23:59 WIB
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

          {/* JAD Summary with MUI PieChart */}
          <div
            style={{
              background: 'var(--panel-bg)',
              borderRadius: 'var(--r-lg)',
              padding: '20px 22px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Jenjang Jabatan Fungsional (JAD)
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--faint)' }}>Standar SPMI</span>
            </div>

            <div style={{ height: 160, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: [
                      { id: 0, value: countGuruBesar, label: 'Guru Besar', color: '#1e293b' },
                      { id: 1, value: countLektorKepala, label: 'Lektor Kepala', color: '#f0752e' },
                      { id: 2, value: countLektor, label: 'Lektor', color: '#0284c7' },
                      { id: 3, value: countAsistenAhli, label: 'Asisten Ahli', color: '#10b981' },
                    ],
                    innerRadius: 28,
                    outerRadius: 65,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                height={160}
                slots={{ legend: () => null }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Guru Besar (GB)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{countGuruBesar} Dosen</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Lektor Kepala (LK)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>{countLektorKepala} Dosen</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Lektor (L)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7', marginTop: 2 }}>{countLektor} Dosen</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Asisten Ahli (AA)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669', marginTop: 2 }}>{countAsistenAhli} Dosen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent SKP Table with Universal Search & Pagination */}
      <div
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderBottom: '1px solid var(--hair-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
              Pengajuan SKP Menunggu Validasi SDM
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
              Daftar berkas yang telah diverifikasi Kaprodi/Dekan dan siap disahkan Direktorat SDM
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Global Search across all database records */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--card)',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-md)',
                padding: '6px 12px',
                minWidth: 220,
              }}
            >
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama, NIP, prodi..."
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

            {/* Status Filter */}
            <select
              value={tableStatus}
              onChange={(e) => {
                setTableStatus(e.target.value)
                setPage(1)
              }}
              style={{
                fontSize: '12.5px',
                padding: '7px 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--hair)',
                background: 'var(--card)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Dinilai Kaprodi">Dinilai Kaprodi</option>
              <option value="Dinilai Dekan">Dinilai Dekan</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Disetujui SDM">Disetujui SDM</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
            </select>

            <button
              onClick={() => onNavigate('skp-dosen')}
              className="btn-back"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <span>Kelola Semua</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table custom-table--sticky-1">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Dosen Pengusul</th>
                <th>Homebase Prodi</th>
                <th>Semester</th>
                <th>Target SKS</th>
                <th>Realisasi SKS</th>
                <th>Status SKP</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSkp.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                    Tidak ada data pengajuan SKP yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedSkp.map((skp) => (
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
                            : skp.status === 'Dinilai Kaprodi' || skp.status === 'Dinilai Dekan'
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
                ))
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
