import React, { useState, useRef } from 'react'
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Filter,
} from 'lucide-react'
import { Dosen, PenilaianKuesioner, UserSession, IndikatorKuesioner } from '../types'
import { useStaggerEntrance } from '../utils/animations'

interface KelolaKuesionerKaprodiProps {
  user: UserSession
  dosenList: Dosen[]
  penilaianList: PenilaianKuesioner[]
  indikatorList?: IndikatorKuesioner[]
  onSaveKuesioner: (penilaian: PenilaianKuesioner) => void
  onShowToast: (msg: string) => void
}

const TAHUN_AJARAN_OPTIONS = ['2025/2026', '2024/2025', '2026/2027']

const BERAKHLAK_DIMENSIONS = [
  {
    key: 'nilaiPelayanan',
    label: '1. Orientasi Pelayanan',
    sub: 'Sikap ramah, solutif, menghargai mahasiswa dan sivitas akademika, serta mematuhi standar pelayanan akademik.',
  },
  {
    key: 'nilaiAkuntabel',
    label: '2. Akuntabel',
    sub: 'Jujur, bertanggung jawab, disiplin waktu mengajar, berintegritas tinggi, dan objektif dalam evaluasi nilai.',
  },
  {
    key: 'nilaiKompeten',
    label: '3. Kompeten',
    sub: 'Meningkatkan kompetensi keilmuan secara berkelanjutan dan membantu mahasiswa mencapai capaian pembelajaran terbaik.',
  },
  {
    key: 'nilaiHarmonis',
    label: '4. Harmonis',
    sub: 'Membangun lingkungan kerja yang kondusif, toleran, dan saling tolong-menolong di lingkungan program studi.',
  },
  {
    key: 'nilaiLoyal',
    label: '5. Loyal',
    sub: 'Memegang teguh visi misi Universitas Bhakti Kencana, menjaga nama baik almamater, dan berdedikasi tinggi.',
  },
  {
    key: 'nilaiAdaptif',
    label: '6. Adaptif',
    sub: 'Cepat beradaptasi terhadap inovasi kurikulum, kurikulum MBKM, sistem LMS, dan teknologi Siakad UBK.',
  },
  {
    key: 'nilaiKolaboratif',
    label: '7. Kolaboratif',
    sub: 'Mendorong kerja sama Tridharma antardisiplin, riset bersama, dan pengabdian masyarakat lintas bidang.',
  },
]

