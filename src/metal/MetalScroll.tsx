import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react'
import { clamp, frames, presentationStateAt as stateAt, type MetalState } from './timeline'
import './metal.css'
import { metalSteps, stepProgress } from './steps'
import { qualityChecks, qualityCheckProgress } from './quality'

const copyOverrides: Record<string, { headline: string; body: string }> = {
  cut: {
    headline: 'O contorno ganha vida.',
    body: 'O laser abre o caminho com um corte limpo, rápido e controlado.',
  },
  bend: {
    headline: 'A forma começa a nascer.',
    body: 'Pressão, simetria e ângulo transformam a chapa no próximo estágio.',
  },
  weld: {
    headline: 'Cordões que fecham a estrutura.',
    body: 'A solda conecta as partes e consolida o conjunto.',
  },
  final: {
    headline: 'DO PROJETO\nÀ PEÇA FINAL.',
    body: 'ENGENHARIA QUE TRANSFORMA AÇO EM SOLUÇÃO. QUALIDADE EM CADA ETAPA PARA ENTREGAR O MELHOR RESULTADO AO SEU PROCESSO.',
  },
}

declare global {
  interface Window {
    __METALURGICA_SCROLL__?: {
      setProgress: (value: number) => void
      setStepPhase: (index: number, phase: number) => void
      clearOverride: () => void
      getState: () => { progress: number; fromFrame: number; toFrame: number; state: MetalState }
    }
  }
}

