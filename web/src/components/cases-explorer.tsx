'use client'

/* eslint-disable @next/next/no-img-element -- Sanity CDN thumbnails, see components/case-card.tsx */
import Link from 'next/link'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from 'react'
import clsx from 'clsx'
import {List, Lock, MapPin, Search, X} from 'lucide-react'
import {DeferredMap} from './case-map-lazy'
import {CategoryBadge, CategoryGlyph} from './category-glyph'
import {sizedUrl} from './case-card'
import {StatusPill} from './status-pill'
import {CATEGORIES, CATEGORY_LABEL, isCategory} from '@/lib/categories'
import {formatShortDate} from '@/lib/format'
import {STATUS_LABEL, isStatus, type Status} from '@/lib/status'
import type {CaseCard} from '@/sanity/queries'

const OPEN: Status[] = ['intake', 'review', 'investigation', 'filing']
const STATUS_FILTERS = [
  {value: 'all', label: 'All statuses'},
  {value: 'open', label: 'Open files'},
  {value: 'review', label: STATUS_LABEL.review},
  {value: 'investigation', label: STATUS_LABEL.investigation},
  {value: 'classified', label: 'Classified'},
  {value: 'debunked', label: 'Debunked'},
  {value: 'inconclusive', label: 'Inconclusive'},
] as const

