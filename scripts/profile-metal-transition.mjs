import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const tag = process.argv[3] || 'before'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#transformacao').offsetTop) })
  await page.waitForSelector('.metal-stage[data-ready="true"]', { timeout: 60000 })
  await page.locator('.metal-step-nav button').nth(1).click()
  await page.waitForTimeout(800)
  const gpu = await page.locator('.metal-canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2')
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown', width: canvas.width, height: canvas.height }
  })
  await page.evaluate(() => {
    window.__PROFILE__ = { frames: [], running: true, start: performance.now() }
    let previous = performance.now()
    const frame = now => {
      const p = window.__PROFILE__
      p.frames.push({ at: now - p.start, delta: now - previous, phase: document.querySelector('.metal-canvas').dataset.operationPhase })
      previous = now
      if (p.running) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    document.querySelectorAll('.metal-step-nav button')[2].click()
  })
  await page.waitForFunction(() => document.querySelector('.metal-canvas').dataset.operation === 'cut' && document.querySelector('.metal-canvas').dataset.operationPhase === '1.0000')
  const frames = await page.evaluate(() => { window.__PROFILE__.running = false; return window.__PROFILE__.frames })
  const deltas = frames.filter(f => f.at > 50 && f.at < 3550).map(f => f.delta).sort((a, b) => a - b)
  const report = { gpu, frameCount: deltas.length, p50: deltas[Math.floor(deltas.length * 0.5)], p95: deltas[Math.floor(deltas.length * 0.95)], max: Math.max(...deltas), frames, errors }
  mkdirSync('artifacts/metal-performance', { recursive: true })
  writeFileSync(`artifacts/metal-performance/${tag}.json`, JSON.stringify(report, null, 2))
  await page.evaluate(() => window.__METALURGICA_SCROLL__.setStepPhase(9, 1))
  await page.screenshot({ path: `artifacts/metal-performance/${tag}-final.png` })
  console.log(JSON.stringify({ ...report, frames: undefined }))
} finally { await browser.close() }
