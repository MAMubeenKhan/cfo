import type {SanityAsset} from './image'
import type {Category} from '@/lib/categories'
import type {Status} from '@/lib/status'

// ----------------------------------------------------------------------- types

export interface CaseCard {
  _id: string
  caseNumber: string
  title: string
  category: Category
  status: Status
  observedAt: string
  place?: string
  region?: {name: string; restricted?: boolean}
  lat?: number
  lng?: number
  subject?: string
  plausibility?: number
  summary?: string
  thumb?: {url: string; lqip?: string; alt?: string}
}

export interface LogEntry {
  _key: string
  at: string
  actor: 'agent' | 'human' | 'visitor' | 'system'
  kind: string
  message: string
}

export type Evidence =
  | {_key: string; _type: 'photoEvidence'; caption: string; asset?: SanityAsset}
  | {_key: string; _type: 'footprintEvidence'; lengthCm: number}
  | {_key: string; _type: 'soundEvidence'; description: string; durationSeconds?: number}
  | {_key: string; _type: 'testimonyEvidence'; quote: string; speaker?: string}

export interface Dossier extends CaseCard {
  description: string
  conditions?: {light?: string; weather?: string; distanceMeters?: number; durationSeconds?: number}
  objectShape?: string
  evidence: Evidence[]
  triage?: {plausibility?: number; summary?: string; memo?: string; flags?: string[]; route?: string; model?: string; subject?: {name: string; slug: string; codename: string; summary: string}}
  verdict?: {outcome?: string; note?: string; filedAt?: string; filedBy?: string}
  log: LogEntry[]
  witness?: {codename: string; credibility?: number; reportsCount?: number; closedCounts?: {classified: number; debunked: number; inconclusive: number}}
  connections: {_id: string; reason: string; confidence: number; status: 'proposed' | 'confirmed'; proposedBy: string; other: CaseCard}[]
  _updatedAt: string
}

export interface HomeData {
  counts: {total: number; open: number; classified: number; debunked: number; inconclusive: number; intake: number; review: number; investigation: number; closed: number}
  wire: {caseNumber: string; title: string; status: Status; category: Category; at: string; message: string; actor: string}[]
  featured: CaseCard[]
  byCategory: Record<string, number>
}

// --------------------------------------------------------------------- queries

const PUBLIC = `_type == "case" && !hidden`

export const CARD = `{
  _id, caseNumber, title, category, status,
  "observedAt": sighting.observedAt,
  "place": sighting.location.placeName,
  "region": sighting.location.region->{name, restricted},
  "lat": sighting.location.geo.lat,
  "lng": sighting.location.geo.lng,
  "subject": triage.subjectMatch->name,
  "plausibility": triage.plausibility,
  "summary": triage.summary,
  "thumb": evidence[_type == "photoEvidence" && defined(image.asset)][0]{
    "url": image.asset->url, "lqip": image.asset->metadata.lqip, "alt": caption
  }
}`

export const CASES_QUERY = `*[${PUBLIC}] | order(sighting.observedAt desc)[0...300]${CARD}`

export const HOME_QUERY = `{
  "counts": {
    "total": count(*[${PUBLIC}]),
    "open": count(*[${PUBLIC} && status in ["intake", "review", "investigation", "filing"]]),
    "classified": count(*[${PUBLIC} && status == "classified"]),
    "debunked": count(*[${PUBLIC} && status == "debunked"]),
    "inconclusive": count(*[${PUBLIC} && status == "inconclusive"]),
    "intake": count(*[${PUBLIC} && status == "intake"]),
    "review": count(*[${PUBLIC} && status == "review"]),
    "investigation": count(*[${PUBLIC} && status in ["investigation", "filing"]]),
    "closed": count(*[${PUBLIC} && status in ["classified", "debunked", "inconclusive"]])
  },
  "wire": *[${PUBLIC} && count(log) > 0] | order(log[-1].at desc)[0...10]{
    caseNumber, title, status, category,
    "at": log[-1].at, "message": log[-1].message, "actor": log[-1].actor
  },
  "featured": *[${PUBLIC} && status == "classified" && count(evidence[_type == "photoEvidence"]) > 0] | order(triage.plausibility desc)[0...3]${CARD},
  "byCategory": {
    "cryptid": count(*[${PUBLIC} && category == "cryptid"]),
    "ufo": count(*[${PUBLIC} && category == "ufo"]),
    "extraterrestrial": count(*[${PUBLIC} && category == "extraterrestrial"]),
    "ghost": count(*[${PUBLIC} && category == "ghost"]),
    "spirit": count(*[${PUBLIC} && category == "spirit"]),
    "occult": count(*[${PUBLIC} && category == "occult"])
  }
}`

export const DOSSIER_QUERY = `*[${PUBLIC} && caseNumber == $caseNumber][0]{
  ...${CARD},
  _updatedAt,
  "description": sighting.description,
  "conditions": sighting.conditions,
  "objectShape": sighting.objectShape,
  "evidence": evidence[]{
    _key, _type, caption, lengthCm, description, durationSeconds, quote, speaker,
    "asset": image.asset->{url, metadata{lqip, dimensions}}
  },
  "triage": triage{plausibility, summary, memo, flags, route, model,
    "subject": subjectMatch->{name, "slug": slug.current, codename, summary}},
  "verdict": verdict{outcome, note, filedAt, filedBy},
  "log": log[]{_key, at, actor, kind, message},
  "witness": witness->{codename, credibility, reportsCount, closedCounts},
  "connections": *[_type == "connection" && status != "rejected" && (from._ref == ^._id || to._ref == ^._id) && from->hidden != true && to->hidden != true]{
    _id, reason, confidence, status, proposedBy,
    "other": select(from._ref == ^._id => to, from)->${CARD}
  }
}`

export const STATUS_QUERY = `*[${PUBLIC} && caseNumber == $caseNumber][0]{
  caseNumber, status, category, _updatedAt,
  "plausibility": triage.plausibility,
  "summary": triage.summary,
  "route": triage.route,
  "flags": triage.flags,
  "verdictNote": verdict.note,
  "lastLog": log[-1]{at, actor, kind, message},
  "steps": count(log)
}`

export const DESK_QUERY = `*[${PUBLIC} && status == "review"] | order(sighting.observedAt desc)[0...40]{
  ...${CARD},
  "flags": triage.flags,
  "memo": triage.memo,
  "description": sighting.description
}`

export const SITEMAP_QUERY = `*[${PUBLIC}]{caseNumber, "updated": _updatedAt}`

/** One number that changes whenever any public case changes: drives the live-refresh poll. */
export const PULSE_QUERY = `{
  "latest": *[_type == "case" && !hidden] | order(_updatedAt desc)[0]._updatedAt,
  "count": count(*[_type == "case" && !hidden])
}`
