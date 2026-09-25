/* eslint-disable @next/next/no-img-element -- Sanity's CDN does the resizing; see sanity/image.ts */
import Link from 'next/link'
import clsx from 'clsx'
import {Lock} from 'lucide-react'
import {CategoryBadge, CategoryGlyph} from './category-glyph'
import {StatusPill} from './status-pill'
import {formatShortDate} from '@/lib/format'
import type {CaseCard as Card} from '@/sanity/queries'

/** Resizes a Sanity CDN image via URL parameters. */
export function sizedUrl(url: string, w: number, h?: number): string {
  const u = new URL(url)
  u.searchParams.set('w', String(w))
  if (h) {
    u.searchParams.set('h', String(h))
    u.searchParams.set('fit', 'crop')
  }
  u.searchParams.set('auto', 'format')
  u.searchParams.set('q', '72')
  return u.toString()
}

export function CaseThumb({thumb, category, className, priority = false}: {thumb?: Card['thumb']; category: string; className?: string; priority?: boolean}) {
  if (!thumb?.url) {
    return (
      <div className={clsx('grid place-items-center bg-paper-3 text-ink-muted', className)} aria-hidden="true">
        <CategoryGlyph category={category} className="h-9 w-9 opacity-60" />
      </div>
    )
  }
  return (
    <img
      src={sizedUrl(thumb.url, 640, 400)}
      srcSet={`${sizedUrl(thumb.url, 400, 250)} 400w, ${sizedUrl(thumb.url, 640, 400)} 640w, ${sizedUrl(thumb.url, 960, 600)} 960w`}
      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
      alt={thumb.alt ?? ''}
      width={640}
      height={400}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={clsx('object-cover', className)}
      style={thumb.lqip ? {backgroundImage: `url(${thumb.lqip})`, backgroundSize: 'cover'} : undefined}
    />
  )
}

export function CaseCard({c, className, priority = false}: {c: Card; className?: string; priority?: boolean}) {
  return (
    <article
      className={clsx(
        'paper-card group relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgb(0_0_0/0.05),0_16px_32px_-16px_rgb(60_45_20/0.4)]',
        className,
      )}
    >
      <div className="relative aspect-[8/5] overflow-hidden border-b border-rule">
        <CaseThumb thumb={c.thumb} category={c.category} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        {c.region?.restricted && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[3px] bg-ink px-2 py-1 font-mono text-[0.64rem] font-bold uppercase tracking-[0.12em] text-paper">
            <Lock className="h-3 w-3" aria-hidden="true" /> Restricted
          </span>
        )}
        {priority && <span className="sr-only">Featured</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold tracking-[0.06em] text-ink-muted">{c.caseNumber}</span>
          <StatusPill status={c.status} />
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link href={`/cases/${c.caseNumber}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--accent)]">
            {c.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{c.summary ?? c.place}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-ink-muted">
          <CategoryBadge category={c.category} />
          <span>{c.region?.name?.split(',')[0] ?? c.place} · {formatShortDate(c.observedAt)}</span>
        </div>
      </div>
    </article>
  )
}
