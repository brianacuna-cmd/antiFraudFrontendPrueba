import { describe, expect, it } from 'vitest'
import { validateCanonicalRiskEvent } from './validateCanonicalRiskEvent'

const VALID_EVENT = {
  provider: 'internal',
  providerEventType: 'wallet.transfer',
  caseCustomerId: 'cust-123',
  amountCents: 500000,
  currency: 'USD',
  riskSignals: { walletAgeDays: 2, velocity24h: 9 },
  createdAt: '2026-08-18T00:00:00.000Z',
}

describe('validateCanonicalRiskEvent', () => {
  it('accepts a valid canonical event', () => {
    expect(validateCanonicalRiskEvent(VALID_EVENT)).toEqual({ valid: true, errors: [] })
  })

  it('rejects a snake_case key', () => {
    const { amountCents: _drop, ...rest } = VALID_EVENT
    const payload = { ...rest, amount_cents: 500000 }
    const result = validateCanonicalRiskEvent(payload)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('amount_cents'))).toBe(true)
  })

  it('rejects an extra unknown field', () => {
    const result = validateCanonicalRiskEvent({ ...VALID_EVENT, someExtraField: 'x' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('someExtraField'))).toBe(true)
  })

  it('rejects a payload missing a required field', () => {
    const { provider: _drop, ...rest } = VALID_EVENT
    const result = validateCanonicalRiskEvent(rest)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('provider'))).toBe(true)
  })

  it('accepts optional fields', () => {
    const result = validateCanonicalRiskEvent({
      ...VALID_EVENT,
      eventId: 'evt-1',
      providerEventId: 'p-1',
      rail: 'crypto',
      rawPayload: { any: 'thing' },
    })
    expect(result.valid).toBe(true)
  })

  it('rejects a non-object payload', () => {
    expect(validateCanonicalRiskEvent('not json').valid).toBe(false)
    expect(validateCanonicalRiskEvent(null).valid).toBe(false)
  })
})
