import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

// node scripts/verify-reload-top.mjs <playwright-entry> [url] [browsers]
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.argv[3] || 'http://127.0.0.1:4175/'
const browsers = (process.argv[4] || 'chrome,brave').split(',')

for (const name of browsers) {
  const browser = await chromium.launch(name === 'brave'
    ? { executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true }
    : { channel: name, headless: true })
  try {
    for (const [width, height] of [[1920, 1080], [3840, 2160], [390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const state = () => page.evaluate(() => ({ y: scrollY, hash: location.hash, search: location.search }))
      const checkTop = async (scenario) => {
        // Allow delayed native restoration, fonts and client rendering to settle.
        await page.waitForTimeout(600)
        const position = await state()
        assert.ok(position.y <= 2, `${name} ${width} ${scenario}: ${JSON.stringify(position)}`)
        assert.equal(position.hash, '', `${scenario}: reload clears the fragment`)
      }

      // Fresh deep links and links clicked inside the site retain their targets.
      await page.goto(`${base}#orcamento`, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => scrollY > 1000)
      assert.ok((await state()).y > 1000, 'Fresh quote deep link still works')
      await page.reload({ waitUntil: 'networkidle' })
      await checkTop('reload with fragment')

      await page.locator('#servicos article a').first().click()
      await page.waitForFunction(() => scrollY > 1000 && location.hash === '#orcamento')
      assert.equal((await state()).hash, '#orcamento')
      assert.ok((await state()).y > 1000, 'Service CTA still scrolls to the quote')
      assert.equal(await page.locator('#serviceType').inputValue(), 'Usinagem')
      await page.reload({ waitUntil: 'networkidle' })
      await checkTop('reload after clicking a link')

      await page.evaluate(() => {
        history.replaceState(history.state, '', location.pathname + location.search)
        scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      })
      assert.ok((await state()).y > 1000)
      await page.reload({ waitUntil: 'networkidle' })
      await checkTop('reload without fragment')

      await page.evaluate(() => {
        history.replaceState(history.state, '', `${location.pathname}?reload-test=1#contato`)
        scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      })
      await page.reload({ waitUntil: 'networkidle' })
      await checkTop('reload with query and fragment')
      assert.equal((await state()).search, '?reload-test=1', 'Query parameters are preserved')
      await page.reload({ waitUntil: 'networkidle' })
      await checkTop('repeat reload')
      assert.deepEqual(errors, [], 'No browser errors')
      console.log(`PASS: ${name} ${width}x${height}: deep link, anchor, plain reload, hash reload, query and repeat reload`)
      await page.close()
    }
  } finally { await browser.close() }
}
