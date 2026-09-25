import {NextResponse} from 'next/server'
import {sanityFetch} from '@/sanity/client'
import {PULSE_QUERY} from '@/sanity/queries'

export const dynamic = 'force-dynamic'

/** One short string that changes whenever any public case changes. Polled by <LiveRefresh />. */
export async function GET() {
  try {
    const p = await sanityFetch<{latest: string | null; count: number}>(PULSE_QUERY)
    return NextResponse.json({rev: `${p.latest ?? 'none'}:${p.count}`}, {headers: {'Cache-Control': 'no-store'}})
  } catch {
    return NextResponse.json({error: 'unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}})
  }
}
