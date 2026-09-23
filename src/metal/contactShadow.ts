import * as T from 'three'

export function createContactShadow() {
  const width = 512, height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')!
  const image = context.createImageData(width, height)
  let seed = 731
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const noise = seed / 4294967296
    const nx = (x / width - 0.5) * 2, ny = (y / height - 0.5) * 2
    const radius = Math.sqrt(nx * nx + ny * ny)
    const edge = Math.pow(Math.max(0, 1 - radius), 1.6)
    // Dark contact center with a faint, granular surface around it; no plane edge.
    const center = Math.exp(-(nx * nx * 5 + ny * ny * 8))
    const brush = Math.sin(y * 2.7 + Math.sin(x * 0.018)) * 2
    const value = 13 + (1 - center) * 29 + noise * 10 + brush
    const i = (y * width + x) * 4
    image.data.set([value, value + 2, value + 4, edge * (0.6 + noise * 0.3) * 255], i)
  }
  context.putImageData(image, 0, 0)
  const texture = new T.CanvasTexture(canvas)
  texture.colorSpace = T.SRGBColorSpace
  const material = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 1
  return { mesh, texture }
}
