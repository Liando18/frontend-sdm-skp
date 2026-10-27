import React, { useState, useRef } from 'react'
import { Download, Printer, Search, FileText, CheckCircle2 } from 'lucide-react'
import { Dosen, PengajuanSKP, PenilaianKuesioner } from '../types'
import { CetakOutputFinalTahunan, OutputFinalData } from '../components/CetakOutputFinalTahunan'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'

interface LaporanViewProps {
  dosenList: Dosen[]
  skpList: PengajuanSKP[]
  penilaianList: PenilaianKuesioner[]
  prodiList?: string[]
  onShowToast: (msg: string) => void
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  dosenList,
  skpList,
  penilaianList,
  prodiList: prodiListProp,
  onShowToast,
}) => {
  const availableProdis = prodiListProp && prodiListProp.length > 0
    ? (prodiListProp[0] === 'Semua Program Studi' ? prodiListProp : ['Semua Program Studi', ...prodiListProp])
    : ['Semua Program Studi', ...Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))]

  const availableYears = Array.from(
    new Set([
      ...skpList.map((s) => s.tahunAkademik).filter(Boolean),
      ...penilaianList.map((p) => p.tahun).filter(Boolean),
      '2025/2026',
    ])
  )

  const [selectedTahun, setSelectedTahun] = useState(availableYears[0] || '2025/2026')
  const [selectedProdi, setSelectedProdi] = useState('Semua Program Studi')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOutputFinal, setSelectedOutputFinal] = useState<OutputFinalData | null>(null)

  // Rekapitulasi Tahunan: 2x SKP (Ganjil & Genap) + 1x Kuesioner Tahunan
  const laporanData: OutputFinalData[] = dosenList.map((dosen) => {
    const skpGanjil = skpList.find(
      (s) => s.dosenId === dosen.id && s.semester === 'Ganjil' && (!s.tahunAkademik || s.tahunAkademik === selectedTahun)
    )
    const skpGenap = skpList.find(
      (s) => s.dosenId === dosen.id && s.semester === 'Genap' && (!s.tahunAkademik || s.tahunAkademik === selectedTahun)
    )
    const kuesioner = penilaianList.find((k) => k.dosenId === dosen.id && (!k.tahun || k.tahun === selectedTahun))

    const nilaiSKPGanjil = skpGanjil ? (skpGanjil.nilaiKinerjaSKP || 0) : (dosen.nilaiAkhir || 0)
    const nilaiSKPGenap = skpGenap ? (skpGenap.nilaiKinerjaSKP || 0) : (dosen.nilaiAkhir || 0)

    const skpDivisor = (skpGanjil && skpGenap) ? 2 : (skpGanjil || skpGenap) ? 1 : 1
    const rataRataSKP = Number(((nilaiSKPGanjil + nilaiSKPGenap) / (skpGanjil && skpGenap ? 2 : 1)).toFixed(2))
    const bobotSKP60 = Number((rataRataSKP * 0.6).toFixed(2))

    const nilaiKuisSkala4 = kuesioner ? kuesioner.rataRata : 0
    const nilaiKuisSkala100 = Number(((nilaiKuisSkala4 / 4) * 100).toFixed(2))
    const bobotKuis40 = Number((nilaiKuisSkala100 * 0.4).toFixed(2))

    const nilaiAkhirTahunan = Number((bobotSKP60 + (kuesioner ? bobotKuis40 : (bobotSKP60 > 0 ? Number((rataRataSKP * 0.4).toFixed(2)) : 0))).toFixed(2))

    const predikat =
      nilaiAkhirTahunan >= 90
        ? 'Sangat Baik'
        : nilaiAkhirTahunan >= 76
        ? 'Baik'
        : nilaiAkhirTahunan >= 60
        ? 'Cukup'
        : 'Kurang'

    return {
      dosen,
      tahunAkademik: selectedTahun,
      skpGanjil,
      skpGenap,
      kuesioner,
      nilaiSKPGanjil,
      nilaiSKPGenap,
      rataRataSKP,
      bobotSKP60,
      nilaiKuisSkala4,
      nilaiKuisSkala100,
      bobotKuis40,
      nilaiAkhirTahunan,
      predikat,
    }
  })

  const filteredLaporan = laporanData.filter((item) => {
    const matchProdi = selectedProdi === 'Semua Program Studi' || item.dosen.prodi === selectedProdi
    const matchSearch =
      item.dosen.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.dosen.nuptk && item.dosen.nuptk.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.dosen.nip.toLowerCase().includes(searchQuery.toLowerCase())
    return matchProdi && matchSearch
  })

  const handleExportExcel = () => {
    const headers = [
      'No',
      'NIP',
      'Nama Dosen',
      'NUPTK',
      'Prodi',
      'SKP Ganjil',
      'SKP Genap',
      'Rata-rata SKP',
      'Perilaku Skala 4',
      'Perilaku Skala 100',
      'Nilai Akhir (Output Final)',
      'Predikat',
    ]
    const rows = filteredLaporan.map((item, idx) => [
      idx + 1,
      `"${item.dosen.nip || ''}"`,
      `"${item.dosen.nama || ''}"`,
      `"${item.dosen.nuptk || ''}"`,
      `"${item.dosen.prodi || ''}"`,
      item.nilaiSKPGanjil,
      item.nilaiSKPGenap,
      item.rataRataSKP,
      item.nilaiKuisSkala4,
      item.nilaiKuisSkala100,
      item.nilaiAkhirTahunan,
      `"${item.predikat}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Laporan_Rekap_Kinerja_UBK_${selectedTahun.replace('/', '-')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onShowToast('File Excel Rekapitulasi Kinerja Tahunan berhasil diunduh!')
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up')
  useInteractiveCards(containerRef, '.kpi-card')
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [selectedProdi, searchQuery, selectedTahun], { y: 8, stagger: 0.04, delay: 0.12 })

  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Rekapitulasi Tahunan Per Dosen (Output Final)</h1>
          <p className="page-desc">
            Rekapitulasi prestasi kerja individual per dosen yang menggabungkan 2 kali SKP (Semester Ganjil 30% + Semester Genap 30%) dan 1 kali Kuesioner Perilaku Tahunan (40%) UBK.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={handleExportExcel}
            className="btn-action-print"
            style={{ padding: '9px 18px' }}
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {(() => {
        const avgInstitusiNum = laporanData.length > 0
          ? Number((laporanData.reduce((acc, c) => acc + c.nilaiAkhirTahunan, 0) / laporanData.length).toFixed(2))
          : 0
        const avgInstitusi = avgInstitusiNum.toFixed(2)
        const predikatInstitusi =
          avgInstitusiNum >= 90 ? 'Sangat Baik' : avgInstitusiNum >= 76 ? 'Baik' : avgInstitusiNum >= 60 ? 'Cukup' : avgInstitusiNum > 0 ? 'Kurang' : 'Belum Ada Data'

        const bkdCompliantCount = laporanData.filter((d) => {
          const sks = d.skpGenap?.totalSksRealisasi ?? d.skpGanjil?.totalSksRealisasi ?? 0
          return sks >= 12 && sks <= 16
        }).length
        const bkdPersen = laporanData.length > 0
          ? ((bkdCompliantCount / laporanData.length) * 100).toFixed(0)
          : '0'

        return (
          <div className="kpi-bento-grid-3">
            <div className="kpi-card">
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Rata-rata Kinerja Tahunan Universitas
              </div>
              <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 8, letterSpacing: '-0.02em' }}>
                <span className="kpi-count-up" data-count={avgInstitusi}>{avgInstitusi}</span> <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--muted)' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--brand-700)', marginTop: 6 }}>
                Predikat Institusi: <strong>{predikatInstitusi}</strong>
              </div>
            </div>

            <div className="kpi-card">
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Formula Integrasi Tahunan UBK
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 8 }}>
                (SKP 2x × 60%) + (Kuesioner 1x × 40%)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6 }}>
                Rata-rata SKP Ganjil &amp; Genap (60%) + Perilaku Tahunan (40%)
              </div>
            </div>

            <div className="kpi-card">
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Kepatuhan Beban Kerja (BKD)
              </div>
              <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--status-success-ink)', marginTop: 8, letterSpacing: '-0.02em' }}>
                <span className="kpi-count-up" data-count={bkdPersen}>{bkdPersen}</span>%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6 }}>
                {bkdCompliantCount} dari {laporanData.length} Dosen Memenuhi Standar BKD (12-16 SKS)
              </div>
            </div>
          </div>
        )
      })()}

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Tahun Akademik */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Tahun Akademik
            </span>
            <select
              className="custom-select"
              style={{ height: 38, minWidth: 220, width: 'auto', fontSize: '13px' }}
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
            >
              {availableYears.map((thn) => (
                <option key={thn} value={thn}>
                  {thn} (Tahunan)
                </option>
              ))}
            </select>
          </div>

          {/* Filter Prodi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Program Studi
            </span>
            <select
              className="custom-select"
              style={{ height: 38, minWidth: 230, width: 'auto', fontSize: '13px' }}
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
            >
              {availableProdis.map((prodi, idx) => (
                <option key={idx} value={prodi}>
                  {prodi}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="search" style={{ minWidth: 260 }}>
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Cari dosen, NIP, atau NUPTK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
      </div>

      {/* Main Table: Rekap Tahunan Gabungan 2x SKP + 1x Kuesioner */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Dosen &amp; Homebase</th>
              <th>SKP Ganjil</th>
              <th>SKP Genap</th>
              <th>Rata-rata SKP (60%)</th>
              <th>Kuesioner Tahunan (40%)</th>
              <th>Nilai Akhir Tahunan</th>
              <th>Predikat</th>
              <th style={{ textAlign: 'right' }}>Dokumen Output Final (Per Dosen)</th>
            </tr>
          </thead>
          <tbody>
            {filteredLaporan.map((item) => (
              <tr key={item.dosen.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.dosen.nama}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                    NUPTK: {item.dosen.nuptk || '-'} &bull; {item.dosen.prodi}
                  </div>
                  {item.dosen.isKaprodi && (
                    <span className="badge-pill badge-pill--blue" style={{ fontSize: '10px', marginTop: 3 }}>
                      Ketua Program Studi
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{item.nilaiSKPGanjil.toFixed(1)}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{item.nilaiSKPGenap.toFixed(1)}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                    {item.rataRataSKP.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Bobot 60%: <strong>{item.bobotSKP60.toFixed(1)}</strong>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--brand-700)' }}>
                    {item.nilaiKuisSkala4.toFixed(2)} <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>/ 4.00</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Bobot 40%: <strong>{item.bobotKuis40.toFixed(1)}</strong>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-900)' }}>
                    {item.nilaiAkhirTahunan.toFixed(1)}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge-pill ${
                      item.predikat === 'Sangat Baik'
                        ? 'badge-pill--green'
                        : item.predikat === 'Baik'
                        ? 'badge-pill--blue'
                        : 'badge-pill--orange'
                    }`}
                  >
                    {item.predikat}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedOutputFinal(item)}
                    className="btn-action-print"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    title={`Cetak Output Final.pdf untuk dosen ${item.dosen.nama}`}
                  >
                    <FileText size={13} />
                    <span>Cetak Output Final.pdf</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cetak Output Final Tahunan per Dosen */}
      {selectedOutputFinal && (
        <CetakOutputFinalTahunan
          data={selectedOutputFinal}
          isOpen={Boolean(selectedOutputFinal)}
          onClose={() => setSelectedOutputFinal(null)}
        />
      )}
    </div>
  )
}
