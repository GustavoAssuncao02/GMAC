// Envio em 3 etapas para o portal da GMAC: (1) dados + captcha → ticket; (2) um arquivo por vez; (3) concluir.
import type { FormValues } from './validation'

// A data "Atualizada em" da Política de Privacidade, definida no build (vite.ofertar.config.ts).
declare const __POLICY_VERSION__: string

const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || ''
export const apiConfigured = Boolean(baseUrl)
const endpoint = `${baseUrl}/api/offer-requests`
const connectionError = 'Não foi possível falar com a GMAC agora. Verifique sua conexão e tente novamente.'

export class ApiError extends Error {
  status: number
  field?: string
  missing?: string[]
  constructor(status: number, message: string, field?: string, missing?: string[]) {
    super(message)
    this.status = status
    this.field = field
    this.missing = missing
  }
}

export type Ticket = { ticket: string; files: { index: number; fileId: string }[]; expiresAt: string }

async function post(url: string, body: unknown, timeoutMs: number) {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new ApiError(0, connectionError)
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, result?.error || 'Não foi possível enviar a solicitação. Tente novamente.', result?.field, result?.missing)
  return result
}

export function createRequest(requestId: string, turnstileToken: string, values: FormValues, files: File[]): Promise<Ticket> {
  return post(endpoint, {
    requestId,
    turnstileToken,
    document: values.document,
    company: values.company.trim(),
    requester: values.requester.trim(),
    buyer: values.buyer.trim(),
    service: values.service.trim(),
    deadline: values.deadline,
    quantity: Number(values.quantity),
    labelNumber: values.labelNumber.trim(),
    description: values.description.trim(),
    email: values.email.trim(),
    whatsapp: values.whatsapp.trim(),
    consent: { accepted: values.consent, policyVersion: __POLICY_VERSION__ },
    files: files.map((file) => ({ name: file.name, size: file.size })),
  }, 60000)
}

// XMLHttpRequest para ter o progresso do envio. Sem tempo limite: arquivos grandes levam minutos.
export function uploadFile(ticket: string, fileId: string, file: File, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', `${endpoint}/${encodeURIComponent(ticket)}/files/${encodeURIComponent(fileId)}`)
    request.setRequestHeader('Content-Type', 'application/octet-stream')
    request.upload.onprogress = (event) => onProgress(event.loaded)
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) return resolve()
      let result: { error?: string } | null = null
      try { result = JSON.parse(request.responseText) } catch { /* resposta sem JSON */ }
      reject(new ApiError(request.status, result?.error || 'Não foi possível enviar este arquivo.'))
    }
    request.onerror = () => reject(new ApiError(0, 'O envio deste arquivo foi interrompido. Verifique sua conexão.'))
    request.onabort = request.onerror
    request.send(file)
  })
}

export function completeRequest(ticket: string): Promise<{ ok: true }> {
  return post(`${endpoint}/${encodeURIComponent(ticket)}/complete`, {}, 60000)
}