export default function MetalScroll() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const copyRefs = useRef<Record<string, HTMLElement | null>>({})
  const previous = useRef<HTMLButtonElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const advance = useRef<(direction: number) => void>(() => {})
  const counter = useRef<HTMLSpanElement>(null)
  const stepButtons = useRef<(HTMLButtonElement | null)[]>([])
  const goToStep = useRef<(index: number) => void>(() => {})
  const qualityRows = useRef<(HTMLLIElement | null)[]>([])
  const qualityCount = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = section.current!
    const viewport = stage.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motion.matches
    let disposed = false
    let override: number | null = null
    let phaseOverride: number | null = null
    let effective = reduced ? 1 : 0
    let state = stateAt(effective)
    let width = 1, height = 1
    let raf = 0
    let active = false
    let paintedStep = -1, wasPreview = false
    let nextPaint = 0
    const frameInterval = 1000 / 60
    let pointer: { id: number; x: number; y: number } | null = null
    let loading = false
    let stepIndex = 0
    let from = effective, target = effective, transitionStart = 0
    let transitionDuration = 620
    const durationForStep = (index: number) => [620, 620, 3600, 2400, 3400, 3600, 4200, 3000, 3800, 1600][index]
    let scene: Awaited<ReturnType<typeof import('./scene')['createMetalScene']>> | undefined

    function paint() {
      raf = 0
      if (disposed) return
      const now = performance.now()
      const t = clamp((now - transitionStart) / transitionDuration)
      const ease = t * t * (3 - 2 * t)
      effective = reduced ? 1 : override ?? from + (target - from) * ease
      state = stateAt(effective)
      const mobile = width < 768
      const displayStep = reduced ? metalSteps.length - 1 : stepIndex
      const previewFrames = override !== null && phaseOverride === null && !reduced
      const copyChanged = displayStep !== paintedStep || previewFrames || wasPreview
      if (copyChanged) for (const [name, block] of Object.entries(state.copy_blocks)) {
        const node = copyRefs.current[name]
        if (!node) continue
        const currentStep = reduced ? metalSteps.length - 1 : stepIndex
        const isActive = name === metalSteps[currentStep].copy || (name === 'cta' && currentStep === metalSteps.length - 1)
        const alpha = previewFrames ? block.opacity : Number(isActive)
        node.style.opacity = String(alpha)
        node.style.transform = previewFrames ? `translate(${block.x_vw * (mobile ? 0.65 : 1)}vw, ${block.y_vh}svh) scale(${block.scale})` : 'none'
        node.style.filter = 'none'
        node.style.visibility = alpha > 0.001 ? 'visible' : 'hidden'
        node.setAttribute('aria-hidden', String(alpha < 0.5))
        if (name === 'cta') {
          const enabled = previewFrames ? state.ui.cta_enabled && block.opacity > 0.01 : isActive
          node.style.pointerEvents = enabled ? 'auto' : 'none'
          node.tabIndex = enabled ? 0 : -1
        }
      }
      if (previous.current) previous.current.disabled = displayStep === 0
      if (nextButton.current) nextButton.current.disabled = displayStep === metalSteps.length - 1
      const phase = reduced ? 1 : phaseOverride ?? t
      let verified = 0
      if (displayStep === 8 || paintedStep === 8 || paintedStep === -1) qualityRows.current.forEach((row, index) => {
        if (!row) return
        const progress = displayStep === 8 ? qualityCheckProgress(phase, index) : 0
        const checked = progress === 1
        if (checked) verified++
        const status = checked ? 'verified' : progress > 0 ? 'checking' : 'pending'
        row.dataset.status = status
        row.style.setProperty('--check-progress', String(progress))
        row.style.setProperty('--row-reveal', String(displayStep === 8 ? clamp((phase - index * 0.018) / 0.07) : 0))
        row.setAttribute('aria-label', `${qualityChecks[index].label}: ${checked ? 'verificado' : progress > 0 ? 'em verificação' : 'aguardando'}`)
      })
      if (qualityCount.current && (displayStep === 8 || copyChanged)) qualityCount.current.textContent = `${verified}/${qualityChecks.length}`
      if (copyChanged && counter.current) counter.current.textContent = metalSteps[displayStep].name
      if (copyChanged) stepButtons.current.forEach((button, index) => {
        button?.setAttribute('aria-current', index === displayStep ? 'step' : 'false')
      })
      if (copyChanged) viewport.dataset.step = String(displayStep)
      paintedStep = displayStep
      wasPreview = previewFrames
      viewport.style.setProperty('--metal-light', '.32')
      scene?.render(state, override !== null ? 1 : reduced ? 0 : Math.sin(Math.PI * t),
        override !== null && phaseOverride === null ? undefined : { step: displayStep, phase })
      if (override === null && !reduced && t < 1) schedule()
    }
    function tick(now: number) {
      raf = 0
      if (disposed || document.hidden || (!active && override === null)) return
      if (now + 0.5 < nextPaint) { schedule(); return }
      // Keep time-based motion at 60 fps, without accumulating timer drift.
      nextPaint = now + frameInterval - Math.max(0, now - nextPaint) % frameInterval
      paint()
    }
    function schedule() {
      if (!raf && !document.hidden && (active || override !== null || reduced)) raf = requestAnimationFrame(tick)
    }
    function measure() {
      width = viewport.clientWidth
      height = viewport.clientHeight
      scene?.resize(width, height)
      schedule()
    }
    goToStep.current = index => {
      override = null
      phaseOverride = null
      const next = Math.max(0, Math.min(metalSteps.length - 1, index))
      stepIndex = next
      from = effective
      target = stepProgress(next)
      transitionStart = performance.now()
      transitionDuration = durationForStep(next)
      schedule()
    }
    advance.current = direction => goToStep.current(stepIndex + direction)
    function onPointerDown(event: PointerEvent) {
      if (reduced || !event.isPrimary || event.button !== 0 ||
        (event.target instanceof Element && event.target.closest('a, button'))) return
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      viewport.setPointerCapture(event.pointerId)
      viewport.dataset.dragging = 'true'
    }
    function endPointer(event: PointerEvent) {
      if (!pointer || pointer.id !== event.pointerId) return
      const dx = pointer.x - event.clientX, dy = pointer.y - event.clientY
      pointer = null
      delete viewport.dataset.dragging
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId)
      if (event.type === 'pointerup' && Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        advance.current(Math.sign(dx))
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (reduced || event.altKey || event.ctrlKey || event.metaKey ||
        (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      if (!direction) return
      event.preventDefault()
      if (!event.repeat) advance.current(direction)
    }
    async function initialize() {
      if (loading || scene || disposed) return
      loading = true
      try {
        const { createMetalScene } = await import('./scene')
        if (disposed) return
        scene = createMetalScene(canvas.current!)
        scene.resize(width, height)
        await scene.prepare()
        if (disposed) return
        viewport.dataset.ready = 'true'
        transitionStart = performance.now()
        paint()
      } catch (error) {
        // A static product and usable final CTA remain available without WebGL.
        console.warn('A visualização 3D está indisponível; exibindo composição estática.', error)
        viewport.dataset.fallback = 'true'
        element.dataset.reduced = 'true'
        reduced = true
        measure()
        paint()
      }
    }
    const observer = new IntersectionObserver(entries => {
      active = entries[0].isIntersecting
      if (active) { measure(); void initialize(); schedule() }
      else { cancelAnimationFrame(raf); raf = 0 }
    }, { rootMargin: '0px' })
    // Load shaders ahead of entry; render only while the section is on screen.
    const preload = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { void initialize(); preload.disconnect() }
    }, { rootMargin: '1000px' })
    preload.observe(element)
    observer.observe(element)
    const resize = new ResizeObserver(measure)
    resize.observe(element)
    resize.observe(viewport)
    const onMotionChange = () => {
      reduced = motion.matches
      element.dataset.reduced = String(reduced)
      measure()
      paint()
    }
    element.dataset.reduced = String(reduced)
    motion.addEventListener('change', onMotionChange)
    window.addEventListener('resize', measure)
    viewport.addEventListener('pointerdown', onPointerDown)
    viewport.addEventListener('pointerup', endPointer)
    viewport.addEventListener('pointercancel', endPointer)
    viewport.addEventListener('lostpointercapture', endPointer)
    viewport.addEventListener('keydown', onKeyDown)
    const onVisibility = () => { cancelAnimationFrame(raf); raf = 0; if (!document.hidden) schedule() }
    document.addEventListener('visibilitychange', onVisibility)
    measure()
    paint()
    if (import.meta.env.DEV) window.__METALURGICA_SCROLL__ = {
      setProgress(value) {
        if (!Number.isFinite(value)) return
        override = clamp(value)
        phaseOverride = null
        void initialize()
        paint()
      },
      setStepPhase(index, phase) {
        if (!Number.isInteger(index) || index < 0 || index >= metalSteps.length || !Number.isFinite(phase)) return
        stepIndex = index
        override = stepProgress(index)
        phaseOverride = clamp(phase)
        void initialize()
        paint()
      },
      clearOverride() { override = null; phaseOverride = null; from = effective; target = stepProgress(stepIndex); transitionStart = performance.now(); paint() },
      getState() { return { progress: effective, fromFrame: Math.min(80, Math.floor(effective * 79 + 1e-9) + 1), toFrame: Math.min(80, Math.floor(effective * 79 + 1e-9) + 2), state } },
    }
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      preload.disconnect()
      resize.disconnect()
      motion.removeEventListener('change', onMotionChange)
      window.removeEventListener('resize', measure)
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointerup', endPointer)
      viewport.removeEventListener('pointercancel', endPointer)
      viewport.removeEventListener('lostpointercapture', endPointer)
      viewport.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      scene?.dispose()
      if (import.meta.env.DEV) delete window.__METALURGICA_SCROLL__
    }
  }, [])

  return (
    <section id="transformacao" className="metal-scroll" ref={section} aria-label="Do aço à peça final: conheça o processo de fabricação">
      <div className="metal-stage" ref={stage} tabIndex={0} role="region" aria-label="Animação do processo: arraste para os lados ou use as setas">
        <div className="metal-atmosphere" aria-hidden="true" />
        <canvas className="metal-canvas" ref={canvas} aria-hidden="true" />
        <svg className="metal-fallback" viewBox="0 0 500 500" aria-hidden="true">
          <defs><linearGradient id="metal-static" x2="1" y2="1"><stop stopColor="#dae0e4" /><stop offset=".35" stopColor="#555e65" /><stop offset=".7" stopColor="#9aa4ac" /><stop offset="1" stopColor="#303840" /></linearGradient></defs>
          <g transform="rotate(12 250 250)" fill="url(#metal-static)" stroke="#b3bbc0" strokeWidth="2">
            <path d="M35 215 Q25 215 25 230V300Q25 315 40 315H460Q475 315 475 300V230Q475 215 460 215Z" />
            <path d="M115 235V285A135 80 0 0 0 385 285V235Z" />
            <path d="M115 235A135 80 0 1 0 385 235A135 80 0 1 0 115 235ZM175 235A75 43 0 1 1 325 235A75 43 0 1 1 175 235Z" fillRule="evenodd" />
            <g fill="#222c34"><ellipse cx="64" cy="248" rx="13" ry="9" /><ellipse cx="87" cy="285" rx="13" ry="9" /><ellipse cx="413" cy="248" rx="13" ry="9" /><ellipse cx="436" cy="285" rx="13" ry="9" /></g>
          </g>
        </svg>
        <div className="metal-topline"><span><i /> A TRANSFORMAÇÃO DO AÇO</span><a href="#gmac">Pular animação <ArrowDown size={13} /></a></div>
        <div className="metal-copy-area">
          {Object.entries(frames[0].copy_blocks).filter(([name]) => name !== 'cta').map(([name, block]) => (
            <div key={name} ref={node => { copyRefs.current[name] = node }} className={`metal-copy metal-copy--${name}`} style={{ opacity: block.opacity, visibility: block.opacity ? 'visible' : 'hidden' }} aria-hidden={!block.opacity}>
              {block.label && <p className="metal-label">{String(metalSteps.findIndex(step => step.copy === name)).padStart(2, '0')} — {metalSteps.find(step => step.copy === name)?.name.toLocaleUpperCase('pt-BR')}</p>}
              <h2>{copyOverrides[name]?.headline ?? block.headline}</h2>
              {block.body && <p className="metal-body">{copyOverrides[name]?.body ?? block.body}</p>}
              {name === 'quality' && <div className="metal-quality">
                <div className="metal-quality-heading"><span>INSPEÇÃO DO CONJUNTO</span><span ref={qualityCount}>0/{qualityChecks.length}</span></div>
                <ul className="metal-quality-list" aria-label="Checklist de qualidade">
                  {qualityChecks.map((item, index) => <li key={item.label} ref={node => { qualityRows.current[index] = node }} data-status="pending">
                    <span className="metal-quality-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" pathLength="1" /></svg></span>
                    <span>{item.label}</span>
                    <small aria-hidden="true">Verificado</small>
                  </li>)}
                </ul>
              </div>}
            </div>
          ))}
        </div>
        <a className="metal-cta" href="#orcamento" ref={node => { copyRefs.current.cta = node }} tabIndex={-1} style={{ opacity: 0, visibility: 'hidden' }}>Fale com a gente <ArrowRight size={18} /></a>
        <div className="metal-bottomline">
          <div className="metal-scroll-hint"><MoveHorizontal size={22} /><span>Arraste para os lados<br /><strong>e explore o processo</strong></span></div>
          <span className="metal-signature">MATÉRIA. ENGENHARIA. SOLUÇÃO.</span>
          <span className="metal-counter" ref={counter}>Visão geral</span>
        </div>
        <div className="metal-arrows">
          <button ref={previous} type="button" aria-label="Etapa anterior" onClick={() => advance.current(-1)}><ArrowLeft size={20} /></button>
          <button ref={nextButton} type="button" aria-label="Próxima etapa" onClick={() => advance.current(1)}><ArrowRight size={20} /></button>
        </div>
        <nav className="metal-step-nav" aria-label="Etapas da fabricação">
          {metalSteps.map((step, index) => <button key={step.copy} ref={node => { stepButtons.current[index] = node }} type="button" aria-label={step.name} onClick={() => goToStep.current(index)}><span>{index === 0 ? '●' : String(index).padStart(2, '0')}</span><small>{step.name}</small></button>)}
        </nav>
      </div>
    </section>
  )
}
