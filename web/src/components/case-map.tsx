'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import {useEffect, useMemo, useRef} from 'react'
import * as maplibregl from 'maplibre-gl'
import Map, {Marker, NavigationControl, Popup, type MapRef} from 'react-map-gl/maplibre'
import clsx from 'clsx'
import {CategoryGlyph} from './category-glyph'
import {StatusPill} from './status-pill'
import {STATUS_HEX_VAR, isStatus} from '@/lib/status'
import type {CaseCard} from '@/sanity/queries'

// MapLibre 6 ships its worker as separate files that Next's bundler cannot find; serve them from /public.
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

type Point = Pick<CaseCard, '_id' | 'caseNumber' | 'title' | 'category' | 'status' | 'lat' | 'lng'>

/**
 * Case locations on an OpenFreeMap / MapLibre map. Markers are real buttons (keyboard and screen-reader
 * reachable); the list next to the map is the full accessible alternative.
 */
export default function CaseMap({
  cases,
  selectedId,
  onSelect,
  interactive = true,
  className,
  zoom,
  label = 'Map of case locations',
}: {
  cases: Point[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  interactive?: boolean
  className?: string
  zoom?: number
  label?: string
}) {
  const ref = useRef<MapRef>(null)
  const points = useMemo(() => cases.filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number'), [cases])
  const selected = points.find((c) => c._id === selectedId)
  const initialView = useMemo(() => {
    if (points.length === 0) return {longitude: -98, latitude: 39, zoom: 3}
    if (points.length === 1) return {longitude: points[0].lng!, latitude: points[0].lat!, zoom: zoom ?? 7}
    const lngs = points.map((p) => p.lng!)
    const lats = points.map((p) => p.lat!)
    return {bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]] as [[number, number], [number, number]], fitBoundsOptions: {padding: 56, maxZoom: 5.5}}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fit = () => {
    const map = ref.current
    if (!map || points.length === 0) return
    if (points.length === 1) {
      map.easeTo({center: [points[0].lng!, points[0].lat!], zoom: zoom ?? 7, duration: 0})
      return
    }
    const lngs = points.map((p) => p.lng!)
    const lats = points.map((p) => p.lat!)
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {padding: 56, maxZoom: 5.5, duration: 0})
  }

  // Re-fit when the set of visible points changes (filters).
  const key = points.map((p) => p._id).join('|')
  useEffect(fit, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) ref.current?.easeTo({center: [selected.lng!, selected.lat!], duration: 500})
  }, [selected])

  return (
    <div className={clsx('cfo-map relative overflow-hidden', className)} role="region" aria-label={label}>
      <Map
        ref={ref}
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={initialView}
        interactive={interactive}
        attributionControl={{compact: true}}
        onLoad={fit}
        onClick={() => onSelect?.(null)}
        reuseMaps
        style={{width: '100%', height: '100%'}}
      >
        {interactive && <NavigationControl position="top-right" showCompass={false} />}
        {points.map((c) => {
          const active = c._id === selectedId
          return (
            <Marker key={c._id} longitude={c.lng!} latitude={c.lat!} anchor="center">
              <button
                type="button"
                aria-label={`${c.caseNumber}: ${c.title}`}
                aria-pressed={active}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(active ? null : c._id)
                }}
                className={clsx(
                  'grid place-items-center rounded-full border-2 bg-paper text-ink shadow-md transition-transform hover:scale-110 focus-visible:scale-110',
                  active ? 'h-10 w-10 scale-110' : 'h-8 w-8',
                )}
                style={{borderColor: isStatus(c.status) ? STATUS_HEX_VAR[c.status] : 'var(--ink)', color: isStatus(c.status) ? STATUS_HEX_VAR[c.status] : 'var(--ink)'}}
              >
                <CategoryGlyph category={c.category} className={active ? 'h-[1.15rem] w-[1.15rem]' : 'h-4 w-4'} />
              </button>
            </Marker>
          )
        })}
        {selected && (
          <Popup longitude={selected.lng!} latitude={selected.lat!} anchor="bottom" offset={22} closeButton={false} closeOnClick={false} maxWidth="260px">
            <p className="font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-ink-muted">{selected.caseNumber}</p>
            <p className="mt-0.5 font-serif text-[0.95rem] font-semibold leading-snug">{selected.title}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <StatusPill status={selected.status} />
              <Link href={`/cases/${selected.caseNumber}`} className="text-xs font-semibold underline underline-offset-2">
                Open file
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
