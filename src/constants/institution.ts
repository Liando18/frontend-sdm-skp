/**
 * Single Source of Truth (SSOT) Identitas Resmi Institusi UBK
 * Sesuai DESAIN.md Bab 15.1
 */

export interface InstitutionProfile {
  readonly yayasan: string
  readonly universitas: string
  readonly sebutanKampus: string
  readonly alamat: string
  readonly kota: string
  readonly provinsi: string
  readonly kodePos: string
  readonly telepon: string
  readonly email: string
  readonly website: string
  readonly logoPath: string
  readonly userFallbackPath: string
}

export const INSTITUTION: InstitutionProfile = {
  yayasan: 'YAYASAN BHAKTI KENCANA',
  universitas: 'UNIVERSITAS BHAKTI KENCANA',
  sebutanKampus: 'Universitas Bhakti Kencana Bandung',
  alamat: 'Jl. Soekarno-Hatta No. 754 Cibiru',
  kota: 'Kota Bandung',
  provinsi: 'Jawa Barat',
  kodePos: '40614',
  telepon: '(022) 7830768',
  email: 'info@bku.ac.id',
  website: 'https://bku.ac.id',
  logoPath: '/logo.svg',
  userFallbackPath: '/user.svg',
} as const

export const ALAMAT_LENGKAP_INSTITUSI = `${INSTITUTION.alamat}, ${INSTITUTION.kota}, ${INSTITUTION.provinsi} ${INSTITUTION.kodePos}`
export const KONTAK_RESMI_INSTITUSI = `Telp: ${INSTITUTION.telepon} | Email: ${INSTITUTION.email} | Web: ${INSTITUTION.website}`
