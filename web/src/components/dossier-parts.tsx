import Link from 'next/link'
import {Bot, Eye, Radio, Users, type LucideIcon} from 'lucide-react'
import clsx from 'clsx'
import {StatusPill} from './status-pill'
import {formatDateTime} from '@/lib/format'
import type {CaseCard, Dossier, LogEntry} from '@/sanity/queries'

// ------------------------------------------------------------------ redaction

/** A black bar that reveals on hover or keyboard focus. Screen readers get the text, marked as redacted. */
export function Redacted({children}: {children: React.ReactNode}) {
  return (
    <span className="redaction" tabIndex={0} title="Redacted. Hover or focus to reveal.">
      <span className="sr-only">Redacted: </span>
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------- flags

const FLAG_LABEL: Record<string, {label: string; tone: 'good' | 'warn' | 'note'}> = {
  'strong-detail': {label: 'Strong detail', tone: 'good'},
  'multiple-witnesses': {label: 'Corroborated', tone: 'good'},
  'low-detail': {label: 'Low detail', tone: 'warn'},
  'possible-misidentification': {label: 'Possible misidentification', tone: 'warn'},
  'known-hoax-pattern': {label: 'Known hoax pattern', tone: 'warn'},
  'weather-explains': {label: 'Weather may explain', tone: 'warn'},
  'animal-explains': {label: 'Animal may explain', tone: 'warn'},
  'aircraft-explains': {label: 'Aircraft may explain', tone: 'warn'},
  'celestial-explains': {label: 'Celestial object may explain', tone: 'warn'},
  'satellite-explains': {label: 'Satellite may explain', tone: 'warn'},
  'faith-sensitive': {label: 'Recorded as given. No position taken on faith.', tone: 'note'},
  'wellbeing-concern': {label: 'Wellbeing noted', tone: 'note'},
  'coercion-concern': {label: 'Wellbeing noted', tone: 'note'},
  'possible-emergency': {label: 'Urgent: human review', tone: 'note'},
  'inappropriate-content': {label: 'Held for moderation', tone: 'note'},
}

export function Memo({d}: {d: Dossier}) {
  const t = d.triage
  if (!t || (!t.memo && typeof t.plausibility !== 'number')) {
    return (
      <div className="paper-card p-6 text-sm text-ink-muted">
        <p className="mono-label">Memorandum</p>
        <p className="mt-2">The Field Investigator has not yet reviewed this file.</p>
      </div>
    )
  }
  const flags = (t.flags ?? []).map((f) => FLAG_LABEL[f]).filter(Boolean)
  return (
    <article className="paper-card relative overflow-hidden p-6 sm:p-8" aria-labelledby="memo-h">
      <div aria-hidden="true" className="pointer-events-none absolute right-5 top-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.3em] text-ink-muted">Bureau copy</div>
      <h2 id="memo-h" className="font-mono text-xs font-bold uppercase tracking-[0.2em]">Memorandum</h2>
      <dl className="mt-4 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 border-b border-dashed border-rule pb-4 font-mono text-xs">
        <dt className="text-ink-muted">TO</dt><dd>The Director</dd>
        <dt className="text-ink-muted">FROM</dt><dd>Field Investigator</dd>
        <dt className="text-ink-muted">RE</dt><dd>{d.caseNumber}</dd>
      </dl>
      {typeof t.plausibility === 'number' && (
        <div className="mt-5 flex items-center gap-4">
          <span className="mono-label">Plausibility</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-3" role="img" aria-label={`Plausibility ${t.plausibility} out of 100`}>
            <div className="h-full rounded-full bg-ink" style={{width: `${t.plausibility}%`}} />
          </div>
          <span className="font-mono text-sm font-bold tabular-nums">{t.plausibility}/100</span>
        </div>
      )}
      {t.memo && <p className="mt-5 font-serif text-[1.05rem] leading-relaxed">{t.memo}</p>}
      {t.subject && (
        <p className="mt-4 text-sm text-ink-muted">
          Closest match on file: <span className="font-mono font-semibold text-ink">{t.subject.codename}</span> · {t.subject.name}
        </p>
      )}
      {flags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Investigator flags">
          {flags.map((f, i) => (
            <li
              key={i}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium',
                f.tone === 'good' && 'border-classified/40 text-classified',
                f.tone === 'warn' && 'border-investigation/40 text-investigation',
                f.tone === 'note' && 'border-review/40 text-review',
              )}
            >
              {f.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

// ------------------------------------------------------------------- timeline

const ACTOR: Record<string, {icon: LucideIcon; label: string}> = {
  agent: {icon: Bot, label: 'Agent'},
  human: {icon: Users, label: 'Staff'},
  visitor: {icon: Eye, label: 'Visitor Director'},
  system: {icon: Radio, label: 'Bureau'},
}

export function Timeline({log}: {log: LogEntry[]}) {
  if (!log?.length) return null
  return (
    <ol className="relative space-y-6 border-l border-dashed border-rule pl-7" aria-label="Case timeline">
      {log.map((e) => {
        const a = ACTOR[e.actor] ?? ACTOR.system
        const Icon = a.icon
        return (
          <li key={e._key} className="relative">
            <span className="absolute -left-[2.4rem] grid h-7 w-7 place-items-center rounded-full border border-rule bg-paper-2 text-ink-muted">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-muted">
              {a.label} · {formatDateTime(e.at)}
            </p>
            <p className={clsx('mt-1 text-[0.95rem] leading-snug', e.kind === 'filed' && 'font-semibold')}>{e.message}</p>
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------- red strings

export function StringGraph({center, links}: {center: string; links: {other: CaseCard; status: 'proposed' | 'confirmed'}[]}) {
  const n = links.length
  if (n === 0) return null
  const W = 560
  const H = n <= 2 ? 200 : 300
  const cx = W / 2
  const cy = H / 2
  // One or two links sit left and right of the case; more fan out around it.
  const start = n <= 2 ? (n === 1 ? 0 : 0) : -Math.PI / 2
  const rx = 205
  const ry = n <= 2 ? 36 : 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Web of ${n} related ${n === 1 ? 'file' : 'files'} connected to ${center} by red string`}>
      {links.map((l, i) => {
        const ang = start + (i / n) * Math.PI * 2
        const x = cx + Math.cos(ang) * rx
        const y = cy + Math.sin(ang) * ry + (n <= 2 ? (i === 0 ? -14 : 14) : 0)
        const mx = (cx + x) / 2
        const my = (cy + y) / 2 + 16
        return (
          <g key={l.other._id}>
            <path d={`M ${cx} ${cy} Q ${mx} ${my} ${x} ${y}`} fill="none" stroke="var(--debunked)" strokeWidth={l.status === 'confirmed' ? 2.6 : 2} strokeDasharray={l.status === 'confirmed' ? undefined : '6 6'} strokeLinecap="round" />
            <circle cx={x} cy={y} r="11" fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="1.8" />
            <circle cx={x} cy={y} r="3.2" fill="var(--debunked)" />
            <text x={x} y={y + 30} textAnchor="middle" className="fill-[var(--ink)]" style={{font: '600 13px var(--font-mono)'}}>
              {l.other.caseNumber}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="17" fill="var(--paper)" stroke="var(--debunked)" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="5" fill="var(--debunked)" />
      <text x={cx} y={cy - 28} textAnchor="middle" className="fill-[var(--ink)]" style={{font: '700 14px var(--font-mono)'}}>
        {center}
      </text>
    </svg>
  )
}

export function RelatedFiles({d}: {d: Dossier}) {
  const links = d.connections.filter((c) => c.other?.caseNumber)
  if (links.length === 0) {
    return <p className="paper-card p-5 text-sm text-ink-muted">No related files have been linked to this case yet.</p>
  }
  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div className="paper-card p-3 sm:p-5">
        <StringGraph center={d.caseNumber} links={links.map((l) => ({other: l.other, status: l.status}))} />
        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-0.5 w-6 bg-debunked" /> Confirmed</span>
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="w-6 border-t-2 border-dashed border-debunked" /> Proposed by the Cross-Referencer</span>
        </p>
      </div>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l._id} className="paper-card relative p-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/cases/${l.other.caseNumber}`} className="font-mono text-xs font-semibold after:absolute after:inset-0 after:content-[''] hover:underline">
                {l.other.caseNumber}
              </Link>
              <StatusPill status={l.other.status} />
            </div>
            <p className="mt-1 font-serif font-semibold leading-snug">{l.other.title}</p>
            <p className="mt-1.5 text-sm text-ink-muted">
              {l.reason} <span className="font-mono text-xs">({Math.round(l.confidence * 100)}%, {l.status})</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// -------------------------------------------------------------------- witness

export function WitnessCard({w}: {w: NonNullable<Dossier['witness']>}) {
  const closed = (w.closedCounts?.classified ?? 0) + (w.closedCounts?.debunked ?? 0) + (w.closedCounts?.inconclusive ?? 0)
  const cred = w.credibility ?? 50
  return (
    <aside className="paper-card p-5" aria-label="Witness record">
      <p className="mono-label">Witness</p>
      <p className="mt-1 font-mono text-lg font-bold">{w.codename}</p>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Credibility</span>
          <span className="font-mono text-sm font-bold tabular-nums">{cred}/100</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-3" role="img" aria-label={`Credibility ${cred} out of 100`}>
          <div className="h-full rounded-full bg-classified" style={{width: `${cred}%`}} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        {w.reportsCount ?? 1} {(w.reportsCount ?? 1) === 1 ? 'report' : 'reports'} filed, {closed} closed
        {closed > 0 && ` (${w.closedCounts?.classified ?? 0} classified, ${w.closedCounts?.debunked ?? 0} debunked, ${w.closedCounts?.inconclusive ?? 0} inconclusive)`}. New witnesses start at 50 and move with their record. No name, email or address is ever stored.
      </p>
    </aside>
  )
}
