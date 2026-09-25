import {NextResponse, type NextRequest} from 'next/server'

/** Turns a dropped pin into a readable place name. Failure is fine: the pin still works. */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lng = Number(req.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({label: null}, {status: 400})
  }
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`, {
      headers: {'User-Agent': 'CryptidFieldOffice/1.0 (place search for a sighting report form)'},
      signal: AbortSignal.timeout(5000),
      next: {revalidate: 86400},
    })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as {features?: {properties: Record<string, string>}[]}
    const p = json.features?.[0]?.properties
    const label = p ? [p.name, p.city && p.city !== p.name ? p.city : null, p.state, p.country].filter(Boolean).join(', ') : null
    return NextResponse.json({label})
  } catch {
    return NextResponse.json({label: null})
  }
}
