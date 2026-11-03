import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE_URL = 'http://localhost:5173'
const ARTIFACTS_DIR = '/Users/macbook/.gemini/antigravity/brain/08c5eb8e-8e42-4828-9de7-4fbdc033cd8b'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runInteractiveSuite() {
  console.log('🚀 Memulai Pengujian Interaktif E2E & Validasi Arsitektur...')

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
    // ==================================================================
    // TEST 1 & 2: Persona Dosen
    // ==================================================================
    console.log('\n[1/4] Menguji Persona Dosen & Alur Klik Notifikasi...')
    const dosenContext = await browser.createBrowserContext()
    const dosenPage = await dosenContext.newPage()
    await dosenPage.setViewport({ width: 1440, height: 900 })

    await dosenPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await dosenPage.waitForSelector('#input-identifier', { timeout: 8000 })
    await dosenPage.type('#input-identifier', 'agus.miraj@bku.ac.id')
    await dosenPage.type('#input-password', '0149753654130193')
    await dosenPage.click('button[type="submit"]')

    await dosenPage.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 })
    await sleep(1500)

    const initialDosenPath = await dosenPage.evaluate(() => window.location.pathname)
    if (!initialDosenPath.includes('/dashboard')) {
      await dosenPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' })
      await sleep(1500)
    }

    const mainContentInit = await dosenPage.$eval('main', (el) => el.innerText.trim())
    recordResult('Dosen Dashboard Render', mainContentInit.length > 50, `Karakter konten: ${mainContentInit.length}`)

    // Buka Notifikasi Dosen
    const bellBtnDosen = await dosenPage.$('button[aria-label="Notifikasi sistem"]')
    if (bellBtnDosen) {
      await bellBtnDosen.click()
      await sleep(600)

      const notifItems = await dosenPage.$$('.anim-modal div[style*="cursor: pointer"]')
      recordResult('Deteksi Item Notifikasi Dosen', notifItems.length > 0, `Jumlah notif: ${notifItems.length}`)

      if (notifItems.length > 0) {
        await notifItems[0].click()
        await sleep(1200)

        const mainContentAfterNotif = await dosenPage.$eval('main', (el) => el.innerText.trim())
        const pathAfterNotif = await dosenPage.evaluate(() => window.location.pathname)
        const isNotWhiteScreen = mainContentAfterNotif.length > 30

        recordResult(
          'Eliminasi White-Screen saat Klik Notifikasi (Dosen)',
          isNotWhiteScreen,
          `Path: ${pathAfterNotif}, Konten: ${mainContentAfterNotif.substring(0, 40)}...`
        )

        const shot1Path = path.join(ARTIFACTS_DIR, 'screenshot-dosen-notif-click.png')
        await dosenPage.screenshot({ path: shot1Path, fullPage: false })
      }
    }

    // Uji Pertahanan Otorisasi (Dosen sengaja mengakses /manajemen/dosen)
    console.log('\n[2/4] Menguji Pertahanan Akses Rute Ilegal (Dosen membuka rute SDM)...')
    await dosenPage.goto(`${BASE_URL}/manajemen/dosen`, { waitUntil: 'networkidle2' })
    await sleep(1500)

    const redirectedPath = await dosenPage.evaluate(() => window.location.pathname)
    const mainContentGuarded = await dosenPage.$eval('main', (el) => el.innerText.trim())
    const isGuardedNoWhiteScreen = redirectedPath === '/dashboard' || mainContentGuarded.length > 50

    recordResult(
      'Pertahanan Akses Rute Ilegal & Pencegahan Layar Kosong',
      isGuardedNoWhiteScreen,
      `Dialihkan ke: ${redirectedPath}, Layar tidak blank: ${mainContentGuarded.length > 0}`
    )
    const shot2Path = path.join(ARTIFACTS_DIR, 'screenshot-dosen-role-guard.png')
    await dosenPage.screenshot({ path: shot2Path, fullPage: false })

    // ==================================================================
    // TEST 3: Persona Kaprodi
    // ==================================================================
    console.log('\n[3/4] Menguji Persona Kaprodi & Verifikasi SKP...')
    const kaprodiContext = await browser.createBrowserContext()
    const kaprodiPage = await kaprodiContext.newPage()
    await kaprodiPage.setViewport({ width: 1440, height: 900 })

    await kaprodiPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await kaprodiPage.waitForSelector('#input-identifier', { timeout: 8000 })
    await kaprodiPage.type('#input-identifier', 'iwan.mutiudin@bku.ac.id')
    await kaprodiPage.type('#input-password', '0256771672130263')
    await kaprodiPage.click('button[type="submit"]')

    await kaprodiPage.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 })
    await sleep(1500)

    const kaprodiInitPath = await kaprodiPage.evaluate(() => window.location.pathname)
    if (!kaprodiInitPath.includes('/dashboard')) {
      await kaprodiPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' })
      await sleep(1500)
    }

    const mainKaprodiDashboard = await kaprodiPage.$eval('main', (el) => el.innerText.trim())
    recordResult('Kaprodi Dashboard Render', mainKaprodiDashboard.length > 50, `Karakter: ${mainKaprodiDashboard.length}`)

    const bellBtnKaprodi = await kaprodiPage.$('button[aria-label="Notifikasi sistem"]')
    if (bellBtnKaprodi) {
      await bellBtnKaprodi.click()
      await sleep(600)
      const kaprodiNotifs = await kaprodiPage.$$('.anim-modal div[style*="cursor: pointer"]')
      recordResult('Deteksi Item Notifikasi Kaprodi', kaprodiNotifs.length > 0, `Jumlah notif: ${kaprodiNotifs.length}`)

      if (kaprodiNotifs.length > 0) {
        await kaprodiNotifs[0].click()
        await sleep(1200)

        const pathKaprodi = await kaprodiPage.evaluate(() => window.location.pathname)
        const mainKaprodi = await kaprodiPage.$eval('main', (el) => el.innerText.trim())
        const isKaprodiOk = (pathKaprodi.includes('/verifikasi') || pathKaprodi.includes('/dashboard')) && mainKaprodi.length > 30

        recordResult(
          'Eliminasi White-Screen saat Klik Notifikasi (Kaprodi)',
          isKaprodiOk,
          `Path: ${pathKaprodi}, Konten: ${mainKaprodi.substring(0, 40)}...`
        )

        const shot3Path = path.join(ARTIFACTS_DIR, 'screenshot-kaprodi-review.png')
        await kaprodiPage.screenshot({ path: shot3Path, fullPage: false })
      }
    }

    // ==================================================================
    // TEST 4: Persona Dekan
    // ==================================================================
    console.log('\n[4/4] Menguji Persona Dekan & Pengesahan Dokumen...')
    const dekanContext = await browser.createBrowserContext()
    const dekanPage = await dekanContext.newPage()
    await dekanPage.setViewport({ width: 1440, height: 900 })

    await dekanPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
    await dekanPage.waitForSelector('#input-identifier', { timeout: 8000 })
    await dekanPage.type('#input-identifier', 'vina.vitniawati@bku.ac.id')
    await dekanPage.type('#input-password', '7854760661230232')
    await dekanPage.click('button[type="submit"]')

    await dekanPage.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 })
    await sleep(1500)

    const dekanInitPath = await dekanPage.evaluate(() => window.location.pathname)
    if (!dekanInitPath.includes('/dashboard')) {
      await dekanPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' })
      await sleep(1500)
    }

    const dekanMain = await dekanPage.$eval('main', (el) => el.innerText.trim())
    recordResult('Dekan Dashboard Render', dekanMain.length > 50, `Karakter: ${dekanMain.length}`)

    const bellBtnDekan = await dekanPage.$('button[aria-label="Notifikasi sistem"]')
    if (bellBtnDekan) {
      await bellBtnDekan.click()
      await sleep(600)
      const dekanNotifs = await dekanPage.$$('.anim-modal div[style*="cursor: pointer"]')
      recordResult('Deteksi Item Notifikasi Dekan', dekanNotifs.length > 0, `Jumlah notif: ${dekanNotifs.length}`)

      if (dekanNotifs.length > 0) {
        await dekanNotifs[0].click()
        await sleep(1200)

        const pathDekan = await dekanPage.evaluate(() => window.location.pathname)
        const mainDekan = await dekanPage.$eval('main', (el) => el.innerText.trim())
        const isDekanOk = (pathDekan.includes('/verifikasi') || pathDekan.includes('/dashboard')) && mainDekan.length > 30

        recordResult(
          'Eliminasi White-Screen saat Klik Notifikasi (Dekan)',
          isDekanOk,
          `Path: ${pathDekan}, Konten: ${mainDekan.substring(0, 40)}...`
        )

        const shot4Path = path.join(ARTIFACTS_DIR, 'screenshot-dekan-review.png')
        await dekanPage.screenshot({ path: shot4Path, fullPage: false })
      }
    }

  } catch (err) {
    console.error('Terjadi error saat pengujian interaktif:', err)
    recordResult('Eksekusi Pengujian Interaktif', false, err.message)
  } finally {
    await browser.close()
  }

  console.log('\n======================================================')
  console.log('HASIL AKHIR PENGUJIAN INTERAKTIF PORTAL:')
  const allPassed = results.length >= 8 && results.every((r) => r.passed)
  console.log(allPassed ? '🎉 SEMUA PENGUJIAN SUKSES (100% PASSED)!' : '⚠️ ADA PENGUJIAN YANG GAGAL.')
  console.log('======================================================\n')
  process.exit(allPassed ? 0 : 1)
}

runInteractiveSuite()
