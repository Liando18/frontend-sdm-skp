import { PenilaianKuesioner } from '../types'
import { getCachedOfficialRektor, RektorData } from './rektorData'

export interface TranskripPrintData {
  penilaian: PenilaianKuesioner
  dosenNama: string
  dosenNip?: string
  dosenNuptk?: string
  dosenProdi: string
  dosenJafung?: string
  dosenGolongan?: string
  tahunAkademik: string
  dosenSignatureUrl?: string
  rektor?: RektorData
}

/**
 * Utility untuk membuka halaman cetak Standalone Transkrip Evaluasi BerAKHLAK di tab baru (_blank)
 */
export function openPrintTranskrip(data: TranskripPrintData) {
  try {
    const fullData: TranskripPrintData = {
      ...data,
      rektor: data.rektor || getCachedOfficialRektor() || undefined,
    }
    const payload = JSON.stringify(fullData)
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
