import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from './settingsStore'

const VALID_USER_ID = '0123456789abcdef01234567'
const VALID_ORG_ID = 'abcdef0123456789abcdef01'

describe('settingsStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSettingsStore.setState({ userId: null, organizationId: null, apiBase: '/api/v1' })
  })

  it('starts empty/invalid', () => {
    expect(useSettingsStore.getState().isValid()).toBe(false)
  })

  it('rejects non-hex24 ids', () => {
    const result = useSettingsStore.getState().setIdentity('not-hex', VALID_ORG_ID)
    expect(result.ok).toBe(false)
    expect(useSettingsStore.getState().isValid()).toBe(false)
  })

  it('accepts and persists valid hex24 ids', () => {
    const result = useSettingsStore.getState().setIdentity(VALID_USER_ID, VALID_ORG_ID)
    expect(result.ok).toBe(true)
    expect(useSettingsStore.getState().isValid()).toBe(true)
    expect(useSettingsStore.getState().userId).toBe(VALID_USER_ID)
    expect(useSettingsStore.getState().organizationId).toBe(VALID_ORG_ID)
  })

  it('persists to localStorage under a known key', () => {
    useSettingsStore.getState().setIdentity(VALID_USER_ID, VALID_ORG_ID)
    const raw = window.localStorage.getItem('antifraud-settings')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw as string).state.userId).toBe(VALID_USER_ID)
  })

  it('clear() resets identity', () => {
    useSettingsStore.getState().setIdentity(VALID_USER_ID, VALID_ORG_ID)
    useSettingsStore.getState().clear()
    expect(useSettingsStore.getState().isValid()).toBe(false)
  })
})
