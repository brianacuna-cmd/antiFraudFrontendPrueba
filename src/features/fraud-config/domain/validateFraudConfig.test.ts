import { describe, expect, it } from 'vitest'
import { fromFraudConfig, toFraudConfigPayload, validateFraudConfigForm } from './validateFraudConfig'

const VALID_VALUES = {
  slaLowMinutes: '1440',
  slaMediumMinutes: '480',
  slaHighMinutes: '120',
  slaCriticalMinutes: '30',
  riskThresholdLow: '40',
  riskThresholdMedium: '60',
  riskThresholdHigh: '80',
  riskThresholdCritical: '95',
  outboundWebhookUrl: '',
}

describe('validateFraudConfigForm', () => {
  it('accepts all-valid non-negative integers', () => {
    expect(validateFraudConfigForm(VALID_VALUES)).toEqual({})
  })

  it('rejects missing/empty fields', () => {
    const errors = validateFraudConfigForm({ ...VALID_VALUES, slaLowMinutes: '' })
    expect(errors.slaLowMinutes).toBeTruthy()
  })

  it('rejects negative numbers', () => {
    const errors = validateFraudConfigForm({ ...VALID_VALUES, riskThresholdLow: '-1' })
    expect(errors.riskThresholdLow).toBeTruthy()
  })

  it('rejects non-integers', () => {
    const errors = validateFraudConfigForm({ ...VALID_VALUES, riskThresholdHigh: '1.5' })
    expect(errors.riskThresholdHigh).toBeTruthy()
  })
})

describe('toFraudConfigPayload / fromFraudConfig', () => {
  it('round-trips form values to a FraudConfig payload and back', () => {
    const payload = toFraudConfigPayload(VALID_VALUES)
    expect(payload.slaLowMinutes).toBe(1440)
    expect(payload.riskThresholdCritical).toBe(95)
    const values = fromFraudConfig(payload)
    expect(values.slaLowMinutes).toBe('1440')
  })

  it('fromFraudConfig(null) returns an empty form', () => {
    const values = fromFraudConfig(null)
    expect(values.slaLowMinutes).toBe('')
  })
})
