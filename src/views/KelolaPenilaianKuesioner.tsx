import React, { useState, useRef, useMemo } from 'react'
import { Search, Eye, X, RotateCcw, AlertCircle, Building2 } from 'lucide-react'
import { PenilaianKuesioner, Dosen } from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { TablePagination } from '../components/TablePagination'

interface KelolaPenilaianKuesionerProps {
  penilaianList: PenilaianKuesioner[]
  dosenList?: Dosen[]
  onAddPenilaian?: (item: PenilaianKuesioner) => void
  onShowToast?: (msg: string) => void
}

const BERAKHLAK_KEYS = [
  { key: 'nilaiPelayanan' as const, label: '1. Orientasi Pelayanan', sub: 'Sikap ramah, solutif, kepuasan sivitas akademika & mahasiswa.' },
  { key: 'nilaiAkuntabel' as const, label: '2. Akuntabel', sub: 'Jujur, bertanggung jawab, disiplin waktu dan berintegritas.' },
  { key: 'nilaiKompeten' as const, label: '3. Kompeten', sub: 'Terus belajar dan mengembangkan kapabilitas keilmuan.' },
  { key: 'nilaiHarmonis' as const, label: '4. Harmonis', sub: 'Saling peduli, menghargai keberagaman, dan iklim kondusif.' },
  { key: 'nilaiLoyal' as const, label: '5. Loyal', sub: 'Memegang teguh visi misi UBK dan mengutamakan institusi.' },
  { key: 'nilaiAdaptif' as const, label: '6. Adaptif', sub: 'Cepat menyesuaikan diri terhadap inovasi kurikulum & teknologi.' },
  { key: 'nilaiKolaboratif' as const, label: '7. Kolaboratif', sub: 'Membangun sinergi riset antardisiplin dan mitra institusi.' },
]

