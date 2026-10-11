import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// node scripts/verify-wide-layout.mjs <playwright-entry> [url] [before|after]
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.argv[3] || 'http://127.0.0.1:5173/'
const phase = process.argv[4] || 'after'
const directory = `artifacts/wide-layout/${phase}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
try {
  for (const [width, height] of [[1920, 1080], [2560, 1440], [3840, 2160], [1600, 900], [1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 740]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { await document.fonts.ready })
    const sections = ['header', '#inicio', '#gmac', '#clientes', '#servicos', '#processo', '#orcamento', '#contato', 'footer']
    const layout = []
    for (const selector of sections) {
      const section = page.locator(selector)
      if (selector !== 'header') await section.evaluate(element => {
        document.documentElement.style.scrollBehavior = 'auto'
        scrollTo(0, element.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight)
      })
      await page.waitForTimeout(100)
      const measurements = await section.evaluate(element => {
        const container = element.querySelector('.gmac-shell, .max-w-7xl')
        const bounds = container.getBoundingClientRect()
        const style = getComputedStyle(container)
        const left = bounds.left + parseFloat(style.paddingLeft)
        const right = bounds.right - parseFloat(style.paddingRight)
        const clippedControls = [...element.querySelectorAll('a, button, input:not([type="file"]), select, textarea')]
          .filter(control => {
            const rect = control.getBoundingClientRect()
            return rect.width && rect.height && (rect.left < -1 || rect.right > innerWidth + 1)
          }).map(control => control.id || control.textContent.trim().slice(0, 60))
        return { left, right, contentWidth: right - left, occupancy: (right - left) / innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, clippedControls }
      })
      layout.push({ section: selector, ...measurements })
      assert.equal(measurements.overflow, false, `${width}: ${selector} overflow`)
      assert.deepEqual(measurements.clippedControls, [], `${width}: ${selector} clipped controls`)
      if (phase === 'after' && width >= 1600) {
        assert.ok(measurements.occupancy >= 0.9, `${width}: ${selector} must use at least 90% of width`)
        assert.ok(Math.abs(measurements.left - (width - measurements.right)) < 2, `${width}: ${selector} balanced margins`)
      }
      if (width >= 1920 && ['#inicio', '#gmac', '#servicos'].includes(selector)) {
        await page.screenshot({ path: `${directory}/${width}-${selector.slice(1)}.png` })
      }
    }
    const gallery = page.locator('section').filter({ hasText: 'Portfólio industrial em detalhe' })
    await gallery.evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight))
    await page.waitForTimeout(100)
    if (width >= 1920 || width === 390) await page.screenshot({ path: `${directory}/${width}-gallery.png` })
    // A service CTA must remain visible and select its matching quote option.
    const serviceLink = page.locator('#servicos article a').first()
    await serviceLink.click()
    assert.equal(await page.locator('#serviceType').inputValue(), 'Usinagem')
    await page.locator('#orcamento summary').click()
    assert.equal(await page.locator('#cnpj').isVisible(), true)
    const expandedOverflow = await page.locator('#orcamento').evaluate(element => [...element.querySelectorAll('input:not([type="file"]), select, textarea')].some(control => {
      const bounds = control.getBoundingClientRect()
      return bounds.width && (bounds.left < 0 || bounds.right > innerWidth + 1)
    }))
    assert.equal(expandedOverflow, false, `${width}: expanded quote fields fit`)
    if (width >= 1920) await page.screenshot({ path: `${directory}/${width}-quote.png` })
    if (width < 1024) {
      await page.getByRole('button', { name: 'Abrir menu' }).click()
      await page.getByRole('navigation', { name: 'Mobile', exact: true }).getByRole('link', { name: 'Contato', exact: true }).click()
      assert.equal(await page.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded'), 'false')
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Mobile"]').parentElement.getBoundingClientRect().height <= 1)
    }
    assert.deepEqual(errors, [], `${width}: browser errors`)
    results.push({ width, height, rootFontSize: await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), layout })
    console.log(`PASS: ${width}x${height}`)
    await context.close()
  }
  await writeFile(`${directory}/measurements.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results.map(({ width, height, rootFontSize, layout }) => ({ width, height, rootFontSize, occupancy: layout[0].occupancy, margin: layout[0].left, overflow: layout.some(item => item.overflow) })), null, 2))
  console.log(`PASS: ${phase}, nine viewports, section widths, controls, quote CTA and browser errors.`)
} finally {
  await browser.close()
}
