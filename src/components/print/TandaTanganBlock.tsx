import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { resolveStorageUrl } from '../../utils/security'
import { formatIndonesianDate } from '../../utils/formatters'

export interface SignerInfo {
  roleLabel: string
  nama: string
  nuptk?: string
  nip?: string
  jabatan?: string
  tanggal?: string | Date
  kota?: string
  signatureUrl?: string
  isDigitalVerified?: boolean
}

interface TandaTanganBlockProps {
  pegawai: SignerInfo
  penilai: SignerInfo
  atasanPenilai?: SignerInfo
  className?: string
}

/**
 * Komponen Standar Tanda Tangan Formal Dokumen Cetak A4 UBK
 * Dilengkapi proteksi pemotongan halaman (pageBreakInside: 'avoid')
 * Sesuai DESAIN.md Bab 22
 */
export const TandaTanganBlock: React.FC<TandaTanganBlockProps> = ({
  pegawai,
  penilai,
  atasanPenilai,
  className = '',
}) => {
  const tanggalPenilai = penilai.tanggal
    ? formatIndonesianDate(penilai.tanggal)
    : formatIndonesianDate(new Date())

  const kotaPenilai = penilai.kota || 'Bandung'

  return (
    <div
      className={`avoid-break ubk-tanda-tangan-block ${className}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        display: 'grid',
        gridTemplateColumns: atasanPenilai ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: 20,
        fontSize: '8.5pt',
        marginTop: 12,
      }}
    >
      {/* Sisi Kiri: Pegawai Yang Dinilai */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '8pt', visibility: 'hidden', minHeight: 16 }}>
          {kotaPenilai}, -
        </div>
        <div style={{ fontWeight: 700, color: '#000000' }}>{pegawai.roleLabel}</div>
        <div style={{ fontSize: '7.5pt', color: '#475569', minHeight: 12 }}>
          {pegawai.jabatan || '\u00A0'}
        </div>

        {/* Kotak Tanda Tangan Dosen */}
        <div
          style={{
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '2px 0',
          }}
        >
          {pegawai.signatureUrl ? (
            <img
              src={resolveStorageUrl(pegawai.signatureUrl)}
              alt={`Tanda Tangan ${pegawai.nama}`}
              style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }}
            />
          ) : pegawai.isDigitalVerified ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 4,
                color: '#047857',
                fontSize: '7.5pt',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={12} />
              <span>Tervalidasi Digital</span>
            </div>
          ) : (
            <div
              style={{
                padding: '3px 10px',
                border: '1px dashed #94a3b8',
                borderRadius: 4,
                fontSize: '7.5pt',
                color: '#64748b',
              }}
            >
              (Tanda Tangan Pegawai)
            </div>
          )}
        </div>

        <div style={{ fontWeight: 800, textDecoration: 'underline', color: '#000000' }}>
          {pegawai.nama}
        </div>
        <div style={{ fontSize: '8pt', color: '#334155' }}>
          {pegawai.nuptk ? `NUPTK: ${pegawai.nuptk}` : pegawai.nip ? `NIP: ${pegawai.nip}` : 'NUPTK: -'}
        </div>
      </div>

      {/* Sisi Kanan: Pejabat Penilai */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '8pt', color: '#334155', minHeight: 16 }}>
          {kotaPenilai}, {tanggalPenilai}
        </div>
        <div style={{ fontWeight: 700, color: '#000000' }}>{penilai.roleLabel}</div>
        <div style={{ fontSize: '7.5pt', color: '#475569', minHeight: 12 }}>
          {penilai.jabatan || '\u00A0'}
        </div>

        {/* Kotak Tanda Tangan Penilai */}
        <div
          style={{
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '2px 0',
          }}
        >
          {penilai.signatureUrl ? (
            <img
              src={resolveStorageUrl(penilai.signatureUrl)}
              alt={`Tanda Tangan ${penilai.nama}`}
              style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }}
            />
          ) : penilai.isDigitalVerified ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 4,
                color: '#047857',
                fontSize: '7.5pt',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={12} />
              <span>Disahkan Secara Digital</span>
            </div>
          ) : (
            <div
              style={{
                padding: '3px 10px',
                border: '1px dashed #94a3b8',
                borderRadius: 4,
                fontSize: '7.5pt',
                color: '#64748b',
              }}
            >
              (Tanda Tangan Penilai)
            </div>
          )}
        </div>

        <div style={{ fontWeight: 800, textDecoration: 'underline', color: '#000000' }}>
          {penilai.nama}
        </div>
        <div style={{ fontSize: '8pt', color: '#334155' }}>
          {penilai.nuptk ? `NUPTK: ${penilai.nuptk}` : penilai.nip ? `NIP: ${penilai.nip}` : 'NUPTK: -'}
        </div>
      </div>

      {/* Kolom Opsional: Atasan Pejabat Penilai */}
      {atasanPenilai && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '8pt', color: '#334155', minHeight: 16 }}>
            {kotaPenilai}, {tanggalPenilai}
          </div>
          <div style={{ fontWeight: 700, color: '#000000' }}>{atasanPenilai.roleLabel}</div>
          <div style={{ fontSize: '7.5pt', color: '#475569', minHeight: 12 }}>
            {atasanPenilai.jabatan || '\u00A0'}
          </div>

          <div
            style={{
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '2px 0',
            }}
          >
            {atasanPenilai.signatureUrl ? (
              <img
                src={resolveStorageUrl(atasanPenilai.signatureUrl)}
                alt={`Tanda Tangan ${atasanPenilai.nama}`}
                style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  padding: '3px 10px',
                  border: '1px dashed #94a3b8',
                  borderRadius: 4,
                  fontSize: '7.5pt',
                  color: '#64748b',
                }}
              >
                (Tanda Tangan Atasan)
              </div>
            )}
          </div>

          <div style={{ fontWeight: 800, textDecoration: 'underline', color: '#000000' }}>
            {atasanPenilai.nama}
          </div>
          <div style={{ fontSize: '8pt', color: '#334155' }}>
            {atasanPenilai.nuptk
              ? `NUPTK: ${atasanPenilai.nuptk}`
              : atasanPenilai.nip
              ? `NIP: ${atasanPenilai.nip}`
              : 'NUPTK: -'}
          </div>
        </div>
      )}
    </div>
  )
}
