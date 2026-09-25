'use client'

import Link from 'next/link'
import {useEffect, useRef, useState} from 'react'
import {ArrowRight, Check, LoaderCircle} from 'lucide-react'
import clsx from 'clsx'
import {Stamp} from './stamp'
import {rememberWitness} from './report-form'
import {isClosed, isStatus, type Status} from '@/lib/status'

interface Snapshot {
  status: Status
  category?: string
  plausibility?: number | null
  summary?: string | null
  route?: string | null
  flags?: string[] | null
  verdictNote?: string | null
  steps?: number
}

const POLL_MS = 2000
const GIVE_UP_MS = 180_000

const OUTCOME_COPY: Record<string, {stamp: Status; headline: string; detail: string}> = {
  investigation: {stamp: 'investigation', headline: 'Opened for investigation.', detail: 'The Cross-Referencer is now searching the files for related reports.'},
  review: {stamp: 'review', headline: "Referred to the Director’s review.", detail: 'A person will decide whether this file is opened for investigation.'},
  classified: {stamp: 'classified', headline: 'Classified.', detail: 'On record as unexplained.'},
  debunked: {stamp: 'debunked', headline: 'Debunked.', detail: 'A common explanation fits the account.'},
  inconclusive: {stamp: 'inconclusive', headline: 'Inconclusive.', detail: 'Neither confirmed nor ruled out.'},
}

export function FiledTracker({caseNumber, initial, witness}: {caseNumber: string; initial: Snapshot; witness?: string | null}) {
  const [snap, setSnap] = useState<Snapshot>(initial)
  const [timedOut, setTimedOut] = useState(false)
  const started = useRef(Date.now())

  useEffect(() => rememberWitness(witness), [witness])

  const triaged = snap.status !== 'intake' || typeof snap.plausibility === 'number' || Boolean(snap.summary)
  const routed = snap.status !== 'intake'

  useEffect(() => {
    if (routed) return
    let stopped = false
    const id = setInterval(async () => {
      if (stopped || document.visibilityState !== 'visible') return
      if (Date.now() - started.current > GIVE_UP_MS) {
        setTimedOut(true)
        clearInterval(id)
        return
      }
      try {
        const res = await fetch(`/api/cases/${caseNumber}/status`, {cache: 'no-store'})
        if (!res.ok) return
        const data = (await res.json()) as Snapshot
        if (isStatus(data.status)) setSnap(data)
      } catch {
        /* keep trying */
      }
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [routed, caseNumber])

  // Once the workflow has stamped a verdict there is nothing left to wait for; keep polling a little for later stages.
  useEffect(() => {
    if (!routed || isClosed(snap.status)) return
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/cases/${caseNumber}/status`, {cache: 'no-store'})
        if (res.ok) {
          const data = (await res.json()) as Snapshot
          if (isStatus(data.status)) setSnap(data)
        }
      } catch {
        /* ignore */
      }
    }, 6000)
    return () => clearInterval(id)
  }, [routed, snap.status, caseNumber])

  const outcome = OUTCOME_COPY[snap.status]
  const flags = snap.flags ?? []
  const wellbeing = flags.some((f) => f === 'wellbeing-concern' || f === 'coercion-concern' || f === 'possible-emergency')
  const faith = flags.includes('faith-sensitive') || snap.category === 'spirit'

  const steps = [
    {label: 'Report received', done: true, active: false},
    {label: 'Field Investigator reviewing', done: triaged, active: !triaged && !timedOut},
    {label: 'Routed', done: routed, active: triaged && !routed},
  ]

  return (
    <div className="space-y-8">
      <ol className="space-y-3" aria-label="Filing progress">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full border-2', s.done ? 'border-ink bg-ink text-paper' : s.active ? 'border-review text-review' : 'border-rule text-ink-muted')}>
              {s.done ? <Check className="h-4 w-4" aria-hidden="true" /> : s.active ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />}
            </span>
            <span className={clsx('text-base', s.done ? 'font-semibold' : s.active ? 'font-semibold text-review' : 'text-ink-muted')}>
              {s.label}
              {s.active && <span className="sr-only"> (in progress)</span>}
              {s.active && !timedOut && <span aria-hidden="true" className="pulse-soft ml-1">…</span>}
            </span>
          </li>
        ))}
      </ol>

      {/* announced to screen readers whenever the outcome changes */}
      <p className="sr-only" role="status" aria-live="polite">
        {routed && outcome ? `${outcome.headline} ${outcome.detail}` : triaged ? 'The Field Investigator has finished reading your report.' : ''}
      </p>

      {triaged && (snap.summary || typeof snap.plausibility === 'number') && (
        <div className="paper-card p-5">
          <p className="mono-label">Field Investigator’s note</p>
          {typeof snap.plausibility === 'number' && (
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-paper-3" role="img" aria-label={`Plausibility ${snap.plausibility} out of 100`}>
                <div className="h-full rounded-full bg-ink" style={{width: `${snap.plausibility}%`}} />
              </div>
              <span className="font-mono text-sm font-semibold">{snap.plausibility}/100</span>
            </div>
          )}
          {snap.summary && <p className="mt-3 font-serif text-lg leading-snug">{snap.summary}</p>}
        </div>
      )}

      {routed && outcome && (
        <div className="flex flex-col items-start gap-4 rounded-sheet border border-rule bg-paper-2 p-6 sm:flex-row sm:items-center">
          <Stamp tone={outcome.stamp} size="xl" animate>{isClosed(snap.status) ? undefined : outcome.stamp === 'review' ? 'In review' : 'Open'}</Stamp>
          <div>
            <p className="font-serif text-xl font-semibold">{outcome.headline}</p>
            <p className="mt-1 text-sm text-ink-muted">{outcome.detail}</p>
            {snap.verdictNote && <p className="mt-2 text-sm">{snap.verdictNote}</p>}
          </div>
        </div>
      )}

      {wellbeing && (
        <p role="note" className="rounded-paper border-2 border-review bg-review/10 p-4 text-sm">
          If you or someone you know is distressed, please talk to someone you trust or contact local support services. If anyone is in immediate danger, contact local emergency services. The Bureau cannot help you with that.
        </p>
      )}
      {faith && (
        <p role="note" className="rounded-paper border border-rule bg-paper-3/60 p-4 text-sm">
          The Bureau records your account as you gave it. It takes no position on matters of faith.
        </p>
      )}

      {timedOut && !routed && (
        <p className="rounded-paper border border-rule bg-paper-3/60 p-4 text-sm" role="status">
          Triage is taking longer than usual. Your file is safe and will be picked up shortly.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/cases/${caseNumber}`} className="inline-flex h-12 items-center gap-2 rounded-paper bg-ink px-5 font-semibold text-paper transition hover:opacity-90">
          Open your case file <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/cases" className="inline-flex h-12 items-center rounded-paper border border-rule px-5 font-semibold transition hover:border-ink">
          Browse all files
        </Link>
      </div>
    </div>
  )
}
