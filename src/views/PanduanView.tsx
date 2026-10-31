import React, { useState, useMemo, useRef } from 'react'
import {
  BookOpen,
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  ChevronDown,
  ChevronRight,
  Printer,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Clock,
  Layers,
  Scale,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Role, UserSession } from '../types'
import { getAvatarSrc } from '../utils/security'
import { useStaggerEntrance, useInteractiveCards } from '../utils/animations'

interface PanduanViewProps {
  currentRole: Role
  currentUser: UserSession
  onNavigate?: (navId: string) => void
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

type TabCategory = 'alur' | 'standar' | 'checklist' | 'regulasi' | 'faq'

interface FAQItem {
  q: string
  a: string
  tag: string
}

interface StepItem {
  step: number
  title: string
  actor: string
  deadline: string
  desc: string
  actionLabel?: string
  actionNav?: string
  tips: string
}

interface ChecklistItem {
  id: string
  label: string
  desc: string
  mandatory: boolean
}

export const PanduanView: React.FC<PanduanViewProps> = ({
  currentRole,
  currentUser,
  onNavigate,
  onShowToast,
}) => {
  // Panduan 100% terkunci eksklusif sesuai peran pengguna yang login
  const selectedRole: Role = currentRole
  const [activeCategory, setActiveCategory] = useState<TabCategory>('alur')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0)

