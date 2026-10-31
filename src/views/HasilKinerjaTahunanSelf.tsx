import React, { useState, useRef, useMemo } from 'react'
import {
  Award,
  Filter,
  Clock,
  Printer,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { PenilaianKuesioner, UserSession } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { CetakTranskripKuesioner } from '../components/CetakTranskripKuesioner'
import { openPrintTranskrip } from '../utils/printTranskrip'

interface HasilKinerjaTahunanSelfProps {
  user: UserSession
  penilaianList: PenilaianKuesioner[]
  onShowToast: (msg: string) => void
}

const BERAKHLAK_DIMENSIONS = [
  {
    key: 'nilaiPelayanan' as const,
    label: '1. Orientasi Pelayanan',
    sub: 'Sikap ramah, solutif, menghargai mahasiswa dan sivitas akademika, serta mematuhi standar pelayanan akademik.',
  },
  {
    key: 'nilaiAkuntabel' as const,
    label: '2. Akuntabel',
    sub: 'Jujur, bertanggung jawab, disiplin waktu, berintegritas tinggi, dan objektif dalam manajemen kepemimpinan.',
  },
  {
    key: 'nilaiKompeten' as const,
    label: '3. Kompeten',
    sub: 'Meningkatkan kompetensi keilmuan secara berkelanjutan dan membina rekan sejawat mencapai standar mutu tridharma.',
  },
  {
    key: 'nilaiHarmonis' as const,
    label: '4. Harmonis',
    sub: 'Membangun iklim kerja program studi yang kondusif, toleran, dan sinergis antardosen dan staf.',
  },
  {
    key: 'nilaiLoyal' as const,
    label: '5. Loyal',
    sub: 'Memegang teguh visi misi Universitas Bhakti Kencana, menjaga martabat institusi, dan berdedikasi tinggi.',
  },
  {
    key: 'nilaiAdaptif' as const,
    label: '6. Adaptif',
    sub: 'Cepat menyesuaikan tata kelola prodi terhadap regulasi MBKM, transformasi kurikulum, dan sistem Siakad UBK.',
  },
  {
    key: 'nilaiKolaboratif' as const,
    label: '7. Kolaboratif',
    sub: 'Mendorong sinergi riset lintas fakultas, kerja sama institusi faskes mitra, dan pemanfaatan sumber daya bersama.',
  },
]

export const HasilKinerjaTahunanSelf: React.FC<HasilKinerjaTahunanSelfProps> = ({
  user,
  penilaianList,
  onShowToast,
}) => {
  const availableYears = useMemo(() => {
    const years = Array.from(new Set([...penilaianList.map((p) => p.tahun).filter(Boolean), '2026/2027', '2025/2026', '2024/2025']))
    return years.sort().reverse()
  }, [penilaianList])

  const [selectedTahun, setSelectedTahun] = useState<string>('2026/2027')
  const [showCetakTranskrip, setShowCetakTranskrip] = useState(false)

  // Find user's annual evaluation for selected academic year
  const myEvaluation = penilaianList.find(
    (p) =>
      (p.dosenId === user.id || p.dosenNama === user.name) &&
      p.tahun === selectedTahun &&
      p.periode === 'Tahunan'
  )

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.evaluation-card', [selectedTahun, myEvaluation?.id], {
    y: 8,
    stagger: 0.04,
  })

  const isDekan = user.role === 'dekan'
  const isKaprodi = user.role === 'kaprodi'
  const isSDM = user.role === 'sdm'

  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hasil Evaluasi Kinerja Tahunan</h1>
          <p className="page-desc">
            {isDekan
              ? 'Laporan hasil penilaian kinerja perilaku BerAKHLAK tahunan Dekan Fakultas oleh Ketua Program Studi homebase.'
              : isKaprodi
              ? 'Laporan hasil penilaian kinerja perilaku BerAKHLAK tahunan Ketua Program Studi oleh Dekan Fakultas & SDM.'
              : isSDM
              ? 'Laporan hasil penilaian kinerja perilaku BerAKHLAK tahunan Tenaga Kependidikan / SDM oleh Ketua Program Studi.'
              : 'Laporan hasil penilaian kinerja perilaku BerAKHLAK tahunan Dosen oleh Ketua Program Studi.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!myEvaluation) {
              onShowToast?.('Hasil kinerja tahunan belum dapat dicetak karena belum dinilai/disetujui oleh pimpinan.')
              return
            }
            openPrintTranskrip({
              penilaian: myEvaluation,
              dosenNama: user.name,
              dosenNip: user.nip || '',
              dosenNuptk: user.nuptk || '',
              dosenProdi: user.prodi || 'Program Studi',
              tahunAkademik: selectedTahun,
            })
          }}
          className="brand-btn btn-action-print"
          style={{
            padding: '9px 18px',
            gap: 6,
            opacity: myEvaluation ? 1 : 0.45,
            cursor: myEvaluation ? 'pointer' : 'not-allowed',
          }}
          disabled={!myEvaluation}
          title={
            myEvaluation
              ? 'Cetak Transkrip Evaluasi BerAKHLAK Resmi di Tab Baru'
              : 'Belum dapat dicetak (Kinerja belum dinilai/disetujui oleh pimpinan)'
          }
        >
          <Printer size={15} />
          <span>{myEvaluation ? 'Cetak Transkrip' : 'Belum Disetujui'}</span>
        </button>
      </div>

      {/* Filter Toolbar (Tahun Ajaran Saja) */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 22px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--navy-900)',
              fontWeight: 700,
              fontSize: '13.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Filter size={17} color="var(--brand-600)" />
            <span>Periode Tahun Ajaran</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--hair)', display: 'inline-block' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Tahun Ajaran
            </span>
            <select
              className="custom-select"
              style={{
                height: 38,
                width: 'auto',
                minWidth: 160,
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
                border: '1px solid var(--hair-strong)',
                boxShadow: 'var(--shadow-xs)',
              }}
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
            >
              {availableYears.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Pegawai: <strong style={{ color: 'var(--ink)' }}>{user.name}</strong> &bull; NIP: <strong>{user.nip}</strong> &bull; {user.prodi}
        </div>
      </div>

      {myEvaluation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {/* Top Overview Cards */}
          <div className="kpi-bento-grid-3">
            {/* Card 1: Skor Rata-rata */}
            <div className="kpi-card evaluation-card">
              <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Skor Rata-rata BerAKHLAK
              </span>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {myEvaluation.rataRata.toFixed(2)}{' '}
                  <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>/ 4.00</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span
                    className={`kpi-badge ${
                      myEvaluation.predikat === 'Sangat Baik'
                        ? 'badge-pill--green'
                        : myEvaluation.predikat === 'Baik'
                        ? 'badge-pill--blue'
                        : 'badge-pill--orange'
                    }`}
                  >
                    <Award size={12} />
                    <span>Predikat: {myEvaluation.predikat}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Disetujui Oleh */}
            <div className="kpi-card evaluation-card">
              <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Disetujui Oleh
              </span>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.2 }}>
                  {myEvaluation.penilaiNama}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>
                  Kapasitas: {myEvaluation.penilaiRole === 'Kaprodi' ? 'Ketua Program Studi' : myEvaluation.penilaiRole === 'Dekan' ? 'Dekan / Pimpinan' : 'Direktorat SDM'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="kpi-badge">
                    <UserCheck size={12} />
                    <span>Persetujuan: {myEvaluation.penilaiRole}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Tanggal & Status */}
            <div className="kpi-card evaluation-card">
              <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
                Status Validasi Institusi
              </span>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-success-ink)', lineHeight: 1.2 }}>
                  Terverifikasi SPMI UBK
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>
                  Disahkan tanggal: {myEvaluation.tanggal}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span
                    className="kpi-badge"
                    style={{
                      background: 'var(--status-success-bg)',
                      color: 'var(--status-success-ink)',
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>Siklus Tahunan Selesai</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 7 Dimensions Breakdown */}
          <div
            className="evaluation-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              padding: '24px 28px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 4 }}>
              Rincian Capaian 7 Dimensi Perilaku BerAKHLAK
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 18 }}>
              Evaluasi komprehensif atas pelaksanaan tugas, integritas, dan budaya kerja di Universitas Bhakti Kencana.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BERAKHLAK_DIMENSIONS.map((dim) => {
                const score = Number(myEvaluation[dim.key] || 0)
                const percent = (score / 4) * 100
                return (
                  <div
                    key={dim.key}
                    style={{
                      background: 'var(--panel-hover)',
                      border: '1px solid var(--hair)',
                      borderRadius: 'var(--r-md)',
                      padding: '12px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--navy-900)' }}>
                        {dim.label}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--brand-700)' }}>
                        Skor: {score} / 4
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 3 }}>
                      {dim.sub}
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: '#ffffff',
                        border: '1px solid var(--hair)',
                        borderRadius: '999px',
                        marginTop: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background:
                            score >= 4
                              ? 'var(--status-success-ink)'
                              : score === 3
                              ? 'var(--brand-500)'
                              : 'var(--status-error-ink)',
                          borderRadius: '999px',
                          transition: 'width 0.4s var(--ease)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Official Feedback Note */}
            <div
              style={{
                marginTop: 20,
                background: '#ffffff',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-lg)',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 6 }}>
                Catatan Pembinaan &amp; Rekomendasi Pimpinan:
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--ink)',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                  background: 'var(--panel-hover)',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '3px solid var(--brand-500)',
                }}
              >
                "{myEvaluation.catatan || 'Kinerja pelaksanaan tugas jabatan sangat tertib, profesional, dan akuntabel.'}"
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--r-xl)',
            padding: '48px 24px',
            border: '1px solid var(--hair)',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          <Clock size={40} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
            Belum Ada Hasil Evaluasi Kinerja untuk Tahun Ajaran {selectedTahun}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: 460, margin: '8px auto 0' }}>
            {isDekan
              ? 'Evaluasi kinerja tahunan Dekan oleh Ka Prodi homebase belum diterbitkan untuk periode ini.'
              : isKaprodi
              ? 'Evaluasi kinerja tahunan Ketua Program Studi oleh Dekan Fakultas belum diterbitkan untuk periode ini.'
              : 'Evaluasi kinerja tahunan Dosen oleh Ketua Program Studi belum diterbitkan untuk periode ini.'}
          </p>
        </div>
      )}

      {/* Modal Cetak Transkrip BerAKHLAK Standar A4 Resmi */}
      {showCetakTranskrip && myEvaluation && (
        <CetakTranskripKuesioner
          isOpen={showCetakTranskrip}
          onClose={() => setShowCetakTranskrip(false)}
          penilaian={myEvaluation}
          dosenNama={user.name}
          dosenNip={user.nip || '-'}
          dosenProdi={user.prodi || 'Universitas Bhakti Kencana'}
          tahunAkademik={selectedTahun}
        />
      )}
    </div>
  )
}
