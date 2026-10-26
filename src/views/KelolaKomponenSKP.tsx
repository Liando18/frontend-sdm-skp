import React, { useState, useRef } from 'react'
import { Plus, Edit2, Trash2, ArrowLeft, Search, Filter, ShieldCheck, Users, Settings, X, Check } from 'lucide-react'
import { KomponenSKP, TargetJabatanSKP, KategoriKomponenSKP } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStaggerEntrance } from '../utils/animations'

interface KelolaKomponenSKPProps {
  komponenList: KomponenSKP[]
  onAddKomponen: (item: KomponenSKP) => void
  onUpdateKomponen: (item: KomponenSKP) => void
  onDeleteKomponen: (id: string) => void
  onShowToast: (msg: string) => void
}

const TARGET_JABATAN_OPTIONS: TargetJabatanSKP[] = [
  'Semua Jabatan',
  'Rektor',
  'Wakil Rektor',
  'Dekan',
  'Wakil Dekan',
  'Ketua Program Studi',
  'Dosen Tetap',
  'Tenaga Kependidikan / Staf',
]

const KATEGORI_OPTIONS: KategoriKomponenSKP[] = [
  'Pendidikan',
  'Penelitian',
  'Pengabdian',
  'Penunjang',
  'Tugas Tambahan',
  'Layanan Akademik',
  'Administrasi & Tata Usaha',
  'Tata Kelola & Keuangan',
]

const COMMON_SATUAN_LIST = [
  'SKS',
  'Mahasiswa',
  'Kegiatan',
  'Jurnal',
  'Modul/buku',
  'Poster/Oral',
  'Chapter/Monograf/Referensi',
  'Haki/paten',
  'Artikel',
  'Semester',
  'Berkas',
  'Laporan',
  'Dokumen',
]

