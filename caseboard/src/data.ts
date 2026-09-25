// Live data for the board. Each hook is a reactive query: when anyone edits a case, a pin or a string, it updates.
import {useMemo} from 'react'
import {useQuery} from '@sanity/sdk-react'

export const PROJECT_ID = 'cyh4xyo1'
export const DATASET = 'production'
export const TAG = 'prod'
export const STUDIO_URL = 'https://cryptid-field-office.sanity.studio'
export const PUBLIC_SITE = 'https://cryptid-field-office-mubeen9.vercel.app'

export interface BoardCase {
  _id: string
  caseNumber: string
  title: string
  category: string
  status: string
  hidden?: boolean
  observedAt?: string
  place?: string
  restricted?: boolean
  plausibility?: number
  summary?: string
  memo?: string
  flags?: string[]
  instance?: string
  witness?: string
  thumb?: string
  log?: {_key: string; at: string; actor: string; kind?: string; message: string}[]
}

export interface BoardConnection {
  _id: string
  from: string
  to: string
  reason: string
  confidence: number
  status: 'proposed' | 'confirmed' | 'rejected'
  proposedBy: string
}

export interface BoardPin {
  _id: string
  case: string
  x: number
  y: number
}

const CASES = `*[_type == "case" && !(_id in path("drafts.**"))]{
  _id, caseNumber, title, category, status, hidden,
  "observedAt": sighting.observedAt,
  "place": sighting.location.placeName,
  "restricted": sighting.location.region->restricted,
  "plausibility": triage.plausibility,
  "summary": triage.summary,
  "memo": triage.memo,
  "flags": triage.flags,
  "instance": workflowInstanceId,
  "witness": witness->codename,
  "thumb": evidence[_type == "photoEvidence"][0].image.asset->url,
  "log": log[]{_key, at, actor, kind, message}
} | order(caseNumber asc)`

const CONNECTIONS = `*[_type == "connection" && status != "rejected" && !(_id in path("drafts.**"))]{
  _id, "from": from._ref, "to": to._ref, reason, confidence, status, proposedBy
}`

const PINS = `*[_type == "boardPin" && !(_id in path("drafts.**"))]{_id, "case": case._ref, x, y}`

export function useBoardCases(): BoardCase[] {
  const {data} = useQuery<BoardCase[]>({query: CASES})
  return useMemo(() => data ?? [], [data])
}

export function useBoardConnections(): BoardConnection[] {
  const {data} = useQuery<BoardConnection[]>({query: CONNECTIONS})
  return useMemo(() => data ?? [], [data])
}

export function useBoardPins(): BoardPin[] {
  const {data} = useQuery<BoardPin[]>({query: PINS})
  return useMemo(() => data ?? [], [data])
}

/** Stage columns for the rail and for the auto-layout of cards without a saved pin. */
export const STAGE_GROUPS = [
  {key: 'intake', label: 'Intake', statuses: ['intake']},
  {key: 'review', label: "Director's review", statuses: ['review']},
  {key: 'investigation', label: 'Investigation', statuses: ['investigation', 'filing']},
  {key: 'closed', label: 'Closed', statuses: ['classified', 'debunked', 'inconclusive']},
] as const

export const groupIndex = (status: string) => Math.max(0, STAGE_GROUPS.findIndex((g) => (g.statuses as readonly string[]).includes(status)))

export const CATEGORY_LABEL: Record<string, string> = {
  cryptid: 'Cryptid',
  ufo: 'UFO / UAP',
  extraterrestrial: 'Alien',
  ghost: 'Ghost',
  spirit: 'Spirit & jinn',
  occult: 'Occult',
}

export const STATUS_LABEL: Record<string, string> = {
  intake: 'Received',
  review: "Director's review",
  investigation: 'Investigation',
  filing: 'Filing',
  classified: 'Classified',
  debunked: 'Debunked',
  inconclusive: 'Inconclusive',
}

/** Stable little tilt per card, so the board looks pinned by hand but never jumps on refresh. */
export function tiltFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return ((Math.abs(h) % 60) - 30) / 10 // -3.0 .. +2.9 degrees
}

export const connectionId = (a: string, b: string) => {
  const [lo, hi] = [a, b].sort()
  return `conn-${lo}-${hi}`
}
