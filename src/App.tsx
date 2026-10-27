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
import { HelpModal } from './components/HelpModal'

export default function App() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const paramRole = searchParams?.get('role') as Role | null
  const paramNav = searchParams?.get('nav')
  const paramLoggedIn = searchParams?.get('logged_in')

  const [isLoggedIn, setIsLoggedIn] = useState(paramLoggedIn === 'true')
  const [currentRole, setCurrentRole] = useState<Role>(
    paramRole && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(paramRole) ? paramRole : 'sdm'
  )
  const [activeNav, setActiveNav] = useState<string>(paramNav || 'dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  useViewTransition(mainRef, [activeNav, currentRole])

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')

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
      } catch (err) {
        if (isMounted) setBackendStatus('offline')
      }
    }

    initDataFromApi()
    return () => {
      isMounted = false
    }
  }, [])

  const currentUser: UserSession = demoUsers[currentRole] || DEMO_USERS[currentRole] || DEMO_USERS['sdm']

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const handleSwitchRole = (role: Role) => {
    setCurrentRole(role)
    setActiveNav('dashboard')
    const userObj = demoUsers[role] || DEMO_USERS[role]
    showToast(`Beralih ke mode ${role.toUpperCase()} (${userObj?.name || role})`)
  }

  const handleLogin = async (role: Role, email?: string, password?: string) => {
    setCurrentRole(role)
    setActiveNav('dashboard')
    setIsLoggedIn(true)
    showToast(`Berhasil masuk sebagai ${role.toUpperCase()}`)
    try {
      await api.auth.login({ role, email, password })
    } catch (e) {
      console.warn('Backend login fallback:', e)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    api.auth.logout().catch(() => {})
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
    } catch (err: any) {
      showToast(`Gagal menambahkan program studi: ${err?.message || 'Error'}`, 'error')
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
    } catch (err: any) {
      showToast(`Gagal memperbarui program studi: ${err?.message || 'Error'}`, 'error')
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
    } catch (err: any) {
      showToast(`Gagal menghapus program studi: ${err?.message || 'Error'}`, 'error')
    }
  }

  const handleAddKomponen = async (item: KomponenSKP) => {
    try {
      const res = await api.komponen.create(item)
      const created = res?.data || item
      setKomponenList((prev) => [created, ...prev.filter((k) => k.id !== item.id && k.id !== created.id)])
      showToast(`Komponen SKP ${item.kode} berhasil disimpan ke basis data!`, 'success')
    } catch (err: any) {
      setKomponenList((prev) => [item, ...prev])
      showToast(`Komponen disimpan secara lokal: ${err?.message || ''}`, 'info')
    }
  }

  const handleUpdateKomponen = async (updated: KomponenSKP) => {
    try {
      const res = await api.komponen.update(updated.id, updated)
      const saved = res?.data || updated
      setKomponenList((prev) => prev.map((k) => (k.id === updated.id ? saved : k)))
      showToast(`Komponen SKP ${updated.kode} berhasil diperbarui di basis data!`, 'success')
    } catch (err: any) {
      setKomponenList((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
      showToast(`Komponen diperbarui secara lokal: ${err?.message || ''}`, 'info')
    }
  }

  const handleDeleteKomponen = async (id: string) => {
    try {
      await api.komponen.delete(id)
      setKomponenList((prev) => prev.filter((k) => k.id !== id))
      showToast('Komponen SKP berhasil dihapus dari basis data!', 'success')
    } catch (err: any) {
      setKomponenList((prev) => prev.filter((k) => k.id !== id))
      showToast(`Komponen dihapus secara lokal: ${err?.message || ''}`, 'info')
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
    const updated: PengajuanSKP = {
      ...existing,
      status: 'Dinilai Kaprodi',
      catatanKaprodi: notes,
      ttdKaprodiUrl: ttdUrl || existing.ttdKaprodiUrl,
      tanggalPenilaianKaprodi: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    setSkpList(skpList.map((s) => (s.id === skpId ? updated : s)))
    api.skp.reviewKaprodi(skpId, 'approve', notes, ttdUrl).catch((err) => console.warn('Sync review Kaprodi gagal:', err))
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
    const updated: PengajuanSKP = {
      ...existing,
      status: 'Dinilai Dekan',
      catatanDekan: notes,
      ttdDekanUrl: ttdUrl || existing.ttdDekanUrl,
      tanggalPenilaianDekan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    setSkpList(skpList.map((s) => (s.id === skpId ? updated : s)))
    api.skp.reviewDekan(skpId, 'approve', notes, ttdUrl).catch((err) => console.warn('Sync review Dekan gagal:', err))
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
    } catch (err: any) {
      console.error('Gagal menambahkan indikator ke database:', err)
      showToast('Gagal menyimpan indikator ke database: ' + (err.message || 'Koneksi terputus'))
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
    } catch (err: any) {
      console.error('Gagal memperbarui indikator di database:', err)
      showToast('Gagal memperbarui indikator di database: ' + (err.message || 'Koneksi terputus'))
      setIndikatorList(prevList)
      throw err
    }
  }

  const handleDeleteIndikator = async (id: string) => {
    const prevList = [...indikatorList]
    setIndikatorList((prev) => prev.filter((i) => i.id !== id))
    try {
      await api.indikator.delete(id)
    } catch (err: any) {
      console.error('Gagal menghapus indikator dari database:', err)
      showToast('Gagal menghapus indikator dari database: ' + (err.message || 'Koneksi terputus'))
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
        onSelectNav={(id) => setActiveNav(id)}
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
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onShowToast={showToast}
        />

        <main ref={mainRef} className="app-main">
          {currentRole === 'sdm' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardSDM
                  dosenList={dosenList}
                  skpList={skpList}
                  onNavigate={(v) => setActiveNav(v)}
                  onAddDosenModal={() => setActiveNav('data-dosen')}
                  onSelectSKPToReview={(skp) => {
                    setSelectedSKPForReview(skp)
                    setActiveNav('skp-dosen')
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

          {currentRole === 'dosen' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDosen
                  user={currentUser}
                  mySKP={dosenMySKP}
                  penilaianList={penilaianList}
                  onNavigateToSKP={() => setActiveNav('skp-dosen-self')}
                  onNavigateToHasilKinerja={() => setActiveNav('hasil-kinerja-dosen')}
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

          {currentRole === 'kaprodi' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardKaprodi
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  penilaianList={penilaianList}
                  onNavigateToSKP={() => setActiveNav('skp-kaprodi-self')}
                  onNavigateToReview={() => setActiveNav('review-skp-kaprodi')}
                  onNavigateToKuesioner={() => setActiveNav('kuesioner-kaprodi')}
                  onNavigateToHasilKinerjaSelf={() => setActiveNav('hasil-kinerja-kaprodi')}
                  onSelectSKP={(skp) => {
                    setSelectedSKPForReview(skp)
                    setActiveNav('review-skp-kaprodi')
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

          {currentRole === 'dekan' && (
            <>
              {activeNav === 'dashboard' && (
                <DashboardDekan
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
                  onNavigateToSKP={() => setActiveNav('skp-dekan-self')}
                  onNavigateToReview={() => setActiveNav('review-skp-dekan')}
                  onNavigateToEvaluasiKaprodi={() => setActiveNav('kuesioner-dekan')}
                  onNavigateToHasilKinerjaSelf={() => setActiveNav('hasil-kinerja-dekan')}
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
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentRole={currentRole}
        onSelectNav={(id) => setActiveNav(id)}
        onSwitchRole={handleSwitchRole}
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
