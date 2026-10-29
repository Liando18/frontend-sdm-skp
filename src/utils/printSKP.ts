import { PengajuanSKP } from '../types'

/**
 * Membuka Formulir Cetak SKP Formal di tab browser baru (_blank).
 * Menyimpan data SKP di localStorage agar langsung termuat instan di tab baru
 * tanpa delay jaringan, serta menyertakan query parameter ?id= untuk deep-linking.
 */
export function openPrintSKP(skp: PengajuanSKP, dosenSignatureUrl?: string) {
  try {
    const payload = {
      skp,
      dosenSignatureUrl: dosenSignatureUrl || skp.ttdDosenUrl,
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
