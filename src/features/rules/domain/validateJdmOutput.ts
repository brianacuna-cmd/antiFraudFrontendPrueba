import type { JdmGraph } from '@shared/types/domain'

export interface JdmValidationResult {
  valid: boolean
  error?: string
}

/**
 * Fail-closed client-side pre-validation mirroring the backend's rule:
 * the graph must produce an integer `riskScore` in its output. This is a
 * structural best-effort check (we cannot execute the JDM engine client-side):
 * we require at least one expressionNode whose `content.expressions` defines
 * a `riskScore` key, a Function node whose source mentions `riskScore`,
 * or a decision table with an output field named `riskScore`, AND at least one outputNode.
 */
export function validateJdmOutput(graph: JdmGraph | null | undefined): JdmValidationResult {
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return { valid: false, error: 'The rule graph is empty' }
  }

  const outputNode = graph.nodes.find((n) => n.type === 'outputNode')
  if (!outputNode) {
    return { valid: false, error: 'The rule graph must have an output node' }
  }

  const emitsRiskScore = graph.nodes.some((n) => {
    if (n.type === 'expressionNode') {
      const content = n.content as { expressions?: Array<{ key?: string }> } | undefined
      return content?.expressions?.some((expr) => expr.key === 'riskScore') ?? false
    }
    if (n.type === 'functionNode') {
      const content = n.content
      const source =
        typeof content === 'string' ? content : (content as { source?: string } | undefined)?.source
      return typeof source === 'string' && source.includes('riskScore')
    }
    if (n.type === 'decisionTableNode') {
      const outputs = (n.content as { outputs?: Array<{ field?: string }> } | undefined)?.outputs
      return outputs?.some((output) => output.field === 'riskScore') ?? false
    }
    return false
  })

  if (!emitsRiskScore) {
    return {
      valid: false,
      error: 'The rule graph must emit an integer `riskScore` field from an expression node',
    }
  }

  return { valid: true }
}
