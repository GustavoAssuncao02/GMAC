import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
  Timer,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'

const design2AssetBase = window.location.pathname.replace(/\/+$/, '').endsWith('/design2') ? '../' : import.meta.env.BASE_URL
const assetUrl = (path: string) => `${design2AssetBase}${path.replace(/^\/+/, '')}`

const whatsappContactUrl =
  'https://wa.me/557536166626?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20GMAC%20sobre%20um%20projeto.'

const services = [
  {
    title: 'Usinagem',
    label: 'Precisão',
    description: 'Fabricação e usinagem de componentes e peças conforme necessidade do projeto.',
    image: 'assets/service-usinagem.png',
    icon: Cog,
  },
  {
    title: 'Caldeiraria',
    label: 'Estruturas',
    description: 'Fabricação e montagem de estruturas e componentes metálicos.',
    image: 'assets/service-caldeiraria.png',
    icon: Hammer,
  },
  {
    title: 'Manutenção industrial',
    label: 'Continuidade',
    description: 'Serviços voltados à manutenção e continuidade da operação industrial.',
    image: 'assets/service-manutencao.png',
    icon: Wrench,
  },
  {
    title: 'Corte a laser',
    label: 'Componentes',
    description: 'Soluções de corte para componentes e projetos metálicos.',
    image: 'assets/service-laser.png',
    icon: Zap,
  },
  {
    title: 'Serviços externos',
    label: 'Integração',
    description: 'Integração e acompanhamento de serviços complementares.',
    image: 'assets/service-externos.png',
    icon: CheckCircle2,
  },
] satisfies Array<{
  title: string
  label: string
  description: string
  image: string
  icon: LucideIcon
}>

const processSteps = [
  ['01', 'Solicitação', 'O cliente apresenta sua necessidade.'],
  ['02', 'Levantamento', 'Coleta de dados técnicos, medidas, materiais e desenhos.'],
  ['03', 'Orçamento', 'Análise e preparação da proposta.'],
  ['04', 'Autorização', 'Aprovação e liberação do serviço.'],
  ['05', 'Produção', 'Execução acompanhada e registrada.'],
  ['06', 'Inspeção', 'Controle de qualidade.'],
  ['07', 'Entrega', 'Conclusão e liberação.'],
]

const galleryItems = [
  ['Usinagem de precisão', 'USINAGEM', 'assets/service-usinagem.png', Cog],
  ['Medição técnica', 'PRECISÃO', 'assets/gallery-medicao.png', Ruler],
  ['Acabamento metálico', 'ACABAMENTO', 'assets/gallery-acabamento.png', ScanLine],
  ['Caldeiraria industrial', 'CALDEIRARIA', 'assets/service-caldeiraria.png', Hammer],
  ['Corte a laser', 'CORTE A LASER', 'assets/service-laser.png', Zap],
  ['Equipe e operação', 'EQUIPE', 'assets/gallery-equipe.png', Wrench],
] as const

const qualityItems = [
  ['Leitura técnica', 'Entendimento do desenho, medidas e aplicação antes da fabricação.', FileText],
  ['Processo adequado', 'Usinagem, caldeiraria ou manutenção direcionada para cada necessidade.', Cog],
  ['Conferência', 'Verificação de medidas, acabamento e encaixe durante a execução.', ScanLine],
  ['Prazo combinado', 'Organização da produção para cumprir o que foi alinhado com o cliente.', Timer],
  ['Entrega confiável', 'Peças e serviços finalizados com atenção ao uso real na operação.', ShieldCheck],
] as const

const clients = [
  ['assets/clientes/belgo-bekaert.png', 'Belgo Bekaert'],
  ['assets/clientes/sapelba.jpg', 'Sapelba'],
  ['assets/clientes/nestle.png', 'Nestlé'],
  ['assets/clientes/placo.png', 'Placo'],
  ['assets/clientes/vipal-borrachas.png', 'VIPAL Borrachas'],
]

const gmacMapsUrl = 'https://maps.app.goo.gl/3bDoAFrJBzZQBZNv7'
const gmacMapsEmbedUrl =
  'https://www.google.com/maps?q=GMAC%20Metal%C3%BArgica%2C%20Feira%20de%20Santana%20BA&ll=-12.2958308,-38.9613785&z=17&output=embed'

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(7px)' }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionIntro({ eyebrow, title, children, dark = false }: {
  eyebrow: string
  title: string
  children?: React.ReactNode
  dark?: boolean
}) {
  return (
    <div className={`d2-section-intro ${dark ? 'd2-section-intro--dark' : ''}`}>
      <span className="d2-eyebrow"><i />{eyebrow}</span>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  )
}

