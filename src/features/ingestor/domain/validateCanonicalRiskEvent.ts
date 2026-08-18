import {
  CANONICAL_RISK_EVENT_OPTIONAL_KEYS,
  CANONICAL_RISK_EVENT_REQUIRED_KEYS,
} from '@shared/types/domain'

const ALLOWED_KEYS = new Set<string>([
  ...CANONICAL_RISK_EVENT_REQUIRED_KEYS,
  ...CANONICAL_RISK_EVENT_OPTIONAL_KEYS,
])

export interface CanonicalRiskEventValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Client-side strict validation mirroring the backend's `.strict()` Zod
 * schema for CanonicalRiskEvent: rejects unknown/snake_case keys and
 * missing required fields, fail-closed before any network call.
 */
export function validateCanonicalRiskEvent(payload: unknown): CanonicalRiskEventValidationResult {
  const errors: string[] = []

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { valid: false, errors: ['Payload must be a JSON object'] }
  }

  const keys = Object.keys(payload as Record<string, unknown>)

  for (const key of keys) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`Unexpected field: "${key}"`)
    }
  }

  for (const required of CANONICAL_RISK_EVENT_REQUIRED_KEYS) {
    if (!(required in (payload as Record<string, unknown>))) {
      errors.push(`Missing required field: "${required}"`)
    }
  }

  const p = payload as Record<string, unknown>
  if ('amountCents' in p && typeof p.amountCents !== 'number') {
    errors.push('"amountCents" must be a number')
  }
  if ('riskSignals' in p && (typeof p.riskSignals !== 'object' || p.riskSignals === null)) {
    errors.push('"riskSignals" must be an object')
  }

  return { valid: errors.length === 0, errors }
}
