import { submitQuoteRequest } from './quoteApi'
import MetalScroll from './metal/MetalScroll'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const navItems = [
  { label: 'Início', href: '#inicio' },
  { label: 'A GMAC', href: '#gmac' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Contato', href: '#contato' },
]

const heroFacts = [
  { value: '18+', label: 'anos de experiência' },
  { value: '5', label: 'frentes de serviço' },
]

const commitments = [
  { term: 'Experiência', detail: 'Mais de 18 anos de atuação em serviços industriais.' },
  { term: 'Precisão', detail: 'Em cada etapa da fabricação.' },
  { term: 'Controle', detail: 'Inspeção de qualidade antes da entrega.' },
  { term: 'Compromisso', detail: 'Com a execução de cada serviço.' },
  { term: 'Confiabilidade', detail: 'Produção acompanhada e registrada.' },
]

const services = [
  {
    title: 'Usinagem',
    quoteOption: 'Usinagem',
    description:
      'Fabricação e usinagem de componentes e peças conforme necessidade do projeto.',
    image: assetUrl('assets/gmac-real/usinagem-cnc.webp'),
    imageAlt: 'Ferramenta de usinagem trabalhando em componente metálico',
  },
  {
    title: 'Caldeiraria',
    quoteOption: 'Caldeiraria',
    description:
      'Fabricação e montagem de estruturas e componentes metálicos.',
    image: assetUrl('assets/gmac-real/caldeiraria.webp'),
    imageAlt: 'Soldagem de estrutura cilíndrica na oficina',
  },
  {
    title: 'Manutenção industrial',
    quoteOption: 'Manutenção industrial',
    description:
      'Serviços voltados à manutenção e continuidade da operação industrial.',
    image: assetUrl('assets/gmac-real/manutencao.webp'),
    imageAlt: 'Profissional da GMAC ajustando equipamento industrial',
  },
  {
    title: 'Corte a laser',
    quoteOption: 'Corte a laser',
    description: 'Soluções de corte para componentes e projetos metálicos.',
    image: assetUrl('assets/gmac-real/detalhe-peca.webp'),
    imageAlt: 'Detalhe de componente metálico com recortes e furos',
  },
  {
    title: 'Serviços externos',
    quoteOption: 'Serviço externo',
    description: 'Integração e acompanhamento de serviços complementares.',
    image: assetUrl('assets/gmac-real/servicos-tecnicos.webp'),
    imageAlt: 'Profissional conferindo um componente na bancada',
  },
]

const processSteps = [
  {
    number: '01',
    title: 'Solicitação',
    description: 'O cliente apresenta sua necessidade.',
  },
  {
    number: '02',
    title: 'Levantamento',
    description: 'Coleta de dados técnicos, medidas, materiais e desenhos.',
  },
  {
    number: '03',
    title: 'Orçamento',
    description: 'Análise e preparação da proposta.',
  },
  {
    number: '04',
    title: 'Autorização',
    description: 'Aprovação e liberação do serviço.',
  },
  {
    number: '05',
    title: 'Produção',
    description: 'Execução acompanhada e registrada.',
  },
  {
    number: '06',
    title: 'Inspeção',
    description: 'Controle de qualidade.',
  },
  {
    number: '07',
    title: 'Entrega',
    description: 'Conclusão e liberação.',
  },
]

const galleryItems = [
  {
    title: 'Usinagem de precisão',
    label: 'Usinagem',
    image: assetUrl('assets/gmac-real/componente-usinado.webp'),
    className: 'col-span-2 row-span-2',
  },
  {
    title: 'Medição técnica',
    label: 'Precisão',
    image: assetUrl('assets/gmac-real/medicao.webp'),
    className: '',
  },
  {
    title: 'Acabamento metálico',
    label: 'Acabamento',
    image: assetUrl('assets/gmac-real/eixo-usinado.webp'),
    className: '',
  },
  {
    title: 'Caldeiraria industrial',
    label: 'Caldeiraria',
    image: assetUrl('assets/gmac-real/soldagem.webp'),
    className: 'col-span-2',
  },
  {
    title: 'Tecnologia CNC',
    label: 'Estrutura',
    image: assetUrl('assets/gmac-real/torno-cnc.webp'),
    className: 'lg:col-span-2',
  },
  {
    title: 'Equipe e operação',
    label: 'Equipe',
    image: assetUrl('assets/gmac-real/operacao-torno.webp'),
    className: 'lg:col-span-2',
  },
]

const clientLogos = [
  { src: assetUrl('assets/clientes/belgo-bekaert.png'), alt: 'Belgo Bekaert', width: 1875, height: 639 },
  { src: assetUrl('assets/clientes/sapelba.webp'), alt: 'Sapelba', width: 1011, height: 300 },
  { src: assetUrl('assets/clientes/nestle.png'), alt: 'Nestlé', width: 3499, height: 944 },
  { src: assetUrl('assets/clientes/placo.png'), alt: 'Placo', width: 2952, height: 1182 },
  { src: assetUrl('assets/clientes/vipal-borrachas.png'), alt: 'VIPAL Borrachas', width: 1000, height: 371 },
]

const footerLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'A GMAC', href: '#gmac' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Orçamento', href: '#orcamento' },
  { label: 'Contato', href: '#contato' },
]

