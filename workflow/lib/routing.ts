// Routing is deterministic code. The model proposes a plausibility score and flags;
// this file, not the model, decides where a case goes. Shared with scripts/build-seed.ts.

export type Route = 'auto-debunk' | 'review' | 'investigation'

/** Any of these flags forces a human to look at the case. */
export const FORCE_REVIEW_FLAGS = [
  'faith-sensitive',
  'wellbeing-concern',
  'coercion-concern',
  'inappropriate-content',
  'possible-emergency',
] as const

/** The only flags a case may carry. Anything else the model invents is dropped. */
export const FLAG_ALLOWLIST = [
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

export const AUTO_DEBUNK_BELOW = 20
export const INVESTIGATE_AT_OR_ABOVE = 70

export function route(plausibility: number, flags: readonly string[]): Route {
  if (flags.some((f) => (FORCE_REVIEW_FLAGS as readonly string[]).includes(f))) return 'review'
  if (plausibility < AUTO_DEBUNK_BELOW) return 'auto-debunk'
  if (plausibility < INVESTIGATE_AT_OR_ABOVE) return 'review'
  return 'investigation'
}

/** Status ranks: a mirror write may only move a case forward, never backward. */
export const STATUS_RANK: Record<string, number> = {
  intake: 0,
  review: 1,
  investigation: 2,
  filing: 3,
  classified: 4,
  debunked: 4,
  inconclusive: 4,
}

export const VERDICTS = ['classified', 'debunked', 'inconclusive'] as const
export type Verdict = (typeof VERDICTS)[number]

/** Laplace-smoothed: a new witness sits at 50 and moves with their record. */
export function credibility(counts: {classified: number; debunked: number; inconclusive: number}): number {
  const closed = counts.classified + counts.debunked + counts.inconclusive
  return Math.round((100 * (counts.classified + 0.5 * counts.inconclusive + 1)) / (closed + 2))
}
