import {defineBlueprint, defineDocumentFunction, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'

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

    // Safety net: once a day, release stale effect claims and re-evaluate open instances.
    // Scheduled Functions need an organisation-scoped stack (this one is) and run daily on the Free plan.
    // `npm run wf:recover` does the same job on demand.
    defineScheduledFunction({
      name: 'wf-sweep',
      src: './functions/wf-sweep',
      robotToken,
      timeout: 120,
      event: {expression: '0 4 * * *'},
      env: {SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset, WORKFLOW_TAG: 'prod'},
    }),
  ],
})
