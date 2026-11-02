import { PengajuanSKP } from '../types'
import { getCachedOfficialRektor, RektorData } from './rektorData'

/**
 * Membuka Formulir Cetak SKP Formal di tab browser baru (_blank).
 * Menyimpan data SKP dan data Rektor Pejabat Penilai di localStorage agar langsung
 * termuat instan di tab baru tanpa delay jaringan atau race condition, serta
 * menyertakan query parameter ?id= untuk deep-linking.
 */
export function openPrintSKP(
  skp: PengajuanSKP,
  dosenSignatureUrl?: string,
  customRektor?: RektorData
) {
  try {
    const rektor = customRektor || getCachedOfficialRektor() || undefined
    const payload = {
      skp,
      dosenSignatureUrl: dosenSignatureUrl || skp.ttdDosenUrl,
      rektor,
      timestamp: Date.now(),
    }
    localStorage.setItem('ubk_print_skp_data', JSON.stringify(payload))
    localStorage.setItem(`ubk_print_skp_${skp.id}`, JSON.stringify(payload))
  } catch (err) {
    console.warn('Gagal menyimpan cache cetak SKP ke localStorage:', err)
  }

  const printUrl = `/cetak-skp?id=${encodeURIComponent(skp.id)}`
  window.open(printUrl, '_blank')
}
