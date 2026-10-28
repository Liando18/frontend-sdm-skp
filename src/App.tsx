import React, { useState, useRef, useEffect } from 'react'
import { Role, UserSession, Dosen, KomponenSKP, PengajuanSKP, IndikatorKuesioner, PenilaianKuesioner, NotificationItem, ProgramStudi } from './types'
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
import { HelpModal } from './components/HelpModal'
import { DashboardSkeleton } from './components/Skeleton'
import { getNavIdFromPath, getPathFromNavId } from './utils/routes'

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
        const [dosenData, komponenData, skpData, indikatorData, penilaianData, notifData, prodiData, demoUsersData] = await Promise.all([
          api.dosen.list().catch(() => null),
          api.komponen.list().catch(() => null),
          api.skp.list().catch(() => null),
          api.indikator.list().catch(() => null),
          api.penilaian.list().catch(() => null),
          api.notifications.list().catch(() => null),
          api.prodi.list().catch(() => null),
          api.auth.getDemoUsers().catch(() => null),
        ])

        if (!isMounted) return

        if (dosenData && Array.isArray(dosenData)) {
          setDosenList(dosenData)
          setBackendStatus('connected')
        } else {
          setBackendStatus('offline')
        }

        if (prodiData && Array.isArray(prodiData)) setProdiList(prodiData)
        if (komponenData && Array.isArray(komponenData)) setKomponenList(komponenData)
        if (skpData && Array.isArray(skpData)) setSkpList(skpData)
        if (indikatorData && Array.isArray(indikatorData)) setIndikatorList(indikatorData)
        if (penilaianData && Array.isArray(penilaianData)) setPenilaianList(penilaianData)
        if (notifData && Array.isArray(notifData)) setNotifications(notifData)
        if (demoUsersData && typeof demoUsersData === 'object' && Object.keys(demoUsersData).length > 0) {
          setDemoUsers(demoUsersData as Record<string, UserSession>)
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

  const currentUser: UserSession = demoUsers[currentRole] || DEMO_USERS[currentRole] || DEMO_USERS['sdm']

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

  const handleLogin = async (role: Role, identifier: string, password?: string, rememberMe = true) => {
    const cleanId = (identifier || '').trim()
    const cleanPass = (password || '').trim()

    if (!cleanId || !cleanPass) {
      showToast('Silakan masukkan NIP atau Email dan kata sandi Anda.', 'error')
      return
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
        // Jika backend merespons 401 atau kesalahan kredensial, tolak langsung!
        const errMsg = backendErr?.message || ''
        if (errMsg.includes('401') || errMsg.includes('tidak sesuai') || errMsg.includes('salah') || errMsg.includes('Unauthenticated')) {
          showToast('NIP/Email atau kata sandi salah. Silakan coba kembali.', 'error')
          return
        }

        // Mode fallback jika server Laravel benar-benar offline (koneksi jaringan putus)
        const targetDemoUser = Object.values(demoUsers).find(
          (u) => u.email.toLowerCase() === cleanId.toLowerCase() || u.nip === cleanId || u.role === role
        ) || DEMO_USERS[role]

        const storedMap = JSON.parse(localStorage.getItem('ubk_user_passwords') || '{}')
        const expectedPassword = storedMap[cleanId] || targetDemoUser?.nip

        if (cleanPass !== expectedPassword) {
          showToast('NIP/Email atau kata sandi salah. Silakan periksa kembali kredensial Anda.', 'error')
          return
        }

        res = {
          token: 'offline-token',
          user: targetDemoUser,
        }
      }

      if (res?.user) {
        const loggedUser = res.user
        setCurrentRole(loggedUser.role)
        setActiveNav('dashboard')
        setIsLoggedIn(true)
        if (rememberMe) {
          localStorage.setItem('ubk_user_session', JSON.stringify(loggedUser))
          localStorage.setItem('ubk_current_role', loggedUser.role)
        }
        updateUrl('dashboard')
        showToast(`Selamat datang di portal UBK, ${loggedUser.name}!`, 'success')
      } else {
        showToast('Gagal masuk ke sistem. Periksa kembali NIP/Email dan kata sandi.', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan saat memproses login. Silakan coba sesaat lagi.', 'error')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('ubk_user_session')
    localStorage.removeItem('ubk_auth_token')
    window.history.pushState({ nav: 'login' }, '', '/login')
    api.auth.logout().catch(() => {})
    showToast('Anda telah keluar dari sistem portal.', 'info')
  }

  const handleAddDosen = (dosen: Dosen) => {
    setDosenList([dosen, ...dosenList])
    api.dosen.create(dosen).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleUpdateDosen = (updated: Dosen) => {
    setDosenList(dosenList.map((d) => (d.id === updated.id ? updated : d)))
    api.dosen.update(updated.id, updated).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleDeleteDosen = (id: string) => {
    setDosenList(dosenList.filter((d) => d.id !== id))
    api.dosen.delete(id).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const prodiNames = prodiList.length > 0
    ? prodiList.map((p) => p.nama)
    : Array.from(new Set(dosenList.map((d) => d.prodi).filter(Boolean)))

  const handleAddProdi = async (nama: string) => {
    try {
      const res = await api.prodi.create({ nama })
      if (res?.data) {
        setProdiList((prev) => [...prev, res.data])
      } else {
        setProdiList((prev) => [
          ...prev,
          { id: `prodi-${Date.now()}`, nama, jenjang: 'S1', fakultas: 'Fakultas Keperawatan dan Kebidanan', kampus: 'Pusat', akreditasi: 'Baik Sekali' },
        ])
      }
      showToast(`Program Studi "${nama}" berhasil disimpan ke basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menambahkan program studi: ${msg}`, 'error')
    }
  }

  const handleUpdateProdi = async (oldName: string, newName: string) => {
    try {
      const target = prodiList.find((p) => p.nama === oldName)
      if (target) {
        await api.prodi.update(target.id, { nama: newName })
        setProdiList((prev) => prev.map((p) => (p.id === target.id ? { ...p, nama: newName } : p)))
      } else {
        await api.prodi.update(oldName, { nama: newName })
        setProdiList((prev) => prev.map((p) => (p.nama === oldName ? { ...p, nama: newName } : p)))
      }
      showToast(`Program Studi berhasil diubah menjadi "${newName}"!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal memperbarui program studi: ${msg}`, 'error')
    }
  }

  const handleDeleteProdi = async (nama: string) => {
    try {
      const target = prodiList.find((p) => p.nama === nama)
      if (target) {
        await api.prodi.delete(target.id)
        setProdiList((prev) => prev.filter((p) => p.id !== target.id))
      } else {
        await api.prodi.delete(nama)
        setProdiList((prev) => prev.filter((p) => p.nama !== nama))
      }
      showToast(`Program Studi "${nama}" berhasil dihapus dari basis data!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      showToast(`Gagal menghapus program studi: ${msg}`, 'error')
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

  const handleApproveSKPBySDM = (skpId: string, notes: string) => {
    setSkpList(
      skpList.map((s) =>
        s.id === skpId ? { ...s, status: 'Disetujui SDM', catatanSDM: notes } : s
      )
    )
    api.skp.reviewSDM(skpId, 'approve', notes).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleRejectSKPBySDM = (skpId: string, notes: string) => {
    setSkpList(
      skpList.map((s) =>
        s.id === skpId ? { ...s, status: 'Perlu Revisi', catatanSDM: notes } : s
      )
    )
    api.skp.reviewSDM(skpId, 'reject', notes).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleApproveSKPByKaprodi = (skpId: string, notes: string, ttdUrl?: string) => {
    const existing = skpList.find((s) => s.id === skpId)
    if (!existing) {
      showToast('Data pengajuan SKP tidak ditemukan di database.', 'error')
      return
    }

    // Resolusi TTD Penilai (Kaprodi) dan Dosen yang dinilai otomatis dari profil
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdKaprodiUrl || demoUsers.kaprodi?.signatureUrl
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || demoUsers.dosen?.signatureUrl

    const updated: PengajuanSKP = {
      ...existing,
      status: 'Dinilai Kaprodi',
      catatanKaprodi: notes,
      ttdKaprodiUrl: reviewerTtd,
      ttdDosenUrl: dosenTtd,
      tanggalPenilaianKaprodi: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    setSkpList(skpList.map((s) => (s.id === skpId ? updated : s)))
    api.skp.reviewKaprodi(skpId, 'approve', notes, reviewerTtd).catch((err) => console.warn('Sync review Kaprodi gagal:', err))
  }

  const handleRejectSKPByKaprodi = (skpId: string, notes: string) => {
    setSkpList(
      skpList.map((s) =>
        s.id === skpId ? { ...s, status: 'Perlu Revisi', catatanKaprodi: notes } : s
      )
    )
    api.skp.reviewKaprodi(skpId, 'reject', notes).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleApproveSKPByDekan = (skpId: string, notes: string, ttdUrl?: string) => {
    const existing = skpList.find((s) => s.id === skpId)
    if (!existing) {
      showToast('Data pengajuan SKP tidak ditemukan di database.', 'error')
      return
    }

    // Resolusi TTD Penilai (Dekan) dan Dosen/Ka.Prodi yang dinilai otomatis dari profil
    const reviewerTtd = ttdUrl || currentUser.signatureUrl || existing.ttdDekanUrl || demoUsers.dekan?.signatureUrl
    const dosenObj = dosenList.find((d) => d.id === existing.dosenId || d.nip === existing.dosenNip)
    const dosenTtd = existing.ttdDosenUrl || dosenObj?.signatureUrl || demoUsers.kaprodi?.signatureUrl || demoUsers.dosen?.signatureUrl

    const updated: PengajuanSKP = {
      ...existing,
      status: 'Dinilai Dekan',
      catatanDekan: notes,
      ttdDekanUrl: reviewerTtd,
      ttdDosenUrl: dosenTtd,
      tanggalPenilaianDekan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    setSkpList(skpList.map((s) => (s.id === skpId ? updated : s)))
    api.skp.reviewDekan(skpId, 'approve', notes, reviewerTtd).catch((err) => console.warn('Sync review Dekan gagal:', err))
  }

  const handleRejectSKPByDekan = (skpId: string, notes: string) => {
    setSkpList(
      skpList.map((s) =>
        s.id === skpId ? { ...s, status: 'Perlu Revisi', catatanDekan: notes } : s
      )
    )
    api.skp.reviewDekan(skpId, 'reject', notes).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
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

  const handleAddPenilaian = (item: PenilaianKuesioner) => {
    const existing = penilaianList.find(
      (p) =>
        p.id === item.id ||
        (p.dosenId === item.dosenId && p.tahun === item.tahun && p.periode === item.periode)
    )

    setPenilaianList((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.id === item.id ||
          (p.dosenId === item.dosenId && p.tahun === item.tahun && p.periode === item.periode)
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = item
        return copy
      }
      return [item, ...prev]
    })

    if (existing) {
      api.penilaian.update(existing.id, item).catch(() => {
        api.penilaian.create(item).catch(() => {})
      })
    } else {
      api.penilaian.create(item).catch(() => {})
    }
  }

  const handleUpdateMySKP = (updated: PengajuanSKP) => {
    const exists = skpList.some((s) => s.id === updated.id)
    if (exists) {
      setSkpList(skpList.map((s) => (s.id === updated.id ? updated : s)))
      api.skp.update(updated.id, updated).catch((err) => console.warn('Sync update SKP gagal:', err))
    } else {
      setSkpList([updated, ...skpList])
      api.skp.create(updated).catch((err) => console.warn('Sync create SKP gagal:', err))
    }
  }

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    api.notifications.markAsRead(id).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />
  }

  const dosenMySKP =
    skpList.find((s) => s.dosenId === currentUser.id && s.semester === 'Genap') ||
    skpList.find((s) => s.dosenId === currentUser.id) ||
    skpList[0]

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
          onShowToast={showToast}
        />

        <main ref={mainRef} className="app-main">
          {isInitialLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {activeNav === 'profil' && (
                <ProfilView
              user={currentUser}
              onShowToast={showToast}
              onUpdateUser={(updated) => {
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

          {activeNav !== 'profil' && currentRole === 'sdm' && (
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
                  onAddDosen={handleAddDosen}
                  onUpdateDosen={handleUpdateDosen}
                  onDeleteDosen={handleDeleteDosen}
                  onAddProdi={handleAddProdi}
                  onUpdateProdi={handleUpdateProdi}
                  onDeleteProdi={handleDeleteProdi}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'komponen-skp' && (
                <KelolaKomponenSKP
                  komponenList={komponenList}
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

          {activeNav !== 'profil' && currentRole === 'dosen' && (
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

          {activeNav !== 'profil' && currentRole === 'kaprodi' && (
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

          {activeNav !== 'profil' && currentRole === 'dekan' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDekan
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
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
                  onApproveByDekan={handleApproveSKPByDekan}
                  onRejectByDekan={handleRejectSKPByDekan}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'kuesioner-dekan' && (
                <CekHasilKuesionerDekan
                  user={currentUser}
                  dosenList={dosenList}
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
