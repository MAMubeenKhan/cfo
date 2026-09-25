'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useRef, useState, useTransition} from 'react'
import clsx from 'clsx'
import {Check, LoaderCircle, Search, Stamp as StampIcon, X} from 'lucide-react'
import {CategoryBadge} from './category-glyph'
import {deskDecision} from '@/app/actions'
import {formatShortDate} from '@/lib/format'

export interface DeskCase {
  _id: string
  caseNumber: string
  title: string
  category: string
  observedAt: string
  place?: string
  plausibility?: number
  summary?: string
  memo?: string
  description?: string
  flags?: string[]
}

export function DeskList({cases, enabled}: {cases: DeskCase[]; enabled: boolean}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ok: boolean; text: string} | null>(null)
  const [closing, setClosing] = useState<DeskCase | null>(null)
  const [note, setNote] = useState('')
  const [confirmFaith, setConfirmFaith] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  function run(c: DeskCase, action: 'open-investigation' | 'debunk', noteText?: string, faith?: boolean) {
    setBusyId(c._id)
    setMessage(null)
    startTransition(async () => {
      const res = await deskDecision({caseId: c._id, action, note: noteText, confirmFaith: faith})
      setMessage({ok: res.ok, text: res.ok ? `${c.caseNumber}: ${res.message}` : res.message})
      setBusyId(null)
      if (res.ok) {
        dialog.current?.close()
        router.refresh()
      }
    })
  }

  const openClose = (c: DeskCase) => {
    setClosing(c)
    setNote('')
    setConfirmFaith(false)
    setMessage(null)
    dialog.current?.showModal()
  }
  const faithFlag = closing?.flags?.includes('faith-sensitive') ?? false
  const noteOk = note.trim().length >= 10 && note.trim().length <= 280

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">{message?.text}</p>
      {message && (
        <div className={clsx('mb-5 flex items-center gap-2 rounded-paper border-2 px-4 py-3 text-sm font-medium', message.ok ? 'border-classified text-classified' : 'border-debunked text-debunked')} role="alert">
          {message.ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <span aria-hidden="true">▲</span>} {message.text}
        </div>
      )}

      {cases.length === 0 ? (
        <div className="paper-card p-10 text-center">
          <StampIcon className="mx-auto h-8 w-8 text-ink-muted" aria-hidden="true" />
          <p className="mt-3 font-serif text-2xl font-semibold">The desk is clear.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Every file has been decided. File a report: if the Field Investigator is unsure, it will land here for you.
          </p>
          <Link href="/report" className="mt-6 inline-flex h-11 items-center rounded-paper bg-ink px-5 text-sm font-semibold text-paper">File a report</Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {cases.map((c) => {
            const busy = busyId === c._id && pending
            const faith = c.flags?.includes('faith-sensitive')
            return (
              <li key={c._id}>
                <article className="paper-card p-5 sm:p-6" aria-labelledby={`t-${c._id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <Link href={`/cases/${c.caseNumber}`} className="font-mono text-xs font-semibold tracking-[0.06em] hover:underline">{c.caseNumber}</Link>
                      <CategoryBadge category={c.category} />
                      <span className="text-xs text-ink-muted">{c.place ? `${c.place} · ` : ''}{formatShortDate(c.observedAt)}</span>
                    </div>
                    {typeof c.plausibility === 'number' && (
                      <span className="font-mono text-xs font-bold tabular-nums">Plausibility {c.plausibility}/100</span>
                    )}
                  </div>
                  <h2 id={`t-${c._id}`} className="mt-3 text-2xl font-semibold leading-tight">{c.title}</h2>
                  {c.description && <p className="mt-3 line-clamp-3 text-[0.95rem] text-ink-muted">{c.description}</p>}
                  {c.memo && (
                    <div className="mt-4 rounded-paper border border-dashed border-rule bg-paper p-4">
                      <p className="mono-label">Field Investigator’s memo</p>
                      <p className="mt-1.5 font-serif text-[0.98rem] leading-relaxed">{c.memo}</p>
                    </div>
                  )}
                  {faith && (
                    <p className="mt-3 text-sm text-review">This report may involve religious belief. The Bureau takes no position on matters of faith.</p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!enabled || busy}
                      onClick={() => run(c, 'open-investigation')}
                      className="inline-flex h-11 items-center gap-2 rounded-paper bg-ink px-5 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                      Open investigation
                    </button>
                    <button
                      type="button"
                      disabled={!enabled || busy}
                      onClick={() => openClose(c)}
                      className="inline-flex h-11 items-center gap-2 rounded-paper border border-debunked/60 px-5 text-sm font-semibold text-debunked transition hover:bg-debunked/10 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" /> Debunk…
                    </button>
                    <Link href={`/cases/${c.caseNumber}`} className="ml-auto text-sm font-semibold underline underline-offset-2">Full file</Link>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-labelledby="debunk-h"
        className="m-auto w-[min(94vw,32rem)] rounded-sheet border border-rule bg-paper-2 p-0 text-ink backdrop:bg-black/60"
      >
        {closing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (noteOk && (!faithFlag || confirmFaith)) run(closing, 'debunk', note.trim(), confirmFaith)
            }}
            className="p-6"
          >
            <h2 id="debunk-h" className="text-2xl font-semibold">Close {closing.caseNumber} as debunked</h2>
            <p className="mt-2 text-sm text-ink-muted">Give your grounds. They are stamped on the public file next to the verdict.</p>
            <label htmlFor="debunk-note" className="mt-5 block text-sm font-semibold">Grounds for closing</label>
            <textarea
              id="debunk-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={280}
              required
              minLength={10}
              className="mt-1.5 w-full rounded-paper border border-rule bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
            />
            <p className={clsx('mt-1 text-right font-mono text-xs', noteOk ? 'text-classified' : 'text-ink-muted')}>{note.trim().length}/280 · minimum 10</p>
            {faithFlag && (
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-paper border border-review/50 bg-review/10 p-3 text-sm">
                <input type="checkbox" checked={confirmFaith} onChange={(e) => setConfirmFaith(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--review)]" />
                <span>This report may involve religious belief. The Bureau takes no position on matters of faith. I still want to close it.</span>
              </label>
            )}
            {message && !message.ok && <p className="mt-3 text-sm font-medium text-debunked" role="alert">▲ {message.text}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => dialog.current?.close()} className="h-11 rounded-paper border border-rule px-5 text-sm font-semibold">Cancel</button>
              <button
                type="submit"
                disabled={!noteOk || (faithFlag && !confirmFaith) || pending}
                className="inline-flex h-11 items-center gap-2 rounded-paper bg-debunked px-5 text-sm font-semibold text-on-solid disabled:opacity-50"
              >
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} Close the case
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  )
}
