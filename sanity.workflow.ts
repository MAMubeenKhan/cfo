import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {caseLifecycle} from './workflow/case-lifecycle'

const PROJECT_ID = 'cyh4xyo1'
const DATASET = 'production'

// Content and workflow instances share one dataset, so the Studio plugin, the Case Board
// and the public site all point at the same place.
export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`},
      definitions: [caseLifecycle],
    },
  ],
})