const serviceOptions = [
  'Usinagem',
  'Caldeiraria',
  'Manutenção industrial',
  'Pintura',
  'Corte a laser',
  'Serviço externo',
  'Outro',
]

const phoneLabel = '(75) 3616-6626'
const phoneUrl = 'tel:+557536166626'
const whatsappUrl =
  'https://wa.me/557536166626?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20GMAC%20sobre%20um%20projeto.'

// Address, phone and opening hours as published on the company's Google profile.
const gmacMapsUrl = 'https://maps.app.goo.gl/3bDoAFrJBzZQBZNv7'
const gmacMapsEmbedUrl =
  'https://www.google.com/maps?q=GMAC%20Metal%C3%BArgica%2C%20Feira%20de%20Santana%20BA&ll=-12.2958308,-38.9613785&z=17&output=embed'
const businessAddress = ['Av. Banco do Nordeste, 35 - CIS', 'Feira de Santana - BA, 44010-665']
const businessPlusCode = 'P23Q+JC'
const businessHours = [
  { days: 'Segunda a quinta', hours: '07:30 – 17:30' },
  { days: 'Sexta', hours: '07:30 – 16:30' },
  { days: 'Sábado e domingo', hours: 'Fechado' },
]

const acceptedFileExtensions = ['pdf', 'dwg', 'dxf', 'jpg', 'jpeg', 'png']
const maxFileSize = 10 * 1024 * 1024
const maxTotalFileSize = 25 * 1024 * 1024

const shell = 'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10'
const sectionSpacing = 'py-20 sm:py-24 lg:py-32'
const sectionTitle =
  'mt-5 text-balance text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[2.6rem] lg:text-5xl'
const buttonBase =
  'inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-[0.95rem] font-semibold transition-colors'
const primaryButton = `${buttonBase} brand-corners bg-gmac-orange text-gmac-ink hover:bg-[#ff9147]`
const lightButton = `${buttonBase} rounded border border-white/30 text-white hover:border-white/70 hover:bg-white/10`
const darkButton = `${buttonBase} rounded border border-gmac-ink/25 text-gmac-ink hover:border-gmac-ink hover:bg-gmac-ink/5`
const fieldLabel = 'text-sm font-semibold text-gmac-ink'
const fieldInput =
  'mt-2 block w-full border border-slate-300 bg-white px-3.5 py-3 text-base text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-ink focus:ring-2 focus:ring-gmac-orange/40'

type QuoteFormState = {
  companyName: string
  cnpj: string
  contactName: string
  email: string
  phone: string
  role: string
  serviceType: string
  material: string
  quantity: string
  dimensions: string
  description: string
  deadline: string
  notes: string
}

type QuoteFormErrors = Partial<Record<keyof QuoteFormState | 'files', string>>

