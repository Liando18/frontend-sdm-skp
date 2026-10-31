import React, { useEffect, useState, useMemo } from 'react'
import { Printer, X, FileSpreadsheet, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react'
import { PengajuanSKP } from '../types'
import { sanitizeUrl, resolveStorageUrl } from '../utils/security'
import { exportSKPToExcel } from '../utils/skpExcelExport'
import { api } from '../services/api'

export const CetakSKPStandaloneView: React.FC = () => {
  const [skp, setSkp] = useState<PengajuanSKP | null>(null)
  const [dosenSignatureUrl, setDosenSignatureUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Data Rektor sebagai Pejabat Penilai formal pada dokumen cetak
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
    // Cari data Rektor dari database dosen jika tersedia
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

    // 1. Ambil ID dari URL query param ?id=...
    const urlParams = new URLSearchParams(window.location.search)
    const skpId = urlParams.get('id')

    // 2. Coba baca dari localStorage cache dulu agar rendering instan
    let cachedData: { skp: PengajuanSKP; dosenSignatureUrl?: string } | null = null
    try {
      const rawCache = skpId
        ? localStorage.getItem(`ubk_print_skp_${skpId}`) || localStorage.getItem('ubk_print_skp_data')
        : localStorage.getItem('ubk_print_skp_data')

      if (rawCache) {
        cachedData = JSON.parse(rawCache)
        if (cachedData?.skp) {
          setSkp(cachedData.skp)
          if (cachedData.dosenSignatureUrl) {
            setDosenSignatureUrl(cachedData.dosenSignatureUrl)
          }
          setIsLoading(false)
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache SKP:', e)
    }

    // 3. Jika ada ID dan belum ada data atau ingin memastikan data paling fresh dari backend:
    if (skpId) {
      api.skp
        .get(skpId)
        .then((data: PengajuanSKP) => {
          if (data) {
            setSkp(data)
            if (data.ttdDosenUrl) {
              setDosenSignatureUrl(data.ttdDosenUrl)
            }
          }
        })
        .catch((err: unknown) => {
          console.warn('Gagal memuat SKP dari server:', err)
          if (!cachedData) {
            setErrorMessage('Data formulir SKP tidak ditemukan atau gagal dimuat dari server.')
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else if (!cachedData) {
      setIsLoading(false)
      setErrorMessage('Parameter ID SKP tidak ditemukan di URL.')
    }
  }, [])

  useEffect(() => {
    // Pastikan scrolling window/body aktif secara global saat halaman pratinjau cetak terbuka
    document.documentElement.classList.add('print-mode')
    document.body.classList.add('print-mode')

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevHtmlHeight = document.documentElement.style.height
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyHeight = document.body.style.height

    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important')
    document.documentElement.style.setProperty('height', 'auto', 'important')
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.body.style.setProperty('overflow-y', 'auto', 'important')
    document.body.style.setProperty('height', 'auto', 'important')

    return () => {
      document.documentElement.classList.remove('print-mode')
      document.body.classList.remove('print-mode')
      document.documentElement.style.overflow = prevHtmlOverflow
      document.documentElement.style.height = prevHtmlHeight
      document.body.style.overflow = prevBodyOverflow
      document.body.style.height = prevBodyHeight
    }
  }, [])

  const activeDosenSignature = useMemo(() => {
    if (!skp) return undefined
    if (skp.ttdDosenUrl && !skp.ttdDosenUrl.startsWith('data:image/svg')) {
      return skp.ttdDosenUrl
    }
    return dosenSignatureUrl || skp.ttdDosenUrl
  }, [skp, dosenSignatureUrl])

  const totalMutu = useMemo(() => {
    if (!skp || !skp.items || skp.items.length === 0) {
      return (skp?.nilaiKinerjaSKP ?? skp?.persentaseCapaian ?? 0).toFixed(2)
    }
    const sum = skp.items.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0)
    return (sum / skp.items.length).toFixed(2)
  }, [skp])

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    if (!skp) return
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

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Memuat Dokumen SKP Resmi...</div>
        </div>
      </div>
    )
  }

  if (errorMessage || !skp) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 480, background: '#ffffff', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Dokumen Tidak Ditemukan</div>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
            {errorMessage || 'Data formulir SKP tidak dapat dimuat.'}
          </p>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          >
            Tutup Halaman Ini
          </button>
        </div>
      </div>
    )
  }

  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(skp.status)

  return (
    <div className="print-standalone-wrapper">
      {/* =========================================================================
          EMBEDDED STYLES FOR CLEAN SCREEN PREVIEW & FLAWLESS A4 MULTI-PAGE PRINT
         ========================================================================= */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }

          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          html, body, #root, .print-standalone-wrapper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print-bar {
            display: none !important;
          }

          .print-standalone-wrapper {
            padding-top: 0 !important;
          }

          .a4-paper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
          }

          /* Ensure table headers stay on top of subsequent pages */
          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          /* Prevent table rows and signature section from breaking across pages awkwardly */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        /* Screen Preview Styling */
        @media screen {
          html, body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: auto !important;
            min-height: 100% !important;
            background-color: #334155 !important;
          }

          #root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }

          .print-standalone-wrapper {
            min-height: 100vh;
            height: auto;
            width: 100%;
            background-color: #334155;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: visible;
            padding-top: 72px;
            padding-bottom: 60px;
          }

          .a4-paper {
            background: #ffffff;
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto 40px;
            padding: 12mm 14mm 16mm 14mm;
            box-shadow: 0 8px 30px rgba(0,0,0,0.35);
            box-sizing: border-box;
          }
        }

        .print-standalone-wrapper {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .no-print-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: #0f172a;
          color: #f8fafc;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          z-index: 9999;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .a4-paper {
          color: #000000;
          font-size: 8.5pt;
          line-height: 1.3;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .skp-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 8pt;
          margin-top: 8px;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .skp-table th, .skp-table td {
          border: 1px solid #000000;
          padding: 3.5px 3px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .skp-table thead th {
          background-color: #f1f5f9;
          font-weight: 700;
          text-align: center;
          color: #000000;
          padding: 4px 3px;
        }

        .skp-table tbody tr {
          background-color: #ffffff !important;
        }

        .skp-table tbody td {
          background-color: #ffffff !important;
          color: #000000;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* =========================================================================
          FLOATING TOOLBAR (HANYA MUNCUL DI LAYAR, TERSEMBUNYI SAAT DICETAK)
         ========================================================================= */}
      <div className="no-print-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => window.close()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Tutup tab pratinjau cetak ini"
          >
            <ArrowLeft size={14} />
            <span>Tutup Tab</span>
          </button>

          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Formulir Sasaran Kinerja Pegawai (SKP)</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: isSah ? '#059669' : '#d97706',
                  color: '#ffffff',
                }}
              >
                {isSah ? 'Sah & Terbit Resmi' : skp.status}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>
              {skp.dosenNama} &bull; Semester {skp.semester} TA {skp.tahunAkademik} &bull; {skp.dosenProdi}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#065f46',
              color: '#ffffff',
              border: '1px solid #047857',
              borderRadius: 6,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Unduh format spreadsheet Excel"
          >
            <FileSpreadsheet size={14} />
            <span>{isExportingExcel ? 'Membuat Excel...' : 'Ekspor Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
            }}
            title="Buka dialog cetak browser (Pilih Save as PDF untuk menyimpan file PDF)"
          >
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KERTAS STANDAR A4 RESMI (CONTINUOUS LAYOUT - NATIVE AUTO PAGINATION)
         ========================================================================= */}
      <div className="a4-paper">
        {/* KOP SURAT RESMI UNIVERSITAS BHAKTI KENCANA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px double #000000', paddingBottom: 6, marginBottom: 8 }}>
          <img
            src="/logo.png"
            alt="Logo UBK"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
            onError={(e) => {
              // Sembunyikan jika gagal termuat
              e.currentTarget.style.display = 'none'
            }}
          />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '11pt', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              YAYASAN BHAKTI KENCANA
            </div>
            <div style={{ fontSize: '13.5pt', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0f223d' }}>
              UNIVERSITAS BHAKTI KENCANA
            </div>
            <div style={{ fontSize: '8pt', color: '#1e293b', marginTop: 1 }}>
              Jl. Soekarno-Hatta No. 754 Cibiru, Kota Bandung, Jawa Barat 40614
            </div>
            <div style={{ fontSize: '7.5pt', color: '#475569' }}>
              Telp. (022) 7806500 | Laman: www.bku.ac.id | Pos-el: info@bku.ac.id
            </div>
          </div>
        </div>

        {/* JUDUL FORMULIR */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: '11.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            FORMULIR SASARAN KINERJA PEGAWAI (SKP)
          </div>
          <div style={{ fontSize: '9.5pt', fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>
            SEMESTER {skp.semester.toUpperCase()} TAHUN AKADEMIK {skp.tahunAkademik}
          </div>
        </div>

        {/* TABEL IDENTITAS: PEGAWAI YANG DINILAI (KIRI) & PEJABAT PENILAI (KANAN) */}
        <div style={{ border: '1.5px solid #000000', display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8.5pt', marginBottom: 8 }}>
          {/* Sisi Kiri: I. Pegawai Yang Dinilai */}
          <div style={{ borderRight: '1.5px solid #000000' }}>
            <div style={{ background: '#f1f5f9', fontWeight: 800, padding: '3px 6px', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
              I. PEGAWAI YANG DINILAI
            </div>
            {[
              { no: '1', label: 'Nama', val: skp.dosenNama },
              { no: '2', label: 'NUPTK', val: skp.dosenNuptk || (skp as any).dosen_nuptk || '-' },
              { no: '3', label: 'Pangkat / Gol.Ruang', val: skp.dosenPangkat || 'Penata Muda / IIIa' },
              { no: '4', label: 'Jabatan', val: skp.dosenJabatan || 'Dosen Tetap' },
              { no: '5', label: 'Unit Kerja', val: skp.dosenProdi },
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 115px 8px 1fr',
                  padding: '2px 6px',
                  borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <span>{row.no}.</span>
                <span style={{ fontWeight: 600 }}>{row.label}</span>
                <span>:</span>
                <span style={{ fontWeight: 500 }}>{row.val || '-'}</span>
              </div>
            ))}
          </div>

          {/* Sisi Kanan: II. Pejabat Penilai (Rektor) */}
          <div>
            <div style={{ background: '#f1f5f9', fontWeight: 800, padding: '3px 6px', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
              II. PEJABAT PENILAI
            </div>
            {[
              { no: '1', label: 'Nama', val: rektor.nama },
              { no: '2', label: 'NUPTK', val: rektor.nuptk || '-' },
              { no: '3', label: 'Pangkat / Gol.Ruang', val: rektor.pangkat },
              { no: '4', label: 'Jabatan', val: rektor.jabatan },
              { no: '5', label: 'Unit Kerja', val: rektor.unit },
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 115px 8px 1fr',
                  padding: '2px 6px',
                  borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <span>{row.no}.</span>
                <span style={{ fontWeight: 600 }}>{row.label}</span>
                <span>:</span>
                <span style={{ fontWeight: 500 }}>{row.val || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            TABEL KEGIATAN TRIDHARMA PERGURUAN TINGGI (CONTINUOUS TABLE)
            Catatan: thead { display: table-header-group } menjamin header berulang otomatis
            di setiap halaman jika tabel sangat panjang!
           ========================================================================= */}
        <table className="skp-table">
          <colgroup>
            <col style={{ width: '26px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '52px' }} />
            <col style={{ width: '54px' }} />
            <col style={{ width: '36px' }} />
            <col style={{ width: '58px' }} />
            <col style={{ width: '50px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '74px' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                NO
              </th>
              <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                III. KEGIATAN TUGAS JABATAN
              </th>
              <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', lineHeight: 1.25 }}>
                Rencana Awal<br />Semester
              </th>
              <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', lineHeight: 1.25 }}>
                Perubahan<br />Tengah Semester
              </th>
              <th colSpan={6} style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 800 }}>
                Realisasi
              </th>
            </tr>
            <tr>
              <th colSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                KUANT/OUTPUT
              </th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                KUAL/MUTU
              </th>
              <th colSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                WAKTU
              </th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                Link Dokumen
              </th>
            </tr>
          </thead>
          <tbody>
            {skp.items && skp.items.length > 0 ? (
              skp.items.map((item, idx) => (
                <tr key={item.id || idx} style={{ background: '#ffffff' }}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>
                    <div>{item.kegiatan}</div>
                    {item.kategori && (
                      <span style={{ fontSize: '7.5pt', color: '#64748b', fontStyle: 'italic' }}>
                        [{item.kategori}]
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.rencanaAwal ?? '-'}</td>
                  <td style={{ textAlign: 'center' }}>{item.perubahanTengah ?? '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {item.realisasi ?? 0}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.satuan || 'SKS'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {item.kualitasMutu !== undefined && item.kualitasMutu !== null
                      ? String(item.kualitasMutu).replace('.', ',')
                      : '100'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.waktuNilai ?? 6}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.waktuSatuan || 'bln'}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '8pt' }}>
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
                        <span>Tautan Bukti</span>
                        <ExternalLink size={9} />
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 20, color: '#64748b', background: '#ffffff' }}>
                  Tidak ada rincian kegiatan tugas jabatan yang tercatat.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#ffffff', fontWeight: 800 }}>
              <td colSpan={4} style={{ textAlign: 'right', padding: '6px 10px' }}>
                REKAPITULASI CAPAIAN TRIDHARMA:
              </td>
              <td colSpan={2} style={{ textAlign: 'center' }}>
                {skp.totalSksRealisasi} SKS
              </td>
              <td style={{ textAlign: 'center', color: '#000000' }}>
                {totalMutu.replace('.', ',')}
              </td>
              <td colSpan={3} style={{ textAlign: 'center', fontSize: '8pt', color: '#475569' }}>
                Formula SPMI UBK
              </td>
            </tr>
          </tfoot>
        </table>

        {/* CATATAN PENILAI & DIREKTORAT SDM */}
        <div className="avoid-break" style={{ marginTop: 10 }}>
          <div style={{ border: '1px solid #000000', padding: '6px 10px', fontSize: '8.5pt', background: '#fafafa' }}>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>
              IV. CATATAN EVALUASI &amp; REKOMENDASI PENILAI:
            </div>
            <div style={{ fontStyle: 'italic', color: '#1e293b', minHeight: 20 }}>
              "{skp.catatanKaprodi || skp.catatanDekan || 'Seluruh luaran tridharma telah sesuai dengan standar SPMI UBK dan telah diverifikasi lengkap.'}"
            </div>
            {skp.catatanSDM && (
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 700 }}>Catatan Biro SDM:</span> "{skp.catatanSDM}"
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            BAGIAN PENGESAHAN & TANDA TANGAN (AVOID PAGE BREAK)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: '9pt' }}>
            {/* Sisi Kiri: Pegawai Yang Dinilai */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ visibility: 'hidden' }}>Bandung, -</div>
              <div style={{ fontWeight: 700 }}>Pegawai Yang Dinilai,</div>

              {/* Tanda Tangan Dosen */}
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeDosenSignature && !activeDosenSignature.startsWith('data:image/svg') ? (
                  <img
                    src={resolveStorageUrl(activeDosenSignature)}
                    alt="Tanda Tangan Dosen"
                    style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '3px 10px',
                      border: '1px dashed #94a3b8',
                      borderRadius: 4,
                      fontSize: '8pt',
                      color: '#64748b',
                    }}
                  >
                    (Tanda Tangan Digital Dosen)
                  </div>
                )}
              </div>

              <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 2 }}>
                {skp.dosenNama}
              </div>
              <div style={{ fontSize: '8.5pt', color: '#334155' }}>
                NUPTK: {skp.dosenNuptk || (skp as any).dosen_nuptk || '-'}
              </div>
            </div>

            {/* Sisi Kanan: Pejabat Penilai (Rektor) */}
            <div style={{ textAlign: 'center' }}>
              <div>
                Bandung, {skp.tanggalPenilaianKaprodi || skp.tanggalPenilaianDekan || skp.tanggalPengajuan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontWeight: 700 }}>Pejabat Penilai,</div>

              {/* Tanda Tangan Penilai (Rektor) */}
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {rektor.signatureUrl && !rektor.signatureUrl.startsWith('data:image/svg') ? (
                  <img
                    src={resolveStorageUrl(rektor.signatureUrl)}
                    alt="Tanda Tangan Pejabat Penilai"
                    style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }}
                  />
                ) : isSah ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 4, color: '#047857', fontSize: '8pt', fontWeight: 700 }}>
                    <CheckCircle2 size={12} />
                    <span>Disahkan Secara Digital</span>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '3px 10px',
                      border: '1px dashed #94a3b8',
                      borderRadius: 4,
                      fontSize: '8pt',
                      color: '#64748b',
                    }}
                  >
                    (Tanda Tangan Digital Rektor)
                  </div>
                )}
              </div>

              <div style={{ fontWeight: 800, textDecoration: 'underline', marginTop: 2 }}>
                {rektor.nama}
              </div>
              <div style={{ fontSize: '8.5pt', color: '#334155' }}>
                NUPTK: {rektor.nuptk || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* CATATAN PENGISIAN RESMI */}
        <div className="avoid-break" style={{ marginTop: 10, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontSize: '7.5pt', lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, marginBottom: 1 }}>Catatan Pengisian :</div>
          <ol style={{ margin: 0, paddingLeft: 14, color: '#334155' }}>
            <li>Formulir ini merupakan dokumen resmi penetapan Sasaran Kinerja Pegawai (SKP) Universitas Bhakti Kencana.</li>
            <li>Luaran Tridharma yang terealisasi sinkron dengan dokumen bukti pada pangkalan data BKD dan SPMI UBK.</li>
            <li>Dokumen ini sah dan berkekuatan hukum sejak disetujui serta ditandatangani oleh Pejabat Penilai.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
