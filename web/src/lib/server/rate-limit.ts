import 'server-only'
import {createHash} from 'node:crypto'
import {headers} from 'next/headers'

/**
 * In-memory sliding-window limiter. Honest limitation: each serverless instance has its own memory,
 * so this bounds abuse per instance, not globally. It is a speed bump, not a wall; the daily AI budget
 * in Bureau settings is the hard cap on cost.
 */
const buckets = new Map<string, number[]>()
const MAX_KEYS = 5000

export function hit(key: string, limit: number, windowMs: number): {ok: boolean; retryAfterSec: number} {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    return {ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000))}
  }
  recent.push(now)
  buckets.set(key, recent)
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
      if (buckets.size <= MAX_KEYS * 0.8) break
    }
  }
  return {ok: true, retryAfterSec: 0}
}

/** A salted hash of the caller's IP. The address itself is never stored or logged. */
export async function callerId(): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const salt = process.env.RATE_LIMIT_SALT ?? 'cfo-bureau-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)
}
