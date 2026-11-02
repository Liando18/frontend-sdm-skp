import React, { useState, useEffect } from 'react'
import { SKPItem, KomponenSKP, KategoriKomponenSKP } from '../../types'
import { Modal } from '../common/modals/Modal'
import { TextInput } from '../common/forms/TextInput'
import { SelectDropdown } from '../common/forms/SelectDropdown'
import { NumberInput } from '../common/forms/NumberInput'
import { TRIDHARMA_CATEGORIES } from '../../constants/academic'

export interface SkpItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<SKPItem>) => void
  initialItem?: SKPItem | null
  komponenList: KomponenSKP[]
}

/**
 * Standard SkpItemModal UBK
 * Sesuai DESAIN.md Bab 20.3
 */
export const SkpItemModal: React.FC<SkpItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  komponenList,
}) => {
  const [kegiatan, setKegiatan] = useState('')
  const [kategori, setKategori] = useState('Pendidikan')
  const [satuan, setSatuan] = useState('Kegiatan')
  const [rencanaAwal, setRencanaAwal] = useState<number>(1)
  const [waktuNilai, setWaktuNilai] = useState<number>(6)
  const [linkDokumen, setLinkDokumen] = useState('')

  useEffect(() => {
    if (initialItem) {
      setKegiatan(initialItem.kegiatan || '')
      setKategori(initialItem.kategori || 'Pendidikan')
      setSatuan(initialItem.satuan || 'Kegiatan')
      setRencanaAwal(initialItem.rencanaAwal || 1)
      setWaktuNilai(initialItem.waktuNilai || 6)
      setLinkDokumen(initialItem.linkDokumen || '')
    } else {
      setKegiatan('')
      setKategori('Pendidikan')
      setSatuan('Kegiatan')
      setRencanaAwal(1)
      setWaktuNilai(6)
      setLinkDokumen('')
    }
  }, [initialItem, isOpen])

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKode = e.target.value
    const found = komponenList.find((k) => k.kode === selectedKode || k.id === selectedKode)
    if (found) {
      setKegiatan(found.namaKegiatan)
      setKategori(found.kategori)
      setSatuan(found.satuan)
      if (found.kategori === 'Penelitian' || found.kategori === 'Pengabdian') {
        setRencanaAwal(1)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      kegiatan,
      kategori: kategori as KategoriKomponenSKP,
      satuan,
      rencanaAwal: Number(rencanaAwal) || 0,
      waktuNilai: Number(waktuNilai) || 6,
      linkDokumen,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialItem ? 'Ubah Butir Kegiatan Tridharma' : 'Tambah Butir Kegiatan Tridharma'}
      subtitle="Pilih dari daftar master komponen beban kerja atau buat uraian kegiatan mandiri."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 6,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: 6,
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            {initialItem ? 'Simpan Perubahan' : 'Tambahkan ke SKP'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {komponenList.length > 0 && !initialItem && (
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: 5 }}>
              Pilih dari Preset Master Komponen SKP
            </label>
            <select
              onChange={handleSelectPreset}
              defaultValue=""
              style={{
                width: '100%',
                minHeight: 42,
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
              }}
            >
              <option value="" disabled>
                -- Pilih template butir kegiatan Tridharma --
              </option>
              {komponenList.map((k) => (
                <option key={k.id || k.kode} value={k.kode || k.id}>
                  [{k.kategori}] {k.namaKegiatan} ({k.satuan})
                </option>
              ))}
            </select>
          </div>
        )}

        <TextInput
          label="Uraian Rencana Kinerja / Kegiatan"
          required
          value={kegiatan}
          onChange={(e) => setKegiatan(e.target.value)}
          placeholder="Contoh: Melaksanakan perkuliahan mata kuliah Farmakologi..."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectDropdown
            label="Kategori Tridharma"
            required
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            options={TRIDHARMA_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          />

          <TextInput
            label="Satuan Output"
            required
            value={satuan}
            onChange={(e) => setSatuan(e.target.value)}
            placeholder="SKS / Laporan / Artikel / Buku"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <NumberInput
            label="Target Kuantitas Rencana Awal"
            required
            min={0}
            step="any"
            value={rencanaAwal}
            onChange={(e) => setRencanaAwal(Number(e.target.value))}
          />

          <NumberInput
            label="Target Waktu (Bulan)"
            required
            min={1}
            max={12}
            value={waktuNilai}
            onChange={(e) => setWaktuNilai(Number(e.target.value))}
            suffix="Bulan"
          />
        </div>

        <TextInput
          label="Tautan Bukti Fisik (Google Drive / Repository)"
          value={linkDokumen}
          onChange={(e) => setLinkDokumen(e.target.value)}
          placeholder="https://drive.google.com/..."
          helperText="Dapat diisi nanti saat kegiatan telah terlaksana."
        />
      </form>
    </Modal>
  )
}
