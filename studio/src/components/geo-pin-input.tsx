import {useCallback, useEffect, useRef, useState} from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {set, unset, type ObjectInputProps} from 'sanity'

type Geopoint = {_type: 'geopoint'; lat: number; lng: number}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_CENTER: [number, number] = [-98.5, 39.5]

function inRange(n: number, min: number, max: number) {
  return Number.isFinite(n) && n >= min && n <= max
}

/**
 * Replaces Sanity's default geopoint input (which needs a Google Maps key) with an
 * OpenFreeMap / MapLibre map: click or drag the pin, or type coordinates.
 */
export function GeoPinInput(props: ObjectInputProps) {
  const {value, onChange, readOnly} = props
  const geo = value as Partial<Geopoint> | undefined
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const readOnlyRef = useRef(Boolean(readOnly))
  onChangeRef.current = onChange
  readOnlyRef.current = Boolean(readOnly)

  const [latText, setLatText] = useState('')
  const [lngText, setLngText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const commit = useCallback((lat: number, lng: number) => {
    onChangeRef.current(set({_type: 'geopoint', lat: +lat.toFixed(6), lng: +lng.toFixed(6)}))
  }, [])

  // Create the map once.
  useEffect(() => {
    if (!container.current) return
    const hasPoint = typeof geo?.lat === 'number' && typeof geo?.lng === 'number'
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: hasPoint ? [geo!.lng as number, geo!.lat as number] : DEFAULT_CENTER,
      zoom: hasPoint ? 9 : 3,
      attributionControl: {compact: true},
    })
    map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'top-right')
    map.on('click', (e) => {
      if (readOnlyRef.current) return
      commit(e.lngLat.lat, e.lngLat.lng)
    })
    mapRef.current = map
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the marker and the text boxes in step with the value.
  useEffect(() => {
    const map = mapRef.current
    const hasPoint = typeof geo?.lat === 'number' && typeof geo?.lng === 'number'
    setLatText(hasPoint ? String(geo!.lat) : '')
    setLngText(hasPoint ? String(geo!.lng) : '')
    if (!map) return
    if (!hasPoint) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    const lngLat: [number, number] = [geo!.lng as number, geo!.lat as number]
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({color: '#B42318', draggable: !readOnlyRef.current})
        .setLngLat(lngLat)
        .addTo(map)
      marker.on('dragend', () => {
        const p = marker.getLngLat()
        commit(p.lat, p.lng)
      })
      markerRef.current = marker
    } else {
      markerRef.current.setLngLat(lngLat)
    }
    map.easeTo({center: lngLat, duration: 250})
  }, [geo?.lat, geo?.lng, commit])

  const applyText = () => {
    if (latText.trim() === '' && lngText.trim() === '') {
      setError(null)
      onChangeRef.current(unset())
      return
    }
    const lat = Number(latText)
    const lng = Number(lngText)
    if (!inRange(lat, -90, 90)) return setError('Latitude must be between -90 and 90')
    if (!inRange(lng, -180, 180)) return setError('Longitude must be between -180 and 180')
    setError(null)
    commit(lat, lng)
  }

  return (
    <Stack gap={3}>
      <Card border style={{borderRadius: 4, overflow: 'hidden'}}>
        <div
          ref={container}
          role="application"
          aria-label="Map. Click to place the sighting pin, or drag the pin."
          style={{height: 280, width: '100%'}}
        />
      </Card>
      <Flex gap={3}>
        <div style={{flex: 1}}>
          <Stack gap={2}>
            <Text size={1} muted>
              Latitude
            </Text>
            <TextInput
              value={latText}
              readOnly={readOnly}
              inputMode="decimal"
              onChange={(e) => setLatText(e.currentTarget.value)}
              onBlur={applyText}
              onKeyDown={(e) => e.key === 'Enter' && applyText()}
            />
          </Stack>
        </div>
        <div style={{flex: 1}}>
          <Stack gap={2}>
            <Text size={1} muted>
              Longitude
            </Text>
            <TextInput
              value={lngText}
              readOnly={readOnly}
              inputMode="decimal"
              onChange={(e) => setLngText(e.currentTarget.value)}
              onBlur={applyText}
              onKeyDown={(e) => e.key === 'Enter' && applyText()}
            />
          </Stack>
        </div>
      </Flex>
      {error && (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color, #B42318)'}} role="alert">
          {error}
        </Text>
      )}
    </Stack>
  )
}
