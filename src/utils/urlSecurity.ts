/**
 * Utility keamanan URL dan tokenisasi parameter cetak dokumen resmi UBK.
 * Menggunakan format Base64URL yang aman untuk path URL web browser.
 */

export interface DocumentTokenPayload {
  id?: string
  dosenId?: string
  tahun?: string
  semester?: string
  ts?: number
  [key: string]: any
}

/**
 * Encode payload objek menjadi token Base64URL yang aman disematkan pada URL.
 */
export function encodeDocumentToken(payload: DocumentTokenPayload): string {
  try {
    const jsonString = JSON.stringify({
      ...payload,
      ts: payload.ts || Date.now(),
    })
    // UTF-8 safe Base64 encoding
    const base64 = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    }))
    // Base64URL standard: replace + with -, / with _, remove trailing =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch (err) {
    console.error('Gagal mengenkripsi token dokumen:', err)
    return ''
  }
}

/**
 * Decode token Base64URL kembali menjadi objek payload dokumen.
 */
export function decodeDocumentToken<T = DocumentTokenPayload>(token: string): T | null {
  if (!token || typeof token !== 'string') return null
  try {
    // Restore base64 padding and characters
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) {
      base64 += '='
    }
    const decodedUri = atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
    const jsonString = decodeURIComponent(decodedUri)
    return JSON.parse(jsonString) as T
  } catch (err) {
    // If not a valid base64 token, treat as plain raw identifier if alphanumeric
    if (/^[a-zA-Z0-9_-]+$/.test(token) && !token.includes('{')) {
      return { id: token } as unknown as T
    }
    console.warn('Gagal membaca token dokumen (mungkin URL warisan / format tidak valid):', err)
    return null
  }
}

/**
 * Ekstraksi parameter dokumen dari URL, mendukung format:
 * 1. Path token: /cetak/skp/:token atau /cetak-skp/:token
 * 2. Query param token: ?token=...
 * 3. Fallback URL warisan: ?id=... atau ?dosenId=...
 */
export function extractDocumentParams(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '',
  searchParams: URLSearchParams | null = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
): DocumentTokenPayload {
  const result: DocumentTokenPayload = {}

  // 1. Cek parameter URL warisan terlebih dahulu untuk backward compatibility
  if (searchParams) {
    const rawId = searchParams.get('id')
    const rawDosenId = searchParams.get('dosenId') || searchParams.get('dosen_id')
    const rawTahun = searchParams.get('tahun') || searchParams.get('tahunAkademik')
    const rawSemester = searchParams.get('semester')
    const rawToken = searchParams.get('token')

    if (rawId) result.id = rawId
    if (rawDosenId) result.dosenId = rawDosenId
    if (rawTahun) result.tahun = rawTahun
    if (rawSemester) result.semester = rawSemester

    if (rawToken) {
      const decoded = decodeDocumentToken(rawToken)
      if (decoded) {
        Object.assign(result, decoded)
      }
    }
  }

  // 2. Cek token yang disematkan langsung pada segmen path (/cetak/skp/:token atau /cetak-skp/:token)
  const segments = (pathname || '').split('/').filter(Boolean)
  if (segments.length >= 2) {
    const lastSegment = segments[segments.length - 1]
    const parentSegment = segments[segments.length - 2]
    const validPrintParents = ['skp', 'output-final', 'transkrip', 'panduan', 'cetak-skp', 'cetak-output-final', 'cetak-transkrip']
    if (validPrintParents.includes(parentSegment) && lastSegment) {
      const decoded = decodeDocumentToken(lastSegment)
      if (decoded) {
        Object.assign(result, decoded)
      } else {
        result.id = result.id || lastSegment
      }
    }
  }

  return result
}

/**
 * Pembersihan otomatis (cache pruning) untuk localStorage cetak dokumen UBK.
 * Menghapus cache pratinjau yang berumur lebih dari 24 jam atau jika total item melebihi 20 entri.
 */
export function prunePrintCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    const keysToInspect: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('ubk_print_')) {
        keysToInspect.push(key)
      }
    }

    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const now = Date.now()

    // 1. Hapus entri yang memiliki timestamp lebih tua dari 24 jam
    for (const key of keysToInspect) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed.timestamp === 'number' && now - parsed.timestamp > ONE_DAY_MS) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        // Jika format corrupted, hapus saja
        localStorage.removeItem(key)
      }
    }

    // 2. Jika masih tersisa lebih dari 20 item, potong yang terlama
    const remainingKeys: { key: string; ts: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('ubk_print_')) {
        try {
          const raw = localStorage.getItem(key)
          const ts = raw ? JSON.parse(raw)?.timestamp || 0 : 0
          remainingKeys.push({ key, ts })
        } catch {
          remainingKeys.push({ key, ts: 0 })
        }
      }
    }

    if (remainingKeys.length > 20) {
      remainingKeys.sort((a, b) => a.ts - b.ts)
      const toRemove = remainingKeys.slice(0, remainingKeys.length - 20)
      for (const item of toRemove) {
        localStorage.removeItem(item.key)
      }
    }
  } catch (err) {
    console.warn('Gagal membersihkan cache cetak dokumen:', err)
  }
}

