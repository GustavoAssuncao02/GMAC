import { createSmtpTransport, describeSmtpError } from './smtp.js'

let transport
try {
  transport = createSmtpTransport()
  await transport.verify()
  console.log('SMTP verificado: conexão, TLS e autenticação aprovados. Nenhum e-mail foi enviado.')
} catch (error) {
  const diagnostic = describeSmtpError(error)
  console.error(`${diagnostic.code}: ${diagnostic.message}`)
  if (error.responseCode) console.error(`Código retornado pelo servidor SMTP: ${error.responseCode}`)
  process.exitCode = 1
} finally { transport?.close() }
