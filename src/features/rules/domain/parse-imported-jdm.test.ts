import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { JDM_CONTENT_TYPE } from '@shared/types/domain'
import { parseImportedJdm } from './parse-imported-jdm'

const FIXTURE = readFileSync(
  path.join(process.cwd(), 'public/fixtures/all-node-types.jdm.json'),
  'utf8',
)

describe('parseImportedJdm', () => {
  it('loads a GoRules fixture and keeps switch edges', () => {
    const result = parseImportedJdm(FIXTURE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.graph.contentType).toBe(JDM_CONTENT_TYPE)
    expect(result.graph.nodes.map((n) => n.id)).toContain('route')
    expect(result.graph.edges.some((e) => e.sourceHandle === 's-charge')).toBe(true)
  })

  it('rejects invalid JSON with a visible reason', () => {
    const result = parseImportedJdm('{ not json')
    expect(result).toEqual({ ok: false, error: 'The file is not valid JSON.' })
  })

  it('rejects a payload that is not a graph', () => {
    const result = parseImportedJdm('[]')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/nodes array/i)
  })

  it('rejects the wrong contentType', () => {
    const result = parseImportedJdm(
      JSON.stringify({ contentType: 'text/plain', nodes: [{ id: 'a', type: 'inputNode' }], edges: [] }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/contentType/)
  })

  it('accepts nodes/edges without contentType (native upload would say Invalid content type)', () => {
    const result = parseImportedJdm(
      JSON.stringify({
        nodes: [{ id: 'request', type: 'inputNode' }, { id: 'response', type: 'outputNode' }],
        edges: [{ id: 'e1', source: 'request', target: 'response' }],
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.graph.nodes).toHaveLength(2)
    expect(result.graph.edges[0]).toMatchObject({ sourceId: 'request', targetId: 'response' })
  })

  it('unwraps a conditions wrapper from a saved rule', () => {
    const result = parseImportedJdm(
      JSON.stringify({
        name: 'copied rule',
        conditions: {
          nodes: [{ id: 'a', type: 'inputNode' }],
          edges: [],
        },
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.graph.nodes[0]?.id).toBe('a')
  })

  it('rejects graphs whose nodes have no id', () => {
    const result = parseImportedJdm(JSON.stringify({ nodes: [{ type: 'inputNode' }], edges: [] }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/id/)
  })
})
