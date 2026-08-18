import { useEffect, useState } from 'react'
import { Button, EmptyState, ErrorBanner, FormField, Input } from '@shared/ui'
import { useLoadFraudConfig, useSaveFraudConfig } from '../application/useFraudConfig'
import {
  fromFraudConfig,
  REQUIRED_INT_FIELDS,
  toFraudConfigPayload,
  validateFraudConfigForm,
  type FraudConfigErrors,
  type FraudConfigFormValues,
} from '../domain/validateFraudConfig'

const FIELD_LABELS: Record<(typeof REQUIRED_INT_FIELDS)[number], string> = {
  slaLowMinutes: 'SLA Low (minutes)',
  slaMediumMinutes: 'SLA Medium (minutes)',
  slaHighMinutes: 'SLA High (minutes)',
  slaCriticalMinutes: 'SLA Critical (minutes)',
  riskThresholdLow: 'Risk Threshold Low',
  riskThresholdMedium: 'Risk Threshold Medium',
  riskThresholdHigh: 'Risk Threshold High',
  riskThresholdCritical: 'Risk Threshold Critical',
}

export function FraudConfigScreen() {
  const { data: config, isLoading, isError } = useLoadFraudConfig()
  const saveMutation = useSaveFraudConfig()
  const [values, setValues] = useState<FraudConfigFormValues>(fromFraudConfig(null))
  const [errors, setErrors] = useState<FraudConfigErrors>({})

  useEffect(() => {
    if (config !== undefined) {
      setValues(fromFraudConfig(config))
    }
  }, [config])

  if (isLoading) return <p>Loading…</p>
  if (isError) return <ErrorBanner message="Failed to load fraud config" />

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateFraudConfigForm(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return
    saveMutation.mutate(toFraudConfigPayload(values))
  }

  return (
    <div>
      {!config ? (
        <EmptyState
          title="No fraud config yet"
          description="Create one below — scoring will not open cases until this is saved."
        />
      ) : null}
      <form onSubmit={handleSubmit} aria-label="Fraud configuration">
        {REQUIRED_INT_FIELDS.map((field) => (
          <FormField key={field} label={FIELD_LABELS[field]} htmlFor={field} error={errors[field]}>
            <Input
              id={field}
              value={values[field]}
              onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
            />
          </FormField>
        ))}
        <Button type="submit">Save</Button>
        {saveMutation.isSuccess ? <p role="status">Fraud config saved</p> : null}
        {saveMutation.isError ? <ErrorBanner message="Failed to save fraud config" /> : null}
      </form>
    </div>
  )
}
