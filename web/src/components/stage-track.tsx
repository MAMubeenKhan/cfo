import clsx from 'clsx'
import {Check} from 'lucide-react'
import {STAGES, isClosed, stageIndex} from '@/lib/status'

/**
 * Where a case is in its life: Received → Director's review → Investigation → Filed.
 * Horizontal on wide screens, vertical on phones. The current step is marked with aria-current.
 * `skipped` greys out stages a case did not pass through (e.g. auto-closed at triage).
 */
export function StageTrack({
  status,
  counts,
  compact = false,
  visited,
  className,
}: {
  status: string
  counts?: Partial<Record<(typeof STAGES)[number]['key'], number>>
  compact?: boolean
  /** stage keys the case actually passed through; others render as skipped */
  visited?: string[]
  className?: string
}) {
  const current = stageIndex(status)
  const closed = isClosed(status)
  return (
    <ol className={clsx('grid gap-3 sm:grid-cols-4 sm:gap-0', className)} aria-label="Case progress">
      {STAGES.map((stage, i) => {
        const done = i < current || (closed && i === 3)
        const isCurrent = i === current && !closed
        const skipped = visited ? !visited.includes(stage.key) && i < current : false
        return (
          <li
            key={stage.key}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex gap-3 sm:block sm:pr-3"
          >
            {/* connector line */}
            {i < STAGES.length - 1 && (
              <span
                aria-hidden="true"
                className={clsx(
                  'absolute left-[0.95rem] top-9 h-[calc(100%-1.5rem)] w-px sm:left-9 sm:top-[0.95rem] sm:h-px sm:w-[calc(100%-2.6rem)]',
                  i < current ? 'bg-ink' : 'border-l border-dashed border-rule sm:border-l-0 sm:border-t',
                )}
              />
            )}
            <span
              className={clsx(
                'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 font-mono text-xs font-bold',
                done && !skipped && 'border-ink bg-ink text-paper',
                skipped && 'border-rule bg-paper text-ink-muted',
                isCurrent && 'border-review bg-paper text-review shadow-[0_0_0_4px_color-mix(in_srgb,var(--review)_18%,transparent)]',
                !done && !isCurrent && !skipped && 'border-rule bg-paper text-ink-muted',
              )}
            >
              {done && !skipped ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className="min-w-0 sm:mt-2 sm:block">
              <span className={clsx('block text-sm font-semibold', isCurrent ? 'text-review' : done ? 'text-ink' : 'text-ink-muted')}>
                {stage.label}
                {counts?.[stage.key] != null && (
                  <span className="ml-2 font-mono text-xs font-normal text-ink-muted">{counts[stage.key]}</span>
                )}
                {isCurrent && <span className="sr-only"> (current stage)</span>}
                {skipped && <span className="sr-only"> (skipped)</span>}
              </span>
              {!compact && <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{stage.blurb}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
