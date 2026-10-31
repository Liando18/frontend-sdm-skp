import React, { useRef, useState, useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import { PenilaianKuesioner } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'
import { printDocument } from '../utils/printDocument'
import { api } from '../services/api'

interface CetakTranskripKuesionerProps {
  penilaian: PenilaianKuesioner | any
  dosenNama: string
  dosenNip?: string
  dosenNuptk?: string
  dosenProdi: string
  dosenJafung?: string
  dosenGolongan?: string
  tahunAkademik: string
  isOpen: boolean
  onClose: () => void
}

const BERAKHLAK_ITEMS = [
  {
    no: '1.',
    key: 'berorientasiPelayanan',
    label: 'Berorientasi Pelayanan',
    desc: 'Komitmen memberikan pelayanan prima demi kepuasan mahasiswa, rekan kerja, dan sivitas akademika.',
  },
  {
    no: '2.',
    key: 'akuntabel',
    label: 'Akuntabel',
    desc: 'Bertanggung jawab atas kepercayaan yang diberikan, jujur, berintegritas tinggi, dan transparan.',
  },
  {
    no: '3.',
    key: 'kompeten',
    label: 'Kompeten',
    desc: 'Terus belajar dan mengembangkan kapabilitas akademik, riset, serta pengabdian masyarakat.',
  },
  {
    no: '4.',
    key: 'harmonis',
    label: 'Harmonis',
    desc: 'Saling peduli dan menghargai perbedaan latar belakang, membangun lingkungan kerja yang kondusif.',
  },
  {
    no: '5.',
    key: 'loyal',
    label: 'Loyal',
    desc: 'Berdedikasi dan mengutamakan kepentingan bangsa, negara, dan institusi perguruan tinggi.',
  },
  {
    no: '6.',
    key: 'adaptif',
    label: 'Adaptif',
    desc: 'Terus berinovasi dan antusias dalam menggerakkan ataupun menghadapi perubahan teknologi dan kurikulum.',
  },
  {
    no: '7.',
    key: 'kolaboratif',
    label: 'Kolaboratif',
    desc: 'Membangun kerja sama yang sinergis antar program studi, fakultas, maupun mitra eksternal.',
  },
]

export const CetakTranskripKuesioner: React.FC<CetakTranskripKuesionerProps> = ({
  penilaian,
  dosenNama,
  dosenNip,
  dosenNuptk,
  dosenProdi,
  dosenJafung = 'Dosen',
  dosenGolongan = 'Penata Muda / IIIb',
  tahunAkademik,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

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

  if (!isOpen) return null

  const handlePrint = () => {
    if (viewportRef.current) {
      printDocument(
        viewportRef.current,
        `Transkrip Evaluasi Perilaku Kerja - ${dosenNama} - TA ${tahunAkademik}`
      )
    } else {
      window.print()
    }
  }

  const getScore = (key: string): number => {
    if (key === 'berorientasiPelayanan') return Number(penilaian.nilaiPelayanan ?? penilaian.berorientasiPelayanan ?? 0)
    if (key === 'akuntabel') return Number(penilaian.nilaiAkuntabel ?? penilaian.akuntabel ?? 0)
    if (key === 'kompeten') return Number(penilaian.nilaiKompeten ?? penilaian.kompeten ?? 0)
    if (key === 'harmonis') return Number(penilaian.nilaiHarmonis ?? penilaian.harmonis ?? 0)
    if (key === 'loyal') return Number(penilaian.nilaiLoyal ?? penilaian.loyal ?? 0)
    if (key === 'adaptif') return Number(penilaian.nilaiAdaptif ?? penilaian.adaptif ?? 0)
    if (key === 'kolaboratif') return Number(penilaian.nilaiKolaboratif ?? penilaian.kolaboratif ?? 0)
    return Number(penilaian[key] || 0)
  }

  const rataRata = Number(penilaian.rataRata) || 0
  const skala100 = (rataRata / 4) * 100

  const getKualifikasi = (score: number) => {
    if (score >= 3.8) return 'Di Atas Ekspektasi'
    if (score >= 3.0) return 'Sesuai Ekspektasi'
    return 'Di Bawah Ekspektasi'
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        ref={modalRef}
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: '95vw',
          maxHeight: '94vh',
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
            padding: '14px 24px',
            borderBottom: '1px solid var(--hair)',
            background: 'var(--panel-bg)',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Pratinjau Cetak: Transkrip Evaluasi Perilaku Kerja (BerAKHLAK)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Tahun Akademik {tahunAkademik} &bull; Pegawai: <strong>{dosenNama}</strong> (NUPTK: {dosenNuptk || '-'})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

        {/* Scrollable Printable Document Viewport (Slate Backdrop) */}
        <div
          ref={viewportRef}
          className="a4-print-viewport"
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div className="a4-sheet avoid-break">
            {/* Kop Transkrip Resmi */}
            <div style={{ textAlign: 'center', marginBottom: 18, borderBottom: '2px solid #000000', paddingBottom: 10 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                UNIVERSITAS BHAKTI KENCANA
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>
                TRANSKRIP EVALUASI PENILAIAN PERILAKU KERJA (BerAKHLAK)
              </div>
              <div style={{ fontSize: '11px', color: '#334155', marginTop: 2 }}>
                Pedoman SPMI UBK No: 03.07.00/PD/SDM-SPMI &bull; Periode Evaluasi Tahunan {tahunAkademik}
              </div>
            </div>

            {/* Identitas Pegawai & Penilai */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #000000', marginBottom: 16, fontSize: '11.5px' }}>
              {/* Kolom Kiri: Pegawai */}
              <div style={{ borderRight: '1.5px solid #000000' }}>
                <div style={{ background: '#f8fafc', padding: '4px 8px', fontWeight: 800, borderBottom: '1px solid #000000' }}>
                  I. PEGAWAI YANG DINILAI
                </div>
                <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: '100px 8px 1fr', gap: '3px 0' }}>
                  <span style={{ fontWeight: 600 }}>Nama</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{dosenNama}</strong>
                  <span style={{ fontWeight: 600 }}>NUPTK</span><span>:</span><span>{dosenNuptk || '-'}</span>
                  <span style={{ fontWeight: 600 }}>Pangkat/Gol.</span><span>:</span><span>{dosenGolongan}</span>
                  <span style={{ fontWeight: 600 }}>Jabatan</span><span>:</span><span>{dosenJafung}</span>
                  <span style={{ fontWeight: 600 }}>Unit Kerja</span><span>:</span><span>{dosenProdi}</span>
                </div>
              </div>

              {/* Kolom Kanan: Pejabat Penilai (Rektor) */}
              <div>
                <div style={{ background: '#f8fafc', padding: '4px 8px', fontWeight: 800, borderBottom: '1px solid #000000' }}>
                  II. PEJABAT PENILAI
                </div>
                <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: '100px 8px 1fr', gap: '3px 0' }}>
                  <span style={{ fontWeight: 600 }}>Nama</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{rektor.nama}</strong>
                  <span style={{ fontWeight: 600 }}>NUPTK</span><span>:</span><span>{rektor.nuptk || '-'}</span>
                  <span style={{ fontWeight: 600 }}>Pangkat/Gol.</span><span>:</span><span>{rektor.pangkat}</span>
                  <span style={{ fontWeight: 600 }}>Jabatan</span><span>:</span><span>{rektor.jabatan}</span>
                  <span style={{ fontWeight: 600 }}>Unit Kerja</span><span>:</span><span>{rektor.unit}</span>
                </div>
              </div>
            </div>

            {/* Kotak Ringkasan Capaian */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                border: '1.5px solid #000000',
                background: '#f8fafc',
                marginBottom: 16,
                textAlign: 'center',
                padding: '10px 0',
              }}
            >
              <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rata-rata Skor (1-4)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f223d', marginTop: 2 }}>{rataRata.toFixed(2)}</div>
              </div>
              <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Konversi Nilai (0-100)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f223d', marginTop: 2 }}>{skala100.toFixed(1)}%</div>
              </div>
              <div style={{ borderRight: '1px solid #cbd5e1', padding: '0 8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Predikat Perilaku</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#c2410c', marginTop: 4 }}>{penilaian.predikat}</div>
              </div>
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bobot Komposit Tahunan</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#047857', marginTop: 3 }}>30%</div>
              </div>
            </div>

            {/* Tabel Rincian 7 Dimensi BerAKHLAK */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: 16, fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#e2e8f0', borderBottom: '1.5px solid #000000' }}>
                  <th style={{ width: '6%', border: '1px solid #000000', padding: 6, textAlign: 'center' }}>NO</th>
                  <th style={{ width: '56%', border: '1px solid #000000', padding: 6, textAlign: 'left' }}>DIMENSI CORE VALUES BerAKHLAK</th>
                  <th style={{ width: '12%', border: '1px solid #000000', padding: 6, textAlign: 'center' }}>SKOR (1-4)</th>
                  <th style={{ width: '12%', border: '1px solid #000000', padding: 6, textAlign: 'center' }}>MUTU (%)</th>
                  <th style={{ width: '14%', border: '1px solid #000000', padding: 6, textAlign: 'center' }}>EKSPEKTASI</th>
                </tr>
              </thead>
              <tbody>
                {BERAKHLAK_ITEMS.map((item, idx) => {
                  const score = getScore(item.key)
                  const pct = (score / 4) * 100
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>{item.no}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px' }}>
                        <div style={{ fontWeight: 700 }}>{item.label}</div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: 1 }}>{item.desc}</div>
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '12px' }}>
                        {score.toFixed(1)}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>
                        {pct.toFixed(0)}%
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontSize: '10.5px', color: '#0369a1', fontWeight: 600 }}>
                        {getKualifikasi(score)}
                      </td>
                    </tr>
                  )
                })}
                {/* Total Row */}
                <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '1.5px solid #000000' }}>
                  <td colSpan={2} style={{ border: '1px solid #000000', padding: '7px 10px', textAlign: 'right' }}>
                    RATA-RATA NILAI PERILAKU KERJA :
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center', fontSize: '13px', color: '#0f223d' }}>
                    {rataRata.toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center', fontSize: '12px', color: '#0f223d' }}>
                    {skala100.toFixed(1)}%
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center', color: '#047857' }}>
                    {penilaian.predikat}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Catatan Evaluasi Pejabat Penilai */}
            <div style={{ border: '1px solid #000000', padding: '10px 14px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: 3 }}>Catatan Pembinaan &amp; Rekomendasi Pimpinan:</div>
              <div style={{ fontStyle: 'italic', color: '#1e293b', lineHeight: 1.5 }}>
                "{penilaian.catatan || 'Pegawai menunjukkan kepatuhan, disiplin, dan dedikasi profesional dalam menjalankan tugas institusi.'}"
              </div>
            </div>

            {/* Tanda Tangan Resmi Berdampingan */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 10px' }}>
              <div style={{ textAlign: 'center', width: 220 }}>
                <div style={{ fontSize: '11px', visibility: 'hidden' }}>Bandung, -</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: 40 }}>Pegawai Yang Dinilai,</div>
                <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{dosenNama}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>NUPTK: {dosenNuptk || '-'}</div>
              </div>

              <div style={{ textAlign: 'center', width: 220 }}>
                <div style={{ fontSize: '11px', color: '#334155' }}>Bandung, {penilaian.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: 40 }}>Pejabat Penilai,</div>
                <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{rektor.nama}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>NUPTK: {rektor.nuptk || '-'}</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: 28, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
              <span>Dokumen Transkrip Resmi Evaluasi Perilaku BerAKHLAK Universitas Bhakti Kencana</span>
              <span>Hal. 1 dari 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
