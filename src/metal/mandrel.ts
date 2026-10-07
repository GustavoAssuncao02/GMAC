import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import type { createSteelTextures } from './steelTextures'
import { BLOOM_LAYER } from './bloom'
import { heatColor, heatRampGlsl } from './sparks'

const smooth = T.MathUtils.smoothstep
const smoother = T.MathUtils.smootherstep
const mix = T.MathUtils.lerp
const clamp = (n: number) => T.MathUtils.clamp(n, 0, 1)
const rad = T.MathUtils.degToRad
const easeOut = (n: number) => 1 - Math.pow(1 - clamp(n), 3)

// Each weld pass travels at constant speed, easing only where the torch starts and stops.
export const weldWindows = [[0.28, 0.555], [0.635, 0.91]] as const
const travelAccel = 0.14
const travelSpeed = 1 / (1 - travelAccel)
const travelEase = (n: number) => {
  const t = clamp(n), a = travelAccel, v = travelSpeed
  return t < a ? v * t * t / (2 * a) : t > 1 - a ? 1 - v * (1 - t) * (1 - t) / (2 * a) : v * (t - a / 2)
}
const travelInverse = (y: number) => {
  const a = travelAccel, v = travelSpeed, edge = v * a / 2
  return y < edge ? Math.sqrt(2 * a * y / v) : y > 1 - edge ? 1 - Math.sqrt(2 * a * (1 - y) / v) : y / v + a / 2
}
const passAt = (phase: number, pass: number) => {
  const [start, end] = weldWindows[pass]
  return travelEase((phase - start) / (end - start))
}
// The laser runs along the whole cut path with a smoothstep between these phases.
const cutStart = 0.06, cutEnd = 0.79
const cutDuration = 3.6

// Flat ribbon along the cut path; vertices carry the path index and the instant the nozzle reaches them.
const kerfVertex = `attribute vec3 aSide; attribute vec2 aPath;
  uniform float uWidth;
  varying float vAcross; varying vec2 vPath;
  void main() {
    vAcross = aSide.z; vPath = aPath;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(aSide.xy * uWidth, 0.0), 1.0);
  }`
// The cut ends exactly under the nozzle and cools behind it within a few tenths of a second.
const hotKerfFragment = `uniform float uOffset; uniform float uTime; uniform float uFade;
  varying float vAcross; varying vec2 vPath;
  ${heatRampGlsl}
  void main() {
    if (vPath.x > uOffset) discard;
    float age = max(0.0, uTime - vPath.y);
    float heat = exp(-age / 0.05);
    gl_FragColor = vec4(heatRamp(heat) * exp(-vAcross * vAcross * 4.0) * uFade * 0.8, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
  }`
const kerfFragment = `uniform float uOffset; uniform float uFade;
  varying float vAcross; varying vec2 vPath;
  void main() {
    if (vPath.x > uOffset) discard;
    gl_FragColor = vec4(0.018, 0.016, 0.015, (1.0 - smoothstep(0.4, 1.0, abs(vAcross))) * 0.85 * uFade);
    #include <colorspace_fragment>
  }`

