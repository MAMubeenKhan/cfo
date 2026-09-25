import {useMemo, useState} from 'react'
import {CATEGORY_LABEL, STAGE_GROUPS, type BoardCase} from './data'

/** Left rail: every case, grouped by stage. Selecting one pans the board to its card. */
export function Rail({cases, selectedId, onSelect}: {cases: BoardCase[]; selectedId: string | null; onSelect: (id: string) => void}) {
  const [q, setQ] = useState('')
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return cases.filter((c) => !c.hidden && (!needle || [c.title, c.caseNumber, c.place, c.category].filter(Boolean).join(' ').toLowerCase().includes(needle)))
  }, [cases, q])

  return (
    <nav className="rail" aria-label="Case files by stage">
      <label htmlFor="rail-search" style={{position: 'absolute', left: -9999}}>Search case files</label>
      <input id="rail-search" type="search" placeholder="Search case files" value={q} onChange={(e) => setQ(e.target.value)} />
      {STAGE_GROUPS.map((g) => {
        const items = visible.filter((c) => (g.statuses as readonly string[]).includes(c.status))
        return (
          <details key={g.key} open={g.key !== 'closed' || Boolean(q)}>
            <summary>
              <span>{g.label}</span>
              <span className="n">{items.length}</span>
            </summary>
            {items.map((c) => (
              <button key={c._id} type="button" className="rail-item" aria-current={c._id === selectedId} onClick={() => onSelect(c._id)}>
                <b>
                  {c.caseNumber} · {CATEGORY_LABEL[c.category] ?? c.category}
                </b>
                <span>{c.title}</span>
              </button>
            ))}
            {items.length === 0 && <p className="empty" style={{padding: '10px 4px', textAlign: 'left'}}>Nothing here.</p>}
          </details>
        )
      })}
    </nav>
  )
}
