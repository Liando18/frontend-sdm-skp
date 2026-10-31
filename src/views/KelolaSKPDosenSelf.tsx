import React, { useState, useRef, useMemo } from 'react'
import {
  ExternalLink,
  Filter,
  Search,
  CheckCircle2,
  Printer,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Globe,
  X,
  Award,
  TrendingUp,
  Layers,
  FileCheck,
} from 'lucide-react'
import {
  PengajuanSKP,
  SKPItem,
  KomponenSKP,
  UserSession,
  Dosen,
  JabatanKampus,
  ProgramStudi,
  DriveLinkCheckResult,
} from '../types'
import { useStaggerEntrance } from '../utils/animations'
import { FormulirCetakSKP } from '../components/FormulirCetakSKP'
import { openPrintSKP } from '../utils/printSKP'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { sanitizeUrl } from '../utils/security'
import { api } from '../services/api'

interface KelolaSKPDosenSelfProps {
  user?: UserSession
  skpList?: PengajuanSKP[]
  mySKP?: PengajuanSKP
  dosenList?: Dosen[]
  jabatanList?: JabatanKampus[]
  prodiList?: ProgramStudi[]
  komponenList: KomponenSKP[]
  onUpdateSKP: (skp: PengajuanSKP) => void
  onSubmitSKP?: (skpId: string) => void
  onShowToast: (msg: string) => void
}

/**
 * Mencocokkan target jabatan komponen SKP dengan jabatan kampus dosen yang login.
 * Tridharma (Pendidikan, Penelitian, Pengabdian, Penunjang) berlaku umum untuk semua Dosen,
 * sedangkan komponen Tugas Tambahan struktural (Kaprodi, Dekan, Rektor, dll.) hanya muncul
 * untuk dosen pemangku jabatan struktural yang bersangkutan.
 */
export const isKomponenTargetMatching = (
  componentTarget?: string,
  userPosition?: string
): boolean => {
  const comp = (componentTarget || 'Dosen').trim().toLowerCase()
  const userPos = (userPosition || 'Dosen').trim().toLowerCase()

  // 1. "Semua Jabatan" berlaku universal
  if (comp === 'semua jabatan' || comp === 'semua') {
    return true
  }

  // 2. Kecocokan persis
  if (comp === userPos) {
    return true
  }

  // Normalisasi istilah Dosen umum
  const isCompDosen = comp === 'dosen' || comp === 'dosen tetap'
  const isUserRegularDosen = userPos === 'dosen' || userPos === 'dosen tetap'

  // Komponen standar Tridharma dosen (Pendidikan, Penelitian, Pengabdian, Penunjang)
  // Semua dosen dan dosen dengan tugas tambahan struktural tetap mengampu Tridharma
  if (isCompDosen) {
    return true
  }

  // Jika dosen reguler tanpa jabatan struktural, JANGAN tampilkan tugas struktural apapun
  if (isUserRegularDosen) {
    return false
  }

  // Pencocokan jabatan struktural spesifik (toleran variasi nama)
  if (
    userPos.includes('dekan') &&
    comp.includes('dekan') &&
    !userPos.includes('wakil dekan') &&
    !comp.includes('wakil dekan')
  ) {
    return true
  }
  if (userPos.includes('wakil dekan') && comp.includes('wakil dekan')) {
    return true
  }
  if (
    (userPos.includes('kaprodi') || userPos.includes('ketua program studi')) &&
    (comp.includes('kaprodi') || comp.includes('ketua program studi'))
  ) {
    return true
  }
  if (
    (userPos.includes('sekprodi') || userPos.includes('sekretaris program studi')) &&
    (comp.includes('sekprodi') || comp.includes('sekretaris program studi'))
  ) {
    return true
  }
  if (userPos.includes('rektor') && comp.includes('rektor')) {
    const userIsWarek = userPos.includes('wakil')
    const compIsWarek = comp.includes('wakil')
    if (userIsWarek === compIsWarek) {
      if (!userIsWarek) return true
      if (userPos.includes('i ') || userPos.includes('1') || userPos.includes('akademik')) {
        return comp.includes('i ') || comp.includes('1') || comp.includes('akademik')
      }
      if (userPos.includes('ii') || userPos.includes('2') || userPos.includes('keuangan')) {
        return comp.includes('ii') || comp.includes('2') || comp.includes('keuangan')
      }
      return true
    }
  }

  return false
}

const TAHUN_AJARAN_OPTIONS = ['2026/2027', '2025/2026', '2024/2025']

// Formula Kual / Mutu (%):
// Jika Perubahan Tengah == 0: (Realisasi Akhir / Rencana Awal) * 100
// Jika Perubahan Tengah != 0: (Realisasi Akhir / Perubahan Tengah) * 100
const calculateMutu = (
  rencanaAwal: number,
  perubahanTengah: number,
  realisasiAkhir: number
): number => {
  const ra = Number(rencanaAwal) || 0
  const pt = Number(perubahanTengah) || 0
  const rel = Number(realisasiAkhir) || 0

  if (rel <= 0) return 0

  const target = pt !== 0 ? pt : ra
  if (target <= 0) return 0

  const val = (rel / target) * 100
  return Number(val.toFixed(2))
}

