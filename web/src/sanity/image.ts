/**
 * Sanity images are transformed by the Sanity CDN through URL parameters, so next/image
 * uses this loader and Vercel's image optimiser is not involved.
 */
export function sanityImageLoader({src, width, quality}: {src: string; width: number; quality?: number}): string {
  const u = new URL(src)
  u.searchParams.set('w', String(width))
  u.searchParams.set('q', String(quality ?? 75))
  u.searchParams.set('auto', 'format')
  u.searchParams.set('fit', 'max')
  return u.toString()
}

export interface SanityAsset {
  url: string
  metadata?: {lqip?: string; dimensions?: {width: number; height: number}}
}
