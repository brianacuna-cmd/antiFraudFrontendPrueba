import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { JDM_CONTENT_TYPE, type JdmGraph, type Rule } from '@shared/types/domain'
import { activateRule, createDraftRule, getRuleDetail, listRules } from './rulesApi'

const GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }

const RULE: Rule = {
  id: 'r1',
  organizationId: 'org1',
  name: 'Wallet transfer risk v1',
  conditions: GRAPH,
  conditionsVersion: 1,
  status: 'INACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('rulesApi', () => {
  it('createDraftRule posts and returns an INACTIVE rule', async () => {
    server.use(http.post('/api/v1/risk-scoring-rules', () => HttpResponse.json(RULE, { status: 201 })))
    const result = await createDraftRule({ name: RULE.name, conditions: GRAPH })
    expect(result.status).toBe('INACTIVE')
  })

  it('activateRule posts to :id/activate and returns ACTIVE', async () => {
    server.use(
      http.post('/api/v1/risk-scoring-rules/r1/activate', () =>
        HttpResponse.json({ ...RULE, status: 'ACTIVE' }),
      ),
    )
    const result = await activateRule('r1')
    expect(result.status).toBe('ACTIVE')
  })

  it('listRules returns items', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [RULE] })))
    const result = await listRules()
    expect(result.items).toHaveLength(1)
  })

  it('getRuleDetail returns the full rule', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules/r1', () => HttpResponse.json(RULE)))
    const result = await getRuleDetail('r1')
    expect(result.id).toBe('r1')
  })
})
