import { httpClient } from '@shared/http/httpClient'
import type { JdmGraph, Rule } from '@shared/types/domain'

export interface CreateDraftRuleInput {
  name: string
  conditions: JdmGraph
  conditionsVersion?: number
}

export function createDraftRule(input: CreateDraftRuleInput): Promise<Rule> {
  return httpClient.post<Rule>('/risk-scoring-rules', input)
}

export function activateRule(id: string): Promise<Rule> {
  return httpClient.post<Rule>(`/risk-scoring-rules/${id}/activate`)
}

export function listRules(): Promise<{ items: Rule[] }> {
  return httpClient.get<{ items: Rule[] }>('/risk-scoring-rules')
}

export function getRuleDetail(id: string): Promise<Rule> {
  return httpClient.get<Rule>(`/risk-scoring-rules/${id}`)
}
