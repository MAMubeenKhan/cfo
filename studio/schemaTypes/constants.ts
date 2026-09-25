export const STATUSES = [
  {title: 'Intake', value: 'intake'},
  {title: "Director's review", value: 'review'},
  {title: 'Investigation', value: 'investigation'},
  {title: 'Filing', value: 'filing'},
  {title: 'Classified', value: 'classified'},
  {title: 'Debunked', value: 'debunked'},
  {title: 'Inconclusive', value: 'inconclusive'},
] as const

export const CATEGORIES = [
  {title: 'Cryptid', value: 'cryptid'},
  {title: 'UFO / UAP', value: 'ufo'},
  {title: 'Extraterrestrial', value: 'extraterrestrial'},
  {title: 'Ghost / haunting', value: 'ghost'},
  {title: 'Spirits & jinn', value: 'spirit'},
  {title: 'Occult & secret societies', value: 'occult'},
] as const

export const OUTCOMES = ['classified', 'debunked', 'inconclusive'] as const

export const TRIAGE_FLAGS = [
  'possible-misidentification',
  'known-hoax-pattern',
  'weather-explains',
  'animal-explains',
  'aircraft-explains',
  'celestial-explains',
  'satellite-explains',
  'low-detail',
  'inappropriate-content',
  'possible-emergency',
  'strong-detail',
  'multiple-witnesses',
  'faith-sensitive',
  'wellbeing-concern',
  'coercion-concern',
] as const

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.title]),
)
