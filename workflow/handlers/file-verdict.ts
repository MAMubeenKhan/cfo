import type {SanityClient} from '@sanity/client'
import type {EffectHandler} from '@sanity/workflow-engine'
import {extractDocumentId} from '@sanity/workflow-engine'
import {appendLog} from '../lib/case-store'
import {credibility, VERDICTS, type Verdict} from '../lib/routing'

const STAMP: Record<Verdict, string> = {classified: 'CLASSIFIED', debunked: 'DEBUNKED', inconclusive: 'INCONCLUSIVE'}

/** Stamps the verdict on the case and refreshes the witness's track record. Safe to replay. */
export function makeFileVerdictHandler(content: SanityClient): EffectHandler {
  return async (params, ctx) => {
    const caseId = extractDocumentId(String(params.subject))
    const c = await content.fetch<{_id: string; witness?: string; visitor?: boolean; category?: string; flags?: string[]} | null>(
      `*[_id == $id][0]{_id, "witness": witness._ref, "visitor": defined(visitorDecision.at), category, "flags": triage.flags}`,
      {id: caseId},
    )
    if (!c) {
      ctx.log(`file-verdict: case ${caseId} not found`)
      return
    }

    const wanted = typeof params.verdict === 'string' ? params.verdict : 'debunked'
    const verdict: Verdict = (VERDICTS as readonly string[]).includes(wanted) ? (wanted as Verdict) : 'inconclusive'
    const note =
      (typeof params.note === 'string' && params.note.trim()) ||
      (verdict === 'debunked' ? 'Closed at triage by the Field Investigator.' : 'Filed without a note.')
    const filedBy = c.visitor ? 'visitor' : params.investigatorId ? 'investigator' : params.directorId ? 'director' : 'agent'

    // Faith rule, enforced again at the last gate: a faith-sensitive case is never stamped DEBUNKED by the agent.
    const final: Verdict = verdict === 'debunked' && filedBy === 'agent' && c.flags?.includes('faith-sensitive') ? 'inconclusive' : verdict

    await content
      .patch(caseId)
      .set({status: final, verdict: {outcome: final, note: note.slice(0, 600), filedAt: new Date().toISOString(), filedBy}})
      .commit()
    await appendLog(content, caseId, {
      key: `${ctx.effectKey}:filed`,
      actor: filedBy === 'agent' ? 'agent' : filedBy === 'visitor' ? 'visitor' : 'human',
      kind: 'filed',
      message: `Filed: ${STAMP[final]}. ${note}`.slice(0, 400),
    })

    // Witness track record, recomputed from every closed case (idempotent by construction).
    if (c.witness) {
      const counts = await content.fetch<{classified: number; debunked: number; inconclusive: number; total: number}>(
        `{"classified": count(*[_type=="case" && witness._ref==$w && status=="classified"]),
          "debunked": count(*[_type=="case" && witness._ref==$w && status=="debunked"]),
          "inconclusive": count(*[_type=="case" && witness._ref==$w && status=="inconclusive"]),
          "total": count(*[_type=="case" && witness._ref==$w])}`,
        {w: c.witness},
      )
      await content
        .patch(c.witness)
        .set({
          reportsCount: counts.total,
          closedCounts: {classified: counts.classified, debunked: counts.debunked, inconclusive: counts.inconclusive},
          credibility: credibility(counts),
        })
        .commit()
    }
  }
}
