import {
  ArrowDown,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Cog,
  FileText,
  Hammer,
  Loader2,
  MapPin,
  Menu,
  Phone,
  Ruler,
  ScanLine,
  ShieldCheck,
  Target,
  Timer,
  Trash2,
  UploadCloud,
  Workflow,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  motion,
  useInView,
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
} from 'react'

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const whatsappContactUrl =
  'https://wa.me/557536166626?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20GMAC%20sobre%20um%20projeto.'

const navItems = [
  { label: 'Início', href: '#inicio' },
  { label: 'A GMAC', href: '#gmac' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Contato', href: '#contato' },
]

const services: Array<{
  title: string
  description: string
  image: string
  icon: LucideIcon
}> = [
  {
    title: 'USINAGEM',
    description:
      'Fabricação e usinagem de componentes e peças conforme necessidade do projeto.',
    image: assetUrl('assets/service-usinagem.png'),
    icon: Cog,
  },
  {
    title: 'CALDEIRARIA',
    description:
      'Fabricação e montagem de estruturas e componentes metálicos.',
    image: assetUrl('assets/service-caldeiraria.png'),
    icon: Hammer,
  },
  {
    title: 'MANUTENÇÃO INDUSTRIAL',
    description:
      'Serviços voltados à manutenção e continuidade da operação industrial.',
    image: assetUrl('assets/service-manutencao.png'),
    icon: Wrench,
  },
  {
    title: 'CORTE A LASER',
    description: 'Soluções de corte para componentes e projetos metálicos.',
    image: assetUrl('assets/service-laser.png'),
    icon: Zap,
  },
  {
    title: 'SERVIÇOS EXTERNOS',
    description: 'Integração e acompanhamento de serviços complementares.',
    image: assetUrl('assets/service-externos.png'),
    icon: ClipboardCheck,
  },
]

const processSteps = [
  {
    number: '01',
    title: 'SOLICITAÇÃO',
    description: 'O cliente apresenta sua necessidade.',
  },
  {
    number: '02',
    title: 'LEVANTAMENTO',
    description: 'Coleta de dados técnicos, medidas, materiais e desenhos.',
  },
  {
    number: '03',
    title: 'ORÇAMENTO',
    description: 'Análise e preparação da proposta.',
  },
  {
    number: '04',
    title: 'AUTORIZAÇÃO',
    description: 'Aprovação e liberação do serviço.',
  },
  {
    number: '05',
    title: 'PRODUÇÃO',
    description: 'Execução acompanhada e registrada.',
  },
  {
    number: '06',
    title: 'INSPEÇÃO',
    description: 'Controle de qualidade.',
  },
  {
    number: '07',
    title: 'ENTREGA',
    description: 'Conclusão e liberação.',
  },
]

const galleryItems: Array<{
  title: string
  label: string
  image: string
  icon: LucideIcon
  className: string
}> = [
  {
    title: 'Usinagem de precisão',
    label: 'USINAGEM',
    image: assetUrl('assets/service-usinagem.png'),
    icon: Cog,
    className: 'lg:col-span-2 lg:row-span-2',
  },
  {
    title: 'Medição técnica',
    label: 'PRECISÃO',
    image: assetUrl('assets/gallery-medicao.png'),
    icon: Ruler,
    className: '',
  },
  {
    title: 'Acabamento metálico',
    label: 'ACABAMENTO',
    image: assetUrl('assets/gallery-acabamento.png'),
    icon: Target,
    className: '',
  },
  {
    title: 'Caldeiraria industrial',
    label: 'CALDEIRARIA',
    image: assetUrl('assets/service-caldeiraria.png'),
    icon: Hammer,
    className: 'lg:col-span-2',
  },
  {
    title: 'Corte a laser',
    label: 'CORTE A LASER',
    image: assetUrl('assets/service-laser.png'),
    icon: Zap,
    className: '',
  },
  {
    title: 'Equipe e operação',
    label: 'EQUIPE',
    image: assetUrl('assets/gallery-equipe.png'),
    icon: Wrench,
    className: '',
  },
]

const qualityItems: Array<{
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    label: 'Leitura técnica',
    description: 'Entendimento do desenho, medidas e aplicação antes da fabricação.',
    icon: FileText,
  },
  {
    label: 'Processo adequado',
    description: 'Usinagem, caldeiraria ou manutenção direcionada para cada necessidade.',
    icon: Workflow,
  },
  {
    label: 'Conferência',
    description: 'Verificação de medidas, acabamento e encaixe durante a execução.',
    icon: ScanLine,
  },
  {
    label: 'Prazo combinado',
    description: 'Organização da produção para cumprir o que foi alinhado com o cliente.',
    icon: Timer,
  },
  {
    label: 'Entrega confiável',
    description: 'Peças e serviços finalizados com atenção ao uso real na operação.',
    icon: ShieldCheck,
  },
]

