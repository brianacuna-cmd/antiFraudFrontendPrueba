import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@shared/settings/settingsStore'
import { SettingsGate } from './SettingsGate'

describe('SettingsGate', () => {
  beforeEach(() => {
    useSettingsStore.setState({ userId: null, organizationId: null, apiBase: '/api/v1' })
  })

  it('renders settings prompt when store empty', () => {
    render(
      <SettingsGate>
        <div>Protected content</div>
      </SettingsGate>,
    )
    expect(screen.getByText(/Set your identity/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when identity is valid', () => {
    useSettingsStore.getState().setIdentity('0123456789abcdef01234567', 'abcdef0123456789abcdef01')
    render(
      <SettingsGate>
        <div>Protected content</div>
      </SettingsGate>,
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
