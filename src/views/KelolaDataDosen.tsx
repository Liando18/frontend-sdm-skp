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
  Loader2,
  Building2,
  MapPin,
  School,
  Layers,
  Lock,
} from 'lucide-react'
import { Dosen, JabatanKampus, Role, ProgramStudi, Fakultas, Psdku } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStaggerEntrance } from '../utils/animations'
import { generateEntityId } from '../utils/security'
import { TablePagination } from '../components/TablePagination'

const JABATAN_KATEGORI_OPTIONS = [
  'Pimpinan Universitas',
  'Pimpinan Fakultas',
  'Pimpinan PSDKU',
  'Pimpinan Program Studi',
  'Tenaga Kependidikan',
  'Fungsional Dosen',
  'Struktural',
  'Lainnya',
] as const

interface KelolaDataDosenProps {
  dosenList: Dosen[]
  prodiList?: string[]
  prodiObjects?: ProgramStudi[]
  fakultasList?: Fakultas[]
  psdkuList?: Psdku[]
  jabatanList?: JabatanKampus[]
  onAddDosen: (dosen: Dosen) => Promise<any> | void
  onUpdateDosen: (dosen: Dosen) => Promise<any> | void
  onDeleteDosen: (id: string) => Promise<any> | void
  onAddProdi?: (data: Partial<ProgramStudi> | string) => Promise<void> | void
  onUpdateProdi?: (id: string, data: Partial<ProgramStudi> | string) => Promise<void> | void
  onDeleteProdi?: (id: string) => Promise<void> | void
  onAddFakultas?: (data: Partial<Fakultas>) => Promise<void> | void
  onUpdateFakultas?: (id: string, data: Partial<Fakultas>) => Promise<void> | void
  onDeleteFakultas?: (id: string) => Promise<void> | void
  onAddPsdku?: (data: Partial<Psdku>) => Promise<void> | void
  onUpdatePsdku?: (id: string, data: Partial<Psdku>) => Promise<void> | void
  onDeletePsdku?: (id: string) => Promise<void> | void
  onAddJabatan?: (data: Partial<JabatanKampus>) => Promise<void> | void
  onUpdateJabatan?: (id: string, data: Partial<JabatanKampus>) => Promise<void> | void
  onDeleteJabatan?: (id: string) => Promise<void> | void
  onShowToast: (msg: string) => void
}

