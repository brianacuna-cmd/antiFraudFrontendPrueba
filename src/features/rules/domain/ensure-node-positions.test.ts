import { describe, expect, it } from 'vitest'
import { JDM_CONTENT_TYPE } from '@shared/types/domain'
import { toEditorGraph, withNodePositions } from './ensure-node-positions'

describe('toEditorGraph', () => {
  it('fills missing positions without changing nodes that already have them', () => {
    const graph = toEditorGraph({
      contentType: JDM_CONTENT_TYPE,
      nodes: [
        { id: 'a', type: 'inputNode' },
        { id: 'b', type: 'outputNode', position: { x: 10, y: 20 } },
      ],
      edges: [],
    })
    expect(graph.nodes[0]?.position).toEqual({ x: 80, y: 180 })
    expect(graph.nodes[1]?.position).toEqual({ x: 10, y: 20 })
  })

  it('always writes a fresh { x, y } so React Flow never sees undefined', () => {
    const graph = toEditorGraph({
      contentType: JDM_CONTENT_TYPE,
      nodes: [{ id: 'a', type: 'inputNode', position: { x: 1, y: 2 } }],
      edges: [],
    })
    const pos = graph.nodes[0]?.position as { x: number; y: number }
    expect(Object.keys(pos).sort()).toEqual(['x', 'y'])
    expect(typeof pos.x).toBe('number')
    expect(typeof pos.y).toBe('number')
  })

  it('fills a name (GoRules DecisionNode requires it) and maps RF-style edges', () => {
    const graph = toEditorGraph({
      contentType: JDM_CONTENT_TYPE,
      nodes: [{ id: 'request', type: 'inputNode' }],
      edges: [{ id: 'e1', source: 'request', target: 'score' } as never],
    })
    expect(graph.nodes[0]?.name).toBe('request')
    expect(graph.edges[0]).toEqual({ id: 'e1', sourceId: 'request', targetId: 'score' })
  })

  it('drops nodes without an id so React Flow is not given holes', () => {
    const graph = toEditorGraph({
      contentType: JDM_CONTENT_TYPE,
      nodes: [{ type: 'inputNode' } as never, { id: 'ok', type: 'outputNode' }],
      edges: [],
    })
    expect(graph.nodes.map((n) => n.id)).toEqual(['ok'])
  })
})

describe('withNodePositions', () => {
  it('delegates to toEditorGraph', () => {
    const graph = withNodePositions({
      contentType: JDM_CONTENT_TYPE,
      nodes: [{ id: 'a', type: 'inputNode' }],
      edges: [],
    })
    expect(graph.nodes[0]?.position).toEqual({ x: 80, y: 180 })
  })
})
