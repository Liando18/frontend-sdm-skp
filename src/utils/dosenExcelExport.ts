import ExcelJS from 'exceljs'
import { Dosen, JabatanKampus } from '../types'

export interface DosenExportFilterInfo {
  searchQuery?: string
  fakultas?: string
  prodi?: string
  lokasi?: string
  jabatan?: string
  jafung?: string
  golongan?: string
  status?: string
  skpStatus?: string
  totalOriginal: number
  totalFiltered: number
}

/**
 * Utility untuk mengekspor Master Data Dosen UBK ke format Microsoft Excel (.xlsx) resmi.
 * Hasil ekspor secara otomatis menyesuaikan dengan data hasil filter yang sedang aktif.
 */
export async function exportDosenToExcel(
  dosens: Dosen[],
  filterInfo?: DosenExportFilterInfo,
  jabatanList: JabatanKampus[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Universitas Bhakti Kencana'
  workbook.lastModifiedBy = 'Direktorat SDM UBK'
  workbook.created = new Date()
  workbook.modified = new Date()

  const sheet = workbook.addWorksheet('Data Dosen', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    },
  })

  // 1. Header Judul Institusi
  sheet.mergeCells('A1:N1')
  sheet.getCell('A1').value = 'UNIVERSITAS BHAKTI KENCANA - DIREKTORAT SUMBER DAYA MANUSIA'
  sheet.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0F223D' } }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

  sheet.mergeCells('A2:N2')
  sheet.getCell('A2').value = 'MASTER DATA KEPEGAWAIAN DOSEN & TENAGA PENDIDIK'
  sheet.getCell('A2').font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF475569' } }
  sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }

  // 2. Baris Keterangan Filter & Tanggal
  sheet.mergeCells('A3:N3')
  const filterSummaryParts: string[] = []
  if (filterInfo) {
    if (filterInfo.searchQuery) filterSummaryParts.push(`Pencarian: "${filterInfo.searchQuery}"`)
    if (filterInfo.fakultas && filterInfo.fakultas !== 'Semua Fakultas') filterSummaryParts.push(`Fakultas: ${filterInfo.fakultas}`)
    if (filterInfo.prodi && filterInfo.prodi !== 'Semua Program Studi') filterSummaryParts.push(`Prodi: ${filterInfo.prodi}`)
    if (filterInfo.lokasi && filterInfo.lokasi !== 'Semua Kampus') filterSummaryParts.push(`Kampus: ${filterInfo.lokasi}`)
    if (filterInfo.jabatan && filterInfo.jabatan !== 'Semua Jabatan') filterSummaryParts.push(`Jabatan: ${filterInfo.jabatan}`)
    if (filterInfo.jafung && filterInfo.jafung !== 'Semua Jafung') filterSummaryParts.push(`Jafung: ${filterInfo.jafung}`)
    if (filterInfo.golongan && filterInfo.golongan !== 'Semua Golongan') filterSummaryParts.push(`Golongan: ${filterInfo.golongan}`)
    if (filterInfo.status && filterInfo.status !== 'Semua Status') filterSummaryParts.push(`Status: ${filterInfo.status}`)
    if (filterInfo.skpStatus && filterInfo.skpStatus !== 'Semua Status SKP') filterSummaryParts.push(`Status SKP: ${filterInfo.skpStatus}`)
  }

  const isFiltered = filterSummaryParts.length > 0
  const filterText = isFiltered
    ? `Kriteria Filter: ${filterSummaryParts.join(' | ')} (Menampilkan ${dosens.length} dari ${filterInfo?.totalOriginal || dosens.length} Dosen)`
    : `Kriteria Filter: Semua Data Dosen (${dosens.length} Dosen)`

  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  sheet.getCell('A3').value = `${filterText} - Tanggal Ekspor: ${exportDate}`
  sheet.getCell('A3').font = { name: 'Arial', size: 8.5, italic: true, color: { argb: isFiltered ? 'FFC2410C' : 'FF64748B' } }
  sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }

  // 3. Header Tabel
  const headerRowIndex = 5
  const headers = [
    'No',
    'NIP',
    'NUPTK',
    'Nama Lengkap Dosen',
    'Fakultas',
    'Program Studi',
    'Penempatan / Kampus',
    'Jabatan Fungsional',
    'Pangkat / Golongan',
    'Jabatan Kampus',
    'Status Kepegawaian',
    'Status SKP',
    'Nilai Akhir',
    'Email',
  ]

  const colWidths = [6, 16, 20, 32, 26, 28, 18, 20, 18, 26, 20, 16, 12, 28]

  sheet.getRow(headerRowIndex).values = headers
  sheet.getRow(headerRowIndex).height = 26

  headers.forEach((_, idx) => {
    const colNumber = idx + 1
    const cell = sheet.getRow(headerRowIndex).getCell(colNumber)
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F223D' }, // Navy Deep Institusi
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    }
    sheet.getColumn(colNumber).width = colWidths[idx]
  })

  // 4. Baris Data Dosen (Sesuai Hasil Filter)
  let currentRow = headerRowIndex + 1

  dosens.forEach((d, idx) => {
    const row = sheet.getRow(currentRow)
    row.height = 20

    const matchedJab = jabatanList.find((j) => j.id === d.jabatanKampusId)
    const namaJabatan = matchedJab?.nama || (d as any).jabatan_kampus?.nama || d.jabatanStruktural || 'Dosen'
    const kampusLabel = d.kampus === 'Pusat' || !d.kampus ? 'Kampus Pusat' : d.kampus

    row.values = [
      idx + 1,
      d.nip ? String(d.nip) : '-',
      d.nuptk ? String(d.nuptk) : '-',
      d.nama || '-',
      d.fakultas || '-',
      d.prodi || '-',
      kampusLabel,
      d.jafung || '-',
      d.golongan || '-',
      namaJabatan,
      d.status || '-',
      d.skpStatus || 'Draft',
      typeof d.nilaiAkhir === 'number' ? Number(d.nilaiAkhir.toFixed(2)) : (d.nilaiAkhir || 0),
      d.email || '-',
    ]

    const isEven = idx % 2 === 1
    const rowBgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF'

    for (let c = 1; c <= headers.length; c++) {
      const cell = row.getCell(c)
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }

      if (c === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else if (c === 2 || c === 3) {
        cell.numFmt = '@' // Text format preserves leading zeroes in NIP/NUPTK
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else if (c === 7 || c === 8 || c === 9 || c === 11 || c === 12) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else if (c === 13) {
        cell.numFmt = '0.00'
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' }
      }
    }

    currentRow++
  })

  // 5. Aktifkan AutoFilter pada Kolom Header
  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: headers.length },
  }

  // 6. Tulis Buffer dan Unduh File (.xlsx)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url

  const filterSuffix = isFiltered ? '_Terfilter' : ''
  const dateStr = new Date().toISOString().slice(0, 10)
  anchor.download = `Master_Data_Dosen_UBK${filterSuffix}_${dateStr}.xlsx`

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}
