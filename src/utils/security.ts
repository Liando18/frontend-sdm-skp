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

  // Auto-prepend https:// if domain-like string (e.g., "drive.google.com/...")
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`
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