export const KelolaKuesionerKaprodi: React.FC<KelolaKuesionerKaprodiProps> = ({
  user,
  dosenList,
  penilaianList,
  indikatorList = [],
  onSaveKuesioner,
  onShowToast,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>('2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'evaluate'>('list')
  const [activeDosen, setActiveDosen] = useState<Dosen | null>(null)

  const [kuisScores, setKuisScores] = useState({
    nilaiPelayanan: 4,
    nilaiAkuntabel: 4,
    nilaiKompeten: 4,
    nilaiHarmonis: 4,
    nilaiLoyal: 4,
    nilaiAdaptif: 4,
    nilaiKolaboratif: 4,
    catatan: '',
  })

  // Dosen homebase prodi (excluding Kaprodi himself)
  const prodiDosen = dosenList.filter(
    (d) => d.prodi === user.prodi && !d.isKaprodi
  )

  const filteredDosen = prodiDosen.filter((d) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.nama.toLowerCase().includes(q) || (d.nuptk && d.nuptk.toLowerCase().includes(q)) || d.nip.toLowerCase().includes(q)
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredDosen, selectedTahun, viewMode], {
    y: 8,
    stagger: 0.035,
  })

  // Open evaluation form
  const handleOpenEvaluate = (dosen: Dosen) => {
    setActiveDosen(dosen)

    // Check if evaluation already exists for this dosen & academic year
    const existing = penilaianList.find(
      (p) =>
        (p.dosenId === dosen.id || p.dosenNama === dosen.nama) &&
        (p.tahun === selectedTahun || p.tahun === selectedTahun.split('/')[0])
    )

    if (existing) {
      setKuisScores({
        nilaiPelayanan: existing.nilaiPelayanan || 4,
        nilaiAkuntabel: existing.nilaiAkuntabel || 4,
        nilaiKompeten: existing.nilaiKompeten || 4,
        nilaiHarmonis: existing.nilaiHarmonis || 4,
        nilaiLoyal: existing.nilaiLoyal || 4,
        nilaiAdaptif: existing.nilaiAdaptif || 4,
        nilaiKolaboratif: existing.nilaiKolaboratif || 4,
        catatan: existing.catatan || '',
      })
    } else {
      setKuisScores({
        nilaiPelayanan: 4,
        nilaiAkuntabel: 4,
        nilaiKompeten: 4,
        nilaiHarmonis: 4,
        nilaiLoyal: 4,
        nilaiAdaptif: 4,
        nilaiKolaboratif: 4,
        catatan: '',
      })
    }
    setViewMode('evaluate')
  }

  const currentAverage = (
    (Number(kuisScores.nilaiPelayanan) +
      Number(kuisScores.nilaiAkuntabel) +
      Number(kuisScores.nilaiKompeten) +
      Number(kuisScores.nilaiHarmonis) +
      Number(kuisScores.nilaiLoyal) +
      Number(kuisScores.nilaiAdaptif) +
      Number(kuisScores.nilaiKolaboratif)) /
    7
  ).toFixed(2)

  const currentPredikat =
    Number(currentAverage) >= 3.75
      ? 'Sangat Baik'
      : Number(currentAverage) >= 3.0
      ? 'Baik'
      : Number(currentAverage) >= 2.0
      ? 'Cukup'
      : 'Kurang'

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDosen) return

    const avg = Number(currentAverage)
    const newPenilaian: PenilaianKuesioner = {
      id: `kuis-${activeDosen.id}-${selectedTahun.replace('/', '-')}`,
      dosenId: activeDosen.id,
      dosenNama: activeDosen.nama,
      dosenProdi: activeDosen.prodi,
      penilaiNama: user.name,
      penilaiRole: 'Kaprodi',
      targetRole: 'Dosen',
      periode: 'Tahunan',
      tahun: selectedTahun,
      nilaiPelayanan: Number(kuisScores.nilaiPelayanan),
      nilaiAkuntabel: Number(kuisScores.nilaiAkuntabel),
      nilaiKompeten: Number(kuisScores.nilaiKompeten),
      nilaiHarmonis: Number(kuisScores.nilaiHarmonis),
      nilaiLoyal: Number(kuisScores.nilaiLoyal),
      nilaiAdaptif: Number(kuisScores.nilaiAdaptif),
      nilaiKolaboratif: Number(kuisScores.nilaiKolaboratif),
      rataRata: avg,
      predikat: currentPredikat,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      catatan: kuisScores.catatan || '',
    }

    onSaveKuesioner(newPenilaian)
    setViewMode('list')
    onShowToast(`Penilaian kuesioner perilaku tahunan untuk ${activeDosen.nama} berhasil disimpan!`)
  }

  // Sub-view: Form Penilaian Kuesioner Tahunan
  if (viewMode === 'evaluate' && activeDosen) {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar Kuesioner Dosen</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              Penilaian Kuesioner Perilaku Tahunan: {activeDosen.nama}
            </h1>
            <p className="page-desc">
              Instrumen evaluasi perilaku BerAKHLAK 7 dimensi (dilakukan 1 kali setahun) untuk Tahun Akademik {selectedTahun}.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="form-page-card">
          <div className="form-section">
            <div>
              <div className="form-section-title">1. Identitas Dosen yang Dievaluasi</div>
              <div className="form-section-desc">Data dosen homebase program studi {user.prodi}.</div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                background: 'var(--panel-hover)',
                padding: '16px 20px',
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--hair)',
              }}
            >
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Nama Dosen</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                  {activeDosen.nama}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>NIP / NUPTK</div>
                <div style={{ fontSize: '13.5px', color: 'var(--ink)', marginTop: 2 }}>
                  NIP: {activeDosen.nip} &bull; NUPTK: {activeDosen.nuptk || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Periode Evaluasi</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 2 }}>
                  Tahunan {selectedTahun} (1x Setahun)
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div>
              <div className="form-section-title">2. Penilaian 7 Nilai Inti BerAKHLAK</div>
              <div className="form-section-desc">Pilihlah skala 1 sampai 4 untuk masing-masing dimensi perilaku kerja dosen.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BERAKHLAK_DIMENSIONS.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ maxWidth: 460 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {item.sub}
                    </div>
                    {(() => {
                      const keyword = item.label.split('.')[1]?.trim().toLowerCase() || ''
                      const count = (indikatorList || []).filter(
                        (ind) =>
                          ind.aspek.toLowerCase().includes(keyword) ||
                          keyword.includes(ind.aspek.toLowerCase())
                      ).length
                      return count > 0 ? (
                        <div style={{ marginTop: 6 }}>
                          <span
                            className="badge-pill badge-pill--blue"
                            style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>{count} Butir Indikator SDM Aktif</span>
                          </span>
                        </div>
                      ) : null
                    })()}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { val: 1, label: '1 - Kurang' },
                      { val: 2, label: '2 - Cukup' },
                      { val: 3, label: '3 - Baik' },
                      { val: 4, label: '4 - Sangat Baik' },
                    ].map((opt) => {
                      const scoreKey = item.key as keyof typeof kuisScores
                      const isSelected = kuisScores[scoreKey] === opt.val
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setKuisScores({ ...kuisScores, [item.key]: opt.val })}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 'var(--r-sm)',
                            border: isSelected ? '1.5px solid var(--brand-600)' : '1px solid var(--hair)',
                            background: isSelected ? 'var(--brand-100)' : 'var(--card-bg)',
                            color: isSelected ? 'var(--brand-700)' : 'var(--muted)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s var(--ease)',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Skor Berjalan */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--brand-50)',
                border: '1px solid var(--brand-100)',
                marginTop: 8,
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-700)' }}>
                  Rata-rata Skor BerAKHLAK Tahunan
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Skala 1.00 sampai 4.00</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
                  {currentAverage}
                </span>
                <span
                  className={`badge-pill ${
                    currentPredikat === 'Sangat Baik'
                      ? 'badge-pill--green'
                      : currentPredikat === 'Baik'
                      ? 'badge-pill--blue'
                      : 'badge-pill--orange'
                  }`}
                >
                  {currentPredikat}
                </span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div>
              <div className="form-section-title">3. Catatan Evaluasi &amp; Pembinaan Kaprodi</div>
              <div className="form-section-desc">Umpan balik profesional dan arahan pengembangan Tridharma dosen.</div>
            </div>

            <div className="form-field">
              <label className="form-label">Catatan Perilaku Kerja Tahunan</label>
              <textarea
                rows={3}
                className="custom-input"
                value={kuisScores.catatan}
                onChange={(e) => setKuisScores({ ...kuisScores, catatan: e.target.value })}
                placeholder="Tuliskan umpan balik evaluasi perilaku kerja..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10 }}>
            <button
              type="button"
              className="btn-action-print"
              style={{ padding: '9px 22px' }}
              onClick={() => setViewMode('list')}
            >
              Batal
            </button>
            <button type="submit" className="btn-action-add" style={{ padding: '9px 24px' }}>
              <Award size={15} />
              <span>Simpan Penilaian Kuesioner</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Master List View
  return (
    <div className="page-container" ref={containerRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Penilaian Kuesioner Perilaku Dosen</h1>
          <p className="page-desc">
            Evaluasi perilaku kerja BerAKHLAK 7 dimensi oleh Ketua Program Studi kepada dosen homebase prodi {user.prodi}. Penilaian kuesioner ini dilakukan 1 kali setahun (tahunan).
          </p>
        </div>
      </div>

      {/* Guide Banner */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '20px 24px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--r-md)',
            background: 'var(--brand-100)',
            color: 'var(--brand-700)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Award size={20} />
        </div>
        <div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
            Pelaksanaan Evaluasi Kuesioner Perilaku (Tahunan)
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
            Kuesioner perilaku kerja dievaluasi satu kali setiap tahun akademik (bobot 40% pada Laporan Rekapitulasi Akhir UBK). Instrumen mencakup 7 dimensi BerAKHLAK dengan skala 1.00 sampai 4.00.
          </div>
        </div>
      </div>

      {/* Filter Toolbar (HANYA Tahun Ajaran & Pencarian - Sesuai Permintaan Pengguna) */}
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
            <span>Filter Kuesioner Tahunan</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--hair)', display: 'inline-block' }} />

          {/* Dropdown Tahun Ajaran SAJA */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Tahun Ajaran
            </span>
            <select
              className="custom-select"
              style={{
                height: 38,
                width: 'auto',
                minWidth: 170,
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
              }}
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
            >
              {TAHUN_AJARAN_OPTIONS.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn} (Tahunan)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="search" style={{ minWidth: 260 }}>
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Cari dosen, NIP, atau NUPTK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table Dosen Homebase & Nilai Kuesioner */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Dosen Homebase</th>
              <th>Jabatan Fungsional</th>
              <th>Periode Evaluasi</th>
              <th>Status Kuesioner</th>
              <th>Rata-rata Skor</th>
              <th>Predikat</th>
              <th style={{ textAlign: 'right' }}>Aksi Kaprodi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDosen.map((dosen) => {
              const penilaian = penilaianList.find(
                (p) =>
                  (p.dosenId === dosen.id || p.dosenNama === dosen.nama) &&
                  (p.tahun === selectedTahun || p.tahun === selectedTahun.split('/')[0])
              )
              const hasEvaluated = Boolean(penilaian)
              const avgScore = penilaian ? penilaian.rataRata.toFixed(2) : '-'
              const predikat = penilaian ? penilaian.predikat : '-'

              return (
                <tr key={dosen.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
                      {dosen.nama}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                      NIP: {dosen.nip} &bull; NUPTK: {dosen.nuptk || '-'}
                    </div>
                  </td>
                  <td>
                    {dosen.jafung} ({dosen.golongan})
                  </td>
                  <td>
                    <span className="badge-pill badge-pill--gray" style={{ fontSize: '11.5px' }}>
                      Tahunan {selectedTahun}
                    </span>
                  </td>
                  <td>
                    {hasEvaluated ? (
                      <span className="badge-pill badge-pill--green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} />
                        <span>Sudah Dinilai</span>
                      </span>
                    ) : (
                      <span className="badge-pill badge-pill--orange" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>Belum Dinilai</span>
                      </span>
                    )}
                  </td>
                  <td>
                    {hasEvaluated ? (
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)' }}>
                          {avgScore}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}> / 4.00</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--faint)' }}>-</span>
                    )}
                  </td>
                  <td>
                    {hasEvaluated ? (
                      <span
                        className={`badge-pill ${
                          predikat === 'Sangat Baik'
                            ? 'badge-pill--green'
                            : predikat === 'Baik'
                            ? 'badge-pill--blue'
                            : 'badge-pill--orange'
                        }`}
                      >
                        {predikat}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--faint)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={hasEvaluated ? 'btn-action-edit' : 'btn-action-add'}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleOpenEvaluate(dosen)}
                    >
                      <Award size={13} />
                      <span>{hasEvaluated ? 'Ubah Penilaian' : 'Nilai Kuesioner'}</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