export const KelolaDataDosen: React.FC<KelolaDataDosenProps> = ({
  dosenList,
  prodiList: prodiListProp,
  prodiObjects = [],
  fakultasList: fakultasListProp = [],
  psdkuList: psdkuListProp = [],
  jabatanList: jabatanListProp,
  onAddDosen,
  onUpdateDosen,
  onDeleteDosen,
  onAddProdi,
  onUpdateProdi,
  onDeleteProdi,
  onAddFakultas,
  onUpdateFakultas,
  onDeleteFakultas,
  onAddPsdku,
  onUpdatePsdku,
  onDeletePsdku,
  onAddJabatan,
  onUpdateJabatan,
  onDeleteJabatan,
  onShowToast,
}) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialMode = searchParams?.get('mode') === 'create' ? 'create' : 'list'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>(initialMode)
  const [selectedDosen, setSelectedDosen] = useState<Dosen | null>(null)
  const [deleteConfirmDosen, setDeleteConfirmDosen] = useState<Dosen | null>(null)
  const [isSavingDosen, setIsSavingDosen] = useState(false)

  // Derive prodi list dynamically from database / props
  const [customAddedProdis, setCustomAddedProdis] = useState<string[]>([])
  const fallbackProdi = Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))
  const baseProdis = (prodiListProp && prodiListProp.length > 0) ? prodiListProp : (fallbackProdi.length > 0 ? fallbackProdi : ['S1 Keperawatan'])
  const prodiList = Array.from(new Set([...baseProdis, ...customAddedProdis]))
  const [isManageProdiOpen, setIsManageProdiOpen] = useState(false)
  const [newProdiJenjang, setNewProdiJenjang] = useState<'S1' | 'D3' | 'D4' | 'Profesi' | 'S2'>('S1')
  const [newProdiNama, setNewProdiNama] = useState('')
  const [newProdiTipeUnit, setNewProdiTipeUnit] = useState<'Pusat' | 'PSDKU'>('Pusat')
  const [newProdiFakultasId, setNewProdiFakultasId] = useState('')
  const [newProdiPsdkuId, setNewProdiPsdkuId] = useState('')
  const [prodiSearchFilter, setProdiSearchFilter] = useState('')
  const [editingProdiId, setEditingProdiId] = useState<string | null>(null)
  const [editingProdiJenjang, setEditingProdiJenjang] = useState<'S1' | 'D3' | 'D4' | 'Profesi' | 'S2'>('S1')
  const [editingProdiNama, setEditingProdiNama] = useState('')
  const [editingProdiTipeUnit, setEditingProdiTipeUnit] = useState<'Pusat' | 'PSDKU'>('Pusat')
  const [editingProdiFakultasId, setEditingProdiFakultasId] = useState('')
  const [editingProdiPsdkuId, setEditingProdiPsdkuId] = useState('')

  // Manage Fakultas state
  const [isManageFakultasOpen, setIsManageFakultasOpen] = useState(false)
  const [newFakultasNama, setNewFakultasNama] = useState('')
  const [newFakultasKode, setNewFakultasKode] = useState('')
  const [fakultasSearchQuery, setFakultasSearchQuery] = useState('')
  const [editingFakultasId, setEditingFakultasId] = useState<string | null>(null)
  const [editingFakultasNama, setEditingFakultasNama] = useState('')
  const [editingFakultasKode, setEditingFakultasKode] = useState('')

  // Manage PSDKU state
  const [isManagePsdkuOpen, setIsManagePsdkuOpen] = useState(false)
  const [newPsdkuNama, setNewPsdkuNama] = useState('')
  const [newPsdkuLokasi, setNewPsdkuLokasi] = useState('')
  const [newPsdkuKode, setNewPsdkuKode] = useState('')
  const [psdkuSearchQuery, setPsdkuSearchQuery] = useState('')
  const [editingPsdkuId, setEditingPsdkuId] = useState<string | null>(null)
  const [editingPsdkuNama, setEditingPsdkuNama] = useState('')
  const [editingPsdkuLokasi, setEditingPsdkuLokasi] = useState('')
  const [editingPsdkuKode, setEditingPsdkuKode] = useState('')

  // Close handlers that reset search queries automatically
  const handleCloseManageProdi = () => {
    setIsManageProdiOpen(false)
    setProdiSearchFilter('')
    setEditingProdiId(null)
  }

  const handleCloseManageFakultas = () => {
    setIsManageFakultasOpen(false)
    setFakultasSearchQuery('')
    setEditingFakultasId(null)
  }

  const handleCloseManagePsdku = () => {
    setIsManagePsdkuOpen(false)
    setPsdkuSearchQuery('')
    setEditingPsdkuId(null)
  }

  const handleCloseManageJabatan = () => {
    setIsManageJabatanOpen(false)
    setJabatanSearchQuery('')
    setEditingJabatanId(null)
  }

  // Derive jabatan kampus list dynamically from database / props
  const defaultJabatanList: JabatanKampus[] = [
    { id: 'jab-dosen', kode: 'DOSEN', nama: 'Dosen', kategori: 'Fungsional', level: 10, is_struktural: false },
    { id: 'jab-rektor', kode: 'REKTOR', nama: 'Rektor', kategori: 'Pimpinan', level: 1, is_struktural: true },
    { id: 'jab-warek1', kode: 'WAREK_1', nama: 'Wakil Rektor I (Bidang Akademik)', kategori: 'Pimpinan', level: 2, is_struktural: true },
    { id: 'jab-warek2', kode: 'WAREK_2', nama: 'Wakil Rektor II (Bidang Non-Akademik)', kategori: 'Pimpinan', level: 2, is_struktural: true },
    { id: 'jab-dekan', kode: 'DEKAN', nama: 'Dekan Fakultas', kategori: 'Struktural', level: 3, is_struktural: true },
    { id: 'jab-kecab', kode: 'KECAB', nama: 'Kepala Cabang (KeCab)', kategori: 'Pimpinan PSDKU', level: 2, is_struktural: true, role_akses: 'dekan' },
    { id: 'jab-kaprodi', kode: 'KAPRODI', nama: 'Ketua Program Studi (Kaprodi)', kategori: 'Struktural', level: 4, is_struktural: true },
    { id: 'jab-sekprodi', kode: 'SEKPRODI', nama: 'Sekretaris Program Studi', kategori: 'Struktural', level: 5, is_struktural: true },
  ]
  const jabatanList = jabatanListProp && jabatanListProp.length > 0 ? jabatanListProp : defaultJabatanList
  const [isManageJabatanOpen, setIsManageJabatanOpen] = useState(false)
  const [newJabatanNama, setNewJabatanNama] = useState('')
  const [newJabatanKode, setNewJabatanKode] = useState('')
  const [newJabatanKategori, setNewJabatanKategori] = useState<string>('Pimpinan Universitas')
  const [newJabatanRoleAkses, setNewJabatanRoleAkses] = useState<Role>('dosen')
  const [editingJabatanId, setEditingJabatanId] = useState<string | null>(null)
  const [editingJabatanNama, setEditingJabatanNama] = useState('')
  const [editingJabatanKategori, setEditingJabatanKategori] = useState<string>('Pimpinan Universitas')
  const [editingJabatanRoleAkses, setEditingJabatanRoleAkses] = useState<Role>('dosen')
  const [jabatanSearchQuery, setJabatanSearchQuery] = useState('')

  const filteredJabatanList = useMemo(() => {
    const q = (jabatanSearchQuery || '').trim().toLowerCase()
    if (!q) return jabatanList
    return jabatanList.filter(
      (j) =>
        (j.nama || '').toLowerCase().includes(q) ||
        (j.kode || '').toLowerCase().includes(q) ||
        (j.kategori || '').toLowerCase().includes(q) ||
        (j.role_akses || j.default_role || '').toLowerCase().includes(q)
    )
  }, [jabatanList, jabatanSearchQuery])

  const filteredFakultasList = useMemo(() => {
    const q = (fakultasSearchQuery || '').trim().toLowerCase()
    if (!q) return fakultasListProp
    return fakultasListProp.filter(
      (f) =>
        (f.nama || '').toLowerCase().includes(q) ||
        (f.kode || '').toLowerCase().includes(q) ||
        (f.dekan_nama || '').toLowerCase().includes(q)
    )
  }, [fakultasListProp, fakultasSearchQuery])

  const filteredPsdkuList = useMemo(() => {
    const q = (psdkuSearchQuery || '').trim().toLowerCase()
    if (!q) return psdkuListProp
    return psdkuListProp.filter(
      (p) =>
        (p.nama || '').toLowerCase().includes(q) ||
        (p.kode || '').toLowerCase().includes(q) ||
        (p.lokasi || '').toLowerCase().includes(q) ||
        (p.kecab_nama || '').toLowerCase().includes(q)
    )
  }, [psdkuListProp, psdkuSearchQuery])

  const handleAddJabatanAction = async () => {
    const val = newJabatanNama.trim()
    if (!val) {
      onShowToast('Nama jabatan kampus tidak boleh kosong!')
      return
    }
    const kode = (newJabatanKode.trim() || val.toUpperCase().replace(/[^A-Z0-9]/g, '_')).slice(0, 30)
    const isStruktural = !newJabatanKategori.toLowerCase().includes('fungsional')
    if (onAddJabatan) {
      await onAddJabatan({
        nama: val,
        kode: kode,
        kategori: newJabatanKategori,
        is_struktural: isStruktural,
        role_akses: newJabatanRoleAkses,
      })
    }
    setFormData((prev) => ({
      ...prev,
      jabatanStruktural: val,
      roleLogin: newJabatanRoleAkses,
    }))
    setNewJabatanNama('')
    setNewJabatanKode('')
    setNewJabatanRoleAkses('dosen')
    onShowToast(`Jabatan kampus "${val}" dengan role "${newJabatanRoleAkses.toUpperCase()}" berhasil ditambahkan!`)
  }

  const handleSaveEditJabatanAction = async (id: string) => {
    const val = editingJabatanNama.trim()
    if (!val) {
      onShowToast('Nama jabatan kampus tidak boleh kosong!')
      return
    }
    const isStruktural = !editingJabatanKategori.toLowerCase().includes('fungsional')
    if (onUpdateJabatan) {
      await onUpdateJabatan(id, {
        nama: val,
        kategori: editingJabatanKategori,
        is_struktural: isStruktural,
        role_akses: editingJabatanRoleAkses,
      })
    }
    if (formData.jabatanKampusId === id) {
      setFormData((prev) => ({
        ...prev,
        jabatanStruktural: val,
        roleLogin: editingJabatanRoleAkses,
      }))
    }
    setEditingJabatanId(null)
    setEditingJabatanNama('')
    onShowToast('Data jabatan kampus, kategori struktural, dan role akses berhasil diperbarui!')
  }

  const handleDeleteJabatanAction = async (item: JabatanKampus) => {
    if (item.kode === 'DOSEN' || item.id === 'jab-dosen' || item.nama.toLowerCase() === 'dosen') {
      onShowToast('Jabatan default "Dosen" dilindungi dan tidak boleh dihapus!')
      return
    }
    if (onDeleteJabatan) {
      await onDeleteJabatan(item.id)
      onShowToast(`Jabatan "${item.nama}" berhasil dihapus.`)
    }
  }

  // Fakultas Handlers
  const handleAddFakultasAction = async () => {
    const nama = newFakultasNama.trim()
    if (!nama) {
      onShowToast('Nama fakultas tidak boleh kosong!')
      return
    }
    const kode = (newFakultasKode.trim() || nama.split(' ').map((w) => w[0]).join('').toUpperCase()).slice(0, 20)
    if (onAddFakultas) {
      await onAddFakultas({ nama, kode })
    }
    setNewFakultasNama('')
    setNewFakultasKode('')
  }

  const handleSaveEditFakultasAction = async (id: string) => {
    const nama = editingFakultasNama.trim()
    if (!nama) return
    if (onUpdateFakultas) {
      await onUpdateFakultas(id, { nama, kode: editingFakultasKode.trim() || undefined })
    }
    setEditingFakultasId(null)
    setEditingFakultasNama('')
    setEditingFakultasKode('')
  }

  const handleDeleteFakultasAction = async (id: string) => {
    if (fakultasListProp.length <= 1) {
      onShowToast('Minimal harus ada 1 fakultas!')
      return
    }
    if (onDeleteFakultas) {
      await onDeleteFakultas(id)
    }
  }

  // PSDKU Handlers
  const handleAddPsdkuAction = async () => {
    const nama = newPsdkuNama.trim()
    if (!nama) {
      onShowToast('Nama PSDKU tidak boleh kosong!')
      return
    }
    const kode = (newPsdkuKode.trim() || nama.toUpperCase().replace(/[^A-Z0-9]/g, '_')).slice(0, 30)
    if (onAddPsdku) {
      await onAddPsdku({ nama, lokasi: newPsdkuLokasi.trim(), kode })
    }
    setNewPsdkuNama('')
    setNewPsdkuLokasi('')
    setNewPsdkuKode('')
  }

  const handleSaveEditPsdkuAction = async (id: string) => {
    const nama = editingPsdkuNama.trim()
    if (!nama) return
    if (onUpdatePsdku) {
      await onUpdatePsdku(id, { nama, lokasi: editingPsdkuLokasi.trim(), kode: editingPsdkuKode.trim() || undefined })
    }
    setEditingPsdkuId(null)
    setEditingPsdkuNama('')
    setEditingPsdkuLokasi('')
    setEditingPsdkuKode('')
  }

  const handleDeletePsdkuAction = async (id: string) => {
    if (psdkuListProp.length <= 1) {
      onShowToast('Minimal harus ada 1 PSDKU!')
      return
    }
    if (onDeletePsdku) {
      await onDeletePsdku(id)
    }
  }

  // Prodi Handlers
  const handleAddProdiAction = async () => {
    const val = newProdiNama.trim()
    if (!val) {
      onShowToast('Nama program studi tidak boleh kosong!')
      return
    }
    if (onAddProdi) {
      await onAddProdi({
        jenjang: newProdiJenjang,
        nama: val,
        tipe_unit: newProdiTipeUnit,
        fakultas_id: newProdiTipeUnit === 'Pusat' ? (newProdiFakultasId || fakultasListProp[0]?.id) : undefined,
        psdku_id: newProdiTipeUnit === 'PSDKU' ? (newProdiPsdkuId || psdkuListProp[0]?.id) : undefined,
      })
    } else {
      const full = `${newProdiJenjang} ${val}`
      setCustomAddedProdis((prev) => [...prev, full])
      onShowToast(`Program Studi "${full}" berhasil ditambahkan!`)
    }
    const full = `${newProdiJenjang} ${val}`
    setFormData((prev) => ({ ...prev, prodi: full }))
    setNewProdiNama('')
  }

  const handleSaveEditProdiAction = async (idOrName: string) => {
    const val = editingProdiNama.trim()
    if (!val) return
    if (onUpdateProdi) {
      await onUpdateProdi(idOrName, {
        jenjang: editingProdiJenjang,
        nama: val,
        tipe_unit: editingProdiTipeUnit,
        fakultas_id: editingProdiTipeUnit === 'Pusat' ? (editingProdiFakultasId || fakultasListProp[0]?.id) : undefined,
        psdku_id: editingProdiTipeUnit === 'PSDKU' ? (editingProdiPsdkuId || psdkuListProp[0]?.id) : undefined,
      })
    } else {
      setCustomAddedProdis((prev) => prev.map((p) => (p === idOrName ? `${editingProdiJenjang} ${val}` : p)))
    }
    setEditingProdiId(null)
    setEditingProdiNama('')
  }

  const handleDeleteProdiAction = async (idOrName: string) => {
    if (onDeleteProdi) {
      await onDeleteProdi(idOrName)
    } else {
      setCustomAddedProdis((prev) => prev.filter((p) => p !== idOrName))
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
    tipeLokasi: 'Pusat' as 'Pusat' | 'PSDKU',
    fakultasId: '',
    fakultas: '',
    psdkuId: '',
    kampus: 'Pusat',
    programStudiId: '',
    prodi: defaultProdi,
    jabatanStruktural: 'Dosen',
    jabatanKampusId: 'jab-dosen',
    roleLogin: 'dosen' as Role,
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

  // Options for active prodis depending on placement (Pusat vs PSDKU)
  const activeProdiOptions = useMemo(() => {
    if (prodiObjects && prodiObjects.length > 0) {
      if (formData.tipeLokasi === 'Pusat') {
        const matchFak = prodiObjects.filter(
          (p) => (p.tipe_unit || 'Pusat') === 'Pusat' && (!formData.fakultasId || p.fakultas_id === formData.fakultasId)
        )
        return matchFak.length > 0 ? matchFak : prodiObjects.filter((p) => (p.tipe_unit || 'Pusat') === 'Pusat')
      } else {
        const matchPsdku = prodiObjects.filter(
          (p) => p.tipe_unit === 'PSDKU' && (!formData.psdkuId || p.psdku_id === formData.psdkuId)
        )
        return matchPsdku.length > 0 ? matchPsdku : prodiObjects.filter((p) => p.tipe_unit === 'PSDKU')
      }
    }
    return []
  }, [prodiObjects, formData.tipeLokasi, formData.fakultasId, formData.psdkuId])

  const filteredDosen = dosenList.filter((d) => {
    const q = (searchQuery || '').trim().toLowerCase()
    const matchSearch =
      !q ||
      (d.nama || '').toLowerCase().includes(q) ||
      (d.nip || '').toLowerCase().includes(q) ||
      (d.nuptk || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.prodi || '').toLowerCase().includes(q)
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
    const defaultJab = jabatanList.find((j) => j.kode === 'DOSEN' || j.nama.toLowerCase() === 'dosen')
    const firstFak = fakultasListProp[0]
    const pList = prodiObjects.filter((p) => (p.tipe_unit || 'Pusat') === 'Pusat' && (!firstFak || p.fakultas_id === firstFak.id))
    const firstP = pList[0] || prodiObjects.find((p) => (p.tipe_unit || 'Pusat') === 'Pusat') || prodiObjects[0]
    const firstProdiName = firstP ? (firstP.nama_lengkap || `${firstP.jenjang ? firstP.jenjang + ' ' : ''}${firstP.nama}`) : (prodiList[0] || 'S1 Keperawatan')

    setFormData({
      nama: '',
      nip: '',
      nuptk: '',
      tipeLokasi: 'Pusat',
      fakultasId: firstFak?.id || '',
      fakultas: firstFak?.nama || '',
      psdkuId: '',
      kampus: 'Pusat',
      programStudiId: firstP?.id || '',
      prodi: firstProdiName,
      jabatanStruktural: defaultJab?.nama || 'Dosen',
      jabatanKampusId: defaultJab?.id || 'jab-dosen',
      roleLogin: (defaultJab?.role_akses || defaultJab?.default_role || 'dosen') as Role,
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
    const kaprodiJab = jabatanList.find((j) => j.kode === 'KAPRODI' || j.nama.toLowerCase().includes('kaprodi'))
    const farmasiFak = fakultasListProp.find((f) => f.nama.toLowerCase().includes('farmasi')) || fakultasListProp[0]
    const farmasiProdi = prodiObjects.find((p) => p.nama.toLowerCase().includes('farmasi') && (p.tipe_unit || 'Pusat') === 'Pusat') || prodiObjects[0]
    const prodiDisplay = farmasiProdi ? (farmasiProdi.nama_lengkap || `${farmasiProdi.jenjang ? farmasiProdi.jenjang + ' ' : ''}${farmasiProdi.nama}`) : (prodiList[0] || 'S1 Farmasi')

    setFormData({
      nama: 'Dr. apt. Farhan Prasetyo, M.Farm.',
      nip: `19850720201201${randomNipSuffix}`,
      nuptk: `987654321098${randomNipSuffix}`,
      tipeLokasi: 'Pusat',
      fakultasId: farmasiFak?.id || '',
      fakultas: farmasiFak?.nama || '',
      psdkuId: '',
      kampus: 'Pusat',
      programStudiId: farmasiProdi?.id || '',
      prodi: prodiDisplay,
      jabatanStruktural: kaprodiJab?.nama || 'Ketua Program Studi (Kaprodi)',
      jabatanKampusId: kaprodiJab?.id || 'jab-kaprodi',
      roleLogin: 'kaprodi',
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
    const currentJabName = dosen.jabatanStruktural || 'Dosen'
    const matchedJab = jabatanList.find((j) => j.id === dosen.jabatanKampusId || j.nama.toLowerCase() === currentJabName.toLowerCase())
    let derivedRole: Role = (matchedJab?.role_akses || matchedJab?.default_role || 'dosen') as Role
    if (dosen.isKaprodi) derivedRole = 'kaprodi'
    else if (dosen.isDekan) derivedRole = 'dekan'
    else if (currentJabName.toLowerCase().includes('sdm')) derivedRole = 'sdm'

    const isPsdku = Boolean(dosen.tipeLokasi === 'PSDKU' || dosen.psdkuId || (dosen.kampus && dosen.kampus !== 'Pusat'))
    const locType: 'Pusat' | 'PSDKU' = isPsdku ? 'PSDKU' : 'Pusat'

    let resolvedFakId = dosen.fakultasId || ''
    let resolvedFakNama = dosen.fakultas || ''
    let resolvedPsdkuId = dosen.psdkuId || ''
    let resolvedKampus = dosen.kampus || (isPsdku ? 'PSDKU' : 'Pusat')

    if (locType === 'Pusat') {
      if (!resolvedFakId && resolvedFakNama) {
        const f = fakultasListProp.find((item) => item.nama === resolvedFakNama)
        if (f) resolvedFakId = f.id
      }
      if (!resolvedFakNama && resolvedFakId) {
        const f = fakultasListProp.find((item) => item.id === resolvedFakId)
        if (f) resolvedFakNama = f.nama
      }
    } else {
      if (!resolvedPsdkuId && resolvedKampus) {
        const p = psdkuListProp.find((item) => item.nama === resolvedKampus)
        if (p) resolvedPsdkuId = p.id
      }
      if (!resolvedKampus && resolvedPsdkuId) {
        const p = psdkuListProp.find((item) => item.id === resolvedPsdkuId)
        if (p) resolvedKampus = p.nama
      }
    }

    const matchedProdi = prodiObjects.find(
      (p) =>
        p.id === dosen.programStudiId ||
        p.nama_lengkap === dosen.prodi ||
        `${p.jenjang} ${p.nama}` === dosen.prodi ||
        p.nama === dosen.prodi
    )

    setFormData({
      nama: dosen.nama,
      nip: dosen.nip,
      nuptk: dosen.nuptk || '',
      tipeLokasi: locType,
      fakultasId: resolvedFakId,
      fakultas: resolvedFakNama,
      psdkuId: resolvedPsdkuId,
      kampus: resolvedKampus,
      programStudiId: matchedProdi?.id || dosen.programStudiId || '',
      prodi: dosen.prodi,
      jabatanStruktural: currentJabName,
      jabatanKampusId: matchedJab?.id || dosen.jabatanKampusId || 'jab-dosen',
      roleLogin: derivedRole,
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

  const currentPositionConflict = useMemo(() => {
    const rawJabatan = (formData.jabatanStruktural || '').toLowerCase()
    if (!rawJabatan || rawJabatan === 'dosen') return null

    const currentDosenId = viewMode === 'edit' && selectedDosen ? selectedDosen.id : null

    // 1. Kaprodi: Only 1 person per Program Studi
    if (
      formData.roleLogin === 'kaprodi' ||
      rawJabatan.includes('kaprodi') ||
      rawJabatan.includes('ketua program studi') ||
      rawJabatan.includes('ka prodi') ||
      rawJabatan.includes('ka.prodi')
    ) {
      const targetProdiId = formData.programStudiId
      const targetProdiName = (formData.prodi || '').toLowerCase().trim()

      const found = dosenList.find((d) => {
        if (d.id === currentDosenId) return false
        const dJab = (d.jabatanStruktural || '').toLowerCase()
        const isDosenKaprodi =
          d.isKaprodi ||
          dJab.includes('kaprodi') ||
          dJab.includes('ketua program studi') ||
          dJab.includes('ka prodi') ||
          dJab.includes('ka.prodi')
        if (!isDosenKaprodi) return false

        const matchesId = Boolean(targetProdiId && d.programStudiId === targetProdiId)
        const matchesName = Boolean(targetProdiName && (d.prodi || '').toLowerCase().trim() === targetProdiName)
        return matchesId || matchesName
      })

      if (found) {
        return {
          type: 'Kaprodi',
          holder: found,
          scopeName: formData.prodi || 'Program Studi ini',
          jabatanTitle: 'Ketua Program Studi (Ka.Prodi)',
        }
      }
    }

    // 2. Dekan: Only 1 person per Fakultas (Pusat)
    if (
      (formData.roleLogin === 'dekan' || rawJabatan.includes('dekan')) &&
      !rawJabatan.includes('wakil') &&
      !rawJabatan.includes('kecab')
    ) {
      const targetFakId = formData.fakultasId
      const targetFakName = (formData.fakultas || '').toLowerCase().trim()

      const found = dosenList.find((d) => {
        if (d.id === currentDosenId) return false
        const dJab = (d.jabatanStruktural || '').toLowerCase()
        const isDosenDekan =
          (d.isDekan || dJab.includes('dekan')) &&
          !dJab.includes('wakil') &&
          !dJab.includes('kecab')
        if (!isDosenDekan) return false

        const matchesId = Boolean(targetFakId && d.fakultasId === targetFakId)
        const matchesName = Boolean(targetFakName && (d.fakultas || '').toLowerCase().trim() === targetFakName)
        return matchesId || matchesName
      })

      if (found) {
        return {
          type: 'Dekan',
          holder: found,
          scopeName: formData.fakultas || 'Fakultas ini',
          jabatanTitle: 'Dekan Fakultas',
        }
      }
    }

    // 3. KeCab: Only 1 person per PSDKU
    if (rawJabatan.includes('kecab') || rawJabatan.includes('kepala cabang')) {
      const targetPsdkuId = formData.psdkuId
      const targetKampus = (formData.kampus || '').toLowerCase().trim()

      const found = dosenList.find((d) => {
        if (d.id === currentDosenId) return false
        const dJab = (d.jabatanStruktural || '').toLowerCase()
        const isDosenKecab = dJab.includes('kecab') || dJab.includes('kepala cabang')
        if (!isDosenKecab) return false

        const matchesId = Boolean(targetPsdkuId && d.psdkuId === targetPsdkuId)
        const matchesName = Boolean(targetKampus && (d.kampus || '').toLowerCase().trim() === targetKampus)
        return matchesId || matchesName
      })

      if (found) {
        return {
          type: 'KeCab',
          holder: found,
          scopeName: formData.kampus || 'Kampus PSDKU ini',
          jabatanTitle: 'Kepala Cabang (KeCab)',
        }
      }
    }

    // 4. University-wide Executive Positions (Rektor, Warek I, Warek II, Kabag SDM, Direktur)
    const isRektor = rawJabatan.includes('rektor') && !rawJabatan.includes('wakil')
    const isWarek1 =
      rawJabatan.includes('wakil rektor i') ||
      rawJabatan.includes('warek 1') ||
      rawJabatan.includes('warek i')
    const isWarek2 =
      rawJabatan.includes('wakil rektor ii') ||
      rawJabatan.includes('warek 2') ||
      rawJabatan.includes('warek ii')
    const isKabagSdm =
      rawJabatan.includes('kepala bagian sdm') || rawJabatan.includes('kabag sdm')
    const isDirSpmi = rawJabatan.includes('penjaminan mutu')
    const isDirSekretariat = rawJabatan.includes('sekretariat')

    if (isRektor || isWarek1 || isWarek2 || isKabagSdm || isDirSpmi || isDirSekretariat) {
      const found = dosenList.find((d) => {
        if (d.id === currentDosenId) return false
        const dJab = (d.jabatanStruktural || '').toLowerCase()
        if (isRektor) return dJab.includes('rektor') && !dJab.includes('wakil')
        if (isWarek1)
          return (
            dJab.includes('wakil rektor i') ||
            dJab.includes('warek 1') ||
            dJab.includes('warek i')
          )
        if (isWarek2)
          return (
            dJab.includes('wakil rektor ii') ||
            dJab.includes('warek 2') ||
            dJab.includes('warek ii')
          )
        if (isKabagSdm)
          return (
            dJab.includes('kepala bagian sdm') || dJab.includes('kabag sdm')
          )
        if (isDirSpmi) return dJab.includes('penjaminan mutu')
        if (isDirSekretariat) return dJab.includes('sekretariat')
        return false
      })

      if (found) {
        return {
          type: 'Eksekutif',
          holder: found,
          scopeName: 'Universitas Bhakti Kencana',
          jabatanTitle: formData.jabatanStruktural,
        }
      }
    }

    return null
  }, [
    formData.jabatanStruktural,
    formData.roleLogin,
    formData.programStudiId,
    formData.prodi,
    formData.fakultasId,
    formData.fakultas,
    formData.psdkuId,
    formData.kampus,
    viewMode,
    selectedDosen,
    dosenList,
  ])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const degreeParts = [
      formData.pendidikanS1 ? `S1: ${formData.pendidikanS1}` : '',
      formData.pendidikanProfesi ? `Profesi: ${formData.pendidikanProfesi}` : '',
      formData.pendidikanS2 ? `S2: ${formData.pendidikanS2}` : '',
      formData.pendidikanS3 ? `S3: ${formData.pendidikanS3}` : '',
    ].filter(Boolean)
    const combinedPendidikan = degreeParts.length > 0 ? degreeParts.join(' • ') : formData.pendidikanS1

    setIsSavingDosen(true)
    try {
      const payloadPlacement = {
        tipeLokasi: formData.tipeLokasi,
        tipe_lokasi: formData.tipeLokasi,
        fakultasId: formData.tipeLokasi === 'Pusat' ? (formData.fakultasId || undefined) : undefined,
        fakultas_id: formData.tipeLokasi === 'Pusat' ? (formData.fakultasId || null) : null,
        fakultas: formData.tipeLokasi === 'Pusat' ? (formData.fakultas || undefined) : undefined,
        psdkuId: formData.tipeLokasi === 'PSDKU' ? (formData.psdkuId || undefined) : undefined,
        psdku_id: formData.tipeLokasi === 'PSDKU' ? (formData.psdkuId || null) : null,
        kampus: formData.tipeLokasi === 'PSDKU' ? (formData.kampus || 'PSDKU') : 'Pusat',
        programStudiId: formData.programStudiId || undefined,
        program_studi_id: formData.programStudiId || null,
        prodi: formData.prodi,
        role: formData.roleLogin,
        roleLogin: formData.roleLogin,
      }

      if (viewMode === 'edit' && selectedDosen) {
        const updated: Dosen = {
          ...selectedDosen,
          ...payloadPlacement,
          nama: formData.nama,
          nip: formData.nip,
          nuptk: formData.nuptk,
          jabatanStruktural: formData.jabatanStruktural || 'Dosen',
          jabatanKampusId: formData.jabatanKampusId,
          isKaprodi: formData.roleLogin === 'kaprodi',
          isDekan: formData.roleLogin === 'dekan',
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
        await onUpdateDosen({ ...updated, role: formData.roleLogin, roleLogin: formData.roleLogin } as any)
      } else {
        const newDosen: Dosen = {
          id: generateEntityId('dosen'),
          nip: formData.nip || '0000000000000000',
          nuptk: formData.nuptk || '',
          nama: formData.nama,
          ...payloadPlacement,
          jabatanStruktural: formData.jabatanStruktural || 'Dosen',
          jabatanKampusId: formData.jabatanKampusId,
          isKaprodi: formData.roleLogin === 'kaprodi',
          isDekan: formData.roleLogin === 'dekan',
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
        await onAddDosen({ ...newDosen, role: formData.roleLogin, roleLogin: formData.roleLogin } as any)
      }
      setViewMode('list')
    } catch (err: unknown) {
      console.error('Gagal menyimpan dosen ke basis data:', err)
    } finally {
      setIsSavingDosen(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmDosen) {
      try {
        await onDeleteDosen(deleteConfirmDosen.id)
        setDeleteConfirmDosen(null)
      } catch (err: unknown) {
        console.error('Gagal menghapus dosen:', err)
      }
    }
  }

  const handleExportExcel = () => {
    const headers = [
      'NIP',
      'Nama Dosen',
      'NUPTK',
      'Prodi',
      'Jabatan Fungsional',
      'Jabatan Kampus',
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
      `"${d.jabatanStruktural || 'Dosen'}"`,
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

    const displayProdis: ProgramStudi[] = (prodiObjects && prodiObjects.length > 0)
      ? prodiObjects
      : prodiList.map((p, idx) => ({
          id: `p-${idx}`,
          nama: p.replace(/^(S1|D3|D4|Profesi|S2)\s+/, ''),
          jenjang: (p.match(/^(S1|D3|D4|Profesi|S2)/)?.[0] || 'S1'),
          nama_lengkap: p,
          tipe_unit: 'Pusat' as const,
          fakultas: '',
          psdku_nama: '',
        }))

    const filteredProdis = displayProdis.filter((p) => {
      const q = (prodiSearchFilter || '').trim().toLowerCase()
      if (!q) return true
      const full = (p.nama_lengkap || `${p.jenjang || ''} ${p.nama}`).toLowerCase()
      return (
        full.includes(q) ||
        (p.tipe_unit || '').toLowerCase().includes(q) ||
        (p.fakultas || '').toLowerCase().includes(q) ||
        (p.psdku_nama || '').toLowerCase().includes(q)
      )
    })

    return (
      <div
        onClick={handleCloseManageProdi}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 620,
            maxHeight: '92vh',
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
                Kelola Master Program Studi
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Penyimpanan database: nama murni (misal: "Informatika Kesehatan"), tampilan portal: Jenjang + Nama ("S1 Informatika Kesehatan").
              </div>
            </div>
            <button
              onClick={handleCloseManageProdi}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add Form */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)', background: '#fafafa' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
              Tambah Program Studi Baru
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: 2 }}>Jenjang</label>
                <select
                  className="custom-select"
                  value={newProdiJenjang}
                  onChange={(e) => setNewProdiJenjang(e.target.value as any)}
                  style={{ height: 34, fontSize: '12.5px' }}
                >
                  <option value="D3">D3</option>
                  <option value="D4">D4</option>
                  <option value="S1">S1</option>
                  <option value="Profesi">Profesi</option>
                  <option value="S2">S2</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: 2 }}>Nama Program Studi (Murni)</label>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Contoh: Informatika Kesehatan (tanpa jenjang)"
                  value={newProdiNama}
                  onChange={(e) => setNewProdiNama(e.target.value)}
                  style={{ height: 34, fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: 2 }}>Lokasi Kampus</label>
                <select
                  className="custom-select"
                  value={newProdiTipeUnit}
                  onChange={(e) => setNewProdiTipeUnit(e.target.value as any)}
                  style={{ height: 34, fontSize: '12px' }}
                >
                  <option value="Pusat">Pusat (Utama)</option>
                  <option value="PSDKU">Kampus PSDKU</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: 2 }}>
                  {newProdiTipeUnit === 'Pusat' ? 'Fakultas Naungan' : 'Wilayah Kampus PSDKU'}
                </label>
                {newProdiTipeUnit === 'Pusat' ? (
                  <select
                    className="custom-select"
                    value={newProdiFakultasId || (fakultasListProp[0]?.id || '')}
                    onChange={(e) => setNewProdiFakultasId(e.target.value)}
                    style={{ height: 34, fontSize: '12px' }}
                  >
                    {fakultasListProp.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nama}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="custom-select"
                    value={newProdiPsdkuId || (psdkuListProp[0]?.id || '')}
                    onChange={(e) => setNewProdiPsdkuId(e.target.value)}
                    style={{ height: 34, fontSize: '12px' }}
                  >
                    {psdkuListProp.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.lokasi})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddProdiAction}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 34, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Simpan</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--hair)', background: '#fafbfc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Cari program studi (nama, jenjang, fakultas, kampus)..."
                value={prodiSearchFilter}
                onChange={(e) => setProdiSearchFilter(e.target.value)}
                style={{
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: prodiSearchFilter ? 32 : 12,
                  fontSize: '12.5px',
                  borderRadius: 'var(--r-md)',
                  background: '#ffffff',
                  borderColor: prodiSearchFilter ? 'var(--brand)' : 'var(--hair)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  width: '100%',
                }}
              />
              {prodiSearchFilter && (
                <button
                  type="button"
                  onClick={() => setProdiSearchFilter('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Prodi List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 320 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Daftar Program Studi ({filteredProdis.length} dari {displayProdis.length})</span>
              {prodiSearchFilter && (
                <span style={{ fontSize: '11px', color: 'var(--brand)', textTransform: 'none', fontWeight: 600 }}>
                  Filter aktif
                </span>
              )}
            </div>
            {filteredProdis.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                Tidak ada program studi yang cocok dengan pencarian "{prodiSearchFilter}".
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setProdiSearchFilter('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset Pencarian
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredProdis.map((p) => {
                const label = p.nama_lengkap || `${p.jenjang || ''} ${p.nama}`.trim()
                const isEditing = editingProdiId === p.id

                return (
                  <div
                    key={p.id}
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
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '4px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6 }}>
                          <div>
                            <label style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Jenjang</label>
                            <select
                              className="custom-select"
                              value={editingProdiJenjang}
                              onChange={(e) => setEditingProdiJenjang(e.target.value as any)}
                              style={{ height: 32, fontSize: '12px' }}
                            >
                              <option value="D3">D3</option>
                              <option value="D4">D4</option>
                              <option value="S1">S1</option>
                              <option value="Profesi">Profesi</option>
                              <option value="S2">S2</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Nama Program Studi</label>
                            <input
                              type="text"
                              className="custom-input"
                              value={editingProdiNama}
                              onChange={(e) => setEditingProdiNama(e.target.value)}
                              style={{ height: 32, fontSize: '12px' }}
                              placeholder="Nama prodi murni..."
                              autoFocus
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 6, alignItems: 'flex-end' }}>
                          <div>
                            <label style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>Lokasi Unit</label>
                            <select
                              className="custom-select"
                              value={editingProdiTipeUnit}
                              onChange={(e) => setEditingProdiTipeUnit(e.target.value as any)}
                              style={{ height: 32, fontSize: '11.5px' }}
                            >
                              <option value="Pusat">Pusat</option>
                              <option value="PSDKU">PSDKU</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>
                              {editingProdiTipeUnit === 'Pusat' ? 'Fakultas Naungan' : 'Wilayah Kampus PSDKU'}
                            </label>
                            {editingProdiTipeUnit === 'Pusat' ? (
                              <select
                                className="custom-select"
                                value={editingProdiFakultasId || (fakultasListProp[0]?.id || '')}
                                onChange={(e) => setEditingProdiFakultasId(e.target.value)}
                                style={{ height: 32, fontSize: '11.5px' }}
                              >
                                {fakultasListProp.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.nama}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                className="custom-select"
                                value={editingProdiPsdkuId || (psdkuListProp[0]?.id || '')}
                                onChange={(e) => setEditingProdiPsdkuId(e.target.value)}
                                style={{ height: 32, fontSize: '11.5px' }}
                              >
                                {psdkuListProp.map((psd) => (
                                  <option key={psd.id} value={psd.id}>
                                    {psd.nama} ({psd.lokasi})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleSaveEditProdiAction(p.id)}
                              className="brand-btn btn-action-edit"
                              style={{ padding: '5px 10px', height: 32, fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}
                              title="Simpan Perubahan"
                            >
                              <Check size={13} />
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProdiId(null)}
                              className="brand-btn brand-btn--outline"
                              style={{ padding: '5px 8px', height: 32, fontSize: '11px' }}
                              title="Batal"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                            {label}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: p.tipe_unit === 'PSDKU' ? '#e0f2fe' : '#dcfce7',
                                color: p.tipe_unit === 'PSDKU' ? '#0369a1' : '#15803d',
                                fontWeight: 600,
                              }}
                            >
                              {p.tipe_unit === 'PSDKU' ? `📍 ${p.psdku_nama || 'PSDKU'}` : `🏛️ ${p.fakultas || 'Pusat'}`}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProdiId(p.id)
                              setEditingProdiJenjang((p.jenjang || 'S1') as any)
                              setEditingProdiNama(p.nama)
                              setEditingProdiTipeUnit((p.tipe_unit || 'Pusat') as any)
                              setEditingProdiFakultasId(p.fakultas_id || (fakultasListProp[0]?.id || ''))
                              setEditingProdiPsdkuId(p.psdku_id || (psdkuListProp[0]?.id || ''))
                            }}
                            className="btn-table-action btn-table-action--edit"
                            title="Edit Prodi & Fakultas"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProdiAction(p.id)}
                            className="btn-table-action btn-table-action--delete"
                            title="Hapus Prodi"
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
            )}
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
              onClick={handleCloseManageProdi}
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

  const renderManageFakultasModal = () => {
    if (!isManageFakultasOpen) return null
    return (
      <div
        onClick={handleCloseManageFakultas}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 540,
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
                Kelola Master Fakultas (Kampus Utama)
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Fakultas di Kampus Pusat yang menaungi Program Studi dan Dekan penilai SKP.
              </div>
            </div>
            <button
              onClick={handleCloseManageFakultas}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add Form */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Tambah Fakultas Baru
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8 }}>
              <input
                type="text"
                className="custom-input"
                placeholder="Nama Fakultas (misal: Fakultas Kedokteran)"
                value={newFakultasNama}
                onChange={(e) => setNewFakultasNama(e.target.value)}
                style={{ height: 36, fontSize: '12.5px' }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Kode (FKED)"
                value={newFakultasKode}
                onChange={(e) => setNewFakultasKode(e.target.value)}
                style={{ height: 36, fontSize: '12.5px' }}
              />
              <button
                type="button"
                onClick={handleAddFakultasAction}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 36, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--hair)', background: '#fafbfc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Cari fakultas..."
                value={fakultasSearchQuery}
                onChange={(e) => setFakultasSearchQuery(e.target.value)}
                style={{
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: fakultasSearchQuery ? 32 : 12,
                  fontSize: '12.5px',
                  borderRadius: 'var(--r-md)',
                  background: '#ffffff',
                  borderColor: fakultasSearchQuery ? 'var(--brand)' : 'var(--hair)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  width: '100%',
                }}
              />
              {fakultasSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFakultasSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Daftar Fakultas ({filteredFakultasList.length} dari {fakultasListProp.length})</span>
              {fakultasSearchQuery && (
                <span style={{ fontSize: '11px', color: 'var(--brand)', textTransform: 'none', fontWeight: 600 }}>
                  Filter aktif
                </span>
              )}
            </div>
            {filteredFakultasList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                Tidak ada fakultas yang cocok dengan pencarian "{fakultasSearchQuery}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredFakultasList.map((f) => {
                const isEditing = editingFakultasId === f.id
                return (
                  <div
                    key={f.id}
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
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <input
                          type="text"
                          className="custom-input"
                          value={editingFakultasNama}
                          onChange={(e) => setEditingFakultasNama(e.target.value)}
                          style={{ height: 32, fontSize: '12.5px', flex: 1 }}
                          autoFocus
                        />
                        <input
                          type="text"
                          className="custom-input"
                          value={editingFakultasKode}
                          onChange={(e) => setEditingFakultasKode(e.target.value)}
                          style={{ height: 32, fontSize: '12px', width: 80 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditFakultasAction(f.id)}
                          className="brand-btn btn-action-edit"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFakultasId(null)}
                          className="brand-btn brand-btn--outline"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                            {f.nama}
                          </span>
                          {f.kode && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: '#f1f5f9',
                                color: 'var(--muted)',
                                fontWeight: 700,
                              }}
                            >
                              {f.kode}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFakultasId(f.id)
                              setEditingFakultasNama(f.nama)
                              setEditingFakultasKode(f.kode || '')
                            }}
                            className="btn-table-action btn-table-action--edit"
                            title="Edit Fakultas"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFakultasAction(f.id)}
                            className="btn-table-action btn-table-action--delete"
                            title="Hapus Fakultas"
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
            )}
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
              onClick={handleCloseManageFakultas}
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

  const renderManagePsdkuModal = () => {
    if (!isManagePsdkuOpen) return null
    return (
      <div
        onClick={handleCloseManagePsdku}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 580,
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
                Kelola Master Kampus PSDKU
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Program Studi di Luar Kampus Utama (PSDKU) yang dipimpin oleh Kepala Cabang (KeCab).
              </div>
            </div>
            <button
              onClick={handleCloseManagePsdku}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add Form */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Tambah Kampus PSDKU Baru
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px auto', gap: 8 }}>
              <input
                type="text"
                className="custom-input"
                placeholder="Nama PSDKU (misal: PSDKU Cianjur)"
                value={newPsdkuNama}
                onChange={(e) => setNewPsdkuNama(e.target.value)}
                style={{ height: 36, fontSize: '12.5px' }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Lokasi / Kota (Cianjur)"
                value={newPsdkuLokasi}
                onChange={(e) => setNewPsdkuLokasi(e.target.value)}
                style={{ height: 36, fontSize: '12.5px' }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Kode"
                value={newPsdkuKode}
                onChange={(e) => setNewPsdkuKode(e.target.value)}
                style={{ height: 36, fontSize: '12px' }}
              />
              <button
                type="button"
                onClick={handleAddPsdkuAction}
                className="brand-btn btn-action-add"
                style={{ padding: '6px 14px', height: 36, flexShrink: 0 }}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--hair)', background: '#fafbfc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Cari kampus PSDKU..."
                value={psdkuSearchQuery}
                onChange={(e) => setPsdkuSearchQuery(e.target.value)}
                style={{
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: psdkuSearchQuery ? 32 : 12,
                  fontSize: '12.5px',
                  borderRadius: 'var(--r-md)',
                  background: '#ffffff',
                  borderColor: psdkuSearchQuery ? 'var(--brand)' : 'var(--hair)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  width: '100%',
                }}
              />
              {psdkuSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPsdkuSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Daftar Kampus PSDKU ({filteredPsdkuList.length} dari {psdkuListProp.length})</span>
              {psdkuSearchQuery && (
                <span style={{ fontSize: '11px', color: 'var(--brand)', textTransform: 'none', fontWeight: 600 }}>
                  Filter aktif
                </span>
              )}
            </div>
            {filteredPsdkuList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                Tidak ada kampus PSDKU yang cocok dengan pencarian "{psdkuSearchQuery}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredPsdkuList.map((p) => {
                const isEditing = editingPsdkuId === p.id
                return (
                  <div
                    key={p.id}
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
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <input
                          type="text"
                          className="custom-input"
                          value={editingPsdkuNama}
                          onChange={(e) => setEditingPsdkuNama(e.target.value)}
                          style={{ height: 32, fontSize: '12.5px', flex: 1 }}
                          autoFocus
                        />
                        <input
                          type="text"
                          className="custom-input"
                          value={editingPsdkuLokasi}
                          onChange={(e) => setEditingPsdkuLokasi(e.target.value)}
                          style={{ height: 32, fontSize: '12px', flex: 1 }}
                          placeholder="Lokasi"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditPsdkuAction(p.id)}
                          className="brand-btn btn-action-edit"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPsdkuId(null)}
                          className="brand-btn brand-btn--outline"
                          style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                            {p.nama}
                          </span>
                          {p.lokasi && (
                            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                              ({p.lokasi})
                            </span>
                          )}
                          {p.kode && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 700,
                              }}
                            >
                              {p.kode}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPsdkuId(p.id)
                              setEditingPsdkuNama(p.nama)
                              setEditingPsdkuLokasi(p.lokasi || '')
                              setEditingPsdkuKode(p.kode || '')
                            }}
                            className="btn-table-action btn-table-action--edit"
                            title="Edit PSDKU"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePsdkuAction(p.id)}
                            className="btn-table-action btn-table-action--delete"
                            title="Hapus PSDKU"
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
            )}
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
              onClick={handleCloseManagePsdku}
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

  const renderManageJabatanModal = () => {
    if (!isManageJabatanOpen) return null
    return (
      <div
        onClick={handleCloseManageJabatan}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 620,
            maxHeight: '92vh',
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
                Kelola Master Jabatan Kampus &amp; Role Login
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                Atur jabatan struktural/fungsional beserta akses role login otomatisnya di portal.
              </div>
            </div>
            <button
              onClick={handleCloseManageJabatan}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add Input */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)', background: '#fafbfc' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: 8, display: 'block' }}>
              Tambah Jabatan &amp; Role Baru
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Nama jabatan (misal: Rektor, Dekan, Ka.Bagian...)"
                  value={newJabatanNama}
                  onChange={(e) => setNewJabatanNama(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddJabatanAction()
                    }
                  }}
                  style={{ height: 36, fontSize: '13px', flex: '2 1 200px' }}
                />
                <select
                  className="custom-select"
                  value={newJabatanKategori}
                  onChange={(e) => setNewJabatanKategori(e.target.value as any)}
                  style={{ height: 36, fontSize: '12.5px', flex: '1 1 160px' }}
                >
                  {JABATAN_KATEGORI_OPTIONS.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 200px' }}>
                  <select
                    className="custom-select"
                    value={newJabatanRoleAkses}
                    onChange={(e) => setNewJabatanRoleAkses(e.target.value as Role)}
                    style={{ height: 36, fontSize: '12.5px', width: '100%', borderColor: newJabatanRoleAkses !== 'dosen' ? 'var(--brand)' : undefined }}
                  >
                    <option value="dosen">Role Login: Dosen (Default - Rektor / Wadek / Dosen Tetap)</option>
                    <option value="kaprodi">Role Login: Ketua Program Studi (Ka.Prodi)</option>
                    <option value="dekan">Role Login: Dekan Fakultas</option>
                    <option value="sdm">Role Login: Bagian SDM (Kepegawaian)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddJabatanAction}
                  className="brand-btn btn-action-add"
                  style={{ padding: '6px 16px', height: 36, flex: '1 1 auto', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                  <span>Tambah Jabatan</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
                ℹ️ <strong>Ketentuan Role:</strong> Bagian SDM &rarr; role <code>SDM</code>, Ka.Prodi &rarr; role <code>Ka.Prodi</code>, Dekan &rarr; role <code>Dekan</code>, sisanya (Rektor, Wakil Dekan, Dosen) login sebagai role <code>Dosen</code>.
              </div>
            </div>
          </div>

          {/* Search Bar inside Modal */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--hair)', background: '#fafbfc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="custom-input"
                placeholder="Cari nama jabatan, kategori, atau role login (sdm, kaprodi, dekan, dosen)..."
                value={jabatanSearchQuery}
                onChange={(e) => setJabatanSearchQuery(e.target.value)}
                style={{
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: jabatanSearchQuery ? 32 : 12,
                  fontSize: '12.5px',
                  borderRadius: 'var(--r-md)',
                  background: '#ffffff',
                  borderColor: jabatanSearchQuery ? 'var(--brand)' : 'var(--hair)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  width: '100%',
                }}
              />
              {jabatanSearchQuery && (
                <button
                  type="button"
                  onClick={() => setJabatanSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Jabatan List */}
          <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, maxHeight: 340 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Daftar Jabatan Kampus ({filteredJabatanList.length} dari {jabatanList.length})</span>
              {jabatanSearchQuery && <span>Filter aktif</span>}
            </div>
            {filteredJabatanList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                Tidak ada data jabatan yang cocok dengan pencarian "{jabatanSearchQuery}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredJabatanList.map((item) => {
                  const roleKey = item.role_akses || item.default_role || 'dosen'
                  const roleBadgeConfig = {
                    sdm: { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed', label: 'SDM' },
                    kaprodi: { bg: '#fef3c7', border: '#fde68a', color: '#b45309', label: 'Ka.Prodi' },
                    dekan: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', label: 'Dekan' },
                    dosen: { bg: '#f1f5f9', border: '#cbd5e1', color: '#475569', label: 'Dosen' },
                  }[roleKey] || { bg: '#f1f5f9', border: '#cbd5e1', color: '#475569', label: 'Dosen' }

                  return (
                    <div
                      key={item.id}
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
                      {editingJabatanId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            className="custom-input"
                            value={editingJabatanNama}
                            onChange={(e) => setEditingJabatanNama(e.target.value)}
                            style={{ height: 32, fontSize: '12.5px', flex: '2 1 170px' }}
                            placeholder="Nama jabatan..."
                            autoFocus
                          />
                          <select
                            className="custom-select"
                            value={editingJabatanKategori}
                            onChange={(e) => setEditingJabatanKategori(e.target.value)}
                            style={{ height: 32, fontSize: '12px', flex: '1.2 1 150px' }}
                            title="Kategori / Bagian Struktural"
                          >
                            {JABATAN_KATEGORI_OPTIONS.map((kat) => (
                              <option key={kat} value={kat}>
                                {kat}
                              </option>
                            ))}
                            {!JABATAN_KATEGORI_OPTIONS.includes(editingJabatanKategori as any) && editingJabatanKategori && (
                              <option value={editingJabatanKategori}>{editingJabatanKategori}</option>
                            )}
                          </select>
                          <select
                            className="custom-select"
                            value={editingJabatanRoleAkses}
                            onChange={(e) => setEditingJabatanRoleAkses(e.target.value as Role)}
                            style={{ height: 32, fontSize: '12px', flex: '1 1 110px' }}
                            title="Role Akses Login"
                          >
                            <option value="dosen">Role: Dosen</option>
                            <option value="kaprodi">Role: Ka.Prodi</option>
                            <option value="dekan">Role: Dekan</option>
                            <option value="sdm">Role: SDM</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveEditJabatanAction(item.id)}
                            className="brand-btn btn-action-edit"
                            style={{ padding: '4px 10px', height: 32, fontSize: '11px' }}
                            title="Simpan Perubahan"
                          >
                            <Check size={13} />
                            <span>Simpan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJabatanId(null)
                              setEditingJabatanNama('')
                            }}
                            className="brand-btn brand-btn--outline"
                            style={{ padding: '4px 8px', height: 32, fontSize: '11px' }}
                            title="Batal"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: item.is_struktural ? '#eff6ff' : '#f1f5f9',
                                color: item.is_struktural ? '#1d4ed8' : '#475569',
                                border: item.is_struktural ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              {item.kategori || (item.is_struktural ? 'Struktural' : 'Fungsional')}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                              {item.nama}
                            </span>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: '12px',
                                background: roleBadgeConfig.bg,
                                color: roleBadgeConfig.color,
                                border: `1px solid ${roleBadgeConfig.border}`,
                                fontSize: '10.5px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title={`Akun pejabat ini otomatis mendapatkan role login ${roleBadgeConfig.label}`}
                            >
                              🔑 Role: {roleBadgeConfig.label}
                            </span>
                            {(item.kode === 'DOSEN' || item.id === 'jab-dosen') && (
                              <span style={{ fontSize: '10px', color: 'var(--muted)', background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingJabatanId(item.id)
                                setEditingJabatanNama(item.nama)
                                setEditingJabatanKategori(item.kategori || (item.is_struktural ? 'Struktural' : 'Fungsional Dosen'))
                                setEditingJabatanRoleAkses(item.role_akses || item.default_role || 'dosen')
                              }}
                              className="btn-table-action btn-table-action--edit"
                              title="Edit Jabatan & Role"
                              aria-label={`Edit ${item.nama}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            {item.kode !== 'DOSEN' && item.id !== 'jab-dosen' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteJabatanAction(item)}
                                className="btn-table-action btn-table-action--delete"
                                title="Hapus Jabatan"
                                aria-label={`Hapus ${item.nama}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
              onClick={handleCloseManageJabatan}
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

            {/* Lokasi Penugasan: Pusat vs PSDKU */}
            <div style={{ marginTop: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 700, margin: 0 }}>
                    Lokasi Kampus Penugasan Dosen *
                  </label>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
                    Tentukan penempatan dosen di Kampus Utama (Pusat) atau Kampus Cabang (PSDKU).
                  </div>
                </div>

                <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: 3, borderRadius: 8, gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const firstFak = fakultasListProp[0]
                      const matchProdis = prodiObjects.filter((p) => (p.tipe_unit || 'Pusat') === 'Pusat' && (!firstFak || p.fakultas_id === firstFak.id))
                      const targetProdi = matchProdis[0] || prodiObjects.find((p) => (p.tipe_unit || 'Pusat') === 'Pusat')
                      const label = targetProdi ? (targetProdi.nama_lengkap || `${targetProdi.jenjang ? targetProdi.jenjang + ' ' : ''}${targetProdi.nama}`) : (prodiList[0] || '')
                      setFormData((prev) => ({
                        ...prev,
                        tipeLokasi: 'Pusat',
                        fakultasId: firstFak?.id || '',
                        fakultas: firstFak?.nama || '',
                        psdkuId: '',
                        kampus: 'Pusat',
                        programStudiId: targetProdi?.id || '',
                        prodi: label || prev.prodi,
                      }))
                    }}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: formData.tipeLokasi === 'Pusat' ? '#ffffff' : 'transparent',
                      color: formData.tipeLokasi === 'Pusat' ? 'var(--brand)' : 'var(--muted)',
                      boxShadow: formData.tipeLokasi === 'Pusat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Building2 size={13} />
                    <span>Kampus Utama (Pusat)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstPsdku = psdkuListProp[0]
                      const matchProdis = prodiObjects.filter((p) => p.tipe_unit === 'PSDKU' && (!firstPsdku || p.psdku_id === firstPsdku.id))
                      const targetProdi = matchProdis[0] || prodiObjects.find((p) => p.tipe_unit === 'PSDKU')
                      const label = targetProdi ? (targetProdi.nama_lengkap || `${targetProdi.jenjang ? targetProdi.jenjang + ' ' : ''}${targetProdi.nama}`) : ''
                      setFormData((prev) => ({
                        ...prev,
                        tipeLokasi: 'PSDKU',
                        fakultasId: '',
                        fakultas: '',
                        psdkuId: firstPsdku?.id || '',
                        kampus: firstPsdku?.nama || 'PSDKU',
                        programStudiId: targetProdi?.id || '',
                        prodi: label || prev.prodi,
                      }))
                    }}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: formData.tipeLokasi === 'PSDKU' ? '#ffffff' : 'transparent',
                      color: formData.tipeLokasi === 'PSDKU' ? 'var(--brand)' : 'var(--muted)',
                      boxShadow: formData.tipeLokasi === 'PSDKU' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <MapPin size={13} />
                    <span>Kampus Cabang (PSDKU)</span>
                  </button>
                </div>
              </div>

              {/* Conditional placement fields */}
              <div className="form-grid-2">
                {formData.tipeLokasi === 'Pusat' ? (
                  <div className="form-field">
                    <div className="form-field-label-row">
                      <label className="form-label">Fakultas (Kampus Pusat) *</label>
                      <button
                        type="button"
                        onClick={() => setIsManageFakultasOpen(true)}
                        className="btn-manage-pill"
                        title="Kelola Opsi Fakultas"
                      >
                        <Settings size={12} />
                        <span>Kelola Fakultas</span>
                      </button>
                    </div>
                    <select
                      className="custom-select"
                      value={formData.fakultasId}
                      onChange={(e) => {
                        const fid = e.target.value
                        const fObj = fakultasListProp.find((f) => f.id === fid)
                        const filtered = prodiObjects.filter((p) => (p.tipe_unit || 'Pusat') === 'Pusat' && p.fakultas_id === fid)
                        const firstMatch = filtered[0]
                        const label = firstMatch ? (firstMatch.nama_lengkap || `${firstMatch.jenjang ? firstMatch.jenjang + ' ' : ''}${firstMatch.nama}`) : ''
                        setFormData((prev) => ({
                          ...prev,
                          fakultasId: fid,
                          fakultas: fObj?.nama || '',
                          programStudiId: firstMatch?.id || '',
                          prodi: label || prev.prodi,
                        }))
                      }}
                    >
                      {fakultasListProp.map((fak) => (
                        <option key={fak.id} value={fak.id}>
                          {fak.nama} ({fak.kode})
                        </option>
                      ))}
                    </select>
                    <span className="form-help">
                      Fakultas naungan program studi di Kampus Utama Bandung.
                    </span>
                  </div>
                ) : (
                  <div className="form-field">
                    <div className="form-field-label-row">
                      <label className="form-label">Kampus PSDKU *</label>
                      <button
                        type="button"
                        onClick={() => setIsManagePsdkuOpen(true)}
                        className="btn-manage-pill"
                        title="Kelola Opsi PSDKU"
                      >
                        <Settings size={12} />
                        <span>Kelola PSDKU</span>
                      </button>
                    </div>
                    <select
                      className="custom-select"
                      value={formData.psdkuId}
                      onChange={(e) => {
                        const pid = e.target.value
                        const pObj = psdkuListProp.find((p) => p.id === pid)
                        const filtered = prodiObjects.filter((p) => p.tipe_unit === 'PSDKU' && p.psdku_id === pid)
                        const firstMatch = filtered[0]
                        const label = firstMatch ? (firstMatch.nama_lengkap || `${firstMatch.jenjang ? firstMatch.jenjang + ' ' : ''}${firstMatch.nama}`) : ''
                        setFormData((prev) => ({
                          ...prev,
                          psdkuId: pid,
                          kampus: pObj?.nama || 'PSDKU',
                          programStudiId: firstMatch?.id || '',
                          prodi: label || prev.prodi,
                        }))
                      }}
                    >
                      {psdkuListProp.map((psd) => (
                        <option key={psd.id} value={psd.id}>
                          {psd.nama} {psd.lokasi ? `- ${psd.lokasi}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="form-help">
                      Lokasi kampus PSDKU tempat dosen bertugas.
                    </span>
                  </div>
                )}

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
                    value={formData.programStudiId || formData.prodi}
                    onChange={(e) => {
                      const val = e.target.value
                      const matched = prodiObjects.find(
                        (p) =>
                          p.id === val ||
                          p.nama_lengkap === val ||
                          `${p.jenjang} ${p.nama}` === val ||
                          p.nama === val
                      )
                      if (matched) {
                        const label = matched.nama_lengkap || `${matched.jenjang ? matched.jenjang + ' ' : ''}${matched.nama}`
                        setFormData((prev) => ({
                          ...prev,
                          programStudiId: matched.id,
                          prodi: label,
                        }))
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          prodi: val,
                        }))
                      }
                    }}
                  >
                    {activeProdiOptions.length > 0 ? (
                      activeProdiOptions.map((p) => {
                        const label = p.nama_lengkap || `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama}`
                        return (
                          <option key={p.id} value={p.id}>
                            {label}
                          </option>
                        )
                      })
                    ) : (
                      prodiList.map((p, idx) => (
                        <option key={idx} value={p}>
                          {p}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="form-help">
                    {formData.tipeLokasi === 'Pusat'
                      ? 'Menampilkan prodi Kampus Utama (Jenjang + Nama murni).'
                      : 'Menampilkan prodi khusus Kampus PSDKU terpilih.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-field" style={{ marginTop: 14 }}>
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

            <div className="form-grid-2" style={{ marginTop: 14 }}>
              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Jabatan Kampus / Tugas Tambahan *</label>
                  <button
                    type="button"
                    onClick={() => setIsManageJabatanOpen(true)}
                    className="btn-manage-pill"
                    title="Kelola Opsi Jabatan Kampus"
                  >
                    <Settings size={12} />
                    <span>Kelola Jabatan</span>
                  </button>
                </div>
                <select
                  className="custom-select"
                  value={formData.jabatanStruktural}
                  onChange={(e) => {
                    const sel = jabatanList.find((j) => j.nama === e.target.value)
                    let autoRole: Role = (sel?.role_akses || sel?.default_role || 'dosen') as Role
                    if (!sel?.role_akses && !sel?.default_role) {
                      const lower = e.target.value.toLowerCase()
                      if (lower.includes('sdm')) autoRole = 'sdm'
                      else if (lower.includes('kaprodi') || lower.includes('ketua program studi') || lower.includes('ka prodi') || lower.includes('ka.prodi')) autoRole = 'kaprodi'
                      else if (lower.includes('dekan') && !lower.includes('wakil')) autoRole = 'dekan'
                      else autoRole = 'dosen'
                    }
                    setFormData({
                      ...formData,
                      jabatanStruktural: e.target.value,
                      jabatanKampusId: sel?.id || '',
                      roleLogin: autoRole,
                    })
                  }}
                >
                  {jabatanList.map((j) => (
                    <option key={j.id} value={j.nama}>
                      {j.nama} {j.kategori ? `(${j.kategori})` : ''}
                    </option>
                  ))}
                  {!jabatanList.some((j) => j.nama === formData.jabatanStruktural) && (
                    <option value={formData.jabatanStruktural}>{formData.jabatanStruktural}</option>
                  )}
                </select>
                <span className="form-help">
                  Pilih "Dosen" apabila pengajar tidak memegang tugas pimpinan/struktural tambahan di kampus.
                </span>
              </div>

              <div className="form-field">
                <div className="form-field-label-row">
                  <label className="form-label">Role Akses Login Portal *</label>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600,
                    }}
                  >
                    <Lock size={12} />
                    <span>Otomatis</span>
                  </span>
                </div>
                <select
                  className="custom-select"
                  value={formData.roleLogin}
                  disabled
                  style={{
                    backgroundColor: 'var(--panel-hover, #f8fafc)',
                    cursor: 'not-allowed',
                    color: 'var(--ink, #1e293b)',
                    fontWeight: 600,
                    borderColor: 'var(--hair, #e2e8f0)',
                    opacity: 0.95,
                  }}
                  title="Role login terisi otomatis berdasarkan Jabatan Kampus yang dipilih."
                >
                  <option value="dosen">Dosen (Akses Portal Dosen - Default)</option>
                  <option value="kaprodi">Ketua Program Studi (Ka.Prodi - Review SKP Prodi)</option>
                  <option value="dekan">Dekan (Pengesahan SKP Fakultas & PSDKU)</option>
                  <option value="sdm">Bagian SDM (Akses Master Data SDM)</option>
                </select>
                <span className="form-help">
                  Role login terisi otomatis mengikuti Jabatan Kampus terpilih (SDM &rarr; SDM, Ka.Prodi &rarr; Ka.Prodi, Dekan/KeCab &rarr; Dekan, lainnya &rarr; Dosen).
                </span>
              </div>
            </div>

            {currentPositionConflict && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2, fontSize: '16px' }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#78350f', marginBottom: 2 }}>
                    Perhatian: Jabatan Tunggal Sudah Terisi
                  </div>
                  <div>
                    Jabatan <strong>{currentPositionConflict.jabatanTitle}</strong> untuk <strong>{currentPositionConflict.scopeName}</strong> saat ini masih diemban oleh <strong>{currentPositionConflict.holder.nama}</strong> (NIP: {currentPositionConflict.holder.nip}).
                  </div>
                  <div style={{ marginTop: 4, color: '#b45309', fontSize: '11.5px' }}>
                    ℹ️ Sesuai ketentuan institusi, jabatan ini hanya boleh dipegang oleh <strong>1 orang</strong>. Jika Anda menyimpan data ini, sistem akan <strong>melakukan pergantian/serah terima jabatan otomatis</strong>: dosen ini menjadi {currentPositionConflict.jabatanTitle}, dan <strong>{currentPositionConflict.holder.nama}</strong> otomatis dikembalikan status jabatannya menjadi Dosen biasa.
                  </div>
                </div>
              </div>
            )}
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
              disabled={isSavingDosen}
              onClick={() => setViewMode('list')}
            >
              Batal
            </button>
            <button type="submit" className="brand-btn btn-action-add" disabled={isSavingDosen}>
              {isSavingDosen ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <span>{viewMode === 'create' ? 'Simpan Data Dosen' : 'Perbarui Data Dosen'}</span>
              )}
            </button>
          </div>
        </form>

        {renderManageProdiModal()}
        {renderManageJabatanModal()}
        {renderManageFakultasModal()}
        {renderManagePsdkuModal()}
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
                NIP: <strong style={{ color: 'var(--ink)' }}>{selectedDosen.nip}</strong> &bull; NUPTK: <strong style={{ color: 'var(--ink)' }}>{selectedDosen.nuptk || '-'}</strong> &bull; Homebase: {selectedDosen.prodi} &bull; Jabatan Kampus: <strong style={{ color: 'var(--ink)' }}>{selectedDosen.jabatanStruktural || 'Dosen'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Jabatan Fungsional</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-700)', marginTop: 4 }}>
                {selectedDosen.jafung}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Jabatan Kampus / Tugas Tambahan</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: selectedDosen.jabatanStruktural && selectedDosen.jabatanStruktural !== 'Dosen' ? '#1d4ed8' : 'var(--ink)', marginTop: 4 }}>
                {selectedDosen.jabatanStruktural || 'Dosen'}
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
                {(() => {
                  const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(selectedDosen.skpStatus)
                  return (
                    <span
                      className={`badge-pill ${
                        isSah
                          ? 'badge-pill--green'
                          : selectedDosen.skpStatus === 'Perlu Revisi'
                          ? 'badge-pill--red'
                          : selectedDosen.skpStatus === 'Diajukan'
                          ? 'badge-pill--orange'
                          : 'badge-pill--gray'
                      }`}
                    >
                      {isSah ? 'Sah & Terbit' : selectedDosen.skpStatus}
                    </span>
                  )
                })()}
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
              <th>Jabatan Fungsional &amp; Kampus</th>
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
                    <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      {dosen.kampus && dosen.kampus !== 'Pusat' ? (
                        <span style={{ color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
                          📍 {dosen.kampus}
                        </span>
                      ) : (
                        <span style={{ color: '#047857', fontWeight: 600, background: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                          🏛️ {dosen.fakultas || 'Pusat'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--r-xs)',
                          background: 'var(--panel-hover)',
                          border: '1px solid var(--hair)',
                          color: 'var(--brand-700)',
                          fontWeight: 600,
                          fontSize: '11.5px',
                          width: 'fit-content',
                        }}
                      >
                        {dosen.jafung}
                      </span>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--r-xs)',
                          background: dosen.jabatanStruktural && dosen.jabatanStruktural !== 'Dosen' ? '#eff6ff' : '#f8fafc',
                          border: dosen.jabatanStruktural && dosen.jabatanStruktural !== 'Dosen' ? '1px solid #bfdbfe' : '1px solid var(--hair)',
                          color: dosen.jabatanStruktural && dosen.jabatanStruktural !== 'Dosen' ? '#1d4ed8' : 'var(--muted)',
                          fontWeight: 600,
                          fontSize: '11px',
                          width: 'fit-content',
                        }}
                      >
                        🏛️ {dosen.jabatanStruktural || 'Dosen'}
                      </span>
                    </div>
                  </td>
                  <td>{dosen.golongan}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{dosen.status}</span>
                  </td>
                  <td>
                    {(() => {
                      const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(dosen.skpStatus)
                      return (
                        <span
                          className={`badge-pill ${
                            isSah
                              ? 'badge-pill--green'
                              : dosen.skpStatus === 'Perlu Revisi'
                              ? 'badge-pill--red'
                              : dosen.skpStatus === 'Diajukan'
                              ? 'badge-pill--orange'
                              : 'badge-pill--gray'
                          }`}
                        >
                          {isSah ? 'Sah & Terbit' : dosen.skpStatus}
                        </span>
                      )
                    })()}
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
      {renderManageJabatanModal()}
      {renderManageFakultasModal()}
      {renderManagePsdkuModal()}
    </div>
  )
}
