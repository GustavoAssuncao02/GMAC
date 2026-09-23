export const metalSteps = [
  { name: 'Visão geral', copy: 'hero_intro', frame: 1 },
  { name: 'Matéria-prima', copy: 'raw', frame: 8 },
  { name: 'Traçado a laser', copy: 'cut', frame: 15 },
  { name: 'Forma sob pressão', copy: 'bend', frame: 19 },
  { name: 'Solda', copy: 'weld', frame: 26 },
  { name: 'Usinagem', copy: 'machining', frame: 36 },
  { name: 'Acabamento', copy: 'finish', frame: 43 },
  { name: 'Montagem', copy: 'assembly', frame: 48 },
  { name: 'Qualidade', copy: 'quality', frame: 55 },
  { name: 'Peça final', copy: 'final', frame: 80 },
]
export const stepProgress = (index: number) => (metalSteps[index].frame - 1) / 79
