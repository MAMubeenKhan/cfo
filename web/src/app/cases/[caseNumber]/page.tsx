import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ArrowLeft, Lock} from 'lucide-react'
import {CategoryBadge} from '@/components/category-glyph'
import {DeferredMap} from '@/components/case-map-lazy'
import {EvidenceGallery} from '@/components/evidence-gallery'
import {Memo, Redacted, RelatedFiles, Timeline, WitnessCard} from '@/components/dossier-parts'
import {LiveRefresh} from '@/components/live-refresh'
import {StageTrack} from '@/components/stage-track'
import {Stamp} from '@/components/stamp'
import {isFaithSensitive, CATEGORY_LONG, isCategory} from '@/lib/categories'
import {formatCoords, formatDate, formatTime} from '@/lib/format'
import {isClosed, isStatus} from '@/lib/status'
import {sanityFetch} from '@/sanity/client'
import {DOSSIER_QUERY, type Dossier} from '@/sanity/queries'

export const dynamic = 'force-dynamic'

type Props = {params: Promise<{caseNumber: string}>}

async function load(caseNumber: string): Promise<Dossier | null> {
  if (!/^CFO-\d{4}-\d{4}$/.test(caseNumber)) return null
  return sanityFetch<Dossier | null>(DOSSIER_QUERY, {caseNumber})
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {caseNumber} = await params
  const d = await load(caseNumber).catch(() => null)
  if (!d) return {title: 'File redacted'}
  const desc = d.summary ?? d.description.slice(0, 160)
  return {
    title: `${d.caseNumber}: ${d.title}`,
    description: desc,
    alternates: {canonical: `/cases/${d.caseNumber}`},
    openGraph: {title: `${d.caseNumber}: ${d.title}`, description: desc, type: 'article'},
  }
}

const LIGHT: Record<string, string> = {daylight: 'Daylight', dusk: 'Dusk', night: 'Night', artificial: 'Artificial light'}
const WEATHER: Record<string, string> = {clear: 'Clear', rain: 'Rain', fog: 'Fog', snow: 'Snow', wind: 'Windy'}

