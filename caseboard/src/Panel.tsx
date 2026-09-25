import {Suspense} from 'react'
import {CATEGORY_LABEL, PUBLIC_SITE, STATUS_LABEL, STUDIO_URL, type BoardCase, type BoardConnection} from './data'
import {WorkflowPanel} from './WorkflowPanel'

const time = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'})

export function Panel({
  c,
  cases,
  connections,
  selectedStringId,
  onSelectString,
  onDecide,
  onSelectCase,
}: {
  c: BoardCase | null
  cases: BoardCase[]
  connections: BoardConnection[]
  selectedStringId: string | null
  onSelectString: (id: string | null) => void
  onDecide: (id: string, status: 'confirmed' | 'rejected') => void
  onSelectCase: (id: string) => void
}) {
  if (!c) {
    return (
      <aside className="panel" aria-label="Case details">
        <div className="empty">
          <p style={{fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink)', margin: '0 0 8px'}}>Select a case.</p>
          <p>Click a card on the board, or choose one from the list, to read its file and move it through the workflow.</p>
          <p>Drag a card’s red pin onto another card to draw a string between them.</p>
        </div>
      </aside>
    )
  }

  const byId = new Map(cases.map((x) => [x._id, x]))
  const mine = connections.filter((k) => k.from === c._id || k.to === c._id)
  const faith = Boolean(c.flags?.includes('faith-sensitive')) || c.category === 'spirit'

  return (
    <aside className="panel" aria-label="Case details">
      <div className="row">
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em'}}>{c.caseNumber}</span>
        <span className={`pill st-${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
      </div>
      <h2>{c.title}</h2>
      <p style={{margin: '6px 0 0', fontSize: 13, color: 'var(--ink-muted)'}}>
        {CATEGORY_LABEL[c.category] ?? c.category}
        {c.place ? ` · ${c.place}` : ''}
        {c.restricted ? ' · Restricted site' : ''}
      </p>
      <p style={{margin: '8px 0 0'}}>
        <a className="cb-link" href={`${STUDIO_URL}/structure/case;${c._id}`} target="_blank" rel="noreferrer">Open in Studio</a>
        {' · '}
        <a className="cb-link" href={`${PUBLIC_SITE}/cases/${c.caseNumber}`} target="_blank" rel="noreferrer">Public file</a>
      </p>

      {faith && (
        <p className="box" style={{marginTop: 14, fontSize: 13}}>
          Faith-sensitive. The Bureau records this account as given and takes no position on matters of faith.
        </p>
      )}

      <h3>Field Investigator</h3>
      {typeof c.plausibility === 'number' ? (
        <div className="box">
          <div className="row" style={{marginBottom: 6}}>
            <span style={{fontSize: 12.5, color: 'var(--ink-muted)'}}>Plausibility</span>
            <strong style={{fontFamily: 'var(--font-mono)', fontSize: 13}}>{c.plausibility}/100</strong>
          </div>
          <div className="bar"><i style={{width: `${c.plausibility}%`}} /></div>
          {c.memo && <p className="memo" style={{margin: '12px 0 0'}}>{c.memo}</p>}
        </div>
      ) : (
        <p className="empty" style={{padding: '8px 0', textAlign: 'left'}}>Not yet reviewed.</p>
      )}

      <h3>Workflow</h3>
      {c.instance ? (
        <Suspense fallback={<p className="empty" role="status">Loading the workflow…</p>}>
          <WorkflowPanel key={c.instance} instanceId={c.instance} faithSensitive={faith} />
        </Suspense>
      ) : (
        <p className="empty" style={{textAlign: 'left'}}>No workflow instance yet. Run <code>npm run wf:recover</code> to start it.</p>
      )}

      <h3>Red strings ({mine.length})</h3>
      {mine.length === 0 && <p className="empty" style={{padding: '4px 0', textAlign: 'left'}}>No strings yet. Drag this card’s pin onto another card.</p>}
      {mine.map((k) => {
        const other = byId.get(k.from === c._id ? k.to : k.from)
        return (
          <div key={k._id} className={`string-row${k._id === selectedStringId ? ' sel' : ''}`}>
            <div className="row">
              <button type="button" className="cb-link" style={{background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left'}} onClick={() => other && onSelectCase(other._id)}>
                {other?.caseNumber ?? 'Unknown'} · {other?.title ?? ''}
              </button>
              <span className={`pill ${k.status === 'confirmed' ? 'st-classified' : 'st-investigation'}`}>{k.status}</span>
            </div>
            <p style={{margin: '6px 0 0', color: 'var(--ink-muted)'}}>{k.reason} <span style={{fontFamily: 'var(--font-mono)', fontSize: 11}}>({Math.round(k.confidence * 100)}%, by {k.proposedBy})</span></p>
            <div className="actions" style={{marginTop: 8}}>
              {k.status === 'proposed' && <button type="button" className="btn sm" onClick={() => onDecide(k._id, 'confirmed')}>Confirm</button>}
              <button type="button" className="btn sm ghost" onClick={() => onDecide(k._id, 'rejected')}>{k.status === 'proposed' ? 'Reject' : 'Remove'}</button>
              <button type="button" className="btn sm ghost" onClick={() => onSelectString(k._id === selectedStringId ? null : k._id)}>Highlight</button>
            </div>
          </div>
        )
      })}

      <h3>Case timeline</h3>
      <ol className="log">
        {(c.log ?? []).map((e) => (
          <li key={e._key}>
            <time>{e.actor} · {time.format(new Date(e.at))}</time>
            {e.message}
          </li>
        ))}
      </ol>
    </aside>
  )
}
