import type {SanityClient} from '@sanity/client'
import {STATUS_RANK} from './routing'

/** Everything the handlers do to case documents lives here, so each write is idempotent in one place. */

export type Actor = 'agent' | 'human' | 'visitor' | 'system'
export type LogKind = 'received' | 'triaged' | 'routed' | 'connected' | 'decision' | 'filed' | 'error'

/** Adds one entry to the public case log, once. `key` makes it safe to replay. */
export async function appendLog(
  content: SanityClient,
  caseId: string,
  entry: {key: string; actor: Actor; kind: LogKind; message: string},
): Promise<void> {
  const already = await content.fetch<number>(`count(*[_id == $id && count(log[_key == $key]) > 0])`, {id: caseId, key: entry.key})
  if (already > 0) return
  await content
    .patch(caseId)
    .setIfMissing({log: []})
    .insert('after', 'log[-1]', [
      {_key: entry.key, _type: 'logEntry', at: new Date().toISOString(), actor: entry.actor, kind: entry.kind, message: entry.message.slice(0, 400)},
    ])
    .commit()
}

/**
 * Sets the case status mirror, but only forwards. Effects may be processed out of order
 * or replayed, and a stale one must never drag a filed case back to "review".
 */
export async function mirrorStatus(content: SanityClient, caseId: string, status: string): Promise<'moved' | 'kept'> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await content.fetch<{_rev: string; status?: string} | null>(`*[_id == $id][0]{_rev, status}`, {id: caseId})
    if (!current) throw new Error(`case ${caseId} not found`)
    if ((STATUS_RANK[status] ?? 0) <= (STATUS_RANK[current.status ?? 'intake'] ?? 0)) return 'kept'
    try {
      await content.patch(caseId).ifRevisionId(current._rev).set({status}).commit()
      return 'moved'
    } catch (error) {
      const code = (error as {statusCode?: number}).statusCode
      if (code !== 409 || attempt === 2) throw error
    }
  }
  return 'kept'
}

export function conflictKey(caseId: string, otherId: string): {id: string; from: string; to: string} {
  const [from, to] = [caseId, otherId].sort()
  return {id: `conn-${from}-${to}`, from, to}
}
