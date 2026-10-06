import { pathToFileURL } from 'node:url'
import { mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#transformacao').offsetTop) })
  await page.waitForSelector('.metal-stage[data-ready="true"]')
  mkdirSync('artifacts/finish-quality', { recursive: true })
  const canvas = page.locator('.metal-canvas')
  const preview = (step, phase) => page.evaluate(([step, phase]) => window.__METALURGICA_SCROLL__.setStepPhase(step, phase), [step, phase])
  const positions = []
  for (const phase of [0.25, 0.62, 0.9]) {
    await preview(6, phase)
    assert.equal(await canvas.getAttribute('data-polishing'), 'true')
    positions.push((await canvas.getAttribute('data-polish-position')).split(',').map(Number))
    await page.screenshot({ path: `artifacts/finish-quality/polish-${phase}.png` })
  }
  assert.ok(positions[0][2] > 0.8, 'disc contacts the raised ring')
  assert.ok(positions[1][0] < -1.8 && positions[1][2] < 0.31, 'disc contacts left flange')
  assert.ok(positions[2][0] > 1.8 && positions[2][2] < 0.31, 'disc contacts right flange')
  await preview(6, 1)
  assert.equal(await canvas.getAttribute('data-polishing'), 'false')
  await page.screenshot({ path: 'artifacts/finish-quality/finished-steel.png' })
  for (const [phase, checked] of [[0, 0], [0.23, 1], [0.37, 2], [0.51, 3], [0.65, 4], [0.79, 5], [1, 6]]) {
    await preview(8, phase)
    assert.equal(await page.locator('.metal-quality-list li[data-status="verified"]').count(), checked)
    assert.equal(Number(await canvas.getAttribute('data-quality-checked')), checked, 'diagnostic count matches checklist')
  }
  await page.screenshot({ path: 'artifacts/finish-quality/quality-desktop.png' })
  const still = await page.locator('.metal-stage').screenshot()
  await page.waitForTimeout(300)
  assert.ok(still.equals(await page.locator('.metal-stage').screenshot()), 'inspection stops at six verified details')
  await page.locator('.metal-step-nav button').nth(8).click()
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.metal-quality-list li[data-status="verified"]').count(), 0, 'same-stage click restarts inspection')
  await page.waitForFunction(() => document.querySelector('.metal-canvas').dataset.qualityChecked === '6')
  await page.locator('.metal-step-nav button').nth(9).click()
  await page.waitForTimeout(100)
  assert.equal(await canvas.getAttribute('data-quality-checked'), '0', 'inspection count resets outside inspection')
  assert.equal(await page.locator('.metal-copy--quality').getAttribute('aria-hidden'), 'true')
  for (const [width, height] of [[1024, 768], [1280, 600], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => scrollTo(0, document.querySelector('#transformacao').offsetTop))
    await preview(8, 1)
    await page.screenshot({ path: `artifacts/finish-quality/quality-${width}.png` })
    const checklist = await page.locator('.metal-quality').boundingBox()
    const navigation = await page.locator('.metal-step-nav').boundingBox()
    assert.ok(checklist.x >= 0 && checklist.x + checklist.width <= width)
    assert.ok(checklist.y + checklist.height < navigation.y, 'checklist remains above navigation')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(200)
  assert.equal(await canvas.getAttribute('data-polishing'), 'false')
  assert.equal(await canvas.getAttribute('data-quality-checked'), '0')
  assert.deepEqual(errors, [])
  console.log('PASS: rotating polisher on ring and both flanges, progressive checklist, replay, exit, resting frame, desktop/mobile, reduced motion, no browser errors.')
} finally { await browser.close() }
