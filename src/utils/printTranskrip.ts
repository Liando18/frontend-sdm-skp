import { PenilaianKuesioner } from '../types'

export interface TranskripPrintData {
  penilaian: PenilaianKuesioner
  dosenNama: string
  dosenNip: string
  dosenProdi: string
  dosenJafung?: string
  dosenGolongan?: string
  tahunAkademik: string
}

/**
 * Utility untuk membuka halaman cetak Standalone Transkrip Evaluasi BerAKHLAK di tab baru (_blank)
 */
export function openPrintTranskrip(data: TranskripPrintData) {
  try {
    const payload = JSON.stringify(data)
    localStorage.setItem('ubk_print_transkrip_data', payload)
    if (data.dosenNip) {
      localStorage.setItem(`ubk_print_transkrip_${data.dosenNip}`, payload)
    }
  } catch (e) {
    console.warn('Gagal menyimpan cache pratinjau Transkrip:', e)
  }

  const queryNip = data.dosenNip || 'latest'
  const printUrl = `/cetak-transkrip?nip=${encodeURIComponent(queryNip)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`
  window.open(printUrl, '_blank')
}
