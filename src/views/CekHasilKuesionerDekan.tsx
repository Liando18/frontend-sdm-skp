import React, { useState, useRef, useMemo } from 'react'
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  X,
  Printer,
  Users,
  Building2,
  Calendar,
  Plus,
  Edit2,
  Check,
  CheckSquare,
  Sparkles,
} from 'lucide-react'
import { Dosen, PenilaianKuesioner, UserSession, IndikatorKuesioner, ProgramStudi, Fakultas } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { CetakTranskripKuesioner } from '../components/CetakTranskripKuesioner'
import { openPrintTranskrip } from '../utils/printTranskrip'

interface CekHasilKuesionerDekanProps {
  user: UserSession
  dosenList: Dosen[]
  penilaianList: PenilaianKuesioner[]
  indikatorList?: IndikatorKuesioner[]
  prodiList?: ProgramStudi[]
  fakultasList?: Fakultas[]
  onSavePenilaian?: (penilaian: PenilaianKuesioner) => void
  onShowToast: (msg: string) => void
}

const TAHUN_AJARAN_OPTIONS = ['2026/2027', '2025/2026', '2024/2025']

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

export const CekHasilKuesionerDekan: React.FC<CekHasilKuesionerDekanProps> = ({
  user,
  dosenList,
  penilaianList,
  prodiList = [],
  fakultasList = [],
  onSavePenilaian,
  onShowToast,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>('2026/2027')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDetailItem, setActiveDetailItem] = useState<{
    dosen: Dosen
    penilaian: PenilaianKuesioner | null
  } | null>(null)

  const [transcriptToPrint, setTranscriptToPrint] = useState<{
    dosen: Dosen
    penilaian: PenilaianKuesioner
  } | null>(null)

  // Filter kaprodi khusus dari fakultas yang dekan pimpin
  const dekanFakultasId = user.fakultasId || (user as any).fakultas_id
  const dekanFakultasName = (user.fakultas || '').toLowerCase()

  const prodiFakultasSet = useMemo(() => {
    const set = new Set<string>()
    if (prodiList && prodiList.length > 0) {
      prodiList.forEach((p) => {
        const matchFakId = dekanFakultasId && (p.fakultas_id === dekanFakultasId || p.fakultasId === dekanFakultasId)
        const matchFakName = dekanFakultasName && (p.fakultas || '').toLowerCase().includes(dekanFakultasName)
        if (matchFakId || matchFakName || (!dekanFakultasId && !dekanFakultasName)) {
          set.add(p.nama.toLowerCase())
          if (p.nama_lengkap) set.add(p.nama_lengkap.toLowerCase())
          if (p.namaLengkap) set.add(p.namaLengkap.toLowerCase())
          if (p.jenjang && p.nama) set.add(`${p.jenjang} ${p.nama}`.toLowerCase())
        }
      })
    }
    return set
  }, [prodiList, dekanFakultasId, dekanFakultasName])

  const kaprodiList = useMemo(() => {
    return dosenList.filter((d) => {
      if (!d.isKaprodi) return false

      if (dekanFakultasId && (d.fakultasId === dekanFakultasId || d.fakultas_id === dekanFakultasId)) {
        return true
      }
      if (dekanFakultasName && (d.fakultas || '').toLowerCase().includes(dekanFakultasName)) {
        return true
      }
      const pName = (d.prodi || '').toLowerCase()
      if (prodiFakultasSet.has(pName)) {
        return true
      }
      if (!dekanFakultasId && !dekanFakultasName) {
        return true
      }
      return false
    })
  }, [dosenList, dekanFakultasId, dekanFakultasName, prodiFakultasSet])

  // Evaluating Target State (Dekan evaluating Kaprodi)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const defaultTarget =
    searchParams?.get('eval') === '1' && kaprodiList.length > 0
      ? { dosen: kaprodiList[0], penilaian: null }
      : null

  const [evaluatingTarget, setEvaluatingTarget] = useState<{
    dosen: Dosen
    penilaian: PenilaianKuesioner | null
  } | null>(defaultTarget)

  const [evalScores, setEvalScores] = useState({
    nilaiPelayanan: 4,
    nilaiAkuntabel: 4,
    nilaiKompeten: 4,
    nilaiHarmonis: 4,
    nilaiLoyal: 4,
    nilaiAdaptif: 4,
    nilaiKolaboratif: 4,
    catatan: '',
  })

  // Search filter
  const filteredKaprodi = kaprodiList.filter((k) => {
    if (!searchQuery) return true
    const q = searchQuery.trim().toLowerCase()
    return (
      (k.nama || '').toLowerCase().includes(q) ||
      (k.nip || '').toLowerCase().includes(q) ||
      (k.nuptk || '').toLowerCase().includes(q) ||
      (k.prodi || '').toLowerCase().includes(q)
    )
  })

  // Match each Kaprodi with annual questionnaire evaluation for the selected academic year
  const rowsData = filteredKaprodi.map((kaprodi) => {
    const evaluation = penilaianList.find(
      (p) =>
        (p.dosenId === kaprodi.id || p.dosenNama === kaprodi.nama) &&
        p.tahun === selectedTahun &&
        p.periode === 'Tahunan'
    )
    return {
      dosen: kaprodi,
      penilaian: evaluation || null,
    }
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [selectedTahun], {
    y: 8,
    stagger: 0.035,
  })

  // Summary Metrics
  const totalKaprodi = rowsData.length
  const evaluatedCount = rowsData.filter((r) => r.penilaian !== null).length
  const evaluatedScores = rowsData
    .map((r) => r.penilaian?.rataRata)
    .filter((v): v is number => typeof v === 'number')
  const avgScore =
    evaluatedScores.length > 0
      ? (evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length).toFixed(2)
      : '0.00'

  const handleOpenEvaluate = (dosen: Dosen, existingPenilaian?: PenilaianKuesioner | null) => {
    if (existingPenilaian) {
      setEvalScores({
        nilaiPelayanan: existingPenilaian.nilaiPelayanan || 4,
        nilaiAkuntabel: existingPenilaian.nilaiAkuntabel || 4,
        nilaiKompeten: existingPenilaian.nilaiKompeten || 4,
        nilaiHarmonis: existingPenilaian.nilaiHarmonis || 4,
        nilaiLoyal: existingPenilaian.nilaiLoyal || 4,
        nilaiAdaptif: existingPenilaian.nilaiAdaptif || 4,
        nilaiKolaboratif: existingPenilaian.nilaiKolaboratif || 4,
        catatan: existingPenilaian.catatan || '',
      })
    } else {
      setEvalScores({
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
    setEvaluatingTarget({ dosen, penilaian: existingPenilaian || null })
  }

  const handleAutoFillDummyDekanEval = () => {
    setEvalScores({
      nilaiPelayanan: 4,
      nilaiAkuntabel: 4,
      nilaiKompeten: 4,
      nilaiHarmonis: 4,
      nilaiLoyal: 4,
      nilaiAdaptif: 4,
      nilaiKolaboratif: 4,
      catatan: 'Kaprodi menunjukkan kepemimpinan kurikulum, tata kelola mutu Tridharma, dan koordinasi yang sangat efektif.',
    })
    onShowToast('Data dummy evaluasi kaprodi berhasil diisi otomatis!')
  }

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluatingTarget) return

    const sum =
      evalScores.nilaiPelayanan +
      evalScores.nilaiAkuntabel +
      evalScores.nilaiKompeten +
      evalScores.nilaiHarmonis +
      evalScores.nilaiLoyal +
      evalScores.nilaiAdaptif +
      evalScores.nilaiKolaboratif
    const avg = Number((sum / 7).toFixed(2))

    const predikat: PenilaianKuesioner['predikat'] =
      avg >= 3.5 ? 'Sangat Baik' : avg >= 3.0 ? 'Baik' : avg >= 2.0 ? 'Cukup' : 'Kurang'

    const newRecord: PenilaianKuesioner = {
      id: evaluatingTarget.penilaian?.id || `penilaian-dekan-${Date.now()}`,
      dosenId: evaluatingTarget.dosen.id,
      dosenNama: evaluatingTarget.dosen.nama,
      dosenProdi: evaluatingTarget.dosen.prodi,
      penilaiNama: user.name,
      penilaiRole: 'Dekan',
      targetRole: 'Kaprodi',
      periode: 'Tahunan',
      tahun: selectedTahun,
      nilaiPelayanan: evalScores.nilaiPelayanan,
      nilaiAkuntabel: evalScores.nilaiAkuntabel,
      nilaiKompeten: evalScores.nilaiKompeten,
      nilaiHarmonis: evalScores.nilaiHarmonis,
      nilaiLoyal: evalScores.nilaiLoyal,
      nilaiAdaptif: evalScores.nilaiAdaptif,
      nilaiKolaboratif: evalScores.nilaiKolaboratif,
      rataRata: avg,
      predikat,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      catatan:
        evalScores.catatan ||
        `Evaluasi kepemimpinan dan integritas BerAKHLAK Ketua Program Studi ${evaluatingTarget.dosen.prodi} oleh Dekan ${user.fakultas || 'Fakultas'}.`,
    }

    if (onSavePenilaian) {
      onSavePenilaian(newRecord)
    }
    onShowToast(`Evaluasi perilaku kerja BerAKHLAK ${evaluatingTarget.dosen.nama} berhasil disimpan!`)
    setEvaluatingTarget(null)
  }

  // Live average for evaluation form
  const currentFormSum =
    evalScores.nilaiPelayanan +
    evalScores.nilaiAkuntabel +
    evalScores.nilaiKompeten +
    evalScores.nilaiHarmonis +
    evalScores.nilaiLoyal +
    evalScores.nilaiAdaptif +
    evalScores.nilaiKolaboratif
  const currentFormAvg = (currentFormSum / 7).toFixed(2)
  const currentFormPredikat =
    Number(currentFormAvg) >= 3.5
      ? 'Sangat Baik'
      : Number(currentFormAvg) >= 3.0
      ? 'Baik'
      : Number(currentFormAvg) >= 2.0
      ? 'Cukup'
      : 'Kurang'

  return (
    <div className="page-container" ref={containerRef}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluasi Kinerja Ketua Program Studi</h1>
          <p className="page-desc">
            Pemeriksaan dan evaluasi capaian perilaku kerja BerAKHLAK tahunan Ketua Program Studi di lingkungan Fakultas Keperawatan. Penilaian diselenggarakan sekali setahun untuk mengukur kepemimpinan, integritas, dan budaya kerja prodi.
          </p>
        </div>

        {kaprodiList.length > 0 && (
          <button
            onClick={() => {
              const unevaluated = rowsData.find((r) => !r.penilaian)
              const target = unevaluated ? unevaluated.dosen : kaprodiList[0]
              const existing = rowsData.find((r) => r.dosen.id === target.id)?.penilaian
              handleOpenEvaluate(target, existing)
            }}
            className="brand-btn btn-action-add"
          >
            <Plus size={16} />
            <span>Nilai Ka Prodi</span>
          </button>
        )}
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
            <span>Filter Kuesioner Tahunan</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--hair)', display: 'inline-block' }} />

          {/* Tahun Ajaran Selector */}
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
              {TAHUN_AJARAN_OPTIONS.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--panel-hover)',
              padding: '6px 12px',
              borderRadius: 'var(--r-md)',
            }}
          >
            <Clock size={13} color="var(--brand-600)" />
            <span>Siklus Penilaian: <strong>1 Kali / Tahun</strong></span>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
          <Search
            size={15}
            color="var(--muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="custom-input"
            placeholder="Cari Ketua Program Studi, NIP, atau NUPTK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, height: 38, fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-bento-grid-3" style={{ marginTop: 16 }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Total Ketua Program Studi
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'var(--panel-hover)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--navy-900)',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {totalKaprodi} <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>Kaprodi</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="kpi-badge">
                <Building2 size={12} />
                <span>Homebase {user.fakultas || 'Fakultas Keperawatan'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Sudah Dievaluasi Tahunan
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#15803d',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--status-success-ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {evaluatedCount} / {totalKaprodi} <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>Kaprodi</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-ink)',
                }}
              >
                <Calendar size={12} />
                <span>Tahun Ajaran {selectedTahun}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
              Rata-rata Skor BerAKHLAK
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(234, 88, 12, 0.1)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--brand-600)',
              }}
            >
              <Award size={18} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {avgScore} <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>/ 4.00</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                className="kpi-badge"
                style={{
                  background: Number(avgScore) >= 3.75 ? 'var(--status-success-bg)' : 'var(--brand-100)',
                  color: Number(avgScore) >= 3.75 ? 'var(--status-success-ink)' : 'var(--brand-700)',
                }}
              >
                <Award size={12} />
                <span>Mutu: {Number(avgScore) >= 3.75 ? 'Sangat Baik' : 'Baik'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container" style={{ marginTop: 16 }}>
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Ketua Program Studi</th>
              <th>Program Studi</th>
              <th style={{ textAlign: 'center' }}>Tahun Evaluasi</th>
              <th>Dimensi BerAKHLAK (1-4)</th>
              <th style={{ textAlign: 'center' }}>Rata-rata</th>
              <th style={{ textAlign: 'center' }}>Predikat Mutu</th>
              <th>Pejabat Penilai</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rowsData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Tidak ada data Ketua Program Studi yang cocok.
                </td>
              </tr>
            ) : (
              rowsData.map(({ dosen, penilaian }) => {
                const isEvaluated = Boolean(penilaian)
                return (
                  <tr key={dosen.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{dosen.nama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        NIP: {dosen.nip} &bull; NUPTK: {dosen.nuptk || '-'}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill badge-pill--blue">{dosen.prodi}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {selectedTahun}
                    </td>
                    <td>
                      {isEvaluated && penilaian ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="badge-pill" title="Orientasi Pelayanan" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Pel: {penilaian.nilaiPelayanan}
                          </span>
                          <span className="badge-pill" title="Akuntabel" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Aku: {penilaian.nilaiAkuntabel}
                          </span>
                          <span className="badge-pill" title="Kompeten" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Kom: {penilaian.nilaiKompeten}
                          </span>
                          <span className="badge-pill" title="Harmonis" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Har: {penilaian.nilaiHarmonis}
                          </span>
                          <span className="badge-pill" title="Loyal" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Loy: {penilaian.nilaiLoyal}
                          </span>
                          <span className="badge-pill" title="Adaptif" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Ada: {penilaian.nilaiAdaptif}
                          </span>
                          <span className="badge-pill" title="Kolaboratif" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                            Kol: {penilaian.nilaiKolaboratif}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                          Belum dievaluasi Dekan
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-700)', fontSize: '14px' }}>
                      {isEvaluated && penilaian ? penilaian.rataRata.toFixed(2) : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEvaluated && penilaian ? (
                        <span
                          className={`badge-pill ${
                            penilaian.predikat === 'Sangat Baik'
                              ? 'badge-pill--green'
                              : penilaian.predikat === 'Baik'
                              ? 'badge-pill--blue'
                              : 'badge-pill--orange'
                          }`}
                        >
                          {penilaian.predikat}
                        </span>
                      ) : (
                        <span className="badge-pill badge-pill--gray">-</span>
                      )}
                    </td>
                    <td>
                      {isEvaluated && penilaian ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>
                            {penilaian.penilaiNama}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                            Role: {penilaian.penilaiRole} &bull; {penilaian.tanggal}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--faint)' }}>Menunggu penilaian Dekan</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEvaluated ? (
                        <span className="badge-pill badge-pill--green">Sudah Dievaluasi</span>
                      ) : (
                        <span className="badge-pill badge-pill--orange">Belum Dinilai</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {isEvaluated && penilaian ? (
                          <>
                            <button
                              onClick={() => {
                                setActiveDetailItem({ dosen, penilaian })
                              }}
                              className="brand-btn btn-action-view"
                              style={{ padding: '6px 10px', fontSize: '11.5px', gap: 4 }}
                              title="Lihat Rincian Skor"
                            >
                              <Award size={13} />
                              <span>Rincian</span>
                            </button>
                            <button
                              onClick={() => handleOpenEvaluate(dosen, penilaian)}
                              className="brand-btn btn-action-edit"
                              style={{ padding: '6px 10px', fontSize: '11.5px', gap: 4 }}
                              title="Edit Penilaian Ka Prodi"
                            >
                              <Edit2 size={13} />
                              <span>Edit Nilai</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenEvaluate(dosen, null)}
                            className="brand-btn btn-action-add"
                            style={{ padding: '6px 12px', fontSize: '11.5px', gap: 4 }}
                            title="Beri Nilai Ketua Program Studi"
                          >
                            <Plus size={13} />
                            <span>Nilai Ka Prodi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Input/Edit Penilaian Ka Prodi oleh Dekan */}
      {evaluatingTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setEvaluatingTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--r-xl)',
              width: '100%',
              maxWidth: 720,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--hair)',
              padding: '24px 28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--hair)',
                paddingBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-700)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Award size={15} />
                  <span>Penilaian Kinerja Tahunan BerAKHLAK</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                  {evaluatingTarget.penilaian ? 'Edit Penilaian' : 'Beri Penilaian'}: {evaluatingTarget.dosen.nama}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                  Ketua Program Studi {evaluatingTarget.dosen.prodi} &bull; Tahun Ajaran {selectedTahun}
                </div>
              </div>
              <button
                onClick={() => setEvaluatingTarget(null)}
                className="icon-btn"
                style={{ width: 32, height: 32 }}
                aria-label="Tutup form evaluasi"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Kaprodi & Evaluator Meta */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                padding: '14px 16px',
                background: 'var(--panel-hover)',
                borderRadius: 'var(--r-md)',
                marginTop: 16,
                border: '1px solid var(--hair)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>NIP / NUPTK</span>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)', fontWeight: 700, marginTop: 2 }}>
                  {evaluatingTarget.dosen.nip}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Pejabat Penilai</span>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)', fontWeight: 700, marginTop: 2 }}>
                  {user.name} (Dekan)
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Siklus Penilaian</span>
                <div style={{ fontSize: '12.5px', color: 'var(--brand-700)', fontWeight: 700, marginTop: 2 }}>
                  Tahunan {selectedTahun} (1x Setahun)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={handleAutoFillDummyDekanEval}
                className="brand-btn"
                style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Isi form otomatis dengan nilai evaluasi dummy"
              >
                <Sparkles size={14} className="text-amber-600 animate-pulse" />
                <span>⚡ Isi Form Otomatis (Data Dummy)</span>
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} style={{ marginTop: 14 }}>
              {/* 7 Dimensions Scoring */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {BERAKHLAK_DIMENSIONS.map((dim) => {
                  const currentValue = evalScores[dim.key] as number
                  return (
                    <div
                      key={dim.key}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--r-md)',
                        background: '#ffffff',
                        border: '1px solid var(--hair)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                            {dim.label}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                            {dim.sub}
                          </div>
                        </div>

                        {/* Rating Buttons (1 to 4) */}
                        <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                          {[
                            { val: 4, label: '4 - Sangat Baik' },
                            { val: 3, label: '3 - Baik' },
                            { val: 2, label: '2 - Cukup' },
                            { val: 1, label: '1 - Kurang' },
                          ].map((opt) => {
                            const isSelected = currentValue === opt.val
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setEvalScores((prev) => ({ ...prev, [dim.key]: opt.val }))}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 'var(--r-md)',
                                  fontSize: '11.5px',
                                  fontWeight: isSelected ? 700 : 500,
                                  background: isSelected ? 'var(--brand-600)' : 'var(--panel-hover)',
                                  color: isSelected ? '#ffffff' : 'var(--ink)',
                                  border: isSelected ? '1px solid var(--brand-700)' : '1px solid var(--hair)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s var(--ease)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                {isSelected && <Check size={12} />}
                                <span>{opt.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Real-time Summary Card */}
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--panel-hover)',
                  border: '1px solid var(--hair)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Rata-rata Skor BerAKHLAK</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1.1, marginTop: 2 }}>
                    {currentFormAvg} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>/ 4.00</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Predikat Kinerja</span>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className={`badge-pill ${
                        currentFormPredikat === 'Sangat Baik'
                          ? 'badge-pill--green'
                          : currentFormPredikat === 'Baik'
                          ? 'badge-pill--blue'
                          : 'badge-pill--orange'
                      }`}
                      style={{ fontSize: '13px', padding: '4px 12px' }}
                    >
                      {currentFormPredikat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Pembinaan & Rekomendasi Dekan */}
              <div style={{ marginTop: 16 }}>
                <label className="form-label">
                  Catatan Pembinaan, Evaluasi Kepemimpinan &amp; Rekomendasi Dekan
                </label>
                <textarea
                  rows={3}
                  className="custom-input"
                  value={evalScores.catatan}
                  onChange={(e) => setEvalScores((prev) => ({ ...prev, catatan: e.target.value }))}
                  placeholder="Berikan umpan balik kepemimpinan program studi, pencapaian target akreditasi, budaya kerja prodi..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEvaluatingTarget(null)}
                  className="brand-btn brand-btn--outline"
                  style={{ padding: '8px 18px', fontSize: '12.5px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="brand-btn btn-action-add"
                  style={{ padding: '8px 22px', fontSize: '12.5px' }}
                >
                  <CheckSquare size={15} />
                  <span>Simpan Evaluasi BerAKHLAK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal: Skor 7 Dimensi BerAKHLAK */}
      {activeDetailItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setActiveDetailItem(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--r-xl)',
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--hair)',
              padding: '24px 28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--hair)',
                paddingBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-600)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Award size={15} />
                  <span>Transkrip Hasil Evaluasi BerAKHLAK</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                  {activeDetailItem.dosen.nama}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                  NIP: {activeDetailItem.dosen.nip} &bull; Homebase {activeDetailItem.dosen.prodi}
                </div>
              </div>
              <button
                onClick={() => setActiveDetailItem(null)}
                className="icon-btn"
                style={{ width: 32, height: 32 }}
                aria-label="Tutup detail evaluasi"
              >
                <X size={16} />
              </button>
            </div>

            {activeDetailItem.penilaian ? (
              <>
                {/* Score Summary Banner */}
                <div
                  style={{
                    background: 'var(--panel-hover)',
                    borderRadius: 'var(--r-lg)',
                    padding: '16px 20px',
                    margin: '18px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--hair)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Rata-rata Skor Capaian ({selectedTahun})
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1.1, marginTop: 2 }}>
                      {activeDetailItem.penilaian.rataRata.toFixed(2)}{' '}
                      <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>/ 4.00</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Predikat Mutu
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span
                        className={`badge-pill ${
                          activeDetailItem.penilaian.predikat === 'Sangat Baik'
                            ? 'badge-pill--green'
                            : activeDetailItem.penilaian.predikat === 'Baik'
                            ? 'badge-pill--blue'
                            : 'badge-pill--orange'
                        }`}
                        style={{ fontSize: '13px', padding: '4px 12px' }}
                      >
                        {activeDetailItem.penilaian.predikat}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7 Dimensions Detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BERAKHLAK_DIMENSIONS.map((dim) => {
                    const score = activeDetailItem.penilaian ? (activeDetailItem.penilaian[dim.key] as number) : 0
                    const percent = (score / 4) * 100
                    return (
                      <div
                        key={dim.key}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--hair)',
                          borderRadius: 'var(--r-md)',
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                              {dim.label}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2, lineHeight: 1.35 }}>
                              {dim.sub}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-700)' }}>
                              {score.toFixed(1)}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}> / 4.0</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            height: 6,
                            background: 'var(--panel-hover)',
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

                {/* Catatan Pembinaan & Evaluator Info */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--hair)',
                    borderRadius: 'var(--r-lg)',
                    padding: '16px',
                    marginTop: 18,
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 4 }}>
                    Catatan Pembinaan &amp; Rekomendasi Dekan:
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.5, background: 'var(--panel-hover)', padding: '10px 14px', borderRadius: 'var(--r-md)', fontStyle: 'italic' }}>
                    "{activeDetailItem.penilaian.catatan || 'Kinerja kepemimpinan prodi berjalan tertib dan profesional.'}"
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '11px', color: 'var(--muted)' }}>
                    <span>Pejabat Penilai: <strong>{activeDetailItem.penilaian.penilaiNama}</strong> ({activeDetailItem.penilaian.penilaiRole})</span>
                    <span>Tanggal Penilaian: <strong>{activeDetailItem.penilaian.tanggal}</strong></span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <Clock size={36} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)' }}>
                  Belum Ada Penilaian Kuesioner Tahunan
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', maxWidth: 440, margin: '6px auto 0' }}>
                  Ketua Program Studi {activeDetailItem.dosen.nama} belum menerima evaluasi perilaku BerAKHLAK untuk Tahun Ajaran {selectedTahun}.
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {activeDetailItem.penilaian && (
                <button
                  onClick={() => {
                    openPrintTranskrip({
                      penilaian: activeDetailItem.penilaian!,
                      dosenNama: activeDetailItem.dosen.nama,
                      dosenNip: activeDetailItem.dosen.nip,
                      dosenProdi: activeDetailItem.dosen.prodi,
                      dosenJafung: activeDetailItem.dosen.jafung,
                      dosenGolongan: activeDetailItem.dosen.golongan,
                      tahunAkademik: selectedTahun,
                    })
                  }}
                  className="brand-btn btn-action-print"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                  title="Cetak Transkrip Evaluasi BerAKHLAK Resmi di Tab Baru"
                >
                  <Printer size={14} />
                  <span>Cetak Transkrip</span>
                </button>
              )}
              <button
                onClick={() => setActiveDetailItem(null)}
                className="brand-btn"
                style={{ padding: '8px 20px', fontSize: '12.5px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Transkrip BerAKHLAK Standar A4 Resmi */}
      {transcriptToPrint && (
        <CetakTranskripKuesioner
          isOpen={!!transcriptToPrint}
          onClose={() => setTranscriptToPrint(null)}
          penilaian={transcriptToPrint.penilaian}
          dosenNama={transcriptToPrint.dosen.nama}
          dosenNip={transcriptToPrint.dosen.nip}
          dosenProdi={transcriptToPrint.dosen.prodi}
          dosenJafung={transcriptToPrint.dosen.jafung}
          dosenGolongan={transcriptToPrint.dosen.golongan}
          tahunAkademik={selectedTahun}
        />
      )}
    </div>
  )
}
