import {NextResponse, type NextRequest} from 'next/server'

/** Place search for the report form. A thin proxy over Photon (OpenStreetMap data), cached for a day. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 3 || q.length > 100) return NextResponse.json({results: []})
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`, {
      headers: {'User-Agent': 'CryptidFieldOffice/1.0 (place search for a sighting report form)'},
      signal: AbortSignal.timeout(5000),
      next: {revalidate: 86400},
    })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as {features?: {geometry: {coordinates: [number, number]}; properties: Record<string, string>}[]}
    const results = (json.features ?? []).map((f) => {
      const p = f.properties
      const label = [p.name, p.city && p.city !== p.name ? p.city : null, p.state, p.country].filter(Boolean).join(', ')
      return {label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0]}
    })
    return NextResponse.json({results})
  } catch {
    return NextResponse.json({results: [], unavailable: true}, {status: 200})
  }
}
