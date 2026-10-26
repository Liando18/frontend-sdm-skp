# Design System: Portal SDM Universitas Bhakti Kencana (UBK)

## 1. Identitas & Karakter Visual
- **Institusi**: Direktorat Sumber Daya Manusia, Universitas Bhakti Kencana (Bandung, Jawa Barat).
- **Karakter**: Akademik, Berwibawa, Rapi, Ergonomis, Terpercaya.
- **Tujuan**: Memfasilitasi pengelolaan master data dosen, penyusunan dan verifikasi Sasaran Kinerja Pegawai (SKP) Tridharma, penilaian perilaku kerja BerAKHLAK, serta pelaporan evaluasi kinerja dosen secara transparan dan akuntabel.
- **Prinsip Anti-Slop**:
  - Tidak menggunakan gradien ungu-biru generik atau radial orbs melayang.
  - Tidak ada em dash (`—`) pada seluruh teks antarmuka (sesuai aturan R-02).
  - Tidak ada ikon panah melayang yang berputar 45 derajat tanpa fungsi nyata.
  - Tidak ada tombol mati atau interaksi palsu (`alert()`).
  - Tidak ada perulangan animasi berkedip tanpa henti (*endless pulses*).
  - Hirarki visual jelas dengan kontras warna memenuhi standar WCAG AA (rasio minimal 4.5:1).

## 2. Palet Warna Institusional
- **Brand Navy (Warna Utama Kelembagaan)**:
  - Deep Navy: `#0f1f38` (teks utama, aksen pimpinan, brand bar)
  - Navy Surface: `#172c4d` (header, kartu penekanan khusus)
  - Navy Muted: `#334b6e`
- **Brand Amber / Terracotta (Aksen Resmi UBK)**:
  - Primary Accent: `#d95716` (tombol utama, status aktif)
  - Accent Hover: `#b9430c`
  - Accent Subtle: `#fff2ec` (latar tag & badge)
- **Netral & Kanvas**:
  - Background Halaman: `#f7f9fc`
  - Background Kartu & Panel: `#ffffff`
  - Border & Pembatas: `#e2e8f0`
  - Border Tebal/Fokus: `#cbd5e1`
  - Teks Utama (Ink): `#0f172a`
  - Teks Sekunder (Muted): `#475569`
  - Teks Lembut (Faint): `#94a3b8`
- **Warna Status Semantik**:
  - Disetujui / Sangat Baik (Hijau): `#15803d` (latar `#dcfce7`)
  - Dalam Proses / Dinilai (Biru): `#0369a1` (latar `#e0f2fe`)
  - Menunggu Review (Kuning/Ochre): `#b45309` (latar `#fef3c7`)
  - Perlu Revisi / Kurang (Merah): `#b91c1c` (latar `#fee2e2`)

## 3. Tipografi
- **Keluarga Font**: `Plus Jakarta Sans`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Fitur Numerik**: `font-variant-numeric: tabular-nums` (memastikan angka NIP, NIDN, nilai SKS, dan tanggal sejajar rapi).
- **Skala Ukuran**:
  - Judul Halaman: 24px - 26px (Weight 700, letter-spacing -0.025em)
  - Judul Bagian / Kartu: 16px - 18px (Weight 600-700)
  - Teks Standar / Form Label: 13.5px - 14px (Weight 500-600)
  - Teks Tabel & Badge: 12.5px - 13px (Weight 500-600)
  - Keterangan & Meta: 11px - 12px (Weight 500)

## 4. Skala Spasi & Radius
- **Spasi**: 4px, 8px, 12px, 16px, 20px, 24px, 32px.
- **Border Radius**:
  - Tombol kecil, badge & tag: `8px`
  - Input field, select, dropdown: `10px`
  - Kartu, tabel container & panel: `14px`
  - Modal card & drawer navigasi: `18px`
  - Avatar & indikator status: `50%` atau `9999px`

## 5. Dial Gaya Desain
- **ENERGY**: 2 (Fokus kerja profesional, tata letak seimbang dan teratur)
- **RHYTHM**: 2 (Variasi komposisi terstruktur: metrik ringkas di atas, tabel data di tengah, formulir di panel tersendiri)
- **MOTION**: 1 (Transisi halus pada hover dan pembukaan modal, tanpa animasi gerak terus menerus)
