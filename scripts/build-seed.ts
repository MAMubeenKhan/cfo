// Builds seed/seed.ndjson from the hand-written seed data, validating it against the
// schema limits and the planned stage targets. Exits non-zero on any violation.
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {REGIONS, SUBJECTS, WITNESSES} from '../seed/base'
import {CASES_A} from '../seed/cases-a'
import {CASES_B} from '../seed/cases-b'
import type {SeedCase, SeedEvidence} from '../seed/types'
import {FLAG_ALLOWLIST, route} from '../workflow/lib/routing'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = resolve(root, 'seed/seed.ndjson')
const imagesDir = resolve(root, 'seed/images')

const FLAG_SET = new Set<string>(FLAG_ALLOWLIST)

const errors: string[] = []
const fail = (msg: string) => errors.push(msg)

const ALL: SeedCase[] = [...CASES_A, ...CASES_B].sort((a, b) => a.n - b.n)

const pad2 = (n: number) => String(n).padStart(2, '0')
const caseId = (n: number) => `case-seed-${pad2(n)}`
const regionId = (key: string) => `region-${key}`
const subjectId = (slug: string) => `subject-${slug}`
const witnessId = (code: string) => `witness-${code.toLowerCase()}`
const ref = (id: string) => ({_type: 'reference' as const, _ref: id})
const key = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
const hours = (iso: string, h: number) => new Date(Date.parse(iso) + h * 3600_000).toISOString()

// ---- case numbers: CFO-<year>-<seq>, sequence per year in order of observation
const seqByYear = new Map<number, number>()
const caseNumber = new Map<number, string>()
;[...ALL]
  .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt) || a.n - b.n)
  .forEach((c) => {
    const year = new Date(c.observedAt).getUTCFullYear()
    const seq = (seqByYear.get(year) ?? 0) + 1
    seqByYear.set(year, seq)
    caseNumber.set(c.n, `CFO-${year}-${String(seq).padStart(4, '0')}`)
  })

/** "Case 07" and "Cases 15 and 16" in seed text become the real case numbers. */
function linkCases(text: string): string {
  const num = (d: string) => {
    const v = caseNumber.get(Number(d))
    if (!v) fail(`Text refers to Case ${d}, which does not exist: "${text.slice(0, 60)}..."`)
    return v ?? `Case ${d}`
  }
  return text
    .replace(/Cases (\d{2}) and (\d{2})/g, (_m, a, b) => `${num(a)} and ${num(b)}`)
    .replace(/Case (\d{2})/g, (_m, a) => num(a))
}

const docs: Record<string, unknown>[] = []

// ---- regions
for (const r of REGIONS) {
  docs.push({
    _id: regionId(r.key), _type: 'region', name: r.name, slug: {_type: 'slug', current: r.key},
    country: r.country, restricted: r.restricted, centroid: {_type: 'geopoint', lat: r.lat, lng: r.lng},
  })
}

// ---- subjects
for (const s of SUBJECTS) {
  if (s.summary.length > 280) fail(`Subject ${s.slug}: summary is ${s.summary.length} chars (max 280)`)
  if (!/^SUBJECT-[A-Z0-9]{2,4}$/.test(s.codename)) fail(`Subject ${s.slug}: bad codename ${s.codename}`)
  docs.push({
    _id: subjectId(s.slug), _type: 'subject', name: s.name, slug: {_type: 'slug', current: s.slug},
    codename: s.codename, category: s.category, summary: s.summary,
    description: s.description.map((text, i) => ({
      _type: 'block', _key: `${s.slug}-p${i}`, style: 'normal', markDefs: [],
      children: [{_type: 'span', _key: `${s.slug}-p${i}-s`, text, marks: []}],
    })),
    signatureTraits: s.traits, habitat: s.habitat,
    ...(s.size ? {sizeRangeCm: {min: s.size[0], max: s.size[1]}} : {}),
    ...(s.firstRecorded ? {firstRecorded: s.firstRecorded} : {}),
    threatLevel: s.threat,
  })
}

