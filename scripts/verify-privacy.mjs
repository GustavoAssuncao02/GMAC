import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// node scripts/verify-privacy.mjs <playwright-entry> [url]
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.argv[3] || 'http://127.0.0.1:4175/'
await mkdir('artifacts/privacy', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const reports = []
try {
  for (const width of [320, 390, 768, 1440, 3840]) {
    const context = await browser.newContext({ viewport: { width, height: width >= 3840 ? 2160 : 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    const externalHosts = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.hostname !== new URL(base).hostname) externalHosts.push(url.hostname)
    })
    // Inspect when the embed would connect, without needing Google's live UI.
    await page.route('https://www.google.com/maps**', route => route.fulfill({ contentType: 'text/html', body: '<html lang="pt-BR"><body>Mapa externo de teste</body></html>' }))
    await page.goto(base, { waitUntil: 'networkidle' })
    const pause = page.getByRole('button', { name: 'Pausar rotação' })
    await pause.scrollIntoViewIfNeeded()
    await pause.focus()
    await page.keyboard.press('Enter')
    const resume = page.getByRole('button', { name: 'Retomar rotação' })
    assert.equal(await resume.getAttribute('aria-pressed'), 'true')
    const ring = page.locator('#clientes [aria-label^="Carrossel"] > div > div > div')
    const stopped = await ring.evaluate(element => element.style.transform)
    await page.waitForTimeout(300)
    assert.equal(await ring.evaluate(element => element.style.transform), stopped, 'Pause stops the animation')
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
    assert.notEqual(await ring.evaluate(element => element.style.transform), stopped, 'Keyboard resumes autoplay')

    const notice = page.locator('#orcamento .quote-privacy-notice')
    assert.equal(await notice.count(), 1)
    assert.match(await notice.innerText(), /não significa contratação automática/)
    await page.locator('#orcamento button[type="submit"]').click()
    await page.waitForFunction(() => document.activeElement.id === 'contactName')
    for (const id of ['contactName', 'phone', 'email', 'description']) {
      const field = page.locator(`#${id}`)
      assert.equal(await field.getAttribute('aria-invalid'), 'true')
      const description = await field.getAttribute('aria-describedby')
      assert.ok(description, `${id}: error is associated with the field`)
      assert.ok((await page.locator(`#${description}`).innerText()).length > 0)
    }

    await page.locator('#contactName').fill('Revisão local sem envio')
    const popupPromise = context.waitForEvent('page')
    await notice.getByRole('link', { name: /^Política de Privacidade/ }).click()
    const popup = await popupPromise
    await popup.waitForLoadState('domcontentloaded')
    assert.match(await popup.locator('h1').innerText(), /Política de Privacidade/)
    assert.match(await popup.locator('#retencao').innerText(), /30 dias/)
    await popup.close()
    assert.equal(await page.locator('#contactName').inputValue(), 'Revisão local sem envio', 'Opening the policy preserves the form')

    await page.locator('#contato').scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    assert.equal(await page.locator('#contato iframe').count(), 0)
    assert.deepEqual(externalHosts, [], 'No third-party connection before choosing to load the map')
    await page.getByRole('button', { name: 'Carregar Google Maps' }).click()
    await page.locator('#contato iframe').waitFor()
    assert.match(await page.locator('#contato iframe').getAttribute('src'), /^https:\/\/www\.google\.com\/maps/)
    await page.getByRole('button', { name: 'Fechar mapa' }).click()
    assert.equal(await page.locator('#contato iframe').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await notice.scrollIntoViewIfNeeded()
    if ([390, 1440].includes(width)) await page.screenshot({ path: `artifacts/privacy/${width}-form.png` })
    reports.push({ width, noThirdPartyBeforeChoice: true, accessibleFormErrors: true, pauseAndResume: true, formPreserved: true, errors })
    await context.close()
    console.log(`PASS: ${width}px — notice, keyboard pause, form errors, map choice and no overflow`)
  }

  // Legal information must work without JavaScript and with native navigation.
  for (const width of [320, 390, 1440, 3840]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false })
    for (const file of ['privacidade.html', 'regras-orcamento.html', 'acessibilidade.html']) {
      const page = await context.newPage()
      assert.equal((await page.goto(new URL(file, base).href, { waitUntil: 'networkidle' })).status(), 200)
      assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR')
      assert.equal(await page.locator('h1').count(), 1)
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(link => link.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))),
        brokenImages: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src),
      }))
      assert.equal(metrics.overflow, false, `${width} ${file}: no overflow`)
      assert.deepEqual(metrics.brokenAnchors, [])
      assert.deepEqual(metrics.brokenImages, [])
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true)
      if ([390, 1440].includes(width)) await page.screenshot({ path: `artifacts/privacy/${width}-${file}.png` })
      await page.close()
    }
    await context.close()
    console.log(`PASS: ${width}px — all legal pages without JavaScript`)
  }
  await writeFile('artifacts/privacy/results.json', JSON.stringify(reports, null, 2))
} finally { await browser.close() }
