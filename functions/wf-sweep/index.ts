import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'
import {createEngine, ENGINE_API_VERSION, errorMessage, instancesQuery, sweepStaleClaims} from '@sanity/workflow-engine'

/** Daily recovery: release stale effect claims and re-evaluate open instances. Writes nothing when nothing changed. */
export const handler = scheduledEventHandler(async ({context}) => {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const tag = process.env.WORKFLOW_TAG ?? 'prod'
  if (!projectId || !dataset) throw new Error('The Scheduled Function requires SANITY_PROJECT_ID and SANITY_DATASET')

  const client = createClient({...context.clientOptions, projectId, dataset, apiVersion: ENGINE_API_VERSION, perspective: 'raw', useCdn: false})
  const executionContext = {kind: 'server', id: 'wf-sweep'} as const
  const engine = createEngine({client, workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`}, tag, executionContext})

  const {query, params} = instancesQuery({tag, filter: {includeCompleted: true}})
  const instances = await client.fetch<Array<{_id: string; completedAt: string | null}>>(
    `${query}[!defined(completedAt) || count(pendingEffects) > 0]{_id, completedAt}`,
    params,
  )

  let failed = 0
  for (const {_id, completedAt} of instances) {
    try {
      await sweepStaleClaims({client, tag, instanceId: _id, executionContext})
      if (completedAt === null) await engine.tick({instanceId: _id})
    } catch (error) {
      failed += 1
      console.error(`Scheduled recovery failed for ${_id}: ${errorMessage(error)}`)
    }
  }
  // Housekeeping: rate-limit counters are only useful for an hour; drop anything older than two days.
  const cutoff = new Date(Date.now() - 2 * 86400_000).toISOString()
  await client.delete({query: '*[_type == "rateLimit" && _updatedAt < $cutoff]', params: {cutoff}})

  if (instances.length > 0 && failed === instances.length) throw new Error('Scheduled recovery failed for every selected instance')
})
