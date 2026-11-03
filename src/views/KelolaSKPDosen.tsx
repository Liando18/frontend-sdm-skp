import React, { useState, useRef, useMemo } from 'react'
import {
  FileCheck2,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Clock,
  RotateCcw,
  AlertCircle,
  Building2,
  Send,
} from 'lucide-react'
import { PengajuanSKP, Dosen, Fakultas } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { openPrintSKP } from '../utils/printSKP'
import { useStaggerEntrance } from '../utils/animations'
import { sanitizeUrl } from '../utils/security'
import { TablePagination } from '../components/TablePagination'
import { DEFAULT_TAHUN_AJARAN_OPTIONS, getDefaultAcademicYear } from '../utils/academicYear'

interface KelolaSKPDosenProps {
  skpList: PengajuanSKP[]
  dosenList?: Dosen[]
  fakultasList?: Fakultas[]
  prodiList?: string[]
  onApproveSKP: (id: string, notes: string) => void
  onRejectSKP: (id: string, notes: string) => void
  initialSelectedSKP?: PengajuanSKP | null
  onShowToast: (msg: string) => void
}

interface MonitoringSKPItem {
  id: string
  dosenId: string
  dosenNama: string
  dosenNuptk?: string
  dosenNip: string
  dosenJabatan: string
  dosenProdi: string
  dosenFakultas: string
  dosenKampus: string
  semester: string
  tahunAkademik: string
  totalSksRealisasi: number
  nilaiKinerjaSKP: number
  status: string
  hasTtd: boolean
  skp: PengajuanSKP | null
}

