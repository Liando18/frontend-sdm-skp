import { UserSession } from '../types'

/**
 * Akun Pengguna Demo Login Cepat
 * Sesuai DESAIN.md Bab 15.1 - Tersinkronisasi dengan Database Backend Seeder
 */

export const DEMO_USERS: Record<string, UserSession> = {
  sdm: {
    id: 'dosen-sdm-1',
    name: 'Asep Rohimat, S.Kom., M.T.',
    nip: '198104152011011002',
    email: 'sdm@bku.ac.id',
    role: 'sdm',
    prodi: 'Direktorat Sumber Daya Manusia',
    avatar: '/user.svg',
    rank: 'Kepala Bagian SDM',
  },
  dosen: {
    id: 'dosen-3',
    name: "Agus Mi'raj Darajat, S.Kep, Ners., M.Kes",
    nip: '0417087503',
    email: 'agus.miraj@bku.ac.id',
    role: 'dosen',
    prodi: 'S1 Keperawatan',
    avatar: '/user.svg',
    rank: 'Lektor',
  },
  kaprodi: {
    id: 'dosen-2',
    name: 'Ns. Ade Iwan Mutiudin, S.Kep., M.Kep',
    nip: '0424099302',
    email: 'iwan.mutiudin@bku.ac.id',
    role: 'kaprodi',
    prodi: 'S1 Keperawatan',
    avatar: '/user.svg',
    rank: 'Ketua Program Studi (Kaprodi)',
  },
  dekan: {
    id: 'dosen-49',
    name: 'Dr. apt. Agus Sulaeman, M.Si',
    nip: '404106802',
    email: 'agus.sulaiman@bku.ac.id',
    role: 'dekan',
    prodi: 'Profesi Apoteker',
    avatar: '/user.svg',
    rank: 'Dekan Fakultas',
    fakultas: 'Fakultas Farmasi',
  },
}
