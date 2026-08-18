import { describe, expect, it } from 'vitest'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { STARTER_GRAPH } from './starter-graph'
import { validateJdmOutput } from './validateJdmOutput'

function graphWith(nodes: JdmGraph['nodes']): JdmGraph {
  return { contentType: JDM_CONTENT_TYPE, nodes, edges: [] }
}

describe('validateJdmOutput', () => {
  it('accepts a graph with an expression emitting riskScore and an output node', () => {
    const graph = graphWith([
      { id: 'req', type: 'inputNode' },
      {
        id: 'expr',
        type: 'expressionNode',
        content: { expressions: [{ key: 'riskScore', value: '50' }] },
      },
      { id: 'res', type: 'outputNode' },
    ])
    expect(validateJdmOutput(graph)).toEqual({ valid: true })
  })

  it('rejects an empty graph', () => {
    const result = validateJdmOutput(graphWith([]))
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/empty/i)
  })

  it('rejects a graph missing an output node', () => {
    const graph = graphWith([
      { id: 'req', type: 'inputNode' },
      { id: 'expr', type: 'expressionNode', content: { expressions: [{ key: 'riskScore', value: '1' }] } },
    ])
    const result = validateJdmOutput(graph)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/output node/i)
  })

  it('rejects a graph whose expression does not emit riskScore', () => {
    const graph = graphWith([
      { id: 'req', type: 'inputNode' },
      { id: 'expr', type: 'expressionNode', content: { expressions: [{ key: 'other', value: '1' }] } },
      { id: 'res', type: 'outputNode' },
    ])
    const result = validateJdmOutput(graph)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/riskScore/)
  })

  it('rejects null/undefined graphs', () => {
    expect(validateJdmOutput(null).valid).toBe(false)
    expect(validateJdmOutput(undefined).valid).toBe(false)
  })

  it('accepts the starter scoring template', () => {
    expect(validateJdmOutput(STARTER_GRAPH)).toEqual({ valid: true })
  })
})
