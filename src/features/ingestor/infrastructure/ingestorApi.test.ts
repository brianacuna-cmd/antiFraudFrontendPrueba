import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { ValidationError } from '@shared/http/errors'
import type { CanonicalRiskEvent } from '@shared/types/domain'
import { processRiskEvent, scoreRiskEvent } from './ingestorApi'

const EVENT: CanonicalRiskEvent = {
  provider: 'internal',
  providerEventType: 'wallet.transfer',
  caseCustomerId: 'cust-123',
  amountCents: 500000,
  currency: 'USD',
  riskSignals: { velocity24h: 9 },
  createdAt: '2026-08-18T00:00:00.000Z',
}

describe('ingestorApi', () => {
  it('processRiskEvent returns opened:true with a caseId', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', conditionsVersion: 1, opened: true, caseId: 'c1', priority: 'HIGH' }),
      ),
    )
    const result = await processRiskEvent(EVENT)
    expect(result.opened).toBe(true)
    expect(result.caseId).toBe('c1')
  })

  it('processRiskEvent returns opened:false without a caseId when below threshold', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ riskScore: 5, ruleId: 'r1', conditionsVersion: 1, opened: false }),
      ),
    )
    const result = await processRiskEvent(EVENT)
    expect(result.opened).toBe(false)
    expect(result.caseId).toBeUndefined()
  })

  it('scoreRiskEvent (score-only) returns score fields without case fields', async () => {
    server.use(
      http.post('/api/v1/risk-scores', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', name: 'Rule 1', conditionsVersion: 1 }),
      ),
    )
    const result = await scoreRiskEvent(EVENT)
    expect(result.riskScore).toBe(90)
    expect(result.name).toBe('Rule 1')
    expect(result.opened).toBeUndefined()
  })

  it('surfaces 400 for malformed payload as ValidationError', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ message: 'snake_case field' }, { status: 400 }),
      ),
    )
    await expect(processRiskEvent(EVENT)).rejects.toBeInstanceOf(ValidationError)
  })
})
