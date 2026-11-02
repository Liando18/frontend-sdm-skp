import { IndikatorKuesioner, PenilaianKuesioner } from '../types'

export type BerakhlakKey =
  | 'nilaiPelayanan'
  | 'nilaiAkuntabel'
  | 'nilaiKompeten'
  | 'nilaiHarmonis'
  | 'nilaiLoyal'
  | 'nilaiAdaptif'
  | 'nilaiKolaboratif'

export interface BerakhlakDimension {
  key: BerakhlakKey
  legacyKey: string
  no: number
  label: string
  title: string
  sub: string
  aspek: string
  count: number
}

const CORE_DEFINITIONS: {
  key: BerakhlakKey
  legacyKey: string
  keyword: string
  defaultAspek: string
  defaultSub: string
}[] = [
  {
    key: 'nilaiPelayanan',
    legacyKey: 'berorientasiPelayanan',
    keyword: 'pelayanan',
    defaultAspek: 'Orientasi Pelayanan',
    defaultSub: 'Sikap ramah, solutif, menghargai mahasiswa dan sivitas akademika, serta mematuhi standar pelayanan akademik.',
  },
  {
    key: 'nilaiAkuntabel',
    legacyKey: 'akuntabel',
    keyword: 'akuntabel',
    defaultAspek: 'Akuntabel',
    defaultSub: 'Melaksanakan tugas dengan jujur, disiplin, berintegritas tinggi, dan tidak menyalahgunakan wewenang.',
  },
  {
    key: 'nilaiKompeten',
    legacyKey: 'kompeten',
    keyword: 'kompeten',
    defaultAspek: 'Kompeten',
    defaultSub: 'Meningkatkan kompetensi keilmuan secara berkelanjutan dan melaksanakan tugas tridharma dengan kualitas terbaik.',
  },
  {
    key: 'nilaiHarmonis',
    legacyKey: 'harmonis',
    keyword: 'harmonis',
    defaultAspek: 'Harmonis',
    defaultSub: 'Membangun lingkungan kerja perkuliahan dan prodi yang kondusif, toleran, dan saling tolong-menolong.',
  },
  {
    key: 'nilaiLoyal',
    legacyKey: 'loyal',
    keyword: 'loyal',
    defaultAspek: 'Loyal',
    defaultSub: 'Memegang teguh visi misi Universitas Bhakti Kencana, menjaga martabat institusi, dan berdedikasi tinggi.',
  },
  {
    key: 'nilaiAdaptif',
    legacyKey: 'adaptif',
    keyword: 'adaptif',
    defaultAspek: 'Adaptif',
    defaultSub: 'Cepat beradaptasi terhadap inovasi kurikulum, kurikulum MBKM, sistem LMS, dan teknologi Siakad UBK.',
  },
  {
    key: 'nilaiKolaboratif',
    legacyKey: 'kolaboratif',
    keyword: 'kolaboratif',
    defaultAspek: 'Kolaboratif',
    defaultSub: 'Mendorong kerja sama Tridharma antardisiplin, riset bersama, dan pengabdian masyarakat lintas bidang.',
  },
]

/**
 * Mendapatkan dimensi BerAKHLAK secara dinamis dari daftar IndikatorKuesioner backend.
 * Menggunakan data aspek dan indikator utama dari database.
 */
export function getBerakhlakDimensions(
  indikatorList?: IndikatorKuesioner[]
): BerakhlakDimension[] {
  const list = Array.isArray(indikatorList) ? indikatorList : []

  return CORE_DEFINITIONS.map((def, idx) => {
    const no = idx + 1
    const matchingIndicators = list.filter((ind) => {
      const asp = (ind.aspek || '').toLowerCase()
      return asp.includes(def.keyword) || def.keyword.includes(asp)
    })

    const primaryIndikator = matchingIndicators[0]
    const aspekName = primaryIndikator?.aspek || def.defaultAspek
    const subText =
      primaryIndikator?.indikatorUtama ||
      primaryIndikator?.criticalPoint ||
      def.defaultSub

    return {
      key: def.key,
      legacyKey: def.legacyKey,
      no,
      label: `${no}. ${aspekName}`,
      title: aspekName,
      sub: subText,
      aspek: aspekName,
      count: matchingIndicators.length,
    }
  })
}

/**
 * Mengambil nilai skor numerik dari objek PenilaianKuesioner dengan aman
 */
export function extractDimensionScore(
  penilaian: Partial<PenilaianKuesioner> | null | undefined,
  key: string
): number {
  if (!penilaian) return 0
  const p = penilaian as any

  switch (key) {
    case 'nilaiPelayanan':
    case 'berorientasiPelayanan':
    case 'pelayanan':
      return Number(p.nilaiPelayanan ?? p.berorientasiPelayanan ?? p.pelayanan ?? 0)
    case 'nilaiAkuntabel':
    case 'akuntabel':
      return Number(p.nilaiAkuntabel ?? p.akuntabel ?? 0)
    case 'nilaiKompeten':
    case 'kompeten':
      return Number(p.nilaiKompeten ?? p.kompeten ?? 0)
    case 'nilaiHarmonis':
    case 'harmonis':
      return Number(p.nilaiHarmonis ?? p.harmonis ?? 0)
    case 'nilaiLoyal':
    case 'loyal':
      return Number(p.nilaiLoyal ?? p.loyal ?? 0)
    case 'nilaiAdaptif':
    case 'adaptif':
      return Number(p.nilaiAdaptif ?? p.adaptif ?? 0)
    case 'nilaiKolaboratif':
    case 'kolaboratif':
      return Number(p.nilaiKolaboratif ?? p.kolaboratif ?? 0)
    default:
      return Number(p[key] || 0)
  }
}

/**
 * Menghitung kualifikasi ekspektasi berdasarkan skor skala 1 sampai 4
 */
export function getEkspektasiKualifikasi(score: number): string {
  if (score >= 3.8) return 'Di Atas Ekspektasi'
  if (score >= 3.0) return 'Sesuai Ekspektasi'
  return 'Di Bawah Ekspektasi'
}
