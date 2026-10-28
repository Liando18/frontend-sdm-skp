import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Check,
  LogOut,
  Shield,
  GraduationCap,
  Users,
  Building2,
  User,
} from 'lucide-react'
import { UserSession, Role, NotificationItem } from '../types'

interface HeaderProps {
  user: UserSession
  notifications: NotificationItem[]
  backendStatus?: 'checking' | 'connected' | 'offline'
  onToggleSidebar: () => void
  onOpenCommandPalette: () => void
  onSwitchRole?: (role: Role) => void
  onSelectNav?: (navId: string) => void
  onLogout: () => void
  onMarkNotificationAsRead: (id: string) => void
  onShowToast?: (msg: string) => void
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  onToggleSidebar,
  onOpenCommandPalette,
  onSelectNav,
  onLogout,
  onMarkNotificationAsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.read).length

  // Tutup dropdown notifikasi & menu profil saat klik di luar (Click-outside listener)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleDocumentClick)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [])

  return (
    <header className="topbar">
      <button
        onClick={onToggleSidebar}
        className="icon-btn"
        id="mobile-menu-btn"
        aria-label="Buka menu navigasi"
      >
        <Menu size={18} />
      </button>

      <div
        className="search"
        onClick={onOpenCommandPalette}
        style={{ cursor: 'pointer', flex: '1 1 200px', maxWidth: '380px', minWidth: '120px' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenCommandPalette()
        }}
        aria-label="Pencarian cepat"
      >
        <Search size={16} color="var(--muted)" />
        <span style={{ color: 'var(--muted)', fontSize: '13px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Cari dosen, berkas SKP, atau menu...
        </span>
        <kbd className="search__kbd hide-mobile">
          <span>⌘</span>K
        </kbd>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Indikator Role Aktif Pegawai (Sesuai Akun Login) */}
        <div
          className="hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--panel-hover)',
            border: '1px solid var(--hair)',
            borderRadius: 'var(--r-full)',
            padding: '4px 12px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--ink)',
          }}
        >
          {user.role === 'sdm' && <Shield size={13} style={{ color: 'var(--brand-600)' }} />}
          {user.role === 'dosen' && <GraduationCap size={13} style={{ color: 'var(--brand-600)' }} />}
          {user.role === 'kaprodi' && <Users size={13} style={{ color: 'var(--brand-600)' }} />}
          {user.role === 'dekan' && <Building2 size={13} style={{ color: 'var(--brand-600)' }} />}
          <span>
            {user.role === 'sdm' && 'Portal SDM (Admin)'}
            {user.role === 'dosen' && 'Portal Dosen'}
            {user.role === 'kaprodi' && 'Portal Kaprodi'}
            {user.role === 'dekan' && 'Portal Dekan'}
          </span>
        </div>

        {/* Notifikasi dengan click-outside dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="Pemberitahuan Sistem"
            onClick={() => setShowNotifications((prev) => !prev)}
            style={{ position: 'relative' }}
            aria-label="Notifikasi sistem"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--brand-600)',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="anim-modal"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--panel-bg)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--hair)',
                padding: '12px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--hair-subtle)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                  Notifikasi ({unreadCount} baru)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationAsRead(n.id)}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 'var(--r-sm)',
                        background: n.read ? 'transparent' : 'var(--brand-50)',
                        border: n.read ? '1px solid transparent' : '1px solid var(--brand-100)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{n.title}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--faint)' }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{n.desc || n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu dengan click-outside dropdown */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 8px 3px 3px',
              borderRadius: 'var(--r-full)',
              border: '1px solid var(--hair)',
              background: 'var(--panel-bg)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            aria-label="Menu akun pengguna"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--navy-900)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {user.avatar}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name.split(',')[0]}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                {user.role === 'sdm' ? 'Admin SDM' : user.role === 'dosen' ? 'Dosen' : user.role === 'kaprodi' ? 'Kaprodi' : 'Dekan'}
              </div>
            </div>
            <ChevronDown size={13} color="var(--muted)" />
          </button>

          {showUserMenu && (
            <div
              className="anim-modal"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 250,
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--panel-bg)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--hair)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--hair-subtle)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{user.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600, marginTop: 2 }}>{user.rank}</div>
              </div>

              {/* Tautan Profil & Ganti Sandi */}
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--hair-subtle)' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    if (onSelectNav) onSelectNav('profil')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--brand-700)',
                    fontWeight: 600,
                  }}
                >
                  <User size={14} />
                  <span>Profil Saya & Ganti Sandi</span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--hair-subtle)', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onLogout()
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: 'var(--status-danger-ink)',
                    borderRadius: 'var(--r-sm)',
                  }}
                >
                  <LogOut size={13} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
