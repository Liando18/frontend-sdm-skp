import React from 'react'
import { INSTITUTION, ALAMAT_LENGKAP_INSTITUSI, KONTAK_RESMI_INSTITUSI } from '../../constants/institution'

interface KopSuratUBKProps {
  subJudul?: string
  className?: string
}

/**
 * Komponen Tunggal Resmi Kop Surat Universitas Bhakti Kencana
 * Sesuai DESAIN.md Bab 22
 */
export const KopSuratUBK: React.FC<KopSuratUBKProps> = ({ subJudul, className = '' }) => {
  return (
    <div
      className={`ubk-kop-surat ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '3px double #000000',
        paddingBottom: 6,
        marginBottom: 8,
      }}
    >
      <img
        src={INSTITUTION.logoPath}
        alt={`Logo ${INSTITUTION.universitas}`}
        style={{ width: 64, height: 64, objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div
          style={{
            fontSize: '11pt',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#000000',
          }}
        >
          {INSTITUTION.yayasan}
        </div>
        <div
          style={{
            fontSize: '13.5pt',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#0f223d',
          }}
        >
          {INSTITUTION.universitas}
        </div>
        {subJudul && (
          <div style={{ fontSize: '9pt', fontWeight: 700, color: '#334155', marginTop: 1 }}>
            {subJudul}
          </div>
        )}
        <div style={{ fontSize: '8pt', color: '#1e293b', marginTop: 1 }}>
          {ALAMAT_LENGKAP_INSTITUSI}
        </div>
        <div style={{ fontSize: '7.5pt', color: '#475569' }}>
          {KONTAK_RESMI_INSTITUSI}
        </div>
      </div>
    </div>
  )
}
