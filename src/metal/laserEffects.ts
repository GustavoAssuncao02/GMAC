import * as T from 'three'
import { BLOOM_LAYER, PLAIN_LAYER } from './bloom'
import { createEffectTexture, createSparkStreaks, heatColor, random } from './sparks'

// Visual-only controls. The cut keeps its 3.6 s choreography.
export const laserVisuals = {
  lightIntensity: 5.5,
  bloomStrength: 1.1,
  sparkCount: 210,
  drossCount: 18,
  sparkSpeed: 3.9,
  sparkWidth: 0.0115,
  particleLifetime: 0.32,
  gravity: 7.5,
  drag: 2.2,
  shutter: 0.03,
  fumeIntensity: 0.12,
  depthOfField: 0.5,
}
const smooth = T.MathUtils.smoothstep
const fract = (n: number) => n - Math.floor(n)
const duration = 3.6
const capacity = 256
const simulationStep = 1 / 120
// Top of the sheet; while cutting, the collar is still flat.
const plateZ = 0.3
// Where a spark can land: the whole sheet, until the center and then the frame drop away.
const onSheet = (x: number, y: number, phase: number) => {
  const radius = Math.hypot(x, y)
  if (phase > 0.62 && radius < 0.84) return false
  if (phase > 0.7) return Math.abs(x) < 2.53 && Math.abs(y) < 0.72 || radius < 1.38
  return Math.abs(x) < 2.55 && Math.abs(y) < 2.05
}

