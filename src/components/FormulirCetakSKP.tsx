import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Printer, X, ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react'
import { PengajuanSKP } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'
import { sanitizeUrl, resolveStorageUrl } from '../utils/security'
import { exportSKPToExcel } from '../utils/skpExcelExport'
import { printDocument } from '../utils/printDocument'
import { api } from '../services/api'

interface FormulirCetakSKPProps {
  skp: PengajuanSKP
  isOpen: boolean
  onClose: () => void
  dosenSignatureUrl?: string
}

export const FormulirCetakSKP: React.FC<FormulirCetakSKPProps> = ({
  skp,
  isOpen,
  onClose,
  dosenSignatureUrl,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Data Rektor sebagai Pejabat Penilai formal pada formulir cetak
  const [rektor, setRektor] = useState<{
    nama: string
    nuptk: string
    pangkat: string
    jabatan: string
    unit: string
    signatureUrl?: string
  }>({
    nama: '-',
    nuptk: '-',
    pangkat: '-',
    jabatan: 'Rektor',
    unit: 'Universitas Bhakti Kencana',
  })

  useEffect(() => {
    api.dosen
      .list()
      .then((dosens) => {
        if (Array.isArray(dosens)) {
          const found = dosens.find((d: any) => {
            const jab = (d.jabatanStruktural || d.jabatan_struktural || '').toLowerCase()
            return jab.includes('rektor') && !jab.includes('wakil')
          })
          if (found) {
            setRektor({
              nama: found.nama || '-',
              nuptk: found.nuptk || found.nip || '-',
              pangkat: found.golongan || '-',
              jabatan: 'Rektor',
              unit: 'Universitas Bhakti Kencana',
              signatureUrl: found.signatureUrl,
            })
          }
        }
      })
      .catch(() => {})
  }, [])

  const activeDosenSignature =
    skp.ttdDosenUrl && !skp.ttdDosenUrl.startsWith('data:image/svg')
      ? skp.ttdDosenUrl
      : dosenSignatureUrl || skp.ttdDosenUrl

  useGSAP(
    () => {
      if (!isOpen || !modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.26, ease: GSAP_EASE.smooth }
      )
    },
    { scope: modalRef, dependencies: [isOpen] }
  )

  const itemsPage1 = useMemo(() => skp.items.slice(0, 7), [skp.items])
  const itemsPage2 = useMemo(() => skp.items.slice(7), [skp.items])
  const hasPage2 = useMemo(() => itemsPage2.length > 0, [itemsPage2])

  if (!isOpen) return null

  const handlePrint = () => {
    if (viewportRef.current) {
      printDocument(
        viewportRef.current,
        `Formulir SKP - ${skp.dosenNama} - Semester ${skp.semester} TA ${skp.tahunAkademik}`
      )
    } else {
      window.print()
    }
  }

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true)
      await exportSKPToExcel(skp)
    } catch (err) {
      console.error('Gagal mengekspor SKP ke Excel:', err)
      alert('Terjadi kesalahan saat membuat file Excel. Silakan coba kembali.')
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Hitung total rata-rata mutu
  const totalMutu =
    skp.items.length > 0
      ? (
          skp.items.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
          skp.items.length
        ).toFixed(2)
      : (skp.nilaiKinerjaSKP ?? skp.persentaseCapaian ?? 0).toFixed(2)

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        ref={modalRef}
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--hair)',
            background: 'var(--panel-bg)',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Pratinjau Cetak: Formulir Sasaran Kinerja Dosen
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Semester {skp.semester} &bull; Tahun Akademik {skp.tahunAkademik} &bull; Format Resmi UBK
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="brand-btn"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                background: '#15803d',
                borderColor: '#166534',
                color: '#ffffff',
                gap: 6,
              }}
              title="Ekspor Formulir SKP ke File Excel (.xlsx) 1-Sheet sesuai format resmi UBK"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 size={15} className="spinner" />
                  <span>Membuat Excel...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={15} />
                  <span>Ekspor Excel (.xlsx)</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="brand-btn btn-action-print"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area with A4 Viewport */}
        <div
          ref={viewportRef}
          className="a4-print-viewport"
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div className="a4-sheet avoid-break">
            {/* Document Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              FORMULIR SASARAN KINERJA DOSEN
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              UNIVERSITAS BHAKTI KENCANA
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
              Semester {skp.semester} &bull; Tahun Akademik {skp.tahunAkademik}
            </div>
          </div>

          {/* Identitas Pegawai yang Dinilai (Kiri) & Pejabat Penilai (Kanan) Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1.5px solid #000000',
              marginBottom: 14,
              fontSize: '11.5px',
            }}
          >
            {/* Kolom Kiri: Pegawai Yang Dinilai */}
            <div style={{ borderRight: '1.5px solid #000000' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  background: '#f1f5f9',
                  borderBottom: '1px solid #000000',
                  fontWeight: 800,
                  padding: '4px 6px',
                }}
              >
                <span>NO</span>
                <span>I. PEGAWAI YANG DINILAI</span>
              </div>
              {[
                { no: '1', label: 'Nama', val: skp.dosenNama },
                { no: '2', label: 'NUPTK', val: skp.dosenNuptk || (skp as any).dosen_nuptk || '-' },
                { no: '3', label: 'Pangkat/Gol.Ruang', val: skp.dosenPangkat || 'Penata Muda / IIIa' },
                { no: '4', label: 'Jabatan', val: skp.dosenJabatan || 'Dosen Tetap' },
                { no: '5', label: 'Unit Kerja', val: skp.dosenProdi },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 110px 8px 1fr',
                    padding: '3px 6px',
                    borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  <span style={{ color: '#64748b' }}>{row.no}</span>
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                  <span>:</span>
                  <span style={{ fontWeight: 500 }}>{row.val || '-'}</span>
                </div>
              ))}
            </div>

            {/* Kolom Kanan: Pejabat Penilai (Rektor) */}
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  background: '#f1f5f9',
                  borderBottom: '1px solid #000000',
                  fontWeight: 800,
                  padding: '4px 6px',
                }}
              >
                <span>NO</span>
                <span>II. PEJABAT PENILAI</span>
              </div>
              {[
                { no: '1', label: 'Nama', val: rektor.nama },
                { no: '2', label: 'NUPTK', val: rektor.nuptk || '-' },
                { no: '3', label: 'Pangkat/Gol.Ruang', val: rektor.pangkat },
                { no: '4', label: 'Jabatan', val: rektor.jabatan },
                { no: '5', label: 'Unit Kerja', val: rektor.unit },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 110px 8px 1fr',
                    padding: '3px 6px',
                    borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  <span style={{ color: '#64748b' }}>{row.no}</span>
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                  <span>:</span>
                  <span style={{ fontWeight: 500 }}>{row.val || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Utama Rincian Kegiatan SKP */}
          <table
            style={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              fontSize: '11px',
              border: '1.5px solid #000000',
              wordBreak: 'break-word',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                <th rowSpan={2} style={{ width: 32, border: '1px solid #000000', padding: '6px 4px' }}>NO</th>
                <th rowSpan={2} style={{ border: '1px solid #000000', padding: '6px 8px' }}>III. KEGIATAN TUGAS JABATAN</th>
                <th rowSpan={2} style={{ width: 65, border: '1px solid #000000', padding: '6px 4px' }}>Rencana Awal</th>
                <th rowSpan={2} style={{ width: 65, border: '1px solid #000000', padding: '6px 4px' }}>Perubahan</th>
                <th colSpan={4} style={{ border: '1px solid #000000', padding: 4 }}>Realisasi</th>
              </tr>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                <th style={{ width: 75, border: '1px solid #000000', padding: 4 }}>KUANT/OUTPUT</th>
                <th style={{ width: 55, border: '1px solid #000000', padding: 4 }}>MUTU</th>
                <th style={{ width: 55, border: '1px solid #000000', padding: 4 }}>WAKTU</th>
                <th style={{ width: 95, border: '1px solid #000000', padding: 4 }}>Bukti Dukung</th>
              </tr>
            </thead>
            <tbody>
              {(hasPage2 ? itemsPage1 : skp.items).map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #000000',
                  }}
                >
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '5px 8px', fontWeight: 500 }}>
                    {item.kegiatan}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                    {item.rencanaAwal}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                    {item.perubahanTengah}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                    {item.realisasi} {item.satuan}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 700 }}>
                    {item.kualitasMutu}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                    {item.waktuNilai || 12} {item.waktuSatuan || 'bln'}
                  </td>
                  <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontSize: '10.5px' }}>
                    {item.linkDokumen ? (
                      <a
                        href={sanitizeUrl(item.linkDokumen)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1d4ed8',
                          textDecoration: 'underline',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <span>Tautan di sini</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ color: '#64748b' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}

              {!hasPage2 && (
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={5} style={{ border: '1.5px solid #000000', textAlign: 'right', padding: '7px 12px' }}>
                    TOTAL KUALITAS MUTU:
                  </td>
                  <td style={{ border: '1.5px solid #000000', textAlign: 'center', padding: '7px 4px', fontSize: '12px' }}>
                    {totalMutu}
                  </td>
                  <td colSpan={2} style={{ border: '1.5px solid #000000' }} />
                </tr>
              )}
            </tbody>
          </table>

          {/* Bagian Tanda Tangan & Pengesahan (Jika muat 1 halaman) */}
          {!hasPage2 && (
            <div className="avoid-break" style={{ marginTop: 24, fontSize: '11.5px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  textAlign: 'center',
                  gap: 40,
                }}
              >
                {/* Sisi Kiri: Pegawai Yang Dinilai */}
                <div>
                  <div style={{ marginBottom: 6, visibility: 'hidden' }}>Bandung, -</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Pegawai Yang Dinilai,</div>

                  <div
                    style={{
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeDosenSignature ? (
                      <img
                        src={resolveStorageUrl(activeDosenSignature)}
                        alt="Tanda Tangan Dosen"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.onerror = null
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>'
                        }}
                        style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '4px 12px',
                          border: '1px dashed #94a3b8',
                          borderRadius: 4,
                          fontSize: '10.5px',
                          color: '#64748b',
                        }}
                      >
                        (Tanda Tangan Digital Dosen)
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 4 }}>
                    {skp.dosenNama}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155' }}>
                    NUPTK: {skp.dosenNuptk || (skp as any).dosen_nuptk || '-'}
                  </div>
                </div>

                {/* Sisi Kanan: Pejabat Penilai (Rektor) */}
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 500 }}>
                    Bandung, {skp.tanggalPenilaianDekan || skp.tanggalPenilaianKaprodi || skp.tanggalPengajuan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Pejabat Penilai,</div>

                  <div
                    style={{
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {rektor.signatureUrl && !rektor.signatureUrl.startsWith('data:image/svg') ? (
                      <img
                        src={resolveStorageUrl(rektor.signatureUrl)}
                        alt="Tanda Tangan Pejabat Penilai"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.onerror = null
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>'
                        }}
                        style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '4px 12px',
                          border: '1px dashed #94a3b8',
                          borderRadius: 4,
                          fontSize: '10.5px',
                          color: '#64748b',
                        }}
                      >
                        (Tanda Tangan Digital Rektor)
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 4 }}>
                    {rektor.nama}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155' }}>
                    NUPTK: {rektor.nuptk || '-'}
                  </div>
                </div>
              </div>

              {/* Catatan Pengisian Resmi (Sesuai Lampiran) */}
              <div
                style={{
                  marginTop: 24,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--r-sm)',
                  background: '#f8fafc',
                  fontSize: '10.5px',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Catatan Pengisian :</div>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                  <li>Pengisian ini akan dituangkan dalam SKP dosen dan Syarat Kenaikan JAD tahunan.</li>
                  <li>Untuk Link dokumen bisa diambil dari BKD dan digabungkan.</li>
                  <li>Data yang Terealisasi harus sama dengan dokumen yang di-upload.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Footer Hal. 1 (hanya jika total halaman > 1) */}
          {hasPage2 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#475569', marginTop: 16 }}>
              <span style={{ fontStyle: 'italic' }}>Hal. 1</span>
            </div>
          )}
        </div>

        {/* HALAMAN 2: LEMBAR LANJUTAN SKP (JIKA ITEM > 7) */}
        {hasPage2 && (
          <div className="a4-sheet avoid-break">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                FORMULIR SASARAN KINERJA DOSEN (LEMBAR LANJUTAN)
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
                Semester {skp.semester} &bull; Tahun Akademik {skp.tahunAkademik} &bull; {skp.dosenNama} (NUPTK: {skp.dosenNuptk || (skp as any).dosen_nuptk || '-'})
              </div>
            </div>

            {/* Tabel Lanjutan */}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontSize: '11px',
                border: '1.5px solid #000000',
                wordBreak: 'break-word',
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                  <th rowSpan={2} style={{ width: 32, border: '1px solid #000000', padding: '6px 4px' }}>NO</th>
                  <th rowSpan={2} style={{ border: '1px solid #000000', padding: '6px 8px' }}>III. KEGIATAN TUGAS JABATAN (LANJUTAN)</th>
                  <th rowSpan={2} style={{ width: 65, border: '1px solid #000000', padding: '6px 4px' }}>Rencana Awal</th>
                  <th rowSpan={2} style={{ width: 65, border: '1px solid #000000', padding: '6px 4px' }}>Perubahan</th>
                  <th colSpan={4} style={{ border: '1px solid #000000', padding: 4 }}>Realisasi</th>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                  <th style={{ width: 75, border: '1px solid #000000', padding: 4 }}>KUANT/OUTPUT</th>
                  <th style={{ width: 55, border: '1px solid #000000', padding: 4 }}>MUTU</th>
                  <th style={{ width: 55, border: '1px solid #000000', padding: 4 }}>WAKTU</th>
                  <th style={{ width: 95, border: '1px solid #000000', padding: 4 }}>Bukti Dukung</th>
                </tr>
              </thead>
              <tbody>
                {itemsPage2.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderBottom: '1px solid #000000',
                    }}
                  >
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                      {itemsPage1.length + idx + 1}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', fontWeight: 500 }}>
                      {item.kegiatan}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                      {item.rencanaAwal}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                      {item.perubahanTengah}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                      {item.realisasi} {item.satuan}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontWeight: 700 }}>
                      {item.kualitasMutu}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px' }}>
                      {item.waktuNilai || 12} {item.waktuSatuan || 'bln'}
                    </td>
                    <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '5px 4px', fontSize: '10.5px' }}>
                      {item.linkDokumen ? (
                        <a
                          href={sanitizeUrl(item.linkDokumen)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#1d4ed8',
                            textDecoration: 'underline',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <span>Tautan di sini</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}

                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={5} style={{ border: '1.5px solid #000000', textAlign: 'right', padding: '7px 12px' }}>
                    TOTAL KUALITAS MUTU:
                  </td>
                  <td style={{ border: '1.5px solid #000000', textAlign: 'center', padding: '7px 4px', fontSize: '12px' }}>
                    {totalMutu}
                  </td>
                  <td colSpan={2} style={{ border: '1.5px solid #000000' }} />
                </tr>
              </tbody>
            </table>

            {/* Bagian Tanda Tangan & Pengesahan di Lembar Lanjutan */}
            <div className="avoid-break" style={{ marginTop: 24, fontSize: '11.5px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  textAlign: 'center',
                  gap: 40,
                }}
              >
                {/* Sisi Kiri: Pegawai Yang Dinilai */}
                <div>
                  <div style={{ marginBottom: 6, visibility: 'hidden' }}>Bandung, -</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Pegawai Yang Dinilai,</div>

                  <div
                    style={{
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeDosenSignature ? (
                      <img
                        src={resolveStorageUrl(activeDosenSignature)}
                        alt="Tanda Tangan Dosen"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.onerror = null
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>'
                        }}
                        style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '4px 12px',
                          border: '1px dashed #94a3b8',
                          borderRadius: 4,
                          fontSize: '10.5px',
                          color: '#64748b',
                        }}
                      >
                        (Tanda Tangan Digital Dosen)
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 4 }}>
                    {skp.dosenNama}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155' }}>
                    NUPTK: {skp.dosenNuptk || (skp as any).dosen_nuptk || '-'}
                  </div>
                </div>

                {/* Sisi Kanan: Pejabat Penilai (Rektor) */}
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 500 }}>
                    Bandung, {skp.tanggalPenilaianDekan || skp.tanggalPenilaianKaprodi || skp.tanggalPengajuan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Pejabat Penilai,</div>

                  <div
                    style={{
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {rektor.signatureUrl && !rektor.signatureUrl.startsWith('data:image/svg') ? (
                      <img
                        src={resolveStorageUrl(rektor.signatureUrl)}
                        alt="Tanda Tangan Pejabat Penilai"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.onerror = null
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>'
                        }}
                        style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '4px 12px',
                          border: '1px dashed #94a3b8',
                          borderRadius: 4,
                          fontSize: '10.5px',
                          color: '#64748b',
                        }}
                      >
                        (Tanda Tangan Digital Rektor)
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 4 }}>
                    {rektor.nama}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155' }}>
                    NUPTK: {rektor.nuptk || '-'}
                  </div>
                </div>
              </div>

              {/* Catatan Pengisian Resmi (Sesuai Lampiran) */}
              <div
                style={{
                  marginTop: 24,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--r-sm)',
                  background: '#f8fafc',
                  fontSize: '10.5px',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Catatan Pengisian :</div>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                  <li>Pengisian ini akan dituangkan dalam SKP dosen dan Syarat Kenaikan JAD tahunan.</li>
                  <li>Untuk Link dokumen bisa diambil dari BKD dan digabungkan.</li>
                  <li>Data yang Terealisasi harus sama dengan dokumen yang di-upload.</li>
                </ol>
              </div>
            </div>

            {/* Footer Hal. 2 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#475569', marginTop: 16 }}>
              <span style={{ fontStyle: 'italic' }}>Hal. 2</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
