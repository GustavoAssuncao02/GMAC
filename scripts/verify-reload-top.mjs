import { pathToFileURL } from 'node:url'

const playwrightPath =
  'C:\\Users\\gustavo.silva\\AppData\\Local\\npm-cache\\_npx\\420ff84f11983ee5\\node_modules\\playwright\\index.mjs'

const { chromium } = await import(pathToFileURL(playwrightPath).href)

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } })
const base = 'http://127.0.0.1:5173/'

try {
  await page.goto(`${base}#orcamento`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  const direct = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    hash: window.location.hash,
    href: window.location.href,
  }))

  if (direct.y > 2 || direct.hash) {
    throw new Error(`direct hash load failed: ${JSON.stringify(direct)}`)
  }

  await page.locator('a[href="#orcamento"]').first().click()
  await page.waitForTimeout(700)

  const clicked = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    hash: window.location.hash,
  }))

  if (clicked.y < 1000 || clicked.hash !== '#orcamento') {
    throw new Error(`anchor click failed: ${JSON.stringify(clicked)}`)
  }

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  const reloaded = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    hash: window.location.hash,
    href: window.location.href,
  }))

  if (reloaded.y > 2 || reloaded.hash) {
    throw new Error(`reload hash failed: ${JSON.stringify(reloaded)}`)
  }

  console.log(JSON.stringify({ direct, clicked, reloaded }, null, 2))
} finally {
  await browser.close()
}
