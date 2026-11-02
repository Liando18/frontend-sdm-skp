import React from 'react'
import {
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
} from 'lucide-react'
import { SKPItem, KomponenSKP } from '../../types'
import { sanitizeUrl } from '../../utils/security'
import { TableContainer } from '../common/tables/TableContainer'

export interface SkpMatrixTableProps {
  items: SKPItem[]
  komponenById: Map<string, KomponenSKP>
  isApproved: boolean
  driveCheckState: Record<string, { loading?: boolean; result?: any }>
  onInlineChange: (id: string, field: keyof SKPItem, value: any) => void
  onDetectDriveLink: (id: string, url: string) => void
}

/**
 * Standard SkpMatrixTable UBK
 * Sesuai DESAIN.md Bab 20.3
 */
export const SkpMatrixTable: React.FC<SkpMatrixTableProps> = ({
  items,
  komponenById,
  isApproved,
  driveCheckState,
  onInlineChange,
  onDetectDriveLink,
}) => {
  return (
    <TableContainer>
      <table className="custom-table custom-table--sticky-skp-self" style={{ minWidth: 1240, width: '100%' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: 44, textAlign: 'center' }}>
              NO
            </th>
            <th rowSpan={2} style={{ width: 80, textAlign: 'center' }}>
              KODE
            </th>
            <th rowSpan={2} style={{ minWidth: 260 }}>
              RENCANA KINERJA / KEGIATAN TUGAS JABATAN
            </th>
            <th rowSpan={2} style={{ width: 70, textAlign: 'center' }}>
              SATUAN
            </th>
            <th colSpan={3} style={{ textAlign: 'center', background: 'var(--navy-900)', color: '#ffffff' }}>
              TARGET KUANTITAS / VOLUME
            </th>
            <th rowSpan={2} style={{ width: 90, textAlign: 'center' }}>
              KUAL / MUTU (%)
            </th>
            <th rowSpan={2} style={{ width: 80, textAlign: 'center' }}>
              WAKTU
            </th>
            <th rowSpan={2} style={{ minWidth: 300 }}>
              TAUTAN DOKUMEN BUKTI FISIK &amp; DETEKSI AKSES
            </th>
          </tr>
          <tr>
            <th style={{ width: 85, textAlign: 'center', fontSize: '11px' }}>
              RENCANA AWAL
            </th>
            <th style={{ width: 85, textAlign: 'center', fontSize: '11px' }}>
              PERUBAHAN TENGAH
            </th>
            <th style={{ width: 85, textAlign: 'center', fontSize: '11px', background: 'var(--brand-700)', color: '#ffffff' }}>
              REALISASI AKHIR
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                Tidak ada data kegiatan yang cocok dengan filter atau pencarian.
              </td>
            </tr>
          ) : (
            items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                  {idx + 1}
                </td>
                <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: 'var(--brand-700)' }}>
                  {it.kode || `KMP-${idx + 1}`}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '12.5px', lineHeight: 1.4 }}>
                    {it.kegiatan}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {it.kategori && (
                      <span
                        className={`badge-pill ${
                          it.kategori === 'Pendidikan'
                            ? 'badge-pill--blue'
                            : it.kategori === 'Penelitian'
                            ? 'badge-pill--purple'
                            : it.kategori === 'Pengabdian'
                            ? 'badge-pill--green'
                            : 'badge-pill--gray'
                        }`}
                        style={{ fontSize: '10px', padding: '1px 6px' }}
                      >
                        {it.kategori}
                      </span>
                    )}
                    {(() => {
                      const comp = komponenById.get(it.komponenId) || (it.kode ? komponenById.get(it.kode) : undefined)
                      const target = comp?.targetJabatan
                      if (!target || target === 'Semua Jabatan' || target === 'Dosen' || target === 'Dosen Tetap') return null
                      return (
                        <span
                          className="badge-pill"
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            fontWeight: 600,
                          }}
                        >
                          Tugas: {target}
                        </span>
                      )
                    })()}
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)', fontSize: '12px' }}>
                  {it.satuan}
                </td>

                {/* Inline Input 1: Rencana Awal */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    disabled={isApproved}
                    className="table-inline-input"
                    value={it.rencanaAwal === 0 ? '' : it.rencanaAwal}
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => onInlineChange(it.id, 'rencanaAwal', e.target.value)}
                  />
                </td>

                {/* Inline Input 2: Perubahan Tengah */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    disabled={isApproved}
                    className="table-inline-input"
                    value={it.perubahanTengah === 0 ? '' : it.perubahanTengah}
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => onInlineChange(it.id, 'perubahanTengah', e.target.value)}
                  />
                </td>

                {/* Inline Input 3: Realisasi Akhir */}
                <td style={{ textAlign: 'center' }}>
                  {(() => {
                    const pt = Number(it.perubahanTengah) || 0
                    const ra = Number(it.rencanaAwal) || 0
                    const maxLimit = pt > 0 ? pt : ra
                    return (
                      <input
                        type="number"
                        min={0}
                        max={maxLimit > 0 ? maxLimit : undefined}
                        step="any"
                        placeholder="0"
                        disabled={isApproved}
                        className="table-inline-input table-inline-input--highlight"
                        value={it.realisasi === 0 ? '' : it.realisasi}
                        onFocus={(e) => e.target.select()}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => onInlineChange(it.id, 'realisasi', e.target.value)}
                        title={
                          pt > 0
                            ? `Maksimal realisasi: ${pt} (Sesuai Perubahan Tengah)`
                            : ra > 0
                            ? `Maksimal realisasi: ${ra} (Sesuai Rencana Awal)`
                            : 'Masukkan realisasi tugas'
                        }
                      />
                    )
                  })()}
                </td>

                {/* Terhitung Otomatis: Kual / Mutu (%) */}
                <td style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '12.5px',
                      color:
                        it.kualitasMutu >= 90
                          ? 'var(--status-success-ink)'
                          : it.kualitasMutu > 0
                          ? 'var(--brand-700)'
                          : 'var(--muted)',
                    }}
                  >
                    {it.kualitasMutu}%
                  </span>
                </td>

                {/* Waktu Baku */}
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                  {it.waktuNilai || 6} {it.waktuSatuan || 'bln'}
                </td>

                {/* Inline Input 4: Tautan Dokumen Bukti Fisik + Deteksi Link Google Drive */}
                <td style={{ minWidth: 300 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        disabled={isApproved}
                        className="custom-input"
                        style={{
                          height: 34,
                          fontSize: '12px',
                          flex: 1,
                          padding: '4px 10px',
                          minWidth: 160,
                        }}
                        value={it.linkDokumen || ''}
                        onChange={(e) => onInlineChange(it.id, 'linkDokumen', e.target.value)}
                      />

                      {/* Tombol Deteksi Akses Google Drive */}
                      <button
                        type="button"
                        onClick={() => onDetectDriveLink(it.id, it.linkDokumen || '')}
                        disabled={driveCheckState[it.id]?.loading}
                        className="brand-btn"
                        style={{
                          flexShrink: 0,
                          height: 32,
                          padding: '0 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: 'var(--r-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: driveCheckState[it.id]?.result?.status === 'public'
                            ? '#ecfdf5'
                            : driveCheckState[it.id]?.result?.status === 'restricted'
                            ? '#fffbeb'
                            : driveCheckState[it.id]?.result?.status === 'not_found'
                            ? '#fef2f2'
                            : 'var(--panel-hover)',
                          color: driveCheckState[it.id]?.result?.status === 'public'
                            ? '#047857'
                            : driveCheckState[it.id]?.result?.status === 'restricted'
                            ? '#b45309'
                            : driveCheckState[it.id]?.result?.status === 'not_found'
                            ? '#b91c1c'
                            : 'var(--navy-900)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                        title="Periksa keberadaan dan status akses publik tautan Google Drive"
                      >
                        {driveCheckState[it.id]?.loading ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : driveCheckState[it.id]?.result?.status === 'public' ? (
                          <CheckCircle2 size={12} color="#059669" />
                        ) : driveCheckState[it.id]?.result?.status === 'restricted' ? (
                          <AlertTriangle size={12} color="#d97706" />
                        ) : driveCheckState[it.id]?.result?.status === 'not_found' ? (
                          <XCircle size={12} color="#dc2626" />
                        ) : (
                          <Sparkles size={12} color="var(--brand-600)" />
                        )}
                        <span>{driveCheckState[it.id]?.loading ? 'Cek...' : 'Deteksi'}</span>
                      </button>

                      {/* Tombol Buka Link Langsung */}
                      {it.linkDokumen && (
                        <a
                          href={sanitizeUrl(it.linkDokumen)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-btn"
                          style={{ flexShrink: 0, width: 30, height: 30, display: 'grid', placeItems: 'center' }}
                          title="Buka Tautan Dokumen Bukti di Tab Baru"
                        >
                          <ExternalLink size={13} color="var(--brand-600)" />
                        </a>
                      )}
                    </div>

                    {/* Badge Hasil Deteksi Google Drive */}
                    {driveCheckState[it.id]?.result && (
                      <div
                        style={{
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          borderRadius: 4,
                          lineHeight: 1.3,
                          background:
                            driveCheckState[it.id]?.result?.status === 'public'
                              ? '#ecfdf5'
                              : driveCheckState[it.id]?.result?.status === 'restricted'
                              ? '#fffbeb'
                              : driveCheckState[it.id]?.result?.status === 'not_found'
                              ? '#fef2f2'
                              : '#f8fafc',
                          color:
                            driveCheckState[it.id]?.result?.status === 'public'
                              ? '#065f46'
                              : driveCheckState[it.id]?.result?.status === 'restricted'
                              ? '#92400e'
                              : driveCheckState[it.id]?.result?.status === 'not_found'
                              ? '#991b1b'
                              : '#334155',
                          border: `1px solid ${
                            driveCheckState[it.id]?.result?.status === 'public'
                              ? '#a7f3d0'
                              : driveCheckState[it.id]?.result?.status === 'restricted'
                              ? '#fde68a'
                              : driveCheckState[it.id]?.result?.status === 'not_found'
                              ? '#fecaca'
                              : '#e2e8f0'
                          }`,
                        }}
                      >
                        {driveCheckState[it.id]?.result?.status === 'public' ? (
                          <>
                            <CheckCircle2 size={11} color="#059669" />
                            <span><strong>Akses Publik Terbuka:</strong> Berkas dapat diakses &amp; diverifikasi</span>
                          </>
                        ) : driveCheckState[it.id]?.result?.status === 'restricted' ? (
                          <>
                            <AlertTriangle size={11} color="#d97706" />
                            <span><strong>Akses Dibatasi:</strong> Perlu izin (Ubah ke &quot;Siapa saja yang memiliki link&quot;)</span>
                          </>
                        ) : driveCheckState[it.id]?.result?.status === 'not_found' ? (
                          <>
                            <XCircle size={11} color="#dc2626" />
                            <span><strong>Tidak Ditemukan:</strong> Periksa kembali link (Error 404)</span>
                          </>
                        ) : (
                          <>
                            <Globe size={11} color="#475569" />
                            <span>{driveCheckState[it.id]?.result?.message}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableContainer>
  )
}
