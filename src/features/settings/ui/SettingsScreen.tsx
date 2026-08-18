import { useState } from 'react'
import { useSettingsStore } from '@shared/settings/settingsStore'
import { Button, FormField, Input } from '@shared/ui'
import { validateIdentity } from '../domain/validateIdentity'

export function SettingsScreen() {
  const { userId: storedUserId, organizationId: storedOrgId, setIdentity } = useSettingsStore()
  const [userId, setUserId] = useState(storedUserId ?? '')
  const [organizationId, setOrganizationId] = useState(storedOrgId ?? '')
  const [errors, setErrors] = useState<{ userId?: string; organizationId?: string }>({})
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateIdentity(userId, organizationId)
    setErrors(validation)
    setSaved(false)
    if (Object.keys(validation).length > 0) return

    const result = setIdentity(userId, organizationId)
    if (result.ok) {
      setSaved(true)
    } else {
      setErrors({ userId: result.error })
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Settings">
      <FormField label="User ID" htmlFor="userId" error={errors.userId}>
        <Input
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="24-char hex user id"
        />
      </FormField>
      <FormField label="Organization ID" htmlFor="organizationId" error={errors.organizationId}>
        <Input
          id="organizationId"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          placeholder="24-char hex organization id"
        />
      </FormField>
      <Button type="submit">Save</Button>
      {saved ? (
        <p role="status" data-testid="settings-saved">
          Settings saved
        </p>
      ) : null}
    </form>
  )
}
