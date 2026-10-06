import * as T from 'three'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

// Emitters (sparks, arc, hot seam) live on this layer; layer 0 only occludes them.
export const BLOOM_LAYER = 1
// Visible in the main pass, ignored by the bloom pass (e.g. smoke).
export const PLAIN_LAYER = 2

const vertexShader = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
const levels = 5

// Selective HDR bloom: emitters are drawn into a half-resolution buffer with the
// part as a black occluder, blurred through a mip chain and added over the frame.
export function createBloom(renderer: T.WebGLRenderer) {
  const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float')
  const type = hdr ? T.HalfFloatType : T.UnsignedByteType
  const source = new T.WebGLRenderTarget(1, 1, { type, depthBuffer: true })
  const mips = Array.from({ length: levels }, () => new T.WebGLRenderTarget(1, 1, { type, depthBuffer: false }))
  const occluder = new T.MeshBasicMaterial({ color: 0x000000 })
  const quad = new FullScreenQuad()
  const texel = () => ({ value: new T.Vector2() })
  // Dual-filter downsample: a 4x4 footprint per tap set keeps tiny sparks from flickering.
  const down = new T.ShaderMaterial({
    uniforms: { tMap: { value: null }, uTexel: texel() }, vertexShader, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tMap, vUv).rgb * 4.0;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(1.0, -1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
        c += texture2D(tMap, vUv + uTexel * vec2(1.0, 1.0)).rgb;
        gl_FragColor = vec4(c / 8.0, 1.0);
      }`,
  })
  // 3x3 tent upsample, accumulated additively into the next larger level.
  const up = new T.ShaderMaterial({
    uniforms: { tMap: { value: null }, uTexel: texel(), uWeight: { value: 1 } }, vertexShader, depthTest: false, depthWrite: false,
    blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor,
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uTexel; uniform float uWeight; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tMap, vUv).rgb * 4.0;
        c += (texture2D(tMap, vUv + uTexel * vec2(0.0, -1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(0.0, 1.0)).rgb
          + texture2D(tMap, vUv + uTexel * vec2(-1.0, 0.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, 0.0)).rgb) * 2.0;
        c += texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, -1.0)).rgb
          + texture2D(tMap, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, 1.0)).rgb;
        gl_FragColor = vec4(c / 16.0 * uWeight, 1.0);
      }`,
  })
  // Additive composite that stays valid premultiplied alpha over the transparent canvas.
  const composite = new T.ShaderMaterial({
    uniforms: { tBloom: { value: mips[0].texture }, tSource: { value: source.texture }, uStrength: { value: 1 }, uTight: { value: 0.35 } },
    vertexShader, depthTest: false, depthWrite: false, transparent: true,
    blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneFactor,
    fragmentShader: `uniform sampler2D tBloom; uniform sampler2D tSource; uniform float uStrength; uniform float uTight; varying vec2 vUv;
      void main() {
        vec3 c = (texture2D(tBloom, vUv).rgb / ${levels.toFixed(1)} + texture2D(tSource, vUv).rgb * uTight) * uStrength;
        c = 1.0 - exp(-c);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
      }`,
  })
  const clearColor = new T.Color()
  return {
    setSize(width: number, height: number) {
      const w = Math.max(1, Math.round(width / 2)), h = Math.max(1, Math.round(height / 2))
      source.setSize(w, h)
      mips.forEach((target, i) => target.setSize(Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1))))
    },
    render(scene: T.Scene, camera: T.Camera, strength: number) {
      if (strength <= 0) return
      const mask = camera.layers.mask
      const background = scene.background
      const autoClear = renderer.autoClear
      const toneMapping = renderer.toneMapping
      const alpha = renderer.getClearAlpha()
      renderer.getClearColor(clearColor)
      renderer.autoClear = false
      renderer.toneMapping = T.NoToneMapping
      scene.background = null
      renderer.setRenderTarget(source)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      // Occluders write depth as black; emitters are then depth-tested against them.
      camera.layers.set(0)
      scene.overrideMaterial = occluder
      renderer.render(scene, camera)
      scene.overrideMaterial = null
      camera.layers.set(BLOOM_LAYER)
      renderer.render(scene, camera)
      camera.layers.mask = mask
      scene.background = background
      let input: T.WebGLRenderTarget = source
      for (const target of mips) {
        down.uniforms.tMap.value = input.texture
        down.uniforms.uTexel.value.set(1 / input.width, 1 / input.height)
        quad.material = down
        renderer.setRenderTarget(target)
        quad.render(renderer)
        input = target
      }
      quad.material = up
      for (let i = levels - 1; i > 0; i--) {
        up.uniforms.tMap.value = mips[i].texture
        up.uniforms.uTexel.value.set(1 / mips[i].width, 1 / mips[i].height)
        // Wider levels carry slightly more weight for a soft, cinematic falloff.
        up.uniforms.uWeight.value = 1 + i * 0.12
        renderer.setRenderTarget(mips[i - 1])
        quad.render(renderer)
      }
      renderer.setRenderTarget(null)
      renderer.toneMapping = toneMapping
      composite.uniforms.uStrength.value = strength
      quad.material = composite
      quad.render(renderer)
      renderer.setClearColor(clearColor, alpha)
      renderer.autoClear = autoClear
    },
    dispose() {
      source.dispose(); mips.forEach(target => target.dispose())
      ;[occluder, down, up, composite].forEach(material => material.dispose())
      quad.dispose()
    },
  }
}
