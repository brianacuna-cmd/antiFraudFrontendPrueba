import { useState } from 'react'
import { Button, ErrorBanner, FormField, Select } from '@shared/ui'
import type { CanonicalRiskEvent } from '@shared/types/domain'
import { validateCanonicalRiskEvent } from '../domain/validateCanonicalRiskEvent'
import { useScoreOnly, useSubmitAndOpenCase } from '../application/useIngestor'

const SAMPLE_EVENT = `{
  "provider": "internal",
  "providerEventType": "wallet.transfer",
  "caseCustomerId": "cust-123",
  "amountCents": 500000,
  "currency": "USD",
  "riskSignals": { "walletAgeDays": 2, "velocity24h": 9 },
  "createdAt": "2026-08-18T00:00:00.000Z"
}`

type Mode = 'process' | 'score-only'

export function IngestorScreen() {
  const [mode, setMode] = useState<Mode>('process')
  const [jsonText, setJsonText] = useState(SAMPLE_EVENT)
  const [clientErrors, setClientErrors] = useState<string[]>([])
  const processMutation = useSubmitAndOpenCase()
  const scoreMutation = useScoreOnly()

  const activeMutation = mode === 'process' ? processMutation : scoreMutation

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setClientErrors([])
    activeMutation.reset()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setClientErrors(['Payload is not valid JSON'])
      return
    }

    const validation = validateCanonicalRiskEvent(parsed)
    if (!validation.valid) {
      setClientErrors(validation.errors)
      return
    }

    const event = parsed as CanonicalRiskEvent
    if (mode === 'process') {
      processMutation.mutate(event)
    } else {
      scoreMutation.mutate(event)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} aria-label="Mini ingestor">
        <FormField label="Mode" htmlFor="mode">
          <Select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            options={[
              { value: 'process', label: 'Process (opens a case)' },
              { value: 'score-only', label: 'Score only' },
            ]}
          />
        </FormField>
        <FormField label="CanonicalRiskEvent JSON" htmlFor="event-json">
          <textarea
            id="event-json"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
          />
        </FormField>
        <Button type="submit" disabled={activeMutation.isPending}>
          Submit
        </Button>
      </form>

      {clientErrors.length > 0 ? (
        <div>
          {clientErrors.map((err) => (
            <ErrorBanner key={err} message={err} />
          ))}
        </div>
      ) : null}

      {activeMutation.isError ? <ErrorBanner message={activeMutation.error.message} /> : null}

      {activeMutation.isSuccess ? (
        <div data-testid="ingestor-result">
          <p>
            Risk score: <strong>{activeMutation.data.riskScore}</strong>
          </p>
          {mode === 'process' ? (
            activeMutation.data.opened ? (
              <p>
                Case opened: <strong>{activeMutation.data.caseId}</strong> (priority{' '}
                {activeMutation.data.priority})
              </p>
            ) : (
              <p>No case was opened — score below threshold.</p>
            )
          ) : (
            <p>
              Rule: {activeMutation.data.name} (v{activeMutation.data.conditionsVersion})
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
