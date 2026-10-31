import React, { useEffect, useState } from 'react'
import { Printer, ArrowLeft, ShieldCheck, GraduationCap, Users, Building2 } from 'lucide-react'
import { Role, UserSession } from '../types'

interface StepDetail {
  no: number
  title: string
  actor: string
  deadline: string
  desc: string
  outputBukti: string
  kriteriaMutu: string
}

interface ChecklistItem {
  no: number
  kebutuhan: string
  sifat: 'Wajib' | 'Kondisional' | 'Anjuran'
  parameter: string
}

interface FAQDetail {
  q: string
  a: string
}

export const CetakPanduanStandaloneView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [activeRole, setActiveRole] = useState<Role>('dosen')
  const [isLoading, setIsLoading] = useState(true)

  // Pastikan scrolling aktif saat halaman pratinjau cetak terbuka
  useEffect(() => {
    document.documentElement.classList.add('print-mode')
    document.body.classList.add('print-mode')

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevHtmlHeight = document.documentElement.style.height
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyHeight = document.body.style.height

    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important')
    document.documentElement.style.setProperty('height', 'auto', 'important')
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.body.style.setProperty('overflow-y', 'auto', 'important')
    document.body.style.setProperty('height', 'auto', 'important')

    return () => {
      document.documentElement.classList.remove('print-mode')
      document.body.classList.remove('print-mode')
      document.documentElement.style.overflow = prevHtmlOverflow
      document.documentElement.style.height = prevHtmlHeight
      document.body.style.overflow = prevBodyOverflow
      document.body.style.height = prevBodyHeight
    }
  }, [])

  // Baca user session & parameter peran dari URL
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('ubk_user_session')
      let user: UserSession | null = null
      if (savedSession) {
        user = JSON.parse(savedSession)
        setCurrentUser(user)
      }

      const urlParams = new URLSearchParams(window.location.search)
      const roleParam = urlParams.get('role') as Role | null

      if (roleParam && ['dosen', 'kaprodi', 'dekan', 'sdm'].includes(roleParam)) {
        setActiveRole(roleParam)
      } else if (user?.role && ['dosen', 'kaprodi', 'dekan', 'sdm'].includes(user.role)) {
        setActiveRole(user.role)
      } else {
        setActiveRole('dosen')
      }
    } catch (e) {
      console.warn('Gagal memuat sesi pengguna untuk cetak panduan:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  // Ganti peran pratinjau cetak dari toolbar (opsional bagi supervisor)
  const handleChangeRole = (newRole: Role) => {
    setActiveRole(newRole)
    const url = new URL(window.location.href)
    url.searchParams.set('role', newRole)
    window.history.replaceState({}, '', url.toString())
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Memuat Dokumen Panduan Standar SPMI UBK...</div>
        </div>
      </div>
    )
  }

  const roleMeta: Record<Role, {
    title: string
    subTitle: string
    codePrefix: string
    targetAudience: string
    wewenangUtama: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }> = {
    dosen: {
      title: 'PANDUAN OPERASIONAL DOSEN (PENDIDIK & PENELITI)',
      subTitle: 'Penyusunan Rencana Kinerja Tridharma, Pelaporan Beban Kerja Dosen (BKD), dan Pemenuhan Bukti Fisik Mutu',
      codePrefix: 'SOP-DSN',
      targetAudience: 'Dosen Tetap Yayasan, PNS DPK, Dosen Kontrak & Dosen Penugasan Khusus UBK',
      wewenangUtama: 'Penyusunan rencana mandiri 12-16 SKS, pengunggahan dokumen bukti fisik, dan pelaporan realisasi akhir semester.',
      icon: GraduationCap,
    },
    kaprodi: {
      title: 'PANDUAN OPERASIONAL KETUA PROGRAM STUDI (KAPRODI)',
      subTitle: 'Verifikasi Kepatuhan Tridharma Tingkat Homebase, Evaluasi Perilaku Kerja BerAKHLAK, dan Pengelolaan Kinerja Prodi',
      codePrefix: 'SOP-KPD',
      targetAudience: 'Ketua Program Studi dan Sekretaris Program Studi Kampus Utama serta PSDKU UBK',
      wewenangUtama: 'Verifikasi Tahap I beban dosen homebase, pengisian kuesioner BerAKHLAK tahunan, dan pengajuan SKP manajerial.',
      icon: Users,
    },
    dekan: {
      title: 'PANDUAN OPERASIONAL DEKANAT & PIMPINAN FAKULTAS',
      subTitle: 'Supervisi Capaian Mutu Fakultas, Verifikasi SKP Ketua Program Studi, dan Penerbitan Disposisi Beban Kerja',
      codePrefix: 'SOP-DKN',
      targetAudience: 'Dekan, Wakil Dekan, dan Pimpinan Unit Pengelola Program Studi / PSDKU UBK',
      wewenangUtama: 'Supervisi keterisian fakultas, verifikasi kepemimpinan akademik Kaprodi, dan pengesahan izin beban lebih (>16 SKS).',
      icon: Building2,
    },
    sdm: {
      title: 'PANDUAN OPERASIONAL DIREKTORAT SUMBER DAYA MANUSIA',
      subTitle: 'Tata Kelola Standar SPMI Institusi, Validasi Final Pengesahan SKP, dan Rekapitulasi Pelaporan Akreditasi',
      codePrefix: 'SOP-SDM',
      targetAudience: 'Pengelola Kepegawaian, Tim SPMI, dan Pimpinan Direktorat SDM Universitas Bhakti Kencana',
      wewenangUtama: 'Konfigurasi master data, penetapan standar bobot SPMI, persetujuan akhir (approval final), dan pelaporan BAN-PT/LAM.',
      icon: ShieldCheck,
    },
  }

  const currentMeta = roleMeta[activeRole]

  // Data Alur 4 Tahap Lengkap sesuai Peran
  const sopSteps: Record<Role, StepDetail[]> = {
    dosen: [
      {
        no: 1,
        title: 'Perencanaan & Pengisian SKP Awal Semester',
        actor: currentUser?.name ? `${currentUser.name} (Dosen)` : 'Dosen Pengampu',
        deadline: 'Pekan ke-1 s.d. ke-3 Semester Berjalan',
        desc: 'Memilih butir kegiatan Tridharma dari katalog standar SPMI UBK. Menetapkan target kuantitas dan beban SKS agar memenuhi rentang regulasi BKD (12.00 s.d. 16.00 SKS).',
        outputBukti: 'Draft Formulir Rencana SKP terisi lengkap di sistem.',
        kriteriaMutu: 'Total akumulasi SKS berada di batas 12 - 16 SKS; unsur pendidikan min. 4 SKS.',
      },
      {
        no: 2,
        title: 'Pengajuan Resmi ke Ketua Program Studi',
        actor: 'Dosen -> Ketua Program Studi',
        deadline: 'Pekan ke-4 Perkuliahan',
        desc: 'Memeriksa kembali kesesuaian penugasan mengajar dengan SK Mengajar Dekanat, kemudian menekan tombol "Ajukan SKP". Status berkas beralih ke Diajukan.',
        outputBukti: 'Notifikasi sistem dan status SKP terkunci "Diajukan".',
        kriteriaMutu: 'Beban kerja telah divalidasi tidak kurang dari 12 SKS oleh sistem.',
      },
      {
        no: 3,
        title: 'Pelaksanaan & Pengunggahan Bukti Fisik Realisasi',
        actor: 'Dosen Pengampu',
        deadline: 'Sebelum Periode Ujian Akhir Semester (UAS)',
        desc: 'Menginput angka realisasi capaian dan persentase mutu luaran. Melampirkan tautan URL dokumen bukti sah (Google Drive / Repository UBK) dengan hak akses publik/terbuka.',
        outputBukti: 'Tautan berkas SK, RPS, Jurnal, Modul, Laporan PKM yang dapat diakses.',
        kriteriaMutu: 'Dokumen bukti otentik, memiliki nomor surat resmi, dan tautan tidak terkunci.',
      },
      {
        no: 4,
        title: 'Penerbitan Hasil Evaluasi & Cetak Dokumen Sah',
        actor: 'Dosen (Mandiri)',
        deadline: 'Pasca Validasi Final Direktorat SDM',
        desc: 'Setelah SKP disetujui Kaprodi, divalidasi Dekan, dan disahkan SDM, status menjadi "Terbit". Nilai capaian diintegrasikan dengan Kuesioner BerAKHLAK (70/30) dan formulir ber-barcode siap dicetak.',
        outputBukti: 'Salinan PDF Formulir SKP Sah & Transkrip Evaluasi BerAKHLAK.',
        kriteriaMutu: 'Memiliki barcode otentikasi resmi UBK dan tanda tangan pejabat penilai.',
      },
    ],
    kaprodi: [
      {
        no: 1,
        title: 'Monitoring Keterisian SKP Dosen Homebase',
        actor: 'Ketua Program Studi',
        deadline: 'Pekan ke-2 s.d. ke-4 Semester',
        desc: 'Memantau progres pengisian rencana SKP seluruh dosen homebase melalui Dashboard Kaprodi. Mengidentifikasi dosen yang belum mengisi atau masih berstatus draft untuk diberi pengingat.',
        outputBukti: 'Rekapitulasi progres keterisian pengajuan dosen homebase.',
        kriteriaMutu: '100% dosen homebase aktif mengajukan SKP tepat waktu sesuai kalender akademik.',
      },
      {
        no: 2,
        title: 'Verifikasi Beban Tridharma & Keabsahan Berkas',
        actor: 'Ketua Program Studi',
        deadline: 'Maksimal 14 Hari Pasca Dosen Mengajukan',
        desc: 'Memeriksa rincian kegiatan Tridharma dosen homebase pada menu Verifikasi SKP. Memvalidasi kecukupan rentang 12-16 SKS dan memeriksa keabsahan tautan dokumen bukti fisik luaran.',
        outputBukti: 'Keputusan status "Dinilai Kaprodi" atau "Perlu Revisi" disertai catatan spesifik.',
        kriteriaMutu: 'Seluruh butir kegiatan relevan dengan kepakaran dosen dan standar kurikulum prodi.',
      },
      {
        no: 3,
        title: 'Penilaian Kuesioner Perilaku Kerja BerAKHLAK',
        actor: 'Ketua Program Studi',
        deadline: 'Akhir Tahun Akademik (Periode Evaluasi)',
        desc: 'Mengisi instrumen evaluasi 7 dimensi perilaku kerja BerAKHLAK untuk setiap dosen homebase dengan skala 1-4. Memastikan kepatuhan terhadap pemenuhan skor Critical Point.',
        outputBukti: 'Instrumen evaluasi perilaku dosen tersimpan di basis data sistem.',
        kriteriaMutu: 'Penilaian obyektif, proporsional, dan indikator Critical Point minimal skor 3.00.',
      },
      {
        no: 4,
        title: 'Penyusunan SKP Tugas Tambahan Jabatan Kaprodi',
        actor: 'Kaprodi (Sebagai Pegawai)',
        deadline: 'Mengikuti Jadwal Pengajuan SKP Universitas',
        desc: 'Menyusun SKP pribadi yang memuat butir manajerial kepemimpinan program studi, akreditasi, dan beban Tridharma mandiri, lalu mengajukannya kepada Dekan Fakultas.',
        outputBukti: 'Formulir SKP Jabatan Kaprodi berstatus Diajukan ke Dekanat.',
        kriteriaMutu: 'Memuat indikator pencapaian target kinerja program studi (IKU / Renstra).',
      },
    ],
    dekan: [
      {
        no: 1,
        title: 'Supervisi Capaian Mutu Lintas Program Studi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Awal & Tengah Semester Berjalan',
        desc: 'Memantau agregat kepatuhan pengisian SKP dan pemenuhan beban BKD pada seluruh program studi di bawah naungan fakultas melalui Dashboard Supervisi Dekan.',
        outputBukti: 'Laporan visualisasi grafik keterisian dan status verifikasi fakultas.',
        kriteriaMutu: 'Tidak ada program studi yang mengalami kendala operasional tanpa koordinasi.',
      },
      {
        no: 2,
        title: 'Verifikasi & Pengesahan SKP Ketua Program Studi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Pekan ke-4 s.d. ke-6 Perkuliahan',
        desc: 'Memvalidasi sasaran kinerja kepemimpinan manajerial akademik para Ketua Program Studi pada menu Verifikasi SKP Ka.Prodi. Memberikan persetujuan validasi Tahap II.',
        outputBukti: 'Persetujuan validasi tingkat fakultas dengan status "Dinilai Dekan".',
        kriteriaMutu: 'Sasaran manajerial prodi selaras dengan target kinerja strategis fakultas & universitas.',
      },
      {
        no: 3,
        title: 'Evaluasi Perilaku Kepemimpinan Kaprodi',
        actor: 'Dekan / Pimpinan Fakultas',
        deadline: 'Akhir Semester Genap (Tahunan)',
        desc: 'Melakukan evaluasi perilaku kerja BerAKHLAK terhadap seluruh Kaprodi dengan menitikberatkan pada aspek akuntabilitas manajerial, mutu kurikulum, dan kolaborasi lintas unit.',
        outputBukti: 'Formulir evaluasi perilaku manajerial Kaprodi tersimpan resmi.',
        kriteriaMutu: 'Dilengkapi umpan balik konstruktif untuk rencana pembinaan pimpinan program studi.',
      },
      {
        no: 4,
        title: 'Penerbitan Disposisi Khusus Beban Kerja (> 16 SKS)',
        actor: 'Dekan Fakultas',
        deadline: 'Insidental / Sesuai Pengajuan Prodi',
        desc: 'Menerbitkan surat disposisi resmi fakultas bagi dosen yang mendapatkan penugasan mendesak (akreditasi, riset strategis) sehingga total beban kerjanya melampaui 16 SKS.',
        outputBukti: 'Surat Keputusan / Disposisi Beban Lebih resmi berkop Fakultas.',
        kriteriaMutu: 'Penugasan terjustifikasi jelas dan mendapat persetujuan sebelum diajukan ke SDM.',
      },
    ],
    sdm: [
      {
        no: 1,
        title: 'Sinkronisasi Master Data & Struktur Organisasi',
        actor: 'Direktorat SDM',
        deadline: 'Sebelum Pembukaan Periode Semester',
        desc: 'Memutakhirkan master data kepegawaian (NIP, NUPTK, Jafung, Golongan, Ikatan Kerja), master Program Studi, Fakultas, Kampus PSDKU, dan pemetaan pejabat struktural.',
        outputBukti: 'Basis data kepegawaian institusi yang valid dan tersinkronisasi.',
        kriteriaMutu: 'Zero redundancy data dosen dan pemetaan hak akses peran 100% akurat.',
      },
      {
        no: 2,
        title: 'Konfigurasi Komponen SKP & Bobot Mutu SPMI',
        actor: 'Direktorat SDM & Tim Penjaminan Mutu',
        deadline: 'Awal Tahun Akademik',
        desc: 'Menetapkan standar bobot SKS Tridharma berdasarkan SK Rektor No. 042/SK-REK/UBK/2024. Meninjau parameter kuesioner BerAKHLAK dan konfigurasi Critical Point.',
        outputBukti: 'Katalog komponen SKP dan instrumen BerAKHLAK aktif di sistem.',
        kriteriaMutu: 'Sesuai dengan standar BKD Dikti dan Pedoman Penjaminan Mutu SPMI UBK.',
      },
      {
        no: 3,
        title: 'Validasi Akhir (Approval Final) SKP Universitas',
        actor: 'Direktorat SDM',
        deadline: 'Pasca Review Dekanat Selesai',
        desc: 'Memvalidasi berkas SKP yang telah dinilai Dekan. Memeriksa integritas kelengkapan dokumen pendukung dan menetapkan status "Disetujui SDM / Terbit" dengan tanda tangan sah.',
        outputBukti: 'Dokumen SKP Terbit resmi dengan nomor register dan barcode otentikasi sah.',
        kriteriaMutu: 'Seluruh SKP berstatus Terbit memiliki kepatuhan administratif dan hukum lengkap.',
      },
      {
        no: 4,
        title: 'Penerbitan Laporan Rekapitulasi & Arsip Akreditasi',
        actor: 'Direktorat SDM',
        deadline: 'Akhir Periode Penilaian Kinerja',
        desc: 'Menghasilkan rekapitulasi nilai tahunan institusi, analisis sebaran predikat kinerja (Sangat Baik, Baik, Cukup, Kurang), serta ekspor data untuk audit BAN-PT / LAM-PTKes.',
        outputBukti: 'Laporan Rekapitulasi Kinerja Tahunan resmi dalam format PDF & Excel.',
        kriteriaMutu: 'Data komprehensif, valid, dan siap disajikan untuk pelaporan akreditasi institusi.',
      },
    ],
  }

  // Data Checklist Mandiri sesuai Peran
  const checklistItems: Record<Role, ChecklistItem[]> = {
    dosen: [
      {
        no: 1,
        kebutuhan: 'Kepatuhan Rentang Beban Kerja Tridharma (12.00 s.d. 16.00 SKS)',
        sifat: 'Wajib',
        parameter: 'Total akumulasi SKS per semester wajib berada di batas minimum 12 dan maksimum 16 SKS.',
      },
      {
        no: 2,
        kebutuhan: 'Unsur Pendidikan & Pengajaran Minimal 4.00 SKS',
        sifat: 'Wajib',
        parameter: 'Dosen non-struktural wajib mengampu perkuliahan aktif minimal 4 SKS di prodi homebase.',
      },
      {
        no: 3,
        kebutuhan: 'Kelengkapan SK Mengajar / SK Penugasan Dekanat',
        sifat: 'Wajib',
        parameter: 'Memiliki nomor SK resmi, ditandatangani pejabat berwenang, dan mencantumkan mata kuliah.',
      },
      {
        no: 4,
        kebutuhan: 'Tautan Bukti Fisik Berstatus Akses Publik / Terbuka',
        sifat: 'Wajib',
        parameter: 'URL Google Drive atau repository dapat dibuka langsung oleh penilai tanpa meminta izin akses.',
      },
      {
        no: 5,
        kebutuhan: 'Pelaporan Luaran Penelitian & Pengabdian Masyarakat (PKM)',
        sifat: 'Wajib',
        parameter: 'Wajib minimal 1 kegiatan penelitian dan 1 kegiatan PKM dalam kurun waktu 1 tahun akademik.',
      },
      {
        no: 6,
        kebutuhan: 'Surat Disposisi Dekan (Bila Beban Lebih > 16.00 SKS)',
        sifat: 'Kondisional',
        parameter: 'Wajib dilampirkan bila ada penugasan khusus melebihi batas regulasi 16 SKS.',
      },
    ],
    kaprodi: [
      {
        no: 1,
        kebutuhan: 'Keterisian SKP 100% Dosen Homebase Program Studi',
        sifat: 'Wajib',
        parameter: 'Seluruh dosen tetap yayasan dan dosen kontrak prodi telah mengajukan SKP di sistem.',
      },
      {
        no: 2,
        kebutuhan: 'Pemeriksaan Rentang BKD 12-16 SKS Dosen Homebase',
        sifat: 'Wajib',
        parameter: 'Memastikan tidak ada dosen dengan beban < 12 SKS tanpa dispensasi tertulis dari pimpinan.',
      },
      {
        no: 3,
        kebutuhan: 'Uji Validitas Tautan Bukti Fisik & Luaran Akademik',
        sifat: 'Wajib',
        parameter: 'Memverifikasi keaslian file RPS, modul, jurnal publikasi, dan laporan PKM dosen bersangkutan.',
      },
      {
        no: 4,
        kebutuhan: 'Tuntas Penilaian Kuesioner BerAKHLAK Seluruh Dosen',
        sifat: 'Wajib',
        parameter: 'Menuntaskan pengisian 7 pilar kuesioner perilaku kerja sebelum batas penutupan sistem evaluasi.',
      },
      {
        no: 5,
        kebutuhan: 'Pengajuan SKP Tugas Tambahan Jabatan Kaprodi Mandiri',
        sifat: 'Wajib',
        parameter: 'Menyusun dan mengajukan SKP manajerial program studi kepada Dekan Fakultas tepat waktu.',
      },
    ],
    dekan: [
      {
        no: 1,
        kebutuhan: 'Supervisi Keterisian SKP Seluruh Program Studi Fakultas',
        sifat: 'Wajib',
        parameter: 'Memastikan seluruh unit pengelola prodi di fakultas telah menuntaskan verifikasi Tahap I.',
      },
      {
        no: 2,
        kebutuhan: 'Validasi SKP Kinerja Kepemimpinan Seluruh Kaprodi',
        sifat: 'Wajib',
        parameter: 'Memvalidasi sasaran kinerja dan ketercapaian target mutu seluruh Ketua Program Studi.',
      },
      {
        no: 3,
        kebutuhan: 'Evaluasi Perilaku Kerja BerAKHLAK Para Kaprodi',
        sifat: 'Wajib',
        parameter: 'Memberikan penilaian berkala 7 pilar perilaku kepemimpinan kepada para pimpinan program studi.',
      },
      {
        no: 4,
        kebutuhan: 'Penerbitan Disposisi Beban Kerja Lebih (> 16 SKS)',
        sifat: 'Kondisional',
        parameter: 'Menandatangani surat penetapan dispensasi beban kerja jika ada kebutuhan darurat prodi.',
      },
    ],
    sdm: [
      {
        no: 1,
        kebutuhan: 'Validasi Master Data Pegawai, Jafung, dan Golongan',
        sifat: 'Wajib',
        parameter: 'Seluruh data dosen telah tersinkronisasi dengan PDDikti dan basis data internal UBK.',
      },
      {
        no: 2,
        kebutuhan: 'Penetapan Standar Komponen & Pembobotan SPMI',
        sifat: 'Wajib',
        parameter: 'SK Rektor tentang standar BKD dan SPMI telah diimplementasikan dalam aturan sistem.',
      },
      {
        no: 3,
        kebutuhan: 'Persetujuan Final (Approval Final) SKP Terbit Sah',
        sifat: 'Wajib',
        parameter: 'Memastikan SKP yang telah disetujui Dekan divalidasi hingga menghasilkan barcode sah.',
      },
      {
        no: 4,
        kebutuhan: 'Penerbitan Rekapitulasi Tahunan & Ekspor Laporan',
        sifat: 'Wajib',
        parameter: 'Dokumen rekapitulasi nilai akhir dan predikat kinerja siap untuk audit eksternal.',
      },
    ],
  }

  // FAQ Penting Sesuai Peran
  const faqs: Record<Role, FAQDetail[]> = {
    dosen: [
      {
        q: 'Bagaimana jika total beban kerja per semester saya kurang dari 12 SKS atau lebih dari 16 SKS?',
        a: 'Berdasarkan Pedoman BKD Dikti dan Standar SPMI UBK No. 03.07.00/PD/SDM-SPMI, beban kerja dosen wajib berada pada rentang 12.00 sampai 16.00 SKS. Jika beban Anda kurang dari 12 SKS, sistem secara otomatis menolak pengesahan SKP. Jika melebihi 16 SKS karena penugasan mendesak (misal akreditasi atau hibah riset), Anda wajib melampirkan Surat Disposisi Persetujuan dari Dekan Fakultas.',
      },
      {
        q: 'Apa yang harus dilakukan jika berkas SKP saya berstatus "Perlu Revisi"?',
        a: 'Buka menu "SKP Saya". Periksa kotak "Catatan Verifikator" di bagian atas halaman formulir. Perbaiki butir kegiatan atau perbarui tautan dokumen bukti fisik yang diminta oleh Kaprodi/Dekan, lalu tekan tombol "Ajukan Ulang SKP" agar berkas kembali diproses.',
      },
      {
        q: 'Bagaimana formula perhitungan Nilai Akhir Kinerja Tahunan?',
        a: 'Nilai Akhir dihitung dengan formula pembobotan resmi: Nilai Akhir = (70% × Capaian SKP Kuantitatif) + (30% × Nilai Evaluasi Perilaku BerAKHLAK). Kategori Predikat: 91 - 100 (Sangat Baik), 76 - 90 (Baik), 61 - 75 (Cukup), 51 - 60 (Kurang), dan < 50 (Sangat Kurang).',
      },
      {
        q: 'Mengapa tautan bukti fisik Google Drive saya dinyatakan tidak valid oleh penilai?',
        a: 'Penyebab paling umum adalah pengaturan hak akses berkas di Google Drive masih terbatas (Restricted). Pastikan pengaturan tautan diubah menjadi "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view) sebelum dicantumkan pada sistem.',
      },
      {
        q: 'Bagaimana cara memperoleh dokumen fisik SKP dan Transkrip Sah untuk keperluan BKD?',
        a: 'Setelah status SKP dinyatakan "Terbit", buka menu SKP Saya atau Hasil Kinerja Tahunan. Klik tombol "Cetak Formulir Resmi" atau "Cetak Transkrip". Dokumen akan terbuka di jendela pracetak berformat standar kop resmi Universitas Bhakti Kencana lengkap dengan barcode otentikasi sah.',
      },
    ],
    kaprodi: [
      {
        q: 'Apa implikasi tombol "Setujui" dan "Kembalikan" pada menu Verifikasi SKP Dosen?',
        a: 'Tombol "Setujui" memvalidasi bahwa beban Tridharma telah memenuhi rentang 12-16 SKS dan tautan bukti fisik valid; status akan berubah menjadi "Dinilai Kaprodi" untuk diteruskan ke Dekanat. Tombol "Kembalikan" digunakan bila ditemukan kekurangan berkas atau SKS, dan Anda wajib menyertakan catatan koreksi tertulis bagi dosen bersangkutan.',
      },
      {
        q: 'Apa yang dimaksud dengan ketentuan "Critical Point" pada penilaian kuesioner BerAKHLAK?',
        a: 'Indikator No. 1 pada masing-masing dari 7 dimensi BerAKHLAK ditetapkan sebagai Critical Point SPMI UBK. Dosen wajib memperoleh skor minimal 3.00 (Baik) pada indikator kritis tersebut agar memenuhi syarat kelulusan evaluasi kinerja tahunan.',
      },
      {
        q: 'Apakah Ketua Program Studi juga berkewajiban menyusun SKP mandiri?',
        a: 'Ya. Kaprodi menjalankan peran ganda: sebagai Pendidik (Tridharma) dan Pejabat Struktural Prodi. Kaprodi menyusun SKP tugas jabatan melalui menu "SKP Saya" yang memuat komponen pengajaran, riset, serta butir manajerial prodi, yang akan dinilai langsung oleh Dekan Fakultas.',
      },
      {
        q: 'Bagaimana jika ada dosen homebase yang belum mengajukan SKP hingga batas penutupan?',
        a: 'Kaprodi dapat memantau keterisian melalui Dashboard. Jika ada dosen yang terlambat, Kaprodi dapat menerbitkan pengingat resmi atau berkoordinasi dengan Direktorat SDM untuk penjadwalan pembinaan dan asistensi khusus.',
      },
      {
        q: 'Kapan batas akhir verifikasi berkas SKP dosen homebase oleh Kaprodi?',
        a: 'Verifikasi Tahap I wajib diselesaikan selambat-lambatnya 14 (empat belas) hari kalender terhitung sejak dosen bersangkutan mengajukan berkas ke sistem.',
      },
    ],
    dekan: [
      {
        q: 'Apa wewenang utama Dekan dalam alur pengesahan SKP di lingkungan fakultas?',
        a: 'Dekan berwenang melakukan verifikasi dan penilaian Tahap II atas SKP para Ketua Program Studi, melakukan supervisi atas kepatuhan pemenuhan beban kerja seluruh dosen di lingkungan fakultas, serta menerbitkan surat disposisi resmi untuk beban kerja berlebih (>16 SKS).',
      },
      {
        q: 'Bagaimana prosedur penerbitan disposisi resmi kelebihan beban kerja (> 16 SKS)?',
        a: 'Berdasarkan usulan tertulis dari Kaprodi mengenai penugasan mendesak dosen, Dekanat menerbitkan surat disposisi persetujuan beban lebih. Surat ini dicatat dalam berita acara fakultas dan diunggah ke sistem agar pengesahan di tingkat SDM tidak terblokir.',
      },
      {
        q: 'Bagaimana mekanisme evaluasi kinerja para Ketua Program Studi oleh Dekan?',
        a: 'Dekan mengisi evaluasi 7 dimensi perilaku kerja BerAKHLAK pada menu "Evaluasi Kinerja Ka.Prodi" dengan menitikberatkan pada capaian akreditasi prodi, akuntabilitas tata pamong, dan kepemimpinan kurikulum.',
      },
      {
        q: 'Apa tindakan Dekanat jika terdapat program studi dengan persentase kepatuhan SKP rendah?',
        a: 'Dekan memanggil Kaprodi bersangkutan untuk rapat koordinasi tindak lanjut, mengidentifikasi kendala administratif, dan menetapkan batas waktu perbaikan bersama Direktorat SDM.',
      },
      {
        q: 'Apakah pengesahan Dekan merupakan tahapan final SKP?',
        a: 'Persetujuan Dekan berstatus "Dinilai Dekan" merupakan prasyarat mutlak sebelum berkas diteruskan ke tahapan Pengesahan Akhir (Approval Final) oleh Direktorat Sumber Daya Manusia UBK.',
      },
    ],
    sdm: [
      {
        q: 'Kapan sebuah SKP dinyatakan memiliki status hukum sah dan "Terbit"?',
        a: 'SKP dinyatakan sah dan Terbit setelah melalui 3 tahap persetujuan: diajukan oleh dosen, diverifikasi Kaprodi, disetujui Dekan, dan divalidasi final oleh Direktorat SDM. Dokumen terbit secara otomatis disematkan barcode otentikasi resmi universitas.',
      },
      {
        q: 'Bagaimana prosedur penambahan atau pemutakhiran data jabatan fungsional dosen?',
        a: 'Pengelola SDM masuk ke menu "Master Data > Data Kepegawaian Dosen", memilih dosen terkait, lalu memperbarui kolom Jabatan Fungsional (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar) serta melampirkan nomor SK PAK resmi.',
      },
      {
        q: 'Bagaimana cara mengekspor data capaian kinerja untuk instrumen akreditasi BAN-PT/LAM?',
        a: 'Buka menu "Master & Laporan > Laporan & Rekapitulasi Institusi". Pilih tahun akademik dan filter unit yang dibutuhkan, kemudian klik "Ekspor Excel" atau "Cetak Ringkasan Eksekutif" yang memuat rekapitulasi beban Tridharma dan predikat mutu BerAKHLAK.',
      },
      {
        q: 'Apakah perubahan komponen pada Master Komponen mempengaruhi SKP yang sudah terbit?',
        a: 'Tidak. Perubahan bobot atau penambahan komponen baru hanya berlaku untuk periode pengajuan SKP berikutnya dan tidak merubah riwayat SKP yang telah disahkan pada semester lampau.',
      },
      {
        q: 'Bagaimana mekanisme penanganan sanksi bagi pegawai dengan predikat kinerja "Kurang"?',
        a: 'Pegawai dengan nilai kinerja akhir < 61 (Kurang / Sangat Kurang) diterbitkan surat peringatan akademik dan diwajibkan mengikuti program pembinaan profesi serta penyesuaian beban kerja oleh Yayasan dan Rektorat.',
      },
    ],
  }

  const currentSteps = sopSteps[activeRole] || []
  const currentChecklist = checklistItems[activeRole] || []
  const currentFaqs = faqs[activeRole] || []

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="print-standalone-wrapper">
      {/* =========================================================================
          PRINT & SCREEN STYLES
         ========================================================================= */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }

          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          html, body, #root, .print-standalone-wrapper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print-bar {
            display: none !important;
          }

          .print-standalone-wrapper {
            padding-top: 0 !important;
          }

          .a4-paper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .section-break-before {
            page-break-before: auto !important;
            break-before: auto !important;
          }
        }

        @media screen {
          html, body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: auto !important;
            min-height: 100% !important;
            background-color: #1e293b !important;
          }

          #root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }

          .print-standalone-wrapper {
            min-height: 100vh;
            height: auto;
            width: 100%;
            background-color: #1e293b;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: visible;
            padding-top: 72px;
            padding-bottom: 60px;
          }

          .a4-paper {
            background: #ffffff;
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto 40px;
            padding: 14mm 16mm 16mm 16mm;
            box-shadow: 0 10px 35px rgba(0,0,0,0.45);
            box-sizing: border-box;
          }
        }

        .print-standalone-wrapper {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .no-print-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: #0f172a;
          color: #f8fafc;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          z-index: 9999;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .a4-paper {
          color: #000000;
          font-size: 8.5pt;
          line-height: 1.35;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .panduan-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin-bottom: 10px;
        }

        .panduan-table th, .panduan-table td {
          border: 1px solid #000000;
          padding: 4.5px 6px;
          vertical-align: top;
        }

        .panduan-table thead th {
          background-color: #f1f5f9;
          font-weight: 700;
          text-align: center;
          color: #000000;
        }

        .panduan-table tbody tr {
          background-color: #ffffff !important;
        }

        .panduan-table tbody td {
          background-color: #ffffff !important;
          color: #000000;
        }

        .identity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin-bottom: 12px;
        }

        .identity-table td {
          padding: 2.5px 4px;
          vertical-align: top;
        }

        .badge-dokumen {
          display: inline-block;
          font-size: 7.5pt;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 3px;
          border: 1px solid #000000;
          background: #f8fafc;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* =========================================================================
          FLOATING TOOLBAR (HANYA DITAMPILKAN DI LAYAR / TERSEMBUNYI SAAT CETAK)
         ========================================================================= */}
      <div className="no-print-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => window.close()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Tutup tab pratinjau cetak ini"
          >
            <ArrowLeft size={14} />
            <span>Tutup Tab</span>
          </button>

          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Cetak Buku Panduan Standar SOP &amp; SPMI</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#059669',
                  color: '#ffffff',
                }}
              >
                Dokumen Resmi Terkendali
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>
              {currentMeta.title} &bull; Universitas Bhakti Kencana &bull; TA 2026/2027
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 6, padding: '3px', border: '1px solid #334155' }}>
            {(['dosen', 'kaprodi', 'dekan', 'sdm'] as Role[]).map((r) => {
              const isActive = activeRole === r
              const labels: Record<Role, string> = {
                dosen: 'Dosen',
                kaprodi: 'Kaprodi',
                dekan: 'Dekan',
                sdm: 'SDM',
              }
              return (
                <button
                  key={r}
                  onClick={() => handleChangeRole(r)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 4,
                    border: 'none',
                    background: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Ganti cetak panduan untuk peran ${labels[r]}`}
                >
                  {labels[r]}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
            }}
          >
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          A4 DOCUMENT CONTAINER (FORMAT RESMI INSTITUSI UNIVERSITAS BHAKTI KENCANA)
         ========================================================================= */}
      <div className="a4-paper">
        {/* KOP SURAT RESMI UNIVERSITAS BHAKTI KENCANA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '3px double #000000', paddingBottom: 8, marginBottom: 10 }}>
          <img
            src="/logo.png"
            alt="Logo Universitas Bhakti Kencana"
            style={{ width: 68, height: 68, objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '11pt', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              YAYASAN BHAKTI KENCANA
            </div>
            <div style={{ fontSize: '13.5pt', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0f223d' }}>
              UNIVERSITAS BHAKTI KENCANA
            </div>
            <div style={{ fontSize: '8pt', color: '#1e293b', marginTop: 1 }}>
              Jl. Soekarno-Hatta No. 754 Cibiru, Kota Bandung, Jawa Barat 40614
            </div>
            <div style={{ fontSize: '7.5pt', color: '#334155' }}>
              Telp. (022) 7806500 | Fax: (022) 7806500 | Laman: www.bku.ac.id | Pos-el: info@bku.ac.id / sdm@bku.ac.id
            </div>
          </div>
        </div>

        {/* JUDUL DOKUMEN FORMAL */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '11.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#0f223d' }}>
            BUKU PANDUAN STANDAR OPERASIONAL PROSEDUR (SOP) &amp; PENJAMINAN MUTU (SPMI)
          </div>
          <div style={{ fontSize: '10pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 1 }}>
            {currentMeta.title}
          </div>
          <div style={{ fontSize: '8pt', color: '#475569', marginTop: 2 }}>
            Sistem Informasi Pengelolaan Sasaran Kinerja Pegawai (SKP) &bull; No. Dokumen: UBK-SPMI/{currentMeta.codePrefix}/2026/001-REV03
          </div>
          <div style={{ marginTop: 4 }}>
            <span className="badge-dokumen">STATUS: DOKUMEN RESMI TERKENDALI</span>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>&bull;</span>
            <span className="badge-dokumen">EDISI: TAHUN AKADEMIK 2026/2027</span>
          </div>
        </div>

        {/* TABEL IDENTITAS & RUANG LINGKUP PENGGUNA */}
        <div className="avoid-break" style={{ border: '1px solid #000000', padding: '6px 10px', marginBottom: 12, background: '#fafafa' }}>
          <table className="identity-table" style={{ margin: 0 }}>
            <tbody>
              <tr>
                <td style={{ width: '18%', fontWeight: 700 }}>Nama Pegawai</td>
                <td style={{ width: '2%' }}>:</td>
                <td style={{ width: '38%', fontWeight: 800 }}>{currentUser?.name || 'Sivitas Akademika UBK'}</td>
                <td style={{ width: '18%', fontWeight: 700 }}>Peran / Aktor</td>
                <td style={{ width: '2%' }}>:</td>
                <td style={{ width: '22%', fontWeight: 700, textTransform: 'capitalize' }}>{activeRole.toUpperCase()}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>NIP / NUPTK</td>
                <td>:</td>
                <td>{currentUser?.nip || currentUser?.nuptk || '-'}</td>
                <td style={{ fontWeight: 700 }}>Unit Kerja / Homebase</td>
                <td>:</td>
                <td>{currentUser?.prodi || currentUser?.fakultas || 'Universitas Bhakti Kencana'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Sasaran Dokumen</td>
                <td>:</td>
                <td colSpan={4}>{currentMeta.targetAudience}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Tanggal Dokumen</td>
                <td>:</td>
                <td colSpan={4}>Bandung, {formattedDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN I: LANDASAN REGULASI & PARAMETER BEBAN KERJA (BKD/SPMI)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN I: LANDASAN HUKUM &amp; KETENTUAN BEBAN KERJA (BKD / SPMI)</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Kepatuhan Nasional &amp; Institusi</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Parameter Regulasi</th>
                <th style={{ width: '28%' }}>Ketetapan / Landasan Hukum</th>
                <th style={{ width: '50%' }}>Ketentuan Operasional &amp; Standar Mutu SPMI UBK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Landasan Hukum Utama</td>
                <td>
                  1. UU No. 14 Tahun 2005 (Guru &amp; Dosen)<br />
                  2. PermenPAN-RB No. 6 Tahun 2022<br />
                  3. Pedoman Operasional BKD Dikti<br />
                  4. Pedoman SPMI UBK No. 03.07.00/PD/SDM-SPMI
                </td>
                <td>
                  Pengelolaan kinerja pegawai mengintegrasikan aspek kuantitatif capaian Tridharma perguruan tinggi dengan evaluasi kualitatif perilaku kerja berbasis nilai inti (Core Values) BerAKHLAK.
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Batas Beban Kinerja (BKD)</td>
                <td style={{ fontWeight: 800, color: '#0f223d' }}>
                  Rentang Wajib: 12.00 s.d. 16.00 SKS<br />
                  <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>(Per Semester Berjalan)</span>
                </td>
                <td>
                  <strong>Minimum 12.00 SKS:</strong> Batas ambang kelayakan pemenuhan tunjangan profesi dan sertifikasi.<br />
                  <strong>Maksimum 16.00 SKS:</strong> Batas atas beban ideal untuk menjamin mutu pengajaran dan penelitian. Beban &gt; 16 SKS wajib melampirkan Disposisi Dekan.
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Komposisi Tridharma Minimum</td>
                <td>
                  &bull; Pengajaran: Min. 4 SKS (Dosen)<br />
                  &bull; Penelitian: Min. 1 keg./tahun<br />
                  &bull; Pengabdian: Min. 1 keg./tahun<br />
                  &bull; Penunjang: Maks. 3 SKS diakui
                </td>
                <td>
                  Dosen wajib menjaga keseimbangan Tridharma. Pejabat struktural (Kaprodi, Dekan) dapat mengonversi penugasan manajerial ke dalam komponen tugas penunjang/tugas tambahan institusi.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN II: MATRIKS 4 TAHAPAN STANDAR OPERASIONAL PROSEDUR (SOP)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN II: MATRIKS 4 TAHAPAN ALUR PROSEDUR KERJA SISTEM (SOP)</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Pelaksanaan &amp; Pengendalian Mutu</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>Tahap</th>
                <th style={{ width: '22%' }}>Nama Prosedur &amp; Waktu</th>
                <th style={{ width: '18%' }}>Pelaksana (Aktor)</th>
                <th style={{ width: '32%' }}>Rincian Aktivitas Sistem</th>
                <th style={{ width: '22%' }}>Standar Bukti &amp; Mutu</th>
              </tr>
            </thead>
            <tbody>
              {currentSteps.map((s) => (
                <tr key={s.no}>
                  <td style={{ textAlign: 'center', fontWeight: 800, background: '#f8fafc' }}>
                    0{s.no}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f223d' }}>{s.title}</div>
                    <div style={{ fontSize: '7.5pt', color: '#475569', marginTop: 1 }}>Waktu: {s.deadline}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{s.actor}</td>
                  <td>
                    <div>{s.desc}</div>
                    <div style={{ fontSize: '7.5pt', color: '#0369a1', marginTop: 2, fontWeight: 600 }}>
                      Kriteria: {s.kriteriaMutu}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.outputBukti}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN III: FORMULA PEMBOBOTAN NILAI AKHIR & PREDIKAT KINERJA SPMI
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN III: FORMULA PEMBOBOTAN NILAI AKHIR &amp; PREDIKAT MUTU SPMI</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Integrasi Nilai 70/30</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 10, marginBottom: 8 }}>
            {/* Box Formula */}
            <div style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, fontSize: '8pt', color: '#0f223d', marginBottom: 3 }}>
                FORMULA INTEGRASI NILAI AKHIR KINERJA TAHUNAN:
              </div>
              <div style={{ padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 900, fontSize: '9pt', letterSpacing: '0.02em', color: '#0f223d' }}>
                NILAI AKHIR = (70% &times; CAPAIAN SKP) + (30% &times; EVALUASI BerAKHLAK)
              </div>
              <div style={{ fontSize: '7.5pt', color: '#334155', marginTop: 4, lineHeight: 1.35 }}>
                &bull; <strong>Capaian SKP (70%):</strong> Evaluasi kuantitatif realisasi target Tridharma (12-16 SKS).<br />
                &bull; <strong>Perilaku BerAKHLAK (30%):</strong> Penilaian 360&deg; pada 7 nilai dasar (skala 1-4 dikonversi ke skala 100).
              </div>
            </div>

            {/* Box Critical Point */}
            <div style={{ border: '1px solid #000000', padding: '6px 8px', background: '#fffbeb' }}>
              <div style={{ fontWeight: 800, fontSize: '8pt', color: '#92400e', marginBottom: 2 }}>
                KETENTUAN CRITICAL POINT (POIN KRITIS MUTU):
              </div>
              <div style={{ fontSize: '7.5pt', color: '#78350f', lineHeight: 1.35 }}>
                1. Indikator No. 1 pada masing-masing 7 pilar BerAKHLAK (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) ditetapkan sebagai <strong>Critical Point</strong>.<br />
                2. Pegawai wajib memperoleh skor minimum <strong>3.00 (Baik)</strong> pada seluruh indikator Critical Point untuk dinyatakan memenuhi syarat kelulusan evaluasi tahunan.
              </div>
            </div>
          </div>

          {/* Tabel Konversi Predikat */}
          <table className="panduan-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Rentang Nilai Akhir</th>
                <th style={{ width: '22%' }}>Predikat Kinerja</th>
                <th style={{ width: '60%' }}>Kualifikasi Mutu &amp; Tindak Lanjut Institusional</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>91.00 - 100.00</td>
                <td style={{ fontWeight: 800, color: '#047857' }}>SANGAT BAIK</td>
                <td>Kinerja melampaui ekspektasi institusi. Direkomendasikan untuk promosi jabatan, penghargaan prestasi, dan insentif penuh.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>76.00 - 90.99</td>
                <td style={{ fontWeight: 800, color: '#0369a1' }}>BAIK</td>
                <td>Kinerja memenuhi seluruh standar baku mutu SPMI UBK. Memenuhi syarat perpanjangan ikatan kerja dan pemenuhan BKD.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>61.00 - 75.99</td>
                <td style={{ fontWeight: 800, color: '#d97706' }}>CUKUP</td>
                <td>Kinerja belum optimal. Memerlukan bimbingan, pendampingan berkala, dan pembinaan oleh Ketua Program Studi / Dekanat.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>51.00 - 60.99</td>
                <td style={{ fontWeight: 800, color: '#b91c1c' }}>KURANG</td>
                <td>Tidak memenuhi standar minimum SPMI. Diberikan surat peringatan akademik dan penyesuaian beban penugasan.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>&lt; 50.00</td>
                <td style={{ fontWeight: 800, color: '#7f1d1d' }}>SANGAT KURANG</td>
                <td>Pelanggaran disiplin kinerja berat. Dilakukan evaluasi status kepegawaian oleh Yayasan Bhakti Kencana &amp; Direktorat SDM.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN IV: DAFTAR PERIKSA (CHECKLIST) KELENGKAPAN BERKAS & KEPATUHAN
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN IV: DAFTAR PERIKSA (CHECKLIST) MANDIRI KEPATUHAN BERKAS</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Instrumen Pra-Verifikasi</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>No</th>
                <th style={{ width: '40%' }}>Persyaratan Berkas &amp; Indikator Mutu</th>
                <th style={{ width: '14%' }}>Sifat</th>
                <th style={{ width: '32%' }}>Parameter Validasi Penilai</th>
                <th style={{ width: '8%' }}>Cek</th>
              </tr>
            </thead>
            <tbody>
              {currentChecklist.map((it) => (
                <tr key={it.no}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{it.no}</td>
                  <td style={{ fontWeight: 700 }}>{it.kebutuhan}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '7.5pt',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: it.sifat === 'Wajib' ? '#fee2e2' : '#f1f5f9',
                        color: it.sifat === 'Wajib' ? '#991b1b' : '#334155',
                      }}
                    >
                      {it.sifat}
                    </span>
                  </td>
                  <td style={{ fontSize: '7.5pt' }}>{it.parameter}</td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: '1.5px solid #000000',
                        margin: '0 auto',
                        background: '#ffffff',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN V: TANYA JAWAB OPERASIONAL & PENANGANAN KENDALA (FAQ)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN V: TANYA JAWAB OPERASIONAL &amp; PENANGANAN KENDALA (FAQ)</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Mitigasi Masalah Kinerja</span>
          </div>

          <div style={{ border: '1px solid #000000', padding: '6px 8px', background: '#fafafa' }}>
            {currentFaqs.map((faq, idx) => (
              <div key={idx} style={{ marginBottom: idx === currentFaqs.length - 1 ? 0 : 8, paddingBottom: idx === currentFaqs.length - 1 ? 0 : 6, borderBottom: idx === currentFaqs.length - 1 ? 'none' : '1px dotted #cbd5e1' }}>
                <div style={{ fontWeight: 800, fontSize: '8pt', color: '#0f223d' }}>
                  {idx + 1}. {faq.q}
                </div>
                <div style={{ fontSize: '7.5pt', color: '#334155', marginTop: 2, lineHeight: 1.35, textAlign: 'justify' }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            LEMBAR PENGESAHAN & OTENTIKASI SISTEM (TANDA TANGAN & BARCODE RESMI)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid #000000' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, fontSize: '8pt', alignItems: 'flex-start' }}>
            {/* Kolom 1: Otentikasi Digital QR Code */}
            <div style={{ border: '1px dashed #64748b', padding: '6px 8px', borderRadius: 4, background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '7.5pt', color: '#0f223d', marginBottom: 4 }}>
                VERIFIKASI KEABSAHAN DOKUMEN SPMI
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '2px 0' }}>
                <svg width="52" height="52" viewBox="0 0 100 100" style={{ border: '1px solid #cbd5e1', padding: 2, background: '#ffffff' }}>
                  {/* Outer Frame */}
                  <rect x="5" y="5" width="90" height="90" fill="#ffffff" stroke="#0f223d" strokeWidth="3" />
                  {/* Position squares */}
                  <rect x="12" y="12" width="24" height="24" fill="#0f223d" />
                  <rect x="16" y="16" width="16" height="16" fill="#ffffff" />
                  <rect x="20" y="20" width="8" height="8" fill="#0f223d" />

                  <rect x="64" y="12" width="24" height="24" fill="#0f223d" />
                  <rect x="68" y="16" width="16" height="16" fill="#ffffff" />
                  <rect x="72" y="20" width="8" height="8" fill="#0f223d" />

                  <rect x="12" y="64" width="24" height="24" fill="#0f223d" />
                  <rect x="16" y="68" width="16" height="16" fill="#ffffff" />
                  <rect x="20" y="72" width="8" height="8" fill="#0f223d" />

                  {/* QR Data Pattern */}
                  <rect x="42" y="16" width="6" height="6" fill="#0f223d" />
                  <rect x="52" y="24" width="6" height="6" fill="#0f223d" />
                  <rect x="42" y="34" width="6" height="6" fill="#0f223d" />
                  <rect x="52" y="44" width="6" height="6" fill="#0f223d" />
                  <rect x="64" y="44" width="6" height="6" fill="#0f223d" />
                  <rect x="74" y="54" width="6" height="6" fill="#0f223d" />
                  <rect x="44" y="64" width="6" height="6" fill="#0f223d" />
                  <rect x="54" y="74" width="6" height="6" fill="#0f223d" />
                  <rect x="64" y="74" width="6" height="6" fill="#0f223d" />
                  <rect x="74" y="64" width="6" height="6" fill="#0f223d" />
                  <rect x="84" y="74" width="6" height="6" fill="#0f223d" />
                </svg>
                <div style={{ textAlign: 'left', fontSize: '6.5pt', color: '#475569', lineHeight: 1.25 }}>
                  <span style={{ fontWeight: 700, color: '#0f223d' }}>KODE VERIFIKASI RESMI:</span><br />
                  UBK-AUTH-{activeRole.toUpperCase()}-2026<br />
                  Dokumen dicetak secara sah melalui SIM-SDM Universitas Bhakti Kencana pada {formattedDate}.
                </div>
              </div>
            </div>

            {/* Kolom 2: Pegawai Yang Bersangkutan */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5pt', color: '#475569' }}>Bandung, {formattedDate}</div>
              <div style={{ fontWeight: 700, marginTop: 1, marginBottom: 38 }}>
                Pegawai Yang Bersangkutan,
              </div>
              <div style={{ fontWeight: 800, textDecoration: 'underline' }}>
                {currentUser?.name || 'Sivitas Akademika UBK'}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#475569' }}>
                NIP/NUPTK: {currentUser?.nip || currentUser?.nuptk || '-'}
              </div>
            </div>

            {/* Kolom 3: Pengesahan SDM / Rektorat */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5pt', color: '#475569' }}>Mengetahui &amp; Mengesahkan,</div>
              <div style={{ fontWeight: 700, marginTop: 1, marginBottom: 38 }}>
                Direktur Sumber Daya Manusia,
              </div>
              <div style={{ fontWeight: 800, textDecoration: 'underline' }}>
                Dr. H. Ahmad Fauzi, M.Si.
              </div>
              <div style={{ fontSize: '7.5pt', color: '#475569' }}>
                NIP: 197405102001121003
              </div>
            </div>
          </div>
        </div>

        {/* CATATAN RESMI */}
        <div className="avoid-break" style={{ marginTop: 8, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontSize: '7pt', lineHeight: 1.3, color: '#475569' }}>
          <strong>Catatan Penggunaan Dokumen:</strong> Buku Panduan SOP &amp; SPMI ini merupakan dokumen acuan resmi penetapan Sasaran Kinerja Pegawai (SKP) dan evaluasi tahunan di lingkungan Universitas Bhakti Kencana. Dilarang mengubah naskah isi tanpa izin tertulis dari Bagian Penjaminan Mutu &amp; Direktorat SDM UBK.
        </div>
      </div>
    </div>
  )
}
