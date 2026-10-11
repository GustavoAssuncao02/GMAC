import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// node scripts/verify-section-animations.mjs <playwright-entry> [url] [browser]
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.argv[3] || 'http://127.0.0.1:4175/'
const name = process.argv[4] || 'chrome'
const output = `artifacts/section-animations/${name}-${base.startsWith('https') ? 'public' : 'local'}`
await mkdir(output, { recursive: true })
const browser = await chromium.launch(name === 'brave'
  ? { executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true }
  : { channel: name, headless: true })
const reports = []
try {
  for (const [width, height] of [[1920, 1080], [3840, 2160], [390, 844]]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      assert.equal((await page.goto(base, { waitUntil: 'networkidle' })).status(), 200)
      const host = page.locator('#clientes [aria-label^="Carrossel"]')
      const ring = host.locator(':scope > div > div > div')
      await host.evaluate(element => {
        document.documentElement.style.scrollBehavior = 'auto'
        scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight / 3, behavior: 'instant' })
      })
      await page.waitForTimeout(900)
      const assertRotating = async (scenario) => {
        const before = await ring.evaluate(element => element.style.transform)
        await page.waitForTimeout(300)
        const after = await ring.evaluate(element => element.style.transform)
        assert.notEqual(after, before, `${name} ${width} ${reducedMotion}: ${scenario}`)
      }
      await assertRotating('client carousel autoplay')
      const brokenLogos = await host.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src))
      assert.deepEqual(brokenLogos, [], 'All client logos load')

      // A change of system preference while the tab is open must not stop it.
      await page.emulateMedia({ reducedMotion: reducedMotion === 'reduce' ? 'no-preference' : 'reduce' })
      await assertRotating('autoplay survives a preference change')
      await page.emulateMedia({ reducedMotion })

      const box = await host.boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 })
      await page.mouse.up()
      await assertRotating('autoplay resumes after dragging')

      const step = page.locator('#processo li:visible').first()
      const before = await step.evaluate(element => ({ opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform }))
      assert.equal(before.opacity, '0', 'Process starts before its entrance, rather than at the final state')
      await step.evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: 'instant' }))
      await page.waitForFunction(() => [...document.querySelectorAll('#processo li')].some(element => {
        const opacity = Number(getComputedStyle(element).opacity)
        return element.getBoundingClientRect().width > 0 && opacity > 0 && opacity < 1
      }))
      await page.waitForFunction(() => {
        const element = [...document.querySelectorAll('#processo li')].find(element => element.getBoundingClientRect().width > 0)
        return getComputedStyle(element).opacity === '1' && getComputedStyle(element).transform === 'none'
      })
      const after = await step.evaluate(element => ({ opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform }))
      assert.notDeepEqual(after, before, 'Process visibly animates to its final state')
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow')
      assert.deepEqual(errors, [], 'No browser errors')
      await page.screenshot({ path: `${output}/${width}-${reducedMotion}.png` })
      reports.push({ width, height, reducedMotion, carousel: 'rotates', process: { before, after }, errors })
      console.log(`PASS: ${name} ${width}x${height} ${reducedMotion}: autoplay, drag, preference change, process entrance, loaded logos`)
      await context.close()
    }
  }
  await writeFile(`${output}/results.json`, JSON.stringify(reports, null, 2))
} finally { await browser.close() }
