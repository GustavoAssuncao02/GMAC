import source from './storyboard.json?raw'

export type Transform = {
  opacity: number; x_vw: number; y_vh: number; z_px?: number; scale: number
  rotateX_deg?: number; rotateY_deg?: number; rotateZ_deg?: number; blur_px: number
}
export type Copy = Transform & { label: string | null; headline: string; body: string | null; pointer_events: string }
export type MetalState = {
  frame: number; progress: number; stage: string
  camera: { x_vw: number; y_vh: number; zoom: number; orbitYaw_deg: number; orbitPitch_deg: number; roll_deg: number; perspective_px: number }
  primary_object: Transform & { morph_progress: number; material_roughness_hint: number; metalness_hint: number }
  continuity_layers: Record<string, Transform>
  tools_and_overlays: Record<string, Transform>
  effects: Record<string, number>; lighting: Record<string, number>
  copy_blocks: Record<string, Copy>
  ui: { scroll_hint_opacity: number; progress_indicator_opacity: number; progress_fill: number; process_icons_opacity: number; process_icons_scale: number; cta_enabled: boolean }
  transition_to_next: { ease: string | null }
}
export const frames = JSON.parse(source) as MetalState[]
export const clamp = (n: number) => Math.max(0, Math.min(1, n))
export const landingStart = 54 / 79
export const landingAmount = (progress: number) => clamp((progress - landingStart) / (1 - landingStart))

function interpolate(a: unknown, b: unknown, t: number, key = ''): unknown {
  if (typeof a === 'number' && typeof b === 'number') {
    const delta = key.endsWith('_deg') ? ((b - a + 540) % 360) - 180 : b - a
    return a + delta * t
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, interpolate(v, (b as Record<string, unknown>)[k], t, k)]))
  }
  return t === 1 ? b : a
}

export function stateAt(value: number): MetalState {
  const p = clamp(value)
  const position = p * 79
  const index = Math.min(79, Math.floor(position + 1e-9))
  if (index === 79 || Math.abs(position - index) < 1e-8) return { ...frames[index], progress: p }
  const fraction = position - index
  const ease = frames[index].transition_to_next.ease
  const power = ease === 'power2.inOut' ? 3 : 2
  const t = ease === 'sine.inOut' ? (1 - Math.cos(Math.PI * fraction)) / 2
    : fraction < 0.5 ? Math.pow(2 * fraction, power) / 2 : 1 - Math.pow(2 * (1 - fraction), power) / 2
  return { ...(interpolate(frames[index], frames[index + 1], t) as MetalState), frame: index + 1, progress: p }
}

// A deliberate close-up with a three-quarter pose, shared by every final layer.
export function presentationStateAt(value: number): MetalState {
  const state = stateAt(value)
  if (value < landingStart) return state
  const quality = frames[54]
  const amount = landingAmount(value)
  const blend = amount * amount * (3 - 2 * amount)
  const pose = {
    x_vw: quality.primary_object.x_vw + (5 - quality.primary_object.x_vw) * blend,
    y_vh: quality.primary_object.y_vh + (0 - quality.primary_object.y_vh) * blend,
    z_px: quality.primary_object.z_px! + (65 - quality.primary_object.z_px!) * blend,
    scale: quality.primary_object.scale + (1.08 - quality.primary_object.scale) * blend,
    rotateX_deg: quality.primary_object.rotateX_deg! + (-10 - quality.primary_object.rotateX_deg!) * blend,
    rotateY_deg: quality.primary_object.rotateY_deg! + (16 - quality.primary_object.rotateY_deg!) * blend,
    rotateZ_deg: quality.primary_object.rotateZ_deg! * (1 - blend),
  }
  return {
    ...state,
    camera: { ...quality.camera, zoom: quality.camera.zoom + (1.08 - quality.camera.zoom) * blend },
    primary_object: { ...quality.primary_object, ...pose },
    continuity_layers: Object.fromEntries(Object.entries(quality.continuity_layers).map(([name, layer]) => [name, {
      ...layer, ...pose, opacity: name === 'final_product' ? 1 : 0,
    }])),
    tools_and_overlays: Object.fromEntries(Object.entries(quality.tools_and_overlays).map(([name, tool]) => [name, { ...tool, opacity: 0 }])),
    effects: Object.fromEntries(Object.keys(state.effects).map(name => [name, 0])),
    lighting: { ...quality.lighting },
  }
}
