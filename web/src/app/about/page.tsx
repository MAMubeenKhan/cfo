import type {Metadata} from 'next'
import Link from 'next/link'
import {Bot, Database, LayoutDashboard, Workflow} from 'lucide-react'
import {StageTrack} from '@/components/stage-track'

export const metadata: Metadata = {
  title: 'About the Bureau',
  description: 'What the Cryptid Field Office is, and how it was built: an AI-triaged report pipeline on Sanity Workflows, the App SDK and Sanity Functions.',
}

const PARTS = [
  {icon: Database, title: 'One content lake', body: 'Cases, subjects, regions, witnesses, red strings and settings live in one Sanity dataset. The public site, the Studio and the Case Board all read and write the same documents in real time.'},
  {icon: Workflow, title: 'A process as data', body: 'A case moves through five stages defined with Sanity Workflows. The AI agent and a person use exactly the same actions and transitions. Where a case goes after triage is decided by code, never by the model.'},
  {icon: Bot, title: 'Two agents, guarded', body: 'The Field Investigator scores a report; the Cross-Referencer links related files. Faith-related reports are never auto-closed, the model may not rule on belief, and a daily budget and kill switch cap the AI.'},
  {icon: LayoutDashboard, title: 'A custom app on the content', body: 'Staff use a Case Board built with the Sanity App SDK: a live corkboard where cases are pinned and red strings are drawn. It is not a read-only frontend.'},
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <p className="mono-label">About the Bureau</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">A serious system, in a slightly silly hat.</h1>
      <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed">
        <p>
          The Cryptid Field Office is a fictional bureau that takes every unexplained sighting seriously: cryptids, lights in the sky, figures on the stairs, spirits, and the occasional secret society. The humour lives in the bureaucracy. It is never aimed at anyone’s belief, and every society on file is invented.
        </p>
        <p>
          Underneath, it is a real report-triage pipeline: <strong>public intake, AI screening, linking related reports, a human decision, and an audit trail.</strong> Swap Bigfoot for potholes and this is a city 311 system. The same pattern runs bug trackers, insurance claims and fraud review.
        </p>
      </div>

      <section className="mt-14" aria-labelledby="flow-h">
        <h2 id="flow-h" className="text-2xl font-semibold">How a case moves</h2>
        <div className="paper-card mt-5 p-6 sm:p-8">
          <StageTrack status="intake" />
        </div>
      </section>

      <section className="mt-14" aria-labelledby="built-h">
        <h2 id="built-h" className="text-2xl font-semibold">How it was built</h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Built for the DEV × Sanity challenge (Path Two), prompted into existence with Claude Code. The build log, prompts and dead ends are in the write-up and the repository.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {PARTS.map((p) => (
            <li key={p.title} className="paper-card p-5">
              <p.icon className="h-5 w-5" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 rounded-sheet border border-rule bg-paper-2 p-6 sm:p-8" aria-labelledby="judges-h">
        <h2 id="judges-h" className="text-2xl font-semibold">For the judges</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>
            <Link className="font-semibold underline underline-offset-2" href="/report">File a report</Link> and watch the Field Investigator triage it live.
          </li>
          <li>
            Open the <Link className="font-semibold underline underline-offset-2" href="/desk">Director’s Desk</Link> and decide a case that needs a person. No login needed.
          </li>
          <li>
            Open the resulting <Link className="font-semibold underline underline-offset-2" href="/cases">case file</Link> to see the audit trail, red strings and witness record.
          </li>
        </ol>
        <p className="mt-4 text-sm text-ink-muted">
          Sanity project ID: <span className="font-mono text-ink">cyh4xyo1</span> · dataset <span className="font-mono text-ink">production</span> (public).
        </p>
      </section>
    </div>
  )
}
