import 'server-only'
import {createHash} from 'node:crypto'
import {headers} from 'next/headers'
import {writeClient} from './clients'

/**
 * Durable, global rate limiting.
 *
 * The first version kept counts in each server's memory. A live test proved it useless on serverless
 * hosting: eight reports from one connection all went through, because each request can land on a
 * different instance. Counts now live in Sanity, in fixed one-hour windows, as documents whose _id
 * contains a dot (`rl.<hash>.<window>`). Documents like that are PRIVATE in a public dataset: visitors
 * cannot read them, only the server's token can.
 *
 * Fixed windows are coarse (a burst across an hour boundary gets two allowances) but simple, atomic
 * (`inc` is a server-side increment) and cheap: two small writes per protected action.
 */
export async function hit(key: string, limit: number, windowSec = 3600): Promise<{ok: boolean; retryAfterSec: number}> {
  const windowIndex = Math.floor(Date.now() / (windowSec * 1000))
  const id = `rl.${key}.${windowIndex}`
  try {
    await writeClient.createIfNotExists({_id: id, _type: 'rateLimit', count: 0})
    const updated = await writeClient.patch(id).inc({count: 1}).commit<{count: number}>()
    if (updated.count > limit) {
      const retryAfterSec = Math.max(1, (windowIndex + 1) * windowSec - Math.floor(Date.now() / 1000))
      return {ok: false, retryAfterSec}
    }
    return {ok: true, retryAfterSec: 0}
  } catch (error) {
    // If the limiter itself is down, fail open: the daily AI budget still caps the cost.
    console.error('rate limiter unavailable', error)
    return {ok: true, retryAfterSec: 0}
  }
}

/** A salted hash of the caller's IP. The address itself is never stored or logged. */
export async function callerId(): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const salt = process.env.RATE_LIMIT_SALT ?? 'cfo-bureau-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)
}