// ---- witnesses
const casesPerWitness = new Map<string, number>()
for (const c of ALL) casesPerWitness.set(c.witness, (casesPerWitness.get(c.witness) ?? 0) + 1)
for (const w of WITNESSES) {
  if (!casesPerWitness.has(w.code)) fail(`Witness ${w.code} has no cases`)
  docs.push({
    _id: witnessId(w.code), _type: 'witness', codename: `WITNESS-${w.code}`, credibility: 50,
    reportsCount: casesPerWitness.get(w.code) ?? 0, closedCounts: {classified: 0, debunked: 0, inconclusive: 0},
  })
}

// ---- cases
const regionKeys = new Set(REGIONS.map((r) => r.key))
const subjectSlugs = new Map(SUBJECTS.map((s) => [s.slug, s]))
const witnessCodes = new Set(WITNESSES.map((w) => w.code))
let missingPhotos = 0
const usedImages: string[] = []

function evidenceDoc(c: SeedCase, e: SeedEvidence, i: number) {
  const _key = `ev-${pad2(c.n)}-${i}`
  switch (e.kind) {
    case 'testimony':
      return {_key, _type: 'testimonyEvidence', quote: linkCases(e.quote), ...(e.speaker ? {speaker: e.speaker} : {})}
    case 'footprint':
      return {_key, _type: 'footprintEvidence', lengthCm: e.lengthCm}
    case 'sound':
      return {_key, _type: 'soundEvidence', description: e.description, ...(e.seconds ? {durationSeconds: e.seconds} : {})}
    case 'photo': {
      const file = resolve(imagesDir, `${e.key}.png`)
      if (!existsSync(file)) {
        missingPhotos++
        return null
      }
      usedImages.push(e.key)
      return {
        _key, _type: 'photoEvidence', caption: e.caption,
        image: {_type: 'image', _sanityAsset: `image@file://./images/${e.key}.png`},
      }
    }
  }
}

