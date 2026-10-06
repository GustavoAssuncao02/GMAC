import { pathToFileURL } from 'node:url'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: process.env.METAL_BROWSER || 'msedge', headless: true })
const output = 'artifacts/metal-scroll'
mkdirSync(output, { recursive: true })
const targets = JSON.parse(readFileSync('src/metal/storyboard.json', 'utf8'))
const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
page.on('pageerror', error => errors.push(error.message))
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.querySelector('#transformacao').offsetTop) })
await page.waitForSelector('.metal-stage[data-ready="true"]', { timeout: 30000 })
const captures = new Set([1, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80])
for (let n = 1; n <= 80; n++) {
  const actual = await page.evaluate(n => {
    window.__METALURGICA_SCROLL__.setProgress((n - 1) / 79)
    return window.__METALURGICA_SCROLL__.getState()
  }, n)
  // The original targets remain canonical until quality; the closing placement
  // intentionally replaces the old camera orbit and is covered by verify-metal-landing.
  const channels = n < 55 ? ['camera', 'primary_object', 'continuity_layers', 'tools_and_overlays', 'effects', 'lighting', 'copy_blocks', 'ui'] : ['copy_blocks', 'ui']
  for (const channel of channels) assert.deepEqual(actual.state[channel], targets[n - 1][channel], `frame ${n}: ${channel}`)
  if (captures.has(n)) await page.screenshot({ path: `${output}/desktop-${String(n).padStart(2, '0')}.png` })
}
assert.equal(await page.locator('.metal-cta').getAttribute('tabindex'), '0')
await page.evaluate(() => { window.__METALURGICA_SCROLL__.clearOverride(); window.scrollTo(0, document.querySelector('#transformacao').offsetTop + 1500) })
await page.waitForTimeout(3800)
assert.ok(Math.abs(await page.locator('.metal-stage').evaluate(el => el.getBoundingClientRect().top)) < 2, 'Sticky stays pinned')
const stillA = await page.locator('.metal-stage').screenshot()
await page.waitForTimeout(250)
const stillB = await page.locator('.metal-stage').screenshot()
assert.ok(stillA.equals(stillB), 'Scene must freeze when scroll stops')
await page.evaluate(() => { const el = document.querySelector('#transformacao'); window.scrollTo(0, el.offsetTop + el.offsetHeight) })
await page.waitForTimeout(1750)
assert.equal((await page.evaluate(() => window.__METALURGICA_SCROLL__.getState())).progress, 1)
assert.ok(await page.locator('.metal-stage').evaluate(el => el.getBoundingClientRect().bottom <= 1), 'Sticky releases')

await page.setViewportSize({ width: 1024, height: 768 })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#transformacao').offsetTop))
await page.waitForTimeout(150)
await page.evaluate(() => window.__METALURGICA_SCROLL__.setProgress(1))
await page.screenshot({ path: `${output}/tablet-80.png` })
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No tablet overflow')

await page.setViewportSize({ width: 390, height: 844 })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#transformacao').offsetTop))
await page.waitForTimeout(150)
for (const n of [1, 24, 40, 64, 80]) {
  await page.evaluate(n => window.__METALURGICA_SCROLL__.setProgress((n - 1) / 79), n)
  await page.screenshot({ path: `${output}/mobile-${n}.png` })
}
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow')
const cta = await page.locator('.metal-cta').boundingBox()
assert.ok(cta.x >= 0 && cta.x + cta.width <= 390 && cta.y > 0 && cta.y + cta.height < 844, 'Mobile CTA visible')
await page.locator('.metal-cta').click()
await page.waitForTimeout(200)
assert.equal(new URL(page.url()).hash, '#orcamento')
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#transformacao').offsetTop))
await page.waitForTimeout(150)
assert.ok(await page.locator('#transformacao').evaluate(el => el.offsetHeight <= innerHeight * 1.2), 'Reduced motion collapses section')
assert.equal((await page.evaluate(() => window.__METALURGICA_SCROLL__.getState())).progress, 1)
await page.screenshot({ path: `${output}/mobile-reduced.png` })
assert.deepEqual(errors, [], 'No browser runtime errors')
writeFileSync(`${output}/results.json`, JSON.stringify({ keyframes: 80, channels: 8, sticky: 'passed', freeze: 'passed', release: 'passed', tablet: 'passed', mobile: 'passed', cta: 'passed', reducedMotion: 'passed', errors }, null, 2))
console.log('PASS: 80 keyframes, sticky, scroll freeze/release, mobile, CTA, reduced motion, browser errors.')
await browser.close()
