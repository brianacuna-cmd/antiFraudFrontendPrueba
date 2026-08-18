import { describe, expect, it, vi } from 'vitest'
import type { DecisionGraphType } from '@gorules/jdm-editor'
import { runJdmSimulation } from './run-jdm-simulation'

const GRAPH = {
  nodes: [
    { id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } },
    {
      id: 'score',
      type: 'expressionNode',
      name: 'Score',
      position: { x: 1, y: 0 },
      content: { expressions: [{ id: 'riskScore', key: 'riskScore', value: 'amountCents > 1 ? 90 : 0' }] },
    },
    { id: 'response', type: 'outputNode', name: 'Response', position: { x: 2, y: 0 } },
  ],
  edges: [],
} as unknown as DecisionGraphType

describe('runJdmSimulation', () => {
  it('returns a GoRules SimulationOk with traces so the simulator UI can render', () => {
    const evaluate = vi.fn().mockReturnValue(90)
    const sim = runJdmSimulation(GRAPH, { amountCents: 500000 }, evaluate)
    expect(sim.error).toBeUndefined()
    expect(sim.result?.result).toEqual({ riskScore: 90 })
    expect(sim.result?.trace.score?.output).toEqual({ riskScore: 90 })
    expect(evaluate).toHaveBeenCalledWith('amountCents > 1 ? 90 : 0', { amountCents: 500000 })
  })

  it('returns a SimulationError when the graph has no riskScore expression', () => {
    const empty = { nodes: [{ id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } }], edges: [] } as unknown as DecisionGraphType
    const sim = runJdmSimulation(empty, {}, vi.fn())
    expect(sim.error?.title).toMatch(/riskScore/i)
  })

  it('returns a SimulationError when evaluation throws (does not throw to GraphSimulator)', () => {
    const evaluate = vi.fn().mockImplementation(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'evaluateExpression')")
    })
    const sim = runJdmSimulation(GRAPH, {}, evaluate)
    expect(sim.error?.message).toMatch(/evaluateExpression|WASM|failed/i)
  })

  it('runs a collect decision table then folds hits into riskScore (Downloads JDM)', () => {
    const graph = {
      nodes: [
        { id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } },
        {
          id: 'scoring-hits',
          type: 'decisionTableNode',
          name: 'ScoringHits',
          position: { x: 1, y: 0 },
          content: {
            hitPolicy: 'collect',
            passThrough: true,
            outputPath: 'hits',
            inputs: [
              { id: 'i1', field: 'amountCents' },
              { id: 'i2', field: 'riskSignals.providerRiskScore' },
            ],
            outputs: [{ id: 'o1', field: 'points' }],
            rules: [
              { _id: 'r1', i1: '>= 10000', i2: '', o1: '20' },
              { _id: 'r2', i1: '', i2: '>= 80', o1: '30' },
            ],
          },
        },
        {
          id: 'fold-score',
          type: 'expressionNode',
          name: 'FoldScore',
          position: { x: 2, y: 0 },
          content: {
            passThrough: false,
            expressions: [
              { id: 'e1', key: 'riskScore', value: 'sum(map(hits, #.points))' },
              { id: 'e2', key: 'hits', value: 'hits' },
            ],
          },
        },
        { id: 'response', type: 'outputNode', name: 'Response', position: { x: 3, y: 0 } },
      ],
      edges: [
        { id: 'e1', sourceId: 'request', targetId: 'scoring-hits' },
        { id: 'e2', sourceId: 'scoring-hits', targetId: 'fold-score' },
        { id: 'e3', sourceId: 'fold-score', targetId: 'response' },
      ],
    } as unknown as DecisionGraphType

    const evaluate = vi.fn((expr: string, ctx: unknown) => {
      const rec = ctx as { hits?: Array<{ points: number }> }
      if (expr === 'sum(map(hits, #.points))') {
        return (rec.hits ?? []).reduce((sum, hit) => sum + hit.points, 0)
      }
      if (expr === 'hits') return rec.hits
      if (expr === '20') return 20
      if (expr === '30') return 30
      throw new Error(`unexpected expr ${expr}`)
    })
    const unary = vi.fn((expr: string, ctx: unknown) => {
      const value = (ctx as { $?: unknown }).$
      if (expr === '>= 10000') return typeof value === 'number' && value >= 10000
      if (expr === '>= 80') return typeof value === 'number' && value >= 80
      return false
    })

    const sim = runJdmSimulation(
      graph,
      { amountCents: 500000, riskSignals: { providerRiskScore: 90 } },
      evaluate,
      unary,
    )
    expect(sim.error).toBeUndefined()
    expect(sim.result?.result).toEqual({
      riskScore: 50,
      hits: [{ points: 20 }, { points: 30 }],
    })
  })

  it('follows only the matching Switch sourceHandle branch', () => {
    const graph = {
      nodes: [
        { id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } },
        {
          id: 'route',
          type: 'switchNode',
          name: 'Route',
          position: { x: 1, y: 0 },
          content: {
            hitPolicy: 'first',
            statements: [
              { id: 's-charge', condition: 'providerEventType == "CHARGEBACK"', isDefault: false },
              { id: 's-default', condition: '', isDefault: true },
            ],
          },
        },
        {
          id: 'charge',
          type: 'expressionNode',
          name: 'ChargebackScore',
          position: { x: 2, y: 0 },
          content: { expressions: [{ key: 'riskScore', value: '80' }] },
        },
        {
          id: 'other',
          type: 'expressionNode',
          name: 'OtherScore',
          position: { x: 2, y: 1 },
          content: { expressions: [{ key: 'riskScore', value: '10' }] },
        },
        { id: 'response', type: 'outputNode', name: 'Response', position: { x: 3, y: 0 } },
      ],
      edges: [
        { id: 'e1', sourceId: 'request', targetId: 'route' },
        { id: 'e2', sourceId: 'route', targetId: 'charge', sourceHandle: 's-charge' },
        { id: 'e3', sourceId: 'route', targetId: 'other', sourceHandle: 's-default' },
        { id: 'e4', sourceId: 'charge', targetId: 'response' },
        { id: 'e5', sourceId: 'other', targetId: 'response' },
      ],
    } as unknown as DecisionGraphType

    const evaluate = vi.fn((expr: string, ctx: unknown) => {
      const rec = ctx as { providerEventType?: string }
      if (expr === 'providerEventType == "CHARGEBACK"') return rec.providerEventType === 'CHARGEBACK'
      if (expr === '80') return 80
      if (expr === '10') return 10
      throw new Error(`unexpected expr ${expr}`)
    })

    const sim = runJdmSimulation(graph, { providerEventType: 'CHARGEBACK' }, evaluate)
    expect(sim.error).toBeUndefined()
    expect(sim.result?.result).toEqual({ riskScore: 80 })
    expect(evaluate).not.toHaveBeenCalledWith('10', expect.anything())
  })

  it('runs a Function node handler and treats it as the riskScore source', () => {
    const graph = {
      nodes: [
        { id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } },
        {
          id: 'fn',
          type: 'functionNode',
          name: 'ScoreFn',
          position: { x: 1, y: 0 },
          content: { source: 'export const handler = (input) => ({ riskScore: 42 })' },
        },
        { id: 'response', type: 'outputNode', name: 'Response', position: { x: 2, y: 0 } },
      ],
      edges: [
        { id: 'e1', sourceId: 'request', targetId: 'fn' },
        { id: 'e2', sourceId: 'fn', targetId: 'response' },
      ],
    } as unknown as DecisionGraphType

    const evaluateFunction = vi.fn().mockReturnValue({ riskScore: 42 })
    const sim = runJdmSimulation(graph, { amountCents: 1 }, vi.fn(), () => false, evaluateFunction)
    expect(sim.error).toBeUndefined()
    expect(sim.result?.result).toEqual({ riskScore: 42 })
    expect(evaluateFunction).toHaveBeenCalledWith(
      'export const handler = (input) => ({ riskScore: 42 })',
      { amountCents: 1 },
    )
  })

  it('keeps only the first hit of a first-policy decision table', () => {
    const graph = {
      nodes: [
        { id: 'request', type: 'inputNode', name: 'Request', position: { x: 0, y: 0 } },
        {
          id: 'table',
          type: 'decisionTableNode',
          name: 'FirstHit',
          position: { x: 1, y: 0 },
          content: {
            hitPolicy: 'first',
            inputs: [{ id: 'i1', field: 'amountCents' }],
            outputs: [{ id: 'o1', field: 'riskScore' }],
            rules: [
              { _id: 'r1', i1: '>= 1', o1: '15' },
              { _id: 'r2', i1: '>= 1', o1: '99' },
            ],
          },
        },
        { id: 'response', type: 'outputNode', name: 'Response', position: { x: 2, y: 0 } },
      ],
      edges: [
        { id: 'e1', sourceId: 'request', targetId: 'table' },
        { id: 'e2', sourceId: 'table', targetId: 'response' },
      ],
    } as unknown as DecisionGraphType

    const evaluate = vi.fn((expr: string) => (expr === '15' ? 15 : expr === '99' ? 99 : expr))
    const unary = vi.fn(() => true)
    const sim = runJdmSimulation(graph, { amountCents: 500 }, evaluate, unary)
    expect(sim.error).toBeUndefined()
    expect(sim.result?.result).toEqual({ riskScore: 15 })
    expect(evaluate).not.toHaveBeenCalledWith('99', expect.anything())
  })
})