for (const c of ALL) {
  const id = caseId(c.n)
  const where = `Case ${pad2(c.n)}`
  if (c.title.length > 90) fail(`${where}: title ${c.title.length} chars (max 90)`)
  if (c.description.length < 40 || c.description.length > 2000) fail(`${where}: description ${c.description.length} chars (40-2000)`)
  if (c.summary.length > 400) fail(`${where}: summary ${c.summary.length} chars (max 400)`)
  if (c.memo.length > 1200) fail(`${where}: memo ${c.memo.length} chars (max 1200)`)
  if (c.place.length > 120) fail(`${where}: place name too long`)
  if (c.distance != null && (c.distance < 0 || c.distance > 5000)) fail(`${where}: distance ${c.distance} outside 0-5000`)
  if (c.duration != null && (c.duration < 0 || c.duration > 7200)) fail(`${where}: duration ${c.duration} outside 0-7200`)
  if (c.evidence.length > 6) fail(`${where}: more than 6 evidence items`)
  if (!Number.isInteger(c.plausibility) || c.plausibility < 0 || c.plausibility > 100) fail(`${where}: bad plausibility`)
  for (const f of c.flags) if (!FLAG_SET.has(f)) fail(`${where}: unknown flag ${f}`)
  if (!regionKeys.has(c.region)) fail(`${where}: unknown region ${c.region}`)
  if (!subjectSlugs.has(c.subject)) fail(`${where}: unknown subject ${c.subject}`)
  if (!witnessCodes.has(c.witness)) fail(`${where}: unknown witness ${c.witness}`)
  if (Date.parse(c.observedAt) > Date.now()) fail(`${where}: observed in the future`)
  if (Date.parse(c.observedAt) < Date.parse('1950-01-01')) fail(`${where}: before 1950`)
  if (c.shape && c.category !== 'ufo') fail(`${where}: objectShape is for UFO reports only`)
  if (subjectSlugs.get(c.subject)?.category !== c.category) fail(`${where}: category ${c.category} differs from subject category`)

  const region = REGIONS.find((r) => r.key === c.region)!
  const routeTo = route(c.plausibility, c.flags)

  // Verdict path must be reachable through the workflow from the stored route.
  if (c.verdict === 'debunked' && c.verdictBy === 'director' && routeTo !== 'review') fail(`${where}: director debunk needs the review route (got ${routeTo})`)
  if (c.verdict === 'debunked' && !c.verdictBy && routeTo !== 'auto-debunk') fail(`${where}: auto debunk needs plausibility < 20 (got ${routeTo})`)
  if (c.verdict && c.verdict !== 'debunked' && routeTo === 'auto-debunk') fail(`${where}: ${c.verdict} cannot come from an auto-debunk route`)
  if (c.verdict === 'debunked' && c.flags.includes('faith-sensitive')) fail(`${where}: faith-sensitive cases are never debunked`)
  if (!c.verdict && routeTo === 'auto-debunk') fail(`${where}: open case would auto-close`)
  if (c.verdictBy === 'director' && !c.directorNote) fail(`${where}: director debunk needs a directorNote`)
  if (c.verdict && c.verdict !== 'debunked' && !c.note) fail(`${where}: verdict needs a note`)
  if (c.category === 'spirit' && !c.flags.includes('faith-sensitive')) fail(`${where}: spirit cases must be faith-sensitive`)

  const evidence = c.evidence.map((e, i) => evidenceDoc(c, e, i)).filter(Boolean)
  const observed = c.observedAt
  const claimed = ['cryptid', 'extraterrestrial', 'ghost', 'spirit'].includes(c.category)

  docs.push({
    _id: id, _type: 'case', caseNumber: caseNumber.get(c.n), title: c.title, category: c.category,
    status: 'intake', source: 'seed', hidden: false,
    sighting: {
      observedAt: observed,
      location: {
        geo: {_type: 'geopoint', lat: +(region.lat + c.offset[0]).toFixed(5), lng: +(region.lng + c.offset[1]).toFixed(5)},
        placeName: c.place, region: ref(regionId(c.region)),
      },
      conditions: {
        light: c.light, weather: c.weather,
        ...(c.distance != null ? {distanceMeters: c.distance} : {}),
        ...(c.duration != null ? {durationSeconds: c.duration} : {}),
      },
      description: linkCases(c.description),
      ...(claimed ? {subjectClaimed: ref(subjectId(c.subject))} : {}),
      ...(c.shape ? {objectShape: c.shape} : {}),
    },
    witness: ref(witnessId(c.witness)),
    evidence,
    triage: {
      plausibility: c.plausibility, summary: c.summary, memo: linkCases(c.memo),
      subjectMatch: ref(subjectId(c.subject)), flags: c.flags, route: routeTo,
      triagedAt: hours(observed, 3), model: 'seed', effectKey: 'seed',
    },
    log: [{_key: `seed-received-${pad2(c.n)}`, _type: 'logEntry', at: hours(observed, 2), actor: 'system', kind: 'received', message: 'Report received.'}],
  })
}

// ---- connections (red strings). ID = conn-<lowerId>-<higherId>
type Conn = [number, number, 'confirmed' | 'proposed', 'agent' | 'human', number, string]
const CONNECTIONS: Conn[] = [
  [1, 2, 'confirmed', 'agent', 0.82, 'Same region, same subject, seven months apart.'],
  [9, 14, 'confirmed', 'agent', 0.86, 'Same witness, same road, different night.'],
  [10, 15, 'confirmed', 'human', 0.9, 'Capsule-shaped object at the same perimeter, same subject.'],
  [15, 19, 'confirmed', 'agent', 0.88, 'Same witness, same site, three months apart.'],
  [16, 19, 'confirmed', 'human', 0.84, 'Same witness, same site, grey figure on both files.'],
  [20, 23, 'confirmed', 'agent', 0.78, 'Same district and witness; the second file explains the first.'],
  [21, 27, 'confirmed', 'human', 0.7, 'Same city, same witness, related presence reports.'],
  [14, 18, 'confirmed', 'agent', 0.74, 'Same stretch of highway, within three years.'],
  [10, 13, 'proposed', 'agent', 0.72, 'Same perimeter, same witness, related aerial reports.'],
  [13, 16, 'proposed', 'agent', 0.61, 'Same witness, same site, ten months apart.'],
  [22, 24, 'proposed', 'agent', 0.55, 'Same city and witness; the two houses are 400 metres apart.'],
  [28, 30, 'proposed', 'agent', 0.58, 'Both concern a fictional society and the same witness pattern.'],
]
for (const [a, b, status, by, confidence, reason] of CONNECTIONS) {
  const [lo, hi] = [caseId(a), caseId(b)].sort()
  if (reason.length > 160) fail(`Connection ${a}-${b}: reason too long`)
  docs.push({
    _id: `conn-${lo}-${hi}`, _type: 'connection', from: ref(lo), to: ref(hi), reason, confidence,
    proposedBy: by, status, createdAt: '2026-09-20T09:00:00Z', ...(status === 'confirmed' ? {decidedAt: '2026-09-21T09:00:00Z'} : {}),
  })
}

