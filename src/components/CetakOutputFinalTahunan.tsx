import React, { useState, useRef } from 'react'
import { Printer, X, FileText, CheckCircle2, ExternalLink } from 'lucide-react'
import { Dosen, PengajuanSKP, PenilaianKuesioner } from '../types'
import { useGSAP, gsap, GSAP_EASE } from '../utils/animations'

export interface OutputFinalData {
  dosen: Dosen
  tahunAkademik: string
  skpGanjil?: PengajuanSKP
  skpGenap?: PengajuanSKP
  kuesioner?: PenilaianKuesioner
  nilaiSKPGanjil: number
  nilaiSKPGenap: number
  rataRataSKP: number
  bobotSKP60: number
  nilaiKuisSkala4: number
  nilaiKuisSkala100: number
  bobotKuis40: number
  nilaiAkhirTahunan: number
  predikat: string
}

interface CetakOutputFinalTahunanProps {
  data: OutputFinalData | null
  isOpen: boolean
  onClose: () => void
}

export const CetakOutputFinalTahunan: React.FC<CetakOutputFinalTahunanProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'skp' | 'lampiran' | 'evaluasi' | 'dokumen'>('all')

  if (!isOpen || !data) return null

  const { dosen, tahunAkademik } = data

  const penilaiNama = data.skpGenap?.penilaiNama || 'Atasan Penilai'
  const penilaiNip = data.skpGenap?.penilaiNip || '-'
  const penilaiPangkat = data.skpGenap?.penilaiPangkat || '-'
  const penilaiJabatan = data.skpGenap?.penilaiJabatan || 'Pejabat Penilai Kinerja'
  const penilaiUnit = data.skpGenap?.penilaiUnit || dosen.prodi
  const tanggalCetak = data.skpGenap?.tanggalPenilaianDekan
    || data.skpGenap?.tanggalPenilaianKaprodi
    || data.skpGenap?.tanggalPengajuan
    || data.kuesioner?.tanggal 
    || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `Output Final - ${dosen.nama}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const modalRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!modalRef.current) return
      gsap.fromTo(
        modalRef.current,
        { scale: 0.96, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.26, ease: GSAP_EASE.smooth }
      )
    },
    { scope: modalRef }
  )

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        ref={modalRef}
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1020,
          width: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            borderBottom: '1px solid var(--hair)',
            background: 'var(--panel-bg)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Pratinjau Cetak: Output Final.pdf (Laporan Prestasi Kerja Tahunan)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Dokumen Lengkap Format Resmi UBK &bull; Dosen: <strong>{dosen.nama}</strong> (NIP: {dosen.nip})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              className="brand-btn"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <Printer size={15} />
              <span>Cetak / Unduh Output Final.pdf</span>
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 24px',
            borderBottom: '1px solid var(--hair)',
            background: 'var(--page-bg)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'Semua Bagian (Format Lengkap Output Final.pdf)' },
            { id: 'skp', label: '1. Sasaran Kinerja (SKP)' },
            { id: 'lampiran', label: '2. Lampiran SKP' },
            { id: 'evaluasi', label: '3. Evaluasi Kinerja & Bukti' },
            { id: 'dokumen', label: '4. Dokumen Evaluasi Akhir' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--navy-900)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Printable Document Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '36px 44px',
            background: '#ffffff',
            color: '#000000',
            fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '11.5px',
            lineHeight: 1.5,
          }}
        >
          {/* ====================================================================
              BAGIAN 1: SASARAN KINERJA PEGAWAI (HALAMAN 1 - 2)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'skp') && (
            <div style={{ marginBottom: 40 }}>
              {/* Header Hal. 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', marginBottom: 6 }}>
                <span>Hal. 1</span>
                <span>Dokumen milik {dosen.nama} ({dosen.nip})</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SASARAN KINERJA PEGAWAI
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  PENDEKATAN HASIL KERJA KUALITATIF BAGI PEJABAT ADMINISTRASI / FUNGSIONAL
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: 2 }}>
                  Universitas Bhakti Kencana &bull; Periode: TA {tahunAkademik}
                </div>
              </div>

              {/* Tabel Identitas Pegawai & Penilai */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #000000', marginBottom: 16 }}>
                {/* Kiri */}
                <div style={{ borderRight: '1.5px solid #000000' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', background: '#f1f5f9', borderBottom: '1px solid #000000', fontWeight: 800, padding: '4px 6px' }}>
                    <span>No</span>
                    <span>Pegawai yang Dinilai</span>
                  </div>
                  {[
                    { no: '1.', label: 'Nama', val: dosen.nama },
                    { no: '2.', label: 'NIP', val: dosen.nip },
                    { no: '3.', label: 'Pangkat / Gol.', val: dosen.golongan },
                    { no: '4.', label: 'Jabatan', val: dosen.jafung },
                    { no: '5.', label: 'Unit Kerja', val: dosen.prodi },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 110px 8px 1fr', padding: '3px 6px', borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ color: '#64748b' }}>{row.no}</span>
                      <span style={{ fontWeight: 600 }}>{row.label}</span>
                      <span>:</span>
                      <span style={{ fontWeight: 500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Kanan */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', background: '#f1f5f9', borderBottom: '1px solid #000000', fontWeight: 800, padding: '4px 6px' }}>
                    <span>No</span>
                    <span>Pejabat Penilai Kinerja</span>
                  </div>
                  {[
                    { no: '1.', label: 'Nama', val: penilaiNama },
                    { no: '2.', label: 'NIP', val: penilaiNip },
                    { no: '3.', label: 'Pangkat / Gol.', val: penilaiPangkat },
                    { no: '4.', label: 'Jabatan', val: penilaiJabatan },
                    { no: '5.', label: 'Unit Kerja', val: penilaiUnit },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 110px 8px 1fr', padding: '3px 6px', borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ color: '#64748b' }}>{row.no}</span>
                      <span style={{ fontWeight: 600 }}>{row.label}</span>
                      <span>:</span>
                      <span style={{ fontWeight: 500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rencana Hasil Kerja */}
              <div style={{ border: '1.5px solid #000000', padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', borderBottom: '1px solid #000000', paddingBottom: 4, marginBottom: 8 }}>
                  HASIL KERJA
                </div>

                <div style={{ fontWeight: 700, marginBottom: 4 }}>A. Utama</div>
                <div style={{ paddingLeft: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>1. Meningkatnya kualitas dan mutu pembelajaran yang sesuai dengan rencana strategis perguruan tinggi (Penugasan dari Rektor)</div>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                    Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                    <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                      <li>Melaksanakan perkuliahan di dalam / di luar lingkungan perguruan tinggi minimal 3 SKS per semester</li>
                      <li>Terlibat proses membimbing dan menguji Karya ilmiah</li>
                      <li>Membuat dan mengembangkan bahan ajar</li>
                    </ul>
                  </div>

                  <div style={{ fontWeight: 600, marginTop: 6 }}>2. Meningkatnya jumlah dan kualitas penelitian dosen (Penugasan dari Rektor)</div>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                    Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                    <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                      <li>100% publikasi karya ilmiah yang diterbitkan dalam jurnal nasional / Nasional terakreditasi minimal 1 buah per tahun</li>
                    </ul>
                  </div>

                  <div style={{ fontWeight: 600, marginTop: 6 }}>3. Meningkatnya kualitas kegiatan pengabdian kepada masyarakat (Penugasan dari Rektor)</div>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                    Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                    <ul style={{ margin: '2px 0 6px 16px', padding: 0 }}>
                      <li>Terlaksananya kegiatan pengabdian yang berdampak langsung terhadap masyarakat sejumlah 1 kegiatan / tahun</li>
                    </ul>
                  </div>
                </div>

                <div style={{ fontWeight: 700, marginBottom: 4, marginTop: 10 }}>B. Tambahan</div>
                <div style={{ paddingLeft: 10 }}>
                  <div style={{ fontWeight: 600 }}>1. Meningkatnya kualitas dosen tetap melalui unsur penunjang</div>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: 2, paddingLeft: 12 }}>
                    Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:
                    <ul style={{ margin: '2px 0 4px 16px', padding: 0 }}>
                      <li>Terlibat kegiatan pada perguruan tinggi</li>
                      <li>Terlaksananya peran aktiv dalam pertemuan ilmiah minimal sebanyak 1 buah</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Perilaku Kerja 7 BerAKHLAK */}
              <div style={{ border: '1.5px solid #000000', padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', borderBottom: '1px solid #000000', paddingBottom: 4, marginBottom: 8 }}>
                  PERILAKU KERJA
                </div>

                {[
                  {
                    no: '1.',
                    title: 'Berorientasi Pelayanan',
                    bullets: ['Memahami dan memenuhi kebutuhan masyarakat', 'Ramah, cekatan, solutif, dan dapat diandalkan', 'Melakukan perbaikan tiada henti'],
                    ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan dapat mengikuti ketentuan perguruan tinggi',
                  },
                  {
                    no: '2.',
                    title: 'Akuntabel',
                    bullets: ['Melaksanakan tugas dengan jujur, bertanggung jawab, cermat, disiplin, dan berintegritas tinggi', 'Menggunakan kekayaan dan barang milik negara secara bertanggung jawab, efektif, dan efisien', 'Tidak menyalahgunakan kewenangan jabatan'],
                    ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan dapat diandalkan dalam berbagai kegiatan',
                  },
                  {
                    no: '3.',
                    title: 'Kompeten',
                    bullets: ['Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah', 'Membantu orang lain belajar', 'Melaksanakan tugas dengan kualitas terbaik'],
                    ekspektasi: 'Pegawai selalu menunjukkan aspek perilaku kerja tersebut dan selalu siap dengan ide gagasannya',
                  },
                  {
                    no: '4.',
                    title: 'Harmonis',
                    bullets: ['Menghargai setiap orang apapun latar belakangnya', 'Suka menolong orang lain', 'Membangun lingkungan kerja yang kondusif'],
                    ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dan selalu siap diskusi dengan rekan kerja',
                  },
                  {
                    no: '5.',
                    title: 'Loyal',
                    bullets: ['Memegang teguh ideologi Pancasila, UUD 1945, setia pada NKRI serta pemerintahan yang sah', 'Menjaga nama baik sesama ASN/pegawai, Pimpinan, Instansi, dan Negara', 'Menjaga rahasia jabatan dan negara'],
                    ekspektasi: 'Pegawai dapat menerapkan aspek perilaku tersebut dan berintegritas yang baik',
                  },
                  {
                    no: '6.',
                    title: 'Adaptif',
                    bullets: ['Cepat menyesuaikan diri menghadapi perubahan', 'Terus berinovasi dan mengembangkan kreativitas', 'Bertindak proaktif'],
                    ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dan selalu membangun kreativitas dengan rekan kerja',
                  },
                  {
                    no: '7.',
                    title: 'Kolaboratif',
                    bullets: ['Memberi kesempatan kepada berbagai pihak untuk berkontribusi', 'Terbuka dalam bekerja sama untuk menghasilkan nilai tambah', 'Menggerakkan pemanfaatan berbagai sumberdaya untuk tujuan bersama'],
                    ekspektasi: 'Pegawai dapat menerapkan aspek perilaku kerja tersebut dengan melaksanakan proses kolaborasi dalam tridharma PT',
                  },
                ].map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: idx < 6 ? '1px dashed #cbd5e1' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 700 }}>{item.no} {item.title}</div>
                      <div style={{ fontSize: '11px', color: '#1e293b' }}>
                        <strong>Ekspektasi Khusus Pimpinan:</strong> <em>{item.ekspektasi}</em>
                      </div>
                    </div>
                    <ul style={{ margin: '2px 0 0 18px', padding: 0, fontSize: '11px', color: '#334155' }}>
                      {item.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Tanda Tangan Hal. 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, textAlign: 'center' }}>
                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 50 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pegawai yang Dinilai,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{dosen.nama}</div>
                  <div>NIP. {dosen.nip}</div>
                </div>

                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 50 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pejabat Penilai Kinerja,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{penilaiNama}</div>
                  <div>NIP. {penilaiNip}</div>
                </div>
              </div>

              <div className="page-break" style={{ height: 24 }} />
            </div>
          )}

          {/* ====================================================================
              BAGIAN 2: LAMPIRAN SASARAN KINERJA PEGAWAI (HALAMAN 3)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'lampiran') && (
            <div style={{ marginBottom: 40, borderTop: activeTab === 'all' ? '2px dashed #94a3b8' : 'none', paddingTop: activeTab === 'all' ? 24 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', marginBottom: 6 }}>
                <span>Hal. 3</span>
                <span>Dokumen milik {dosen.nama} ({dosen.nip})</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  LAMPIRAN SASARAN KINERJA PEGAWAI
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: 2 }}>
                  Universitas Bhakti Kencana &bull; Periode: TA {tahunAkademik}
                </div>
              </div>

              <div style={{ border: '1.5px solid #000000', padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Dukungan Sumber Daya</div>
                <ol style={{ margin: '0 0 14px 18px', padding: 0 }}>
                  <li>Dukungan SDM di lingkungan perguruan tinggi</li>
                  <li>Dukungan sarana prasarana pengajaran yang memadai</li>
                  <li>Dukungan pimpinan dalam pengambilan kebijakan terkait pengembangan kompetensi</li>
                  <li>Dukungan anggaran keuangan untuk mendukung tercapainya sasaran kinerja</li>
                </ol>

                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Skema Pertanggungjawaban</div>
                <ol style={{ margin: '0 0 14px 18px', padding: 0 }}>
                  <li>Tersedianya bukti kinerja setiap akhir semester</li>
                  <li>Pelaporan perkembangan rencana kinerja disampaikan secara berkala kepada Pimpinan Tinggi</li>
                </ol>

                <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: 4 }}>Konsekuensi</div>
                <ol style={{ margin: '0 0 4px 18px', padding: 0 }}>
                  <li>Rekomendasi peringkat hasil kerja akan kurang apabila capaian kinerja tidak sesuai dengan ekspektasi</li>
                  <li>Direkomendasikan mengikuti pengembangan kompetensi dosen</li>
                  <li>Capaian kinerja pegawai berpengaruh terhadap capaian kinerja organisasi</li>
                </ol>
              </div>

              {/* Tanda Tangan Hal. 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, textAlign: 'center' }}>
                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 50 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pegawai yang Dinilai,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{dosen.nama}</div>
                  <div>NIP. {dosen.nip}</div>
                </div>

                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 50 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pejabat Penilai Kinerja,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{penilaiNama}</div>
                  <div>NIP. {penilaiNip}</div>
                </div>
              </div>

              <div className="page-break" style={{ height: 24 }} />
            </div>
          )}

          {/* ====================================================================
              BAGIAN 3: EVALUASI KINERJA PEGAWAI PERIODE AKHIR TAHUNAN (HALAMAN 4 - 7)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'evaluasi') && (
            <div style={{ marginBottom: 40, borderTop: activeTab === 'all' ? '2px dashed #94a3b8' : 'none', paddingTop: activeTab === 'all' ? 24 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', marginBottom: 6 }}>
                <span>Hal. 4</span>
                <span>Dokumen milik {dosen.nama} ({dosen.nip})</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  EVALUASI KINERJA PEGAWAI PENDEKATAN HASIL KERJA KUALITATIF
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  BAGI PEJABAT ADMINISTRASI / FUNGSIONAL &bull; PERIODE: AKHIR* (TAHUNAN)
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, marginTop: 2 }}>
                  Universitas Bhakti Kencana &bull; Periode: TA {tahunAkademik}
                </div>
              </div>

              {/* Identitas Evaluasi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #000000', marginBottom: 14 }}>
                <div style={{ borderRight: '1.5px solid #000000', padding: '4px 6px' }}>
                  <div style={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>Pegawai yang Dinilai:</div>
                  <div>Nama: <strong>{dosen.nama}</strong> &bull; NIP: {dosen.nip}</div>
                  <div>Jabatan: {dosen.jafung} &bull; Unit: {dosen.prodi}</div>
                </div>
                <div style={{ padding: '4px 6px' }}>
                  <div style={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>Pejabat Penilai Kinerja:</div>
                  <div>Nama: <strong>{penilaiNama}</strong> &bull; NIP: {penilaiNip}</div>
                  <div>Jabatan: {penilaiJabatan} &bull; Unit: {penilaiUnit}</div>
                </div>
              </div>

              {/* Tabel Evaluasi Hasil Kerja & Umpan Balik */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', marginBottom: 14, fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #000000', textAlign: 'center' }}>
                    <th style={{ width: '42%', border: '1px solid #000000', padding: 6, textAlign: 'left' }}>HASIL KERJA</th>
                    <th style={{ width: '30%', border: '1px solid #000000', padding: 6 }}>Realisasi Berdasarkan Bukti Dukung</th>
                    <th style={{ width: '28%', border: '1px solid #000000', padding: 6 }}>Umpan Balik Berkelanjutan Pimpinan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={3} style={{ border: '1px solid #000000', padding: '5px 8px' }}>A. Utama</td>
                  </tr>

                  {/* 1. Pembelajaran */}
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700 }}>1. Meningkatnya kualitas dan mutu pembelajaran yang sesuai dengan renstra perguruan tinggi</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                        Target: Perkuliahan min. 3 SKS, bimbingan seminar, skripsi, menguji sidang, dan modul bahan ajar.
                      </div>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                      <div>Pengajaran mata kuliah TA {tahunAkademik}</div>
                      <a href="https://siakad.bku.ac.id/dokumen/pengajaran" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                        https://siakad.bku.ac.id/dokumen/pengajaran
                      </a>
                      <div style={{ marginTop: 4 }}>Membimbing karya ilmiah &amp; menguji sidang</div>
                      <a href="https://siakad.bku.ac.id/dokumen/skripsi" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                        https://siakad.bku.ac.id/dokumen/skripsi
                      </a>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                      Hasil kerja secara umum sudah baik dan mencukupi seluruh komponen standar SPMI yang dibutuhkan.
                    </td>
                  </tr>

                  {/* 2. Penelitian */}
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700 }}>2. Meningkatnya jumlah dan kualitas penelitian dosen</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                        Target: 100% publikasi karya ilmiah jurnal nasional terakreditasi SINTA / Internasional per tahun.
                      </div>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                      <div>Melakukan publikasi jurnal terakreditasi SINTA</div>
                      <a href="https://ejournal.bku.ac.id/article/view/129" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                        https://ejournal.bku.ac.id/article/view/129
                      </a>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                      Hasil publikasi pada periode tersebut sangat lebih dari cukup untuk dijadikan sebagai kewajiban khusus dosen.
                    </td>
                  </tr>

                  {/* 3. PKM */}
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700 }}>3. Meningkatnya kualitas kegiatan pengabdian kepada masyarakat (PKM)</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                        Target: Terlaksananya pengabdian yang berdampak langsung terhadap masyarakat sejumlah 1 kegiatan/tahun.
                      </div>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                      <div>Melaksanakan Pengabdian Masyarakat binaan desa sehat</div>
                      <a href="https://drive.google.com/drive/folders/pkm-bku" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                        https://drive.google.com/drive/folders/pkm-bku
                      </a>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                      Hasil kerja secara umum sudah baik dan dapat mengikuti setiap agenda kegiatan pengabdian institusi.
                    </td>
                  </tr>

                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={3} style={{ border: '1px solid #000000', padding: '5px 8px' }}>B. Tambahan</td>
                  </tr>

                  {/* 4. Penunjang */}
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700 }}>1. Meningkatnya kualitas dosen tetap melalui unsur penunjang</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 2 }}>
                        Target: Terlibat kegiatan kepanitiaan perguruan tinggi dan peran aktif seminar ilmiah minimal 1 buah.
                      </div>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontSize: '10.5px' }}>
                      <div>Melakukan seminar pertemuan ilmiah &amp; kepanitiaan di UBK</div>
                      <a href="https://siakad.bku.ac.id/dokumen/seminar-panitia.pdf" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                        https://siakad.bku.ac.id/dokumen/seminar-panitia.pdf
                      </a>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top', fontStyle: 'italic', background: '#fafafa' }}>
                      Hasil kerja secara umum sudah baik dan dapat mengikuti setiap kegiatan.
                    </td>
                  </tr>

                  {/* Rating & Predikat Box */}
                  <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right' }}>
                      RATING HASIL KERJA :
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#15803d' }}>
                      Sesuai Ekspektasi
                    </td>
                  </tr>
                  <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right' }}>
                      RATING PERILAKU :
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#15803d' }}>
                      Sesuai Ekspektasi
                    </td>
                  </tr>
                  <tr style={{ background: '#ffedd5', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontSize: '12px' }}>
                      PREDIKAT KINERJA PEGAWAI :
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'center', fontSize: '13px', color: '#c2410c' }}>
                      {data.predikat.toUpperCase()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan Hal. 7 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, textAlign: 'center' }}>
                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 50 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pejabat Penilai Kinerja,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{penilaiNama}</div>
                  <div>NIP. {penilaiNip}</div>
                </div>
              </div>

              <div className="page-break" style={{ height: 24 }} />
            </div>
          )}

          {/* ====================================================================
              BAGIAN 4: DOKUMEN EVALUASI KINERJA PEGAWAI (HALAMAN 8)
             ==================================================================== */}
          {(activeTab === 'all' || activeTab === 'dokumen') && (
            <div style={{ borderTop: activeTab === 'all' ? '2px dashed #94a3b8' : 'none', paddingTop: activeTab === 'all' ? 24 : 0 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  DOKUMEN EVALUASI KINERJA PEGAWAI
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  PERIODE: AKHIR* (TAHUNAN)
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, marginTop: 2 }}>
                  Universitas Bhakti Kencana &bull; Periode: TA {tahunAkademik}
                </div>
              </div>

              {/* Formulir 4 Butir Standar PermenPAN-RB */}
              <div style={{ border: '1.5px solid #000000', marginBottom: 20 }}>
                {/* 1. PEGAWAI YANG DINILAI */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>1. PEGAWAI YANG DINILAI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 8px 1fr', gap: 2, paddingLeft: 12 }}>
                    <span>NAMA</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{dosen.nama}</strong>
                    <span>NIP</span><span>:</span><span>{dosen.nip}</span>
                    <span>PANGKAT/GOL. RUANG</span><span>:</span><span>{dosen.golongan}</span>
                    <span>JABATAN</span><span>:</span><span>{dosen.jafung}</span>
                    <span>UNIT KERJA</span><span>:</span><span>{dosen.prodi}</span>
                  </div>
                </div>

                {/* 2. PEJABAT PENILAI KINERJA */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>2. PEJABAT PENILAI KINERJA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 8px 1fr', gap: 2, paddingLeft: 12 }}>
                    <span>NAMA</span><span>:</span><strong style={{ textTransform: 'uppercase' }}>{penilaiNama}</strong>
                    <span>NIP</span><span>:</span><span>{penilaiNip}</span>
                    <span>PANGKAT/GOL. RUANG</span><span>:</span><span>{penilaiPangkat}</span>
                    <span>JABATAN</span><span>:</span><span>{penilaiJabatan}</span>
                    <span>UNIT KERJA</span><span>:</span><span>{penilaiUnit}</span>
                  </div>
                </div>

                {/* 3. EVALUASI KINERJA */}
                <div style={{ borderBottom: '1px solid #000000', padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>3. EVALUASI KINERJA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 8px 1fr', gap: 2, paddingLeft: 12 }}>
                    <span>CAPAIAN KINERJA ORGANISASI</span><span>:</span><strong>Baik</strong>
                    <span>PREDIKAT KINERJA PEGAWAI</span><span>:</span><strong style={{ color: '#c2410c' }}>{data.predikat.toUpperCase()}</strong>
                  </div>
                </div>

                {/* 4. CATATAN / REKOMENDASI */}
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>4. CATATAN / REKOMENDASI</div>
                  <div style={{ paddingLeft: 12, color: '#334155' }}>
                    Dosen yang bersangkutan menunjukkan kinerja Tridharma yang konsisten memenuhi standar SPMI UBK, telah menyelesaikan seluruh pelaporan BKD Semester Ganjil &amp; Genap secara lengkap, dan direkomendasikan untuk pemenuhan syarat Kenaikan Jabatan Akademik Dosen (JAD) tahunan.
                  </div>
                </div>
              </div>

              {/* Tanda Tangan Pengesahan Akhir */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, textAlign: 'center' }}>
                <div style={{ width: 240 }}>
                  <div style={{ marginBottom: 60 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pegawai yang Dinilai,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{dosen.nama}</div>
                  <div>NIP. {dosen.nip}</div>
                </div>

                <div style={{ width: 240 }}>
                  <div style={{ marginBottom: 60 }}>
                    <div>Bandung, {tanggalCetak}</div>
                    <div style={{ fontWeight: 700 }}>Pejabat Penilai Kinerja,</div>
                  </div>
                  <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{penilaiNama}</div>
                  <div>NIP. {penilaiNip}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
