import { Role } from '../types'

export interface RouteConfig {
  path: string
  navId: string
  title: string
  allowedRoles?: Role[]
}

export const ROUTES: RouteConfig[] = [
  { path: '/login', navId: 'login', title: 'Login Portal SDM' },
  { path: '/dashboard', navId: 'dashboard', title: 'Beranda' },
  { path: '/profil', navId: 'profil', title: 'Profil Pegawai' },
  { path: '/keamanan', navId: 'keamanan', title: 'Keamanan Akun' },
  { path: '/skp-saya', navId: 'skp-self', title: 'Sasaran Kinerja Pegawai (SKP)' },
  { path: '/kinerja-tahunan', navId: 'hasil-kinerja', title: 'Hasil Kinerja Tahunan' },
  { path: '/cetak-skp', navId: 'cetak-skp', title: 'Cetak Formulir SKP Resmi' },
  { path: '/cetak-output-final', navId: 'cetak-output-final', title: 'Cetak Output Final Tahunan' },
  { path: '/cetak-transkrip', navId: 'cetak-transkrip', title: 'Cetak Transkrip Evaluasi BerAKHLAK' },
  // SDM
  { path: '/monitoring-skp', navId: 'skp-dosen', title: 'Monitoring & Verifikasi SKP', allowedRoles: ['sdm'] },
  { path: '/monitoring-kinerja', navId: 'penilaian-kuesioner', title: 'Monitoring Kinerja Tahunan', allowedRoles: ['sdm'] },
  { path: '/data-dosen', navId: 'data-dosen', title: 'Data Kepegawaian Dosen', allowedRoles: ['sdm'] },
  { path: '/komponen-skp', navId: 'komponen-skp', title: 'Master Komponen SKP', allowedRoles: ['sdm'] },
  { path: '/indikator-kinerja', navId: 'indikator-kuesioner', title: 'Master Indikator Kinerja', allowedRoles: ['sdm'] },
  { path: '/laporan', navId: 'laporan', title: 'Laporan & Rekapitulasi', allowedRoles: ['sdm'] },
  // Kaprodi
  { path: '/review-skp', navId: 'review-skp-kaprodi', title: 'Verifikasi SKP Dosen', allowedRoles: ['kaprodi'] },
  { path: '/evaluasi-kinerja', navId: 'kuesioner-kaprodi', title: 'Evaluasi Kinerja Dosen', allowedRoles: ['kaprodi'] },
  // Dekan
  { path: '/review-skp-kaprodi', navId: 'review-skp-dekan', title: 'Verifikasi SKP Ketua Prodi', allowedRoles: ['dekan'] },
  { path: '/evaluasi-kaprodi', navId: 'kuesioner-dekan', title: 'Evaluasi Kinerja Ketua Prodi', allowedRoles: ['dekan'] },
]

export function getNavIdFromPath(pathname: string, role: Role): string {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'
  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/dashboard') return 'dashboard'
  if (cleanPath === '/login') return 'login'
  if (cleanPath === '/profil') return 'profil'
  if (cleanPath === '/keamanan') return 'keamanan'
  if (cleanPath === '/cetak-skp') return 'cetak-skp'
  if (cleanPath === '/cetak-output-final') return 'cetak-output-final'
  if (cleanPath === '/cetak-transkrip') return 'cetak-transkrip'

  if (cleanPath === '/skp-saya') {
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

  if (cleanPath === '/kinerja-tahunan') {
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

  const match = ROUTES.find((r) => r.path === cleanPath)
  if (match) return match.navId
  return 'dashboard'
}

export function getPathFromNavId(navId: string): string {
  if (navId === 'dashboard') return '/dashboard'
  if (navId === 'profil') return '/profil'
  if (navId === 'keamanan') return '/keamanan'
  if (navId.startsWith('skp-') && navId.endsWith('-self')) return '/skp-saya'
  if (navId.startsWith('hasil-kinerja')) return '/kinerja-tahunan'

  const match = ROUTES.find((r) => r.navId === navId)
  if (match) return match.path
  return `/${navId.replace(/_/g, '-')}`
}
