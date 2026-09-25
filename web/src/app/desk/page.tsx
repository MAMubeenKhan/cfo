import type {Metadata} from 'next'
import {LiveRefresh} from '@/components/live-refresh'
import {DeskList, type DeskCase} from '@/components/desk-list'
import {sanityFetch} from '@/sanity/client'
import {DESK_QUERY} from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Director’s Desk',
  description: 'Play the Director. Open an investigation or close a case, using the same workflow transitions the AI agent and the Bureau’s staff use.',
}
export const dynamic = 'force-dynamic'

export default async function DeskPage() {
  const [cases, settings] = await Promise.all([
    sanityFetch<DeskCase[]>(DESK_QUERY),
    sanityFetch<{publicDeskEnabled?: boolean} | null>(`*[_id == "bureau-settings"][0]{publicDeskEnabled}`),
  ])
  const enabled = settings?.publicDeskEnabled !== false
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label">Visitor access</p>
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">The Director’s Desk</h1>
          </div>
          <LiveRefresh />
        </div>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          These files were referred by the Field Investigator because it was not sure. You are the Director for the day. Your decision goes through the same workflow action the Bureau’s staff use in the Studio and on the Case Board, and it is logged as “Visitor Director”.
        </p>
        {!enabled && (
          <p className="mt-4 rounded-paper border-2 border-ink bg-paper-3 p-3 text-sm font-medium" role="status">
            The desk is closed to visitors right now. You can still read every file.
          </p>
        )}
      </header>
      <DeskList cases={cases} enabled={enabled} />
    </div>
  )
}