export const KelolaKomponenSKP: React.FC<KelolaKomponenSKPProps> = ({
  komponenList,
  onAddKomponen,
  onUpdateKomponen,
  onDeleteKomponen,
  onShowToast,
}) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialMode = searchParams?.get('mode') === 'create' ? 'create' : 'list'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>(initialMode)
  const [editingItem, setEditingItem] = useState<KomponenSKP | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KomponenSKP | null>(null)
  const [filterTargetJabatan, setFilterTargetJabatan] = useState<string>('Semua')
  const [filterKategori, setFilterKategori] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  const [kategoriList, setKategoriList] = useState<string[]>(KATEGORI_OPTIONS)
  const [isManageKategoriOpen, setIsManageKategoriOpen] = useState(false)
  const [newKategoriInput, setNewKategoriInput] = useState('')
  const [editingKategoriIdx, setEditingKategoriIdx] = useState<number | null>(null)
  const [editingKategoriValue, setEditingKategoriValue] = useState('')

  const handleAddKategori = () => {
    const val = newKategoriInput.trim()
    if (!val) return
    if (kategoriList.includes(val)) {
      onShowToast('Kategori Tridharma / Layanan tersebut sudah ada!')
      return
    }
    setKategoriList([...kategoriList, val])
    setFormData((prev) => ({ ...prev, kategori: val as any }))
    setNewKategoriInput('')
    onShowToast(`Kategori "${val}" berhasil ditambahkan!`)
  }

  const handleSaveEditKategori = (index: number) => {
    const val = editingKategoriValue.trim()
    if (!val) return
    const oldVal = kategoriList[index]
    const updated = [...kategoriList]
    updated[index] = val
    setKategoriList(updated)
    if (formData.kategori === oldVal) {
      setFormData((prev) => ({ ...prev, kategori: val as any }))
    }
    setEditingKategoriIdx(null)
    setEditingKategoriValue('')
    onShowToast('Kategori berhasil diperbarui!')
  }

  const handleDeleteKategori = (index: number) => {
    if (kategoriList.length <= 1) {
      onShowToast('Minimal harus ada 1 kategori!')
      return
    }
    const removed = kategoriList[index]
    const updated = kategoriList.filter((_, i) => i !== index)
    setKategoriList(updated)
    if (formData.kategori === removed) {
      setFormData((prev) => ({ ...prev, kategori: updated[0] as any }))
    }
    onShowToast(`Kategori "${removed}" telah dihapus.`)
  }

  const [formData, setFormData] = useState<{
    kode: string
    targetJabatan: TargetJabatanSKP
    kategori: KategoriKomponenSKP
    namaKegiatan: string
    targetOutput: string
    satuan: string
    waktuNilai: number
    waktuSatuan: 'bulan' | 'tahun'
  }>({
    kode: '',
    targetJabatan: 'Dosen Tetap',
    kategori: 'Pendidikan',
    namaKegiatan: '',
    targetOutput: '',
    satuan: 'SKS',
    waktuNilai: 6,
    waktuSatuan: 'bulan',
  })

  const filteredKomponen = komponenList.filter((k) => {
    const matchJabatan =
      filterTargetJabatan === 'Semua' ||
      filterTargetJabatan === 'Semua Jabatan' ||
      k.targetJabatan === filterTargetJabatan ||
      k.targetJabatan === 'Semua Jabatan'
    const matchKategori = filterKategori === 'Semua' || k.kategori === filterKategori
    const matchSearch =
      k.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.targetOutput.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.targetJabatan && k.targetJabatan.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchJabatan && matchKategori && matchSearch
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [filteredKomponen, viewMode], { y: 8, stagger: 0.03 })

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      kode: `KOMP-0${komponenList.length + 1}`,
      targetJabatan: 'Dosen Tetap',
      kategori: 'Pendidikan',
      namaKegiatan: '',
      targetOutput: '',
      satuan: 'SKS',
      waktuNilai: 6,
      waktuSatuan: 'bulan',
    })
    setViewMode('create')
  }

  const handleOpenEdit = (item: KomponenSKP) => {
    setEditingItem(item)
    setFormData({
      kode: item.kode,
      targetJabatan: item.targetJabatan || 'Dosen Tetap',
      kategori: item.kategori,
      namaKegiatan: item.namaKegiatan,
      targetOutput: item.targetOutput,
      satuan: item.satuan,
      waktuNilai: item.waktuNilai || 6,
      waktuSatuan: item.waktuSatuan || 'bulan',
    })
    setViewMode('edit')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (viewMode === 'edit' && editingItem) {
      const updated: KomponenSKP = {
        ...editingItem,
        kode: formData.kode,
        targetJabatan: formData.targetJabatan,
        kategori: formData.kategori,
        namaKegiatan: formData.namaKegiatan,
        targetOutput: formData.targetOutput,
        satuan: formData.satuan,
        waktuNilai: Number(formData.waktuNilai),
        waktuSatuan: formData.waktuSatuan,
      }
      onUpdateKomponen(updated)
      onShowToast(`Komponen SKP ${formData.kode} untuk jabatan ${formData.targetJabatan} berhasil diperbarui!`)
    } else {
      const newItem: KomponenSKP = {
        id: `komp-${Date.now()}`,
        kode: formData.kode,
        targetJabatan: formData.targetJabatan,
        kategori: formData.kategori,
        namaKegiatan: formData.namaKegiatan,
        targetOutput: formData.targetOutput,
        satuan: formData.satuan,
        waktuNilai: Number(formData.waktuNilai),
        waktuSatuan: formData.waktuSatuan,
      }
      onAddKomponen(newItem)
      onShowToast(`Komponen SKP baru ${formData.kode} untuk target ${formData.targetJabatan} berhasil ditambahkan!`)
    }
    setViewMode('list')
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteKomponen(deleteTarget.id)
      onShowToast(`Komponen ${deleteTarget.kode} telah dihapus.`)
      setDeleteTarget(null)
    }
  }

  const renderManageKategoriModal = () => {
    if (!isManageKategoriOpen) return null
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
                Kelola Kategori Tridharma / Layanan SKP
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Tambah, edit, atau hapus pilihan kategori Tridharma perguruan tinggi atau layanan institusi.
              </div>
            </div>
            <button
              onClick={() => setIsManageKategoriOpen(false)}
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
              Tambah Kategori Baru
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="custom-input"
                placeholder="Contoh: Pengabdian Masyarakat Internasional..."
                value={newKategoriInput}
                onChange={(e) => setNewKategoriInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddKategori()
                  }
                }}
                style={{ height: 36, fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleAddKategori}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 36, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Kategori List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8 }}>
              Daftar Kategori Tersedia ({kategoriList.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kategoriList.map((kat, idx) => (
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
                  {editingKategoriIdx === idx ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <input
                        type="text"
                        className="custom-input"
                        value={editingKategoriValue}
                        onChange={(e) => setEditingKategoriValue(e.target.value)}
                        style={{ height: 32, fontSize: '12.5px', flex: 1 }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditKategori(idx)}
                        className="brand-btn btn-action-edit"
                        style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        title="Simpan"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingKategoriIdx(null)}
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
                        {kat}
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKategoriIdx(idx)
                            setEditingKategoriValue(kat)
                          }}
                          className="btn-table-action btn-table-action--edit"
                          title="Edit Kategori"
                          aria-label={`Edit ${kat}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKategori(idx)}
                          className="btn-table-action btn-table-action--delete"
                          title="Hapus Kategori"
                          aria-label={`Hapus ${kat}`}
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
              onClick={() => setIsManageKategoriOpen(false)}
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
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar Komponen SKP</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 14 }}>
              {viewMode === 'create' ? 'Tambah Komponen Standar SKP' : `Edit Komponen: ${editingItem?.kode}`}
            </h1>
            <p className="page-desc">
              Konfigurasi pedoman operasional beban kerja sesuai target jenjang jabatan (Rektor hingga Staf), kategori Tridharma/Layanan, satuan output, dan bukti fisik luaran.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="form-page-card">
          {/* Section 1: Target Jabatan & Kategori */}
          <div className="form-section">
            <div>
              <div className="form-section-title">1. Penugasan &amp; Target Jenjang Jabatan</div>
              <div className="form-section-desc">
                Tentukan target jabatan penerima komponen SKP ini serta klasifikasi kategori Tridharma atau Layanan Institusi.
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Kode Komponen *</label>
                </div>
                <input
                  type="text"
                  required
                  className="custom-input"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  placeholder="Misal: PD-01, KAP-01, DKN-01, STF-01"
                />
                <span className="form-help">
                  Kode unik referensi SPMI.
                </span>
              </div>

              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Target Jabatan *</label>
                </div>
                <select
                  className="custom-select"
                  value={formData.targetJabatan}
                  onChange={(e) => setFormData({ ...formData, targetJabatan: e.target.value as TargetJabatanSKP })}
                >
                  {TARGET_JABATAN_OPTIONS.map((jab, idx) => (
                    <option key={idx} value={jab}>
                      {jab}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  Setiap jabatan memiliki komponen kegiatan spesifik.
                </span>
              </div>

              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Kategori Tridharma / Layanan *</label>
                  <button
                    type="button"
                    onClick={() => setIsManageKategoriOpen(true)}
                    className="btn-manage-pill"
                    title="Kelola Opsi Kategori"
                  >
                    <Settings size={12} />
                    <span>Kelola Kategori</span>
                  </button>
                </div>
                <select
                  className="custom-select"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as KategoriKomponenSKP })}
                >
                  {kategoriList.map((kat, idx) => (
                    <option key={idx} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  SDM dapat menambah, mengubah, atau menghapus kategori Tridharma/Layanan.
                </span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Uraian Spesifik Kegiatan Tugas Jabatan *</label>
              <textarea
                required
                rows={3}
                className="custom-input"
                value={formData.namaKegiatan}
                onChange={(e) => setFormData({ ...formData, namaKegiatan: e.target.value })}
                placeholder="Tuliskan nama kegiatan formal standar, misal: Melaksanakan Pengajaran minimal 3 SKS"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Section 2: Kuan / Output, Waktu & Dokumen Bukti Fisik */}
          <div className="form-section">
            <div>
              <div className="form-section-title">2. Satuan Output, Waktu Pengerjaan &amp; Dokumen Bukti Fisik</div>
              <div className="form-section-desc">
                Tentukan jenis satuan kuantitas luaran, durasi pengerjaan, dan bukti fisik SPMI UBK yang dipersyaratkan.
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field">
                <label className="form-label">Satuan Kuan / Output *</label>
                <input
                  type="text"
                  required
                  list="satuan-options-list"
                  className="custom-input"
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  placeholder="Misal: SKS, Mahasiswa, Kegiatan, Jurnal"
                />
                <datalist id="satuan-options-list">
                  {COMMON_SATUAN_LIST.map((st, idx) => (
                    <option key={idx} value={st} />
                  ))}
                </datalist>
              </div>

              <div className="form-field">
                <label className="form-label">Waktu Pengerjaan (Angka) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="custom-input"
                  value={formData.waktuNilai}
                  onChange={(e) => setFormData({ ...formData, waktuNilai: Number(e.target.value) })}
                  placeholder="Misal: 6 atau 12"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Rentang Waktu *</label>
                <select
                  className="custom-select"
                  value={formData.waktuSatuan}
                  onChange={(e) => setFormData({ ...formData, waktuSatuan: e.target.value as 'bulan' | 'tahun' })}
                >
                  <option value="bulan">Bulan (Semester / 6 Bulan / 12 Bulan)</option>
                  <option value="tahun">Tahun (1 Tahun Penuh)</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Deskripsi Dokumen Bukti Fisik Luaran *</label>
              <input
                type="text"
                required
                className="custom-input"
                value={formData.targetOutput}
                onChange={(e) => setFormData({ ...formData, targetOutput: e.target.value })}
                placeholder="Contoh: Silabus, RPS, BAP, Lembar Pengesahan, SK Tugas, Naskah Jurnal, Laporan PKM"
              />
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
                Luaran ini akan diverifikasi oleh atasan langsung (Kaprodi / Dekan / SDM) saat penilaian SKP.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10 }}>
            <button
              type="button"
              className="brand-btn brand-btn--outline"
              style={{ padding: '10px 24px' }}
              onClick={() => setViewMode('list')}
            >
              Batal
            </button>
            <button type="submit" className="brand-btn btn-action-add" style={{ padding: '10px 28px' }}>
              <span>{viewMode === 'create' ? 'Simpan Komponen SKP' : 'Perbarui Komponen'}</span>
            </button>
          </div>
        </form>

        {renderManageKategoriModal()}
      </div>
    )
  }

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Komponen SKP Berbasis Jabatan</h1>
          <p className="page-desc">
            Katalog baku kegiatan jabatan dari Rektor hingga Staf Tenaga Kependidikan dengan standar luaran SPMI UBK. Komponen ini otomatis termuat pada formulir pengisian SKP.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="brand-btn btn-action-add" style={{ padding: '10px 20px' }}>
          <Plus size={16} />
          <span>Tambah Komponen SKP</span>
        </button>
      </div>

      {/* Filter Bar: Target Jabatan + Kategori + Pencarian */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Target Jabatan Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--navy-900)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Filter size={15} color="var(--brand-600)" />
              <span>Target Jabatan</span>
            </div>
            <select
              className="custom-select"
              style={{ width: 'auto', minWidth: 230, height: 38, fontSize: '13px', fontWeight: 600 }}
              value={filterTargetJabatan}
              onChange={(e) => setFilterTargetJabatan(e.target.value)}
            >
              <option value="Semua">Semua Target Jabatan</option>
              {TARGET_JABATAN_OPTIONS.map((jab, idx) => (
                <option key={idx} value={jab}>
                  {jab}
                </option>
              ))}
            </select>

            <span style={{ color: 'var(--hair)', margin: '0 4px' }}>|</span>

            {/* Total count badge */}
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
              Menampilkan <strong>{filteredKomponen.length}</strong> dari <strong>{komponenList.length}</strong> komponen standar
            </span>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Cari kode atau nama kegiatan..."
              className="custom-input"
              style={{ paddingLeft: 30, height: 38, fontSize: '12.5px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Kategori Quick Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            paddingTop: 4,
            borderTop: '1px solid var(--hair-subtle)',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginRight: 4, whiteSpace: 'nowrap' }}>
            Kategori
          </span>
          <button
            onClick={() => setFilterKategori('Semua')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--r-md)',
              border: filterKategori === 'Semua' ? '1px solid var(--navy-900)' : '1px solid var(--hair)',
              background: filterKategori === 'Semua' ? 'var(--navy-900)' : 'var(--panel-bg)',
              color: filterKategori === 'Semua' ? '#ffffff' : 'var(--muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Semua ({komponenList.length})
          </button>
          {kategoriList.map((kat, idx) => {
            const count = komponenList.filter((k) => k.kategori === kat).length
            if (count === 0) return null
            return (
              <button
                key={idx}
                onClick={() => setFilterKategori(kat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--r-md)',
                  border: filterKategori === kat ? '1px solid var(--navy-900)' : '1px solid var(--hair)',
                  background: filterKategori === kat ? 'var(--navy-900)' : 'var(--panel-bg)',
                  color: filterKategori === kat ? '#ffffff' : 'var(--muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {kat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table of Components */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: 85 }}>Kode</th>
              <th>Target Jabatan</th>
              <th>Kategori</th>
              <th>Kegiatan Tugas Jabatan</th>
              <th style={{ textAlign: 'center' }}>Satuan Output</th>
              <th style={{ textAlign: 'center' }}>Waktu</th>
              <th>Dokumen Bukti Fisik Luaran</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredKomponen.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  Tidak ada komponen SKP yang cocok dengan filter jabatan atau kata kunci pencarian.
                </td>
              </tr>
            ) : (
              filteredKomponen.map((komp) => (
                <tr key={komp.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: 'var(--panel-hover)',
                        border: '1px solid var(--hair)',
                        padding: '3px 8px',
                        borderRadius: 'var(--r-xs)',
                        fontSize: '11.5px',
                        color: 'var(--ink)',
                      }}
                    >
                      {komp.kode}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        komp.targetJabatan === 'Ketua Program Studi'
                          ? 'badge-pill--blue'
                          : komp.targetJabatan === 'Dekan'
                          ? 'badge-pill--green'
                          : komp.targetJabatan === 'Tenaga Kependidikan / Staf'
                          ? 'badge-pill--orange'
                          : komp.targetJabatan === 'Rektor' || komp.targetJabatan === 'Wakil Rektor'
                          ? 'badge-pill--blue'
                          : 'badge-pill--gray'
                      }`}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      {komp.targetJabatan || 'Dosen Tetap'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        komp.kategori === 'Pendidikan'
                          ? 'badge-pill--green'
                          : komp.kategori === 'Penelitian'
                          ? 'badge-pill--blue'
                          : komp.kategori === 'Pengabdian'
                          ? 'badge-pill--orange'
                          : komp.kategori === 'Tugas Tambahan'
                          ? 'badge-pill--blue'
                          : 'badge-pill--gray'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {komp.kategori}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px', maxWidth: 320, lineHeight: 1.4 }}>
                      {komp.namaKegiatan}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '12.5px' }}>
                      {komp.satuan}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '12px' }}>
                      {komp.waktuNilai || 6} {komp.waktuSatuan || 'bulan'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: 240, lineHeight: 1.35 }}>
                    {komp.targetOutput}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(komp)}
                        title="Edit Komponen"
                        className="btn-table-action btn-table-action--edit"
                        aria-label={`Edit ${komp.kode}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(komp)}
                        title="Hapus Komponen"
                        className="btn-table-action btn-table-action--delete"
                        aria-label={`Hapus ${komp.kode}`}
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Konfirmasi Hapus Komponen SKP"
        message={`Apakah Anda yakin ingin menghapus komponen "${deleteTarget?.kode} : ${deleteTarget?.namaKegiatan}" (Target: ${deleteTarget?.targetJabatan})? Komponen yang dihapus tidak akan otomatis termuat lagi pada pengisian SKP baru.`}
        confirmText="Hapus Komponen"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {renderManageKategoriModal()}
    </div>
  )
}
