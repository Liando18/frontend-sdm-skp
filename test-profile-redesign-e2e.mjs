import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE_URL = 'http://localhost:5173'
const ARTIFACTS_DIR = '/Users/macbook/.gemini/antigravity/brain/08c5eb8e-8e42-4828-9de7-4fbdc033cd8b'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runTestSuite() {
  console.log('🚀 Memulai Pengujian Diferensiasi Halaman Profil vs Halaman Keamanan...\n')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })

  const results = []
  const recordResult = (name, passed, detail = '') => {
    results.push({ name, passed, detail })
    const icon = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${icon}: ${name} ${detail ? `(${detail})` : ''}`)
  }

  try {
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    // 1. Login sebagai Dosen
    console.log('[1/4] Login sebagai Dosen (Agus Miraj)...')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('#input-identifier', { timeout: 8000 })
    await page.type('#input-identifier', 'agus.miraj@bku.ac.id')
    await page.type('#input-password', '0149753654130193')
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 })
    await sleep(1500)

    // 2. Akses & Validasi Halaman Profil (/akun/profil)
    console.log('\n[2/4] Menguji Halaman Profil (/akun/profil)...')
    await page.goto(`${BASE_URL}/akun/profil`, { waitUntil: 'networkidle2' })
    await sleep(1500)

    const profilChecks = await page.evaluate(() => {
      const hasHeroCard = !!document.querySelector('button[title*="Ubah foto profil"], button[title*="Pilih dan ubah foto"]')
      const tabTexts = Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim())
      const hasProfilTab = tabTexts.some((t) => t.includes('Identitas & Kepegawaian'))
      const hasTtdTab = tabTexts.some((t) => t.includes('Tanda Tangan Digital'))
      const hasKeamananTabInStrip = tabTexts.some((t) => t.includes('Keamanan & Kata Sandi'))

      const hasIdentityForm = !!document.querySelector('#input-profile-name')
      const hasPasswordFieldsInProfileForm = !!document.querySelector('#input-profile-password') || !!document.querySelector('#input-profile-confirm-password')
      const hasLinkToKeamanan = tabTexts.some((t) => t.includes('Buka Pusat Keamanan'))

      return {
        hasHeroCard,
        hasProfilTab,
        hasTtdTab,
        hasKeamananTabInStrip,
        hasIdentityForm,
        hasPasswordFieldsInProfileForm,
        hasLinkToKeamanan,
      }
    })

    recordResult('Halaman Profil memiliki Hero Card Pegawai & Foto', profilChecks.hasHeroCard)
    recordResult('Halaman Profil memiliki Tab Identitas & TTD', profilChecks.hasProfilTab && profilChecks.hasTtdTab)
    recordResult('Halaman Profil TIDAK memiliki Tab Keamanan (Bebas Redundansi)', !profilChecks.hasKeamananTabInStrip)
    recordResult('Halaman Profil TIDAK memiliki Input Password Duplikat di Formulir', !profilChecks.hasPasswordFieldsInProfileForm)
    recordResult('Halaman Profil memiliki Tautan Cepat ke Pusat Keamanan', profilChecks.hasLinkToKeamanan)

    // Ambil screenshot Profil Desktop
    const screenshotProfilDesktop = path.join(ARTIFACTS_DIR, 'screenshot-profil-page-distinct.png')
    await page.screenshot({ path: screenshotProfilDesktop, fullPage: true })
    console.log(`📸 Screenshot Profil Desktop tersimpan: ${screenshotProfilDesktop}`)

    // 3. Akses & Validasi Halaman Keamanan (/akun/keamanan)
    console.log('\n[3/4] Menguji Halaman Keamanan (/akun/keamanan)...')
    // Klik tombol "Buka Pusat Keamanan" dari halaman profil
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find((b) => b.innerText.includes('Buka Pusat Keamanan'))
      if (btn) btn.click()
      else window.location.href = '/akun/keamanan'
    })
    await sleep(1500)

    const keamananChecks = await page.evaluate(() => {
      const currentPath = window.location.pathname
      const allText = document.body.innerText

      // Harus ada header spesifik Keamanan
      const hasSecurityHeader = allText.includes('Pusat Keamanan & Kredensial Akun')
      // TIDAK boleh ada hero foto profil pegawai atau tombol ubah foto
      const hasPhotoHero = allText.includes('Ubah Foto Profil') || allText.includes('Reset Avatar')
      // TIDAK boleh ada tab strip "Identitas & Kepegawaian"
      const hasIdentityTab = allText.includes('Identitas & Kepegawaian')

      // Harus ada 3 Health Metric Cards
      const hasMetricKredensial = allText.includes('Status Kredensial')
      const hasMetricIdentitas = allText.includes('Identitas Autentikasi')
      const hasMetricSesi = allText.includes('Sesi Perangkat Saat Ini')

      // Form Ganti Kata Sandi
      const hasCurPassInput = !!document.querySelector('#sec-cur-pass')
      const hasNewPassInput = !!document.querySelector('#sec-new-pass')
      const hasConfPassInput = !!document.querySelector('#sec-conf-pass')
      const hasDummyButton = allText.includes('Isi Dummy Password')

      // Sesi & Kebijakan
      const hasPolicy = allText.includes('Kebijakan Keamanan Akun BKU')
      const hasLogoutBtn = allText.includes('Keluar dari Sesi Ini (Logout)')

      return {
        currentPath,
        hasSecurityHeader,
        hasPhotoHero,
        hasIdentityTab,
        hasMetricKredensial,
        hasMetricIdentitas,
        hasMetricSesi,
        hasCurPassInput,
        hasNewPassInput,
        hasConfPassInput,
        hasDummyButton,
        hasPolicy,
        hasLogoutBtn,
      }
    })

    recordResult('Navigasi Berhasil ke URL /akun/keamanan', keamananChecks.currentPath === '/akun/keamanan')
    recordResult('Header Spesifik Pusat Keamanan & Kredensial Akun', keamananChecks.hasSecurityHeader)
    recordResult('Halaman Keamanan BEBAS dari Hero Foto Profil Pegawai', !keamananChecks.hasPhotoHero)
    recordResult('Halaman Keamanan BEBAS dari Tab Strip Identitas Pegawai', !keamananChecks.hasIdentityTab)
    recordResult(
      '3 Stat Card Kesehatan Keamanan (Kredensial, Identitas, Sesi)',
      keamananChecks.hasMetricKredensial && keamananChecks.hasMetricIdentitas && keamananChecks.hasMetricSesi
    )
    recordResult(
      'Formulir Ganti Sandi Lengkap dengan Tombol Dummy',
      keamananChecks.hasCurPassInput && keamananChecks.hasNewPassInput && keamananChecks.hasConfPassInput && keamananChecks.hasDummyButton
    )
    recordResult('Kartu Kebijakan Keamanan Akun & Logout Darurat Tersedia', keamananChecks.hasPolicy && keamananChecks.hasLogoutBtn)

    // Uji Tombol Isi Dummy Password di Halaman Keamanan
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const dummyBtn = btns.find((b) => b.innerText.includes('Isi Dummy Password'))
      if (dummyBtn) dummyBtn.click()
    })
    await sleep(500)

    const dummyFilledVal = await page.evaluate(() => {
      const cur = document.querySelector('#sec-cur-pass')?.value
      const newP = document.querySelector('#sec-new-pass')?.value
      return { cur, newP }
    })
    recordResult('Tombol Isi Dummy Password Berfungsi Mengisi Form', !!dummyFilledVal.cur && !!dummyFilledVal.newP)

    // Ambil screenshot Keamanan Desktop
    const screenshotKeamananDesktop = path.join(ARTIFACTS_DIR, 'screenshot-keamanan-page-distinct.png')
    await page.screenshot({ path: screenshotKeamananDesktop, fullPage: true })
    console.log(`📸 Screenshot Keamanan Desktop tersimpan: ${screenshotKeamananDesktop}`)

    // 4. Uji Responsivitas Mobile (375x812)
    console.log('\n[4/4] Menguji Tampilan Responsif Mobile (375x812)...')
    await page.setViewport({ width: 375, height: 812 })
    await sleep(500)

    const screenshotKeamananMobile = path.join(ARTIFACTS_DIR, 'screenshot-keamanan-mobile-distinct.png')
    await page.screenshot({ path: screenshotKeamananMobile, fullPage: true })
    console.log(`📸 Screenshot Keamanan Mobile tersimpan: ${screenshotKeamananMobile}`)

    await page.goto(`${BASE_URL}/akun/profil`, { waitUntil: 'networkidle2' })
    await sleep(1000)

    const screenshotProfilMobile = path.join(ARTIFACTS_DIR, 'screenshot-profil-mobile-distinct.png')
    await page.screenshot({ path: screenshotProfilMobile, fullPage: true })
    console.log(`📸 Screenshot Profil Mobile tersimpan: ${screenshotProfilMobile}`)

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    recordResult('Responsif Mobile Tanpa Overflow Horizontal', !hasHorizontalOverflow)

    console.log('\n======================================================')
    console.log('HASIL PENGUJIAN AKHIR DIFERENSIASI PROFIL VS KEAMANAN:')
    console.log('======================================================')
    const passedCount = results.filter((r) => r.passed).length
    console.log(`Total: ${results.length} | Lolos: ${passedCount} | Gagal: ${results.length - passedCount}`)

    if (passedCount === results.length) {
      console.log('🎉 SELURUH PENGUJIAN VERIFIKASI BERHASIL DENGAN SEMPURNA!')
    } else {
      process.exitCode = 1
    }
  } catch (err) {
    console.error('💥 Terjadi kesalahan saat pengujian:', err)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

runTestSuite()
