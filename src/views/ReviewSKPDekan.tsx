import React, { useState, useRef } from 'react'
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Printer,
  Upload,
  Check,
  FileSignature,
  Building2,
  AlertCircle,
  Filter,
  Search,
  Calendar,
} from 'lucide-react'
import { PengajuanSKP, Dosen, UserSession } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { useStaggerEntrance } from '../utils/animations'

const TAHUN_OPTIONS = ['2025/2026', '2024/2025', '2026/2027']

interface ReviewSKPDekanProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  onApproveByDekan: (skpId: string, catatan: string, ttdUrl?: string) => void
  onRejectByDekan: (skpId: string, catatan: string) => void
  onShowToast: (msg: string) => void
}

export const ReviewSKPDekan: React.FC<ReviewSKPDekanProps> = ({
  user,
  skpList,
  dosenList,
  onApproveByDekan,
  onRejectByDekan,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [activeReviewSKP, setActiveReviewSKP] = useState<PengajuanSKP | null>(null)
  const [dekanNotes, setDekanNotes] = useState('')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [printSKPTarget, setPrintSKPTarget] = useState<PengajuanSKP | null>(null)

  // Filters: Tahun Ajaran, Semester, Search
  const [selectedTahun, setSelectedTahun] = useState<string>('2025/2026')
  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Genap' | 'Ganjil'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  // Default Digital Signature for Dekan
  const defaultDekanTTD =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="70"><path d="M15 50 Q 55 15 100 45 T 165 25" fill="none" stroke="%231e3a5f" stroke-width="3"/><text x="18" y="62" font-family="sans-serif" font-weight="bold" font-size="10.5" fill="%231e3a5f">Dr. Hj. Ratna Dian - Dekan</text></svg>'
  const [ttdPreview, setTtdPreview] = useState<string>(defaultDekanTTD)

  // Filter kaprodi
  const kaprodiList = dosenList.filter((d) => d.isKaprodi)

  const filteredRows = kaprodiList.flatMap((dosen) => {
    const semestersToCheck: ('Ganjil' | 'Genap')[] =
      selectedSemester === 'Semua' ? ['Genap', 'Ganjil'] : [selectedSemester]

    return semestersToCheck.map((sem) => {
      const found = skpList.find(
        (s) =>
          (s.dosenId === dosen.id || s.dosenNama === dosen.nama) &&
          s.semester === sem &&
          (s.tahunAkademik === selectedTahun || !s.tahunAkademik)
      )
      if (found) return found

      const fallbackSKP: PengajuanSKP = {
        id: `skp-${dosen.id}-${sem.toLowerCase()}-${selectedTahun.replace('/', '-')}`,
        dosenId: dosen.id,
        dosenNama: dosen.nama,
        dosenNip: dosen.nip,
        dosenProdi: dosen.prodi,
        dosenPangkat: dosen.golongan,
        dosenJabatan: `Ketua Program Studi ${dosen.prodi}`,
        penilaiNama: user.name,
        penilaiNip: user.nip,
        penilaiJabatan: 'Dekan Fakultas Keperawatan',
        penilaiUnit: 'Fakultas Keperawatan UBK',
        penilaiRole: 'Dekan',
        semester: sem,
        tahunAkademik: selectedTahun,
        totalSksRencana: 16,
        totalSksRealisasi: sem === 'Genap' ? 16 : 15,
        persentaseCapaian: 93.75,
        nilaiKinerjaSKP: 95.0,
        status: 'Diajukan',
        tanggalPengajuan: sem === 'Genap' ? '17 Oktober 2026' : '21 Februari 2026',
        catatanKaprodi: '',
        catatanDekan: '',
        catatanSDM: '',
        ttdDekanUrl: undefined,
        items: [],
      }
      return fallbackSKP
    })
  }).filter((skp) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return skp.dosenNama.toLowerCase().includes(q) || skp.dosenNip.toLowerCase().includes(q) || skp.dosenProdi.toLowerCase().includes(q)
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredRows, selectedTahun, selectedSemester, viewMode], { y: 8, stagger: 0.035 })

  const handleOpenReview = (skp: PengajuanSKP) => {
    setActiveReviewSKP(skp)
    setDekanNotes(skp.catatanDekan || 'Kinerja kepemimpinan prodi, manajemen kurikulum, dan Tridharma semester ini sangat memuaskan.')
    setTtdPreview(skp.ttdDekanUrl || defaultDekanTTD)
    setViewMode('review')
  }

  const handleTTDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setTtdPreview(reader.result as string)
        onShowToast('Tanda tangan digital Dekan berhasil diunggah.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExecuteApprove = () => {
    if (activeReviewSKP) {
      onApproveByDekan(activeReviewSKP.id, dekanNotes, ttdPreview)
      setConfirmApprove(false)
      setViewMode('list')
      onShowToast(`SKP Ka Prodi ${activeReviewSKP.dosenNama} telah disetujui & disahkan Dekan dengan TTD digital!`)
    }
  }

  const handleExecuteReject = () => {
    if (activeReviewSKP) {
      onRejectByDekan(activeReviewSKP.id, dekanNotes)
      setConfirmReject(false)
      setViewMode('list')
      onShowToast(`SKP Ka Prodi ${activeReviewSKP.dosenNama} dikembalikan untuk revisi.`)
    }
  }

  // Detailed Review Mode
  if (viewMode === 'review' && activeReviewSKP) {
    const totalRencana = activeReviewSKP.items.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
    const totalRealisasi = activeReviewSKP.items.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)

    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar SKP Ka Prodi</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              Penilaian &amp; Pengesahan SKP Ketua Program Studi
            </h1>
            <p className="page-desc">
              Periksa ketercapaian beban tugas kepemimpinan dan Tridharma Ka Prodi {activeReviewSKP.dosenNama}, berikan catatan dekanat, dan bubuhkan tanda tangan digital resmi.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPrintSKPTarget(activeReviewSKP)}
              className="brand-btn brand-btn--outline"
              style={{ padding: '9px 16px' }}
            >
              <Printer size={15} />
              <span>Cetak Formulir SKP</span>
            </button>
          </div>
        </div>

        {/* Profil Ka Prodi Card */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--r-xl)',
            padding: '22px 26px',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge-pill badge-pill--blue">{activeReviewSKP.dosenProdi}</span>
              <span className="badge-pill badge-pill--gray">Ketua Program Studi</span>
              <span className="badge-pill badge-pill--green">{activeReviewSKP.dosenPangkat}</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
              {activeReviewSKP.dosenNama}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
              NIP {activeReviewSKP.dosenNip} &bull; Semester {activeReviewSKP.semester} {activeReviewSKP.tahunAkademik}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Rencana vs Realisasi</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>
                {totalRencana} &rarr; {totalRealisasi} SKS
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Nilai Kinerja SKP</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-700)' }}>
                {activeReviewSKP.nilaiKinerjaSKP}%
              </div>
            </div>
          </div>
        </div>

        {/* Table of Activities Filled by Kaprodi */}
        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>No</th>
                <th>Kegiatan Tugas Jabatan Ka Prodi</th>
                <th style={{ textAlign: 'center' }}>Satuan</th>
                <th style={{ textAlign: 'center' }}>Rencana Awal</th>
                <th style={{ textAlign: 'center' }}>Perubahan Tengah</th>
                <th style={{ textAlign: 'center' }}>Realisasi Akhir</th>
                <th style={{ textAlign: 'center' }}>Kual / Mutu</th>
                <th style={{ textAlign: 'center' }}>Waktu</th>
                <th>Dokumen Bukti Fisik</th>
              </tr>
            </thead>
            <tbody>
              {activeReviewSKP.items.map((it, idx) => (
                <tr key={it.id}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                    {idx + 1}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px', maxWidth: 300 }}>
                    {it.kegiatan}
                    {it.kategori && (
                      <div style={{ marginTop: 2 }}>
                        <span className="badge-pill badge-pill--blue" style={{ fontSize: '10px' }}>
                          {it.kategori}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{it.satuan}</td>
                  <td style={{ textAlign: 'center' }}>{it.rencanaAwal}</td>
                  <td style={{ textAlign: 'center' }}>{it.perubahanTengah}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)' }}>
                    {it.realisasi}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {it.kualitasMutu || 100}%
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                    {it.waktuNilai || 6} {it.waktuSatuan || 'bln'}
                  </td>
                  <td>
                    {it.linkDokumen ? (
                      <a
                        href={it.linkDokumen}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--brand-600)',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        <span>Lihat Bukti</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--faint)' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Catatan & TTD Dekan */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: 20,
            marginTop: 16,
          }}
        >
          {/* Catatan Dekan */}
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              padding: '24px',
              border: '1px solid var(--hair)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 6 }}>
              Catatan Evaluasi Dekan Fakultas Keperawatan
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: 12 }}>
              Berikan catatan pembinaan, apresiasi kepemimpinan, atau arahan strategis fakultas untuk Ketua Program Studi.
            </div>
            <textarea
              rows={5}
              className="custom-input"
              value={dekanNotes}
              onChange={(e) => setDekanNotes(e.target.value)}
              placeholder="Tuliskan evaluasi kinerja Ka Prodi..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* TTD Digital Dekan */}
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              padding: '24px',
              border: '1px solid var(--hair)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)' }}>
                <FileSignature size={16} color="var(--brand-600)" />
                <span>Tanda Tangan Digital Dekan</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2, marginBottom: 12 }}>
                Pengesahan resmi berkas SKP tingkat fakultas.
              </div>

              {/* TTD Box Preview */}
              <div
                style={{
                  height: 90,
                  border: '1.5px dashed var(--hair)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--panel-hover)',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  padding: 6,
                }}
              >
                {ttdPreview ? (
                  <img
                    src={ttdPreview}
                    alt="TTD Dekan"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Belum ada tanda tangan</span>
                )}
              </div>

              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label
                  className="brand-btn brand-btn--outline"
                  style={{ padding: '6px 12px', fontSize: '11.5px', cursor: 'pointer', gap: 4 }}
                >
                  <Upload size={13} />
                  <span>Ganti TTD</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleTTDUpload}
                  />
                </label>
                <span style={{ fontSize: '11px', color: 'var(--status-success-ink)', fontWeight: 600 }}>
                  Terverifikasi UBK
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setConfirmReject(true)}
                className="brand-btn btn-action-delete"
                style={{ flex: 1, padding: '10px 14px' }}
              >
                <XCircle size={15} />
                <span>Minta Revisi</span>
              </button>
              <button
                onClick={() => setConfirmApprove(true)}
                className="brand-btn btn-action-add"
                style={{ flex: 2, padding: '10px 16px' }}
              >
                <CheckCircle size={15} />
                <span>Sahkan &amp; TTD Dekan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          isOpen={confirmApprove}
          title="Pengesahan SKP Ka Prodi oleh Dekan"
          message={`Apakah Anda yakin ingin menyetujui dan menandatangani SKP Ka Prodi "${activeReviewSKP.dosenNama}" untuk periode ${activeReviewSKP.semester} ${activeReviewSKP.tahunAkademik}? Berkas yang telah ditandatangani akan diteruskan ke SDM untuk validasi akhir.`}
          confirmText="Ya, Sahkan &amp; Bubuhkan TTD"
          cancelText="Batal"
          onConfirm={handleExecuteApprove}
          onCancel={() => setConfirmApprove(false)}
        />

        <ConfirmDialog
          isOpen={confirmReject}
          title="Kembalikan SKP Ka Prodi untuk Revisi"
          message={`Apakah Anda ingin mengembalikan berkas SKP Ka Prodi "${activeReviewSKP.dosenNama}" dengan catatan perbaikan?`}
          confirmText="Kembalikan untuk Revisi"
          cancelText="Batal"
          isDestructive={true}
          onConfirm={handleExecuteReject}
          onCancel={() => setConfirmReject(false)}
        />

        {printSKPTarget && (
          <FormulirCetakSKP
            skp={printSKPTarget}
            isOpen={Boolean(printSKPTarget)}
            onClose={() => setPrintSKPTarget(null)}
          />
        )}
      </div>
    )
  }

  // List Mode: Table of Kaprodi SKP
  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Verifikasi &amp; Pengesahan SKP Ketua Program Studi</h1>
          <p className="page-desc">
            Sebagai Dekan, Anda adalah atasan penilai langsung yang memverifikasi capaian Tridharma dan manajerial Ketua Program Studi serta mengesahkan dengan tanda tangan digital resmi.
          </p>
        </div>
      </div>

      {/* Filter Toolbar (Tahun Ajaran & Semester) */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 22px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--navy-900)',
              fontWeight: 700,
              fontSize: '13.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Filter size={17} color="var(--brand-600)" />
            <span>Filter Periode SKP</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--hair)', display: 'inline-block' }} />

          {/* Tahun Ajaran */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Tahun Ajaran
            </span>
            <select
              className="custom-select"
              style={{
                height: 38,
                width: 'auto',
                minWidth: 150,
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
              }}
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
            >
              {TAHUN_OPTIONS.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Semester
            </span>
            <div
              style={{
                display: 'inline-flex',
                gap: 4,
                background: 'var(--panel-hover)',
                padding: 3,
                borderRadius: 'var(--r-md)',
              }}
            >
              {(['Semua', 'Genap', 'Ganjil'] as const).map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--r-sm)',
                    border: 'none',
                    background: selectedSemester === sem ? 'var(--navy-900)' : 'transparent',
                    color: selectedSemester === sem ? '#ffffff' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s var(--ease)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sem === 'Semua' ? 'Semua Semester' : `Semester ${sem}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
          <Search
            size={15}
            color="var(--muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="custom-input"
            placeholder="Cari Ka Prodi atau Program Studi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, height: 38, fontSize: '12.5px' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Ketua Program Studi</th>
              <th>Program Studi</th>
              <th style={{ textAlign: 'center' }}>Semester</th>
              <th style={{ textAlign: 'center' }}>Total SKS</th>
              <th style={{ textAlign: 'center' }}>Nilai SKP</th>
              <th style={{ textAlign: 'center' }}>Status Berkas</th>
              <th style={{ textAlign: 'center' }}>Status TTD Dekan</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Tidak ada data SKP Ka Prodi untuk filter periode yang dipilih.
                </td>
              </tr>
            ) : (
              filteredRows.map((skp) => (
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
                    <span
                      className={`badge-pill ${
                        skp.status === 'Disetujui SDM'
                          ? 'badge-pill--green'
                          : skp.status === 'Dinilai Dekan'
                          ? 'badge-pill--blue'
                          : skp.status === 'Perlu Revisi'
                          ? 'badge-pill--orange'
                          : 'badge-pill--gray'
                      }`}
                    >
                      {skp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {skp.ttdDekanUrl ? (
                      <span className="badge-pill badge-pill--green" title="TTD Dekan Terverifikasi">
                        Sudah TTD
                      </span>
                    ) : (
                      <span className="badge-pill badge-pill--orange">Menunggu TTD</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleOpenReview(skp)}
                        className="brand-btn btn-action-view"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Verifikasi &amp; TTD
                      </button>
                      <button
                        onClick={() => setPrintSKPTarget(skp)}
                        className="brand-btn btn-action-print"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Cetak Formulir SKP"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printSKPTarget && (
        <FormulirCetakSKP
          skp={printSKPTarget}
          isOpen={Boolean(printSKPTarget)}
          onClose={() => setPrintSKPTarget(null)}
        />
      )}
    </div>
  )
}
