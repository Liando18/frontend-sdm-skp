import React, { useState, useRef, useEffect } from 'react'
import {
  ExternalLink,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Printer,
  Send,
} from 'lucide-react'
import { PengajuanSKP, SKPItem, KomponenSKP, UserSession, Dosen } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface KelolaSKPDosenSelfProps {
  user?: UserSession
  skpList?: PengajuanSKP[]
  mySKP?: PengajuanSKP
  dosenList?: Dosen[]
  komponenList: KomponenSKP[]
  onUpdateSKP: (skp: PengajuanSKP) => void
  onSubmitSKP?: (skpId: string) => void
  onShowToast: (msg: string) => void
}

const TAHUN_AJARAN_OPTIONS = ['2024/2025', '2025/2026', '2026/2027']

// Formula Kual / Mutu (%):
// Jika Perubahan Tengah == 0: (Realisasi Akhir / Rencana Awal) * 100
// Jika Perubahan Tengah != 0: (Realisasi Akhir / Perubahan Tengah) * 100
export const calculateMutu = (
  rencanaAwal: number,
  perubahanTengah: number,
  realisasiAkhir: number
): number => {
  const ra = Number(rencanaAwal) || 0
  const pt = Number(perubahanTengah) || 0
  const rel = Number(realisasiAkhir) || 0

  if (rel <= 0) return 0

  const target = pt !== 0 ? pt : ra
  if (target <= 0) return 0

  const val = (rel / target) * 100
  return Number(val.toFixed(2))
}

