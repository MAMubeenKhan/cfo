import Link from 'next/link'
import {Stamp} from '@/components/stamp'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <Stamp tone="redacted" size="xl">
        Redacted
      </Stamp>
      <h1 className="mt-10 text-4xl font-semibold sm:text-5xl">This file has been redacted.</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-muted">Either it never existed, or it was never supposed to. The Bureau cannot say which.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/cases" className="inline-flex h-12 items-center rounded-paper bg-ink px-6 font-semibold text-paper">
          Browse case files
        </Link>
        <Link href="/" className="inline-flex h-12 items-center rounded-paper border border-rule px-6 font-semibold">
          Back to the Bureau
        </Link>
      </div>
    </div>
  )
}
