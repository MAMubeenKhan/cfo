import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {FiledTracker} from '@/components/filed-tracker'
import {sanityFetch} from '@/sanity/client'
import {STATUS_QUERY} from '@/sanity/queries'
import {isStatus, type Status} from '@/lib/status'

export const metadata: Metadata = {title: 'Report received', robots: {index: false}}
export const dynamic = 'force-dynamic'

export default async function FiledPage({params}: {params: Promise<{caseNumber: string}>}) {
  const {caseNumber} = await params
  if (!/^CFO-\d{4}-\d{4}$/.test(caseNumber)) notFound()
  const [snap, witness] = await Promise.all([
    sanityFetch<{status: string; category?: string; plausibility?: number; summary?: string; route?: string; flags?: string[]; verdictNote?: string} | null>(STATUS_QUERY, {caseNumber}),
    sanityFetch<string | null>(`*[_type == "case" && caseNumber == $caseNumber][0].witness->codename`, {caseNumber}),
  ])
  if (!snap || !isStatus(snap.status)) notFound()
  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
      <p className="mono-label">Report received</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Case {caseNumber} has been opened.</h1>
      <p className="mt-3 text-lg text-ink-muted">
        A Field Investigator has been dispatched. Please remain where you are.
        {witness && <> Your file number is <span className="font-mono text-ink">{witness}</span>. The Bureau will recognise it next time you file from this device.</>}
      </p>
      <div className="mt-10">
        <FiledTracker caseNumber={caseNumber} initial={{...snap, status: snap.status as Status}} witness={witness} />
      </div>
    </div>
  )
}
