import { Role } from '../types'

export interface RouteConfig {
  path: string
  navId: string
  title: string
  allowedRoles?: Role[]
  legacyPaths?: string[]
}

export const ROUTES: RouteConfig[] = [
  // Core & Auth
  { path: '/login', navId: 'login', title: 'Login Portal SDM' },
  { path: '/dashboard', navId: 'dashboard', title: 'Beranda' },

  // Akun & Bantuan
  { path: '/akun/profil', navId: 'profil', title: 'Profil Pegawai', legacyPaths: ['/profil'] },
  { path: '/akun/keamanan', navId: 'keamanan', title: 'Keamanan Akun', legacyPaths: ['/keamanan'] },
  { path: '/bantuan/panduan', navId: 'panduan', title: 'Buku Panduan & SPMI', legacyPaths: ['/panduan'] },

  // Kinerja Pegawai (Dosen / Kaprodi / Dekan / SDM)
  { path: '/kinerja/skp-saya', navId: 'skp-self', title: 'Sasaran Kinerja Pegawai (SKP)', legacyPaths: ['/skp-saya'] },
  { path: '/kinerja/evaluasi-tahunan', navId: 'hasil-kinerja', title: 'Hasil Kinerja Tahunan', legacyPaths: ['/kinerja-tahunan'] },

  // Verifikasi Kinerja
  { path: '/verifikasi/skp', navId: 'review-skp', title: 'Verifikasi & Pengesahan SKP', allowedRoles: ['kaprodi', 'dekan'], legacyPaths: ['/review-skp', '/review-skp-kaprodi'] },
  { path: '/verifikasi/perilaku', navId: 'kuesioner-review', title: 'Evaluasi Perilaku BerAKHLAK', allowedRoles: ['kaprodi', 'dekan'], legacyPaths: ['/evaluasi-kinerja', '/evaluasi-kaprodi'] },

  // Manajemen & Monitoring (Direktorat SDM)
  { path: '/manajemen/dosen', navId: 'data-dosen', title: 'Data Kepegawaian Dosen', allowedRoles: ['sdm'], legacyPaths: ['/data-dosen'] },
  { path: '/manajemen/monitoring-skp', navId: 'skp-dosen', title: 'Monitoring & Verifikasi SKP', allowedRoles: ['sdm'], legacyPaths: ['/monitoring-skp'] },
  { path: '/manajemen/monitoring-kinerja', navId: 'penilaian-kuesioner', title: 'Monitoring Kinerja Tahunan', allowedRoles: ['sdm'], legacyPaths: ['/monitoring-kinerja'] },
  { path: '/manajemen/komponen-skp', navId: 'komponen-skp', title: 'Master Komponen SKP', allowedRoles: ['sdm'], legacyPaths: ['/komponen-skp'] },
  { path: '/manajemen/indikator', navId: 'indikator-kuesioner', title: 'Master Indikator Kinerja', allowedRoles: ['sdm'], legacyPaths: ['/indikator-kinerja'] },
  { path: '/manajemen/laporan', navId: 'laporan', title: 'Laporan & Rekapitulasi', allowedRoles: ['sdm'], legacyPaths: ['/laporan'] },

  // Cetak Dokumen Resmi
  { path: '/cetak/skp', navId: 'cetak-skp', title: 'Cetak Formulir SKP Resmi', legacyPaths: ['/cetak-skp'] },
  { path: '/cetak/output-final', navId: 'cetak-output-final', title: 'Cetak Output Final Tahunan', legacyPaths: ['/cetak-output-final'] },
  { path: '/cetak/transkrip', navId: 'cetak-transkrip', title: 'Cetak Transkrip Evaluasi BerAKHLAK', legacyPaths: ['/cetak-transkrip'] },
  { path: '/cetak/panduan', navId: 'cetak-panduan', title: 'Cetak Buku Panduan & SOP Resmi', legacyPaths: ['/cetak-panduan'] },
]

/**
 * Peta alias rute lama ke URL hierarkis baru untuk seamless redirection.
 */
export const ROUTE_ALIASES: Record<string, string> = {
  '/profil': '/akun/profil',
  '/keamanan': '/akun/keamanan',
  '/panduan': '/bantuan/panduan',
  '/skp-saya': '/kinerja/skp-saya',
  '/kinerja-tahunan': '/kinerja/evaluasi-tahunan',
  '/data-dosen': '/manajemen/dosen',
  '/monitoring-skp': '/manajemen/monitoring-skp',
  '/monitoring-kinerja': '/manajemen/monitoring-kinerja',
  '/komponen-skp': '/manajemen/komponen-skp',
  '/indikator-kinerja': '/manajemen/indikator',
  '/laporan': '/manajemen/laporan',
  '/cetak-skp': '/cetak/skp',
  '/cetak-output-final': '/cetak/output-final',
  '/cetak-transkrip': '/cetak/transkrip',
  '/cetak-panduan': '/cetak/panduan',
  '/review-skp': '/verifikasi/skp',
  '/review-skp-kaprodi': '/verifikasi/skp',
  '/evaluasi-kinerja': '/verifikasi/perilaku',
  '/evaluasi-kaprodi': '/verifikasi/perilaku',
}

