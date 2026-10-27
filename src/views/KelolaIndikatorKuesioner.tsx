import React, { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, ArrowLeft, Award, Settings, X, Check, Loader2 } from 'lucide-react'
import { IndikatorKuesioner } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStaggerEntrance } from '../utils/animations'
import { api } from '../services/api'

interface KelolaIndikatorKuesionerProps {
  indikatorList: IndikatorKuesioner[]
  onAddIndikator: (item: IndikatorKuesioner) => Promise<void> | void
  onUpdateIndikator: (item: IndikatorKuesioner) => Promise<void> | void
  onDeleteIndikator: (id: string) => Promise<void> | void
  onShowToast: (msg: string) => void
}

const DEFAULT_ASPEK_LIST = [
  'Orientasi Pelayanan',
  'Akuntabel',
  'Kompeten',
  'Harmonis',
  'Loyal',
  'Adaptif',
  'Kolaboratif',
]

export const KelolaIndikatorKuesioner: React.FC<KelolaIndikatorKuesionerProps> = ({
  indikatorList,
  onAddIndikator,
  onUpdateIndikator,
  onDeleteIndikator,
  onShowToast,
}) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialMode = searchParams?.get('mode') === 'create' ? 'create' : 'list'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>(initialMode)
  const [editingItem, setEditingItem] = useState<IndikatorKuesioner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IndikatorKuesioner | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Customizable Dimensi Aspek Perilaku (Dinamis dari Backend & Database)
  const [aspekList, setAspekList] = useState<string[]>(DEFAULT_ASPEK_LIST)
  const [isManageAspekOpen, setIsManageAspekOpen] = useState(false)
  const [newAspekInput, setNewAspekInput] = useState('')
  const [editingAspekIdx, setEditingAspekIdx] = useState<number | null>(null)
  const [editingAspekValue, setEditingAspekValue] = useState('')

  // Sync aspek list dynamically from backend & current indicators
  useEffect(() => {
    api.indikator
      .getAspek()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAspekList((prev) => Array.from(new Set([...DEFAULT_ASPEK_LIST, ...prev, ...res])))
        }
      })
      .catch(() => {
        const fromIndikator = indikatorList.map((i) => i.aspek).filter(Boolean)
        setAspekList((prev) => Array.from(new Set([...DEFAULT_ASPEK_LIST, ...prev, ...fromIndikator])))
      })
  }, [indikatorList])

  const [formData, setFormData] = useState({
    kode: '',
    aspek: 'Orientasi Pelayanan',
    indikatorUtama: '',
    indikatorPendukung: ['', ''] as string[],
    criticalPoint: '',
    skalaKeterangan: '4 = Semua indikator terpenuhi; 3 = Termasuk poin utama terpenuhi; 2 = Sebagian terpenuhi; 1 = Belum terpenuhi.',
  })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.custom-table tbody tr', [indikatorList, viewMode], { y: 8, stagger: 0.04 })

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      kode: `BP-0${indikatorList.length + 1}`,
      aspek: aspekList[0] || 'Orientasi Pelayanan',
      indikatorUtama: '',
      indikatorPendukung: ['', ''],
      criticalPoint: '',
      skalaKeterangan: '4 = Semua indikator terpenuhi; 3 = Termasuk poin utama terpenuhi; 2 = Sebagian terpenuhi; 1 = Belum terpenuhi.',
    })
    setViewMode('create')
  }

  const handleOpenEdit = (item: IndikatorKuesioner) => {
    setEditingItem(item)

    let supporting =
      item.indikatorPendukung && item.indikatorPendukung.length > 0
        ? [...item.indikatorPendukung]
        : [item.indikatorDua || '', item.indikatorTiga || ''].filter(Boolean)

    if (supporting.length === 0) {
      supporting = ['']
    }

    setFormData({
      kode: item.kode,
      aspek: item.aspek,
      indikatorUtama: item.indikatorUtama,
      indikatorPendukung: supporting,
      criticalPoint: item.criticalPoint,
      skalaKeterangan: item.skalaKeterangan,
    })
    setViewMode('edit')
  }

  // Supporting Indicator Handlers
  const handleAddSupporting = () => {
    setFormData((prev) => ({
      ...prev,
      indikatorPendukung: [...prev.indikatorPendukung, ''],
    }))
  }

  const handleRemoveSupporting = (index: number) => {
    if (formData.indikatorPendukung.length <= 1) {
      onShowToast('Minimal harus ada 1 indikator pendukung perilaku kerja!')
      return
    }
    setFormData((prev) => ({
      ...prev,
      indikatorPendukung: prev.indikatorPendukung.filter((_, idx) => idx !== index),
    }))
  }

  const handleUpdateSupporting = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.indikatorPendukung]
      updated[index] = value
      return { ...prev, indikatorPendukung: updated }
    })
  }

  // Dimensi Aspek Handlers (Tambah, Edit, Hapus)
  const handleAddAspek = () => {
    const val = newAspekInput.trim()
    if (!val) return
    if (aspekList.includes(val)) {
      onShowToast('Dimensi aspek perilaku tersebut sudah ada!')
      return
    }
    setAspekList([...aspekList, val])
    setFormData((prev) => ({ ...prev, aspek: val }))
    setNewAspekInput('')
    onShowToast(`Dimensi aspek "${val}" berhasil ditambahkan!`)
  }

  const handleSaveEditAspek = (index: number) => {
    const val = editingAspekValue.trim()
    if (!val) return
    const oldVal = aspekList[index]
    const updated = [...aspekList]
    updated[index] = val
    setAspekList(updated)
    if (formData.aspek === oldVal) {
      setFormData((prev) => ({ ...prev, aspek: val }))
    }
    setEditingAspekIdx(null)
    setEditingAspekValue('')
    onShowToast('Dimensi aspek berhasil diperbarui!')
  }

  const handleDeleteAspek = (index: number) => {
    if (aspekList.length <= 1) {
      onShowToast('Minimal harus ada 1 dimensi aspek!')
      return
    }
    const removed = aspekList[index]
    const updated = aspekList.filter((_, i) => i !== index)
    setAspekList(updated)
    if (formData.aspek === removed) {
      setFormData((prev) => ({ ...prev, aspek: updated[0] }))
    }
    onShowToast(`Dimensi aspek "${removed}" telah dihapus.`)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanSupporting = formData.indikatorPendukung.map((s) => s.trim()).filter(Boolean)
    if (cleanSupporting.length === 0) {
      onShowToast('Harap isi minimal 1 indikator pendukung perilaku kerja!')
      return
    }

    setIsSaving(true)
    try {
      if (viewMode === 'edit' && editingItem) {
        const updated: IndikatorKuesioner = {
          ...editingItem,
          kode: formData.kode,
          aspek: formData.aspek,
          indikatorUtama: formData.indikatorUtama,
          indikatorPendukung: cleanSupporting,
          indikatorDua: cleanSupporting[0] || '',
          indikatorTiga: cleanSupporting[1] || '',
          criticalPoint: formData.criticalPoint || formData.indikatorUtama,
          skalaKeterangan: formData.skalaKeterangan,
        }
        await onUpdateIndikator(updated)
        onShowToast(`Indikator kuesioner "${formData.aspek}" berhasil diperbarui di database!`)
      } else {
        const newItem: IndikatorKuesioner = {
          id: `ind-${Date.now()}`,
          kode: formData.kode,
          aspek: formData.aspek,
          indikatorUtama: formData.indikatorUtama,
          indikatorPendukung: cleanSupporting,
          indikatorDua: cleanSupporting[0] || '',
          indikatorTiga: cleanSupporting[1] || '',
          criticalPoint: formData.criticalPoint || formData.indikatorUtama,
          skalaKeterangan: formData.skalaKeterangan,
        }
        await onAddIndikator(newItem)
        onShowToast(`Indikator baru "${formData.aspek}" berhasil ditambahkan dan disimpan!`)
      }
      setViewMode('list')
    } catch (err: any) {
      console.error('Gagal menyimpan indikator:', err)
      onShowToast(err?.message || 'Gagal menyimpan indikator ke database')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await onDeleteIndikator(deleteTarget.id)
        onShowToast(`Indikator ${deleteTarget.aspek} telah dihapus.`)
      } catch (err: any) {
        console.error('Gagal menghapus indikator:', err)
        onShowToast(err?.message || 'Gagal menghapus indikator')
      } finally {
        setDeleteTarget(null)
      }
    }
  }

  const renderManageAspekModal = () => {
    if (!isManageAspekOpen) return null

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
            maxWidth: 520,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
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
                Kelola Dimensi Aspek Perilaku
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Tambah, edit, atau sesuaikan pilihan kategori dimensi BerAKHLAK.
              </div>
            </div>
            <button
              onClick={() => setIsManageAspekOpen(false)}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add New Aspek Input */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Tambah Dimensi Aspek Baru
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="custom-input"
                placeholder="Contoh: Kepemimpinan, Integritas Akademik..."
                value={newAspekInput}
                onChange={(e) => setNewAspekInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAspek()
                  }
                }}
                style={{ height: 36, fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleAddAspek}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 36, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Aspek List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8 }}>
              Daftar Dimensi Tersedia ({aspekList.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aspekList.map((asp, idx) => {
                const count = indikatorList.filter((i) => i.aspek === asp).length
                return (
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
                    {editingAspekIdx === idx ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <input
                          type="text"
                          className="custom-input"
                          value={editingAspekValue}
                          onChange={(e) => setEditingAspekValue(e.target.value)}
                          style={{ height: 32, fontSize: '12.5px', flex: 1 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditAspek(idx)}
                          className="brand-btn btn-action-edit"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                          title="Simpan"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAspekIdx(null)}
                          className="brand-btn brand-btn--outline"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                          title="Batal"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                            {asp}
                          </span>
                          {count > 0 ? (
                            <span className="badge-pill badge-pill--blue" style={{ fontSize: '10px' }}>
                              {count} Butir
                            </span>
                          ) : (
                            <span className="badge-pill" style={{ fontSize: '10px', background: 'var(--hair)', color: 'var(--muted)' }}>
                              Belum ada butir
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {count === 0 && viewMode === 'list' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsManageAspekOpen(false)
                                setEditingItem(null)
                                setFormData({
                                  kode: `BP-0${indikatorList.length + 1}`,
                                  aspek: asp,
                                  indikatorUtama: '',
                                  indikatorPendukung: ['', ''],
                                  criticalPoint: '',
                                  skalaKeterangan: '4 = Semua indikator terpenuhi; 3 = Termasuk poin utama terpenuhi; 2 = Sebagian terpenuhi; 1 = Belum terpenuhi.',
                                })
                                setViewMode('create')
                              }}
                              className="brand-btn btn-action-add"
                              style={{ padding: '3px 8px', height: 28, fontSize: '11px' }}
                              title="Buat Indikator untuk Dimensi ini"
                            >
                              <Plus size={12} />
                              <span>Buat Butir</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAspekIdx(idx)
                              setEditingAspekValue(asp)
                            }}
                            className="btn-table-action btn-table-action--edit"
                            title="Edit Dimensi"
                            aria-label={`Edit ${asp}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAspek(idx)}
                            className="btn-table-action btn-table-action--delete"
                            title="Hapus Dimensi"
                            aria-label={`Hapus ${asp}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--hair)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--panel-hover)',
            }}
          >
            <button
              type="button"
              onClick={() => setIsManageAspekOpen(false)}
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
              <ArrowLeft size={14} />
              <span>Kembali ke Indikator Kuesioner</span>
            </button>
            <h1 className="page-title" style={{ marginTop: 12 }}>
              {viewMode === 'create' ? 'Tambah Indikator Perilaku Baru' : `Edit Indikator: ${editingItem?.aspek}`}
            </h1>
            <p className="page-desc">
              Instrumen penilaian evaluasi perilaku kerja BerAKHLAK Universitas Bhakti Kencana.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="form-page-card">
          {/* Section 1: Kode & Dimensi Aspek */}
          <div className="form-section">
            <div>
              <div className="form-section-title">1. Aspek Dimensi dan Kode Butir Instrumen</div>
              <div className="form-section-desc">Identifikasi kode butir instrumen dan kategori dimensi BerAKHLAK.</div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Kode Indikator *</label>
                </div>
                <input
                  type="text"
                  required
                  className="custom-input"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  placeholder="Contoh: BP-01, BP-02"
                />
                <span className="form-help">
                  Kode butir instrumen evaluasi.
                </span>
              </div>

              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Dimensi Aspek Perilaku *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageAspekOpen(true)
                      setNewAspekInput('')
                      setEditingAspekIdx(null)
                    }}
                    className="btn-manage-pill"
                    title="Kelola Opsi Dimensi"
                  >
                    <Settings size={12} />
                    <span>Kelola Dimensi</span>
                  </button>
                </div>
                <select
                  className="custom-select"
                  value={formData.aspek}
                  onChange={(e) => setFormData({ ...formData, aspek: e.target.value })}
                >
                  {aspekList.map((asp, idx) => (
                    <option key={idx} value={asp}>
                      {asp}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  SDM dapat menambah, mengubah, atau menghapus pilihan dimensi BerAKHLAK.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Dinamis Indikator Perilaku */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div className="form-section-title">2. Uraian Indikator Perilaku Kerja (Dinamis)</div>
                <div className="form-section-desc">Poin utama (Critical Point) prasyarat wajib dan indikator pendukung yang dapat ditambah sesuai kebutuhan SDM.</div>
              </div>

              <button
                type="button"
                onClick={handleAddSupporting}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Tambah Indikator Pendukung</span>
              </button>
            </div>

            {/* Critical Point / Indikator 1 */}
            <div className="form-field" style={{ background: 'rgba(30, 58, 138, 0.03)', padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--brand-200)' }}>
              <label className="form-label" style={{ color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Indikator 1 (Critical Point / Poin Utama) *</span>
                <span className="badge-pill badge-pill--blue" style={{ fontSize: '10.5px' }}>Prasyarat Wajib</span>
              </label>
              <textarea
                required
                rows={2}
                className="custom-input"
                value={formData.indikatorUtama}
                onChange={(e) => setFormData({ ...formData, indikatorUtama: e.target.value })}
                placeholder="Contoh: Sikap ramah, menghargai, dan tidak diskriminatif kepada sivitas akademika"
                style={{ resize: 'vertical' }}
              />
              <span className="form-help">Wajib dipenuhi dosen untuk mendapatkan predikat capaian minimal Baik.</span>
            </div>

            {/* Dynamic Supporting Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              {formData.indikatorPendukung.map((supportingText, idx) => (
                <div key={idx} className="form-field" style={{ border: '1px solid var(--hair)', padding: '12px 14px', borderRadius: 'var(--r-md)', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ marginBottom: 0, color: 'var(--ink)' }}>
                      Indikator {idx + 2} (Pendukung) *
                    </label>
                    {formData.indikatorPendukung.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSupporting(idx)}
                        className="btn-table-action btn-table-action--delete"
                        title="Hapus indikator pendukung ini"
                        aria-label={`Hapus indikator ${idx + 2}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <textarea
                    required
                    rows={2}
                    className="custom-input"
                    value={supportingText}
                    onChange={(e) => handleUpdateSupporting(idx, e.target.value)}
                    placeholder={`Uraian indikator pendukung ${idx + 2}...`}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              ))}
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
            <button type="submit" disabled={isSaving} className="brand-btn btn-action-add">
              {isSaving && <Loader2 size={14} className="spin" />}
              <span>{isSaving ? 'Menyimpan...' : (viewMode === 'create' ? 'Simpan Indikator' : 'Perbarui Indikator')}</span>
            </button>
          </div>
        </form>

        {renderManageAspekModal()}
      </div>
    )
  }

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Indikator Kinerja BerAKHLAK</h1>
          <p className="page-desc">
            Instrumen standar penilaian perilaku kerja BerAKHLAK dosen Universitas Bhakti Kencana dengan dukungan indikator dinamis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsManageAspekOpen(true)
              setNewAspekInput('')
              setEditingAspekIdx(null)
            }}
            className="brand-btn brand-btn--outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Settings size={15} />
            <span>Kelola Dimensi</span>
          </button>
          <button onClick={handleOpenCreate} className="brand-btn btn-action-add">
            <Plus size={16} />
            <span>Tambah Indikator</span>
          </button>
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
            width: 36,
            height: 36,
            borderRadius: 'var(--r-md)',
            background: 'var(--brand-100)',
            color: 'var(--brand-700)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Award size={18} />
        </div>
        <div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
            Petunjuk Standar Penilaian Perilaku BerAKHLAK UBK
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
            Skala 4 (Sangat Baik: semua indikator terpenuhi) &bull; Skala 3 (Baik: termasuk Poin Utama terpenuhi) &bull; Skala 2 (Cukup) &bull; Skala 1 (Kurang). Indikator nomor 1 bertanda <strong>[Critical Point]</strong> menjadi prasyarat wajib untuk memperoleh predikat minimal Baik. Indikator pendukung dapat ditambah secara dinamis sesuai kebutuhan SDM.
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Dimensi Perilaku</th>
              <th>Indikator Utama (Critical Point)</th>
              <th>Indikator Pendukung</th>
              <th>Skala Evaluasi</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {indikatorList.map((ind) => {
              const supportingList =
                ind.indikatorPendukung && ind.indikatorPendukung.length > 0
                  ? ind.indikatorPendukung
                  : [ind.indikatorDua, ind.indikatorTiga].filter(Boolean) as string[]

              return (
                <tr key={ind.id}>
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
                      }}
                    >
                      {ind.kode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{ind.aspek}</div>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                      1. {ind.indikatorUtama}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600, marginTop: 3 }}>
                      [Critical Point]
                    </div>
                  </td>
                  <td style={{ maxWidth: 340, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {supportingList.map((sup, sIdx) => (
                        <div key={sIdx}>
                          {sIdx + 2}. {sup}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 'var(--r-xs)',
                        background: 'var(--panel-hover)',
                        border: '1px solid var(--hair)',
                        color: 'var(--navy-900)',
                        fontWeight: 600,
                        fontSize: '11.5px',
                      }}
                    >
                      Skala 1 - 4
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(ind)}
                        title="Edit Indikator"
                        className="btn-table-action btn-table-action--edit"
                        aria-label={`Edit ${ind.aspek}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ind)}
                        title="Hapus Indikator"
                        className="btn-table-action btn-table-action--delete"
                        aria-label={`Hapus ${ind.aspek}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Konfirmasi Hapus Indikator Kuesioner"
        message={`Apakah Anda yakin ingin menghapus indikator "${deleteTarget?.aspek}"? Kuesioner evaluasi perilaku akan disesuaikan.`}
        confirmText="Hapus Indikator"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {renderManageAspekModal()}
    </div>
  )
}
