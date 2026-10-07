import * as T from 'three'
import { BLOOM_LAYER, PLAIN_LAYER } from './bloom'
import { createEffectTexture, createSparkStreaks, heatColor, random } from './sparks'

// Visual-only controls. The operation keeps its 3.4 s choreography.
export const weldingVisuals = {
  arcIntensity: 9,
  bloomStrength: 1.2,
  sparkCount: 200,
  spatterCount: 22,
  sparkSpeed: 3.3,
  sparkWidth: 0.0135,
  particleLifetime: 0.6,
  gravity: 6.5,
  drag: 1.8,
  shutter: 0.024,
  smokeIntensity: 0.16,
  depthOfField: 0.5,
}
const smooth = T.MathUtils.smoothstep
const duration = 3.4
const capacity = 256
const simulationStep = 1 / 120

export function createWeldingEffects(sampleContact: (phase: number, target: T.Vector3) => boolean,
  windows: readonly (readonly [number, number])[]) {
  const root = new T.Group()
  const glowTexture = createEffectTexture(false), smokeTexture = createEffectTexture(true)
  const sprite = (color: number, texture = glowTexture, additive = true) => {
    const object = new T.Sprite(new T.SpriteMaterial({ map: texture, color, transparent: true,
      blending: additive ? T.AdditiveBlending : T.NormalBlending, depthWrite: false, toneMapped: false }))
    object.layers.set(additive ? BLOOM_LAYER : PLAIN_LAYER)
    root.add(object)
    return object
  }
  const core = sprite(0xffffff), inner = sprite(0x9fdcff), halo = sprite(0x3d8dff)
  const lens = sprite(0xa8dcff), pool = sprite(0xff7a26), afterglow = sprite(0xff6925)
  const smoke = Array.from({ length: 10 }, () => sprite(0x8cc3ec, smokeTexture, false))

  const streaks = createSparkStreaks(capacity)
  const { heads, tails, colors, widths } = streaks
  root.add(streaks.mesh)

  const born = new T.Vector3(), ahead = new T.Vector3(), particle = new T.Vector3(), velocity = new T.Vector3()
  const radial = new T.Vector3(), tangent = new T.Vector3(), towardCamera = new T.Vector3()
  const cameraLocal = new T.Vector3(), gravity = new T.Vector3(), up = new T.Vector3()
  const rotation = new T.Quaternion(), color = new T.Color()
  // Sparks bounce off the plate (z = 0.3) and the collar wall (r = 1.38, top z = 0.8).
  const simulate = (age: number, drag: number, sticky: boolean) => {
    const steps = Math.max(1, Math.ceil(age / simulationStep)), h = age / steps
    let bounces = 0
    for (let k = 0; k < steps; k++) {
      const previousRadius = Math.hypot(particle.x, particle.y), previousZ = particle.z
      velocity.addScaledVector(gravity, h).multiplyScalar(Math.max(0, 1 - drag * h))
      particle.addScaledVector(velocity, h)
      const radius = Math.hypot(particle.x, particle.y)
      if (particle.z < 0.8 && radius < 1.385 && radius > 0.84) {
        if (previousRadius >= 1.385) {
          const scale = 1.39 / radius
          particle.x *= scale; particle.y *= scale
          const outward = (velocity.x * particle.x + velocity.y * particle.y) / 1.39
          velocity.x -= 1.4 * outward * particle.x / 1.39; velocity.y -= 1.4 * outward * particle.y / 1.39
          velocity.multiplyScalar(0.7); bounces++
        } else if (previousZ >= 0.8) {
          particle.z = 0.8; velocity.z = -velocity.z * 0.3; velocity.x *= 0.6; velocity.y *= 0.6; bounces++
        }
      }
      // Exposed flange surface only; under the collar there is nothing to land on.
      const onPlate = Math.abs(particle.x) < 2.5 && Math.abs(particle.y) < 0.72 && radius >= 1.38
      if (onPlate && particle.z < 0.3 && previousZ >= 0.3 && velocity.z < 0) {
        particle.z = 0.3; bounces++
        if (sticky) { velocity.set(0, 0, 0); return bounces }
        velocity.z = -velocity.z * 0.32; velocity.x *= 0.62; velocity.y *= 0.62
      }
    }
    return bounces
  }
  const passAt = (phase: number) => windows.findIndex(([start, end]) => phase > start && phase < end)
  return {
    root,
    update(step: number, phase: number, active: boolean, contact: T.Vector3, parent: T.Object3D, camera: T.Camera,
      renderer: T.WebGLRenderer) {
      root.visible = step === 4 && phase > windows[0][0] - 0.01 && phase < 1
      if (!root.visible) return { intensity: 0, flash: 0, bloom: 0, sparks: 0, smoke: 0, warmIntensity: 0, warmPosition: afterglow.position }
      const time = phase * duration, endFade = 1 - smooth(phase, 0.95, 1)
      const pass = passAt(phase)
      const window = windows[Math.max(0, pass)]
      const elapsed = Math.max(0, time - window[0] * duration), remaining = Math.max(0, window[1] * duration - time)
      // The arc strikes with a short flare and dies out as the torch slows at the end of the pass.
      const peak = Math.exp(-Math.pow((elapsed - 0.06) / 0.05, 2))
      const flicker = 0.8 + Math.sin(time * 61) * 0.08 + Math.sin(time * 137 + 1.7) * 0.06 + Math.sin(time * 263 + 0.4) * 0.04
        + (random(Math.floor(time * 38)) - 0.5) * 0.16
      const intensity = active && pass >= 0 ? smooth(elapsed, 0, 0.035) * smooth(remaining, 0, 0.06) * flicker * (1 + peak * 0.45) * endFade : 0
      camera.getWorldPosition(cameraLocal); parent.worldToLocal(cameraLocal)
      parent.getWorldQuaternion(rotation).invert()
      up.set(0, 1, 0).applyQuaternion(rotation)
      gravity.copy(up).multiplyScalar(-weldingVisuals.gravity)
      for (const glow of [core, inner, halo, lens, pool]) {
        glow.visible = intensity > 0.002
        glow.position.copy(contact); glow.position.z += 0.045
      }
      pool.position.z -= 0.025
      core.scale.setScalar(0.2 + peak * 0.06 + flicker * 0.03); core.material.color.setRGB(4, 4.4, 5).multiplyScalar(intensity)
      inner.scale.setScalar(0.55 + peak * 0.14); inner.material.color.setRGB(0.9, 1.7, 2.6).multiplyScalar(intensity)
      halo.scale.setScalar(1.3 + peak * 0.25); halo.material.color.setRGB(0.12, 0.3, 0.75).multiplyScalar(intensity)
      lens.scale.set(1.5 + peak * 0.6, 0.035 + peak * 0.02, 1); lens.material.color.setRGB(0.5, 0.8, 1.2).multiplyScalar(intensity * (0.35 + peak * 0.4))
      pool.scale.setScalar(0.3); pool.material.color.setRGB(2.4, 0.75, 0.12).multiplyScalar(Math.min(1, intensity * 1.3))

      let count = 0
      const total = Math.min(capacity, Math.round(weldingVisuals.sparkCount + weldingVisuals.spatterCount))
      for (let i = 0; i < total; i++) {
        const seed = i * 7.31 + 11
        const spatter = i < weldingVisuals.spatterCount
        const life = spatter ? 0.9 + random(seed + 3) * 0.6 : weldingVisuals.particleLifetime * (0.45 + random(seed + 3) * 0.9)
        const age = (time + random(seed + 17) * life) % life
        const birth = time - age
        if (!sampleContact(birth / duration, born)) continue
        // Spray away from the collar, along and against the travel, and up off the plate.
        radial.set(born.x, born.y, 0).normalize()
        if (sampleContact((birth + 0.01) / duration, ahead)) tangent.subVectors(ahead, born).setZ(0).normalize()
        else tangent.set(-radial.y, radial.x, 0)
        velocity.copy(radial).multiplyScalar(-0.35 + random(seed + 6) * 1.5)
          .addScaledVector(tangent, (random(seed + 8) - 0.5) * 2.2)
        velocity.z = 0.35 + random(seed + 15) * 1.1
        const speed = spatter ? 0.8 + random(seed + 9) * 0.8 : weldingVisuals.sparkSpeed * (0.35 + Math.pow(random(seed + 9), 0.7) * 0.9)
        velocity.normalize().multiplyScalar(speed)
        const nearLens = !spatter && i % 31 === 0
        if (nearLens) { towardCamera.subVectors(cameraLocal, born).normalize(); velocity.addScaledVector(towardCamera, speed * 1.8) }
        particle.copy(born)
        const bounces = simulate(age, spatter ? 0.7 : weldingVisuals.drag, spatter)
        const progress = age / life
        // Small sparks cool fast; each impact sheds heat. Spatter keeps glowing on the plate.
        const heat = spatter ? Math.pow(1 - progress, 1.2) : Math.pow(1 - progress, 0.85) * Math.pow(0.78, bounces)
        const fade = smooth(age, 0, 0.012) * (1 - smooth(progress, 0.82, 1)) * endFade
        heatColor(heat, color).multiplyScalar(fade * (spatter ? 0.85 : 1))
        const index = count * 3
        particle.toArray(heads, index)
        // Shutter-length streak; tighter as the spark slows down.
        const streak = Math.min(0.4, velocity.length() * weldingVisuals.shutter)
        towardCamera.copy(velocity).setLength(streak)
        particle.sub(towardCamera).toArray(tails, index)
        color.toArray(colors, index)
        widths[count] = weldingVisuals.sparkWidth * (0.6 + random(seed + 19) * 0.9) * (spatter ? 2.4 : 1) * (nearLens ? 1.25 : 1)
        count++
      }
      streaks.commit(count, contact, parent, camera, renderer, weldingVisuals.depthOfField)

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
      if (residue) {
        afterglow.position.copy(born); afterglow.position.z += 0.025; afterglow.scale.setScalar(0.2)
        afterglow.material.color.setRGB(1.6, 0.45, 0.08).multiplyScalar((intensity > 0 ? 0.25 : 0.55) * endFade)
      }
      return { intensity, flash: peak * intensity, bloom: count || intensity > 0 || residue ? weldingVisuals.bloomStrength * (1 + peak * intensity * 0.5) : 0,
        sparks: count, smoke: smokeCount, warmIntensity: residue ? Math.min(1, count / 60) * endFade * 0.7 : 0, warmPosition: afterglow.position }
    },
    dispose() { glowTexture.dispose(); smokeTexture.dispose() },
  }
}