export function getNavIdFromPath(pathname: string, role: Role): string {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'

  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/dashboard') return 'dashboard'
  if (cleanPath === '/login') return 'login'
  if (cleanPath === '/akun/profil' || cleanPath === '/profil') return 'profil'
  if (cleanPath === '/akun/keamanan' || cleanPath === '/keamanan') return 'keamanan'
  if (cleanPath === '/bantuan/panduan' || cleanPath === '/panduan') return 'panduan'

  // Cetak Dokumen (mendukung path dengan token di belakang: /cetak/skp/:token atau /cetak-skp)
  if (cleanPath.startsWith('/cetak/skp') || cleanPath.startsWith('/cetak-skp')) return 'cetak-skp'
  if (cleanPath.startsWith('/cetak/output-final') || cleanPath.startsWith('/cetak-output-final')) return 'cetak-output-final'
  if (cleanPath.startsWith('/cetak/transkrip') || cleanPath.startsWith('/cetak-transkrip')) return 'cetak-transkrip'
  if (cleanPath.startsWith('/cetak/panduan') || cleanPath.startsWith('/cetak-panduan')) return 'cetak-panduan'

  // Kinerja Saya (SKP)
  if (cleanPath === '/kinerja/skp-saya' || cleanPath === '/skp-saya') {
    switch (role) {
      case 'dosen':
        return 'skp-dosen-self'
      case 'kaprodi':
        return 'skp-kaprodi-self'
      case 'dekan':
        return 'skp-dekan-self'
      default:
        return 'skp-sdm-self'
    }
  }

  // Hasil Kinerja Tahunan
  if (cleanPath === '/kinerja/evaluasi-tahunan' || cleanPath === '/kinerja-tahunan') {
    switch (role) {
      case 'dosen':
        return 'hasil-kinerja-dosen'
      case 'kaprodi':
        return 'hasil-kinerja-kaprodi'
      case 'dekan':
        return 'hasil-kinerja-dekan'
      default:
        return 'hasil-kinerja-sdm'
    }
  }

  // Verifikasi Kinerja
  if (cleanPath === '/verifikasi/skp' || cleanPath === '/review-skp' || cleanPath === '/review-skp-kaprodi') {
    return role === 'dekan' ? 'review-skp-dekan' : 'review-skp-kaprodi'
  }
  if (cleanPath === '/verifikasi/perilaku' || cleanPath === '/evaluasi-kinerja' || cleanPath === '/evaluasi-kaprodi') {
    return role === 'dekan' ? 'kuesioner-dekan' : 'kuesioner-kaprodi'
  }

  // Manajemen SDM
  if (cleanPath === '/manajemen/dosen' || cleanPath === '/data-dosen') return 'data-dosen'
  if (cleanPath === '/manajemen/monitoring-skp' || cleanPath === '/monitoring-skp') return 'skp-dosen'
  if (cleanPath === '/manajemen/monitoring-kinerja' || cleanPath === '/monitoring-kinerja') return 'penilaian-kuesioner'
  if (cleanPath === '/manajemen/komponen-skp' || cleanPath === '/komponen-skp') return 'komponen-skp'
  if (cleanPath === '/manajemen/indikator' || cleanPath === '/indikator-kinerja') return 'indikator-kuesioner'
  if (cleanPath === '/manajemen/laporan' || cleanPath === '/laporan') return 'laporan'

  // Match standard routes
  const match = ROUTES.find((r) => r.path === cleanPath || r.legacyPaths?.includes(cleanPath))
  if (match) return match.navId

  return 'dashboard'
}

export function getPathFromNavId(navId: string, role?: Role): string {
  if (navId === 'dashboard') return '/dashboard'
  if (navId === 'profil') return '/akun/profil'
  if (navId === 'keamanan') return '/akun/keamanan'
  if (navId === 'panduan') return '/bantuan/panduan'
  if (navId === 'cetak-panduan') return '/cetak/panduan'
  if (navId === 'cetak-skp') return '/cetak/skp'
  if (navId === 'cetak-output-final') return '/cetak/output-final'
  if (navId === 'cetak-transkrip') return '/cetak/transkrip'

  // SKP Self
  if (navId.startsWith('skp-') && navId.endsWith('-self')) return '/kinerja/skp-saya'

  // Hasil Kinerja Tahunan
  if (navId.startsWith('hasil-kinerja')) return '/kinerja/evaluasi-tahunan'

  // Verifikasi
  if (navId === 'review-skp-kaprodi' || navId === 'review-skp-dekan' || navId === 'review-skp') return '/verifikasi/skp'
  if (navId === 'kuesioner-kaprodi' || navId === 'kuesioner-dekan' || navId === 'kuesioner-review') return '/verifikasi/perilaku'

  // Manajemen
  if (navId === 'data-dosen') return '/manajemen/dosen'
  if (navId === 'skp-dosen') return '/manajemen/monitoring-skp'
  if (navId === 'penilaian-kuesioner') return '/manajemen/monitoring-kinerja'
  if (navId === 'komponen-skp') return '/manajemen/komponen-skp'
  if (navId === 'indikator-kuesioner') return '/manajemen/indikator'
  if (navId === 'laporan') return '/manajemen/laporan'

  const match = ROUTES.find((r) => r.navId === navId)
  if (match) return match.path
  return `/${navId.replace(/_/g, '-')}`
}
