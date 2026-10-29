import React, { useState, useRef, useMemo } from 'react'
import {
  FileCheck2,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import { PengajuanSKP } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { openPrintSKP } from '../utils/printSKP'
import { useStaggerEntrance } from '../utils/animations'
import { sanitizeUrl } from '../utils/security'
import { TablePagination } from '../components/TablePagination'

interface KelolaSKPDosenProps {
  skpList: PengajuanSKP[]
  prodiList?: string[]
  onApproveSKP: (id: string, notes: string) => void
  onRejectSKP: (id: string, notes: string) => void
  initialSelectedSKP?: PengajuanSKP | null
  onShowToast: (msg: string) => void
}

export const KelolaSKPDosen: React.FC<KelolaSKPDosenProps> = ({
  skpList,
  prodiList: prodiListProp,
  initialSelectedSKP,
  onApproveSKP,
  onRejectSKP,
  onShowToast,
}) => {
  const availableProdis = prodiListProp && prodiListProp.length > 0
    ? (prodiListProp[0] === 'Semua Program Studi' ? prodiListProp : ['Semua Program Studi', ...prodiListProp])
    : ['Semua Program Studi', ...Array.from(new Set(skpList.map((s) => s.dosenProdi).filter(Boolean)))]
  const [viewMode, setViewMode] = useState<'list' | 'review'>(initialSelectedSKP ? 'review' : 'list')
  const [selectedSKP, setSelectedSKP] = useState<PengajuanSKP | null>(initialSelectedSKP || null)
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

  const [selectedTahun, setSelectedTahun] = useState<string>('2026/2027')
  const [selectedSemester, setSelectedSemester] = useState<string>('Semua')
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua')
  const [selectedProdi, setSelectedProdi] = useState<string>('Semua Program Studi')
  const [searchQuery, setSearchQuery] = useState('')

  const tahunList = ['Semua', '2026/2027', '2025/2026', '2024/2025']
  const statusList = ['Semua', 'Sah & Terbit', 'Diajukan', 'Perlu Revisi', 'Draft']

  const filteredList = skpList.filter((skp) => {
    const matchTahun = selectedTahun === 'Semua' || skp.tahunAkademik === selectedTahun
    const matchSemester = selectedSemester === 'Semua' || skp.semester === selectedSemester
    const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(skp.status)
    const matchStatus =
      selectedStatus === 'Semua' ||
      (selectedStatus === 'Sah & Terbit' ? isSah : skp.status === selectedStatus)
    const matchProdi = selectedProdi === 'Semua Program Studi' || skp.dosenProdi === selectedProdi
    const q = (searchQuery || '').trim().toLowerCase()
    if (!q) return matchTahun && matchSemester && matchStatus && matchProdi
    const matchSearch =
      (skp.dosenNama || '').toLowerCase().includes(q) ||
      (skp.dosenNip || '').toLowerCase().includes(q) ||
      (skp.dosenProdi || '').toLowerCase().includes(q)
    return matchTahun && matchSemester && matchStatus && matchProdi && matchSearch
  })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [viewMode], { y: 8, stagger: 0.04 })

  const handleOpenReview = (skp: PengajuanSKP) => {
    setSelectedSKP(skp)
    setSdmNotes(skp.catatanSDM || '')
    setViewMode('review')
  }

  const handleExecuteApprove = () => {
    if (!selectedSKP) return
    onApproveSKP(selectedSKP.id, sdmNotes)
    setConfirmApprove(false)
    setViewMode('list')
    onShowToast(`SKP ${selectedSKP.dosenNama} berhasil divalidasi dan disahkan oleh Direktorat SDM!`)
  }

  const handleExecuteReject = () => {
    if (!selectedSKP) return
    onRejectSKP(selectedSKP.id, sdmNotes)
    setConfirmReject(false)
    setViewMode('list')
    onShowToast('Permintaan revisi berkas telah dikirimkan.')
  }

  if (viewMode === 'review' && selectedSKP) {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar SKP</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              Verifikasi &amp; Validasi SDM: {selectedSKP.dosenNama}
            </h1>
            <p className="page-desc">
              Pemeriksaan kesesuaian luaran Tridharma dan tanda tangan Ka Prodi terhadap standar SPMI Universitas Bhakti Kencana.
            </p>
          </div>

          <button
            onClick={() => openPrintSKP(selectedSKP, selectedSKP.ttdDosenUrl)}
            className="brand-btn btn-action-print"
            style={{ padding: '10px 18px' }}
            title="Cetak Formulir SKP Resmi di Tab Baru"
          >
            <Printer size={16} />
            <span>Cetak Pratinjau SKP</span>
          </button>
        </div>

        <div className="form-page-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Dosen yang Dinilai</div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {selectedSKP.dosenNama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>NIP {selectedSKP.dosenNip}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Pejabat Penilai Kinerja</div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {selectedSKP.penilaiNama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>{selectedSKP.penilaiJabatan}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Realisasi SKS &amp; Mutu</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-700)', marginTop: 2 }}>
                {selectedSKP.totalSksRealisasi} SKS {selectedSKP.nilaiKinerjaSKP ? `(${selectedSKP.nilaiKinerjaSKP}%)` : ''}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>Semester {selectedSKP.semester} {selectedSKP.tahunAkademik}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Status Berkas Saat Ini</div>
              <div style={{ marginTop: 6 }}>
                {(() => {
                  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(selectedSKP.status)
                  return (
                    <span
                      className={`badge-pill ${
                        isSah
                          ? 'badge-pill--green'
                          : selectedSKP.status === 'Diajukan'
                          ? 'badge-pill--orange'
                          : 'badge-pill--red'
                      }`}
                    >
                      {isSah ? 'Sah & Terbit' : selectedSKP.status === 'Perlu Revisi' ? 'Dibatalkan / Revisi' : selectedSKP.status}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Banner Status Sah & Terbit vs Perlu Revisi */}
          {['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(selectedSKP.status) ? (
            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={22} color="#059669" />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#065f46' }}>
                  SKP Telah Sah &amp; Diterbitkan Secara Resmi
                </div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: 2 }}>
                  Sesuai ketentuan, berkas SKP yang telah disetujui &amp; ditandatangani oleh Pejabat Penilai (<strong>{selectedSKP.penilaiNama}</strong>) langsung sah &amp; terbit tanpa menunggu validasi SDM. Sebagai Biro SDM, Anda dapat memeriksa bukti luaran tridharma di bawah ini atau <strong>membatalkan penerbitan</strong> jika terdapat perbaikan/revisi berkas.
                </div>
              </div>
            </div>
          ) : selectedSKP.status === 'Perlu Revisi' ? (
            <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={22} color="#e11d48" />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#9f1239' }}>
                  Penerbitan SKP Sedang Dibatalkan (Perlu Revisi)
                </div>
                <div style={{ fontSize: '12px', color: '#be123c', marginTop: 2 }}>
                  Catatan SDM/Penilai: "{selectedSKP.catatanSDM || selectedSKP.catatanKaprodi || 'Perlu perbaikan bukti fisik luaran tridharma.'}"
                </div>
              </div>
            </div>
          ) : null}

          {/* Activities Table */}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Daftar Bukti Fisik Luaran Tridharma ({selectedSKP.items.length} Kegiatan)
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
                  {selectedSKP.items.map((it, idx) => (
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

          {/* Catatan Ka Prodi */}
          <div style={{ padding: '16px 20px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
              Catatan Penilaian dari Ketua Program Studi:
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{selectedSKP.catatanKaprodi || 'Seluruh luaran tridharma telah sesuai dengan standar SPMI UBK dan telah diverifikasi lengkap.'}"
            </div>
            {selectedSKP.ttdKaprodiUrl && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge-pill badge-pill--green" style={{ fontSize: '11px' }}>
                  Tanda Tangan Digital Ka Prodi Terverifikasi
                </span>
              </div>
            )}
          </div>

          {/* Form Catatan SDM */}
          <div className="form-field">
            <label className="form-label">Catatan Verifikasi / Alasan Pembatalan Terbit oleh SDM</label>
            <textarea
              rows={3}
              className="custom-input"
              value={sdmNotes}
              onChange={(e) => setSdmNotes(e.target.value)}
              placeholder="Tuliskan catatan verifikasi fisik BKD atau alasan pembatalan jika memerlukan perbaikan..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12, paddingTop: 10 }}>
            {['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(selectedSKP.status) ? (
              <>
                <button
                  type="button"
                  className="brand-btn btn-action-delete"
                  onClick={() => setConfirmReject(true)}
                  title="Batalkan status terbit SKP dan kembalikan ke Dosen untuk revisi"
                >
                  <XCircle size={15} />
                  <span>Batalkan Terbit SKP (Minta Revisi)</span>
                </button>
                <button
                  type="button"
                  className="brand-btn btn-action-print"
                  onClick={() => openPrintSKP(selectedSKP, selectedSKP.ttdDosenUrl)}
                  title="Cetak Formulir SKP Resmi di Tab Baru"
                >
                  <Printer size={15} />
                  <span>Cetak Lembar SKP</span>
                </button>
                <button
                  type="button"
                  className="brand-btn btn-action-add"
                  onClick={() => setConfirmApprove(true)}
                  title="Simpan catatan verifikasi Biro SDM"
                >
                  <CheckCircle size={15} />
                  <span>Konfirmasi Validasi SDM</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="brand-btn btn-action-delete"
                  onClick={() => setConfirmReject(true)}
                >
                  <XCircle size={15} />
                  <span>Minta Revisi Berkas</span>
                </button>
                <button
                  type="button"
                  className="brand-btn btn-action-add"
                  onClick={() => setConfirmApprove(true)}
                >
                  <CheckCircle size={15} />
                  <span>Sahkan &amp; Terbitkan Kembali</span>
                </button>
              </>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmApprove}
          title="Konfirmasi Validasi SDM"
          message={`Konfirmasi verifikasi berkas SKP atas nama ${selectedSKP.dosenNama}? Catatan verifikasi SDM akan disimpan pada pangkalan data.`}
          confirmText="Simpan Validasi"
          cancelText="Batal"
          onConfirm={handleExecuteApprove}
          onCancel={() => setConfirmApprove(false)}
        />

        <ConfirmDialog
          isOpen={confirmReject}
          title="Batalkan Penerbitan SKP"
          message={`Apakah Anda yakin ingin MEMBATALKAN status terbit SKP atas nama ${selectedSKP.dosenNama}? Berkas akan dikembalikan ke status Perlu Revisi agar dosen dan prodi dapat memperbaiki luaran sesuai catatan Anda.`}
          confirmText="Ya, Batalkan Terbit"
          cancelText="Kembali"
          isDestructive={true}
          onConfirm={handleExecuteReject}
          onCancel={() => setConfirmReject(false)}
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

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring &amp; Verifikasi SKP Pegawai</h1>
          <p className="page-desc">
            Pemantauan, verifikasi dokumen fisik, dan validasi pengesahan akhir Sasaran Kinerja Pegawai (dilakukan 2 kali setahun / per semester) untuk seluruh civitas akademika UBK.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Tahun Akademik */}
          <select
            className="custom-select"
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            style={{
              width: 'auto',
              minWidth: 165,
              height: 38,
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid var(--hair-strong)',
              background: '#ffffff',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {tahunList.map((thn, idx) => (
              <option key={idx} value={thn}>
                {thn === 'Semua' ? 'Semua Tahun Ajaran' : `Tahun ${thn}`}
              </option>
            ))}
          </select>

          {/* Filter Semester */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--panel-hover)', padding: 3, borderRadius: 'var(--r-md)' }}>
            {['Semua', 'Genap', 'Ganjil'].map((sem, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSemester(sem)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedSemester === sem ? 'var(--navy-900)' : 'transparent',
                  color: selectedSemester === sem ? '#ffffff' : 'var(--muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sem === 'Semua' ? 'Semua Semester' : `Semester ${sem}`}
              </button>
            ))}
          </div>

          {/* Filter Status */}
          <select
            className="custom-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', minWidth: 170, height: 38, fontSize: '13px', fontWeight: 600 }}
          >
            {statusList.map((st, idx) => (
              <option key={idx} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          {/* Filter Prodi */}
          <select
            className="custom-select"
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            style={{ width: 'auto', minWidth: 200, height: 38, fontSize: '13px', fontWeight: 600 }}
          >
            {availableProdis.map((p, idx) => (
              <option key={idx} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="search" style={{ minWidth: 240, maxWidth: 320 }}>
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Cari nama dosen / NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Dosen / Ka Prodi</th>
              <th>Semester &amp; Tahun</th>
              <th>Program Studi</th>
              <th>Realisasi SKS</th>
              <th>Kualitas Mutu</th>
              <th>Status SKP</th>
              <th>TTD Ka Prodi</th>
              <th style={{ textAlign: 'right' }}>Aksi SDM</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Tidak ada berkas SKP yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedList.map((skp) => (
              <tr key={skp.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{skp.dosenNama}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    NIP: {skp.dosenNip} &bull; {skp.dosenJabatan}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>Semester {skp.semester}</span>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{skp.tahunAkademik}</div>
                </td>
                <td>{skp.dosenProdi}</td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--brand-700)' }}>
                    {skp.totalSksRealisasi} SKS
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700 }}>{skp.nilaiKinerjaSKP ? `${skp.nilaiKinerjaSKP}%` : '-'}</span>
                </td>
                <td>
                  {(() => {
                    const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(skp.status)
                    return (
                      <span
                        className={`badge-pill ${
                          isSah
                            ? 'badge-pill--green'
                            : skp.status === 'Diajukan'
                            ? 'badge-pill--orange'
                            : 'badge-pill--red'
                        }`}
                      >
                        {isSah ? 'Sah & Terbit' : skp.status === 'Perlu Revisi' ? 'Dibatalkan / Revisi' : skp.status}
                      </span>
                    )
                  })()}
                </td>
                <td>
                  {skp.ttdKaprodiUrl ? (
                    <span className="badge-pill badge-pill--green" style={{ fontSize: '11px' }}>
                      Ada TTD
                    </span>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>-</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="brand-btn btn-action-view"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleOpenReview(skp)}
                    >
                      <FileCheck2 size={13} />
                      <span>Verifikasi Berkas</span>
                    </button>
                    <button
                      className="brand-btn btn-action-print"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Cetak Formulir SKP Resmi di Tab Baru"
                      onClick={() => openPrintSKP(skp, skp.ttdDosenUrl)}
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )))
          }
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
