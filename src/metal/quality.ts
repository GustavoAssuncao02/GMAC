export const qualityChecks = [
  { label: 'Geometria do mandril' },
  { label: 'Alinhamento das abas' },
  { label: 'Uniões soldadas' },
  { label: 'Furos de fixação' },
  { label: 'Superfície polida' },
  { label: 'Parafusos e arruelas' },
] as const

export function qualityCheckProgress(phase: number, index: number) {
  const progress = Math.max(0, Math.min(1, (phase - (0.1 + index * 0.14)) / 0.11))
  return progress * progress * (3 - 2 * progress)
}
