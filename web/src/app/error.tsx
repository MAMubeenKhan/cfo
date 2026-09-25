'use client'

import {useEffect} from 'react'

export default function ErrorPage({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  useEffect(() => console.error(error), [error])
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="mono-label">Wire fault</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">The wire went dead.</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-muted">Nothing was lost. The Bureau could not reach the files just now.</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex h-12 items-center rounded-paper bg-ink px-6 font-semibold text-paper">
        Try again
      </button>
    </div>
  )
}
