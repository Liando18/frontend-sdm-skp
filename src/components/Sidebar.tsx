import React, { useState, useEffect, useRef } from 'react'
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
  ShieldCheck,
  Building2,
  FolderOpen,
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
  { type: 'link', id: 'dashboard', label: 'Beranda Eksekutif', icon: LayoutDashboard },
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
]

// Dosen Nav Groups
const dosenNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda Dosen', icon: LayoutDashboard },
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
]

// Kaprodi Nav Groups
const kaprodiNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda Program Studi', icon: LayoutDashboard },
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
]

// Dekan Nav Groups
const dekanNavItems: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Beranda Fakultas', icon: LayoutDashboard },
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

const getInitialOpenGroups = (role: Role, active: string): Record<string, boolean> => {
  const items = getRoleNavItems(role)
  const groups = items.filter((it): it is Extract<NavItem, { type: 'group' }> => it.type === 'group')
  const groupCount = groups.length

  // Rule: Jika pada role tersebut ada lebih dari 2 sub menu (> 2), defaultnya TUTUP.
  // Kalau hanya 1 atau 2 (<= 2), defaultnya BUKA.
  const isDefaultOpen = groupCount <= 2

  const state: Record<string, boolean> = {}
  groups.forEach((g) => {
    const containsActive = g.items.some((it) => it.id === active)
    state[g.id] = isDefaultOpen ? true : containsActive
  })

  return state
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

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenGroups(currentRole, activeNav)
  )

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // When role changes, recalculate default open groups according to role's group count rule
  useEffect(() => {
    setOpenGroups(getInitialOpenGroups(currentRole, activeNav))
  }, [currentRole])

  // Automatically keep group open if activeNav is in that group
  useEffect(() => {
    navItems.forEach((entry) => {
      if (entry.type === 'group') {
        const containsActive = entry.items.some((it) => it.id === activeNav)
        if (containsActive) {
          setOpenGroups((prev) => ({ ...prev, [entry.id]: true }))
        }
      }
    })
  }, [activeNav])

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

          <div style={{ padding: '0 20px', marginTop: 14 }}>
            <div
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
                color: 'var(--navy-900)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--brand-600)',
                }}
              />
              {currentRole === 'sdm'
                ? 'Direktorat SDM'
                : currentRole === 'dosen'
                ? 'Portal Dosen'
                : currentRole === 'kaprodi'
                ? 'Portal Kaprodi'
                : 'Portal Dekan'}
            </div>
          </div>
        </div>

        {/* Scrollable Middle Body */}
        <div className="sidebar__body">
          <nav className="nav">
            <div className="nav__label">Menu {currentRole.toUpperCase()}</div>
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
                const isOpenGroup = Boolean(openGroups[entry.id])
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
