import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { useLoadFraudConfig, useSaveFraudConfig } from './useFraudConfig'

const CONFIG = {
  slaLowMinutes: 1440,
  slaMediumMinutes: 480,
  slaHighMinutes: 120,
  slaCriticalMinutes: 30,
  riskThresholdLow: 40,
  riskThresholdMedium: 60,
  riskThresholdHigh: 80,
  riskThresholdCritical: 95,
}

describe('useLoadFraudConfig', () => {
  it('loads config successfully', async () => {
    server.use(http.get('/api/v1/organization-fraud-config', () => HttpResponse.json(CONFIG)))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useLoadFraudConfig(), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(CONFIG)
  })

  it('resolves to null (not an error) on 404', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useLoadFraudConfig(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('surfaces non-404 errors', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useLoadFraudConfig(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSaveFraudConfig', () => {
  it('saves and returns success', async () => {
    server.use(
      http.put('/api/v1/organization-fraud-config', async ({ request }) =>
        HttpResponse.json(await request.json()),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSaveFraudConfig(), { wrapper: Wrapper })
    result.current.mutate(CONFIG)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(CONFIG)
  })
})
