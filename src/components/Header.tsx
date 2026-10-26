import React, { useState } from 'react'
import {
  Search,
  Bell,
  Mail,
  Menu,
  ChevronDown,
  Check,
  LogOut,
  Shield,
  GraduationCap,
  Users,
  Building2,
} from 'lucide-react'
import { UserSession, Role, NotificationItem } from '../types'

interface HeaderProps {
  user: UserSession
  notifications: NotificationItem[]
  onToggleSidebar: () => void
  onOpenCommandPalette: () => void
  onSwitchRole: (role: Role) => void
  onLogout: () => void
  onMarkNotificationAsRead: (id: string) => void
  onShowToast?: (msg: string) => void
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  onToggleSidebar,
  onOpenCommandPalette,
  onSwitchRole,
  onLogout,
  onMarkNotificationAsRead,
  onShowToast,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMessageClick = () => {
    if (onShowToast) {
      onShowToast('Pesan & komunikasi internal kepegawaian tersinkronisasi.')
    }
  }

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
        style={{ cursor: 'pointer', flex: '1 1 240px', maxWidth: '420px', minWidth: '140px' }}
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
        <kbd className="search__kbd">
          <span>⌘</span>K
        </kbd>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Role Quick Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--panel-hover)',
            border: '1px solid var(--hair)',
            borderRadius: 'var(--r-md)',
            padding: '2px',
            gap: 2,
          }}
        >
          <button
            onClick={() => onSwitchRole('sdm')}
            title="Beralih ke Portal Admin SDM"
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: user.role === 'sdm' ? '#ffffff' : 'transparent',
              color: user.role === 'sdm' ? 'var(--navy-900)' : 'var(--muted)',
              boxShadow: user.role === 'sdm' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s var(--ease)',
            }}
          >
            <Shield size={12} />
            <span>SDM</span>
          </button>
          <button
            onClick={() => onSwitchRole('dosen')}
            title="Beralih ke Portal Dosen"
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: user.role === 'dosen' ? '#ffffff' : 'transparent',
              color: user.role === 'dosen' ? 'var(--navy-900)' : 'var(--muted)',
              boxShadow: user.role === 'dosen' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s var(--ease)',
            }}
          >
            <GraduationCap size={12} />
            <span>Dosen</span>
          </button>
          <button
            onClick={() => onSwitchRole('kaprodi')}
            title="Beralih ke Portal Kaprodi"
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: user.role === 'kaprodi' ? '#ffffff' : 'transparent',
              color: user.role === 'kaprodi' ? 'var(--navy-900)' : 'var(--muted)',
              boxShadow: user.role === 'kaprodi' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s var(--ease)',
            }}
          >
            <Users size={12} />
            <span>Kaprodi</span>
          </button>
          <button
            onClick={() => onSwitchRole('dekan')}
            title="Beralih ke Portal Dekan"
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: user.role === 'dekan' ? '#ffffff' : 'transparent',
              color: user.role === 'dekan' ? 'var(--navy-900)' : 'var(--muted)',
              boxShadow: user.role === 'dekan' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s var(--ease)',
            }}
          >
            <Building2 size={12} />
            <span>Dekan</span>
          </button>
        </div>

        {/* Communication Sync */}
        <button
          className="icon-btn"
          title="Sinkronisasi Komunikasi Internal"
          onClick={handleMessageClick}
          aria-label="Pesan internal"
        >
          <Mail size={16} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="Pemberitahuan Sistem"
            onClick={() => setShowNotifications(!showNotifications)}
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
                {notifications.map((n) => (
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
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
                {user.role === 'sdm' ? 'Admin SDM' : user.role === 'dosen' ? 'Dosen' : 'Kaprodi'}
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
                width: 240,
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

              <div style={{ padding: '4px 0' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onSwitchRole('sdm')
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--ink)',
                  }}
                >
                  <span>Portal Admin SDM</span>
                  {user.role === 'sdm' && <Check size={14} color="var(--brand-600)" />}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onSwitchRole('dosen')
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--ink)',
                  }}
                >
                  <span>Portal Dosen</span>
                  {user.role === 'dosen' && <Check size={14} color="var(--brand-600)" />}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onSwitchRole('kaprodi')
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--ink)',
                  }}
                >
                  <span>Portal Kaprodi</span>
                  {user.role === 'kaprodi' && <Check size={14} color="var(--brand-600)" />}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onSwitchRole('dekan')
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--ink)',
                  }}
                >
                  <span>Portal Dekan</span>
                  {user.role === 'dekan' && <Check size={14} color="var(--brand-600)" />}
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
