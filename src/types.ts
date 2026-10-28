export type Role = 'sdm' | 'dosen' | 'kaprodi' | 'dekan'

export interface UserSession {
  id: string
  name: string
  nip: string
  email: string
  role: Role
  prodi: string
  avatar: string
  rank: string
  fakultas?: string
  signatureUrl?: string
}

export interface Dosen {
  id: string
  nip: string
  nuptk?: string
  nama: string
  prodi: string
  jafung: string
  golongan: string
  pendidikanS1?: string
  pendidikanS2?: string
  pendidikanS3?: string
  pendidikanProfesi?: string
  pendidikan: string
  status: 'Tetap Yayasan' | 'PNS DPK' | 'Dosen Khusus'
  skpStatus: 'Draft' | 'Diajukan' | 'Dinilai Kaprodi' | 'Dinilai Dekan' | 'Disetujui SDM' | 'Perlu Revisi'
  nilaiAkhir: number
  email: string
  phone: string
  isKaprodi?: boolean
  isDekan?: boolean
  signatureUrl?: string
}

export type TargetJabatanSKP =
  | 'Semua Jabatan'
  | 'Rektor'
  | 'Wakil Rektor'
  | 'Dekan'
  | 'Wakil Dekan'
  | 'Ketua Program Studi'
  | 'Dosen Tetap'
  | 'Tenaga Kependidikan / Staf'

export type KategoriKomponenSKP =
  | 'Pendidikan'
  | 'Penelitian'
  | 'Pengabdian'
  | 'Penunjang'
  | 'Tugas Tambahan'
  | 'Layanan Akademik'
  | 'Administrasi & Tata Usaha'
  | 'Tata Kelola & Keuangan'

export interface KomponenSKP {
  id: string
  kode: string
  kategori: KategoriKomponenSKP
  targetJabatan: TargetJabatanSKP
  namaKegiatan: string
  targetOutput: string
  satuan: string
  waktuNilai: number // e.g. 6 or 12 or 1
  waktuSatuan: 'bulan' | 'tahun'
}

export interface SKPItem {
  id: string
  komponenId: string
  kode?: string
  kegiatan: string
  kategori?: KategoriKomponenSKP
  rencanaAwal: number
  perubahanTengah: number
  realisasi: number
  satuan: string
  kualitasMutu: number // Kual/Mutu (%)
  waktuNilai: number // Angka waktu e.g. 6 or 12 or 1
  waktuSatuan: string // e.g. 'bln' or 'thn' or 'bulan' or 'tahun'
  linkDokumen: string
  nilaiCapaian?: number
}

export interface PengajuanSKP {
  id: string
  dosenId: string
  dosenNama: string
  dosenNip: string
  dosenProdi: string
  dosenPangkat: string
  dosenJabatan: string
  penilaiNama: string
  penilaiNip: string
  penilaiPangkat?: string
  penilaiJabatan: string
  penilaiUnit?: string
  penilaiRole?: 'Kaprodi' | 'Dekan' | 'SDM'
  semester: 'Ganjil' | 'Genap'
  tahunAkademik: string
  totalSksRencana: number
  totalSksRealisasi: number
  persentaseCapaian: number
  nilaiKinerjaSKP: number
  status: 'Draft' | 'Diajukan' | 'Dinilai Kaprodi' | 'Dinilai Dekan' | 'Disetujui SDM' | 'Perlu Revisi'
  tanggalPengajuan: string
  catatanKaprodi: string
  catatanDekan?: string
  catatanSDM: string
  ttdKaprodiUrl?: string
  ttdDekanUrl?: string
  ttdDosenUrl?: string
  tanggalPenilaianKaprodi?: string
  tanggalPenilaianDekan?: string
  items: SKPItem[]
}

export interface IndikatorKuesioner {
  id: string
  kode: string
  aspek: string
  kategoriTridharma?: string
  homebaseProdi?: string
  indikatorUtama: string
  indikatorPendukung: string[]
  indikatorDua?: string
  indikatorTiga?: string
  criticalPoint: string
  skalaKeterangan: string
}

export interface PenilaianKuesioner {
  id: string
  dosenId: string
  dosenNama: string
  dosenProdi: string
  penilaiNama: string
  penilaiRole: 'Kaprodi' | 'SDM' | 'Dekan' | 'Teman Sejawat' | 'Mahasiswa'
  targetRole?: 'Dosen' | 'Kaprodi' | 'Dekan' | 'Staf' | 'SDM'
  periode: 'Tahunan'
  tahun: string
  nilaiPelayanan: number
  nilaiAkuntabel: number
  nilaiKompeten: number
  nilaiHarmonis: number
  nilaiLoyal: number
  nilaiAdaptif: number
  nilaiKolaboratif: number
  rataRata: number
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang'
  tanggal: string
  catatan: string
}

export interface NotificationItem {
  id: string
  title: string
  message?: string
  desc?: string
  time: string
  read: boolean
  type?: 'info' | 'warning' | 'success'
  tag?: string
}

export interface ProgramStudi {
  id: string
  kode?: string
  nama: string
  jenjang: string
  fakultas: string
  kampus: string
  kaprodiNama?: string
  kaprodiNip?: string
  kaprodiId?: string
  akreditasi: string
  isActive?: boolean
}
