import {ImageResponse} from 'next/og'

export const alt = 'Cryptid Field Office: every sighting, taken seriously'
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f4eee1', color: '#1c1b19', padding: 72, fontFamily: 'Georgia, serif', position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14.5" fill="none" stroke="#1c1b19" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="#1c1b19" strokeWidth="0.75" strokeDasharray="1.5 1.5" />
            <path d="M10.5 20.5c0-3.2 2.4-5.6 5.5-5.6s5.5 2.4 5.5 5.6M13 14.2c0-1.7 1.3-3 3-3s3 1.3 3 3" fill="none" stroke="#b42318" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="16" cy="22.2" r="1.1" fill="#b42318" />
          </svg>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: 34, fontWeight: 700}}>Cryptid Field Office</span>
            <span style={{fontSize: 20, letterSpacing: 4, textTransform: 'uppercase', color: '#5b574f', fontFamily: 'monospace'}}>Dept. of Unexplained Sightings</span>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{fontSize: 96, lineHeight: 1.02, fontWeight: 700}}>Every sighting,</span>
          <span style={{fontSize: 96, lineHeight: 1.02, fontWeight: 700}}>
            taken&nbsp;<span style={{color: '#b42318', fontStyle: 'italic'}}>seriously.</span>
          </span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'monospace', fontSize: 24, color: '#5b574f'}}>
          <span>File a report. An AI triages it. A person signs it off.</span>
          <span style={{border: '4px solid #b42318', color: '#b42318', padding: '10px 22px', fontWeight: 700, letterSpacing: 6, transform: 'rotate(-5deg)'}}>CLASSIFIED</span>
        </div>
      </div>
    ),
    size,
  )
}
