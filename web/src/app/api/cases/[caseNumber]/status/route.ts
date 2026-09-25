import {NextResponse, type NextRequest} from 'next/server'
import {sanityFetch} from '@/sanity/client'
import {STATUS_QUERY} from '@/sanity/queries'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: {params: Promise<{caseNumber: string}>}) {
  const {caseNumber} = await ctx.params
  if (!/^CFO-\d{4}-\d{4}$/.test(caseNumber)) return NextResponse.json({error: 'bad case number'}, {status: 400})
  try {
    const data = await sanityFetch<Record<string, unknown> | null>(STATUS_QUERY, {caseNumber})
    // Hidden or missing cases look identical from outside.
    if (!data) return NextResponse.json({error: 'not found'}, {status: 404, headers: {'Cache-Control': 'no-store'}})
    return NextResponse.json(data, {headers: {'Cache-Control': 'no-store'}})
  } catch {
    return NextResponse.json({error: 'unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}})
  }
}