export const KelolaSKPDosenSelf: React.FC<KelolaSKPDosenSelfProps> = ({
  user,
  skpList = [],
  mySKP,
  dosenList = [],
  komponenList,
  onUpdateSKP,
  onSubmitSKP,
  onShowToast,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>(
    mySKP?.tahunAkademik || '2025/2026'
  )
  const [selectedSemester, setSelectedSemester] = useState<'Genap' | 'Ganjil'>(
    (mySKP?.semester as 'Genap' | 'Ganjil') || 'Genap'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua')
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<any>(null)

  const candidateName = user?.name || mySKP?.dosenNama || ''
  const isSDM = Boolean(user?.role === 'sdm')
  const isDekan = Boolean(
    user?.role === 'dekan' ||
    user?.rank?.toLowerCase().includes('dekan')
  )

  const isKaprodi =
    !isDekan && !isSDM && Boolean(
      user?.role === 'kaprodi' ||
      mySKP?.penilaiRole === 'Dekan' ||
      mySKP?.dosenJabatan?.toLowerCase().includes('ketua program studi') ||
      user?.rank?.toLowerCase().includes('ketua program studi')
    )

  const targetDosenId =
    user?.id || mySKP?.dosenId || ''
  const targetDosenNama =
    user?.name || mySKP?.dosenNama || (isDekan ? 'Dekan Fakultas' : isKaprodi ? 'Ketua Program Studi' : isSDM ? 'SDM' : 'Dosen')
  const targetDosenNip =
    user?.nip || mySKP?.dosenNip || ''
  const targetDosenProdi = user?.prodi || mySKP?.dosenProdi || (isSDM ? 'Direktorat Sumber Daya Manusia' : '')
  const targetDosenRank =
    user?.rank || mySKP?.dosenPangkat || (isDekan ? 'Dekan Fakultas' : isKaprodi ? 'Ketua Program Studi' : isSDM ? 'Staf SDM' : 'Dosen Tetap')

  // Find existing SKP for this lecturer/kaprodi/dekan, semester, and academic year
  const getActiveSKP = (): PengajuanSKP => {
    const found = skpList.find(
      (s) =>
        (s.dosenId === targetDosenId || s.dosenNama === targetDosenNama) &&
        s.semester === selectedSemester &&
        s.tahunAkademik === selectedTahun
    )
    if (found) return found

    if (mySKP && mySKP.semester === selectedSemester && mySKP.tahunAkademik === selectedTahun) {
      return mySKP
    }

    // Dynamic assessor resolution from database dosenList
    const kaprodiDosen = dosenList.find((d) => d.isKaprodi && (d.prodi === targetDosenProdi || !targetDosenProdi)) || dosenList.find((d) => d.isKaprodi)
    const dekanDosen = dosenList.find((d) => d.isDekan || d.jafung?.toLowerCase().includes('dekan')) || dosenList[0]

    const penilai = isKaprodi ? dekanDosen : kaprodiDosen

    return {
      id: `skp-${targetDosenId}-${selectedSemester.toLowerCase()}-${selectedTahun.replace('/', '-')}`,
      dosenId: targetDosenId,
      dosenNama: targetDosenNama,
      dosenNip: targetDosenNip,
      dosenProdi: targetDosenProdi,
      dosenPangkat: targetDosenRank,
      dosenJabatan: isDekan ? `Dekan ${user?.fakultas || 'Fakultas'}` : isKaprodi ? `Ketua Program Studi ${targetDosenProdi}` : isSDM ? 'Kepala Bagian SDM' : 'Dosen Tetap',
      penilaiNama: penilai ? penilai.nama : (isKaprodi ? 'Dekan Fakultas' : 'Ketua Program Studi'),
      penilaiNip: penilai ? penilai.nip : '',
      penilaiPangkat: penilai ? penilai.golongan : '',
      penilaiJabatan: isKaprodi ? `Dekan ${user?.fakultas || 'Fakultas'}` : `Ketua Program Studi ${targetDosenProdi}`,
      penilaiUnit: isKaprodi ? (user?.fakultas || 'Fakultas') : targetDosenProdi,
      penilaiRole: isKaprodi ? 'Dekan' : 'Kaprodi',
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      totalSksRencana: 0,
      totalSksRealisasi: 0,
      persentaseCapaian: 0,
      nilaiKinerjaSKP: 0,
      status: 'Draft',
      tanggalPengajuan: '',
      catatanKaprodi: '',
      catatanSDM: '',
      items: [],
    }
  }

  const activeSKP = getActiveSKP()

  // Load ALL components from komponenList across all semesters and years (Default values = 0)
  const initializeItems = (): SKPItem[] => {
    const existingItems = activeSKP.items || []
    return komponenList.map((komp, idx) => {
      const match = existingItems.find(
        (it) => it.komponenId === komp.id || it.kegiatan === komp.namaKegiatan
      )
      if (match) {
        const mutu = calculateMutu(match.rencanaAwal, match.perubahanTengah, match.realisasi)
        return {
          ...match,
          kode: komp.kode,
          kategori: komp.kategori,
          satuan: komp.satuan,
          waktuNilai: komp.waktuNilai || 6,
          waktuSatuan: komp.waktuSatuan === 'tahun' ? 'thn' : 'bln',
          kualitasMutu: mutu,
          nilaiCapaian: mutu,
        }
      }
      return {
        id: `item-${selectedTahun.replace('/', '-')}-${selectedSemester.toLowerCase()}-${komp.id}-${idx}`,
        komponenId: komp.id,
        kode: komp.kode,
        kegiatan: komp.namaKegiatan,
        kategori: komp.kategori,
        rencanaAwal: 0,
        perubahanTengah: 0,
        realisasi: 0,
        satuan: komp.satuan,
        kualitasMutu: 0,
        waktuNilai: komp.waktuNilai || 6,
        waktuSatuan: komp.waktuSatuan === 'tahun' ? 'thn' : 'bln',
        linkDokumen: '',
        nilaiCapaian: 0,
      }
    })
  }

  const [items, setItems] = useState<SKPItem[]>(initializeItems)

  useEffect(() => {
    setItems(initializeItems())
  }, [selectedSemester, selectedTahun, activeSKP.id, komponenList.length])

  // Handle direct inline inputs in the table for Rencana Awal, Perubahan Tengah, Realisasi Akhir, and Link Dokumen
  const handleInlineChange = (
    itemId: string,
    field: 'rencanaAwal' | 'perubahanTengah' | 'realisasi' | 'linkDokumen',
    rawValue: number | string
  ) => {
    const updated = items.map((it) => {
      if (it.id === itemId) {
        const ra = field === 'rencanaAwal' ? Math.max(0, Number(rawValue) || 0) : it.rencanaAwal
        const pt = field === 'perubahanTengah' ? Math.max(0, Number(rawValue) || 0) : it.perubahanTengah
        const rel = field === 'realisasi' ? Math.max(0, Number(rawValue) || 0) : it.realisasi
        const mutu = calculateMutu(ra, pt, rel)

        return {
          ...it,
          [field]: field === 'linkDokumen' ? rawValue : Math.max(0, Number(rawValue) || 0),
          kualitasMutu: mutu,
          nilaiCapaian: mutu,
        }
      }
      return it
    })

    setItems(updated)

    // Live update active SKP in parent state
    const newTotalRencana = updated.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
    const newTotalRealisasi = updated.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)

    const itemsWithTarget = updated.filter(
      (it) => Number(it.perubahanTengah || it.rencanaAwal) > 0
    )
    const newMutu =
      itemsWithTarget.length > 0
        ? Number(
            (
              itemsWithTarget.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
              itemsWithTarget.length
            ).toFixed(2)
          )
        : 0

    const newPersen =
      newTotalRencana > 0 ? Number(((newTotalRealisasi / newTotalRencana) * 100).toFixed(1)) : 0

    const updatedSKP: PengajuanSKP = {
      ...activeSKP,
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      items: updated,
      totalSksRencana: newTotalRencana,
      totalSksRealisasi: newTotalRealisasi,
      persentaseCapaian: newPersen,
      nilaiKinerjaSKP: newMutu,
    }

    setIsSaving(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateSKP(updatedSKP)
      setIsSaving(false)
    }, 600)
  }

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    const newTotalRencana = items.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
    const newTotalRealisasi = items.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)
    const itemsWithTarget = items.filter((it) => Number(it.perubahanTengah || it.rencanaAwal) > 0)
    const newMutu =
      itemsWithTarget.length > 0
        ? Number(
            (
              itemsWithTarget.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
              itemsWithTarget.length
            ).toFixed(2)
          )
        : 0
    const newPersen =
      newTotalRencana > 0 ? Number(((newTotalRealisasi / newTotalRencana) * 100).toFixed(1)) : 0

    const updatedSKP: PengajuanSKP = {
      ...activeSKP,
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      items,
      totalSksRencana: newTotalRencana,
      totalSksRealisasi: newTotalRealisasi,
      persentaseCapaian: newPersen,
      nilaiKinerjaSKP: newMutu,
    }
    onUpdateSKP(updatedSKP)
    setIsSaving(false)
    onShowToast('Perubahan target dan realisasi SKP berhasil disimpan!')
  }

  // Summary Metrics Calculation
  const totalRencana = items.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
  const totalRealisasi = items.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)

  const itemsWithTarget = items.filter(
    (it) => Number(it.perubahanTengah || it.rencanaAwal) > 0
  )
  const totalMutuRataRata =
    itemsWithTarget.length > 0
      ? (
          itemsWithTarget.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
          itemsWithTarget.length
        ).toFixed(2)
      : '0.00'

  const persenCapaian =
    totalRencana > 0 ? ((totalRealisasi / totalRencana) * 100).toFixed(1) : '0.0'

  // Filter items by category and search
  const filteredItems = items.filter((it) => {
    const matchKategori = selectedKategori === 'Semua' || it.kategori === selectedKategori
    const matchSearch =
      it.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.kode && it.kode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.kategori && it.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchKategori && matchSearch
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(
    containerRef,
    '.custom-table tbody tr',
    [selectedSemester, selectedTahun, selectedKategori, searchQuery],
    { y: 6, stagger: 0.02 }
  )

  const kategoriList = [
    'Semua',
    ...Array.from(new Set(komponenList.map((k) => k.kategori).filter(Boolean))),
  ]

  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isDekan
              ? 'Sasaran Kinerja Pegawai (SKP) Dekan Fakultas'
              : isKaprodi
              ? 'Sasaran Kinerja Pegawai (SKP) Ketua Program Studi'
              : isSDM
              ? 'Sasaran Kinerja Pegawai (SKP) Tenaga Kependidikan / SDM'
              : 'Sasaran Kinerja Pegawai (SKP) Dosen'}
          </h1>
          <p className="page-desc">
            {isDekan
              ? 'Seluruh komponen tugas jabatan Dekan Fakultas & Tridharma ditampilkan. Sesuai regulasi akademik UBK, berkas SKP Dekan dinilai dan disahkan oleh Ketua Program Studi tempat homebase dosen.'
              : isKaprodi
              ? 'Seluruh komponen tugas jabatan Ka Prodi & Tridharma ditampilkan. Berkas SKP ini direview, dinilai, dan disahkan dengan tanda tangan digital resmi oleh Dekan Fakultas.'
              : isSDM
              ? 'Seluruh komponen SKP tugas administrasi, kepegawaian & tata kelola SDM ditampilkan. Berkas SKP dinilai dan disahkan oleh Ketua Program Studi.'
              : 'Seluruh komponen SKP ditampilkan. Input nilai Rencana Awal, Perubahan Tengah, Realisasi Akhir, dan Tautan Dokumen secara langsung pada tabel di bawah ini.'}
          </p>
        </div>
      </div>

      {/* Filter Waktu: Semester & Tahun Ajaran */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 22px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--navy-900)', fontWeight: 700, fontSize: '13.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Filter size={17} color="var(--brand-600)" />
            <span>Filter Periode SKP</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--hair)', display: 'inline-block' }} />

          {/* Dropdown Tahun Ajaran */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              Tahun Ajaran
            </span>
            <select
              className="custom-select"
              style={{
                height: 38,
                width: 'auto',
                minWidth: 140,
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
              }}
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
            >
              {TAHUN_AJARAN_OPTIONS.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Semester */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              Semester
            </span>
            <div style={{ display: 'inline-flex', gap: 4, background: 'var(--panel-hover)', padding: 3, borderRadius: 'var(--r-md)' }}>
              <button
                type="button"
                onClick={() => setSelectedSemester('Ganjil')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedSemester === 'Ganjil' ? 'var(--navy-900)' : 'transparent',
                  color: selectedSemester === 'Ganjil' ? '#ffffff' : 'var(--muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--ease)',
                  whiteSpace: 'nowrap',
                }}
              >
                Semester Ganjil
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('Genap')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedSemester === 'Genap' ? 'var(--navy-900)' : 'transparent',
                  color: selectedSemester === 'Genap' ? '#ffffff' : 'var(--muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--ease)',
                  whiteSpace: 'nowrap',
                }}
              >
                Semester Genap
              </button>
            </div>
          </div>
        </div>

        {/* Lecturer / Kaprodi / Dekan identity info */}
        <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {isDekan ? 'Dekan: ' : isKaprodi ? 'Ka Prodi: ' : isSDM ? 'Pegawai SDM: ' : 'Dosen: '}
          <strong style={{ color: 'var(--ink)' }}>{targetDosenNama}</strong> &bull; NIP: <strong>{targetDosenNip}</strong> &bull; Homebase: <strong>{targetDosenProdi}</strong>
        </div>
      </div>

      {/* SKP Summary Metrics */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          borderRadius: 'var(--r-lg)',
          padding: '14px 22px',
          border: '1px solid var(--hair)',
        }}
      >
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Komponen: </span>
            <strong style={{ color: 'var(--ink)' }}>{items.length} Komponen</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Rencana Awal: </span>
            <strong style={{ color: 'var(--ink)' }}>{totalRencana}</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Realisasi Akhir: </span>
            <strong style={{ color: 'var(--brand-700)' }}>{totalRealisasi}</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Rata-rata Mutu Capaian: </span>
            <strong style={{ color: 'var(--brand-600)', fontSize: '14px' }}>
              {totalMutuRataRata}%
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Capaian Volume: </span>
            <strong style={{ color: Number(persenCapaian) >= 100 ? 'var(--status-success-ink)' : 'var(--brand-600)' }}>
              {persenCapaian}%
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="badge-pill badge-pill--blue"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11.5px' }}
          >
            <span>
              Penilai:{' '}
              <strong>
                {activeSKP.penilaiNama
                  ? `${activeSKP.penilaiNama} (${activeSKP.penilaiJabatan})`
                  : activeSKP.penilaiJabatan || (isDekan ? `Ketua Program Studi ${targetDosenProdi}` : isKaprodi ? `Dekan ${user?.fakultas || 'Fakultas'}` : 'Ketua Program Studi')}
              </strong>
            </span>
          </span>
          <span
            className={`badge-pill ${
              activeSKP.status === 'Disetujui SDM'
                ? 'badge-pill--green'
                : activeSKP.status === 'Dinilai Dekan' || activeSKP.status === 'Dinilai Kaprodi'
                ? 'badge-pill--blue'
                : 'badge-pill--orange'
            }`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11.5px' }}
          >
            <CheckCircle2 size={13} />
            <span>Status: {activeSKP.status}</span>
          </span>

          {/* Action: Simpan Draft */}
          <button
            type="button"
            onClick={handleManualSave}
            className="brand-btn brand-btn--outline"
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--r-md)', background: '#ffffff' }}
            title="Simpan perubahan data SKP secara manual"
          >
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
          </button>

          {/* Action: Cetak Formulir SKP */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="brand-btn brand-btn--outline"
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--r-md)', background: '#ffffff' }}
            title="Cetak Formulir Standar SKP Dosen"
          >
            <Printer size={13} />
            <span>Cetak SKP</span>
          </button>

          {/* Action: Submit / Ajukan SKP ke Atasan */}
          {(activeSKP.status === 'Draft' || activeSKP.status === 'Perlu Revisi' || !activeSKP.status) && (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="brand-btn btn-action-add"
              style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: 'var(--r-md)' }}
            >
              <Send size={13} />
              <span>{isKaprodi ? 'Ajukan ke Dekan' : 'Ajukan ke Kaprodi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {kategoriList.map((kat, idx) => {
            const count = kat === 'Semua' ? items.length : items.filter((it) => it.kategori === kat).length
            if (count === 0 && kat !== 'Semua') return null
            return (
              <button
                key={idx}
                onClick={() => setSelectedKategori(kat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--r-md)',
                  border: selectedKategori === kat ? '1px solid var(--navy-900)' : '1px solid var(--hair)',
                  background: selectedKategori === kat ? 'var(--navy-900)' : 'var(--panel-bg)',
                  color: selectedKategori === kat ? '#ffffff' : 'var(--muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s var(--ease)',
                }}
              >
                {kat} ({count})
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative', width: 250 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Cari kegiatan tugas jabatan..."
            className="custom-input"
            style={{ paddingLeft: 30, height: 36, fontSize: '12.5px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table: Direct Inline Inputs */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: 36, textAlign: 'center' }}>No</th>
              <th style={{ minWidth: 260 }}>Kegiatan Tugas Jabatan</th>
              <th style={{ textAlign: 'center', width: 80 }}>Satuan</th>
              <th style={{ textAlign: 'center', width: 110 }}>Rencana Awal</th>
              <th style={{ textAlign: 'center', width: 110 }}>Perubahan Tengah</th>
              <th style={{ textAlign: 'center', width: 110 }}>Realisasi Akhir</th>
              <th style={{ textAlign: 'center', width: 95 }}>Mutu (%)</th>
              <th style={{ textAlign: 'center', width: 80 }}>Waktu</th>
              <th style={{ minWidth: 200 }}>Tautan Bukti Fisik</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((it, idx) => (
              <tr key={it.id}>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                  {idx + 1}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px', lineHeight: 1.35 }}>
                    {it.kegiatan}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {it.kode && (
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '10.5px',
                          background: 'var(--panel-hover)',
                          padding: '1px 5px',
                          borderRadius: 'var(--r-xs)',
                          border: '1px solid var(--hair)',
                          color: 'var(--muted)',
                        }}
                      >
                        {it.kode}
                      </span>
                    )}
                    {it.kategori && (
                      <span
                        className={`badge-pill ${
                          it.kategori === 'Pendidikan'
                            ? 'badge-pill--green'
                            : it.kategori === 'Penelitian'
                            ? 'badge-pill--blue'
                            : it.kategori === 'Pengabdian'
                            ? 'badge-pill--orange'
                            : 'badge-pill--gray'
                        }`}
                        style={{ fontSize: '10px', padding: '1px 6px' }}
                      >
                        {it.kategori}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)', fontSize: '12px' }}>
                  {it.satuan}
                </td>

                {/* Inline Input 1: Rencana Awal */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="table-inline-input"
                    value={it.rencanaAwal}
                    onChange={(e) => handleInlineChange(it.id, 'rencanaAwal', e.target.value)}
                  />
                </td>

                {/* Inline Input 2: Perubahan Tengah */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="table-inline-input"
                    value={it.perubahanTengah}
                    onChange={(e) => handleInlineChange(it.id, 'perubahanTengah', e.target.value)}
                  />
                </td>

                {/* Inline Input 3: Realisasi Akhir */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="table-inline-input table-inline-input--highlight"
                    value={it.realisasi}
                    onChange={(e) => handleInlineChange(it.id, 'realisasi', e.target.value)}
                  />
                </td>

                {/* Terhitung Otomatis: Kual / Mutu (%) */}
                <td style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '12.5px',
                      color:
                        it.kualitasMutu >= 90
                          ? 'var(--status-success-ink)'
                          : it.kualitasMutu > 0
                          ? 'var(--brand-700)'
                          : 'var(--muted)',
                    }}
                  >
                    {it.kualitasMutu}%
                  </span>
                </td>

                {/* Waktu Baku */}
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                  {it.waktuNilai || 6} {it.waktuSatuan || 'bln'}
                </td>

                {/* Inline Input 4: Tautan Dokumen Bukti Fisik */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="url"
                      placeholder="https://siakad.bku.ac.id/dokumen/..."
                      className="custom-input"
                      style={{
                        height: 34,
                        fontSize: '12px',
                        flex: 1,
                        padding: '4px 10px',
                        minWidth: 150,
                      }}
                      value={it.linkDokumen || ''}
                      onChange={(e) => handleInlineChange(it.id, 'linkDokumen', e.target.value)}
                    />
                    {it.linkDokumen && (
                      <a
                        href={it.linkDokumen}
                        target="_blank"
                        rel="noreferrer"
                        className="table-action-btn"
                        style={{ flexShrink: 0, width: 30, height: 30, display: 'grid', placeItems: 'center' }}
                        title="Buka Tautan Dokumen Bukti"
                      >
                        <ExternalLink size={13} color="var(--brand-600)" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cetak Formulir SKP */}
      {isPrintModalOpen && (
        <FormulirCetakSKP
          isOpen={isPrintModalOpen}
          skp={activeSKP}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Modal Konfirmasi Submit SKP */}
      {showSubmitConfirm && (
        <ConfirmDialog
          isOpen={showSubmitConfirm}
          title="Konfirmasi Pengajuan SKP"
          message={`Apakah Anda yakin ingin mengajukan berkas SKP Semester ${selectedSemester} Tahun Ajaran ${selectedTahun} ke ${
            isKaprodi ? 'Dekan Fakultas' : 'Ketua Program Studi'
          } untuk diperiksa dan diverifikasi?`}
          confirmText="Ya, Ajukan SKP"
          cancelText="Batal"
          onConfirm={() => {
            if (onSubmitSKP) {
              onSubmitSKP(activeSKP.id)
            } else {
              onUpdateSKP({ ...activeSKP, status: 'Diajukan' })
              onShowToast('SKP berhasil diajukan ke atasan untuk dinilai!')
            }
            setShowSubmitConfirm(false)
          }}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  )
}
