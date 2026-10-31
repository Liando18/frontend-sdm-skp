export type Role = 'sdm' | 'dosen' | 'kaprodi' | 'dekan'

export interface UserSession {
  id: string
  name: string
  nip: string
  nuptk?: string
  email: string
  role: Role
  prodi: string
  avatar: string
  rank: string
  fakultas?: string
  fakultasId?: string
  psdkuId?: string
  kampus?: string
  tipeLokasi?: 'Pusat' | 'PSDKU'
  programStudiId?: string
  signatureUrl?: string
  jabatanStruktural?: string
  jabatan_struktural?: string
  jabatanKampusId?: string
}

export interface Dosen {
  id: string
  nip: string
  nuptk?: string
  nama: string
  tipeLokasi?: 'Pusat' | 'PSDKU'
  tipe_lokasi?: 'Pusat' | 'PSDKU'
  fakultasId?: string | null
  fakultas_id?: string | null
  psdkuId?: string | null
  psdku_id?: string | null
  programStudiId?: string | null
  program_studi_id?: string | null
  fakultas?: string
  kampus?: string
  prodi: string
  jafung: string
  golongan: string
  pendidikanS1?: string
  pendidikanS2?: string
  pendidikanS3?: string
  pendidikanProfesi?: string
  pendidikan: string
  status: 'Tetap Yayasan' | 'PNS DPK' | 'Dosen Khusus'
  skpStatus: 'Draft' | 'Diajukan' | 'Dinilai Kaprodi' | 'Dinilai Dekan' | 'Disetujui SDM' | 'Disahkan' | 'Terbit' | 'Perlu Revisi'
  nilaiAkhir: number
  email: string
  phone: string
  isKaprodi?: boolean
  isDekan?: boolean
  signatureUrl?: string
  jabatanStruktural?: string
  jabatan_struktural?: string
  jabatanKampusId?: string
}

export interface Fakultas {
  id: string
  kode?: string
  nama: string
  dekan_id?: string
  dekan_nama?: string
  dekan_nip?: string
}

export interface Psdku {
  id: string
  kode?: string
  nama: string
  lokasi?: string
  kecab_id?: string
  kecab_nama?: string
  kecab_nip?: string
}

export interface JabatanKampus {
  id: string
  kode: string
  nama: string
  kategori: string
  level: number
  is_struktural: boolean
  role_akses?: Role
  default_role?: Role
  deskripsi?: string
}

export interface DriveLinkCheckResult {
  status: 'public' | 'restricted' | 'not_found' | 'external_link' | 'warning' | 'invalid_url'
  message: string
  is_google_drive?: boolean
  type?: string
  resource_id?: string
}

export type TargetJabatanSKP = string

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
  dosenNuptk?: string
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
  status: 'Draft' | 'Diajukan' | 'Dinilai Kaprodi' | 'Dinilai Dekan' | 'Disetujui SDM' | 'Disahkan' | 'Terbit' | 'Perlu Revisi'
  tanggalPengajuan: string
  catatanKaprodi: string
  catatanDekan?: string
  catatanSDM?: string
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
  nama: string // pure prodi name, e.g. "Informatika Kesehatan"
  jenjang: string // "S1", "D3", "Profesi"
  tipe_unit?: 'Pusat' | 'PSDKU'
  tipeUnit?: 'Pusat' | 'PSDKU'
  fakultas_id?: string
  fakultasId?: string
  psdku_id?: string
  psdkuId?: string
  fakultas?: string
  psdku_nama?: string
  kampus?: string
  kaprodiNama?: string
  kaprodiNip?: string
  kaprodiId?: string
  akreditasi?: string
  isActive?: boolean
  nama_lengkap?: string
  namaLengkap?: string
}
