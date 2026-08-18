import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from './test/mswServer'
import { useSettingsStore } from '@shared/settings/settingsStore'

// The real @gorules/jdm-editor renders Monaco + ReactFlow canvases that are
// not meaningfully testable in jsdom (see RuleEditorContainer.test.tsx /
// RuleDetailScreen.test.tsx for the same pattern). The router mounts these
// screens, so this global smoke test needs the same mock even though it
// never navigates into the rules detail/editor screens.
vi.mock('@gorules/jdm-editor', () => ({
  JdmConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DecisionGraph: () => <div data-testid="stub-graph" />,
  GraphSimulator: () => <div data-testid="stub-simulator" />,
}))

const { default: App } = await import('./App')

const VALID = '0123456789abcdef01234567'

describe('App smoke test', () => {
  beforeEach(() => {
    useSettingsStore.setState({ userId: null, organizationId: null, apiBase: '/api/v1' })
    window.history.pushState({}, '', '/settings')
  })

  it('gates non-settings routes until identity is set, then navigates the happy path', async () => {
    server.use(
      http.get('/api/v1/organization-fraud-config', () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
      http.get('/api/v1/risk-scoring-rules', () => HttpResponse.json({ items: [] })),
      http.get('/api/v1/cases', () => HttpResponse.json({ items: [], total: 0 })),
    )

    render(<App />)

    // Settings is reachable immediately (identity not required to reach it).
    expect(screen.getByRole('heading', { name: 'Antifraud Demo' })).toBeInTheDocument()
    expect(screen.getByLabelText('User ID')).toBeInTheDocument()

    // Other routes are gated until a valid identity is set.
    await userEvent.click(screen.getByRole('link', { name: 'Fraud Config' }))
    expect(await screen.findByText(/Set your identity/i)).toBeInTheDocument()

    // Set identity via the settings form.
    await userEvent.click(screen.getByRole('link', { name: 'Settings' }))
    await userEvent.type(screen.getByLabelText('User ID'), VALID)
    await userEvent.type(screen.getByLabelText('Organization ID'), VALID)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByTestId('settings-saved')).toBeInTheDocument()

    // Now the gated routes render their real content.
    await userEvent.click(screen.getByRole('link', { name: 'Fraud Config' }))
    expect(await screen.findByText('No fraud config yet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Rules' }))
    expect(await screen.findByText('No rules yet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Cases' }))
    expect(await screen.findByText('No cases match these filters')).toBeInTheDocument()
  })
})
