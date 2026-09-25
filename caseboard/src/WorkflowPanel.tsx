import {useState} from 'react'
import {useWorkflowEngine, useWorkflowSession} from '@sanity/workflow-sdk'
import {WorkflowDiagram} from '@sanity/workflow-diagram'
import {DATASET, PROJECT_ID, TAG} from './data'

/**
 * The workflow controls for one case. A person clicking a button here and the Field Investigator agent
 * calling the API move the same instance through the same actions and transitions.
 * Never edit the workflow instance document directly: that would bypass the engine and break the audit trail.
 */
export function WorkflowPanel({instanceId, faithSensitive}: {instanceId: string; faithSensitive: boolean}) {
  const engine = useWorkflowEngine({workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`}, tag: TAG})
  const session = useWorkflowSession({engine, instanceId})
  const [pick, setPick] = useState<{activity: string; action: string; title: string; needsNote: boolean} | null>(null)
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session.invalid) return <p className="err">This workflow instance cannot be read: {String((session.invalid as {reason?: string}).reason ?? 'unreadable')}</p>
  if (session.error) return <p className="err">Could not load the workflow: {String((session.error as {message?: string}).message ?? 'unknown error')}</p>
  if (session.evaluationError) return <p className="err">Could not evaluate the workflow: {String((session.evaluationError as {message?: string}).message ?? 'unknown error')}</p>
  if (!session.ready || !session.evaluation) return <p className="empty" role="status">Loading the workflow…</p>

  const ev = session.evaluation
  const stage = ev.currentStage
  const closed = Boolean(ev.instance.completedAt)

  const fire = async () => {
    if (!pick) return
    setBusy(true)
    setError(null)
    try {
      await session.fireAction({activity: pick.activity, action: pick.action, ...(pick.needsNote ? {params: {note: note.trim()}} : {})})
      setPick(null)
      setNote('')
      setConfirm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The action could not be fired. Someone may have moved the case already.')
    } finally {
      setBusy(false)
    }
  }

  const isDebunk = pick?.action === 'debunk'
  const noteOk = !pick?.needsNote || note.trim().length >= 10
  const faithGate = isDebunk && faithSensitive && !confirm

  return (
    <div>
      <div className="row">
        <span className="pill st-review">{stage.stage.title ?? stage.stage.name}</span>
        {closed && <span className="pill st-classified">Closed</span>}
      </div>
      {stage.stage.description && <p style={{margin: '8px 0 0', fontSize: 13, color: 'var(--ink-muted)'}}>{stage.stage.description}</p>}

      {closed ? (
        <p className="empty">This case is filed. There is nothing more to do.</p>
      ) : (
        stage.activities
          .filter((a) => a.status !== 'skipped')
          .map((a) => {
            const buttons = a.actions.filter((x) => !x.triggered && x.disabledReason?.kind !== 'filter-failed' && x.disabledReason?.kind !== 'cascade-fired')
            const done = a.status !== 'active'
            return (
              <div key={a.activity.name} className="box" style={{marginTop: 12}}>
                <div className="row">
                  <strong style={{fontSize: 13.5}}>{a.activity.title ?? a.activity.name}</strong>
                  <span className={`pill ${done ? 'st-classified' : 'st-investigation'}`}>{done ? 'Done' : 'Active'}</span>
                </div>
                {!done && buttons.length === 0 && <p style={{margin: '8px 0 0', fontSize: 12.5, color: 'var(--ink-muted)'}}>Runs automatically. Waiting on the agent.</p>}
                {!done && buttons.length > 0 && (
                  <div className="actions" style={{marginTop: 10}}>
                    {buttons.map((x) => (
                      <button
                        key={x.action.name}
                        type="button"
                        className={`btn sm${x.action.name === 'debunk' ? ' danger' : ''}`}
                        disabled={!x.allowed || busy}
                        title={!x.allowed ? 'Not available to you right now' : undefined}
                        onClick={() => {
                          setError(null)
                          setNote('')
                          setConfirm(false)
                          setPick({activity: a.activity.name, action: x.action.name, title: x.action.title ?? x.action.name, needsNote: Boolean(x.action.params?.length)})
                        }}
                      >
                        {x.action.title ?? x.action.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
      )}

      {pick && (
        <div className="box" style={{marginTop: 12, borderColor: 'var(--ink)'}} role="group" aria-label={`Confirm: ${pick.title}`}>
          <strong style={{fontSize: 13.5}}>{pick.title}</strong>
          {pick.needsNote && (
            <>
              <label htmlFor="wf-note" style={{display: 'block', marginTop: 8, fontSize: 12.5, color: 'var(--ink-muted)'}}>Note for the public file (at least 10 characters)</label>
              <textarea id="wf-note" className="note-input" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
            </>
          )}
          {isDebunk && faithSensitive && (
            <label style={{display: 'flex', gap: 8, marginTop: 8, fontSize: 12.5}}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span>This report may involve religious belief. The Bureau takes no position on matters of faith. I still want to close it.</span>
            </label>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          <div className="actions" style={{marginTop: 10}}>
            <button type="button" className="btn sm" disabled={busy || !noteOk || faithGate} onClick={fire}>{busy ? 'Working…' : 'Confirm'}</button>
            <button type="button" className="btn sm ghost" disabled={busy} onClick={() => setPick(null)}>Cancel</button>
          </div>
        </div>
      )}

      <h3>Workflow</h3>
      <div style={{border: '1px solid var(--rule)', borderRadius: 4, background: 'var(--paper-2)', overflow: 'hidden'}}>
        <WorkflowDiagram key={instanceId} definition={ev.definition} currentStage={ev.instance.currentStage} history={ev.instance.history} height={300} fill explain evaluation={ev} />
      </div>
    </div>
  )
}
