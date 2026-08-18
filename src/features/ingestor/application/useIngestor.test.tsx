import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import type { CanonicalRiskEvent } from '@shared/types/domain'
import { useScoreOnly, useSubmitAndOpenCase } from './useIngestor'

const EVENT: CanonicalRiskEvent = {
  provider: 'internal',
  providerEventType: 'wallet.transfer',
  caseCustomerId: 'cust-123',
  amountCents: 500000,
  currency: 'USD',
  riskSignals: { velocity24h: 9 },
  createdAt: '2026-08-18T00:00:00.000Z',
}

describe('useIngestor', () => {
  it('useSubmitAndOpenCase posts to /risk-scores/process', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', opened: true, caseId: 'c1', priority: 'HIGH' }),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSubmitAndOpenCase(), { wrapper: Wrapper })
    result.current.mutate(EVENT)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.opened).toBe(true)
  })

  it('useScoreOnly posts to /risk-scores', async () => {
    server.use(
      http.post('/api/v1/risk-scores', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', name: 'Rule 1' }),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useScoreOnly(), { wrapper: Wrapper })
    result.current.mutate(EVENT)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Rule 1')
  })
})
