import { Dosen, KomponenSKP, PengajuanSKP, IndikatorKuesioner, PenilaianKuesioner, NotificationItem, UserSession, Role, ProgramStudi } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ubk_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export const api = {
  auth: {
    login: async (payload: { role?: Role; email?: string; nip?: string; password?: string }) => {
      const res = await request<{ token: string; user: UserSession }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res.token) {
        localStorage.setItem('ubk_auth_token', res.token)
      }
      return res
    },
    me: () => request<UserSession>('/auth/me'),
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' })
      } finally {
        localStorage.removeItem('ubk_auth_token')
      }
    },
    getDemoUsers: () => request<Record<string, UserSession>>('/auth/demo-users'),
  },

  dosen: {
    list: (params?: { prodi?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<Dosen[]>(`/dosen${q ? `?${q}` : ''}`)
    },
    get: (id: string) => request<Dosen>(`/dosen/${id}`),
    create: (data: Partial<Dosen>) => request<{ data: Dosen }>('/dosen', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Dosen>) => request<{ data: Dosen }>(`/dosen/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/dosen/${id}`, { method: 'DELETE' }),
  },

  prodi: {
    list: async (params?: { fakultas?: string; jenjang?: string; kampus?: string }): Promise<ProgramStudi[]> => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      const res = await request<{ success: boolean; data: ProgramStudi[] }>(`/program-studi${q ? `?${q}` : ''}`)
      return res.data || []
    },
    get: async (id: string): Promise<ProgramStudi> => {
      const res = await request<{ success: boolean; data: ProgramStudi }>(`/program-studi/${id}`)
      return res.data
    },
    create: (data: Partial<ProgramStudi>) => request<{ success: boolean; data: ProgramStudi }>('/program-studi', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ProgramStudi>) => request<{ success: boolean; data: ProgramStudi }>(`/program-studi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean; message: string }>(`/program-studi/${id}`, { method: 'DELETE' }),
  },

  komponen: {
    list: (params?: { kategori?: string; target_jabatan?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<KomponenSKP[]>(`/komponen-skp${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<KomponenSKP>) => request<{ data: KomponenSKP }>('/komponen-skp', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<KomponenSKP>) => request<{ data: KomponenSKP }>(`/komponen-skp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/komponen-skp/${id}`, { method: 'DELETE' }),
  },

  skp: {
    list: (params?: { dosen_id?: string; status?: string; semester?: string; tahun_akademik?: string; prodi?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<PengajuanSKP[]>(`/pengajuan-skp${q ? `?${q}` : ''}`)
    },
    get: (id: string) => request<PengajuanSKP>(`/pengajuan-skp/${id}`),
    create: (data: Partial<PengajuanSKP>) => request<{ data: PengajuanSKP }>('/pengajuan-skp', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PengajuanSKP>) => request<{ data: PengajuanSKP }>(`/pengajuan-skp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/pengajuan-skp/${id}`, { method: 'DELETE' }),
    submit: (id: string) => request<{ data: PengajuanSKP }>(`/pengajuan-skp/${id}/submit`, { method: 'POST' }),
    reviewKaprodi: (id: string, action: 'approve' | 'reject', notes?: string, ttdUrl?: string) =>
      request<{ data: PengajuanSKP }>(`/pengajuan-skp/${id}/review-kaprodi`, {
        method: 'POST',
        body: JSON.stringify({ action, notes, ttdUrl }),
      }),
    reviewDekan: (id: string, action: 'approve' | 'reject', notes?: string, ttdUrl?: string) =>
      request<{ data: PengajuanSKP }>(`/pengajuan-skp/${id}/review-dekan`, {
        method: 'POST',
        body: JSON.stringify({ action, notes, ttdUrl }),
      }),
    reviewSDM: (id: string, action: 'approve' | 'reject', notes?: string) =>
      request<{ data: PengajuanSKP }>(`/pengajuan-skp/${id}/review-sdm`, {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      }),
  },

  indikator: {
    list: (params?: { aspek?: string; prodi?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<IndikatorKuesioner[]>(`/indikator-kuesioner${q ? `?${q}` : ''}`)
    },
    getAspek: () => request<string[]>('/indikator-kuesioner/aspek'),
    create: (data: Partial<IndikatorKuesioner>) => request<{ data: IndikatorKuesioner }>('/indikator-kuesioner', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<IndikatorKuesioner>) => request<{ data: IndikatorKuesioner }>(`/indikator-kuesioner/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/indikator-kuesioner/${id}`, { method: 'DELETE' }),
  },

  penilaian: {
    list: (params?: { dosen_id?: string; tahun?: string; periode?: string; penilai_role?: string; target_role?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<PenilaianKuesioner[]>(`/penilaian-kuesioner${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<PenilaianKuesioner>) => request<{ data: PenilaianKuesioner }>('/penilaian-kuesioner', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PenilaianKuesioner>) => request<{ data: PenilaianKuesioner }>(`/penilaian-kuesioner/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/penilaian-kuesioner/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<NotificationItem[]>('/notifications'),
    markAsRead: (id: string) => request<{ data: NotificationItem }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
  },

  dashboard: {
    stats: (params?: { role?: string; prodi?: string; dosen_id?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<any>(`/dashboard/stats${q ? `?${q}` : ''}`)
    },
  },

  manPower: {
    sotk: (params?: { kategori_unit?: string; search?: string; grouped?: boolean }) => {
      const q = new URLSearchParams(params as Record<string, any>).toString()
      return request<any[]>(`/man-power/sotk${q ? `?${q}` : ''}`)
    },
    spmiRekap: (params?: { semester?: string; prodi?: string; kampus?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<any[]>(`/man-power/spmi-rekap${q ? `?${q}` : ''}`)
    },
    dosenLengkap: (params?: { kampus?: string; prodi?: string; jafung?: string; status_keaktifan?: string; serdos?: boolean; studi_lanjut?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, any>).toString()
      return request<Dosen[]>(`/man-power/dosen-lengkap${q ? `?${q}` : ''}`)
    },
    stats: () => request<any>('/man-power/stats'),
  },

  reference: {
    getTahunAkademik: () => request<string[]>('/reference/tahun-akademik'),
    getTargetJabatan: () => request<string[]>('/reference/target-jabatan'),
    getKategoriKomponen: () => request<string[]>('/reference/kategori-komponen'),
  },
}

