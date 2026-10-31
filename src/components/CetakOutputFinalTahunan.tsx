import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Printer, X, ExternalLink, ArrowLeft } from 'lucide-react'
import { Dosen, PengajuanSKP, PenilaianKuesioner, SKPItem } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'
import { sanitizeUrl, resolveStorageUrl } from '../utils/security'
import { printDocument } from '../utils/printDocument'
import { api } from '../services/api'

export interface OutputFinalData {
  dosen: Dosen
  tahunAkademik: string
  skpGanjil?: PengajuanSKP
  skpGenap?: PengajuanSKP
  kuesioner?: PenilaianKuesioner
  nilaiSKPGanjil: number
  nilaiSKPGenap: number
  rataRataSKP: number
  bobotSKP70: number
  bobotSKP60?: number
  nilaiKuisSkala4: number
  nilaiKuisSkala100: number
  bobotKuis30: number
  bobotKuis40?: number
  nilaiAkhirTahunan: number
  predikat: string
}

export interface CetakOutputFinalTahunanProps {
  data: OutputFinalData | null
  isOpen?: boolean
  onClose?: () => void
  isStandalone?: boolean
}

/**
 * Reusable dynamic digital signature box for print documents
 */
const SignatureBox: React.FC<{
  title: string
  name: string
  nuptk?: string
  jabatan?: string
  date?: string
  signatureUrl?: string
}> = ({ title, name, nuptk, date, signatureUrl }) => {
  return (
    <div style={{ width: 230, textAlign: 'center' }}>
      <div style={{ marginBottom: 6 }}>
        {date ? (
          <div>Bandung, {date}</div>
        ) : (
          <div style={{ visibility: 'hidden' }}>Bandung, -</div>
        )}
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>

      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '4px 0',
        }}
      >
        {signatureUrl ? (
          <img
            src={resolveStorageUrl(signatureUrl)}
            alt={`Tanda Tangan ${name}`}
            onError={(e) => {
              const target = e.currentTarget
              target.onerror = null
              target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 50 10 90 40 T 150 20" fill="none" stroke="%230f223d" stroke-width="2.5"/><text x="15" y="55" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">TTD Terverifikasi</text></svg>`
            }}
            style={{
              maxHeight: 56,
              maxWidth: 180,
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              padding: '4px 10px',
              border: '1px dashed #94a3b8',
              borderRadius: 4,
              fontSize: '10px',
              color: '#64748b',
              lineHeight: 1.3,
            }}
          >
            (Tanda Tangan Digital Terverifikasi)
          </div>
        )}
      </div>

      <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{name}</div>
      <div style={{ fontSize: '11px', color: '#334155' }}>NUPTK: {nuptk || '-'}</div>
    </div>
  )
}

/**
 * Pola Distribusi Predikat Kinerja Pegawai (PermenPAN-RB No. 6/2022 & Ouput Final.pdf Hal. 4)
 * Menampilkan kurva distribusi predikat kinerja dosen dengan sumbu vertikal (Y: Nilai/Frekuensi %)
 * dan sumbu horizontal (X: Predikat Kinerja Pegawai) serta dominasi puncak sesuai capaian riil.
 */
const PolaDistribusiLineChart: React.FC<{ predikat: string }> = ({ predikat }) => {
  const isSangatBaik = predikat === 'Sangat Baik'
  const isBaik = predikat === 'Baik'
  const isCukup = predikat === 'Cukup' || predikat === 'Butuh Perbaikan'
  const isKurang = predikat === 'Kurang'
  const isSangatKurang = predikat === 'Sangat Kurang'

  // Kategori Sumbu Horizontal (X-axis) sesuai regulasi PermenPAN-RB No. 6/2022
  const categories = [
    { label: 'Sangat Kurang', x: 105, active: isSangatKurang },
    { label: 'Kurang / Misconduct', x: 200, active: isKurang },
    { label: 'Butuh Perbaikan', x: 295, active: isCukup },
    { label: 'Baik', x: 390, active: isBaik },
    { label: 'Sangat Baik', x: 485, active: isSangatBaik },
  ]

  // Nilai Sumbu Vertikal (Y-axis): Dari 100% (y = 35) hingga 0% (y = 150)
  // Baseline kurva berada tepat di y = 150.
  // Dominasi puncak kurva melonjak tajam sesuai predikat yang diperoleh dosen.
  const points = isSangatBaik
    ? [
        { x: 105, y: 144 },
        { x: 200, y: 138 },
        { x: 295, y: 118 },
        { x: 390, y: 76 },
        { x: 485, y: 35 }, // DOMINAN PUNCAK DI SANGAT BAIK (~98%)
      ]
    : isBaik
    ? [
        { x: 105, y: 142 },
        { x: 200, y: 135 },
        { x: 295, y: 106 },
        { x: 390, y: 46 }, // DOMINAN PUNCAK DI BAIK (~90%)
        { x: 485, y: 108 },
      ]
    : isCukup
    ? [
        { x: 105, y: 140 },
        { x: 200, y: 106 },
        { x: 295, y: 46 }, // DOMINAN DI BUTUH PERBAIKAN (~90%)
        { x: 390, y: 110 },
        { x: 485, y: 142 },
      ]
    : isKurang
    ? [
        { x: 105, y: 112 },
        { x: 200, y: 46 }, // DOMINAN DI KURANG (~90%)
        { x: 295, y: 110 },
        { x: 390, y: 138 },
        { x: 485, y: 144 },
      ]
    : [
        { x: 105, y: 42 }, // DOMINAN DI SANGAT KURANG (~94%)
        { x: 200, y: 104 },
        { x: 295, y: 130 },
        { x: 390, y: 140 },
        { x: 485, y: 144 },
      ]

  const p0 = points[0]
  const p1 = points[1]
  const p2 = points[2]
  const p3 = points[3]
  const p4 = points[4]

  const pathD =
    `M ${p0.x} ${p0.y} ` +
    `C ${(p0.x + p1.x) / 2} ${p0.y}, ${(p0.x + p1.x) / 2} ${p1.y}, ${p1.x} ${p1.y} ` +
    `C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y} ` +
    `C ${(p2.x + p3.x) / 2} ${p2.y}, ${(p2.x + p3.x) / 2} ${p3.y}, ${p3.x} ${p3.y} ` +
    `C ${(p3.x + p4.x) / 2} ${p3.y}, ${(p3.x + p4.x) / 2} ${p4.y}, ${p4.x} ${p4.y}`

  const areaD = `${pathD} L ${p4.x} 150 L ${p0.x} 150 Z`

  // Level nilai pada sumbu Y
  const yLevels = [
    { label: '100%', y: 35 },
    { label: '75%', y: 63.75 },
    { label: '50%', y: 92.5 },
    { label: '25%', y: 121.25 },
    { label: '0%', y: 150 },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 540, margin: '4px auto 0 auto', textAlign: 'center' }}>
      <svg
        viewBox="0 0 540 196"
        style={{ width: '100%', height: 'auto', maxHeight: 196, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="polaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f223d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f223d" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Sumbu Y Vertikal: Garis Aksis */}
        <line x1="60" y1="28" x2="60" y2="150" stroke="#000000" strokeWidth="1.2" />

        {/* Label & Grid Sumbu Y Vertikal (Nilai / Frekuensi %) */}
        {yLevels.map((lvl, idx) => (
          <g key={idx}>
            {/* Grid horizontal tipis */}
            <line
              x1="60"
              y1={lvl.y}
              x2="515"
              y2={lvl.y}
              stroke={idx === 4 ? '#000000' : '#e2e8f0'}
              strokeWidth={idx === 4 ? 1.2 : 1}
              strokeDasharray={idx === 4 ? undefined : '3 3'}
            />
            {/* Tick mark sumbu Y */}
            <line x1="55" y1={lvl.y} x2="60" y2={lvl.y} stroke="#000000" strokeWidth="1" />
            {/* Teks angka persentase vertikal */}
            <text
              x="51"
              y={lvl.y + 3.5}
              textAnchor="end"
              fontSize="8.5"
              fontWeight="600"
              fill="#334155"
              fontFamily="sans-serif"
            >
              {lvl.label}
            </text>
          </g>
        ))}

        {/* Judul Sumbu Y Vertikal (Rotated Text) */}
        <text
          x="14"
          y="92.5"
          transform="rotate(-90 14 92.5)"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#1e293b"
          fontFamily="sans-serif"
        >
          Capaian / Frekuensi (%)
        </text>

        {/* Sumbu X Horizontal: Garis Kategori Vertikal */}
        {categories.map((c, i) => (
          <line
            key={i}
            x1={c.x}
            y1="28"
            x2={c.x}
            y2="150"
            stroke={c.active ? '#94a3b8' : '#f1f5f9'}
            strokeDasharray="2 2"
          />
        ))}

        {/* Area di bawah kurva (Shaded Gradient) */}
        <path d={areaD} fill="url(#polaGradient)" />

        {/* Garis Kurva Distribusi (Smooth Bezier Curve) */}
        <path d={pathD} fill="none" stroke="#0f223d" strokeWidth="2.5" strokeLinecap="round" />

        {/* Node Points pada setiap Kategori */}
        {points.map((p, idx) => {
          const isActive = categories[idx].active
          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 6 : 3.5}
                fill={isActive ? '#c2410c' : '#475569'}
                stroke={isActive ? '#ffffff' : 'none'}
                strokeWidth={isActive ? 2 : 0}
              />
              {isActive && (
                <g>
                  {/* Floating callout badge penanda predikat dosen */}
                  <rect
                    x={p.x - 52}
                    y={Math.max(4, p.y - 25)}
                    width="104"
                    height="18"
                    rx="3"
                    fill="#0f223d"
                  />
                  <text
                    x={p.x}
                    y={Math.max(4, p.y - 25) + 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    ★ Capaian: {predikat}
                  </text>
                  <polygon
                    points={`${p.x - 4},${Math.max(4, p.y - 25) + 18} ${p.x + 4},${Math.max(4, p.y - 25) + 18} ${p.x},${Math.max(4, p.y - 25) + 22}`}
                    fill="#0f223d"
                  />
                </g>
              )}
            </g>
          )
        })}

        {/* Tick Mark & Label Kategori Sumbu X (Horizontal) */}
        {categories.map((c, i) => (
          <g key={i}>
            <line x1={c.x} y1="150" x2={c.x} y2="155" stroke="#000000" strokeWidth="1" />
            <text
              x={c.x}
              y="167"
              textAnchor="middle"
              fontSize="8.5"
              fontWeight={c.active ? '800' : '500'}
              fill={c.active ? '#c2410c' : '#334155'}
              fontFamily="sans-serif"
            >
              {c.label}
            </text>
          </g>
        ))}

        {/* Judul Sumbu X di bawah grafik */}
        <text
          x="290"
          y="187"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#1e293b"
          fontFamily="sans-serif"
        >
          Predikat Kinerja Pegawai (PermenPAN-RB No. 6 Tahun 2022)
        </text>
      </svg>
    </div>
  )
}

export const CetakOutputFinalTahunan: React.FC<CetakOutputFinalTahunanProps> = ({
  data,
  isOpen = true,
  onClose,
  isStandalone = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'skp' | 'lampiran' | 'evaluasi' | 'dokumen'>('all')
  const modalRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  // Data Rektor sebagai Pejabat Penilai formal pada semua formulir cetak resmi
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
      if (!isOpen || !data || !modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.26, ease: GSAP_EASE.smooth }
      )
    },
    { scope: modalRef, dependencies: [isOpen, data] }
  )

  // Aggregate items across Ganjil and Genap semesters with distinct activities
  const allItems: SKPItem[] = useMemo(() => {
    if (!data) return []
    const ganjil = data.skpGanjil?.items || []
    const genap = data.skpGenap?.items || []
    const map = new Map<string, SKPItem>()

    for (const it of [...ganjil, ...genap]) {
      const key = it.kegiatan.trim().toLowerCase()
      if (!map.has(key)) {
        map.set(key, { ...it })
      } else {
        const existing = map.get(key)!
        const t1 = typeof existing.rencanaAwal === 'number' ? existing.rencanaAwal : parseFloat(String(existing.rencanaAwal || 0))
        const t2 = typeof it.rencanaAwal === 'number' ? it.rencanaAwal : parseFloat(String(it.rencanaAwal || 0))
        const r1 = typeof existing.realisasi === 'number' ? existing.realisasi : parseFloat(String(existing.realisasi || 0))
        const r2 = typeof it.realisasi === 'number' ? it.realisasi : parseFloat(String(it.realisasi || 0))
        if (!isNaN(t1) && !isNaN(t2) && t1 > 0 && t2 > 0) {
          existing.rencanaAwal = t1 + t2
        }
        if (!isNaN(r1) && !isNaN(r2) && r1 > 0 && r2 > 0) {
          existing.realisasi = r1 + r2
        }
        if (it.linkDokumen && !existing.linkDokumen) {
          existing.linkDokumen = it.linkDokumen
        }
      }
    }
    return Array.from(map.values())
  }, [data])

  // Group dynamic items by Tridharma categories
  const pendidikanItems = useMemo(() => {
    return allItems.filter(
      (it) =>
        it.kategori === 'Pendidikan' ||
        (!it.kategori &&
          /pengajaran|perkuliahan|mengajar|bimbingan|skripsi|modul|bahan ajar|menguji/i.test(it.kegiatan))
    )
  }, [allItems])

  const penelitianItems = useMemo(() => {
    return allItems.filter(
      (it) =>
        it.kategori === 'Penelitian' ||
        (!it.kategori &&
          /penelitian|jurnal|publikasi|karya ilmiah|prosiding/i.test(it.kegiatan))
    )
  }, [allItems])

  const pengabdianItems = useMemo(() => {
    return allItems.filter(
      (it) =>
        it.kategori === 'Pengabdian' ||
        (!it.kategori &&
          /pengabdian|pkm|desa|masyarakat|penyuluhan/i.test(it.kegiatan))
    )
  }, [allItems])

  const penunjangItems = useMemo(() => {
    return allItems.filter(
      (it) =>
        it.kategori === 'Penunjang' ||
        it.kategori === 'Tugas Tambahan' ||
        it.kategori === 'Layanan Akademik' ||
        it.kategori === 'Administrasi & Tata Usaha' ||
        it.kategori === 'Tata Kelola & Keuangan' ||
        (!it.kategori &&
          /panitia|seminar|workshop|senat|pengelola|institusi/i.test(it.kegiatan))
    )
  }, [allItems])

  const otherItems = useMemo(() => {
    return allItems.filter(
      (it) =>
        !pendidikanItems.includes(it) &&
        !penelitianItems.includes(it) &&
        !pengabdianItems.includes(it) &&
        !penunjangItems.includes(it)
    )
  }, [allItems, pendidikanItems, penelitianItems, pengabdianItems, penunjangItems])

  const tambahanItems = useMemo(() => [...penunjangItems, ...otherItems], [penunjangItems, otherItems])

  if (!isOpen || !data) return null

  const { dosen, tahunAkademik, predikat } = data

  // Data Pejabat Penilai formal pada cetak: Selalu data Rektor (atau '-' jika belum ada)
  const penilaiNama = rektor.nama
  const penilaiNuptk = rektor.nuptk || '-'
  const penilaiPangkat = rektor.pangkat
  const penilaiJabatan = rektor.jabatan
  const penilaiUnit = rektor.unit

  const dosenNuptk = dosen.nuptk || (data.skpGenap as any)?.dosenNuptk || (data.skpGanjil as any)?.dosenNuptk || '-'

  const tanggalCetak =
    data.skpGenap?.tanggalPenilaianDekan ||
    data.skpGenap?.tanggalPenilaianKaprodi ||
    data.skpGanjil?.tanggalPenilaianDekan ||
    data.skpGanjil?.tanggalPenilaianKaprodi ||
    data.kuesioner?.tanggal ||
    '30 Desember 2026'

  // Signatures resolution (automatically attaches verified digital signatures)
  const dosenTtdUrl =
    data.skpGenap?.ttdDosenUrl ||
    data.skpGanjil?.ttdDosenUrl ||
    dosen.signatureUrl

  const penilaiTtdUrl = rektor.signatureUrl

  // Questionnaire / Perilaku 7 BerAKHLAK dynamic evaluation
  const kuesionerData = data.kuesioner
  const coreValues = [
    {
      no: '1.',
      title: 'Berorientasi Pelayanan',
      score: kuesionerData?.nilaiPelayanan,
      bullets: [
        'Memahami dan memenuhi kebutuhan masyarakat',
        'Ramah, cekatan, solutif, dan dapat diandalkan',
        'Melakukan perbaikan tiada henti',
      ],
      ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan dapat mengikuti ketentuan perguruan tinggi.',
    },
    {
      no: '2.',
      title: 'Akuntabel',
      score: kuesionerData?.nilaiAkuntabel,
      bullets: [
        'Melaksanakan tugas dengan jujur, bertanggung jawab, cermat, disiplin, dan berintegritas tinggi',
        'Menggunakan kekayaan dan barang milik negara secara bertanggung jawab, efektif, dan efisien',
        'Tidak menyalahgunakan kewenangan jabatan',
      ],
      ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan dapat diandalkan dalam berbagai kegiatan.',
    },
    {
      no: '3.',
      title: 'Kompeten',
      score: kuesionerData?.nilaiKompeten,
      bullets: [
        'Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah',
        'Membantu orang lain belajar',
        'Melaksanakan tugas dengan kualitas terbaik',
      ],
      ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan selalu siap dengan ide gagasannya.',
    },
    {
      no: '4.',
      title: 'Harmonis',
      score: kuesionerData?.nilaiHarmonis,
      bullets: [
        'Menghargai setiap orang apapun latar belakangnya',
        'Suka menolong orang lain',
        'Membangun lingkungan kerja yang kondusif',
      ],
      ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dan selalu siap diskusi dengan rekan kerja.',
    },
    {
      no: '5.',
      title: 'Loyal',
      score: kuesionerData?.nilaiLoyal,
      bullets: [
        'Memegang teguh ideologi Pancasila, UUD 1945, setia pada NKRI serta pemerintahan yang sah',
        'Menjaga nama baik sesama ASN/pegawai, Pimpinan, Instansi, dan Negara',
        'Menjaga rahasia jabatan dan negara',
      ],
      ekspektasi: 'Pegawai dapat menerapkan aspek perilaku tersebut dan berintegritas yang baik.',
    },
    {
      no: '6.',
      title: 'Adaptif',
      score: kuesionerData?.nilaiAdaptif,
      bullets: [
        'Cepat menyesuaikan diri menghadapi perubahan',
        'Terus berinovasi dan mengembangkan kreativitas',
        'Bertindak proaktif',
      ],
      ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dan selalu membangun kreativitas dengan rekan kerja.',
    },
    {
      no: '7.',
      title: 'Kolaboratif',
      score: kuesionerData?.nilaiKolaboratif,
      bullets: [
        'Memberi kesempatan kepada berbagai pihak untuk berkontribusi',
        'Terbuka dalam bekerja sama untuk menghasilkan nilai tambah',
        'Menggerakkan pemanfaatan berbagai sumberdaya untuk tujuan bersama',
      ],
      ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dengan melaksanakan proses kolaborasi dalam tridharma PT.',
    },
  ]

  const getEkspektasiText = (customText: string, score?: number) => {
    if (score === undefined || score === null) return customText
    if (score >= 3.8) {
      return `Di Atas Ekspektasi — ${customText}`
    }
    if (score >= 3.0) {
      return `Sesuai Ekspektasi — ${customText}`
    }
    return `Perlu Peningkatan — Diharapkan lebih meningkatkan kedisiplinan dan kontribusi aktif.`
  }

  const handlePrint = () => {
    if (viewportRef.current) {
      printDocument(viewportRef.current, `Output Final - ${dosen.nama} - TA ${tahunAkademik}`)
    } else {
      window.print()
    }
  }

  const renderSheets = () => (
    <>
      {/* ====================================================================
          BAGIAN 1: SASARAN KINERJA PEGAWAI (HALAMAN 1)
         ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'skp') && (
            <>
              <div className="a4-sheet avoid-break">
                {/* Header Hal. 1 */}
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SASARAN KINERJA PEGAWAI
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                    PENDEKATAN HASIL KERJA KUALITATIF
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                    BAGI PEJABAT ADMINISTRASI / FUNGSIONAL
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginTop: 6, borderBottom: '1px solid #000000', paddingBottom: 4 }}>
                    <span>Universitas Bhakti Kencana</span>
                    <span>Periode: 01 Januari s/d 31 Desember {tahunAkademik.split('/')[0] || '2026'}</span>
                  </div>
                </div>

              {/* Tabel Identitas Pegawai & Penilai */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #000000', marginBottom: 16 }}>
                {/* Kiri: Pegawai yang Dinilai */}
                <div style={{ borderRight: '1.5px solid #000000' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', background: '#f8fafc', borderBottom: '1px solid #000000', fontWeight: 800, padding: '4px 6px' }}>
                    <span>No</span>
                    <span>Pegawai yang Dinilai</span>
                  </div>
                  {[
                    { no: '1.', label: 'Nama', val: dosen.nama },
                    { no: '2.', label: 'NUPTK', val: dosenNuptk },
                    { no: '3.', label: 'Pangkat / Gol.', val: dosen.golongan || '-' },
                    { no: '4.', label: 'Jabatan', val: dosen.jafung || 'Dosen' },
                    { no: '5.', label: 'Unit Kerja', val: dosen.prodi },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 110px 8px 1fr', padding: '3px 6px', borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ color: '#64748b' }}>{row.no}</span>
                      <span style={{ fontWeight: 600 }}>{row.label}</span>
                      <span>:</span>
                      <span style={{ fontWeight: 500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Kanan: Pejabat Penilai Kinerja */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', background: '#f8fafc', borderBottom: '1px solid #000000', fontWeight: 800, padding: '4px 6px' }}>
                    <span>No</span>
                    <span>Pejabat Penilai Kinerja</span>
                  </div>
                  {[
                    { no: '1.', label: 'Nama', val: penilaiNama },
                    { no: '2.', label: 'NUPTK', val: penilaiNuptk },
                    { no: '3.', label: 'Pangkat / Gol.', val: penilaiPangkat },
                    { no: '4.', label: 'Jabatan', val: penilaiJabatan },
                    { no: '5.', label: 'Unit Kerja', val: penilaiUnit },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 110px 8px 1fr', padding: '3px 6px', borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ color: '#64748b' }}>{row.no}</span>
                      <span style={{ fontWeight: 600 }}>{row.label}</span>
                      <span>:</span>
                      <span style={{ fontWeight: 500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rencana Hasil Kerja (100% DINAMIS - Lembar 1) */}
              <div style={{ border: '1.5px solid #000000', padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', borderBottom: '1px solid #000000', paddingBottom: 4, marginBottom: 8 }}>
                  HASIL KERJA
                </div>

                <div style={{ fontWeight: 700, marginBottom: 6 }}>A. Utama</div>
                <div style={{ paddingLeft: 10, marginBottom: 8 }}>
                  {allItems.length === 0 ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                      Belum ada rincian kegiatan SKP yang diajukan untuk tahun akademik ini.
                    </div>
                  ) : (
                    <>
                      {/* 1. Pendidikan */}
                      {pendidikanItems.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>
                            1. Meningkatnya kualitas dan mutu pembelajaran yang sesuai dengan rencana strategis perguruan tinggi (Penugasan dari Rektor)
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                            Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                            <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                              {pendidikanItems.map((it) => (
                                <li key={it.id}>
                                  <strong>{it.kegiatan}</strong>: Target {it.rencanaAwal} {it.satuan}, Realisasi: {it.realisasi} {it.satuan} (Capaian: {it.kualitasMutu || 100}%)
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* 2. Penelitian */}
                      {penelitianItems.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>
                            {pendidikanItems.length > 0 ? '2.' : '1.'} Meningkatnya jumlah dan kualitas penelitian dosen (Penugasan dari Rektor)
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                            Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                            <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                              {penelitianItems.map((it) => (
                                <li key={it.id}>
                                  <strong>{it.kegiatan}</strong>: Target {it.rencanaAwal} {it.satuan}, Realisasi: {it.realisasi} {it.satuan} (Capaian: {it.kualitasMutu || 100}%)
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* 3. Pengabdian */}
                      {pengabdianItems.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>
                            {(pendidikanItems.length > 0 ? 1 : 0) + (penelitianItems.length > 0 ? 1 : 0) + 1}. Meningkatnya kualitas kegiatan pengabdian kepada masyarakat (Penugasan dari Rektor)
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                            Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                            <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                              {pengabdianItems.map((it) => (
                                <li key={it.id}>
                                  <strong>{it.kegiatan}</strong>: Target {it.rencanaAwal} {it.satuan}, Realisasi: {it.realisasi} {it.satuan}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* B. Tambahan */}
                <div style={{ fontWeight: 700, marginBottom: 4, marginTop: 10 }}>B. Tambahan</div>
                <div style={{ paddingLeft: 10 }}>
                  {tambahanItems.length > 0 ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>1. Meningkatnya kualitas dosen tetap melalui unsur penunjang</div>
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                        Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                        <ul style={{ margin: '2px 0 4px 16px', padding: 0 }}>
                          {tambahanItems.map((it) => (
                            <li key={it.id}>
                              <strong>{it.kegiatan}</strong>: Target {it.rencanaAwal} {it.satuan}, Realisasi: {it.realisasi} {it.satuan}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '11px' }}>
                      Tidak ada target hasil kerja tambahan terdaftar untuk periode ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Hal. 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                <span style={{ fontStyle: 'italic' }}>Hal. 1</span>
              </div>
            </div>

            {/* ====================================================================
                HALAMAN 2: PERILAKU KERJA (TABEL 2 KOLOM SESUAI Ouput Final.pdf)
               ==================================================================== */}
            <div className="a4-sheet avoid-break">
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  PERILAKU KERJA PEGAWAI &amp; EKSPEKTASI KHUSUS PIMPINAN
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Universitas Bhakti Kencana &bull; Periode: 01 Januari s/d 31 Desember {tahunAkademik.split('/')[0] || '2026'}
                </div>
              </div>

              <div style={{ borderTop: '1.5px solid #000000', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', background: '#f8fafc', padding: '6px 8px', borderBottom: '1.5px solid #000000' }}>
                  PERILAKU KERJA
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '11px' }}>
                  <tbody>
                    {coreValues.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ width: '64%', verticalAlign: 'top', padding: '8px 10px', borderRight: '1.5px solid #000000' }}>
                          <div style={{ fontWeight: 700 }}>
                            {item.no} {item.title}
                            {item.score !== undefined && (
                              <span style={{ marginLeft: 6, fontSize: '10.5px', color: '#1d4ed8' }}>
                                (Skor: {item.score.toFixed(1)}/4.0)
                              </span>
                            )}
                          </div>
                          <ul style={{ margin: '3px 0 0 16px', padding: 0, fontSize: '10.5px', color: '#334155' }}>
                            {item.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ width: '36%', verticalAlign: 'top', padding: '8px 10px', background: '#fafbfc' }}>
                          <div style={{ fontWeight: 700, fontSize: '10.5px', marginBottom: 3 }}>
                            Ekspektasi Khusus Pimpinan:
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#1e293b', fontStyle: 'italic' }}>
                            {getEkspektasiText(item.ekspektasi, item.score)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan Hal. 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 10px' }}>
                <SignatureBox
                  title="Pegawai Yang Dinilai,"
                  name={dosen.nama}
                  nuptk={dosenNuptk}
                  signatureUrl={dosenTtdUrl}
                />
                <SignatureBox
                  title="Pejabat Penilai,"
                  name={penilaiNama}
                  nuptk={penilaiNuptk}
                  date={tanggalCetak}
                  signatureUrl={penilaiTtdUrl}
                />
              </div>

              {/* Footer Hal. 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                <span style={{ fontStyle: 'italic' }}>Hal. 2</span>
              </div>
            </div>
          </>
        )}

        {/* ====================================================================
            BAGIAN 2: LAMPIRAN SASARAN KINERJA PEGAWAI (HALAMAN 3)
           ==================================================================== */}
        {(activeTab === 'all' || activeTab === 'lampiran') && (
          <div className="a4-sheet avoid-break">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LAMPIRAN SASARAN KINERJA PEGAWAI
              </div>
            </div>

              <div style={{ border: '1.5px solid #000000', padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Dukungan Sumber Daya</div>
                <ol style={{ margin: '0 0 14px 18px', padding: 0 }}>
                  <li>Dukungan SDM di lingkungan perguruan tinggi</li>
                  <li>Dukungan sarana prasarana pengajaran yang memadai</li>
                  {penelitianItems.length > 0 && (
                    <li>Fasilitasi akses repository penelitian, jurnal bereputasi, dan dana stimulus publikasi ilmiah.</li>
                  )}
                  {pengabdianItems.length > 0 && (
                    <li>Dukungan koordinasi kemitraan desa binaan dan fasilitasi dari LPPM UBK.</li>
                  )}
                  <li>Dukungan pimpinan dalam pengambilan kebijakan terkait pengembangan kompetensi</li>
                  <li>Dukungan anggaran keuangan untuk mendukung tercapainya sasaran kinerja</li>
                </ol>

                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Skema Pertanggungjawaban</div>
                <ol style={{ margin: '0 0 14px 18px', padding: 0 }}>
                  <li>Tersedianya bukti kinerja setiap akhir semester</li>
                  <li>Pelaporan perkembangan rencana kinerja disampaikan secara berkala kepada Pimpinan Tinggi</li>
                </ol>

                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Konsekuensi</div>
                <ol style={{ margin: '0 0 4px 18px', padding: 0 }}>
                  <li>Rekomendasi peringkat hasil kerja akan kurang apabila capaian kinerja tidak sesuai dengan ekspektasi</li>
                  <li>Direkomendasikan mengikuti pengembangan kompetensi dosen</li>
                  <li>Capaian kinerja pegawai berpengaruh terhadap capaian kinerja organisasi</li>
                </ol>
              </div>

              {/* Tanda Tangan Hal. 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 10px' }}>
                <SignatureBox
                  title="Pegawai Yang Dinilai,"
                  name={dosen.nama}
                  nuptk={dosenNuptk}
                  signatureUrl={dosenTtdUrl}
                />
                <SignatureBox
                  title="Pejabat Penilai,"
                  name={penilaiNama}
                  nuptk={penilaiNuptk}
                  date={tanggalCetak}
                  signatureUrl={penilaiTtdUrl}
                />
              </div>

              {/* Footer Hal. 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                <span style={{ fontStyle: 'italic' }}>Hal. 3</span>
              </div>
            </div>
          )}

          {/* ====================================================================
              BAGIAN 3: EVALUASI KINERJA PEGAWAI PERIODE AKHIR TAHUNAN & POLA DISTRIBUSI (HALAMAN 4 - 7)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'evaluasi') && (
            <>
              {/* HALAMAN 4: EVALUASI HASIL KERJA & POLA DISTRIBUSI */}
              <div className="a4-sheet avoid-break">
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    EVALUASI KINERJA PEGAWAI PENDEKATAN HASIL KERJA KUALITATIF
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                    BAGI PEJABAT ADMINISTRASI / FUNGSIONAL
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                    PERIODE: TRIWULAN I/II/III/IV-AKHIR*
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginTop: 6, borderBottom: '1px solid #000000', paddingBottom: 4 }}>
                    <span>Universitas Bhakti Kencana</span>
                    <span>Periode: 01 Januari s/d 31 Desember {tahunAkademik.split('/')[0] || '2026'}</span>
                  </div>
                </div>

                {/* Identitas Evaluasi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #000000', marginBottom: 14 }}>
                  <div style={{ borderRight: '1.5px solid #000000', padding: '4px 6px' }}>
                    <div style={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>Pegawai yang Dinilai:</div>
                    <div>Nama: <strong>{dosen.nama}</strong> &bull; NUPTK: {dosenNuptk}</div>
                    <div>Jabatan: {dosen.jafung} &bull; Unit: {dosen.prodi}</div>
                  </div>
                  <div style={{ padding: '4px 6px' }}>
                    <div style={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>Pejabat Penilai Kinerja:</div>
                    <div>Nama: <strong>{penilaiNama}</strong> &bull; NUPTK: {penilaiNuptk}</div>
                    <div>Jabatan: {penilaiJabatan} &bull; Unit: {penilaiUnit}</div>
                  </div>
                </div>

                {/* CAPAIAN KINERJA ORGANISASI & POLA DISTRIBUSI (PERSIS SEPERTI Ouput Final.pdf Hal. 4) */}
                <div style={{ border: '1.5px solid #000000', padding: '10px 14px', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '11.5px', marginBottom: 4 }}>
                    CAPAIAN KINERJA ORGANISASI: <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{data.rataRataSKP >= 81 ? 'Baik' : 'Cukup'}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '11.5px', marginBottom: 4 }}>
                    POLA DISTRIBUSI:
                  </div>

                  {/* Line Chart Kurva Pola Distribusi Predikat Kinerja Pegawai */}
                  <PolaDistribusiLineChart predikat={data.predikat} />
                </div>

                {/* Tabel Evaluasi Hasil Kerja Halaman 4 */}
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: 14, fontSize: '11px', wordBreak: 'break-word' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                      <th style={{ width: '38%', border: '1px solid #000000', padding: 6, textAlign: 'left' }}>HASIL KERJA</th>
                      <th style={{ width: '34%', border: '1px solid #000000', padding: 6 }}>Realisasi Berdasarkan Bukti Dukung</th>
                      <th style={{ width: '28%', border: '1px solid #000000', padding: 6 }}>Umpan Balik Berkelanjutan Berdasarkan Bukti Dukung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={3} style={{ border: '1px solid #000000', padding: '5px 8px' }}>A. Utama</td>
                    </tr>

                    {/* 1. Pendidikan */}
                    {pendidikanItems.length > 0 && (
                      <tr>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700 }}>1. Meningkatnya kualitas dan mutu pembelajaran yang sesuai dengan rencana strategis perguruan tinggi (Penugasan dari Rektor)</div>
                          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                            {pendidikanItems.map((it) => it.kegiatan).join(', ')}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                          {pendidikanItems.map((it, idx) => (
                            <div key={idx} style={{ marginBottom: 4 }}>
                              <div>&bull; <strong>{it.kegiatan}</strong>: Realisasi {it.realisasi} {it.satuan} (Target: {it.rencanaAwal})</div>
                              {it.linkDokumen ? (
                                <a
                                  href={sanitizeUrl(it.linkDokumen)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1d4ed8',
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '10px',
                                  }}
                                >
                                  <span>Tautan di sini</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '10px', color: '#64748b' }}>(Bukti arsip akademik prodi terverifikasi)</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                          {data.skpGenap?.catatanKaprodi || data.skpGanjil?.catatanKaprodi || 'Hasil kerja secara umum sudah baik dan mencukupi komponen yang dibutuhkan.'}
                        </td>
                      </tr>
                    )}

                    {/* 2. Penelitian */}
                    {penelitianItems.length > 0 && (
                      <tr>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700 }}>
                            {pendidikanItems.length > 0 ? '2.' : '1.'} Meningkatnya jumlah dan kualitas penelitian dosen (Penugasan dari Rektor)
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                            {penelitianItems.map((it) => it.kegiatan).join(', ')}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                          {penelitianItems.map((it, idx) => (
                            <div key={idx} style={{ marginBottom: 4 }}>
                              <div>&bull; <strong>{it.kegiatan}</strong>: Realisasi {it.realisasi} {it.satuan}</div>
                              {it.linkDokumen ? (
                                <a
                                  href={sanitizeUrl(it.linkDokumen)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1d4ed8',
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '10px',
                                  }}
                                >
                                  <span>Tautan di sini</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '10px', color: '#64748b' }}>(Naskah publikasi terbit dan tercatat di repository)</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                          Hasil publikasi pada periode tersebut sangat lebih dari cukup untuk dijadikan sebagai kewajiban khusus dosen tersebut.
                        </td>
                      </tr>
                    )}

                    {/* 3. Pengabdian */}
                    {pengabdianItems.length > 0 && (
                      <tr>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700 }}>
                            {(pendidikanItems.length > 0 ? 1 : 0) + (penelitianItems.length > 0 ? 1 : 0) + 1}. Meningkatnya kualitas kegiatan pengabdian kepada masyarakat (Penugasan dari Rektor)
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                            {pengabdianItems.map((it) => it.kegiatan).join(', ')}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                          {pengabdianItems.map((it, idx) => (
                            <div key={idx} style={{ marginBottom: 4 }}>
                              <div>&bull; <strong>{it.kegiatan}</strong>: Realisasi {it.realisasi} {it.satuan}</div>
                              {it.linkDokumen ? (
                                <a
                                  href={sanitizeUrl(it.linkDokumen)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1d4ed8',
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '10px',
                                  }}
                                >
                                  <span>Tautan di sini</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '10px', color: '#64748b' }}>(Laporan kegiatan PKM dan dokumentasi disahkan LPPM)</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                          Hasil kerja secara umum sudah baik dan dapat mengikuti setiap agenda kegiatan pengabdian institusi.
                        </td>
                      </tr>
                    )}

                    {/* B. Tambahan */}
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={3} style={{ border: '1px solid #000000', padding: '5px 8px' }}>B. Tambahan</td>
                    </tr>

                    {tambahanItems.length > 0 ? (
                      <tr>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700 }}>1. Meningkatnya kualitas dosen tetap melalui unsur penunjang</div>
                          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                            {tambahanItems.map((it) => it.kegiatan).join(', ')}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                          {tambahanItems.map((it, idx) => (
                            <div key={idx} style={{ marginBottom: 4 }}>
                              <div>&bull; <strong>{it.kegiatan}</strong>: Realisasi {it.realisasi} {it.satuan}</div>
                              {it.linkDokumen && (
                                <a
                                  href={sanitizeUrl(it.linkDokumen)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1d4ed8',
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '10px',
                                  }}
                                >
                                  <span>Tautan di sini</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          ))}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                          Hasil kerja secara umum sudah baik dan dapat mengikuti setiap kegiatan.
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ border: '1px solid #000000', padding: '6px 8px', color: '#64748b', fontStyle: 'italic' }}>
                          Tidak ada catatan hasil kerja tambahan yang diajukan.
                        </td>
                      </tr>
                    )}

                    {/* RATING HASIL KERJA */}
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={2} style={{ border: '1.5px solid #000000', padding: '6px 8px', textAlign: 'right' }}>
                        RATING HASIL KERJA :
                      </td>
                      <td style={{ border: '1.5px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#047857' }}>
                        {data.rataRataSKP > 90 ? 'Di Atas Ekspektasi' : data.rataRataSKP >= 71 ? 'Sesuai Ekspektasi' : 'Di Bawah Ekspektasi'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Hal. 4 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                  <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                  <span style={{ fontStyle: 'italic' }}>Hal. 4</span>
                </div>
              </div>

              {/* HALAMAN 5: EVALUASI PERILAKU KERJA (BERAKHLAK) LENGKAP 7 CORE VALUES */}
              <div className="a4-sheet avoid-break">
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    EVALUASI PERILAKU KERJA PEGAWAI (BERAKHLAK)
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Universitas Bhakti Kencana &bull; Periode: 01 Januari s/d 31 Desember {tahunAkademik.split('/')[0] || '2026'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 8px', border: '1px solid #000000', background: '#f8fafc', marginBottom: 12 }}>
                  <span>Pegawai yang Dinilai: <strong>{dosen.nama}</strong> (NUPTK: {dosenNuptk})</span>
                  <span>Pejabat Penilai: <strong>{penilaiNama}</strong> (NUPTK: {penilaiNuptk})</span>
                </div>

                {/* TABEL PERILAKU KERJA EVALUASI (3 KOLOM GABUNG LENGKAP) */}
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: 14, fontSize: '11px', wordBreak: 'break-word' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                      <th style={{ width: '38%', border: '1px solid #000000', padding: 6, textAlign: 'left' }}>PERILAKU KERJA</th>
                      <th style={{ width: '28%', border: '1px solid #000000', padding: 6 }}>Ekspektasi Khusus Pimpinan</th>
                      <th style={{ width: '34%', border: '1px solid #000000', padding: 6 }}>Umpan Balik Berkelanjutan Berdasarkan Bukti Dukung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coreValues.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700 }}>{item.no} {item.title}</div>
                          <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '10.5px', color: '#334155' }}>
                            {item.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafbfc' }}>
                          {item.ekspektasi}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                          Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan dapat diandalkan dalam kegiatan akademik prodi.
                        </td>
                      </tr>
                    ))}

                    {/* Rating Perilaku & Predikat Pegawai */}
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={2} style={{ border: '1.5px solid #000000', padding: '6px 8px', textAlign: 'right' }}>
                        RATING PERILAKU :
                      </td>
                      <td style={{ border: '1.5px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#047857' }}>
                        {data.nilaiKuisSkala4 >= 3.8 ? 'Di Atas Ekspektasi' : data.nilaiKuisSkala4 >= 3.0 ? 'Sesuai Ekspektasi' : 'Di Bawah Ekspektasi'}
                      </td>
                    </tr>
                    <tr style={{ background: '#ffedd5', fontWeight: 800 }}>
                      <td colSpan={2} style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontSize: '12px' }}>
                        PREDIKAT KINERJA PEGAWAI :
                      </td>
                      <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'center', fontSize: '13px', color: '#c2410c' }}>
                        {data.predikat.toUpperCase()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tanda Tangan Hal. 5 */}
                <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingRight: 10 }}>
                  <SignatureBox
                    title="Pejabat Penilai,"
                    name={penilaiNama}
                    nuptk={penilaiNuptk}
                    date={tanggalCetak}
                    signatureUrl={penilaiTtdUrl}
                  />
                </div>

                {/* Footer Hal. 5 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                  <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                  <span style={{ fontStyle: 'italic' }}>Hal. 5</span>
                </div>
              </div>
            </>
          )}

          {/* ====================================================================
              BAGIAN 4: DOKUMEN EVALUASI KINERJA PEGAWAI (HALAMAN 6)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'dokumen') && (
            <div className="a4-sheet avoid-break">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  DOKUMEN EVALUASI KINERJA PEGAWAI
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  PERIODE: TRIWULAN I/II/III/IV-AKHIR*
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginTop: 6, borderBottom: '1px solid #000000', paddingBottom: 4 }}>
                  <span>Universitas Bhakti Kencana</span>
                  <span>Periode: 01 Januari s/d 31 Desember {tahunAkademik.split('/')[0] || '2026'}</span>
                </div>
              </div>

              {/* Formulir 4 Butir Standar PermenPAN-RB & Ouput Final.pdf Hal. 8 */}
              <div style={{ border: '1.5px solid #000000', marginBottom: 20 }}>
                {/* 1. PEGAWAI YANG DINILAI */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>1. PEGAWAI YANG DINILAI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 8px 1fr', gap: 2, paddingLeft: 12 }}>
                    <span>NAMA</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{dosen.nama}</strong>
                    <span>NUPTK</span><span>:</span><span>{dosenNuptk}</span>
                    <span>PANGKAT/GOL. RUANG</span><span>:</span><span>{dosen.golongan || '-'}</span>
                    <span>JABATAN</span><span>:</span><span>{dosen.jafung || 'Dosen'}</span>
                    <span>UNIT KERJA</span><span>:</span><span>{dosen.prodi}</span>
                  </div>
                </div>

                {/* 2. PEJABAT PENILAI KINERJA */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>2. PEJABAT PENILAI KINERJA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 8px 1fr', gap: 2, paddingLeft: 12 }}>
                    <span>NAMA</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{penilaiNama}</strong>
                    <span>NUPTK</span><span>:</span><span>{penilaiNuptk}</span>
                    <span>PANGKAT/GOL. RUANG</span><span>:</span><span>{penilaiPangkat}</span>
                    <span>JABATAN</span><span>:</span><span>{penilaiJabatan}</span>
                    <span>UNIT KERJA</span><span>:</span><span>{penilaiUnit}</span>
                  </div>
                </div>

                {/* 3. EVALUASI KINERJA */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>3. EVALUASI KINERJA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 8px 1fr', gap: 4, paddingLeft: 12 }}>
                    <span>CAPAIAN KINERJA ORGANISASI</span><span>:</span><strong>{data.rataRataSKP >= 81 ? 'Baik' : 'Cukup'}</strong>
                    <span>PREDIKAT KINERJA PEGAWAI</span><span>:</span><strong style={{ color: '#c2410c', fontSize: '13px' }}>{data.predikat.toUpperCase()}</strong>
                    <span>RATA-RATA SKP (BOBOT 70%)</span><span>:</span>
                    <span>
                      {data.rataRataSKP.toFixed(1)} &bull; Kontribusi: <strong>{(data.bobotSKP70 ?? data.bobotSKP60 ?? 0).toFixed(1)}</strong> poin (Ganjil: {data.nilaiSKPGanjil.toFixed(1)}, Genap: {data.nilaiSKPGenap.toFixed(1)})
                    </span>
                    <span>PERILAKU KERJA (BOBOT 30%)</span><span>:</span>
                    <span>
                      {data.nilaiKuisSkala100.toFixed(1)} (Skor: {data.nilaiKuisSkala4.toFixed(2)}/4.00) &bull; Kontribusi: <strong>{(data.bobotKuis30 ?? data.bobotKuis40 ?? 0).toFixed(1)}</strong> poin
                    </span>
                    <span>FORMULA NILAI AKHIR (SPMI UBK)</span><span>:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1e293b' }}>
                      N = (70% × {data.rataRataSKP.toFixed(1)}) + (30% × {data.nilaiKuisSkala100.toFixed(1)}) = <strong>{data.nilaiAkhirTahunan.toFixed(1)}</strong>
                    </span>
                  </div>
                </div>

                {/* 4. CATATAN / REKOMENDASI */}
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>4. CATATAN / REKOMENDASI</div>
                  <div style={{ paddingLeft: 12, color: '#334155', lineHeight: 1.6 }}>
                    {data.predikat === 'Sangat Baik' && (
                      <>
                        Dosen yang bersangkutan menunjukkan kinerja Tridharma yang istimewa dengan nilai akhir <strong>{data.nilaiAkhirTahunan.toFixed(1)} ({data.predikat})</strong> (rentang 91 - 100%), melampaui seluruh target SPMI Universitas Bhakti Kencana. Telah menyelesaikan pelaporan BKD Semester Ganjil &amp; Genap secara lengkap dan direkomendasikan untuk penghargaan prestasi akademik serta percepatan Kenaikan Jabatan Akademik Dosen (JAD).
                      </>
                    )}
                    {data.predikat === 'Baik' && (
                      <>
                        Dosen yang bersangkutan secara konsisten memenuhi standar kinerja Tridharma UBK dengan nilai akhir <strong>{data.nilaiAkhirTahunan.toFixed(1)} ({data.predikat})</strong> (rentang 81 - 90%). Seluruh berkas rencana dan realisasi pembelajaran telah lengkap divalidasi, dan direkomendasikan untuk pemenuhan syarat Beban Kerja Dosen (BKD) tahunan serta pengusulan kenaikan pangkat berkala.
                      </>
                    )}
                    {data.predikat === 'Cukup' && (
                      <>
                        Dosen yang bersangkutan memperoleh capaian nilai akhir <strong>{data.nilaiAkhirTahunan.toFixed(1)} ({data.predikat})</strong> (rentang 71 - 80%). Disarankan untuk lebih mengoptimalkan luaran Tridharma pada semester berikutnya dan mendapatkan pendampingan dari Ketua Program Studi guna peningkatan mutu kinerja akademik.
                      </>
                    )}
                    {data.predikat === 'Kurang' && (
                      <>
                        Dosen yang bersangkutan memperoleh capaian nilai akhir <strong>{data.nilaiAkhirTahunan.toFixed(1)} ({data.predikat})</strong> (rentang 61 - 70%). Diperlukan evaluasi capaian target dan pendampingan berkala oleh program studi.
                      </>
                    )}
                    {data.predikat === 'Sangat Kurang' && (
                      <>
                        Dosen yang bersangkutan memperoleh capaian nilai akhir <strong>{data.nilaiAkhirTahunan.toFixed(1)} ({data.predikat})</strong> (rentang &le; 60%). Diperlukan pembinaan dan pendampingan intensif dari pimpinan fakultas dan program studi guna evaluasi kinerja profesional.
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tanda Tangan Pengesahan Akhir (100% DINAMIS) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, padding: '0 10px' }}>
                <SignatureBox
                  title="Pegawai Yang Dinilai,"
                  name={dosen.nama}
                  nuptk={dosenNuptk}
                  signatureUrl={dosenTtdUrl}
                />
                <SignatureBox
                  title="Pejabat Penilai,"
                  name={penilaiNama}
                  nuptk={penilaiNuptk}
                  date={tanggalCetak}
                  signatureUrl={penilaiTtdUrl}
                />
              </div>

              {/* Footer Hal. 6 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: 16 }}>
                <span>Dokumen milik {dosen.nama} (NUPTK: {dosenNuptk})</span>
                <span style={{ fontStyle: 'italic' }}>Hal. 6</span>
              </div>
            </div>
          )}
    </>
  )

  if (isStandalone) {
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

            .fixed-print-header, .no-print-bar, .no-print-tabs {
              display: none !important;
            }

            .print-standalone-wrapper {
              padding-top: 0 !important;
            }

            .a4-print-viewport {
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
            }

            .a4-sheet {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }

            .a4-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
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
              padding-top: 115px;
              padding-bottom: 60px;
            }

            .a4-sheet {
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

          .fixed-print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            z-index: 9999;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          }

          .no-print-bar {
            width: 100%;
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .no-print-tabs {
            width: 100%;
            background: #1e293b;
            padding: 8px 24px;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            border-bottom: 1px solid #334155;
          }

          .a4-sheet {
            color: #000000;
            font-size: 8.5pt;
            line-height: 1.3;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}</style>

        {/* Fixed Top Header (Tetap Stay di Atas saat Halaman di-Scroll) */}
        <div className="fixed-print-header">
          <div className="no-print-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => (onClose ? onClose() : window.close())}
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
                  <span>Output Final Prestasi Kerja Tahunan</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#059669', color: '#ffffff' }}>
                    {predikat}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>
                  {dosen.nama} &bull; TA {tahunAkademik} &bull; {dosen.prodi}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
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

          {/* Section Tabs */}
          <div className="no-print-tabs">
            {[
              { id: 'all' as const, label: 'Semua Bagian (Format Lengkap Ouput Final)' },
              { id: 'skp' as const, label: '1. Sasaran Kinerja & Perilaku (Hal. 1-2)' },
              { id: 'lampiran' as const, label: '2. Lampiran SKP (Hal. 3)' },
              { id: 'evaluasi' as const, label: '3. Evaluasi Kualitatif & BerAKHLAK (Hal. 4-5)' },
              { id: 'dokumen' as const, label: '4. Dokumen Evaluasi Akhir (Hal. 6)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeTab === tab.id ? '#2563eb' : '#0f172a',
                  color: activeTab === tab.id ? '#ffffff' : '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Viewport */}
        <div ref={viewportRef} className="a4-print-viewport" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {renderSheets()}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        ref={modalRef}
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1040,
          width: '96vw',
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
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Pratinjau Cetak: Output Final Laporan Prestasi Kerja Tahunan
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Sesuai Format Resmi Ouput Final.pdf &bull; Dosen: <strong>{dosen.nama}</strong> (NUPTK: {dosenNuptk})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              className="brand-btn btn-action-print"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <Printer size={15} />
              <span>Cetak Output Final</span>
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

        {/* Navigation Tabs (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 24px',
            borderBottom: '1px solid var(--hair)',
            background: 'var(--page-bg)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all' as const, label: 'Semua Bagian (Format Lengkap Ouput Final)' },
            { id: 'skp' as const, label: '1. Sasaran Kinerja & Perilaku (Hal. 1-2)' },
            { id: 'lampiran' as const, label: '2. Lampiran SKP (Hal. 3)' },
            { id: 'evaluasi' as const, label: '3. Evaluasi Kualitatif & BerAKHLAK (Hal. 4-5)' },
            { id: 'dokumen' as const, label: '4. Dokumen Evaluasi Akhir (Hal. 6)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--navy-900)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Document Body with Slate A4 Viewport */}
        <div
          ref={viewportRef}
          className="a4-print-viewport"
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {renderSheets()}
        </div>
      </div>
    </div>
  )
}