const initialQuoteForm: QuoteFormState = {
  companyName: '',
  cnpj: '',
  contactName: '',
  email: '',
  phone: '',
  role: '',
  serviceType: '',
  material: '',
  quantity: '',
  dimensions: '',
  description: '',
  deadline: '',
  notes: '',
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, '').replace('.', ',')} MB`
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function validateQuoteForm(form: QuoteFormState, files: File[]) {
  const errors: QuoteFormErrors = {}

  if (!form.contactName.trim()) {
    errors.contactName = 'Informe seu nome.'
  }

  if (onlyDigits(form.phone).length < 10) {
    errors.phone = 'Informe um telefone com DDD.'
  }

  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(form.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!form.description.trim()) {
    errors.description = 'Descreva o serviço desejado.'
  }

  const cnpjDigits = onlyDigits(form.cnpj).length
  if (cnpjDigits > 0 && cnpjDigits !== 14) {
    errors.cnpj = 'O CNPJ deve ter 14 dígitos.'
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalFileSize) {
    errors.files = `O total dos arquivos deve ter até ${formatFileSize(maxTotalFileSize)}.`
  }

  const invalidFile = files.find((file) => {
    const extension = getFileExtension(file.name)
    return !acceptedFileExtensions.includes(extension) || file.size > maxFileSize
  })

  if (invalidFile) {
    errors.files = `Verifique ${invalidFile.name}: formatos aceitos PDF, DWG, DXF, JPG e PNG, com até ${formatFileSize(maxFileSize)} por arquivo.`
  }

  return errors
}

// The quote API still requires company, CNPJ and service type. They are optional
// on the page, so blanks are sent with explicit placeholders the API accepts.
function toQuotePayload(form: QuoteFormState): QuoteFormState {
  return {
    ...form,
    companyName: form.companyName.trim() || `${form.contactName.trim()} (empresa não informada)`,
    cnpj: onlyDigits(form.cnpj).length === 14 ? form.cnpj : '00.000.000/0000-00',
    serviceType: form.serviceType || 'Não informado',
  }
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
    },
  },
}

function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] ${
        onDark ? 'text-[#f49b52]' : 'text-gmac-ember'
      }`}
    >
      <span aria-hidden="true" className="h-0.5 w-6 flex-none bg-gmac-orange" />
      {children}
    </p>
  )
}

