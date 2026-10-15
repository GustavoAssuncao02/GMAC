import { createSmtpTransport, describeSmtpError } from './smtp.js'
import { createApp } from './app.js'

const origins = (process.env.ALLOWED_ORIGINS || 'https://gmacmetalurgica.com.br,https://www.gmacmetalurgica.com.br').split(',').map(value => value.trim()).filter(Boolean)
const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']
const missing = required.filter(key => !process.env[key]?.trim())
const port = Number(process.env.GMAC_PORT || process.env.PORT || 3001)
const smtpPort = Number(process.env.SMTP_PORT || 587)
const trustProxy = Number(process.env.TRUST_PROXY_HOPS || 0)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Porta GMAC inválida.')
if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) throw new Error('SMTP_PORT inválida.')
if (!Number.isInteger(trustProxy) || trustProxy < 0) throw new Error('TRUST_PROXY_HOPS inválido.')
for (const origin of origins) {
  if (new URL(origin).origin !== origin) throw new Error('ALLOWED_ORIGINS deve conter origens sem caminho ou barra final.')
}
let ready = false
let verifying = false
let closing = false
let smtpError = missing.length ? 'SMTP_CONFIG_MISSING' : null
const transport = missing.length ? null : createSmtpTransport()
async function verifySmtp() {
  if (!transport || verifying || ready || closing) return
  verifying = true
  try {
    await transport.verify()
    if (!closing) { ready = true; smtpError = null; console.log('GMAC: SMTP verificado; envio de orçamentos habilitado.') }
  } catch (error) {
    ready = false
    const diagnostic = describeSmtpError(error)
    smtpError = diagnostic.code
    console.error(`GMAC: ${diagnostic.code}: ${diagnostic.message} Nova tentativa em 60 segundos.`)
  } finally { verifying = false }
}
const app = createApp({
  sendMail: async message => {
    try { return await transport.sendMail(message) }
    catch (error) { ready = false; smtpError = describeSmtpError(error).code; throw error }
  },
  from: process.env.MAIL_FROM,
  origins, trustProxy, isReady: () => ready, getSmtpError: () => smtpError,
})
const server = app.listen(port, process.env.GMAC_HOST || '0.0.0.0', () => {
  console.log(`GMAC BACKEND em http://${process.env.GMAC_HOST || '0.0.0.0'}:${port}`)
  if (missing.length) console.error(`GMAC: preencha ${missing.join(', ')} no .env do backend e reinicie o serviço. Envios desabilitados.`)
  else void verifySmtp()
})
server.requestTimeout = 120000
const retry = setInterval(() => void verifySmtp(), 60000)
retry.unref()
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (closing) return
    closing = true
    ready = false
    clearInterval(retry)
    server.close(() => { transport?.close(); process.exit(0) })
    setTimeout(() => { server.closeAllConnections(); transport?.close(); process.exit(0) }, 7000).unref()
  })
}
