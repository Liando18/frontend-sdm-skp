/**
 * Security and URL sanitization utilities
 * Portal SDM Universitas Bhakti Kencana
 */

/**
 * Sanitizes URLs to prevent javascript: and malicious protocols (XSS Protection)
 * Ensures user-entered links in SKP, evidence documents, and external links are safe.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url) return '#'
  const trimmed = url.trim()

  // Disallow dangerous URI schemes (XSS prevention)
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    // Only allow data: for safe base64/svg images
    if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed) || /^data:image\/svg\+xml;utf8,/i.test(trimmed)) {
      return trimmed
    }
    return '#'
  }

  // Allow standard web protocols
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed
  }

  // Auto-prepend https:// if domain-like string (e.g., "drive.google.com/...") safely without ReDoS
  try {
    const parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : `https://${trimmed}`)
    if (parsed.hostname.includes('.') && !parsed.hostname.startsWith('.') && !parsed.hostname.endsWith('.')) {
      return `https://${trimmed.replace(/^\/\//, '')}`
    }
  } catch {
    // Fall through
  }

  // Internal relative paths
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  return '#'
}

/**
 * Safe ID generator outside component render scope (React 19 pure component compliant)
 */
export function generateEntityId(prefix: string): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${timestamp}-${randomPart}`
}

/**
 * Resolves storage URLs (e.g. /storage/signatures/...) to full loadable URLs
 * Supports data URIs, absolute URLs, and relative backend paths.
 */
export function resolveStorageUrl(url?: string | null): string {
  if (!url) return ''
  const trimmed = url.trim()

  if (trimmed.startsWith('data:image/svg+xml') && (trimmed.includes('<svg') || trimmed.includes('<path'))) {
    // Pastikan SVG data URI terenkode secara aman agar dirender sempurna oleh seluruh browser (Chrome, Safari, Firefox)
    const cleanSvg = trimmed.replace(/^data:image\/svg\+xml;?(utf8)?,?/i, '')
    try {
      const decoded = decodeURIComponent(cleanSvg)
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(decoded)}`
    } catch {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`
    }
  }

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const backendOrigin = apiBase.replace(/\/api\/?$/, '')
  return `${backendOrigin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

/**
 * Resolves avatar image source URL with clean fallback to /user.svg.
 * If user has not uploaded a photo yet (or avatar is null/empty/initials), cleanly displays /user.svg.
 */
export function getAvatarSrc(avatar?: string | null): string {
  if (!avatar || typeof avatar !== 'string') return '/user.svg'
  const trimmed = avatar.trim()
  if (!trimmed) return '/user.svg'

  // If it's a data URL, blob, absolute URL, or local storage/image path
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/storage/') ||
    trimmed.startsWith('storage/') ||
    trimmed.startsWith('/user.') ||
    trimmed.startsWith('user.') ||
    /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(trimmed)
  ) {
    if (
      trimmed.startsWith('/user.svg') ||
      trimmed === 'user.svg' ||
      trimmed.startsWith('/user.png') ||
      trimmed === 'user.png'
    ) {
      return '/user.svg'
    }
    return resolveStorageUrl(trimmed)
  }

  // Otherwise, treat initials or missing photo as default /user.svg
  return '/user.svg'
}
