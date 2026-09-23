import * as T from 'three'

// Visual-only controls. The operation still uses the existing 3.4 s choreography.
export const weldingVisuals = {
  arcIntensity: 9,
  bloomIntensity: 0.9,
  sparkCount: 112,
  sparkSpeed: 3.6,
  particleSize: 0.038,
  particleLifetime: 0.42,
  smokeIntensity: 0.19,
  flashIntensity: 0.075,
  blurPixels: 0.18,
  blurDuration: 0.085,
  depthOfField: 0.65,
}
const smooth = T.MathUtils.smoothstep
const fract = (n: number) => n - Math.floor(n)
const random = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453)
const duration = 3.4
const capacity = 160

export function createWeldingEffects(sampleContact: (phase: number, target: T.Vector3) => boolean) {
  const root = new T.Group()
  const textures: T.Texture[] = []
  const makeTexture = (smoke: boolean) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')!
    for (let i = 0; i < (smoke ? 16 : 1); i++) {
      const x = smoke ? 36 + random(i + 2) * 56 : 64
      const y = smoke ? 24 + random(i + 51) * 78 : 64
      const r = smoke ? 12 + random(i + 81) * 23 : 64
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, smoke ? '#ffffff35' : '#ffffffff')
      g.addColorStop(smoke ? 0.35 : 0.12, smoke ? '#ffffff20' : '#ffffffe0')
      g.addColorStop(0.45, smoke ? '#ffffff10' : '#ffffff35')
      g.addColorStop(1, '#ffffff00')
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
    }
    const texture = new T.CanvasTexture(canvas)
    textures.push(texture)
    return texture
  }
  const glowTexture = makeTexture(false), smokeTexture = makeTexture(true)
  const sprite = (color: number, texture = glowTexture, additive = true) => {
    const object = new T.Sprite(new T.SpriteMaterial({ map: texture, color, transparent: true,
      blending: additive ? T.AdditiveBlending : T.NormalBlending, depthWrite: false, toneMapped: false }))
    root.add(object)
    return object
  }
  const core = sprite(0xf6fcff), inner = sprite(0x7ccfff), halo = sprite(0x3486ff)
  const lens = sprite(0x97d8ff), afterglow = sprite(0xff6925)
  const smoke = Array.from({ length: 10 }, () => sprite(0x8cc3ec, smokeTexture, false))
  const positions = new Float32Array(capacity * 6), colors = new Float32Array(capacity * 6)
  const tails = new T.BufferGeometry()
  tails.setAttribute('position', new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage))
  tails.setAttribute('color', new T.BufferAttribute(colors, 3).setUsage(T.DynamicDrawUsage))
  const streaks = new T.LineSegments(tails, new T.LineBasicMaterial({ vertexColors: true,
    transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))
  streaks.frustumCulled = false
  root.add(streaks)
  const heads = new T.BufferGeometry()
  const headPositions = new Float32Array(capacity * 3), headColors = new Float32Array(capacity * 3)
  const sizes = new Float32Array(capacity), alphas = new Float32Array(capacity)
  for (const [name, array, size] of [['position', headPositions, 3], ['color', headColors, 3], ['aSize', sizes, 1], ['aAlpha', alphas, 1]] as const) {
    heads.setAttribute(name, new T.BufferAttribute(array, size).setUsage(T.DynamicDrawUsage))
  }
  const pointsMaterial = new T.ShaderMaterial({
    uniforms: { uMap: { value: glowTexture }, uHeight: { value: 1000 }, uFocus: { value: 12 }, uDof: { value: weldingVisuals.depthOfField } },
    transparent: true, blending: T.AdditiveBlending, depthWrite: false, vertexColors: true, toneMapped: false,
    vertexShader: `attribute float aSize; attribute float aAlpha;
      uniform float uHeight; uniform float uFocus; uniform float uDof;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        float defocus = clamp(abs(-p.z - uFocus) * uDof, 0.0, 3.0);
        gl_PointSize = clamp(aSize * (1.0 + defocus) * uHeight * projectionMatrix[1][1] / max(0.2, -2.0 * p.z), 1.0, 38.0);
        gl_Position = projectionMatrix * p;
        vColor = color; vAlpha = aAlpha / (1.0 + defocus * 0.45);
      }`,
    fragmentShader: `uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha;
      void main() { vec4 glow = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vColor, glow.a * vAlpha); }`,
  })
  const points = new T.Points(heads, pointsMaterial)
  points.frustumCulled = false
  root.add(points)
  const born = new T.Vector3(), particle = new T.Vector3(), previous = new T.Vector3()
  const cameraLocal = new T.Vector3(), towardCamera = new T.Vector3(), velocity = new T.Vector3()
  const up = new T.Vector3(), rotation = new T.Quaternion(), viewPoint = new T.Vector3()
  const passStart = (second: boolean) => {
    // Find the existing pass boundary without creating another trajectory or changing its timing.
    let lo = second ? 0.59 : 0.27, hi = second ? 0.65 : 0.3
    for (let i = 0; i < 24; i++) { const p = (lo + hi) / 2; if (sampleContact(p, born)) hi = p; else lo = p }
    return hi * duration
  }
  const starts = [passStart(false), passStart(true)]
  return {
    root,
    update(step: number, phase: number, active: boolean, contact: T.Vector3, parent: T.Object3D, camera: T.Camera, pixelHeight: number) {
      root.visible = step === 4 && phase > 0.27 && phase < 1
      if (!root.visible) return { intensity: 0, flash: 0, blur: 0, sparks: 0, smoke: 0, warmIntensity: 0, warmPosition: afterglow.position }
      const time = phase * duration, endFade = 1 - smooth(phase, 0.95, 1)
      const start = time >= starts[1] ? starts[1] : starts[0]
      const elapsed = Math.max(0, time - start)
      const ignite = smooth(elapsed, 0, 0.035)
      const pulse = 0.84 + Math.sin(time * 53) * 0.08 + Math.sin(time * 97) * 0.055
      const peak = Math.exp(-Math.pow((elapsed - 0.09) / 0.055, 2))
      const intensity = active ? ignite * pulse * (0.9 + peak * 0.35) * endFade : 0
      const flash = active ? peak * weldingVisuals.flashIntensity : 0
      const blur = active ? Math.max(0, 1 - Math.abs(elapsed - 0.09) / (weldingVisuals.blurDuration * 0.5)) * weldingVisuals.blurPixels : 0
      camera.getWorldPosition(cameraLocal); parent.worldToLocal(cameraLocal)
      parent.getWorldQuaternion(rotation).invert()
      up.set(0, 1, 0).applyQuaternion(rotation)
      for (const glow of [core, inner, halo, lens]) {
        glow.visible = intensity > 0
        glow.position.copy(contact); glow.position.z += 0.045
      }
      core.scale.setScalar(0.25 + peak * 0.05); core.material.opacity = Math.min(1, intensity * 1.5)
      inner.scale.setScalar(0.75 + peak * 0.16); inner.material.opacity = intensity * weldingVisuals.bloomIntensity
      halo.scale.setScalar(1.65 + peak * 0.2); halo.material.opacity = intensity * weldingVisuals.bloomIntensity * 0.3
      lens.scale.set(1.65 + peak * 0.55, 0.045 + peak * 0.02, 1); lens.material.opacity = intensity * (0.12 + peak * 0.15)
      let count = 0
      const limit = Math.min(capacity, Math.max(0, Math.round(weldingVisuals.sparkCount)))
      for (let i = 0; i < limit; i++) {
        const seed = i + 11
        const ember = i % 6 === 0
        const life = weldingVisuals.particleLifetime * (0.6 + random(seed + 3) * 0.85) * (ember ? 1.35 : 1)
        const age = (time + random(seed + 17) * life) % life
        const birth = time - age
        if (!sampleContact(birth / duration, born)) continue
        const nearLens = !ember && i % 11 === 0
        const speed = weldingVisuals.sparkSpeed * (0.35 + random(seed + 9) * 0.9) * (ember ? 0.22 : 1)
        const angle = random(seed + 6) * Math.PI * 2
        velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, speed * (0.28 + random(seed + 15)))
        if (nearLens) { towardCamera.subVectors(cameraLocal, born).normalize(); velocity.addScaledVector(towardCamera, speed * 2.6) }
        particle.copy(born).addScaledVector(velocity, age).addScaledVector(up, -2.5 * age * age)
        const trailingAge = Math.max(0, age - (0.008 + random(seed + 4) * 0.025))
        previous.copy(born).addScaledVector(velocity, trailingAge).addScaledVector(up, -2.5 * trailingAge * trailingAge)
        const fade = Math.pow(1 - age / life, 1.5) * endFade
        const green = 0.18 + (1 - age / life) * 0.46, blue = 0.008 + (1 - age / life) * 0.08
        const offset = count * 6, head = count * 3
        particle.toArray(positions, offset); previous.toArray(positions, offset + 3)
        colors.set([fade * 2.8, fade * green, fade * blue, fade * 1.4, fade * green * 0.4, 0], offset)
        particle.toArray(headPositions, head)
        headColors.set([2.5, green, blue], head)
        sizes[count] = weldingVisuals.particleSize * (0.6 + random(seed + 19) * 1.2) * (nearLens ? 1.4 : 1)
        alphas[count] = fade
        count++
      }
      tails.setDrawRange(0, count * 2); heads.setDrawRange(0, count)
      for (const attribute of Object.values(tails.attributes)) attribute.needsUpdate = true
      for (const attribute of Object.values(heads.attributes)) attribute.needsUpdate = true
      parent.localToWorld(viewPoint.copy(contact)); viewPoint.applyMatrix4(camera.matrixWorldInverse)
      pointsMaterial.uniforms.uFocus.value = -viewPoint.z
      pointsMaterial.uniforms.uHeight.value = pixelHeight
      pointsMaterial.uniforms.uDof.value = weldingVisuals.depthOfField
      let smokeCount = 0
      smoke.forEach((puff, i) => {
        const life = 0.55, age = (time + i / smoke.length * life) % life
        const emitting = sampleContact((time - age) / duration, born)
        puff.visible = emitting && endFade > 0
        if (!puff.visible) return
        smokeCount++
        puff.position.copy(born).addScaledVector(up, age * 1.8)
        puff.position.x += Math.sin(age * 5 + i) * age * 0.2
        puff.position.z += 0.13 + age * 0.14
        puff.scale.setScalar(0.22 + age * 1.15)
        puff.material.rotation = i * 2.4 + age * 0.25
        puff.material.opacity = Math.sin(age / life * Math.PI) * weldingVisuals.smokeIntensity * endFade
      })
      // A short warm residual at the last deposited point, including during retraction.
      let residue = false
      for (let lag = 0.02; lag <= 0.26; lag += 0.02) {
        if (sampleContact((time - lag) / duration, born)) { residue = true; break }
      }
      afterglow.visible = residue
      if (residue) { afterglow.position.copy(born); afterglow.position.z += 0.025; afterglow.scale.setScalar(0.22); afterglow.material.opacity = (active ? 0.12 : 0.26) * endFade }
      return { intensity, flash, blur, sparks: count, smoke: smokeCount,
        warmIntensity: residue ? Math.min(1, count / 50) * endFade * 0.7 : 0, warmPosition: afterglow.position }
    },
    dispose() { textures.forEach(texture => texture.dispose()) },
  }
}
