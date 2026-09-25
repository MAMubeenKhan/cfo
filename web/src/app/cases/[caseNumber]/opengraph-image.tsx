import {ImageResponse} from 'next/og'
import {sanityFetch} from '@/sanity/client'

export const alt = 'A Cryptid Field Office case file'
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const COLOR: Record<string, string> = {
  intake: '#5b574f', review: '#1d4e89', investigation: '#8a5a00', filing: '#8a5a00',
  classified: '#1f6f43', debunked: '#b42318', inconclusive: '#4a5563',
}
const LABEL: Record<string, string> = {
  intake: 'RECEIVED', review: 'IN REVIEW', investigation: 'OPEN', filing: 'FILING',
  classified: 'CLASSIFIED', debunked: 'DEBUNKED', inconclusive: 'INCONCLUSIVE',
}

export default async function CaseImage({params}: {params: Promise<{caseNumber: string}>}) {
  const {caseNumber} = await params
  const c = /^CFO-\d{4}-\d{4}$/.test(caseNumber)
    ? await sanityFetch<{title: string; status: string; summary?: string; place?: string} | null>(
        `*[_type == "case" && !hidden && caseNumber == $caseNumber][0]{title, status, "summary": triage.summary, "place": sighting.location.placeName}`,
        {caseNumber},
      ).catch(() => null)
    : null
  const status = c?.status ?? 'intake'
  const color = COLOR[status] ?? '#1c1b19'
  return new ImageResponse(
    (
      <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f4eee1', color: '#1c1b19', padding: 72, fontFamily: 'Georgia, serif'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: 26, letterSpacing: 4, color: '#5b574f'}}>
          <span>CRYPTID FIELD OFFICE · CASE FILE</span>
          <span style={{fontWeight: 700, color: '#1c1b19'}}>{caseNumber}</span>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{fontSize: c && c.title.length > 60 ? 62 : 78, lineHeight: 1.06, fontWeight: 700}}>{c?.title ?? 'This file has been redacted.'}</span>
          {c?.place && <span style={{marginTop: 22, fontSize: 30, color: '#5b574f', fontFamily: 'monospace'}}>{c.place}</span>}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <span style={{maxWidth: 700, fontSize: 28, color: '#5b574f'}}>{c?.summary?.slice(0, 120) ?? ''}</span>
          <span style={{border: `6px solid ${color}`, color, padding: '12px 28px', fontFamily: 'monospace', fontSize: 40, fontWeight: 700, letterSpacing: 8, transform: 'rotate(-5deg)'}}>{LABEL[status] ?? 'FILED'}</span>
        </div>
      </div>
    ),
    size,
  )
}