export default async function DossierPage({params}: Props) {
  const {caseNumber} = await params
  const d = await load(caseNumber)
  if (!d) notFound()

  const closed = isClosed(d.status)
  const restricted = Boolean(d.region?.restricted)
  const c = d.conditions
  const coords = formatCoords(d.lat, d.lng)
  const facts: [string, React.ReactNode][] = [
    ['Observed', <>{formatDate(d.observedAt)}, {formatTime(d.observedAt)}</>],
    ['Location', <>{d.place ?? 'Unrecorded'}{d.region?.name && d.region.name !== d.place ? <span className="text-ink-muted"> · {d.region.name}</span> : null}</>],
    ...(coords ? [['Coordinates', restricted ? <Redacted>{coords}</Redacted> : coords] as [string, React.ReactNode]] : []),
    ...(c?.light || c?.weather ? [['Conditions', [c.light && LIGHT[c.light], c.weather && WEATHER[c.weather]].filter(Boolean).join(', ')] as [string, React.ReactNode]] : []),
    ...(c?.distanceMeters != null ? [['Distance', `${c.distanceMeters.toLocaleString('en-GB')} m`] as [string, React.ReactNode]] : []),
    ...(c?.durationSeconds != null ? [['Duration', c.durationSeconds >= 120 ? `${Math.round(c.durationSeconds / 60)} min` : `${c.durationSeconds} s`] as [string, React.ReactNode]] : []),
    ...(d.objectShape ? [['Object shape', d.objectShape.replace('-', ' ')] as [string, React.ReactNode]] : []),
    ['Category', <CategoryBadge key="cat" category={d.category} className="text-sm text-ink" />],
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      <LiveRefresh showDot={false} />
      <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All case files
      </Link>

      {restricted && (
        <div role="note" className="mt-5 flex items-center gap-3 rounded-paper border-2 border-ink bg-paper-3 px-4 py-3">
          <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-mono font-bold uppercase tracking-[0.14em]">Restricted site.</span> This file was recorded near a restricted facility. Some details are redacted. Hover or focus a black bar to read it.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- folder header */}
      <header className="relative mt-6">
        <div className="absolute -top-3 left-4 z-10 rounded-t-[6px] border border-b-0 border-rule bg-paper-3 px-4 pb-0.5 pt-1 font-mono text-xs font-bold tracking-[0.14em]">{d.caseNumber}</div>
        <div className="paper-card relative overflow-hidden px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-3xl">
              <p className="mono-label">{isCategory(d.category) ? CATEGORY_LONG[d.category] : d.category} · Case file</p>
              <h1 className="mt-3 text-3xl font-semibold leading-[1.1] sm:text-5xl">{d.title}</h1>
            </div>
            <div className="shrink-0 pt-1"><Stamp tone={isStatus(d.status) ? d.status : 'intake'} size="xl" animate /></div>
          </div>
          <div className="rule-dashed mt-8 pt-6">
            <StageTrack status={d.status} compact />
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          {/* ------------------------------------------------------------ account */}
          <section aria-labelledby="account-h">
            <h2 id="account-h" className="mono-label mb-3">Witness account</h2>
            <p className="font-serif text-xl leading-relaxed sm:text-[1.35rem]">{d.description}</p>
            {isFaithSensitive(d.category) && (
              <p className="mt-4 rounded-paper border border-rule bg-paper-3/60 p-3.5 text-sm">The Bureau records this account as given. It takes no position on matters of faith.</p>
            )}
          </section>

          {/* ------------------------------------------------------------- verdict */}
          {closed && d.verdict && (
            <section aria-labelledby="verdict-h" className="rounded-sheet border border-rule bg-paper-2 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-6">
                <Stamp tone={d.status as 'classified'} size="lg" />
                <div className="min-w-0">
                  <h2 id="verdict-h" className="mono-label">Verdict</h2>
                  {d.verdict.note && <p className="mt-1 font-serif text-lg leading-snug">{d.verdict.note}</p>}
                  <p className="mt-2 font-mono text-xs text-ink-muted">
                    Filed {formatDate(d.verdict.filedAt)}{d.verdict.filedBy ? ` by ${d.verdict.filedBy}` : ''}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------ evidence */}
          <section aria-labelledby="evidence-h">
            <h2 id="evidence-h" className="mono-label mb-4">Evidence</h2>
            <EvidenceGallery evidence={d.evidence ?? []} />
          </section>

          <section aria-labelledby="memo-wrap">
            <h2 id="memo-wrap" className="sr-only">Field Investigator’s memo</h2>
            <Memo d={d} />
          </section>

          <section aria-labelledby="strings-h">
            <h2 id="strings-h" className="mono-label mb-4">Related files</h2>
            <RelatedFiles d={d} />
          </section>

          <section aria-labelledby="timeline-h">
            <h2 id="timeline-h" className="mono-label mb-5">Case timeline</h2>
            <Timeline log={d.log} />
          </section>
        </div>

        {/* ------------------------------------------------------------- sidebar */}
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Case details">
          <dl className="paper-card divide-y divide-rule text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="px-4 py-3">
                <dt className="mono-label">{k}</dt>
                <dd className="mt-1 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {typeof d.lat === 'number' && typeof d.lng === 'number' && (
            <div className="h-56 overflow-hidden rounded-sheet border border-rule">
              <DeferredMap cases={[d]} interactive={false} zoom={restricted ? 6 : 8} className="h-full w-full" label={`Map showing where ${d.caseNumber} was recorded`} />
            </div>
          )}
          {d.witness && <WitnessCard w={d.witness} />}
        </aside>
      </div>
    </div>
  )
}
