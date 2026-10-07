import * as T from 'three'
import { BLOOM_LAYER } from './bloom'

const clamp = (n: number) => T.MathUtils.clamp(n, 0, 1)
const fract = (n: number) => n - Math.floor(n)
export const random = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453)

// Blackbody-like ramp in linear HDR: dark, cherry red, orange, yellow, white-hot.
const heatKeys = [[0, 0, 0], [1.1, 0.14, 0.01], [2.7, 0.82, 0.09], [4.3, 2.1, 0.5], [6.4, 4.7, 2.6]]
export function heatColor(heat: number, target: T.Color) {
  const h = clamp(heat) * 4, i = Math.min(3, Math.floor(h)), f = h - i
  const a = heatKeys[i], b = heatKeys[i + 1]
  return target.setRGB(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f)
}
const vec3 = (key: number[]) => `vec3(${key.map(n => n.toFixed(2)).join(', ')})`
// The same ramp for shaders.
export const heatRampGlsl = `vec3 heatRamp(float heat) {
  float h = clamp(heat, 0.0, 1.0) * 4.0;
  ${heatKeys.slice(0, -1).map((key, i) => `if (h < ${i + 1}.0) return mix(${vec3(key)}, ${vec3(heatKeys[i + 1])}, h - ${i}.0);`).join('\n  ')}
  return ${vec3(heatKeys[heatKeys.length - 1])};
}`

// Soft radial glow, or a cluster of puffs for smoke.
export function createEffectTexture(smoke: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < (smoke ? 16 : 1); i++) {
    const x = smoke ? 36 + random(i + 2) * 56 : 64
    const y = smoke ? 24 + random(i + 51) * 78 : 64
    const r = smoke ? 12 + random(i + 81) * 23 : 64
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, smoke ? '#ffffff35' : '#ffffffff')
    g.addColorStop(smoke ? 0.35 : 0.1, smoke ? '#ffffff20' : '#ffffffd0')
    g.addColorStop(smoke ? 0.45 : 0.3, smoke ? '#ffffff10' : '#ffffff30')
    g.addColorStop(1, '#ffffff00')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  }
  return new T.CanvasTexture(canvas)
}

// Camera-facing capsules stretched along each spark's screen velocity (motion blur).
const streakVertex = `attribute vec3 aHead; attribute vec3 aTail; attribute vec3 aColor; attribute float aWidth;
  uniform vec2 uResolution; uniform float uFocus; uniform float uDof;
  varying vec3 vColor; varying vec2 vLocal; varying float vLength; varying float vWidth;
  void main() {
    vec4 viewHead = modelViewMatrix * vec4(aHead, 1.0);
    vec4 head = projectionMatrix * viewHead;
    vec4 tail = projectionMatrix * modelViewMatrix * vec4(aTail, 1.0);
    vec2 halfRes = uResolution * 0.5;
    vec2 hs = head.xy / head.w * halfRes, ts = tail.xy / tail.w * halfRes;
    float defocus = clamp(abs(-viewHead.z - uFocus) * uDof, 0.0, 3.0);
    float px = aWidth * projectionMatrix[1][1] * halfRes.y / head.w * (1.0 + defocus);
    float width = max(px, 1.25);
    vec2 axis = hs - ts;
    float len = length(axis);
    vec2 dir = len > 0.001 ? axis / len : vec2(1.0, 0.0);
    vec2 side = vec2(-dir.y, dir.x);
    float along = mix(-width, len + width, position.x);
    vec2 screen = ts + dir * along + side * position.y * width;
    vec4 clip = mix(tail, head, position.x);
    gl_Position = vec4(screen / halfRes * clip.w, clip.z, clip.w);
    // Thin, long or defocused sparks spread the same light over more pixels.
    float spread = mix(1.0, 0.55, clamp(len / (width * 24.0), 0.0, 1.0));
    vColor = aColor * min(1.0, px / width) * spread / (1.0 + defocus * 0.8);
    vLocal = vec2(along, position.y * width);
    vLength = len; vWidth = width;
  }`
const streakFragment = `varying vec3 vColor; varying vec2 vLocal; varying float vLength; varying float vWidth;
  void main() {
    float dx = max(max(-vLocal.x, vLocal.x - vLength), 0.0);
    float d = length(vec2(dx, vLocal.y)) / vWidth;
    float core = exp(-d * d * 4.5);
    float t = vLength > 0.001 ? clamp(vLocal.x / vLength, 0.0, 1.0) : 1.0;
    gl_FragColor = vec4(vColor * core * mix(0.12, 1.0, t * t), 1.0);
    #include <colorspace_fragment>
    gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
  }`

// One instanced draw for every spark of an effect; callers fill the arrays and commit a count.
export function createSparkStreaks(capacity: number) {
  const geometry = new T.InstancedBufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3))
  geometry.setIndex([0, 1, 2, 2, 1, 3])
  const heads = new Float32Array(capacity * 3), tails = new Float32Array(capacity * 3)
  const colors = new Float32Array(capacity * 3), widths = new Float32Array(capacity)
  for (const [name, array, size] of [['aHead', heads, 3], ['aTail', tails, 3], ['aColor', colors, 3], ['aWidth', widths, 1]] as const) {
    geometry.setAttribute(name, new T.InstancedBufferAttribute(array, size).setUsage(T.DynamicDrawUsage))
  }
  geometry.instanceCount = 0
  const material = new T.ShaderMaterial({
    uniforms: { uResolution: { value: new T.Vector2(1, 1) }, uFocus: { value: 12 }, uDof: { value: 0.5 } },
    vertexShader: streakVertex, fragmentShader: streakFragment, transparent: true, depthWrite: false,
    blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneFactor,
  })
  const mesh = new T.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.layers.set(BLOOM_LAYER)
  const viewPoint = new T.Vector3(), size = new T.Vector2()
  return {
    mesh, heads, tails, colors, widths,
    // Focus is in `parent` space; depth of field softens sparks away from it.
    commit(count: number, focus: T.Vector3, parent: T.Object3D, camera: T.Camera, renderer: T.WebGLRenderer, depthOfField: number) {
      geometry.instanceCount = count
      for (const name of ['aHead', 'aTail', 'aColor', 'aWidth']) geometry.getAttribute(name).needsUpdate = true
      parent.localToWorld(viewPoint.copy(focus)); viewPoint.applyMatrix4(camera.matrixWorldInverse)
      material.uniforms.uFocus.value = -viewPoint.z
      material.uniforms.uDof.value = depthOfField
      material.uniforms.uResolution.value.copy(renderer.getDrawingBufferSize(size))
    },
  }
}
