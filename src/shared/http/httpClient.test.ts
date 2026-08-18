import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../test/mswServer'
import { useSettingsStore } from '@shared/settings/settingsStore'
import { httpClient } from './httpClient'
import { AuthError, NotFoundError, ValidationError } from './errors'

const USER_ID = '0123456789abcdef01234567'
const ORG_ID = 'abcdef0123456789abcdef01'

describe('httpClient', () => {
  beforeEach(() => {
    useSettingsStore.setState({ userId: USER_ID, organizationId: ORG_ID, apiBase: '/api/v1' })
  })

  it('injects trusted-header auth on every request', async () => {
    let receivedHeaders: Headers | undefined
    server.use(
      http.get('/api/v1/organization-fraud-config', ({ request }) => {
        receivedHeaders = request.headers
        return HttpResponse.json({ ok: true })
      }),
    )
    await httpClient.get('/organization-fraud-config')
    expect(receivedHeaders?.get('x-actor-user-id')).toBe(USER_ID)
    expect(receivedHeaders?.get('x-actor-organization-id')).toBe(ORG_ID)
  })

  it('maps 401 to AuthError', async () => {
    server.use(
      http.get('/api/v1/cases', () => HttpResponse.json({ message: 'unauthorized' }, { status: 401 })),
    )
    await expect(httpClient.get('/cases')).rejects.toBeInstanceOf(AuthError)
  })

  it('maps 400 to ValidationError', async () => {
    server.use(
      http.post('/api/v1/risk-scores', () =>
        HttpResponse.json({ message: 'bad payload' }, { status: 400 }),
      ),
    )
    await expect(httpClient.post('/risk-scores', {})).rejects.toBeInstanceOf(ValidationError)
  })

  it('maps 404 to NotFoundError', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )
    await expect(httpClient.get('/organization-fraud-config')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns parsed JSON on success', async () => {
    server.use(
      http.get('/api/v1/cases', () => HttpResponse.json({ items: [], total: 0 })),
    )
    const result = await httpClient.get<{ items: unknown[]; total: number }>('/cases')
    expect(result).toEqual({ items: [], total: 0 })
  })
})
