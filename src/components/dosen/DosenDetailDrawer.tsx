import React from 'react'
import { Edit2, Mail, Phone, GraduationCap, Building2, MapPin, Award } from 'lucide-react'
import { Dosen, JabatanKampus } from '../../types'
import { Drawer } from '../common/modals/Drawer'
import { StatusBadge } from '../common/StatusBadge'
import { INSTITUTION } from '../../constants/institution'
import { resolveStorageUrl } from '../../utils/security'

export interface DosenDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  dosen: Dosen | null
  jabatanList?: JabatanKampus[]
  onEdit?: (dosen: Dosen) => void
}

/**
 * Standard DosenDetailDrawer UBK
 * Sesuai DESAIN.md Bab 18.3 & Bab 20.3
 */
export const DosenDetailDrawer: React.FC<DosenDetailDrawerProps> = ({
  isOpen,
  onClose,
  dosen,
  jabatanList = [],
  onEdit,
}) => {
  if (!dosen) return null

  const matchedJabatan = jabatanList.find((j) => j.id === dosen.jabatanKampusId)
  const rawJabatan = matchedJabatan?.nama || dosen.jabatanStruktural || 'Dosen'
  const isDosenBiasa = rawJabatan.toLowerCase() === 'dosen'

  const avatarSrc = dosen.avatar && dosen.avatar !== '-'
    ? resolveStorageUrl(dosen.avatar)
    : INSTITUTION.userFallbackPath

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Detail Dosen"
      subtitle="Pangkalan Data Kepegawaian Resmi UBK"
      width={540}
      footer={
        onEdit && (
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(dosen)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: 6,
              backgroundColor: '#0284c7',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <Edit2 size={14} />
            <span>Edit Data Dosen</span>
          </button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Profil Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingBottom: 18,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: '2px solid #cbd5e1',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={avatarSrc}
              alt={dosen.nama}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = INSTITUTION.userFallbackPath
              }}
            />
          </div>

          <div>
            <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#0f172a' }}>
              {dosen.nama}
            </h4>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: 3 }}>
              NIP: <strong style={{ color: '#0f172a' }}>{dosen.nip}</strong>
              {dosen.nuptk && (
                <> &bull; NUPTK: <strong style={{ color: '#0f172a' }}>{dosen.nuptk}</strong></>
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={dosen.status || 'Tetap Yayasan'} size="sm" showIcon={false} />
            </div>
          </div>
        </div>

        {/* Informasi Homebase & Penugasan */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
            Homebase &amp; Penugasan Akademik
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              fontSize: '13px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Fakultas</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dosen.fakultas || '-'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Program Studi</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dosen.prodi || '-'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Kampus Penempatan</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dosen.kampus || 'Kampus Pusat'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Pangkat / Golongan</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dosen.golongan || '-'}</div>
            </div>
          </div>
        </div>

        {/* Jabatan Fungsional & Struktural */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
            Jabatan Akademik &amp; Struktural
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Jabatan Fungsional (Jafung)</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {dosen.jafung || 'Tenaga Pengajar'}
              </div>
            </div>

            <div style={{ background: isDosenBiasa ? '#f8fafc' : '#eff6ff', padding: '10px 12px', borderRadius: 8, border: `1px solid ${isDosenBiasa ? '#e2e8f0' : '#bfdbfe'}` }}>
              <div style={{ fontSize: '11px', color: isDosenBiasa ? '#64748b' : '#1d4ed8', fontWeight: 600 }}>
                Jabatan Kampus / Tugas Tambahan
              </div>
              <div style={{ fontWeight: 700, color: isDosenBiasa ? '#0f172a' : '#1d4ed8', marginTop: 2 }}>
                {rawJabatan}
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Pendidikan */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
            Kualifikasi Akademik
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Jenjang S1 (Sarjana)</div>
              <div style={{ fontSize: '13px', color: '#0f172a', marginTop: 2 }}>{dosen.pendidikanS1 || dosen.pendidikan || '-'}</div>
            </div>

            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Jenjang S2 (Magister)</div>
              <div style={{ fontSize: '13px', color: '#0f172a', marginTop: 2 }}>{dosen.pendidikanS2 || '-'}</div>
            </div>

            {dosen.pendidikanS3 && (
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Jenjang S3 (Doktor)</div>
                <div style={{ fontSize: '13px', color: '#0f172a', marginTop: 2 }}>{dosen.pendidikanS3}</div>
              </div>
            )}

            {dosen.pendidikanProfesi && (
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Pendidikan Profesi</div>
                <div style={{ fontSize: '13px', color: '#0f172a', marginTop: 2 }}>{dosen.pendidikanProfesi}</div>
              </div>
            )}
          </div>
        </div>

        {/* Kontak Resmi */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
            Kontak Resmi
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Mail size={16} style={{ color: '#0284c7' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Email Resmi</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{dosen.email || '-'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Phone size={16} style={{ color: '#0284c7' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Nomor Telepon / WhatsApp</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{dosen.phone || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
