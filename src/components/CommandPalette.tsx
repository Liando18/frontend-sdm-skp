import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Users, BookOpen, FileCheck, Award, BarChart3, ArrowRight, UserCheck } from 'lucide-react'
import { Role } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  currentRole: Role
  onSelectNav: (navId: string) => void
  onSwitchRole?: (role: Role) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectNav,
}) => {
  const [query, setQuery] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.24, ease: GSAP_EASE.smooth }
      )
      const listItems = modalRef.current.querySelectorAll('.command-palette-item')
      if (listItems.length) {
        gsap.from(listItems, {
          opacity: 0,
          y: 6,
          duration: 0.2,
          stagger: 0.025,
          ease: GSAP_EASE.smooth,
        })
      }
    },
    { scope: modalRef, dependencies: [query] }
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const items = [
    // SDM
    { id: 'dashboard', label: 'Beranda Eksekutif', role: 'sdm', icon: BarChart3, desc: 'Ringkasan analitik kepegawaian & SKP' },
    { id: 'skp-sdm-self', label: 'Sasaran Kinerja Pegawai (SKP)', role: 'sdm', icon: FileCheck, desc: 'Pengisian SKP tugas jabatan SDM dinilai oleh Ka Prodi' },
    { id: 'hasil-kinerja-sdm', label: 'Hasil Kinerja Tahunan', role: 'sdm', icon: Award, desc: 'Hasil evaluasi perilaku BerAKHLAK tahunan SDM dari Ka Prodi' },
    { id: 'skp-dosen', label: 'Monitoring & Verifikasi SKP', role: 'sdm', icon: FileCheck, desc: 'Pengesahan dan rekapitulasi capaian SKP institusi' },
    { id: 'penilaian-kuesioner', label: 'Monitoring Kinerja Tahunan', role: 'sdm', icon: UserCheck, desc: 'Monitoring hasil kuesioner tahunan seluruh pegawai' },
    { id: 'data-dosen', label: 'Data Kepegawaian Dosen', role: 'sdm', icon: Users, desc: 'Master data dosen, NIP, NUPTK, jabatan fungsional & status' },
    { id: 'komponen-skp', label: 'Master Komponen SKP', role: 'sdm', icon: BookOpen, desc: 'Standar SPMI UBK per jenjang jabatan pegawai' },
    { id: 'indikator-kuesioner', label: 'Master Indikator Kinerja', role: 'sdm', icon: Award, desc: '7 Pilar perilaku kerja BerAKHLAK' },
    { id: 'laporan', label: 'Laporan & Rekapitulasi', role: 'sdm', icon: BarChart3, desc: 'Rekapitulasi resmi kinerja & arsip akreditasi' },

    // DOSEN
    { id: 'dashboard', label: 'Beranda Dosen', role: 'dosen', icon: BarChart3, desc: 'Ringkasan capaian Tridharma & status SKP' },
    { id: 'skp-dosen-self', label: 'Sasaran Kinerja Pegawai (SKP)', role: 'dosen', icon: FileCheck, desc: 'Pengisian rencana dan realisasi semester berjalan' },
    { id: 'hasil-kinerja-dosen', label: 'Hasil Kinerja Tahunan', role: 'dosen', icon: Award, desc: 'Hasil evaluasi perilaku BerAKHLAK dari Ketua Program Studi' },

    // KAPRODI
    { id: 'dashboard', label: 'Beranda Program Studi', role: 'kaprodi', icon: BarChart3, desc: 'Monitoring kinerja dosen prodi & status verifikasi' },
    { id: 'skp-kaprodi-self', label: 'Sasaran Kinerja Pegawai (SKP)', role: 'kaprodi', icon: FileCheck, desc: 'Formulir SKP jabatan Ka Prodi disahkan oleh Dekan' },
    { id: 'review-skp-kaprodi', label: 'Verifikasi SKP Dosen', role: 'kaprodi', icon: FileCheck, desc: 'Verifikasi bukti fisik dan pengesahan SKP dosen homebase' },
    { id: 'kuesioner-kaprodi', label: 'Evaluasi Kinerja Dosen', role: 'kaprodi', icon: Award, desc: 'Penilaian instrumen perilaku BerAKHLAK tahunan dosen' },
    { id: 'hasil-kinerja-kaprodi', label: 'Hasil Kinerja Tahunan', role: 'kaprodi', icon: Award, desc: 'Hasil evaluasi perilaku tahunan dari Dekan dan SDM' },

    // DEKAN
    { id: 'dashboard', label: 'Beranda Fakultas', role: 'dekan', icon: BarChart3, desc: 'Pengawasan kinerja mutu Tridharma fakultas' },
    { id: 'skp-dekan-self', label: 'Sasaran Kinerja Pegawai (SKP)', role: 'dekan', icon: FileCheck, desc: 'Formulir SKP Dekan dinilai oleh Ka Prodi homebase' },
    { id: 'review-skp-dekan', label: 'Verifikasi SKP Ketua Program Studi', role: 'dekan', icon: FileCheck, desc: 'Verifikasi dan pengesahan SKP seluruh Ka Prodi fakultas' },
    { id: 'kuesioner-dekan', label: 'Evaluasi Kinerja Ketua Program Studi', role: 'dekan', icon: Award, desc: 'Monitoring evaluasi perilaku BerAKHLAK tahunan Ka Prodi' },
    { id: 'hasil-kinerja-dekan', label: 'Hasil Kinerja Tahunan', role: 'dekan', icon: Award, desc: 'Hasil evaluasi kinerja Dekan oleh Ka Prodi homebase' },
  ]

  const filteredItems = items.filter(
    (item) =>
      (item.role === 'all' || item.role === currentRole) &&
      (item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-card"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
          <Search size={20} color="var(--g-600)" />
          <input
            type="text"
            placeholder="Cari menu, data dosen, atau fitur... (tekan Esc untuk tutup)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontFamily: 'inherit',
              background: 'transparent',
              color: 'var(--ink)',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 14px', maxHeight: '380px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px' }}>
            Menu Navigasi
          </div>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Tidak ada menu yang sesuai dengan "{query}"
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className="command-palette-item"
                  onClick={() => {
                    onSelectNav(item.id)
                    onClose()
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        background: 'var(--g-100)',
                        color: 'var(--g-700)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--muted)" />
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