export const KelolaPenilaianKuesioner: React.FC<KelolaPenilaianKuesionerProps> = ({
  penilaianList,
  dosenList,
}) => {
  // Extract Dynamic Filter Lists
  const availableYears = useMemo(() => {
    return Array.from(
      new Set([
        ...penilaianList.map((p) => p.tahun).filter(Boolean),
        '2026/2027',
        '2025/2026',
        '2024/2025',
      ])
    ).sort().reverse()
  }, [penilaianList])

  const availableProdis = useMemo(() => {
    const list = new Set<string>()
    penilaianList.forEach((p) => {
      if (p.dosenProdi) list.add(p.dosenProdi)
    })
    if (dosenList) {
      dosenList.forEach((d) => {
        if (d.prodi) list.add(d.prodi)
      })
    }
    return Array.from(list).sort()
  }, [penilaianList, dosenList])

  // Filter States
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua')
  const [selectedRole, setSelectedRole] = useState<string>('Semua')
  const [selectedProdi, setSelectedProdi] = useState<string>('Semua')
  const [selectedPredikat, setSelectedPredikat] = useState<string>('Semua')
  const [selectedCriticalPoint, setSelectedCriticalPoint] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<PenilaianKuesioner | null>(null)

  const isFiltered =
    selectedTahun !== 'Semua' ||
    selectedRole !== 'Semua' ||
    selectedProdi !== 'Semua' ||
    selectedPredikat !== 'Semua' ||
    selectedCriticalPoint !== 'Semua' ||
    searchQuery.trim() !== ''

  const handleResetFilters = () => {
    setSelectedTahun('Semua')
    setSelectedRole('Semua')
    setSelectedProdi('Semua')
    setSelectedPredikat('Semua')
    setSelectedCriticalPoint('Semua')
    setSearchQuery('')
    setPage(1)
  }

  const filteredList = useMemo(() => {
    return penilaianList.filter((item) => {
      if (selectedTahun !== 'Semua' && item.tahun !== selectedTahun) return false

      if (selectedRole !== 'Semua') {
        if (selectedRole === 'Kaprodi' && item.penilaiRole !== 'Kaprodi') return false
        if (selectedRole === 'Dekan' && item.penilaiRole !== 'Dekan') return false
      }

      if (selectedProdi !== 'Semua' && item.dosenProdi !== selectedProdi) return false

      if (selectedPredikat !== 'Semua' && item.predikat !== selectedPredikat) return false

      if (selectedCriticalPoint !== 'Semua') {
        // Critical point indikator: rata-rata minimal 3.00
        const isMet = (item.nilaiPelayanan || 0) >= 3 && (item.nilaiAkuntabel || 0) >= 3
        if (selectedCriticalPoint === 'memenuhi' && !isMet) return false
        if (selectedCriticalPoint === 'kurang' && isMet) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchNama = (item.dosenNama || '').toLowerCase().includes(q)
        const matchPenilai = (item.penilaiNama || '').toLowerCase().includes(q)
        const matchProdi = (item.dosenProdi || '').toLowerCase().includes(q)
        if (!matchNama && !matchPenilai && !matchProdi) return false
      }

      return true
    })
  }, [penilaianList, selectedTahun, selectedRole, selectedProdi, selectedPredikat, selectedCriticalPoint, searchQuery])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setPage(1)
  }, [selectedTahun, selectedRole, selectedProdi, selectedPredikat, selectedCriticalPoint, searchQuery])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [page, filteredList.length], { y: 8, stagger: 0.035 })

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Monitoring Kinerja Tahunan Pegawai</h1>
          <p className="page-desc">
            Pemantauan dan rekapitulasi evaluasi perilaku BerAKHLAK 7 dimensi tahunan seluruh dosen, Ketua Program Studi, dan pimpinan fakultas di lingkungan Universitas Bhakti Kencana.
          </p>
        </div>
      </div>

      {/* Filter Card: Diperkaya, Seragam & Search Bar Lebar Penuh di Bawah */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Baris 1: Header Filter & Tombol Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
              Filter Evaluasi BerAKHLAK
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--brand-700)',
                background: 'var(--brand-100)',
                padding: '2px 8px',
                borderRadius: 'var(--r-full)',
              }}
            >
              Menampilkan {filteredList.length} dari {penilaianList.length} Evaluasi
            </span>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              style={{
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                borderRadius: 'var(--r-sm)',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--status-danger-ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Reset seluruh filter ke kondisi awal"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Baris 2: Kumpulan Dropdown Filter Seragam */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* 1. Tahun Akademik */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Tahun Akademik</label>
            <select
              className="custom-select"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
              }}
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map((thn) => (
                <option key={thn} value={thn}>
                  TA {thn}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kategori Penilai */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Pejabat Penilai</label>
            <select
              className="custom-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Penilai</option>
              <option value="Kaprodi">Kaprodi (Menilai Dosen)</option>
              <option value="Dekan">Dekan (Menilai Kaprodi)</option>
            </select>
          </div>

          {/* 3. Program Studi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Program Studi</label>
            <select
              className="custom-select"
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Program Studi</option>
              {availableProdis.map((p) => (
                <option key={p} value={p} title={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Predikat Mutu Perilaku */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Predikat Mutu</label>
            <select
              className="custom-select"
              value={selectedPredikat}
              onChange={(e) => setSelectedPredikat(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Predikat</option>
              <option value="Sangat Baik">Sangat Baik (3.51 - 4.00)</option>
              <option value="Baik">Baik (2.76 - 3.50)</option>
              <option value="Cukup">Cukup (2.01 - 2.75)</option>
              <option value="Kurang">Kurang (&le; 2.00)</option>
            </select>
          </div>

          {/* 5. Pemenuhan Poin Kritis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Poin Kritis (Critical)</label>
            <select
              className="custom-select"
              value={selectedCriticalPoint}
              onChange={(e) => setSelectedCriticalPoint(e.target.value)}
              style={{
                height: 38,
                fontSize: '12px',
                fontWeight: 500,
                width: '100%',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--hair-strong)',
                background: '#ffffff',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="Semua">Semua Indikator</option>
              <option value="memenuhi">Memenuhi Poin Kritis (&ge; 3.0)</option>
              <option value="kurang">Di Bawah Standar Poin Kritis</option>
            </select>
          </div>
        </div>

        {/* Baris 3: Search Bar di Bawah Filter dengan Lebar Penuh & Responsif */}
        <div style={{ position: 'relative', width: '100%', marginTop: 2 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchQuery ? 'var(--brand-600)' : 'var(--faint)',
              pointerEvents: 'none',
              transition: 'color 0.15s ease',
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nama pegawai, penilai, atau program studi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 42,
              paddingRight: searchQuery ? 68 : 14,
              height: 40,
              fontSize: '13px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--hair-strong)',
              background: 'var(--page-bg)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-xs)',
                padding: '2px 8px',
                fontSize: '11px',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Master Table */}
      <div className="table-container">
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Nama Pegawai / Dosen</th>
              <th>Posisi / Homebase</th>
              <th>Disetujui / Dinilai Oleh</th>
              <th>Tahun Ajaran</th>
              <th>Rata-rata Skor</th>
              <th>Predikat Mutu</th>
              <th>Tanggal Evaluasi</th>
              <th style={{ textAlign: 'right' }}>Aksi Monitoring</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={28} style={{ color: 'var(--faint)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                      Tidak Ada Data Penilaian yang Sesuai
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Silakan sesuaikan kata kunci pencarian atau ubah kriteria filter di atas.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '14px' }}>{item.dosenNama}</div>
                    {item.targetRole === 'Kaprodi' && (
                      <span className="badge-pill badge-pill--blue" style={{ fontSize: '10.5px', marginTop: 3 }}>
                        Ketua Program Studi
                      </span>
                    )}
                    {item.targetRole === 'Dekan' && (
                      <span className="badge-pill badge-pill--green" style={{ fontSize: '10.5px', marginTop: 3 }}>
                        Dekan Fakultas
                      </span>
                    )}
                    {item.targetRole === 'SDM' && (
                      <span className="badge-pill badge-pill--orange" style={{ fontSize: '10.5px', marginTop: 3 }}>
                        Direktorat SDM
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                      }}
                    >
                      <Building2 size={12} style={{ color: 'var(--muted)' }} />
                      <span>{item.dosenProdi}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.penilaiNama}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      Kapasitas: <strong>{item.penilaiRole}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill badge-pill--gray" style={{ fontSize: '11px' }}>
                      Tahunan {item.tahun}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                      {item.rataRata.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}> / 4.00</span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        item.predikat === 'Sangat Baik'
                          ? 'badge-pill--green'
                          : item.predikat === 'Baik'
                          ? 'badge-pill--blue'
                          : 'badge-pill--orange'
                      }`}
                    >
                      {item.predikat}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.tanggal}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action-view"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => setSelectedDetail(item)}
                    >
                      <Eye size={13} />
                      <span>Lihat Detail</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        totalItems={filteredList.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />

      {/* Modal Detail Rincian BerAKHLAK */}
      {selectedDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedDetail(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '640px', padding: '24px 28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hair)', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                  Rincian Evaluasi Perilaku BerAKHLAK
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
                  Tahun Ajaran {selectedDetail.tahun} &bull; Periode Tahunan
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, margin: '18px 0' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Pegawai yang Dinilai</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 3 }}>
                  {selectedDetail.dosenNama}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{selectedDetail.dosenProdi}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Disetujui / Dinilai Oleh</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginTop: 3 }}>
                  {selectedDetail.penilaiNama}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--brand-700)', fontWeight: 600 }}>Kapasitas: {selectedDetail.penilaiRole}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--brand-50)', border: '1px solid var(--brand-100)' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-700)' }}>Rata-rata Skor</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                  {selectedDetail.rataRata.toFixed(2)} <span style={{ fontSize: '11.5px', fontWeight: 400, color: 'var(--muted)' }}>/ 4.00</span>
                </div>
                <span className="badge-pill badge-pill--green" style={{ fontSize: '10.5px' }}>
                  {selectedDetail.predikat}
                </span>
              </div>
            </div>

            {/* 7 Dimensi BerAKHLAK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 6 }}>
              {BERAKHLAK_KEYS.map((dim) => {
                const score = selectedDetail[dim.key] as number
                return (
                  <div
                    key={dim.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--panel-hover)',
                      border: '1px solid var(--hair)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{dim.label}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{dim.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                        {score}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}> / 4</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Catatan Penilai */}
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--muted)' }}>Catatan Evaluasi Penilai:</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>
                "{selectedDetail.catatan || 'Kinerja tahunan telah memenuhi seluruh standar mutu perilaku kerja BerAKHLAK UBK.'}"
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                className="btn-action-print"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => setSelectedDetail(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
