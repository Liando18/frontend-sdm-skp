import React from 'react'
import {
  FilePenLine,
  Send,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ThumbsUp,
  AlertTriangle,
  XCircle,
  LucideIcon,
} from 'lucide-react'

/**
 * Single Source of Truth (SSOT) Konfigurasi Status SKP & Predikat Perilaku UBK
 * Sesuai DESAIN.md Bab 15.1
 */

export interface StatusMeta {
  readonly label: string
  readonly bg: string
  readonly text: string
  readonly border: string
  readonly icon: LucideIcon
}

export type SkpStatusKey =
  | 'Draft'
  | 'Diajukan'
  | 'Dinilai Kaprodi'
  | 'Dinilai Dekan'
  | 'Disahkan'
  | 'Perlu Revisi'

export const SKP_STATUS_CONFIG: Record<SkpStatusKey, StatusMeta> = {
  Draft: {
    label: 'Draf',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    icon: FilePenLine,
  },
  Diajukan: {
    label: 'Diajukan',
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
    icon: Send,
  },
  'Dinilai Kaprodi': {
    label: 'Dinilai Kaprodi',
    bg: '#e0f2fe',
    text: '#0369a1',
    border: '#bae6fd',
    icon: CheckCircle2,
  },
  'Dinilai Dekan': {
    label: 'Dinilai Dekan',
    bg: '#f0fdf4',
    text: '#15803d',
    border: '#bbf7d0',
    icon: CheckCircle2,
  },
  Disahkan: {
    label: 'Disahkan',
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
    icon: ShieldCheck,
  },
  'Perlu Revisi': {
    label: 'Perlu Revisi',
    bg: '#fff1f2',
    text: '#be123c',
    border: '#fecdd3',
    icon: AlertCircle,
  },
} as const

export type PredikatKinerjaKey =
  | 'Sangat Baik'
  | 'Baik'
  | 'Cukup'
  | 'Kurang'
  | 'Belum Dinilai'

export const PREDIKAT_KINERJA_CONFIG: Record<PredikatKinerjaKey, StatusMeta> = {
  'Sangat Baik': {
    label: 'Sangat Baik',
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
    icon: Sparkles,
  },
  Baik: {
    label: 'Baik',
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
    icon: ThumbsUp,
  },
  Cukup: {
    label: 'Cukup',
    bg: '#fefce8',
    text: '#a16207',
    border: '#fde047',
    icon: AlertTriangle,
  },
  Kurang: {
    label: 'Kurang',
    bg: '#fff1f2',
    text: '#be123c',
    border: '#fecdd3',
    icon: XCircle,
  },
  'Belum Dinilai': {
    label: 'Belum Dinilai',
    bg: '#f8fafc',
    text: '#64748b',
    border: '#e2e8f0',
    icon: Clock,
  },
} as const

/**
 * Helper untuk mendapatkan meta status SKP secara aman
 */
export function getSkpStatusMeta(status?: string | null): StatusMeta {
  if (!status) return SKP_STATUS_CONFIG.Draft
  const key = status as SkpStatusKey
  return SKP_STATUS_CONFIG[key] || {
    label: status,
    bg: '#f8fafc',
    text: '#475569',
    border: '#cbd5e1',
    icon: Clock,
  }
}

/**
 * Helper untuk mendapatkan meta predikat kinerja secara aman
 */
export function getPredikatKinerjaMeta(predikat?: string | null): StatusMeta {
  if (!predikat || predikat === '-' || predikat.trim() === '') {
    return PREDIKAT_KINERJA_CONFIG['Belum Dinilai']
  }
  const key = predikat as PredikatKinerjaKey
  return PREDIKAT_KINERJA_CONFIG[key] || {
    label: predikat,
    bg: '#f8fafc',
    text: '#475569',
    border: '#cbd5e1',
    icon: Clock,
  }
}
