import type {Metadata} from 'next'
import {ReportForm} from '@/components/report-form'
import {sanityFetch} from '@/sanity/client'
import type {Category} from '@/lib/categories'

export const metadata: Metadata = {
  title: 'File a report',
  description: 'File a sighting with the Cryptid Field Office. Cryptids, UFOs, aliens, ghosts, spirits and the occult are all taken seriously.',
}

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  const subjects = await sanityFetch<{slug: string; name: string; category: Category}[]>(
    `*[_type == "subject"] | order(name asc){"slug": slug.current, name, category}`,
  ).catch(() => [])
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <header className="mx-auto mb-8 max-w-3xl">
        <p className="mono-label">Intake</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">File a report</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Tell the Bureau what you saw. An AI Field Investigator will read it within a minute and decide where it goes. A person signs off on anything unclear. No name, email or address is needed.
        </p>
      </header>
      <ReportForm subjects={subjects} />
    </div>
  )
}
