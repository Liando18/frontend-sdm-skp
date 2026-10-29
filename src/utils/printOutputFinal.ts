import { OutputFinalData } from '../components/CetakOutputFinalTahunan'

/**
 * Utility untuk membuka halaman cetak Standalone Output Final Laporan Tahunan di tab baru (_blank)
 */
export function openPrintOutputFinal(data: OutputFinalData) {
  try {
    const payload = JSON.stringify(data)
    localStorage.setItem('ubk_print_output_final_data', payload)
    if (data.dosen?.id) {
      localStorage.setItem(`ubk_print_output_final_${data.dosen.id}`, payload)
    }
    if (data.dosen?.nip) {
      localStorage.setItem(`ubk_print_output_final_${data.dosen.nip}`, payload)
    }
  } catch (e) {
    console.warn('Gagal menyimpan cache pratinjau Output Final:', e)
  }

  const queryId = data.dosen?.id || data.dosen?.nip || 'latest'
  const printUrl = `/cetak-output-final?id=${encodeURIComponent(queryId)}&ta=${encodeURIComponent(data.tahunAkademik || '')}`
  window.open(printUrl, '_blank')
}
