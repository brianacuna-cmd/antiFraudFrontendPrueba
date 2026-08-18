import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { CasesListScreen } from './CasesListScreen'

function renderScreen(props?: Partial<React.ComponentProps<typeof CasesListScreen>>) {
  const { Wrapper } = createQueryWrapper()
  return render(<CasesListScreen {...props} />, { wrapper: Wrapper })
}

describe('CasesListScreen', () => {
  it('calls GET /cases with matching query params and renders items + total', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/v1/cases', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          items: [{ id: 'c1', organizationId: 'org1', status: 'OPEN', priority: 'HIGH', riskScore: 82 }],
          total: 1,
        })
      }),
    )
    renderScreen()
    expect(await screen.findByText('Total: 1')).toBeInTheDocument()
    expect(capturedUrl).toContain('limit=20')
    expect(capturedUrl).toContain('offset=0')
  })

  it('selecting a case invokes the callback', async () => {
    server.use(
      http.get('/api/v1/cases', () =>
        HttpResponse.json({ items: [{ id: 'c1', organizationId: 'org1', status: 'OPEN' }], total: 1 }),
      ),
    )
    const onSelectCase = vi.fn()
    renderScreen({ onSelectCase })
    const viewButton = await screen.findByRole('button', { name: 'View case c1' })
    await userEvent.click(viewButton)
    expect(onSelectCase).toHaveBeenCalledWith('c1')
  })

  it('shows an empty state when no cases match', async () => {
    server.use(http.get('/api/v1/cases', () => HttpResponse.json({ items: [], total: 0 })))
    renderScreen()
    expect(await screen.findByText('No cases match these filters')).toBeInTheDocument()
  })
})
