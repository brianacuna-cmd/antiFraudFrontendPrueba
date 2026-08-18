import { httpClient } from '@shared/http/httpClient'
import type { FraudConfig } from '@shared/types/domain'

export function getFraudConfig(): Promise<FraudConfig> {
  return httpClient.get<FraudConfig>('/organization-fraud-config')
}

export function putFraudConfig(config: FraudConfig): Promise<FraudConfig> {
  return httpClient.put<FraudConfig>('/organization-fraud-config', config)
}
