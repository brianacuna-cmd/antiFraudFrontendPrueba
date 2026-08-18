import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isHexId24 } from '@shared/types/ids'

export interface SetIdentityResult {
  ok: boolean
  error?: string
}

interface SettingsState {
  userId: string | null
  organizationId: string | null
  apiBase: string
  isValid: () => boolean
  setIdentity: (userId: string, organizationId: string) => SetIdentityResult
  clear: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      userId: null,
      organizationId: null,
      apiBase: (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1',
      isValid: () => {
        const { userId, organizationId } = get()
        return isHexId24(userId) && isHexId24(organizationId)
      },
      setIdentity: (userId, organizationId) => {
        if (!isHexId24(userId) || !isHexId24(organizationId)) {
          return { ok: false, error: 'userId and organizationId must be 24-character hex strings' }
        }
        set({ userId, organizationId })
        return { ok: true }
      },
      clear: () => set({ userId: null, organizationId: null }),
    }),
    { name: 'antifraud-settings' },
  ),
)
