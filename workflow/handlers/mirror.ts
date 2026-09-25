import type {SanityClient} from '@sanity/client'
import type {EffectHandler} from '@sanity/workflow-engine'
import {extractDocumentId} from '@sanity/workflow-engine'
import {appendLog, mirrorStatus} from '../lib/case-store'

/** Mirrors the workflow stage onto the case document so the public site can read it without the engine. */
export function makeMirrorHandler(content: SanityClient, status: 'review' | 'investigation'): EffectHandler {
  const message = status === 'review' ? "Referred to the Director's review." : 'Investigation opened.'
  return async (params, ctx) => {
    const caseId = extractDocumentId(String(params.subject))
    const moved = await mirrorStatus(content, caseId, status)
    if (moved === 'moved') {
      await appendLog(content, caseId, {key: `${ctx.effectKey}:routed`, actor: 'system', kind: 'routed', message})
    }
  }
}
