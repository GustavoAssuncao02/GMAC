import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Pass an installed Playwright entry point and the production preview URL.
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.argv[3] || 'http://127.0.0.1:4175/'
const canonical = 'https://gmacmetalurgica.com.br/'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('artifacts/seo', { recursive: true })
try {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const errors = []
    const failedAssets = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) failedAssets.push(`${response.status()} ${response.url()}`)
    })
    assert.equal((await page.goto(base, { waitUntil: 'networkidle' })).status(), 200)
    assert.match(await page.title(), /GMAC Metalúrgica.*Caldeiraria.*Usinagem.*Feira de Santana/)
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1)
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical)
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical)
    assert.equal(await page.locator('h1').count(), 1)
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())
    assert.equal(schema.url, canonical)
    assert.equal(schema.address.addressLocality, 'Feira de Santana')
    assert.equal(schema.hasOfferCatalog.itemListElement.length, 5)
    for (const selector of ['#inicio', '#gmac', '#servicos', '#contato']) {
      const section = page.locator(selector)
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(javaScriptEnabled ? 1000 : 50)
      assert.equal(await section.isVisible(), true, selector)
      assert.equal(await section.evaluate(el => getComputedStyle(el).opacity), '1', `${selector} opacity`)
    }
    assert.equal(await page.locator('#servicos h3').count(), 5)
    assert.match(await page.locator('#servicos').innerText(), /caldeiraria/i)
    assert.match(await page.locator('#contato').innerText(), /3616-6626/)
    const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links
      .map(link => link.getAttribute('href'))
      .filter(href => href.length > 1 && !document.getElementById(href.slice(1))))
    assert.deepEqual(brokenAnchors, [])
    await page.locator('#inicio').scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `artifacts/seo/desktop-${javaScriptEnabled ? 'js' : 'static'}.png` })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile overflow')
    if (javaScriptEnabled) {
      await page.getByRole('button', { name: /abrir menu/i }).click()
      await page.locator('header').getByRole('link', { name: 'Serviços', exact: true }).filter({ visible: true }).click()
      await page.waitForTimeout(1000)
      assert.equal(new URL(page.url()).hash, '#servicos')
      assert.equal(await page.locator('#orcamento form').count() + await page.locator('form#orcamento').count() > 0, true)
    }
    await page.locator('#servicos').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `artifacts/seo/mobile-${javaScriptEnabled ? 'js' : 'static'}.png` })
    assert.deepEqual(errors, [])
    assert.deepEqual(failedAssets, [])
    await context.close()
    console.log(`PASS: ${javaScriptEnabled ? 'interactive' : 'no-JavaScript'} production page, metadata, services, contact, anchors, mobile.`)
  }
  const robots = await fetch(new URL('robots.txt', base))
  assert.equal(robots.status, 200)
  assert.match(await robots.text(), /Sitemap: https:\/\/gmacmetalurgica.com.br\/sitemap.xml/)
  const sitemap = await fetch(new URL('sitemap.xml', base))
  assert.equal(sitemap.status, 200)
  const xml = await sitemap.text()
  assert.match(xml, /<loc>https:\/\/gmacmetalurgica.com.br\/<\/loc>/)
  assert.equal((xml.match(/<loc>/g) || []).length, 1)
  console.log('PASS: robots.txt and sitemap.xml return HTTP 200 with the canonical domain.')
} finally {
  await browser.close()
}
