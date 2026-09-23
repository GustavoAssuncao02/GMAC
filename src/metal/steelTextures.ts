import * as T from 'three'

// Multi-scale mill marks, fine brushing and sparse tool scratches in real UV space.
export function createSteelTextures(renderer: T.WebGLRenderer) {
  const size = 256
  let seed = 1729
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const grids = [8, 32, 128].map(n => ({ n, values: Float32Array.from({ length: n * n }, random) }))
  const noise = (x: number, y: number, grid: typeof grids[number]) => {
    const gx = x / size * grid.n, gy = y / size * grid.n
    const ix = Math.floor(gx), iy = Math.floor(gy)
    const fx = gx - ix, fy = gy - iy
    const at = (a: number, b: number) => grid.values[(b % grid.n) * grid.n + a % grid.n]
    return T.MathUtils.lerp(T.MathUtils.lerp(at(ix, iy), at(ix + 1, iy), fx), T.MathUtils.lerp(at(ix, iy + 1), at(ix + 1, iy + 1), fx), fy)
  }
  const canvases = Array.from({ length: 3 }, () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    return canvas
  })
  const contexts = canvases.map(canvas => canvas.getContext('2d')!)
  const maps = contexts.map(context => context.createImageData(size, size))
  const brush = Float32Array.from({ length: size }, random)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const broad = noise(x, y, grids[0])
    const mid = noise(x, y, grids[1])
    const fine = noise(x, y, grids[2])
    const grit = random()
    const brushed = brush[y] * 0.8 + grit * 0.2
    const values = [184 + broad * 18 + mid * 12 + brushed * 8, 174 + broad * 24 + fine * 18 + brushed * 18, 124 + mid * 8 + fine * 5 + brushed * 14]
    maps.forEach((map, index) => {
      const offset = (y * size + x) * 4
      const v = values[index]
      map.data.set([v, v, v, 255], offset)
    })
  }
  contexts.forEach((context, index) => context.putImageData(maps[index], 0, 0))
  for (let i = 0; i < 180; i++) {
    const x = random() * size, y = random() * size
    const length = 8 + random() * 260, slope = (random() - 0.5) * 6
    contexts.forEach((context, index) => {
      context.strokeStyle = index === 0 ? 'rgba(235,239,242,.16)' : index === 1 ? 'rgba(60,60,60,.2)' : 'rgba(220,220,220,.28)'
      context.lineWidth = i % 13 === 0 ? 1.3 : 0.45
      context.beginPath(); context.moveTo(x, y); context.lineTo(x + length, y + slope); context.stroke()
    })
  }
  const textures = canvases.map((canvas, index) => {
    const texture = new T.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = T.RepeatWrapping
    texture.repeat.set(0.85, 0.85)
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    if (index === 0) texture.colorSpace = T.SRGBColorSpace
    return texture
  })
  const loader = new T.TextureLoader()
  const loaded: Promise<T.Texture>[] = []
  const brushed = (name: string, color = false) => {
    let resolve!: (texture: T.Texture) => void, reject!: (error: unknown) => void
    loaded.push(new Promise<T.Texture>((yes, no) => { resolve = yes; reject = no }))
    const texture = loader.load(`${import.meta.env.BASE_URL}assets/steel/${name}.webp`, resolve, undefined, reject)
    texture.wrapS = texture.wrapT = T.RepeatWrapping
    texture.repeat.set(0.85, 0.85)
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    if (color) texture.colorSpace = T.SRGBColorSpace
    return texture
  }
  const brushedColor = brushed('brushed-color', true)
  const brushedRoughness = brushed('brushed-roughness')
  const brushedNormal = brushed('brushed-normal')
  return { brushedColor, brushedRoughness, brushedNormal, ready: Promise.all(loaded), color: textures[0], roughness: textures[1], height: textures[2], dispose: () => [...textures, brushedColor, brushedRoughness, brushedNormal].forEach(texture => texture.dispose()) }
}
