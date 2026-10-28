import ExcelJS from 'exceljs'
import { PengajuanSKP } from '../types'

/**
 * Utility untuk mengekspor Formulir SKP Dosen ke dalam format Microsoft Excel (.xlsx)
 * Format disesuaikan 1-sheet dengan template resmi 'Formulir SKP DOSEN UBK + Output Cetak.xlsx'
 */
export async function exportSKPToExcel(skp: PengajuanSKP) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Universitas Bhakti Kencana'
  workbook.lastModifiedBy = 'Sistem Informasi SDM & SKP UBK'
  workbook.created = new Date()
  workbook.modified = new Date()

  const sheet = workbook.addWorksheet('SKP DOSEN', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
  })

  // Set lebar kolom
  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'kegiatan', width: 42 },
    { key: 'target_awal', width: 14 },
    { key: 'target_ubah', width: 14 },
    { key: 'realisasi', width: 14 },
    { key: 'satuan', width: 14 },
    { key: 'mutu', width: 13 },
    { key: 'waktu', width: 9 },
    { key: 'satuan_waktu', width: 8 },
    { key: 'link', width: 28 },
  ]

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  }

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } },
  }

  // 1. JUDUL DOKUMEN
  sheet.mergeCells('A1:J1')
  const title1 = sheet.getCell('A1')
  title1.value = 'FORMULIR SASARAN KINERJA DOSEN'
  title1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF000000' } }
  title1.alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('A2:J2')
  const title2 = sheet.getCell('A2')
  title2.value = 'UNIVERSITAS BHAKTI KENCANA'
  title2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } }
  title2.alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('A3:J3')
  const title3 = sheet.getCell('A3')
  title3.value = `Semester ${skp.semester} • Tahun Akademik ${skp.tahunAkademik}`
  title3.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  title3.alignment = { horizontal: 'center', vertical: 'middle' }

  // Spacing
  sheet.getRow(4).height = 8

  // 2. IDENTITAS PEJABAT PENILAI & DOSEN YANG DINILAI
  // Header Pejabat Penilai (A5:E5)
  sheet.mergeCells('A5:A5')
  sheet.getCell('A5').value = 'NO'
  sheet.getCell('A5').font = { name: 'Arial', size: 9, bold: true }
  sheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  sheet.getCell('A5').border = thinBorder

  sheet.mergeCells('B5:E5')
  const headPenilai = sheet.getCell('B5')
  headPenilai.value = 'I. PEJABAT PENILAI'
  headPenilai.font = { name: 'Arial', size: 9, bold: true }
  headPenilai.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  headPenilai.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  headPenilai.border = thinBorder

  // Header Dosen Yang Dinilai (F5:J5)
  sheet.mergeCells('F5:F5')
  sheet.getCell('F5').value = 'NO'
  sheet.getCell('F5').font = { name: 'Arial', size: 9, bold: true }
  sheet.getCell('F5').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getCell('F5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  sheet.getCell('F5').border = thinBorder

  sheet.mergeCells('G5:J5')
  const headDosen = sheet.getCell('G5')
  headDosen.value = 'II. DOSEN YANG DINILAI'
  headDosen.font = { name: 'Arial', size: 9, bold: true }
  headDosen.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  headDosen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  headDosen.border = thinBorder

  const penilaiRows = [
    { no: 1, label: 'Nama', val: skp.penilaiNama || 'Ketua Program Studi' },
    { no: 2, label: 'NIP', val: skp.penilaiNip || '-' },
    { no: 3, label: 'Pangkat/Gol.Ruang', val: skp.penilaiPangkat || 'Penata Tk. I / IIId' },
    { no: 4, label: 'Jabatan', val: skp.penilaiJabatan || 'Ketua Program Studi' },
    { no: 5, label: 'Unit Kerja', val: skp.penilaiUnit || skp.dosenProdi || 'Universitas Bhakti Kencana' },
  ]

  const dosenRows = [
    { no: 1, label: 'Nama', val: skp.dosenNama },
    { no: 2, label: 'NIP', val: skp.dosenNip },
    { no: 3, label: 'Pangkat/Gol.Ruang', val: skp.dosenPangkat || 'Penata Muda / IIIb' },
    { no: 4, label: 'Jabatan', val: skp.dosenJabatan || 'Dosen' },
    { no: 5, label: 'Unit Kerja', val: skp.dosenProdi || 'Universitas Bhakti Kencana' },
  ]

  for (let i = 0; i < 5; i++) {
    const rowIdx = 6 + i
    // Kolom Pejabat Penilai
    sheet.getCell(`A${rowIdx}`).value = penilaiRows[i].no
    sheet.getCell(`A${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getCell(`A${rowIdx}`).font = { name: 'Arial', size: 9 }
    sheet.getCell(`A${rowIdx}`).border = thinBorder

    sheet.getCell(`B${rowIdx}`).value = penilaiRows[i].label
    sheet.getCell(`B${rowIdx}`).font = { name: 'Arial', size: 9, bold: true }
    sheet.getCell(`B${rowIdx}`).border = thinBorder

    sheet.mergeCells(`C${rowIdx}:E${rowIdx}`)
    const cellValP = sheet.getCell(`C${rowIdx}`)
    cellValP.value = penilaiRows[i].val
    cellValP.font = { name: 'Arial', size: 9 }
    cellValP.alignment = { horizontal: 'left', vertical: 'middle' }
    cellValP.border = thinBorder
    sheet.getCell(`D${rowIdx}`).border = thinBorder
    sheet.getCell(`E${rowIdx}`).border = thinBorder

    // Kolom Dosen Yang Dinilai
    sheet.getCell(`F${rowIdx}`).value = dosenRows[i].no
    sheet.getCell(`F${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getCell(`F${rowIdx}`).font = { name: 'Arial', size: 9 }
    sheet.getCell(`F${rowIdx}`).border = thinBorder

    sheet.getCell(`G${rowIdx}`).value = dosenRows[i].label
    sheet.getCell(`G${rowIdx}`).font = { name: 'Arial', size: 9, bold: true }
    sheet.getCell(`G${rowIdx}`).border = thinBorder

    sheet.mergeCells(`H${rowIdx}:J${rowIdx}`)
    const cellValD = sheet.getCell(`H${rowIdx}`)
    cellValD.value = dosenRows[i].val
    cellValD.font = { name: 'Arial', size: 9 }
    cellValD.alignment = { horizontal: 'left', vertical: 'middle' }
    cellValD.border = thinBorder
    sheet.getCell(`I${rowIdx}`).border = thinBorder
    sheet.getCell(`J${rowIdx}`).border = thinBorder
  }

  // Spacing
  sheet.getRow(11).height = 10

  // 3. HEADER TABEL KEGIATAN SKP
  // Row 12 & 13
  sheet.mergeCells('A12:A13')
  const hNo = sheet.getCell('A12')
  hNo.value = 'NO'
  hNo.alignment = { horizontal: 'center', vertical: 'middle' }
  hNo.font = { name: 'Arial', size: 9, bold: true }
  hNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hNo.border = thinBorder
  sheet.getCell('A13').border = thinBorder

  sheet.mergeCells('B12:B13')
  const hKeg = sheet.getCell('B12')
  hKeg.value = 'III. KEGIATAN TUGAS JABATAN'
  hKeg.alignment = { horizontal: 'center', vertical: 'middle' }
  hKeg.font = { name: 'Arial', size: 9, bold: true }
  hKeg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hKeg.border = thinBorder
  sheet.getCell('B13').border = thinBorder

  sheet.mergeCells('C12:E12')
  const hTarget = sheet.getCell('C12')
  hTarget.value = 'TARGET / REALISASI'
  hTarget.alignment = { horizontal: 'center', vertical: 'middle' }
  hTarget.font = { name: 'Arial', size: 9, bold: true }
  hTarget.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hTarget.border = thinBorder
  sheet.getCell('D12').border = thinBorder
  sheet.getCell('E12').border = thinBorder

  const hTargetAwal = sheet.getCell('C13')
  hTargetAwal.value = 'Rencana Awal'
  hTargetAwal.alignment = { horizontal: 'center', vertical: 'middle' }
  hTargetAwal.font = { name: 'Arial', size: 8.5, bold: true }
  hTargetAwal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hTargetAwal.border = thinBorder

  const hTargetUbah = sheet.getCell('D13')
  hTargetUbah.value = 'Perubahan'
  hTargetUbah.alignment = { horizontal: 'center', vertical: 'middle' }
  hTargetUbah.font = { name: 'Arial', size: 8.5, bold: true }
  hTargetUbah.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hTargetUbah.border = thinBorder

  const hRealisasi = sheet.getCell('E13')
  hRealisasi.value = 'Realisasi'
  hRealisasi.alignment = { horizontal: 'center', vertical: 'middle' }
  hRealisasi.font = { name: 'Arial', size: 8.5, bold: true }
  hRealisasi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hRealisasi.border = thinBorder

  sheet.mergeCells('F12:F13')
  const hSatuan = sheet.getCell('F12')
  hSatuan.value = 'SATUAN'
  hSatuan.alignment = { horizontal: 'center', vertical: 'middle' }
  hSatuan.font = { name: 'Arial', size: 9, bold: true }
  hSatuan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hSatuan.border = thinBorder
  sheet.getCell('F13').border = thinBorder

  sheet.mergeCells('G12:G13')
  const hMutu = sheet.getCell('G12')
  hMutu.value = 'KUAL / MUTU (%)'
  hMutu.alignment = { horizontal: 'center', vertical: 'middle' }
  hMutu.font = { name: 'Arial', size: 9, bold: true }
  hMutu.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hMutu.border = thinBorder
  sheet.getCell('G13').border = thinBorder

  sheet.mergeCells('H12:I12')
  const hWaktu = sheet.getCell('H12')
  hWaktu.value = 'WAKTU'
  hWaktu.alignment = { horizontal: 'center', vertical: 'middle' }
  hWaktu.font = { name: 'Arial', size: 9, bold: true }
  hWaktu.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hWaktu.border = thinBorder
  sheet.getCell('I12').border = thinBorder

  const hWaktuDurasi = sheet.getCell('H13')
  hWaktuDurasi.value = 'Durasi'
  hWaktuDurasi.alignment = { horizontal: 'center', vertical: 'middle' }
  hWaktuDurasi.font = { name: 'Arial', size: 8.5, bold: true }
  hWaktuDurasi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hWaktuDurasi.border = thinBorder

  const hWaktuSatuan = sheet.getCell('I13')
  hWaktuSatuan.value = 'Satuan'
  hWaktuSatuan.alignment = { horizontal: 'center', vertical: 'middle' }
  hWaktuSatuan.font = { name: 'Arial', size: 8.5, bold: true }
  hWaktuSatuan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hWaktuSatuan.border = thinBorder

  sheet.mergeCells('J12:J13')
  const hLink = sheet.getCell('J12')
  hLink.value = 'LINK BUKTI DUKUNG'
  hLink.alignment = { horizontal: 'center', vertical: 'middle' }
  hLink.font = { name: 'Arial', size: 9, bold: true }
  hLink.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  hLink.border = thinBorder
  sheet.getCell('J13').border = thinBorder

  // 4. ISI DATA KEGIATAN SKP
  let currentRow = 14
  const startItemRow = currentRow

  skp.items.forEach((item, index) => {
    sheet.getRow(currentRow).height = 24

    const cNo = sheet.getCell(`A${currentRow}`)
    cNo.value = index + 1
    cNo.alignment = { horizontal: 'center', vertical: 'middle' }
    cNo.font = { name: 'Arial', size: 9 }
    cNo.border = thinBorder

    const cKeg = sheet.getCell(`B${currentRow}`)
    cKeg.value = item.kegiatan || '-'
    cKeg.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    cKeg.font = { name: 'Arial', size: 9 }
    cKeg.border = thinBorder

    const cTargetAwal = sheet.getCell(`C${currentRow}`)
    cTargetAwal.value = Number(item.rencanaAwal) || 0
    cTargetAwal.alignment = { horizontal: 'center', vertical: 'middle' }
    cTargetAwal.font = { name: 'Arial', size: 9 }
    cTargetAwal.border = thinBorder

    const cTargetUbah = sheet.getCell(`D${currentRow}`)
    cTargetUbah.value = Number(item.perubahanTengah ?? item.rencanaAwal) || 0
    cTargetUbah.alignment = { horizontal: 'center', vertical: 'middle' }
    cTargetUbah.font = { name: 'Arial', size: 9 }
    cTargetUbah.border = thinBorder

    const cRealisasi = sheet.getCell(`E${currentRow}`)
    cRealisasi.value = Number(item.realisasi ?? item.rencanaAwal) || 0
    cRealisasi.alignment = { horizontal: 'center', vertical: 'middle' }
    cRealisasi.font = { name: 'Arial', size: 9 }
    cRealisasi.border = thinBorder

    const cSatuan = sheet.getCell(`F${currentRow}`)
    cSatuan.value = item.satuan || 'SKS / Dokumen'
    cSatuan.alignment = { horizontal: 'center', vertical: 'middle' }
    cSatuan.font = { name: 'Arial', size: 9 }
    cSatuan.border = thinBorder

    const cMutu = sheet.getCell(`G${currentRow}`)
    cMutu.value = Number(item.kualitasMutu) || 100
    cMutu.alignment = { horizontal: 'center', vertical: 'middle' }
    cMutu.font = { name: 'Arial', size: 9, bold: true }
    cMutu.numFmt = '0.00'
    cMutu.border = thinBorder

    const cWaktu = sheet.getCell(`H${currentRow}`)
    cWaktu.value = Number(item.waktuNilai) || 6
    cWaktu.alignment = { horizontal: 'center', vertical: 'middle' }
    cWaktu.font = { name: 'Arial', size: 9 }
    cWaktu.border = thinBorder

    const cSatuanWaktu = sheet.getCell(`I${currentRow}`)
    cSatuanWaktu.value = item.waktuSatuan || 'bln'
    cSatuanWaktu.alignment = { horizontal: 'center', vertical: 'middle' }
    cSatuanWaktu.font = { name: 'Arial', size: 9 }
    cSatuanWaktu.border = thinBorder

    const cLink = sheet.getCell(`J${currentRow}`)
    const linkVal = item.linkDokumen || '-'
    if (linkVal.startsWith('http')) {
      cLink.value = { text: 'Tautan di sini', hyperlink: linkVal }
      cLink.font = { name: 'Arial', size: 9, color: { argb: 'FF0284C7' }, underline: true }
    } else {
      cLink.value = linkVal
      cLink.font = { name: 'Arial', size: 8.5, color: { argb: 'FF64748B' } }
    }
    cLink.alignment = { horizontal: 'center', vertical: 'middle' }
    cLink.border = thinBorder

    currentRow++
  })

  // 5. TOTAL / RATA-RATA MUTU CAPAIAN
  sheet.getRow(currentRow).height = 22
  sheet.mergeCells(`A${currentRow}:F${currentRow}`)
  const cTotalLabel = sheet.getCell(`A${currentRow}`)
  cTotalLabel.value = 'RATA-RATA CAPAIAN KUALITAS / MUTU KINERJA'
  cTotalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }
  cTotalLabel.font = { name: 'Arial', size: 9, bold: true }
  cTotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  cTotalLabel.border = mediumBorder

  // Set borders for merged cells
  for (const col of ['B', 'C', 'D', 'E', 'F']) {
    sheet.getCell(`${col}${currentRow}`).border = mediumBorder
  }

  const cTotalVal = sheet.getCell(`G${currentRow}`)
  if (skp.items.length > 0) {
    cTotalVal.value = {
      formula: `AVERAGE(G${startItemRow}:G${currentRow - 1})`,
      result: (
        skp.items.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
        skp.items.length
      ),
    }
  } else {
    cTotalVal.value = skp.persentaseCapaian ?? 100
  }
  cTotalVal.alignment = { horizontal: 'center', vertical: 'middle' }
  cTotalVal.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F223D' } }
  cTotalVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
  cTotalVal.numFmt = '0.00'
  cTotalVal.border = mediumBorder

  sheet.mergeCells(`H${currentRow}:J${currentRow}`)
  const cTotalTail = sheet.getCell(`H${currentRow}`)
  cTotalTail.value = 'PERSEN (%)'
  cTotalTail.alignment = { horizontal: 'center', vertical: 'middle' }
  cTotalTail.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF475569' } }
  cTotalTail.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  cTotalTail.border = mediumBorder
  sheet.getCell(`I${currentRow}`).border = mediumBorder
  sheet.getCell(`J${currentRow}`).border = mediumBorder

  // Spacing before signatures
  currentRow += 2

  // 6. LEMBAR PENGESAHAN & TANDA TANGAN
  const approvalDate = skp.tanggalPenilaianKaprodi || skp.tanggalPengajuan
  const tglFormatted = approvalDate
    ? new Date(approvalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  sheet.getCell(`B${currentRow}`).value = `Bandung, ${tglFormatted}`
  sheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 9, bold: true }

  sheet.getCell(`G${currentRow}`).value = `Bandung, ${tglFormatted}`
  sheet.getCell(`G${currentRow}`).font = { name: 'Arial', size: 9, bold: true }

  currentRow++
  sheet.getCell(`B${currentRow}`).value = 'Pejabat Penilai Kinerja,'
  sheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 9 }

  sheet.getCell(`G${currentRow}`).value = 'Dosen Yang Dinilai,'
  sheet.getCell(`G${currentRow}`).font = { name: 'Arial', size: 9 }

  // Spacing for signature
  currentRow += 4

  sheet.getCell(`B${currentRow}`).value = skp.penilaiNama || '(Ketua Program Studi)'
  sheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 9.5, bold: true, underline: true }

  sheet.getCell(`G${currentRow}`).value = skp.dosenNama
  sheet.getCell(`G${currentRow}`).font = { name: 'Arial', size: 9.5, bold: true, underline: true }

  currentRow++
  sheet.getCell(`B${currentRow}`).value = `NIP: ${skp.penilaiNip || '-'}`
  sheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8.5 }

  sheet.getCell(`G${currentRow}`).value = `NIP: ${skp.dosenNip}`
  sheet.getCell(`G${currentRow}`).font = { name: 'Arial', size: 8.5 }

  // 7. CATATAN PENGISIAN RESMI
  currentRow += 2
  sheet.getCell(`A${currentRow}`).value = 'Catatan Pengisian :'
  sheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8.5, bold: true }

  const catatan = [
    '1. Pengisian Formulir SKP ini dituangkan dalam penetapan kinerja berkala Dosen dan syarat pengusulan BKD / JAD.',
    '2. Bukti dukung fisik / tautan digital dapat diambil dari pangkalan data akademik dan terintegrasi.',
    '3. Data yang terealisasi harus selaras dengan dokumen verifikasi yang diunggah dan disetujui pimpinan.',
  ]

  catatan.forEach((cat, idx) => {
    currentRow++
    sheet.getCell(`A${currentRow}`).value = cat
    sheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF475569' } }
  })

  // 8. WRITE BUFFER & TRIGGER BROWSER DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url

  const safeDosen = (skp.dosenNama || 'Dosen').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeTahun = (skp.tahunAkademik || '2026').replace(/[^a-zA-Z0-9_-]/g, '-')
  anchor.download = `Formulir_SKP_${safeDosen}_Sem_${skp.semester}_${safeTahun}.xlsx`

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}
