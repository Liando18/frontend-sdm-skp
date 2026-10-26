import React, { useState, useRef } from 'react'
import { Search, Award, Eye, X, UserCheck, ShieldCheck, Calendar, Filter } from 'lucide-react'
import { PenilaianKuesioner, Dosen } from '../types'
import { useStaggerEntrance } from '../utils/animations'

interface KelolaPenilaianKuesionerProps {
  penilaianList: PenilaianKuesioner[]
  dosenList: Dosen[]
  onAddPenilaian?: (item: PenilaianKuesioner) => void
  onShowToast: (msg: string) => void
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
  onShowToast,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua Tahun')
  const [selectedRole, setSelectedRole] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<PenilaianKuesioner | null>(null)

  const tahunList = ['Semua Tahun', '2025/2026', '2024/2025', '2026/2027']
  const roleList = ['Semua', 'Ka Prodi (Menilai)', 'Dekan (Menilai)']

  const filteredList = penilaianList.filter((item) => {
    const matchTahun = selectedTahun === 'Semua Tahun' || item.tahun === selectedTahun
    const matchRole =
      selectedRole === 'Semua' ||
      (selectedRole === 'Ka Prodi (Menilai)' && item.penilaiRole === 'Kaprodi') ||
      (selectedRole === 'Dekan (Menilai)' && item.penilaiRole === 'Dekan')
    const matchSearch =
      item.dosenNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.penilaiNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dosenProdi.toLowerCase().includes(searchQuery.toLowerCase())
    return matchTahun && matchRole && matchSearch
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredList], { y: 8, stagger: 0.035 })

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Kinerja Tahunan Pegawai</h1>
          <p className="page-desc">
            Pemantauan dan rekapitulasi evaluasi perilaku BerAKHLAK 7 dimensi tahunan seluruh dosen, Ketua Program Studi, dan pimpinan fakultas di lingkungan Universitas Bhakti Kencana.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Tahun Akademik */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              Tahun Ajaran
            </span>
            <select
              className="custom-select"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              style={{ width: 'auto', minWidth: 150, height: 38, fontSize: '13px', fontWeight: 600 }}
            >
              {tahunList.map((thn, idx) => (
                <option key={idx} value={thn}>
                  {thn}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Role Penilai */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--panel-hover)', padding: 3, borderRadius: 'var(--r-md)' }}>
            {roleList.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRole(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedRole === tab ? 'var(--navy-900)' : 'transparent',
                  color: selectedRole === tab ? '#ffffff' : 'var(--muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="search-box" style={{ minWidth: 260 }}>
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Cari pegawai, penilai, prodi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
      </div>

      {/* Master Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Pegawai / Dosen</th>
              <th>Posisi / Homebase</th>
              <th>Pejabat Penilai</th>
              <th>Tahun Ajaran</th>
              <th>Rata-rata Skor</th>
              <th>Predikat Mutu</th>
              <th>Tanggal Evaluasi</th>
              <th style={{ textAlign: 'right' }}>Aksi Monitoring</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>{item.dosenNama}</div>
                  {item.targetRole === 'Kaprodi' && (
                    <span className="badge-pill badge-pill--blue" style={{ fontSize: '10.5px', marginTop: 2 }}>
                      Ketua Program Studi
                    </span>
                  )}
                  {item.targetRole === 'Dekan' && (
                    <span className="badge-pill badge-pill--green" style={{ fontSize: '10.5px', marginTop: 2 }}>
                      Dekan Fakultas
                    </span>
                  )}
                  {item.targetRole === 'SDM' && (
                    <span className="badge-pill badge-pill--orange" style={{ fontSize: '10.5px', marginTop: 2 }}>
                      Direktorat SDM
                    </span>
                  )}
                </td>
                <td>{item.dosenProdi}</td>
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
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)' }}>
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
            ))}
          </tbody>
        </table>
      </div>

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
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Pejabat Penilai</div>
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
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)' }}>
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
