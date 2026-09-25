import {memo, useCallback, useEffect, useMemo, useRef} from 'react'
import {
  BaseEdge,
  ConnectionMode,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {useState} from 'react'
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  groupIndex,
  tiltFor,
  type BoardCase,
  type BoardConnection,
  type BoardPin,
} from './data'

type CardData = {c: BoardCase; selected: boolean}
type CardNode = Node<CardData, 'polaroid'>
type StringData = {status: string; selected: boolean; fresh: boolean}
type StringEdgeT = Edge<StringData, 'string'>

const CARD_W = 200
const CARD_H = 250

const PolaroidNode = memo(function PolaroidNode({data}: NodeProps<CardNode>) {
  const {c, selected} = data
  return (
    <div
      className={`card${selected ? ' selected' : ''}`}
      style={{transform: `rotate(${tiltFor(c._id)}deg)`}}
      aria-label={`${c.caseNumber}: ${c.title}. ${STATUS_LABEL[c.status] ?? c.status}.`}
    >
      {c.restricted && <span className="restricted">Restricted</span>}
      <Handle type="source" position={Position.Top} className="pin" isConnectableStart isConnectableEnd aria-label={`Pin for ${c.caseNumber}. Drag to another card to draw a red string.`} />
      <div className="photo">{c.thumb ? <img src={`${c.thumb}?w=400&h=216&fit=crop&auto=format`} alt="" loading="lazy" /> : CATEGORY_LABEL[c.category] ?? c.category}</div>
      <div className="num">
        <span>{c.caseNumber}</span>
        <span>{typeof c.plausibility === 'number' ? `P${c.plausibility}` : ''}</span>
      </div>
      <h4>{c.title}</h4>
      <div className="meta">{c.place ?? CATEGORY_LABEL[c.category]}</div>
      <span className={`stamp st-${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
    </div>
  )
})

/** A red string with a slight sag, like real string pinned between two cards. */
function StringEdge({id, sourceX, sourceY, targetX, targetY, data}: EdgeProps<StringEdgeT>) {
  const mx = (sourceX + targetX) / 2
  const sag = Math.min(60, Math.hypot(targetX - sourceX, targetY - sourceY) * 0.12) + 8
  const path = `M ${sourceX} ${sourceY} Q ${mx} ${(sourceY + targetY) / 2 + sag} ${targetX} ${targetY}`
  const status = data?.status ?? 'proposed'
  return (
    <BaseEdge
      id={id}
      path={path}
      interactionWidth={22}
      className={`string ${status === 'proposed' ? 'proposed' : ''} ${data?.selected ? 'sel' : ''} ${data?.fresh ? 'enter' : ''}`}
    />
  )
}

const nodeTypes = {polaroid: PolaroidNode}
const edgeTypes = {string: StringEdge}

interface Props {
  cases: BoardCase[]
  connections: BoardConnection[]
  pins: BoardPin[]
  selectedId: string | null
  selectedStringId: string | null
  focusToken: number
  onSelectCase: (id: string | null) => void
  onSelectString: (id: string | null) => void
  onMove: (caseId: string, x: number, y: number) => void
  onConnect: (a: string, b: string) => void
}

function Inner({cases, connections, pins, selectedId, selectedStringId, focusToken, onSelectCase, onSelectString, onMove, onConnect}: Props) {
  const flow = useReactFlow()
  const [nodes, setNodes] = useState<CardNode[]>([])
  const dragging = useRef<Set<string>>(new Set())
  const seen = useRef<Set<string>>(new Set())
  const pending = useRef<Map<string, {x: number; y: number}>>(new Map())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visible = useMemo(() => cases.filter((c) => !c.hidden), [cases])
  const pinById = useMemo(() => new Map(pins.map((p) => [p.case, p])), [pins])

  // Derive nodes from live data. Cards with no saved pin are laid out in columns by stage.
  useEffect(() => {
    const perGroup: Record<number, number> = {}
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return visible.map((c) => {
        const g = groupIndex(c.status)
        const row = (perGroup[g] = (perGroup[g] ?? -1) + 1)
        const pin = pinById.get(c._id)
        const existing = prevById.get(c._id)
        const position =
          existing && dragging.current.has(c._id)
            ? existing.position
            : pin
              ? {x: pin.x, y: pin.y}
              : {x: 40 + g * (CARD_W + 60), y: 40 + row * (CARD_H + 30)}
        return {id: c._id, type: 'polaroid', position, data: {c, selected: c._id === selectedId}, width: CARD_W, height: CARD_H, selected: c._id === selectedId} as CardNode
      })
    })
  }, [visible, pinById, selectedId])

  const edges = useMemo<StringEdgeT[]>(() => {
    const ids = new Set(visible.map((c) => c._id))
    return connections
      .filter((k) => ids.has(k.from) && ids.has(k.to))
      .map((k) => {
        const fresh = !seen.current.has(k._id)
        seen.current.add(k._id)
        return {id: k._id, source: k.from, target: k.to, type: 'string', data: {status: k.status, selected: k._id === selectedStringId, fresh}} as StringEdgeT
      })
  }, [visible, connections, selectedStringId])

  const flush = useCallback(() => {
    for (const [id, p] of pending.current) onMove(id, p.x, p.y)
    pending.current.clear()
  }, [onMove])

  const onNodesChange = useCallback(
    (changes: NodeChange<CardNode>[]) => {
      setNodes((ns) => applyNodeChanges(changes, ns))
      for (const ch of changes) {
        if (ch.type === 'position' && ch.position) {
          if (ch.dragging) dragging.current.add(ch.id)
          else {
            // A move that is not a mouse drag (arrow keys): save it shortly after the last key press.
            if (!dragging.current.has(ch.id)) {
              pending.current.set(ch.id, ch.position)
              if (timer.current) clearTimeout(timer.current)
              timer.current = setTimeout(flush, 700)
            }
          }
        }
      }
    },
    [flush],
  )

  // Pan to a case chosen from the rail or the panel.
  useEffect(() => {
    if (!selectedId || focusToken === 0) return
    const n = nodes.find((x) => x.id === selectedId)
    if (n) flow.setCenter(n.position.x + CARD_W / 2, n.position.y + CARD_H / 2, {zoom: Math.max(flow.getZoom(), 0.9), duration: 450})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken])

  return (
    <ReactFlow<CardNode, StringEdgeT>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      connectionMode={ConnectionMode.Loose}
      onNodeClick={(_, n) => {
        onSelectString(null)
        onSelectCase(n.id)
      }}
      onEdgeClick={(_, e) => onSelectString(e.id)}
      onPaneClick={() => {
        onSelectCase(null)
        onSelectString(null)
      }}
      onNodeDragStop={(_, n) => {
        dragging.current.delete(n.id)
        onMove(n.id, Math.round(n.position.x), Math.round(n.position.y))
      }}
      onConnect={(conn: Connection) => conn.source && conn.target && conn.source !== conn.target && onConnect(conn.source, conn.target)}
      fitView
      fitViewOptions={{padding: 0.15, maxZoom: 0.9}}
      minZoom={0.25}
      maxZoom={1.6}
      proOptions={{hideAttribution: true}}
      nodesFocusable
      aria-label="Corkboard of case files. Drag cards to arrange them. Drag a red pin onto another card to draw a string."
    >
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable nodeColor={() => '#fbf8ef'} maskColor="rgba(60,35,10,.35)" />
    </ReactFlow>
  )
}

export function Corkboard(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  )
}
