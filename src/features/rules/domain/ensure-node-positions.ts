import { JDM_CONTENT_TYPE, type JdmEdge, type JdmGraph, type JdmNode } from '@shared/types/domain'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object') return value as Record<string, unknown>
  return undefined
}

function toPosition(node: JdmNode, index: number): { x: number; y: number } {
  const pos = asRecord(node.position)
  const x = pos?.x
  const y = pos?.y
  return {
    x: typeof x === 'number' && Number.isFinite(x) ? x : 80 + index * 280,
    y: typeof y === 'number' && Number.isFinite(y) ? y : 180,
  }
}

function toEdge(edge: JdmEdge, index: number): JdmEdge | null {
  const rec = edge as JdmEdge & {
    source?: unknown
    target?: unknown
    sourceHandle?: unknown
    targetHandle?: unknown
  }
  const sourceId = String(rec.sourceId ?? rec.source ?? '')
  const targetId = String(rec.targetId ?? rec.target ?? '')
  if (!sourceId || !targetId) return null
  const mapped: JdmEdge = {
    id: String(rec.id ?? `edge-${index}`),
    sourceId,
    targetId,
  }
  if (typeof rec.sourceHandle === 'string' && rec.sourceHandle) mapped.sourceHandle = rec.sourceHandle
  if (typeof rec.targetHandle === 'string' && rec.targetHandle) mapped.targetHandle = rec.targetHandle
  return mapped
}

/**
 * React Flow (inside GoRules) crashes with `Cannot read properties of undefined (reading 'x')`
 * when a node has no `position`. Backend graphs often omit it or use RF-shaped edges.
 * Pass a clean DecisionGraph-shaped payload: every node has id, name, type, and { x, y }.
 */
export function toEditorGraph(graph: JdmGraph | null | undefined): JdmGraph {
  const rawNodes = graph?.nodes ?? []
  const nodes: JdmNode[] = []
  rawNodes.forEach((node, i) => {
    const id = typeof node?.id === 'string' && node.id ? node.id : ''
    if (!id) return
    const name = typeof node.name === 'string' && node.name ? node.name : id
    const next: JdmNode = {
      id,
      type: typeof node.type === 'string' && node.type ? node.type : 'expressionNode',
      name,
      position: toPosition(node, i),
    }
    if (node.content !== undefined) next.content = node.content
    nodes.push(next)
  })

  return {
    contentType: JDM_CONTENT_TYPE,
    nodes,
    edges: (graph?.edges ?? [])
      .map((edge, i) => toEdge(edge, i))
      .filter((edge): edge is JdmEdge => edge !== null),
  }
}

/** @deprecated use toEditorGraph — kept so existing imports keep working */
export function withNodePositions(graph: JdmGraph): JdmGraph {
  return toEditorGraph(graph)
}
