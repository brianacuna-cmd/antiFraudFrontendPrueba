import type { ReactNode } from 'react'
import { useSettingsStore } from '@shared/settings/settingsStore'
import { EmptyState } from '@shared/ui'

export interface SettingsGateProps {
  children: ReactNode
}

/**
 * Gates its children on a valid trusted-header identity being stored.
 * Per spec settings-auth: no API-calling screen may render without valid
 * 24-char hex userId/organizationId.
 */
export function SettingsGate({ children }: SettingsGateProps) {
  const isValid = useSettingsStore((s) => s.isValid())

  if (!isValid) {
    return (
      <EmptyState
        title="Set your identity before continuing"
        description="Enter a valid organization and user ID (24-char hex) in Settings to use this app."
      />
    )
  }

  return <>{children}</>
}
