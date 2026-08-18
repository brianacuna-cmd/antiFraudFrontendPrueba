import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { JDM_CONTENT_TYPE, type JdmGraph, type Rule } from '@shared/types/domain'
import { useActivateRule, useCreateDraftRule, useListRules } from './useRules'

const GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }
const RULE: Rule = {
  id: 'r1',
  organizationId: 'org1',
  name: 'Rule 1',
  conditions: GRAPH,
  status: 'INACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('useRules', () => {
  it('useListRules loads rules', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [RULE] })))
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useListRules(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
  })

  it('useCreateDraftRule invalidates the rules list on success', async () => {
    server.use(http.post('/api/v1/risk-scoring-rules', () => HttpResponse.json(RULE, { status: 201 })))
    const { Wrapper, queryClient } = createQueryWrapper()
    queryClient.setQueryData(['rules', 'list'], { items: [] })
    const { result } = renderHook(() => useCreateDraftRule(), { wrapper: Wrapper })
    result.current.mutate({ name: 'Rule 1', conditions: GRAPH })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryState(['rules', 'list'])?.isInvalidated).toBe(true)
  })

  it('useActivateRule transitions status to ACTIVE', async () => {
    server.use(
      http.post('/api/v1/risk-scoring-rules/r1/activate', () =>
        HttpResponse.json({ ...RULE, status: 'ACTIVE' }),
      ),
    )
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useActivateRule(), { wrapper: Wrapper })
    result.current.mutate('r1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('ACTIVE')
  })
})
