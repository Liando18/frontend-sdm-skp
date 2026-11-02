import React, { useState, useRef, useMemo } from 'react'
import { Search, FileText, RotateCcw, AlertCircle, Building2, MapPin, GraduationCap, CheckCircle } from 'lucide-react'
import { Dosen, PengajuanSKP, PenilaianKuesioner } from '../types'
import { CetakOutputFinalTahunan, OutputFinalData } from '../components/CetakOutputFinalTahunan'
import { openPrintOutputFinal } from '../utils/printOutputFinal'
import { useStaggerEntrance, useCountUp, useInteractiveCards } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'
import { DEFAULT_TAHUN_AJARAN_OPTIONS } from '../utils/academicYear'

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
  // Opsi Filter Dinamis dari Data Kepegawaian Dosen
  const availableYears = Array.from(
    new Set([
      ...skpList.map((s) => s.tahunAkademik).filter(Boolean),
      ...penilaianList.map((p) => p.tahun).filter(Boolean),
      ...DEFAULT_TAHUN_AJARAN_OPTIONS,
    ])
  ).sort().reverse()

  const availableFakultas = Array.from(new Set(dosenList.map((d) => d.fakultas).filter(Boolean))) as string[]

  const availableProdis = prodiListProp && prodiListProp.length > 0
    ? (prodiListProp[0] === 'Semua Program Studi' ? prodiListProp.slice(1) : prodiListProp)
    : (Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean))) as string[])

  const availableKampus = Array.from(new Set(dosenList.map((d) => d.kampus).filter(Boolean))) as string[]
  const availableJafungs = Array.from(new Set(dosenList.map((d) => d.jafung).filter(Boolean))) as string[]
  const availableGolongans = Array.from(new Set(dosenList.map((d) => d.golongan).filter(Boolean))) as string[]
  const availableStatusPegawai = Array.from(new Set(dosenList.map((d) => d.status).filter(Boolean))) as string[]

  // State Filter
  const [selectedTahun, setSelectedTahun] = useState('2026/2027')
  const [selectedFakultas, setSelectedFakultas] = useState('Semua')
  const [selectedProdi, setSelectedProdi] = useState('Semua')
  const [selectedKampus, setSelectedKampus] = useState('Semua')
  const [selectedJafung, setSelectedJafung] = useState('Semua')
  const [selectedGolongan, setSelectedGolongan] = useState('Semua')
  const [selectedStatusPegawai, setSelectedStatusPegawai] = useState('Semua')
  const [selectedPredikatStatus, setSelectedPredikatStatus] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedOutputFinal, setSelectedOutputFinal] = useState<OutputFinalData | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Rekapitulasi Tahunan: 2x SKP (Ganjil & Genap) + 1x Kuesioner Tahunan
  // Hanya memiliki nilai akhir dan predikat jika SKP Ganjil, SKP Genap, dan Kuesioner telah dinilai
  const laporanData: (OutputFinalData & { isEvaluatedComplete: boolean })[] = dosenList.map((dosen) => {
    const skpGanjil = skpList.find(
      (s) => s.dosenId === dosen.id && s.semester === 'Ganjil' && (!s.tahunAkademik || s.tahunAkademik === selectedTahun)
    )
    const skpGenap = skpList.find(
      (s) => s.dosenId === dosen.id && s.semester === 'Genap' && (!s.tahunAkademik || s.tahunAkademik === selectedTahun)
    )
    const kuesioner = penilaianList.find((k) => k.dosenId === dosen.id && (!k.tahun || k.tahun === selectedTahun))

    const isGanjilEvaluated = Boolean(
      skpGanjil &&
      ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi'].includes(skpGanjil.status) &&
      (skpGanjil.nilaiKinerjaSKP || 0) > 0
    )
    const isGenapEvaluated = Boolean(
      skpGenap &&
      ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi'].includes(skpGenap.status) &&
      (skpGenap.nilaiKinerjaSKP || 0) > 0
    )
    const isKuesionerEvaluated = Boolean(kuesioner && kuesioner.rataRata > 0)

    const isEvaluatedComplete = isGanjilEvaluated && isGenapEvaluated && isKuesionerEvaluated

    let nilaiSKPGanjil = 0
    let nilaiSKPGenap = 0
    let rataRataSKP = 0
    let bobotSKP70 = 0
    let nilaiKuisSkala4 = 0
    let nilaiKuisSkala100 = 0
    let bobotKuis30 = 0
    let nilaiAkhirTahunan = 0
    let predikat = 'Belum Dinilai'

    if (isEvaluatedComplete) {
      nilaiSKPGanjil = skpGanjil!.nilaiKinerjaSKP || 0
      nilaiSKPGenap = skpGenap!.nilaiKinerjaSKP || 0
      rataRataSKP = Number(((nilaiSKPGanjil + nilaiSKPGenap) / 2).toFixed(2))
      bobotSKP70 = Number((rataRataSKP * 0.70).toFixed(2))

      nilaiKuisSkala4 = kuesioner!.rataRata
      nilaiKuisSkala100 = Number(((nilaiKuisSkala4 / 4) * 100).toFixed(2))
      bobotKuis30 = Number((nilaiKuisSkala100 * 0.30).toFixed(2))

      // Rumus SPMI UBK: N = (70% × S) + (30% × P)
      nilaiAkhirTahunan = Number((bobotSKP70 + bobotKuis30).toFixed(2))

      // Skala Penilaian SPMI UBK
      predikat =
        nilaiAkhirTahunan > 90
          ? 'Sangat Baik'
          : nilaiAkhirTahunan >= 81
          ? 'Baik'
          : nilaiAkhirTahunan >= 71
          ? 'Cukup'
          : nilaiAkhirTahunan >= 61
          ? 'Kurang'
          : 'Sangat Kurang'
    } else {
      // Nilai parsial untuk ditampilkan di kolom tabel jika ada
      nilaiSKPGanjil = isGanjilEvaluated ? (skpGanjil!.nilaiKinerjaSKP || 0) : 0
      nilaiSKPGenap = isGenapEvaluated ? (skpGenap!.nilaiKinerjaSKP || 0) : 0
      if (isGanjilEvaluated || isGenapEvaluated) {
        const count = (isGanjilEvaluated ? 1 : 0) + (isGenapEvaluated ? 1 : 0)
        rataRataSKP = Number(((nilaiSKPGanjil + nilaiSKPGenap) / count).toFixed(2))
        bobotSKP70 = Number((rataRataSKP * 0.70).toFixed(2))
      }
      nilaiKuisSkala4 = isKuesionerEvaluated ? kuesioner!.rataRata : 0
      nilaiKuisSkala100 = isKuesionerEvaluated ? Number(((nilaiKuisSkala4 / 4) * 100).toFixed(2)) : 0
      bobotKuis30 = isKuesionerEvaluated ? Number((nilaiKuisSkala100 * 0.30).toFixed(2)) : 0
      nilaiAkhirTahunan = 0
      predikat = 'Belum Dinilai'
    }

    return {
      dosen,
      tahunAkademik: selectedTahun,
      skpGanjil,
      skpGenap,
      kuesioner,
      nilaiSKPGanjil,
      nilaiSKPGenap,
      rataRataSKP,
      bobotSKP70,
      bobotSKP60: bobotSKP70,
      nilaiKuisSkala4,
      nilaiKuisSkala100,
      bobotKuis30,
      bobotKuis40: bobotKuis30,
      nilaiAkhirTahunan,
      predikat,
      isEvaluatedComplete,
    }
  })

  // Filtering Data
  const isFiltered =
    selectedFakultas !== 'Semua' ||
    selectedProdi !== 'Semua' ||
    selectedKampus !== 'Semua' ||
    selectedJafung !== 'Semua' ||
    selectedGolongan !== 'Semua' ||
    selectedStatusPegawai !== 'Semua' ||
    selectedPredikatStatus !== 'Semua' ||
    searchQuery.trim() !== ''

  const handleResetFilters = () => {
    setSelectedFakultas('Semua')
    setSelectedProdi('Semua')
    setSelectedKampus('Semua')
    setSelectedJafung('Semua')
    setSelectedGolongan('Semua')
    setSelectedStatusPegawai('Semua')
    setSelectedPredikatStatus('Semua')
    setSearchQuery('')
    setPage(1)
  }

  const filteredLaporan = useMemo(() => {
    return laporanData.filter((item) => {
      if (selectedFakultas !== 'Semua' && item.dosen?.fakultas !== selectedFakultas) return false
      if (selectedProdi !== 'Semua' && item.dosen?.prodi !== selectedProdi) return false
      if (selectedKampus !== 'Semua' && item.dosen?.kampus !== selectedKampus) return false
      if (selectedJafung !== 'Semua' && item.dosen?.jafung !== selectedJafung) return false
      if (selectedGolongan !== 'Semua' && item.dosen?.golongan !== selectedGolongan) return false
      if (selectedStatusPegawai !== 'Semua' && item.dosen?.status !== selectedStatusPegawai) return false

      if (selectedPredikatStatus !== 'Semua') {
        if (selectedPredikatStatus === 'Sudah Lengkap Dinilai') {
          if (!item.isEvaluatedComplete) return false
        } else if (selectedPredikatStatus === 'Belum Dinilai') {
          if (item.isEvaluatedComplete) return false
        } else if (item.predikat !== selectedPredikatStatus) {
          return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchNama = (item.dosen?.nama || '').toLowerCase().includes(q)
        const matchNip = (item.dosen?.nip || '').toLowerCase().includes(q)
        const matchNuptk = (item.dosen?.nuptk || '').toLowerCase().includes(q)
        const matchProdi = (item.dosen?.prodi || '').toLowerCase().includes(q)
        const matchFakultas = (item.dosen?.fakultas || '').toLowerCase().includes(q)
        if (!matchNama && !matchNip && !matchNuptk && !matchProdi && !matchFakultas) return false
      }

      return true
    })
  }, [
    laporanData,
    selectedFakultas,
    selectedProdi,
    selectedKampus,
    selectedJafung,
    selectedGolongan,
    selectedStatusPegawai,
    selectedPredikatStatus,
    searchQuery,
  ])

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setPage(1)
  }, [
    selectedTahun,
    selectedFakultas,
    selectedProdi,
    selectedKampus,
    selectedJafung,
    selectedGolongan,
    selectedStatusPegawai,
    selectedPredikatStatus,
    searchQuery,
  ])

  const paginatedLaporan = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLaporan.slice(start, start + pageSize)
  }, [filteredLaporan, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.kpi-card', [], { y: 16, stagger: 0.06 })
  useCountUp(containerRef, '.kpi-count-up')
  useInteractiveCards(containerRef, '.kpi-card')
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [page, filteredLaporan.length], { y: 8, stagger: 0.04, delay: 0.12 })

  // KPI Calculations
  const evaluatedLecturers = laporanData.filter((d) => d.isEvaluatedComplete)
  const avgInstitusiNum =
    evaluatedLecturers.length > 0
      ? Number((evaluatedLecturers.reduce((acc, c) => acc + c.nilaiAkhirTahunan, 0) / evaluatedLecturers.length).toFixed(1))
      : 0
  const avgInstitusi = avgInstitusiNum.toFixed(1)
  const predikatInstitusi =
    evaluatedLecturers.length === 0
      ? 'Belum Ada Data'
      : avgInstitusiNum > 90
      ? 'Sangat Baik'
      : avgInstitusiNum >= 81
      ? 'Baik'
      : avgInstitusiNum >= 71
      ? 'Cukup'
      : avgInstitusiNum >= 61
      ? 'Kurang'
      : 'Sangat Kurang'

  const bkdCompliantCount = laporanData.filter((d) => {
    const sksGenap = d.skpGenap?.totalSksRealisasi ?? 0
    const sksGanjil = d.skpGanjil?.totalSksRealisasi ?? 0
    return (sksGenap >= 12 && sksGenap <= 16) || (sksGanjil >= 12 && sksGanjil <= 16)
  }).length

  const bkdPersen =
    laporanData.length > 0 ? ((bkdCompliantCount / laporanData.length) * 100).toFixed(0) : '0'

  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Laporan Rekapitulasi Tahunan Per Dosen (Output Final)</h1>
          <p className="page-desc">
            Rekapitulasi prestasi kerja individual per dosen yang menggabungkan 2 kali SKP (70%) dan 1 kali Kuesioner Perilaku Tahunan (30%) sesuai Pedoman SPMI UBK No: 03.07.00/PD/SDM-SPMI.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-bento-grid-3" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            Rata-rata Kinerja Dosen Dinilai
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 6, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            <span className="kpi-count-up" data-count={avgInstitusi}>{avgInstitusi}</span>%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--brand-700)', marginTop: 4 }}>
            Predikat Institusi: <strong>{predikatInstitusi}</strong> ({evaluatedLecturers.length} dari {laporanData.length} Dosen Tuntas)
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            Formula Integrasi Tahunan SPMI UBK
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 8 }}>
            Persentase = (70% &times; Rata-rata SKP) + (30% &times; Kuesioner)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>
            Wajib dinilai SKP Ganjil, Genap, dan Kuesioner Tahunan untuk menerbitkan predikat
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            Kepatuhan Beban Kerja (BKD)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-success-ink)', marginTop: 6, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            <span className="kpi-count-up" data-count={bkdPersen}>{bkdPersen}</span>%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>
            {bkdCompliantCount} dari {laporanData.length} Dosen Memenuhi Standar BKD (12-16 SKS)
          </div>
        </div>
      </div>

      {/* Filter Card: Diperkaya, Seragam & Baris Search Lebar Penuh di Bawah */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Baris 1: Header Filter & Tombol Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
              Filter Rekapitulasi Data
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--brand-700)',
                background: 'var(--brand-100)',
                padding: '2px 8px',
                borderRadius: 'var(--r-full)',
              }}
            >
              Menampilkan {filteredLaporan.length} dari {laporanData.length} Dosen
            </span>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              style={{
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                borderRadius: 'var(--r-sm)',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--status-danger-ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Reset seluruh filter ke kondisi awal"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Baris 2: Kumpulan Dropdown Filter Seragam */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* 1. Tahun Akademik */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Tahun Akademik</label>
            <select
              className="custom-select"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
              }}
            >
              {availableYears.map((thn) => (
                <option key={thn} value={thn}>
                  TA {thn}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Fakultas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Fakultas</label>
            <select
              className="custom-select"
              value={selectedFakultas}
              onChange={(e) => setSelectedFakultas(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Fakultas</option>
              {availableFakultas.map((fak) => (
                <option key={fak} value={fak} title={fak}>
                  {fak}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Program Studi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Program Studi</label>
            <select
              className="custom-select"
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Program Studi</option>
              {availableProdis.map((p) => (
                <option key={p} value={p} title={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Kampus / PSDKU */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Kampus / Wilayah</label>
            <select
              className="custom-select"
              value={selectedKampus}
              onChange={(e) => setSelectedKampus(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Kampus</option>
              {availableKampus.map((k) => (
                <option key={k} value={k} title={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Jabatan Fungsional */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Jabatan Fungsional</label>
            <select
              className="custom-select"
              value={selectedJafung}
              onChange={(e) => setSelectedJafung(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Jafung</option>
              {availableJafungs.map((j) => (
                <option key={j} value={j} title={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Pangkat / Golongan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Pangkat / Golongan</label>
            <select
              className="custom-select"
              value={selectedGolongan}
              onChange={(e) => setSelectedGolongan(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Golongan</option>
              {availableGolongans.map((g) => (
                <option key={g} value={g} title={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 7. Status Pegawai */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Status Pegawai</label>
            <select
              className="custom-select"
              value={selectedStatusPegawai}
              onChange={(e) => setSelectedStatusPegawai(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Status Pegawai</option>
              {availableStatusPegawai.map((s) => (
                <option key={s} value={s} title={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 8. Status Evaluasi / Predikat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Status Kinerja</label>
            <select
              className="custom-select"
              value={selectedPredikatStatus}
              onChange={(e) => setSelectedPredikatStatus(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Status Evaluasi</option>
              <option value="Sudah Lengkap Dinilai">Sudah Lengkap Dinilai</option>
              <option value="Belum Dinilai">Belum Dinilai</option>
              <option value="Sangat Baik">Predikat: Sangat Baik</option>
              <option value="Baik">Predikat: Baik</option>
              <option value="Cukup">Predikat: Cukup</option>
              <option value="Kurang">Predikat: Kurang</option>
              <option value="Sangat Kurang">Predikat: Sangat Kurang</option>
            </select>
          </div>
        </div>

        {/* Baris 3: Search Bar di Bawah Filter dengan Lebar Penuh & Responsif */}
        <div style={{ position: 'relative', width: '100%', marginTop: 2 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchQuery ? 'var(--brand-600)' : 'var(--faint)',
              pointerEvents: 'none',
              transition: 'color 0.15s ease',
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nama dosen, NIP, NUPTK, prodi, atau fakultas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 42,
              paddingRight: searchQuery ? 68 : 14,
              height: 40,
              fontSize: '13px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--hair-strong)',
              background: 'var(--page-bg)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-xs)',
                padding: '2px 8px',
                fontSize: '11px',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Rekap Tahunan Gabungan 2x SKP + 1x Kuesioner */}
      <div className="table-container">
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 240 }}>Dosen &amp; Homebase</th>
              <th>SKP Ganjil</th>
              <th>SKP Genap</th>
              <th>Rata-rata SKP (70%)</th>
              <th>Kuesioner Tahunan (30%)</th>
              <th>Persentase Keberhasilan</th>
              <th>Predikat Kinerja</th>
              <th style={{ textAlign: 'right' }}>Dokumen Output Final</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLaporan.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={28} style={{ color: 'var(--faint)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                      Tidak Ada Data Rekapitulasi yang Cocok
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Silakan sesuaikan kata kunci pencarian atau ubah kriteria filter di atas.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLaporan.map((item) => {
                const canPrintFinal = item.isEvaluatedComplete

                return (
                  <tr key={item.dosen.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.dosen.nama}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                        NIP: {item.dosen.nip || '-'} &bull; NUPTK: {item.dosen.nuptk || '-'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 'var(--r-xs)',
                            background: '#f1f5f9',
                            color: 'var(--ink-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Building2 size={10} />
                          <span>{item.dosen.prodi}</span>
                        </span>
                        {item.dosen.kampus && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 'var(--r-xs)',
                              background: '#f8fafc',
                              color: 'var(--muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <MapPin size={10} />
                            <span>{item.dosen.kampus}</span>
                          </span>
                        )}
                        {item.dosen.isKaprodi && (
                          <span className="badge-pill badge-pill--blue" style={{ fontSize: '10px' }}>
                            Kaprodi
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SKP Ganjil */}
                    <td>
                      {item.nilaiSKPGanjil > 0 ? (
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {item.nilaiSKPGanjil.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Belum Ada</span>
                      )}
                    </td>

                    {/* SKP Genap */}
                    <td>
                      {item.nilaiSKPGenap > 0 ? (
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {item.nilaiSKPGenap.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Belum Ada</span>
                      )}
                    </td>

                    {/* Rata-rata SKP (70%) */}
                    <td>
                      {item.rataRataSKP > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontVariantNumeric: 'tabular-nums' }}>
                            {item.rataRataSKP.toFixed(1)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Bobot 70%: <strong>{item.bobotSKP70.toFixed(1)}</strong>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>

                    {/* Kuesioner Tahunan (30%) */}
                    <td>
                      {item.nilaiKuisSkala4 > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                            {item.nilaiKuisSkala4.toFixed(2)}{' '}
                            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>/ 4.00</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Bobot 30%: <strong>{item.bobotKuis30.toFixed(1)}</strong>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Belum Dinilai</span>
                      )}
                    </td>

                    {/* Persentase Keberhasilan */}
                    <td>
                      {item.isEvaluatedComplete ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: 'var(--navy-900)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {item.nilaiAkhirTahunan.toFixed(1)}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-600)' }}>%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>-</span>
                      )}
                    </td>

                    {/* Predikat Kinerja */}
                    <td>
                      <span
                        className={`badge-pill ${
                          item.predikat === 'Sangat Baik'
                            ? 'badge-pill--green'
                            : item.predikat === 'Baik'
                            ? 'badge-pill--blue'
                            : item.predikat === 'Cukup'
                            ? 'badge-pill--orange'
                            : item.predikat === 'Kurang' || item.predikat === 'Sangat Kurang'
                            ? 'badge-pill--red'
                            : 'badge-pill--gray'
                        }`}
                      >
                        {item.predikat === 'Sangat Baik' && <CheckCircle size={11} />}
                        <span>{item.predikat}</span>
                      </span>
                    </td>

                    {/* Dokumen Output Final Button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (!canPrintFinal) {
                            onShowToast(
                              'Laporan Final belum dapat dicetak karena SKP Ganjil & Genap harus sudah disahkan serta kuesioner tahunan telah dinilai.'
                            )
                            return
                          }
                          openPrintOutputFinal(item)
                        }}
                        className="btn-action-print"
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          opacity: canPrintFinal ? 1 : 0.45,
                          cursor: canPrintFinal ? 'pointer' : 'not-allowed',
                        }}
                        title={
                          canPrintFinal
                            ? 'Buka dan cetak Dokumen Output Final Tahunan'
                            : 'Menunggu penilaian lengkap SKP Ganjil, Genap, dan Kuesioner'
                        }
                      >
                        <FileText size={13} />
                        <span>{canPrintFinal ? 'Cetak Output Final' : 'Belum Lengkap'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <TablePagination
        totalItems={filteredLaporan.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Cetak Output Final Modal jika dibuka inline */}
      <CetakOutputFinalTahunan
        data={selectedOutputFinal}
        isOpen={Boolean(selectedOutputFinal)}
        onClose={() => setSelectedOutputFinal(null)}
      />
    </div>
  )
}
