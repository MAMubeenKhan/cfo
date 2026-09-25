import {defineBlueprint, defineDocumentFunction, defineRobotToken} from '@sanity/blueprints'

const projectId = process.env.SANITY_PROJECT_ID ?? 'cyh4xyo1'
const dataset = process.env.SANITY_DATASET ?? 'production'
const robotToken = '$.resources.wf-runtime.token'

export default defineBlueprint({
  resources: [
    // The identity the functions use to write to the dataset and call Agent Actions.
    defineRobotToken({
      name: 'wf-runtime',
      label: 'Workflows runtime',
      memberships: [{resourceType: 'project', resourceId: projectId, roleNames: ['editor']}],
    }),

    // Fires when a workflow instance gains effects nobody has claimed yet (a new report, a stage change),
    // then dispatches them: the AI triage, the cross-reference, the status mirror and the verdict filing.
    defineDocumentFunction({
      name: 'wf-drain',
      src: './functions/wf-drain',
      project: projectId,
      robotToken,
      timeout: 120,
      memory: 1,
      env: {LLM_PROVIDER: process.env.LLM_PROVIDER ?? 'sanity', WORKFLOW_TAG: 'prod'},
      event: {
        on: ['create', 'update'],
        filter:
          '_type == "sanity.workflow.instance" && tag == "prod" && ' +
          'count(after().pendingEffects[!defined(claim)]) > ' +
          'coalesce(count(before().pendingEffects[!defined(claim)]), 0)',
        projection: '{_id}',
        resource: {type: 'dataset', id: `${projectId}.${dataset}`},
      },
    }),

    // A daily sweeper (stale claims, re-tick) was dropped: Scheduled Functions need an organisation-scoped stack
    // and this project's token cannot create one. `npm run wf:recover` does the same job on demand.
  ],
})