const clientLogos = [
  { src: assetUrl('assets/clientes/belgo-bekaert.png'), alt: 'Belgo Bekaert' },
  { src: assetUrl('assets/clientes/sapelba.jpg'), alt: 'Sapelba' },
  { src: assetUrl('assets/clientes/nestle.png'), alt: 'Nestlé' },
  { src: assetUrl('assets/clientes/placo.png'), alt: 'Placo' },
  { src: assetUrl('assets/clientes/vipal-borrachas.png'), alt: 'VIPAL Borrachas' },
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

const gmacMapsUrl = 'https://maps.app.goo.gl/3bDoAFrJBzZQBZNv7'
const gmacMapsEmbedUrl =
  'https://www.google.com/maps?q=GMAC%20Metal%C3%BArgica%2C%20Feira%20de%20Santana%20BA&ll=-12.2958308,-38.9613785&z=17&output=embed'

const acceptedFileExtensions = ['pdf', 'dwg', 'dxf', 'jpg', 'jpeg', 'png']
const maxFileSize = 10 * 1024 * 1024
const maxTotalFileSize = 25 * 1024 * 1024

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

type QuoteSubmission = QuoteFormState & {
  files: Array<{
    name: string
    size: number
    type: string
  }>
}

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

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function validateQuoteForm(form: QuoteFormState, files: File[]) {
  const errors: QuoteFormErrors = {}

  if (!form.companyName.trim()) {
    errors.companyName = 'Informe o nome da empresa.'
  }

  if (onlyDigits(form.cnpj).length !== 14) {
    errors.cnpj = 'Informe um CNPJ válido.'
  }

  if (!form.contactName.trim()) {
    errors.contactName = 'Informe o nome do contato.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (onlyDigits(form.phone).length < 10) {
    errors.phone = 'Informe um telefone válido.'
  }

  if (!form.serviceType) {
    errors.serviceType = 'Selecione o tipo de serviço.'
  }

  if (!form.description.trim()) {
    errors.description = 'Descreva o serviço desejado.'
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

async function submitQuoteRequest(payload: QuoteSubmission) {
  console.info('Mock de envio de orçamento GMAC:', payload)
  await new Promise((resolve) => window.setTimeout(resolve, 1100))
  return { ok: true }
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

const headerLogoStaticSrc = assetUrl('assets/gmac-logo-final-frame.png')

function HeaderLogo() {
  return (
    <span className="relative block h-14 w-[4.65rem] overflow-hidden sm:h-16 sm:w-[5.35rem]">
      <img
        src={headerLogoStaticSrc}
        alt="GMAC Metalúrgica"
        className="block h-full w-full select-none object-contain"
        width={1448}
        height={1086}
        draggable={false}
        decoding="async"
      />
    </span>
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-[#f3f7fb]/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl'
          : 'border-b border-slate-200/70 bg-[#f3f7fb]/92 shadow-lg shadow-slate-900/5 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <a
          href="#inicio"
          className="flex items-center gap-3"
          aria-label="GMAC Metalúrgica - início"
        >
          <HeaderLogo />
        </a>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Principal">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gmac-navy/78 transition hover:text-gmac-orange"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#orcamento"
          className="hidden brand-corners whitespace-nowrap bg-gmac-orange px-5 py-3 text-[0.72rem] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-orange-900/25 transition hover:-translate-y-0.5 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-white/80 xl:inline-flex"
        >
          Solicitar orçamento
        </a>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-gmac-navy/15 bg-white/70 text-gmac-navy backdrop-blur xl:hidden"
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
        className="overflow-hidden border-t border-slate-200/80 bg-[#f3f7fb]/98 backdrop-blur-xl xl:hidden"
      >
        <nav className="mx-auto grid max-w-7xl gap-1 px-5 py-4" aria-label="Mobile">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleNavigate}
              className="px-2 py-3 text-sm font-bold uppercase tracking-[0.16em] text-gmac-navy/78 transition hover:text-gmac-orange"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#orcamento"
            onClick={handleNavigate}
            className="mt-2 inline-flex items-center justify-center gap-2 bg-gmac-orange px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Solicitar orçamento
            <ArrowRight size={17} />
          </a>
        </nav>
      </motion.div>
    </header>
  )
}

function AnimatedSection({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 38 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
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

    scrollToCurrentHash()
    window.addEventListener('hashchange', scrollToCurrentHash)
    return () => window.removeEventListener('hashchange', scrollToCurrentHash)
  }, [])

  return null
}

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    if (reduceMotion) {
      setCount(value)
      return
    }

    let frame = 0
    const duration = 1100
    const start = performance.now()

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * value))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isInView, reduceMotion, value])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

