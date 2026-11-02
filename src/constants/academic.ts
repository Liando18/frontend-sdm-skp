import { useState, useEffect } from 'react'

/**
 * Single Source of Truth (SSOT) Parameter & Konfigurasi Akademik UBK
 * Sesuai DESAIN.md Bab 15.1
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

const currentYear = new Date().getFullYear()

export const DEFAULT_TAHUN_AJARAN_OPTIONS: string[] = [
  `${currentYear - 1}/${currentYear}`,
  `${currentYear}/${currentYear + 1}`,
  `${currentYear + 1}/${currentYear + 2}`,
  '2025/2026',
  '2024/2025',
  '2023/2024',
].filter((v, i, a) => a.indexOf(v) === i)

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
    // Abaikan jika offline / dev mode, gunakan fallback default
  }

  return DEFAULT_TAHUN_AJARAN_OPTIONS
}

/**
 * Mendapatkan tahun akademik aktif saat ini berdasarkan kalender.
 */
export function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1 - 12
  // Semester ganjil umumnya dimulai bulan Agustus
  if (month >= 8) {
    return `${year}/${year + 1}`
  } else {
    return `${year - 1}/${year}`
  }
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
  const currentAcademicYear = getCurrentAcademicYear()

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
