import React, { useState, useRef } from 'react'
import {
  LayoutDashboard,
  Users,
  Sliders,
  FileCheck2,
  CheckSquare2,
  Award,
  FileBarChart,
  HelpCircle,
  LogOut,
  X,
  FileText,
  UserCheck,
  ChevronRight,
  Building2,
  User,
} from 'lucide-react'
import { Role } from '../types'
import { useStaggerEntrance } from '../utils/animations'

interface SidebarProps {
  currentRole: Role
  activeNav: string
  isOpen: boolean
  onClose: () => void
  onSelectNav: (navId: string) => void
  onLogout: () => void
  onOpenHelp: () => void
}

export type NavItem =
  | {
      type: 'link'
      id: string
      label: string
      icon: React.ComponentType<{ size?: number; className?: string }>
    }
  | {
      type: 'group'
      id: string
      title: string
      icon: React.ComponentType<{ size?: number; className?: string }>
      items: {
        id: string
        label: string
        icon: React.ComponentType<{ size?: number; className?: string }>
      }[]
    }

// SDM Nav Groups
const sdmNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  {
    type: 'group',
    id: 'sdm-kinerja-saya',
    title: 'Kinerja Saya',
    icon: UserCheck,
    items: [
      { id: 'skp-sdm-self', label: 'Sasaran Kinerja Pegawai (SKP)', icon: FileText },
      { id: 'hasil-kinerja-sdm', label: 'Hasil Kinerja Tahunan', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'sdm-monitoring',
    title: 'Monitoring & Verifikasi',
    icon: FileCheck2,
    items: [
      { id: 'skp-dosen', label: 'Monitoring & Verifikasi SKP', icon: FileCheck2 },
      { id: 'penilaian-kuesioner', label: 'Monitoring Kinerja Tahunan', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'sdm-master',
    title: 'Master & Laporan',
    icon: Sliders,
    items: [
      { id: 'data-dosen', label: 'Data Kepegawaian Dosen', icon: Users },
      { id: 'komponen-skp', label: 'Master Komponen SKP', icon: Sliders },
      { id: 'indikator-kuesioner', label: 'Master Indikator Kinerja', icon: CheckSquare2 },
      { id: 'laporan', label: 'Laporan & Rekapitulasi Institusi', icon: FileBarChart },
    ],
  },
  {
    type: 'group',
    id: 'sdm-akun',
    title: 'Pengaturan Akun',
    icon: User,
    items: [
      { id: 'profil', label: 'Profil & Keamanan', icon: User },
    ],
  },
]

// Dosen Nav Groups
const dosenNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  {
    type: 'group',
    id: 'dosen-kinerja',
    title: 'Kinerja Pegawai',
    icon: UserCheck,
    items: [
      { id: 'skp-dosen-self', label: 'Sasaran Kinerja Pegawai (SKP)', icon: FileText },
      { id: 'hasil-kinerja-dosen', label: 'Hasil Kinerja Tahunan', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'dosen-akun',
    title: 'Pengaturan Akun',
    icon: User,
    items: [
      { id: 'profil', label: 'Profil & Keamanan', icon: User },
    ],
  },
]

// Kaprodi Nav Groups
const kaprodiNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  {
    type: 'group',
    id: 'kaprodi-kinerja-saya',
    title: 'Kinerja Saya',
    icon: UserCheck,
    items: [
      { id: 'skp-kaprodi-self', label: 'Sasaran Kinerja Pegawai (SKP)', icon: FileText },
      { id: 'hasil-kinerja-kaprodi', label: 'Hasil Kinerja Tahunan', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'kaprodi-dosen',
    title: 'Manajemen Dosen Homebase',
    icon: Users,
    items: [
      { id: 'review-skp-kaprodi', label: 'Verifikasi SKP Dosen', icon: UserCheck },
      { id: 'kuesioner-kaprodi', label: 'Evaluasi Kinerja Dosen', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'kaprodi-akun',
    title: 'Pengaturan Akun',
    icon: User,
    items: [
      { id: 'profil', label: 'Profil & Keamanan', icon: User },
    ],
  },
]

// Dekan Nav Groups
const dekanNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  {
    type: 'group',
    id: 'dekan-kinerja-saya',
    title: 'Kinerja Saya',
    icon: UserCheck,
    items: [
      { id: 'skp-dekan-self', label: 'Sasaran Kinerja Pegawai (SKP)', icon: FileText },
      { id: 'hasil-kinerja-dekan', label: 'Hasil Kinerja Tahunan', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'dekan-prodi',
    title: 'Pengawasan Program Studi',
    icon: Building2,
    items: [
      { id: 'review-skp-dekan', label: 'Verifikasi SKP Ketua Program Studi', icon: UserCheck },
      { id: 'kuesioner-dekan', label: 'Evaluasi Kinerja Ketua Program Studi', icon: Award },
    ],
  },
  {
    type: 'group',
    id: 'dekan-akun',
    title: 'Pengaturan Akun',
    icon: User,
    items: [
      { id: 'profil', label: 'Profil & Keamanan', icon: User },
    ],
  },
]

const getRoleNavItems = (role: Role): NavItem[] => {
  switch (role) {
    case 'sdm':
      return sdmNavItems
    case 'dosen':
      return dosenNavItems
    case 'kaprodi':
      return kaprodiNavItems
    case 'dekan':
      return dekanNavItems
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeNav,
  isOpen,
  onClose,
  onSelectNav,
  onLogout,
  onOpenHelp,
}) => {
  const navItems = getRoleNavItems(currentRole)

  // Track user manual toggles
  const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({})

  // Reset toggled overrides when role changes without cascading useEffect render
  const [prevRole, setPrevRole] = useState(currentRole)
  if (prevRole !== currentRole) {
    setPrevRole(currentRole)
    setToggledGroups({})
  }

  const isGroupOpen = (entry: Extract<NavItem, { type: 'group' }>) => {
    if (typeof toggledGroups[entry.id] === 'boolean') {
      return toggledGroups[entry.id]
    }
    const containsActive = entry.items.some((it) => it.id === activeNav)
    if (containsActive) return true
    const groups = navItems.filter((it): it is Extract<NavItem, { type: 'group' }> => it.type === 'group')
    return groups.length <= 2
  }

  const toggleGroup = (groupId: string) => {
    const group = navItems.find((it): it is Extract<NavItem, { type: 'group' }> => it.type === 'group' && it.id === groupId)
    const currentlyOpen = group ? isGroupOpen(group) : false
    setToggledGroups((prev) => ({
      ...prev,
      [groupId]: !currentlyOpen,
    }))
  }

  const navRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(navRef, '.nav__link, .nav__group-header', [currentRole], { y: 6, stagger: 0.03, duration: 0.22 })

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 90,
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* Pinned Header */}
        <div className="sidebar__header">
          <div className="sidebar__top">
            <div className="brand" style={{ gap: 10 }}>
              <img
                src="/logo.png"
                alt="Logo Universitas Bhakti Kencana"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                }}
              />
              <div>
                <div className="brand__name" style={{ fontSize: '15.5px', lineHeight: 1.2 }}>
                  SDM Portal
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                  Universitas Bhakti Kencana
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="icon-btn sidebar__close"
              style={{ display: isOpen ? 'grid' : 'none', width: 32, height: 32 }}
              aria-label="Tutup navigasi"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Body */}
        <div className="sidebar__body">
          <nav className="nav">
            <div className="nav__label">Menu Utama</div>
            <div className="sidebar__navs" ref={navRef}>
              {navItems.map((entry) => {
                if (entry.type === 'link') {
                  const Icon = entry.icon
                  const isActive = activeNav === entry.id
                  return (
                    <button
                      key={entry.id}
                      className="nav__link"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        onSelectNav(entry.id)
                        onClose()
                      }}
                    >
                      <Icon size={17} />
                      <span>{entry.label}</span>
                    </button>
                  )
                }

                // Group with Submenu
                const GroupIcon = entry.icon
                const isOpenGroup = isGroupOpen(entry)
                const hasActiveChild = entry.items.some((it) => it.id === activeNav)

                return (
                  <div key={entry.id} className="nav__group">
                    <button
                      type="button"
                      className={`nav__group-header ${hasActiveChild ? 'has-active' : ''} ${
                        isOpenGroup ? 'is-open' : ''
                      }`}
                      onClick={() => toggleGroup(entry.id)}
                    >
                      <div className="group-title">
                        <GroupIcon size={16} />
                        <span>{entry.title}</span>
                      </div>
                      <ChevronRight size={14} className="group-chevron" />
                    </button>

                    {isOpenGroup && (
                      <div className="nav__submenu">
                        {entry.items.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = activeNav === subItem.id
                          return (
                            <button
                              key={subItem.id}
                              className="nav__sublink"
                              aria-current={isSubActive ? 'page' : undefined}
                              onClick={() => {
                                onSelectNav(subItem.id)
                                onClose()
                              }}
                            >
                              <SubIcon size={15} />
                              <span>{subItem.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Pinned Footer */}
        <div className="sidebar__footer">
          <div className="nav__label">Bantuan &amp; Sesi</div>
          <button
            className="nav__link"
            onClick={onOpenHelp}
          >
            <HelpCircle size={18} />
            <span>Panduan SPMI &amp; FAQ</span>
          </button>
          <button
            className="nav__link"
            onClick={onLogout}
            style={{
              color: 'var(--status-danger-ink)',
            }}
          >
            <LogOut size={18} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  )
}
