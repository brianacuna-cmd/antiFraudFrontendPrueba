import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { IngestorScreen } from './IngestorScreen'

function renderScreen() {
  const { Wrapper } = createQueryWrapper()
  return render(<IngestorScreen />, { wrapper: Wrapper })
}

function setJson(json: string) {
  const textarea = screen.getByLabelText('CanonicalRiskEvent JSON')
  fireEvent.change(textarea, { target: { value: json } })
}

describe('IngestorScreen', () => {
  it('shows opened:true with score/caseId/priority on successful process', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', opened: true, caseId: 'c1', priority: 'HIGH' }),
      ),
    )
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const result = await screen.findByTestId('ingestor-result')
    expect(result).toHaveTextContent('90')
    expect(result).toHaveTextContent('c1')
    expect(result).toHaveTextContent('HIGH')
  })

  it('shows "no case opened" when opened:false', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ riskScore: 5, ruleId: 'r1', opened: false }),
      ),
    )
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText(/No case was opened/)).toBeInTheDocument()
  })

  it('score-only mode shows rule name/version without case fields', async () => {
    server.use(
      http.post('/api/v1/risk-scores', () =>
        HttpResponse.json({ riskScore: 90, ruleId: 'r1', name: 'Rule 1', conditionsVersion: 2 }),
      ),
    )
    renderScreen()
    await userEvent.selectOptions(screen.getByLabelText('Mode'), 'score-only')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const result = await screen.findByTestId('ingestor-result')
    expect(result).toHaveTextContent('Rule 1')
    expect(result).toHaveTextContent('v2')
  })

  it('blocks submission client-side on a snake_case field, naming it', async () => {
    renderScreen()
    setJson('{"provider":"internal","provider_event_type":"x"}')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.some((el) => el.textContent?.includes('provider_event_type'))).toBe(true)
  })

  it('surfaces a 400 without a partial/garbled result', async () => {
    server.use(
      http.post('/api/v1/risk-scores/process', () =>
        HttpResponse.json({ message: 'malformed payload' }, { status: 400 }),
      ),
    )
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('malformed payload')).toBeInTheDocument()
    expect(screen.queryByTestId('ingestor-result')).not.toBeInTheDocument()
  })
})
