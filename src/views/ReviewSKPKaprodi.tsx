import React, { useState, useRef, useMemo } from 'react'
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
  Sparkles,
} from 'lucide-react'
import { PengajuanSKP, Dosen, UserSession } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { openPrintSKP } from '../utils/printSKP'
import { useStaggerEntrance } from '../utils/animations'
import { sanitizeUrl, resolveStorageUrl } from '../utils/security'

interface ReviewSKPKaprodiProps {
  user: UserSession
  skpList: PengajuanSKP[]
  dosenList: Dosen[]
  initialSelectedSKP?: PengajuanSKP | null
  onApproveByKaprodi: (skpId: string, catatan: string, ttdUrl?: string) => void
  onRejectByKaprodi: (skpId: string, catatan: string) => void
  onShowToast: (msg: string) => void
}

const TAHUN_OPTIONS = ['2026/2027', '2025/2026', '2024/2025']

export const ReviewSKPKaprodi: React.FC<ReviewSKPKaprodiProps> = ({
  user,
  skpList,
  dosenList,
  initialSelectedSKP,
  onApproveByKaprodi,
  onRejectByKaprodi,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'review'>(initialSelectedSKP ? 'review' : 'list')
  const [activeReviewSKP, setActiveReviewSKP] = useState<PengajuanSKP | null>(initialSelectedSKP || null)
  const [kaprodiNotes, setKaprodiNotes] = useState(initialSelectedSKP?.catatanKaprodi || '')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [printSKPTarget, setPrintSKPTarget] = useState<PengajuanSKP | null>(null)

  // React pattern: adjust state during render when initialSelectedSKP changes
  const [prevInitial, setPrevInitial] = useState(initialSelectedSKP)
  if (initialSelectedSKP && prevInitial?.id !== initialSelectedSKP.id) {
    setPrevInitial(initialSelectedSKP)
    setActiveReviewSKP(initialSelectedSKP)
    setKaprodiNotes(initialSelectedSKP.catatanKaprodi || '')
    setViewMode('review')
  }

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set([
        ...skpList.map((s) => s.tahunAkademik).filter(Boolean),
        '2026/2027',
        '2025/2026',
        '2024/2025',
      ])
    )
    return years.sort().reverse()
  }, [skpList])

  // Filters: Tahun Ajaran, Semester, Search
  const [selectedTahun, setSelectedTahun] = useState<string>(availableYears[0] || '2026/2027')
  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Genap' | 'Ganjil'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  // Tanda Tangan Digital Ka Prodi State
  const defaultTTD = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="20" y="55" font-family="sans-serif" font-size="11" fill="%23c2410c">TTD Terverifikasi</text></svg>'
  const [ttdPreview, setTtdPreview] = useState<string>(defaultTTD)

  // Identifikasi ranah wilayah Ka.Prodi (PSDKU vs Pusat)
  const isKaprodiPsdku = Boolean(
    user.tipeLokasi === 'PSDKU' ||
    user.psdkuId ||
    (user as any).psdku_id ||
    (user.kampus && user.kampus.toLowerCase().includes('psdku'))
  )
  const userPsdkuId = user.psdkuId || (user as any).psdku_id
  const userKampusName = (user.kampus || '').toLowerCase()
  const userFakultasId = user.fakultasId || (user as any).fakultas_id
  const userFakultasName = (user.fakultas || '').toLowerCase()

  // Dosen homebase prodi (termasuk Dekan/Kacap yang ber-homebase di prodi & wilayah ini,
  // mengecualikan Ka.Prodi itu sendiri yang dinilai oleh Dekan/Kacap)
  const prodiDosen = dosenList.filter((d) => {
    // 1. Wajib sama prodi
    const matchProdi =
      (user.programStudiId && (d.programStudiId === user.programStudiId || (d as any).program_studi_id === user.programStudiId)) ||
      (d.prodi === user.prodi)
    if (!matchProdi) return false

    // 2. Dilarang menilai diri sendiri
    const isSelf =
      d.id === user.id ||
      (user.nip && d.nip === user.nip) ||
      (user.name && d.nama.trim().toLowerCase() === user.name.trim().toLowerCase())
    if (isSelf) return false

    // 3. Ka.Prodi lain tidak dinilai oleh Ka.Prodi (Ka.Prodi dinilai oleh Dekan/KeCab)
    if (
      d.isKaprodi ||
      d.jabatanStruktural === 'Ketua Program Studi' ||
      d.jabatan_struktural === 'Ketua Program Studi'
    ) {
      return false
    }

    // 4. Strict Territorial Isolation
    if (isKaprodiPsdku) {
      // Wajib dari PSDKU yang sama
      const isDosenPsdku = Boolean(
        d.tipeLokasi === 'PSDKU' ||
        d.tipe_lokasi === 'PSDKU' ||
        d.psdkuId ||
        (d as any).psdku_id ||
        (d.kampus && d.kampus.toLowerCase().includes('psdku'))
      )
      if (!isDosenPsdku) return false

      const matchPsdkuId = userPsdkuId && (d.psdkuId === userPsdkuId || (d as any).psdku_id === userPsdkuId)
      const matchKampus = userKampusName && (d.kampus || '').toLowerCase().includes(userKampusName)
      if (userPsdkuId || userKampusName) {
        return Boolean(matchPsdkuId || matchKampus)
      }
      return true
    } else {
      // Wajib dari Kampus Pusat (Bukan dari PSDKU mana pun)
      const isDosenPsdku = Boolean(
        d.tipeLokasi === 'PSDKU' ||
        d.tipe_lokasi === 'PSDKU' ||
        d.psdkuId ||
        (d as any).psdku_id ||
        (d.kampus && d.kampus.toLowerCase().includes('psdku'))
      )
      if (isDosenPsdku) return false

      if (userFakultasId && (d.fakultasId || (d as any).fakultas_id)) {
        return d.fakultasId === userFakultasId || (d as any).fakultas_id === userFakultasId
      }
      if (userFakultasName && d.fakultas) {
        return (d.fakultas || '').toLowerCase().includes(userFakultasName)
      }
      return true
    }
  })
  const prodiDosenIds = new Set(prodiDosen.map((d) => d.id))
  const prodiDosenNips = new Set(prodiDosen.map((d) => d.nip).filter(Boolean))
  const prodiDosenNames = new Set(prodiDosen.map((d) => (d.nama || '').trim().toLowerCase()))

  const filteredRows = skpList.filter((skp) => {
    // Sembunyikan SKP yang masih Draft dari verifikasi
    if (!skp.status || skp.status === 'Draft') return false

    // 1. DILARANG MENILAI DIRI SENDIRI: Eksklusifkan SKP milik Ka.Prodi itu sendiri (SKP Ka.Prodi dinilai oleh Dekan)
    const isSelf =
      (user.id && skp.dosenId === user.id) ||
      (user.nip && skp.dosenNip === user.nip) ||
      (user.name && (skp.dosenNama || '').trim().toLowerCase() === user.name.trim().toLowerCase())

    if (isSelf) return false

    // 2. Pastikan SKP adalah milik dosen homebase di bawah bimbingan Ka.Prodi
    const isProdiDosen =
      (skp.dosenId && prodiDosenIds.has(skp.dosenId)) ||
      (skp.dosenNip && prodiDosenNips.has(skp.dosenNip)) ||
      (skp.dosenNama && prodiDosenNames.has(skp.dosenNama.trim().toLowerCase()))

    if (!isProdiDosen) return false

    if (selectedTahun && skp.tahunAkademik && skp.tahunAkademik !== selectedTahun) {
      return false
    }

    if (selectedSemester !== 'Semua' && skp.semester !== selectedSemester) {
      return false
    }

    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase()
      return (
        (skp.dosenNama || '').toLowerCase().includes(q) ||
        (skp.dosenNip || '').toLowerCase().includes(q) ||
        (skp.dosenProdi || '').toLowerCase().includes(q)
      )
    }

    return true
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [viewMode, selectedTahun, selectedSemester], {
    y: 8,
    stagger: 0.035,
  })

  const handleOpenReview = (skp: PengajuanSKP) => {
    setActiveReviewSKP(skp)
    setKaprodiNotes(skp.catatanKaprodi || '')
    setTtdPreview(user.signatureUrl || skp.ttdKaprodiUrl || defaultTTD)
    setViewMode('review')
  }

  const handleTTDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Ukuran berkas tanda tangan terlalu besar (maksimal 2MB).')
      return
    }

    if (!file.type.startsWith('image/')) {
      onShowToast('Format berkas harus berupa gambar (.png, .jpg, .svg).')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setTtdPreview(reader.result as string)
      onShowToast('Tanda tangan digital berhasil diunggah.')
    }
    reader.readAsDataURL(file)
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

          {(() => {
            const isApproved = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(activeReviewSKP.status)
            return (
              <button
                onClick={() => {
                  if (!isApproved) {
                    onShowToast('Berkas SKP belum dapat dicetak karena belum disetujui.')
                    return
                  }
                  openPrintSKP(activeReviewSKP, activeReviewSKP.ttdDosenUrl)
                }}
                disabled={!isApproved}
                className="brand-btn brand-btn--outline"
                style={{
                  padding: '10px 18px',
                  opacity: isApproved ? 1 : 0.5,
                  cursor: isApproved ? 'pointer' : 'not-allowed',
                }}
                title={isApproved ? 'Buka Cetak SKP Formal di Tab Baru' : 'SKP belum dapat dicetak (menunggu persetujuan)'}
              >
                <Printer size={16} />
                <span>Cetak Pratinjau SKP</span>
              </button>
            )
          })()}
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
                Disetujui Ketua Program Studi
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
              <table className="custom-table custom-table--sticky-skp">
                <thead>
                  <tr>
                    <th style={{ width: 48, minWidth: 48, maxWidth: 48, textAlign: 'center' }}>No</th>
                    <th style={{ minWidth: 260 }}>Uraian Kegiatan Tridharma</th>
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
                      <td style={{ width: 48, minWidth: 48, maxWidth: 48, textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, minWidth: 260, maxWidth: 280 }}>
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
                  Tanda Tangan Digital Ka Prodi Otomatis (Pengesahan SKP)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Tanda tangan Anda dan dosen yang dinilai otomatis disematkan dari profil institusi saat disetujui.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
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
                    src={resolveStorageUrl(ttdPreview)}
                    alt="Preview TTD Ka Prodi"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.onerror = null
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>'
                    }}
                    style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Belum Ada TTD</span>
                )}
              </div>

              {/* Status Otomatisasi TTD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                  <Check size={14} className="text-emerald-600" />
                  <span>TTD Digital Resmi Terdaftar di Profil</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: 440 }}>
                  Pada saat tombol <strong>Setujui SKP</strong> ditekan, tanda tangan persetujuan Anda dan tanda tangan <strong>{activeReviewSKP?.dosenNama}</strong> akan <strong>otomatis disematkan bersamaan</strong> pada berkas SKP resmi.
                </div>
              </div>
            </div>
          </div>

          {/* Evaluator Notes */}
          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Catatan Evaluasi / Rekomendasi Kaprodi</label>
              <button
                type="button"
                onClick={() => setKaprodiNotes('Berkas SKP telah diverifikasi lengkap, dokumen luaran Tridharma valid dan sesuai standar institusi. Disetujui tanpa catatan.')}
                className="brand-btn"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                title="Isi otomatis catatan evaluasi dummy"
              >
                <Sparkles size={11} className="text-amber-600 animate-pulse" />
                <span>⚡ Isi Catatan Otomatis</span>
              </button>
            </div>
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
              <span>Setujui, TTD &amp; Sahkan SKP</span>
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmApprove}
          title="Sahkan &amp; Terbitkan SKP Dosen"
          message={`Apakah Anda yakin ingin menyetujui dan menandatangani SKP atas nama ${activeReviewSKP.dosenNama}? Berkas SKP akan langsung SAH dan TERBIT secara resmi tanpa perlu menunggu validasi SDM.`}
          confirmText="Ya, Sahkan &amp; Terbitkan SKP"
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
                border: '1px solid var(--hair-strong)',
                boxShadow: 'var(--shadow-xs)',
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
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Dosen Homebase Prodi</th>
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
                      {(() => {
                        const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi'].includes(status)
                        return (
                          <span
                            className={`badge-pill ${
                              isSah
                                ? 'badge-pill--green'
                                : status === 'Perlu Revisi'
                                ? 'badge-pill--red'
                                : 'badge-pill--orange'
                            }`}
                          >
                            {isSah ? 'Sah & Terbit' : status}
                          </span>
                        )
                      })()}
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
                          title="Cetak Formulir SKP di Tab Baru"
                          onClick={() => openPrintSKP(skp, skp.ttdDosenUrl)}
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
          dosenSignatureUrl={dosenList.find((d) => d.id === printSKPTarget.dosenId || (printSKPTarget.dosenNip && d.nip === printSKPTarget.dosenNip) || d.nama === printSKPTarget.dosenNama)?.signatureUrl}
          onClose={() => setPrintSKPTarget(null)}
        />
      )}
    </div>
  )
}
