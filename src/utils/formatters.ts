/**
 * Fungsi Utilitas Format Data Terpusat UBK
 * Sesuai DESAIN.md Bab 15.2
 */

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * Memformat tanggal ke dalam format resmi Indonesia (contoh: 02 November 2026)
 */
export function formatIndonesianDate(
  dateInput: string | Date | null | undefined,
  options?: { withDayName?: boolean; shortMonth?: boolean }
): string {
  if (!dateInput) return '-'

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return '-'

    const date = String(d.getDate()).padStart(2, '0')
    const month = BULAN_INDONESIA[d.getMonth()]
    const year = d.getFullYear()

    if (options?.shortMonth) {
      const shortM = month.slice(0, 3)
      return `${date} ${shortM} ${year}`
    }

    if (options?.withDayName) {
      const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const day = HARI_INDONESIA[d.getDay()]
      return `${day}, ${date} ${month} ${year}`
    }

    return `${date} ${month} ${year}`
  } catch {
    return '-'
  }
}

/**
 * Format angka tabular dengan pemisah ribuan standar Indonesia (id-ID)
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format beban kerja SKS terstandarisasi (contoh: "3 SKS" atau "2.5 SKS")
 */
export function formatSKS(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0 SKS'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0 SKS'
  return `${num % 1 === 0 ? num : num.toFixed(1)} SKS`
}

/**
 * Format persentase capaian kinerja (contoh: "95.5%")
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  return `${num.toFixed(decimals)}%`
}
