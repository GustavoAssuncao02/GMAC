import { useEffect, useRef, useState } from 'react'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { ApiError, apiConfigured, completeRequest, createRequest, uploadFile } from './api'
import {
  MAX_FILES, MAX_TOTAL_BYTES, filesError, formatSize, isCpf, isExecutable, maskDocument, maskPhone, todayInBahia, validateForm,
} from './validation'
import type { FieldErrors, FieldName, FormValues } from './validation'

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const siteKey: string = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || ''
const canSend = Boolean(siteKey) && apiConfigured
const whatsappUrl = 'https://wa.me/557536166626?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20GMAC%20sobre%20um%20projeto.'

// O script do captcha só é baixado nesta página, e só quando o envio está habilitado.
let turnstileScript: Promise<void> | null = null
function loadTurnstile() {
  turnstileScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { turnstileScript = null; script.remove(); reject(new Error('Captcha indisponível')) }
    document.head.appendChild(script)
  })
  return turnstileScript
}

type TextField = Exclude<keyof FormValues, 'consent'>
type Upload = { fileId: string; file: File; loaded: number; status: 'waiting' | 'sending' | 'done' | 'failed'; error?: string }
type Stage = 'uploading' | 'finishing' | 'stopped'

const emptyForm: FormValues = {
  document: '', company: '', requester: '', buyer: '', service: '', deadline: '', quantity: '', labelNumber: '',
  email: '', whatsapp: '', description: '', consent: false,
}
const fieldOrder: FieldName[] = ['document', 'company', 'requester', 'buyer', 'service', 'deadline', 'quantity', 'labelNumber', 'email', 'whatsapp', 'description', 'files', 'consent', 'captcha']
const fileKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`

function Unavailable() {
  return (
    <p className="os-alert" role="alert">
      O envio está indisponível no momento. Fale com a GMAC pelo WhatsApp:{' '}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">(75) 3616-6626</a>.
    </p>
  )
}

function Field({ name, label, error, full, children }: { name: string; label: string; error?: string; full?: boolean; children: ReactNode }) {
  return (
    <div className={full ? 'os-field os-field--full' : 'os-field'}>
      <label htmlFor={`os-${name}`}>{label}</label>
      {children}
      {error ? <small className="os-field-error" id={`os-${name}-error`}>{error}</small> : null}
    </div>
  )
}

function Bar({ value, label, state }: { value: number; label: string; state?: 'done' | 'failed' }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={`os-bar${state ? ` os-bar--${state}` : ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function OfertarServico() {
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [view, setView] = useState<'form' | 'sending' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [stage, setStage] = useState<Stage>('uploading')
  const [sendError, setSendError] = useState('')
  const [today] = useState(todayInBahia)

  // Uma identificação por solicitação: as novas tentativas a reutilizam e o portal não cria duas ofertas.
  // Mudar qualquer dado começa outra solicitação, porque o portal guarda os dados do primeiro envio.
  const requestId = useRef<string | null>(null)
  const ticket = useRef('')
  const running = useRef(false)
  const sendingStep1 = useRef(false)
  const captchaBox = useRef<HTMLDivElement>(null)
  const captchaWidget = useRef<string | null>(null)
  const captchaToken = useRef('')

  useEffect(() => {
    if (view !== 'form' || !canSend) return
    let cancelled = false
    loadTurnstile().then(() => {
      if (cancelled || !captchaBox.current || !window.turnstile) return
      captchaWidget.current = window.turnstile.render(captchaBox.current, {
        sitekey: siteKey,
        language: 'pt-br',
        theme: 'light',
        callback: (token: string) => {
          captchaToken.current = token
          clearError('captcha')
        },
        'expired-callback': () => { captchaToken.current = '' },
        'error-callback': () => {
          captchaToken.current = ''
          setErrors((current) => ({ ...current, captcha: 'Não foi possível concluir a verificação de segurança. Recarregue a página e tente de novo.' }))
          return true
        },
      })
    }).catch(() => {
      if (!cancelled) setErrors((current) => ({ ...current, captcha: 'Não foi possível carregar a verificação de segurança. Verifique sua conexão e recarregue a página.' }))
    })
    return () => {
      cancelled = true
      captchaToken.current = ''
      if (captchaWidget.current && window.turnstile) window.turnstile.remove(captchaWidget.current)
      captchaWidget.current = null
    }
  }, [view])

  // O navegador pergunta antes de fechar a página no meio do envio.
  useEffect(() => {
    if (view !== 'sending') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [view])

  // Depois de qualquer erro o token já foi gasto: o widget recomeça para entregar um novo.
  function resetCaptcha() {
    captchaToken.current = ''
    if (captchaWidget.current && window.turnstile) window.turnstile.reset(captchaWidget.current)
  }

  function clearError(...names: FieldName[]) {
    setErrors((current) => names.some((name) => current[name]) ? Object.fromEntries(Object.entries(current).filter(([name]) => !names.includes(name as FieldName))) : current)
  }

  function update(name: TextField, value: string) {
    requestId.current = null
    const next = name === 'document' ? maskDocument(value) : name === 'whatsapp' ? maskPhone(value) : value
    setValues((current) => ({ ...current, [name]: next }))
    clearError(...(name === 'whatsapp' ? ['whatsapp', 'email'] as FieldName[] : [name]))
  }

  function addFiles(selected: File[]) {
    if (!selected.length) return
    const known = new Set(files.map(fileKey))
    const next = [...files, ...selected.filter((file) => !known.has(fileKey(file)) && !isExecutable(file.name) && file.size > 0)]
    const refused = selected.find((file) => isExecutable(file.name) || file.size <= 0)
    const limit = filesError(next)
    if (limit) { setErrors((current) => ({ ...current, files: limit })); return }
    requestId.current = null
    setFiles(next)
    if (refused) setErrors((current) => ({ ...current, files: filesError([refused]) }))
    else clearError('files')
  }

  function removeFile(file: File) {
    requestId.current = null
    setFiles((current) => current.filter((item) => item !== file))
    clearError('files')
  }

  function showErrors(found: FieldErrors) {
    setErrors(found)
    const first = fieldOrder.find((name) => found[name])
    if (first) document.getElementById(first === 'files' ? 'os-files-button' : `os-${first}`)?.focus()
  }

  function backToForm(message: string) {
    ticket.current = ''
    requestId.current = null
    setUploads([])
    setSendError('')
    setNotice(message)
    setView('form')
  }

  // Etapas 2 e 3. Para no primeiro arquivo que falhar; "Reenviar" retoma dele, sem reenviar os que já chegaram.
  async function send(list: Upload[]) {
    if (running.current) return
    running.current = true
    setSendError('')
    setStage('uploading')
    let current = list
    const patch = (fileId: string, change: Partial<Upload>) => {
      current = current.map((upload) => upload.fileId === fileId ? { ...upload, ...change } : upload)
      setUploads(current)
    }
    try {
      for (const upload of list) {
        if (upload.status === 'done') continue
        patch(upload.fileId, { status: 'sending', loaded: 0, error: undefined })
        try {
          await uploadFile(ticket.current, upload.fileId, upload.file, (loaded) => patch(upload.fileId, { loaded: Math.min(loaded, upload.file.size) }))
          patch(upload.fileId, { status: 'done', loaded: upload.file.size })
        } catch (error) {
          const status = error instanceof ApiError ? error.status : 0
          if (status === 404) return backToForm('O envio expirou antes de terminar. Envie de novo: os dados preenchidos foram mantidos.')
          if (status === 409) return setView('done')
          patch(upload.fileId, { status: 'failed', loaded: 0, error: error instanceof ApiError ? error.message : 'Não foi possível enviar este arquivo.' })
          return setStage('stopped')
        }
      }
      setStage('finishing')
      try {
        await completeRequest(ticket.current)
        setView('done')
      } catch (error) {
        if (!(error instanceof ApiError)) throw error
        if (error.status === 404) return backToForm('O envio expirou antes de terminar. Envie de novo: os dados preenchidos foram mantidos.')
        for (const fileId of error.missing ?? []) patch(fileId, { status: 'failed', loaded: 0, error: 'Este arquivo precisa ser enviado de novo.' })
        setSendError(error.missing?.length ? '' : error.message)
        setStage('stopped')
      }
    } finally {
      running.current = false
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sendingStep1.current || !canSend) return
    setNotice('')
    setUnavailable(false)
    const found = validateForm(values, files)
    if (!captchaToken.current) found.captcha = errors.captcha || 'Aguarde a verificação de segurança terminar e envie de novo.'
    if (Object.keys(found).length) return showErrors(found)
    setErrors({})
    sendingStep1.current = true
    setSubmitting(true)
    requestId.current ??= crypto.randomUUID()
    try {
      const created = await createRequest(requestId.current, captchaToken.current, values, files)
      ticket.current = created.ticket
      const list: Upload[] = files.map((file, index) => ({
        fileId: created.files.find((item) => item.index === index)?.fileId ?? '', file, loaded: 0, status: 'waiting',
      }))
      setUploads(list)
      setView('sending')
      void send(list)
    } catch (error) {
      resetCaptcha()
      if (!(error instanceof ApiError)) { setNotice('Não foi possível enviar a solicitação. Tente novamente.'); return }
      if (error.status === 503) setUnavailable(true)
      else if (error.field === 'turnstileToken') showErrors({ captcha: error.message })
      else if (error.field && fieldOrder.includes(error.field as FieldName)) showErrors({ [error.field]: error.message })
      else {
        if (error.field === 'requestId') requestId.current = null
        setNotice(error.message)
      }
    } finally {
      sendingStep1.current = false
      setSubmitting(false)
    }
  }

  const input = (name: TextField, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field name={name} label={label} error={errors[name]}>
      <input
        id={`os-${name}`}
        value={values[name]}
        onChange={(event) => update(name, event.target.value)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `os-${name}-error` : undefined}
        {...props}
      />
    </Field>
  )

  const cpf = isCpf(values.document)
  const selectedBytes = files.reduce((total, file) => total + file.size, 0)
  const uploadBytes = uploads.reduce((total, upload) => total + upload.file.size, 0)
  const sentBytes = uploads.reduce((total, upload) => total + upload.loaded, 0)
  const failed = uploads.some((upload) => upload.status === 'failed')

  return (
    <main className="os-page">
      <img className="os-logo" src="../assets/logo-gmac-badge-192.webp" alt="GMAC Metalúrgica" width="76" height="76" />
      <section className="os-card" aria-labelledby="os-title">
        <header className="os-header">
          <span className="os-kicker">Nova solicitação</span>
          <h1 id="os-title">Solicitar serviço</h1>
          {view === 'form' ? <p>Preencha os dados da solicitação de serviço.</p> : null}
        </header>

        {view === 'form' ? (
          <form onSubmit={submit} noValidate>
            <div className="os-grid">
              {input('document', 'CNPJ/CPF *', { inputMode: 'numeric', autoComplete: 'off', placeholder: 'CNPJ ou CPF da empresa', maxLength: 18, required: true })}
              {input('company', cpf ? 'Nome completo *' : 'Empresa *', { placeholder: cpf ? 'Nome completo' : 'Nome da empresa', autoComplete: cpf ? 'name' : 'organization', maxLength: 160, required: true })}
              {input('requester', 'Solicitante', { placeholder: 'Nome de quem pede o serviço', maxLength: 120 })}
              {input('buyer', 'Comprador', { placeholder: 'Nome de quem compra o serviço', maxLength: 120 })}
              {input('service', 'Peça/Serviço *', { placeholder: 'Nome da peça ou do serviço', maxLength: 160, required: true })}
              {input('deadline', 'Prazo solicitado *', { type: 'date', min: today, required: true })}
              {input('quantity', 'Quantidade *', { type: 'number', inputMode: 'numeric', min: 1, max: 1000000000, step: 1, required: true })}
              {input('labelNumber', 'Número da etiqueta', { placeholder: 'Opcional', maxLength: 80 })}
              {input('email', 'E-mail', { type: 'email', inputMode: 'email', autoComplete: 'email', maxLength: 160 })}
              {input('whatsapp', 'WhatsApp', { type: 'tel', inputMode: 'tel', autoComplete: 'tel-national', placeholder: '(00) 00000-0000', maxLength: 15 })}
              <p className="os-hint os-field--full">Preencha pelo menos um contato.</p>
              <Field name="description" label="Descrição do serviço *" error={errors.description} full>
                <textarea
                  id="os-description"
                  rows={4}
                  maxLength={5000}
                  value={values.description}
                  onChange={(event) => update('description', event.target.value)}
                  aria-invalid={errors.description ? true : undefined}
                  aria-describedby={errors.description ? 'os-description-error' : undefined}
                  required
                />
              </Field>
              <div className="os-field os-field--full">
                <span className="os-label" id="os-files-label">Anexos</span>
                <div className="os-file-picker">
                  <input
                    id="os-files"
                    type="file"
                    multiple
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = '' }}
                  />
                  <button
                    id="os-files-button"
                    type="button"
                    aria-describedby={errors.files ? 'os-files-error os-files-rules' : 'os-files-rules'}
                    onClick={() => document.getElementById('os-files')?.click()}
                  >
                    Escolher arquivos
                  </button>
                  <span id="os-files-rules">Até {MAX_FILES} arquivos e {formatSize(MAX_TOTAL_BYTES)} no total. Executáveis não são aceitos.</span>
                </div>
                {files.length ? (
                  <ul className="os-files" aria-labelledby="os-files-label">
                    {files.map((file) => (
                      <li key={fileKey(file)}>
                        <span className="os-file-name">{file.name}</span>
                        <span className="os-file-size">{formatSize(file.size)}</span>
                        <button type="button" onClick={() => removeFile(file)} aria-label={`Remover ${file.name}`}>Remover</button>
                      </li>
                    ))}
                    <li className="os-files-total">
                      {files.length === 1 ? '1 arquivo' : `${files.length} arquivos`} · {formatSize(selectedBytes)} de {formatSize(MAX_TOTAL_BYTES)}
                    </li>
                  </ul>
                ) : null}
                {errors.files ? <small className="os-field-error" id="os-files-error" role="alert">{errors.files}</small> : null}
              </div>
            </div>

            <div className="os-consent">
              <label htmlFor="os-consent">
                <input
                  id="os-consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={(event) => { requestId.current = null; setValues((current) => ({ ...current, consent: event.target.checked })); clearError('consent') }}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? 'os-consent-error' : undefined}
                  required
                />
                <span>
                  Li e concordo com a{' '}
                  <a href="../privacidade.html" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> e com as{' '}
                  <a href="../regras-orcamento.html" target="_blank" rel="noopener noreferrer">Regras da solicitação</a>.
                </span>
              </label>
              {errors.consent ? <small className="os-field-error" id="os-consent-error">{errors.consent}</small> : null}
            </div>

            {canSend ? (
              <div className="os-captcha">
                <div ref={captchaBox} id="os-captcha" tabIndex={-1} />
                {errors.captcha ? <small className="os-field-error" role="alert">{errors.captcha}</small> : null}
              </div>
            ) : null}

            {notice ? <p className="os-alert" role="alert">{notice}</p> : null}
            {unavailable || !canSend ? <Unavailable /> : null}

            <div className="os-actions">
              <button className="os-submit" type="submit" disabled={submitting || !canSend}>
                {submitting ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </form>
        ) : null}

        {view === 'sending' ? (
          <div className="os-sending">
            <p className="os-sending-title" role="status">
              {stage === 'stopped' ? 'O envio parou antes de terminar.' : stage === 'finishing' ? 'Concluindo a solicitação...' : 'Enviando os anexos...'}
            </p>
            {stage === 'stopped' ? null : <p className="os-warning">Não feche esta página até o envio terminar.</p>}
            {uploads.length ? (
              <>
                <div className="os-total">
                  <div className="os-total-text"><strong>Total</strong><span>{formatSize(sentBytes)} de {formatSize(uploadBytes)}</span></div>
                  <Bar value={uploadBytes ? sentBytes / uploadBytes : 0} label="Progresso total do envio" />
                </div>
                <ul className="os-uploads">
                  {uploads.map((upload) => (
                    <li key={upload.fileId}>
                      <div className="os-upload-text">
                        <span className="os-file-name">{upload.file.name}</span>
                        <span className="os-file-size">
                          {upload.status === 'done' ? 'Enviado' : upload.status === 'sending' ? `${Math.round(100 * upload.loaded / upload.file.size)}%` : upload.status === 'failed' ? 'Falhou' : 'Aguardando'}
                          {' · '}{formatSize(upload.file.size)}
                        </span>
                      </div>
                      <Bar value={upload.loaded / upload.file.size} label={`Progresso de ${upload.file.name}`} state={upload.status === 'done' ? 'done' : upload.status === 'failed' ? 'failed' : undefined} />
                      {upload.status === 'failed' ? (
                        <div className="os-upload-failed" role="alert">
                          <small className="os-field-error">{upload.error}</small>
                          <button type="button" onClick={() => void send(uploads)}>Reenviar este arquivo</button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {sendError ? <p className="os-alert" role="alert">{sendError}</p> : null}
            {stage === 'stopped' ? (
              <div className="os-actions">
                <button className="os-secondary" type="button" onClick={() => backToForm('')}>Voltar ao formulário</button>
                {failed ? null : <button className="os-submit" type="button" onClick={() => void send(uploads)}>Tentar de novo</button>}
              </div>
            ) : null}
          </div>
        ) : null}

        {view === 'done' ? (
          <div className="os-done" role="status">
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#e4f6e7" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1f8a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h2>Solicitação enviada!</h2>
            <p>A equipe comercial da GMAC vai entrar em contato pelo contato informado.</p>
          </div>
        ) : null}
      </section>
      <p className="os-footer">GMAC Metalúrgica · Feira de Santana — BA</p>
    </main>
  )
}
