import React, { useState, useRef, useEffect } from 'react'
import { Role, UserSession, Dosen, KomponenSKP, PengajuanSKP, IndikatorKuesioner, PenilaianKuesioner, NotificationItem, ProgramStudi, JabatanKampus, Fakultas, Psdku } from './types'
import { useViewTransition } from './utils/animations'
import { api } from './services/api'
import { DEMO_USERS } from './data'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { Toast } from './components/Toast'
import { LoginView } from './views/LoginView'
import { DashboardSDM } from './views/DashboardSDM'
import { KelolaDataDosen } from './views/KelolaDataDosen'
import { KelolaKomponenSKP } from './views/KelolaKomponenSKP'
import { KelolaSKPDosen } from './views/KelolaSKPDosen'
import { KelolaIndikatorKuesioner } from './views/KelolaIndikatorKuesioner'
import { KelolaPenilaianKuesioner } from './views/KelolaPenilaianKuesioner'
import { LaporanView } from './views/LaporanView'
import { DashboardDosen } from './views/DashboardDosen'
import { KelolaSKPDosenSelf } from './views/KelolaSKPDosenSelf'
import { DashboardKaprodi } from './views/DashboardKaprodi'
import { ReviewSKPKaprodi } from './views/ReviewSKPKaprodi'
import { KelolaKuesionerKaprodi } from './views/KelolaKuesionerKaprodi'
import { DashboardDekan } from './views/DashboardDekan'
import { ReviewSKPDekan } from './views/ReviewSKPDekan'
import { CekHasilKuesionerDekan } from './views/CekHasilKuesionerDekan'
import { HasilKinerjaTahunanSelf } from './views/HasilKinerjaTahunanSelf'
import { ProfilView } from './views/ProfilView'
import { CetakSKPStandaloneView } from './views/CetakSKPStandaloneView'
import { CetakOutputFinalStandaloneView } from './views/CetakOutputFinalStandaloneView'
import { CetakTranskripStandaloneView } from './views/CetakTranskripStandaloneView'
import { HelpModal } from './components/HelpModal'
import { DashboardSkeleton } from './components/Skeleton'
import { getNavIdFromPath, getPathFromNavId } from './utils/routes'
import { deriveRealNotifications } from './utils/notifications'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('ubk_auth_token')
    const savedSession = localStorage.getItem('ubk_user_session')
    return Boolean(token || savedSession)
  })

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'sdm'
    const savedSession = localStorage.getItem('ubk_user_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed?.role && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(parsed.role)) {
          return parsed.role
        }
      } catch {}
    }
    const saved = localStorage.getItem('ubk_current_role') as Role | null
    if (saved && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(saved)) {
      return saved
    }
    return 'sdm'
  })

  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    if (typeof window === 'undefined') return DEMO_USERS['sdm']
    const savedSession = localStorage.getItem('ubk_user_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed?.name && parsed?.role) return parsed
      } catch {}
    }
    const savedRole = (localStorage.getItem('ubk_current_role') as Role) || 'sdm'
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

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  const [demoUsers, setDemoUsers] = useState<Record<string, UserSession>>(DEMO_USERS)
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

  // URL state synchronization with clean paths (/dashboard, /profil, /data-dosen, etc.)
  const updateUrl = (nav: string) => {
    if (typeof window === 'undefined') return
    const targetPath = getPathFromNavId(nav)
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ nav }, '', targetPath)
    }
  }

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const n = getNavIdFromPath(window.location.pathname, currentRole)
      setActiveNav(n)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentRole])

  // Sync initial URL with authentication status
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isLoggedIn) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({ nav: 'login' }, '', '/login')
      }
    } else {
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        window.history.replaceState({ nav: 'dashboard' }, '', '/dashboard')
        setActiveNav('dashboard')
      } else {
        const detected = getNavIdFromPath(window.location.pathname, currentRole)
        setActiveNav(detected)
      }
    }
  }, [isLoggedIn, currentRole])

  // Load data from Laravel 12 Backend API on mount
  useEffect(() => {
    let isMounted = true
    const initDataFromApi = async () => {
      try {
        const [dosenData, komponenData, skpData, indikatorData, penilaianData, notifData, prodiData, demoUsersData, jabatanData, fakultasData, psdkuData] = await Promise.all([
          api.dosen.list().catch(() => null),
          api.komponen.list().catch(() => null),
          api.skp.list().catch(() => null),
          api.indikator.list().catch(() => null),
          api.penilaian.list().catch(() => null),
          api.notifications.list().catch(() => null),
          api.prodi.list().catch(() => null),
          api.auth.getDemoUsers().catch(() => null),
          api.jabatan.list().catch(() => null),
          api.fakultas.list().catch(() => null),
          api.psdku.list().catch(() => null),
        ])

        if (!isMounted) return

        if (dosenData && Array.isArray(dosenData)) {
          setDosenList(dosenData)
          setBackendStatus('connected')
        } else {
          setBackendStatus('offline')
        }

        if (prodiData && Array.isArray(prodiData)) setProdiList(prodiData)
        if (fakultasData && Array.isArray(fakultasData)) setFakultasList(fakultasData)
        if (psdkuData && Array.isArray(psdkuData)) setPsdkuList(psdkuData)
        if (jabatanData && Array.isArray(jabatanData)) setJabatanList(jabatanData)
        if (komponenData && Array.isArray(komponenData)) setKomponenList(komponenData)
        if (skpData && Array.isArray(skpData)) setSkpList(skpData)
        if (indikatorData && Array.isArray(indikatorData)) setIndikatorList(indikatorData)
        if (penilaianData && Array.isArray(penilaianData)) setPenilaianList(penilaianData)
        if (notifData && Array.isArray(notifData)) setNotifications(notifData)
        if (demoUsersData && typeof demoUsersData === 'object' && Object.keys(demoUsersData).length > 0) {
          setDemoUsers(demoUsersData as Record<string, UserSession>)
        }

        // Jika tersimpan token autentikasi, verifikasi profil pengguna saat ini ke backend
        if (localStorage.getItem('ubk_auth_token')) {
          api.auth
            .me()
            .then((meUser) => {
              if (isMounted && meUser && meUser.name) {
                setCurrentUser(meUser)
                if (meUser.role) setCurrentRole(meUser.role)
                localStorage.setItem('ubk_user_session', JSON.stringify(meUser))
                localStorage.setItem('ubk_current_role', meUser.role)
              }
            })
            .catch(() => {})
        }
      } catch {
        if (isMounted) setBackendStatus('offline')
      } finally {
        if (isMounted) {
          setTimeout(() => setIsInitialLoading(false), 200)
        }
      }
    }

    initDataFromApi()
    return () => {
      isMounted = false
    }
  }, [])

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
  }, [currentRole, currentUser, skpList, penilaianList, dosenList, readNotifIds])

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const handleNavigate = (navId: string) => {
    setActiveNav(navId)
    updateUrl(navId)
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
        res = await api.auth.login(payload)
      } catch (backendErr: any) {
        // Jika backend merespons 401 atau kesalahan kredensial spesifik
        const errMsg = backendErr?.message || ''
        if (
          errMsg.includes('401') ||
          errMsg.includes('tidak dikenali') ||
          errMsg.includes('tidak sesuai') ||
          errMsg.includes('salah') ||
          errMsg.includes('tidak terdaftar') ||
          errMsg.includes('Unauthenticated')
        ) {
          const userMsg = 'Data yang Anda masukkan tidak dikenali. Silakan periksa kembali Email/NIP dan kata sandi Anda.'
          showToast(userMsg, 'error')
          return { success: false, message: userMsg }
        }

        // Mode fallback jika server Laravel offline (koneksi jaringan putus)
        const targetDemoUser = Object.values(demoUsers).find(
          (u) => u.email.toLowerCase() === cleanId.toLowerCase() || u.nip === cleanId || u.role === role
        ) || DEMO_USERS[role]

        const storedMap = JSON.parse(localStorage.getItem('ubk_user_passwords') || '{}')
        const expectedPassword = storedMap[cleanId] || targetDemoUser?.nip || 'password'

        if (cleanPass !== expectedPassword && cleanPass !== 'password' && cleanPass !== targetDemoUser?.nip) {
          const failMsg = 'Data yang Anda masukkan tidak dikenali. Silakan periksa kembali Email/NIP dan kata sandi Anda.'
          showToast(failMsg, 'error')
          return { success: false, message: failMsg }
        }

        res = {
          token: 'offline-token',
          user: targetDemoUser,
        }
      }

      if (res?.user) {
        const loggedUser = res.user
        setCurrentUser(loggedUser)
        setCurrentRole(loggedUser.role)
        setActiveNav('dashboard')
        setIsLoggedIn(true)
        if (rememberMe) {
          localStorage.setItem('ubk_user_session', JSON.stringify(loggedUser))
          localStorage.setItem('ubk_current_role', loggedUser.role)
        }
        updateUrl('dashboard')
        showToast(`Selamat datang di portal UBK, ${loggedUser.name}!`, 'success')
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

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('ubk_user_session')
    localStorage.removeItem('ubk_auth_token')
    localStorage.removeItem('ubk_current_role')
    setCurrentUser(DEMO_USERS['sdm'])
    setCurrentRole('sdm')
    window.history.pushState({ nav: 'login' }, '', '/login')
    api.auth.logout().catch(() => {})
    showToast('Anda telah keluar dari sistem portal.', 'info')
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
        localStorage.setItem('ubk_user_session', JSON.stringify(freshUser))
        localStorage.setItem('ubk_current_role', updatedRole)
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

  const handleSubmitSKP = async (skpId: string) => {
    const existing = skpList.find((s) => s.id === skpId)
    const updated = existing
      ? {
          ...existing,
          status: 'Diajukan' as const,
          tanggalPengajuan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        }
      : null

    if (updated) {
      setSkpList(skpList.map((s) => (s.id === skpId ? updated : s)))
      showToast('SKP berhasil diajukan ke atasan untuk dinilai!', 'success')
      api.skp.submit(skpId).catch(() => {
        api.skp.update(skpId, updated).catch(() => api.skp.create(updated).catch(() => {}))
      })
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

    // Resolusi TTD Penilai (Kaprodi) dan Dosen yang dinilai otomatis dari profil
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdKaprodiUrl || demoUsers.kaprodi?.signatureUrl
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || demoUsers.dosen?.signatureUrl

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

    // Resolusi TTD Penilai (Dekan) dan Dosen/Ka.Prodi yang dinilai otomatis dari profil
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdDekanUrl || demoUsers.dekan?.signatureUrl
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || demoUsers.kaprodi?.signatureUrl || demoUsers.dosen?.signatureUrl

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
    if (window.location.pathname.startsWith('/cetak-skp')) {
      return <CetakSKPStandaloneView />
    }
    if (window.location.pathname.startsWith('/cetak-output-final')) {
      return <CetakOutputFinalStandaloneView />
    }
    if (window.location.pathname.startsWith('/cetak-transkrip')) {
      return <CetakTranskripStandaloneView />
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
          {isInitialLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {(activeNav === 'profil' || activeNav === 'keamanan') && (
                <ProfilView
                  user={currentUser}
                  mode={activeNav === 'keamanan' ? 'keamanan' : 'profil'}
                  onShowToast={showToast}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated)
                    setDemoUsers((prev) => ({
                      ...prev,
                      [updated.role]: updated,
                    }))
                    try {
                      localStorage.setItem('ubk_user_session', JSON.stringify(updated))
                    } catch {}
                  }}
                />
              )}

              {activeNav !== 'profil' && activeNav !== 'keamanan' && currentRole === 'sdm' && (
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

          {activeNav !== 'profil' && activeNav !== 'keamanan' && currentRole === 'dosen' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDosen
                  user={currentUser}
                  mySKP={dosenMySKP}
                  penilaianList={penilaianList}
                  onNavigateToSKP={() => handleNavigate('skp-dosen-self')}
                  onNavigateToHasilKinerja={() => handleNavigate('hasil-kinerja-dosen')}
                  onNavigateToProfil={() => handleNavigate('profil')}
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
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {activeNav !== 'profil' && activeNav !== 'keamanan' && currentRole === 'kaprodi' && (
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
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {activeNav !== 'profil' && activeNav !== 'keamanan' && currentRole === 'dekan' && (
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
                  onShowToast={showToast}
                />
              )}
            </>
          )}
            </>
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
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}
