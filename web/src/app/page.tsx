import Link from 'next/link'
import {ArrowRight, FileText, Radio} from 'lucide-react'
import {CaseCard, CaseThumb} from '@/components/case-card'
import {CategoryGlyph} from '@/components/category-glyph'
import {LiveRefresh} from '@/components/live-refresh'
import {StageTrack} from '@/components/stage-track'
import {Stamp} from '@/components/stamp'
import {StatusPill} from '@/components/status-pill'
import {CATEGORIES, CATEGORY_LABEL} from '@/lib/categories'
import {timeAgo} from '@/lib/format'
import {sanityFetch} from '@/sanity/client'
import {HOME_QUERY, type HomeData} from '@/sanity/queries'

export const dynamic = 'force-dynamic'

const COUNTERS = [
  {key: 'open', label: 'Open files', tone: 'text-review'},
  {key: 'classified', label: 'Classified', tone: 'text-classified'},
  {key: 'debunked', label: 'Debunked', tone: 'text-debunked'},
  {key: 'inconclusive', label: 'Inconclusive', tone: 'text-inconclusive'},
] as const

export default async function HomePage() {
  const data = await sanityFetch<HomeData>(HOME_QUERY)
  const now = Date.now()
  const hero = data.featured[0]

  return (
    <>
      <LiveRefresh showDot={false} />

      {/* ------------------------------------------------------------------ hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 overflow-x-clip px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mono-label flex items-center gap-2">
            <span aria-hidden="true" className="h-px w-8 bg-ink-muted" /> Department of Unexplained Sightings
          </p>
          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] sm:text-6xl lg:text-[4.2rem]">
            Every sighting,
            <br />
            taken <span className="italic text-debunked">seriously.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            Bigfoot, lights over the desert, a figure on the stairs. File it with the Bureau and an AI Field Investigator will read it, score it and decide where it goes. A person signs off on anything unclear.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/report" className="inline-flex h-12 items-center gap-2 rounded-paper bg-ink px-6 text-base font-semibold text-paper transition hover:opacity-90">
              File a report <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/cases" className="inline-flex h-12 items-center rounded-paper border border-ink/30 px-6 text-base font-semibold transition hover:border-ink">
              Browse case files
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-muted">No name, email or account needed. Nothing here is real. Probably.</p>
        </div>

        {/* a real case file, stacked like paperwork */}
        {hero && (
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto" aria-label="An example case file">
            <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rotate-[3deg] rounded-paper border border-rule bg-paper-3" />
            <div aria-hidden="true" className="absolute inset-0 -translate-x-2 translate-y-1.5 -rotate-[2deg] rounded-paper border border-rule bg-paper-2" />
            <Link href={`/cases/${hero.caseNumber}`} className="paper-card relative block overflow-hidden transition hover:-translate-y-1">
              <CaseThumb thumb={hero.thumb} category={hero.category} priority className="aspect-[8/5] w-full border-b border-rule" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold tracking-[0.06em] text-ink-muted">{hero.caseNumber}</span>
                  <CategoryGlyph category={hero.category} className="h-4 w-4 text-ink-muted" />
                </div>
                <p className="mt-2 font-serif text-xl font-semibold leading-snug">{hero.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{hero.summary}</p>
              </div>
              <div className="absolute right-4 top-24">
                <Stamp tone={hero.status} size="lg" solid />
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------- counters */}
      <section aria-label="Bureau figures" className="border-y border-rule bg-paper-2/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-rule sm:grid-cols-4">
          {COUNTERS.map((c) => (
            <div key={c.key} className="bg-paper px-5 py-7 text-center sm:px-6">
              <dd className={`font-mono text-4xl font-semibold tabular-nums sm:text-5xl ${c.tone}`}>{data.counts[c.key]}</dd>
              <dt className="mono-label mt-2">{c.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mono-label">How a case moves</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">An agent and a person, using the same controls.</h2>
            <p className="mt-4 text-ink-muted">
              Every report follows one process. The Field Investigator, an AI agent, triages it. Code, not the model, decides where it goes. Then a person can approve, close or investigate it from the Director’s Desk, the Case Board or the Studio, using exactly the same transitions the agent uses.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-classified" aria-hidden="true">●</span> Believable reports are opened for investigation.</li>
              <li className="flex gap-2"><span className="text-review" aria-hidden="true">●</span> Unclear ones wait for a person.</li>
              <li className="flex gap-2"><span className="text-debunked" aria-hidden="true">●</span> Clear explanations are closed at triage.</li>
              <li className="flex gap-2"><span className="text-inconclusive" aria-hidden="true">●</span> Anything touching faith is never closed by the AI.</li>
            </ul>
          </div>
          <div className="paper-card p-6 sm:p-8">
            <StageTrack
              status="intake"
              counts={{intake: data.counts.intake, review: data.counts.review, investigation: data.counts.investigation, closed: data.counts.closed}}
            />
            <p className="rule-dashed mt-6 pt-4 text-xs text-ink-muted">Numbers show how many files are in each stage right now.</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ wire */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="wire-h">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mono-label flex items-center gap-2"><Radio className="h-3.5 w-3.5" aria-hidden="true" /> The wire</p>
            <h2 id="wire-h" className="mt-3 text-3xl font-semibold sm:text-4xl">What the Bureau is doing right now.</h2>
          </div>
          <LiveRefresh />
        </div>
        <ol className="paper-card mt-8 divide-y divide-rule" aria-label="Latest activity across all case files">
          {data.wire.map((w, i) => (
            <li key={`${w.caseNumber}-${w.at}`} className={`flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:gap-5 ${i === 0 ? 'ticker-in' : ''}`}>
              <span className="w-24 shrink-0 font-mono text-xs text-ink-muted">{timeAgo(w.at, now)}</span>
              <Link href={`/cases/${w.caseNumber}`} className="shrink-0 font-mono text-xs font-semibold underline-offset-2 hover:underline">
                {w.caseNumber}
              </Link>
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{w.title}.</span> <span className="text-ink-muted">{w.message}</span>
              </span>
              <StatusPill status={w.status} className="self-start sm:self-auto" />
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ categories */}
      <section className="border-y border-rule bg-paper-2/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="mono-label">The files</p>
          <h2 className="mt-3 text-3xl font-semibold">Six kinds of unexplained.</h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/cases?category=${c}`} className="paper-card flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:border-ink">
                  <CategoryGlyph category={c} className="h-6 w-6" />
                  <span className="font-serif text-lg font-semibold leading-tight">{CATEGORY_LABEL[c]}</span>
                  <span className="mt-auto font-mono text-xs text-ink-muted">{data.byCategory[c] ?? 0} files</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------------- featured */}
      {data.featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="feat-h">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mono-label flex items-center gap-2"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> From the files</p>
              <h2 id="feat-h" className="mt-3 text-3xl font-semibold sm:text-4xl">Classified. On record. Unexplained.</h2>
            </div>
            <Link href="/cases" className="hidden shrink-0 text-sm font-semibold underline underline-offset-4 sm:block">
              All case files
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.featured.map((c) => (
              <CaseCard key={c._id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="rounded-sheet border border-ink bg-ink px-6 py-12 text-center text-paper sm:px-12">
          <h2 className="text-3xl font-semibold text-paper sm:text-4xl">Seen something you cannot explain?</h2>
          <p className="mx-auto mt-3 max-w-xl text-paper/75">You are not alone. File it anyway. The Field Investigator will have read it before you finish your tea.</p>
          <Link href="/report" className="mt-7 inline-flex h-12 items-center gap-2 rounded-paper bg-paper px-6 text-base font-semibold text-ink transition hover:opacity-90">
            File a report <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}
