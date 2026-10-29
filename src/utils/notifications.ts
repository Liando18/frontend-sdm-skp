import { Role, UserSession, Dosen, PengajuanSKP, PenilaianKuesioner, NotificationItem } from '../types'

export function deriveRealNotifications(
  role: Role,
  user: UserSession,
  skpList: PengajuanSKP[],
  penilaianList: PenilaianKuesioner[],
  dosenList: Dosen[],
  readIds: string[] = []
): NotificationItem[] {
  const notifications: NotificationItem[] = []

  if (role === 'dosen') {
    // 1. SKP Real Data for Dosen
    const userNip = user.nip || ''
    const userFirstName = (user.name || '').split(',')[0].trim().toLowerCase()
    const mySKPs = skpList.filter(
      (s) =>
        (userNip && s.dosenNip === userNip) ||
        (s.dosenId && s.dosenId === user.id) ||
        (userFirstName && (s.dosenNama || '').toLowerCase().includes(userFirstName))
    )

    if (mySKPs.length > 0) {
      mySKPs.slice(0, 3).forEach((skp) => {
        const sem = skp.semester ? `Semester ${skp.semester}` : ''
        const thn = skp.tahunAkademik || ''
        const periode = [sem, thn].filter(Boolean).join(' ')
        const statusSlug = (skp.status || '').toLowerCase().replace(/\s+/g, '-')
        const id = `notif-skp-${skp.id}-${statusSlug}`

        if (['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi', 'Dinilai Dekan'].includes(skp.status)) {
          notifications.push({
            id,
            title: 'SKP Sah & Terbit Resmi',
            desc: `Selamat! Pengajuan SKP ${periode} Anda telah disetujui, ditandatangani, dan sah diterbitkan secara resmi.`,
            message: `Selamat! Pengajuan SKP ${periode} Anda telah disetujui, ditandatangani, dan sah diterbitkan secara resmi.`,
            time: 'Terbaru',
            read: readIds.includes(id),
            type: 'success',
            tag: 'SKP',
          })
        } else if (skp.status === 'Diajukan') {
          notifications.push({
            id,
            title: 'Pengajuan SKP Sedang Ditinjau',
            desc: `Berkas SKP ${periode} Anda telah diajukan dan dalam antrean verifikasi Ketua Program Studi.`,
            message: `Berkas SKP ${periode} Anda telah diajukan dan dalam antrean verifikasi Ketua Program Studi.`,
            time: 'Dalam Proses',
            read: readIds.includes(id),
            type: 'info',
            tag: 'SKP',
          })
        } else if (skp.status === 'Perlu Revisi') {
          const catatan = skp.catatanSDM || skp.catatanKaprodi || 'Silakan periksa catatan revisi.';
          notifications.push({
            id,
            title: 'Penerbitan SKP Dibatalkan / Perlu Revisi',
            desc: `Pengajuan SKP ${periode} memerlukan perbaikan: ${catatan}`,
            message: `Pengajuan SKP ${periode} memerlukan perbaikan: ${catatan}`,
            time: 'Penting',
            read: readIds.includes(id),
            type: 'warning',
            tag: 'Revisi',
          })
        } else if (skp.status === 'Draft') {
          notifications.push({
            id,
            title: 'Draft SKP Belum Diajukan',
            desc: `Anda memiliki draf SKP ${periode}. Lengkapi berkas dan tautan bukti drive sebelum batas waktu.`,
            message: `Anda memiliki draf SKP ${periode}. Lengkapi berkas dan tautan bukti drive sebelum batas waktu.`,
            time: 'Draft',
            read: readIds.includes(id),
            type: 'info',
            tag: 'SKP',
          })
        }
      })
    } else {
      const id = `notif-dosen-no-skp-${userNip || 'new'}`
      notifications.push({
        id,
        title: 'Periode Penyusunan SKP Aktif',
        desc: 'Silakan susun target kegiatan SKP Tridharma Anda untuk tahun akademik berjalan.',
        message: 'Silakan susun target kegiatan SKP Tridharma Anda untuk tahun akademik berjalan.',
        time: 'Info Periode',
        read: readIds.includes(id),
        type: 'info',
        tag: 'SKP',
      })
    }

    // 2. Kuesioner Real Data for Dosen
    const myKuis = penilaianList.find(
      (p) =>
        (p.dosenId && p.dosenId === user.id) ||
        (userFirstName && (p.dosenNama || '').toLowerCase().includes(userFirstName))
    )

    if (myKuis) {
      const id = `notif-kuis-dosen-${myKuis.id}`
      notifications.push({
        id,
        title: 'Hasil Evaluasi Perilaku BerAKHLAK',
        desc: `Kuesioner perilaku tahunan ${myKuis.tahun} Anda telah dinilai oleh pimpinan dengan predikat ${myKuis.predikat || 'Sangat Baik'}.`,
        message: `Kuesioner perilaku tahunan ${myKuis.tahun} Anda telah dinilai oleh pimpinan dengan predikat ${myKuis.predikat || 'Sangat Baik'}.`,
        time: 'Tahunan',
        read: readIds.includes(id),
        type: 'success',
        tag: 'Kuesioner',
      })
    } else {
      const id = 'notif-kuis-dosen-pending'
      notifications.push({
        id,
        title: 'Evaluasi Kuesioner Perilaku Tahunan',
        desc: 'Penilaian 7 Dimensi BerAKHLAK Anda dalam antrean pengisian oleh Ketua Program Studi.',
        message: 'Penilaian 7 Dimensi BerAKHLAK Anda dalam antrean pengisian oleh Ketua Program Studi.',
        time: 'Tahunan',
        read: readIds.includes(id),
        type: 'info',
        tag: 'Kuesioner',
      })
    }
  } else if (role === 'kaprodi') {
    const prodiClean = user.prodi || 'S1 Keperawatan'
    const pendingSkp = skpList.filter((s) => s.dosenProdi === prodiClean && s.status === 'Diajukan')
    const revSkpCount = skpList.filter((s) => s.dosenProdi === prodiClean && s.status === 'Perlu Revisi').length
    const verifiedSkpCount = skpList.filter((s) => s.dosenProdi === prodiClean && s.status === 'Dinilai Kaprodi').length

    if (pendingSkp.length > 0) {
      const count = pendingSkp.length
      const id = `notif-kaprodi-pending-skp-${count}`
      const names = pendingSkp
        .map((s) => s.dosenNama)
        .slice(0, 2)
        .join(', ')
      const more = count > 2 ? ` dan ${count - 2} dosen lainnya` : ''

      notifications.push({
        id,
        title: 'Verifikasi Pengajuan SKP Dosen',
        desc: `Terdapat ${count} pengajuan SKP dosen prodi ${prodiClean} (${names}${more}) menunggu verifikasi Anda.`,
        message: `Terdapat ${count} pengajuan SKP dosen prodi ${prodiClean} (${names}${more}) menunggu verifikasi Anda.`,
        time: 'Perlu Tindakan',
        read: readIds.includes(id),
        type: 'warning',
        tag: 'Verifikasi SKP',
      })
    }

    if (revSkpCount > 0) {
      const id = `notif-kaprodi-revisi-${revSkpCount}`
      notifications.push({
        id,
        title: 'SKP Dosen Dalam Proses Revisi',
        desc: `Terdapat ${revSkpCount} berkas SKP di prodi ${prodiClean} yang sedang diperbaiki oleh dosen bersangkutan.`,
        message: `Terdapat ${revSkpCount} berkas SKP di prodi ${prodiClean} yang sedang diperbaiki oleh dosen bersangkutan.`,
        time: 'Pemantauan',
        read: readIds.includes(id),
        type: 'info',
        tag: 'SKP',
      })
    }

    // Evaluasi Dosen di Prodi
    const prodiDosen = dosenList.filter((d) => d.prodi === prodiClean && !d.isKaprodi)
    const prodiEvaluated = penilaianList.filter((p) => p.dosenProdi === prodiClean).length
    const unEval = Math.max(0, prodiDosen.length - prodiEvaluated)

    if (unEval > 0) {
      const id = `notif-kaprodi-uneval-${unEval}`
      notifications.push({
        id,
        title: 'Evaluasi Kuesioner BerAKHLAK Dosen',
        desc: `Terdapat ${unEval} dari ${prodiDosen.length} dosen prodi ${prodiClean} yang belum dinilai perilaku BerAKHLAK tahunan.`,
        message: `Terdapat ${unEval} dari ${prodiDosen.length} dosen prodi ${prodiClean} yang belum dinilai perilaku BerAKHLAK tahunan.`,
        time: 'Evaluasi',
        read: readIds.includes(id),
        type: 'warning',
        tag: 'Kuesioner',
      })
    } else {
      const id = `notif-kaprodi-eval-complete-${prodiClean}`
      notifications.push({
        id,
        title: 'Evaluasi Kuesioner Prodi Lengkap',
        desc: `Seluruh dosen homebase di program studi ${prodiClean} telah selesai dinilai perilaku BerAKHLAK.`,
        message: `Seluruh dosen homebase di program studi ${prodiClean} telah selesai dinilai perilaku BerAKHLAK.`,
        time: 'Selesai',
        read: readIds.includes(id),
        type: 'success',
        tag: 'Kuesioner',
      })
    }

    if (verifiedSkpCount > 0) {
      const id = `notif-kaprodi-verified-${verifiedSkpCount}`
      notifications.push({
        id,
        title: 'SKP Telah Sah & Terbit',
        desc: `Sebanyak ${verifiedSkpCount} SKP dosen prodi ${prodiClean} telah disahkan dan terbit secara resmi.`,
        message: `Sebanyak ${verifiedSkpCount} SKP dosen prodi ${prodiClean} telah disahkan dan terbit secara resmi.`,
        time: 'Terbit',
        read: readIds.includes(id),
        type: 'success',
        tag: 'SKP',
      })
    }
  } else if (role === 'dekan') {
    const skpMenungguDekan = skpList.filter((s) => s.penilaiRole === 'Dekan' && s.status === 'Diajukan')
    const countWaiting = skpMenungguDekan.length

    if (countWaiting > 0) {
      const id = `notif-dekan-waiting-${countWaiting}`
      notifications.push({
        id,
        title: 'Pengesahan SKP Ka. Prodi',
        desc: `Terdapat ${countWaiting} pengajuan SKP Ketua Program Studi yang menunggu evaluasi & pengesahan Dekan.`,
        message: `Terdapat ${countWaiting} pengajuan SKP Ketua Program Studi yang menunggu evaluasi & pengesahan Dekan.`,
        time: 'Perlu Tindakan',
        read: readIds.includes(id),
        type: 'warning',
        tag: 'Pengesahan Dekan',
      })
    }

    // Evaluasi Ka Prodi oleh Dekan
    const kaprodiCount = dosenList.filter((d) => d.isKaprodi).length || 5
    const kaprodiEvaluated = penilaianList.filter((p) => p.penilaiRole === 'Dekan').length
    const unEvalKaprodi = Math.max(0, kaprodiCount - kaprodiEvaluated)

    if (unEvalKaprodi > 0) {
      const id = `notif-dekan-kuis-kaprodi-${unEvalKaprodi}`
      notifications.push({
        id,
        title: 'Evaluasi Perilaku Ka Prodi',
        desc: `Terdapat ${unEvalKaprodi} Ketua Program Studi yang menunggu pengisian kuesioner perilaku BerAKHLAK tahunan oleh Dekan.`,
        message: `Terdapat ${unEvalKaprodi} Ketua Program Studi yang menunggu pengisian kuesioner perilaku BerAKHLAK tahunan oleh Dekan.`,
        time: 'Kuesioner',
        read: readIds.includes(id),
        type: 'info',
        tag: 'Kuesioner',
      })
    } else {
      const id = 'notif-dekan-kuis-kaprodi-done'
      notifications.push({
        id,
        title: 'Penilaian Ka Prodi Selesai',
        desc: 'Evaluasi kuesioner perilaku BerAKHLAK untuk seluruh Ketua Program Studi telah tuntas dinilai.',
        message: 'Evaluasi kuesioner perilaku BerAKHLAK untuk seluruh Ketua Program Studi telah tuntas dinilai.',
        time: 'Selesai',
        read: readIds.includes(id),
        type: 'success',
        tag: 'Kuesioner',
      })
    }

    const approvedSdm = skpList.filter((s) => ['Disahkan', 'Terbit', 'Disetujui SDM'].includes(s.status)).length
    if (approvedSdm > 0) {
      const id = `notif-dekan-sdm-approved-${approvedSdm}`
      notifications.push({
        id,
        title: 'SKP Sah & Terbit Aktif',
        desc: `Sebanyak ${approvedSdm} SKP fakultas telah sah diterbitkan secara resmi.`,
        message: `Sebanyak ${approvedSdm} SKP fakultas telah sah diterbitkan secara resmi.`,
        time: 'Terverifikasi',
        read: readIds.includes(id),
        type: 'success',
        tag: 'SKP',
      })
    }
  } else {
    // Role: SDM
    const pendingUniv = skpList.filter((s) => s.status === 'Diajukan').length
    const approvedSdm = skpList.filter((s) => ['Disahkan', 'Terbit', 'Disetujui SDM', 'Dinilai Kaprodi'].includes(s.status)).length
    const revisiCount = skpList.filter((s) => s.status === 'Perlu Revisi').length
    const totalDosen = dosenList.length || 329
    const totalPenilaian = penilaianList.length

    if (approvedSdm > 0) {
      const id = `notif-sdm-approved-${approvedSdm}`
      notifications.push({
        id,
        title: 'SKP Sah & Terbit Terpantau',
        desc: `Sebanyak ${approvedSdm} berkas SKP telah sah diterbitkan oleh Ka. Prodi/Dekan dan terpantau aktif di Biro SDM.`,
        message: `Sebanyak ${approvedSdm} berkas SKP telah sah diterbitkan oleh Ka. Prodi/Dekan dan terpantau aktif di Biro SDM.`,
        time: 'Monitoring',
        read: readIds.includes(id),
        type: 'success',
        tag: 'Monitoring SDM',
      })
    }

    if (revisiCount > 0) {
      const id = `notif-sdm-revisi-${revisiCount}`
      notifications.push({
        id,
        title: 'SKP Dalam Status Revisi',
        desc: `Terdapat ${revisiCount} pengajuan SKP yang dibatalkan / memerlukan revisi berkas luaran.`,
        message: `Terdapat ${revisiCount} pengajuan SKP yang dibatalkan / memerlukan revisi berkas luaran.`,
        time: 'Perhatian',
        read: readIds.includes(id),
        type: 'warning',
        tag: 'Revisi',
      })
    }

    const idKuis = `notif-sdm-kuis-${totalPenilaian}`
    notifications.push({
      id: idKuis,
      title: 'Rekapitulasi Kuesioner BerAKHLAK',
      desc: `Telah terdata ${totalPenilaian} berkas evaluasi perilaku 7 Dimensi BerAKHLAK dosen di pangkalan data universitas.`,
      message: `Telah terdata ${totalPenilaian} berkas evaluasi perilaku 7 Dimensi BerAKHLAK dosen di pangkalan data universitas.`,
      time: 'Rekapitulasi',
      read: readIds.includes(idKuis),
      type: 'info',
      tag: 'Kuesioner',
    })

    const idManpower = `notif-sdm-manpower-${totalDosen}`
    notifications.push({
      id: idManpower,
      title: 'Pangkalan Data Manpower Dosen',
      desc: `Basis data mencatat ${totalDosen} dosen terdaftar di 18 program studi Universitas Bhakti Kencana.`,
      message: `Basis data mencatat ${totalDosen} dosen terdaftar di 18 program studi Universitas Bhakti Kencana.`,
      time: 'Sistem SPMI',
      read: readIds.includes(idManpower),
      type: 'info',
      tag: 'Dosen',
    })
  }

  return notifications
}