export const KelolaSKPDosenSelf: React.FC<KelolaSKPDosenSelfProps> = ({
  user,
  skpList = [],
  mySKP,
  dosenList = [],
  jabatanList = [],
  prodiList = [],
  komponenList,
  onUpdateSKP,
  onSubmitSKP,
  onShowToast,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>(
    mySKP?.tahunAkademik || TAHUN_AJARAN_OPTIONS[0]
  )
  const [selectedSemester, setSelectedSemester] = useState<'Genap' | 'Ganjil'>(
    (mySKP?.semester as 'Genap' | 'Ganjil') || 'Genap'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua')
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // State untuk deteksi tautan Google Drive / Bukti Dokumen
  const [driveCheckState, setDriveCheckState] = useState<
    Record<string, { loading: boolean; result?: DriveLinkCheckResult }>
  >({})

  const isSDM = Boolean(user?.role === 'sdm')
  const isDekan = Boolean(
    user?.role === 'dekan' ||
    user?.rank?.toLowerCase().includes('dekan')
  )

  const isKaprodi =
    !isDekan && !isSDM && Boolean(
      user?.role === 'kaprodi' ||
      mySKP?.penilaiRole === 'Dekan' ||
      mySKP?.dosenJabatan?.toLowerCase().includes('ketua program studi') ||
      user?.rank?.toLowerCase().includes('ketua program studi')
    )

  const targetDosenId =
    user?.id || mySKP?.dosenId || ''
  const targetDosenNama =
    user?.name || mySKP?.dosenNama || (isDekan ? 'Dekan Fakultas' : isKaprodi ? 'Ketua Program Studi' : isSDM ? 'SDM' : 'Dosen')
  const targetDosenNip =
    user?.nip || mySKP?.dosenNip || ''
  const targetDosenProdi = user?.prodi || mySKP?.dosenProdi || (isSDM ? 'Direktorat Sumber Daya Manusia' : '')
  const targetDosenRank =
    user?.rank || mySKP?.dosenPangkat || (isDekan ? 'Dekan Fakultas' : isKaprodi ? 'Ketua Program Studi' : isSDM ? 'Staf SDM' : 'Dosen Tetap')

  // Temukan objek dosen terkait dari database untuk mendapatkan jabatan struktural riil
  const matchedDosenFromList = dosenList.find(
    (d) => d.id === targetDosenId || d.nama === targetDosenNama || (targetDosenNip && d.nip === targetDosenNip)
  )

  // Jabatan kampus definitif dosen yang login (misal: 'Dosen', 'Ketua Program Studi', 'Dekan Fakultas', 'Rektor', dll)
  const lecturerJabatanStruktural =
    user?.jabatanStruktural ||
    matchedDosenFromList?.jabatanStruktural ||
    (isDekan
      ? 'Dekan Fakultas'
      : isKaprodi
      ? 'Ketua Program Studi'
      : isSDM
      ? 'Kepala Bagian SDM'
      : 'Dosen')

  // Map komponen untuk pencarian cepat berdasarkan ID dan kode
  const komponenById = useMemo(() => {
    const map = new Map<string, KomponenSKP>()
    komponenList.forEach((k) => {
      map.set(k.id, k)
      if (k.kode) map.set(k.kode, k)
    })
    return map
  }, [komponenList])

  // Helper verifikasi apakah sebuah item SKP cocok dengan jabatan dosen login
  const isItemMatchingPosition = (it: SKPItem) => {
    const comp = komponenById.get(it.komponenId) || (it.kode ? komponenById.get(it.kode) : undefined)
    if (!comp) return true
    return isKomponenTargetMatching(comp.targetJabatan, lecturerJabatanStruktural)
  }

  // Sanitasi daftar item SKP agar hanya memuat komponen yang relevan dengan jabatan login
  const getSanitizedItems = (rawItems: SKPItem[]): SKPItem[] => {
    const validItems = (rawItems || []).filter(isItemMatchingPosition)
    if (validItems.length === 0) {
      const matching = komponenList.filter((k) =>
        isKomponenTargetMatching(k.targetJabatan, lecturerJabatanStruktural)
      )
      const skpId = `skp-self-${targetDosenId || 'default'}-${selectedSemester.toLowerCase()}-${selectedTahun.replace('/', '-')}`
      return (matching.length > 0 ? matching : komponenList).map((k) => ({
        id: `item-${skpId}-${k.id}`,
        komponenId: k.id,
        kode: k.kode,
        kegiatan: k.namaKegiatan,
        kategori: k.kategori,
        rencanaAwal: 0,
        perubahanTengah: 0,
        realisasi: 0,
        satuan: k.satuan,
        kualitasMutu: 0,
        waktuNilai: k.waktuNilai,
        waktuSatuan: k.waktuSatuan,
        linkDokumen: '',
        nilaiCapaian: 0,
      }))
    }
    return validItems
  }

  // Find existing SKP for this lecturer/kaprodi/dekan, semester, and academic year
  const getActiveSKP = (): PengajuanSKP => {
    // Resolve real Kaprodi for targetDosenProdi with strict territorial isolation
    const isTargetPsdku = Boolean(
      user?.tipeLokasi === 'PSDKU' ||
      user?.psdkuId ||
      (user as any)?.psdku_id ||
      (user?.kampus && user.kampus.toLowerCase().includes('psdku')) ||
      matchedDosenFromList?.tipeLokasi === 'PSDKU' ||
      matchedDosenFromList?.psdkuId ||
      (matchedDosenFromList?.kampus && matchedDosenFromList.kampus.toLowerCase().includes('psdku'))
    )
    const targetPsdkuId = user?.psdkuId || (user as any)?.psdku_id || matchedDosenFromList?.psdkuId || (matchedDosenFromList as any)?.psdku_id
    const targetKampus = (user?.kampus || matchedDosenFromList?.kampus || '').toLowerCase()

    const kaprodiFromDosen = dosenList.find((d) => {
      const matchProdi = d.prodi === targetDosenProdi
      if (!matchProdi || !d.isKaprodi) return false

      if (isTargetPsdku) {
        const dIsPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
          (d as any).tipe_lokasi === 'PSDKU' ||
          d.psdkuId ||
          (d as any).psdku_id ||
          (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        if (!dIsPsdku) return false
        if (targetPsdkuId && (d.psdkuId || (d as any).psdku_id)) {
          return d.psdkuId === targetPsdkuId || (d as any).psdku_id === targetPsdkuId
        }
        if (targetKampus && d.kampus) {
          return d.kampus.toLowerCase().includes(targetKampus) || targetKampus.includes(d.kampus.toLowerCase())
        }
        return true
      } else {
        const dIsPsdku = Boolean(
          d.tipeLokasi === 'PSDKU' ||
          (d as any).tipe_lokasi === 'PSDKU' ||
          d.psdkuId ||
          (d as any).psdku_id ||
          (d.kampus && d.kampus.toLowerCase().includes('psdku'))
        )
        return !dIsPsdku
      }
    })

    const matchedProdi = prodiList.find((p) => {
      const matchProdi = p.nama === targetDosenProdi
      if (!matchProdi) return false
      if (isTargetPsdku) {
        const pIsPsdku = p.tipe_unit === 'PSDKU' || p.tipeUnit === 'PSDKU' || Boolean(p.psdku_id || p.psdkuId)
        if (!pIsPsdku) return false
        if (targetPsdkuId && (p.psdku_id || p.psdkuId)) {
          return p.psdku_id === targetPsdkuId || p.psdkuId === targetPsdkuId
        }
        return true
      } else {
        const pIsPsdku = p.tipe_unit === 'PSDKU' || p.tipeUnit === 'PSDKU' || Boolean(p.psdku_id || p.psdkuId)
        return !pIsPsdku
      }
    }) || prodiList.find((p) => p.nama === targetDosenProdi)

    const realKaprodiNama =
      kaprodiFromDosen?.nama ||
      matchedProdi?.kaprodiNama ||
      'Ketua Program Studi'
    const realKaprodiNip =
      kaprodiFromDosen?.nip ||
      matchedProdi?.kaprodiNip ||
      '-'
    const currentDosenSignature = user?.signatureUrl || matchedDosenFromList?.signatureUrl

    const found = skpList.find(
      (s) =>
        (s.dosenId === targetDosenId || s.dosenNama === targetDosenNama) &&
        s.semester === selectedSemester &&
        s.tahunAkademik === selectedTahun
    )
    if (found) {
      const cloned = { ...found }
      // Self-healing: if penilai is Kaprodi and either empty or defaulted to Ade Iwan for another prodi or wrong campus
      if (
        (!cloned.penilaiRole || cloned.penilaiRole === 'Kaprodi') &&
        targetDosenProdi &&
        (cloned.penilaiNama === 'Ade Iwan Mutiudin, M.Kep' || !cloned.penilaiNama || (realKaprodiNama !== 'Ketua Program Studi' && cloned.penilaiNama !== realKaprodiNama))
      ) {
        cloned.penilaiNama = realKaprodiNama
        cloned.penilaiNip = realKaprodiNip
        cloned.penilaiJabatan = `Ketua Program Studi ${targetDosenProdi}`
      }
      // Self-healing: if ttdDosenUrl is empty or SVG placeholder, use real signature from profile
      if (
        currentDosenSignature &&
        (!cloned.ttdDosenUrl || cloned.ttdDosenUrl.startsWith('data:image/svg'))
      ) {
        cloned.ttdDosenUrl = currentDosenSignature
      }
      return cloned
    }

    if (mySKP && mySKP.semester === selectedSemester && mySKP.tahunAkademik === selectedTahun) {
      const cloned = { ...mySKP }
      if (
        (!cloned.penilaiRole || cloned.penilaiRole === 'Kaprodi') &&
        targetDosenProdi &&
        (cloned.penilaiNama === 'Ade Iwan Mutiudin, M.Kep' || !cloned.penilaiNama || (realKaprodiNama !== 'Ketua Program Studi' && cloned.penilaiNama !== realKaprodiNama))
      ) {
        cloned.penilaiNama = realKaprodiNama
        cloned.penilaiNip = realKaprodiNip
        cloned.penilaiJabatan = `Ketua Program Studi ${targetDosenProdi}`
      }
      if (
        currentDosenSignature &&
        (!cloned.ttdDosenUrl || cloned.ttdDosenUrl.startsWith('data:image/svg'))
      ) {
        cloned.ttdDosenUrl = currentDosenSignature
      }
      return cloned
    }

    // Filter komponen master spesifik yang sesuai dengan jabatan dosen yang login
    const matchingKomponen = komponenList.filter((k) =>
      isKomponenTargetMatching(k.targetJabatan, lecturerJabatanStruktural)
    )

    const generatedSkpId = `skp-self-${targetDosenId || 'default'}-${selectedSemester.toLowerCase()}-${selectedTahun.replace('/', '-')}`

    const initialItems: SKPItem[] = (matchingKomponen.length > 0
      ? matchingKomponen
      : komponenList
    ).map((k) => ({
      id: `item-${generatedSkpId}-${k.id}`,
      komponenId: k.id,
      kode: k.kode,
      kegiatan: k.namaKegiatan,
      kategori: k.kategori,
      rencanaAwal: 0,
      perubahanTengah: 0,
      realisasi: 0,
      satuan: k.satuan,
      kualitasMutu: 0,
      waktuNilai: k.waktuNilai,
      waktuSatuan: k.waktuSatuan,
      linkDokumen: '',
      nilaiCapaian: 0,
    }))

    // Determine default evaluators in hierarchy
    let defaultPenilaiNama = ''
    let defaultPenilaiNip = ''
    let defaultPenilaiJabatan = ''
    let defaultPenilaiRole: 'Kaprodi' | 'Dekan' | 'SDM' = 'Kaprodi'

    if (isDekan) {
      // Dekan dinilai oleh Kaprodi tempat homebase dosen bertugas
      defaultPenilaiNama = realKaprodiNama
      defaultPenilaiNip = realKaprodiNip
      defaultPenilaiJabatan = `Ketua Program Studi ${targetDosenProdi || ''}`
      defaultPenilaiRole = 'Kaprodi'
    } else if (isKaprodi) {
      const isUserPsdku = Boolean(
        user?.tipeLokasi === 'PSDKU' ||
        user?.psdkuId ||
        (user as any)?.psdku_id ||
        (user?.kampus && user.kampus.toLowerCase().includes('psdku'))
      )

      if (isUserPsdku) {
        // Kaprodi di PSDKU dinilai oleh Kepala Cabang (KeCab) PSDKU tersebut
        const myPsdkuId = user?.psdkuId || (user as any)?.psdku_id
        const userKampus = (user?.kampus || '').toLowerCase()
        const kecab = dosenList.find((d) =>
          (d.jabatanStruktural === 'Kepala Cabang (KeCab)' || d.jabatan_struktural === 'Kepala Cabang (KeCab)' || d.isDekan) &&
          (d.tipeLokasi === 'PSDKU' || d.tipe_lokasi === 'PSDKU') &&
          ((myPsdkuId && (d.psdkuId === myPsdkuId || d.psdku_id === myPsdkuId)) || (userKampus && (d.kampus || '').toLowerCase().includes(userKampus)))
        ) || dosenList.find((d) => d.jabatanStruktural === 'Kepala Cabang (KeCab)' || d.jabatan_struktural === 'Kepala Cabang (KeCab)')

        defaultPenilaiNama = kecab?.nama || 'Kepala Cabang PSDKU'
        defaultPenilaiNip = kecab?.nip || '-'
        defaultPenilaiJabatan = `Kepala Cabang ${user?.kampus || kecab?.kampus || 'PSDKU'}`
        defaultPenilaiRole = 'Dekan'
      } else {
        // Kaprodi di Kampus Pusat dinilai oleh Dekan Fakultas tempat prodi bernaung
        const myFakId = user?.fakultasId || (user as any)?.fakultas_id
        const myFakName = (user?.fakultas || '').toLowerCase()
        const dekan = dosenList.find((d) =>
          d.isDekan &&
          (d.tipeLokasi === 'Pusat' || !d.psdkuId) &&
          (
            (myFakId && (d.fakultasId === myFakId || d.fakultas_id === myFakId)) ||
            (myFakName && (d.fakultas || '').toLowerCase().includes(myFakName))
          )
        ) || dosenList.find((d) => d.isDekan && (d.tipeLokasi === 'Pusat' || !d.psdkuId)) || dosenList.find((d) => d.isDekan)

        defaultPenilaiNama = dekan?.nama || 'Dekan Fakultas'
        defaultPenilaiNip = dekan?.nip || '-'
        defaultPenilaiJabatan = `Dekan ${user?.fakultas || dekan?.fakultas || 'Fakultas'}`
        defaultPenilaiRole = 'Dekan'
      }
    } else {
      // Dosen reguler dinilai oleh Kaprodi
      defaultPenilaiNama = realKaprodiNama
      defaultPenilaiNip = realKaprodiNip
      defaultPenilaiJabatan = `Ketua Program Studi ${targetDosenProdi || 'S1 Keperawatan'}`
      defaultPenilaiRole = 'Kaprodi'
    }

    return {
      id: generatedSkpId,
      dosenId: targetDosenId,
      dosenNama: targetDosenNama,
      dosenNip: targetDosenNip,
      dosenProdi: targetDosenProdi,
      dosenPangkat: targetDosenRank,
      dosenJabatan: lecturerJabatanStruktural,
      penilaiNama: defaultPenilaiNama,
      penilaiNip: defaultPenilaiNip,
      penilaiJabatan: defaultPenilaiJabatan,
      penilaiUnit: user?.fakultas || 'Universitas Bhakti Kencana',
      penilaiRole: defaultPenilaiRole,
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      totalSksRencana: 0,
      totalSksRealisasi: 0,
      persentaseCapaian: 0,
      nilaiKinerjaSKP: 0,
      status: 'Draft',
      tanggalPengajuan: new Date().toISOString().split('T')[0],
      catatanKaprodi: '',
      catatanSDM: '',
      ttdDosenUrl: currentDosenSignature || '',
      items: initialItems,
    }
  }

  const activeSKP = getActiveSKP()
  const [items, setItems] = useState<SKPItem[]>(() => getSanitizedItems(activeSKP.items || []))

  // Sync items when activeSKP changes or when semester/tahun/jabatan changes
  const prevSKPKey = useRef(`${selectedSemester}-${selectedTahun}-${lecturerJabatanStruktural}`)
  const currentSKPKey = `${selectedSemester}-${selectedTahun}-${lecturerJabatanStruktural}`
  if (prevSKPKey.current !== currentSKPKey) {
    prevSKPKey.current = currentSKPKey
    setItems(getSanitizedItems(activeSKP.items || []))
  }

  // Handle inline changes with auto-save debounce
  const handleInlineChange = (
    itemId: string,
    field: keyof SKPItem,
    value: string | number
  ) => {
    setItems((prevItems) => {
      const updated = prevItems.map((it) => {
        if (it.id !== itemId) return it

        const itemUpdated = { ...it, [field]: value }

        if (
          field === 'rencanaAwal' ||
          field === 'perubahanTengah' ||
          field === 'realisasi'
        ) {
          const ra = field === 'rencanaAwal' ? Number(value) : it.rencanaAwal
          const pt = field === 'perubahanTengah' ? Number(value) : it.perubahanTengah
          const rel = field === 'realisasi' ? Number(value) : it.realisasi
          itemUpdated.kualitasMutu = calculateMutu(ra, pt, rel)
          itemUpdated.nilaiCapaian = itemUpdated.kualitasMutu
        }

        return itemUpdated
      })

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      setIsSaving(true)
      saveTimeoutRef.current = setTimeout(() => {
        const newTotalRencana = updated.reduce(
          (acc, curr) => acc + Number(curr.rencanaAwal || 0),
          0
        )
        const newTotalRealisasi = updated.reduce(
          (acc, curr) => acc + Number(curr.realisasi || 0),
          0
        )
        const itemsWithTarget = updated.filter(
          (it) => Number(it.perubahanTengah || it.rencanaAwal) > 0
        )
        const newMutu =
          itemsWithTarget.length > 0
            ? Number(
                (
                  itemsWithTarget.reduce(
                    (acc, curr) => acc + (Number(curr.kualitasMutu) || 0),
                    0
                  ) / itemsWithTarget.length
                ).toFixed(2)
              )
            : 0
        const newPersen =
          newTotalRencana > 0
            ? Number(((newTotalRealisasi / newTotalRencana) * 100).toFixed(1))
            : 0

        const updatedSKP: PengajuanSKP = {
          ...activeSKP,
          semester: selectedSemester,
          tahunAkademik: selectedTahun,
          items: updated,
          totalSksRencana: newTotalRencana,
          totalSksRealisasi: newTotalRealisasi,
          persentaseCapaian: newPersen,
          nilaiKinerjaSKP: newMutu,
        }
        onUpdateSKP(updatedSKP)
        setIsSaving(false)
      }, 700)

      return updated
    })
  }

  // Deteksi keberadaan dan hak akses Google Drive
  const handleDetectDriveLink = async (itemId: string, url: string) => {
    if (!url || !url.trim()) {
      onShowToast('Silakan masukkan tautan Google Drive / dokumen bukti terlebih dahulu!')
      return
    }

    setDriveCheckState((prev) => ({
      ...prev,
      [itemId]: { loading: true },
    }))

    try {
      const res = await api.skp.checkDriveLink(url)
      setDriveCheckState((prev) => ({
        ...prev,
        [itemId]: { loading: false, result: res },
      }))

      if (res.status === 'public') {
        onShowToast('✅ Tautan Google Drive publik & siap diverifikasi penilai!')
      } else if (res.status === 'restricted') {
        onShowToast('⚠️ Tautan Google Drive memerlukan izin akses (Belum publik)!')
      } else if (res.status === 'not_found') {
        onShowToast('❌ File atau folder Google Drive tidak ditemukan (Error 404)!')
      } else {
        onShowToast(`ℹ️ ${res.message}`)
      }
    } catch {
      // Heuristic fallback offline
      const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com')
      const fallbackResult: DriveLinkCheckResult = {
        status: isDrive ? 'warning' : 'external_link',
        is_google_drive: isDrive,
        message: isDrive
          ? 'Format Google Drive valid. Pastikan setelan akses sudah "Siapa saja yang memiliki link".'
          : 'Tautan eksternal terdeteksi. Pastikan dapat diakses oleh tim penilai.',
      }
      setDriveCheckState((prev) => ({
        ...prev,
        [itemId]: { loading: false, result: fallbackResult },
      }))
      onShowToast(fallbackResult.message)
    }
  }

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    const newTotalRencana = items.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
    const newTotalRealisasi = items.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)
    const itemsWithTarget = items.filter((it) => Number(it.perubahanTengah || it.rencanaAwal) > 0)
    const newMutu =
      itemsWithTarget.length > 0
        ? Number(
            (
              itemsWithTarget.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
              itemsWithTarget.length
            ).toFixed(2)
          )
        : 0
    const newPersen =
      newTotalRencana > 0 ? Number(((newTotalRealisasi / newTotalRencana) * 100).toFixed(1)) : 0

    const updatedSKP: PengajuanSKP = {
      ...activeSKP,
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      items,
      totalSksRencana: newTotalRencana,
      totalSksRealisasi: newTotalRealisasi,
      persentaseCapaian: newPersen,
      nilaiKinerjaSKP: newMutu,
    }
    onUpdateSKP(updatedSKP)
    setIsSaving(false)
    onShowToast('Perubahan target dan realisasi SKP berhasil disimpan!')
  }

  const handleAutoFillDummySKP = () => {
    const updated = items.map((it) => {
      let target = 1
      if (it.kategori === 'Pendidikan') target = 12
      else if (it.kategori === 'Penelitian') target = 1
      else if (it.kategori === 'Pengabdian') target = 1
      else target = 2

      return {
        ...it,
        rencanaAwal: target,
        perubahanTengah: target,
        realisasi: target,
        kualitasMutu: 100,
        nilaiCapaian: 100,
        linkDokumen: 'https://drive.google.com/drive/folders/1X-t1bc3XUhsPcqlze26TeUunpiQsKRIx',
      }
    })
    setItems(updated)
    const newTotalRencana = updated.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
    const newTotalRealisasi = updated.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)
    const updatedSKP: PengajuanSKP = {
      ...activeSKP,
      semester: selectedSemester,
      tahunAkademik: selectedTahun,
      items: updated,
      totalSksRencana: newTotalRencana,
      totalSksRealisasi: newTotalRealisasi,
      persentaseCapaian: 100,
      nilaiKinerjaSKP: 100,
    }
    onUpdateSKP(updatedSKP)
    onShowToast('Data target, realisasi & tautan bukti SKP berhasil diisi otomatis!')
  }

  // Summary Metrics Calculation
  const totalRencana = items.reduce((acc, curr) => acc + Number(curr.rencanaAwal || 0), 0)
  const totalRealisasi = items.reduce((acc, curr) => acc + Number(curr.realisasi || 0), 0)

  const itemsWithTarget = items.filter(
    (it) => Number(it.perubahanTengah || it.rencanaAwal) > 0
  )
  const totalMutuRataRata =
    itemsWithTarget.length > 0
      ? (
          itemsWithTarget.reduce((acc, curr) => acc + (Number(curr.kualitasMutu) || 0), 0) /
          itemsWithTarget.length
        ).toFixed(2)
      : '0.00'

  const persenCapaian =
    totalRencana > 0 ? ((totalRealisasi / totalRencana) * 100).toFixed(1) : '0.0'

  // Filter items by matching position, category, and search dengan proteksi null-safe
  const filteredItems = items
    .filter(isItemMatchingPosition)
    .filter((it) => {
      const matchKategori = selectedKategori === 'Semua' || it.kategori === selectedKategori
      const q = (searchQuery || '').trim().toLowerCase()
      if (!q) return matchKategori

      const kegiatanStr = (it.kegiatan || (it as unknown as { namaKegiatan?: string })?.namaKegiatan || '').toLowerCase()
      const kodeStr = (it.kode || '').toLowerCase()
      const kategoriStr = (it.kategori || '').toLowerCase()
      const satuanStr = (it.satuan || '').toLowerCase()

      const matchSearch =
        kegiatanStr.includes(q) ||
        kodeStr.includes(q) ||
        kategoriStr.includes(q) ||
        satuanStr.includes(q)

      return matchKategori && matchSearch
    })

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(
    containerRef,
    '.custom-table tbody tr',
    [selectedSemester, selectedTahun, selectedKategori],
    { y: 6, stagger: 0.02 }
  )

  const kategoriList = [
    'Semua',
    ...Array.from(new Set(komponenList.map((k) => k.kategori).filter(Boolean))),
  ]

  return (
    <div className="page-container" ref={containerRef}>
      {/* =========================================================================
          REDESIGNED HEADER SECTION: Clean Academic Context & Profile
         ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f223d 0%, #1e3a8a 100%)',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', padding: '4px 12px', borderRadius: 999, fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: 10, backdropFilter: 'blur(4px)' }}>
                <Award size={13} color="#fde68a" />
                <span>SPMI &bull; PermenPAN-RB No. 6/2022</span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {lecturerJabatanStruktural !== 'Dosen'
                  ? `Sasaran Kinerja Pegawai (SKP) ${lecturerJabatanStruktural}`
                  : 'Sasaran Kinerja Pegawai (SKP) Dosen'}
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#cbd5e1', maxWidth: 760, lineHeight: 1.5 }}>
                {isDekan
                  ? 'Komponen tugas jabatan Dekan Fakultas & Tridharma. Berkas SKP Dekan dinilai dan disahkan oleh Ketua Program Studi homebase.'
                  : isKaprodi
                  ? 'Komponen tugas jabatan Ka.Prodi & Tridharma. Berkas SKP direview, dinilai, dan disahkan dengan tanda tangan digital oleh Dekan Fakultas.'
                  : isSDM
                  ? 'Komponen SKP tugas administrasi & tata kelola SDM. Berkas SKP dinilai dan disahkan oleh pimpinan program studi.'
                  : 'Rencana kerja dan realisasi Tridharma Dosen. Input rencana target awal, capaian realisasi, dan tautan Google Drive bukti fisik secara langsung pada tabel.'}
              </p>
            </div>

            {/* Profile Pill */}
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: 'var(--r-lg)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffffff', color: '#0f223d', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '14px' }}>
                {user?.avatar || 'DS'}
              </div>
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{targetDosenNama}</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '1px solid rgba(147, 197, 253, 0.4)',
                      color: '#93c5fd',
                      fontWeight: 600,
                    }}
                  >
                    🏛️ {lecturerJabatanStruktural}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: 2 }}>
                  NIP: {targetDosenNip || '-'} &bull; {targetDosenProdi}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER PERIODE & AKSI UTAMA (Semester & Tahun Ajaran)
         ========================================================================= */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '16px 20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--navy-900)', fontWeight: 700, fontSize: '13.5px' }}>
            <Filter size={17} color="var(--brand-600)" />
            <span>Periode Pelaporan</span>
          </div>

          <div style={{ width: 1, height: 26, background: 'var(--hair)' }} />

          {/* Dropdown Tahun Ajaran */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>Tahun Ajaran:</span>
            <select
              className="custom-select"
              style={{
                height: 38,
                minWidth: 155,
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
                border: '1px solid var(--hair-strong)',
                boxShadow: 'var(--shadow-xs)',
                color: 'var(--ink)',
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

          {/* Toggle Semester */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Semester:</span>
            <div style={{ display: 'inline-flex', gap: 4, background: 'var(--panel-hover)', padding: 3, borderRadius: 'var(--r-md)', border: '1px solid var(--hair)' }}>
              <button
                type="button"
                onClick={() => setSelectedSemester('Ganjil')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedSemester === 'Ganjil' ? 'var(--navy-900)' : 'transparent',
                  color: selectedSemester === 'Ganjil' ? '#ffffff' : 'var(--muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--ease)',
                }}
              >
                Semester Ganjil
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('Genap')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: selectedSemester === 'Genap' ? 'var(--navy-900)' : 'transparent',
                  color: selectedSemester === 'Genap' ? '#ffffff' : 'var(--muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--ease)',
                }}
              >
                Semester Genap
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Action: Isi Dummy SKP */}
          <button
            type="button"
            onClick={handleAutoFillDummySKP}
            className="brand-btn"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              borderRadius: 'var(--r-md)',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
            title="Isi target, realisasi & tautan bukti otomatis"
          >
            <Sparkles size={13} className="text-amber-600 animate-pulse" />
            <span>⚡ Isi Contoh Cepat</span>
          </button>

          {/* Action: Simpan Draft */}
          <button
            type="button"
            onClick={handleManualSave}
            className="brand-btn brand-btn--outline"
            style={{ padding: '7px 14px', fontSize: '12px', borderRadius: 'var(--r-md)', background: '#ffffff' }}
            title="Simpan draft SKP ke sistem"
          >
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
          </button>

          {/* Action: Cetak Formulir SKP (Membuka tab baru _blank dengan layout formal - Hanya jika sudah disetujui) */}
          {(() => {
            const isApproved = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi'].includes(activeSKP.status)
            return (
              <button
                type="button"
                onClick={() => {
                  if (!isApproved) {
                    onShowToast?.('Formulir SKP belum dapat dicetak karena belum diverifikasi & disetujui oleh pimpinan.')
                    return
                  }
                  openPrintSKP(activeSKP, user?.signatureUrl || matchedDosenFromList?.signatureUrl)
                }}
                disabled={!isApproved}
                className="brand-btn brand-btn--outline"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  borderRadius: 'var(--r-md)',
                  background: '#ffffff',
                  opacity: isApproved ? 1 : 0.5,
                  cursor: isApproved ? 'pointer' : 'not-allowed',
                }}
                title={isApproved ? 'Cetak Formulir Standar SKP Resmi di Tab Baru' : 'SKP belum dapat dicetak (menunggu persetujuan pimpinan)'}
              >
                <Printer size={13} />
                <span>Cetak SKP</span>
              </button>
            )
          })()}

          {/* Action: Submit / Ajukan SKP ke Atasan */}
          {(activeSKP.status === 'Draft' || activeSKP.status === 'Perlu Revisi' || !activeSKP.status) && (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="brand-btn btn-action-add"
              style={{ padding: '7px 16px', fontSize: '12px', borderRadius: 'var(--r-md)' }}
            >
              <Send size={13} />
              <span>{isKaprodi ? 'Ajukan ke Dekan' : 'Ajukan ke Kaprodi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          REDESIGNED STATS CARDS: 4 Modern Summary Metrics
         ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Card 1: Total Komponen */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', padding: '16px 18px', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Total Kegiatan SKP</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginTop: 8 }}>
            {items.length} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>Butir</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 4 }}>
            4 Bidang Tridharma &amp; Penunjang
          </div>
        </div>

        {/* Card 2: Rencana vs Realisasi Volume */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', padding: '16px 18px', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Target vs Realisasi</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-700)' }}>{totalRealisasi}</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>dari target {totalRencana}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--panel-hover)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Number(persenCapaian))}%`,
                  background: Number(persenCapaian) >= 100 ? '#059669' : 'var(--brand-600)',
                  borderRadius: 999,
                }}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: Number(persenCapaian) >= 100 ? '#059669' : 'var(--brand-600)' }}>
              {persenCapaian}%
            </span>
          </div>
        </div>

        {/* Card 3: Rata-Rata Mutu Capaian */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', padding: '16px 18px', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Rata-rata Mutu (%)</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center' }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-600)', marginTop: 8 }}>
            {totalMutuRataRata}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 4 }}>
            Formula Kualitatif SPMI UBK
          </div>
        </div>

        {/* Card 4: Status Approval & Penilai */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', padding: '16px 18px', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Status &amp; Persetujuan</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', color: '#475569', display: 'grid', placeItems: 'center' }}>
              <FileCheck size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            {(() => {
              const isSah = ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Dekan', 'Dinilai Kaprodi'].includes(activeSKP.status)
              return (
                <span
                  className={`badge-pill ${
                    isSah
                      ? 'badge-pill--green'
                      : activeSKP.status === 'Perlu Revisi'
                      ? 'badge-pill--red'
                      : 'badge-pill--orange'
                  }`}
                  style={{ fontSize: '12px', fontWeight: 700 }}
                >
                  {isSah ? 'Sah & Terbit' : activeSKP.status === 'Perlu Revisi' ? 'Perlu Revisi / Dibatalkan' : activeSKP.status}
                </span>
              )
            })()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Disetujui Oleh: <strong>{activeSKP.penilaiNama || activeSKP.penilaiJabatan || 'Pimpinan'}</strong>
          </div>
        </div>
      </div>

      {/* Banner Notifikasi Revisi Khusus jika Dibatalkan oleh SDM / Penilai */}
      {activeSKP.status === 'Perlu Revisi' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--r-lg)',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ffe4e6', color: '#e11d48', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FileCheck size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#9f1239' }}>
              Penerbitan SKP Memerlukan Perbaikan / Dibatalkan
            </div>
            <div style={{ fontSize: '13px', color: '#be123c', marginTop: 4, lineHeight: 1.5 }}>
              Catatan Revisi: "{activeSKP.catatanSDM || activeSKP.catatanKaprodi || activeSKP.catatanDekan || 'Silakan lengkapi atau perbaiki bukti fisik dokumen luaran tridharma Anda.'}"
            </div>
            <div style={{ fontSize: '12px', color: '#881337', marginTop: 6 }}>
              Silakan sesuaikan item kegiatan atau tautan dokumen bukti di tabel bawah, lalu klik tombol <strong>Ajukan SKP Sekarang</strong> untuk mengajukan ulang.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMBO BOX FILTER KATEGORI TRIDHARMA & LIVE SEARCH (DI ATAS TABEL)
         ========================================================================= */}
      <div
        style={{
          background: 'var(--card)',
          padding: '14px 20px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Combo Box Filter Kategori */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label
              htmlFor="filter-kategori-skp"
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Filter size={15} color="var(--brand-600)" />
              <span>Filter Kategori:</span>
            </label>
            <select
              id="filter-kategori-skp"
              className="custom-select"
              style={{
                height: 38,
                minWidth: 260,
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '6px 34px 6px 12px',
                borderRadius: 'var(--r-md)',
                background: '#ffffff',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
            >
              {kategoriList.map((kat, idx) => {
                const count = kat === 'Semua' ? items.length : items.filter((it) => it.kategori === kat).length
                return (
                  <option key={idx} value={kat}>
                    {kat === 'Semua' ? '🌟 Semua Kategori Tridharma' : kat} ({count} kegiatan)
                  </option>
                )
              })}
            </select>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>Menampilkan <strong>{filteredItems.length}</strong> dari {items.length} kegiatan</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--brand-700)',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '2px 8px',
                borderRadius: 'var(--r-sm)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ↔ Geser tabel ke samping untuk isi Link Dokumen Bukti
            </span>
          </div>
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
            }}
          />
          <input
            type="text"
            className="custom-input"
            style={{
              height: 38,
              paddingLeft: 32,
              paddingRight: searchQuery ? 30 : 12,
              fontSize: '12.5px',
              borderRadius: 'var(--r-md)',
              background: '#ffffff',
            }}
            placeholder="Cari butir kegiatan SKP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TABEL SKP (DIPERTAHANKAN STRUKTUR & FUNGSI SESUAI PERMINTAAN USER)
          + TOMBOL DETEKSI LINK GOOGLE DRIVE DI KOLOM TAUTAN DOKUMEN
         ========================================================================= */}
      <div
        className="table-container"
        style={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table className="custom-table custom-table--sticky-skp-self" style={{ minWidth: 1240, width: '100%' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: 44, textAlign: 'center' }}>
                NO
              </th>
              <th rowSpan={2} style={{ width: 80, textAlign: 'center' }}>
                KODE
              </th>
              <th rowSpan={2} style={{ minWidth: 260 }}>
                RENCANA KINERJA / KEGIATAN TUGAS JABATAN
              </th>
              <th rowSpan={2} style={{ width: 70, textAlign: 'center' }}>
                SATUAN
              </th>
              <th colSpan={3} style={{ textAlign: 'center', background: 'var(--navy-900)', color: '#ffffff' }}>
                TARGET KUANTITAS / VOLUME
              </th>
              <th rowSpan={2} style={{ width: 90, textAlign: 'center' }}>
                KUAL / MUTU (%)
              </th>
              <th rowSpan={2} style={{ width: 80, textAlign: 'center' }}>
                WAKTU
              </th>
              <th rowSpan={2} style={{ minWidth: 300 }}>
                TAUTAN DOKUMEN BUKTI FISIK &amp; DETEKSI AKSES
              </th>
            </tr>
            <tr>
              <th style={{ width: 85, textAlign: 'center', fontSize: '11px' }}>
                RENCANA AWAL
              </th>
              <th style={{ width: 85, textAlign: 'center', fontSize: '11px' }}>
                PERUBAHAN TENGAH
              </th>
              <th style={{ width: 85, textAlign: 'center', fontSize: '11px', background: 'var(--brand-700)', color: '#ffffff' }}>
                REALISASI AKHIR
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                  Tidak ada data kegiatan yang cocok dengan filter atau pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: 'var(--brand-700)' }}>
                    {it.kode || `KMP-${idx + 1}`}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '12.5px', lineHeight: 1.4 }}>
                      {it.kegiatan}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {it.kategori && (
                        <span
                          className={`badge-pill ${
                            it.kategori === 'Pendidikan'
                              ? 'badge-pill--blue'
                              : it.kategori === 'Penelitian'
                              ? 'badge-pill--purple'
                              : it.kategori === 'Pengabdian'
                              ? 'badge-pill--green'
                              : 'badge-pill--gray'
                          }`}
                          style={{ fontSize: '10px', padding: '1px 6px' }}
                        >
                          {it.kategori}
                        </span>
                      )}
                      {(() => {
                        const comp = komponenById.get(it.komponenId) || (it.kode ? komponenById.get(it.kode) : undefined)
                        const target = comp?.targetJabatan
                        if (!target || target === 'Semua Jabatan' || target === 'Dosen' || target === 'Dosen Tetap') return null
                        return (
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontWeight: 600,
                            }}
                          >
                            🏛️ Tugas: {target}
                          </span>
                        )
                      })()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)', fontSize: '12px' }}>
                    {it.satuan}
                  </td>

                  {/* Inline Input 1: Rencana Awal */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      className="table-inline-input"
                      value={it.rencanaAwal === 0 ? '' : it.rencanaAwal}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleInlineChange(it.id, 'rencanaAwal', e.target.value)}
                    />
                  </td>

                  {/* Inline Input 2: Perubahan Tengah */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      className="table-inline-input"
                      value={it.perubahanTengah === 0 ? '' : it.perubahanTengah}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleInlineChange(it.id, 'perubahanTengah', e.target.value)}
                    />
                  </td>

                  {/* Inline Input 3: Realisasi Akhir */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      className="table-inline-input table-inline-input--highlight"
                      value={it.realisasi === 0 ? '' : it.realisasi}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleInlineChange(it.id, 'realisasi', e.target.value)}
                    />
                  </td>

                  {/* Terhitung Otomatis: Kual / Mutu (%) */}
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '12.5px',
                        color:
                          it.kualitasMutu >= 90
                            ? 'var(--status-success-ink)'
                            : it.kualitasMutu > 0
                            ? 'var(--brand-700)'
                            : 'var(--muted)',
                      }}
                    >
                      {it.kualitasMutu}%
                    </span>
                  </td>

                  {/* Waktu Baku */}
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                    {it.waktuNilai || 6} {it.waktuSatuan || 'bln'}
                  </td>

                  {/* Inline Input 4: Tautan Dokumen Bukti Fisik + Deteksi Link Google Drive */}
                  <td style={{ minWidth: 300 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          className="custom-input"
                          style={{
                            height: 34,
                            fontSize: '12px',
                            flex: 1,
                            padding: '4px 10px',
                            minWidth: 160,
                          }}
                          value={it.linkDokumen || ''}
                          onChange={(e) => handleInlineChange(it.id, 'linkDokumen', e.target.value)}
                        />

                        {/* Tombol Deteksi Akses Google Drive */}
                        <button
                          type="button"
                          onClick={() => handleDetectDriveLink(it.id, it.linkDokumen)}
                          disabled={driveCheckState[it.id]?.loading}
                          className="brand-btn"
                          style={{
                            flexShrink: 0,
                            height: 32,
                            padding: '0 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: 'var(--r-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: driveCheckState[it.id]?.result?.status === 'public'
                              ? '#ecfdf5'
                              : driveCheckState[it.id]?.result?.status === 'restricted'
                              ? '#fffbeb'
                              : driveCheckState[it.id]?.result?.status === 'not_found'
                              ? '#fef2f2'
                              : 'var(--panel-hover)',
                            color: driveCheckState[it.id]?.result?.status === 'public'
                              ? '#047857'
                              : driveCheckState[it.id]?.result?.status === 'restricted'
                              ? '#b45309'
                              : driveCheckState[it.id]?.result?.status === 'not_found'
                              ? '#b91c1c'
                              : 'var(--navy-900)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}
                          title="Periksa keberadaan dan status akses publik tautan Google Drive"
                        >
                          {driveCheckState[it.id]?.loading ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : driveCheckState[it.id]?.result?.status === 'public' ? (
                            <CheckCircle2 size={12} color="#059669" />
                          ) : driveCheckState[it.id]?.result?.status === 'restricted' ? (
                            <AlertTriangle size={12} color="#d97706" />
                          ) : driveCheckState[it.id]?.result?.status === 'not_found' ? (
                            <XCircle size={12} color="#dc2626" />
                          ) : (
                            <Sparkles size={12} color="var(--brand-600)" />
                          )}
                          <span>{driveCheckState[it.id]?.loading ? 'Cek...' : 'Deteksi'}</span>
                        </button>

                        {/* Tombol Buka Link Langsung */}
                        {it.linkDokumen && (
                          <a
                            href={sanitizeUrl(it.linkDokumen)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-action-btn"
                            style={{ flexShrink: 0, width: 30, height: 30, display: 'grid', placeItems: 'center' }}
                            title="Buka Tautan Dokumen Bukti di Tab Baru"
                          >
                            <ExternalLink size={13} color="var(--brand-600)" />
                          </a>
                        )}
                      </div>

                      {/* Badge Hasil Deteksi Google Drive */}
                      {driveCheckState[it.id]?.result && (
                        <div
                          style={{
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 6px',
                            borderRadius: 4,
                            lineHeight: 1.3,
                            background:
                              driveCheckState[it.id]?.result?.status === 'public'
                                ? '#ecfdf5'
                                : driveCheckState[it.id]?.result?.status === 'restricted'
                                ? '#fffbeb'
                                : driveCheckState[it.id]?.result?.status === 'not_found'
                                ? '#fef2f2'
                                : '#f8fafc',
                            color:
                              driveCheckState[it.id]?.result?.status === 'public'
                                ? '#065f46'
                                : driveCheckState[it.id]?.result?.status === 'restricted'
                                ? '#92400e'
                                : driveCheckState[it.id]?.result?.status === 'not_found'
                                ? '#991b1b'
                                : '#334155',
                            border: `1px solid ${
                              driveCheckState[it.id]?.result?.status === 'public'
                                ? '#a7f3d0'
                                : driveCheckState[it.id]?.result?.status === 'restricted'
                                ? '#fde68a'
                                : driveCheckState[it.id]?.result?.status === 'not_found'
                                ? '#fecaca'
                                : '#e2e8f0'
                            }`,
                          }}
                        >
                          {driveCheckState[it.id]?.result?.status === 'public' ? (
                            <>
                              <CheckCircle2 size={11} color="#059669" />
                              <span><strong>Akses Publik Terbuka:</strong> Berkas dapat diakses &amp; diverifikasi</span>
                            </>
                          ) : driveCheckState[it.id]?.result?.status === 'restricted' ? (
                            <>
                              <AlertTriangle size={11} color="#d97706" />
                              <span><strong>Akses Dibatasi:</strong> Perlu izin (Ubah ke &quot;Siapa saja yang memiliki link&quot;)</span>
                            </>
                          ) : driveCheckState[it.id]?.result?.status === 'not_found' ? (
                            <>
                              <XCircle size={11} color="#dc2626" />
                              <span><strong>Tidak Ditemukan:</strong> Periksa kembali link (Error 404)</span>
                            </>
                          ) : (
                            <>
                              <Globe size={11} color="#475569" />
                              <span>{driveCheckState[it.id]?.result?.message}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cetak Formulir SKP */}
      {isPrintModalOpen && (
        <FormulirCetakSKP
          isOpen={isPrintModalOpen}
          skp={activeSKP}
          dosenSignatureUrl={user?.signatureUrl || matchedDosenFromList?.signatureUrl}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Modal Konfirmasi Submit SKP */}
      {showSubmitConfirm && (
        <ConfirmDialog
          isOpen={showSubmitConfirm}
          title="Konfirmasi Pengajuan SKP"
          message={`Apakah Anda yakin ingin mengajukan berkas SKP Semester ${selectedSemester} Tahun Ajaran ${selectedTahun} ke ${
            isKaprodi ? 'Dekan Fakultas' : 'Ketua Program Studi'
          } untuk diperiksa dan diverifikasi?`}
          confirmText="Ya, Ajukan SKP"
          cancelText="Batal"
          onConfirm={() => {
            if (onSubmitSKP) {
              onSubmitSKP(activeSKP.id)
            } else {
              onUpdateSKP({ ...activeSKP, status: 'Diajukan' })
              onShowToast('SKP berhasil diajukan ke atasan untuk dinilai!')
            }
            setShowSubmitConfirm(false)
          }}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  )
}
