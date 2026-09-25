'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import {useEffect, useRef, useState} from 'react'
import * as maplibregl from 'maplibre-gl'
import Map, {Marker, NavigationControl, type MapRef} from 'react-map-gl/maplibre'
import {LocateFixed} from 'lucide-react'
import {MAP_STYLE} from './case-map'

export interface Pin {
  lat: number
  lng: number
}

/**
 * Click the map (or drag the pin, or use your location) to place a sighting.
 * The keyboard-accessible route is the place search above the map; the map is an enhancement, not a requirement.
 */
export default function PinPicker({
  pin,
  onPin,
  focusOn,
  onGeoError,
}: {
  pin: Pin | null
  onPin: (p: Pin) => void
  /** when set, the map flies here (a search result) */
  focusOn?: Pin | null
  onGeoError?: (message: string) => void
}) {
  const ref = useRef<MapRef>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (focusOn) ref.current?.flyTo({center: [focusOn.lng, focusOn.lat], zoom: 9, duration: 900})
  }, [focusOn])

  const locate = () => {
    if (!('geolocation' in navigator)) return onGeoError?.('Your browser cannot share a location. Search for a place or drop a pin instead.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const p = {lat: pos.coords.latitude, lng: pos.coords.longitude}
        onPin(p)
        ref.current?.flyTo({center: [p.lng, p.lat], zoom: 11, duration: 900})
      },
      (err) => {
        setLocating(false)
        onGeoError?.(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. Search for a place or drop a pin instead.'
            : 'Your location could not be found. Search for a place or drop a pin instead.',
        )
      },
      {enableHighAccuracy: false, timeout: 10_000},
    )
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-paper border border-rule sm:h-96 cfo-map" role="application" aria-label="Map. Click to drop a pin where the sighting happened.">
      <Map
        ref={ref}
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={{longitude: pin?.lng ?? -98, latitude: pin?.lat ?? 39, zoom: pin ? 9 : 3}}
        attributionControl={{compact: true}}
        onClick={(e) => onPin({lat: e.lngLat.lat, lng: e.lngLat.lng})}
        cursor="crosshair"
        style={{width: '100%', height: '100%'}}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {pin && (
          <Marker
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => onPin({lat: e.lngLat.lat, lng: e.lngLat.lng})}
          >
            <svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true" className="drop-shadow-md">
              <path d="M15 39C15 39 2 23.5 2 14.5a13 13 0 0 1 26 0C28 23.5 15 39 15 39Z" fill="var(--debunked)" stroke="white" strokeWidth="2" />
              <circle cx="15" cy="14.5" r="4.5" fill="white" />
            </svg>
          </Marker>
        )}
      </Map>
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="absolute bottom-3 left-3 inline-flex h-10 items-center gap-2 rounded-paper border border-rule bg-paper-2 px-3 text-sm font-medium shadow-[var(--shadow-paper)] hover:border-ink disabled:opacity-60"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        {locating ? 'Finding you…' : 'Use my location'}
      </button>
    </div>
  )
}
