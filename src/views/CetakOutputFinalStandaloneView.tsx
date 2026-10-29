import React, { useEffect, useState } from 'react'
import { OutputFinalData, CetakOutputFinalTahunan } from '../components/CetakOutputFinalTahunan'

export const CetakOutputFinalStandaloneView: React.FC = () => {
  const [data, setData] = useState<OutputFinalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Pastikan scrolling window/body aktif secara global saat halaman pratinjau cetak terbuka
    document.documentElement.classList.add('print-mode')
    document.body.classList.add('print-mode')

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevHtmlHeight = document.documentElement.style.height
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyHeight = document.body.style.height

    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important')
    document.documentElement.style.setProperty('height', 'auto', 'important')
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.body.style.setProperty('overflow-y', 'auto', 'important')
    document.body.style.setProperty('height', 'auto', 'important')

    return () => {
      document.documentElement.classList.remove('print-mode')
      document.body.classList.remove('print-mode')
      document.documentElement.style.overflow = prevHtmlOverflow
      document.documentElement.style.height = prevHtmlHeight
      document.body.style.overflow = prevBodyOverflow
      document.body.style.height = prevBodyHeight
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const dosenId = urlParams.get('id')

    try {
      const raw = dosenId
        ? localStorage.getItem(`ubk_print_output_final_${dosenId}`) || localStorage.getItem('ubk_print_output_final_data')
        : localStorage.getItem('ubk_print_output_final_data')

      if (raw) {
        const parsed = JSON.parse(raw) as OutputFinalData
        if (parsed?.dosen) {
          setData(parsed)
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache Output Final:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Memuat Laporan Output Final Resmi...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 460, background: '#ffffff', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Data Tidak Ditemukan</div>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
            Data rekapitulasi Output Final Prestasi Kerja Tahunan tidak ditemukan di penyimpanan sesi.
          </p>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          >
            Tutup Halaman Ini
          </button>
        </div>
      </div>
    )
  }

  return (
    <CetakOutputFinalTahunan
      data={data}
      isOpen={true}
      isStandalone={true}
      onClose={() => window.close()}
    />
  )
}
