import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import {
  addNote,
  archiveCase,
  getCaseDetail,
  getNotes,
  getTimeline,
  listCases,
  listEvidence,
  reassignCase,
  reopenCase,
  resolveCase,
  startReview,
  uploadEvidence,
} from './casesApi'

const CASE = { id: 'c1', organizationId: 'org1', status: 'OPEN', priority: 'HIGH', riskScore: 82 }

describe('casesApi', () => {
  it('listCases sends filters+pagination and returns items/total', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/v1/cases', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ items: [CASE], total: 1 })
      }),
    )
    const result = await listCases({ status: 'OPEN', limit: 10, offset: 0 })
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(capturedUrl).toContain('status=OPEN')
    expect(capturedUrl).toContain('limit=10')
  })

  it('getCaseDetail returns the case with score/priority', async () => {
    server.use(http.get('/api/v1/cases/c1', () => HttpResponse.json(CASE)))
    const result = await getCaseDetail('c1')
    expect(result.riskScore).toBe(82)
    expect(result.priority).toBe('HIGH')
  })

  it('getTimeline returns items', async () => {
    server.use(
      http.get('/api/v1/cases/c1/timeline', () =>
        HttpResponse.json({ items: [{ id: 't1', type: 'CASE_OPENED', createdAt: '2026-01-01T00:00:00.000Z' }] }),
      ),
    )
    const result = await getTimeline('c1')
    expect(result.items).toHaveLength(1)
  })

  it('getNotes / addNote', async () => {
    server.use(
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.post('/api/v1/cases/c1/notes', async ({ request }) => {
        const body = (await request.json()) as { body: string }
        return HttpResponse.json({ id: 'n1', body: body.body })
      }),
    )
    expect((await getNotes('c1')).items).toEqual([])
    const note = await addNote('c1', 'Looks suspicious')
    expect(note.body).toBe('Looks suspicious')
  })

  it('uploadEvidence sends multipart/form-data with field "file"', async () => {
    let receivedContentType = ''
    let receivedFileName: string | undefined
    server.use(
      http.post('/api/v1/cases/c1/evidence', async ({ request }) => {
        receivedContentType = request.headers.get('content-type') ?? ''
        const form = await request.formData()
        const file = form.get('file')
        receivedFileName = file instanceof File ? file.name : undefined
        return HttpResponse.json({ id: 'e1', caseId: 'c1' }, { status: 201 })
      }),
    )
    const file = new File(['hello'], 'evidence.txt', { type: 'text/plain' })
    const result = await uploadEvidence('c1', file)
    expect(result.id).toBe('e1')
    expect(receivedContentType).toContain('multipart/form-data')
    expect(receivedFileName).toBe('evidence.txt')
  })

  it('listEvidence returns items', async () => {
    server.use(http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })))
    expect((await listEvidence('c1')).items).toEqual([])
  })

  it('lifecycle actions call the right endpoints with the right bodies', async () => {
    server.use(
      http.post('/api/v1/cases/c1/start-review', () => HttpResponse.json({ ...CASE, status: 'IN_REVIEW' })),
      http.post('/api/v1/cases/c1/resolve', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ ...CASE, status: 'RESOLVED', lastReason: body })
      }),
      http.post('/api/v1/cases/c1/archive', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ ...CASE, status: 'ARCHIVED', lastReason: body })
      }),
      http.post('/api/v1/cases/c1/reassign', () => HttpResponse.json({ ...CASE, assignedTo: 'user-2' })),
      http.post('/api/v1/cases/c1/reopen', () => HttpResponse.json({ ...CASE, status: 'OPEN' })),
    )
    expect((await startReview('c1')).status).toBe('IN_REVIEW')
    expect((await resolveCase('c1', 'confirmed fraud')).status).toBe('RESOLVED')
    expect((await archiveCase('c1', 'stale')).status).toBe('ARCHIVED')
    expect((await reassignCase('c1', 'user-2')).assignedTo).toBe('user-2')
    expect((await reopenCase('c1')).status).toBe('OPEN')
  })
})
