/**
 * Formal A4 Document Print Helper
 * Menggunakan mekanisme Isolated Iframe printing profesional agar:
 * 1. Tidak mencetak UI shell aplikasi web (sidebar, topbar, modal-backdrop, GSAP inline transforms).
 * 2. Mencegah blank page bug pada browser modern (Chromium/Brave/Safari/Firefox).
 * 3. Menghasilkan ukuran cetak pas standar A4 (210mm x 297mm) persis seperti preview dokumen.
 */
export function printDocument(container: HTMLElement, documentTitle: string) {
  // Buat iframe terisolasi yang tidak tampak di layar
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Dokumen Cetak Formal')
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '-10000px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    window.print()
    return
  }

  // Ambil isi dokumen dari container
  const contentHtml = container.innerHTML

  // Tulis dokumen HTML bersih dan formal ke dalam iframe
  doc.open()
  doc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${documentTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.4;
    }

    /* Sembunyikan elemen navigasi dan tombol */
    .no-print, button, .tabs, .modal-head {
      display: none !important;
    }

    .a4-print-viewport {
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }

    /* Lembar Kertas Formal A4 */
    .a4-sheet {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    .a4-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
      margin-bottom: 0 !important;
    }

    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0 !important;
      margin: 0 !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      font-size: 10.5px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    thead {
      display: table-header-group !important;
    }

    tbody {
      display: table-row-group !important;
    }

    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    th, td {
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    div[style*="border"] {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
    }

    .avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    a {
      color: #1d4ed8 !important;
      text-decoration: underline !important;
      font-weight: 600 !important;
    }

    img {
      max-width: 100% !important;
    }

    svg {
      max-width: 100% !important;
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`)
  doc.close()

  // Tunggu sejenak hingga browser merender DOM iframe lalu panggil dialog cetak
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.warn('Gagal memicu iframe print, menggunakan fallback print:', e)
      window.print()
    } finally {
      // Bersihkan iframe setelah dialog cetak ditutup
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }
  }, 300)
}
