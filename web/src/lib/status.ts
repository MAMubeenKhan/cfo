// Shared vocabulary for the public site. Mirrors studio/schemaTypes/constants.ts.

export const STATUSES = ['intake', 'review', 'investigation', 'filing', 'classified', 'debunked', 'inconclusive'] as const
export type Status = (typeof STATUSES)[number]

/** The four stages a case moves through, in order, for the progress track. */
export const STAGES = [
  {key: 'intake', label: 'Received', blurb: 'Report filed and logged.'},
  {key: 'review', label: "Director's review", blurb: 'A person decides whether to investigate.'},
  {key: 'investigation', label: 'Investigation', blurb: 'Related files are cross-referenced.'},
  {key: 'closed', label: 'Filed', blurb: 'Verdict stamped and on record.'},
] as const

export const STATUS_LABEL: Record<Status, string> = {
  intake: 'Received',
  review: "Director's review",
  investigation: 'Under investigation',
  filing: 'Filing',
  classified: 'Classified',
  debunked: 'Debunked',
  inconclusive: 'Inconclusive',
}

export const STATUS_STAMP: Record<Status, string> = {
  intake: 'Received',
  review: 'In review',
  investigation: 'Open',
  filing: 'Filing',
  classified: 'Classified',
  debunked: 'Debunked',
  inconclusive: 'Inconclusive',
}

/** Tailwind text/border colour classes per status (all token-backed, all AA in both themes). */
export const STATUS_TEXT: Record<Status, string> = {
  intake: 'text-intake',
  review: 'text-review',
  investigation: 'text-investigation',
  filing: 'text-investigation',
  classified: 'text-classified',
  debunked: 'text-debunked',
  inconclusive: 'text-inconclusive',
}

export const STATUS_HEX_VAR: Record<Status, string> = {
  intake: 'var(--intake)',
  review: 'var(--review)',
  investigation: 'var(--investigation)',
  filing: 'var(--investigation)',
  classified: 'var(--classified)',
  debunked: 'var(--debunked)',
  inconclusive: 'var(--inconclusive)',
}

export const isClosed = (s: string): boolean => s === 'classified' || s === 'debunked' || s === 'inconclusive'
export const isStatus = (s: unknown): s is Status => typeof s === 'string' && (STATUSES as readonly string[]).includes(s)

/** Index (0-3) of the stage a status sits in, for the progress track. */
export function stageIndex(status: string): number {
  if (status === 'intake') return 0
  if (status === 'review') return 1
  if (status === 'investigation' || status === 'filing') return 2
  return 3
}
