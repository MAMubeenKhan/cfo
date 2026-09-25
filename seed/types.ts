import type {Category} from './base'

export type SeedEvidence =
  | {kind: 'testimony'; quote: string; speaker?: string}
  | {kind: 'footprint'; lengthCm: number}
  | {kind: 'sound'; description: string; seconds?: number}
  | {kind: 'photo'; key: string; caption: string}

export type Verdict = 'classified' | 'debunked' | 'inconclusive'

export interface SeedCase {
  n: number
  title: string
  category: Category
  subject: string // subject slug
  region: string // region key
  offset: [number, number] // degrees lat, lng from the region centroid
  place: string
  observedAt: string // ISO 8601, UTC
  witness: string // witness code
  light: 'daylight' | 'dusk' | 'night' | 'artificial'
  weather: 'clear' | 'rain' | 'fog' | 'snow' | 'wind'
  distance?: number
  duration?: number
  shape?: 'triangle' | 'disc' | 'sphere' | 'cigar' | 'tic-tac' | 'light-only' | 'other'
  description: string // 40-2000 chars
  evidence: SeedEvidence[]
  // Stored triage, used by the workflow seed guard so seeding spends no AI quota.
  plausibility: number
  flags: string[]
  summary: string // <= 400
  memo: string // <= 1200
  /** Final outcome. Omit for cases that stay open (review / investigation). */
  verdict?: Verdict
  /** For director-debunked cases: the Director closes it from the review stage. */
  verdictBy?: 'director'
  directorNote?: string
  /** Investigator note for verdicts reached in the investigation stage. */
  note?: string
}