function Hero() {
  const mounted = useMounted()
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 700], reduceMotion ? [0, 0] : [0, 76])

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
      className="relative isolate min-h-[100svh] overflow-hidden bg-gmac-ink text-white"
    >
      <motion.img
        src={assetUrl('assets/hero-cnc.png')}
        alt="Usinagem CNC de precisão com faíscas em ambiente industrial"
        style={{ y: mounted ? imageY : 0 }}
        className="absolute inset-0 h-[105%] w-full object-cover sm:h-[112%] lg:h-[115%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,35,0.95)_0%,rgba(3,18,35,0.76)_38%,rgba(3,18,35,0.38)_76%,rgba(3,18,35,0.74)_100%)]" />
      <div className="industrial-grid absolute inset-0 opacity-55" />
      <div className="absolute -left-28 top-24 hidden h-72 w-72 rotate-45 border border-white/10 sm:block" />
      <div className="absolute right-[7%] top-28 hidden h-24 w-24 rotate-45 border-8 border-gmac-orange/80 opacity-80 md:block" />
      <div className="absolute bottom-14 right-8 hidden h-40 w-40 rotate-45 border border-gmac-cyan/30 sm:block" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-12 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">
        <motion.div
          variants={container}
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          className="max-w-6xl"
        >
          <motion.div
            variants={item}
            className="mb-5 inline-flex max-w-full flex-wrap items-center gap-3 border border-white/14 bg-white/8 px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/88 backdrop-blur sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.2em]"
          >
            <span className="h-2 w-2 bg-gmac-orange" />
            <span>GMAC Metalúrgica</span>
          </motion.div>

          <motion.h1
            variants={item}
            className="hero-title max-w-6xl text-balance text-[2.2rem] font-black leading-[1.04] tracking-normal text-white min-[390px]:text-[2.55rem] sm:text-6xl lg:text-[4.35rem] xl:text-[5.1rem]"
          >
            <span className="block xl:whitespace-nowrap">PRECISÃO QUE TRANSFORMA</span>
            <span className="block xl:whitespace-nowrap">METAL EM SOLUÇÕES.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/92 sm:mt-7 sm:text-xl sm:leading-8"
          >
            Usinagem, caldeiraria e manutenção industrial com experiência,
            precisão e compromisso com cada projeto.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center"
          >
            <a
              href="#orcamento"
              className="brand-corners inline-flex w-full items-center justify-center gap-3 bg-gmac-orange px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white shadow-2xl shadow-orange-950/25 transition hover:-translate-y-0.5 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-white sm:w-auto sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.14em]"
            >
              Solicitar orçamento
              <ArrowRight size={18} />
            </a>
            <a
              href="#gmac"
              className="inline-flex w-full items-center justify-center gap-3 border border-white/18 bg-white/8 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-white/70 sm:w-auto sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.14em]"
            >
              Conheça a GMAC
            </a>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 grid max-w-3xl gap-3 sm:mt-12 sm:grid-cols-[0.8fr_1.2fr]"
          >
            <div className="border-l-4 border-gmac-orange bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-3xl font-black leading-none text-white">18</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                Anos de experiência
              </p>
            </div>
            <div className="border-l-4 border-gmac-cyan bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-white sm:text-base sm:tracking-[0.18em]">
                Usinagem - Caldeiraria - Manutenção industrial
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <a
        href="#gmac"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/58 transition hover:text-white md:flex"
        aria-label="Ir para a seção A GMAC"
      >
        <span>Scroll</span>
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-10 w-6 items-start justify-center border border-white/24 p-1"
        >
          <ArrowDown size={14} />
        </motion.span>
      </a>
    </section>
  )
}

