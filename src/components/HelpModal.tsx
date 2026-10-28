import React, { useRef } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: GSAP_EASE.smooth }
      )
    },
    { scope: modalRef, dependencies: [isOpen] }
  )

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-card modal-card--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={22} color="var(--brand-600)" />
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
                Buku Panduan SKP &amp; Kuesioner Dosen
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Direktorat SDM Universitas Bhakti Kencana Tahun 2026
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            aria-label="Tutup modal panduan"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
              1. Ketentuan Beban Kerja Dosen (BKD)
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Setiap dosen tetap Universitas Bhakti Kencana wajib memenuhi beban Tridharma minimal 12 SKS dan maksimal 16 SKS per semester yang mencakup Pengajaran, Penelitian, PKM, dan Penunjang.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
              2. Tata Cara Pengisian Kuesioner BerAKHLAK
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Penilaian perilaku menggunakan skala 1 (Kurang) sampai 4 (Sangat Baik). Indikator nomor 1 pada setiap aspek merupakan <strong>Critical Point (Poin Utama)</strong> yang menjadi syarat wajib untuk memperoleh nilai minimal Baik.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
              3. Format Nilai Akhir Kinerja Pegawai
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Nilai Kinerja Dosen dihitung dengan formula pembobotan resmi SPMI UBK: Nilai Kinerja = (Nilai SKP × 70%) + (Nilai Perilaku Kuesioner × 30%) sesuai Pedoman Evaluasi Kinerja No. 03.07.00/PD/SDM-SPMI.
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button
            className="brand-btn brand-btn--outline"
            onClick={onClose}
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  )
}
