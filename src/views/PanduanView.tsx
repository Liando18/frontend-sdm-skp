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
  ChevronDown,
  ChevronRight,
  Printer,
  Clock,
  Layers,
  Scale,
  Check,
  AlertTriangle,
  ExternalLink,
  Compass,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Info,
  Share2,
  FileSpreadsheet,
  Eye,
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

type TabCategory = 'alur' | 'fitur' | 'standar' | 'faq'

interface StepItem {
  step: number
  title: string
  menuPath: string
  actor: string
  desc: string
  actionLabel?: string
  actionNav?: string
  tips: string
  keyPoints: string[]
}

interface FeatureItem {
  id: string
  title: string
  menuName: string
  navId?: string
  desc: string
  badgeText: string
  badgeType: 'blue' | 'green' | 'orange' | 'purple'
}

interface FAQItem {
  q: string
  a: string
  tag: string
}

export const PanduanView: React.FC<PanduanViewProps> = ({
  currentRole,
  currentUser,
  onNavigate,
  onShowToast,
}) => {
  // Panduan dikunci eksklusif sesuai peran pengguna yang sedang aktif login
  const selectedRole: Role = currentRole
  const [activeCategory, setActiveCategory] = useState<TabCategory>('alur')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0)

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
      scopeDesc: string
    }
  > = {
    dosen: {
      title: 'Dosen (Pendidik & Peneliti)',
      roleBadge: 'Pendidik & Peneliti',
      headline: `Panduan Penggunaan Sistem bagi Dosen: Pengisian SKP & Pelaporan Tridharma`,
      shortDesc: 'Panduan operasional aplikasi bagi Dosen untuk merencanakan beban kerja 12 hingga 16 SKS, mengunggah bukti fisik Google Drive, memantau verifikasi, dan mencetak dokumen sah.',
      icon: GraduationCap,
      color: 'var(--brand-600)',
      bgColor: 'var(--brand-50)',
      borderColor: 'var(--brand-100)',
      scopeDesc: `Program Studi ${currentUser.prodi || 'Homebase Dosen'}`,
    },
    kaprodi: {
      title: 'Ketua Program Studi (Kaprodi)',
      roleBadge: 'Verifikator Tahap I & Penilai',
      headline: `Panduan Penggunaan Sistem bagi Kaprodi: Verifikasi SKP & Evaluasi Perilaku Dosen`,
      shortDesc: 'Panduan operasional bagi Kaprodi untuk memantau keterisian kinerja dosen homebase, memverifikasi butir Tridharma, mengisi evaluasi BerAKHLAK, dan menyusun SKP jabatan prodi.',
      icon: Users,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      scopeDesc: `Manajemen Dosen Program Studi ${currentUser.prodi || 'Homebase'}`,
    },
    dekan: {
      title: 'Dekanat / Pimpinan Fakultas',
      roleBadge: 'Supervisi & Verifikator Tahap II',
      headline: `Panduan Penggunaan Sistem bagi Dekanat: Supervisi Fakultas & Verifikasi Kaprodi`,
      shortDesc: 'Panduan operasional Dekan dan Wakil Dekan untuk mengawasi progres fakultas, memvalidasi SKP manajerial Ketua Program Studi, mengevaluasi BerAKHLAK, dan mengesahkan izin beban lebih.',
      icon: Building2,
      color: '#7c3aed',
      bgColor: '#faf5ff',
      borderColor: '#e9d5ff',
      scopeDesc: currentUser.fakultas || currentUser.kampus || 'Wilayah Fakultas / PSDKU',
    },
    sdm: {
      title: 'Direktorat SDM (Administrator)',
      roleBadge: 'Administrator & Pengesah Akhir',
      headline: 'Panduan Penggunaan Sistem bagi Direktorat SDM: Pengelolaan Master & Pengesahan Institusi',
      shortDesc: 'Panduan operasional administrator kepegawaian untuk mengelola master data dosen, menetapkan standar komponen SPMI, mengesahkan SKP final ber-barcode, dan mengekspor rekapitulasi.',
      icon: ShieldCheck,
      color: 'var(--navy-900)',
      bgColor: 'var(--navy-100)',
      borderColor: 'var(--hair-strong)',
      scopeDesc: 'Tingkat Institusi Universitas Bhakti Kencana (Pusat & PSDKU)',
    },
  }

  // Stepper workflow per role (Langkah demi Langkah Cara Pakai Aplikasi)
  const workflowData: Record<Role, StepItem[]> = {
    dosen: [
      {
        step: 1,
        title: 'Buka Halaman SKP Saya & Pilih Periode Semester',
        menuPath: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        actor: 'Dosen Mandiri',
        desc: 'Masuk melalui sidebar menu "Kinerja Saya" lalu pilih "Sasaran Kinerja Pegawai". Pada bagian atas, pastikan semester aktif terpilih sesuai periode tahun akademik berjalan.',
        actionLabel: 'Buka Menu SKP Saya',
        actionNav: 'skp-dosen-self',
        tips: 'Jika belum memiliki draf pengajuan pada semester aktif, klik tombol "Buat Pengajuan SKP Baru" untuk memulai.',
        keyPoints: [
          'Pastikan identitas homebase prodi dan jabatan fungsional sudah sesuai di profil.',
          'Status awal pengajuan adalah "Draft" sehingga Anda bebas mengedit kapan saja.',
        ],
      },
      {
        step: 2,
        title: 'Input Butir Rencana Kinerja Tridharma (12 - 16 SKS)',
        menuPath: 'Formulir SKP > Tambah Butir Kegiatan',
        actor: 'Dosen Mandiri',
        desc: 'Klik tombol "Tambah Butir Kegiatan". Pilih kategori Tridharma yang ingin diisi: Pendidikan & Pengajaran (wajib minimal 4 SKS), Penelitian, Pengabdian kepada Masyarakat (PKM), atau Penunjang (maksimal 3 SKS). Tentukan target kuantitas output, mutu capaian, dan estimasi waktu pelaksanaan.',
        tips: 'Perhatikan indikator akumulasi SKS di bagian atas formulir. Sistem secara otomatis mengkalkulasi beban dan memberi penanda jika beban Anda kurang dari 12 SKS atau lebih dari 16 SKS.',
        keyPoints: [
          'Beban standar SPMI adalah 12 sampai 16 SKS per semester.',
          'Jika Anda menjabat tugas struktural, masukkan butir penugasan pada kategori Penunjang/Tugas Tambahan.',
        ],
      },
      {
        step: 3,
        title: 'Tautkan Link Bukti Fisik Dokumen (Google Drive Terbuka)',
        menuPath: 'Formulir SKP > Kolom Link Dokumen Bukti',
        actor: 'Dosen Mandiri',
        desc: 'Pada setiap butir kegiatan yang telah dilaksanakan, masukkan URL dokumen bukti fisik (seperti SK mengajar, RPS, jurnal artikel, atau laporan pengabdian). Dokumen diunggah ke Google Drive institusi atau Google Drive pribadi.',
        tips: 'Wajib memastikan izin berbagi Google Drive telah diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view) agar verifikator dapat langsung memvalidasi tanpa izin manual.',
        keyPoints: [
          'Gunakan tautan lengkap berformat HTTPS.',
          'Sistem menyediakan tombol cek tautan otomatis untuk memverifikasi akses dokumen Anda.',
        ],
      },
      {
        step: 4,
        title: 'Kirim Pengajuan SKP ke Ketua Program Studi',
        menuPath: 'Formulir SKP > Tombol Ajukan SKP',
        actor: 'Dosen Mandiri',
        desc: 'Setelah seluruh butir kegiatan terisi dan beban SKS memenuhi batas minimal 12 SKS, klik tombol hijau "Ajukan SKP". Sistem akan memvalidasi kelengkapan berkas dan memindahkan status dari "Draft" menjadi "Diajukan".',
        tips: 'Setelah diajukan, berkas akan terkunci dari pengeditan sementara waktu agar Kaprodi dapat memeriksa tanpa adanya benturan perubahan data.',
        keyPoints: [
          'Notifikasi verifikasi otomatis masuk ke antrean tugas Ketua Program Studi Anda.',
          'Anda dapat memantau status berkas secara realtime melalui Dashboard Dosen.',
        ],
      },
      {
        step: 5,
        title: 'Tangani Catatan Revisi (Bila Ada Pengembalian Berkas)',
        menuPath: 'Kinerja Saya > SKP Dosen > Notifikasi Revisi',
        actor: 'Dosen Mandiri',
        desc: 'Jika verifikator (Kaprodi atau Dekan) menemukan kekurangan berkas atau SKS tidak sesuai, berkas dikembalikan dengan status "Perlu Revisi". Buka formulir SKP Anda, baca pesan pada kotak "Catatan Verifikator" di bagian atas, lakukan koreksi butir yang diminta, lalu klik "Ajukan Ulang SKP".',
        tips: 'Perbaiki hanya butir kegiatan yang diminta pada catatan revisi agar proses penilaian ulang berjalan cepat.',
        keyPoints: [
          'Kolom catatan verifikator merinci dokumen apa yang perlu diperbaiki.',
          'Setelah klik Ajukan Ulang, status berkas kembali ke "Diajukan".',
        ],
      },
      {
        step: 6,
        title: 'Cetak Dokumen Resmi SKP & Transkrip Nilai Tahunan',
        menuPath: 'Kinerja Saya > Hasil Kinerja Tahunan / Cetak SKP',
        actor: 'Dosen Mandiri',
        desc: 'Ketika status berkas telah mencapai "Terbit" atau "Disahkan", tombol cetak resmi akan aktif. Anda dapat membuka formulir cetak SKP lengkap dengan barcode verifikasi dokumen sah, serta mencetak Transkrip Capaian Kinerja Tahunan (kombinasi 70% SKP + 30% Kuesioner BerAKHLAK).',
        actionLabel: 'Lihat Hasil Kinerja Tahunan',
        actionNav: 'hasil-kinerja-dosen',
        tips: 'Dokumen pratinjau cetak dapat langsung disimpan sebagai file PDF melalui menu Print browser (Ctrl+P atau Cmd+P lalu pilih Save as PDF).',
        keyPoints: [
          'Format cetak telah disesuaikan dengan standar A4 instansi Universitas Bhakti Kencana.',
          'Daftar tanda tangan pejabat penilai dan Rektor tercantum secara otomatis sesuai data kepegawaian.',
        ],
      },
    ],
    kaprodi: [
      {
        step: 1,
        title: 'Pantau Keterisian Kinerja Dosen di Dashboard Kaprodi',
        menuPath: 'Beranda / Dashboard Kaprodi',
        actor: 'Ketua Program Studi',
        desc: 'Buka dashboard utama untuk melihat ringkasan statistik keterisian SKP seluruh dosen homebase program studi Anda. Periksa jumlah dosen yang berstatus Draft, Diajukan, Perlu Tindakan, dan Selesai.',
        actionLabel: 'Buka Dashboard Kaprodi',
        actionNav: 'dashboard',
        tips: 'Gunakan kartu metrik di dashboard untuk melihat dosen mana saja yang belum mengajukan rencana kerja hingga batas waktu yang ditentukan.',
        keyPoints: [
          'Data statistik diperbarui secara realtime dari database institusi.',
          'Memudahkan identifikasi dosen yang memerlukan bimbingan pengisian.',
        ],
      },
      {
        step: 2,
        title: 'Periksa & Verifikasi Berkas SKP Dosen Homebase',
        menuPath: 'Monitoring & Verifikasi > Verifikasi SKP Dosen',
        actor: 'Ketua Program Studi',
        desc: 'Masuk ke menu "Verifikasi SKP Dosen". Pilih nama dosen yang berstatus "Diajukan". Klik tombol "Periksa Berkas". Teliti kesesuaian butir Tridharma, beban SKS (12-16 SKS), dan klik tautan Google Drive untuk memastikan bukti fisik dapat dibuka dan valid.',
        actionLabel: 'Buka Verifikasi SKP Dosen',
        actionNav: 'review-skp-kaprodi',
        tips: 'Jika berkas valid, klik "Setujui SKP" sehingga status naik menjadi "Dinilai Kaprodi". Jika terdapat kekurangan bukti, klik "Kembalikan" dan tuliskan instruksi perbaikan yang jelas di kotak catatan.',
        keyPoints: [
          'Pastikan pengajaran minimal 4 SKS telah dipenuhi oleh dosen biasa.',
          'Catatan revisi wajib diisi jika Anda memilih mengembalikan pengajuan.',
        ],
      },
      {
        step: 3,
        title: 'Isi Penilaian Kuesioner Perilaku Kerja BerAKHLAK Dosen',
        menuPath: 'Evaluasi Kinerja > Penilaian Kuesioner Dosen',
        actor: 'Ketua Program Studi',
        desc: 'Buka menu "Penilaian Kuesioner Dosen" pada akhir tahun akademik. Pilih dosen homebase, lalu berikan penilaian obyektif pada 7 dimensi BerAKHLAK (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) menggunakan skala 1 (Kurang) hingga 4 (Sangat Baik).',
        actionLabel: 'Buka Penilaian Kuesioner',
        actionNav: 'kuesioner-kaprodi',
        tips: 'Indikator nomor 1 pada setiap aspek merupakan Poin Kritis (Critical Point). Pastikan indikator ini dinilai dengan cermat karena menjadi prasyarat predikat Baik.',
        keyPoints: [
          'Penilaian perilaku BerAKHLAK berkontribusi 30% terhadap Nilai Akhir Kinerja.',
          'Sistem secara otomatis menghitung total skor, rata-rata, dan konversi predikat.',
        ],
      },
      {
        step: 4,
        title: 'Susun SKP Tugas Jabatan Mandiri Kaprodi ke Dekan',
        menuPath: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        actor: 'Kaprodi (Sebagai Pegawai)',
        desc: 'Sebagai Ketua Program Studi, Anda juga memiliki kewajiban menyusun SKP pribadi yang mencakup tugas Tridharma serta butir kepemimpinan manajerial program studi. Kirimkan SKP Anda ke Dekanat untuk diverifikasi langsung oleh Dekan Fakultas.',
        actionLabel: 'Isi SKP Mandiri Kaprodi',
        actionNav: 'skp-kaprodi-self',
        tips: 'Butir kegiatan manajerial prodi (pengembangan kurikulum, akreditasi, koordinasi pengajaran) dapat dimasukkan pada kategori Tugas Tambahan/Penunjang.',
        keyPoints: [
          'SKP Kaprodi akan dinilai pada verifikasi Tahap II oleh Dekan Fakultas.',
          'Evaluasi BerAKHLAK Anda juga dinilai secara langsung oleh Dekan.',
        ],
      },
    ],
    dekan: [
      {
        step: 1,
        title: 'Supervisi Capaian Tridharma Lintas Program Studi Fakultas',
        menuPath: 'Beranda / Dashboard Dekan',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Akses Dashboard Dekan untuk mengamati perkembangan pengajuan SKP di seluruh program studi di bawah naungan fakultas. Pantau perbandingan persentase penyelesaian verifikasi antar program studi.',
        actionLabel: 'Buka Dashboard Dekanat',
        actionNav: 'dashboard',
        tips: 'Gunakan filter prodi di dashboard jika ingin melihat analisis performa per unit kerja secara spesifik.',
        keyPoints: [
          'Memberikan visibilitas menyeluruh terhadap tingkat kepatuhan dosen fakultas.',
          'Membantu mendeteksi kendala administratif pada program studi tertentu.',
        ],
      },
      {
        step: 2,
        title: 'Verifikasi & Persetujuan SKP Ketua Program Studi',
        menuPath: 'Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Masuk ke menu "Verifikasi SKP Ka.Prodi". Buka pengajuan kinerja para Ketua Program Studi. Teliti sasaran manajerial program studi dan ketercapaian Tridharma. Klik "Setujui" untuk menaikkan status menjadi "Dinilai Dekan" agar siap disahkan oleh Direktorat SDM.',
        actionLabel: 'Buka Verifikasi Ka.Prodi',
        actionNav: 'review-skp-dekan',
        tips: 'Dekan juga dapat mengembalikan berkas Kaprodi dengan catatan revisi apabila indikator kinerja program studi belum terlampir dengan lengkap.',
        keyPoints: [
          'Persetujuan Dekanat adalah syarat mutlak sebelum berkas diterbitkan oleh SDM.',
          'Pastikan target program studi selaras dengan Renstra Fakultas.',
        ],
      },
      {
        step: 3,
        title: 'Evaluasi Kuesioner Kepemimpinan BerAKHLAK Kaprodi',
        menuPath: 'Evaluasi Kinerja > Evaluasi Kinerja Ka.Prodi',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Buka menu evaluasi kinerja Kaprodi untuk memberikan penilaian 7 aspek BerAKHLAK dengan fokus pada kepemimpinan, koordinasi kurikulum, akuntabilitas anggaran prodi, dan kolaborasi antar unit.',
        actionLabel: 'Evaluasi BerAKHLAK Ka.Prodi',
        actionNav: 'kuesioner-dekan',
        tips: 'Sertakan catatan pembinaan manajerial pada kolom evaluasi untuk mendukung pengembangan kepemimpinan Kaprodi.',
        keyPoints: [
          'Nilai perilaku ini menyumbang 30% dari capaian akhir kinerja Kaprodi.',
          'Dapat diakses pada jendela evaluasi tahunan universitas.',
        ],
      },
      {
        step: 4,
        title: 'Pengesahan Disposisi Kelebihan Beban Dosen (> 16 SKS)',
        menuPath: 'Administrasi Fakultas / Disposisi SKS',
        actor: 'Dekan Fakultas',
        desc: 'Bagi dosen yang mengampu penugasan strategis mendesak sehingga beban mengajarnya melampaui 16 SKS (misal persiapan akreditasi internasional atau riset khusus), Dekan menandatangani surat disposisi resmi agar kelebihan SKS diakui oleh SDM.',
        tips: 'Surat disposisi diarsipkan dan dicatat dalam berita acara pengesahan tingkat fakultas.',
        keyPoints: [
          'Mencegah status berkas dosen terhambat saat verifikasi institusi.',
          'Berlaku selama satu semester penugasan khusus.',
        ],
      },
    ],
    sdm: [
      {
        step: 1,
        title: 'Kelola Master Data Kepegawaian Dosen & Pejabat',
        menuPath: 'Master & Laporan > Data Kepegawaian Dosen',
        actor: 'Administrator SDM',
        desc: 'Masuk ke menu "Data Kepegawaian Dosen". Tambah dosen baru atau perbarui profil data dosen yang ada (NIP, NUPTK, Nama, Homebase Prodi, Kampus/PSDKU, Jabatan Fungsional, Pangkat/Golongan, Status Kepegawaian, dan Jabatan Kampus). Gunakan filter multi-kriteria untuk pencarian cepat serta unduh data via Ekspor XLSX.',
        actionLabel: 'Kelola Data Dosen',
        actionNav: 'data-dosen',
        tips: 'Setiap penugasan jabatan tunggal (seperti Kaprodi atau Dekan) dilindungi sistem agar tidak terjadi penetapan ganda tanpa pelepasan jabatan sebelumnya.',
        keyPoints: [
          'Filter data dosen mencakup Fakultas, Prodi, Kampus, Jabatan, Pangkat, dan Status.',
          'Ekspor XLSX menghasilkan data rekapitulasi yang sesuai dengan filter yang aktif.',
        ],
      },
      {
        step: 2,
        title: 'Konfigurasi Master Komponen SKP & Indikator Kuesioner',
        menuPath: 'Master & Laporan > Komponen SKP & Indikator Kinerja',
        actor: 'Administrator SDM',
        desc: 'Kelola katalog komponen kegiatan Tridharma (bobot SKS, bukti fisik wajib, dan batas SKS maksimum) sesuai standar SPMI terbaru. Atur pula indikator kuesioner BerAKHLAK dan tetapkan status Poin Kritis (Critical Point) pada butir indikator utama.',
        actionLabel: 'Master Komponen SKP',
        actionNav: 'komponen-skp',
        tips: 'Penyesuaian komponen hanya berlaku untuk pengajuan SKP baru dan tidak akan merusak arsip SKP terdahulu yang sudah terbit.',
        keyPoints: [
          'Memastikan seluruh dosen memilih butir kegiatan yang telah terstandarisasi.',
          'Konfigurasi bobot penilaian tersimpan aman di database institusi.',
        ],
      },
      {
        step: 3,
        title: 'Validasi Akhir & Penerbitan Dokumen SKP Terbit Sah',
        menuPath: 'Monitoring & Verifikasi > Pusat Validasi & Pengesahan SKP',
        actor: 'Administrator SDM',
        desc: 'Masuk ke menu "Pusat Validasi & Pengesahan SKP Dosen". Buka daftar pengajuan yang telah disetujui Dekan (status "Dinilai Dekan"). Periksa kepatuhan akhir, lalu klik "Sahkan SKP". Status berkas otomatis berubah menjadi "Sah & Terbit Resmi" dengan TTD Digital Rektor dan barcode keabsahan.',
        actionLabel: 'Buka Pengesahan SKP',
        actionNav: 'skp-dosen',
        tips: 'Setelah SKP disahkan oleh SDM, dosen bersangkutan dan pimpinan dapat langsung mencetak formulir resmi ber-kop universitas.',
        keyPoints: [
          'Dokumen sah memuat nama Rektor yang aktif secara dinamis dari database.',
          'Barcode keabsahan menjamin keotentikan dokumen cetak saat diajukan untuk BKD atau akreditasi.',
        ],
      },
      {
        step: 4,
        title: 'Penarikan Laporan Rekapitulasi & Ekspor Akreditasi',
        menuPath: 'Master & Laporan > Laporan & Rekapitulasi Institusi',
        actor: 'Administrator SDM',
        desc: 'Buka menu "Laporan & Rekapitulasi Institusi". Pilih tahun akademik dan filter berdasarkan fakultas atau unit kerja. Lihat sebaran predikat kinerja institusi (Sangat Baik, Baik, Cukup, Kurang) dan unduh file Excel komprehensif untuk pelaporan ke Yayasan, LLDIKTI, BAN-PT, maupun LAM-PTKes.',
        actionLabel: 'Buka Laporan Institusi',
        actionNav: 'laporan',
        tips: 'Laporan ini dapat digunakan sebagai dasar pertimbangan insentif kinerja dosen dan evaluasi perpanjangan kontrak.',
        keyPoints: [
          'Menyajikan grafik distribusi kinerja dan rata-rata SKS Tridharma.',
          'Ekspor format spreadsheet rapi dengan format tabular angka resmi.',
        ],
      },
    ],
  }

  // Peta Fitur & Menu Aplikasi per Role
  const featureList: Record<Role, FeatureItem[]> = {
    dosen: [
      {
        id: 'feat_dosen_1',
        title: 'Dashboard Kinerja Dosen',
        menuName: 'Beranda / Dashboard',
        navId: 'dashboard',
        desc: 'Pusat informasi status SKP semester aktif, akumulasi total SKS rencana vs realisasi, notifikasi revisi berkas, dan grafik capaian Tridharma.',
        badgeText: 'Navigasi Utama',
        badgeType: 'blue',
      },
      {
        id: 'feat_dosen_2',
        title: 'Formulir Sasaran Kinerja Pegawai (SKP)',
        menuName: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        navId: 'skp-dosen-self',
        desc: 'Antarmuka pengisian rencana kegiatan Tridharma, input SKS, tautan bukti Google Drive terbuka, dan pengajuan ke Ketua Program Studi.',
        badgeText: 'Fitur Inti',
        badgeType: 'green',
      },
      {
        id: 'feat_dosen_3',
        title: 'Hasil Kinerja Tahunan & Transkrip',
        menuName: 'Kinerja Saya > Hasil Kinerja Tahunan',
        navId: 'hasil-kinerja-dosen',
        desc: 'Rekapitulasi nilai akhir gabungan 70% capaian SKP dan 30% kuesioner BerAKHLAK beserta predikat kinerja resmi dan arsip semester terdahulu.',
        badgeText: 'Capaian Mutu',
        badgeType: 'purple',
      },
      {
        id: 'feat_dosen_4',
        title: 'Pratinjau & Cetak Dokumen Ber-Barcode',
        menuName: 'Tombol Cetak pada Formulir & Transkrip',
        desc: 'Halaman cetak berstandar format A4 resmi Universitas Bhakti Kencana lengkap dengan barcode verifikasi dokumen sah dan tanda tangan digital.',
        badgeText: 'Dokumen Sah',
        badgeType: 'orange',
      },
    ],
    kaprodi: [
      {
        id: 'feat_kaprodi_1',
        title: 'Dashboard Monitoring Homebase',
        menuName: 'Beranda / Dashboard Kaprodi',
        navId: 'dashboard',
        desc: 'Monitoring agregat keterisian SKP seluruh dosen di program studi, grafik pemenuhan batas 12-16 SKS, dan tabel dosen yang perlu ditindaklanjuti.',
        badgeText: 'Supervisi Prodi',
        badgeType: 'blue',
      },
      {
        id: 'feat_kaprodi_2',
        title: 'Verifikasi & Catatan Revisi SKP Dosen',
        menuName: 'Monitoring & Verifikasi > Verifikasi SKP Dosen',
        navId: 'review-skp-kaprodi',
        desc: 'Pusat pemeriksaan butir kegiatan, validasi keabsahan dokumen bukti fisik Google Drive, persetujuan pengajuan, atau pengembalian dengan catatan revisi.',
        badgeText: 'Verifikasi Tahap I',
        badgeType: 'green',
      },
      {
        id: 'feat_kaprodi_3',
        title: 'Instrumen Penilaian Kuesioner BerAKHLAK',
        menuName: 'Evaluasi Kinerja > Penilaian Kuesioner Dosen',
        navId: 'kuesioner-kaprodi',
        desc: 'Formulir penilaian 7 dimensi perilaku kerja dosen homebase dengan penanda Poin Kritis dan kalkulasi otomatis nilai perilaku 30%.',
        badgeText: 'Evaluasi Perilaku',
        badgeType: 'purple',
      },
      {
        id: 'feat_kaprodi_4',
        title: 'Pengisian SKP Tugas Jabatan Kaprodi',
        menuName: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        navId: 'skp-kaprodi-self',
        desc: 'Pengajuan SKP pribadi tugas tambahan manajerial dan Tridharma Kaprodi untuk diverifikasi dan dinilai langsung oleh Dekan Fakultas.',
        badgeText: 'Kinerja Mandiri',
        badgeType: 'orange',
      },
    ],
    dekan: [
      {
        id: 'feat_dekan_1',
        title: 'Dashboard Eksekutif Fakultas',
        menuName: 'Beranda / Dashboard Dekan',
        navId: 'dashboard',
        desc: 'Pemantauan komprehensif tingkat kepatuhan SKP lintas program studi di fakultas, grafik sebaran beban kerja, dan ringkasan persetujuan.',
        badgeText: 'Supervisi Fakultas',
        badgeType: 'blue',
      },
      {
        id: 'feat_dekan_2',
        title: 'Verifikasi SKP Ketua Program Studi',
        menuName: 'Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi',
        navId: 'review-skp-dekan',
        desc: 'Penelaahan sasaran kinerja kepemimpinan akademik dan Tridharma para Kaprodi untuk memberikan persetujuan Tahap II tingkat Fakultas.',
        badgeText: 'Verifikasi Tahap II',
        badgeType: 'green',
      },
      {
        id: 'feat_dekan_3',
        title: 'Evaluasi Kuesioner Kepemimpinan Kaprodi',
        menuName: 'Evaluasi Kinerja > Evaluasi Kinerja Ka.Prodi',
        navId: 'kuesioner-dekan',
        desc: 'Penilaian 7 pilar perilaku kepemimpinan para Ketua Program Studi dalam mengelola program studi dan mengawal kurikulum.',
        badgeText: 'Evaluasi Pimpinan',
        badgeType: 'purple',
      },
      {
        id: 'feat_dekan_4',
        title: 'Pengesahan Disposisi Beban Lebih',
        menuName: 'Administrasi Fakultas / Disposisi SKS',
        desc: 'Pengesahan persetujuan bagi dosen yang mengampu tugas strategis khusus dengan beban kerja melebihi 16 SKS.',
        badgeText: 'Otoritas Khusus',
        badgeType: 'orange',
      },
    ],
    sdm: [
      {
        id: 'feat_sdm_1',
        title: 'Dashboard Analitik SDM Institusi',
        menuName: 'Beranda / Dashboard SDM',
        navId: 'dashboard',
        desc: 'Panel eksekutif pemantauan kepatuhan institusi, KPI beban rata-rata SKS, grafik sebaran jabatan fungsional dosen, dan notifikasi pengesahan.',
        badgeText: 'Analitik Institusi',
        badgeType: 'blue',
      },
      {
        id: 'feat_sdm_2',
        title: 'Pusat Pengesahan & Penerbitan SKP',
        menuName: 'Monitoring & Verifikasi > Pusat Pengesahan SKP Dosen',
        navId: 'skp-dosen',
        desc: 'Validasi akhir pengajuan yang telah disetujui Dekanat untuk diterbitkan status resmi "Terbit" dengan tanda tangan Rektor dan barcode sah.',
        badgeText: 'Pengesahan Final',
        badgeType: 'green',
      },
      {
        id: 'feat_sdm_3',
        title: 'Kelola Master Data Kepegawaian Dosen',
        menuName: 'Master & Laporan > Data Kepegawaian Dosen',
        navId: 'data-dosen',
        desc: 'Manajemen basis data dosen, mutasi jabatan struktural tunggal berproteksi, filter multi-kriteria seragam, dan ekspor data XLSX realtime.',
        badgeText: 'Master Pegawai',
        badgeType: 'purple',
      },
      {
        id: 'feat_sdm_4',
        title: 'Master Standar Komponen & Rekapitulasi',
        menuName: 'Master & Laporan > Komponen SKP & Laporan Institusi',
        navId: 'laporan',
        desc: 'Konfigurasi bobot komponen Tridharma dan ekspor rekapitulasi data kinerja universitas untuk pelaporan akreditasi BAN-PT / LAM-PTKes.',
        badgeText: 'Laporan & Ekspor',
        badgeType: 'orange',
      },
    ],
  }

  // FAQ cara pakai dan kendala teknis operasional
  const faqData: Record<Role, FAQItem[]> = {
    dosen: [
      {
        q: 'Bagaimana cara menambahkan butir kegiatan Tridharma di formulir SKP?',
        a: 'Masuk ke menu "Kinerja Saya > Sasaran Kinerja Pegawai". Pada tabel butir kegiatan, klik tombol hijau "+ Tambah Butir Kegiatan". Pilih salah satu unsur Tridharma (Pendidikan, Penelitian, Pengabdian, atau Penunjang), pilih nama kegiatan, masukkan target kuantitas, satuan output, target waktu, dan persentase mutu (100%). Total SKS akan otomatis terakumulasi.',
        tag: 'Input Kegiatan',
      },
      {
        q: 'Mengapa tombol "Ajukan SKP" berwarna abu-abu / tidak bisa diklik?',
        a: 'Tombol Ajukan SKP hanya akan aktif jika total beban SKS Anda berada di rentang standar SPMI (antara 12.00 sampai 16.00 SKS). Periksa kembali ringkasan SKS di atas tabel: jika kurang dari 12 SKS, tambahkan butir penugasan; jika lebih dari 16 SKS, sesuaikan beban atau lampirkan izin disposisi dari Dekan.',
        tag: 'Batas SKS',
      },
      {
        q: 'Bagaimana cara menyetel izin tautan Google Drive agar tidak terkendala saat verifikasi?',
        a: 'Saat menyalin link berkas dari Google Drive, pastikan pengaturan Akses Umum (General Access) diatur ke "Siapa saja yang memiliki link" (Anyone with the link) dengan hak akses "Pelihat" (Viewer). Jangan menggunakan opsi "Dibatasi" (Restricted) karena penilai tidak akan bisa membuka berkas tanpa izin khusus.',
        tag: 'Google Drive',
      },
      {
        q: 'Apa yang harus dilakukan jika pengajuan SKP saya berstatus "Perlu Revisi"?',
        a: 'Buka menu SKP Saya. Di bagian atas formulir akan tampil kotak berwarna kuning/merah berisi Catatan Verifikator dari Kaprodi atau Dekan. Baca butir mana yang perlu diperbaiki, edit kegiatan atau perbarui tautan bukti fisik, lalu klik tombol "Ajukan Ulang SKP". Berkas akan kembali masuk ke antrean verifikator.',
        tag: 'Revisi Berkas',
      },
      {
        q: 'Bagaimana cara mengunduh dan mencetak dokumen SKP ber-barcode resmi?',
        a: 'Setelah status berkas Anda berubah menjadi "Terbit" atau "Disahkan", buka menu SKP Saya atau Hasil Kinerja Tahunan. Klik tombol "Cetak Formulir Resmi" atau "Cetak Transkrip". Di jendela pratinjau, klik tombol biru "Cetak / Simpan PDF" di sudut kanan atas untuk mencetak ke printer atau menyimpannya sebagai file PDF.',
        tag: 'Cetak Dokumen',
      },
    ],
    kaprodi: [
      {
        q: 'Bagaimana alur menyetujui atau mengembalikan pengajuan SKP dosen?',
        a: 'Masuk ke menu "Monitoring & Verifikasi > Verifikasi SKP Dosen". Klik tombol "Periksa" pada baris dosen terkait. Periksa rincian kegiatan dan pastikan tautan Google Drive terbuka. Jika sudah memenuhi syarat, klik tombol hijau "Setujui SKP". Jika terdapat berkas yang kurang atau tidak sesuai, klik tombol merah "Kembalikan", ketik catatan perbaikan secara spesifik, lalu konfirmasi pengembalian.',
        tag: 'Verifikasi Berkas',
      },
      {
        q: 'Kapan Kaprodi harus mengisi kuesioner perilaku kerja BerAKHLAK dosen?',
        a: 'Kuesioner BerAKHLAK diisi menjelang akhir tahun akademik setelah seluruh kegiatan semester terlaksana. Masuk ke menu "Evaluasi Kinerja > Penilaian Kuesioner Dosen", pilih nama dosen, dan berikan skor 1 sampai 4 pada 7 pilar. Nilai kuesioner ini akan otomatis menyumbang 30% pada Nilai Akhir Kinerja dosen.',
        tag: 'Kuesioner BerAKHLAK',
      },
      {
        q: 'Apakah Kaprodi juga wajib menyusun SKP mandiri tugas jabatan?',
        a: 'Ya. Kaprodi memiliki peran ganda: sebagai pendidik dan pimpinan struktural prodi. Masuk ke menu "Kinerja Saya > Sasaran Kinerja Pegawai" untuk menyusun SKP tugas kepemimpinan dan Tridharma mandiri Anda. SKP Kaprodi akan diverifikasi langsung oleh Dekan Fakultas.',
        tag: 'SKP Kaprodi',
      },
      {
        q: 'Bagaimana jika ada dosen homebase yang belum mengajukan SKP melewati batas waktu?',
        a: 'Anda dapat memantau nama dosen yang masih berstatus "Draft" atau "Belum Mengajukan" melalui tabel di Dashboard Kaprodi. Anda dapat memberikan pengingat langsung kepada dosen bersangkutan atau berkoordinasi dengan Direktorat SDM jika dosen mengalami kendala penugasan.',
        tag: 'Monitoring',
      },
    ],
    dekan: [
      {
        q: 'Apa yang harus dilakukan Dekan pada menu Verifikasi SKP Ka.Prodi?',
        a: 'Dekan bertindak sebagai Verifikator Tahap II untuk seluruh Ketua Program Studi di fakultasnya. Masuk ke menu "Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi", periksa butir capaian kepemimpinan prodi serta Tridharma Kaprodi, lalu klik "Setujui" agar pengajuan diteruskan ke Direktorat SDM untuk pengesahan final.',
        tag: 'Verifikasi Dekanat',
      },
      {
        q: 'Bagaimana prosedur pemberian persetujuan kelebihan beban SKS (> 16 SKS)?',
        a: 'Jika seorang dosen memiliki beban lebih dari 16 SKS karena kondisi mendesak institusi (misalnya membuka prodi baru atau riset prioritas), Dekanat menerbitkan surat rekomendasi disposisi persetujuan beban lebih. Surat ini dilampirkan agar status pengajuan dosen tidak terhambat sistem saat verifikasi SDM.',
        tag: 'Disposisi Beban',
      },
      {
        q: 'Bagaimana Dekan memantau progres keterisian SKP seluruh fakultas?',
        a: 'Melalui Dashboard Dekan, disajikan grafik statistik komparasi keterisian SKP per program studi. Dekan dapat melihat prodi mana yang telah 100% selesai diverifikasi dan prodi mana yang masih memiliki pengajuan tertunda.',
        tag: 'Dashboard Fakultas',
      },
    ],
    sdm: [
      {
        q: 'Bagaimana cara mengesahkan SKP dosen sehingga statusnya berubah menjadi "Terbit"?',
        a: 'Masuk ke menu "Monitoring & Verifikasi > Pusat Validasi & Pengesahan SKP Dosen". Buka pengajuan dosen yang telah berstatus "Dinilai Dekan". Periksa kepatuhan akhir dokumen, lalu klik "Sahkan SKP". Berkas otomatis berstatus "Sah & Terbit", nama pejabat penilai dan Rektor aktif tercantum, serta barcode digital diaktifkan.',
        tag: 'Pengesahan SKP',
      },
      {
        q: 'Bagaimana cara memperbarui data kepegawaian dosen atau mutasi jabatan struktural?',
        a: 'Buka menu "Master & Laporan > Data Kepegawaian Dosen". Klik tombol "Tambah Dosen Baru" atau klik ikon edit pada baris dosen yang diinginkan. Anda dapat memperbarui NIP, NUPTK, Jabatan Fungsional, Golongan, serta Jabatan Kampus. Sistem telah dilengkapi proteksi agar jabatan tunggal (seperti Kaprodi atau Dekan) tidak dapat diisi ganda.',
        tag: 'Master Dosen',
      },
      {
        q: 'Bagaimana cara mengekspor rekapitulasi data dosen sesuai filter yang dipilih ke Excel?',
        a: 'Pada halaman "Data Kepegawaian Dosen", gunakan filter di bagian atas (Fakultas, Prodi, Kampus, Jabatan, Pangkat, atau Status). Setelah data di tabel tersaring sesuai kebutuhan Anda, klik tombol "Ekspor XLSX". Sistem akan mengunduh file spreadsheet resmi yang hanya memuat data hasil saringan tersebut.',
        tag: 'Ekspor XLSX',
      },
      {
        q: 'Bagaimana cara menyesuaikan nama pejabat Rektor pada cetakan dokumen resmi?',
        a: 'Data Rektor diambil secara dinamis dari database master kepegawaian (dosen dengan jabatan kampus "Rektor"). Jika terjadi pergantian pimpinan Rektor, cukup perbarui data jabatan kampus pada profil dosen bersangkutan di menu Data Kepegawaian Dosen. Seluruh lembar cetak formulir resmi akan langsung terbarui secara otomatis.',
        tag: 'Data Rektor Dinamis',
      },
    ],
  }

  // Filter items based on global search
  const filteredWorkflow = useMemo(() => {
    const list = workflowData[selectedRole] || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.desc.toLowerCase().includes(q) ||
        it.menuPath.toLowerCase().includes(q) ||
        it.tips.toLowerCase().includes(q) ||
        it.keyPoints.some((kp) => kp.toLowerCase().includes(q))
    )
  }, [selectedRole, searchQuery])

  const filteredFeatures = useMemo(() => {
    const list = featureList[selectedRole] || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.menuName.toLowerCase().includes(q) ||
        it.desc.toLowerCase().includes(q)
    )
  }, [selectedRole, searchQuery])

  const filteredFaq = useMemo(() => {
    const list = faqData[selectedRole] || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q)
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
                <span>Buku Panduan Penggunaan Sistem</span>
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
                <span>Portal SDM &amp; SKP Digital UBK</span>
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
                maxWidth: 760,
              }}
            >
              {activeRoleMeta.shortDesc}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                window.open('/cetak-panduan', '_blank')
              }}
              className="brand-btn"
              style={{
                padding: '8px 16px',
                background: '#4b5563',
                color: '#ffffff',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Cetak panduan penggunaan resmi di tab baru"
              title="Buka dokumen panduan resmi berformat cetak A4 di tab baru"
            >
              <Printer size={15} />
              <span>Cetak Panduan / PDF</span>
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
            }}
            placeholder={`Cari panduan langkah pakai, menu, atau pertanyaan kendala untuk ${activeRoleMeta.title}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          2. CATEGORY SUB-TABS (Navigasi Kategori dengan Indikator Bersih)
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
          <span>Panduan Langkah demi Langkah ({filteredWorkflow.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('fitur')}
          className="tab-btn"
          style={{
            padding: '9px 15px',
            borderBottom: activeCategory === 'fitur' ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
            color: activeCategory === 'fitur' ? 'var(--brand-600)' : 'var(--muted)',
            fontWeight: activeCategory === 'fitur' ? 700 : 500,
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
          <Compass size={15} />
          <span>Peta Menu &amp; Fitur Utama ({filteredFeatures.length})</span>
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
          <span>Standar Beban SKS &amp; Predikat</span>
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
          <span>Tanya Jawab &amp; Kendala Sistem ({filteredFaq.length})</span>
        </button>
      </div>

      {/* =========================================================================
          4. TAB CONTENT 1: ALUR PENGGUNAAN LANGKAH DEMI LANGKAH
         ========================================================================= */}
      {activeCategory === 'alur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredWorkflow.length === 0 ? (
            <div
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--r-xl)',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px solid var(--hair)',
              }}
            >
              <AlertCircle size={36} style={{ color: 'var(--faint)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Tidak Ada Langkah yang Sesuai Pencarian
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 4 }}>
                Coba sesuaikan kata kunci pencarian Anda di atas atau klik tombol Hapus.
              </div>
            </div>
          ) : (
            filteredWorkflow.map((item) => {
              const isDirectActionAvailable = onNavigate && item.actionNav && selectedRole === currentRole

              return (
                <div
                  key={item.step}
                  className="guide-card guide-interactive-card"
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    padding: '20px 24px',
                    border: '1px solid var(--hair)',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    transition: 'all 0.18s ease',
                  }}
                >
                  {/* Step Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 260 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 'var(--r-full)',
                          background: 'var(--brand-600)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '15px',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--brand-700)',
                              background: 'var(--brand-100)',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-xs)',
                            }}
                          >
                            Langkah {item.step}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              background: 'var(--panel-hover)',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-xs)',
                            }}
                          >
                            Menu: {item.menuPath}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.35 }}>
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* Direct Navigation Button if available for current logged in user */}
                    {isDirectActionAvailable && (
                      <button
                        onClick={() => onNavigate(item.actionNav!)}
                        className="brand-btn brand-btn--outline"
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          borderRadius: 'var(--r-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{item.actionLabel || 'Buka Halaman'}</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Step Description */}
                  <div style={{ fontSize: '13.5px', color: 'var(--ink-secondary)', lineHeight: 1.6, paddingLeft: 52 }}>
                    {item.desc}
                  </div>

                  {/* Key Operational Points */}
                  <div
                    style={{
                      marginLeft: 52,
                      background: '#f8fafc',
                      borderRadius: 'var(--r-lg)',
                      padding: '12px 16px',
                      border: '1px solid var(--hair-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle size={13} style={{ color: 'var(--brand-600)' }} />
                      <span>Hal yang Perlu Diperhatikan:</span>
                    </div>
                    {item.keyPoints.map((pt, idx) => (
                      <div key={idx} style={{ fontSize: '12.5px', color: 'var(--ink)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ color: 'var(--brand-600)', fontWeight: 800 }}>&bull;</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tips Note */}
                  <div
                    style={{
                      marginLeft: 52,
                      background: 'var(--brand-50)',
                      borderRadius: 'var(--r-md)',
                      padding: '9px 14px',
                      borderLeft: '3px solid var(--brand-600)',
                      fontSize: '12px',
                      color: 'var(--brand-900)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <Info size={14} style={{ color: 'var(--brand-600)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Tips Penggunaan:</strong> {item.tips}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* =========================================================================
          5. TAB CONTENT 2: PETA MENU & FITUR UTAMA
         ========================================================================= */}
      {activeCategory === 'fitur' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {filteredFeatures.map((f) => {
            const isAccessible = onNavigate && f.navId && selectedRole === currentRole

            return (
              <div
                key={f.id}
                className="guide-card guide-interactive-card"
                style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--r-xl)',
                  padding: '20px 22px',
                  border: '1px solid var(--hair)',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-xs)',
                        background:
                          f.badgeType === 'green'
                            ? 'var(--status-success-bg)'
                            : f.badgeType === 'orange'
                            ? 'var(--status-warning-bg)'
                            : f.badgeType === 'purple'
                            ? '#faf5ff'
                            : 'var(--brand-100)',
                        color:
                          f.badgeType === 'green'
                            ? 'var(--status-success-ink)'
                            : f.badgeType === 'orange'
                            ? 'var(--status-warning-ink)'
                            : f.badgeType === 'purple'
                            ? '#7c3aed'
                            : 'var(--brand-700)',
                      }}
                    >
                      {f.badgeText}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                      {f.menuName}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--hair-subtle)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Hak Akses: <strong>{activeRoleMeta.title.split('(')[0].trim()}</strong>
                  </span>
                  {isAccessible && (
                    <button
                      onClick={() => onNavigate(f.navId!)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--brand-600)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      <span>Buka Menu</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          6. TAB CONTENT 3: STANDAR BEBAN SKS & PREDIKAT KINERJA SPMI
         ========================================================================= */}
      {activeCategory === 'standar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Beban SKS Rule Card */}
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              padding: '22px 26px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Scale size={20} style={{ color: 'var(--brand-600)' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Ketentuan Beban Kerja Tridharma Dosen (Standar BKD &amp; SPMI UBK)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Mengacu pada Standar SPMI UBK dan Pedoman Operasional Beban Kerja Dosen Ditjen Dikti
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--hair-subtle)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Beban Minimal Per Semester</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-danger-ink)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  12.00 SKS
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>
                  Kurang dari 12 SKS: Sistem menolak pengesahan SKP.
                </div>
              </div>

              <div style={{ background: 'var(--brand-50)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--brand-100)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--brand-700)', fontWeight: 600 }}>Rentang Beban Standar Ideal</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-700)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  12 - 16 SKS
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-800)', marginTop: 4 }}>
                  Kondisi normal yang disahkan langsung oleh verifikator.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--hair-subtle)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Beban Maksimal Tanpa Disposisi</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy-900)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  16.00 SKS
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>
                  Lebih dari 16 SKS: Wajib menyertakan surat disposisi Dekan.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--hair-subtle)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Minimal Pengajaran Mandiri</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-success-ink)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  4.00 SKS
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>
                  Wajib pada unsur Pendidikan bagi dosen non-pejabat struktural.
                </div>
              </div>
            </div>
          </div>

          {/* Formula Penilaian Akhir Card */}
          <div
            className="guide-card"
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              padding: '22px 26px',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Scale size={20} style={{ color: 'var(--brand-600)' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Formula Pembobotan Nilai Akhir &amp; Klasifikasi Predikat
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Integrasi Capaian Sasaran Kinerja Pegawai (70%) dan Evaluasi Perilaku BerAKHLAK (30%)
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--hair-strong)',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--navy-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <span>Nilai Akhir Kinerja</span>
              <span>=</span>
              <span style={{ color: 'var(--brand-600)' }}>(Capaian SKP &times; 70%)</span>
              <span>+</span>
              <span style={{ color: '#7c3aed' }}>(Nilai Kuesioner BerAKHLAK &times; 30%)</span>
            </div>

            {/* Table Predikat */}
            <div className="table-container" style={{ margin: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Rentang Nilai</th>
                    <th style={{ width: 160 }}>Predikat Mutu</th>
                    <th>Keterangan Tindak Lanjut Institusi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>91.00 - 100.00</td>
                    <td>
                      <span className="badge-pill badge-pill--blue">Sangat Baik</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                      Kinerja melampaui seluruh target. Memenuhi kualifikasi penghargaan keunggulan akademik dan promosi jabatan.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>76.00 - 90.99</td>
                    <td>
                      <span className="badge-pill badge-pill--green">Baik</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                      Kinerja memenuhi seluruh standar baku mutu SPMI UBK. Memenuhi syarat kelulusan BKD dan perpanjangan ikatan kerja.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>61.00 - 75.99</td>
                    <td>
                      <span className="badge-pill badge-pill--orange">Butuh Perbaikan</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                      Kinerja belum optimal. Memerlukan bimbingan berkala dan evaluasi pendampingan oleh Kaprodi / Dekanat.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>51.00 - 60.99</td>
                    <td>
                      <span className="badge-pill badge-pill--red">Kurang</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                      Tidak memenuhi standar minimum. Diberikan pembinaan dan penyesuaian beban penugasan Tridharma.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>&lt; 50.00</td>
                    <td>
                      <span className="badge-pill badge-pill--red" style={{ background: '#fee2e2', color: '#991b1b' }}>Sangat Kurang</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                      Pelanggaran kinerja berat. Dilakukan evaluasi khusus oleh Yayasan Bhakti Kencana &amp; Direktorat SDM.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. TAB CONTENT 4: TANYA JAWAB OPERASIONAL & KENDALA SISTEM (FAQ)
         ========================================================================= */}
      {activeCategory === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredFaq.length === 0 ? (
            <div
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--r-xl)',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px solid var(--hair)',
              }}
            >
              <HelpCircle size={36} style={{ color: 'var(--faint)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                Pertanyaan Tidak Ditemukan
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 4 }}>
                Silakan ganti kata kunci pencarian atau hubungi Direktorat SDM untuk bantuan langsung.
              </div>
            </div>
          ) : (
            filteredFaq.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx

              return (
                <div
                  key={idx}
                  className="guide-card"
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    border: '1px solid var(--hair)',
                    boxShadow: 'var(--shadow-xs)',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      background: isExpanded ? 'var(--page-bg)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 'var(--r-xs)',
                          background: 'var(--navy-100)',
                          color: 'var(--navy-900)',
                          flexShrink: 0,
                        }}
                      >
                        {faq.tag}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                        {faq.q}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
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
                        padding: '14px 20px 18px 20px',
                        borderTop: '1px solid var(--hair-subtle)',
                        fontSize: '13.5px',
                        color: 'var(--ink-secondary)',
                        lineHeight: 1.6,
                        background: '#ffffff',
                      }}
                    >
                      {faq.a}
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
