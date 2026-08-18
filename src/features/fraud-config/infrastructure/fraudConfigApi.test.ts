import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { NotFoundError } from '@shared/http/errors'
import { getFraudConfig, putFraudConfig } from './fraudConfigApi'

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

describe('fraudConfigApi', () => {
  it('getFraudConfig returns the config on 200', async () => {
    server.use(http.get('/api/v1/organization-fraud-config', () => HttpResponse.json(CONFIG)))
    const result = await getFraudConfig()
    expect(result).toEqual(CONFIG)
  })

  it('getFraudConfig throws NotFoundError on 404', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'ORGANIZATION_FRAUD_CONFIG_NOT_FOUND' }, { status: 404 }),
      ),
    )
    await expect(getFraudConfig()).rejects.toBeInstanceOf(NotFoundError)
  })

  it('putFraudConfig sends the payload and returns saved config', async () => {
    server.use(
      http.put('/api/v1/organization-fraud-config', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json(body)
      }),
    )
    const result = await putFraudConfig(CONFIG)
    expect(result).toEqual(CONFIG)
  })
})
