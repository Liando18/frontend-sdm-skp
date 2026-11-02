import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Role, UserSession, Dosen, KomponenSKP, PengajuanSKP, IndikatorKuesioner, PenilaianKuesioner, NotificationItem, ProgramStudi, JabatanKampus, Fakultas, Psdku } from './types'
import { useViewTransition } from './utils/animations'
import { api } from './services/api'
import { DEMO_USERS } from './constants/demoUsers'
import { useToast } from './context/ToastContext'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { Toast } from './components/Toast'
import { LoginView } from './views/LoginView'

const DashboardSDM = React.lazy(() => import('./views/DashboardSDM').then(m => ({ default: m.DashboardSDM })))
const KelolaDataDosen = React.lazy(() => import('./views/KelolaDataDosen').then(m => ({ default: m.KelolaDataDosen })))
const KelolaKomponenSKP = React.lazy(() => import('./views/KelolaKomponenSKP').then(m => ({ default: m.KelolaKomponenSKP })))
const KelolaSKPDosen = React.lazy(() => import('./views/KelolaSKPDosen').then(m => ({ default: m.KelolaSKPDosen })))
const KelolaIndikatorKuesioner = React.lazy(() => import('./views/KelolaIndikatorKuesioner').then(m => ({ default: m.KelolaIndikatorKuesioner })))
const KelolaPenilaianKuesioner = React.lazy(() => import('./views/KelolaPenilaianKuesioner').then(m => ({ default: m.KelolaPenilaianKuesioner })))
const LaporanView = React.lazy(() => import('./views/LaporanView').then(m => ({ default: m.LaporanView })))
const DashboardDosen = React.lazy(() => import('./views/DashboardDosen').then(m => ({ default: m.DashboardDosen })))
const KelolaSKPDosenSelf = React.lazy(() => import('./views/KelolaSKPDosenSelf').then(m => ({ default: m.KelolaSKPDosenSelf })))
const DashboardKaprodi = React.lazy(() => import('./views/DashboardKaprodi').then(m => ({ default: m.DashboardKaprodi })))
const ReviewSKPKaprodi = React.lazy(() => import('./views/ReviewSKPKaprodi').then(m => ({ default: m.ReviewSKPKaprodi })))
const KelolaKuesionerKaprodi = React.lazy(() => import('./views/KelolaKuesionerKaprodi').then(m => ({ default: m.KelolaKuesionerKaprodi })))
const DashboardDekan = React.lazy(() => import('./views/DashboardDekan').then(m => ({ default: m.DashboardDekan })))
const ReviewSKPDekan = React.lazy(() => import('./views/ReviewSKPDekan').then(m => ({ default: m.ReviewSKPDekan })))
const CekHasilKuesionerDekan = React.lazy(() => import('./views/CekHasilKuesionerDekan').then(m => ({ default: m.CekHasilKuesionerDekan })))
const HasilKinerjaTahunanSelf = React.lazy(() => import('./views/HasilKinerjaTahunanSelf').then(m => ({ default: m.HasilKinerjaTahunanSelf })))
const ProfilView = React.lazy(() => import('./views/ProfilView').then(m => ({ default: m.ProfilView })))
const CetakSKPStandaloneView = React.lazy(() => import('./views/CetakSKPStandaloneView').then(m => ({ default: m.CetakSKPStandaloneView })))
const CetakOutputFinalStandaloneView = React.lazy(() => import('./views/CetakOutputFinalStandaloneView').then(m => ({ default: m.CetakOutputFinalStandaloneView })))
const CetakTranskripStandaloneView = React.lazy(() => import('./views/CetakTranskripStandaloneView').then(m => ({ default: m.CetakTranskripStandaloneView })))
const CetakPanduanStandaloneView = React.lazy(() => import('./views/CetakPanduanStandaloneView').then(m => ({ default: m.CetakPanduanStandaloneView })))
const PanduanView = React.lazy(() => import('./views/PanduanView').then(m => ({ default: m.PanduanView })))
import { HelpModal } from './components/HelpModal'
import { DashboardSkeleton } from './components/Skeleton'
import { AlertTriangle } from 'lucide-react'
import { getNavIdFromPath, getPathFromNavId, ROUTE_ALIASES } from './utils/routes'
import { deriveRealNotifications } from './utils/notifications'
import { fetchOfficialRektor } from './utils/rektorData'
import {
  getStoredAuthToken,
  getStoredUserSession,
  getStoredCurrentRole,
  saveUserSession,
  clearAuthData,
  onUnauthorized,
} from './utils/authStorage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const token = getStoredAuthToken()
    const savedSession = getStoredUserSession()
    return Boolean(token && savedSession)
  })

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'sdm'
    const savedSession = getStoredUserSession()
    if (savedSession?.role && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(savedSession.role)) {
      return savedSession.role
    }
    const saved = getStoredCurrentRole()
    if (saved && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(saved)) {
      return saved
    }
    return 'sdm'
  })

  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    if (typeof window === 'undefined') return DEMO_USERS['sdm']
    const savedSession = getStoredUserSession()
    if (savedSession?.name && savedSession?.role) return savedSession
    const savedRole = getStoredCurrentRole() || 'sdm'
    return DEMO_USERS[savedRole] || DEMO_USERS['sdm']
  })

  const [activeNav, setActiveNav] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    return getNavIdFromPath(window.location.pathname, 'sdm')
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  useViewTransition(mainRef, [activeNav, currentRole])

  const { showToast } = useToast()

  const [dosenList, setDosenList] = useState<Dosen[]>([])
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([])
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([])
  const [psdkuList, setPsdkuList] = useState<Psdku[]>([])
  const [jabatanList, setJabatanList] = useState<JabatanKampus[]>([])
  const [komponenList, setKomponenList] = useState<KomponenSKP[]>([])
  const [skpList, setSkpList] = useState<PengajuanSKP[]>([])
  const [indikatorList, setIndikatorList] = useState<IndikatorKuesioner[]>([])
  const [penilaianList, setPenilaianList] = useState<PenilaianKuesioner[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [selectedSKPForReview, setSelectedSKPForReview] = useState<PengajuanSKP | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const isLoggingOutRef = useRef(false)
  const justLoggedInRef = useRef(false)

  const handleLogout = useCallback(async (isAutoExpired = false, customMsg?: string) => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      if (!isAutoExpired && getStoredAuthToken()) {
        await api.auth.logout().catch(() => {})
      }
    } finally {
      clearAuthData()
      setIsLoggedIn(false)
      setDosenList([])
      setSkpList([])
      setPenilaianList([])
      setKomponenList([])
      setIndikatorList([])
      setNotifications([])
      setCurrentUser(DEMO_USERS['sdm'])
      setCurrentRole('sdm')
      window.history.pushState({ nav: 'login' }, '', '/login')
      isLoggingOutRef.current = false

      if (!isAutoExpired) {
        showToast('Anda telah keluar dari sistem portal.', 'info')
      } else {
        showToast(customMsg || 'Sesi Anda telah berakhir, silakan masuk kembali.', 'warning')
      }
    }
  }, [showToast])

  // Tangkap sinyal 401 Unauthorized secara global dari interceptor API
  useEffect(() => {
    const unsubscribe = onUnauthorized((msg) => {
      if (!isLoggingOutRef.current) {
        handleLogout(true, msg)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [handleLogout])

  // URL state synchronization with clean paths (/dashboard, /akun/profil, /manajemen/dosen, etc.)
  const updateUrl = (nav: string) => {
    if (typeof window === 'undefined') return
    const targetPath = getPathFromNavId(nav, currentRole)
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ nav }, '', targetPath)
    }
  }

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname
      if (ROUTE_ALIASES[p]) {
        const canonical = ROUTE_ALIASES[p]
        window.history.replaceState({ nav: activeNav }, '', canonical)
      }
      const n = getNavIdFromPath(window.location.pathname, currentRole)
      setActiveNav(n)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentRole, activeNav])

  // Sync initial URL with authentication status and redirect legacy aliases
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isLoggedIn) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({ nav: 'login' }, '', '/login')
      }
    } else {
      const p = window.location.pathname
      if (p === '/login' || p === '/') {
        window.history.replaceState({ nav: 'dashboard' }, '', '/dashboard')
        setActiveNav('dashboard')
      } else {
        if (ROUTE_ALIASES[p]) {
          const canonical = ROUTE_ALIASES[p]
          window.history.replaceState({ nav: activeNav }, '', canonical)
        }
        const detected = getNavIdFromPath(window.location.pathname, currentRole)
        setActiveNav(detected)
      }
    }
  }, [isLoggedIn, currentRole])

  // Load data from Laravel 12 Backend API on mount & auth change
  useEffect(() => {
    let isMounted = true
    const initDataFromApi = async () => {
      try {
        const token = getStoredAuthToken()

        // Muat data dinamis Rektor resmi dari database ke cache pracetak
        fetchOfficialRektor().catch(() => null)

        // Jika tidak login / belum memiliki token, jangan menembak API master (cegah overfetching)
        if (!isLoggedIn || !token) {
          if (isMounted) {
            setBackendStatus('connected')
            setIsInitialLoading(false)
          }
          return
        }

        // Validasi Kredensial Pengguna:
        // Jika pengguna baru saja terverifikasi melalui handleLogin, gunakan data sesi yang valid tanpa panggilan API ganda.
        let meUser: UserSession | null = null
        if (justLoggedInRef.current && currentUser && currentUser.name) {
          justLoggedInRef.current = false
          meUser = currentUser
        } else {
          try {
            meUser = await api.auth.me()
          } catch {
            if (isMounted) {
              handleLogout(true, 'Sesi Anda telah berakhir, silakan masuk kembali.')
              setIsInitialLoading(false)
            }
            return
          }
        }

        if (!meUser || !meUser.name) {
          if (isMounted) {
            handleLogout(true, 'Sesi Anda telah berakhir, silakan masuk kembali.')
            setIsInitialLoading(false)
          }
          return
        }

        if (!isMounted) return

        setCurrentUser(meUser)
        if (meUser.role) setCurrentRole(meUser.role)
        saveUserSession(meUser, meUser.role)
        if (meUser.mustChangePassword) {
          setActiveNav('profil')
          updateUrl('profil')
        }
        setBackendStatus('connected')

        // Optimasi Skalabilitas (Pencegahan Boot Waterfall & SQLite I/O Congestion):
        // Fase 1: Muat Master Data Referensi Inti (hanya setelah terautentikasi resmi)
        const [prodiData, fakultasData, psdkuData, jabatanData] = await Promise.all([
          api.prodi.list().catch(() => null),
          api.fakultas.list().catch(() => null),
          api.psdku.list().catch(() => null),
          api.jabatan.list().catch(() => null),
        ])

        if (prodiData && Array.isArray(prodiData)) setProdiList(prodiData)
        if (fakultasData && Array.isArray(fakultasData)) setFakultasList(fakultasData)
        if (psdkuData && Array.isArray(psdkuData)) setPsdkuList(psdkuData)
        if (jabatanData && Array.isArray(jabatanData)) setJabatanList(jabatanData)

        // Tampilkan antarmuka segera setelah data inti siap (Immediate Perceived Responsiveness)
        setIsInitialLoading(false)

        // Fase 2: Muat Data Operasional Utama (SKP, Komponen, dan Notifikasi)
        const [komponenData, skpData, notifData] = await Promise.all([
          api.komponen.list().catch(() => null),
          api.skp.list().catch(() => null),
          api.notifications.list().catch(() => null),
        ])

        if (!isMounted) return

        if (komponenData && Array.isArray(komponenData)) setKomponenList(komponenData)
        if (skpData && Array.isArray(skpData)) setSkpList(skpData)
        if (notifData && Array.isArray(notifData)) setNotifications(notifData)

        // Fase 3: Hidrasi Latar Belakang Data Sekunder (Dosen, Indikator, dan Penilaian Kuesioner)
        const [dosenData, indikatorData, penilaianData] = await Promise.all([
          api.dosen.list().catch(() => null),
          api.indikator.list().catch(() => null),
          api.penilaian.list().catch(() => null),
        ])

        if (!isMounted) return

        if (dosenData && Array.isArray(dosenData)) {
          setDosenList(dosenData)
        }
        if (indikatorData && Array.isArray(indikatorData)) setIndikatorList(indikatorData)
        if (penilaianData && Array.isArray(penilaianData)) setPenilaianList(penilaianData)
      } catch {
        if (isMounted) setBackendStatus('offline')
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
        }
      }
    }

    initDataFromApi()
    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('ubk_read_notif_ids') || '[]')
    } catch {
      return []
    }
  })

  // Synchronize notifications per actor/role dynamically using real database & state data
  useEffect(() => {
    if (!isLoggedIn || !getStoredAuthToken()) return

    // 1. Immediately compute real notifications for zero latency & offline resilience
    const realNotifs = deriveRealNotifications(
      currentRole,
      currentUser,
      skpList,
      penilaianList,
      dosenList,
      readNotifIds
    )
    setNotifications(realNotifs)

    // 2. Fetch from backend API to ensure server-side data is in sync
    api.notifications
      .list({
        role: currentRole,
        nip: currentUser.nip,
        prodi: currentUser.prodi,
        nama: currentUser.name,
      })
      .then((serverNotifs) => {
        if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
          const merged = serverNotifs.map((sn) => ({
            ...sn,
            read: Boolean(sn.read || readNotifIds.includes(sn.id)),
          }))
          setNotifications(merged)
        }
      })
      .catch(() => {
        // Fallback to real notifications already computed
      })
  }, [isLoggedIn, currentRole, currentUser, skpList, penilaianList, dosenList, readNotifIds])

  const handleNavigate = (navId: string) => {
    setActiveNav(navId)
    updateUrl(navId)

    // Segarkan data SKP dari backend secara halus saat berpindah ke menu pemantauan / review
    if ([
      'review-skp-kaprodi',
      'review-skp-dekan',
      'monitoring-skp',
      'skp-dosen-self',
      'skp-kaprodi-self',
      'skp-dekan-self',
      'skp-sdm-self',
      'dashboard',
    ].includes(navId)) {
      api.skp.list().then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setSkpList(fresh)
        }
      }).catch(() => {})
    }
  }

  const handleLogin = async (
    role: Role,
    identifier: string,
    password?: string,
    rememberMe = true
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = (identifier || '').trim()
    const cleanPass = (password || '').trim()

    if (!cleanId || !cleanPass) {
      const msg = 'Silakan masukkan NIP atau Email dan kata sandi Anda.'
      showToast(msg, 'error')
      return { success: false, message: msg }
    }

    try {
      const isEmail = cleanId.includes('@')
      const payload = isEmail
        ? { email: cleanId, password: cleanPass }
        : { nip: cleanId, password: cleanPass }

      let res: { token: string; user: UserSession } | null = null
      try {
        res = await api.auth.login(payload, rememberMe)
      } catch (backendErr: any) {
        const errMsg = backendErr?.message || ''
        const userMsg = errMsg.includes('kredensial') || errMsg.includes('401') || errMsg.includes('tidak dikenali')
          ? 'Data yang Anda masukkan tidak dikenali. Silakan periksa kembali Email/NIP dan kata sandi Anda.'
          : (errMsg || 'Gagal terhubung ke server portal SDM.')
        showToast(userMsg, 'error')
        return { success: false, message: userMsg }
      }

      if (res?.user) {
        const loggedUser = res.user
        justLoggedInRef.current = true
        setCurrentUser(loggedUser)
        setCurrentRole(loggedUser.role)
        saveUserSession(loggedUser, loggedUser.role, rememberMe)
        if (loggedUser.mustChangePassword) {
          setActiveNav('profil')
          updateUrl('profil')
          showToast('Kewajiban Keamanan: Anda masuk menggunakan kata sandi awal institusi (NUPTK/NIP). Silakan perbarui kata sandi Anda sekarang.', 'warning')
        } else {
          setActiveNav('dashboard')
          updateUrl('dashboard')
          showToast(`Selamat datang di portal UBK, ${loggedUser.name}!`, 'success')
        }
        setIsLoggedIn(true)
        return { success: true }
      } else {
        const failMsg = 'Gagal masuk ke sistem. Periksa kembali NIP/Email dan kata sandi.'
        showToast(failMsg, 'error')
        return { success: false, message: failMsg }
      }
    } catch (err: any) {
      const errText = err?.message || 'Terjadi kesalahan saat memproses login. Silakan coba sesaat lagi.'
      showToast(errText, 'error')
      return { success: false, message: errText }
    }
  }

  const handleAddDosen = async (dosen: Dosen) => {
    try {
      const res = await api.dosen.create(dosen)
      const saved = res?.data || dosen
      setDosenList((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)])

      // Refresh list to immediately sync any auto-demoted holders of single positions
      const freshList = await api.dosen.list()
      if (Array.isArray(freshList)) {
        setDosenList(freshList)
      }

      showToast(`Dosen baru "${saved.nama}" berhasil disimpan ke basis data!`, 'success')
      return saved
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan data dosen: ${msg}`, 'error')
      throw err
    }
  }

  const handleUpdateDosen = async (updated: Dosen) => {
    try {
      const res = await api.dosen.update(updated.id, updated)
      const saved = res?.data || updated
      setDosenList((prev) => prev.map((d) => (d.id === updated.id ? saved : d)))

      // Refresh list to immediately sync any auto-demoted holders of single positions
      const freshList = await api.dosen.list()
      if (Array.isArray(freshList)) {
        setDosenList(freshList)
      }

      // Jika user yang sedang login adalah dosen ini, update sesi seketika
      if (currentUser && (currentUser.id === saved.id || currentUser.nip === saved.nip || currentUser.email === saved.email)) {
        let updatedRole: Role = currentUser.role
        const candidateRole = (updated as any).role || (updated as any).roleLogin
        if (candidateRole && ['sdm', 'kaprodi', 'dekan', 'dosen'].includes(candidateRole)) {
          updatedRole = candidateRole as Role
        } else if (saved.isKaprodi) {
          updatedRole = 'kaprodi'
        } else if (saved.isDekan) {
          updatedRole = 'dekan'
        } else if ((saved.jabatanStruktural || '').toLowerCase().includes('sdm')) {
          updatedRole = 'sdm'
        } else {
          updatedRole = 'dosen'
        }

        const freshUser: UserSession = {
          ...currentUser,
          name: saved.nama,
          jabatanStruktural: saved.jabatanStruktural,
          jabatanKampusId: saved.jabatanKampusId,
          role: updatedRole,
        }
        setCurrentUser(freshUser)
        setCurrentRole(updatedRole)
        saveUserSession(freshUser, updatedRole)
      }

      showToast(`Data dosen "${saved.nama}" berhasil diperbarui di basis data!`, 'success')
      return saved
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui data dosen: ${msg}`, 'error')
      throw err
    }
  }

  const handleDeleteDosen = async (id: string) => {
    try {
      await api.dosen.delete(id)
      setDosenList((prev) => prev.filter((d) => d.id !== id))
      showToast('Data dosen berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus data dosen: ${msg}`, 'error')
      throw err
    }
  }

  const prodiNames = prodiList.length > 0
    ? prodiList.map((p) => p.nama_lengkap || p.namaLengkap || (p.jenjang ? `${p.jenjang} ${p.nama}` : p.nama))
    : Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))

  const handleAddProdi = async (dataOrName: Partial<ProgramStudi> | string) => {
    try {
      const payload: Partial<ProgramStudi> = typeof dataOrName === 'string' ? { nama: dataOrName } : dataOrName
      const res = await api.prodi.create(payload)
      if (res?.data) {
        setProdiList((prev) => [...prev, res.data])
      }
      const label = payload.nama_lengkap || payload.namaLengkap || `${payload.jenjang || 'S1'} ${payload.nama}`
      showToast(`Program Studi "${label}" berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan program studi: ${msg}`, 'error')
    }
  }

  const handleUpdateProdi = async (idOrOldName: string, dataOrNewName: Partial<ProgramStudi> | string) => {
    try {
      const target = prodiList.find((p) => p.id === idOrOldName || p.nama === idOrOldName || p.nama_lengkap === idOrOldName)
      const targetId = target ? target.id : idOrOldName
      const payload: Partial<ProgramStudi> = typeof dataOrNewName === 'string' ? { nama: dataOrNewName } : dataOrNewName

      const res = await api.prodi.update(targetId, payload)
      const updated = (res as any)?.data || res
      if (updated && updated.id) {
        setProdiList((prev) => prev.map((p) => (p.id === targetId ? updated : p)))
      }
      showToast('Program Studi berhasil diperbarui!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui program studi: ${msg}`, 'error')
    }
  }

  const handleDeleteProdi = async (idOrName: string) => {
    try {
      const target = prodiList.find((p) => p.id === idOrName || p.nama === idOrName || p.nama_lengkap === idOrName)
      const targetId = target ? target.id : idOrName
      await api.prodi.delete(targetId)
      setProdiList((prev) => prev.filter((p) => p.id !== targetId))
      showToast('Program Studi berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus program studi: ${msg}`, 'error')
    }
  }

  const handleAddFakultas = async (data: Partial<Fakultas>) => {
    try {
      const res = await api.fakultas.create(data)
      if (res?.data) {
        setFakultasList((prev) => [...prev, res.data])
      }
      showToast(`Fakultas "${data.nama}" berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan fakultas: ${msg}`, 'error')
    }
  }

  const handleUpdateFakultas = async (id: string, data: Partial<Fakultas>) => {
    try {
      const res = await api.fakultas.update(id, data)
      if (res?.data) {
        setFakultasList((prev) => prev.map((f) => (f.id === id ? res.data : f)))
      }
      showToast(`Fakultas berhasil diperbarui!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui fakultas: ${msg}`, 'error')
    }
  }

  const handleDeleteFakultas = async (id: string) => {
    try {
      await api.fakultas.delete(id)
      setFakultasList((prev) => prev.filter((f) => f.id !== id))
      showToast('Fakultas berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus fakultas: ${msg}`, 'error')
    }
  }

  const handleAddPsdku = async (data: Partial<Psdku>) => {
    try {
      const res = await api.psdku.create(data)
      if (res?.data) {
        setPsdkuList((prev) => [...prev, res.data])
      }
      showToast(`PSDKU "${data.nama}" berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan PSDKU: ${msg}`, 'error')
    }
  }

  const handleUpdatePsdku = async (id: string, data: Partial<Psdku>) => {
    try {
      const res = await api.psdku.update(id, data)
      if (res?.data) {
        setPsdkuList((prev) => prev.map((p) => (p.id === id ? res.data : p)))
      }
      showToast(`PSDKU berhasil diperbarui!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui PSDKU: ${msg}`, 'error')
    }
  }

  const handleDeletePsdku = async (id: string) => {
    try {
      await api.psdku.delete(id)
      setPsdkuList((prev) => prev.filter((p) => p.id !== id))
      showToast('PSDKU berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus PSDKU: ${msg}`, 'error')
    }
  }

  const handleAddJabatan = async (data: Partial<JabatanKampus>) => {
    try {
      const res = await api.jabatan.create(data)
      if (res?.data) {
        setJabatanList((prev) => [...prev, res.data])
      }
      showToast(`Jabatan kampus "${data.nama}" berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan jabatan kampus: ${msg}`, 'error')
    }
  }

  const handleUpdateJabatan = async (id: string, data: Partial<JabatanKampus>) => {
    try {
      const res = await api.jabatan.update(id, data)
      if (res?.data) {
        setJabatanList((prev) => prev.map((j) => (j.id === id ? res.data : j)))
      }
      showToast(`Jabatan kampus berhasil diperbarui!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui jabatan kampus: ${msg}`, 'error')
    }
  }

  const handleDeleteJabatan = async (id: string) => {
    try {
      await api.jabatan.delete(id)
      setJabatanList((prev) => prev.filter((j) => j.id !== id))
      showToast('Jabatan kampus berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus jabatan kampus: ${msg}`, 'error')
    }
  }

  const handleAddKomponen = async (item: KomponenSKP) => {
    try {
      const res = await api.komponen.create(item)
      const created = res?.data || item
      setKomponenList((prev) => [created, ...prev.filter((k) => k.id !== item.id && k.id !== created.id)])
      showToast(`Komponen SKP ${item.kode} berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setKomponenList((prev) => [item, ...prev])
      showToast(`Komponen disimpan secara lokal: ${msg}`, 'info')
    }
  }

  const handleUpdateKomponen = async (updated: KomponenSKP) => {
    try {
      const res = await api.komponen.update(updated.id, updated)
      const saved = res?.data || updated
      setKomponenList((prev) => prev.map((k) => (k.id === updated.id ? saved : k)))
      showToast(`Komponen SKP ${updated.kode} berhasil diperbarui di basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setKomponenList((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
      showToast(`Komponen diperbarui secara lokal: ${msg}`, 'info')
    }
  }

  const handleDeleteKomponen = async (id: string) => {
    try {
      await api.komponen.delete(id)
      setKomponenList((prev) => prev.filter((k) => k.id !== id))
      showToast('Komponen SKP berhasil dihapus dari basis data!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setKomponenList((prev) => prev.filter((k) => k.id !== id))
      showToast(`Komponen dihapus secara lokal: ${msg}`, 'info')
    }
  }

  const handleSubmitSKP = async (skpId: string, payload?: PengajuanSKP) => {
    try {
      const existing = skpList.find((s) => s.id === skpId)
      const base = payload || existing
      if (!base) return

      const updated: PengajuanSKP = {
        ...base,
        id: skpId,
        status: 'Diajukan',
        tanggalPengajuan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      }

      // Optimistically update local state so UI updates immediately
      setSkpList((prev) => {
        const idx = prev.findIndex((s) => s.id === skpId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [updated, ...prev]
      })

      showToast(
        base.status === 'Diajukan'
          ? 'Pembaruan SKP berhasil diajukan ke atasan untuk dinilai!'
          : 'SKP berhasil diajukan ke atasan untuk dinilai!',
        'success'
      )

      // Save complete updated SKP with items to backend
      let res
      if (existing) {
        res = await api.skp.update(skpId, updated).catch(() => null)
      } else {
        res = await api.skp.create(updated).catch(() => null)
      }

      // Also call api.skp.submit with full updated payload
      const submitRes = await api.skp.submit(skpId, updated).catch(() => null)
      const saved = submitRes?.data || (res as { data?: PengajuanSKP })?.data
      if (saved && saved.items) {
        setSkpList((prev) => prev.map((s) => (s.id === skpId ? saved : s)))
      }
    } catch (err: unknown) {
      console.warn('Gagal mengajukan SKP ke backend:', err)
    }
  }

  const handleApproveSKPBySDM = async (skpId: string, notes: string) => {
    try {
      const res = await api.skp.reviewSDM(skpId, 'approve', notes)
      const saved = res?.data
      setSkpList((prev) =>
        prev.map((s) =>
          s.id === skpId ? (saved ? saved : { ...s, status: 'Disahkan', catatanSDM: notes }) : s
        )
      )
      const targetSKP = skpList.find((s) => s.id === skpId)
      if (targetSKP) {
        setDosenList((prev) =>
          prev.map((d) =>
            d.id === targetSKP.dosenId || d.nip === targetSKP.dosenNip
              ? { ...d, skpStatus: 'Disahkan' }
              : d
          )
        )
      }
      showToast('SKP berhasil divalidasi dan dikonfirmasi oleh Biro SDM!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memvalidasi SKP: ${msg}`, 'error')
    }
  }

  const handleRejectSKPBySDM = async (skpId: string, notes: string) => {
    try {
      const res = await api.skp.reviewSDM(skpId, 'reject', notes)
      const saved = res?.data
      setSkpList((prev) =>
        prev.map((s) =>
          s.id === skpId ? (saved ? saved : { ...s, status: 'Perlu Revisi', catatanSDM: notes }) : s
        )
      )
      const targetSKP = skpList.find((s) => s.id === skpId)
      if (targetSKP) {
        setDosenList((prev) =>
          prev.map((d) =>
            d.id === targetSKP.dosenId || d.nip === targetSKP.dosenNip
              ? { ...d, skpStatus: 'Perlu Revisi' }
              : d
          )
        )
      }
      showToast('Penerbitan SKP telah dibatalkan oleh Biro SDM untuk perbaikan/revisi.', 'info')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal membatalkan penerbitan SKP: ${msg}`, 'error')
    }
  }

  const handleApproveSKPByKaprodi = async (skpId: string, notes: string, ttdUrl?: string) => {
    const existing = skpList.find((s) => s.id === skpId)
    if (!existing) {
      showToast('Data pengajuan SKP tidak ditemukan di database.', 'error')
      return
    }

    // Resolusi TTD Penilai (Kaprodi) dan Dosen yang dinilai murni dari profil database
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdKaprodiUrl || undefined
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || undefined

    try {
      const res = await api.skp.reviewKaprodi(skpId, 'approve', notes, reviewerTtd)
      const saved = res?.data
      const updated: PengajuanSKP = saved || {
        ...existing,
        status: 'Disahkan',
        catatanKaprodi: notes,
        ttdKaprodiUrl: reviewerTtd,
        ttdDosenUrl: dosenTtd,
        tanggalPenilaianKaprodi: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
      setSkpList((prev) => prev.map((s) => (s.id === skpId ? updated : s)))
      setDosenList((prev) =>
        prev.map((d) =>
          d.id === existing.dosenId || d.nip === existing.dosenNip
            ? { ...d, skpStatus: 'Disahkan', nilaiAkhir: existing.nilaiKinerjaSKP || d.nilaiAkhir }
            : d
        )
      )
      showToast('SKP berhasil dinilai, disetujui, dan SAH DITERBITKAN secara resmi!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menilai SKP: ${msg}`, 'error')
    }
  }

  const handleRejectSKPByKaprodi = async (skpId: string, notes: string) => {
    try {
      const res = await api.skp.reviewKaprodi(skpId, 'reject', notes)
      const saved = res?.data
      setSkpList((prev) =>
        prev.map((s) =>
          s.id === skpId ? (saved ? saved : { ...s, status: 'Perlu Revisi', catatanKaprodi: notes }) : s
        )
      )
      const targetSKP = skpList.find((s) => s.id === skpId)
      if (targetSKP) {
        setDosenList((prev) =>
          prev.map((d) =>
            d.id === targetSKP.dosenId || d.nip === targetSKP.dosenNip
              ? { ...d, skpStatus: 'Perlu Revisi' }
              : d
          )
        )
      }
      showToast('SKP dikembalikan untuk revisi oleh Kaprodi.', 'info')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal mereview SKP: ${msg}`, 'error')
    }
  }

  const handleApproveSKPByDekan = async (skpId: string, notes: string, ttdUrl?: string) => {
    const existing = skpList.find((s) => s.id === skpId)
    if (!existing) {
      showToast('Data pengajuan SKP tidak ditemukan di database.', 'error')
      return
    }

    // Resolusi TTD Penilai (Dekan) dan Dosen/Ka.Prodi yang dinilai murni dari profil database
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdDekanUrl || undefined
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || undefined

    try {
      const res = await api.skp.reviewDekan(skpId, 'approve', notes, reviewerTtd)
      const saved = res?.data
      const updated: PengajuanSKP = saved || {
        ...existing,
        status: 'Disahkan',
        catatanDekan: notes,
        ttdDekanUrl: reviewerTtd,
        ttdDosenUrl: dosenTtd,
        tanggalPenilaianDekan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
      setSkpList((prev) => prev.map((s) => (s.id === skpId ? updated : s)))
      setDosenList((prev) =>
        prev.map((d) =>
          d.id === existing.dosenId || d.nip === existing.dosenNip
            ? { ...d, skpStatus: 'Disahkan', nilaiAkhir: existing.nilaiKinerjaSKP || d.nilaiAkhir }
            : d
        )
      )
      showToast('SKP berhasil disetujui oleh Dekan dan SAH DITERBITKAN secara resmi!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal mengesahkan SKP: ${msg}`, 'error')
    }
  }

  const handleRejectSKPByDekan = async (skpId: string, notes: string) => {
    try {
      const res = await api.skp.reviewDekan(skpId, 'reject', notes)
      const saved = res?.data
      setSkpList((prev) =>
        prev.map((s) =>
          s.id === skpId ? (saved ? saved : { ...s, status: 'Perlu Revisi', catatanDekan: notes }) : s
        )
      )
      showToast('SKP dikembalikan untuk revisi oleh Dekan.', 'info')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal mereview SKP: ${msg}`, 'error')
    }
  }

  const handleAddIndikator = async (item: IndikatorKuesioner) => {
    setIndikatorList((prev) => [...prev, item])
    try {
      const res = await api.indikator.create(item)
      if (res && res.data) {
        setIndikatorList((prev) => prev.map((i) => (i.id === item.id ? res.data : i)))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi terputus'
      console.error('Gagal menambahkan indikator ke database:', err)
      showToast('Gagal menyimpan indikator ke database: ' + msg)
      setIndikatorList((prev) => prev.filter((i) => i.id !== item.id))
      throw err
    }
  }

  const handleUpdateIndikator = async (updated: IndikatorKuesioner) => {
    const prevList = [...indikatorList]
    setIndikatorList((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    try {
      const res = await api.indikator.update(updated.id, updated)
      if (res && res.data) {
        setIndikatorList((prev) => prev.map((i) => (i.id === updated.id ? res.data : i)))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi terputus'
      console.error('Gagal memperbarui indikator di database:', err)
      showToast('Gagal memperbarui indikator di database: ' + msg)
      setIndikatorList(prevList)
      throw err
    }
  }

  const handleDeleteIndikator = async (id: string) => {
    const prevList = [...indikatorList]
    setIndikatorList((prev) => prev.filter((i) => i.id !== id))
    try {
      await api.indikator.delete(id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi terputus'
      console.error('Gagal menghapus indikator dari database:', err)
      showToast('Gagal menghapus indikator dari database: ' + msg)
      setIndikatorList(prevList)
      throw err
    }
  }

  const handleAddPenilaian = async (item: PenilaianKuesioner) => {
    try {
      const existing = penilaianList.find(
        (p) =>
          p.id === item.id ||
          (p.dosenId === item.dosenId && p.tahun === item.tahun && p.periode === item.periode)
      )

      let res
      if (existing) {
        res = await api.penilaian.update(existing.id, item).catch(() => api.penilaian.create(item))
      } else {
        res = await api.penilaian.create(item)
      }

      const saved = (res as { data?: PenilaianKuesioner })?.data || item
      setPenilaianList((prev) => {
        const idx = prev.findIndex(
          (p) =>
            p.id === saved.id ||
            (p.dosenId === saved.dosenId && p.tahun === saved.tahun && p.periode === saved.periode)
        )
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = saved
          return copy
        }
        return [saved, ...prev]
      })
      showToast('Penilaian kuesioner berhasil disimpan ke basis data!', 'success')
      return saved
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menyimpan penilaian: ${msg}`, 'error')
      throw err
    }
  }

  const handleUpdateMySKP = async (updated: PengajuanSKP) => {
    try {
      const exists = skpList.some((s) => s.id === updated.id)
      let res
      if (exists) {
        res = await api.skp.update(updated.id, updated)
      } else {
        res = await api.skp.create(updated)
      }
      const saved = (res as { data?: PengajuanSKP })?.data || updated
      setSkpList((prev) => {
        const existsInPrev = prev.some((s) => s.id === saved.id)
        if (existsInPrev) {
          return prev.map((s) => (s.id === saved.id ? saved : s))
        }
        return [saved, ...prev]
      })
      showToast('SKP berhasil disimpan ke basis data!', 'success')
      return saved
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menyimpan SKP: ${msg}`, 'error')
      throw err
    }
  }

  const handleMarkNotificationAsRead = (id: string) => {
    const updated = Array.from(new Set([...readNotifIds, id]))
    setReadNotifIds(updated)
    localStorage.setItem('ubk_read_notif_ids', JSON.stringify(updated))
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    api.notifications.markAsRead(id).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleMarkAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id)
    const updated = Array.from(new Set([...readNotifIds, ...allIds]))
    setReadNotifIds(updated)
    localStorage.setItem('ubk_read_notif_ids', JSON.stringify(updated))
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    api.notifications.markAllRead(allIds).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  // Rute Cetak Standalone Resmi (Tab Baru / _blank)
  if (typeof window !== 'undefined') {
    const p = window.location.pathname
    if (p.startsWith('/cetak/skp') || p.startsWith('/cetak-skp')) {
      return (
        <React.Suspense fallback={<DashboardSkeleton />}>
          <CetakSKPStandaloneView />
        </React.Suspense>
      )
    }
    if (p.startsWith('/cetak/output-final') || p.startsWith('/cetak-output-final')) {
      return (
        <React.Suspense fallback={<DashboardSkeleton />}>
          <CetakOutputFinalStandaloneView />
        </React.Suspense>
      )
    }
    if (p.startsWith('/cetak/transkrip') || p.startsWith('/cetak-transkrip')) {
      return (
        <React.Suspense fallback={<DashboardSkeleton />}>
          <CetakTranskripStandaloneView />
        </React.Suspense>
      )
    }
    if (p.startsWith('/cetak/panduan') || p.startsWith('/cetak-panduan')) {
      return (
        <React.Suspense fallback={<DashboardSkeleton />}>
          <CetakPanduanStandaloneView />
        </React.Suspense>
      )
    }
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />
  }

  const dosenMySKP =
    skpList.find(
      (s) =>
        (s.dosenId === currentUser.id ||
          (currentUser.nip && s.dosenNip === currentUser.nip) ||
          (s.dosenNama && currentUser.name && s.dosenNama.toLowerCase().includes(currentUser.name.split(',')[0].toLowerCase()))) &&
        s.semester === 'Genap'
    ) ||
    skpList.find(
      (s) =>
        s.dosenId === currentUser.id ||
        (currentUser.nip && s.dosenNip === currentUser.nip) ||
        (s.dosenNama && currentUser.name && s.dosenNama.toLowerCase().includes(currentUser.name.split(',')[0].toLowerCase()))
    )

  return (
    <div className="app">
      <Sidebar
        currentRole={currentRole}
        activeNav={activeNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectNav={(id) => handleNavigate(id)}
        onLogout={handleLogout}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      <div className="shell">
        <Header
          user={currentUser}
          notifications={notifications}
          backendStatus={backendStatus}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onSelectNav={(id) => handleNavigate(id)}
          onLogout={handleLogout}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onShowToast={showToast}
        />

        <main ref={mainRef} className="app-main">
          {currentUser.mustChangePassword && activeNav !== 'profil' && activeNav !== 'keamanan' && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                color: 'var(--status-warning-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, color: 'var(--status-warning-ink)' }} />
                <span>
                  <strong>Kewajiban Keamanan:</strong> Akun Anda masih menggunakan kata sandi awal institusi (NUPTK/NIP). Silakan perbarui kata sandi Anda demi keamanan data kepegawaian.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('profil')}
                className="btn-action-edit"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--r-sm)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Ganti Kata Sandi
              </button>
            </div>
          )}
          {isInitialLoading ? (
            <DashboardSkeleton />
          ) : (
            <React.Suspense fallback={<DashboardSkeleton />}>
              {(activeNav === 'profil' || activeNav === 'keamanan') && (
                <ProfilView
                  user={currentUser}
                  mode={activeNav === 'keamanan' ? 'keamanan' : 'profil'}
                  onShowToast={showToast}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated)
                    try {
                      saveUserSession(updated)
                    } catch {}
                  }}
                />
              )}

              {activeNav === 'panduan' && (
                <PanduanView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigate={(v) => handleNavigate(v)}
                  onShowToast={showToast}
                />
              )}

              {activeNav !== 'profil' && activeNav !== 'keamanan' && activeNav !== 'panduan' && currentRole === 'sdm' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardSDM
                  dosenList={dosenList}
                  skpList={skpList}
                  onNavigate={(v) => handleNavigate(v)}
                  onAddDosenModal={() => handleNavigate('data-dosen')}
                  onSelectSKPToReview={(skp) => {
                    setSelectedSKPForReview(skp)
                    handleNavigate('skp-dosen')
                  }}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'skp-sdm-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  jabatanList={jabatanList}
                  prodiList={prodiList}
                  mySKP={
                    skpList.find(
                      (s) =>
                        (s.dosenId === currentUser.id || s.dosenNama === currentUser.name) &&
                        s.semester === 'Genap'
                    ) ||
                    skpList.find(
                      (s) => s.dosenId === currentUser.id || s.dosenNama === currentUser.name
                    )
                  }
                  komponenList={komponenList}
                  onUpdateSKP={handleUpdateMySKP}
                  onSubmitSKP={handleSubmitSKP}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'hasil-kinerja-sdm' && (
                <HasilKinerjaTahunanSelf
                  user={currentUser}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'data-dosen' && (
                <KelolaDataDosen
                  dosenList={dosenList}
                  prodiList={prodiNames}
                  prodiObjects={prodiList}
                  fakultasList={fakultasList}
                  psdkuList={psdkuList}
                  jabatanList={jabatanList}
                  onAddDosen={handleAddDosen}
                  onUpdateDosen={handleUpdateDosen}
                  onDeleteDosen={handleDeleteDosen}
                  onAddProdi={handleAddProdi}
                  onUpdateProdi={handleUpdateProdi}
                  onDeleteProdi={handleDeleteProdi}
                  onAddFakultas={handleAddFakultas}
                  onUpdateFakultas={handleUpdateFakultas}
                  onDeleteFakultas={handleDeleteFakultas}
                  onAddPsdku={handleAddPsdku}
                  onUpdatePsdku={handleUpdatePsdku}
                  onDeletePsdku={handleDeletePsdku}
                  onAddJabatan={handleAddJabatan}
                  onUpdateJabatan={handleUpdateJabatan}
                  onDeleteJabatan={handleDeleteJabatan}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'komponen-skp' && (
                <KelolaKomponenSKP
                  komponenList={komponenList}
                  jabatanList={jabatanList}
                  onAddKomponen={handleAddKomponen}
                  onUpdateKomponen={handleUpdateKomponen}
                  onDeleteKomponen={handleDeleteKomponen}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'skp-dosen' && (
                <KelolaSKPDosen
                  skpList={skpList}
                  dosenList={dosenList}
                  fakultasList={fakultasList}
                  prodiList={prodiNames}
                  initialSelectedSKP={selectedSKPForReview}
                  onApproveSKP={handleApproveSKPBySDM}
                  onRejectSKP={handleRejectSKPBySDM}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'indikator-kuesioner' && (
                <KelolaIndikatorKuesioner
                  indikatorList={indikatorList}
                  onAddIndikator={handleAddIndikator}
                  onUpdateIndikator={handleUpdateIndikator}
                  onDeleteIndikator={handleDeleteIndikator}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'penilaian-kuesioner' && (
                <KelolaPenilaianKuesioner
                  penilaianList={penilaianList}
                  dosenList={dosenList}
                  onAddPenilaian={handleAddPenilaian}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'laporan' && (
                <LaporanView
                  dosenList={dosenList}
                  skpList={skpList}
                  penilaianList={penilaianList}
                  prodiList={prodiNames}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {activeNav !== 'profil' && activeNav !== 'keamanan' && activeNav !== 'panduan' && currentRole === 'dosen' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDosen
                  user={currentUser}
                  mySKP={dosenMySKP}
                  skpList={skpList}
                  penilaianList={penilaianList}
                  onNavigateToSKP={() => handleNavigate('skp-dosen-self')}
                  onNavigateToHasilKinerja={() => handleNavigate('hasil-kinerja-dosen')}
                  onNavigateToProfil={() => handleNavigate('profil')}
                  onNavigateToPanduan={() => handleNavigate('panduan')}
                />
              )}
              {activeNav === 'skp-dosen-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  jabatanList={jabatanList}
                  prodiList={prodiList}
                  mySKP={dosenMySKP}
                  komponenList={komponenList}
                  onUpdateSKP={handleUpdateMySKP}
                  onSubmitSKP={handleSubmitSKP}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'hasil-kinerja-dosen' && (
                <HasilKinerjaTahunanSelf
                  user={currentUser}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {activeNav !== 'profil' && activeNav !== 'keamanan' && activeNav !== 'panduan' && currentRole === 'kaprodi' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardKaprodi
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  penilaianList={penilaianList}
                  onNavigateToSKP={() => handleNavigate('skp-kaprodi-self')}
                  onNavigateToReview={() => handleNavigate('review-skp-kaprodi')}
                  onNavigateToKuesioner={() => handleNavigate('kuesioner-kaprodi')}
                  onNavigateToHasilKinerjaSelf={() => handleNavigate('hasil-kinerja-kaprodi')}
                  onNavigateToPanduan={() => handleNavigate('panduan')}
                  onSelectSKP={(skp) => {
                    setSelectedSKPForReview(skp)
                    handleNavigate('review-skp-kaprodi')
                  }}
                />
              )}
              {activeNav === 'skp-kaprodi-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  jabatanList={jabatanList}
                  prodiList={prodiList}
                  mySKP={
                    skpList.find(
                      (s) =>
                        (s.dosenId === currentUser.id || s.dosenNama === currentUser.name) &&
                        s.semester === 'Genap'
                    ) ||
                    skpList.find((s) => s.dosenId === currentUser.id || s.dosenNama === currentUser.name)
                  }
                  komponenList={komponenList}
                  onUpdateSKP={handleUpdateMySKP}
                  onSubmitSKP={handleSubmitSKP}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'review-skp-kaprodi' && (
                <ReviewSKPKaprodi
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  initialSelectedSKP={selectedSKPForReview}
                  onApproveByKaprodi={handleApproveSKPByKaprodi}
                  onRejectByKaprodi={handleRejectSKPByKaprodi}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'kuesioner-kaprodi' && (
                <KelolaKuesionerKaprodi
                  user={currentUser}
                  dosenList={dosenList}
                  skpList={skpList}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onSaveKuesioner={handleAddPenilaian}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'hasil-kinerja-kaprodi' && (
                <HasilKinerjaTahunanSelf
                  user={currentUser}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {activeNav !== 'profil' && activeNav !== 'keamanan' && activeNav !== 'panduan' && currentRole === 'dekan' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDekan
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  prodiList={prodiList}
                  fakultasList={fakultasList}
                  psdkuList={psdkuList}
                  onNavigateToSKP={() => handleNavigate('skp-dekan-self')}
                  onNavigateToReview={() => handleNavigate('review-skp-dekan')}
                  onNavigateToEvaluasiKaprodi={() => handleNavigate('kuesioner-dekan')}
                  onNavigateToHasilKinerjaSelf={() => handleNavigate('hasil-kinerja-dekan')}
                  onNavigateToPanduan={() => handleNavigate('panduan')}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'skp-dekan-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  jabatanList={jabatanList}
                  prodiList={prodiList}
                  mySKP={
                    skpList.find(
                      (s) =>
                        (s.dosenId === currentUser.id || s.dosenNama === currentUser.name) &&
                        s.semester === 'Genap'
                    ) ||
                    skpList.find(
                      (s) => s.dosenId === currentUser.id || s.dosenNama === currentUser.name
                    )
                  }
                  komponenList={komponenList}
                  onUpdateSKP={handleUpdateMySKP}
                  onSubmitSKP={handleSubmitSKP}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'review-skp-dekan' && (
                <ReviewSKPDekan
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  prodiList={prodiList}
                  fakultasList={fakultasList}
                  psdkuList={psdkuList}
                  onApproveByDekan={handleApproveSKPByDekan}
                  onRejectByDekan={handleRejectSKPByDekan}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'kuesioner-dekan' && (
                <CekHasilKuesionerDekan
                  user={currentUser}
                  dosenList={dosenList}
                  skpList={skpList}
                  prodiList={prodiList}
                  fakultasList={fakultasList}
                  psdkuList={psdkuList}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onSavePenilaian={handleAddPenilaian}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'hasil-kinerja-dekan' && (
                <HasilKinerjaTahunanSelf
                  user={currentUser}
                  penilaianList={penilaianList}
                  indikatorList={indikatorList}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
            </React.Suspense>
          )}
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentRole={currentRole}
        onSelectNav={(id) => handleNavigate(id)}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigateToPanduan={() => handleNavigate('panduan')}
      />

    </div>
  )
}
