// npm run wf:recover
// Repairs the pipeline after any failure: starts instances for cases that never got one,
// then settles every open instance (drains queued effects, ticks). Idempotent: safe to run any time.
import {content, makeEngine, settle, startCase, TAG} from './_engine'

const engine = makeEngine('recover')

const missing = await content.fetch<{_id: string; caseNumber: string}[]>(
  `*[_type == "case" && !defined(workflowInstanceId)]{_id, caseNumber} | order(caseNumber asc)`,
)
console.log(`Cases without a workflow instance: ${missing.length}`)
for (const c of missing) {
  try {
    await startCase(engine, c._id)
    console.log(`  started  ${c.caseNumber}`)
  } catch (error) {
    console.error(`  FAILED   ${c.caseNumber}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const open = await content.fetch<{_id: string}[]>(
  `*[_type == "sanity.workflow.instance" && tag == $wfTag && !defined(completedAt)]{_id}`,
  {wfTag: TAG},
)
console.log(`Open instances to settle: ${open.length}`)
for (const {_id} of open) {
  try {
    const stage = await settle(engine, _id)
    console.log(`  ${_id.split('.').pop()} -> ${stage}`)
  } catch (error) {
    console.error(`  FAILED ${_id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
console.log('Done.')
