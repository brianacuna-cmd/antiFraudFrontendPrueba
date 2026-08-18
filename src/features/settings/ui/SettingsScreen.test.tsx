import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@shared/settings/settingsStore'
import { SettingsScreen } from './SettingsScreen'

const VALID = '0123456789abcdef01234567'

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({ userId: null, organizationId: null, apiBase: '/api/v1' })
  })

  it('shows validation errors on invalid submit', async () => {
    render(<SettingsScreen />)
    await userEvent.type(screen.getByLabelText('User ID'), 'not-hex')
    await userEvent.type(screen.getByLabelText('Organization ID'), 'also-not-hex')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(2)
    expect(useSettingsStore.getState().isValid()).toBe(false)
  })

  it('persists valid ids and shows success feedback', async () => {
    render(<SettingsScreen />)
    await userEvent.type(screen.getByLabelText('User ID'), VALID)
    await userEvent.type(screen.getByLabelText('Organization ID'), VALID)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByTestId('settings-saved')).toBeInTheDocument()
    expect(useSettingsStore.getState().userId).toBe(VALID)
    expect(useSettingsStore.getState().isValid()).toBe(true)
  })
})
