import { pathToFileURL } from 'node:url'
import { mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#transformacao').offsetTop) })
  await page.waitForSelector('.metal-stage[data-ready="true"]')
  const buttons = page.locator('.metal-step-nav button')
  await buttons.nth(8).click()
  await page.waitForTimeout(800)
  mkdirSync('artifacts/metal-landing', { recursive: true })
  const poses = []
  for (const [name, t] of [['above', 0], ['middle', 0.5], ['contact', 1]]) {
    const state = await page.evaluate(t => {
      window.__METALURGICA_SCROLL__.setProgress(54 / 79 + (1 - 54 / 79) * t)
      return window.__METALURGICA_SCROLL__.getState().state
    }, t)
    poses.push(state)
    await page.screenshot({ path: `artifacts/metal-landing/${name}.png` })
    const gap = Number(await page.locator('.metal-canvas').getAttribute('data-contact-gap'))
    if (t === 1) assert.ok(gap < 0.02 && gap >= 0, 'Feet meet surface')
    else assert.ok(gap > 0.05, 'Visible gap above surface')
    assert.equal(await page.locator('.metal-canvas').getAttribute('data-bloom'), '0.000')
  }
  for (let i = 1; i < poses.length; i++) {
    assert.ok(poses[i].camera.zoom > poses[i - 1].camera.zoom, 'Camera approaches the product')
    for (const field of ['z_px', 'scale', 'rotateY_deg']) assert.ok(poses[i].primary_object[field] > poses[i - 1].primary_object[field], field)
    assert.equal(poses[i].continuity_layers.machined_part.opacity, 0, 'No duplicate geometry in the close-up')
    assert.deepEqual(poses[i].lighting, poses[0].lighting)
  }
  await page.evaluate(() => window.__METALURGICA_SCROLL__.clearOverride())
  await page.waitForTimeout(1150)
  await buttons.nth(9).click()
  await page.waitForTimeout(1750)
  assert.equal(await page.locator('.metal-canvas').getAttribute('data-landing'), '1.0000')
  await page.screenshot({ path: 'artifacts/metal-landing/final-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(150)
  await buttons.nth(9).click()
  await page.waitForTimeout(1750)
  await page.screenshot({ path: 'artifacts/metal-landing/final-mobile.png' })
  assert.ok(Number(await page.locator('.metal-canvas').getAttribute('data-contact-gap')) < 0.02)
  assert.deepEqual(errors, [])
  console.log('PASS: gradual zoom, three-quarter rotation, no duplicate geometry, resting contact, no sparks, desktop/mobile.')
} finally { await browser.close() }
