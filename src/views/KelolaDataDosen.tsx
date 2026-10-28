import React, { useState, useRef, useMemo } from 'react'
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Settings,
  X,
  Check,
  Sparkles,
} from 'lucide-react'
import { Dosen } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStaggerEntrance } from '../utils/animations'
import { generateEntityId } from '../utils/security'
import { TablePagination } from '../components/TablePagination'

interface KelolaDataDosenProps {
  dosenList: Dosen[]
  prodiList?: string[]
  onAddDosen: (dosen: Dosen) => void
  onUpdateDosen: (dosen: Dosen) => void
  onDeleteDosen: (id: string) => void
  onAddProdi?: (name: string) => Promise<void> | void
  onUpdateProdi?: (oldName: string, newName: string) => Promise<void> | void
  onDeleteProdi?: (name: string) => Promise<void> | void
  onShowToast: (msg: string) => void
}

export const KelolaDataDosen: React.FC<KelolaDataDosenProps> = ({
  dosenList,
  prodiList: prodiListProp,
  onAddDosen,
  onUpdateDosen,
  onDeleteDosen,
  onAddProdi,
  onUpdateProdi,
  onDeleteProdi,
  onShowToast,
}) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialMode = searchParams?.get('mode') === 'create' ? 'create' : 'list'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>(initialMode)
  const [selectedDosen, setSelectedDosen] = useState<Dosen | null>(null)
  const [deleteConfirmDosen, setDeleteConfirmDosen] = useState<Dosen | null>(null)

  // Derive prodi list dynamically from database / props
  const [customAddedProdis, setCustomAddedProdis] = useState<string[]>([])
  const fallbackProdi = Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))
  const baseProdis = (prodiListProp && prodiListProp.length > 0) ? prodiListProp : (fallbackProdi.length > 0 ? fallbackProdi : ['S1 Keperawatan'])
  const prodiList = Array.from(new Set([...baseProdis, ...customAddedProdis]))
  const [isManageProdiOpen, setIsManageProdiOpen] = useState(false)
  const [newProdiInput, setNewProdiInput] = useState('')
  const [editingProdiIdx, setEditingProdiIdx] = useState<number | null>(null)
  const [editingProdiValue, setEditingProdiValue] = useState('')

  const handleAddProdi = async () => {
    const val = newProdiInput.trim()
    if (!val) return
    if (prodiList.includes(val)) {
      onShowToast('Program Studi tersebut sudah ada!')
      return
    }
    if (onAddProdi) {
      await onAddProdi(val)
    } else {
      setCustomAddedProdis((prev) => [...prev, val])
      onShowToast(`Program Studi "${val}" berhasil ditambahkan!`)
    }
    setFormData((prev) => ({ ...prev, prodi: val }))
    setNewProdiInput('')
  }

  const handleSaveEditProdi = async (index: number) => {
    const val = editingProdiValue.trim()
    if (!val) return
    const oldVal = prodiList[index]
    if (onUpdateProdi) {
      await onUpdateProdi(oldVal, val)
    } else {
      setCustomAddedProdis((prev) => prev.map((p) => (p === oldVal ? val : p)))
      onShowToast('Nama Program Studi berhasil diperbarui!')
    }
    if (formData.prodi === oldVal) {
      setFormData((prev) => ({ ...prev, prodi: val }))
    }
    if (selectedProdi === oldVal) {
      setSelectedProdi(val)
    }
    setEditingProdiIdx(null)
    setEditingProdiValue('')
  }

  const handleDeleteProdi = async (index: number) => {
    if (prodiList.length <= 1) {
      onShowToast('Minimal harus ada 1 program studi!')
      return
    }
    const removed = prodiList[index]
    if (onDeleteProdi) {
      await onDeleteProdi(removed)
    } else {
      setCustomAddedProdis((prev) => prev.filter((p) => p !== removed))
      onShowToast(`Program Studi "${removed}" telah dihapus.`)
    }
    if (formData.prodi === removed) {
      setFormData((prev) => ({ ...prev, prodi: prodiList[0] || '' }))
    }
    if (selectedProdi === removed) {
      setSelectedProdi('Semua Program Studi')
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('Semua Program Studi')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')

  const defaultProdi = prodiList[0] || 'S1 Keperawatan'

  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    nuptk: '',
    prodi: defaultProdi,
    jafung: 'Asisten Ahli',
    golongan: 'Penata Muda Tk I / IIIb',
    pendidikanS1: '',
    pendidikanS2: '',
    pendidikanS3: '',
    pendidikanProfesi: '',
    pendidikan: '',
    status: 'Tetap Yayasan' as 'Tetap Yayasan' | 'PNS DPK' | 'Dosen Khusus',
    email: '',
    phone: '',
  })

  const filteredDosen = dosenList.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      d.nama.toLowerCase().includes(q) ||
      d.nip.toLowerCase().includes(q) ||
      (d.nuptk && d.nuptk.toLowerCase().includes(q))
    const matchProdi = selectedProdi === 'Semua Program Studi' || d.prodi === selectedProdi
    const matchStatus = selectedStatus === 'Semua Status' || d.status === selectedStatus
    return matchSearch && matchProdi && matchStatus
  })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginatedDosen = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredDosen.slice(start, start + pageSize)
  }, [filteredDosen, page, pageSize])

  const containerRef = useRef<HTMLDivElement>(null)
  // Run animation only when viewMode switches, not on every search keystroke
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [viewMode], { y: 8, stagger: 0.035 })

  const handleOpenCreate = () => {
    setFormData({
      nama: '',
      nip: '',
      nuptk: '',
      prodi: defaultProdi,
      jafung: 'Asisten Ahli',
      golongan: 'Penata Muda Tk I / IIIb',
      pendidikanS1: '',
      pendidikanS2: '',
      pendidikanS3: '',
      pendidikanProfesi: '',
      pendidikan: '',
      status: 'Tetap Yayasan',
      email: '',
      phone: '',
    })
    setViewMode('create')
  }

  const handleAutoFillDummyDosen = () => {
    const randomNipSuffix = Math.floor(1000 + Math.random() * 9000)
    setFormData({
      nama: 'Dr. apt. Farhan Prasetyo, M.Farm.',
      nip: `19850720201201${randomNipSuffix}`,
      nuptk: `987654321098${randomNipSuffix}`,
      prodi: prodiList[0] || 'S1 Keperawatan',
      jafung: 'Lektor',
      golongan: 'Penata / III-c',
      pendidikanS1: 'S1 Farmasi - ITB (2007)',
      pendidikanProfesi: 'Profesi Apoteker - ITB (2008)',
      pendidikanS2: 'S2 Farmasi Sains - UGM (2013)',
      pendidikanS3: 'S3 Farmakologi - UNPAD (2020)',
      pendidikan: 'S1 Farmasi, Profesi Apoteker, S2 Farmasi Sains, S3 Farmakologi',
      status: 'Tetap Yayasan',
      email: `farhan.prasetyo${randomNipSuffix}@bku.ac.id`,
      phone: '081234567890',
    })
    onShowToast('Data dummy dosen berhasil diisi otomatis! Silakan klik Simpan.')
  }

  const handleOpenEdit = (dosen: Dosen) => {
    setSelectedDosen(dosen)
    setFormData({
      nama: dosen.nama,
      nip: dosen.nip,
      nuptk: dosen.nuptk || '',
      prodi: dosen.prodi,
      jafung: dosen.jafung,
      golongan: dosen.golongan,
      pendidikanS1: dosen.pendidikanS1 || dosen.pendidikan || '',
      pendidikanS2: dosen.pendidikanS2 || '',
      pendidikanS3: dosen.pendidikanS3 || '',
      pendidikanProfesi: dosen.pendidikanProfesi || '',
      pendidikan: dosen.pendidikan,
      status: dosen.status,
      email: dosen.email,
      phone: dosen.phone,
    })
    setViewMode('edit')
  }

  const handleOpenDetail = (dosen: Dosen) => {
    setSelectedDosen(dosen)
    setViewMode('detail')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const degreeParts = [
      formData.pendidikanS1 ? `S1: ${formData.pendidikanS1}` : '',
      formData.pendidikanProfesi ? `Profesi: ${formData.pendidikanProfesi}` : '',
      formData.pendidikanS2 ? `S2: ${formData.pendidikanS2}` : '',
      formData.pendidikanS3 ? `S3: ${formData.pendidikanS3}` : '',
    ].filter(Boolean)
    const combinedPendidikan = degreeParts.length > 0 ? degreeParts.join(' • ') : formData.pendidikanS1

    if (viewMode === 'edit' && selectedDosen) {
      const updated: Dosen = {
        ...selectedDosen,
        nama: formData.nama,
        nip: formData.nip,
        nuptk: formData.nuptk,
        prodi: formData.prodi,
        jafung: formData.jafung,
        golongan: formData.golongan,
        pendidikanS1: formData.pendidikanS1,
        pendidikanS2: formData.pendidikanS2,
        pendidikanS3: formData.pendidikanS3,
        pendidikanProfesi: formData.pendidikanProfesi,
        pendidikan: combinedPendidikan,
        status: formData.status,
        email: formData.email,
        phone: formData.phone,
      }
      onUpdateDosen(updated)
      onShowToast(`Data dosen ${formData.nama} berhasil diperbarui!`)
    } else {
      const newDosen: Dosen = {
        id: generateEntityId('dosen'),
        nip: formData.nip || '0000000000000000',
        nuptk: formData.nuptk || '',
        nama: formData.nama,
        prodi: formData.prodi,
        jafung: formData.jafung,
        golongan: formData.golongan,
        pendidikanS1: formData.pendidikanS1,
        pendidikanS2: formData.pendidikanS2,
        pendidikanS3: formData.pendidikanS3,
        pendidikanProfesi: formData.pendidikanProfesi,
        pendidikan: combinedPendidikan,
        status: formData.status,
        skpStatus: 'Draft',
        nilaiAkhir: 0,
        email: formData.email || `${formData.nama.toLowerCase().replace(/[^a-z]/g, '')}@bku.ac.id`,
        phone: formData.phone || '',
      }
      onAddDosen(newDosen)
      onShowToast(`Dosen baru ${formData.nama} berhasil ditambahkan!`)
    }
    setViewMode('list')
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmDosen) {
      onDeleteDosen(deleteConfirmDosen.id)
      onShowToast(`Data dosen ${deleteConfirmDosen.nama} telah dihapus.`)
      setDeleteConfirmDosen(null)
    }
  }

  const handleExportExcel = () => {
    const headers = [
      'NIP',
      'Nama Dosen',
      'NUPTK',
      'Prodi',
      'Jafung',
      'Golongan',
      'Pendidikan',
      'Status Kepegawaian',
      'Status SKP',
      'Nilai Akhir',
      'Email',
    ]
    const rows = filteredDosen.map((d) => [
      `"${d.nip || ''}"`,
      `"${d.nama || ''}"`,
      `"${d.nuptk || ''}"`,
      `"${d.prodi || ''}"`,
      `"${d.jafung || ''}"`,
      `"${d.golongan || ''}"`,
      `"${d.pendidikan || ''}"`,
      `"${d.status || ''}"`,
      `"${d.skpStatus || ''}"`,
      d.nilaiAkhir || 0,
      `"${d.email || ''}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Master_Data_Dosen_UBK_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onShowToast('File Excel/CSV data dosen berhasil diunduh ke komputer Anda!')
  }

  const renderManageProdiModal = () => {
    if (!isManageProdiOpen) return null
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--panel-hover)',
            }}
          >
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Kelola Homebase Program Studi
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Tambah, edit, atau hapus pilihan program studi homebase dosen di lingkungan UBK.
              </div>
            </div>
            <button
              onClick={() => setIsManageProdiOpen(false)}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add Input */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Tambah Program Studi Baru
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="custom-input"
                placeholder="Contoh: S1 Fisioterapi..."
                value={newProdiInput}
                onChange={(e) => setNewProdiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddProdi()
                  }
                }}
                style={{ height: 36, fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleAddProdi}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 36, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Prodi List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8 }}>
              Daftar Program Studi ({prodiList.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prodiList.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--panel-hover)',
                    border: '1px solid var(--hair)',
                    gap: 8,
                  }}
                >
                  {editingProdiIdx === idx ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <input
                        type="text"
                        className="custom-input"
                        value={editingProdiValue}
                        onChange={(e) => setEditingProdiValue(e.target.value)}
                        style={{ height: 32, fontSize: '12.5px', flex: 1 }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditProdi(idx)}
                        className="brand-btn btn-action-edit"
                        style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        title="Simpan"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProdiIdx(null)}
                        className="brand-btn brand-btn--outline"
                        style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        title="Batal"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                        {p}
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProdiIdx(idx)
                            setEditingProdiValue(p)
                          }}
                          className="btn-table-action btn-table-action--edit"
                          title="Edit Prodi"
                          aria-label={`Edit ${p}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProdi(idx)}
                          className="btn-table-action btn-table-action--delete"
                          title="Hapus Prodi"
                          aria-label={`Hapus ${p}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--hair)',
              background: 'var(--panel-hover)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => setIsManageProdiOpen(false)}
              className="brand-btn brand-btn--outline"
              style={{ padding: '6px 16px', fontSize: '12.5px' }}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={14} />
              <span>Kembali ke Data Dosen</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 12 }}>
              {viewMode === 'create' ? 'Tambah Data Dosen Baru' : `Edit Data Dosen: ${selectedDosen?.nama}`}
            </h1>
            <p className="page-desc">
              Pangkalan data kepegawaian resmi Direktorat Sumber Daya Manusia Universitas Bhakti Kencana.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoFillDummyDosen}
            className="brand-btn"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
            title="Isi form otomatis dengan data dummy dosen untuk pengujian"
          >
            <Sparkles size={14} className="text-amber-600 animate-pulse" />
            <span>⚡ Isi Form Otomatis (Data Dummy)</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="form-page-card">
          <div className="form-section">
            <div>
              <div className="form-section-title">1. Identitas dan Kepegawaian Dosen</div>
              <div className="form-section-desc">Nomor induk nasional, status kepegawaian, dan penugasan homebase program studi.</div>
            </div>

            <div className="form-field">
              <label className="form-label">Nama Lengkap Beserta Gelar Akademik *</label>
              <input
                type="text"
                required
                className="custom-input"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Dr. apt. Budi Santoso, M.Si"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Nomor Induk Pegawai (NIP) *</label>
                <input
                  type="text"
                  required
                  className="custom-input"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Contoh: 198104152011011002"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Nomor Unik Pendidik &amp; Tenaga Kependidikan (NUPTK)</label>
                <input
                  type="text"
                  className="custom-input"
                  value={formData.nuptk}
                  onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                  placeholder="Contoh: 873841838401375170 (16 digit)"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Homebase Program Studi *</label>
                  <button
                    type="button"
                    onClick={() => setIsManageProdiOpen(true)}
                    className="btn-manage-pill"
                    title="Kelola Opsi Program Studi"
                  >
                    <Settings size={12} />
                    <span>Kelola Prodi</span>
                  </button>
                </div>
                <select
                  className="custom-select"
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                >
                  {prodiList.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  SDM dapat menambah, mengubah, atau menghapus pilihan program studi homebase.
                </span>
              </div>

              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Status Kepegawaian *</label>
                </div>
                <select
                  className="custom-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Dosen['status'] })}
                >
                  <option value="Tetap Yayasan">Tetap Yayasan</option>
                  <option value="PNS DPK">PNS DPK</option>
                  <option value="Dosen Khusus">Dosen Khusus</option>
                </select>
                <span className="form-help">
                  Status ikatan kerja dosen di lingkungan yayasan / institusi.
                </span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div>
              <div className="form-section-title">2. Jabatan Fungsional dan Kualifikasi Pendidikan</div>
              <div className="form-section-desc">Jenjang akademik dosen (JAD), kepangkatan, dan riwayat ijazah perguruan tinggi.</div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Jabatan Fungsional Dosen (JAD) *</label>
                <select
                  className="custom-select"
                  value={formData.jafung}
                  onChange={(e) => setFormData({ ...formData, jafung: e.target.value })}
                >
                  <option value="Guru Besar">Guru Besar</option>
                  <option value="Lektor Kepala">Lektor Kepala</option>
                  <option value="Lektor">Lektor</option>
                  <option value="Asisten Ahli">Asisten Ahli</option>
                  <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Pangkat dan Golongan Ruang *</label>
                <select
                  className="custom-select"
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                >
                  <option value="Pembina Utama / IVe">Pembina Utama / IVe</option>
                  <option value="Pembina Utama Madya / IVd">Pembina Utama Madya / IVd</option>
                  <option value="Pembina Tingkat I / IVb">Pembina Tingkat I / IVb</option>
                  <option value="Pembina / IVa">Pembina / IVa</option>
                  <option value="Penata Tk I / IIId">Penata Tk I / IIId</option>
                  <option value="Penata / IIIc">Penata / IIIc</option>
                  <option value="Penata Muda Tk I / IIIb">Penata Muda Tk I / IIIb</option>
                  <option value="Penata Muda / IIIa">Penata Muda / IIIa</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-field">
                <label className="form-label">
                  Jenjang S1 (Sarjana / D4) * <span style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>(Wajib Diisi)</span>
                </label>
                <input
                  type="text"
                  required
                  className="custom-input"
                  value={formData.pendidikanS1}
                  onChange={(e) => setFormData({ ...formData, pendidikanS1: e.target.value })}
                  placeholder="Contoh: S1 Keperawatan - Universitas Padjadjaran (2002)"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">
                    Jenjang S2 (Magister) <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    className="custom-input"
                    value={formData.pendidikanS2}
                    onChange={(e) => setFormData({ ...formData, pendidikanS2: e.target.value })}
                    placeholder="Contoh: S2 Keperawatan - Universitas Indonesia (2008)"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Jenjang S3 (Doktor) <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    className="custom-input"
                    value={formData.pendidikanS3}
                    onChange={(e) => setFormData({ ...formData, pendidikanS3: e.target.value })}
                    placeholder="Contoh: S3 Ilmu Kedokteran - Universitas Padjadjaran (2015)"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Pendidikan Profesi / Spesialis <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>(Opsional)</span>
                </label>
                <input
                  type="text"
                  className="custom-input"
                  value={formData.pendidikanProfesi}
                  onChange={(e) => setFormData({ ...formData, pendidikanProfesi: e.target.value })}
                  placeholder="Contoh: Profesi Ners / Profesi Apoteker / Profesi Bidan (2003)"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div>
              <div className="form-section-title">3. Kontak dan Akun Resmi Institusi</div>
              <div className="form-section-desc">Email institusi resmi UBK dan nomor kontak komunikasi kepegawaian.</div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Email Institusi (@bku.ac.id)</label>
                <input
                  type="email"
                  className="custom-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama.dosen@bku.ac.id"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Nomor WhatsApp / Seluler</label>
                <input
                  type="text"
                  className="custom-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
            <button
              type="button"
              className="brand-btn brand-btn--outline"
              onClick={() => setViewMode('list')}
            >
              Batal
            </button>
            <button type="submit" className="brand-btn btn-action-add">
              <span>{viewMode === 'create' ? 'Simpan Data Dosen' : 'Perbarui Data Dosen'}</span>
            </button>
          </div>
        </form>

        {renderManageProdiModal()}
      </div>
    )
  }

  if (viewMode === 'detail' && selectedDosen) {
    return (
      <div className="page-container" ref={containerRef}>
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={14} />
              <span>Kembali ke Data Dosen</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 12 }}>
              Profil Dosen: {selectedDosen.nama}
            </h1>
            <p className="page-desc">
              Informasi lengkap biodata kepegawaian, jabatan fungsional, dan status sasaran kinerja.
            </p>
          </div>

          <button
            className="brand-btn btn-action-edit"
            onClick={() => handleOpenEdit(selectedDosen)}
          >
            <Edit2 size={15} />
            <span>Edit Data Dosen</span>
          </button>
        </div>

        <div className="form-page-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 20, borderBottom: '1px solid var(--hair)' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--navy-900)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '20px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {selectedDosen.nama.split(' ')[0][0]}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                {selectedDosen.nama}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 3 }}>
                NIP: <strong style={{ color: 'var(--ink)' }}>{selectedDosen.nip}</strong> &bull; NUPTK: <strong style={{ color: 'var(--ink)' }}>{selectedDosen.nuptk || '-'}</strong> &bull; Homebase: {selectedDosen.prodi}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Jabatan Fungsional</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 4 }}>
                {selectedDosen.jafung}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Pangkat &amp; Golongan</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {selectedDosen.golongan}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Status Kepegawaian</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {selectedDosen.status}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Status SKP Semester Ini</div>
              <div style={{ marginTop: 4 }}>
                <span
                  className={`badge-pill ${
                    selectedDosen.skpStatus === 'Disetujui SDM'
                      ? 'badge-pill--green'
                      : selectedDosen.skpStatus === 'Dinilai Kaprodi'
                      ? 'badge-pill--blue'
                      : selectedDosen.skpStatus === 'Diajukan'
                      ? 'badge-pill--orange'
                      : 'badge-pill--gray'
                  }`}
                >
                  {selectedDosen.skpStatus}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)', background: 'var(--panel-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              <GraduationCap size={16} color="var(--brand-600)" />
              <span>Riwayat Kualifikasi Pendidikan Formal</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
                <span style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 700 }}>Jenjang S1 (Sarjana / D4)</span>
                <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 3, fontWeight: 500 }}>
                  {selectedDosen.pendidikanS1 || selectedDosen.pendidikan || '-'}
                </div>
              </div>
              {selectedDosen.pendidikanProfesi && (
                <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Pendidikan Profesi</span>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 3, fontWeight: 500 }}>
                    {selectedDosen.pendidikanProfesi}
                  </div>
                </div>
              )}
              {selectedDosen.pendidikanS2 && (
                <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Jenjang S2 (Magister)</span>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 3, fontWeight: 500 }}>
                    {selectedDosen.pendidikanS2}
                  </div>
                </div>
              )}
              {selectedDosen.pendidikanS3 && (
                <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Jenjang S3 (Doktor)</span>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 3, fontWeight: 500 }}>
                    {selectedDosen.pendidikanS3}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <Mail size={18} color="var(--brand-600)" />
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Email Akun Resmi</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>{selectedDosen.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <Phone size={18} color="var(--brand-600)" />
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Nomor WhatsApp / Seluler</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>{selectedDosen.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kelola Data Dosen UBK</h1>
          <p className="page-desc">
            Manajemen master data dosen tetap, NIP, NUPTK, jenjang jabatan fungsional, dan status Tridharma perguruan tinggi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleOpenCreate} className="brand-btn btn-action-add">
            <Plus size={16} />
            <span>Tambah Dosen Baru</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="brand-btn btn-action-print"
          >
            <Download size={16} />
            <span>Ekspor XLSX</span>
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="custom-input"
            style={{ paddingLeft: '38px', height: 38 }}
            placeholder="Cari nama dosen, NIP, atau NUPTK..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div style={{ flex: '0 1 auto', minWidth: 210 }}>
          <select
            className="custom-select"
            style={{ height: 38, width: '100%', fontSize: '13px', fontWeight: 600 }}
            value={selectedProdi}
            onChange={(e) => {
              setSelectedProdi(e.target.value)
              setPage(1)
            }}
          >
            <option value="Semua Program Studi">Semua Program Studi</option>
            {prodiList.map((prodi, idx) => (
              <option key={idx} value={prodi}>
                {prodi}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 auto', minWidth: 160 }}>
          <select
            className="custom-select"
            style={{ height: 38, width: '100%', fontSize: '13px', fontWeight: 600 }}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Tetap Yayasan">Tetap Yayasan</option>
            <option value="PNS DPK">PNS DPK</option>
            <option value="Dosen Khusus">Dosen Khusus</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '12.5px', color: 'var(--muted)', fontWeight: 500 }}>
          Menampilkan <strong style={{ color: 'var(--ink)' }}>{filteredDosen.length}</strong> dari {dosenList.length} Dosen
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table custom-table--sticky-1">
          <thead>
            <tr>
              <th style={{ minWidth: 240 }}>Nama Dosen &amp; Identitas</th>
              <th>Homebase Prodi</th>
              <th>Jabatan Fungsional</th>
              <th>Pangkat / Golongan</th>
              <th>Status</th>
              <th>Status SKP</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDosen.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  Tidak ada dosen yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              paginatedDosen.map((dosen) => (
                <tr key={dosen.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px' }}>{dosen.nama}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        NIP: {dosen.nip ? dosen.nip : '-'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        NUPTK: {dosen.nuptk ? dosen.nuptk : '-'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{dosen.prodi}</div>
                    <div style={{ fontSize: '11px', color: 'var(--faint)' }}>Universitas Bhakti Kencana</div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--r-xs)',
                        background: 'var(--panel-hover)',
                        border: '1px solid var(--hair)',
                        color: 'var(--brand-700)',
                        fontWeight: 600,
                        fontSize: '11.5px',
                      }}
                    >
                      {dosen.jafung}
                    </span>
                  </td>
                  <td>{dosen.golongan}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{dosen.status}</span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        dosen.skpStatus === 'Disetujui SDM'
                          ? 'badge-pill--green'
                          : dosen.skpStatus === 'Dinilai Kaprodi'
                          ? 'badge-pill--blue'
                          : dosen.skpStatus === 'Diajukan'
                          ? 'badge-pill--orange'
                          : 'badge-pill--gray'
                      }`}
                    >
                      {dosen.skpStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        title="Lihat Detail Profil"
                        onClick={() => handleOpenDetail(dosen)}
                        className="btn-table-action btn-table-action--view"
                        aria-label={`Detail ${dosen.nama}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title="Edit Data Dosen"
                        onClick={() => handleOpenEdit(dosen)}
                        className="btn-table-action btn-table-action--edit"
                        aria-label={`Edit ${dosen.nama}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        title="Hapus Dosen"
                        onClick={() => setDeleteConfirmDosen(dosen)}
                        className="btn-table-action btn-table-action--delete"
                        aria-label={`Hapus ${dosen.nama}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        totalItems={filteredDosen.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteConfirmDosen)}
        title="Konfirmasi Hapus Data Dosen"
        message={`Apakah Anda yakin ingin menghapus data dosen "${deleteConfirmDosen?.nama}" dari pangkalan data UBK? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Dosen"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmDosen(null)}
      />

      {renderManageProdiModal()}
    </div>
  )
}
