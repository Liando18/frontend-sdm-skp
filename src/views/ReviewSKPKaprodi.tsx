import React, { useState, useRef, useEffect } from 'react'
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
  Filter,
  Search,
} from 'lucide-react'
import { PengajuanSKP, Dosen, UserSession } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { useStaggerEntrance } from '../utils/animations'

interface ReviewSKPKaprodiProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  initialSelectedSKP?: PengajuanSKP | null
  onApproveByKaprodi: (skpId: string, catatan: string, ttdUrl?: string) => void
  onRejectByKaprodi: (skpId: string, catatan: string) => void
  onShowToast: (msg: string) => void
}

const TAHUN_OPTIONS = ['2025/2026', '2024/2025', '2026/2027']

export const ReviewSKPKaprodi: React.FC<ReviewSKPKaprodiProps> = ({
  user,
  skpList,
  dosenList,
  initialSelectedSKP,
  onApproveByKaprodi,
  onRejectByKaprodi,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [activeReviewSKP, setActiveReviewSKP] = useState<PengajuanSKP | null>(null)
  const [kaprodiNotes, setKaprodiNotes] = useState('')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [printSKPTarget, setPrintSKPTarget] = useState<PengajuanSKP | null>(null)

  useEffect(() => {
    if (initialSelectedSKP) {
      setActiveReviewSKP(initialSelectedSKP)
      setKaprodiNotes(initialSelectedSKP.catatanKaprodi || '')
      setViewMode('review')
    }
  }, [initialSelectedSKP])

  // Filters: Tahun Ajaran, Semester, Search
  const [selectedTahun, setSelectedTahun] = useState<string>('2025/2026')
  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Genap' | 'Ganjil'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  // Tanda Tangan Digital Ka Prodi State
  const defaultTTD = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="20" y="55" font-family="sans-serif" font-size="11" fill="%23c2410c">TTD Terverifikasi</text></svg>'
  const [ttdPreview, setTtdPreview] = useState<string>(defaultTTD)

  // Dosen homebase prodi (excluding Kaprodi himself, as Kaprodi is evaluated by Dekan)
  const prodiDosen = dosenList.filter(
    (d) => d.prodi === user.prodi && !d.isKaprodi
  )
  const prodiDosenIds = new Set(prodiDosen.map((d) => d.id))
  const prodiDosenNames = new Set(prodiDosen.map((d) => d.nama))

  const filteredRows = skpList.filter((skp) => {
    const isProdiDosen =
      prodiDosenIds.has(skp.dosenId) ||
      prodiDosenNames.has(skp.dosenNama) ||
      skp.dosenProdi === user.prodi

    if (!isProdiDosen) return false

    if (selectedTahun && skp.tahunAkademik && skp.tahunAkademik !== selectedTahun) {
      return false
    }

    if (selectedSemester !== 'Semua' && skp.semester !== selectedSemester) {
      return false
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        skp.dosenNama.toLowerCase().includes(q) ||
        (skp.dosenNip && skp.dosenNip.toLowerCase().includes(q))
      )
    }

    return true
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredRows, selectedTahun, selectedSemester, viewMode], {
    y: 8,
    stagger: 0.035,
  })

  const handleOpenReview = (skp: PengajuanSKP) => {
    setActiveReviewSKP(skp)
    setKaprodiNotes(skp.catatanKaprodi || '')
    setTtdPreview(skp.ttdKaprodiUrl || defaultTTD)
    setViewMode('review')
  }

  const handleTTDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTtdPreview(reader.result as string)
        onShowToast('Tanda tangan digital berhasil diunggah.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExecuteApprove = () => {
    if (!activeReviewSKP) return
    onApproveByKaprodi(activeReviewSKP.id, kaprodiNotes, ttdPreview)
    setConfirmApprove(false)
    setViewMode('list')
    onShowToast(`SKP dosen ${activeReviewSKP.dosenNama} berhasil disetujui, ditandatangani, dan diajukan ke SDM!`)
  }

  const handleExecuteReject = () => {
    if (!activeReviewSKP) return
    onRejectByKaprodi(activeReviewSKP.id, kaprodiNotes)
    setConfirmReject(false)
    setViewMode('list')
    onShowToast(`Catatan revisi telah dikirimkan kepada dosen.`)
  }

  // Sub-view: Review SKP Form
  if (viewMode === 'review' && activeReviewSKP) {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar SKP Prodi</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              Review &amp; Pengesahan SKP: {activeReviewSKP.dosenNama}
            </h1>
            <p className="page-desc">
              Verifikasi capaian Tridharma dosen homebase {user.prodi}, berikan catatan evaluasi mutu, dan bubuhkan tanda tangan digital.
            </p>
          </div>

          <button
            onClick={() => setPrintSKPTarget(activeReviewSKP)}
            className="brand-btn brand-btn--outline"
            style={{ padding: '10px 18px' }}
          >
            <Printer size={16} />
            <span>Cetak Pratinjau SKP</span>
          </button>
        </div>

        <div className="form-page-card">
          {/* Summary Metric Cards */}
          <div className="form-grid-3">
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dosen yang Dinilai
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {activeReviewSKP.dosenNama}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                NIP: {activeReviewSKP.dosenNip} &bull; {activeReviewSKP.dosenPangkat}
              </div>
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Realisasi &amp; Total Mutu
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-700)', marginTop: 4 }}>
                {activeReviewSKP.totalSksRealisasi} SKS / Mutu {activeReviewSKP.nilaiKinerjaSKP ?? activeReviewSKP.persentaseCapaian ?? 0}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                Semester {activeReviewSKP.semester} {activeReviewSKP.tahunAkademik}
              </div>
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pejabat Penilai (Ka Prodi)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {user.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                Ketua Program Studi {user.prodi}
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Daftar Bukti Fisik Luaran Tridharma ({activeReviewSKP.items.length} Kegiatan)
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: 35, textAlign: 'center' }}>No</th>
                    <th>Uraian Kegiatan Tridharma</th>
                    <th style={{ textAlign: 'center' }}>Rencana</th>
                    <th style={{ textAlign: 'center' }}>Perubahan</th>
                    <th style={{ textAlign: 'center' }}>Realisasi Akhir</th>
                    <th style={{ textAlign: 'center' }}>Kualitas Mutu</th>
                    <th style={{ textAlign: 'center' }}>Waktu</th>
                    <th>Dokumen Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReviewSKP.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 280 }}>
                        {it.kegiatan}
                      </td>
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

          {/* Upload Tanda Tangan Digital Ka Prodi */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--panel-hover)',
              border: '1.5px dashed var(--hair-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSignature size={20} color="var(--brand-600)" />
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  Upload Tanda Tangan Digital Ka Prodi (Pengesahan SKP)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Tanda tangan digital ini akan disematkan pada lembar formulir cetak resmi SKP dosen.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Preview Box */}
              <div
                style={{
                  width: 170,
                  height: 70,
                  border: '1px solid var(--hair-strong)',
                  borderRadius: 'var(--r-sm)',
                  background: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 4,
                }}
              >
                {ttdPreview ? (
                  <img
                    src={ttdPreview}
                    alt="Preview TTD Ka Prodi"
                    style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Belum Ada TTD</span>
                )}
              </div>

              {/* Upload Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--navy-900)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={14} />
                  <span>Unggah Berkas TTD (.PNG / .JPG / .SVG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTTDUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  Format transparan disarankan untuk hasil cetak terbaik.
                </span>
              </div>
            </div>
          </div>

          {/* Evaluator Notes */}
          <div className="form-field">
            <label className="form-label">Catatan Evaluasi / Rekomendasi Kaprodi</label>
            <textarea
              rows={3}
              className="custom-input"
              value={kaprodiNotes}
              onChange={(e) => setKaprodiNotes(e.target.value)}
              placeholder="Berikan umpan balik evaluasi mutu luaran Tridharma atau instruksi perbaikan..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12, paddingTop: 10 }}>
            <button
              type="button"
              className="brand-btn btn-action-delete"
              style={{
                padding: '10px 20px',
              }}
              onClick={() => setConfirmReject(true)}
            >
              <XCircle size={16} />
              <span>Minta Revisi Berkas</span>
            </button>
            <button
              type="button"
              className="brand-btn btn-action-add"
              style={{ padding: '10px 24px' }}
              onClick={() => setConfirmApprove(true)}
            >
              <CheckCircle size={16} />
              <span>Setujui, Tanda Tangani &amp; Ajukan ke SDM</span>
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmApprove}
          title="Setujui &amp; Tanda Tangani SKP Dosen"
          message={`Setujui SKP ${activeReviewSKP.dosenNama} dengan tanda tangan digital Anda dan teruskan ke Direktorat SDM untuk pengesahan akhir?`}
          confirmText="Ya, Setujui &amp; TTD"
          cancelText="Batal"
          onConfirm={handleExecuteApprove}
          onCancel={() => setConfirmApprove(false)}
        />

        <ConfirmDialog
          isOpen={confirmReject}
          title="Minta Revisi SKP"
          message={`Kembalikan berkas SKP kepada ${activeReviewSKP.dosenNama} untuk diperbaiki sesuai catatan evaluasi?`}
          confirmText="Kirim Catatan Revisi"
          cancelText="Batal"
          isDestructive={true}
          onConfirm={handleExecuteReject}
          onCancel={() => setConfirmReject(false)}
        />
      </div>
    )
  }

  // Master List View: Review SKP Dosen Homebase
  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Verifikasi &amp; Pengesahan SKP Dosen Homebase</h1>
          <p className="page-desc">
            Pemeriksaan kuantitas SKS, mutu luaran Tridharma, keabsahan dokumen bukti fisik, dan pembubuhan tanda tangan digital resmi Ketua Program Studi.
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
            <div style={{ display: 'inline-flex', gap: 4, background: 'var(--panel-hover)', padding: 3, borderRadius: 'var(--r-md)' }}>
              {(['Semua', 'Ganjil', 'Genap'] as const).map((sem) => (
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
                    fontSize: '12.5px',
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

        <div className="search" style={{ minWidth: 260 }}>
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Cari nama dosen atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Dosen Homebase Prodi</th>
              <th>Semester &amp; Periode</th>
              <th>Jabatan Fungsional</th>
              <th>Status SKP</th>
              <th>Realisasi SKS</th>
              <th>Capaian Mutu</th>
              <th>Tanda Tangan</th>
              <th style={{ textAlign: 'right' }}>Aksi Kaprodi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Tidak ada data pengajuan SKP dosen prodi untuk filter periode yang dipilih.
                </td>
              </tr>
            ) : (
              filteredRows.map((skp) => {
                const status = skp.status
                const realisasi =
                  skp.totalSksRealisasi ??
                  (skp.items && skp.items.length > 0
                    ? skp.items.reduce((acc, it) => acc + (it.realisasi || 0), 0)
                    : 0)
                const capaian =
                  skp.nilaiKinerjaSKP ??
                  skp.persentaseCapaian ??
                  (skp.totalSksRencana && skp.totalSksRencana > 0
                    ? Number(((realisasi / skp.totalSksRencana) * 100).toFixed(2))
                    : 0)

                return (
                  <tr key={skp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>{skp.dosenNama}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                        NIP {skp.dosenNip} &bull; {skp.dosenProdi}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill badge-pill--gray" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Semester {skp.semester} {skp.tahunAkademik}
                      </span>
                    </td>
                    <td>{skp.dosenJabatan || '-'} {skp.dosenPangkat ? `(${skp.dosenPangkat})` : ''}</td>
                    <td>
                      <span
                        className={`badge-pill ${
                          status === 'Disetujui SDM'
                            ? 'badge-pill--green'
                            : status === 'Dinilai Kaprodi'
                            ? 'badge-pill--blue'
                            : 'badge-pill--orange'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{realisasi} SKS</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{capaian}%</span>
                    </td>
                    <td>
                      {skp?.ttdKaprodiUrl ? (
                        <span className="badge-pill badge-pill--green" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={11} />
                          <span>TTD Tertera</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Belum TTD</span>
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
                          <span>Verifikasi &amp; TTD</span>
                        </button>
                        <button
                          className="brand-btn btn-action-print"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Cetak Formulir SKP"
                          onClick={() => setPrintSKPTarget(skp)}
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Printable SKP Modal */}
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
