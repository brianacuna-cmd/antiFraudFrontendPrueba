import type { HexId24 } from './ids'

// ---- Settings ----
export interface Settings {
  userId: HexId24
  organizationId: HexId24
  apiBase: string
}

// ---- Fraud config ----
export interface FraudConfig {
  slaLowMinutes: number
  slaMediumMinutes: number
  slaHighMinutes: number
  slaCriticalMinutes: number
  riskThresholdLow: number
  riskThresholdMedium: number
  riskThresholdHigh: number
  riskThresholdCritical: number
  featureFlags?: Record<string, boolean>
  outboundWebhookUrl?: string | null
}

// ---- JDM graph (risk-scoring rules) ----
export const JDM_CONTENT_TYPE = 'application/vnd.gorules.decision' as const

export interface JdmNode {
  id: string
  type: string
  name?: string
  content?: unknown
  [key: string]: unknown
}

export interface JdmEdge {
  id: string
  sourceId: string
  targetId: string
  [key: string]: unknown
}

export interface JdmGraph {
  contentType: typeof JDM_CONTENT_TYPE
  nodes: JdmNode[]
  edges: JdmEdge[]
  [key: string]: unknown
}

export type RuleStatus = 'INACTIVE' | 'ACTIVE'

export interface Rule {
  id: string
  organizationId: string
  name: string
  conditions: JdmGraph
  conditionsVersion?: number
  status: RuleStatus
  createdAt: string
  updatedAt: string
}

// ---- Ingestor ----
export interface CanonicalRiskEvent {
  provider: string
  providerEventType: string
  caseCustomerId: string
  amountCents: number
  currency: string
  riskSignals: Record<string, unknown>
  createdAt: string
  eventId?: string
  providerEventId?: string
  rail?: string
  rawPayload?: unknown
}

export const CANONICAL_RISK_EVENT_REQUIRED_KEYS = [
  'provider',
  'providerEventType',
  'caseCustomerId',
  'amountCents',
  'currency',
  'riskSignals',
  'createdAt',
] as const

export const CANONICAL_RISK_EVENT_OPTIONAL_KEYS = [
  'eventId',
  'providerEventId',
  'rail',
  'rawPayload',
] as const

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ScoreResult {
  riskScore: number
  ruleId: string
  name?: string
  conditionsVersion?: number
  opened?: boolean
  caseId?: string
  priority?: Priority | null
}

// ---- Cases ----
export type CaseStatus = string

export interface CaseFilters {
  status?: string
  priority?: Priority
  assignedTo?: string
  riskScoreMin?: number
  riskScoreMax?: number
  tags?: string[]
  dueAfter?: string
  dueBefore?: string
  limit?: number
  offset?: number
}

export interface Case {
  id: string
  organizationId: string
  status: CaseStatus
  priority?: Priority
  riskScore?: number
  [key: string]: unknown
}

export interface TimelineEvent {
  id: string
  type: string
  createdAt: string
  [key: string]: unknown
}

export interface Note {
  id?: string
  body: string
  createdAt?: string
}

export interface Evidence {
  id: string
  caseId: string
  fileName?: string
  investigationId?: string
  createdAt?: string
}
