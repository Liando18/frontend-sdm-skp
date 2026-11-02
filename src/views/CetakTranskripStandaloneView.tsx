import React, { useEffect, useState, useMemo } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import { TranskripPrintData } from '../utils/printTranskrip'
import { api } from '../services/api'
import { resolveStorageUrl } from '../utils/security'
import { getCachedOfficialRektor, fetchOfficialRektor, RektorData } from '../utils/rektorData'
import { extractDocumentParams } from '../utils/urlSecurity'
import { KopSuratUBK } from '../components/print/KopSuratUBK'
import { TandaTanganBlock } from '../components/print/TandaTanganBlock'
import { PrintPageContainer } from '../components/print/PrintPageContainer'
import { IndikatorKuesioner } from '../types'
import { getBerakhlakDimensions, extractDimensionScore, getEkspektasiKualifikasi } from '../utils/berakhlak'

export const CetakTranskripStandaloneView: React.FC = () => {
  const [data, setData] = useState<TranskripPrintData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [indikatorList, setIndikatorList] = useState<IndikatorKuesioner[]>([])

  const berakhlakDimensions = useMemo(
    () => getBerakhlakDimensions(indikatorList),
    [indikatorList]
  )

  // Data Rektor Pejabat Penilai formal (100% dinamis dari database)
  const [rektor, setRektor] = useState<RektorData | null>(() => {
    try {
      const docParams = extractDocumentParams()
      const nip = docParams.nip || docParams.dosenNip || docParams.id
      const raw = nip
        ? localStorage.getItem(`ubk_print_transkrip_${nip}`) || localStorage.getItem('ubk_print_transkrip_data')
        : localStorage.getItem('ubk_print_transkrip_data')
      if (raw) {
        const parsed = JSON.parse(raw) as TranskripPrintData
        if (parsed?.rektor?.nama && parsed.rektor.nama !== '-') {
          return parsed.rektor
        }
      }
    } catch {}
    return getCachedOfficialRektor()
  })

  useEffect(() => {
    let isMounted = true
    const docParams = extractDocumentParams()
    const nip = docParams.nip || docParams.dosenNip || docParams.id

    let hasCompleteCache = false
    try {
      const raw = nip
        ? localStorage.getItem(`ubk_print_transkrip_${nip}`) || localStorage.getItem('ubk_print_transkrip_data')
        : localStorage.getItem('ubk_print_transkrip_data')

      if (raw) {
        const parsed = JSON.parse(raw) as TranskripPrintData
        if (parsed?.penilaian) {
          setData(parsed)
          if (Array.isArray(parsed.indikatorList) && parsed.indikatorList.length > 0) {
            setIndikatorList(parsed.indikatorList)
          }
          if (parsed.rektor?.nama && parsed.rektor.nama !== '-') {
            setRektor(parsed.rektor)
            hasCompleteCache = true
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache transkrip:', e)
    }

    if (hasCompleteCache) {
      setIsLoading(false)
    }

    fetchOfficialRektor()
      .then((dynamicRektor) => {
        if (!isMounted) return
        if (dynamicRektor && dynamicRektor.nama && dynamicRektor.nama !== '-') {
          setRektor(dynamicRektor)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    api.indikator
      .list()
      .then((items) => {
        if (isMounted && Array.isArray(items)) {
          setIndikatorList(items)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
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

  const rataRata = Number(penilaian.rataRata) || 0
  const skala100 = (rataRata / 4) * 100

  return (
    <PrintPageContainer
      title="Transkrip Evaluasi Perilaku Kerja BerAKHLAK"
      subtitle={`${dosenNama} • TA ${tahunAkademik} • ${dosenProdi}`}
      badge={
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 999,
            background: '#059669',
            color: '#ffffff',
          }}
        >
          Resmi Terverifikasi
        </span>
      }
    >
      <style>{`
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
      `}</style>

      {/* Kop Surat Resmi */}
      <KopSuratUBK />

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
              <span>1.</span><span style={{ fontWeight: 600 }}>Nama</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{rektor?.nama || '-'}</strong>
              <span>2.</span><span style={{ fontWeight: 600 }}>NUPTK</span><span>:</span><span>{rektor?.nuptk || '-'}</span>
              <span>3.</span><span style={{ fontWeight: 600 }}>Pangkat/Gol.</span><span>:</span><span>{rektor?.pangkat || '-'}</span>
              <span>4.</span><span style={{ fontWeight: 600 }}>Jabatan</span><span>:</span><span>{rektor?.jabatan || 'Rektor'}</span>
              <span>5.</span><span style={{ fontWeight: 600 }}>Unit Kerja</span><span>:</span><span>{rektor?.unit || 'Universitas Bhakti Kencana'}</span>
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
            {berakhlakDimensions.map((item, idx) => {
              const score = extractDimensionScore(data?.penilaian, item.key)
              const pct = (score / 4) * 100
              return (
                <tr key={item.key || idx}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.no}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: '7.5pt', color: '#475569', marginTop: 1 }}>{item.sub}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '9pt' }}>
                    {score.toFixed(1)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {pct.toFixed(0)}%
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '8pt', color: '#0369a1', fontWeight: 600 }}>
                    {getEkspektasiKualifikasi(score)}
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
        <TandaTanganBlock
          pegawai={{
            roleLabel: 'Pegawai Yang Dinilai',
            nama: dosenNama,
            nuptk: dosenNuptk || undefined,
            signatureUrl: data.dosenSignatureUrl,
          }}
          penilai={{
            roleLabel: 'Pejabat Penilai',
            nama: rektor?.nama || '-',
            nuptk: rektor?.nuptk || undefined,
            tanggal: penilaian.tanggal || undefined,
            signatureUrl: rektor?.signatureUrl,
            isDigitalVerified: true,
          }}
        />
    </PrintPageContainer>
  )
}
