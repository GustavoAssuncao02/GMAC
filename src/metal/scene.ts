import * as T from 'three'
import { landingAmount, type MetalState } from './timeline'
import { metalSteps } from './steps'
import { createSteelTextures } from './steelTextures'
import { createContactShadow } from './contactShadow'
import { createMandrel } from './mandrel'
import { createWeldingEffects, weldingVisuals } from './weldingEffects'
import { qualityChecks, qualityCheckProgress } from './quality'

export function createMetalScene(canvas: HTMLCanvasElement) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.shadowMap.enabled = false
  renderer.shadowMap.type = T.PCFSoftShadowMap
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, 12)
  // Native MSAA keeps full-resolution edges without full-screen HDR render targets.
  const gl = renderer.getContext()
  const samples = gl.getParameter(gl.SAMPLES) as number
  const pmrem = new T.PMREMGenerator(renderer)
  const room = new T.Scene()
  room.background = new T.Color(0x48505a)
  const panels: T.Mesh[] = []
  for (const [w, h, x, y, z, intensity] of [[6, 4, -3, 5, 4, 3.5], [2, 7, 5, 1, 2, 2.5], [1.5, 5, -5, 0, -2, 2], [5, 2, 0, 3, -5, 3], [7, 5, 0, 7, 0, 2.8], [3, 6, -2, -4, 4, 2.3], [6, 4, 0, -7, 0, 1.1]]) {
    const panel = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(intensity, intensity, intensity), side: T.DoubleSide }))
    panel.position.set(x, y, z)
    panel.lookAt(0, 0, 0)
    room.add(panel)
    panels.push(panel)
  }
  const environment = pmrem.fromScene(room, 0.035)
  scene.environment = environment.texture
  scene.environmentIntensity = 0.85
  panels.forEach(panel => { panel.geometry.dispose(); (panel.material as T.Material).dispose() })
  pmrem.dispose()
  const key = new T.DirectionalLight(0xf0f4f8, 3)
  key.position.set(-3, 7, 7)
  key.castShadow = false
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = key.shadow.camera.bottom = -8
  key.shadow.camera.right = key.shadow.camera.top = 8
  key.shadow.bias = -0.001
  const rim = new T.DirectionalLight(0xffc49c, 1.2)
  rim.position.set(5, 3, -2)
  const fill = new T.DirectionalLight(0xd6e9f8, 1.7)
  fill.position.set(-5, 0, 4)
  scene.add(key, rim, fill)
  const surface = createSteelTextures(renderer)
  const mandrel = createMandrel(surface)
  const stage = new T.Group()
  stage.add(mandrel.root)
  scene.add(stage)
  const floor = new T.Mesh(new T.PlaneGeometry(100, 100), new T.ShadowMaterial({ opacity: 0.18 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  floor.visible = false // The baked contact shadow avoids a second geometry pass.
  const shadow = createContactShadow()
  scene.add(shadow.mesh)
  const bounds = new T.Box3()
  const partBounds = new T.Box3()
  const center = new T.Vector3()
  const sparkPositions = new Float32Array(72 * 6)
  const sparkGeometry = new T.BufferGeometry()
  sparkGeometry.setAttribute('position', new T.BufferAttribute(sparkPositions, 3))
  const sparkMaterial = new T.LineBasicMaterial({ color: new T.Color(4, 1.8, 0.55), transparent: true,
    toneMapped: false, blending: T.AdditiveBlending, depthWrite: false })
  const sparks = new T.LineSegments(sparkGeometry, sparkMaterial)
  mandrel.root.add(sparks)
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 128
  const context = glowCanvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.1, '#fff0db')
  gradient.addColorStop(0.35, '#ffb56b66')
  gradient.addColorStop(1, '#ffb56b00')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const glowTexture = new T.CanvasTexture(glowCanvas)
  const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture, transparent: true,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))
  mandrel.root.add(glow)
  const weldingEffects = createWeldingEffects(mandrel.sampleWeldContact)
  mandrel.root.add(weldingEffects.root)

  const arc = new T.PointLight(0xffa451, 0, 5, 2)
  mandrel.root.add(arc)
  const polishLight = new T.PointLight(0xe3f0ff, 0, 8, 2)
  mandrel.root.add(polishLight)
  let width = 1, height = 1
  let disposed = false
  let ready = false
  let renderCount = 0
  return {
    async prepare() {
      await surface.ready
      if (disposed) return
      // Warm all hidden tools in the same output format used during animation.
      const visible = new Map<T.Object3D, boolean>()
      scene.traverse(object => { visible.set(object, object.visible); object.visible = true })
      await renderer.compileAsync(scene, camera)
      if (disposed) return
      renderer.render(scene, camera)
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      if (disposed) return
      visible.forEach((value, object) => { object.visible = value })
      ready = true
      canvas.dataset.prepared = 'true'
    },
    resize(w: number, h: number) {
      if (width === w && height === h && canvas.dataset.renderScale) return
      width = w; height = h
      // Native density plus MSAA; bound fill-rate instead of oversampling the entire effect chain.
      const ratio = Math.min(devicePixelRatio, 2, Math.sqrt(3_000_000 / (w * h)))
      renderer.setPixelRatio(ratio)
      renderer.setSize(w, h, false)
      canvas.dataset.renderScale = ratio.toFixed(3)
      canvas.dataset.msaaSamples = String(samples)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    render(state: MetalState, _activity = 1, operation?: { step: number; phase: number }) {
      if (!ready || disposed) return
      const mobile = width < 768
      const nearestStep = metalSteps.reduce((best, step, index) =>
        Math.abs(step.frame - state.frame) < Math.abs(metalSteps[best].frame - state.frame) ? index : best, 0)
      const step = operation?.step ?? nearestStep
      const phase = operation?.phase ?? 1
      const close = T.MathUtils.smoothstep(landingAmount(state.progress), 0, 1)
      if (camera.fov !== (mobile ? 47 : 38)) { camera.fov = mobile ? 47 : 38; camera.updateProjectionMatrix() }
      const vh = 24 * Math.tan(T.MathUtils.degToRad(camera.fov) / 2)
      const vw = vh * width / height
      stage.position.set(mobile ? 0 : vw * 0.205, -vh * (mobile ? 0.17 : 0.035), close * (mobile ? 0.05 : 0.3))
      // Stable machining view followed by the three-quarter close-up.
      stage.scale.setScalar(mobile ? 0.61 + close * 0.17 : (width < 1200 ? 0.85 : 0.97) + close * 0.18)
      mandrel.root.rotation.set(-0.78 - close * 0.08, 0.06 + close * 0.1, -0.12 - close * 0.08)
      const { contact, diagnostics, effect, polishPosition, polishing } = mandrel.update(step, phase)
      stage.updateMatrixWorld(true)
      bounds.makeEmpty()
      // Tool geometry is excluded from the contact shadow's bounds.
      const expandBounds = (object: T.Object3D) => {
        if (object instanceof T.Mesh) {
          if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
          bounds.union(partBounds.copy(object.geometry.boundingBox!).applyMatrix4(object.matrixWorld))
        }
      }
      if (mandrel.body.visible) mandrel.body.traverseVisible(expandBounds)
      else mandrel.root.children.filter(object => object instanceof T.Mesh && object.visible).forEach(expandBounds)
      if (!bounds.isEmpty()) {
        bounds.getCenter(center)
        const gap = step >= 8 ? 0.012 + (1 - close) * 0.14 : 0.22
        floor.position.y = bounds.min.y - gap
        shadow.mesh.position.set(center.x, floor.position.y + 0.008, center.z)
        const size = bounds.max.x - bounds.min.x
        shadow.mesh.scale.set(size * 1.2, size * 0.68, 1)
        shadow.mesh.material.opacity = 0.45 + close * 0.3
        canvas.dataset.contactGap = gap.toFixed(4)
      }
      canvas.dataset.landing = close.toFixed(4)
      const cutting = effect === 'cut', welding = effect === 'weld', drilling = effect === 'drill'
      const weldingVisual = weldingEffects.update(step, phase, welding, contact, mandrel.root, camera, canvas.height)
      const flare = welding ? weldingVisual.intensity : cutting ? 0.18 : drilling ? 0.07 : 0
      const intensity = cutting ? 0.22 : drilling ? 0.09 : 0
      for (let i = 0; intensity > 0 && i < 72; i++) {
        const cycle = (phase * 23 + i * 0.6180339) % 1
        const angle = i * 2.39996
        const length = cycle * (welding ? 0.7 : 0.32) * (0.5 + i % 7 / 8)
        const x = Math.cos(angle) * length, y = Math.sin(angle) * length
        const z = cycle * 0.3 - cycle * cycle * 0.5
        sparkPositions.set([contact.x + x, contact.y + y, contact.z + z,
          contact.x + x * 0.8, contact.y + y * 0.8, contact.z + z * 0.8], i * 6)
      }
      sparkGeometry.attributes.position.needsUpdate = true
      sparks.visible = intensity > 0
      sparkGeometry.setDrawRange(0, Math.floor(72 * intensity) * 2)
      sparkMaterial.opacity = intensity
      sparkMaterial.color.setRGB(welding ? 7 : 4, welding ? 0.015 : 1.8, welding ? 0.006 : 0.55)
      glow.visible = !welding && flare > 0
      glow.position.copy(contact).add(new T.Vector3(0, 0, 0.025))
      glow.scale.setScalar(welding ? 0.6 : 0.15)
      glow.material.color.set(welding ? 0xff3020 : 0xffbc6d).multiplyScalar(welding ? 2.5 : 1.5)
      glow.material.opacity = flare
      arc.position.copy(glow.position)
      arc.color.set(welding ? 0xb8e7ff : 0xffac58)
      arc.intensity = welding ? weldingVisual.intensity * weldingVisuals.arcIntensity : flare * 4
      // A tiny optical response only at ignition; the resting image stays fully sharp.
      canvas.style.filter = weldingVisual.blur > 0.025 ? `blur(${weldingVisual.blur.toFixed(3)}px)` : 'none'
      // Reuse the secondary light for warm molten-metal reflections while welding.
      polishLight.color.set(step === 4 ? 0xff9238 : 0xe3f0ff)
      polishLight.intensity = step === 4 ? weldingVisual.warmIntensity : polishing ? 0.55 : 0
      polishLight.position.copy(step === 4 ? weldingVisual.warmPosition : polishPosition)
      polishLight.position.z += step === 4 ? 0.12 : 0.6
      if (import.meta.env.DEV) {
        canvas.dataset.bloom = flare.toFixed(3)
        canvas.dataset.weldSparks = String(weldingVisual.sparks)
        canvas.dataset.weldSmoke = String(weldingVisual.smoke)
        canvas.dataset.weldFlash = weldingVisual.flash.toFixed(4)
        canvas.dataset.weldBlur = weldingVisual.blur.toFixed(4)
        canvas.dataset.operation = ['raw', 'raw', 'cut', 'bend', 'weld', 'machining', 'finish', 'assembly', 'quality', 'final'][step]
        canvas.dataset.operationPhase = phase.toFixed(4)
        canvas.dataset.holeCount = String(diagnostics.holes)
        canvas.dataset.boltCount = String(diagnostics.bolts)
        canvas.dataset.boltGap = diagnostics.boltGap.toFixed(4)
        canvas.dataset.partGap = diagnostics.separation.toFixed(4)
        canvas.dataset.pressGap = diagnostics.pressGap.toFixed(4)
        canvas.dataset.bendAngle = diagnostics.bendError.toFixed(2)
        canvas.dataset.cutProgress = diagnostics.cut.toFixed(4)
        canvas.dataset.weldProgress = diagnostics.weld.toFixed(4)
        canvas.dataset.finish = diagnostics.finish.toFixed(4)
        canvas.dataset.polishing = String(polishing)
        canvas.dataset.polishPosition = polishPosition.toArray().map(value => value.toFixed(3)).join(',')
        canvas.dataset.qualityChecked = String(step === 8 ? qualityChecks.filter((_, i) => qualityCheckProgress(phase, i) === 1).length : 0)
        canvas.dataset.programs = String(renderer.info.programs?.length ?? 0)
      }
      renderer.toneMappingExposure = 1.06 + weldingVisual.flash
      renderer.setClearColor(0x080b0e, 0)
      renderer.render(scene, camera)
      if (import.meta.env.DEV) {
        canvas.dataset.renderCount = String(++renderCount)
        canvas.dataset.drawCalls = String(renderer.info.render.calls)
      }
    },
    dispose() {
      disposed = true
      const geometries = new Set<T.BufferGeometry>()
      const materials = new Set<T.Material>()
      scene.traverse(object => {
        if (object instanceof T.Mesh || object instanceof T.Line || object instanceof T.Points || object instanceof T.Sprite) {
          if ('geometry' in object) geometries.add(object.geometry)
          ;(Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material))
        }
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      mandrel.dispose(); weldingEffects.dispose(); surface.dispose(); glowTexture.dispose(); environment.dispose(); shadow.texture.dispose()
      renderer.dispose()
    },
  }
}
