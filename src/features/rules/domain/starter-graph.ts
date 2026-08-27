import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'

/**
 * JSON Schema attached to the Request node so the GoRules expression editor
 * can autocomplete CanonicalRiskEvent fields (backend context = the event
 * without rawPayload — frontend-integration-spec.md §4).
 */
export const REQUEST_INPUT_SCHEMA = JSON.stringify(
  {
    type: 'object',
    properties: {
      provider: { type: 'string' },
      providerEventType: { type: 'string' },
      caseCustomerId: { type: 'string' },
      amountCents: { type: 'number' },
      currency: { type: 'string' },
      riskSignals: {
        type: 'object',
        properties: {
          walletAgeDays: { type: 'number' },
          velocity24h: { type: 'number' },
          destCountry: { type: 'string' },
        },
      },
      createdAt: { type: 'string' },
      eventId: { type: 'string' },
      providerEventId: { type: 'string' },
      rail: { type: 'string' },
    },
  },
  null,
  2,
)

/** Sample context for the in-editor simulator (matches the spec's wallet-transfer example). */
export const SAMPLE_SIMULATION_CONTEXT = `{
  "provider": "internal",
  "providerEventType": "wallet.transfer",
  "caseCustomerId": "cust-123",
  "amountCents": 500000,
  "currency": "USD",
  "riskSignals": { "walletAgeDays": 2, "velocity24h": 9, "destCountry": "XX", "providerRiskScore": 90 },
  "createdAt": "2026-08-18T00:00:00.000Z"
}`

const SCORE_EXPRESSION =
  '(amountCents > 300000 ? 50 : 0) + (riskSignals.velocity24h > 5 ? 40 : 0)'

/**
 * A connected Request → Score → Response graph that already emits integer
 * `riskScore`, so a new rule is savable and the canvas is not an empty void.
 */
export const STARTER_GRAPH: JdmGraph = {
  contentType: JDM_CONTENT_TYPE,
  nodes: [
    {
      id: 'request',
      type: 'inputNode',
      name: 'Request',
      position: { x: 60, y: 180 },
      content: { schema: REQUEST_INPUT_SCHEMA },
    },
    {
      id: 'score',
      type: 'expressionNode',
      name: 'Score',
      position: { x: 360, y: 180 },
      content: {
        expressions: [{ id: 'riskScore', key: 'riskScore', value: SCORE_EXPRESSION }],
      },
    },
    {
      id: 'response',
      type: 'outputNode',
      name: 'Response',
      position: { x: 680, y: 180 },
    },
  ],
  edges: [
    { id: 'e-request-score', sourceId: 'request', targetId: 'score' },
    { id: 'e-score-response', sourceId: 'score', targetId: 'response' },
  ],
}
