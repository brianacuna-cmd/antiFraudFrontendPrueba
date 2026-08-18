import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { FraudConfigScreen } from './FraudConfigScreen'

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

function renderScreen() {
  const { Wrapper } = createQueryWrapper()
  return render(<FraudConfigScreen />, { wrapper: Wrapper })
}

describe('FraudConfigScreen', () => {
  it('populates the form when config exists', async () => {
    server.use(http.get('/api/v1/organization-fraud-config', () => HttpResponse.json(CONFIG)))
    renderScreen()
    expect(await screen.findByDisplayValue('1440')).toBeInTheDocument()
    expect(screen.queryByText('No fraud config yet')).not.toBeInTheDocument()
  })

  it('shows an empty form with a message on 404', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'ORGANIZATION_FRAUD_CONFIG_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderScreen()
    expect(await screen.findByText('No fraud config yet')).toBeInTheDocument()
  })

  it('blocks submit and shows field errors on invalid values', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )
    renderScreen()
    await screen.findByText('No fraud config yet')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
  })

  it('saves successfully and shows feedback', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () => HttpResponse.json(CONFIG)),
      http.put('/api/v1/organization-fraud-config', async ({ request }) =>
        HttpResponse.json(await request.json()),
      ),
    )
    renderScreen()
    await screen.findByDisplayValue('1440')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Fraud config saved')).toBeInTheDocument()
  })
})
