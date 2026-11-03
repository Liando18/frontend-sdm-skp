import { useState, useEffect } from 'react'

/**
 * Single Source of Truth (SSOT) Parameter & Konfigurasi Akademik UBK
 * Sesuai DESAIN.md Bab 15.1
 * 100% Dinamis mengikuti kalender perangkat saat ini (bebas static hardcode).
 */

export const SEMESTER_OPTIONS = ['Ganjil', 'Genap'] as const
export type SemesterOption = typeof SEMESTER_OPTIONS[number]

export const TRIDHARMA_CATEGORIES = [
  'Pendidikan',
  'Penelitian',
  'Pengabdian',
  'Penunjang',
] as const
export type TridharmaCategory = typeof TRIDHARMA_CATEGORIES[number]

/**
 * Mendapatkan tahun akademik aktif terbaru berdasarkan kalender perangkat saat ini.
 * Dinamis 100% mengikuti waktu sistem pada perangkat (tidak hardcoded / static).
 */
export function getDeviceLatestAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1 - 12
  // Semester ganjil dimulai Agustus (bulan 8)
  const baseYear = month >= 8 ? year : year - 1
  return `${baseYear}/${baseYear + 1}`
}

/**
 * Mendapatkan semester default berdasarkan kalender perangkat saat ini.
 * Agustus s.d. Januari: Semester Ganjil
 * Februari s.d. Juli: Semester Genap
 */
export function getDeviceCurrentSemester(): 'Ganjil' | 'Genap' {
  const month = new Date().getMonth() + 1
  return (month >= 8 || month === 1) ? 'Ganjil' : 'Genap'
}

/**
 * Menghasilkan daftar tahun akademik dinamis terurut dari terbaru ke terlama.
 * Berdasarkan waktu perangkat saat ini dan opsional digabung dengan data dari basis data.
 */
export function getDynamicAcademicYearList(extraYears: (string | undefined | null)[] = []): string[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const baseYear = month >= 8 ? year : year - 1

  // Rentang dinamis: tahun aktif perangkat, tahun-tahun sebelumnya, serta tahun rencana
  const dynamicYears: string[] = [
    `${baseYear}/${baseYear + 1}`,
    `${baseYear - 1}/${baseYear}`,
    `${baseYear - 2}/${baseYear - 1}`,
    `${baseYear - 3}/${baseYear - 2}`,
    `${baseYear - 4}/${baseYear - 3}`,
  ]

  const cleanExtras = extraYears.filter((x): x is string => Boolean(x && typeof x === 'string' && x.includes('/')))
  const merged = Array.from(new Set([...dynamicYears, ...cleanExtras]))

  // Urutkan tahun terbesar (terbaru) di paling atas (descending)
  return merged.sort((a, b) => {
    const ya = parseInt(a.split('/')[0], 10) || 0
    const yb = parseInt(b.split('/')[0], 10) || 0
    return yb - ya
  })
}

/**
 * Mendapatkan nilai default tahun akademik untuk seluruh select dropdown.
 * Selalu memprioritaskan tahun akademik aktif terbaru perangkat saat ini.
 */
export function getDefaultAcademicYear(availableList?: string[]): string {
  const deviceLatest = getDeviceLatestAcademicYear()
  if (availableList && availableList.length > 0) {
    if (availableList.includes(deviceLatest)) {
      return deviceLatest
    }
    return availableList[0]
  }
  return deviceLatest
}

/**
 * Mendapatkan tahun kalender tunggal dinamis pada perangkat (misal untuk kuesioner tahunan)
 */
export function getDeviceCurrentCalendarYear(): string {
  return String(new Date().getFullYear())
}

export const getCurrentAcademicYear = getDeviceLatestAcademicYear
export const DEFAULT_TAHUN_AJARAN_OPTIONS: string[] = getDynamicAcademicYearList()

let cachedAcademicYears: string[] | null = null

/**
 * Mengambil daftar tahun akademik dari backend atau fallback default.
 */
export async function fetchAcademicYearOptions(): Promise<string[]> {
  if (cachedAcademicYears && cachedAcademicYears.length > 0) {
    return cachedAcademicYears
  }

  try {
    const res = await fetch('/api/reference/tahun-akademik')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const merged = Array.from(new Set([...data, ...DEFAULT_TAHUN_AJARAN_OPTIONS]))
        cachedAcademicYears = merged
        return merged
      }
    }
  } catch {
    // Abaikan jika offline / dev mode, gunakan fallback dinamis
  }

  return DEFAULT_TAHUN_AJARAN_OPTIONS
}

/**
 * Custom hook React untuk mengambil tahun akademik dinamis dari API backend
 */
export function useAcademicYears(): {
  academicYears: string[]
  loading: boolean
  currentAcademicYear: string
} {
  const [academicYears, setAcademicYears] = useState<string[]>(DEFAULT_TAHUN_AJARAN_OPTIONS)
  const [loading, setLoading] = useState<boolean>(true)
  const currentAcademicYear = getDeviceLatestAcademicYear()

  useEffect(() => {
    let isMounted = true
    fetchAcademicYearOptions()
      .then((years) => {
        if (isMounted) {
          setAcademicYears(years)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { academicYears, loading, currentAcademicYear }
}
