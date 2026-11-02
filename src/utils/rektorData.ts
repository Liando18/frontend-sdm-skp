import { api } from '../services/api'

export interface RektorData {
  id?: string | null
  nama: string
  nuptk: string
  nip?: string
  pangkat: string
  jabatan: string
  unit: string
  signatureUrl?: string
}

const STORAGE_KEY = 'ubk_official_rektor'

/**
 * Mengambil snapshot data Rektor yang telah tersimpan di cache lokal.
 * Mengembalikan null jika belum ada cache agar antarmuka menunggu data dinamis dari database.
 */
export function getCachedOfficialRektor(): RektorData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RektorData
      if (parsed?.nama && parsed.nama !== '-' && parsed.nama.trim().length > 1) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Gagal membaca cache data Rektor:', err)
  }
  return null
}

/**
 * Kompatibilitas mundur untuk inisialisasi awal sinkron
 */
export function getInitialRektorData(): RektorData | null {
  return getCachedOfficialRektor()
}

/**
 * Menyimpan data Rektor yang valid dari database ke cache lokal
 */
export function cacheOfficialRektor(data: RektorData): void {
  try {
    if (data?.nama && data.nama !== '-') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch (err) {
    console.warn('Gagal menyimpan cache data Rektor:', err)
  }
}

/**
 * Mengambil data Rektor secara 100% dinamis dari database backend:
 * Endpoint: /api/reference/rektor (mengambil dosen definitif berjabatan Rektor di tabel dosens)
 * Jika terjadi pergantian Rektor di database, fungsi ini akan otomatis mengembalikan pejabat baru.
 */
export async function fetchOfficialRektor(): Promise<RektorData | null> {
  try {
    const data = await api.reference.getRektor()
    if (data?.nama && data.nama !== '-') {
      cacheOfficialRektor(data)
      return data
    }
  } catch (err) {
    console.warn('Gagal memuat data dinamis Rektor dari database:', err)
  }

  // Fallback ke cache database sebelumnya bila jaringan lambat/offline
  return getCachedOfficialRektor()
}
