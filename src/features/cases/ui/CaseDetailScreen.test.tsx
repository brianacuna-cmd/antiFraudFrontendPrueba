import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { CaseDetailScreen } from './CaseDetailScreen'

const CASE = {
  id: 'c1',
  organizationId: 'org1',
  status: 'OPEN',
  priority: 'HIGH',
  riskScore: 82,
  slaDueAt: '2026-08-19T00:00:00.000Z',
}

function renderScreen() {
  const { Wrapper } = createQueryWrapper()
  return render(<CaseDetailScreen caseId="c1" />, { wrapper: Wrapper })
}

describe('CaseDetailScreen', () => {
  it('shows score, priority, and SLA fields', async () => {
    server.use(
      http.get('/api/v1/cases/c1', () => HttpResponse.json(CASE)),
      http.get('/api/v1/cases/c1/timeline', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
    )
    renderScreen()
    expect(await screen.findByText('82')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('2026-08-19T00:00:00.000Z')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Agent brief' })).toBeInTheDocument()
    expect(screen.getByText(/No agent brief yet/)).toBeInTheDocument()
  })

  it('renders the stored agent brief', async () => {
    server.use(
      http.get('/api/v1/cases/c1', () =>
        HttpResponse.json({ ...CASE, agentBrief: 'Wallet looks newly created; review destination XX.' }),
      ),
      http.get('/api/v1/cases/c1/timeline', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
    )
    renderScreen()
    expect(await screen.findByText('Wallet looks newly created; review destination XX.')).toBeInTheDocument()
  })

  it('renders timeline items in the Timeline tab', async () => {
    server.use(
      http.get('/api/v1/cases/c1', () => HttpResponse.json(CASE)),
      http.get('/api/v1/cases/c1/timeline', () =>
        HttpResponse.json({
          items: [{ id: 't1', eventType: 'CASE_CREATED', createdAt: '2026-01-01T00:00:00.000Z' }],
        }),
      ),
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
    )
    renderScreen()
    await screen.findByText('82')
    expect(await screen.findByText(/CASE_CREATED/)).toBeInTheDocument()
  })

  it('shows AGENT_BRIEFING text from timeline newValue', async () => {
    server.use(
      http.get('/api/v1/cases/c1', () => HttpResponse.json({ ...CASE, agentBrief: 'brief body' })),
      http.get('/api/v1/cases/c1/timeline', () =>
        HttpResponse.json({
          items: [
            {
              id: 't2',
              eventType: 'AGENT_BRIEFING',
              newValue: 'brief body',
              createdAt: '2026-01-01T00:00:01.000Z',
            },
          ],
        }),
      ),
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
    )
    renderScreen()
    await screen.findByText('brief body')
    await userEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    expect(await screen.findByText(/AGENT_BRIEFING/)).toBeInTheDocument()
  })

  it('adds a note via the Notes tab', async () => {
    server.use(
      http.get('/api/v1/cases/c1', () => HttpResponse.json(CASE)),
      http.get('/api/v1/cases/c1/timeline', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/notes', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
      http.post('/api/v1/cases/c1/notes', async ({ request }) => HttpResponse.json(await request.json())),
    )
    renderScreen()
    await screen.findByText('82')
    await userEvent.click(screen.getByRole('tab', { name: 'Notes' }))
    await userEvent.type(screen.getByLabelText('Note'), 'Looks suspicious')
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }))
    await screen.findByRole('button', { name: 'Add note' })
  })
})
