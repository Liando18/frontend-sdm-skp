import { OutputFinalData } from '../components/CetakOutputFinalTahunan'
import { getCachedOfficialRektor } from './rektorData'
import { encodeDocumentToken, prunePrintCache } from './urlSecurity'

/**
 * Utility untuk membuka halaman cetak Standalone Output Final Laporan Tahunan di tab baru (_blank)
 * Menggunakan URL hierarkis aman dengan token Base64URL.
 */
export function openPrintOutputFinal(data: OutputFinalData) {
  prunePrintCache()

  const fullData: OutputFinalData = {
    ...data,
    rektor: data.rektor || getCachedOfficialRektor() || undefined,
  }

  const payload = {
    ...fullData,
    timestamp: Date.now(),
  }

  try {
    const payloadStr = JSON.stringify(payload)
    localStorage.setItem('ubk_print_output_final_data', payloadStr)
    if (data.dosen?.id) {
      localStorage.setItem(`ubk_print_output_final_${data.dosen.id}`, payloadStr)
    }
    if (data.dosen?.nip) {
      localStorage.setItem(`ubk_print_output_final_${data.dosen.nip}`, payloadStr)
    }
  } catch (e) {
    console.warn('Gagal menyimpan cache pratinjau Output Final:', e)
  }

  const queryId = data.dosen?.id || data.dosen?.nip || 'latest'
  const token = encodeDocumentToken({
    id: queryId,
    dosenId: data.dosen?.id,
    tahun: data.tahunAkademik,
    ts: Date.now(),
  })

  const printUrl = token
    ? `/cetak/output-final/${token}?id=${encodeURIComponent(queryId)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`
    : `/cetak/output-final?id=${encodeURIComponent(queryId)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`

  window.open(printUrl, '_blank')
}
