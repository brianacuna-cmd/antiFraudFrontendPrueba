import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { toEditorGraph } from './ensure-node-positions'

export type ParseImportedJdmResult =
  | { ok: true; graph: JdmGraph }
  | { ok: false; error: string }

const NESTED_GRAPH_KEYS = ['graph', 'conditions', 'decisionGraph'] as const

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

/**
 * Turns a file/paste payload into a canvas-safe JDM graph, with an error
 * the UI can show. Native GoRules "Upload JSON" only toasts via antd and
 * rejects missing `contentType` / `name` without going through toEditorGraph.
 */
export function parseImportedJdm(raw: string): ParseImportedJdmResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  return parseImportedJdmValue(parsed)
}

export function parseImportedJdmValue(value: unknown, depth = 0): ParseImportedJdmResult {
  const rec = asRecord(value)
  if (!rec) {
    return {
      ok: false,
      error: 'JSON must be an object with a nodes array (a GoRules JDM graph).',
    }
  }

  if (!Array.isArray(rec.nodes) && depth < 2) {
    for (const key of NESTED_GRAPH_KEYS) {
      if (asRecord(rec[key])) {
        return parseImportedJdmValue(rec[key], depth + 1)
      }
    }
    return {
      ok: false,
      error:
        'JSON is missing a "nodes" array. Use a GoRules JDM export (contentType application/vnd.gorules.decision).',
    }
  }

  if (!Array.isArray(rec.nodes)) {
    return { ok: false, error: '"nodes" must be an array.' }
  }

  const contentType = rec.contentType
  if (contentType !== undefined && contentType !== JDM_CONTENT_TYPE) {
    return {
      ok: false,
      error: `Unexpected contentType "${String(contentType)}". Expected "${JDM_CONTENT_TYPE}".`,
    }
  }

  const graph = toEditorGraph({
    contentType: JDM_CONTENT_TYPE,
    nodes: rec.nodes as JdmGraph['nodes'],
    edges: Array.isArray(rec.edges) ? (rec.edges as JdmGraph['edges']) : [],
  })

  if (graph.nodes.length === 0) {
    return {
      ok: false,
      error: 'No nodes with an id were found in the JSON, so the canvas has nothing to draw.',
    }
  }

  return { ok: true, graph }
}
