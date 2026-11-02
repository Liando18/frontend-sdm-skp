import { UserSession, Role } from '../types'

export const AUTH_TOKEN_KEY = 'ubk_auth_token'
export const USER_SESSION_KEY = 'ubk_user_session'
export const CURRENT_ROLE_KEY = 'ubk_current_role'
export const REMEMBER_ME_KEY = 'ubk_remember_me'
export const UNAUTHORIZED_EVENT = 'ubk:auth:unauthorized'

/**
 * Memeriksa apakah opsi Ingat Saya aktif
 */
export function isRememberMeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false'
}

/**
 * Mengambil token autentikasi aktif dari localStorage atau sessionStorage
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null
}

/**
 * Mengambil data sesi pengguna aktif dari localStorage atau sessionStorage
 */
export function getStoredUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.name && parsed.role) {
      return parsed as UserSession
    }
  } catch {
    return null
  }
  return null
}

/**
 * Mengambil peran (role) pengguna aktif dari localStorage atau sessionStorage
 */
export function getStoredCurrentRole(): Role | null {
  if (typeof window === 'undefined') return null
  const role = (localStorage.getItem(CURRENT_ROLE_KEY) || sessionStorage.getItem(CURRENT_ROLE_KEY)) as Role | null
  if (role && ['sdm', 'dosen', 'kaprodi', 'dekan'].includes(role)) {
    return role
  }
  return null
}

/**
 * Menyimpan token autentikasi sesuai preferensi Ingat Saya
 */
export function saveAuthToken(token: string, rememberMe = true): void {
  if (typeof window === 'undefined') return
  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

/**
 * Menyimpan data sesi dan peran pengguna sesuai preferensi Ingat Saya
 */
export function saveUserSession(user: UserSession, role?: Role, rememberMe?: boolean): void {
  if (typeof window === 'undefined') return
  const isRemember = rememberMe !== undefined ? rememberMe : isRememberMeEnabled()
  const activeRole = role || user.role

  if (isRemember) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
    if (activeRole) localStorage.setItem(CURRENT_ROLE_KEY, activeRole)
    sessionStorage.removeItem(USER_SESSION_KEY)
    sessionStorage.removeItem(CURRENT_ROLE_KEY)
  } else {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
    if (activeRole) sessionStorage.setItem(CURRENT_ROLE_KEY, activeRole)
    localStorage.removeItem(USER_SESSION_KEY)
    localStorage.removeItem(CURRENT_ROLE_KEY)
  }
}

/**
 * Membersihkan seluruh token dan data sesi dari penyimpanan browser
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_SESSION_KEY)
  localStorage.removeItem(CURRENT_ROLE_KEY)
  localStorage.removeItem('ubk_saved_identifier')
  localStorage.removeItem('ubk_remember_me')
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(USER_SESSION_KEY)
  sessionStorage.removeItem(CURRENT_ROLE_KEY)
}

/**
 * Memicu event 401 Unauthorized secara global untuk mengunci dashboard seketika
 */
export function dispatchUnauthorized(message = 'Sesi Anda telah berakhir, silakan masuk kembali.'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(UNAUTHORIZED_EVENT, {
      detail: { message },
    })
  )
}

/**
 * Berlangganan event 401 Unauthorized
 */
export function onUnauthorized(callback: (message: string) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ message?: string }>
    const msg = customEvent.detail?.message || 'Sesi Anda telah berakhir, silakan masuk kembali.'
    callback(msg)
  }
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => {
    window.removeEventListener(UNAUTHORIZED_EVENT, handler)
  }
}
