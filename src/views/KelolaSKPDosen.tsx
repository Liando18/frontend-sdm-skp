import React, { useState, useRef } from 'react'
import {
  FileCheck2,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Calendar,
} from 'lucide-react'
import { PengajuanSKP } from '../types'
import { PRODI_LIST } from '../data'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { useStaggerEntrance } from '../utils/animations'

interface KelolaSKPDosenProps {
  skpList: PengajuanSKP[]
  onApproveSKP: (id: string, notes: string) => void
  onRejectSKP: (id: string, notes: string) => void
  onShowToast: (msg: string) => void
}

export const KelolaSKPDosen: React.FC<KelolaSKPDosenProps> = ({
  skpList,
  onApproveSKP,
  onRejectSKP,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [selectedSKP, setSelectedSKP] = useState<PengajuanSKP | null>(null)
  const [sdmNotes, setSdmNotes] = useState('')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [printSKPTarget, setPrintSKPTarget] = useState<PengajuanSKP | null>(null)

  const [selectedTahun, setSelectedTahun] = useState<string>('Semua')
  const [selectedSemester, setSelectedSemester] = useState<string>('Semua')
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua')
  const [selectedProdi, setSelectedProdi] = useState<string>('Semua Program Studi')
  const [searchQuery, setSearchQuery] = useState('')

  const tahunList = ['Semua', '2025/2026', '2024/2025', '2026/2027']
  const statusList = ['Semua', 'Diajukan', 'Dinilai Kaprodi', 'Disetujui SDM', 'Perlu Revisi']

  const filteredList = skpList.filter((skp) => {
    const matchTahun = selectedTahun === 'Semua' || skp.tahunAkademik === selectedTahun
    const matchSemester = selectedSemester === 'Semua' || skp.semester === selectedSemester
    const matchStatus = selectedStatus === 'Semua' || skp.status === selectedStatus
    const matchProdi = selectedProdi === 'Semua Program Studi' || skp.dosenProdi === selectedProdi
    const matchSearch =
      skp.dosenNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skp.dosenNip.toLowerCase().includes(searchQuery.toLowerCase())
    return matchTahun && matchSemester && matchStatus && matchProdi && matchSearch
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredList, viewMode], { y: 8, stagger: 0.04 })

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
            onClick={() => setPrintSKPTarget(selectedSKP)}
            className="brand-btn btn-action-print"
            style={{ padding: '10px 18px' }}
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
                {selectedSKP.totalSksRealisasi} SKS ({selectedSKP.nilaiKinerjaSKP || 90.58}%)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>Semester {selectedSKP.semester} {selectedSKP.tahunAkademik}</div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Status Berkas Saat Ini</div>
              <div style={{ marginTop: 6 }}>
                <span
                  className={`badge-pill ${
                    selectedSKP.status === 'Disetujui SDM'
                      ? 'badge-pill--green'
                      : selectedSKP.status === 'Dinilai Kaprodi'
                      ? 'badge-pill--blue'
                      : selectedSKP.status === 'Diajukan'
                      ? 'badge-pill--orange'
                      : 'badge-pill--red'
                  }`}
                >
                  {selectedSKP.status}
                </span>
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Daftar Bukti Fisik Luaran Tridharma ({selectedSKP.items.length} Kegiatan)
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: 35, textAlign: 'center' }}>No</th>
                    <th>Uraian Kegiatan Tridharma</th>
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
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{it.kegiatan}</td>
                      <td style={{ textAlign: 'center' }}>{it.rencanaAwal}</td>
                      <td style={{ textAlign: 'center' }}>{it.perubahanTengah}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)' }}>
                        {it.realisasi} {it.satuan}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{it.kualitasMutu}%</td>
                      <td style={{ textAlign: 'center' }}>{it.waktuNilai || 12} {it.waktuSatuan || 'bln'}</td>
                      <td>
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
                          <span>Buka Dokumen</span>
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
            <label className="form-label">Catatan Verifikasi &amp; Pengesahan Direktorat SDM</label>
            <textarea
              rows={3}
              className="custom-input"
              value={sdmNotes}
              onChange={(e) => setSdmNotes(e.target.value)}
              placeholder="Tuliskan catatan kelengkapan arsip, verifikasi BKD, atau instruksi..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10 }}>
            <button
              type="button"
              className="brand-btn btn-action-delete"
              onClick={() => setConfirmReject(true)}
            >
              <XCircle size={15} />
              <span>Minta Revisi Dokumen</span>
            </button>
            <button
              type="button"
              className="brand-btn btn-action-add"
              onClick={() => setConfirmApprove(true)}
            >
              <CheckCircle size={15} />
              <span>Sahkan &amp; Terbitkan SKP</span>
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmApprove}
          title="Sahkan Dokumen SKP"
          message={`Apakah Anda yakin ingin mengesahkan SKP atas nama ${selectedSKP.dosenNama}? Berkas yang disetujui akan diterbitkan secara resmi.`}
          confirmText="Sahkan Sekarang"
          cancelText="Batal"
          onConfirm={handleExecuteApprove}
          onCancel={() => setConfirmApprove(false)}
        />

        <ConfirmDialog
          isOpen={confirmReject}
          title="Permintaan Revisi SKP"
          message={`Kembalikan berkas SKP kepada ${selectedSKP.dosenNama} untuk diperbaiki sesuai catatan verifikasi?`}
          confirmText="Kirim Catatan Revisi"
          cancelText="Batal"
          isDestructive={true}
          onConfirm={handleExecuteReject}
          onCancel={() => setConfirmReject(false)}
        />

        {/* Modal Cetak Format Resmi UBK */}
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
            style={{ width: 'auto', minWidth: 155, height: 38, fontSize: '13px', fontWeight: 600 }}
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
            {PRODI_LIST.map((p, idx) => (
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
        <table className="custom-table">
          <thead>
            <tr>
              <th>Dosen / Ka Prodi</th>
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
            {filteredList.map((skp) => (
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
                  <span style={{ fontWeight: 700 }}>{skp.nilaiKinerjaSKP || 90.58}%</span>
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
                      title="Cetak Formulir SKP Resmi"
                      onClick={() => setPrintSKPTarget(skp)}
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cetak Format Resmi UBK */}
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
