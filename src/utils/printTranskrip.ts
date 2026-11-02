import { PenilaianKuesioner, IndikatorKuesioner } from '../types'
import { getCachedOfficialRektor, RektorData } from './rektorData'
import { encodeDocumentToken, prunePrintCache } from './urlSecurity'

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
  indikatorList?: IndikatorKuesioner[]
}

/**
 * Utility untuk membuka halaman cetak Standalone Transkrip Evaluasi BerAKHLAK di tab baru (_blank)
 * Menggunakan URL hierarkis aman dengan token Base64URL.
 */
export function openPrintTranskrip(data: TranskripPrintData) {
  prunePrintCache()

  const fullData: TranskripPrintData = {
    ...data,
    rektor: data.rektor || getCachedOfficialRektor() || undefined,
  }

  const payload = {
    ...fullData,
    timestamp: Date.now(),
  }

  try {
    const payloadStr = JSON.stringify(payload)
    localStorage.setItem('ubk_print_transkrip_data', payloadStr)
    if (data.dosenNip) {
      localStorage.setItem(`ubk_print_transkrip_${data.dosenNip}`, payloadStr)
    }
  } catch (e) {
    console.warn('Gagal menyimpan cache pratinjau Transkrip:', e)
  }

  const queryNip = data.dosenNip || 'latest'
  const token = encodeDocumentToken({
    id: data.penilaian?.id || queryNip,
    dosenId: data.penilaian?.dosenId,
    tahun: data.tahunAkademik,
    ts: Date.now(),
  })

  const printUrl = token
    ? `/cetak/transkrip/${token}?nip=${encodeURIComponent(queryNip)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`
    : `/cetak/transkrip?nip=${encodeURIComponent(queryNip)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`

  window.open(printUrl, '_blank')
}
