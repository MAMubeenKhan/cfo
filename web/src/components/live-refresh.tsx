'use client'

import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'

/**
 * Keeps a server-rendered page live: polls a tiny "pulse" endpoint and refreshes the page's
 * data the moment any case changes. Pauses while the tab is hidden. Renders a small live dot.
 */
export function LiveRefresh({intervalMs = 7000, showDot = true}: {intervalMs?: number; showDot?: boolean}) {
  const router = useRouter()
  const last = useRef<string | null>(null)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let stopped = false
    async function tick() {
      if (stopped || document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/pulse', {cache: 'no-store'})
        if (!res.ok) throw new Error(String(res.status))
        const {rev} = (await res.json()) as {rev: string}
        setOnline(true)
        if (last.current !== null && last.current !== rev) router.refresh()
        last.current = rev
      } catch {
        setOnline(false)
      }
    }
    void tick()
    const id = setInterval(tick, intervalMs)
    const onVisible = () => document.visibilityState === 'visible' && void tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs, router])

  if (!showDot) return null
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-muted" role="status">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${online ? 'pulse-soft bg-classified' : 'bg-rule'}`} />
      {online ? 'Live' : 'Reconnecting'}
    </span>
  )
}
