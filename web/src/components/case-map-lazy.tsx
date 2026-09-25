'use client'

import dynamic from 'next/dynamic'
import {useEffect, useRef, useState, type ComponentProps} from 'react'

/** The map (and MapLibre, ~200 KB) loads only where it is used, never in the home page bundle. */
export const CaseMapLazy = dynamic(() => import('./case-map'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-paper-3 text-ink-muted" role="status">
      <span className="font-mono text-xs uppercase tracking-[0.12em]">Loading map…</span>
    </div>
  ),
})

/**
 * Mounts the map only once its box is about to scroll into view. On a phone the map sits below the
 * fold, so the ~300 KB map library and its tiles never delay the first paint. A hidden box (display:none,
 * e.g. the map tab on mobile) never intersects, so it stays unloaded until the visitor opens it.
 */
export function DeferredMap(props: ComponentProps<typeof CaseMapLazy>) {
  const box = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return setShow(true)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      {rootMargin: '250px'},
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={box} className="h-full w-full">
      {show ? (
        <CaseMapLazy {...props} />
      ) : (
        <div className="grid h-full w-full place-items-center bg-paper-3 text-ink-muted" aria-hidden="true">
          <span className="font-mono text-xs uppercase tracking-[0.12em]">Map</span>
        </div>
      )}
    </div>
  )
}