// Only the content fades in; section backgrounds stay painted while scrolling.
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={import.meta.env.SSR || reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -72px 0px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function LogoBadge({ className }: { className: string }) {
  return (
    <img
      src={assetUrl('assets/logo-gmac-badge.webp')}
      alt="GMAC Metalúrgica"
      className={`block select-none ${className}`}
      width={512}
      height={512}
      draggable={false}
      decoding="async"
    />
  )
}

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavigate = () => setIsOpen(false)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/92 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled
          ? 'border-slate-200 shadow-[0_10px_30px_rgba(11,24,38,0.08)]'
          : 'border-transparent'
      }`}
    >
      <div className={`${shell} flex h-16 items-center justify-between sm:h-[4.5rem]`}>
        <a href="#inicio" aria-label="GMAC Metalúrgica - início">
          <LogoBadge className="h-12 w-12 sm:h-14 sm:w-14" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-gmac-ink/75 transition-colors hover:text-gmac-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#orcamento"
          className="brand-corners hidden items-center justify-center bg-gmac-orange px-5 py-2.5 text-sm font-semibold text-gmac-ink transition-colors hover:bg-[#ff9147] lg:inline-flex"
        >
          Solicitar orçamento
        </a>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-gmac-ink/15 text-gmac-ink lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={{
          open: { height: 'auto', opacity: 1 },
          closed: { height: 0, opacity: 0 },
        }}
        className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
      >
        <nav className={`${shell} grid gap-1 py-4`} aria-label="Mobile">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleNavigate}
              className="rounded px-2 py-3 text-base font-medium text-gmac-ink/80 transition-colors hover:bg-gmac-paper hover:text-gmac-ink"
            >
              {item.label}
            </a>
          ))}
          <a href="#orcamento" onClick={handleNavigate} className={`${primaryButton} mt-3`}>
            Solicitar orçamento
            <ArrowRight size={18} />
          </a>
        </nav>
      </motion.div>
    </header>
  )
}

function HashScrollHandler() {
  useEffect(() => {
    const scrollToCurrentHash = () => {
      if (!window.location.hash) return

      window.requestAnimationFrame(() => {
        try {
          document
            .querySelector(window.location.hash)
            ?.scrollIntoView({ block: 'start' })
        } catch {
          // Ignore malformed hashes from external links.
        }
      })
    }

    window.addEventListener('hashchange', scrollToCurrentHash)
    return () => window.removeEventListener('hashchange', scrollToCurrentHash)
  }, [])

  return null
}

function Hero() {
  const mounted = useMounted()
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 700], reduceMotion ? [0, 0] : [0, 60])

  const item = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduceMotion ? 0 : 28 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.78 },
      },
    }),
    [reduceMotion],
  )

  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-gmac-deep text-white"
    >
      <motion.img
        src={assetUrl('assets/gmac-real/hero-soldagem-1440.webp')}
        srcSet={[1440, 1920, 2880]
          .map((width) => `${assetUrl(`assets/gmac-real/hero-soldagem-${width}.webp`)} ${width}w`)
          .join(', ')}
        sizes="(max-width: 640px) 640px, (max-aspect-ratio: 4/3) 150vh, 100vw"
        alt="Profissional da GMAC realizando soldagem de uma peça metálica na oficina"
        width={2880}
        height={2160}
        fetchPriority="high"
        style={{ y: mounted ? imageY : 0 }}
        className="absolute inset-0 h-[110%] w-full object-cover object-[66%_center]"
      />
      <div className="hero-shade absolute inset-0" />

      <div
        className={`${shell} relative flex min-h-[100svh] flex-col justify-end pb-8 pt-28 sm:pb-12 sm:pt-36`}
      >
        <motion.div
          variants={container}
          initial={import.meta.env.SSR || reduceMotion ? false : 'hidden'}
          animate="visible"
        >
          <motion.div variants={item}>
            <Eyebrow onDark>Feira de Santana · Bahia</Eyebrow>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 max-w-4xl text-balance text-[2.5rem] font-medium leading-[1.04] tracking-[-0.035em] min-[400px]:text-[2.85rem] sm:text-6xl lg:text-7xl"
          >
            Precisão que transforma metal em soluções.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8"
          >
            GMAC Metalúrgica: usinagem, caldeiraria e manutenção industrial
            em Feira de Santana, Bahia. Precisão e compromisso com cada projeto.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a href="#orcamento" className={primaryButton}>
              Solicitar orçamento
              <ArrowRight size={18} />
            </a>
            <a href="#gmac" className={lightButton}>
              Conheça a GMAC
            </a>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-12 grid max-w-md grid-cols-2 gap-4 border-t border-white/15 pt-6 sm:mt-16 sm:gap-10 sm:pt-8"
          >
            {heroFacts.map((fact) => (
              <li key={fact.label}>
                <p className="text-2xl font-medium tracking-[-0.03em] sm:text-4xl">
                  {fact.value}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-white/65 sm:text-sm">
                  {fact.label}
                </p>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="gmac" className={`bg-gmac-paper ${sectionSpacing}`}>
      <div className={`${shell} grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-20`}>
        <Reveal>
          <Eyebrow>A GMAC</Eyebrow>
          <h2 className={`${sectionTitle} text-gmac-ink`}>
            GMAC Metalúrgica em Feira de Santana
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            A GMAC Metalúrgica, em Feira de Santana - BA, atua com usinagem de
            peças, caldeiraria e manutenção industrial. Unimos experiência
            técnica, capacidade produtiva e compromisso com a execução dos serviços.
          </p>

          <h3 className="mt-12 text-lg font-semibold tracking-[-0.015em] text-gmac-ink">
            Precisão em cada detalhe
          </h3>
          <dl className="mt-4 border-t border-slate-300">
            {commitments.map((commitment) => (
              <div
                key={commitment.term}
                className="grid gap-1 border-b border-slate-300 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6"
              >
                <dt className="text-sm font-semibold text-gmac-ink">
                  {commitment.term}
                </dt>
                <dd className="text-sm leading-6 text-slate-600">
                  {commitment.detail}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.1}>
          <figure className="lg:sticky lg:top-28">
            <img
              src={assetUrl('assets/gmac-real/equipe-oficina.webp')}
              loading="lazy"
              decoding="async"
              width={1280}
              height={960}
              alt="Equipe GMAC trabalhando em máquina na oficina"
              className="aspect-[4/3] w-full rounded object-cover"
            />
            <figcaption className="mt-4 text-sm leading-6 text-slate-500">
              Capacidade produtiva: soluções técnicas para demandas industriais.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

function Clients() {
  return (
    <section id="clientes" className="border-y border-slate-200 bg-white py-16 sm:py-20">
      <div className={shell}>
        <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>Principais clientes</Eyebrow>
            <h2 className="mt-5 max-w-xl text-balance text-2xl font-medium leading-tight tracking-[-0.025em] text-gmac-ink sm:text-3xl">
              Marcas presentes na trajetória da GMAC.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-7 text-slate-600">
            Algumas das marcas atendidas pela GMAC Metalúrgica em demandas
            industriais.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-9 border-t border-slate-200 pt-10 sm:gap-x-16 lg:justify-between">
            {clientLogos.map((logo) => (
              <li key={logo.alt}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-auto select-none sm:h-11"
                  draggable={false}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  index,
  onRequestQuote,
}: {
  service: (typeof services)[number]
  index: number
  onRequestQuote: (option: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const featured = index < 2
  const last = index === services.length - 1

  return (
    <motion.article
      initial={import.meta.env.SSR || reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: (index % 3) * 0.06 }}
      className={`group flex flex-col overflow-hidden rounded border border-white/10 bg-white/[0.04] ${
        featured ? 'lg:col-span-3' : 'lg:col-span-2'
      } ${last ? 'md:col-span-2' : ''}`}
    >
      <div className="overflow-hidden">
        <img
          src={service.image}
          alt={service.imageAlt}
          loading="lazy"
          decoding="async"
          className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
            featured ? 'aspect-[16/10] lg:aspect-[16/9]' : 'aspect-[16/10]'
          } ${last ? 'md:aspect-[21/9] lg:aspect-[16/10]' : ''}`}
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-xl font-semibold tracking-[-0.015em] text-white">
          {service.title}
        </h3>
        <p className="mt-2 text-[0.95rem] leading-7 text-white/65">
          {service.description}
        </p>
        <a
          href="#orcamento"
          onClick={() => onRequestQuote(service.quoteOption)}
          aria-label={`Solicitar orçamento de ${service.title.toLowerCase()}`}
          className="mt-auto inline-flex items-center gap-2 self-start pt-6 text-sm font-semibold text-gmac-orange transition-colors hover:text-[#ffa25f]"
        >
          Solicitar orçamento
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </motion.article>
  )
}

