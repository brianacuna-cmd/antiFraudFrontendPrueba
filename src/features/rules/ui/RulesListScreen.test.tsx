import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { JDM_CONTENT_TYPE, type JdmGraph, type Rule } from '@shared/types/domain'
import { RulesListScreen } from './RulesListScreen'

const GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }
const RULE: Rule = {
  id: 'r1',
  organizationId: 'org1',
  name: 'Rule 1',
  conditions: GRAPH,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderScreen(props?: Partial<React.ComponentProps<typeof RulesListScreen>>) {
  const { Wrapper } = createQueryWrapper()
  return render(<RulesListScreen {...props} />, { wrapper: Wrapper })
}

describe('RulesListScreen', () => {
  it('shows an empty state when no rules exist', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [] })))
    renderScreen()
    expect(await screen.findByText('No rules yet')).toBeInTheDocument()
  })

  it('offers a create action from the empty state', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [] })))
    const onCreate = vi.fn()
    renderScreen({ onCreate })
    await userEvent.click(await screen.findByRole('button', { name: 'New rule' }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('lists rules with name and status, and selects one', async () => {
    server.use(http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [RULE] })))
    const onSelectRule = vi.fn()
    renderScreen({ onSelectRule })
    const nameButton = await screen.findByRole('button', { name: 'View Rule 1' })
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    await userEvent.click(nameButton)
    expect(onSelectRule).toHaveBeenCalledWith('r1')
  })
})
