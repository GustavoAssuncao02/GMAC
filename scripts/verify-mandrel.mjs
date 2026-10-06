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
  mkdirSync('artifacts/mandrel', { recursive: true })
  const at = async (step, phase, capture = false) => {
    await page.evaluate(([step, phase]) => window.__METALURGICA_SCROLL__.setStepPhase(step, phase), [step, phase])
    if (capture) await page.screenshot({ path: `artifacts/mandrel/check-${step}-${phase}.png` })
    return page.locator('.metal-canvas').evaluate(el => Object.fromEntries(Object.entries(el.dataset).filter(([key]) => key !== 'renderCount' && key !== 'drawCalls').map(([k, v]) => [k, Number.isNaN(Number(v)) ? v : Number(v)])))
  }
  const cut = await at(2, 1, true)
  assert.ok(cut.partGap > 0.3 && cut.bendAngle > 5, 'cut leaves separate parts with imperfect bends')
  assert.equal(cut.holeCount, 0)
  assert.equal(cut.boltCount, 0)
  const bend = await at(3, 1, true)
  assert.equal(bend.bendAngle, 0, 'press aligns the side flanges')
  assert.equal(bend.partGap, cut.partGap, 'parts stay separate until welding')
  const welding = await at(4, 0.7, true)
  assert.equal(welding.partGap, 0)
  assert.ok(welding.weldProgress > 0 && welding.weldProgress < 1 && welding.bloom > 0)
  const welded = await at(4, 1, true)
  assert.equal(welded.weldProgress, 1)
  assert.equal(welded.holeCount, 0, 'fixing holes do not exist before machining')
  for (const [phase, count] of [[0.1, 0], [0.25, 1], [0.46, 2], [0.67, 3], [1, 4]]) {
    const drilled = await at(5, phase, phase === 1 || phase === 0.46)
    assert.equal(drilled.holeCount, count, 'each drilling cycle opens the next hole')
    assert.equal(drilled.boltCount, 0)
  }
  const rough = await at(6, 0, true)
  const polished = await at(6, 1, true)
  assert.equal(rough.finish, 0)
  assert.equal(polished.finish, 1)
  const mounting = await at(7, 0.4, true)
  assert.equal(mounting.holeCount, 4)
  assert.ok(mounting.boltGap > 0)
  const assembled = await at(7, 1, true)
  assert.equal(assembled.boltGap, 0)
  assert.equal(assembled.boltCount, 4)
  // Reverse/direct navigation must reconstruct the correct geometry, without stale holes or screws.
  assert.deepEqual(await at(2, 1), cut)
  await at(9, 1, true)
  const still = await page.locator('.metal-stage').screenshot()
  await page.waitForTimeout(250)
  assert.ok(still.equals(await page.locator('.metal-stage').screenshot()), 'completed scene holds still')
  for (const [width, height] of [[1024, 768], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => scrollTo(0, document.querySelector('#transformacao').offsetTop))
    for (const step of [2, 3, 5, 7, 9]) {
      await at(step, 1)
      await page.screenshot({ path: `artifacts/mandrel/responsive-${width}-${step}.png` })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(200)
  assert.equal(await page.locator('.metal-canvas').getAttribute('data-bolt-count'), '4')
  assert.equal(await page.locator('.metal-canvas').getAttribute('data-bloom'), '0.000')
  assert.deepEqual(errors, [])
  console.log('PASS: separated cut parts, corrected bends, progressive welds, four sequential holes, finish, four seated screws, reverse navigation, frozen scene, responsive layouts and reduced motion.')
} finally { await browser.close() }