  // Local state for interactive checklist per user NIP / ID
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const storageKey = `ubk_panduan_chk_${currentUser.nip || currentUser.id || 'user'}_${selectedRole}`
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handleToggleChecklist = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        const storageKey = `ubk_panduan_chk_${currentUser.nip || currentUser.id || 'user'}_${selectedRole}`
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleResetChecklist = () => {
    setCheckedItems({})
    try {
      const storageKey = `ubk_panduan_chk_${currentUser.nip || currentUser.id || 'user'}_${selectedRole}`
      localStorage.removeItem(storageKey)
    } catch {}
    if (onShowToast) onShowToast('Daftar checklist berhasil direset.', 'info')
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useStaggerEntrance(containerRef, '.guide-card', [selectedRole, activeCategory], { y: 10, stagger: 0.04 })
  useInteractiveCards(containerRef, '.guide-interactive-card')

  // Metadata per role
  const roleMetadata: Record<
    Role,
    {
      title: string
      roleBadge: string
      headline: string
      shortDesc: string
      icon: React.ComponentType<{ size?: number; className?: string }>
      color: string
      bgColor: string
      borderColor: string
      targetAudience: string
      scopeDesc: string
    }
  > = {
    dosen: {
      title: 'Panduan Dosen (Pendidik & Peneliti)',
      roleBadge: 'Pendidik & Peneliti',
      headline: `Panduan Khusus Dosen: Penyusunan SKP Tridharma & BKD ${currentUser.prodi || 'Program Studi'}`,
      shortDesc: 'Pedoman penyusunan beban 12-16 SKS per semester, pengunggahan dokumen bukti fisik luaran, serta evaluasi perilaku kerja BerAKHLAK.',
      icon: GraduationCap,
      color: 'var(--brand-600)',
      bgColor: 'var(--brand-50)',
      borderColor: 'var(--brand-100)',
      targetAudience: 'Dosen Tetap Yayasan, PNS DPK, Dosen Kontrak & Dosen Khusus UBK',
      scopeDesc: `Program Studi ${currentUser.prodi || 'Homebase Dosen'}`,
    },
    kaprodi: {
      title: 'Panduan Ketua Program Studi (Kaprodi)',
      roleBadge: 'Verifikator Tahap I & Penilai',
      headline: `Panduan Khusus Kaprodi: Verifikasi SKP & Evaluasi Dosen Homebase ${currentUser.prodi || 'Program Studi'}`,
      shortDesc: 'Pedoman verifikasi kepatuhan Tridharma dosen homebase, pengisian instrumen kuesioner BerAKHLAK tahunan, dan penyusunan SKP mandiri.',
      icon: Users,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      targetAudience: 'Ketua & Sekretaris Program Studi Kampus Pusat dan PSDKU',
      scopeDesc: `Manajemen Dosen Program Studi ${currentUser.prodi || 'Homebase'}`,
    },
    dekan: {
      title: 'Panduan Dekanat / Pimpinan Fakultas & Cabang',
      roleBadge: 'Pimpinan & Verifikator Tahap II',
      headline: `Panduan Khusus Dekanat: Supervisi Fakultas & Verifikasi SKP Ketua Program Studi`,
      shortDesc: 'Pedoman penelaahan kinerja Ketua Program Studi, evaluasi perilaku manajerial Kaprodi, dan penerbitan disposisi beban lebih.',
      icon: Building2,
      color: '#7c3aed',
      bgColor: '#faf5ff',
      borderColor: '#e9d5ff',
      targetAudience: 'Dekan, Wakil Dekan, dan Kepala Cabang PSDKU Universitas Bhakti Kencana',
      scopeDesc: currentUser.fakultas || currentUser.kampus || 'Wilayah Fakultas / PSDKU',
    },
    sdm: {
      title: 'Panduan Direktorat Sumber Daya Manusia (Administrator)',
      roleBadge: 'Administrator & Pengesah Akhir',
      headline: 'Panduan Khusus Administrator: Tata Kelola SPMI Kepegawaian & Pengesahan SKP Institusi',
      shortDesc: 'Pedoman tata kelola master data kepegawaian, konfigurasi standar komponen Tridharma, pengesahan akhir, dan pelaporan akreditasi.',
      icon: ShieldCheck,
      color: 'var(--navy-900)',
      bgColor: 'var(--navy-100)',
      borderColor: 'var(--hair-strong)',
      targetAudience: 'Pengelola Data Kepegawaian & Pimpinan Direktorat SDM Universitas Bhakti Kencana',
      scopeDesc: 'Tingkat Institusi Universitas Bhakti Kencana (Pusat & PSDKU)',
    },
  }

  // Stepper workflow per role
  const workflowData: Record<Role, StepItem[]> = {
    dosen: [
      {
        step: 1,
        title: 'Penyusunan Rencana SKP (Awal Semester)',
        actor: currentUser.name || 'Dosen Bersangkutan',
        deadline: 'Pekan ke-1 s.d. ke-3 Perkuliahan',
        desc: `Pilih komponen Tridharma dari katalog standar SPMI UBK pada Program Studi ${currentUser.prodi || 'Homebase'}. Tentukan target kuantitas serta beban SKS agar total akumulasi rencana memenuhi rentang 12 hingga 16 SKS per semester.`,
        actionLabel: 'Buka Halaman SKP Saya',
        actionNav: 'skp-dosen-self',
        tips: 'Simpan terlebih dahulu sebagai Draft apabila dokumen penugasan atau jadwal ajar masih dalam proses finalisasi.',
      },
      {
        step: 2,
        title: 'Pengajuan Resmi ke Ketua Program Studi',
        actor: 'Dosen -> Ketua Program Studi',
        deadline: 'Batas Akhir Pekan ke-4 Semester',
        desc: 'Setelah seluruh target SKS diperiksa dan memenuhi batas minimal BKD, klik tombol "Ajukan SKP". Berkas akan terkunci dari perubahan dan notifikasi otomatis diteruskan ke akun Ketua Program Studi homebase Anda.',
        tips: 'Pastikan total SKS tidak kurang dari 12 SKS agar sistem tidak menolak pengajuan pengesahan.',
      },
      {
        step: 3,
        title: 'Pemenuhan Bukti Fisik & Laporan Realisasi Akhir',
        actor: currentUser.name || 'Dosen Bersangkutan',
        deadline: 'Sebelum Periode Ujian Akhir Semester (UAS)',
        desc: 'Masukkan capaian realisasi kegiatan dan nilai mutu. Wajib melampirkan tautan URL dokumen bukti otentik (Google Drive / Repository UBK) dengan izin akses terbuka (Siapa saja yang memiliki link dapat melihat).',
        tips: 'Dokumen bukti fisik yang tidak dapat dibuka oleh penilai akan dikembalikan dengan status Perlu Revisi.',
      },
      {
        step: 4,
        title: 'Penerbitan Hasil Evaluasi & Cetak Dokumen Sah',
        actor: 'Dosen (Mandiri)',
        deadline: 'Pasca Validasi Direktorat SDM',
        desc: 'Setelah SKP dinilai Kaprodi, disetujui Dekan, dan disahkan oleh Direktorat SDM, status berubah menjadi "Terbit". Nilai akhir diintegrasikan dengan Kuesioner BerAKHLAK (70% SKP + 30% Perilaku) dan dapat diunduh dengan barcode sah.',
        actionLabel: 'Lihat Hasil Kinerja Tahunan',
        actionNav: 'hasil-kinerja-dosen',
        tips: 'Unduh dan simpan salinan PDF formulir SKP dan Transkrip Nilai sebagai arsip portofolio BKD dan kenaikan jabatan fungsional.',
      },
    ],
    kaprodi: [
      {
        step: 1,
        title: `Monitoring Keterisian SKP Dosen Homebase ${currentUser.prodi || ''}`,
        actor: 'Ketua Program Studi',
        deadline: 'Pekan ke-2 s.d. ke-4 Semester',
        desc: `Pantau pengajuan rencana SKP seluruh dosen homebase Program Studi ${currentUser.prodi || ''} melalui Dashboard Kaprodi. Identifikasi dosen yang belum mengajukan atau masih berstatus Draft, dan berikan pengingat berkala.`,
        actionLabel: 'Buka Dashboard Kaprodi',
        actionNav: 'dashboard',
        tips: 'Gunakan filter status pada tabel dashboard untuk menyaring dosen yang butuh tindakan segera.',
      },
      {
        step: 2,
        title: 'Verifikasi Beban Tridharma & Keabsahan Bukti',
        actor: 'Ketua Program Studi',
        deadline: 'Maksimal 14 Hari Pasca Pengajuan',
        desc: 'Masuk ke menu "Verifikasi SKP Dosen". Teliti setiap butir kegiatan Tridharma dosen homebase. Pastikan rentang 12-16 SKS terpenuhi. Buka tautan bukti fisik untuk memverifikasi keabsahan SK mengajar, RPS, artikel jurnal, atau laporan PKM.',
        actionLabel: 'Menu Verifikasi SKP Dosen',
        actionNav: 'review-skp-kaprodi',
        tips: 'Bila terdapat beban SKS kurang atau bukti tidak valid, klik "Kembalikan" dan tuliskan catatan perbaikan spesifik.',
      },
      {
        step: 3,
        title: 'Penilaian Kuesioner Perilaku BerAKHLAK Tahunan',
        actor: 'Ketua Program Studi',
        deadline: 'Periode Evaluasi Akhir Tahun Akademik',
        desc: 'Masuk ke menu "Evaluasi Kinerja Dosen". Berikan penilaian obyektif skala 1 (Kurang) sampai 4 (Sangat Baik) pada 7 pilar BerAKHLAK. Perhatikan bahwa Indikator No. 1 pada setiap aspek adalah Critical Point yang wajib dipenuhi minimal skor 3.',
        actionLabel: 'Evaluasi Kuesioner Dosen',
        actionNav: 'kuesioner-kaprodi',
        tips: 'Nilai perilaku ini menyumbang bobot 30% pada Nilai Akhir Kinerja Pegawai.',
      },
      {
        step: 4,
        title: 'Penyusunan SKP Tugas Jabatan Kaprodi Mandiri',
        actor: 'Kaprodi (Sebagai Pegawai)',
        deadline: 'Mengikuti Jadwal Pengajuan SKP',
        desc: 'Sebagai Ketua Program Studi, Anda juga wajib mengisi SKP pribadi yang mencakup tugas manajerial prodi serta beban Tridharma mandiri. SKP tugas jabatan Anda akan diverifikasi dan dinilai langsung oleh Dekan Fakultas.',
        actionLabel: 'Isi SKP Tugas Jabatan Kaprodi',
        actionNav: 'skp-kaprodi-self',
        tips: 'Komponen kepemimpinan program studi tersedia di kategori Penunjang/Tugas Tambahan SPMI.',
      },
    ],
    dekan: [
      {
        step: 1,
        title: 'Supervisi Capaian Tridharma Lintas Program Studi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Awal & Tengah Semester',
        desc: `Pantau agregat keterisian SKP dan pemenuhan BKD di seluruh program studi di lingkungan ${currentUser.fakultas || currentUser.kampus || 'Fakultas'}. Periksa rasio dosen yang telah mengajukan dan yang telah diverifikasi Kaprodi.`,
        actionLabel: 'Buka Dashboard Dekan',
        actionNav: 'dashboard',
        tips: 'Identifikasi program studi yang lambat dalam proses verifikasi untuk diberikan arahan koordinasi.',
      },
      {
        step: 2,
        title: 'Verifikasi & Pengesahan SKP Ketua Program Studi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Pekan ke-4 s.d. ke-6 Semester',
        desc: 'Masuk ke menu "Verifikasi SKP Ketua Program Studi". Tinjau sasaran kinerja kepemimpinan akademik dan Tridharma masing-masing Kaprodi. Berikan persetujuan validasi Tahap II tingkat Fakultas atau kembalikan jika memerlukan perbaikan.',
        actionLabel: 'Verifikasi SKP Ka.Prodi',
        actionNav: 'review-skp-dekan',
        tips: 'Persetujuan Dekan menjadi prasyarat sebelum berkas dapat diteruskan ke pengesahan final Direktorat SDM.',
      },
      {
        step: 3,
        title: 'Evaluasi Perilaku Kepemimpinan BerAKHLAK Kaprodi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Akhir Semester Genap (Tahunan)',
        desc: 'Buka menu "Evaluasi Kinerja Ketua Program Studi". Lakukan penilaian 7 dimensi perilaku kerja terhadap seluruh Kaprodi dengan menitikberatkan pada aspek Akuntabilitas manajerial dan Kolaboratif tingkat fakultas.',
        actionLabel: 'Evaluasi Kuesioner Ka.Prodi',
        actionNav: 'kuesioner-dekan',
        tips: 'Gunakan catatan evaluasi konstruktif untuk memotivasi peningkatan mutu program studi.',
      },
      {
        step: 4,
        title: 'Disposisi Kelebihan Beban Kerja (> 16 SKS)',
        actor: 'Dekan Fakultas',
        deadline: 'Insidental / Sesuai Pengajuan',
        desc: 'Dosen yang memiliki beban Tridharma melebihi batas maksimal 16 SKS karena kondisi penugasan mendesak (misal akreditasi prodi, riset strategis) wajib mendapatkan surat disposisi persetujuan Dekan sebelum diakui oleh SDM.',
        tips: 'Disposisi dicatat secara formal dalam dokumen berita acara fakultas.',
      },
    ],
    sdm: [
      {
        step: 1,
        title: 'Pemutakhiran Master Data & Struktur Organisasi',
        actor: 'Direktorat SDM',
        deadline: 'Sebelum Semester Dimulai',
        desc: 'Kelola master data kepegawaian dosen (NIP, NUPTK, Jafung, Golongan, Status Ikatan Kerja), master Program Studi, Fakultas, PSDKU, dan pemetaan pejabat struktural (Dekan, Kaprodi, Kepala Cabang).',
        actionLabel: 'Kelola Data Kepegawaian',
        actionNav: 'data-dosen',
        tips: 'Pastikan penugasan Kaprodi dan Dekan telah disinkronkan dengan basis data kepegawaian.',
      },
      {
        step: 2,
        title: 'Konfigurasi Komponen SKP & Indikator Kuesioner',
        actor: 'Direktorat SDM',
        deadline: 'Awal Tahun Akademik',
        desc: 'Kelola standar bobot SKS komponen Tridharma berdasarkan pedoman SPMI UBK No. 03.07.00/PD/SDM-SPMI. Atur 7 indikator pilar BerAKHLAK dan pastikan status Critical Point (Poin Kritis) terkonfigurasi dengan benar.',
        actionLabel: 'Master Komponen SKP',
        actionNav: 'komponen-skp',
        tips: 'Perubahan pada komponen tidak mempengaruhi SKP periode terdahulu yang sudah terbit.',
      },
      {
        step: 3,
        title: 'Monitoring & Final Approval Pengesahan SKP',
        actor: 'Direktorat SDM',
        deadline: 'Pasca Review Dekan',
        desc: 'Periksa pengajuan SKP yang telah berstatus "Dinilai Dekan". Validasi kecukupan dokumen dan kepatuhan beban institusional, lalu bubuhkan status "Disetujui SDM / Terbit" dengan tanda tangan digital resmi institusi.',
        actionLabel: 'Monitoring SKP Institusi',
        actionNav: 'skp-dosen',
        tips: 'SKP yang telah disetujui SDM secara otomatis menghasilkan dokumen cetak ber-barcode sah.',
      },
      {
        step: 4,
        title: 'Penarikan Laporan Eksekutif & Arsip Akreditasi',
        actor: 'Direktorat SDM',
        deadline: 'Akhir Periode Evaluasi',
        desc: 'Unduh laporan rekapitulasi kinerja seluruh unit kerja, analisis sebaran predikat (Sangat Baik, Baik, Cukup, Kurang), dan ekspor data ke Excel atau PDF untuk audit BAN-PT, LAM-PTKes, serta Yayasan.',
        actionLabel: 'Buka Laporan & Rekapitulasi',
        actionNav: 'laporan',
        tips: 'Laporan dapat difilter per fakultas, program studi, status kepegawaian, maupun jenjang jabatan.',
      },
    ],
  }

  // Interactive Checklist per role
  const checklistData: Record<Role, ChecklistItem[]> = {
    dosen: [
      {
        id: 'chk_dosen_1',
        label: 'Memenuhi Beban Tridharma 12 - 16 SKS',
        desc: 'Total rencana beban kerja per semester wajib berada di batas regulasi (12 sampai 16 SKS).',
        mandatory: true,
      },
      {
        id: 'chk_dosen_2',
        label: 'Memenuhi Minimal Unsur Pendidikan & Pengajaran (4 SKS)',
        desc: `Dosen non-pejabat struktural wajib mengampu pengajaran minimal 4 SKS di Program Studi ${currentUser.prodi || 'Homebase'}.`,
        mandatory: true,
      },
      {
        id: 'chk_dosen_3',
        label: 'Melampirkan Tautan Bukti Fisik Google Drive Terbuka',
        desc: 'URL Google Drive / Cloud harus dapat diakses publik oleh penilai tanpa perlu login akun lain.',
        mandatory: true,
      },
      {
        id: 'chk_dosen_4',
        label: 'Menyelesaikan Pengisian Realisasi & Capaian Mutu',
        desc: 'Input angka realisasi akhir semester dan persentase capaian mutu sebelum batas penutupan sistem.',
        mandatory: true,
      },
      {
        id: 'chk_dosen_5',
        label: 'Mengunduh & Mengarsipkan Cetak SKP Sah',
        desc: 'Simpan file PDF SKP ber-barcode dan Transkrip Evaluasi BerAKHLAK untuk portofolio BKD.',
        mandatory: false,
      },
    ],
    kaprodi: [
      {
        id: 'chk_kaprodi_1',
        label: `100% Dosen Homebase ${currentUser.prodi || ''} Mengajukan SKP`,
        desc: 'Memastikan seluruh dosen tetap dan kontrak di program studi telah mengajukan rencana SKP tepat waktu.',
        mandatory: true,
      },
      {
        id: 'chk_kaprodi_2',
        label: 'Verifikasi Beban Tridharma Dosen (12 - 16 SKS)',
        desc: 'Meneliti rincian kegiatan dan memastikan tidak ada dosen yang berada di bawah 12 SKS tanpa izin.',
        mandatory: true,
      },
      {
        id: 'chk_kaprodi_3',
        label: 'Uji Validitas Tautan Dokumen Bukti Fisik Dosen',
        desc: 'Membuka dan memvalidasi berkas SK mengajar, RPS, modul, jurnal, dan laporan PKM dosen homebase.',
        mandatory: true,
      },
      {
        id: 'chk_kaprodi_4',
        label: 'Tuntas Penilaian Kuesioner BerAKHLAK Seluruh Dosen',
        desc: 'Menuntaskan pengisian 7 pilar kuesioner perilaku kerja dosen homebase dengan memperhatikan Critical Point.',
        mandatory: true,
      },
      {
        id: 'chk_kaprodi_5',
        label: 'Penyusunan SKP Tugas Jabatan Kaprodi Mandiri',
        desc: 'Menyusun dan mengajukan SKP tugas tambahan manajerial Kaprodi ke Dekan Fakultas.',
        mandatory: true,
      },
    ],
    dekan: [
      {
        id: 'chk_dekan_1',
        label: 'Supervisi Keterisian SKP Seluruh Prodi Fakultas',
        desc: `Memastikan tidak ada program studi di lingkungan ${currentUser.fakultas || currentUser.kampus || 'Fakultas'} yang tertinggal dalam proses SKP.`,
        mandatory: true,
      },
      {
        id: 'chk_dekan_2',
        label: 'Verifikasi & Persetujuan SKP Seluruh Kaprodi',
        desc: 'Memvalidasi kelayakan sasaran kinerja dan ketercapaian manajerial seluruh Ketua Program Studi.',
        mandatory: true,
      },
      {
        id: 'chk_dekan_3',
        label: 'Pengisian Kuesioner BerAKHLAK Para Kaprodi',
        desc: 'Memberikan penilaian perilaku kepemimpinan berkala kepada para pejabat struktural prodi.',
        mandatory: true,
      },
      {
        id: 'chk_dekan_4',
        label: 'Penerbitan Disposisi Beban Lebih Bila Ada (> 16 SKS)',
        desc: 'Menandatangani disposisi jika ada dosen dengan beban penugasan mendesak melebihi standar maksimal.',
        mandatory: false,
      },
    ],
    sdm: [
      {
        id: 'chk_sdm_1',
        label: 'Sinkronisasi Master Data Dosen & Pejabat Struktural',
        desc: 'Memastikan NIP, NUPTK, JAFUNG, dan pemetaan Prodi/Fakultas terbarui di basis data institusi.',
        mandatory: true,
      },
      {
        id: 'chk_sdm_2',
        label: 'Pembaruan Standar Komponen SKP & Bobot SPMI',
        desc: 'Menetapkan standar komponen Tridharma dan batas maksimal SKS sesuai kalender akademik terbaru.',
        mandatory: true,
      },
      {
        id: 'chk_sdm_3',
        label: 'Validasi Akhir (Final Approval) SKP Universitas',
        desc: 'Mengesahkan seluruh SKP yang telah disetujui Dekan menjadi status Terbit/Sah ber-barcode.',
        mandatory: true,
      },
      {
        id: 'chk_sdm_4',
        label: 'Penerbitan Rekapitulasi & Ekspor Laporan Akreditasi',
        desc: 'Menghasilkan dokumen rekapitulasi nilai tahunan untuk pelaporan BAN-PT, LAM-PTKes, dan Yayasan.',
        mandatory: true,
      },
    ],
  }

  // FAQ per role
  const faqData: Record<Role, FAQItem[]> = {
    dosen: [
      {
        q: 'Bagaimana jika total beban kerja saya kurang dari 12 SKS atau lebih dari 16 SKS?',
        a: 'Sesuai Pedoman Operasional BKD Dikti dan Standar SPMI UBK No. 03.07.00/PD/SDM-SPMI, beban kerja dosen per semester minimal 12 SKS dan maksimal 16 SKS. Jika beban Anda kurang dari 12 SKS, sistem akan memberi tanda peringatan dan pengajuan tidak dapat disahkan. Jika lebih dari 16 SKS karena penugasan khusus, Anda wajib melampirkan surat disposisi persetujuan dari Dekan Fakultas.',
        tag: 'Beban SKS',
      },
      {
        q: 'Apa yang harus dilakukan jika SKP saya berstatus "Perlu Revisi"?',
        a: 'Jika status SKP berubah menjadi Perlu Revisi, buka menu SKP Saya. Perhatikan kotak Catatan Verifikator di bagian atas formulir. Lakukan koreksi butir kegiatan yang diminta, perbarui tautan bukti fisik jika diperlukan, lalu klik tombol "Ajukan Ulang SKP". Status akan kembali ke Diajukan untuk ditinjau ulang oleh Kaprodi atau Dekan.',
        tag: 'Revisi SKP',
      },
      {
        q: 'Bagaimana rumus penghitungan Nilai Akhir Kinerja Pegawai?',
        a: 'Formula pembobotan resmi UBK adalah: Nilai Akhir Kinerja = (Nilai Capaian SKP × 70%) + (Nilai Kuesioner BerAKHLAK × 30%). Kategori Predikat: Nilai 91 - 100 = Sangat Baik, 76 - 90 = Baik, 61 - 75 = Butuh Perbaikan, 51 - 60 = Kurang, dan < 50 = Sangat Kurang.',
        tag: 'Nilai Akhir',
      },
      {
        q: 'Apakah semua unsur Tridharma wajib diisi setiap semester?',
        a: 'Unsur Pendidikan & Pengajaran wajib diisi setiap semester minimal 4 SKS (untuk dosen biasa). Unsur Penelitian dan Pengabdian kepada Masyarakat (PKM) wajib dilaksanakan minimal 1 kegiatan dalam kurun waktu satu tahun akademik, sedangkan Penunjang bersifat opsional dengan pengakuan maksimal 3 SKS.',
        tag: 'Tridharma',
      },
      {
        q: 'Bagaimana cara mencetak formulir SKP dan transkrip tahunan?',
        a: 'Masuk ke menu SKP Saya atau Hasil Kinerja Tahunan. Pada sudut kanan atas terdapat tombol "Cetak Formulir Resmi" atau "Cetak Transkrip". Dokumen akan terbuka di jendela pracetak berformat standar kop resmi Universitas Bhakti Kencana lengkap dengan barcode verifikasi keabsahan dokumen.',
        tag: 'Pencetakan',
      },
    ],
    kaprodi: [
      {
        q: 'Apa perbedaan tombol "Setujui" dan "Kembalikan" pada verifikasi SKP dosen?',
        a: 'Tombol "Setujui" digunakan apabila butir kegiatan Tridharma telah memenuhi ketentuan SPMI (12-16 SKS) dan tautan bukti fisik valid. Status SKP akan beralih ke "Dinilai Kaprodi" untuk diteruskan ke Dekan. Tombol "Kembalikan" digunakan bila ada data yang salah, dokumen tidak terbaca, atau SKS kurang, disertai catatan perbaikan wajib yang akan dibaca oleh dosen bersangkutan.',
        tag: 'Verifikasi',
      },
      {
        q: 'Bagaimana kriteria pengisian kuesioner perilaku kerja BerAKHLAK?',
        a: 'Gunakan skala 1 sampai 4: (1) Kurang, (2) Cukup, (3) Baik, (4) Sangat Baik. Nilai harus mencerminkan kinerja keseharian dosen selama satu tahun akademik. Perhatikan bahwa Indikator No. 1 di setiap aspek adalah Critical Point yang menjadi syarat kelulusan nilai Baik.',
        tag: 'Kuesioner',
      },
      {
        q: 'Apakah Kaprodi juga harus mengisi SKP mandiri?',
        a: 'Ya. Kaprodi memiliki peran ganda: sebagai Pendidik (Tridharma) dan Pejabat Struktural. Kaprodi mengisi SKP melalui menu "Kinerja Saya > Sasaran Kinerja Pegawai" yang memuat unsur pengajaran, riset, serta butir kepemimpinan prodi. SKP Kaprodi akan diverifikasi langsung oleh Dekan Fakultas.',
        tag: 'Peran Ganda',
      },
      {
        q: 'Bagaimana jika ada dosen homebase yang belum mengajukan SKP hingga batas waktu?',
        a: 'Kaprodi dapat memantau keterisian melalui Dashboard Kaprodi. Bila ada dosen yang terlambat, Kaprodi dapat memberikan teguran tertulis atau berkoordinasi dengan Direktorat SDM untuk penjadwalan asistensi pengisian.',
        tag: 'Disiplin Waktu',
      },
    ],
    dekan: [
      {
        q: 'Apa cakupan wewenang verifikasi SKP tingkat Dekanat?',
        a: 'Dekan berwenang memvalidasi SKP para Ketua Program Studi di lingkungan fakultas bersangkutan, serta mengawasi rekapitulasi progres seluruh program studi. Dekan memastikan keselarasan sasaran kinerja fakultas dengan Rencana Strategis (Renstra) Universitas Bhakti Kencana.',
        tag: 'Wewenang Dekan',
      },
      {
        q: 'Bagaimana prosedur penanganan kelebihan beban kerja (> 16 SKS)?',
        a: 'Jika dosen di salah satu program studi memiliki beban lebih dari 16 SKS karena kondisi darurat akademik, Kaprodi mengusulkan surat permohonan ke Dekan. Dekan menerbitkan disposisi persetujuan beban lebih yang diunggah ke sistem agar status pengajuan tidak terblokir saat verifikasi SDM.',
        tag: 'Disposisi SKS',
      },
      {
        q: 'Bagaimana Dekan mengevaluasi kuesioner perilaku kerja para Kaprodi?',
        a: 'Melalui menu "Evaluasi Kinerja Ketua Program Studi", Dekan memberikan skor pada 7 dimensi BerAKHLAK untuk setiap Kaprodi dengan fokus pada akuntabilitas pelaporan prodi, kepemimpinan kurikulum, dan kolaborasi lintas fakultas.',
        tag: 'Evaluasi Kaprodi',
      },
    ],
    sdm: [
      {
        q: 'Kapan status SKP dinyatakan "Terbit / Disahkan"?',
        a: 'Status SKP dinyatakan Terbit setelah melalui 3 tahap: diajukan oleh dosen, disetujui Kaprodi (Dinilai Kaprodi), disetujui Dekan (Dinilai Dekan), dan divalidasi final oleh Direktorat SDM (Disetujui SDM / Terbit). Setelah status Terbit, formulir SKP dan transkrip tahunan dapat dicetak resmi.',
        tag: 'Status Terbit',
      },
      {
        q: 'Bagaimana cara menambahkan dosen baru atau memperbarui jabatan fungsional?',
        a: 'Masuk ke menu "Master & Laporan > Data Kepegawaian Dosen". Klik tombol "Tambah Dosen" atau klik ikon edit pada baris dosen terkait. Isi NIP, NUPTK, nama, program studi, status ikatan kerja, dan jabatan fungsional terbaru (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar).',
        tag: 'Master Dosen',
      },
      {
        q: 'Bagaimana mengekspor data untuk kebutuhan akreditasi BAN-PT / LAM-PTKes?',
        a: 'Masuk ke menu "Master & Laporan > Laporan & Rekapitulasi Institusi". Pilih periode evaluasi, fakultas, atau prodi, lalu klik tombol "Ekspor Excel" atau "Cetak Ringkasan Eksekutif". Data memuat seluruh indikator kuantitatif beban Tridharma dan predikat mutu BerAKHLAK.',
        tag: 'Ekspor Data',
      },
    ],
  }

  // Calculate Checklist progress
  const currentChecklist = checklistData[selectedRole] || []
  const totalChecklist = currentChecklist.length
  const completedChecklist = currentChecklist.filter((it) => checkedItems[it.id]).length
  const checklistPercentage = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0

  // Filtered FAQ based on search
  const filteredFaq = useMemo(() => {
    const list = faqData[selectedRole] || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q)
    )
  }, [selectedRole, searchQuery])

  // Filtered Workflow steps based on search
  const filteredWorkflow = useMemo(() => {
    const list = workflowData[selectedRole] || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (it) => it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || it.actor.toLowerCase().includes(q)
    )
  }, [selectedRole, searchQuery])

  const activeRoleMeta = roleMetadata[selectedRole]

  return (
    <div className="page-container" ref={containerRef} style={{ paddingBottom: 64 }}>
      {/* =========================================================================
          1. HEADER BANNER: Standard Institutional Context (Universitas Bhakti Kencana)
         ========================================================================= */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '24px 28px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--navy-100)',
                  color: 'var(--navy-900)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <BookOpen size={12} style={{ color: 'var(--brand-600)' }} />
                <span>Pedoman Mutu SPMI 2026</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--panel-hover)',
                  color: 'var(--muted)',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={11} style={{ color: 'var(--brand-600)' }} />
                <span>PermenPAN-RB No. 6/2022 &bull; PO BKD Ditjen Dikti</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.025em',
                margin: '0 0 6px 0',
                lineHeight: 1.3,
              }}
            >
              {activeRoleMeta.headline}
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--muted)',
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 720,
              }}
            >
              {activeRoleMeta.shortDesc}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                window.open(`/cetak-panduan?role=${selectedRole}`, '_blank')
              }}
              className="brand-btn brand-btn--outline"
              style={{ padding: '8px 15px', background: '#ffffff', borderRadius: 'var(--r-md)', fontSize: '13px' }}
              aria-label="Cetak buku panduan resmi di tab baru"
              title="Buka dokumen cetak resmi di tab baru"
            >
              <Printer size={15} />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Global Full-Width Responsive Search Bar */}
        <div style={{ marginTop: 20, position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchQuery ? 'var(--brand-600)' : 'var(--faint)',
              pointerEvents: 'none',
              transition: 'color 0.18s ease',
            }}
          />
          <input
            type="text"
            className="input-field"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 46,
              paddingRight: searchQuery ? 76 : 16,
              height: 46,
              borderRadius: 'var(--r-md)',
              fontSize: '13.5px',
              fontWeight: 500,
              border: '1.5px solid var(--hair-strong)',
              background: 'var(--page-bg)',
              color: 'var(--ink)',
              transition: 'all 0.18s var(--ease)',
            }}
            placeholder="Cari topik panduan, ketentuan beban SKS, alur pengesahan, atau FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari panduan"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--panel-hover)',
                border: '1px solid var(--hair)',
                borderRadius: 'var(--r-sm)',
                padding: '4px 10px',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              aria-label="Hapus kata kunci pencarian"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. PERSONA PROFILE CARD (Disesuaikan Penuh Sesuai User yang Login)
         ========================================================================= */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          padding: '18px 24px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--r-full)',
              overflow: 'hidden',
              background: '#f1f5f9',
              border: '2px solid var(--hair)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={getAvatarSrc(currentUser.avatar)}
              alt={currentUser.name}
              onError={(e) => {
                const target = e.currentTarget
                if (!target.src.endsWith('/user.png')) {
                  target.src = '/user.png'
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                {currentUser.name}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--r-full)',
                  background: activeRoleMeta.bgColor,
                  color: activeRoleMeta.color,
                  border: `1px solid ${activeRoleMeta.borderColor}`,
                  letterSpacing: '0.02em',
                }}
              >
                {activeRoleMeta.roleBadge}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>NIP: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{currentUser.nip || '-'}</strong></span>
              {currentUser.nuptk && (
                <>
                  <span>&bull;</span>
                  <span>NUPTK: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{currentUser.nuptk}</strong></span>
                </>
              )}
              <span>&bull;</span>
              <span>Unit: <strong>{activeRoleMeta.scopeDesc}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Badge Unit & Kalender */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--r-md)',
            background: 'var(--panel-hover)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ink-secondary)',
          }}
        >
          <Clock size={13} style={{ color: 'var(--brand-600)' }} />
          <span>Periode Semester Genap 2025/2026</span>
        </div>
      </div>

      {/* =========================================================================
          3. CATEGORY SUB-TABS (Navigasi Kategori dengan Indikator Bersih)
         ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderBottom: '1px solid var(--hair)',
          marginBottom: 18,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        <button
          onClick={() => setActiveCategory('alur')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'alur' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'alur' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'alur' ? 700 : 500,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <Layers size={15} />
          <span>Alur &amp; Prosedur Kerja</span>
        </button>

        <button
          onClick={() => setActiveCategory('standar')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'standar' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'standar' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'standar' ? 700 : 500,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <Scale size={15} />
          <span>Standar BKD &amp; Penilaian</span>
        </button>

        <button
          onClick={() => setActiveCategory('checklist')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'checklist' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'checklist' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'checklist' ? 700 : 500,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <CheckSquare size={15} />
          <span>Checklist Mandiri ({completedChecklist}/{totalChecklist})</span>
        </button>

        <button
          onClick={() => setActiveCategory('regulasi')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'regulasi' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'regulasi' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'regulasi' ? 700 : 500,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <FileText size={15} />
          <span>Dasar Hukum &amp; Regulasi</span>
        </button>

        <button
          onClick={() => setActiveCategory('faq')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'faq' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'faq' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'faq' ? 700 : 500,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <HelpCircle size={15} />
          <span>Tanya Jawab (FAQ)</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ALUR & PROSEDUR KERJA (STEPPER)
         ========================================================================= */}
      {activeCategory === 'alur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--card)',
              border: '1px solid var(--hair)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Siklus Alur Kerja Operasional: {activeRoleMeta.title}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
                Fokus Penugasan: {activeRoleMeta.scopeDesc} &bull; {activeRoleMeta.targetAudience}
              </div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--panel-hover)',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              <Clock size={13} style={{ color: 'var(--brand-600)' }} />
              <span>Semester Genap 2025/2026</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredWorkflow.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--hair)', color: 'var(--muted)' }}>
                Tidak ada tahapan alur yang cocok dengan kata kunci "{searchQuery}".
              </div>
            ) : (
              filteredWorkflow.map((item) => (
                <div
                  key={item.step}
                  className="guide-card"
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--hair)',
                    padding: '18px 22px',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'grid',
                    gridTemplateColumns: '46px 1fr',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--r-md)',
                        background: activeRoleMeta.color,
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '15px',
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {item.step}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                          {item.title}
                        </h3>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-sm)',
                              background: 'var(--panel-hover)',
                              color: 'var(--ink-secondary)',
                              fontWeight: 600,
                            }}
                          >
                            Pelaksana: {item.actor}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-sm)',
                              background: 'var(--brand-100)',
                              color: 'var(--brand-700)',
                              fontWeight: 600,
                            }}
                          >
                            Tenggat Waktu: {item.deadline}
                          </span>
                        </div>
                      </div>

                      {item.actionLabel && item.actionNav && onNavigate && (
                        <button
                          onClick={() => onNavigate(item.actionNav!)}
                          className="brand-btn"
                          style={{
                            padding: '6px 13px',
                            fontSize: '12px',
                            borderRadius: 'var(--r-md)',
                          }}
                        >
                          <span>{item.actionLabel}</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '13.5px', color: 'var(--ink-secondary)', lineHeight: 1.6, marginTop: 8, marginBottom: 8 }}>
                      {item.desc}
                    </p>

                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--brand-50)',
                        border: '1px solid var(--brand-100)',
                        fontSize: '12px',
                        color: 'var(--brand-700)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Sparkles size={13} style={{ flexShrink: 0 }} />
                      <span><strong>Tips Efisiensi:</strong> {item.tips}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STANDAR BKD & PENILAIAN
         ========================================================================= */}
      {activeCategory === 'standar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Card Ketentuan SKS Tridharma */}
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--hair)',
              padding: '22px 26px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Scale size={18} style={{ color: 'var(--brand-600)' }} />
              <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                1. Batas Beban Kerja Dosen (BKD) &amp; Tridharma Perguruan Tinggi
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Berdasarkan Pedoman Operasional BKD Ditjen Diktiristek dan Standar SPMI UBK No. 03.07.00/PD/SDM-SPMI, seluruh dosen wajib memenuhi ketentuan proporsi beban kerja berikut:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Batas Minimal BKD</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-600)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  12 SKS
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                  Kurang dari 12 SKS dinyatakan Tidak Memenuhi Standar BKD.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Batas Maksimal BKD</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  16 SKS
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                  Lebih dari 16 SKS wajib mengantongi disposisi Dekan.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Minimal Pengajaran</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-success-ink)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  4 SKS
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                  Wajib ada mata kuliah yang diampu di prodi homebase.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Riset &amp; PKM</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0369a1', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  Min. 1 / Thn
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>
                  Minimal 1 publikasi artikel dan 1 pengabdian per tahun.
                </div>
              </div>
            </div>
          </div>

          {/* Card Formula Pembobotan Nilai Akhir */}
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--hair)',
              padding: '22px 26px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Award size={18} style={{ color: 'var(--brand-600)' }} />
              <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                2. Formula Pembobotan Resmi SPMI UBK (SK Rektor No. 03.07.00/PD/SDM)
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Nilai Kinerja Pegawai dihitung secara komposit dengan formula penjaminan mutu resmi:
            </p>

            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--navy-900)',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '14.5px',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.02em',
                marginBottom: 14,
              }}
            >
              Nilai Akhir = (Skor SKP Tridharma × 70%) + (Skor Kuesioner BerAKHLAK × 30%)
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--panel-hover)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Rentang Skor</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Predikat Kinerja</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Implikasi &amp; Konsekuensi Institusional</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--status-success-ink)', fontVariantNumeric: 'tabular-nums' }}>91.00 s.d. 100.00</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge--success">Sangat Baik</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-secondary)' }}>
                      Rekomendasi promosi jabatan fungsional, insentif karya ilmiah unggulan, dan apresiasi dosen berprestasi UBK.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0369a1', fontVariantNumeric: 'tabular-nums' }}>76.00 s.d. 90.99</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge--info">Baik</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-secondary)' }}>
                      Memenuhi standar baku mutu SPMI. Berhak atas kenaikan gaji berkala dan perpanjangan kontrak/ikatan kerja dosen.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#b45309', fontVariantNumeric: 'tabular-nums' }}>61.00 s.d. 75.99</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge--warning">Butuh Perbaikan</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-secondary)' }}>
                      Diberikan pembinaan oleh Dekan dan Ka.Prodi. Wajib mengikuti klinik penulisan publikasi LPPM UBK.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--status-danger-ink)', fontVariantNumeric: 'tabular-nums' }}>51.00 s.d. 60.99</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge--danger">Kurang</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-secondary)' }}>
                      Surat peringatan resmi Direktorat SDM. Penundaan kenaikan pangkat akademik dan evaluasi beban mengajar.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--status-danger-ink)', fontVariantNumeric: 'tabular-nums' }}>&lt; 51.00</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge--danger">Sangat Kurang</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-secondary)' }}>
                      Peninjauan status ikatan kerja oleh Rektorat dan Yayasan Bhakti Kencana.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Critical Point BerAKHLAK */}
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--hair)',
              padding: '22px 26px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={18} style={{ color: 'var(--brand-600)' }} />
              <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                3. Ketentuan Poin Kritis (Critical Point) Kuesioner BerAKHLAK
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
              Pada formulir penilaian kuesioner perilaku, terdapat 7 dimensi (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif). <strong>Indikator No. 1 pada setiap dimensi berstatus Critical Point (Poin Kritis)</strong>:
            </p>
            <ul style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Dosen wajib memperoleh skor minimal <strong>3 (Baik)</strong> pada seluruh Critical Point untuk memperoleh predikat Baik atau Sangat Baik.</li>
              <li>Jika salah satu Critical Point bernilai di bawah 3, predikat maksimal otomatis diturunkan menjadi Butuh Perbaikan terlepas dari tingginya skor SKP Tridharma.</li>
              <li>Penilai (Kaprodi atau Dekan) wajib mencantumkan catatan pembinaan apabila memberikan skor 1 atau 2 pada indikator mana pun.</li>
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CHECKLIST MANDIRI & EVALUASI
         ========================================================================= */}
      {activeCategory === 'checklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Progress Header */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--card)',
              border: '1px solid var(--hair)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
                Checklist Mandiri: {activeRoleMeta.title}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
                Tersimpan otomatis untuk akun <strong>{currentUser.name}</strong> (NIP: {currentUser.nip || '-'}).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--muted)' }}>Tingkat Keterisian</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: checklistPercentage === 100 ? 'var(--status-success-ink)' : 'var(--brand-600)', fontVariantNumeric: 'tabular-nums' }}>
                  {checklistPercentage}% ({completedChecklist}/{totalChecklist})
                </div>
              </div>
              <button
                onClick={handleResetChecklist}
                className="icon-btn"
                title="Reset checklist peran ini"
                style={{ width: 34, height: 34 }}
                aria-label="Reset checklist"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 7, background: 'var(--panel-hover)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${checklistPercentage}%`,
                height: '100%',
                background: checklistPercentage === 100 ? 'var(--status-success-ink)' : 'var(--brand-600)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentChecklist.map((item) => {
              const isChecked = Boolean(checkedItems[item.id])
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="guide-card guide-interactive-card"
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--r-lg)',
                    background: isChecked ? 'var(--brand-50)' : 'var(--card)',
                    border: isChecked ? '1px solid var(--brand-100)' : '1px solid var(--hair)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 'var(--r-xs)',
                      border: isChecked ? 'none' : '2px solid var(--hair-strong)',
                      background: isChecked ? 'var(--brand-600)' : '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {isChecked && <Check size={13} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: isChecked ? 'var(--brand-700)' : 'var(--ink)',
                          textDecoration: isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.mandatory && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--r-sm)',
                            background: 'var(--status-danger-bg)',
                            color: 'var(--status-danger-ink)',
                          }}
                        >
                          Wajib
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DASAR HUKUM & REGULASI
         ========================================================================= */}
      {activeCategory === 'regulasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--hair)',
              padding: '22px 26px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <FileText size={18} style={{ color: 'var(--brand-600)' }} />
              <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Landasan Yuridis &amp; Regulasi Pengelolaan Kinerja Pegawai
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Seluruh sistem evaluasi kinerja di Portal SDM Universitas Bhakti Kencana diselaraskan dengan peraturan perundang-undangan nasional dan standar penjaminan mutu internal:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  1. Peraturan Menteri PAN-RB Republik Indonesia Nomor 6 Tahun 2022
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  Tentang Pengelolaan Kinerja Pegawai Aparatur Sipil Negara dan Lembaga Pendidikan Tinggi, yang menetapkan prinsip evaluasi berkala berkelanjutan dan adopsi nilai dasar BerAKHLAK.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  2. Pedoman Operasional Beban Kerja Dosen (PO BKD) Ditjen Diktiristek Kemendikbudristek
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  Mengatur ketentuan pemenuhan Tridharma minimal 12 SKS dan maksimal 16 SKS per semester serta kewajiban pelaksanaan penelitian dan pengabdian kepada masyarakat.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  3. Pedoman SPMI UBK No. 03.07.00/PD/SDM-SPMI Tahun 2026
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  Standar mutu internal Universitas Bhakti Kencana tentang tata kelola evaluasi dosen, bobot 70% SKP dan 30% Perilaku, serta mekanisme persetujuan berjenjang Kaprodi, Dekan, dan SDM.
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--panel-hover)', border: '1px solid var(--hair)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  4. Surat Keputusan Rektor UBK tentang Kalender Pengisian SKP &amp; Kuesioner Semester Genap 2025/2026
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  Menetapkan tenggat waktu resmi pengajuan rencana di pekan ke-4, verifikasi Kaprodi di pekan ke-6, dan finalisasi pengesahan sebelum pelaksanaan yudisium kelulusan.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TANYA JAWAB (FAQ)
         ========================================================================= */}
      {activeCategory === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--card)',
              border: '1px solid var(--hair)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Pertanyaan yang Sering Diajukan (FAQ) &bull; {activeRoleMeta.title}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
                Solusi praktis kendala pengisian, validasi berkas, dan penghitungan nilai.
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
              Menampilkan {filteredFaq.length} pertanyaan
            </div>
          </div>

          {filteredFaq.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--hair)', color: 'var(--muted)' }}>
              Tidak ada pertanyaan yang cocok dengan kata kunci "{searchQuery}".
            </div>
          ) : (
            filteredFaq.map((item, idx) => {
              const isExpanded = expandedFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="guide-card"
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--hair)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--brand-100)',
                          color: 'var(--brand-700)',
                        }}
                      >
                        {item.tag}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                        {item.q}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 18px 16px 18px',
                        fontSize: '13px',
                        color: 'var(--ink-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--hair)',
                        background: 'var(--panel-hover)',
                        paddingTop: 12,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