export function createLaserEffects(sampleContact: (phase: number, target: T.Vector3) => boolean,
  windows: readonly (readonly [number, number])[]) {
  const root = new T.Group()
  const glowTexture = createEffectTexture(false), fumeTexture = createEffectTexture(true)
  const sprite = (color: number, texture = glowTexture, additive = true) => {
    const object = new T.Sprite(new T.SpriteMaterial({ map: texture, color, transparent: true,
      blending: additive ? T.AdditiveBlending : T.NormalBlending, depthWrite: false, toneMapped: false }))
    object.layers.set(additive ? BLOOM_LAYER : PLAIN_LAYER)
    root.add(object)
    return object
  }
  const core = sprite(0xffffff), inner = sprite(0xffc46b), halo = sprite(0xff7a1f)
  const lens = sprite(0xffb35c), pool = sprite(0xff7a26)
  const fumes = Array.from({ length: 8 }, () => sprite(0xcfc3b4, fumeTexture, false))

  const streaks = createSparkStreaks(capacity)
  const { heads, tails, colors, widths } = streaks
  root.add(streaks.mesh)

  const born = new T.Vector3(), ahead = new T.Vector3(), particle = new T.Vector3(), velocity = new T.Vector3()
  const tangent = new T.Vector3(), side = new T.Vector3(), towardCamera = new T.Vector3()
  const cameraLocal = new T.Vector3(), gravity = new T.Vector3(), up = new T.Vector3()
  const rotation = new T.Quaternion(), color = new T.Color()
  // Sparks land on the sheet and skid; molten dross sticks where it lands. Past the edge they fall freely.
  const simulate = (birth: number, age: number, drag: number, sticky: boolean) => {
    const steps = Math.max(1, Math.ceil(age / simulationStep)), h = age / steps
    let bounces = 0
    for (let k = 0; k < steps; k++) {
      const previousZ = particle.z
      velocity.addScaledVector(gravity, h).multiplyScalar(Math.max(0, 1 - drag * h))
      particle.addScaledVector(velocity, h)
      if (particle.z < plateZ && previousZ >= plateZ && velocity.z < 0 && onSheet(particle.x, particle.y, (birth + (k + 1) * h) / duration)) {
        particle.z = plateZ; bounces++
        if (sticky) { velocity.set(0, 0, 0); return bounces }
        velocity.z = -velocity.z * 0.28; velocity.x *= 0.6; velocity.y *= 0.6
      }
    }
    return bounces
  }
  const passAt = (phase: number) => windows.findIndex(([start, end]) => phase > start && phase < end)
  return {
    root,
    update(step: number, phase: number, active: boolean, contact: T.Vector3, parent: T.Object3D, camera: T.Camera,
      renderer: T.WebGLRenderer) {
      root.visible = step === 2 && phase > windows[0][0] - 0.01 && phase < 1
      if (!root.visible) return { intensity: 0, flash: 0, bloom: 0, sparks: 0, fumes: 0, light: core.position }
      const time = phase * duration, endFade = 1 - smooth(phase, 0.93, 1)
      const pass = passAt(phase)
      const window = windows[Math.max(0, pass)]
      const elapsed = Math.max(0, time - window[0] * duration), remaining = Math.max(0, window[1] * duration - time)
      // Every contour starts with a pierce: a short, hotter flare before the steady cut.
      const peak = Math.exp(-Math.pow((elapsed - 0.05) / 0.06, 2))
      const flicker = 0.86 + Math.sin(time * 73) * 0.05 + Math.sin(time * 151 + 1.3) * 0.04 + Math.sin(time * 311 + 0.6) * 0.03
        + (random(Math.floor(time * 45)) - 0.5) * 0.1
      const intensity = active && pass >= 0 ? smooth(elapsed, 0, 0.025) * smooth(remaining, 0, 0.03) * flicker * (1 + peak * 0.35) : 0
      camera.getWorldPosition(cameraLocal); parent.worldToLocal(cameraLocal)
      parent.getWorldQuaternion(rotation).invert()
      up.set(0, 1, 0).applyQuaternion(rotation)
      gravity.copy(up).multiplyScalar(-laserVisuals.gravity)
      for (const glow of [core, inner, halo, lens, pool]) {
        glow.visible = intensity > 0.002
        glow.position.copy(contact); glow.position.z += 0.03
      }
      pool.position.z -= 0.02
      core.scale.setScalar(0.14 + peak * 0.06 + flicker * 0.02); core.material.color.setRGB(5, 4.3, 2.9).multiplyScalar(intensity)
      inner.scale.setScalar(0.4 + peak * 0.18); inner.material.color.setRGB(2.4, 1.15, 0.28).multiplyScalar(intensity)
      halo.scale.setScalar(1.1 + peak * 0.25); halo.material.color.setRGB(0.42, 0.14, 0.025).multiplyScalar(intensity)
      lens.scale.set(1.1 + peak * 0.4, 0.024 + peak * 0.01, 1); lens.material.color.setRGB(1.1, 0.55, 0.16).multiplyScalar(intensity * (0.25 + peak * 0.3))
      pool.scale.setScalar(0.24); pool.material.color.setRGB(2.6, 0.8, 0.12).multiplyScalar(Math.min(1, intensity * 1.2))

      let count = 0
      const total = Math.min(capacity, Math.round(laserVisuals.sparkCount + laserVisuals.drossCount))
      for (let i = 0; i < total; i++) {
        const slot = i * 7.31 + 23
        const dross = i < laserVisuals.drossCount
        const life = dross ? 0.4 + random(slot + 3) * 0.4 : laserVisuals.particleLifetime * (0.4 + random(slot + 3) * 0.9)
        const cycle = (time + random(slot + 17) * life) / life
        const age = fract(cycle) * life, birth = time - age
        // A fresh draw on every emission keeps the stream from repeating.
        const seed = slot + Math.floor(cycle) * 19.19
        if (!sampleContact(birth / duration, born)) continue
        if (sampleContact((birth + 0.004) / duration, ahead) && ahead.distanceToSquared(born) > 1e-12) tangent.subVectors(ahead, born)
        else if (sampleContact((birth - 0.004) / duration, ahead)) tangent.subVectors(born, ahead)
        else tangent.set(1, 0, 0)
        tangent.setZ(0).normalize()
        side.set(-tangent.y, tangent.x, 0)
        const pierce = Math.exp(-Math.max(0, birth - windows[Math.max(0, passAt(birth / duration))][0] * duration) / 0.1)
        // Melt is blown out of the kerf behind the moving nozzle; a fresh pierce splashes up all around.
        const splash = random(seed + 4) * Math.PI * 2
        velocity.copy(tangent).multiplyScalar(-(0.2 + random(seed + 6) * 1.2) * (1 - pierce))
          .addScaledVector(side, (random(seed + 8) - 0.5) * 1.5)
        velocity.x += Math.cos(splash) * pierce * 1.2; velocity.y += Math.sin(splash) * pierce * 1.2
        velocity.z = (dross ? 0.25 : 0.65) + random(seed + 15) * 1.1 + pierce * 0.6
        const speed = dross ? 0.6 + random(seed + 9) * 0.9 : laserVisuals.sparkSpeed * (0.3 + Math.pow(random(seed + 9), 0.65) * 0.95)
        velocity.normalize().multiplyScalar(speed)
        const nearLens = !dross && i % 37 === 0
        if (nearLens) { towardCamera.subVectors(cameraLocal, born).normalize(); velocity.addScaledVector(towardCamera, speed * 1.6) }
        particle.copy(born)
        const bounces = simulate(birth, age, dross ? 0.8 : laserVisuals.drag, dross)
        // Dross stuck to scrap leaves with it.
        if (dross && bounces && !onSheet(particle.x, particle.y, phase)) continue
        const progress = age / life
        // Fine sparks leave white-hot and cool fast; dross keeps glowing on the sheet.
        const heat = dross ? 0.85 * Math.pow(1 - progress, 1.5) : Math.pow(1 - progress, 0.8) * Math.pow(0.74, bounces)
        const fade = smooth(age, 0, 0.01) * (1 - smooth(progress, 0.8, 1)) * endFade
        heatColor(heat, color).multiplyScalar(fade * (dross ? 0.8 : 1))
        const index = count * 3
        particle.toArray(heads, index)
        // Shutter-length streak; tighter as the spark slows down.
        const streak = Math.min(0.4, velocity.length() * laserVisuals.shutter)
        towardCamera.copy(velocity).setLength(streak)
        particle.sub(towardCamera).toArray(tails, index)
        color.toArray(colors, index)
        widths[count] = laserVisuals.sparkWidth * (0.6 + random(seed + 19) * 0.8) * (dross ? 2.2 : 1) * (nearLens ? 1.25 : 1)
        count++
      }
      streaks.commit(count, contact, parent, camera, renderer, laserVisuals.depthOfField)

      let fumeCount = 0
      fumes.forEach((puff, i) => {
        const life = 0.8, age = (time + i / fumes.length * life) % life
        const emitting = sampleContact((time - age) / duration, born)
        puff.visible = emitting && endFade > 0
        if (!puff.visible) return
        fumeCount++
        puff.position.copy(born).addScaledVector(up, age * 1.3)
        puff.position.x += Math.sin(age * 4 + i) * age * 0.15
        puff.position.z += 0.08 + age * 0.25
        puff.scale.setScalar(0.12 + age * 0.85)
        puff.material.rotation = i * 2.4 + age * 0.3
        puff.material.opacity = Math.sin(age / life * Math.PI) * laserVisuals.fumeIntensity * endFade
      })
      return { intensity, flash: peak * intensity, bloom: count || intensity > 0 ? laserVisuals.bloomStrength * (1 + peak * intensity * 0.5) : 0,
        sparks: count, fumes: fumeCount, light: core.position }
    },
    dispose() { glowTexture.dispose(); fumeTexture.dispose() },
  }
}
