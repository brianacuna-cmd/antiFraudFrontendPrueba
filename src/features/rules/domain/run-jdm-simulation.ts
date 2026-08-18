import type { DecisionGraphType, Simulation, SimulationTrace } from '@gorules/jdm-editor'

export type EvaluateExpressionFn = (expression: string, context: unknown) => unknown
export type EvaluateUnaryFn = (expression: string, context: unknown) => boolean

type GraphNode = DecisionGraphType['nodes'][number]
type GraphEdge = DecisionGraphType['edges'][number]
type ExpressionRow = { key?: string; value?: string }
type TableColumn = { id?: string; field?: string }
type TableContent = {
  hitPolicy?: string
  passThrough?: boolean
  outputPath?: string | null
  inputs?: TableColumn[]
  outputs?: TableColumn[]
  rules?: Array<Record<string, string>>
}

function expressionsOf(node: { content?: unknown } | undefined): ExpressionRow[] {
  const content = node?.content as { expressions?: ExpressionRow[] } | undefined
  return Array.isArray(content?.expressions) ? content.expressions : []
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function getPath(value: unknown, path: string | undefined): unknown {
  if (!path) return value
  return path.split('.').reduce<unknown>((acc, key) => {
    const rec = asRecord(acc)
    return rec ? rec[key] : undefined
  }, value)
}

function msSince(started: number): string {
  return `${Math.max(0, Math.round(performance.now() - started))}ms`
}

function traceFor(
  id: string,
  name: string,
  input: unknown,
  output: unknown,
  performance: string,
  order: number,
  traceData: SimulationTrace['traceData'] = null,
): SimulationTrace {
  return { id, name, input, output, performance, order, traceData }
}

function fail(title: string, message: string, nodeId?: string, snapshot?: DecisionGraphType): Simulation {
  return {
    error: { title, message, data: { nodeId } },
    result: snapshot
      ? {
          performance: '0ms',
          result: { error: message },
          snapshot,
          trace: {},
        }
      : undefined,
  }
}

function topoNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const indegree = new Map(nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]))
  for (const edge of edges ?? []) {
    if (!byId.has(edge.sourceId) || !byId.has(edge.targetId)) continue
    outgoing.get(edge.sourceId)?.push(edge.targetId)
    indegree.set(edge.targetId, (indegree.get(edge.targetId) ?? 0) + 1)
  }
  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id)
  const ordered: GraphNode[] = []
  while (queue.length > 0) {
    const id = queue.shift()
    if (!id) break
    const node = byId.get(id)
    if (node) ordered.push(node)
    for (const next of outgoing.get(id) ?? []) {
      const nextDeg = (indegree.get(next) ?? 1) - 1
      indegree.set(next, nextDeg)
      if (nextDeg === 0) queue.push(next)
    }
  }
  for (const node of nodes) {
    if (!ordered.some((n) => n.id === node.id)) ordered.push(node)
  }
  return ordered
}

function runDecisionTable(
  content: TableContent,
  incoming: unknown,
  evaluate: EvaluateExpressionFn,
  evaluateUnary: EvaluateUnaryFn,
): unknown {
  const inputs = content.inputs ?? []
  const outputs = content.outputs ?? []
  const hits: Record<string, unknown>[] = []

  for (const rule of content.rules ?? []) {
    let matched = true
    for (const input of inputs) {
      if (!input.id) continue
      const cell = (rule[input.id] ?? '').trim()
      if (!cell) continue
      const fieldValue = getPath(incoming, input.field)
      try {
        if (!evaluateUnary(cell, { $: fieldValue })) {
          matched = false
          break
        }
      } catch {
        matched = false
        break
      }
    }
    if (!matched) continue
    const row: Record<string, unknown> = {}
    for (const output of outputs) {
      if (!output.id || !output.field) continue
      const cell = (rule[output.id] ?? '').trim()
      row[output.field] = cell ? evaluate(cell, incoming) : null
    }
    hits.push(row)
    if ((content.hitPolicy ?? 'first') !== 'collect') break
  }

  const collected = (content.hitPolicy ?? 'first') === 'collect' ? hits : (hits[0] ?? {})
  const base = content.passThrough ? { ...asRecord(incoming) } : {}
  if (content.outputPath) {
    return { ...base, [content.outputPath]: collected }
  }
  return { ...base, ...asRecord(collected) }
}

function runExpressionNode(
  node: GraphNode,
  incoming: unknown,
  evaluate: EvaluateExpressionFn,
): { output: Record<string, unknown>; traceData: SimulationTrace['traceData'] } {
  const content = node.content as { passThrough?: boolean } | undefined
  const output: Record<string, unknown> = content?.passThrough ? { ...asRecord(incoming) } : {}
  const traceData: Record<string, { result: unknown }> = {}
  for (const row of expressionsOf(node)) {
    if (!row.key || row.value === undefined) continue
    const result = evaluate(row.value, incoming)
    output[row.key] = result
    traceData[row.key] = { result }
  }
  return { output, traceData }
}

/**
 * Walks Request → tables → expressions so FoldScore can see `hits`.
 * Never throws: GraphSimulator wraps `onRun` in the same try/catch as JSON5 parse.
 */
export function runJdmSimulation(
  graph: DecisionGraphType,
  context: unknown,
  evaluate: EvaluateExpressionFn,
  evaluateUnary: EvaluateUnaryFn = () => false,
): Simulation {
  const started = performance.now()
  const hasRiskScore = graph.nodes.some((node) =>
    expressionsOf(node).some((row) => row.key === 'riskScore' && Boolean(row.value)),
  )
  if (!hasRiskScore) {
    return fail(
      'No riskScore expression',
      'Add an Expression node that sets key `riskScore`.',
      graph.nodes.find((n) => n.type === 'expressionNode')?.id,
      graph,
    )
  }

  const trace: Record<string, SimulationTrace> = {}
  let state: unknown = context

  try {
    topoNodes(graph.nodes, graph.edges ?? []).forEach((node, order) => {
      const incoming = state
      if (node.type === 'inputNode') {
        trace[node.id] = traceFor(node.id, node.name, incoming, incoming, msSince(started), order)
        state = incoming
        return
      }
      if (node.type === 'decisionTableNode') {
        const output = runDecisionTable(
          (node.content ?? {}) as TableContent,
          incoming,
          evaluate,
          evaluateUnary,
        )
        trace[node.id] = traceFor(node.id, node.name, incoming, output, msSince(started), order)
        state = output
        return
      }
      if (node.type === 'expressionNode') {
        const { output, traceData } = runExpressionNode(node, incoming, evaluate)
        trace[node.id] = traceFor(node.id, node.name, incoming, output, msSince(started), order, traceData)
        state = output
        return
      }
      if (node.type === 'outputNode') {
        trace[node.id] = traceFor(node.id, node.name, incoming, incoming, msSince(started), order)
        state = incoming
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Evaluation failed'
    return fail('Simulation failed', message, undefined, graph)
  }

  return {
    result: {
      performance: msSince(started),
      result: state,
      snapshot: graph,
      trace,
    },
  }
}
