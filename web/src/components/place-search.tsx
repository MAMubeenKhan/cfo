'use client'

import {useEffect, useId, useRef, useState} from 'react'
import {LoaderCircle, MapPin, Search} from 'lucide-react'
import clsx from 'clsx'

export interface PlaceResult {
  label: string
  lat: number
  lng: number
}

/** ARIA 1.2 combobox over the Photon place search. Falls back gracefully: a pin on the map always works. */
export function PlaceSearch({
  onPick,
  value,
  onValueChange,
  invalid,
  describedBy,
}: {
  onPick: (p: PlaceResult) => void
  value: string
  onValueChange: (v: string) => void
  invalid?: boolean
  describedBy?: string
}) {
  const id = useId()
  const [results, setResults] = useState<PlaceResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const skip = useRef(false)

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    const q = value.trim()
    if (q.length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
        const json = (await res.json()) as {results: PlaceResult[]; unavailable?: boolean}
        setResults(json.results)
        setUnavailable(Boolean(json.unavailable))
        setOpen(true)
        setActive(-1)
      } catch {
        setUnavailable(true)
        setOpen(true)
      } finally {
        setBusy(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [value])

  const choose = (r: PlaceResult) => {
    skip.current = true
    onValueChange(r.label)
    setOpen(false)
    onPick(r)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          value={value}
          placeholder="Search for a town, road or landmark"
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(results.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter' && open && active >= 0) {
              e.preventDefault()
              choose(results[active])
            } else if (e.key === 'Escape') setOpen(false)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          className={clsx(
            'h-12 w-full rounded-paper border bg-paper pl-10 pr-10 text-base outline-none transition placeholder:text-ink-muted/70 focus:border-accent',
            invalid ? 'border-debunked' : 'border-rule',
          )}
        />
        {busy && <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" aria-hidden="true" />}
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-paper border border-rule bg-paper-2 shadow-[var(--shadow-paper)]"
        >
          {results.map((r, i) => (
            <li
              key={`${r.lat},${r.lng},${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(r)
              }}
              className={clsx('flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm', i === active ? 'bg-paper-3' : 'hover:bg-paper-3')}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span>{r.label}</span>
            </li>
          ))}
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-3 text-sm text-ink-muted">
              {unavailable ? 'Place search is unavailable. Drop a pin on the map instead.' : 'No places found. Try a nearby town, or drop a pin on the map.'}
            </li>
          )}
        </ul>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {open ? `${results.length} places found` : ''}
      </p>
    </div>
  )
}
