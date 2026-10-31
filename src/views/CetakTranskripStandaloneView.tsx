import React, { useEffect, useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import { TranskripPrintData } from '../utils/printTranskrip'
import { api } from '../services/api'

const BERAKHLAK_ITEMS = [
  {
    no: 1,
    key: 'berorientasiPelayanan',
    label: 'Berorientasi Pelayanan',
    desc: 'Komitmen memberikan pelayanan prima demi kepuasan mahasiswa, rekan sejawat, dan sivitas akademika.',
  },
  {
    no: 2,
    key: 'akuntabel',
    label: 'Akuntabel',
    desc: 'Bertanggung jawab atas kepercayaan yang diberikan serta transparan dalam tridharma perguruan tinggi.',
  },
  {
    no: 3,
    key: 'kompeten',
    label: 'Kompeten',
    desc: 'Terus belajar dan mengembangkan kapabilitas akademik, pedagogik, serta kepakaran bidang ilmu.',
  },
  {
    no: 4,
    key: 'harmonis',
    label: 'Harmonis',
    desc: 'Saling peduli dan menghargai perbedaan latar belakang sivitas akademika dalam lingkungan kampus.',
  },
  {
    no: 5,
    key: 'loyal',
    label: 'Loyal',
    desc: 'Berdedikasi dan mengutamakan kepentingan bangsa, negara, dan institusi Universitas Bhakti Kencana.',
  },
  {
    no: 6,
    key: 'adaptif',
    label: 'Adaptif',
    desc: 'Terus berinovasi dan antusias dalam menggerakkan ataupun menghadapi perubahan teknologi kurikulum.',
  },
  {
    no: 7,
    key: 'kolaboratif',
    label: 'Kolaboratif',
    desc: 'Membangun kerja sama yang sinergis antar program studi, fakultas, maupun mitra eksternal.',
  },
]

export const CetakTranskripStandaloneView: React.FC = () => {
  const [data, setData] = useState<TranskripPrintData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Data Rektor sebagai Pejabat Penilai formal pada transkrip cetak
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
      .then((dosens: any) => {
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const nip = urlParams.get('nip')

    try {
      const raw = nip
        ? localStorage.getItem(`ubk_print_transkrip_${nip}`) || localStorage.getItem('ubk_print_transkrip_data')
        : localStorage.getItem('ubk_print_transkrip_data')

      if (raw) {
        const parsed = JSON.parse(raw) as TranskripPrintData
        if (parsed?.penilaian) {
          setData(parsed)
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache transkrip:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Memuat Transkrip Evaluasi BerAKHLAK...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 460, background: '#ffffff', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Data Tidak Ditemukan</div>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
            Data transkrip evaluasi perilaku kuesioner tidak ditemukan di penyimpanan sesi.
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

  const { penilaian, dosenNama, dosenNip, dosenNuptk, dosenProdi, dosenJafung = 'Dosen Tetap', dosenGolongan = 'Penata Muda / IIIa', tahunAkademik } = data as any

  const getScore = (key: string): number => {
    const p = penilaian as unknown as Record<string, unknown>
    if (key === 'berorientasiPelayanan') return Number(penilaian.nilaiPelayanan ?? p.berorientasiPelayanan ?? 0)
    if (key === 'akuntabel') return Number(penilaian.nilaiAkuntabel ?? p.akuntabel ?? 0)
    if (key === 'kompeten') return Number(penilaian.nilaiKompeten ?? p.kompeten ?? 0)
    if (key === 'harmonis') return Number(penilaian.nilaiHarmonis ?? p.harmonis ?? 0)
    if (key === 'loyal') return Number(penilaian.nilaiLoyal ?? p.loyal ?? 0)
    if (key === 'adaptif') return Number(penilaian.nilaiAdaptif ?? p.adaptif ?? 0)
    if (key === 'kolaboratif') return Number(penilaian.nilaiKolaboratif ?? p.kolaboratif ?? 0)
    return Number(p[key] || 0)
  }

  const rataRata = Number(penilaian.rataRata) || 0
  const skala100 = (rataRata / 4) * 100

  const getKualifikasi = (score: number) => {
    if (score >= 3.8) return 'Di Atas Ekspektasi'
    if (score >= 3.0) return 'Sesuai Ekspektasi'
    return 'Di Bawah Ekspektasi'
  }

  return (
    <div className="print-standalone-wrapper">
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

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

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

        .transkrip-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .transkrip-table th, .transkrip-table td {
          border: 1px solid #000000;
          padding: 4px 6px;
        }

        .transkrip-table thead th {
          background-color: #f1f5f9;
          font-weight: 700;
          text-align: center;
          color: #000000;
        }

        .transkrip-table tbody tr {
          background-color: #ffffff !important;
        }

        .transkrip-table tbody td {
          background-color: #ffffff !important;
          color: #000000;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Floating Toolbar */}
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
          >
            <ArrowLeft size={14} />
            <span>Tutup Tab</span>
          </button>

          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Transkrip Evaluasi Perilaku Kerja BerAKHLAK</span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#059669', color: '#ffffff' }}>
                Resmi Terverifikasi
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>
              {dosenNama} &bull; TA {tahunAkademik} &bull; {dosenProdi}
            </div>
          </div>
        </div>

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
        >
          <Printer size={16} />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* A4 Document Body */}
      <div className="a4-paper">
        {/* Kop Surat Resmi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px double #000000', paddingBottom: 6, marginBottom: 8 }}>
          <img
            src="/logo.png"
            alt="Logo UBK"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
            onError={(e) => {
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

        {/* Judul Dokumen */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: '11.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            TRANSKRIP EVALUASI PENILAIAN PERILAKU KERJA (BerAKHLAK)
          </div>
          <div style={{ fontSize: '8.5pt', color: '#475569', marginTop: 1 }}>
            Pedoman SPMI UBK No: 03.07.00/PD/SDM-SPMI &bull; Periode Evaluasi Tahunan {tahunAkademik}
          </div>
        </div>

        {/* Identitas Pegawai & Penilai */}
        <div style={{ border: '1.5px solid #000000', display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8.5pt', marginBottom: 8 }}>
          <div style={{ borderRight: '1.5px solid #000000' }}>
            <div style={{ background: '#f1f5f9', fontWeight: 800, padding: '3px 6px', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
              I. PEGAWAI YANG DINILAI
            </div>
            <div style={{ padding: '4px 6px', display: 'grid', gridTemplateColumns: '20px 105px 8px 1fr', gap: '2px 0' }}>
              <span>1.</span><span style={{ fontWeight: 600 }}>Nama</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{dosenNama}</strong>
              <span>2.</span><span style={{ fontWeight: 600 }}>NUPTK</span><span>:</span><span>{dosenNuptk || '-'}</span>
              <span>3.</span><span style={{ fontWeight: 600 }}>Pangkat/Gol.</span><span>:</span><span>{dosenGolongan}</span>
              <span>4.</span><span style={{ fontWeight: 600 }}>Jabatan</span><span>:</span><span>{dosenJafung}</span>
              <span>5.</span><span style={{ fontWeight: 600 }}>Unit Kerja</span><span>:</span><span>{dosenProdi}</span>
            </div>
          </div>

          <div>
            <div style={{ background: '#f1f5f9', fontWeight: 800, padding: '3px 6px', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
              II. PEJABAT PENILAI
            </div>
            <div style={{ padding: '4px 6px', display: 'grid', gridTemplateColumns: '20px 105px 8px 1fr', gap: '2px 0' }}>
              <span>1.</span><span style={{ fontWeight: 600 }}>Nama</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{rektor.nama}</strong>
              <span>2.</span><span style={{ fontWeight: 600 }}>NUPTK</span><span>:</span><span>{rektor.nuptk || '-'}</span>
              <span>3.</span><span style={{ fontWeight: 600 }}>Pangkat/Gol.</span><span>:</span><span>{rektor.pangkat}</span>
              <span>4.</span><span style={{ fontWeight: 600 }}>Jabatan</span><span>:</span><span>{rektor.jabatan}</span>
              <span>5.</span><span style={{ fontWeight: 600 }}>Unit Kerja</span><span>:</span><span>{rektor.unit}</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Skor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1.5px solid #000000', background: '#f8fafc', marginBottom: 8, textAlign: 'center', padding: '6px 0' }}>
          <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 6px' }}>
            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rata-rata Skor (1-4)</div>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: '#0f223d', marginTop: 1 }}>{rataRata.toFixed(2)}</div>
          </div>
          <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 6px' }}>
            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Konversi Nilai (0-100)</div>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: '#0f223d', marginTop: 1 }}>{skala100.toFixed(1)}%</div>
          </div>
          <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 6px' }}>
            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Predikat Perilaku</div>
            <div style={{ fontSize: '13pt', fontWeight: 800, color: '#c2410c', marginTop: 2 }}>{penilaian.predikat}</div>
          </div>
          <div style={{ padding: '0 6px' }}>
            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bobot Komposit</div>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: '#047857', marginTop: 1 }}>30%</div>
          </div>
        </div>

        {/* Tabel 7 Dimensi BerAKHLAK */}
        <table className="transkrip-table" style={{ marginBottom: 8 }}>
          <thead>
            <tr>
              <th style={{ width: '32px' }}>NO</th>
              <th style={{ textAlign: 'left' }}>DIMENSI CORE VALUES BerAKHLAK</th>
              <th style={{ width: '75px' }}>SKOR (1-4)</th>
              <th style={{ width: '70px' }}>MUTU (%)</th>
              <th style={{ width: '120px' }}>EKSPEKTASI</th>
            </tr>
          </thead>
          <tbody>
            {BERAKHLAK_ITEMS.map((item, idx) => {
              const score = getScore(item.key)
              const pct = (score / 4) * 100
              return (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.no}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: '7.5pt', color: '#475569', marginTop: 1 }}>{item.desc}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '9pt' }}>
                    {score.toFixed(1)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {pct.toFixed(0)}%
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '8pt', color: '#0369a1', fontWeight: 600 }}>
                    {getKualifikasi(score)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#ffffff', fontWeight: 800 }}>
              <td colSpan={2} style={{ textAlign: 'right', padding: '5px 8px' }}>
                RATA-RATA NILAI PERILAKU KERJA :
              </td>
              <td style={{ textAlign: 'center', fontSize: '9.5pt', color: '#0f223d' }}>
                {rataRata.toFixed(2)}
              </td>
              <td style={{ textAlign: 'center', fontSize: '9pt', color: '#0f223d' }}>
                {skala100.toFixed(1)}%
              </td>
              <td style={{ textAlign: 'center', color: '#047857' }}>
                {penilaian.predikat}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Catatan Pembinaan */}
        <div className="avoid-break" style={{ border: '1px solid #000000', padding: '6px 10px', marginBottom: 12, background: '#fafafa', fontSize: '8pt' }}>
          <div style={{ fontWeight: 800, marginBottom: 2 }}>Catatan Pembinaan &amp; Rekomendasi Pimpinan:</div>
          <div style={{ fontStyle: 'italic', color: '#1e293b', minHeight: 20 }}>
            "{penilaian.catatan || 'Pegawai menunjukkan kepatuhan, disiplin, dan dedikasi profesional dalam menjalankan tugas institusi.'}"
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: '8.5pt', marginTop: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', visibility: 'hidden' }}>Bandung, -</div>
            <div style={{ fontWeight: 700, marginBottom: 40 }}>Pegawai Yang Dinilai,</div>
            <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{dosenNama}</div>
            <div style={{ fontSize: '8pt', color: '#475569' }}>NUPTK: {dosenNuptk || '-'}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#334155' }}>
              Bandung, {penilaian.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 40 }}>Pejabat Penilai,</div>
            <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{rektor.nama}</div>
            <div style={{ fontSize: '8pt', color: '#475569' }}>NUPTK: {rektor.nuptk || '-'}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#64748b', marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
          <span>Dokumen Transkrip Resmi Evaluasi Perilaku BerAKHLAK Universitas Bhakti Kencana &bull; SPMI UBK</span>
          <span>Standar Dokumen Formal A4 PermenPAN-RB</span>
        </div>
      </div>
    </div>
  )
}
