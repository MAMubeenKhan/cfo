import type {SanityClient} from '@sanity/client'
import type {EffectHandler} from '@sanity/workflow-engine'
import {makeCrossrefHandler} from './crossref'
import {makeFileVerdictHandler} from './file-verdict'
import {makeMirrorHandler} from './mirror'
import {makeTriageHandler, type Llm} from './triage'

/**
 * Every effect the case-lifecycle workflow can queue, keyed by the effect's name in the definition.
 * `content` is a client with write access to the dataset. Handlers are idempotent: the engine
 * may dispatch one twice (lease expiry), so each write is guarded by ctx.effectKey or a natural key.
 */
export function createEffectHandlers(content: SanityClient, llm: Llm = {}): Record<string, EffectHandler> {
  return {
    'agent-triage': makeTriageHandler(content, llm),
    'agent-crossref': makeCrossrefHandler(content, llm),
    'mirror-review': makeMirrorHandler(content, 'review'),
    'mirror-investigation': makeMirrorHandler(content, 'investigation'),
    'file-verdict': makeFileVerdictHandler(content),
  }
}

export type {Llm}
