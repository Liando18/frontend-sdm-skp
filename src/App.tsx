import React, { useState, useRef, useEffect } from 'react'
import { Role, UserSession, Dosen, KomponenSKP, PengajuanSKP, IndikatorKuesioner, PenilaianKuesioner, NotificationItem } from './types'
import { useViewTransition } from './utils/animations'
import { api } from './services/api'
import {
  DEMO_USERS,
  INITIAL_DOSEN,
  INITIAL_KOMPONEN,
  INITIAL_PENGAJUAN_SKP,
  INITIAL_INDIKATOR,
  INITIAL_PENILAIAN_KUESIONER,
  INITIAL_NOTIFICATIONS,
} from './data'
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

  const [dosenList, setDosenList] = useState<Dosen[]>(INITIAL_DOSEN)
  const [komponenList, setKomponenList] = useState<KomponenSKP[]>(INITIAL_KOMPONEN)
  const [skpList, setSkpList] = useState<PengajuanSKP[]>(INITIAL_PENGAJUAN_SKP)
  const [indikatorList, setIndikatorList] = useState<IndikatorKuesioner[]>(INITIAL_INDIKATOR)
  const [penilaianList, setPenilaianList] = useState<PenilaianKuesioner[]>(INITIAL_PENILAIAN_KUESIONER)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')

  // Load data from Laravel 12 Backend API on mount
  useEffect(() => {
    let isMounted = true
    const initDataFromApi = async () => {
      try {
        const [dosenData, komponenData, skpData, indikatorData, penilaianData, notifData] = await Promise.all([
          api.dosen.list().catch(() => null),
          api.komponen.list().catch(() => null),
          api.skp.list().catch(() => null),
          api.indikator.list().catch(() => null),
          api.penilaian.list().catch(() => null),
          api.notifications.list().catch(() => null),
        ])

        if (!isMounted) return

        if (dosenData && Array.isArray(dosenData) && dosenData.length > 0) {
          setDosenList(dosenData)
          setBackendStatus('connected')
        } else {
          setBackendStatus('offline')
        }

        if (komponenData && Array.isArray(komponenData) && komponenData.length > 0) setKomponenList(komponenData)
        if (skpData && Array.isArray(skpData) && skpData.length > 0) setSkpList(skpData)
        if (indikatorData && Array.isArray(indikatorData) && indikatorData.length > 0) setIndikatorList(indikatorData)
        if (penilaianData && Array.isArray(penilaianData) && penilaianData.length > 0) setPenilaianList(penilaianData)
        if (notifData && Array.isArray(notifData) && notifData.length > 0) setNotifications(notifData)
      } catch (err) {
        if (isMounted) setBackendStatus('offline')
      }
    }

    initDataFromApi()
    return () => {
      isMounted = false
    }
  }, [])

  const currentUser: UserSession = DEMO_USERS[currentRole] || DEMO_USERS['sdm']

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
    showToast(`Beralih ke mode ${role.toUpperCase()} (${DEMO_USERS[role].name})`)
  }

  const handleLogin = (role: Role) => {
    setCurrentRole(role)
    setActiveNav('dashboard')
    setIsLoggedIn(true)
    showToast(`Berhasil masuk sebagai ${role.toUpperCase()}`)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
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

  const handleAddKomponen = (item: KomponenSKP) => {
    setKomponenList([...komponenList, item])
    api.komponen.create(item).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleUpdateKomponen = (updated: KomponenSKP) => {
    setKomponenList(komponenList.map((k) => (k.id === updated.id ? updated : k)))
    api.komponen.update(updated.id, updated).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleDeleteKomponen = (id: string) => {
    setKomponenList(komponenList.filter((k) => k.id !== id))
    api.komponen.delete(id).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
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
    setSkpList(
      skpList.map((s) =>
        s.id === skpId
          ? {
              ...s,
              status: 'Dinilai Kaprodi',
              catatanKaprodi: notes,
              ttdKaprodiUrl: ttdUrl || s.ttdKaprodiUrl,
              tanggalPenilaianKaprodi: '20 Oktober 2026',
            }
          : s
      )
    )
    api.skp.reviewKaprodi(skpId, 'approve', notes, ttdUrl).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
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
    setSkpList(
      skpList.map((s) =>
        s.id === skpId
          ? {
              ...s,
              status: 'Dinilai Dekan',
              catatanDekan: notes,
              ttdDekanUrl: ttdUrl || s.ttdDekanUrl,
              tanggalPenilaianDekan: '23 Oktober 2026',
            }
          : s
      )
    )
    api.skp.reviewDekan(skpId, 'approve', notes, ttdUrl).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleRejectSKPByDekan = (skpId: string, notes: string) => {
    setSkpList(
      skpList.map((s) =>
        s.id === skpId ? { ...s, status: 'Perlu Revisi', catatanDekan: notes } : s
      )
    )
    api.skp.reviewDekan(skpId, 'reject', notes).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleAddIndikator = (item: IndikatorKuesioner) => {
    setIndikatorList([...indikatorList, item])
    api.indikator.create(item).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleUpdateIndikator = (updated: IndikatorKuesioner) => {
    setIndikatorList(indikatorList.map((i) => (i.id === updated.id ? updated : i)))
    api.indikator.update(updated.id, updated).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleDeleteIndikator = (id: string) => {
    setIndikatorList(indikatorList.filter((i) => i.id !== id))
    api.indikator.delete(id).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleAddPenilaian = (item: PenilaianKuesioner) => {
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
    api.penilaian.create(item).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
  }

  const handleUpdateMySKP = (updated: PengajuanSKP) => {
    setSkpList(skpList.map((s) => (s.id === updated.id ? updated : s)))
    api.skp.update(updated.id, updated).catch((err) => console.warn('Sync ke backend gagal (offline):', err))
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
                  onSelectSKPToReview={() => setActiveNav('skp-dosen')}
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'skp-sdm-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
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
                  onAddDosen={handleAddDosen}
                  onUpdateDosen={handleUpdateDosen}
                  onDeleteDosen={handleDeleteDosen}
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
                  onNavigateToSKP={() => setActiveNav('skp-dosen-self')}
                  onNavigateToHasilKinerja={() => setActiveNav('hasil-kinerja-dosen')}
                />
              )}
              {activeNav === 'skp-dosen-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
                  mySKP={dosenMySKP}
                  komponenList={komponenList}
                  onUpdateSKP={handleUpdateMySKP}
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
                  onNavigateToSKP={() => setActiveNav('skp-kaprodi-self')}
                  onNavigateToReview={() => setActiveNav('review-skp-kaprodi')}
                  onNavigateToKuesioner={() => setActiveNav('kuesioner-kaprodi')}
                  onNavigateToHasilKinerjaSelf={() => setActiveNav('hasil-kinerja-kaprodi')}
                  onSelectSKP={() => setActiveNav('review-skp-kaprodi')}
                />
              )}
              {activeNav === 'skp-kaprodi-self' && (
                <KelolaSKPDosenSelf
                  user={currentUser}
                  skpList={skpList}
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
                  onShowToast={showToast}
                />
              )}
              {activeNav === 'review-skp-kaprodi' && (
                <ReviewSKPKaprodi
                  user={currentUser}
                  skpList={skpList}
                  dosenList={dosenList}
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
