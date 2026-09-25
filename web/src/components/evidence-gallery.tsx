'use client'

/* eslint-disable @next/next/no-img-element -- Sanity CDN images, see components/case-card.tsx */
import {useRef, useState} from 'react'
import {Footprints, Mic, Quote, X} from 'lucide-react'
import {sizedUrl} from './case-card'
import type {Evidence} from '@/sanity/queries'

/** Photos open in a native <dialog> (focus trap and Escape for free); other evidence renders as index cards. */
export function EvidenceGallery({evidence}: {evidence: Evidence[]}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<{url: string; caption: string} | null>(null)
  const photos = evidence.filter((e): e is Extract<Evidence, {_type: 'photoEvidence'}> => e._type === 'photoEvidence' && !!e.asset?.url)
  const others = evidence.filter((e) => e._type !== 'photoEvidence')

  if (evidence.length === 0) {
    return <p className="paper-card p-5 text-sm text-ink-muted">No physical evidence was submitted with this report. The Bureau has filed it under “sincerity”.</p>
  }

  return (
    <div className="space-y-5">
      {photos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((p, i) => (
            <li key={p._key}>
              <figure>
                <button
                  type="button"
                  onClick={() => {
                    setOpen({url: p.asset!.url, caption: p.caption})
                    dialog.current?.showModal()
                  }}
                  className="group relative block w-full overflow-hidden rounded-paper border border-rule bg-paper-3"
                  aria-label={`Enlarge photo ${i + 1}: ${p.caption}`}
                >
                  <img
                    src={sizedUrl(p.asset!.url, 800)}
                    alt={p.caption}
                    width={p.asset!.metadata?.dimensions?.width ?? 960}
                    height={p.asset!.metadata?.dimensions?.height ?? 640}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    style={p.asset!.metadata?.lqip ? {backgroundImage: `url(${p.asset!.metadata.lqip})`, backgroundSize: 'cover'} : undefined}
                  />
                </button>
                <figcaption className="mt-2 flex gap-2 text-sm text-ink-muted">
                  <span className="mono-label shrink-0 pt-0.5">Exhibit {String.fromCharCode(65 + i)}</span>
                  <span>{p.caption}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {others.map((e) => (
            <li key={e._key} className="paper-card flex gap-3 p-4">
              {e._type === 'footprintEvidence' && (
                <>
                  <Footprints className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="mono-label">Footprint</p>
                    <p className="mt-1 font-serif text-lg font-semibold">{e.lengthCm} cm</p>
                  </div>
                </>
              )}
              {e._type === 'soundEvidence' && (
                <>
                  <Mic className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="mono-label">Sound{e.durationSeconds ? ` · ${e.durationSeconds}s` : ''}</p>
                    <p className="mt-1 text-sm">{e.description}</p>
                  </div>
                </>
              )}
              {e._type === 'testimonyEvidence' && (
                <>
                  <Quote className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <blockquote>
                    <p className="font-serif text-base italic leading-snug">“{e.quote}”</p>
                    {e.speaker && <footer className="mono-label mt-2">{e.speaker}</footer>}
                  </blockquote>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-label="Enlarged evidence photo"
        className="m-auto max-h-[92dvh] w-[min(96vw,64rem)] overflow-hidden rounded-sheet border border-rule bg-paper-2 p-0 text-ink backdrop:bg-black/70"
      >
        {open && (
          <div className="relative">
            <img src={sizedUrl(open.url, 1600)} alt={open.caption} className="max-h-[80dvh] w-full bg-black object-contain" />
            <p className="border-t border-rule px-5 py-3 text-sm">{open.caption}</p>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close photo"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-paper"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </div>
  )
}
