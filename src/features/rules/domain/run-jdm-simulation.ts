import type { DecisionGraphType, Simulation, SimulationTrace } from '@gorules/jdm-editor'

export type EvaluateExpressionFn = (expression: string, context: unknown) => unknown
export type EvaluateUnaryFn = (expression: string, context: unknown) => boolean
export type EvaluateFunctionFn = (source: string, input: unknown) => unknown

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
type SwitchContent = {
  hitPolicy?: 'first' | 'collect'
  statements?: Array<{ id?: string; condition?: string; isDefault?: boolean }>
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

function functionSource(node: GraphNode): string {
  const content = node.content
  if (typeof content === 'string') return content
  const rec = asRecord(content)
  return typeof rec?.source === 'string' ? rec.source : ''
}

function tableEmitsRiskScore(node: GraphNode): boolean {
  if (node.type !== 'decisionTableNode') return false
  const outputs = ((node.content ?? {}) as TableContent).outputs ?? []
  return outputs.some((column) => column.field === 'riskScore')
}

function graphEmitsRiskScore(graph: DecisionGraphType): boolean {
  return graph.nodes.some((node) => {
    if (expressionsOf(node).some((row) => row.key === 'riskScore' && Boolean(row.value))) return true
    if (node.type === 'functionNode' && functionSource(node).includes('riskScore')) return true
    return tableEmitsRiskScore(node)
  })
}

function edgeHandle(edge: GraphEdge): string | undefined {
  const handle = (edge as GraphEdge & { sourceHandle?: string | null }).sourceHandle
  return typeof handle === 'string' && handle ? handle : undefined
}

function matchingSwitchHandles(
  node: GraphNode,
  incoming: unknown,
  evaluate: EvaluateExpressionFn,
): string[] | undefined {
  if (node.type !== 'switchNode') return undefined
  const content = (node.content ?? {}) as SwitchContent
  const matched: string[] = []
  let defaultId: string | undefined
  for (const statement of content.statements ?? []) {
    if (!statement.id) continue
    if (statement.isDefault) {
      defaultId = statement.id
      continue
    }
    const condition = (statement.condition ?? '').trim()
    if (!condition) continue
    try {
      if (evaluate(condition, incoming) === true) {
        matched.push(statement.id)
        if ((content.hitPolicy ?? 'first') === 'first') break
      }
    } catch {
      // condition did not match
    }
  }
  if (matched.length === 0 && defaultId) matched.push(defaultId)
  return matched
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

function executeNode(
  node: GraphNode,
  incoming: unknown,
  order: number,
  started: number,
  evaluate: EvaluateExpressionFn,
  evaluateUnary: EvaluateUnaryFn,
  evaluateFunction: EvaluateFunctionFn | undefined,
  trace: Record<string, SimulationTrace>,
): unknown {
  if (node.type === 'inputNode' || node.type === 'switchNode') {
    trace[node.id] = traceFor(node.id, node.name, incoming, incoming, msSince(started), order)
    return incoming
  }
  if (node.type === 'decisionTableNode') {
    const output = runDecisionTable((node.content ?? {}) as TableContent, incoming, evaluate, evaluateUnary)
    trace[node.id] = traceFor(node.id, node.name, incoming, output, msSince(started), order)
    return output
  }
  if (node.type === 'expressionNode') {
    const { output, traceData } = runExpressionNode(node, incoming, evaluate)
    trace[node.id] = traceFor(node.id, node.name, incoming, output, msSince(started), order, traceData)
    return output
  }
  if (node.type === 'functionNode') {
    if (!evaluateFunction) {
      throw new Error('Function node needs a handler evaluator')
    }
    const output = evaluateFunction(functionSource(node), incoming)
    trace[node.id] = traceFor(node.id, node.name, incoming, output, msSince(started), order)
    return output
  }
  if (node.type === 'outputNode') {
    trace[node.id] = traceFor(node.id, node.name, incoming, incoming, msSince(started), order)
    return incoming
  }
  trace[node.id] = traceFor(node.id, node.name, incoming, incoming, msSince(started), order)
  return incoming
}

/**
 * Walks Request → tables/switch/function → expressions so FoldScore can see `hits`.
 * Never throws: GraphSimulator wraps `onRun` in the same try/catch as JSON5 parse.
 */
export function runJdmSimulation(
  graph: DecisionGraphType,
  context: unknown,
  evaluate: EvaluateExpressionFn,
  evaluateUnary: EvaluateUnaryFn = () => false,
  evaluateFunction?: EvaluateFunctionFn,
): Simulation {
  const started = performance.now()
  if (!graphEmitsRiskScore(graph)) {
    return fail(
      'No riskScore expression',
      'Add an Expression node that sets key `riskScore`.',
      graph.nodes.find((n) => n.type === 'expressionNode')?.id,
      graph,
    )
  }

  const trace: Record<string, SimulationTrace> = {}
  let state: unknown = context
  const edges = graph.edges ?? []
  const byId = new Map(graph.nodes.map((node) => [node.id, node]))

  const run = (node: GraphNode, incoming: unknown, order: number): unknown =>
    executeNode(node, incoming, order, started, evaluate, evaluateUnary, evaluateFunction, trace)

  try {
    if (edges.length === 0) {
      topoNodes(graph.nodes, edges).forEach((node, order) => {
        state = run(node, state, order)
      })
    } else {
      const start = graph.nodes.find((node) => node.type === 'inputNode') ?? graph.nodes[0]
      const visited = new Set<string>()
      let order = 0
      const visit = (node: GraphNode | undefined, incoming: unknown) => {
        if (!node || visited.has(node.id)) return
        visited.add(node.id)
        const output = run(node, incoming, order)
        order += 1
        state = output
        const handles = matchingSwitchHandles(node, incoming, evaluate)
        for (const edge of edges) {
          if (edge.sourceId !== node.id) continue
          if (handles) {
            const handle = edgeHandle(edge)
            if (!handle || !handles.includes(handle)) continue
          }
          visit(byId.get(edge.targetId), output)
        }
      }
      visit(start, context)
    }
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
