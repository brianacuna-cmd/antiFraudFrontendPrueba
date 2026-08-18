import { useMutation } from '@tanstack/react-query'
import type { CanonicalRiskEvent, ScoreResult } from '@shared/types/domain'
import { processRiskEvent, scoreRiskEvent } from '../infrastructure/ingestorApi'

export function useSubmitAndOpenCase() {
  return useMutation<ScoreResult, Error, CanonicalRiskEvent>({
    mutationFn: processRiskEvent,
  })
}

export function useScoreOnly() {
  return useMutation<ScoreResult, Error, CanonicalRiskEvent>({
    mutationFn: scoreRiskEvent,
  })
}
