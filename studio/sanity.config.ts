import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {workflowDefaultDocumentNode, workflowStudioPlugin} from '@sanity/workflow-studio-plugin'
import {schemaTypes} from './schemaTypes'
import {structure} from './src/structure'
import {
  HiddenBadge,
  PlausibilityBadge,
  StatusBadge,
  resolveActions,
  resolveNewDocumentOptions,
} from './src/document-rules'
import {CfoLogo} from './src/components/cfo-logo'

export default defineConfig({
  name: 'default',
  title: 'Cryptid Field Office',

  projectId: 'cyh4xyo1',
  dataset: 'production',

  plugins: [
    structureTool({structure, defaultDocumentNode: workflowDefaultDocumentNode()}),
    // Same engine, same transitions as the agent, the Case Board and the public Director's Desk.
    workflowStudioPlugin({
      tag: 'prod', // must match the deploy tag in sanity.workflow.ts
      mappings: [{docType: 'case', definition: 'case-lifecycle', label: 'Case lifecycle'}],
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: resolveActions,
    badges: (prev, {schemaType}) =>
      schemaType === 'case' ? [StatusBadge, PlausibilityBadge, HiddenBadge, ...prev] : prev,
    newDocumentOptions: resolveNewDocumentOptions,
  },

  studio: {
    components: {
      logo: CfoLogo,
    },
  },
})