export function CasesExplorer({cases}: {cases: CaseCard[]}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})

  const category = params.get('category') ?? 'all'
  const status = params.get('status') ?? 'all'
  const restricted = params.get('restricted') === '1'
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const urlQ = params.get('q') ?? ''
  const [q, setQ] = useState(urlQ)

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '' || v === 'all' || (k === 'view' && v === 'list') || (k === 'restricted' && v === '0')) next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, {scroll: false}))
    },
    [params, pathname, router],
  )

  // Debounce the search box into the URL.
  useEffect(() => {
    if (q === urlQ) return
    const t = setTimeout(() => update({q: q.trim()}), 300)
    return () => clearTimeout(t)
  }, [q, urlQ, update])

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of cases) m[c.category] = (m[c.category] ?? 0) + 1
    return m
  }, [cases])

  const filtered = useMemo(() => {
    const needle = urlQ.trim().toLowerCase()
    return cases.filter((c) => {
      if (isCategory(category) && c.category !== category) return false
      if (status === 'open' && !OPEN.includes(c.status)) return false
      if (status !== 'all' && status !== 'open' && isStatus(status) && c.status !== status && !(status === 'investigation' && c.status === 'filing')) return false
      if (restricted && !c.region?.restricted) return false
      if (needle) {
        const hay = [c.title, c.caseNumber, c.place, c.region?.name, c.subject, c.summary].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [cases, category, status, restricted, urlQ])

  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) rowRefs.current[id]?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
  }

  const reset = () => {
    setQ('')
    router.replace(pathname, {scroll: false})
  }
  const filtersActive = category !== 'all' || status !== 'all' || restricted || urlQ !== ''

  return (
    <div>
      {/* ------------------------------------------------------------ filters */}
      <div className="space-y-4">
        <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {[{v: 'all', label: 'All', n: cases.length}, ...CATEGORIES.map((c) => ({v: c, label: CATEGORY_LABEL[c], n: counts[c] ?? 0}))].map((o) => {
            const on = category === o.v
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={on}
                onClick={() => update({category: o.v})}
                className={clsx('inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition', on ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper hover:border-ink')}
              >
                {o.v !== 'all' && <CategoryGlyph category={o.v} />}
                {o.label}
                <span className={clsx('font-mono text-xs', on ? 'text-paper/70' : 'text-ink-muted')}>{o.n}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="case-search" className="sr-only">Search case files</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input
              id="case-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, place, subject or case number"
              className="h-11 w-full rounded-paper border border-rule bg-paper pl-10 pr-3 text-base outline-none placeholder:text-ink-muted/70 focus:border-accent"
            />
          </div>
          <label className="sr-only" htmlFor="status-filter">Filter by status</label>
          <select id="status-filter" value={status} onChange={(e) => update({status: e.target.value})} className="h-11 rounded-paper border border-rule bg-paper px-3 text-base outline-none focus:border-accent">
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-paper border border-rule bg-paper px-3 text-sm font-medium has-[:checked]:border-ink">
            <input type="checkbox" checked={restricted} onChange={(e) => update({restricted: e.target.checked ? '1' : '0'})} className="h-4 w-4 accent-[var(--ink)]" />
            <Lock className="h-4 w-4" aria-hidden="true" /> Restricted sites
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted" role="status" aria-live="polite">
            <span className="font-mono font-semibold text-ink">{filtered.length}</span> {filtered.length === 1 ? 'file' : 'files'}
            {filtersActive && <> of {cases.length}</>}
          </p>
          <div className="flex items-center gap-2">
            {filtersActive && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2">
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
              </button>
            )}
            <div role="group" aria-label="View" className="flex overflow-hidden rounded-paper border border-rule lg:hidden">
              {(['list', 'map'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => update({view: v})} className={clsx('inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium', view === v ? 'bg-ink text-paper' : 'bg-paper')}>
                  {v === 'list' ? <List className="h-4 w-4" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
                  {v === 'list' ? 'List' : 'Map'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- list + map */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <div className={clsx(view === 'map' && 'hidden lg:block')}>
          {filtered.length === 0 ? (
            <div className="paper-card p-8 text-center">
              <p className="font-serif text-xl font-semibold">No files match.</p>
              <p className="mt-2 text-sm text-ink-muted">Either the filters are too narrow, or they are getting better at hiding.</p>
              <button type="button" onClick={reset} className="mt-5 inline-flex h-11 items-center rounded-paper bg-ink px-5 text-sm font-semibold text-paper">
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="space-y-3 lg:max-h-[calc(100dvh-16rem)] lg:overflow-y-auto lg:pr-1">
              {filtered.map((c) => (
                <li key={c._id} ref={(el) => {rowRefs.current[c._id] = el}}>
                  <article className={clsx('paper-card relative flex gap-3 p-3 transition', selectedId === c._id && 'ring-2 ring-accent')}>
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-paper border border-rule bg-paper-3">
                      {c.thumb?.url ? (
                        <img src={sizedUrl(c.thumb.url, 192, 160)} alt={c.thumb.alt ?? ''} width={96} height={80} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-ink-muted" aria-hidden="true">
                          <CategoryGlyph category={c.category} className="h-6 w-6 opacity-60" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <span className="whitespace-nowrap font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-ink-muted">{c.caseNumber}</span>
                        <StatusPill status={c.status} />
                      </div>
                      <h2 className="mt-1 font-serif text-base font-semibold leading-snug">
                        <Link href={`/cases/${c.caseNumber}`} className="after:absolute after:inset-0 after:content-['']">
                          {c.title}
                        </Link>
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                        <CategoryBadge category={c.category} />
                        <span>{formatShortDate(c.observedAt)}</span>
                        {c.region?.restricted && <span className="inline-flex items-center gap-1 font-semibold text-ink"><Lock className="h-3 w-3" aria-hidden="true" />Restricted</span>}
                      </p>
                    </div>
                    {typeof c.lat === 'number' && (
                      <button
                        type="button"
                        onClick={() => {
                          select(c._id)
                          update({view: 'map'})
                        }}
                        aria-label={`Show ${c.caseNumber} on the map`}
                        className="relative z-10 hidden h-8 w-8 shrink-0 place-items-center self-center rounded-full border border-rule bg-paper text-ink-muted transition hover:border-ink hover:text-ink sm:grid"
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={clsx('lg:sticky lg:top-20 lg:h-[calc(100dvh-16rem)]', view === 'list' && 'hidden lg:block')}>
          <div className="h-[70dvh] overflow-hidden rounded-sheet border border-rule lg:h-full">
            <DeferredMap cases={filtered} selectedId={selectedId} onSelect={select} className="h-full w-full" />
          </div>
          <p className="mt-2 text-xs text-ink-muted">The list is the full accessible view of everything on the map.</p>
        </div>
      </div>
    </div>
  )
}