function About() {
  const reduceMotion = useReducedMotion()
  const metricItem = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65 },
    },
  }

  return (
    <AnimatedSection
      id="gmac"
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="absolute left-0 top-0 hidden h-full w-1/3 bg-gmac-steel/60 xl:block" />
      <div className="absolute -right-16 top-20 hidden h-44 w-44 rotate-45 border-[18px] border-gmac-orange/10 sm:block" />
      <div className="relative mx-auto grid max-w-7xl gap-10 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
            A GMAC
          </p>
          <h2 className="mt-5 max-w-2xl text-balance text-3xl font-black leading-tight tracking-normal text-gmac-ink sm:text-4xl lg:text-5xl">
            ENGENHARIA, EXPERIÊNCIA E PRECISÃO.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-7 sm:text-lg sm:leading-8">
            A GMAC Metalúrgica atua com soluções industriais, unindo experiência
            técnica, capacidade produtiva e compromisso com a execução dos
            serviços.
          </p>

          <motion.div
            variants={container}
            initial={reduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3"
          >
            <motion.div
              variants={metricItem}
              className="border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/55 sm:p-5"
            >
              <p className="text-4xl font-black text-gmac-navy">
                <CountUp value={16} suffix="+" />
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Anos
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                de experiência
              </p>
            </motion.div>
            <motion.div
              variants={metricItem}
              className="border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/55 sm:p-5"
            >
              <p className="text-xl font-black uppercase tracking-[0.08em] text-gmac-navy">
                Precisão
              </p>
              <p className="mt-5 h-1 w-14 bg-gmac-orange" />
              <p className="mt-4 text-sm font-semibold text-slate-600">
                em cada etapa
              </p>
            </motion.div>
            <motion.div
              variants={metricItem}
              className="border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/55 sm:p-5"
            >
              <p className="text-xl font-black uppercase tracking-[0.08em] text-gmac-navy">
                Soluções industriais
              </p>
              <p className="mt-5 h-1 w-14 bg-gmac-cyan" />
              <p className="mt-4 text-sm font-semibold text-slate-600">
                sob medida
              </p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute -left-5 -top-5 hidden h-28 w-28 border-[12px] border-gmac-orange sm:block" />
          <div className="absolute -bottom-5 -right-5 hidden h-28 w-28 border-[12px] border-gmac-blue/80 sm:block" />
          <div className="relative overflow-hidden border border-slate-200 bg-gmac-ink shadow-2xl shadow-slate-300/70">
            <img
              src={assetUrl('assets/service-manutencao.png')}
              alt="Inspeção técnica em componente industrial"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-gmac-navy/72 via-transparent to-gmac-orange/16" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-gmac-navy/72 p-5 backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gmac-orange">
                Capacidade produtiva
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Soluções técnicas para demandas industriais.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function RoundLogoCarousel({
  images,
  imageWidth = 250,
  imageHeight = 156,
  spacing = 2.6,
  speed = 2,
  direction = 'right',
  drag = true,
  sensitivity = 4,
  tilt = -7,
  perspective = 2600,
  cornerRadius = 8,
  innerDim = 7,
}: {
  images: typeof clientLogos
  imageWidth?: number
  imageHeight?: number
  spacing?: number
  speed?: number
  direction?: 'right' | 'left'
  drag?: boolean
  sensitivity?: number
  tilt?: number
  perspective?: number
  cornerRadius?: number
  innerDim?: number
}) {
  const reduceMotion = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const rotYRef = useRef(0)
  const velRef = useRef(0)
  const lastRef = useRef(0)
  const dragRef = useRef({ active: false, x: 0 })
  const [size, setSize] = useState({ width: imageWidth, height: imageHeight })
  const [logosReady, setLogosReady] = useState(false)

  const items = images.length > 0 ? images : clientLogos
  const count = items.length
  const angle = 360 / count
  const factor = 1 + spacing * 0.15
  const radius = (size.width * factor) / (2 * Math.tan(Math.PI / count))
  const degPerSec = speed * 6 * (direction === 'left' ? -1 : 1)
  const faceBase: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: cornerRadius,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  }

  useEffect(() => {
    let cancelled = false

    const preloadLogos = async () => {
      await Promise.all(
        items.map(
          (logo) =>
            new Promise<void>((resolve) => {
              const image = new Image()
              image.decoding = 'async'
              image.onload = () => {
                image.decode?.().finally(resolve) ?? resolve()
              }
              image.onerror = () => resolve()
              image.src = logo.src
            }),
        ),
      )

      if (!cancelled) {
        setLogosReady(true)
      }
    }

    preloadLogos()

    return () => {
      cancelled = true
    }
  }, [items])

  const applyRingTransform = () => {
    const ring = ringRef.current
    if (!ring) return
    ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const measure = () => {
      const nextWidth = Math.min(imageWidth, Math.max(154, Math.round(host.clientWidth * 0.46)))
      const nextHeight = Math.round(nextWidth * (imageHeight / imageWidth))
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [imageHeight, imageWidth])

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return

    lastRef.current = 0
    applyRingTransform()

    if (reduceMotion || !logosReady) return

    const draw = (now: number) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0
      lastRef.current = now
      const frameDelta = Math.min(dt, 0.1)

      if (!dragRef.current.active) {
        if (Math.abs(velRef.current) > 0.01) {
          rotYRef.current += velRef.current * frameDelta
          velRef.current *= 0.94
        } else {
          rotYRef.current += degPerSec * frameDelta
        }
      }

      applyRingTransform()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [degPerSec, logosReady, radius, reduceMotion])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return

    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { active: true, x: event.clientX }
    velRef.current = 0
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return

    const dx = event.clientX - dragRef.current.x
    dragRef.current.x = event.clientX
    const strength = 0.3 * sensitivity
    rotYRef.current += dx * strength
    velRef.current = dx * strength * 60
    applyRingTransform()
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current.active = false
  }

  return (
    <div
      ref={hostRef}
      className="relative h-full min-h-[230px] w-full touch-none overflow-hidden sm:min-h-[270px] lg:min-h-[300px]"
      style={{
        cursor: drag ? 'grab' : 'default',
        perspective: `${perspective}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Carrossel de logos dos principais clientes"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            transform: `rotateX(${tilt}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            ref={ringRef}
            style={{
              height: size.height,
              position: 'relative',
              transformStyle: 'preserve-3d',
              width: size.width,
            }}
          >
            {items.map((logo, index) => (
              <div
                key={logo.src}
                style={{
                  inset: 0,
                  position: 'absolute',
                  transform: `rotateY(${index * angle}deg) translateZ(${radius}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className="flex h-full w-full items-center justify-center border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-7"
                  style={faceBase}
                >
                  <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                    {logo.alt}
                  </span>
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className={`relative h-full w-full select-none object-contain transition-opacity duration-300 ${logosReady ? 'opacity-100' : 'opacity-0'}`}
                    draggable={false}
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center border border-slate-200 bg-slate-100 p-5 shadow-xl shadow-slate-950/10 sm:p-7"
                  style={{
                    ...faceBase,
                    filter: `brightness(${innerDim / 10})`,
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <img
                    src={logo.src}
                    alt=""
                    className={`h-full w-full select-none object-contain transition-opacity duration-300 ${logosReady ? 'opacity-100' : 'opacity-0'}`}
                    draggable={false}
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Clients() {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatedSection
      id="clientes"
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="industrial-grid absolute inset-0 opacity-[0.16]" />
      <div className="absolute -right-12 top-16 hidden h-40 w-40 rotate-45 border-[14px] border-gmac-orange/10 sm:block" />
      <div className="absolute bottom-10 left-10 hidden h-28 w-28 rotate-45 border border-gmac-blue/15 md:block" />

      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
            Principais clientes
          </p>
          <h2 className="mt-5 text-balance text-3xl font-black leading-tight tracking-normal text-gmac-ink sm:text-4xl lg:text-5xl">
            MARCAS PRESENTES NA TRAJETÓRIA DA GMAC.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-7 sm:text-lg sm:leading-8">
            Algumas das marcas atendidas pela GMAC Metalúrgica em demandas
            industriais.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="relative min-h-[230px] overflow-hidden sm:min-h-[270px] lg:min-h-[300px]"
        >
          <div className="relative h-full">
            <RoundLogoCarousel images={clientLogos} />
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[number]
  index: number
}) {
  const Icon = service.icon
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 34 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, delay: index * 0.03 },
        },
      }}
      whileHover={reduceMotion ? undefined : { y: -8 }}
      className="group overflow-hidden border border-white/10 bg-[#0b1f35] shadow-2xl shadow-black/20"
    >
      <div className="relative overflow-hidden">
        <img
          src={service.image}
          alt={`Imagem industrial para ${service.title.toLowerCase()}`}
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gmac-ink/86 via-gmac-ink/10 to-transparent" />
        <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center border border-white/20 bg-gmac-navy text-gmac-orange">
          <Icon size={23} strokeWidth={2.2} />
        </div>
      </div>

      <div className="relative bg-[#0b1f35] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-10 bg-gmac-orange transition-all duration-300 group-hover:w-16" />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/42">
            Serviço
          </span>
        </div>
        <h3 className="text-xl font-black tracking-normal text-white sm:text-2xl">
          {service.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-300 sm:mt-4 sm:min-h-20 sm:text-[0.98rem] sm:leading-7">
          {service.description}
        </p>
        <a
          href="#orcamento"
          className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-gmac-orange transition group-hover:gap-3 group-hover:text-orange-300"
        >
          Saiba mais
          <ArrowRight size={17} />
        </a>
      </div>
    </motion.article>
  )
}

function Services() {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatedSection
      id="servicos"
      className="relative overflow-hidden bg-gmac-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="industrial-grid absolute inset-0 opacity-45" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gmac-orange/70 to-transparent" />
      <div className="absolute left-8 top-16 hidden h-36 w-36 rotate-45 border border-white/10 sm:block" />
      <div className="absolute bottom-20 right-10 hidden h-56 w-56 rotate-45 border-[18px] border-gmac-orange/10 md:block" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
              Serviços
            </p>
            <h2 className="mt-5 max-w-3xl text-balance text-3xl font-black leading-tight tracking-normal sm:text-4xl lg:text-5xl">
              SOLUÇÕES PARA A INDÚSTRIA
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-slate-300">
            Componentes, estruturas e suporte técnico para operações industriais
            que exigem precisão e continuidade.
          </p>
        </div>

        <motion.div
          variants={container}
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.14 }}
          className="mt-9 grid gap-4 sm:mt-12 md:grid-cols-2 xl:grid-cols-3"
        >
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function ProcessTimeline() {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatedSection
      id="processo"
      className="relative overflow-hidden bg-gmac-navy px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="industrial-grid absolute inset-0 opacity-35" />
      <div className="absolute -left-14 top-16 hidden h-44 w-44 rotate-45 border-[18px] border-gmac-orange/10 sm:block" />
      <div className="absolute bottom-14 right-16 hidden h-36 w-36 rotate-45 border border-gmac-cyan/25 sm:block" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-3 border border-white/12 bg-white/[0.07] px-4 py-2">
            <Workflow size={18} className="text-gmac-orange" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/66">
              Processo
            </span>
          </div>
          <h2 className="text-balance text-3xl font-black leading-tight tracking-normal sm:text-4xl lg:text-5xl">
            DO PRIMEIRO CONTATO À ENTREGA
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
            Cada etapa organiza a solicitação para dar clareza ao orçamento,
            à produção, à inspeção e à entrega final.
          </p>
        </div>

        <div className="mt-9 border border-white/10 bg-[#081d33] p-4 shadow-2xl shadow-black/20 sm:mt-12 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4 sm:mb-6">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-gmac-orange">
              Fluxo do atendimento
            </span>
            <span className="h-2 w-2 bg-gmac-cyan" />
          </div>

          <div className="relative hidden xl:block">
            <div className="absolute left-8 right-8 top-7 h-px bg-white/14" />
            <motion.div
              initial={reduceMotion ? false : { scaleX: 0 }}
              whileInView={reduceMotion ? undefined : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.1 }}
              className="absolute left-8 right-8 top-7 h-px origin-left bg-gmac-orange"
            />

            <ol className="grid grid-cols-7 gap-4">
              {processSteps.map((step, index) => (
                <motion.li
                  key={step.number}
                  initial={reduceMotion ? false : { opacity: 0, y: 26 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.58, delay: index * 0.08 }}
                  className="relative"
                >
                  <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center border-4 border-gmac-navy bg-gmac-orange text-sm font-black text-white shadow-xl shadow-black/20">
                    {step.number}
                  </div>
                  <div className="h-48 border border-white/10 bg-[#102940] p-5 shadow-2xl shadow-black/20">
                    <h3 className="text-base font-black tracking-normal text-white">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

          <ol className="relative grid gap-4 xl:hidden">
            <div className="absolute bottom-8 left-6 top-8 w-px bg-white/14" />
            {processSteps.map((step, index) => (
              <motion.li
                key={step.number}
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: index * 0.05 }}
                className="relative grid grid-cols-[2.5rem_1fr] gap-3 sm:grid-cols-[3rem_1fr] sm:gap-4"
              >
                <div className="relative z-10 flex h-10 w-10 items-center justify-center bg-gmac-orange text-xs font-black text-white shadow-xl shadow-black/20 sm:h-12 sm:w-12 sm:text-sm">
                  {step.number}
                </div>
                <div className="border border-white/10 bg-[#102940] p-4 shadow-2xl shadow-black/20 sm:p-5">
                  <h3 className="text-base font-black tracking-normal text-white sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </AnimatedSection>
  )
}

function GalleryCard({
  item,
  index,
}: {
  item: (typeof galleryItems)[number]
  index: number
}) {
  const Icon = item.icon
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay: index * 0.06 }}
      className={`group relative h-full min-h-[18rem] overflow-hidden border border-slate-200 bg-gmac-ink shadow-xl shadow-slate-200/60 sm:min-h-[22rem] xl:min-h-0 ${item.className}`}
    >
      <img
        src={item.image}
        alt={item.title}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gmac-ink/92 via-gmac-ink/12 to-transparent opacity-85 transition group-hover:opacity-95" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center border border-white/18 bg-gmac-navy/80 text-gmac-orange backdrop-blur transition group-hover:-translate-y-1 sm:mb-4 sm:h-11 sm:w-11">
          <Icon size={22} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gmac-orange">
          {item.label}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-normal text-white sm:text-2xl">
          {item.title}
        </h3>
      </div>
    </motion.article>
  )
}

function Gallery() {
  return (
    <AnimatedSection
      id="galeria"
      className="relative overflow-hidden bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="absolute -right-16 top-20 hidden h-44 w-44 rotate-45 border-[18px] border-gmac-orange/10 sm:block" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
              Galeria
            </p>
            <h2 className="mt-5 max-w-3xl text-balance text-3xl font-black leading-tight tracking-normal text-gmac-ink sm:text-4xl lg:text-5xl">
              PORTFÓLIO INDUSTRIAL EM DETALHE
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-slate-600">
            Usinagem, máquinas, peças, acabamento, caldeiraria, equipe e
            ambiente industrial em uma composição visual premium.
          </p>
        </div>

        <div className="mt-12 hidden grid-cols-4 auto-rows-[220px] gap-4 xl:grid">
          {galleryItems.map((item, index) => (
            <GalleryCard key={item.title} item={item} index={index} />
          ))}
        </div>

        <div className="relative mt-8 sm:mt-10 xl:hidden">
          <div
            className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {galleryItems.map((item, index) => (
              <div key={item.title} className="min-w-[82%] snap-center md:min-w-[46%] lg:min-w-[36%]">
                <GalleryCard item={item} index={index} />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-5 right-0 top-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/86 to-transparent" />
        </div>
      </div>
    </AnimatedSection>
  )
}

function Quality() {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatedSection
      id="qualidade"
      className="relative overflow-hidden bg-[#071a2c] px-4 py-16 text-white sm:bg-gmac-ink sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
    >
      <div className="industrial-grid absolute inset-0 hidden opacity-35 sm:block" />
      <div className="absolute right-8 top-16 hidden h-52 w-52 rotate-45 border border-gmac-cyan/20 sm:block" />
      <div className="absolute bottom-10 left-10 hidden h-36 w-36 rotate-45 border-[14px] border-gmac-orange/10 sm:block" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
            Qualidade
          </p>
          <h2 className="mt-5 text-balance text-3xl font-black leading-tight tracking-normal sm:text-4xl lg:text-5xl">
            PRECISÃO EM CADA DETALHE
          </h2>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Na prática, qualidade aparece no cuidado com o desenho, na escolha
            do processo, na conferência das medidas e na entrega combinada.
          </p>
        </div>

        <motion.div
          variants={container}
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-9 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {qualityItems.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.label}
                variants={{
                  hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, delay: index * 0.04 },
                  },
                }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
                className="group border border-white/14 bg-[#0d2b45] p-5 shadow-2xl shadow-black/25 sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center border border-white/14 bg-gmac-navy text-gmac-orange transition group-hover:border-gmac-orange/70 group-hover:bg-gmac-orange group-hover:text-white">
                  <Icon size={23} />
                </div>
                <p className="mt-6 text-base font-black uppercase tracking-[0.08em] sm:mt-7 sm:text-lg sm:tracking-[0.1em]">
                  {item.label}
                </p>
                <span className="mt-4 block h-px w-10 bg-gmac-orange transition-all duration-300 group-hover:w-20" />
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-red-600">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
      {message}
    </p>
  )
}

function QuoteForm() {
  const [form, setForm] = useState<QuoteFormState>(initialQuoteForm)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<QuoteFormErrors>({})
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()
  const descriptionCount = form.description.length
  const notesCount = form.notes.length

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

    const validation = validateQuoteForm(form, files)
    setErrors(validation)

    if (Object.keys(validation).length > 0) {
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
      const response = await submitQuoteRequest({
        ...form,
        files: files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      })

      if (response.ok) {
        setSubmitted(true)
        setForm(initialQuoteForm)
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedSection
      id="orcamento"
      className="relative overflow-hidden bg-white px-3 py-14 sm:px-4 sm:py-16 lg:px-4 lg:py-20"
    >
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gmac-steel/55" />
      <div className="absolute -left-14 top-24 h-40 w-40 rotate-45 border-[16px] border-gmac-orange/10" />

      <div className="relative mx-auto grid w-full max-w-[96rem] items-stretch gap-4 xl:grid-cols-[0.3fr_0.7fr] xl:gap-0">
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, x: -26 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="relative hidden h-full overflow-hidden bg-gmac-navy p-6 text-white shadow-2xl shadow-slate-300/70 xl:block xl:p-7"
        >
          <img
            src={assetUrl('assets/hero-cnc.png')}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-28"
          />
          <div className="absolute inset-0 bg-gmac-navy/88" />
          <div className="industrial-grid absolute inset-0 opacity-35" />
          <div className="absolute bottom-8 right-8 h-28 w-28 rotate-45 border border-gmac-cyan/35" />

          <div className="relative">
            <img
              src={assetUrl('assets/gmac-logo-final-frame.png')}
              alt="GMAC Metalúrgica"
              className="h-20 w-auto object-contain"
            />
            <div className="mt-7 h-px w-20 bg-gmac-orange" />
            <h2 className="mt-6 text-3xl font-black leading-tight tracking-normal">
              Solicite seu orçamento
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Informe os dados técnicos do serviço para que a solicitação siga
              com clareza desde o primeiro contato.
            </p>

            <div className="mt-7 grid gap-3">
              {[
                'Dados da empresa e contato',
                'Tipo de serviço e material',
                'Descrição técnica e arquivos',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gmac-orange" />
                  <span className="text-sm font-bold text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <motion.form
          noValidate
          onSubmit={handleSubmit}
          initial={reduceMotion ? false : { opacity: 0, x: 26 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.7 }}
          className="border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70 sm:p-5 lg:p-6"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
              Orçamento
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black leading-tight tracking-normal text-gmac-ink sm:text-3xl lg:text-4xl">
              SOLICITAR ORÇAMENTO
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Preencha as informações abaixo com os detalhes do serviço
              desejado. Responderemos o mais rápido possível.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-black">Solicitação enviada com sucesso.</p>
                <p className="mt-1 text-sm font-semibold">
                  A equipe da GMAC retornará pelo contato informado.
                </p>
              </div>
            </motion.div>
          ) : null}

          <fieldset className="mt-7">
            <legend className="mb-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-gmac-navy">
              <span className="h-6 w-1 bg-gmac-orange" />
              Dados da empresa
            </legend>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="companyName" className="text-sm font-black text-gmac-ink">
                  Nome da empresa *
                </label>
                <input
                  id="companyName"
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                  aria-invalid={Boolean(errors.companyName)}
                  autoComplete="organization"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Digite o nome da empresa"
                />
                <FieldError message={errors.companyName} />
              </div>

              <div>
                <label htmlFor="cnpj" className="text-sm font-black text-gmac-ink">
                  CNPJ *
                </label>
                <input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(event) => updateField('cnpj', formatCnpj(event.target.value))}
                  aria-invalid={Boolean(errors.cnpj)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="00.000.000/0000-00"
                />
                <FieldError message={errors.cnpj} />
              </div>

              <div>
                <label htmlFor="contactName" className="text-sm font-black text-gmac-ink">
                  Nome do contato *
                </label>
                <input
                  id="contactName"
                  value={form.contactName}
                  onChange={(event) => updateField('contactName', event.target.value)}
                  aria-invalid={Boolean(errors.contactName)}
                  autoComplete="name"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Digite o nome do contato"
                />
                <FieldError message={errors.contactName} />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-black text-gmac-ink">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="exemplo@empresa.com.br"
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-black text-gmac-ink">
                  Telefone *
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                  aria-invalid={Boolean(errors.phone)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="(00) 00000-0000"
                />
                <FieldError message={errors.phone} />
              </div>

              <div>
                <label htmlFor="role" className="text-sm font-black text-gmac-ink">
                  Cargo / Função
                </label>
                <input
                  id="role"
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value)}
                  autoComplete="organization-title"
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Digite o cargo ou função"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-7 border-t border-slate-200 pt-6">
            <legend className="mb-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-gmac-navy">
              <span className="h-6 w-1 bg-gmac-orange" />
              Informações do serviço
            </legend>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="serviceType" className="text-sm font-black text-gmac-ink">
                  Tipo de serviço *
                </label>
                <select
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(event) => updateField('serviceType', event.target.value)}
                  aria-invalid={Boolean(errors.serviceType)}
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">Selecione o tipo de serviço</option>
                  {serviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.serviceType} />
              </div>

              <div>
                <label htmlFor="material" className="text-sm font-black text-gmac-ink">
                  Material principal
                </label>
                <input
                  id="material"
                  value={form.material}
                  onChange={(event) => updateField('material', event.target.value)}
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Ex.: Aço carbono, Alumínio, Inox"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="text-sm font-black text-gmac-ink">
                  Quantidade estimada
                </label>
                <input
                  id="quantity"
                  value={form.quantity}
                  onChange={(event) => updateField('quantity', event.target.value)}
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Ex.: 10 peças"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="dimensions" className="text-sm font-black text-gmac-ink">
                  Dimensões / referências técnicas
                </label>
                <input
                  id="dimensions"
                  value={form.dimensions}
                  onChange={(event) => updateField('dimensions', event.target.value)}
                  className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Ex.: medidas, tolerâncias ou acabamento"
                />
              </div>
            </div>
          </fieldset>

          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="description" className="text-sm font-black text-gmac-ink">
                Descrição detalhada *
              </label>
              <span className="text-xs font-bold text-slate-400">{descriptionCount}/1000</span>
            </div>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              aria-invalid={Boolean(errors.description)}
              maxLength={1000}
              rows={3}
              className="mt-2 w-full resize-y border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-6 text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
              placeholder="Descreva o serviço em detalhes, incluindo dimensões, tolerâncias, acabamentos, processos desejados e outras informações importantes."
            />
            <FieldError message={errors.description} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-black text-gmac-ink">Arquivos</p>
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
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-4 text-center outline-none transition focus:border-gmac-orange focus:ring-4 focus:ring-orange-100 ${
                isDragging
                  ? 'border-gmac-orange bg-orange-50'
                  : 'border-slate-300 bg-slate-50 hover:border-gmac-orange hover:bg-white'
              }`}
            >
              <UploadCloud className="h-7 w-7 text-gmac-orange" />
              <span className="mt-2 text-xs font-black text-gmac-ink sm:text-sm">
                Arraste seus arquivos aqui ou clique para selecionar
              </span>
              <span className="mt-1 text-xs font-bold text-slate-500">
                PDF, DWG, DXF, JPG e PNG
              </span>
              <span className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                Até {formatFileSize(maxFileSize)} por arquivo e {formatFileSize(maxTotalFileSize)} no total
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
                    className="flex items-center justify-between gap-3 border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 flex-none text-gmac-blue" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-gmac-ink">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="flex h-9 w-9 flex-none items-center justify-center border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                      aria-label={`Remover arquivo ${file.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="deadline" className="text-sm font-black text-gmac-ink">
                Prazo desejado
              </label>
              <input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gmac-ink outline-none transition focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label htmlFor="notes" className="text-sm font-black text-gmac-ink">
                  Observações adicionais
                </label>
                <span className="text-xs font-bold text-slate-400">{notesCount}/500</span>
              </div>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                maxLength={500}
                rows={3}
                className="mt-2 w-full resize-y border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-6 text-gmac-ink outline-none transition placeholder:text-slate-400 focus:border-gmac-orange focus:bg-white focus:ring-4 focus:ring-orange-100"
                placeholder="Informações adicionais que possam ajudar na elaboração do orçamento."
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="brand-corners inline-flex w-full items-center justify-center gap-2 bg-gmac-orange px-4 py-3 text-center text-[0.72rem] font-black uppercase leading-5 tracking-[0.04em] text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:gap-3 sm:px-6 sm:text-sm sm:tracking-[0.14em]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando solicitação
                </>
              ) : (
                <>
                  Enviar solicitação de orçamento
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs font-bold text-slate-500">
              🔒 Seus dados estão seguros conosco.
            </p>
          </div>
        </motion.form>
      </div>
    </AnimatedSection>
  )
}

function Contact() {
  return (
    <section
      id="contato"
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32"
      aria-label="Contato"
    >
      <div className="absolute left-0 top-0 h-full w-1/3 bg-gmac-steel/50" />
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch xl:gap-10">
        <div className="border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7 xl:p-9">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gmac-orange">
            Contato
          </p>
          <h2 className="mt-5 text-balance text-3xl font-black leading-tight tracking-normal text-gmac-ink sm:text-4xl xl:text-5xl">
            VAMOS CONVERSAR SOBRE SEU PROJETO
          </h2>

          <div className="mt-7 grid gap-6 sm:mt-9">
            <div>
              <p className="text-xl font-black text-gmac-navy">
                GMAC METALÚRGICA
              </p>
              <div className="mt-4 flex gap-3 text-slate-600">
                <MapPin className="mt-1 h-5 w-5 flex-none text-gmac-orange" />
                <p className="leading-7">
                  Av. Banco do Nordeste, Nº 35 - CIS
                  <span className="block">Feira de Santana - BA</span>
                </p>
              </div>
              <a
                href={whatsappContactUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-3 text-lg font-black text-gmac-blue transition hover:text-gmac-orange"
              >
                <Phone size={20} />
                (75) 3616-6626
              </a>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={whatsappContactUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-gmac-navy bg-gmac-navy px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-gmac-blue"
              >
                Ligar
                <Phone size={17} />
              </a>
              <a
                href="#orcamento"
                className="inline-flex items-center justify-center gap-2 border border-gmac-orange bg-gmac-orange px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-orange-500"
              >
                Solicitar orçamento
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-300/70 sm:min-h-[22rem] lg:min-h-[24rem]">
          <iframe
            title="Mapa da GMAC Metalúrgica"
            src={gmacMapsEmbedUrl}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-gmac-navy/62 to-transparent" />
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 sm:left-5 sm:top-5 sm:max-w-[calc(100%-2.5rem)] sm:gap-3">
            <div className="flex items-center gap-2 border border-white/20 bg-gmac-navy/88 px-3 py-2 text-white shadow-xl shadow-slate-900/20 backdrop-blur">
              <MapPin className="h-4 w-4 text-gmac-orange" />
              <span className="text-[0.68rem] font-black uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.16em]">
                GMAC Metalúrgica
              </span>
            </div>
            <a
              href={gmacMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center border border-gmac-orange bg-gmac-orange px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-orange-950/20 transition hover:bg-orange-500 sm:text-xs sm:tracking-[0.12em]"
            >
              Abrir mapa
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gmac-ink px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src={assetUrl('assets/gmac-logo-final-frame.png')}
            alt="GMAC Metalúrgica"
            className="h-14 w-auto object-contain sm:h-16"
          />
          <div>
            <p className="text-lg font-black uppercase tracking-[0.1em]">
              GMAC Metalúrgica
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Usinagem - Caldeiraria - Manutenção Industrial
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 lg:justify-end" aria-label="Rodapé">
          {footerLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs font-black uppercase tracking-[0.16em] text-white/62 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 GMAC Metalúrgica. Todos os direitos reservados.</p>
        <p className="font-semibold text-slate-500">
          Usinagem - Caldeiraria - Manutenção Industrial
        </p>
      </div>
    </footer>
  )
}

function App() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <HashScrollHandler />
      <Header />
      <Hero />
      <About />
      <Clients />
      <Services />
      <ProcessTimeline />
      <Gallery />
      <Quality />
      <QuoteForm />
      <Contact />
      <Footer />
    </main>
  )
}

export default App
