import { PengajuanSKP } from '../types'
import { getCachedOfficialRektor, RektorData } from './rektorData'
import { encodeDocumentToken, prunePrintCache } from './urlSecurity'

/**
 * Membuka Formulir Cetak SKP Formal di tab browser baru (_blank).
 * Menyimpan data SKP dan data Rektor Pejabat Penilai di localStorage agar langsung
 * termuat instan di tab baru tanpa delay jaringan atau race condition.
 * Menggunakan URL hierarkis aman dengan token Base64URL.
 */
export function openPrintSKP(
  skp: PengajuanSKP,
  dosenSignatureUrl?: string,
  customRektor?: RektorData
) {
  prunePrintCache()

  const rektor = customRektor || getCachedOfficialRektor() || undefined
  const payload = {
    id: skp.id,
    skp,
    dosenSignatureUrl: dosenSignatureUrl || skp.ttdDosenUrl,
    rektor,
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem('ubk_print_skp_data', JSON.stringify(payload))
    localStorage.setItem(`ubk_print_skp_${skp.id}`, JSON.stringify(payload))
  } catch (err) {
    console.warn('Gagal menyimpan cache cetak SKP ke localStorage:', err)
  }

  const token = encodeDocumentToken({
    id: skp.id,
    dosenId: skp.dosenId,
    tahun: skp.tahunAkademik,
    semester: skp.semester,
    ts: Date.now(),
  })

  const printUrl = token
    ? `/cetak/skp/${token}?id=${encodeURIComponent(skp.id)}`
    : `/cetak/skp?id=${encodeURIComponent(skp.id)}`

  window.open(printUrl, '_blank')
}