function Design2Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    ['Início', '#inicio'],
    ['A GMAC', '#gmac'],
    ['Serviços', '#servicos'],
    ['Processo', '#processo'],
    ['Projetos', '#projetos'],
    ['Contato', '#contato'],
  ]

  return (
    <header className={`d2-header ${scrolled ? 'd2-header--scrolled' : ''}`}>
      <div className="d2-shell d2-header__inner">
        <a href="#inicio" className="d2-logo" aria-label="GMAC Metalúrgica - início">
          <img src={assetUrl('assets/gmac-logo-final-frame.png')} alt="GMAC Metalúrgica" />
        </a>
        <nav className="d2-nav" aria-label="Principal">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <a href="#orcamento" className="d2-button d2-button--orange d2-header__cta">
          Solicitar orçamento <ArrowRight size={17} />
        </a>
        <button
          type="button"
          className="d2-menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <motion.nav
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="d2-mobile-nav"
        aria-label="Menu mobile"
      >
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a href="#orcamento" className="d2-button d2-button--orange" onClick={() => setOpen(false)}>Solicitar orçamento <ArrowRight size={17} /></a>
      </motion.nav>
    </header>
  )
}

function Design2Hero() {
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 700], reduced ? [0, 0] : [0, 80])

  return (
    <section id="inicio" className="d2-hero">
      <motion.img
        src={assetUrl('assets/hero-cnc.png')}
        alt="Usinagem CNC de precisão com faíscas em ambiente industrial"
        style={{ y: imageY }}
        className="d2-hero__image"
      />
      <div className="d2-hero__overlay" />
      <div className="d2-grid d2-grid--hero" />
      <div className="d2-hero__orb" />
      <div className="d2-shell d2-hero__content">
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.15 }}
          className="d2-hero__copy"
        >
          <span className="d2-kicker">Da ideia à operação</span>
          <h1>Precisão industrial.<br /><em>Soluções que movem</em><br />a sua operação.</h1>
          <p>Usinagem, caldeiraria e manutenção industrial com experiência, precisão e compromisso com cada projeto.</p>
          <div className="d2-hero__actions">
            <a href="#orcamento" className="d2-button d2-button--orange">Solicitar orçamento <ArrowRight size={18} /></a>
            <a href="#servicos" className="d2-button d2-button--outline">Conheça nossos serviços <ArrowDownRight size={18} /></a>
          </div>
          <div className="d2-hero__meta">
            <span><MapPin size={15} /> Feira de Santana — BA</span>
            <span className="d2-meta-rule" />
            <span>Indústria que faz mais</span>
          </div>
        </motion.div>
        <div className="d2-hero__side-note">Pessoas<br />Processos<br />Resultados</div>
      </div>
      <a href="#gmac" className="d2-scroll-cue"><span>Role para explorar</span><ChevronDown size={17} /></a>
    </section>
  )
}

function TrustBand() {
  return (
    <section className="d2-trust" aria-label="Diferenciais">
      <div className="d2-shell d2-trust__grid">
        <div className="d2-trust__item"><Timer /><strong><b>18</b> anos de experiência</strong><span>Tradição e confiança no setor industrial.</span></div>
        <div className="d2-trust__item"><Ruler /><strong>Engenharia<br />sob medida</strong><span>Soluções desenvolvidas para a sua necessidade.</span></div>
        <div className="d2-trust__item"><Wrench /><strong>Atendimento<br />industrial</strong><span>Parceria do projeto à operação.</span></div>
        <div className="d2-trust__aside">Precisão<br />produção<br />confiança</div>
      </div>
    </section>
  )
}