// One workpiece, shared by all stages. Mounting holes and screws use the same anchors.
export function createMandrel(surface: ReturnType<typeof createSteelTextures>) {
  const root = new T.Group()
  const body = new T.Group()
  const tooling = new T.Group()
  root.add(body, tooling)
  const finishMaterials: T.MeshPhysicalMaterial[] = []
  const finishUniform = { value: 0 }
  const steel = (color = 0x929ca5, roughness = 0.65, finish = true) => {
    const material = new T.MeshPhysicalMaterial({ color, metalness: 0.94, roughness,
      map: surface.color, roughnessMap: surface.roughness, bumpMap: surface.height,
      bumpScale: 0.018, normalMap: finish ? surface.brushedNormal : null, normalScale: new T.Vector2(0, 0), envMapIntensity: 1.25, anisotropy: 0.35 })
    if (finish) {
      finishMaterials.push(material)
      material.onBeforeCompile = shader => {
        shader.uniforms.uMandrelFinish = finishUniform
        shader.uniforms.uBrushedColor = { value: surface.brushedColor }
        shader.uniforms.uBrushedRoughness = { value: surface.brushedRoughness }
        shader.fragmentShader = 'uniform float uMandrelFinish; uniform sampler2D uBrushedColor; uniform sampler2D uBrushedRoughness;\n' + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
          '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * texture2D(uBrushedColor, vMapUv).rgb, uMandrelFinish);')
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, roughness * texture2D(uBrushedRoughness, vMapUv).g, uMandrelFinish);')
      }
      // Brushed roughness follows the same transition as the visible surface.
      material.customProgramCacheKey = () => 'mandrel-finish'
    }
    return material
  }
  const metal = steel()
  const rawMetal = steel(0x737c83, 0.8, false)
  const toolMetal = steel(0x424d58, 0.38, false)
  const darkMetal = steel(0x303942, 0.28, false)
  const boltMetal = steel(0xaeb6bf, 0.27, false)
  const copper = steel(0xb78049, 0.3, false)
  const brightMetal = steel(0xbac5cf, 0.24, false)
  const mesh = (geometry: T.BufferGeometry, parent: T.Object3D, material: T.Material = metal) => {
    const object = new T.Mesh(geometry, material)
    object.castShadow = object.receiveShadow = true
    parent.add(object)
    return object
  }
  const box = (parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material = metal) => {
    const object = mesh(new RoundedBoxGeometry(w, h, d, 2, 0.035), parent, material)
    object.position.set(x, y, z)
    return object
  }
  const extrusion = (shape: T.Shape, depth: number, bevel = 0.018) => {
    const geometry = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
      bevelSegments: 3, curveSegments: 96, steps: 1 })
    // Smooth cylindrical walls and bevels while retaining machined corners.
    const originalNormals = geometry.getAttribute('normal').clone()
    toCreasedNormals(geometry, Math.PI / 9)
    const normals = geometry.getAttribute('normal')
    // Extrusion caps must stay perfectly planar, including triangles beside bevels.
    for (let i = 0; i < normals.count; i++) {
      if (Math.abs(originalNormals.getZ(i)) > 0.999) normals.setXYZ(i, 0, 0, Math.sign(originalNormals.getZ(i)))
    }
    const outlineCurve = shape.curves[0]
    if (shape.curves.length === 1 && outlineCurve instanceof T.EllipseCurve) {
      const radius = outlineCurve.xRadius
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < normals.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
        const r = Math.hypot(x, y)
        if (r < radius - 0.00001 || Math.abs(originalNormals.getZ(i)) > 0.999) continue
        // Analytic lathe normals remove triangulation ripples in metallic reflections.
        const nz = z < 0 ? z / bevel : z > depth ? (z - depth) / bevel : 0
        const nr = nz ? Math.max(0, (r - radius) / bevel) : 1
        const length = Math.hypot(nr, nz) || 1
        normals.setXYZ(i, x / r * nr / length, y / r * nr / length, nz / length)
      }
    }
    normals.needsUpdate = true
    geometry.computeBoundingBox()
    return geometry
  }
  const extrude = (shape: T.Shape, depth: number, parent: T.Object3D, material: T.Material = metal, bevel = 0.018) =>
    mesh(extrusion(shape, depth, bevel), parent, material)
  const circle = (radius: number) => {
    const shape = new T.Shape()
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
    return shape
  }
  const hole = (shape: T.Shape, x: number, y: number, radius: number) => {
    const path = new T.Path()
    path.absarc(x, y, radius, 0, Math.PI * 2, true)
    shape.holes.push(path)
  }
  const cylinder = (parent: T.Object3D, radius: number, height: number, material: T.Material = metal) => {
    const object = mesh(new T.CylinderGeometry(radius, radius, height, 48), parent, material)
    object.rotation.x = Math.PI / 2
    return object
  }
  const blankMaterial = rawMetal.clone()
  blankMaterial.transparent = true
  const blank = box(root, 5.1, 4.1, 0.28, 0, 0, 0.14, blankMaterial)

  const core = new T.Group()
  body.add(core)
  const baseShape = circle(1.38)
  hole(baseShape, 0, 0, 0.84)
  extrude(baseShape, 0.28, core)
  const collar = new T.Group()
  collar.position.z = 0.28
  core.add(collar)
  const collarShape = circle(1.38)
  const bore = new T.Path()
  // Radial slots expose the dark internal guides visible in the supplied photo.
  for (let i = 0; i < 12 * 8; i++) {
    const angle = -i / (12 * 8) * Math.PI * 2
    const radius = i % 8 >= 2 && i % 8 <= 5 ? 1.01 : 0.86
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
    if (i === 0) bore.moveTo(x, y)
    else bore.lineTo(x, y)
  }
  bore.closePath()
  collarShape.holes.push(bore)
  extrude(collarShape, 0.52, collar)
  for (let i = 0; i < 12; i++) {
    const angle = (i + 0.44) / 12 * Math.PI * 2
    const guide = box(collar, 0.12, 0.13, 0.44, Math.cos(angle) * 0.955, Math.sin(angle) * 0.955, 0.25, darkMetal)
    guide.rotation.z = angle
    const internalScrew = cylinder(collar, 0.057, 0.025, boltMetal)
    internalScrew.position.set(Math.cos(angle) * 0.96, Math.sin(angle) * 0.96, 0.493)
    const socket = cylinder(collar, 0.025, 0.027, toolMetal)
    socket.position.copy(internalScrew.position).add(new T.Vector3(0, 0, 0.012))
  }

  const ears: { group: T.Group; tip: T.Group; side: number; reinforcement: T.Mesh }[] = []
  const earMeshes: T.Mesh[] = []
  const earGeometries: T.BufferGeometry[][] = []
  const chamfers: T.Mesh[] = []
  const fasteners: T.Group[] = []
  const washers: T.Mesh[] = []
  const mounts: T.Vector3[] = []
  for (const side of [-1, 1]) {
    const group = new T.Group()
    group.position.x = side * 1.08
    body.add(group)
    const shape = new T.Shape()
    shape.moveTo(0, -0.72)
    shape.lineTo(1.13, -0.72)
    shape.lineTo(1.13, 0.72)
    shape.lineTo(0, 0.72)
    shape.closePath()
    const ear = extrude(shape, 0.28, group)
    ear.scale.x = side
    earMeshes.push(ear)
    const variants = [ear.geometry]
    for (let mask = 1; mask < 4; mask++) {
      const drilledShape = shape.clone()
      for (const [i, y] of [-0.36, 0.36].entries()) if (mask & (1 << i)) hole(drilledShape, 0.86, y, 0.145)
      variants.push(extrusion(drilledShape, 0.28))
    }
    earGeometries.push(variants)
    // A small bent outer lip stays attached; the press corrects this in stage 03.
    const tip = new T.Group()
    tip.position.x = side * 1.13
    group.add(tip)
    const lip = new T.Shape()
    lip.moveTo(0, -0.72)
    lip.lineTo(0.15, -0.72)
    lip.quadraticCurveTo(0.32, -0.72, 0.32, -0.55)
    lip.lineTo(0.32, 0.55)
    lip.quadraticCurveTo(0.32, 0.72, 0.15, 0.72)
    lip.lineTo(0, 0.72)
    lip.closePath()
    extrude(lip, 0.28, tip).scale.x = side
    const reinforcement = box(group, 1.1, 1.3, 0.07, side * 0.57, 0, -0.035)
    ears.push({ group, tip, side, reinforcement })
    for (const y of [-0.36, 0.36]) {
      const x = side * 0.86
      const chamfer = mesh(new T.TorusGeometry(0.149, 0.014, 8, 48), group, brightMetal)
      chamfer.position.set(x, y, 0.284)
      chamfers.push(chamfer)
      const mount = new T.Vector3(side * 1.94, y, 0.28)
      mounts.push(mount)
      const screw = new T.Group()
      screw.position.copy(mount)
      body.add(screw)
      const shaft = cylinder(screw, 0.106, 0.32, boltMetal)
      shaft.position.z = -0.12
      for (let j = 0; j < 7; j++) {
        const thread = mesh(new T.TorusGeometry(0.105, 0.012, 5, 20), screw, boltMetal)
        thread.position.z = -0.27 + j * 0.04
      }
      const head = circle(0.176)
      const hex = new T.Path()
      for (let j = 0; j < 6; j++) {
        const angle = -j / 6 * Math.PI * 2
        if (j === 0) hex.moveTo(Math.cos(angle) * 0.083, Math.sin(angle) * 0.083)
        else hex.lineTo(Math.cos(angle) * 0.083, Math.sin(angle) * 0.083)
      }
      hex.closePath()
      head.holes.push(hex)
      extrude(head, 0.15, screw, boltMetal, 0.008).position.z = 0.055
      const recess = cylinder(screw, 0.082, 0.015, toolMetal)
      recess.position.z = 0.062
      const washerShape = circle(0.217)
      hole(washerShape, 0, 0, 0.115)
      const washer = extrude(washerShape, 0.035, body, brightMetal, 0.005)
      washer.position.copy(mount)
      washers.push(washer)
      fasteners.push(screw)
    }
  }

  // The square's waste is a real frame with the finished outline removed.
  const outline = new T.Shape()
  const meet = Math.asin(0.72 / 1.38)
  const joinX = Math.cos(meet) * 1.38
  outline.moveTo(joinX, 0.72)
  outline.absarc(0, 0, 1.38, meet, Math.PI - meet, false)
  outline.lineTo(-2.36, 0.72)
  outline.quadraticCurveTo(-2.53, 0.72, -2.53, 0.55)
  outline.lineTo(-2.53, -0.55)
  outline.quadraticCurveTo(-2.53, -0.72, -2.36, -0.72)
  outline.lineTo(-joinX, -0.72)
  outline.absarc(0, 0, 1.38, Math.PI + meet, Math.PI * 2 - meet, false)
  outline.lineTo(2.36, -0.72)
  outline.quadraticCurveTo(2.53, -0.72, 2.53, -0.55)
  outline.lineTo(2.53, 0.55)
  outline.quadraticCurveTo(2.53, 0.72, 2.36, 0.72)
  outline.closePath()
  const wasteShape = new T.Shape()
  wasteShape.moveTo(-2.55, -2.05); wasteShape.lineTo(2.55, -2.05)
  wasteShape.lineTo(2.55, 2.05); wasteShape.lineTo(-2.55, 2.05); wasteShape.closePath()
  wasteShape.holes.push(new T.Path(outline.getPoints(96).reverse()))
  const wasteMaterial = rawMetal.clone()
  wasteMaterial.transparent = true
  const waste = extrude(wasteShape, 0.28, root, wasteMaterial, 0)
  const centerWaste = cylinder(root, 0.838, 0.28, rawMetal)
  centerWaste.position.z = 0.14

  const pathPoints = outline.getSpacedPoints(180).map(p => new T.Vector3(p.x, p.y, 0.305))
  for (let i = 0; i <= 100; i++) {
    const a = i / 100 * Math.PI * 2
    pathPoints.push(new T.Vector3(Math.cos(a) * 0.84, Math.sin(a) * 0.84, 0.305))
  }
  for (const side of [-1, 1]) for (let i = 0; i <= 28; i++) pathPoints.push(new T.Vector3(side * 1.12, mix(-0.69, 0.69, i / 28), 0.305))
  const pathBreaks = [181, 282, 311]
  const lastPathPoint = pathPoints.length - 1
  // Inverse of the cut's smoothstep: the phase at which the nozzle reaches a path index.
  const cutPhaseAt = (index: number) => cutStart + (cutEnd - cutStart) * (0.5 - Math.sin(Math.asin(1 - 2 * index / lastPathPoint) / 3))
  // Outline, bore and both flange lines; the laser is off while it jumps between them.
  const contours = [0, ...pathBreaks].map((start, i) => [start, (pathBreaks[i] ?? pathPoints.length) - 1])
  const cutWindows = contours.map(([start, end]) => [cutPhaseAt(start), cutPhaseAt(end)] as const)
  const kerfPositions: number[] = [], kerfSides: number[] = [], kerfPath: number[] = [], kerfIndices: number[] = []
  const kerfDirection = new T.Vector3()
  for (const [start, end] of contours) for (let i = start; i <= end; i++) {
    kerfDirection.subVectors(pathPoints[Math.min(end, i + 1)], pathPoints[Math.max(start, i - 1)]).normalize()
    const vertex = kerfPositions.length / 3
    for (const side of [-1, 1]) {
      kerfPositions.push(pathPoints[i].x, pathPoints[i].y, pathPoints[i].z)
      kerfSides.push(-kerfDirection.y * side, kerfDirection.x * side, side)
      kerfPath.push(i, cutPhaseAt(i) * cutDuration)
    }
    if (i > start) kerfIndices.push(vertex - 2, vertex, vertex - 1, vertex, vertex + 1, vertex - 1)
  }
  const kerfGeometry = new T.BufferGeometry()
  kerfGeometry.setAttribute('position', new T.Float32BufferAttribute(kerfPositions, 3))
  kerfGeometry.setAttribute('aSide', new T.Float32BufferAttribute(kerfSides, 3))
  kerfGeometry.setAttribute('aPath', new T.Float32BufferAttribute(kerfPath, 2))
  kerfGeometry.setIndex(kerfIndices)
  kerfGeometry.computeBoundingSphere()
  const kerfUniforms = { uOffset: { value: -1 }, uTime: { value: 0 }, uFade: { value: 1 } }
  // A dark cut groove, and an additive heat layer over it that feeds the bloom.
  const kerf = new T.Mesh(kerfGeometry, new T.ShaderMaterial({ uniforms: { ...kerfUniforms, uWidth: { value: 0.009 } },
    vertexShader: kerfVertex, fragmentShader: kerfFragment, transparent: true, depthWrite: false }))
  const hotKerf = new T.Mesh(kerfGeometry, new T.ShaderMaterial({ uniforms: { ...kerfUniforms, uWidth: { value: 0.026 } },
    vertexShader: kerfVertex, fragmentShader: hotKerfFragment, transparent: true, depthWrite: false,
    blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneFactor }))
  kerf.renderOrder = 1
  hotKerf.renderOrder = 2
  hotKerf.layers.set(BLOOM_LAYER)
  tooling.add(kerf, hotKerf)
  const pointAlong = (progress: number, points: T.Vector3[], target: T.Vector3) => {
    const offset = clamp(progress) * (points.length - 1)
    const i = Math.min(points.length - 2, Math.floor(offset))
    return target.lerpVectors(points[i], points[i + 1], offset - i)
  }
  const laser = new T.Group()
  tooling.add(laser)
  box(laser, 0.25, 0.3, 0.42, 0, 0, 0.53, toolMetal)
  const nozzle = mesh(new T.CylinderGeometry(0.12, 0.026, 0.25, 24), laser, copper)
  nozzle.rotation.x = Math.PI / 2; nozzle.position.z = 0.19
  const beamMaterial = new T.MeshBasicMaterial({ color: new T.Color(3.4, 1.6, 0.42), toneMapped: false })
  const beam = cylinder(laser, 0.011, 0.095, beamMaterial)
  beam.position.z = 0.035
  beam.layers.set(BLOOM_LAYER)

  // Opposing forming shoes clamp each flange before correcting its angle.
  const presses = ears.map(() => {
    const upper = new T.Group(), lower = new T.Group()
    tooling.add(upper, lower)
    box(upper, 1.28, 1.55, 0.16, 0, 0, 0.08, toolMetal)
    const piston = cylinder(upper, 0.14, 0.64, brightMetal)
    piston.position.z = 0.48
    box(lower, 1.28, 1.55, 0.16, 0, 0, -0.08, toolMetal)
    const support = cylinder(lower, 0.18, 0.35, toolMetal)
    support.position.z = -0.33
    return { upper, lower }
  })
  const pressPoint = new T.Vector3()
  // Both the deposited seam and the torch follow the circular collar/flange junction.
  const weldRadius = 1.4
  const weldAngle = Math.asin(0.63 / weldRadius)
  const weldPaths: T.Vector3[][] = [[], []]
  const weldBeads: { position: T.Vector3; angle: number; pass: number; progress: number; deposit: number }[] = []
  const beadGeometry = new T.SphereGeometry(0.029, 8, 6)
  const seam = new T.InstancedMesh(beadGeometry, metal, 66)
  seam.frustumCulled = false
  body.add(seam)
  // Freshly deposited metal glows white-hot and cools through orange to dull red.
  const hotSeam = new T.InstancedMesh(beadGeometry, new T.MeshBasicMaterial({ transparent: true,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }), 66)
  hotSeam.instanceColor = new T.InstancedBufferAttribute(new Float32Array(66 * 3), 3).setUsage(T.DynamicDrawUsage)
  hotSeam.frustumCulled = false
  hotSeam.layers.set(BLOOM_LAYER)
  body.add(hotSeam)
  const beadTransform = new T.Object3D()
  const beadHeat = new T.Color()
  let seamState = NaN
  for (const [pass, side] of [-1, 1].entries()) for (let i = 0; i <= 32; i++) {
    const angle = mix(-weldAngle, weldAngle, i / 32)
    const p = new T.Vector3(side * Math.cos(angle) * weldRadius, Math.sin(angle) * weldRadius, 0.307)
    weldPaths[pass].push(p)
    const angleOnRing = Math.atan2(p.y, p.x)
    const [start, end] = weldWindows[pass]
    weldBeads.push({ position: p, angle: angleOnRing, pass, progress: i / 32, deposit: start + (end - start) * travelInverse(i / 32) })
  }
  const placeBead = (index: number, grow: number, finish: number) => {
    const { position, angle } = weldBeads[index]
    beadTransform.position.copy(position)
    beadTransform.rotation.z = angle
    beadTransform.scale.set(0.8, 1.25, 0.55 - finish * 0.4).multiplyScalar(grow)
    beadTransform.updateMatrix()
    seam.setMatrixAt(index, beadTransform.matrix)
    beadTransform.scale.multiplyScalar(1.1)
    beadTransform.updateMatrix()
    hotSeam.setMatrixAt(index, beadTransform.matrix)
  }
  const relocationStart = new T.Vector3(), relocationEnd = new T.Vector3()
  const relocationLiftA = new T.Vector3(), relocationLiftB = new T.Vector3()
  const relocation = new T.CubicBezierCurve3(relocationStart, relocationLiftA, relocationLiftB, relocationEnd)
  // Between passes the torch lifts in a smooth arc over the collar instead of a straight cut.
  relocationStart.copy(weldPaths[0][32]); relocationEnd.copy(weldPaths[1][0])
  relocationLiftA.copy(relocationStart).setZ(relocationStart.z + 1.25)
  relocationLiftB.copy(relocationEnd).setZ(relocationEnd.z + 1.25)
  const torchAxis = new T.Vector3(0, 0, 1)
  const torchDirection = new T.Vector3()
  const torch = new T.Group()
  tooling.add(torch)
  const torchBody = cylinder(torch, 0.095, 0.55, toolMetal)
  torchBody.position.z = 0.57
  const torchTip = cylinder(torch, 0.045, 0.27, copper)
  torchTip.position.z = 0.17
  torch.rotation.y = -0.4

  const drill = new T.Group()
  tooling.add(drill)
  const chuck = cylinder(drill, 0.18, 0.42, toolMetal)
  chuck.position.z = 0.67
  const bit = cylinder(drill, 0.095, 0.48, brightMetal)
  bit.position.z = 0.23
  const helix = Array.from({ length: 100 }, (_, i) => new T.Vector3(Math.cos(i / 99 * Math.PI * 12) * 0.096, Math.sin(i / 99 * Math.PI * 12) * 0.096, i / 99 * 0.48))
  const flute = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(helix), 100, 0.023, 5, false), drill, darkMetal)
  flute.position.z = -0.015

  const polisher = new T.Group()
  tooling.add(polisher)
  const polishingDisc = new T.Group()
  polisher.add(polishingDisc)
  const pad = cylinder(polishingDisc, 0.24, 0.08, darkMetal)
  pad.position.z = 0.04
  const discRim = mesh(new T.TorusGeometry(0.228, 0.018, 8, 48), polishingDisc, copper)
  discRim.position.z = 0.065
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2
    const groove = box(polishingDisc, 0.11, 0.018, 0.012, Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0.082, brightMetal)
    groove.rotation.z = angle
  }
  const spindle = cylinder(polisher, 0.09, 0.35, toolMetal)
  spindle.position.z = 0.25
  box(polisher, 0.32, 0.46, 0.25, 0, 0.08, 0.43, toolMetal)
  box(polisher, 0.25, 0.3, 0.025, 0, 0.08, 0.565, copper)
  box(polisher, 0.44, 0.11, 0.12, -0.28, 0.09, 0.43, darkMetal)
  const polishTravel = [
    [0.46, -1.14, 0, 0.824], [0.5, -1.9, -0.36, 1.12],
    [0.56, -1.9, -0.36, 0.304], [0.68, -1.9, 0.36, 0.304],
    [0.73, -1.9, 0.36, 1.3], [0.79, 1.9, -0.36, 1.3],
    [0.83, 1.9, -0.36, 0.304], [0.94, 1.9, 0.36, 0.304],
    [1, 1.9, 0.36, 1.3],
  ]

  // Bake rigid subassemblies once: one draw call per material, not per screw thread/guide.
  const batchRigidParts = (group: T.Group) => {
    const batches = new Map<T.Material, T.Mesh[]>()
    for (const child of group.children) {
      if (!(child instanceof T.Mesh) || Array.isArray(child.material)) continue
      const batch = batches.get(child.material) ?? []
      batch.push(child); batches.set(child.material, batch)
    }
    for (const [material, parts] of batches) {
      if (parts.length < 2) continue
      const transformed = parts.map(part => {
        part.updateMatrix()
        return (part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone()).applyMatrix4(part.matrix)
      })
      const combined = mergeGeometries(transformed)
      transformed.forEach(geometry => geometry.dispose())
      if (!combined) continue
      parts.forEach(part => { group.remove(part); part.geometry.dispose() })
      mesh(combined, group, material)
    }
  }
  ;[collar, ...fasteners, polishingDisc, polisher, laser, torch, drill,
    ...presses.flatMap(press => [press.upper, press.lower])].forEach(batchRigidParts)

  const contact = new T.Vector3()
  const roughColor = new T.Color(0x828b94)
  const finalColor = new T.Color(0x929ba3)
  let diagnostics = { holes: 0, bolts: 0, separation: 0, bendError: 0, finish: 0, cut: 0, weld: 0, boltGap: 0, pressGap: 0.85 }
  return {
    root,
    body,
    // Read-only sampling for visual trails; uses the exact existing curved tool path.
    sampleWeldContact(phase: number, target: T.Vector3) {
      const pass = weldWindows.findIndex(([start, end]) => phase > start && phase < end)
      if (pass < 0) return false
      pointAlong(passAt(phase, pass), weldPaths[pass], target)
      return true
    },
    cutWindows,
    // The cut front while the beam is on; false between contours and outside the cut.
    sampleCutContact(phase: number, target: T.Vector3) {
      if (!cutWindows.some(([start, end]) => phase > start && phase < end)) return false
      pointAlong(smooth(phase, cutStart, cutEnd), pathPoints, target)
      return true
    },
    // Fires only while the cut front is molten; the laser effects drive its flicker.
    setLaserBeam(intensity: number) {
      beam.visible = intensity > 0.002
      beamMaterial.color.setRGB(3.4, 1.6, 0.42).multiplyScalar(Math.min(1.4, intensity))
    },
    update(step: number, phase: number, presentationLighting = 0) {
      const cutting = step === 2, bending = step === 3, welding = step === 4, machining = step === 5, finishing = step === 6, assembling = step === 7
      const reveal = cutting ? smooth(phase, 0.005, 0.1) : step >= 2 ? 1 : 0
      blank.visible = reveal < 1
      blankMaterial.opacity = 1 - reveal
      blankMaterial.depthWrite = reveal === 0
      blank.position.z = 0.14 + reveal * 0.025
      body.visible = step >= 2
      const cut = cutting ? smooth(phase, cutStart, cutEnd) : step > 2 ? 1 : 0
      const separated = cutting ? smooth(phase, 0.8, 0.98) : step === 3 ? 1 : welding ? 1 - smooth(phase, 0.06, 0.27) : 0
      const corrected = bending ? smooth(phase, 0.32, 0.76) : step > 3 ? 1 : 0
      const finish = finishing ? smooth(phase, 0.1, 0.92) : step > 6 ? 1 : 0
      const bendError = (step >= 2 ? 1 - corrected : 0) * (cutting ? smooth(phase, 0.8, 0.98) : 1)
      ears.forEach(({ group, tip, side, reinforcement }) => {
        group.position.x = side * (1.08 + separated * 0.36)
        group.rotation.y = side * rad(8) * bendError
        group.rotation.x = -rad(5) * bendError
        tip.rotation.y = side * rad(-11) * bendError
        reinforcement.scale.z = 0.15 + corrected * 0.85
      })
      collar.scale.z = cutting ? 0.015 + smooth(phase, 0.78, 0.97) * 0.985 : 1
      waste.visible = cutting && phase < 0.91
      waste.position.z = -smooth(phase, 0.68, 0.91) * 0.65
      wasteMaterial.opacity = 1 - smooth(phase, 0.72, 0.91)
      wasteMaterial.depthWrite = wasteMaterial.opacity > 0.98
      centerWaste.visible = cutting && phase < 0.76
      centerWaste.position.z = 0.14 - smooth(phase, 0.61, 0.76) * 0.9
      kerf.visible = hotKerf.visible = cutting && phase > cutStart && phase < 0.96
      kerfUniforms.uOffset.value = cut * lastPathPoint
      kerfUniforms.uTime.value = phase * cutDuration
      kerfUniforms.uFade.value = 1 - smooth(phase, 0.8, 0.96)
      laser.visible = cutting && phase < 0.9
      pointAlong(cut, pathPoints, contact)
      laser.position.copy(contact)
      // Lowers onto the sheet, then lifts away once the contour closes.
      laser.position.z += (1 - smooth(phase, 0, 0.06)) * 0.85 + Math.pow(clamp((phase - 0.8) / 0.1), 2) * 1.6
      const pressGap = bending ? (1 - smooth(phase, 0.04, 0.28)) * 0.85 + smooth(phase, 0.82, 1) * 0.85 : 0.85
      presses.forEach(({ upper, lower }, i) => {
        const { group, side } = ears[i]
        upper.visible = lower.visible = bending && phase < 0.995
        group.updateMatrix()
        // Shoes stay in contact with the moving flange throughout the force stroke.
        pressPoint.set(side * 0.7, 0, 0.30).applyMatrix4(group.matrix)
        upper.position.copy(pressPoint); upper.position.z += pressGap
        upper.rotation.copy(group.rotation)
        pressPoint.set(side * 0.7, 0, -0.075).applyMatrix4(group.matrix)
        lower.position.copy(pressPoint); lower.position.z -= pressGap * 0.4
        lower.rotation.copy(group.rotation)
      })
      const passProgress = welding ? [passAt(phase, 0), passAt(phase, 1)] : step > 4 ? [1, 1] : [0, 0]
      const relocating = welding && phase > weldWindows[0][1] && phase < weldWindows[1][0]
      const weldPass = phase <= weldWindows[0][1] ? 0 : 1
      const weld = !welding ? passProgress[1] : weldPass === 0 ? passProgress[0] * 0.46
        : relocating ? 0.46 + 0.08 * (phase - weldWindows[0][1]) / (weldWindows[1][0] - weldWindows[0][1]) : 0.54 + passProgress[1] * 0.46
      seam.visible = step >= 4
      hotSeam.visible = welding
      const seamKey = welding ? -1 - phase : finish
      if (seamKey !== seamState) {
        let count = 0
        weldBeads.forEach(({ pass, progress, deposit }, index) => {
          // The bead ahead of the torch grows in, so the seam advances without popping.
          const grow = clamp((passProgress[pass] - progress) * 32 + 1)
          if (grow <= 0 || passProgress[pass] <= 0) return
          placeBead(index, grow, finish)
          count = index + 1
          if (welding) hotSeam.setColorAt(index, heatColor(Math.exp(-Math.max(0, phase - deposit) * 3.4 / 0.55), beadHeat).multiplyScalar(0.75))
        })
        seam.count = hotSeam.count = count
        seam.instanceMatrix.needsUpdate = hotSeam.instanceMatrix.needsUpdate = true
        if (hotSeam.instanceColor) hotSeam.instanceColor.needsUpdate = true
        seamState = seamKey
      }
      torch.visible = welding && phase > 0.13 && phase < 0.99
      if (welding) {
        if (relocating) {
          // Lift, cross above the collar in a single arc, then settle onto the other seam.
          relocation.getPoint(smoother((phase - weldWindows[0][1]) / (weldWindows[1][0] - weldWindows[0][1]), 0, 1), contact)
        } else {
          pointAlong(passProgress[weldPass], weldPaths[weldPass], contact)
        }
        torch.position.copy(contact)
        torch.position.z += 3.4 * Math.pow(1 - easeOut((phase - 0.13) / 0.15), 2) + 3.4 * Math.pow(clamp((phase - 0.915) / 0.075), 2)
        torchDirection.set(contact.x / weldRadius * 0.4, contact.y / weldRadius * 0.4, 1).normalize()
        torch.quaternion.setFromUnitVectors(torchAxis, torchDirection)
      }

      const drilling = clamp((phase - 0.06) / 0.88) * mounts.length
      const drillingIndex = Math.min(mounts.length - 1, Math.floor(drilling))
      const drillingPhase = drilling - drillingIndex
      let holes = 0, bolts = 0, boltGap = 0
      const drilledHoles: boolean[] = []
      mounts.forEach((_, i) => {
        const drilled = step > 5 || (machining && drilling > i + 0.55)
        drilledHoles.push(drilled)
        chamfers[i].visible = drilled
        if (drilled) holes++
      })
      earMeshes.forEach((ear, index) => {
        const mask = Number(drilledHoles[index * 2]) + Number(drilledHoles[index * 2 + 1]) * 2
        ear.geometry = earGeometries[index][mask]
      })
      drill.visible = machining && phase > 0.04 && phase < 0.985
      if (machining) {
        // Glide from the previous hole with a small hop instead of jumping between positions.
        const from = mounts[Math.max(0, drillingIndex - 1)], to = mounts[drillingIndex]
        const move = smoother(drillingPhase, 0, 0.3)
        contact.lerpVectors(from, to, move)
        drill.position.copy(contact)
        const plunge = smooth(drillingPhase, 0.32, 0.62) - smooth(drillingPhase, 0.7, 0.97)
        const hop = Math.sin(Math.PI * move) * Math.min(0.45, from.distanceTo(to) * 0.12)
        const entry = 1.4 * Math.pow(1 - easeOut((phase - 0.04) / 0.1), 2), exit = 1.4 * Math.pow(clamp((phase - 0.93) / 0.055), 2)
        drill.position.z += 0.6 - plunge * 0.76 + hop + entry + exit
        drill.rotation.z = phase * Math.PI * 80
      }
      polisher.visible = finishing && phase < 0.995
      if (phase <= 0.46) {
        const polishAngle = Math.PI + clamp((phase - 0.08) / 0.38) * Math.PI * 2
        polisher.position.set(Math.cos(polishAngle) * 1.14, Math.sin(polishAngle) * 1.14, 0.824 + (1 - smooth(phase, 0, 0.08)) * 0.6)
      } else {
        const index = Math.max(0, polishTravel.findIndex((_, i) => i < polishTravel.length - 1 && phase <= polishTravel[i + 1][0]))
        const a = polishTravel[index], b = polishTravel[index + 1]
        const travel = smooth(phase, a[0], b[0])
        polisher.position.set(mix(a[1], b[1], travel), mix(a[2], b[2], travel), mix(a[3], b[3], travel))
      }
      polishingDisc.rotation.z = phase * Math.PI * 110
      polisher.rotation.z = Math.sin(phase * Math.PI * 2) * 0.18
      fasteners.forEach((screw, i) => {
        const amount = assembling ? smooth(phase, 0.1 + i * 0.16, 0.48 + i * 0.16) : step > 7 ? 1 : 0
        screw.visible = step >= 7
        washers[i].visible = step >= 7
        screw.position.copy(mounts[i])
        screw.position.z += (1 - amount) * 0.95
        screw.rotation.z = (1 - amount) * Math.PI * 8
        washers[i].position.z = mounts[i].z + (1 - smooth(amount, 0, 0.68)) * 0.48
        if (amount > 0.999 && step >= 7) bolts++
        boltGap = Math.max(boltGap, step >= 7 ? (1 - amount) * 0.95 : 0)
      })
      finishUniform.value = finish
      finishMaterials.forEach(material => {
        material.color.copy(roughColor).lerp(finalColor, finish)
        material.roughness = mix(mix(0.7, 0.48, finish), 0.38, presentationLighting)
        material.metalness = mix(mix(0.94, 0.98, finish), 0.86, presentationLighting)
        material.bumpScale = mix(0.023, 0, finish)
        material.normalScale.setScalar(finish * 0.08)
        material.envMapIntensity = mix(mix(0.95, 1.05, finish), 1.2, presentationLighting)
      })
      diagnostics = { holes, bolts, separation: separated * 0.36, bendError: bendError * 11, finish, cut, weld, boltGap, pressGap }
      const cutActive = laser.visible && phase >= 0.06 && phase < 0.795
      const weldActive = welding && weldWindows.some(([start, end]) => phase > start && phase < end)
      const drillActive = drill.visible && drillingPhase > 0.42 && drillingPhase < 0.72
      return { contact, diagnostics, polishPosition: polisher.position, polishing: polisher.visible,
        effect: cutActive ? 'cut' : weldActive ? 'weld' : drillActive ? 'drill' : 'none' }
    },
    dispose() { seam.dispose(); hotSeam.dispose(); earGeometries.flat().forEach(geometry => geometry.dispose()) },
  }
}
