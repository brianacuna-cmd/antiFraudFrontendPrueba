import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { RuleEditorContainer } from './RuleEditorContainer'

const EMPTY_GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }

// The real @gorules/jdm-editor renders Monaco + ReactFlow canvases which are
// not meaningfully testable in jsdom. We stub it with a controlled fixture
// so RuleEditorContainer's submit/validation wiring can be exercised, per
// tasks.md task 22 ("RTL test with a stub JDM graph fixture").
vi.mock('@gorules/jdm-editor', () => ({
  JdmConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DecisionGraph: ({ onChange }: { value: unknown; onChange: (v: unknown) => void }) => (
    <button
      data-testid="stub-graph-set-valid"
      onClick={() =>
        onChange({
          contentType: JDM_CONTENT_TYPE,
          nodes: [
            { id: 'req', type: 'inputNode' },
            {
              id: 'expr',
              type: 'expressionNode',
              content: { expressions: [{ key: 'riskScore', value: '50' }] },
            },
            { id: 'res', type: 'outputNode' },
          ],
          edges: [],
        })
      }
    >
      Set valid graph
    </button>
  ),
  GraphSimulator: () => <div data-testid="stub-simulator" />,
}))

function renderContainer(props?: Partial<React.ComponentProps<typeof RuleEditorContainer>>) {
  const { Wrapper } = createQueryWrapper()
  return render(<RuleEditorContainer {...props} />, { wrapper: Wrapper })
}

function mockCreateDraft() {
  server.use(
    http.post('/api/v1/risk-scoring-rules', () =>
      HttpResponse.json(
        {
          id: 'r1',
          organizationId: 'org1',
          name: 'My rule',
          conditions: EMPTY_GRAPH,
          status: 'INACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        { status: 201 },
      ),
    ),
  )
}

describe('RuleEditorContainer', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('blocks submit when the graph does not emit riskScore', async () => {
    renderContainer({ initialGraph: EMPTY_GRAPH })
    await userEvent.type(screen.getByLabelText('Rule name'), 'My rule')
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/riskScore|empty/i)
  })

  it('submits a valid graph as a new draft rule', async () => {
    const emptyGraph: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }
    server.use(
      http.post('/api/v1/risk-scoring-rules', () =>
        HttpResponse.json(
          {
            id: 'r1',
            organizationId: 'org1',
            name: 'My rule',
            conditions: emptyGraph,
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          { status: 201 },
        ),
      ),
    )
    const onCreated = vi.fn()
    renderContainer({ onCreated })
    await userEvent.type(screen.getByLabelText('Rule name'), 'My rule')
    await userEvent.click(await screen.findByTestId('stub-graph-set-valid'))
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }))
    await screen.findByRole('button', { name: 'Save as draft' })
    expect(onCreated).toHaveBeenCalledWith('r1')
  })

  it('restores name and imported graph after remount (reload)', async () => {
    mockCreateDraft()
    const { unmount } = renderContainer({ draftKey: 'new', initialGraph: EMPTY_GRAPH })
    await userEvent.type(screen.getByLabelText('Rule name'), 'Imported demo')
    await userEvent.click(await screen.findByTestId('stub-graph-set-valid'))
    unmount()

    const onCreated = vi.fn()
    renderContainer({ draftKey: 'new', initialGraph: EMPTY_GRAPH, onCreated })
    expect(screen.getByLabelText('Rule name')).toHaveValue('Imported demo')
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }))
    await screen.findByRole('button', { name: 'Save as draft' })
    expect(onCreated).toHaveBeenCalledWith('r1')
  })
})
