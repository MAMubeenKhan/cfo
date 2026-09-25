// Shared setup for the operator scripts: one content client, one engine with every effect handler.
import {createClient, type SanityClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION, refDataset, type Engine} from '@sanity/workflow-engine'
import {createEffectHandlers} from '../workflow/handlers'

export const PROJECT_ID = process.env.SANITY_PROJECT_ID ?? 'cyh4xyo1'
export const DATASET = process.env.SANITY_DATASET ?? 'production'
export const TAG = process.env.WORKFLOW_TAG ?? 'prod'
export const DEFINITION = 'case-lifecycle'

const token = process.env.SANITY_AUTH_TOKEN
if (!token) {
  console.error('SANITY_AUTH_TOKEN is not set. Run scripts through npm (they load .env), e.g. npm run wf:recover')
  process.exit(1)
}

export const content: SanityClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: 'vX', // Agent Actions live on the experimental API version
  token,
  useCdn: false,
  perspective: 'raw',
})

export function makeEngine(executionId = 'local-operator'): Engine {
  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: ENGINE_API_VERSION,
    token,
    useCdn: false,
    perspective: 'raw',
  })
  return createEngine({
    client,
    workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`},
    tag: TAG,
    executionContext: {kind: 'server', id: executionId},
    effects: {
      handlers: createEffectHandlers(content, {
        provider: process.env.LLM_PROVIDER === 'anthropic' ? 'anthropic' : 'sanity',
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        anthropicModel: process.env.ANTHROPIC_MODEL,
      }),
      missingHandler: 'skip',
    },
  })
}

/** Deterministic instance id per case: starting the same case twice resumes instead of duplicating. */
export const instanceIdFor = (caseId: string) => `${TAG}.wf-instance.${caseId}`

export function subjectRef(caseId: string) {
  return refDataset({projectId: PROJECT_ID, dataset: DATASET, documentId: caseId, type: 'case'})
}

/** Starts (or resumes) the workflow for one case and records the instance id on the case. */
export async function startCase(engine: Engine, caseId: string): Promise<string> {
  const instanceId = instanceIdFor(caseId)
  await engine.startInstance({
    definition: DEFINITION,
    instanceId,
    initialFields: [{type: 'subject', name: 'subject', value: subjectRef(caseId)}],
  })
  await content.patch(caseId).set({workflowInstanceId: instanceId}).commit()
  return instanceId
}

/**
 * Runs pending effects and ticks until the instance stops changing.
 * Returns the stage it settled in.
 */
export async function settle(engine: Engine, instanceId: string, maxRounds = 12): Promise<string> {
  for (let round = 0; round < maxRounds; round++) {
    const before = await engine.getInstance({instanceId})
    const hadPending = before.pendingEffects.length > 0
    if (hadPending) await engine.drainEffects({instanceId})
    const tick = await engine.tick({instanceId})
    const after = tick.instance
    const stillPending = after.pendingEffects.length > 0
    if (!hadPending && !tick.changed && !stillPending) return after.currentStage
    if (after.completedAt && !stillPending) return after.currentStage
  }
  return (await engine.getInstance({instanceId})).currentStage
}
