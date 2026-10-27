import React, { useRef } from 'react'
import { Printer, X, Download, ExternalLink } from 'lucide-react'
import { PengajuanSKP } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

interface FormulirCetakSKPProps {
  skp: PengajuanSKP
  isOpen: boolean
  onClose: () => void
}

export const FormulirCetakSKP: React.FC<FormulirCetakSKPProps> = ({
  skp,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const modalRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.26, ease: GSAP_EASE.smooth }
      )
    },
    { scope: modalRef }
  )

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
              onClick={handlePrint}
              className="brand-btn"
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

        {/* Scrollable Printable Document Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 36px',
            background: '#ffffff',
            color: '#000000',
            fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
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

          {/* Pejabat Penilai & Dosen yang Dinilai Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1.5px solid #000000',
              marginBottom: 14,
              fontSize: '11.5px',
            }}
          >
            {/* Kolom Kiri: Pejabat Penilai */}
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
                <span>I. PEJABAT PENILAI</span>
              </div>
              {[
                { no: '1', label: 'Nama', val: skp.penilaiNama },
                { no: '2', label: 'NIP', val: skp.penilaiNip },
                { no: '3', label: 'Pangkat/Gol.Ruang', val: skp.penilaiPangkat || 'Penata Tk I / IIId' },
                { no: '4', label: 'Jabatan', val: skp.penilaiJabatan },
                { no: '5', label: 'Unit Kerja', val: skp.penilaiUnit || skp.dosenProdi },
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
                  <span style={{ fontWeight: 500 }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Kolom Kanan: Dosen yang Dinilai */}
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
                <span>II. DOSEN YANG DINILAI</span>
              </div>
              {[
                { no: '1', label: 'Nama', val: skp.dosenNama },
                { no: '2', label: 'NIP', val: skp.dosenNip },
                { no: '3', label: 'Pangkat/Gol.Ruang', val: skp.dosenPangkat },
                { no: '4', label: 'Jabatan', val: skp.dosenJabatan },
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
                  <span style={{ fontWeight: 500 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Utama Rincian Kegiatan SKP */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              border: '1.5px solid #000000',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000', textAlign: 'center' }}>
                <th rowSpan={2} style={{ width: 32, border: '1px solid #000000', padding: 6 }}>NO</th>
                <th rowSpan={2} style={{ border: '1px solid #000000', padding: 6 }}>III. KEGIATAN TUGAS JABATAN</th>
                <th rowSpan={2} style={{ width: 85, border: '1px solid #000000', padding: 6 }}>Rencana Awal Semester</th>
                <th rowSpan={2} style={{ width: 95, border: '1px solid #000000', padding: 6 }}>Perubahan Tengah Semester</th>
                <th colSpan={4} style={{ border: '1px solid #000000', padding: 4 }}>Realisasi</th>
              </tr>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                <th style={{ width: 85, border: '1px solid #000000', padding: 4 }}>KUANT/OUTPUT</th>
                <th style={{ width: 65, border: '1px solid #000000', padding: 4 }}>KUAL/MUTU</th>
                <th style={{ width: 55, border: '1px solid #000000', padding: 4 }}>WAKTU</th>
                <th style={{ width: 110, border: '1px solid #000000', padding: 4 }}>Link Dokumen</th>
              </tr>
            </thead>
            <tbody>
              {skp.items.map((item, idx) => {
                // Background color sesuai kategori seperti gambar lampiran
                let rowBg = '#ffffff'
                if (item.kategori === 'Penelitian') rowBg = '#fef08a' // kuning
                else if (item.kategori === 'Pengabdian') rowBg = '#93c5fd' // biru muda
                else if (item.kategori === 'Penunjang') rowBg = '#bbf7d0' // hijau muda

                return (
                  <tr
                    key={item.id}
                    style={{
                      background: rowBg,
                      borderBottom: '1px solid #94a3b8',
                    }}
                  >
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 8px', fontWeight: 500 }}>
                      {item.kegiatan}
                    </td>
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px' }}>
                      {item.rencanaAwal}
                    </td>
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px' }}>
                      {item.perubahanTengah}
                    </td>
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px', fontWeight: 600 }}>
                      {item.realisasi} {item.satuan}
                    </td>
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px', fontWeight: 700 }}>
                      {item.kualitasMutu}
                    </td>
                    <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '5px 4px' }}>
                      {item.waktuNilai || 12} {item.waktuSatuan || 'bln'}
                    </td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', fontSize: '10px' }}>
                      {item.linkDokumen ? (
                        <a
                          href={item.linkDokumen}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#1d4ed8',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <span>Tautan Bukti</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {/* Baris Total */}
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

          {/* Bagian Tanda Tangan & Pengesahan */}
          <div style={{ marginTop: 24, fontSize: '11.5px' }}>
            <div style={{ textAlign: 'right', marginBottom: 12, paddingRight: 40, fontWeight: 500 }}>
              Bandung, {skp.tanggalPenilaianDekan || skp.tanggalPenilaianKaprodi || skp.tanggalPengajuan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                textAlign: 'center',
                gap: 40,
              }}
            >
              {/* Pejabat Penilai */}
              <div>
                <div style={{ fontWeight: 700 }}>Pejabat Penilai,</div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: 8 }}>
                  {skp.penilaiJabatan}
                </div>

                {/* TTD Image / Preview */}
                <div
                  style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(skp.ttdDekanUrl || skp.ttdKaprodiUrl) ? (
                    <img
                      src={skp.ttdDekanUrl || skp.ttdKaprodiUrl}
                      alt="Tanda Tangan Pejabat Penilai"
                      style={{ maxHeight: 56, objectFit: 'contain' }}
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
                      (Tanda Tangan Digital Terverifikasi)
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 800, textDecoration: 'underline' }}>
                  {skp.penilaiNama}
                </div>
                <div style={{ fontSize: '11px', color: '#334155' }}>
                  NIP. {skp.penilaiNip}
                </div>
              </div>

              {/* Dosen Yang Dinilai */}
              <div>
                <div style={{ fontWeight: 700 }}>Dosen Yang Dinilai,</div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: 8 }}>
                  {skp.dosenJabatan}
                </div>

                <div
                  style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {skp.ttdDosenUrl ? (
                    <img
                      src={skp.ttdDosenUrl}
                      alt="Tanda Tangan Dosen"
                      style={{ maxHeight: 56, objectFit: 'contain' }}
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

                <div style={{ fontWeight: 800, textDecoration: 'underline' }}>
                  {skp.dosenNama}
                </div>
                <div style={{ fontSize: '11px', color: '#334155' }}>
                  NIP. {skp.dosenNip}
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
        </div>
      </div>
    </div>
  )
}