function Services({ onRequestQuote }: { onRequestQuote: (option: string) => void }) {
  return (
    <section id="servicos" className={`bg-gmac-navy text-white ${sectionSpacing}`}>
      <div className={shell}>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow onDark>Serviços</Eyebrow>
            <h2 className={`${sectionTitle} max-w-3xl`}>
              Usinagem, caldeiraria e manutenção industrial
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-white/70">
            Componentes, estruturas e suporte técnico para operações industriais
            que exigem precisão e continuidade.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              service={service}
              index={index}
              onRequestQuote={onRequestQuote}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProcessTimeline() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="processo" className={`bg-white ${sectionSpacing}`}>
      <div className={shell}>
        <Reveal className="max-w-3xl">
          <Eyebrow>Processo</Eyebrow>
          <h2 className={`${sectionTitle} text-gmac-ink`}>
            Do primeiro contato à entrega
          </h2>
          <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Cada etapa organiza a solicitação para dar clareza ao orçamento,
            à produção, à inspeção e à entrega final.
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {processSteps.map((step, index) => (
            <motion.li
              key={step.number}
              initial={import.meta.env.SSR || reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="relative border-t border-slate-300 pt-5"
            >
              <span
                aria-hidden="true"
                className="absolute -top-[5px] left-0 h-[9px] w-[9px] bg-gmac-orange"
              />
              <p className="text-sm font-semibold tabular-nums text-gmac-ember">
                {step.number}
              </p>
              <h3 className="mt-3 text-base font-semibold text-gmac-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Gallery() {
  return (
    <section className={`bg-gmac-deep text-white ${sectionSpacing}`}>
      <div className={shell}>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow onDark>Galeria</Eyebrow>
            <h2 className={`${sectionTitle} max-w-3xl`}>
              Portfólio industrial em detalhe
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-white/70">
            Peças, máquinas e equipe em registros reais da nossa oficina.
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="mt-12 grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 lg:auto-rows-[14rem] lg:grid-cols-4"
        >
          {galleryItems.map((item) => (
            <figure
              key={item.title}
              className={`group relative overflow-hidden rounded bg-gmac-ink ${item.className}`}
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gmac-deep/90 via-gmac-deep/50 to-transparent px-4 pb-4 pt-12 sm:px-5 sm:pb-5 sm:pt-16">
                <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/70 sm:block">
                  {item.label}
                </span>
                <span className="block text-sm font-semibold text-white sm:mt-1 sm:text-lg">
                  {item.title}
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-2 flex items-start gap-2 text-sm font-medium text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
      {message}
    </p>
  )
}

function TextField({
  id,
  label,
  required = false,
  error,
  className = '',
  ...input
}: {
  id: keyof QuoteFormState
  label: string
  required?: boolean
  error?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'required'>) {
  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-required={required}
        className={fieldInput}
        {...input}
      />
      <FieldError message={error} />
    </div>
  )
}

function QuoteForm({ requestedService }: { requestedService: { option: string } | null }) {
  const [form, setForm] = useState<QuoteFormState>(initialQuoteForm)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<QuoteFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const descriptionCount = form.description.length
  const notesCount = form.notes.length

  // A service card can open the form with its service already chosen.
  useEffect(() => {
    if (!requestedService) return
    setForm((current) => ({ ...current, serviceType: requestedService.option }))
  }, [requestedService])

  const updateField = (field: keyof QuoteFormState, value: string) => {
    setSubmitted(false)
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const addFiles = (fileList: FileList | File[]) => {
    setSubmitted(false)
    const incoming = Array.from(fileList)
    const invalid = incoming.find((file) => {
      const extension = getFileExtension(file.name)
      return !acceptedFileExtensions.includes(extension) || file.size > maxFileSize
    })

    if (invalid) {
      setErrors((current) => ({
        ...current,
        files: `Verifique ${invalid.name}: formatos aceitos PDF, DWG, DXF, JPG e PNG, com até ${formatFileSize(maxFileSize)} por arquivo.`,
      }))
      return
    }

    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}`))
      const next = [...current]

      for (const file of incoming) {
        const key = `${file.name}-${file.size}`
        if (!existing.has(key)) {
          next.push(file)
          existing.add(key)
        }
      }

      const totalSize = next.reduce((sum, file) => sum + file.size, 0)
      if (totalSize > maxTotalFileSize) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          files: `O total dos arquivos deve ter até ${formatFileSize(maxTotalFileSize)}.`,
        }))
        return current
      }

      setErrors((currentErrors) => {
        if (!currentErrors.files) return currentErrors
        const clean = { ...currentErrors }
        delete clean.files
        return clean
      })
      return next
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSubmitted(false)
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
    setErrors((current) => {
      if (!current.files) return current
      const next = { ...current }
      delete next.files
      return next
    })
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files)
    }
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setSubmitError('')
    const validation = validateQuoteForm(form, files)
    setErrors(validation)

    if (Object.keys(validation).length > 0) {
      // The CNPJ lives in the optional block, which may be collapsed.
      if (validation.cnpj) setShowDetails(true)
      window.setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        firstInvalid?.focus({ preventScroll: true })
        firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 0)
      return
    }

    setIsSubmitting(true)
    setSubmitted(false)

    try {
      const response = await submitQuoteRequest(toQuotePayload(form), files)

      if (response.ok) {
        setSubmitted(true)
        setForm(initialQuoteForm)
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar o orçamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="orcamento" className={`bg-gmac-paper ${sectionSpacing}`}>
      <div className={`${shell} grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16`}>
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Orçamento</Eyebrow>
          <h2 className={`${sectionTitle} text-gmac-ink`}>Solicite seu orçamento</h2>
          <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Conte o que você precisa: com seu contato e uma descrição do serviço
            já conseguimos começar. Responderemos o mais rápido possível.
          </p>

          <div className="mt-8 hidden lg:block">
            <p className="text-sm font-semibold text-gmac-ink">Para agilizar a proposta, envie:</p>
            <ul className="mt-4 grid gap-3">
              {[
                'Desenhos ou fotos da peça (PDF, DWG, DXF, JPG ou PNG)',
                'Material, quantidade e dimensões',
                'Prazo desejado',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-6 text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-gmac-ember" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-slate-300 pt-6">
            <p className="text-sm font-semibold text-gmac-ink">Prefere falar direto?</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className={darkButton}>
                <MessageCircle size={18} />
                WhatsApp
              </a>
              <a href={phoneUrl} className={darkButton}>
                <Phone size={18} />
                {phoneLabel}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="rounded border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(11,24,38,0.07)] sm:p-8"
          >
            <div role="group" aria-labelledby="quote-contact">
              <h3 id="quote-contact" className="text-lg font-semibold tracking-[-0.015em] text-gmac-ink">
                Seu contato
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <TextField
                  id="contactName"
                  label="Nome"
                  required
                  value={form.contactName}
                  onChange={(event) => updateField('contactName', event.target.value)}
                  error={errors.contactName}
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Seu nome"
                />
                <TextField
                  id="phone"
                  label="Telefone / WhatsApp"
                  required
                  value={form.phone}
                  onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                  error={errors.phone}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                />
                <TextField
                  id="email"
                  type="email"
                  label="E-mail"
                  required
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  error={errors.email}
                  autoComplete="email"
                  maxLength={254}
                  placeholder="exemplo@empresa.com.br"
                />
                <TextField
                  id="companyName"
                  label="Empresa"
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                  autoComplete="organization"
                  maxLength={254}
                  placeholder="Nome da empresa (opcional)"
                />
              </div>
            </div>

            <div role="group" aria-labelledby="quote-service" className="mt-9 border-t border-slate-200 pt-8">
              <h3 id="quote-service" className="text-lg font-semibold tracking-[-0.015em] text-gmac-ink">
                O que você precisa
              </h3>

              <div className="mt-5">
                <label htmlFor="serviceType" className={fieldLabel}>
                  Tipo de serviço
                </label>
                <select
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(event) => updateField('serviceType', event.target.value)}
                  className={fieldInput}
                >
                  <option value="">Selecione (opcional)</option>
                  {serviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label htmlFor="description" className={fieldLabel}>
                    Descrição do serviço *
                  </label>
                  <span className="text-xs text-slate-500">{descriptionCount}/1000</span>
                </div>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  aria-invalid={Boolean(errors.description)}
                  aria-required
                  maxLength={1000}
                  rows={4}
                  className={`${fieldInput} resize-y leading-6`}
                  placeholder="Descreva a peça ou o serviço: medidas, tolerâncias, acabamento e o que mais for importante."
                />
                <FieldError message={errors.description} />
              </div>

              <div className="mt-5">
                <p className={fieldLabel}>Arquivos</p>
                <label
                  htmlFor="quoteFiles"
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  tabIndex={0}
                  className={`mt-2 flex cursor-pointer items-center gap-4 rounded border border-dashed px-4 py-4 outline-none transition focus:border-gmac-ink focus:ring-2 focus:ring-gmac-orange/40 ${
                    isDragging
                      ? 'border-gmac-orange bg-orange-50'
                      : 'border-slate-300 bg-gmac-paper hover:border-gmac-ink'
                  }`}
                >
                  <UploadCloud className="h-7 w-7 flex-none text-gmac-ember" />
                  <span>
                    <span className="block text-sm font-semibold text-gmac-ink">
                      Anexar desenhos ou fotos
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      PDF, DWG, DXF, JPG e PNG. Até {formatFileSize(maxFileSize)} por
                      arquivo e {formatFileSize(maxTotalFileSize)} no total.
                    </span>
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="quoteFiles"
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  aria-invalid={Boolean(errors.files)}
                  className="sr-only"
                />
                <FieldError message={errors.files} />

                {files.length > 0 ? (
                  <ul className="mt-4 grid gap-3" aria-label="Arquivos anexados">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 flex-none text-gmac-blue" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gmac-ink">
                              {file.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="flex h-11 w-11 flex-none items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Remover arquivo ${file.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <details
              open={showDetails}
              onToggle={(event) => setShowDetails(event.currentTarget.open)}
              className="group/details mt-8 rounded border border-slate-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-gmac-ink [&::-webkit-details-marker]:hidden">
                Adicionar detalhes técnicos (opcional)
                <ChevronDown className="h-4 w-4 flex-none transition-transform group-open/details:rotate-180" />
              </summary>
              <div className="grid gap-5 border-t border-slate-200 p-4 sm:grid-cols-2 sm:p-5">
                <TextField
                  id="cnpj"
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={(event) => updateField('cnpj', formatCnpj(event.target.value))}
                  error={errors.cnpj}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00.000.000/0000-00"
                />
                <TextField
                  id="role"
                  label="Cargo / Função"
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value)}
                  autoComplete="organization-title"
                  maxLength={254}
                />
                <TextField
                  id="material"
                  label="Material principal"
                  value={form.material}
                  onChange={(event) => updateField('material', event.target.value)}
                  maxLength={254}
                  placeholder="Ex.: aço carbono, alumínio, inox"
                />
                <TextField
                  id="quantity"
                  label="Quantidade estimada"
                  value={form.quantity}
                  onChange={(event) => updateField('quantity', event.target.value)}
                  maxLength={254}
                  placeholder="Ex.: 10 peças"
                />
                <TextField
                  id="dimensions"
                  label="Dimensões / referências técnicas"
                  className="sm:col-span-2"
                  value={form.dimensions}
                  onChange={(event) => updateField('dimensions', event.target.value)}
                  maxLength={254}
                  placeholder="Ex.: medidas, tolerâncias ou acabamento"
                />
                <TextField
                  id="deadline"
                  type="date"
                  label="Prazo desejado"
                  value={form.deadline}
                  onChange={(event) => updateField('deadline', event.target.value)}
                />
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <label htmlFor="notes" className={fieldLabel}>
                      Observações adicionais
                    </label>
                    <span className="text-xs text-slate-500">{notesCount}/500</span>
                  </div>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    maxLength={500}
                    rows={3}
                    className={`${fieldInput} resize-y leading-6`}
                    placeholder="Informações adicionais que possam ajudar na elaboração do orçamento."
                  />
                </div>
              </div>
            </details>

            <div className="mt-8">
              {submitError ? (
                <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {submitError}
                </p>
              ) : null}
              {submitted ? (
                <div
                  className="mb-4 flex gap-3 rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">Solicitação enviada com sucesso.</p>
                    <p className="mt-1 text-sm">
                      A equipe da GMAC retornará pelo contato informado.
                    </p>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`${primaryButton} w-full disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando solicitação
                  </>
                ) : (
                  <>
                    Enviar solicitação
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                <ShieldCheck className="mr-1.5 inline h-4 w-4 align-[-3px] text-gmac-ember" />
                Campos com * são obrigatórios. Seus dados estão seguros conosco.
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

function OpeningHours({ onDark = false }: { onDark?: boolean }) {
  return (
    <dl className="grid gap-1.5">
      {businessHours.map((entry) => (
        <div key={entry.days} className="flex justify-between gap-6">
          <dt>{entry.days}</dt>
          <dd className={`tabular-nums ${onDark ? 'text-white' : 'font-medium text-gmac-ink'}`}>
            {entry.hours}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Contact() {
  return (
    <section id="contato" className={`bg-white ${sectionSpacing}`} aria-label="Contato">
      <div className={shell}>
        <Reveal>
          <Eyebrow>Contato</Eyebrow>
          <h2 className={`${sectionTitle} max-w-3xl text-gmac-ink`}>
            Vamos conversar sobre seu projeto
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <ul className="border-t border-slate-200 text-[0.95rem] leading-7 text-slate-600">
              <li className="flex gap-4 border-b border-slate-200 py-5">
                <MapPin className="mt-1 h-5 w-5 flex-none text-gmac-ember" />
                <div>
                  <p className="text-sm font-semibold text-gmac-ink">Endereço</p>
                  <p className="mt-1">
                    {businessAddress[0]}
                    <span className="block">{businessAddress[1]}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Plus Code: {businessPlusCode}
                  </p>
                </div>
              </li>
              <li className="flex gap-4 border-b border-slate-200 py-5">
                <Phone className="mt-1 h-5 w-5 flex-none text-gmac-ember" />
                <div>
                  <p className="text-sm font-semibold text-gmac-ink">Telefone e WhatsApp</p>
                  <a
                    href={phoneUrl}
                    className="mt-1 block text-lg font-semibold text-gmac-ink transition-colors hover:text-gmac-ember"
                  >
                    {phoneLabel}
                  </a>
                </div>
              </li>
              <li className="flex gap-4 border-b border-slate-200 py-5">
                <Clock className="mt-1 h-5 w-5 flex-none text-gmac-ember" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gmac-ink">Horário de funcionamento</p>
                  <div className="mt-1 max-w-xs">
                    <OpeningHours />
                  </div>
                </div>
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className={primaryButton}>
                <MessageCircle size={18} />
                Chamar no WhatsApp
              </a>
              <a href="#orcamento" className={darkButton}>
                Solicitar orçamento
                <ArrowRight size={18} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col">
            <div className="relative min-h-[20rem] flex-1 overflow-hidden rounded border border-slate-200 bg-gmac-paper sm:min-h-[24rem]">
              <iframe
                title="Mapa da GMAC Metalúrgica"
                src={gmacMapsEmbedUrl}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={gmacMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 self-start text-sm font-semibold text-gmac-ink transition-colors hover:text-gmac-ember"
            >
              Abrir no Google Maps
              <ArrowUpRight size={16} />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gmac-deep text-white">
      <div className={`${shell} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.1fr_1.1fr] lg:gap-12 lg:py-16`}>
        <div>
          <LogoBadge className="h-16 w-16" />
          <p className="mt-5 text-lg font-semibold tracking-[-0.015em]">
            GMAC Metalúrgica
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Usinagem · Caldeiraria · Manutenção industrial
          </p>
        </div>

        <nav aria-label="Rodapé">
          <p className="text-sm font-semibold text-white">Navegação</p>
          <ul className="mt-4 grid gap-2.5">
            {footerLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold text-white">Contato</p>
          <address className="mt-4 text-sm not-italic leading-6 text-white/60">
            {businessAddress[0]}
            <span className="block">{businessAddress[1]}</span>
          </address>
          <a
            href={phoneUrl}
            className="mt-3 block text-sm font-semibold text-white transition-colors hover:text-gmac-orange"
          >
            {phoneLabel}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            WhatsApp
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Horário de funcionamento</p>
          <div className="mt-4 text-sm leading-6 text-white/60">
            <OpeningHours onDark />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className={`${shell} py-6 text-sm text-white/50`}>
          © {new Date().getFullYear()} GMAC Metalúrgica. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

function App() {
  const [requestedService, setRequestedService] = useState<{ option: string } | null>(null)

  return (
    <main className="min-h-screen overflow-x-clip bg-gmac-paper">
      <HashScrollHandler />
      <Header />
      <Hero />
      <MetalScroll />
      <About />
      <Clients />
      <Services onRequestQuote={(option) => setRequestedService({ option })} />
      <ProcessTimeline />
      <Gallery />
      <QuoteForm requestedService={requestedService} />
      <Contact />
      <Footer />
    </main>
  )
}

export default App
