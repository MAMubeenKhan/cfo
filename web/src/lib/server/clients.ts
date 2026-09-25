import 'server-only'
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION, refDataset} from '@sanity/workflow-engine'

export const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'cyh4xyo1'
export const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const TAG = process.env.WORKFLOW_TAG ?? 'prod'
export const DEFINITION = 'case-lifecycle'

const token = process.env.SANITY_WRITE_TOKEN

/** Server-only client with write access. Never imported from a client component. */
export const writeClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2026-09-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

/** The workflow engine, without effect handlers: the Function in Sanity's cloud runs those. */
export function getEngine() {
  return createEngine({
    client: createClient({
      projectId: PROJECT_ID,
      dataset: DATASET,
      apiVersion: ENGINE_API_VERSION,
      token,
      useCdn: false,
      perspective: 'raw',
    }),
    workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`},
    tag: TAG,
    executionContext: {kind: 'server', id: 'web'},
  })
}

/** Deterministic instance id per case: starting the same case twice resumes instead of duplicating. */
export const instanceIdFor = (caseId: string) => `${TAG}.wf-instance.${caseId}`

export const subjectRef = (caseId: string) =>
  refDataset({projectId: PROJECT_ID, dataset: DATASET, documentId: caseId, type: 'case'})

export const hasWriteToken = Boolean(token)
