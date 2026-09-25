import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from '@sanity/sdk-react'
import {Corkboard} from './Corkboard'
import {Panel} from './Panel'
import {Rail} from './Rail'
import {connectionId, STUDIO_URL, useBoardCases, useBoardConnections, useBoardPins} from './data'

const ref = (id: string) => ({_type: 'reference' as const, _ref: id})

export function Board() {
  const client = useClient({apiVersion: '2026-09-01'})
  const cases = useBoardCases()
  const connections = useBoardConnections()
  const pins = useBoardPins()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedString, setSelectedString] = useState<string | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(t)
  }, [notice])

  const fail = useCallback((what: string) => (e: unknown) => setNotice(`${what} failed: ${e instanceof Error ? e.message : String(e)}`), [])

  // Card positions are saved as boardPin documents (pin-<caseId>), shared live with everyone on the board.
  const move = useCallback(
    (caseId: string, x: number, y: number) => {
      void client.createOrReplace({_id: `pin-${caseId}`, _type: 'boardPin', case: ref(caseId), x: Math.round(x), y: Math.round(y)}).catch(fail('Saving the position'))
    },
    [client, fail],
  )

  // Drawing a string makes a confirmed connection (conn-<lowerId>-<higherId>), so each pair exists once.
  const connect = useCallback(
    (a: string, b: string) => {
      const [from, to] = [a, b].sort()
      const now = new Date().toISOString()
      void client
        .createOrReplace({
          _id: connectionId(a, b),
          _type: 'connection',
          from: ref(from),
          to: ref(to),
          reason: 'Linked by hand on the Case Board.',
          confidence: 1,
          proposedBy: 'human',
          status: 'confirmed',
          createdAt: now,
          decidedAt: now,
        })
        .then(() => setNotice('String drawn.'))
        .catch(fail('Drawing the string'))
    },
    [client, fail],
  )

  const decide = useCallback(
    (id: string, status: 'confirmed' | 'rejected') => {
      void client
        .patch(id)
        .set({status, decidedAt: new Date().toISOString()})
        .commit()
        .then(() => setNotice(status === 'confirmed' ? 'String confirmed.' : 'String removed.'))
        .catch(fail('Updating the string'))
    },
    [client, fail],
  )

  const selected = useMemo(() => cases.find((c) => c._id === selectedId) ?? null, [cases, selectedId])
  const open = cases.filter((c) => !c.hidden && ['intake', 'review', 'investigation', 'filing'].includes(c.status)).length
  const strings = connections.length

  const pickFromRail = (id: string) => {
    setSelectedString(null)
    setSelectedId(id)
    setFocusToken((n) => n + 1)
  }

  return (
    <div className="cb">
      <header className="cb-top">
        <div className="cb-brand">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14.5" fill="none" stroke="#1c1b19" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="#1c1b19" strokeWidth="0.75" strokeDasharray="1.5 1.5" />
            <path d="M10.5 20.5c0-3.2 2.4-5.6 5.5-5.6s5.5 2.4 5.5 5.6M13 14.2c0-1.7 1.3-3 3-3s3 1.3 3 3" fill="none" stroke="#b42318" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="16" cy="22.2" r="1.1" fill="#b42318" />
          </svg>
          <span>
            Case Board
            <small>Cryptid Field Office</small>
          </span>
        </div>
        <span className="cb-live"><i /> Live</span>
        <span style={{fontSize: 13, color: 'var(--ink-muted)'}}>
          <b style={{color: 'var(--ink)'}}>{cases.filter((c) => !c.hidden).length}</b> files · <b style={{color: 'var(--ink)'}}>{open}</b> open · <b style={{color: 'var(--ink)'}}>{strings}</b> strings
        </span>
        {notice && <span role="status" style={{fontSize: 13, fontWeight: 600}}>{notice}</span>}
        <span className="cb-hint">Drag cards. Drag a red pin onto another card to draw a string. Click a string to select it.</span>
        <a className="cb-link" href={STUDIO_URL} target="_blank" rel="noreferrer">Open Studio</a>
      </header>

      <div className="cb-body">
        <Rail cases={cases} selectedId={selectedId} onSelect={pickFromRail} />
        <main className="board" aria-label="Corkboard">
          <Corkboard
            cases={cases}
            connections={connections}
            pins={pins}
            selectedId={selectedId}
            selectedStringId={selectedString}
            focusToken={focusToken}
            onSelectCase={setSelectedId}
            onSelectString={setSelectedString}
            onMove={move}
            onConnect={connect}
          />
        </main>
        <Panel
          c={selected}
          cases={cases}
          connections={connections}
          selectedStringId={selectedString}
          onSelectString={setSelectedString}
          onDecide={decide}
          onSelectCase={pickFromRail}
        />
      </div>
      <p className="narrow">The Case Board needs a larger screen. Open it on a desktop or laptop.</p>
    </div>
  )
}
