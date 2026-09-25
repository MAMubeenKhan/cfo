'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Menu, X} from 'lucide-react'
import clsx from 'clsx'
import {useEffect, useRef, useState} from 'react'

const LINKS = [
  {href: '/cases', label: 'Case files'},
  {href: '/desk', label: "Director's Desk"},
  {href: '/about', label: 'About'},
]

export function NavLinks() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  // Close the phone menu on navigation, and on Escape.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const link = (l: (typeof LINKS)[number]) => {
    const active = pathname === l.href || pathname.startsWith(l.href + '/')
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'rounded-paper px-3 py-2 text-sm font-medium transition-colors',
          active ? 'text-ink underline decoration-debunked decoration-2 underline-offset-[6px]' : 'text-ink-muted hover:text-ink',
        )}
      >
        {l.label}
      </Link>
    )
  }

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
        {LINKS.map(link)}
      </nav>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border border-rule bg-paper-2 md:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open && (
        <div
          id="mobile-nav"
          ref={panel}
          className="absolute inset-x-0 top-full border-b border-rule bg-paper px-4 pb-4 pt-2 shadow-[var(--shadow-paper)] md:hidden"
        >
          <nav aria-label="Main" className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-paper px-3 py-3 text-base font-medium hover:bg-paper-2">
                {l.label}
              </Link>
            ))}
            <Link href="/report" className="mt-2 rounded-paper bg-ink px-3 py-3 text-center text-base font-semibold text-paper">
              File a report
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