function AboutDesign2() {
  return (
    <section id="gmac" className="d2-section d2-about">
      <div className="d2-shell d2-about__grid">
        <Reveal><SectionIntro eyebrow="A GMAC" title="Engenharia, experiência e precisão."><>A GMAC Metalúrgica atua com soluções industriais, unindo experiência técnica, capacidade produtiva e compromisso com a execução dos serviços.</></SectionIntro>
          <div className="d2-metrics">
            <div><strong>18<span>+</span></strong><small>Anos de experiência</small></div>
            <div><strong>Precisão</strong><small>Em cada etapa</small></div>
            <div><strong>Soluções</strong><small>Industriais sob medida</small></div>
          </div>
        </Reveal>
        <Reveal className="d2-about__visual">
          <div className="d2-corner d2-corner--orange" />
          <img src={assetUrl('assets/service-manutencao.png')} alt="Inspeção técnica em componente industrial" />
          <div className="d2-photo-caption"><span>Capacidade produtiva</span><strong>Soluções técnicas para demandas industriais.</strong></div>
        </Reveal>
      </div>
    </section>
  )
}

function ClientStrip() {
  const repeated = [...clients, ...clients]
  return (
    <section id="clientes" className="d2-clients">
      <div className="d2-shell d2-clients__head"><SectionIntro eyebrow="Trajetória" title="Marcas presentes na trajetória da GMAC."><>Algumas das marcas atendidas pela GMAC Metalúrgica em demandas industriais.</></SectionIntro><span className="d2-client-count"></span></div>
      <div className="d2-client-window"><motion.div className="d2-client-track" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>{repeated.map(([src, alt], index) => <div className="d2-client-logo" key={`${alt}-${index}`}><img src={assetUrl(src)} alt={alt} /></div>)}</motion.div></div>
    </section>
  )
}

function ServicesDesign2() {
  return (
    <section id="servicos" className="d2-section d2-services">
      <div className="d2-grid d2-grid--dark" />
      <div className="d2-shell"><Reveal><SectionIntro eyebrow="O que fazemos" title="Soluções industriais completas" dark><>Componentes, estruturas e suporte técnico para operações industriais que exigem precisão e continuidade.</></SectionIntro></Reveal>
        <div className="d2-service-grid">{services.map((service, index) => { const Icon = service.icon; return <Reveal key={service.title} className={index === 0 ? 'd2-service-card d2-service-card--featured' : 'd2-service-card'}><div className="d2-service-image"><img src={assetUrl(service.image)} alt={`Imagem industrial para ${service.title}`} /><span><Icon size={21} /></span></div><div className="d2-service-body"><small>{service.label}</small><h3>{service.title}</h3><p>{service.description}</p><a href="#orcamento">Saiba mais <ArrowRight size={16} /></a></div></Reveal> })}</div>
      </div>
    </section>
  )
}

function StructureDesign2() {
  return (
    <section className="d2-structure">
      <img src={assetUrl('assets/gallery-equipe.png')} alt="Equipe e operação em ambiente industrial" />
      <div className="d2-structure__overlay" />
      <div className="d2-shell d2-structure__content"><Reveal><SectionIntro eyebrow="Nossa estrutura" title="Estrutura preparada para grandes desafios" dark><>Contamos com soluções técnicas e experiência para atender projetos de diferentes portes e complexidades.</></SectionIntro><a href="#projetos" className="d2-button d2-button--outline">Conheça nossos projetos <ArrowRight size={18} /></a></Reveal><div className="d2-structure__stamp"><span>GMAC</span><small>Metalúrgica<br />Feira de Santana — BA</small></div></div>
    </section>
  )
}

function ProcessDesign2() {
  return (
    <section id="processo" className="d2-section d2-process">
      <div className="d2-shell"><Reveal><SectionIntro eyebrow="Processo" title="Do primeiro contato à entrega"><>Cada etapa organiza a solicitação para dar clareza ao orçamento, à produção, à inspeção e à entrega final.</></SectionIntro></Reveal><div className="d2-process-list">{processSteps.map(([number, title, description], index) => <Reveal key={number} delay={index * 0.1} className="d2-process-step"><span className="d2-process-number">{number}</span><div><small>Etapa {index + 1}</small><h3>{title}</h3><p>{description}</p></div></Reveal>)}</div></div>
    </section>
  )
}

function ProjectsDesign2() {
  return (
    <section id="projetos" className="d2-section d2-projects"><div className="d2-shell"><Reveal><SectionIntro eyebrow="Projetos" title="Portfólio industrial em detalhe"><>Usinagem, máquinas, peças, acabamento, caldeiraria, equipe e ambiente industrial em uma composição visual premium.</></SectionIntro></Reveal><div className="d2-project-grid">{galleryItems.map(([title, label, image, Icon], index) => <Reveal key={title} className={`d2-project d2-project--${index + 1}`}><img src={assetUrl(image)} alt={title} /><div className="d2-project__veil" /><div className="d2-project__caption"><Icon size={20} /><small>{label}</small><h3>{title}</h3></div></Reveal>)}</div></div></section>
  )
}

