import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'

vi.mock('@gorules/jdm-editor', () => ({
  JdmConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DecisionGraph: () => <div data-testid="readonly-graph" />,
  GraphSimulator: () => <div data-testid="stub-simulator" />,
}))

const { RuleDetailScreen } = await import('./RuleDetailScreen')

const GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }

function renderScreen(props: React.ComponentProps<typeof RuleDetailScreen>) {
  const { Wrapper } = createQueryWrapper()
  return render(<RuleDetailScreen {...props} />, { wrapper: Wrapper })
}

describe('RuleDetailScreen', () => {
  it('shows an Activate button for an INACTIVE rule and activates it', async () => {
    server.use(
      http.get('/api/v1/risk-scoring-rules/r1', () =>
        HttpResponse.json({
          id: 'r1',
          organizationId: 'org1',
          name: 'Rule 1',
          conditions: GRAPH,
          status: 'INACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
      http.post('/api/v1/risk-scoring-rules/r1/activate', () =>
        HttpResponse.json({
          id: 'r1',
          organizationId: 'org1',
          name: 'Rule 1',
          conditions: GRAPH,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
    )
    renderScreen({ ruleId: 'r1' })
    const activateButton = await screen.findByRole('button', { name: 'Activate' })
    await userEvent.click(activateButton)
    expect(await screen.findByText('ACTIVE')).toBeInTheDocument()
  })

  it('renders the graph read-only and an edit action that creates a new draft', async () => {
    server.use(
      http.get('/api/v1/risk-scoring-rules/r1', () =>
        HttpResponse.json({
          id: 'r1',
          organizationId: 'org1',
          name: 'Rule 1',
          conditions: GRAPH,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
    )
    const onEdit = vi.fn()
    renderScreen({ ruleId: 'r1', onEdit })
    expect(await screen.findByTestId('readonly-graph')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Edit \(creates new draft\)/ }))
    expect(onEdit).toHaveBeenCalledWith('r1')
  })
})
