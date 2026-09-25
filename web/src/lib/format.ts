const dateFmt = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'})
const shortFmt = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})
const timeFmt = new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'})

export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : 'Date unknown')
export const formatShortDate = (iso?: string | null) => (iso ? shortFmt.format(new Date(iso)) : 'Unknown')
export const formatTime = (iso?: string | null) => (iso ? `${timeFmt.format(new Date(iso))} UTC` : '')
export const formatDateTime = (iso?: string | null) => (iso ? `${shortFmt.format(new Date(iso))}, ${formatTime(iso)}` : '')

/** "3 hours ago", "2 days ago". Server-render safe: pass `now` for stable output. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (s < 45) return 'just now'
  const units: [number, string][] = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [2592000, 'month'], [31536000, 'year']]
  let val = s / 60
  let unit = 'minute'
  for (const [secs, name] of units) {
    if (s >= secs) {
      val = s / secs
      unit = name
    }
  }
  const n = Math.floor(val)
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

export const pluralise = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

export function formatCoords(lat?: number, lng?: number): string {
  if (lat == null || lng == null) return ''
  return `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`
}
