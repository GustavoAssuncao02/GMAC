export async function submitQuoteRequest(form: Record<string, string>, files: File[]) {
  const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '')
  if (!baseUrl) throw new Error('O envio de orçamento está temporariamente indisponível. Entre em contato pelo WhatsApp.')
  if (files.length > 10) throw new Error('Selecione no máximo 10 arquivos.')
  const body = new FormData()
  Object.entries(form).forEach(([key, value]) => body.append(key, value))
  files.forEach((file) => body.append('files', file))
  let response: Response
  try {
    response = await fetch(baseUrl + '/api/quotes', { method: 'POST', body, signal: AbortSignal.timeout(120000) })
  } catch {
    throw new Error('Não foi possível confirmar o envio. Verifique sua conexão e tente novamente mais tarde.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.ok !== true) throw new Error(result?.error || 'Não foi possível enviar o orçamento. Tente novamente mais tarde.')
  return { ok: true }
}