export const KelolaSKPDosen: React.FC<KelolaSKPDosenProps> = ({
  skpList,
  dosenList,
  fakultasList,
  prodiList: prodiListProp,
  initialSelectedSKP,
  onApproveSKP,
  onRejectSKP,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'review'>(initialSelectedSKP ? 'review' : 'list')
  const [selectedSKP, setSelectedSKP] = useState<PengajuanSKP | null>(initialSelectedSKP || null)

  // Selalu rujuk ke data SKP paling mutakhir dari skpList
  const currentSelectedSKP = useMemo(() => {
    if (!selectedSKP) return null
    return skpList.find((s) => s.id === selectedSKP.id) || selectedSKP
  }, [skpList, selectedSKP])

  const [sdmNotes, setSdmNotes] = useState(initialSelectedSKP?.catatanSDM || '')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [printSKPTarget, setPrintSKPTarget] = useState<PengajuanSKP | null>(null)

  // React pattern for adjusting state when prop changes without cascading effect
  const [prevInitial, setPrevInitial] = useState(initialSelectedSKP)
  if (initialSelectedSKP && prevInitial?.id !== initialSelectedSKP.id) {
    setPrevInitial(initialSelectedSKP)
    setSelectedSKP(initialSelectedSKP)
    setSdmNotes(initialSelectedSKP.catatanSDM || '')
    setViewMode('review')
  }

  // Opsi Tahun Akademik
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set([
        ...skpList.map((s) => s.tahunAkademik).filter(Boolean),
        ...DEFAULT_TAHUN_AJARAN_OPTIONS,
      ])
    )
    return years.sort().reverse()
  }, [skpList])

  // Opsi Fakultas Dinamis
  const availableFakultas = useMemo(() => {
    const set = new Set<string>()
    if (fakultasList && fakultasList.length > 0) {
      fakultasList.forEach((f) => {
        if (f.nama) set.add(f.nama)
      })
    }
    if (dosenList && dosenList.length > 0) {
      dosenList.forEach((d) => {
        if (d.fakultas) set.add(d.fakultas)
      })
    }
    return Array.from(set).sort()
  }, [fakultasList, dosenList])

  // Opsi Program Studi Dinamis
  const availableProdis = useMemo(() => {
    if (prodiListProp && prodiListProp.length > 0) {
      return prodiListProp[0] === 'Semua Program Studi' ? prodiListProp.slice(1) : prodiListProp
    }
    const set = new Set<string>()
    skpList.forEach((s) => {
      if (s.dosenProdi) set.add(s.dosenProdi)
    })
    if (dosenList) {
      dosenList.forEach((d) => {
        if (d.prodi) set.add(d.prodi)
      })
    }
    return Array.from(set).sort()
  }, [prodiListProp, skpList, dosenList])

  // State Filter
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua')
  const [selectedSemester, setSelectedSemester] = useState<string>('Semua')
  const [selectedFakultas, setSelectedFakultas] = useState<string>('Semua')
  const [selectedProdi, setSelectedProdi] = useState<string>('Semua Program Studi')
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua')
  const [selectedSksBeban, setSelectedSksBeban] = useState<string>('Semua')
  const [selectedTtd, setSelectedTtd] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  const tahunList = ['Semua', ...availableYears]
  const statusOptions = [
    { value: 'Semua', label: 'Semua Status' },
    { value: 'Belum Mengajukan', label: 'Belum Mengajukan' },
    { value: 'Diajukan', label: 'Diajukan Dosen' },
    { value: 'Dinilai Kaprodi / Dekan', label: 'Dinilai Kaprodi / Dekan' },
    { value: 'Sah & Terbit', label: 'Sah & Terbit Resmi' },
    { value: 'Perlu Revisi', label: 'Perlu Revisi' },
  ]

  // Bangun data pemantauan: dosen yang belum mengajukan tetap tampil dengan status 'Belum Mengajukan'
  const allItems: MonitoringSKPItem[] = useMemo(() => {
    if (dosenList && dosenList.length > 0) {
      const items: MonitoringSKPItem[] = []

      dosenList.forEach((dosen) => {
        // Cari pengajuan SKP non-Draft milik dosen ini
        const userSkps = skpList.filter(
          (s) =>
            (s.dosenId === dosen.id ||
              (dosen.nuptk && dosen.nuptk !== '-' && s.dosenNuptk && s.dosenNuptk === dosen.nuptk) ||
              (dosen.nip && dosen.nip !== '-' && s.dosenNip && s.dosenNip === dosen.nip)) &&
            s.status &&
            s.status !== 'Draft'
        )

        if (userSkps.length > 0) {
          userSkps.forEach((skp) => {
            items.push({
              id: skp.id,
              dosenId: dosen.id,
              dosenNama: skp.dosenNama || dosen.nama,
              dosenNuptk: skp.dosenNuptk || dosen.nuptk || '',
              dosenNip: skp.dosenNip || dosen.nip,
              dosenJabatan: skp.dosenJabatan || dosen.jafung,
              dosenProdi: skp.dosenProdi || dosen.prodi,
              dosenFakultas: dosen.fakultas || '',
              dosenKampus: dosen.kampus || '',
              semester: skp.semester,
              tahunAkademik: skp.tahunAkademik,
              totalSksRealisasi: skp.totalSksRealisasi || 0,
              nilaiKinerjaSKP: skp.nilaiKinerjaSKP || 0,
              status: skp.status,
              hasTtd: Boolean(skp.ttdKaprodiUrl || skp.ttdDekanUrl),
              skp: skp,
            })
          })
        } else {
          // Dosen belum mengajukan SKP apapun pada periode berjalan (atau masih tersimpan di Draft)
          items.push({
            id: `belum-${dosen.id}`,
            dosenId: dosen.id,
            dosenNama: dosen.nama,
            dosenNuptk: dosen.nuptk || '',
            dosenNip: dosen.nip,
            dosenJabatan: dosen.jafung,
            dosenProdi: dosen.prodi,
            dosenFakultas: dosen.fakultas || '',
            dosenKampus: dosen.kampus || '',
            semester: selectedSemester !== 'Semua' ? selectedSemester : 'Ganjil',
            tahunAkademik: selectedTahun !== 'Semua' ? selectedTahun : (availableYears[0] || getDefaultAcademicYear()),
            totalSksRealisasi: 0,
            nilaiKinerjaSKP: 0,
            status: 'Belum Mengajukan',
            hasTtd: false,
            skp: null,
          })
        }
      })

      return items
    }

    // Fallback jika dosenList tidak tersedia: map dari skpList (non-draft)
    return skpList
      .filter((s) => s.status && s.status !== 'Draft')
      .map((skp) => ({
        id: skp.id,
        dosenId: skp.dosenId,
        dosenNama: skp.dosenNama,
        dosenNuptk: skp.dosenNuptk || '',
        dosenNip: skp.dosenNip,
        dosenJabatan: skp.dosenJabatan,
        dosenProdi: skp.dosenProdi,
        dosenFakultas: '',
        dosenKampus: '',
        semester: skp.semester,
        tahunAkademik: skp.tahunAkademik,
        totalSksRealisasi: skp.totalSksRealisasi || 0,
        nilaiKinerjaSKP: skp.nilaiKinerjaSKP || 0,
        status: skp.status,
        hasTtd: Boolean(skp.ttdKaprodiUrl || skp.ttdDekanUrl),
        skp: skp,
      }))
  }, [dosenList, skpList, selectedSemester, selectedTahun, availableYears])

  const isFiltered =
    selectedTahun !== 'Semua' ||
    selectedSemester !== 'Semua' ||
    selectedFakultas !== 'Semua' ||
    selectedProdi !== 'Semua Program Studi' ||
    selectedStatus !== 'Semua' ||
    selectedSksBeban !== 'Semua' ||
    selectedTtd !== 'Semua' ||
    searchQuery.trim() !== ''

  const handleResetFilters = () => {
    setSelectedTahun('Semua')
    setSelectedSemester('Semua')
    setSelectedFakultas('Semua')
    setSelectedProdi('Semua Program Studi')
    setSelectedStatus('Semua')
    setSelectedSksBeban('Semua')
    setSelectedTtd('Semua')
    setSearchQuery('')
    setPage(1)
  }

  const filteredList = useMemo(() => {
    return allItems.filter((item) => {
      if (selectedTahun !== 'Semua' && item.tahunAkademik !== selectedTahun) return false
      if (selectedSemester !== 'Semua' && item.semester !== selectedSemester) return false
      if (selectedFakultas !== 'Semua' && item.dosenFakultas !== selectedFakultas) return false
      if (selectedProdi !== 'Semua Program Studi' && item.dosenProdi !== selectedProdi) return false

      if (selectedStatus !== 'Semua') {
        const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM'].includes(item.status)
        const isReviewPimpinan = ['Dinilai Kaprodi', 'Dinilai Dekan'].includes(item.status)

        if (selectedStatus === 'Sah & Terbit') {
          if (!isSah) return false
        } else if (selectedStatus === 'Dinilai Kaprodi / Dekan') {
          if (!isReviewPimpinan) return false
        } else if (item.status !== selectedStatus) {
          return false
        }
      }

      if (selectedSksBeban !== 'Semua') {
        if (selectedSksBeban === 'standar' && (item.totalSksRealisasi < 12 || item.totalSksRealisasi > 16)) return false
        if (selectedSksBeban === 'kurang' && item.totalSksRealisasi >= 12) return false
        if (selectedSksBeban === 'lebih' && item.totalSksRealisasi <= 16) return false
      }

      if (selectedTtd !== 'Semua') {
        if (selectedTtd === 'ada' && !item.hasTtd) return false
        if (selectedTtd === 'belum' && item.hasTtd) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchNama = (item.dosenNama || '').toLowerCase().includes(q)
        const matchNuptk = Boolean(item.dosenNuptk && item.dosenNuptk.toLowerCase().includes(q))
        const matchNip = Boolean(item.dosenNip && item.dosenNip !== '-' && item.dosenNip.toLowerCase().includes(q))
        const matchProdi = (item.dosenProdi || '').toLowerCase().includes(q)
        const matchJabatan = (item.dosenJabatan || '').toLowerCase().includes(q)
        const matchFakultas = (item.dosenFakultas || '').toLowerCase().includes(q)
        if (!matchNama && !matchNuptk && !matchNip && !matchProdi && !matchJabatan && !matchFakultas) return false
      }

      return true
    })
  }, [
    allItems,
    selectedTahun,
    selectedSemester,
    selectedFakultas,
    selectedProdi,
    selectedStatus,
    selectedSksBeban,
    selectedTtd,
    searchQuery,
  ])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setPage(1)
  }, [
    selectedTahun,
    selectedSemester,
    selectedFakultas,
    selectedProdi,
    selectedStatus,
    selectedSksBeban,
    selectedTtd,
    searchQuery,
  ])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [viewMode, page, filteredList.length], { y: 8, stagger: 0.04 })

  const handleOpenReview = (skp: PengajuanSKP) => {
    setSelectedSKP(skp)
    setSdmNotes(skp.catatanSDM || '')
    setViewMode('review')
  }

  const handleExecuteApprove = () => {
    if (!currentSelectedSKP) return
    onApproveSKP(currentSelectedSKP.id, sdmNotes)
    setConfirmApprove(false)
    setViewMode('list')
    onShowToast(`SKP ${currentSelectedSKP.dosenNama} berhasil divalidasi dan disahkan oleh Direktorat SDM!`)
  }

  const handleExecuteReject = () => {
    if (!currentSelectedSKP) return
    onRejectSKP(currentSelectedSKP.id, sdmNotes)
    setConfirmReject(false)
    setViewMode('list')
    onShowToast('Permintaan revisi berkas telah dikirimkan.')
  }

  if (viewMode === 'review' && currentSelectedSKP) {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar SKP</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              Verifikasi &amp; Validasi SDM: {currentSelectedSKP.dosenNama}
            </h1>
            <p className="page-desc">
              Pemeriksaan kesesuaian luaran Tridharma dan tanda tangan Ka Prodi terhadap standar SPMI Universitas Bhakti Kencana.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {currentSelectedSKP.tanggalPengajuan && (
              <span className="badge-pill badge-pill--orange" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                <Clock size={12} />
                <span>Pengajuan Terbaru: {currentSelectedSKP.tanggalPengajuan}</span>
              </span>
            )}
            {(() => {
              const isApproved = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(currentSelectedSKP.status)
              return (
                <button
                  onClick={() => {
                    if (!isApproved) {
                      onShowToast('Berkas SKP belum dapat dicetak karena belum disetujui oleh pimpinan.')
                      return
                    }
                    openPrintSKP(currentSelectedSKP, currentSelectedSKP.ttdDosenUrl)
                  }}
                  disabled={!isApproved}
                  className="brand-btn btn-action-print"
                  style={{
                    padding: '10px 18px',
                    opacity: isApproved ? 1 : 0.5,
                    cursor: isApproved ? 'pointer' : 'not-allowed',
                  }}
                  title={isApproved ? 'Cetak Formulir SKP Resmi di Tab Baru' : 'SKP belum dapat dicetak (menunggu persetujuan)'}
                >
                  <Printer size={16} />
                  <span>Cetak Pratinjau SKP</span>
                </button>
              )
            })()}
          </div>
        </div>

        <div className="form-page-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Dosen yang Dinilai</div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {currentSelectedSKP.dosenNama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }} className="tabular-nums font-mono font-medium">
                {currentSelectedSKP.dosenNuptk && currentSelectedSKP.dosenNuptk.trim() !== '-'
                  ? `NUPTK: ${currentSelectedSKP.dosenNuptk}`
                  : currentSelectedSKP.dosenNip && currentSelectedSKP.dosenNip.trim() !== '-'
                  ? `NIP: ${currentSelectedSKP.dosenNip}`
                  : 'NUPTK: -'}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Disetujui Oleh</div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {currentSelectedSKP.penilaiNama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>{currentSelectedSKP.penilaiJabatan}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Realisasi SKS &amp; Mutu</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-700)', marginTop: 2 }}>
                {currentSelectedSKP.totalSksRealisasi} SKS {currentSelectedSKP.nilaiKinerjaSKP ? `(${currentSelectedSKP.nilaiKinerjaSKP}%)` : ''}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>Semester {currentSelectedSKP.semester} {currentSelectedSKP.tahunAkademik}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Status Berkas Saat Ini</div>
              <div style={{ marginTop: 6 }}>
                {(() => {
                  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(currentSelectedSKP.status)
                  return (
                    <span
                      className={`badge-pill ${
                        isSah
                          ? 'badge-pill--green'
                          : currentSelectedSKP.status === 'Diajukan'
                          ? 'badge-pill--orange'
                          : 'badge-pill--red'
                      }`}
                    >
                      {isSah ? 'Sah & Terbit' : currentSelectedSKP.status === 'Perlu Revisi' ? 'Dibatalkan / Revisi' : currentSelectedSKP.status}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Banner Status Sah & Terbit vs Perlu Revisi */}
          {['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(currentSelectedSKP.status) ? (
            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={22} color="#059669" />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#065f46' }}>
                  SKP Telah Sah &amp; Diterbitkan Secara Resmi
                </div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: 2 }}>
                  Sesuai ketentuan, berkas SKP yang telah disetujui &amp; ditandatangani oleh pimpinan yang berwenang (<strong>{currentSelectedSKP.penilaiNama}</strong>) langsung sah &amp; terbit tanpa menunggu validasi SDM. Sebagai Biro SDM, Anda dapat memeriksa bukti luaran tridharma di bawah ini atau <strong>membatalkan penerbitan</strong> jika terdapat perbaikan/revisi berkas.
                </div>
              </div>
            </div>
          ) : currentSelectedSKP.status === 'Perlu Revisi' ? (
            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={22} color="#e11d48" />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#9f1239' }}>
                  Penerbitan SKP Sedang Dibatalkan (Perlu Revisi)
                </div>
                <div style={{ fontSize: '12px', color: '#be123c', marginTop: 2 }}>
                  Catatan SDM/Persetujuan: "{currentSelectedSKP.catatanSDM || currentSelectedSKP.catatanKaprodi || 'Perlu perbaikan bukti fisik luaran tridharma.'}"
                </div>
              </div>
            </div>
          ) : null}

          {/* Activities Table */}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Daftar Bukti Fisik Luaran Tridharma ({currentSelectedSKP.items.length} Kegiatan)
            </div>

            <div className="table-container">
              <table className="custom-table custom-table--sticky-skp">
                <thead>
                  <tr>
                    <th style={{ width: 48, minWidth: 48, maxWidth: 48, textAlign: 'center' }}>No</th>
                    <th style={{ minWidth: 260 }}>Uraian Kegiatan Tridharma</th>
                    <th style={{ textAlign: 'center' }}>Rencana Awal</th>
                    <th style={{ textAlign: 'center' }}>Perubahan</th>
                    <th style={{ textAlign: 'center' }}>Realisasi</th>
                    <th style={{ textAlign: 'center' }}>Kual / Mutu</th>
                    <th style={{ textAlign: 'center' }}>Waktu</th>
                    <th>Dokumen Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSelectedSKP.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td style={{ width: 48, minWidth: 48, maxWidth: 48, textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, minWidth: 260 }}>{it.kegiatan}</td>
                      <td style={{ textAlign: 'center' }}>{it.rencanaAwal}</td>
                      <td style={{ textAlign: 'center' }}>{it.perubahanTengah}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)' }}>
                        {it.realisasi} {it.satuan}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{it.kualitasMutu}%</td>
                      <td style={{ textAlign: 'center' }}>{it.waktuNilai || 12} {it.waktuSatuan || 'bln'}</td>
                      <td>
                        <a
                          href={sanitizeUrl(it.linkDokumen)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--brand-600)',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <span>Tautan di sini</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Persetujuan & Verifikasi Pimpinan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>Catatan Penilai (Ka Prodi / Dekan)</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{currentSelectedSKP.catatanKaprodi || 'Belum ada catatan khusus dari penilai langsung.'}"
              </div>
            </div>

            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>Catatan Evaluasi Verifikator SDM</div>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Tuliskan catatan verifikasi bukti dokumen atau alasan pembatalan jika ada berkas yang perlu direvisi..."
                value={sdmNotes}
                onChange={(e) => setSdmNotes(e.target.value)}
                style={{ marginTop: 6, width: '100%', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Action Buttons for Review */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--hair)', paddingTop: 16 }}>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <span>Batal</span>
            </button>
            <button
              className="brand-btn"
              style={{ background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
              onClick={() => setConfirmReject(true)}
            >
              <XCircle size={15} />
              <span>Kembalikan (Perlu Revisi)</span>
            </button>
            <button className="brand-btn" onClick={() => setConfirmApprove(true)}>
              <CheckCircle size={15} />
              <span>Sahkan &amp; Terbitkan SKP</span>
            </button>
          </div>
        </div>

        {/* Dialog Konfirmasi Sahkan */}
        <ConfirmDialog
          isOpen={confirmApprove}
          title="Konfirmasi Pengesahan SKP Dosen"
          message={`Apakah Anda yakin seluruh berkas Tridharma dosen ${currentSelectedSKP.dosenNama} telah lengkap dan layak untuk disahkan dan diterbitkan secara resmi?`}
          confirmText="Ya, Sahkan SKP"
          onConfirm={handleExecuteApprove}
          onCancel={() => setConfirmApprove(false)}
        />

        {/* Dialog Konfirmasi Kembalikan */}
        <ConfirmDialog
          isOpen={confirmReject}
          title="Konfirmasi Pengembalian Berkas SKP"
          message={`Apakah Anda yakin ingin membatalkan/mengembalikan berkas SKP dosen ${currentSelectedSKP.dosenNama} untuk direvisi? Pastikan Anda telah menuliskan catatan perbaikan.`}
          confirmText="Ya, Kembalikan Berkas"
          isDestructive
          onConfirm={handleExecuteReject}
          onCancel={() => setConfirmReject(false)}
        />
      </div>
    )
  }

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Monitoring &amp; Verifikasi SKP Pegawai</h1>
          <p className="page-desc">
            Pemantauan, verifikasi dokumen fisik, dan validasi pengesahan akhir Sasaran Kinerja Pegawai (dilakukan 2 kali setahun / per semester) untuk seluruh civitas akademika UBK.
          </p>
        </div>
      </div>

      {/* Filter Toolbar: Diperkaya, Seragam & Search Bar Lebar Penuh di Bawah */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Baris 1: Header Filter & Tombol Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
              Filter Berkas Pengajuan SKP
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
              Menampilkan {filteredList.length} dari {allItems.length} Pegawai
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

        {/* Baris 2: Kumpulan Dropdown Filter Seragam Termasuk Fakultas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
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
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            >
              {tahunList.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn === 'Semua' ? 'Semua Tahun' : `TA ${thn}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Semester */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Semester</label>
            <select
              className="custom-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            >
              <option value="Semua">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          {/* 3. Fakultas (Wajib Sesuai Permintaan) */}
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
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
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

          {/* 4. Program Studi */}
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
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua Program Studi">Semua Program Studi</option>
              {availableProdis.map((p, idx) => (
                <option key={idx} value={p} title={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Status Berkas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Status Berkas</label>
            <select
              className="custom-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              {statusOptions.map((st, idx) => (
                <option key={idx} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Kesesuaian Beban SKS SPMI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Beban Kerja SKS</label>
            <select
              className="custom-select"
              value={selectedSksBeban}
              onChange={(e) => setSelectedSksBeban(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Beban SKS</option>
              <option value="standar">Standar BKD (12 - 16 SKS)</option>
              <option value="kurang">Kurang Beban (&lt; 12 SKS)</option>
              <option value="lebih">Lebih Beban (&gt; 16 SKS)</option>
            </select>
          </div>

          {/* 7. TTD Penilai */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Tanda Tangan Penilai</label>
            <select
              className="custom-select"
              value={selectedTtd}
              onChange={(e) => setSelectedTtd(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Verifikasi TTD</option>
              <option value="ada">Sudah Ditandatangani</option>
              <option value="belum">Belum Ditandatangani</option>
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
            placeholder="Cari nama dosen, NIP, fakultas, atau program studi..."
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

      {/* Table */}
      <div className="table-container">
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Dosen / Ka Prodi</th>
              <th>Semester &amp; Tahun</th>
              <th>Program Studi &amp; Fakultas</th>
              <th>Realisasi SKS</th>
              <th>Kualitas Mutu</th>
              <th>Status SKP</th>
              <th>TTD Penilai</th>
              <th style={{ textAlign: 'right' }}>Aksi Dokumen</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={28} style={{ color: 'var(--faint)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                      Tidak Ada Data yang Cocok
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Silakan sesuaikan kata kunci pencarian atau ubah kriteria filter di atas.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => {
                const isBelumMengajukan = item.status === 'Belum Mengajukan'
                const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM'].includes(item.status)
                const isReviewed = ['Dinilai Kaprodi', 'Dinilai Dekan'].includes(item.status)

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.dosenNama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }} className="tabular-nums font-mono font-medium">
                        {item.dosenNuptk && item.dosenNuptk.trim() !== '-'
                          ? `NUPTK: ${item.dosenNuptk}`
                          : item.dosenNip && item.dosenNip.trim() !== '-'
                          ? `NIP: ${item.dosenNip}`
                          : 'NUPTK: -'}{' '}
                        &bull; <span className="font-sans">{item.dosenJabatan || 'Dosen'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Semester {item.semester}</span>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.tahunAkademik}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.dosenProdi}</div>
                      {item.dosenFakultas && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                          <Building2 size={10} />
                          <span>{item.dosenFakultas}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {isBelumMengajukan ? (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>-</span>
                      ) : (
                        <span style={{ fontWeight: 700, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.totalSksRealisasi} SKS
                        </span>
                      )}
                    </td>
                    <td>
                      {isBelumMengajukan ? (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>-</span>
                      ) : (
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {item.nilaiKinerjaSKP ? `${item.nilaiKinerjaSKP}%` : '-'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isBelumMengajukan ? (
                        <span className="badge-pill badge-pill--gray">
                          <Clock size={11} />
                          <span>Belum Mengajukan</span>
                        </span>
                      ) : isSah ? (
                        <span className="badge-pill badge-pill--green">
                          <CheckCircle size={11} />
                          <span>Sah &amp; Terbit</span>
                        </span>
                      ) : isReviewed ? (
                        <span className="badge-pill badge-pill--blue">
                          <span>{item.status}</span>
                        </span>
                      ) : item.status === 'Diajukan' ? (
                        <span className="badge-pill badge-pill--orange">
                          <span>Diajukan Dosen</span>
                        </span>
                      ) : (
                        <span className="badge-pill badge-pill--red">
                          <span>{item.status}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {item.hasTtd ? (
                        <span className="badge-pill badge-pill--green" style={{ fontSize: '11px' }}>
                          Ada TTD
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.skp ? (
                        <button
                          className="brand-btn btn-action-print"
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          title="Cetak Formulir SKP Resmi di Tab Baru"
                          onClick={() => openPrintSKP(item.skp!, item.skp!.ttdDosenUrl || (item.skp as any)!.dosen?.signatureUrl)}
                        >
                          <Printer size={13} />
                          <span>Cetak SKP</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontStyle: 'italic' }}>
                          Belum Tersedia
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        totalItems={filteredList.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />

      {/* Modal Cetak Format Resmi UBK */}
      {printSKPTarget && (
        <FormulirCetakSKP
          skp={printSKPTarget}
          isOpen={Boolean(printSKPTarget)}
          dosenSignatureUrl={printSKPTarget.ttdDosenUrl}
          onClose={() => setPrintSKPTarget(null)}
        />
      )}
    </div>
  )
}
