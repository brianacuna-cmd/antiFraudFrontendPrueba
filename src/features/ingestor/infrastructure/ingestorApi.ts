import { httpClient } from '@shared/http/httpClient'
import type { CanonicalRiskEvent, ScoreResult } from '@shared/types/domain'

export function processRiskEvent(event: CanonicalRiskEvent): Promise<ScoreResult> {
  return httpClient.post<ScoreResult>('/risk-scores/process', event)
}

export function scoreRiskEvent(event: CanonicalRiskEvent): Promise<ScoreResult> {
  return httpClient.post<ScoreResult>('/risk-scores', event)
}
