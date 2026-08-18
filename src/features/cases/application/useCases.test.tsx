import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import {
  useAddNote,
  useCaseDetail,
  useListCases,
  useResolveCase,
  useStartReview,
} from './useCases'

const CASE = { id: 'c1', organizationId: 'org1', status: 'OPEN', priority: 'HIGH', riskScore: 82 }

describe('useCases', () => {
  it('useListCases loads a filtered page', async () => {
    server.use(http.get('/api/v1/cases', () => HttpResponse.json({ items: [CASE], total: 1 })))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useListCases({ status: 'OPEN' }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(1)
  })

  it('useCaseDetail loads a single case', async () => {
    server.use(http.get('/api/v1/cases/c1', () => HttpResponse.json(CASE)))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCaseDetail('c1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.riskScore).toBe(82)
  })

  it('useAddNote invalidates only the notes query, not detail/timeline', async () => {
    server.use(
      http.post('/api/v1/cases/c1/notes', async ({ request }) => HttpResponse.json(await request.json())),
    )
    const { Wrapper, queryClient } = createQueryWrapper()
    queryClient.setQueryData(['cases', 'detail', 'c1'], CASE)
    const { result } = renderHook(() => useAddNote('c1'), { wrapper: Wrapper })
    result.current.mutate('a note')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // detail query must NOT have been marked invalidated by the notes mutation
    expect(queryClient.getQueryState(['cases', 'detail', 'c1'])?.isInvalidated).toBeFalsy()
  })

  it('useStartReview updates the case detail cache without racing a refetch', async () => {
    server.use(
      http.post('/api/v1/cases/c1/start-review', () => HttpResponse.json({ ...CASE, status: 'IN_REVIEW' })),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useStartReview('c1'), { wrapper: Wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('IN_REVIEW')
  })

  it('useResolveCase sends { reason } and updates status', async () => {
    server.use(
      http.post('/api/v1/cases/c1/resolve', async ({ request }) => {
        const body = (await request.json()) as { reason: string }
        return HttpResponse.json({ ...CASE, status: 'RESOLVED', lastReason: body.reason })
      }),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useResolveCase('c1'), { wrapper: Wrapper })
    result.current.mutate('confirmed fraud')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('RESOLVED')
  })
})
