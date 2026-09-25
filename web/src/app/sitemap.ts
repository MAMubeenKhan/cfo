import type {MetadataRoute} from 'next'
import {sanityFetch} from '@/sanity/client'
import {SITEMAP_QUERY} from '@/sanity/queries'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cases = await sanityFetch<{caseNumber: string; updated: string}[]>(SITEMAP_QUERY).catch(() => [])
  return [
    {url: site, changeFrequency: 'hourly', priority: 1},
    {url: `${site}/cases`, changeFrequency: 'hourly', priority: 0.9},
    {url: `${site}/report`, priority: 0.8},
    {url: `${site}/desk`, priority: 0.6},
    {url: `${site}/about`, priority: 0.5},
    ...cases.map((c) => ({url: `${site}/cases/${c.caseNumber}`, lastModified: c.updated, priority: 0.7})),
  ]
}
