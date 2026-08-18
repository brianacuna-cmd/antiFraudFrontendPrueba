import type { FraudConfig } from '@shared/types/domain'

export const REQUIRED_INT_FIELDS = [
  'slaLowMinutes',
  'slaMediumMinutes',
  'slaHighMinutes',
  'slaCriticalMinutes',
  'riskThresholdLow',
  'riskThresholdMedium',
  'riskThresholdHigh',
  'riskThresholdCritical',
] as const

export type FraudConfigFormValues = Record<(typeof REQUIRED_INT_FIELDS)[number], string> & {
  outboundWebhookUrl?: string
}

export type FraudConfigErrors = Partial<Record<(typeof REQUIRED_INT_FIELDS)[number], string>>

function isNonNegativeInteger(value: string): boolean {
  if (value.trim() === '') return false
  const n = Number(value)
  return Number.isInteger(n) && n >= 0
}

export function validateFraudConfigForm(values: FraudConfigFormValues): FraudConfigErrors {
  const errors: FraudConfigErrors = {}
  for (const field of REQUIRED_INT_FIELDS) {
    if (!isNonNegativeInteger(values[field])) {
      errors[field] = 'Must be an integer >= 0'
    }
  }
  return errors
}

export function toFraudConfigPayload(values: FraudConfigFormValues): FraudConfig {
  const numeric: Record<string, number> = {}
  for (const field of REQUIRED_INT_FIELDS) {
    numeric[field] = Number(values[field])
  }
  const payload = numeric as unknown as FraudConfig
  if (values.outboundWebhookUrl) {
    payload.outboundWebhookUrl = values.outboundWebhookUrl
  }
  return payload
}

export function fromFraudConfig(config: FraudConfig | null): FraudConfigFormValues {
  if (!config) {
    return {
      slaLowMinutes: '',
      slaMediumMinutes: '',
      slaHighMinutes: '',
      slaCriticalMinutes: '',
      riskThresholdLow: '',
      riskThresholdMedium: '',
      riskThresholdHigh: '',
      riskThresholdCritical: '',
      outboundWebhookUrl: '',
    }
  }
  return {
    slaLowMinutes: String(config.slaLowMinutes),
    slaMediumMinutes: String(config.slaMediumMinutes),
    slaHighMinutes: String(config.slaHighMinutes),
    slaCriticalMinutes: String(config.slaCriticalMinutes),
    riskThresholdLow: String(config.riskThresholdLow),
    riskThresholdMedium: String(config.riskThresholdMedium),
    riskThresholdHigh: String(config.riskThresholdHigh),
    riskThresholdCritical: String(config.riskThresholdCritical),
    outboundWebhookUrl: config.outboundWebhookUrl ?? '',
  }
}
