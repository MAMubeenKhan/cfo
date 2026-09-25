import {createClient, type QueryParams} from '@sanity/client'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'cyh4xyo1'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

/**
 * Read client for the public dataset (no token needed). The Sanity API, not the CDN:
 * a case can change stage while someone is watching, and stale data would break the demo.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-09-01',
  useCdn: false,
  perspective: 'published',
})

/** Server-component fetch that is never cached by Next.js. */
export function sanityFetch<T>(query: string, params: QueryParams = {}): Promise<T> {
  return client.fetch<T>(query, params, {cache: 'no-store'})
}
