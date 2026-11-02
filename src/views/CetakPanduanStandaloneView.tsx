import { KopSuratUBK } from '../components/print/KopSuratUBK'
import { PrintPageContainer } from '../components/print/PrintPageContainer'
import React, { useEffect, useState } from 'react'
import { Printer, ArrowLeft, ShieldCheck, GraduationCap, Users, Building2 } from 'lucide-react'
import { Role, UserSession } from '../types'
import { getStoredUserSession } from '../utils/authStorage'

interface StepDetail {
  no: number
  title: string
  menuPath: string
  actor: string
  desc: string
  outputBukti: string
  kriteriaMutu: string
}

interface FeatureMenuDetail {
  menuName: string
  fungsiUtama: string
  hakAkses: string
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
      const user = getStoredUserSession()
      if (user) {
        setCurrentUser(user)
      }

      if (user?.role && ['dosen', 'kaprodi', 'dekan', 'sdm'].includes(user.role)) {
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

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Memuat Dokumen Panduan Penggunaan Sistem...</div>
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
      title: 'PANDUAN PENGGUNAAN SISTEM BAGI DOSEN (PENDIDIK & PENELITI)',
      subTitle: 'Pengisian Sasaran Kinerja Pegawai (SKP), Pengunggahan Bukti Fisik Google Drive, dan Pencetakan Transkrip Mutu',
      codePrefix: 'USR-DSN',
      targetAudience: 'Dosen Tetap Yayasan, PNS DPK, Dosen Kontrak & Dosen Penugasan Khusus UBK',
      wewenangUtama: 'Penyusunan rencana mandiri 12-16 SKS, pengunggahan dokumen bukti fisik, pelaporan realisasi, dan pencetakan dokumen sah.',
      icon: GraduationCap,
    },
    kaprodi: {
      title: 'PANDUAN PENGGUNAAN SISTEM BAGI KETUA PROGRAM STUDI (KAPRODI)',
      subTitle: 'Monitoring Keterisian Kinerja Dosen Homebase, Verifikasi Butir Tridharma, dan Evaluasi Perilaku BerAKHLAK',
      codePrefix: 'USR-KPD',
      targetAudience: 'Ketua Program Studi dan Sekretaris Program Studi Kampus Utama serta PSDKU UBK',
      wewenangUtama: 'Monitoring dashboard prodi, verifikasi Tahap I beban dosen homebase, pengisian kuesioner BerAKHLAK, dan pengajuan SKP jabatan.',
      icon: Users,
    },
    dekan: {
      title: 'PANDUAN PENGGUNAAN SISTEM BAGI DEKANAT & PIMPINAN FAKULTAS',
      subTitle: 'Supervisi Capaian Mutu Fakultas, Verifikasi SKP Ketua Program Studi, dan Pengesahan Disposisi Beban Lebih',
      codePrefix: 'USR-DKN',
      targetAudience: 'Dekan, Wakil Dekan, dan Pimpinan Unit Pengelola Program Studi / PSDKU UBK',
      wewenangUtama: 'Supervisi keterisian fakultas, verifikasi Tahap II kepemimpinan akademik Kaprodi, dan pengesahan izin beban lebih (>16 SKS).',
      icon: Building2,
    },
    sdm: {
      title: 'PANDUAN PENGGUNAAN SISTEM BAGI DIREKTORAT SUMBER DAYA MANUSIA',
      subTitle: 'Manajemen Master Data Kepegawaian, Konfigurasi Komponen SPMI, Pengesahan SKP Terbit, dan Ekspor Rekapitulasi',
      codePrefix: 'USR-SDM',
      targetAudience: 'Pengelola Data Kepegawaian, Tim SPMI, dan Pimpinan Direktorat SDM Universitas Bhakti Kencana',
      wewenangUtama: 'Manajemen data dosen, pengaturan standar komponen SPMI, pengesahan final SKP ber-barcode sah, dan pelaporan akreditasi.',
      icon: ShieldCheck,
    },
  }

  const currentMeta = roleMeta[activeRole]

  // Peta Menu & Fitur Utama per Peran
  const menuFeatures: Record<Role, FeatureMenuDetail[]> = {
    dosen: [
      {
        menuName: 'Beranda (Dashboard Dosen)',
        fungsiUtama: 'Menampilkan rangkuman status pengajuan SKP semester aktif, total akumulasi SKS (rencana vs realisasi), status evaluasi kuesioner BerAKHLAK, dan notifikasi perbaikan berkas.',
        hakAkses: 'Akses penuh untuk melihat data performa pribadi dosen yang bersangkutan.',
      },
      {
        menuName: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        fungsiUtama: 'Formulir penyusunan butir Tridharma (Pendidikan, Penelitian, Pengabdian, Penunjang), pengisian target kuantitas output, mutu, tautan bukti Google Drive, dan tombol Ajukan SKP.',
        hakAkses: 'Dosen dapat membuat draf baru, mengedit butir kegiatan, dan mengajukan ulang perbaikan.',
      },
      {
        menuName: 'Kinerja Saya > Hasil Kinerja Tahunan',
        fungsiUtama: 'Menampilkan lembar rekapitulasi nilai akhir tahunan (70% Capaian SKP + 30% Perilaku BerAKHLAK), predikat mutu kinerja, serta arsip riwayat semester lampau.',
        hakAkses: 'Melihat rincian nilai dan mengunduh berkas transkrip nilai resmi.',
      },
      {
        menuName: 'Cetak Formulir SKP & Transkrip Resmi',
        fungsiUtama: 'Mencetak dokumen resmi standar format A4 institusi ber-barcode keabsahan, lengkap dengan data Rektor dan pejabat penilai yang aktif secara dinamis.',
        hakAkses: 'Dapat dicetak setelah pengajuan disahkan oleh Direktorat SDM (status Sah & Terbit).',
      },
    ],
    kaprodi: [
      {
        menuName: 'Beranda (Dashboard Kaprodi)',
        fungsiUtama: 'Memantau statistik keterisian SKP seluruh dosen homebase program studi, grafik pemenuhan batas 12-16 SKS, dan daftar dosen yang belum mengajukan rencana kerja.',
        hakAkses: 'Akses supervisi untuk seluruh dosen tetap dan kontrak di lingkungan program studi homebase.',
      },
      {
        menuName: 'Monitoring & Verifikasi > Verifikasi SKP Dosen',
        fungsiUtama: 'Memeriksa rincian butir kegiatan dosen homebase, memvalidasi keterbukaan tautan Google Drive, memberikan persetujuan (Setujui SKP), atau mengembalikan berkas (Catatan Revisi).',
        hakAkses: 'Verifikator Tahap I untuk seluruh dosen homebase program studi.',
      },
      {
        menuName: 'Evaluasi Kinerja > Penilaian Kuesioner Dosen',
        fungsiUtama: 'Formulir penilaian 7 dimensi perilaku kerja BerAKHLAK untuk setiap dosen homebase dengan skala 1-4, memperhatikan pemenuhan Critical Point pada butir ke-1.',
        hakAkses: 'Penilai resmi perilaku kerja dosen homebase tingkat program studi.',
      },
      {
        menuName: 'Kinerja Saya > Sasaran Kinerja Pegawai (Kaprodi)',
        fungsiUtama: 'Menyusun SKP mandiri tugas jabatan Kaprodi yang memadukan unsur manajerial program studi dengan beban Tridharma untuk diverifikasi Dekan Fakultas.',
        hakAkses: 'Pengusul SKP tugas jabatan pimpinan program studi.',
      },
    ],
    dekan: [
      {
        menuName: 'Beranda (Dashboard Dekan)',
        fungsiUtama: 'Memantau kepatuhan keterisian SKP di seluruh program studi fakultas, perbandingan persentase verifikasi prodi, dan ringkasan persetujuan pimpinan.',
        hakAkses: 'Supervisi tingkat fakultas untuk seluruh program studi dan cabang PSDKU binaan.',
      },
      {
        menuName: 'Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi',
        fungsiUtama: 'Memeriksa dan menyetujui sasaran kinerja kepemimpinan kurikulum, akreditasi, dan Tridharma para Ketua Program Studi untuk dinaikkan ke status Dinilai Dekan.',
        hakAkses: 'Verifikator Tahap II untuk seluruh Ketua Program Studi di lingkungan fakultas.',
      },
      {
        menuName: 'Evaluasi Kinerja > Evaluasi Kinerja Ka.Prodi',
        fungsiUtama: 'Melakukan evaluasi perilaku kepemimpinan BerAKHLAK terhadap seluruh Kaprodi dalam mengelola administrasi akademik dan koordinasi fakultas.',
        hakAkses: 'Penilai resmi perilaku kepemimpinan Ketua Program Studi.',
      },
      {
        menuName: 'Administrasi Fakultas > Disposisi Beban Lebih',
        fungsiUtama: 'Menerbitkan surat persetujuan resmi bagi dosen yang mengemban tugas strategis khusus sehingga beban Tridharma-nya melebihi 16 SKS per semester.',
        hakAkses: 'Otoritas tunggal tingkat fakultas untuk pengesahan kelebihan beban kerja.',
      },
    ],
    sdm: [
      {
        menuName: 'Beranda (Dashboard SDM Eksekutif)',
        fungsiUtama: 'Menyajikan panel analitik kepatuhan seluruh universitas, rata-rata SKS dosen institusi, grafik sebaran jabatan fungsional (JAD), dan kartu antrean pengesahan.',
        hakAkses: 'Akses menyeluruh terhadap analitik kepegawaian Universitas Bhakti Kencana.',
      },
      {
        menuName: 'Monitoring & Verifikasi > Pusat Pengesahan SKP Dosen',
        fungsiUtama: 'Memvalidasi pengajuan yang telah disetujui Dekanat (status Dinilai Dekan) dan menerbitkan status Sah & Terbit Resmi lengkap dengan barcode dan TTD Rektor.',
        hakAkses: 'Pengesah akhir seluruh dokumen Sasaran Kinerja Pegawai universitas.',
      },
      {
        menuName: 'Master & Laporan > Data Kepegawaian Dosen',
        fungsiUtama: 'Mengelola basis data dosen (NIP, NUPTK, Nama, Prodi, Jafung, Pangkat, Jabatan Kampus), proteksi jabatan tunggal, filter multi-kriteria seragam, dan Ekspor XLSX.',
        hakAkses: 'Administrator master data kepegawaian institusi.',
      },
      {
        menuName: 'Master & Laporan > Komponen SKP & Laporan Institusi',
        fungsiUtama: 'Menetapkan standar bobot SKS kegiatan Tridharma, mengonfigurasi indikator kuesioner, dan mengekspor rekapitulasi kinerja tahunan untuk akreditasi BAN-PT/LAM.',
        hakAkses: 'Pengatur kebijakan standar sistem dan pelaporan eksternal.',
      },
    ],
  }

  // Data Alur Penggunaan Aplikasi Langkah demi Langkah
  const sopSteps: Record<Role, StepDetail[]> = {
    dosen: [
      {
        no: 1,
        title: 'Buka Halaman SKP Saya & Mulai Draf Semester Aktif',
        menuPath: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        actor: currentUser?.name ? `${currentUser.name} (Dosen)` : 'Dosen Pengampu',
        desc: 'Masuk ke menu SKP Saya. Periksa periode semester yang sedang berjalan. Klik tombol Buat Pengajuan SKP Baru jika draf semester berjalan belum dibuat.',
        outputBukti: 'Draf formulir SKP aktif dengan identitas dosen yang terisi otomatis.',
        kriteriaMutu: 'Identitas homebase prodi, jabatan fungsional, dan golongan telah sesuai.',
      },
      {
        no: 2,
        title: 'Input Butir Kegiatan Tridharma (12 - 16 SKS)',
        menuPath: 'Formulir SKP > Tambah Butir Kegiatan',
        actor: 'Dosen Mandiri',
        desc: 'Klik Tambah Butir Kegiatan. Masukkan kegiatan Pendidikan (min. 4 SKS), Penelitian, PKM, dan Penunjang (maks. 3 SKS). Input target kuantitas output, mutu 100%, dan waktu pelaksanaan.',
        outputBukti: 'Tabel rincian butir kegiatan terisi dengan total beban akumulasi SKS.',
        kriteriaMutu: 'Total akumulasi SKS berada dalam rentang standar regulasi (12.00 s.d. 16.00 SKS).',
      },
      {
        no: 3,
        title: 'Tautkan Link Dokumen Bukti Fisik Google Drive Terbuka',
        menuPath: 'Formulir SKP > Kolom Tautan Dokumen Bukti',
        actor: 'Dosen Mandiri',
        desc: 'Unggah berkas bukti penugasan (SK Mengajar, RPS, Jurnal, Modul, Laporan PKM) ke Google Drive. Salin tautan URL dan pastikan izin berbagi diatur ke "Siapa saja yang memiliki link dapat melihat".',
        outputBukti: 'URL berkas berformat HTTPS yang valid dan dapat diakses verifikator.',
        kriteriaMutu: 'Tautan Google Drive tidak meminta izin akses (no permission denied).',
      },
      {
        no: 4,
        title: 'Kirim Pengajuan SKP ke Ketua Program Studi',
        menuPath: 'Formulir SKP > Tombol Ajukan SKP',
        actor: 'Dosen -> Ketua Program Studi',
        desc: 'Setelah seluruh butir kegiatan terisi dan beban SKS memenuhi syarat minimal 12 SKS, klik tombol hijau Ajukan SKP. Berkas beralih status ke Diajukan dan masuk ke antrean Kaprodi.',
        outputBukti: 'Status pengajuan berubah menjadi "Diajukan" dan berkas terkunci dari edit.',
        kriteriaMutu: 'Beban kerja tidak kurang dari 12 SKS dan seluruh bukti terlampir.',
      },
      {
        no: 5,
        title: 'Penerbitan Hasil Evaluasi & Pencetakan Dokumen Sah',
        menuPath: 'Kinerja Saya > Hasil Kinerja Tahunan / Cetak SKP',
        actor: 'Dosen Mandiri',
        desc: 'Setelah pengajuan disetujui Kaprodi, dinilai Dekan, dan disahkan SDM (status Terbit), buka pratinjau cetak untuk mengunduh Formulir SKP ber-barcode dan Transkrip Nilai Tahunan (70% SKP + 30% BerAKHLAK).',
        outputBukti: 'Dokumen cetak resmi ber-kop universitas dan barcode sah tersimpan sebagai PDF.',
        kriteriaMutu: 'Memuat tanda tangan pejabat penilai dan nama Rektor yang aktif.',
      },
    ],
    kaprodi: [
      {
        no: 1,
        title: 'Monitoring Keterisian Kinerja Dosen Homebase di Dashboard',
        menuPath: 'Beranda / Dashboard Kaprodi',
        actor: 'Ketua Program Studi',
        desc: 'Buka Dashboard Kaprodi pada awal semester untuk memantau nama dosen yang masih berstatus Draft, Diajukan, atau Perlu Tindakan. Berikan pengingat berkala sebelum tenggat pengajuan.',
        outputBukti: 'Tabel pemantauan keterisian pengajuan dosen homebase secara realtime.',
        kriteriaMutu: '100% dosen homebase program studi mengajukan SKP tepat waktu.',
      },
      {
        no: 2,
        title: 'Verifikasi Berkas SKP & Uji Akses Dokumen Google Drive',
        menuPath: 'Monitoring & Verifikasi > Verifikasi SKP Dosen',
        actor: 'Ketua Program Studi',
        desc: 'Buka menu Verifikasi SKP Dosen. Klik tombol Periksa pada baris dosen terkait. Teliti pemenuhan batas 12-16 SKS dan klik seluruh tautan Google Drive untuk memverifikasi keaslian dokumen bukti.',
        outputBukti: 'Keputusan status "Dinilai Kaprodi" (disetujui) atau "Perlu Revisi" (dikembalikan).',
        kriteriaMutu: 'Seluruh bukti fisik dapat dibuka dan relevan dengan bidang ilmu dosen.',
      },
      {
        no: 3,
        title: 'Penilaian Kuesioner Perilaku Kerja BerAKHLAK Dosen',
        menuPath: 'Evaluasi Kinerja > Penilaian Kuesioner Dosen',
        actor: 'Ketua Program Studi',
        desc: 'Pada akhir tahun akademik, buka instrumen kuesioner BerAKHLAK untuk menilai 7 dimensi perilaku dosen dengan skala 1-4. Pastikan pemenuhan indikator Poin Kritis pada butir pertama.',
        outputBukti: 'Instrumen evaluasi perilaku BerAKHLAK dosen tersimpan di database.',
        kriteriaMutu: 'Penilaian obyektif, proporsional, dan menyumbang 30% pada nilai akhir kinerja dosen.',
      },
      {
        no: 4,
        title: 'Penyusunan SKP Tugas Jabatan Mandiri Kaprodi ke Dekan',
        menuPath: 'Kinerja Saya > Sasaran Kinerja Pegawai',
        actor: 'Kaprodi (Sebagai Pegawai)',
        desc: 'Susun SKP pribadi tugas tambahan kepemimpinan prodi (akreditasi, pengelolaan kurikulum, rapat dosen) serta Tridharma mandiri. Kirimkan pengajuan ke Dekanat untuk dinilai Dekan Fakultas.',
        outputBukti: 'Formulir SKP Jabatan Kaprodi berstatus Diajukan ke Dekan.',
        kriteriaMutu: 'Memuat indikator capaian Renstra program studi yang terukur.',
      },
    ],
    dekan: [
      {
        no: 1,
        title: 'Supervisi Capaian Mutu Lintas Program Studi Fakultas',
        menuPath: 'Beranda / Dashboard Dekan',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Buka Dashboard Dekan untuk mengawasi rasio penyelesaian SKP di setiap program studi. Identifikasi program studi yang mengalami kendala administrasi agar dapat diberikan pembinaan.',
        outputBukti: 'Visualisasi grafik kepatuhan SKP per prodi di lingkungan fakultas.',
        kriteriaMutu: 'Tidak ada program studi yang tertinggal dalam kalender akademik evaluasi kinerja.',
      },
      {
        no: 2,
        title: 'Verifikasi & Pengesahan SKP Ketua Program Studi (Tahap II)',
        menuPath: 'Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Masuk ke menu Verifikasi SKP Ka.Prodi. Telaah butir manajerial kepemimpinan prodi dan Tridharma masing-masing Kaprodi. Klik Setujui agar berkas berstatus Dinilai Dekan dan siap disahkan SDM.',
        outputBukti: 'Persetujuan validasi tingkat fakultas dengan status "Dinilai Dekan".',
        kriteriaMutu: 'Sasaran manajerial prodi selaras dengan target Rencana Strategis (Renstra) Fakultas.',
      },
      {
        no: 3,
        title: 'Evaluasi Perilaku Kepemimpinan BerAKHLAK Kaprodi',
        menuPath: 'Evaluasi Kinerja > Evaluasi Kinerja Ka.Prodi',
        actor: 'Dekan / Pimpinan Fakultas',
        desc: 'Lakukan evaluasi 7 dimensi BerAKHLAK terhadap seluruh Kaprodi dengan menitikberatkan pada akuntabilitas pelaporan, kepemimpinan kurikulum, dan kolaborasi antar program studi.',
        outputBukti: 'Hasil penilaian perilaku pimpinan program studi tersimpan resmi.',
        kriteriaMutu: 'Disertai catatan arahan konstruktif untuk peningkatan mutu kepemimpinan prodi.',
      },
      {
        no: 4,
        title: 'Penerbitan Disposisi Khusus Beban Lebih (> 16 SKS)',
        menuPath: 'Administrasi Fakultas / Disposisi SKS',
        actor: 'Dekan Fakultas',
        desc: 'Tandatangani surat disposisi resmi persetujuan beban lebih bagi dosen yang mengemban tugas mendesak institusi dengan beban di atas 16 SKS agar tidak terblokir saat verifikasi SDM.',
        outputBukti: 'Surat disposisi izin beban lebih berkop Fakultas yang sah.',
        kriteriaMutu: 'Penugasan darurat terjustifikasi jelas dalam berita acara fakultas.',
      },
    ],
    sdm: [
      {
        no: 1,
        title: 'Kelola Master Data Dosen & Filter Multi-Kriteria',
        menuPath: 'Master & Laporan > Data Kepegawaian Dosen',
        actor: 'Administrator SDM',
        desc: 'Kelola basis data dosen (NIP, NUPTK, Nama, Homebase Prodi, Kampus, Jafung, Pangkat, Jabatan Kampus). Gunakan filter terpadu untuk pencarian cepat dan tombol Ekspor XLSX untuk unduh data.',
        outputBukti: 'Basis data kepegawaian institusi yang mutakhir dan file spreadsheet ekspor.',
        kriteriaMutu: 'Proteksi mutasi jabatan tunggal aktif untuk mencegah penetapan jabatan ganda.',
      },
      {
        no: 2,
        title: 'Konfigurasi Master Komponen SKP & Bobot SPMI',
        menuPath: 'Master & Laporan > Komponen SKP & Indikator Kinerja',
        actor: 'Administrator SDM',
        desc: 'Atur standar bobot SKS butir Tridharma, batas SKS maksimal, dan instrumen kuesioner BerAKHLAK sesuai pedoman SPMI institusi nomor 03.07.00/PD/SDM-SPMI.',
        outputBukti: 'Katalog komponen SKP dan instrumen perilaku BerAKHLAK aktif di sistem.',
        kriteriaMutu: 'Standar komponen terstandarisasi untuk seluruh dosen universitas.',
      },
      {
        no: 3,
        title: 'Validasi Akhir & Pengesahan Dokumen SKP Terbit Sah',
        menuPath: 'Monitoring & Verifikasi > Pusat Pengesahan SKP Dosen',
        actor: 'Administrator SDM',
        desc: 'Buka daftar pengajuan yang telah disetujui Dekan (status Dinilai Dekan). Validasi kepatuhan akhir, lalu klik Sahkan SKP. Status berkas otomatis menjadi Sah & Terbit dengan barcode otentikasi.',
        outputBukti: 'Formulir SKP berstatus Terbit Resmi dengan TTD Rektor dan barcode sah.',
        kriteriaMutu: 'Dokumen cetak sah memuat nama Rektor yang aktif secara dinamis dari database.',
      },
      {
        no: 4,
        title: 'Penarikan Laporan Rekapitulasi & Ekspor Akreditasi',
        menuPath: 'Master & Laporan > Laporan & Rekapitulasi Institusi',
        actor: 'Administrator SDM',
        desc: 'Pilih periode tahun akademik, filter per fakultas atau prodi, lihat grafik sebaran predikat mutu, dan unduh laporan Excel resmi untuk kebutuhan pelaporan BAN-PT, LAM-PTKes, dan Yayasan.',
        outputBukti: 'Laporan rekapitulasi capaian kinerja dan distribusi predikat universitas.',
        kriteriaMutu: 'Format angka rapi dengan tabular numerals dan ringkasan eksekutif akurat.',
      },
    ],
  }

  // Data FAQ Cara Pakai dan Solusi Kendala
  const sopFaqs: Record<Role, FAQDetail[]> = {
    dosen: [
      {
        q: 'Bagaimana cara menambahkan butir kegiatan Tridharma di formulir SKP?',
        a: 'Masuk ke menu Kinerja Saya > Sasaran Kinerja Pegawai. Pada tabel butir kegiatan, klik tombol hijau "+ Tambah Butir Kegiatan". Pilih salah satu unsur Tridharma, tentukan target kuantitas, satuan output, target waktu, dan persentase mutu (100%). Total SKS akan otomatis terakumulasi.',
      },
      {
        q: 'Mengapa tombol "Ajukan SKP" berwarna abu-abu / tidak dapat diklik?',
        a: 'Tombol Ajukan SKP hanya aktif jika total akumulasi beban SKS Anda telah memenuhi batas minimal regulasi (antara 12.00 hingga 16.00 SKS). Periksa kembali ringkasan SKS Anda: jika kurang dari 12 SKS, tambahkan butir penugasan; jika lebih dari 16 SKS, sesuaikan beban atau lampirkan surat disposisi Dekan.',
      },
      {
        q: 'Bagaimana cara menyetel izin tautan Google Drive agar tidak ditolak penilai?',
        a: 'Saat menyalin link berkas dari Google Drive, pastikan opsi Akses Umum (General Access) disetel ke "Siapa saja yang memiliki link" (Anyone with the link) dengan status "Pelihat" (Viewer). Jangan menyetel ke "Dibatasi" (Restricted) karena penilai tidak akan dapat membuka berkas Anda.',
      },
      {
        q: 'Apa yang harus dilakukan bila pengajuan SKP berstatus "Perlu Revisi"?',
        a: 'Buka menu SKP Saya. Di bagian atas formulir akan tampil kotak berwarna kuning/merah berisi Catatan Verifikator dari Kaprodi atau Dekan. Perbaiki butir kegiatan atau tautan yang diminta, lalu klik tombol "Ajukan Ulang SKP". Berkas akan masuk kembali ke antrean verifikator.',
      },
      {
        q: 'Bagaimana cara mengunduh dan mencetak formulir SKP dan transkrip sah?',
        a: 'Setelah status berkas Anda berubah menjadi "Terbit" atau "Disahkan", buka menu SKP Saya atau Hasil Kinerja Tahunan. Klik tombol "Cetak Formulir Resmi" atau "Cetak Transkrip". Pada jendela pratinjau cetak, klik tombol "Cetak / Simpan PDF" di sudut kanan atas.',
      },
    ],
    kaprodi: [
      {
        q: 'Bagaimana prosedur menyetujui atau mengembalikan pengajuan SKP dosen?',
        a: 'Masuk ke menu Monitoring & Verifikasi > Verifikasi SKP Dosen. Klik tombol Periksa pada dosen terkait. Periksa rincian kegiatan dan pastikan tautan Google Drive terbuka. Jika sudah lengkap, klik tombol hijau Setujui SKP. Jika terdapat kekurangan, klik tombol merah Kembalikan, tulis catatan perbaikan spesifik, lalu konfirmasi.',
      },
      {
        q: 'Kapan Kaprodi harus mengisi kuesioner perilaku kerja BerAKHLAK dosen?',
        a: 'Kuesioner BerAKHLAK diisi menjelang akhir tahun akademik. Buka menu Evaluasi Kinerja > Penilaian Kuesioner Dosen, pilih nama dosen homebase, dan berikan skor skala 1 sampai 4 pada 7 dimensi. Nilai kuesioner ini menyumbang 30% pada Nilai Akhir Kinerja dosen.',
      },
      {
        q: 'Apakah Kaprodi juga wajib menyusun SKP mandiri tugas jabatan?',
        a: 'Ya. Kaprodi memiliki peran ganda: sebagai pendidik dan pimpinan struktural prodi. Masuk ke menu Kinerja Saya > Sasaran Kinerja Pegawai untuk menyusun SKP tugas kepemimpinan dan Tridharma mandiri Anda. SKP Kaprodi akan diverifikasi langsung oleh Dekan Fakultas.',
      },
    ],
    dekan: [
      {
        q: 'Apa cakupan wewenang verifikasi SKP tingkat Dekanat?',
        a: 'Dekan bertindak sebagai Verifikator Tahap II untuk seluruh Ketua Program Studi di fakultasnya. Masuk ke menu Monitoring & Verifikasi > Verifikasi SKP Ka.Prodi, telaah sasaran manajerial serta Tridharma Kaprodi, lalu klik Setujui agar pengajuan diteruskan ke Direktorat SDM.',
      },
      {
        q: 'Bagaimana prosedur pemberian persetujuan kelebihan beban SKS (> 16 SKS)?',
        a: 'Jika dosen di salah satu program studi memiliki beban lebih dari 16 SKS karena kondisi mendesak institusi (misalnya pembukaan prodi baru atau riset prioritas), Dekanat menerbitkan surat disposisi persetujuan beban lebih yang dilampirkan agar status pengajuan tidak terhambat sistem.',
      },
    ],
    sdm: [
      {
        q: 'Bagaimana cara mengesahkan SKP dosen sehingga berstatus "Terbit"?',
        a: 'Masuk ke menu Monitoring & Verifikasi > Pusat Pengesahan SKP Dosen. Buka pengajuan dosen yang telah berstatus Dinilai Dekan. Periksa kepatuhan akhir dokumen, lalu klik Sahkan SKP. Berkas otomatis berstatus Sah & Terbit, memuat nama Rektor yang aktif, serta mengaktifkan barcode digital.',
      },
      {
        q: 'Bagaimana cara mengekspor rekapitulasi data dosen sesuai filter ke Excel?',
        a: 'Pada halaman Data Kepegawaian Dosen, gunakan dropdown filter di bagian atas (Fakultas, Prodi, Kampus, Jabatan, Pangkat, atau Status). Setelah tabel menampilkan data yang sesuai kebutuhan, klik tombol Ekspor XLSX. Sistem akan mengunduh file spreadsheet resmi sesuai data hasil filter.',
      },
      {
        q: 'Bagaimana jika terjadi pergantian pimpinan Rektor pada lembar cetakan resmi?',
        a: 'Data Rektor diambil secara dinamis dari database master kepegawaian. Cukup perbarui data dosen dengan jabatan kampus Rektor pada menu Data Kepegawaian Dosen, maka seluruh lembar cetak formulir resmi di sistem akan langsung terbarui secara otomatis.',
      },
    ],
  }

  const currentSteps = sopSteps[activeRole] || []
  const currentMenus = menuFeatures[activeRole] || []
  const currentFaqs = sopFaqs[activeRole] || []
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <PrintPageContainer
      title="Buku Panduan Penggunaan Sistem Informasi SDM & SKP Digital"
      subtitle="Format Standar A4 Resmi Universitas Bhakti Kencana"
      badge={
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
          Pedoman Resmi
        </span>
      }
    >
      <style>{`
        .panduan-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          margin-bottom: 10px;
        }
        .panduan-table th {
          border: 1px solid #000000;
          padding: 5px 7px;
          background: #f1f5f9;
          font-weight: 800;
          text-align: left;
          text-transform: uppercase;
          font-size: 7.5pt;
        }
        .panduan-table td {
          border: 1px solid #000000;
          padding: 5px 7px;
          vertical-align: top;
          line-height: 1.35;
        }
        .identity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          margin-bottom: 8px;
        }
        .identity-table td {
          padding: 2.5px 4px;
          vertical-align: top;
        }
        .badge-dokumen {
          display: inline-block;
          border: 1px solid #000000;
          padding: 1px 6px;
          font-size: 7pt;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      {/* KOP INSTITUSI RESMI UNIVERSITAS BHAKTI KENCANA */}
      <KopSuratUBK />

      {/* JUDUL DOKUMEN PANDUAN PENGGUNAAN SISTEM */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#0f223d' }}>
            BUKU PANDUAN PENGGUNAAN SISTEM INFORMASI SDM &amp; SKP DIGITAL
          </div>
          <div style={{ fontSize: '9.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 1 }}>
            {currentMeta.title}
          </div>
          <div style={{ fontSize: '8pt', color: '#475569', marginTop: 2 }}>
            Sistem Informasi Pengelolaan Sasaran Kinerja Pegawai (SKP) &bull; No. Dokumen: UBK-MAN/{currentMeta.codePrefix}/2026/001
          </div>
          <div style={{ marginTop: 4 }}>
            <span className="badge-dokumen">STATUS: PANDUAN OPERASIONAL RESMI</span>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>&bull;</span>
            <span className="badge-dokumen">EDISI: SEMESTER GENAP TA 2025/2026</span>
          </div>
        </div>

        {/* =========================================================================
            BAGIAN I: PETA MENU & HAK AKSES FITUR SISTEM
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN I: PETA MENU &amp; FITUR UTAMA APLIKASI</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Hak Akses Peran {activeRole.toUpperCase()}</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>No</th>
                <th style={{ width: '28%' }}>Nama Menu / Halaman</th>
                <th style={{ width: '42%' }}>Fungsi Utama Aplikasi</th>
                <th style={{ width: '25%' }}>Cakupan Hak Akses</th>
              </tr>
            </thead>
            <tbody>
              {currentMenus.map((m, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 800 }}>{m.menuName}</td>
                  <td>{m.fungsiUtama}</td>
                  <td style={{ fontSize: '7.5pt' }}>{m.hakAkses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN II: PROSEDUR OPERASIONAL PENGGUNAAN SISTEM LANGKAH DEMI LANGKAH
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN II: PANDUAN PENGGUNAAN SISTEM LANGKAH DEMI LANGKAH</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Alur Operasional Pengguna</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>Langkah</th>
                <th style={{ width: '26%' }}>Aktivitas &amp; Menu Terkait</th>
                <th style={{ width: '16%' }}>Pelaksana</th>
                <th style={{ width: '34%' }}>Uraian Prosedur Penggunaan Sistem</th>
                <th style={{ width: '18%' }}>Kriteria Validasi</th>
              </tr>
            </thead>
            <tbody>
              {currentSteps.map((step) => (
                <tr key={step.no}>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '9pt' }}>{step.no}</td>
                  <td>
                    <strong style={{ fontSize: '8pt', color: '#0f223d' }}>{step.title}</strong>
                    <div style={{ fontSize: '7pt', color: '#475569', marginTop: 2 }}>
                      Menu: {step.menuPath}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{step.actor}</td>
                  <td>
                    <div style={{ textAlign: 'justify' }}>{step.desc}</div>
                    <div style={{ fontSize: '7pt', color: '#1e3a8a', marginTop: 3 }}>
                      <strong>Output:</strong> {step.outputBukti}
                    </div>
                  </td>
                  <td style={{ fontSize: '7.5pt' }}>{step.kriteriaMutu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BAGIAN III: STANDAR BEBAN KERJA (12 - 16 SKS) & PREDIKAT KINERJA
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN III: STANDAR BEBAN SKS &amp; SISTEM SKORING PREDIKAT KINERJA</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Formula (70% SKP + 30% BerAKHLAK)</span>
          </div>

          <table className="panduan-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Rentang Nilai</th>
                <th style={{ width: '20%' }}>Predikat Kinerja</th>
                <th style={{ width: '62%' }}>Status Kelulusan &amp; Tindak Lanjut Institusi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>91.00 - 100.00</td>
                <td style={{ fontWeight: 800, color: '#1e40af' }}>SANGAT BAIK</td>
                <td>Kinerja melampaui seluruh target. Memenuhi kualifikasi penghargaan keunggulan akademik dan promosi jabatan institusi.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>76.00 - 90.99</td>
                <td style={{ fontWeight: 800, color: '#15803d' }}>BAIK</td>
                <td>Kinerja memenuhi seluruh standar baku mutu SPMI UBK. Memenuhi syarat kelulusan BKD dan perpanjangan ikatan kerja.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>61.00 - 75.99</td>
                <td style={{ fontWeight: 800, color: '#d97706' }}>BUTUH PERBAIKAN</td>
                <td>Kinerja belum optimal. Memerlukan bimbingan, pendampingan berkala, dan pembinaan oleh Ketua Program Studi / Dekanat.</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>51.00 - 60.99</td>
                <td style={{ fontWeight: 800, color: '#b91c1c' }}>KURANG</td>
                <td>Tidak memenuhi standar minimum. Diberikan pembinaan tertulis dan penyesuaian beban penugasan Tridharma.</td>
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
            BAGIAN IV: TANYA JAWAB OPERASIONAL & PENANGANAN KENDALA (FAQ)
           ========================================================================= */}
        <div className="avoid-break" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>BAGIAN IV: TANYA JAWAB PENGGUNAAN SISTEM &amp; PENANGANAN KENDALA (FAQ)</span>
            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569' }}>Solusi Cepat Pengguna</span>
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

        {/* CATATAN RESMI */}
        <div className="avoid-break" style={{ marginTop: 12, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontSize: '7.5pt', lineHeight: 1.4, color: '#334155' }}>
          <strong>Catatan Penggunaan Dokumen:</strong> Buku Panduan ini merupakan panduan operasional resmi tata cara penggunaan aplikasi SIM-SDM &amp; SKP Digital di lingkungan Universitas Bhakti Kencana. Diterbitkan oleh Direktorat Sumber Daya Manusia Universitas Bhakti Kencana untuk mendukung tata kelola kinerja akademik terstandar.
        </div>
    </PrintPageContainer>
  )
}