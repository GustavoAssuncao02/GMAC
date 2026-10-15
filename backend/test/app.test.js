import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

const origin = 'https://gustavoassuncao02.github.io'
test('sem SMTP pronto não aceita orçamentos, mas responde preflight para o site GMAC', async t => {
  const gmacOrigin = 'https://gmacmetalurgica.com.br'
  const app = createApp({ from: '', origins: [gmacOrigin], isReady: () => false, sendMail: () => assert.fail('Não deveria enviar') })
  const instance = app.listen(0, '127.0.0.1')
  await new Promise(resolve => instance.once('listening', resolve))
  t.after(() => new Promise(resolve => instance.close(resolve)))
  const url = `http://127.0.0.1:${instance.address().port}`
  const health = await fetch(url + '/api/health')
  assert.equal(health.status, 503)
  assert.deepEqual(await health.json(), { ok: false, service: 'gmac-backend', smtpReady: false })
  assert.equal((await fetch(url + '/api/quotes', { method: 'OPTIONS', headers: { origin: gmacOrigin } })).status, 204)
  const quote = await fetch(url + '/api/quotes', { method: 'POST', headers: { origin: gmacOrigin }, body: body() })
  assert.equal(quote.status, 503)
  assert.equal(quote.headers.get('access-control-allow-origin'), gmacOrigin)
})
function body(overrides = {}, filename = 'desenho.pdf') {
  const data = new FormData()
  const values = { companyName: 'Empresa teste', cnpj: '12.345.678/0001-90', contactName: 'Contato teste', email: 'cliente@example.com', phone: '75999999999', serviceType: 'Usinagem', description: 'Peça conforme desenho', ...overrides }
  Object.entries(values).forEach(([key, value]) => data.append(key, value))
  data.append('files', new Blob(['arquivo de teste']), filename)
  return data
}
test('health identifica bloqueio SMTP e volta a ficar pronto após a liberação', async t => {
  let ready = false
  const app = createApp({
    from: 'site@example.com', origins: [origin], isReady: () => ready,
    getSmtpError: () => 'SMTP_AUTH_DISABLED', sendMail: () => assert.fail('Não deveria enviar'),
  })
  const instance = app.listen(0, '127.0.0.1')
  await new Promise(resolve => instance.once('listening', resolve))
  t.after(() => new Promise(resolve => instance.close(resolve)))
  const url = `http://127.0.0.1:${instance.address().port}/api/health`
  const unavailable = await fetch(url)
  assert.equal(unavailable.status, 503)
  assert.equal((await unavailable.json()).smtpError, 'SMTP_AUTH_DISABLED')
  ready = true
  const available = await fetch(url)
  assert.equal(available.status, 200)
  assert.deepEqual(await available.json(), { ok: true, service: 'gmac-backend', smtpReady: true })
})
async function server(t, sendMail, rateLimitMax = 100) {
  const app = createApp({ from: 'site@example.com', origins: [origin], sendMail, rateLimitMax })
  const instance = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => instance.once('listening', resolve))
  t.after(() => new Promise((resolve) => instance.close(resolve)))
  return `http://127.0.0.1:${instance.address().port}/api/quotes`
}
test('envia campos, bytes dos anexos, destino fixo e reply-to', async (t) => {
  let message
  const url = await server(t, async (mail) => { message = mail; return { accepted: ['comercial@gmacmetalurgica.com.br'] } })
  const response = await fetch(url, { method: 'POST', headers: { origin }, body: body() })
  assert.equal(response.status, 200)
  assert.equal(message.to, 'comercial@gmacmetalurgica.com.br')
  assert.equal(message.replyTo, 'cliente@example.com')
  assert.match(message.text, /Peça conforme desenho/)
  assert.equal(message.attachments[0].content.toString(), 'arquivo de teste')
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
})
test('bloqueia origem, campos invalidos e anexos proibidos sem enviar email', async (t) => {
  const url = await server(t, () => { assert.fail('Não deveria enviar') })
  for (const [headers, data, status] of [
    [{ origin: 'https://outro.example' }, body(), 403],
    [{ origin }, body({ email: 'invalido' }), 400],
    [{ origin }, body({ to: 'outro@example.com' }), 400],
    [{ origin }, body({}, 'script.exe'), 400],
  ]) {
    const response = await fetch(url, { method: 'POST', headers, body: data })
    assert.equal(response.status, status)
  }
})
test('falha SMTP ou destinatario rejeitado nao retorna sucesso', async (t) => {
  for (const send of [async () => { throw new Error('SMTP indisponivel') }, async () => ({ accepted: [] })]) {
    const url = await server(t, send)
    const response = await fetch(url, { method: 'POST', headers: { origin }, body: body() })
    assert.equal(response.status, 502)
    assert.ok((await response.json()).error)
  }
})
test('preflight e limite de tentativas', async (t) => {
  const url = await server(t, async () => ({ accepted: ['comercial@gmacmetalurgica.com.br'] }), 1)
  assert.equal((await fetch(url, { method: 'OPTIONS', headers: { origin } })).status, 204)
  assert.equal((await fetch(url, { method: 'POST', headers: { origin }, body: body() })).status, 200)
  assert.equal((await fetch(url, { method: 'POST', headers: { origin }, body: body() })).status, 429)
})
test('rejeita arquivo maior que 10 MB', async (t) => {
  const url = await server(t, () => { assert.fail('Não deveria enviar') })
  const data = body()
  data.set('files', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), 'grande.pdf')
  assert.equal((await fetch(url, { method: 'POST', headers: { origin }, body: data })).status, 413)
})