function QualityDesign2() {
  return (
    <section className="d2-section d2-quality"><div className="d2-grid d2-grid--dark" /><div className="d2-shell"><Reveal><SectionIntro eyebrow="Qualidade" title="Precisão em cada detalhe" dark><>Na prática, qualidade aparece no cuidado com o desenho, na escolha do processo, na conferência das medidas e na entrega combinada.</></SectionIntro></Reveal><div className="d2-quality-grid">{qualityItems.map(([title, description, Icon]) => <Reveal key={title} className="d2-quality-card"><Icon size={24} /><small>{title}</small><span /><p>{description}</p></Reveal>)}</div></div></section>
  )
}

type FormState = { companyName: string; cnpj: string; contactName: string; email: string; phone: string; role: string; serviceType: string; material: string; quantity: string; dimensions: string; description: string; deadline: string; notes: string }
const emptyForm: FormState = { companyName: '', cnpj: '', contactName: '', email: '', phone: '', role: '', serviceType: '', material: '', quantity: '', dimensions: '', description: '', deadline: '', notes: '' }

function QuoteDesign2() {
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const update = (field: keyof FormState, value: string) => { setSubmitted(false); setError(''); setForm((current) => ({ ...current, [field]: value })) }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const acceptedExtensions = ['pdf', 'dwg', 'dxf', 'jpg', 'jpeg', 'png']
    const invalidFile = files.some((file) => !acceptedExtensions.includes(file.name.split('.').pop()?.toLowerCase() ?? '') || file.size > 10 * 1024 * 1024)
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0)
    if (!form.companyName.trim() || form.cnpj.replace(/\D/g, '').length !== 14 || !form.contactName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.phone.replace(/\D/g, '').length < 10 || !form.serviceType || !form.description.trim() || invalidFile || totalFileSize > 25 * 1024 * 1024) { setError('Preencha os campos obrigatórios com dados válidos e verifique os arquivos anexados.'); return }
    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    setIsSubmitting(false)
    setSubmitted(true)
    setForm(emptyForm)
    setFiles([])
  }
  const input = (field: keyof FormState, label: string, placeholder: string, required = false, type = 'text') => <label className="d2-field"><span>{label}{required ? ' *' : ''}</span><input type={type} value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></label>

  return (
    <section id="orcamento" className="d2-section d2-quote"><div className="d2-shell d2-quote__grid"><Reveal className="d2-quote__copy"><SectionIntro eyebrow="Fale com a GMAC" title="Vamos falar sobre o seu projeto?"><>Nossa equipe está pronta para entender a sua necessidade e preparar uma proposta sob medida, com agilidade e foco em resultado.</></SectionIntro><div className="d2-contact-lines"><a href={whatsappContactUrl} target="_blank" rel="noreferrer"><Phone size={21} /><span><small>Telefone / WhatsApp</small>(75) 3616-6626</span></a><div><MapPin size={21} /><span><small>Localização</small>Feira de Santana — BA</span></div></div></Reveal><Reveal className="d2-quote__form-wrap"><form className="d2-quote-form" onSubmit={submit} noValidate><div className="d2-form-head"><span className="d2-eyebrow"><i />Orçamento</span><h2>Solicitar orçamento</h2><p>Preencha as informações abaixo com os detalhes do serviço desejado. Responderemos o mais rápido possível.</p></div>{submitted ? <div className="d2-success" role="status"><CheckCircle2 size={20} /> Solicitação enviada com sucesso. A equipe da GMAC retornará pelo contato informado.</div> : null}{error ? <p className="d2-form-error" role="alert">{error}</p> : null}<fieldset><legend>Dados da empresa</legend><div className="d2-form-grid">{input('companyName', 'Nome da empresa', 'Digite o nome da empresa', true)}{input('cnpj', 'CNPJ', '00.000.000/0000-00', true)}{input('contactName', 'Nome do contato', 'Digite o nome do contato', true)}{input('email', 'E-mail', 'exemplo@empresa.com.br', true, 'email')}{input('phone', 'Telefone', '(00) 00000-0000', true, 'tel')}{input('role', 'Cargo / Função', 'Digite o cargo ou função')}</div></fieldset><fieldset><legend>Informações do serviço</legend><div className="d2-form-grid"> <label className="d2-field"><span>Tipo de serviço *</span><select value={form.serviceType} onChange={(event) => update('serviceType', event.target.value)} required><option value="">Selecione o tipo de serviço</option><option>Usinagem</option><option>Caldeiraria</option><option>Manutenção industrial</option><option>Pintura</option><option>Corte a laser</option><option>Serviço externo</option><option>Outro</option></select></label>{input('material', 'Material principal', 'Ex.: Aço carbono, Alumínio, Inox')}{input('quantity', 'Quantidade estimada', 'Ex.: 10 peças')}{input('dimensions', 'Dimensões / referências técnicas', 'Ex.: medidas, tolerâncias ou acabamento')}<label className="d2-field d2-field--wide"><span>Descrição detalhada *</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Descreva o serviço em detalhes, incluindo dimensões, tolerâncias, acabamentos, processos desejados e outras informações importantes." rows={4} maxLength={1000} required /></label>{input('deadline', 'Prazo desejado', '', false, 'date')}<label className="d2-field"><span>Observações adicionais</span><textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Informações adicionais que possam ajudar na elaboração do orçamento." rows={3} maxLength={500} /></label><label className="d2-field d2-field--wide"><span>Arquivos</span><input type="file" multiple accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><small className="d2-file-hint">PDF, DWG, DXF, JPG e PNG — até 10 MB por arquivo e 25 MB no total.</small>{files.length ? <small className="d2-file-hint">{files.map((file) => file.name).join(', ')}</small> : null}</label></div></fieldset><button type="submit" className="d2-button d2-button--orange d2-form-submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="d2-spin" size={18} /> Enviando solicitação</> : <>Enviar solicitação de orçamento <ArrowRight size={18} /> </>}</button><p className="d2-form-note"><ShieldCheck size={15} /> Seus dados estão seguros conosco.</p></form></Reveal></div></section>
  )
}

