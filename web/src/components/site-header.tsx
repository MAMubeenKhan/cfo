import Link from 'next/link'
import {Seal} from './seal'
import {NavLinks} from './nav-links'
import {ThemeToggle} from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-paper" aria-label="Cryptid Field Office, home">
          <Seal size={34} className="shrink-0 text-ink" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-serif text-[1.05rem] font-semibold tracking-tight">Cryptid Field Office</span>
            <span className="mono-label hidden truncate sm:block">Dept. of Unexplained Sightings</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NavLinks />
          <ThemeToggle />
          <Link
            href="/report"
            className="hidden h-10 items-center rounded-paper bg-ink px-4 text-sm font-semibold text-paper transition hover:opacity-90 md:inline-flex"
          >
            File a report
          </Link>
        </div>
      </div>
    </header>
  )
}