// ---- settings and counter
docs.push({_id: 'bureau-settings', _type: 'bureauSettings', agentEnabled: true, dailyAgentBudget: 60, publicDeskEnabled: true, publicDeskHourlyLimit: 10})
docs.push({_id: 'counter-case-number', _type: 'counter', year: 2026, value: seqByYear.get(2026) ?? 0})

// ---- targets: the workflow seed script must land the cases here
const target = (c: SeedCase) => (c.verdict ? c.verdict : route(c.plausibility, c.flags) === 'investigation' ? 'investigation' : 'review')
const hist: Record<string, number> = {}
for (const c of ALL) hist[target(c)] = (hist[target(c)] ?? 0) + 1
const EXPECTED: Record<string, number> = {review: 4, investigation: 5, classified: 8, debunked: 9, inconclusive: 4}
for (const [k, v] of Object.entries(EXPECTED)) if ((hist[k] ?? 0) !== v) fail(`Stage target ${k}: expected ${v}, got ${hist[k] ?? 0}`)
const byCat: Record<string, number> = {}
for (const c of ALL) byCat[c.category] = (byCat[c.category] ?? 0) + 1
const EXPECTED_CAT: Record<string, number> = {cryptid: 8, ufo: 7, extraterrestrial: 4, ghost: 5, spirit: 3, occult: 3}
for (const [k, v] of Object.entries(EXPECTED_CAT)) if ((byCat[k] ?? 0) !== v) fail(`Category ${k}: expected ${v}, got ${byCat[k] ?? 0}`)
const inRestricted = ALL.filter((c) => REGIONS.find((r) => r.key === c.region)?.restricted).length
if (inRestricted < 5) fail(`Only ${inRestricted} cases in restricted regions (need at least 5)`)
const ids = docs.map((d) => d._id as string)
if (new Set(ids).size !== ids.length) fail('Duplicate document _id in seed')
for (const id of ids) if (id.includes('.')) fail(`Document id contains a dot (would be private): ${id}`)
if (ALL.length !== 30) fail(`Expected 30 cases, got ${ALL.length}`)

if (errors.length) {
  console.error(`\nSEED BUILD FAILED with ${errors.length} problem(s):`)
  for (const e of errors) console.error(' - ' + e)
  process.exit(1)
}

mkdirSync(dirname(outFile), {recursive: true})
writeFileSync(outFile, docs.map((d) => JSON.stringify(d)).join('\n') + '\n', 'utf8')
console.log(`Wrote ${docs.length} documents to seed/seed.ndjson`)
console.log(`  regions ${REGIONS.length}, subjects ${SUBJECTS.length}, witnesses ${WITNESSES.length}, cases ${ALL.length}, connections ${CONNECTIONS.length}`)
console.log('  stage targets:', hist)
console.log('  categories:   ', byCat)
console.log(`  restricted-region cases: ${inRestricted}`)
console.log(`  photo evidence: ${usedImages.length} included, ${missingPhotos} skipped (image not generated yet)`)
console.log('  case numbers:', [...caseNumber.entries()].sort((a, b) => a[0] - b[0]).map(([n, v]) => `${pad2(n)}=${v}`).join(' '))