function ContactDesign2() {
  return <section id="contato" className="d2-contact"><div className="d2-shell d2-contact__grid"><Reveal><SectionIntro eyebrow="Localização" title="Feira de Santana, estrategicamente posicionada."><>A GMAC Metalúrgica está em Feira de Santana – BA, um ponto estratégico para atender empresas da Bahia e de todo o Nordeste, com agilidade e eficiência.</></SectionIntro><div className="d2-address"><MapPin size={27} /><div><small>Nossa sede</small><strong>Feira de Santana – BA</strong><span>Av. Banco do Nordeste, Nº 35 - CIS<br />Feira de Santana - BA</span></div><a href={gmacMapsUrl} target="_blank" rel="noreferrer" className="d2-button d2-button--orange">Ver no mapa <ArrowRight size={17} /></a></div></Reveal><Reveal className="d2-map"><iframe title="Mapa da GMAC Metalúrgica" src={gmacMapsEmbedUrl} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /><div className="d2-map-label"><MapPin size={17} /> GMAC Metalúrgica</div></Reveal></div></section>
}

function Design2Footer() {
  return <footer className="d2-footer"><div className="d2-shell d2-footer__top"><img src={assetUrl('assets/gmac-logo-final-frame.png')} alt="GMAC Metalúrgica" /><div><span>GMAC Metalúrgica</span><small>Usinagem - Caldeiraria - Manutenção Industrial</small></div><a href={whatsappContactUrl} target="_blank" rel="noreferrer" className="d2-footer__phone"><Phone size={17} /> (75) 3616-6626</a></div><div className="d2-shell d2-footer__bottom"><span>© 2026 GMAC Metalúrgica. Todos os direitos reservados.</span><span>Usinagem - Caldeiraria - Manutenção Industrial</span></div></footer>
}

export default function Design2() {
  return <main className="design2"><Design2Header /><Design2Hero /><TrustBand /><AboutDesign2 /><ClientStrip /><ServicesDesign2 /><StructureDesign2 /><ProcessDesign2 /><ProjectsDesign2 /><QualityDesign2 /><QuoteDesign2 /><ContactDesign2 /><Design2Footer /></main>
}
