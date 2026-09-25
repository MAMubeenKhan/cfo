// npm run seed:workflows
// Starts a workflow instance for each seeded case and drives it to its planned stage,
// through the SAME actions a person would fire. Idempotent: re-running resumes where it stopped.
import {CASES_A} from '../seed/cases-a'
import {CASES_B} from '../seed/cases-b'
import type {SeedCase} from '../seed/types'
import {content, instanceIdFor, makeEngine, settle, startCase} from './_engine'

const engine = makeEngine('seed-workflows')
const byId = new Map<string, SeedCase>([...CASES_A, ...CASES_B].map((c) => [`case-seed-${String(c.n).padStart(2, '0')}`, c]))

const cases = await content.fetch<{_id: string; caseNumber: string; workflowInstanceId?: string}[]>(
  `*[_type == "case" && source == "seed"]{_id, caseNumber, workflowInstanceId} | order(caseNumber asc)`,
)
console.log(`Seeded cases: ${cases.length}`)

const problems: string[] = []

for (const c of cases) {
  const plan = byId.get(c._id)
  if (!plan) {
    problems.push(`${c.caseNumber}: no seed plan for ${c._id}`)
    continue
  }
  try {
    const instanceId = c.workflowInstanceId ?? (await startCase(engine, c._id))
    let stage = await settle(engine, instanceId)

    // Director's review: open an investigation, or close the case.
    if (stage === 'review' && plan.verdict) {
      if (plan.verdictBy === 'director') {
        await engine.fireAction({instanceId, activity: 'decide', action: 'debunk', params: {note: plan.directorNote}, idempotencyKey: `seed-${c._id}-debunk`})
      } else {
        await engine.fireAction({instanceId, activity: 'decide', action: 'open-investigation', idempotencyKey: `seed-${c._id}-open`})
      }
      stage = await settle(engine, instanceId)
    }

    // Field report: the investigator files the verdict.
    if (stage === 'investigation' && plan.verdict) {
      const action = plan.verdict === 'classified' ? 'classify' : plan.verdict === 'debunked' ? 'debunk' : 'inconclusive'
      await engine.fireAction({instanceId, activity: 'field-report', action, params: {note: plan.note}, idempotencyKey: `seed-${c._id}-${action}`})
      stage = await settle(engine, instanceId)
    }

    console.log(`  ${c.caseNumber}  ${String(plan.n).padStart(2, '0')}  -> ${stage}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    problems.push(`${c.caseNumber}: ${msg}`)
    console.error(`  FAILED ${c.caseNumber}: ${msg}`)
  }
}

// Verify: every case landed where the seed plan says it should.
const expected = (p: SeedCase) => (p.verdict ? p.verdict : undefined)
const final = await content.fetch<{_id: string; caseNumber: string; status: string; instanceStage?: string}[]>(
  `*[_type == "case" && source == "seed"]{_id, caseNumber, status}`,
)
const hist: Record<string, number> = {}
for (const f of final) {
  hist[f.status] = (hist[f.status] ?? 0) + 1
  const plan = byId.get(f._id)!
  const want = expected(plan) ?? (plan.plausibility >= 70 && !plan.flags.includes('faith-sensitive') ? 'investigation' : 'review')
  if (f.status !== want) problems.push(`${f.caseNumber}: status is "${f.status}", plan says "${want}"`)
}
console.log('\nFinal status histogram:', hist)
console.log('Planned:               ', {review: 4, investigation: 5, classified: 8, debunked: 9, inconclusive: 4})
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error(' - ' + p)
  process.exit(1)
}
console.log('\nAll seeded cases landed where planned.')
void instanceIdFor
