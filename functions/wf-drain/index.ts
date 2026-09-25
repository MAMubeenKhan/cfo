import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'
import {createEffectHandlers} from '../../workflow/handlers'

interface WorkflowEvent {
  _id: string
}

/** Dispatches the queued effects of one workflow instance. One drain call per event, no outer loop. */
export const handler = documentEventHandler<WorkflowEvent>(async ({context, event}) => {
  const projectId = context.clientOptions.projectId
  const dataset = context.clientOptions.dataset
  if (!projectId || !dataset) throw new Error('The Function event has no project or dataset')
  const tag = process.env.WORKFLOW_TAG ?? 'prod'

  // Engine client: raw perspective, engine API version.
  const client = createClient({...context.clientOptions, projectId, dataset, apiVersion: ENGINE_API_VERSION, perspective: 'raw', useCdn: false})
  // Content client: same dataset, experimental version for Agent Actions.
  const content = createClient({...context.clientOptions, projectId, dataset, apiVersion: 'vX', perspective: 'raw', useCdn: false})

  const engine = createEngine({
    client,
    workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
    tag,
    executionContext: {kind: 'drainer', id: 'wf-drain'},
    effects: {
      handlers: createEffectHandlers(content, {
        provider: process.env.LLM_PROVIDER === 'anthropic' ? 'anthropic' : 'sanity',
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        anthropicModel: process.env.ANTHROPIC_MODEL,
      }),
      missingHandler: 'skip',
    },
  })

  await engine.drainEffects({instanceId: event.data._id})
})
