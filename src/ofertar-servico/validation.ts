// As mesmas validações do portal (contrato da API em /gmac/api/offer-requests): o que passa aqui passa lá.

export const MAX_FILES = 10
export const MAX_TOTAL_BYTES = 400 * 1024 * 1024
const blockedExtensions = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.js', '.vbs', '.wsf', '.hta', '.jar', '.ps1', '.reg', '.lnk', '.cpl']

export type FormValues = {
  document: string
  company: string
  requester: string
  buyer: string
  service: string
  deadline: string
  quantity: string
  labelNumber: string
  email: string
  whatsapp: string
  description: string
  consent: boolean
}
export type FieldName = keyof FormValues | 'files' | 'captcha'
export type FieldErrors = Partial<Record<FieldName, string>>

export const digitsOf = (value: string) => value.replace(/\D/g, '')

function checkDigit(digits: string, weights: number[]) {
  const rest = weights.reduce((total, weight, index) => total + weight * Number(digits[index]), 0) % 11
  return rest < 2 ? 0 : 11 - rest
}
// Números com todos os dígitos iguais passam no cálculo do CPF, então são recusados à parte.
export function validDocument(value: string) {
  const digits = digitsOf(value)
  if (/^(\d)\1*$/.test(digits)) return false
  if (digits.length === 11) {
    return checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[9])
      && checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[10])
  }
  if (digits.length === 14) {
    return checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[12])
      && checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[13])
  }
  return false
}
// Só um CPF completo e válido troca o rótulo: os 11 primeiros dígitos de um CNPJ quase nunca formam um.
export const isCpf = (value: string) => digitsOf(value).length === 11 && validDocument(value)

export function maskDocument(value: string) {
  const digits = digitsOf(value).slice(0, 14)
  if (digits.length <= 11) {
    return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}
export function maskPhone(value: string) {
  const digits = digitsOf(value).slice(0, 11)
  if (digits.length <= 2) return digits
  const rest = digits.slice(2)
  const split = digits.length === 11 ? 5 : 4
  return `(${digits.slice(0, 2)}) ${rest.length > split ? `${rest.slice(0, split)}-${rest.slice(split)}` : rest}`
}

// Hoje no fuso da empresa: o prazo solicitado não pode ser uma data passada.
export const todayInBahia = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bahia' })
const isDay = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '').replace('.', ',')} MB`
}

export const isExecutable = (name: string) => blockedExtensions.some((extension) => name.trim().toLowerCase().endsWith(extension))

export function filesError(files: File[]) {
  if (files.length > MAX_FILES) return `São no máximo ${MAX_FILES} arquivos.`
  const blocked = files.find((file) => isExecutable(file.name))
  if (blocked) return `O arquivo ${blocked.name} não é aceito: executáveis não podem ser enviados.`
  const empty = files.find((file) => file.size <= 0)
  if (empty) return `O arquivo ${empty.name} está vazio.`
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) return 'Os anexos devem somar até 400 MB.'
  return ''
}

export function validateForm(values: FormValues, files: File[]): FieldErrors {
  const errors: FieldErrors = {}
  const cpf = digitsOf(values.document).length === 11
  if (!validDocument(values.document)) errors.document = 'Informe um CNPJ ou CPF válido.'
  if (!values.company.trim()) errors.company = cpf ? 'Preencha o nome completo.' : 'Preencha o nome da empresa.'
  if (!values.service.trim()) errors.service = 'Preencha a peça ou o serviço.'
  if (!isDay(values.deadline)) errors.deadline = 'Informe o prazo solicitado.'
  else if (values.deadline < todayInBahia()) errors.deadline = 'O prazo solicitado não pode ser uma data passada.'
  const quantity = Number(values.quantity)
  if (!/^\d+$/.test(values.quantity.trim()) || quantity < 1 || quantity > 1000000000) errors.quantity = 'Informe uma quantidade inteira a partir de 1.'
  const email = values.email.trim()
  const whatsapp = values.whatsapp.trim()
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) errors.email = 'Informe um e-mail válido.'
  if (whatsapp && !/^\d{10,11}$/.test(digitsOf(whatsapp))) errors.whatsapp = 'Informe o WhatsApp com DDD (10 ou 11 dígitos).'
  if (!email && !whatsapp) errors.email = 'Preencha pelo menos um contato: e-mail ou WhatsApp.'
  if (!values.description.trim()) errors.description = 'Descreva o serviço.'
  const attachments = filesError(files)
  if (attachments) errors.files = attachments
  if (!values.consent) errors.consent = 'É preciso aceitar a Política de Privacidade e as Regras da solicitação.'
  return errors
}
