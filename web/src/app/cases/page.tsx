import type {Metadata} from 'next'
import {Suspense} from 'react'
import {CasesExplorer} from '@/components/cases-explorer'
import {LiveRefresh} from '@/components/live-refresh'
import {sanityFetch} from '@/sanity/client'
import {CASES_QUERY, type CaseCard} from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Case files',
  description: 'Every sighting on record with the Cryptid Field Office, on a map and in a list. Filter by kind, status or place.',
}
export const dynamic = 'force-dynamic'

export default async function CasesPage() {
  const cases = await sanityFetch<CaseCard[]>(CASES_QUERY)
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">The archive</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Case files</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">Every sighting on record, on a map and in a list. Sightings are invented; the process is real.</p>
        </div>
        <LiveRefresh />
      </header>
      <Suspense fallback={<div className="paper-card h-64 animate-pulse" aria-hidden="true" />}>
        <CasesExplorer cases={cases} />
      </Suspense>
    </div>
  )
}
