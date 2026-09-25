import clsx from 'clsx'
import {STATUS_LABEL, STATUS_TEXT, isStatus} from '@/lib/status'

/** Small status label: a dot plus text, so meaning never depends on colour alone. */
export function StatusPill({status, className}: {status: string; className?: string}) {
  const s = isStatus(status) ? status : 'intake'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-current/30 bg-paper px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em]',
        STATUS_TEXT[s],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[s]}
    </span>
  )
}
