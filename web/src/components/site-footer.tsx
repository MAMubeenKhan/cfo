import Link from 'next/link'
import {Seal} from './seal'

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-rule bg-paper-2/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Seal size={30} className="text-ink" />
            <span className="font-serif text-lg font-semibold">Cryptid Field Office</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            If you have seen something you cannot explain, you are not alone. File it anyway.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
            The Cryptid Field Office is not a government agency. Probably.
          </p>
        </div>
        <nav aria-label="Footer" className="text-sm">
          <p className="mono-label mb-3">The Bureau</p>
          <ul className="space-y-2">
            <li><Link className="hover:underline" href="/cases">Case files</Link></li>
            <li><Link className="hover:underline" href="/report">File a report</Link></li>
            <li><Link className="hover:underline" href="/desk">Director’s Desk</Link></li>
            <li><Link className="hover:underline" href="/about">How this was built</Link></li>
          </ul>
        </nav>
        <div className="text-sm text-ink-muted">
          <p className="mono-label mb-3">Credits</p>
          <p>
            Map data © <a className="underline" href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a> contributors. Tiles by{' '}
            <a className="underline" href="https://openfreemap.org" rel="noreferrer">OpenFreeMap</a>. Place search by{' '}
            <a className="underline" href="https://photon.komoot.io" rel="noreferrer">Photon</a>. All sightings, witnesses and societies are invented.
          </p>
        </div>
      </div>
    </footer>
  )
}
